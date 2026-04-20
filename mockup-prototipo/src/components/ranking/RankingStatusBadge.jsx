/**
 * RankingStatusBadge.jsx
 *
 * Badges de estado para ranking: clasificado, eliminado, activo.
 * En fase final se ocultan badges de clasificacion.
 */

import React from 'react'
import styles from '../RankingTable.module.css'

export default function RankingStatusBadge({ participant, qualifiers, eliminated, phase, mode, status }) {
  const isFinal = phase === 'final'

  // En final, ocultar badges de clasificacion.
  if (isFinal && (status === 'qualified' || status === 'not-qualified')) {
    return null
  }

  if (status === 'qualified') {
    return <span className={`${styles.badge} ${styles.qualified}`}>✔ Clasifica</span>
  }
  if (status === 'not-qualified') {
    return <span className={`${styles.badge} ${styles.notQualified}`}>✖ No clasifica</span>
  }
  if (status === 'eliminated') {
    return <span className={`${styles.badge} ${styles.eliminated}`}>🚫 Eliminado</span>
  }
  if (status === 'active') {
    if (mode !== 'progressive-elimination') return null
    return <span className={`${styles.badge} ${styles.active}`}>✔ Activo</span>
  }

  const isQualified = qualifiers?.includes(participant)
  const isEliminated = eliminated?.includes(participant)

  // Head-to-head: en final sin badges, en clasificacion mostrar tendencia.
  if (mode === 'head-to-head') {
    if (isFinal) return null
    return isQualified
      ? <span className={`${styles.badge} ${styles.qualified}`}>↑ Ganando</span>
      : <span className={`${styles.badge} ${styles.notQualified}`}>↓ Perdiendo</span>
  }

  // En fase final, ocultar badges de clasificacion (excepto eliminacion progresiva).
  if (isFinal && mode !== 'progressive-elimination') {
    return null
  }

  if (mode === 'progressive-elimination') {
    if (isEliminated) {
      return <span className={`${styles.badge} ${styles.eliminated}`}>🚫 Eliminado</span>
    }
    return <span className={`${styles.badge} ${styles.active}`}>✔ Activo</span>
  }

  if (mode === 'groups' || mode === 'final-qualification') {
    if (isQualified) {
      return <span className={`${styles.badge} ${styles.qualified}`}>✔ Clasifica</span>
    }
    return <span className={`${styles.badge} ${styles.pending}`}>En carrera</span>
  }

  if (mode === 'pairs') {
    if (isQualified) {
      return <span className={`${styles.badge} ${styles.qualified}`}>✔ Pareja clasifica</span>
    }
    return <span className={`${styles.badge} ${styles.pending}`}>En carrera</span>
  }

  return null
}
