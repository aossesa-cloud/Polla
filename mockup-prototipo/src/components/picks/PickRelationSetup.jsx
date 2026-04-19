/**
 * PickRelationSetup.jsx
 *
 * Formulario dinámico que configura relaciones especiales:
 * - pareja (modo pairs)
 * - grupo (modo groups)
 * - contrincante (modo head-to-head)
 *
 * Un solo componente adaptable. No se duplica por modo.
 */

import React, { useEffect, useState } from 'react'
import styles from '../PickEntry.module.css'

const RELATION_CONFIG = {
  pair: {
    title: '¿Quién es tu pareja?',
    placeholder: 'Nombre de tu pareja',
    hint: 'Esta relación se guarda para toda la competencia. Se asigna una vez y se reutiliza.'
  },
  group: {
    title: '¿A qué grupo perteneces?',
    placeholder: 'Selecciona tu grupo',
    hint: 'Esta asignación se guarda para toda la competencia.'
  },
  opponent: {
    title: '¿Quién es tu contrincante?',
    placeholder: 'Nombre de tu contrincante',
    hint: 'Esta relación se guarda para toda la competencia.'
  }
}

export default function PickRelationSetup({
  relationType,
  options,
  participantName,
  onSave,
  initialValue = '',
}) {
  const [value, setValue] = useState(initialValue)
  const config = RELATION_CONFIG[relationType] || RELATION_CONFIG.pair

  useEffect(() => {
    setValue(initialValue || '')
  }, [initialValue])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!value.trim()) return
    onSave(participantName, relationType, value.trim())
  }

  return (
    <div className={styles.relationSetup}>
      <h3 className={styles.relationTitle}>{config.title}</h3>
      <form onSubmit={handleSubmit}>
        {options && options.length > 0 ? (
          <select
            className={styles.relationSelect}
            value={value}
            onChange={e => setValue(e.target.value)}
          >
            <option value="">Seleccionar...</option>
            {options.map(opt => (
              <option key={opt.id} value={opt.id}>{opt.label}</option>
            ))}
          </select>
        ) : (
          <input
            className={styles.relationInput}
            type="text"
            value={value}
            onChange={e => setValue(e.target.value)}
            placeholder={config.placeholder}
            autoFocus
          />
        )}
        <p className={styles.relationHint}>{config.hint}</p>
        <div className={styles.relationActions}>
          <button className={styles.saveBtn} type="submit" disabled={!value.trim()}>
            Guardar relación
          </button>
        </div>
      </form>
    </div>
  )
}
