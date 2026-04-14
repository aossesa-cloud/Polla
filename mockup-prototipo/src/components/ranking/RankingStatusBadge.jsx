/**
 * RankingStatusBadge.jsx
 *
 * Badges de estado para ranking: clasificado, eliminado, activo.
 * Un solo componente adaptable por modo.
 */

import React from 'react'
import styles from '../RankingTable.module.css'

export default function RankingStatusBadge({ participant, qualifiers, eliminated, phase, mode }) {
  const isQualified = qualifiers?.includes(participant)
  const isEliminated = eliminated?.includes(participant)
  const isFinal = phase === 'final'

  // En fase final: solo mostrar si clasifica o no
  if (isFinal && mode !== 'progressive-elimination') {
    return isQualified
      ? <span className={`${styles.badge} ${styles.qualified}`}>✓ Clasificado</span>
      : <span className={`${styles.badge} ${styles.notQualified}`}>✗ No clasifica</span>
  }

  // Eliminación progresiva
  if (mode === 'progressive-elimination') {
    if (isEliminated) {
      return <span className={`${styles.badge} ${styles.eliminated}`}>🚫 Eliminado</span>
    }
    return <span className={`${styles.badge} ${styles.active}`}>✓ Activo</span>
  }

  // Grupos: mostrar si clasifica
  if (mode === 'groups' || mode === 'final-qualification') {
    if (isQualified) {
      return <span className={`${styles.badge} ${styles.qualified}`}>✓ Clasifica</span>
    }
    return <span className={`${styles.badge} ${styles.pending}`}>En carrera</span>
  }

  // Parejas
  if (mode === 'pairs') {
    if (isQualified) {
      return <span className={`${styles.badge} ${styles.qualified}`}>✓ Pareja clasifica</span>
    }
    return <span className={`${styles.badge} ${styles.pending}`}>En carrera</span>
  }

  // Individual: sin badge
  return null
}
