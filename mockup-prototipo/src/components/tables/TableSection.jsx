/**
 * TableSection.jsx
 *
 * Contenedor visual para agrupaciones (grupo, pareja, duelo).
 * Reutilizable por modo. No crea tablas duplicadas.
 */

import React from 'react'
import styles from '../PronosticosTable.module.css'

const GROUP_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'
]

function getGroupColor(id) {
  const hash = String(id).split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return GROUP_COLORS[hash % GROUP_COLORS.length]
}

export default function TableSection({ title, visualId, mode, children }) {
  const color = getGroupColor(visualId)
  const label = mode === 'pairs' ? 'Pareja' : mode === 'groups' ? 'Grupo' : 'Duelo'

  return (
    <div className={styles.tableSection} style={{ borderLeft: `4px solid ${color}` }}>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionBadge} style={{ background: color }}>{label}</span>
        <h3 className={styles.sectionTitle}>{title}</h3>
      </div>
      {children}
    </div>
  )
}
