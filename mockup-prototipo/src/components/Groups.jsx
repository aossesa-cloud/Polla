import React, { useState, useMemo } from 'react'
import api from '../api'
import useAppStore from '../store/useAppStore'
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
  const [editDiaria, setEditDiaria] = useState(false)
  const [editSemanal, setEditSemanal] = useState(false)
  const [editMensual, setEditMensual] = useState(false)
  const [editPromo, setEditPromo] = useState(false)
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
    const miembros = registry.filter(r => r.group === grupoActivo)
    if (!busqueda) return miembros
    const q = busqueda.toLowerCase()
    return miembros.filter(m => m.name.toLowerCase().includes(q))
  }, [registry, grupoActivo, busqueda])

  // ===== GROUP CRUD =====
  const handleSaveGrupo = async () => {
    if (!editGroupName.trim()) return
    setGuardando(true)
    try {
      const existing = grupoActual
      if (existing) {
        await api.upsertRegistryGroup({
          id: existing.id,
          name: editGroupName.trim(),
          description: editGroupDesc.trim(),
          enabled: true
        })
      } else {
        await api.upsertRegistryGroup({
          id: `group-${Date.now()}`,
          name: editGroupName.trim(),
          description: editGroupDesc.trim(),
          enabled: true
        })
      }
      setEditando(false)
      setEditGroupName('')
      setEditGroupDesc('')
      refresh()
    } catch (err) {
      alert('Error: ' + err.message)
    } finally {
      setGuardando(false)
    }
  }

  const handleDeleteGrupo = async () => {
    if (!grupoActual) return
    if (!confirm(`¿Eliminar el grupo "${grupoActual.name}"? Los participantes quedarán sin grupo.`)) return
    try {
      await api.deleteRegistryGroup(grupoActual.id)
      setGrupoActivo(grupos.length > 1 ? grupos.find(g => g.id !== grupoActivo)?.id || null : null)
      refresh()
    } catch (err) {
      alert('Error: ' + err.message)
    }
  }

  const openEditGroup = () => {
    if (!grupoActual) return
    setEditGroupName(grupoActual.name)
    setEditGroupDesc(grupoActual.description || '')
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
      await api.upsertRegistryParticipant({
        name: newName.trim(),
        group: grupoActivo,
        diaria: false,
        semanal: false,
        mensual: false
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
        await api.upsertRegistryParticipant({
          name,
          group: grupoActivo,
          diaria: false,
          semanal: false,
          mensual: false
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
      await api.deleteRegistryParticipant(name)
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
      await api.bulkDeleteRegistryParticipants(names)
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
    setEditingMember(member)
    setEditDiaria(member.diaria || false)
    setEditSemanal(member.semanal || false)
    setEditMensual(member.mensual || false)
    setEditPromo(member.promo || false)
    setEditMemberOpen(true)
  }

  const handleSaveMember = async () => {
    if (!editingMember) return
    setGuardando(true)

    try {
      await api.upsertRegistryParticipant({
        name: editingMember.name,
        group: editingMember.group,
        diaria: editDiaria,
        semanal: editSemanal,
        mensual: editMensual,
        promo: editPromo
      })

      setEditMemberOpen(false)
      setEditingMember(null)
      refresh()
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
        <button className={styles.newBtn} onClick={() => { setEditGroupName(''); setEditGroupDesc(''); setEditando(true) }}>
          + Nuevo Grupo
        </button>
      </header>

      {/* Edit Group Modal */}
      {editando && (
        <div className={styles.modalOverlay} onClick={() => setEditando(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h3 className={styles.formTitle}>{grupoActual ? 'Editar Grupo' : 'Nuevo Grupo'}</h3>
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
                <span className={styles.grupoCount}>{registry.filter(r => r.group === g.id).length}</span>
              </button>
              <div className={styles.grupoActions}>
                <button className={styles.iconBtn} onClick={(e) => { e.stopPropagation(); setGrupoActivo(g.id); openEditGroup(); }} title="Editar grupo">✏️</button>
                <button className={styles.iconBtn} onClick={(e) => { e.stopPropagation(); setGrupoActivo(g.id); handleDeleteGrupo(); }} title="Eliminar grupo">🗑️</button>
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
                        {m.promo && <span className={`${styles.modality} ${styles.promo}`} title="Promo 2x">P</span>}
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
