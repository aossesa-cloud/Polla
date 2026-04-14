/**
 * PhaseBanner.jsx
 *
 * Banner visual que muestra la fase actual: Clasificación o Final.
 * Reutilizable por modo.
 */

import React from 'react'
import styles from '../PronosticosTable.module.css'

export default function PhaseBanner({ phase, date, mode }) {
  const isFinal = phase === 'final'

  return (
    <div className={`${styles.phaseBanner} ${isFinal ? styles.final : ''}`}>
      <span className={styles.phaseIcon}>{isFinal ? '🏆' : '📋'}</span>
      <span className={styles.phaseText}>
        {isFinal ? 'FASE FINAL' : 'FASE DE CLASIFICACIÓN'}
      </span>
      {date && <span className={styles.phaseDate}>{date}</span>}
    </div>
  )
}
