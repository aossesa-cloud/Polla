import React, { useState, useMemo } from 'react'
import api from '../api'
import useAppStore from '../store/useAppStore'
import {
  getParticipantGroupIds,
  isParticipantInGroup,
  withParticipantGroup,
  withoutParticipantGroup,
} from '../services/participantGroups'
import styles from './Groups.module.css'

export default function Groups() {
  const { appData, refresh } = useAppStore()
  const [grupoActivo, setGrupoActivo] = useState(null)
  const [editando, setEditando] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [modalAddOpen, setModalAddOpen] = useState(false)
  const [modalAddMode, setModalAddMode] = useState('single') // 'single' | 'bulk'
  const [newName, setNewName] = useState('')
  const [bulkNames, setBulkNames] = useState('')
  const [editMemberOpen, setEditMemberOpen] = useState(false)
  const [editingMember, setEditingMember] = useState(null)
  const [editingGroupId, setEditingGroupId] = useState(null)
  const [editDiaria, setEditDiaria] = useState(false)
  const [editSemanal, setEditSemanal] = useState(false)
  const [editMensual, setEditMensual] = useState(false)
  const [editPromo, setEditPromo] = useState(false)
  const [editPromoPartner, setEditPromoPartner] = useState('')
  const [editGroupName, setEditGroupName] = useState('')
  const [editGroupDesc, setEditGroupDesc] = useState('')
  const [guardando, setGuardando] = useState(false)

  const grupos = appData?.settings?.registryGroups || []
  const registry = appData?.registry || []

  // Auto-select first group
  React.useEffect(() => {
    if (grupos.length > 0 && !grupoActivo) {
      setGrupoActivo(grupos[0].id)
    }
  }, [grupos, grupoActivo])

  const grupoActual = grupos.find(g => g.id === grupoActivo)
  const miembrosFiltrados = useMemo(() => {
    const miembros = registry.filter(r => isParticipantInGroup(r, grupoActivo))
    if (!busqueda) return miembros
    const q = busqueda.toLowerCase()
    return miembros.filter(m => m.name.toLowerCase().includes(q))
  }, [registry, grupoActivo, busqueda])
  const promoPartnerOptions = useMemo(() => {
    if (!editingMember) return []
    const currentPartner = getPrimaryPromoPartner(editingMember)
    const currentPartnerKey = normalizeName(currentPartner)
    const currentMemberKey = normalizeName(editingMember.name)

    return registry
      .filter((member) => {
        const memberKey = normalizeName(member.name)
        if (!memberKey || memberKey === currentMemberKey) return false
        if (!isParticipantInGroup(member, grupoActivo)) return false
        return member.promo === true || memberKey === currentPartnerKey
      })
      .sort((a, b) => a.name.localeCompare(b.name, 'es'))
  }, [editingMember, grupoActivo, registry])

  // ===== GROUP CRUD =====
  const handleSaveGrupo = async () => {
    if (!editGroupName.trim()) return
    setGuardando(true)
    try {
      const existing = grupos.find((group) => group.id === editingGroupId) || null
      if (existing) {
        await api.upsertRegistryGroup({
          id: existing.id,
          name: editGroupName.trim(),
          description: editGroupDesc.trim(),
          enabled: true
        })
      } else {
        const newGroupId = `group-${Date.now()}`
        await api.upsertRegistryGroup({
          id: newGroupId,
          name: editGroupName.trim(),
          description: editGroupDesc.trim(),
          enabled: true
        })
        setGrupoActivo(newGroupId)
      }
      setEditando(false)
      setEditingGroupId(null)
      setEditGroupName('')
      setEditGroupDesc('')
      await refresh()
    } catch (err) {
      alert('Error: ' + err.message)
    } finally {
      setGuardando(false)
    }
  }

  const handleDeleteGrupo = async (group = grupoActual) => {
    if (!group) return
    if (!confirm(`¿Eliminar el grupo "${group.name}"? Los participantes quedarán sin grupo.`)) return
    try {
      await api.deleteRegistryGroup(group.id)
      setGrupoActivo(grupos.length > 1 ? grupos.find(g => g.id !== group.id)?.id || null : null)
      await refresh()
    } catch (err) {
      alert('Error: ' + err.message)
    }
  }

  const openCreateGroup = () => {
    setEditingGroupId(null)
    setEditGroupName('')
    setEditGroupDesc('')
    setEditando(true)
  }

  const openEditGroup = (group = grupoActual) => {
    if (!group) return
    setEditingGroupId(group.id)
    setEditGroupName(group.name)
    setEditGroupDesc(group.description || '')
    setEditando(true)
  }

  // ===== ADD PARTICIPANTS =====
  const openAddModal = (mode) => {
    setModalAddMode(mode)
    setNewName('')
    setBulkNames('')
    setModalAddOpen(true)
  }

  const handleAddSingle = async () => {
    if (!newName.trim() || !grupoActivo) return
    setGuardando(true)
    try {
      const existing = findRegistryParticipant(registry, newName.trim())
      const nextMember = withParticipantGroup(existing, grupoActivo)
      await api.upsertRegistryParticipant({
        ...nextMember,
        name: newName.trim(),
        group: nextMember.group || grupoActivo,
        diaria: Boolean(existing?.diaria),
        semanal: Boolean(existing?.semanal),
        mensual: Boolean(existing?.mensual),
      })
      setModalAddOpen(false)
      setNewName('')
      refresh()
    } catch (err) {
      alert('Error: ' + err.message)
    } finally {
      setGuardando(false)
    }
  }

  const handleAddBulk = async () => {
    if (!bulkNames.trim() || !grupoActivo) return
    setGuardando(true)
    try {
      const names = bulkNames.split('\n').map(n => n.trim()).filter(Boolean)
      for (const name of names) {
        const existing = findRegistryParticipant(registry, name)
        const nextMember = withParticipantGroup(existing, grupoActivo)
        await api.upsertRegistryParticipant({
          ...nextMember,
          name,
          group: nextMember.group || grupoActivo,
          diaria: Boolean(existing?.diaria),
          semanal: Boolean(existing?.semanal),
          mensual: Boolean(existing?.mensual),
        })
      }
      setModalAddOpen(false)
      setBulkNames('')
      refresh()
    } catch (err) {
      alert('Error: ' + err.message)
    } finally {
      setGuardando(false)
    }
  }

  // ===== REMOVE PARTICIPANTS =====
  const handleRemoveMember = async (name) => {
    if (!confirm(`¿Eliminar a "${name}" del grupo?`)) return
    try {
      const member = findRegistryParticipant(registry, name)
      if (!member) return
      await saveRegistryParticipant(withoutParticipantGroup(member, grupoActivo), { replaceGroups: true })
      refresh()
    } catch (err) {
      alert('Error: ' + err.message)
    }
  }

  const handleRemoveBulk = async () => {
    if (!busqueda) return
    if (!confirm(`¿Eliminar los ${miembrosFiltrados.length} participantes filtrados del grupo?`)) return
    setGuardando(true)
    try {
      const names = miembrosFiltrados.map(m => m.name)
      for (const name of names) {
        const member = findRegistryParticipant(registry, name)
        if (!member) continue
        await saveRegistryParticipant(withoutParticipantGroup(member, grupoActivo), { replaceGroups: true })
      }
      setBusqueda('')
      refresh()
    } catch (err) {
      alert('Error: ' + err.message)
    } finally {
      setGuardando(false)
    }
  }

  // ===== EDIT MEMBER MODALITIES =====
  const openEditMember = (member) => {
    const currentPromoPartner = getPrimaryPromoPartner(member)
    setEditingMember(member)
    setEditDiaria(member.diaria || false)
    setEditSemanal(member.semanal || false)
    setEditMensual(member.mensual || false)
    setEditPromo(member.promo || Boolean(currentPromoPartner))
    setEditPromoPartner(currentPromoPartner)
    setEditMemberOpen(true)
  }

  const handleSaveMember = async () => {
    if (!editingMember) return
    setGuardando(true)

    try {
      const selectedPartnerName = editPromo && editPromoPartner ? editPromoPartner : ''
      const previousPartners = getPromoPartners(editingMember)
      const selectedPartner = findRegistryParticipant(registry, selectedPartnerName)
      const selectedPartnerPreviousPartners = selectedPartner
        ? getPromoPartners(selectedPartner).filter((name) => !sameName(name, editingMember.name))
        : []

      await saveRegistryParticipant({
        ...editingMember,
        diaria: editDiaria,
        semanal: editSemanal,
        mensual: editMensual,
        promo: editPromo,
        promoPartners: selectedPartnerName ? [selectedPartnerName] : [],
      })

      const impactedPartnerNames = uniqueNames([
        ...previousPartners,
        selectedPartnerName,
        ...selectedPartnerPreviousPartners,
      ]).filter((name) => !sameName(name, editingMember.name))

      for (const partnerName of impactedPartnerNames) {
        const partner = findRegistryParticipant(registry, partnerName)
        if (!partner) continue

        const nextPartnerLinks = sameName(partner.name, selectedPartnerName)
          ? [editingMember.name]
          : getPromoPartners(partner).filter((name) => (
              !sameName(name, editingMember.name) &&
              !sameName(name, selectedPartnerName)
            ))

        await saveRegistryParticipant({
          ...partner,
          promo: sameName(partner.name, selectedPartnerName) ? true : partner.promo,
          promoPartners: nextPartnerLinks,
        })
      }

      setEditMemberOpen(false)
      setEditingMember(null)
      setEditPromoPartner('')
      await refresh()
    } catch (err) {
      alert('Error: ' + err.message)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className={styles.groups}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Grupos</h1>
          <p className={styles.subtitle}>Organiza participantes en grupos de trabajo</p>
        </div>
        <button className={styles.newBtn} onClick={openCreateGroup}>
          + Nuevo Grupo
        </button>
      </header>

      {/* Edit Group Modal */}
      {editando && (
        <div className={styles.modalOverlay} onClick={() => setEditando(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h3 className={styles.formTitle}>{editingGroupId ? 'Editar Grupo' : 'Nuevo Grupo'}</h3>
            <div className={styles.formRow}>
              <label className={styles.formLabel}>Nombre</label>
              <input className={styles.formInput} value={editGroupName} onChange={(e) => setEditGroupName(e.target.value)} placeholder="Ej: Grupo Invitados" autoFocus />
            </div>
            <div className={styles.formRow}>
              <label className={styles.formLabel}>Descripción</label>
              <input className={styles.formInput} value={editGroupDesc} onChange={(e) => setEditGroupDesc(e.target.value)} placeholder="Descripción del grupo" />
            </div>
            <div className={styles.formActions}>
              <button className={styles.saveBtn} onClick={handleSaveGrupo} disabled={guardando || !editGroupName.trim()}>
                {guardando ? 'Guardando...' : 'Guardar'}
              </button>
              <button className={styles.cancelBtn} onClick={() => setEditando(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Participants Modal */}
      {modalAddOpen && (
        <div className={styles.modalOverlay} onClick={() => setModalAddOpen(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h3 className={styles.formTitle}>
              {modalAddMode === 'single' ? 'Agregar Participante' : 'Carga Masiva'}
            </h3>
            {modalAddMode === 'single' ? (
              <div className={styles.formRow}>
                <label className={styles.formLabel}>Nombre del participante</label>
                <input className={styles.formInput} value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Ej: AGUSTIN" autoFocus />
              </div>
            ) : (
              <div className={styles.formRow}>
                <label className={styles.formLabel}>Nombres (uno por línea)</label>
                <textarea className={styles.formTextarea} value={bulkNames} onChange={(e) => setBulkNames(e.target.value)} placeholder="AGUSTIN&#10;ALF&#10;BILZ" rows={6} autoFocus />
              </div>
            )}
            <div className={styles.formActions}>
              <button className={styles.saveBtn} onClick={modalAddMode === 'single' ? handleAddSingle : handleAddBulk} disabled={guardando || !(modalAddMode === 'single' ? newName.trim() : bulkNames.trim())}>
                {guardando ? 'Guardando...' : (modalAddMode === 'single' ? 'Agregar' : 'Agregar Todos')}
              </button>
              <button className={styles.cancelBtn} onClick={() => setModalAddOpen(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Member Modalities Modal */}
      {editMemberOpen && editingMember && (
        <div className={styles.modalOverlay} onClick={() => setEditMemberOpen(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h3 className={styles.formTitle}>Editar: {editingMember.name}</h3>
            <div className={styles.modalityGrid}>
              <label className={styles.modalityCheck}>
                <input type="checkbox" checked={editDiaria} onChange={(e) => setEditDiaria(e.target.checked)} />
                <span className={styles.modalityBadge}>D</span>
                <span className={styles.modalityLabel}>Diaria</span>
              </label>
              <label className={styles.modalityCheck}>
                <input type="checkbox" checked={editSemanal} onChange={(e) => setEditSemanal(e.target.checked)} />
                <span className={styles.modalityBadge}>S</span>
                <span className={styles.modalityLabel}>Semanal</span>
              </label>
              <label className={styles.modalityCheck}>
                <input type="checkbox" checked={editMensual} onChange={(e) => setEditMensual(e.target.checked)} />
                <span className={styles.modalityBadge}>M</span>
                <span className={styles.modalityLabel}>Mensual</span>
              </label>
              <label className={styles.modalityCheck}>
                <input type="checkbox" checked={editPromo} onChange={(e) => setEditPromo(e.target.checked)} />
                <span className={`${styles.modalityBadge} ${styles.promo}`}>P</span>
                <span className={styles.modalityLabel}>Promo 2x</span>
              </label>
            </div>
            <div className={styles.formRow}>
              <label className={styles.formLabel}>Dupla habitual Promo 2x</label>
              <select
                className={styles.formInput}
                value={editPromoPartner}
                onChange={(e) => setEditPromoPartner(e.target.value)}
                disabled={!editPromo}
              >
                <option value="">Sin dupla habitual</option>
                {promoPartnerOptions.map((member) => (
                  <option key={member.name} value={member.name}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>
            <p className={styles.hint}>Marca las modalidades en las que participa este stud. "Promo 2x" indica que entra con 2 studs cuando la campaña tiene promo activada.</p>
            <div className={styles.formActions}>
              <button className={styles.saveBtn} onClick={handleSaveMember} disabled={guardando}>
                {guardando ? 'Guardando...' : 'Guardar'}
              </button>
              <button className={styles.cancelBtn} onClick={() => setEditMemberOpen(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      <div className={styles.layout}>
        {/* Sidebar - Groups List */}
        <div className={styles.sidebar}>
          <h3 className={styles.sidebarTitle}>{grupos.length} Grupo{grupos.length !== 1 ? 's' : ''}</h3>
          {grupos.map(g => (
            <div key={g.id} className={`${styles.grupoWrapper} ${grupoActivo === g.id ? styles.active : ''}`}>
              <button
                className={styles.grupoBtn}
                onClick={() => setGrupoActivo(g.id)}
              >
                <span className={styles.grupoNombre}>{g.name}</span>
                <span className={styles.grupoCount}>{registry.filter(r => isParticipantInGroup(r, g.id)).length}</span>
              </button>
              <div className={styles.grupoActions}>
                <button className={styles.iconBtn} onClick={(e) => { e.stopPropagation(); setGrupoActivo(g.id); openEditGroup(g); }} title="Editar grupo">✏️</button>
                <button className={styles.iconBtn} onClick={(e) => { e.stopPropagation(); setGrupoActivo(g.id); handleDeleteGrupo(g); }} title="Eliminar grupo">🗑️</button>
              </div>
            </div>
          ))}
        </div>

        {/* Detail - Members Table */}
        <div className={styles.detail}>
          {grupoActual ? (
            <>
              <div className={styles.detailHeader}>
                <div>
                  <h3 className={styles.grupoTitle}>{grupoActual.name}</h3>
                  <span className={styles.grupoDesc}>{grupoActual.description || ''}</span>
                </div>
                <span className={styles.grupoBadge}>{miembrosFiltrados.length} participante{miembrosFiltrados.length !== 1 ? 's' : ''}</span>
              </div>

              {/* Search + Actions Bar */}
              <div className={styles.toolbar}>
                <div className={styles.searchBox}>
                  <span className={styles.searchIcon}>🔍</span>
                  <input
                    className={styles.searchInput}
                    type="text"
                    placeholder="Buscar participante..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                  />
                  {busqueda && (
                    <button className={styles.clearSearch} onClick={() => setBusqueda('')}>✕</button>
                  )}
                </div>
                <div className={styles.toolbarActions}>
                  <button className={styles.toolbarBtn} onClick={() => openAddModal('single')}>+ Individual</button>
                  <button className={styles.toolbarBtn} onClick={() => openAddModal('bulk')}>+ Masivo</button>
                  {busqueda && (
                    <button className={`${styles.toolbarBtn} ${styles.danger}`} onClick={handleRemoveBulk}>
                      Eliminar filtrados ({miembrosFiltrados.length})
                    </button>
                  )}
                </div>
              </div>

              {/* Members Table */}
              <div className={styles.membersTable}>
                <div className={styles.membersHeader}>
                  <span className={styles.colIdx}>#</span>
                  <span className={styles.colNombre}>Nombre</span>
                  <span className={styles.colModalidades}>Modalidades</span>
                  <span className={styles.colPromo}>Dupla promo</span>
                  <span className={styles.colActions}>Acciones</span>
                </div>
                <div className={styles.membersBody}>
                  {miembrosFiltrados.map((m, i) => (
                    <div key={m.name} className={styles.memberRow}>
                      <span className={styles.colIdx}>{i + 1}</span>
                      <span className={styles.colNombre}>{m.name}</span>
                      <span className={styles.colModalidades}>
                        <span className={`${styles.modality} ${m.diaria ? styles.active : ''}`} title="Diaria">D</span>
                        <span className={`${styles.modality} ${m.semanal ? styles.active : ''}`} title="Semanal">S</span>
                        <span className={`${styles.modality} ${m.mensual ? styles.active : ''}`} title="Mensual">M</span>
                        {(m.promo || getPrimaryPromoPartner(m)) && <span className={`${styles.modality} ${styles.promo}`} title="Promo 2x">P</span>}
                      </span>
                      <span className={styles.colPromo}>
                        {(m.promo || getPrimaryPromoPartner(m)) ? (
                          getPrimaryPromoPartner(m)
                            ? <span className={styles.promoPartner}>{getPrimaryPromoPartner(m)}</span>
                            : <span className={styles.emptyPromoPartner}>Sin dupla</span>
                        ) : (
                          <span className={styles.emptyPromoPartner}>Sin promo</span>
                        )}
                      </span>
                      <span className={styles.colActions}>
                        <button className={styles.editMemberBtn} onClick={() => openEditMember(m)} title="Editar modalidades">✏️</button>
                        <button className={styles.removeMemberBtn} onClick={() => handleRemoveMember(m.name)} title="Eliminar del grupo">🗑️</button>
                      </span>
                    </div>
                  ))}
                  {miembrosFiltrados.length === 0 && (
                    <div className={styles.emptyMembers}>
                      {busqueda ? 'No se encontraron participantes con ese nombre' : 'No hay participantes en este grupo'}
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className={styles.emptyState}>
              <span className={styles.emptyIcon}>👥</span>
              <p>Crea o selecciona un grupo para comenzar</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function getPromoPartners(member) {
  return Array.isArray(member?.promoPartners)
    ? member.promoPartners.map((name) => String(name || '').trim()).filter(Boolean)
    : []
}

function getPrimaryPromoPartner(member) {
  return getPromoPartners(member)[0] || ''
}

function normalizeName(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function sameName(left, right) {
  return normalizeName(left) === normalizeName(right)
}

function findRegistryParticipant(registry, name) {
  const target = normalizeName(name)
  if (!target) return null
  return (registry || []).find((member) => normalizeName(member?.name) === target) || null
}

function uniqueNames(values) {
  const seen = new Set()
  return (values || [])
    .map((value) => String(value || '').trim())
    .filter(Boolean)
    .filter((value) => {
      const key = normalizeName(value)
      if (!key || seen.has(key)) return false
      seen.add(key)
      return true
    })
}

async function saveRegistryParticipant(member, options = {}) {
  await api.upsertRegistryParticipant({
    name: member.name,
    group: member.group,
    groups: getParticipantGroupIds(member),
    replaceGroups: options.replaceGroups === true,
    diaria: Boolean(member.diaria),
    semanal: Boolean(member.semanal),
    mensual: Boolean(member.mensual),
    promo: Boolean(member.promo),
    promoPartners: getPromoPartners(member),
  })
}
