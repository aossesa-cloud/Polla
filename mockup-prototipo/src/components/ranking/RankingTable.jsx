/**
 * RankingTable.jsx
 *
 * Tabla BASE de ranking.
 * Idéntica para TODOS los modos.
 * No sabe de fases ni clasificación.
 */

import React from 'react'
import styles from '../RankingTable.module.css'

export default function RankingTable({ rankings, mode, renderStatusBadge, title, subtitle }) {
  return (
    <div className={styles.rankingContainer}>
      <div className={styles.rankingHeader}>
        <div>
          <h2 className={styles.rankingTitle}>{title || '🏆 Ranking'}</h2>
          {subtitle && <p className={styles.rankingSubtitle}>{subtitle}</p>}
        </div>
      </div>

      {rankings.length === 0 ? (
        <div className={styles.emptyState}>
          <span className={styles.emptyIcon}>🏆</span>
          <p>No hay ranking disponible aún.</p>
        </div>
      ) : (
        <div className={styles.table}>
          <div className={styles.header}>
            <span className={styles.colPos}>#</span>
            <span className={styles.colName}>Stud</span>
            <span className={styles.colScore}>Pts</span>
            {mode !== 'individual' && <span className={styles.colStatus}>Estado</span>}
          </div>
          <div className={styles.body}>
            {rankings.map((entry, i) => (
              <div key={entry.participant} className={`${styles.row} ${i < 3 ? styles.topRow : ''}`}>
                <span className={styles.colPos}>
                  <span className={`${styles.posBadge} ${i === 0 ? styles.gold : i === 1 ? styles.silver : i === 2 ? styles.bronze : ''}`}>
                    {entry.position || i + 1}
                  </span>
                </span>
                <span className={styles.colName}>{entry.participant}</span>
                <span className={styles.colScore}>{entry.total ?? entry.score ?? 0}</span>
                {mode !== 'individual' && (
                  <span className={styles.colStatus}>
                    {renderStatusBadge?.(entry.participant, entry)}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
