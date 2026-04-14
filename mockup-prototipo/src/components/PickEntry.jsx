import React, { useState } from 'react'
import api from '../api'
import useAppStore from '../store/useAppStore'
import styles from './PickEntry.module.css'

export default function PickEntry() {
  const { appData, refresh } = useAppStore()

  // Estado del formulario
  const [eventoId, setEventoId] = useState('')
  const [studIndex, setStudIndex] = useState('')
  const [studName, setStudName] = useState('')
  const [picks, setPicks] = useState([])
  const [picks2, setPicks2] = useState([])
  const [bulkText, setBulkText] = useState('')
  const [showStud2, setShowStud2] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState(null)
  const [numCarreras, setNumCarreras] = useState(12)

  // Eventos disponibles (excluyendo importados)
  const eventos = appData?.events?.filter(ev => !ev.id.startsWith('imported-')) || []

  // Studs disponibles del registry
  const studs = appData?.registry?.filter(r => r.diaria || r.semanal || r.mensual) || []

  // Auto-completar nombre al seleccionar índice
  const handleStudIndexChange = (idx) => {
    setStudIndex(idx)
    const s = studs.find(r => r.index === parseInt(idx) || r.number === parseInt(idx))
    if (s) setStudName(s.name)
  }

  // Parsear texto pegado
  const handleBulkPaste = () => {
    const result = api.parseDualBulkPicks(bulkText)
    if (result.stud1.length > 0) {
      setPicks(result.stud1)
    }
    if (result.stud2.length > 0) {
      setPicks2(result.stud2)
      setShowStud2(true)
    }
    setMensaje({ tipo: 'info', texto: `${result.stud1.length} carreras parseadas${result.stud2.length ? ` (Stud 2: ${result.stud2.length})` : ''}` })
  }

  // Guardar picks
  const handleGuardar = async () => {
    if (!eventoId || !studIndex || picks.length === 0) {
      setMensaje({ tipo: 'error', texto: 'Completa evento, stud y al menos un pick' })
      return
    }

    setGuardando(true)
    setMensaje(null)

    try {
      // Guardar Stud 1
      await api.savePickForEvent(eventoId, {
        index: parseInt(studIndex),
        name: studName || `Stud ${studIndex}`,
        picks: picks.map(p => String(p))
      })

      // Guardar Stud 2 si existe
      if (showStud2 && picks2.length > 0) {
        await api.savePickForEvent(eventoId, {
          index: parseInt(studIndex) + 100, // Índice separado para stud 2
          name: (studName || `Stud ${studIndex}`) + ' (2)',
          picks: picks2.map(p => String(p))
        })
      }

      setMensaje({ tipo: 'ok', texto: '✓ Pronóstico guardado correctamente' })
      setBulkText('')
      setPicks([])
      setPicks2([])
      setShowStud2(false)
      refresh()
    } catch (err) {
      setMensaje({ tipo: 'error', texto: `Error: ${err.message}` })
    } finally {
      setGuardando(false)
    }
  }

  // Cambiar manual de un pick
  const handlePickChange = (carrera, valor, stud = 1) => {
    if (stud === 1) {
      const newPicks = [...picks]
      newPicks[carrera - 1] = valor
      setPicks(newPicks)
    } else {
      const newPicks = [...picks2]
      newPicks[carrera - 1] = valor
      setPicks2(newPicks)
    }
  }

  return (
    <div className={styles.pickEntry}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Ingreso de Pronósticos</h1>
          <p className={styles.subtitle}>Pega los pronósticos o ingrésalos manualmente</p>
        </div>
      </header>

      {/* Mensaje */}
      {mensaje && (
        <div className={`${styles.message} ${styles[mensaje.tipo]}`}>
          {mensaje.texto}
        </div>
      )}

      {/* Selector de evento */}
      <div className={styles.section}>
        <label className={styles.sectionLabel}>Evento / Campaña</label>
        <select
          className={styles.select}
          value={eventoId}
          onChange={(e) => {
            setEventoId(e.target.value)
            setNumCarreras(12) // Default
          }}
        >
          <option value="">Seleccionar evento...</option>
          {eventos.map(ev => (
            <option key={ev.id} value={ev.id}>
              {ev.title || ev.name || ev.id} ({ev.races || ev.raceCount || 12} carreras)
            </option>
          ))}
        </select>
      </div>

      {/* Stud selector */}
      <div className={styles.section}>
        <label className={styles.sectionLabel}>Stud / Participante</label>
        <div className={styles.studRow}>
          <input
            className={styles.inputSmall}
            type="number"
            placeholder="#"
            value={studIndex}
            onChange={(e) => handleStudIndexChange(e.target.value)}
            min="1"
            style={{ width: 60 }}
          />
          <input
            className={styles.input}
            placeholder="Nombre del stud (opcional si está en registry)"
            value={studName}
            onChange={(e) => setStudName(e.target.value)}
            list="studs-list"
          />
          <datalist id="studs-list">
            {studs.map(s => (
              <option key={s.name} value={s.name} />
            ))}
          </datalist>
        </div>
      </div>

      {/* Bulk paste */}
      <div className={styles.section}>
        <label className={styles.sectionLabel}>
          📋 Pegar pronósticos (copiar y pegar desde WhatsApp, imagen, etc.)
        </label>
        <textarea
          className={styles.bulkTextarea}
          value={bulkText}
          onChange={(e) => setBulkText(e.target.value)}
          placeholder={`Formato dual stud:\n1. 5-12\n2. 12-1\n3. 11-5\n\nO formato simple:\n5 12 11 3 7 8 2 9 1 6 4 10`}
          rows={6}
        />
        <div className={styles.pasteActions}>
          <button className={styles.parseBtn} onClick={handleBulkPaste}>
            Aplicar Pegado
          </button>
          <button className={styles.clearBtn} onClick={() => { setBulkText(''); setPicks([]); setPicks2([]); setShowStud2(false) }}>
            Limpiar
          </button>
        </div>
      </div>

      {/* Picks grid */}
      <div className={styles.picksSection}>
        <h3 className={styles.picksTitle}>
          Picks ingresados: {picks.filter(p => p).length} de {numCarreras} carreras
        </h3>
        <div className={styles.picksGrid}>
          {Array.from({ length: numCarreras }, (_, i) => i + 1).map(carrera => (
            <div key={carrera} className={styles.pickCell}>
              <label className={styles.pickLabel}>C{carrera}</label>
              <input
                className={styles.pickInput}
                type="text"
                value={picks[carrera - 1] || ''}
                onChange={(e) => handlePickChange(carrera, e.target.value, 1)}
                placeholder="—"
                maxLength={3}
              />
            </div>
          ))}
        </div>

        {/* Stud 2 (dual) */}
        {showStud2 && (
          <>
            <h3 className={styles.picksTitle}>Stud 2 — Picks</h3>
            <div className={styles.picksGrid}>
              {Array.from({ length: numCarreras }, (_, i) => i + 1).map(carrera => (
                <div key={`s2-${carrera}`} className={styles.pickCell}>
                  <label className={styles.pickLabel}>C{carrera}</label>
                  <input
                    className={styles.pickInput}
                    type="text"
                    value={picks2[carrera - 1] || ''}
                    onChange={(e) => handlePickChange(carrera, e.target.value, 2)}
                    placeholder="—"
                    maxLength={3}
                  />
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Actions */}
      <div className={styles.actions}>
        <button
          className={`${styles.saveBtn} ${(!eventoId || !studIndex || picks.length === 0) ? styles.disabled : ''}`}
          onClick={handleGuardar}
          disabled={guardando || !eventoId || !studIndex || picks.length === 0}
        >
          {guardando ? 'Guardando...' : '💾 Guardar Pronóstico'}
        </button>
      </div>
    </div>
  )
}
