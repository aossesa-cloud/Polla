/**
 * PicksTableExportView.jsx
 * 
 * Vista OPTIMIZADA para exportación PNG (WhatsApp/celular).
 * Soporta múltiples estilos personalizables por campaña.
 */

import React from 'react'
import { getExportStyleColors, getExportStyleById } from '../../services/exportStyles'

const CELL_SIZE = {
  rowNum: 35,
  stud: 130,
  points: 70,
  pick: 55,
  height: 28,
}

/**
 * Formatea el número para que sea compacto
 */
function formatPick(value) {
  if (!value || value === '-' || value === '—') return ''
  return String(value).trim()
}

/**
 * Componente principal de exportación con estilos personalizables
 * @param {Object} props
 * @param {Array} props.picks - Lista de participantes con picks
 * @param {number} props.raceCount - Número de carreras
 * @param {string} props.title - Título de la tabla
 * @param {string} props.date - Fecha de la tabla
 * @param {string} props.styleId - ID del estilo a usar (default: 'excel-classic')
 */
export default function PicksTableExportView({ 
  picks, 
  raceCount, 
  title, 
  date, 
  styleId = 'excel-classic' 
}) {
  // Obtener configuración de colores del estilo
  const colors = getExportStyleColors(styleId)
  const style = getExportStyleById(styleId)
  
  // Ordenar por puntos (descendente) para ranking
  const sorted = [...(picks || [])].sort((a, b) => {
    const pointsA = Number(a?.points || a?.score || 0)
    const pointsB = Number(b?.points || b?.score || 0)
    return pointsB - pointsA
  })

  const totalWidth = CELL_SIZE.rowNum + CELL_SIZE.stud + CELL_SIZE.points + (raceCount * CELL_SIZE.pick)
  const totalHeight = 50 + (sorted.length * CELL_SIZE.height * 2) + 30

  return (
    <div
      style={{
        width: `${totalWidth}px`,
        backgroundColor: colors.bg,
        fontFamily: 'Arial, Helvetica, sans-serif',
        padding: '15px',
        boxSizing: 'border-box',
      }}
    >
      {/* Título */}
      <div style={{
        textAlign: 'center',
        marginBottom: '12px',
        fontSize: '20px',
        fontWeight: 'bold',
        color: styleId === 'blue-premium' ? '#64B5F6' : colors.headerBg,
      }}>
        🏇 {title || 'Tabla de Pronósticos'}
        {date && <span style={{ fontWeight: 'normal', fontSize: '14px', color: '#666' }}> — {date}</span>}
      </div>

      {/* Tabla principal */}
      <table
        style={{
          borderCollapse: 'collapse',
          width: '100%',
          fontSize: '13px',
          fontWeight: 'bold',
        }}
        cellPadding="0"
        cellSpacing="0"
      >
        <thead>
          <tr>
            {/* N° */}
            <th style={{
              width: `${CELL_SIZE.rowNum}px`,
              backgroundColor: colors.headerBg,
              color: colors.headerText,
              padding: '8px 6px',
              border: `1px solid ${colors.headerBg}`,
              textAlign: 'center',
              fontSize: '13px',
            }}>
              N°
            </th>

            {/* STUD */}
            <th style={{
              width: `${CELL_SIZE.stud}px`,
              backgroundColor: colors.headerBg,
              color: colors.headerText,
              padding: '8px 10px',
              border: `1px solid ${colors.headerBg}`,
              textAlign: 'left',
              fontSize: '14px',
            }}>
              STUD
            </th>

            {/* Puntos */}
            <th style={{
              width: `${CELL_SIZE.points}px`,
              backgroundColor: colors.headerBg,
              color: colors.headerText,
              padding: '8px 6px',
              border: `1px solid ${colors.headerBg}`,
              textAlign: 'center',
              fontSize: '13px',
            }}>
              Puntos
            </th>

            {/* Carreras */}
            {Array.from({ length: raceCount }, (_, i) => i + 1).map(c => (
              <th key={c} style={{
                width: `${CELL_SIZE.pick}px`,
                backgroundColor: colors.headerBg,
                color: colors.headerText,
                padding: '8px 4px',
                border: `1px solid ${colors.headerBg}`,
                textAlign: 'center',
                fontSize: '14px',
              }}>
                {c}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {sorted.map((entry, idx) => {
            const picksList = Array.isArray(entry?.picks) ? entry.picks : []
            const points = Number(entry?.points || entry?.score || 0)

            return (
              <React.Fragment key={entry?.participant || entry?.name || idx}>
                {/* Fila de picks (números) */}
                <tr>
                  {/* N° */}
                  <td style={{
                    width: `${CELL_SIZE.rowNum}px`,
                    backgroundColor: colors.rowNumBg,
                    color: colors.rowNumText,
                    padding: '4px 6px',
                    border: `1px solid ${colors.headerBg}`,
                    textAlign: 'center',
                    fontSize: '13px',
                    fontWeight: 'bold',
                  }}>
                    {idx + 1}
                  </td>

                  {/* STUD */}
                  <td style={{
                    width: `${CELL_SIZE.stud}px`,
                    backgroundColor: colors.studBg,
                    padding: '4px 10px',
                    border: `1px solid ${colors.studBorder}`,
                    fontSize: '14px',
                    fontWeight: 'bold',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}>
                    {entry?.participant || entry?.name || ''}
                  </td>

                  {/* Puntos */}
                  <td style={{
                    width: `${CELL_SIZE.points}px`,
                    backgroundColor: colors.pointsBg,
                    padding: '4px 6px',
                    border: `1px solid ${colors.studBorder}`,
                    textAlign: 'center',
                    fontSize: '15px',
                    fontWeight: 'bold',
                    color: colors.pointsText,
                  }}>
                    {points % 1 === 0 ? points : points.toFixed(1)}
                  </td>

                  {/* Picks por carrera */}
                  {Array.from({ length: raceCount }, (_, i) => {
                    const pickObj = picksList[i]
                    const pick = formatPick(pickObj?.horse || pickObj?.pick || '')
                    const hasPick = pick && pick !== '-' && pick !== '—'

                    return (
                      <td key={i} style={{
                        width: `${CELL_SIZE.pick}px`,
                        backgroundColor: hasPick ? colors.pickBg : colors.emptyBg,
                        padding: '4px 6px',
                        border: `1px solid ${hasPick ? colors.pickBorder : colors.emptyBorder}`,
                        textAlign: 'center',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        color: hasPick ? colors.pickText : 'transparent',
                        height: `${CELL_SIZE.height / 2 - 1}px`,
                      }}>
                        {hasPick ? pick : ''}
                      </td>
                    )
                  })}
                </tr>

                {/* Fila de dividendos */}
                <tr>
                  {/* Espacio vacío para N° */}
                  <td style={{
                    width: `${CELL_SIZE.rowNum}px`,
                    backgroundColor: colors.emptyBg,
                    border: `1px solid ${colors.emptyBorder}`,
                    padding: 0,
                  }} />

                  {/* Espacio vacío para STUD */}
                  <td style={{
                    width: `${CELL_SIZE.stud}px`,
                    backgroundColor: colors.emptyBg,
                    border: `1px solid ${colors.emptyBorder}`,
                    padding: 0,
                  }} />

                  {/* Espacio vacío para Puntos */}
                  <td style={{
                    width: `${CELL_SIZE.points}px`,
                    backgroundColor: colors.emptyBg,
                    border: `1px solid ${colors.emptyBorder}`,
                    padding: 0,
                  }} />

                  {/* Dividendos por carrera */}
                  {Array.from({ length: raceCount }, (_, i) => {
                    const pickObj = picksList[i]
                    const divValue = pickObj?.score || pickObj?.dividendo || 0
                    const hasDiv = divValue && divValue > 0

                    return (
                      <td key={i} style={{
                        width: `${CELL_SIZE.pick}px`,
                        backgroundColor: hasDiv ? colors.divBg : colors.emptyBg,
                        padding: '4px 6px',
                        border: `1px solid ${hasDiv ? colors.divBg : colors.emptyBorder}`,
                        textAlign: 'center',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        color: hasDiv ? colors.divText : 'transparent',
                        height: `${CELL_SIZE.height / 2 - 1}px`,
                      }}>
                        {hasDiv ? (divValue % 1 === 0 ? divValue : divValue.toFixed(1)) : ''}
                      </td>
                    )
                  })}
                </tr>
              </React.Fragment>
            )
          })}
        </tbody>
      </table>

      {/* Footer */}
      <div style={{
        marginTop: '12px',
        textAlign: 'center',
        fontSize: '11px',
        color: '#999',
      }}>
        Polla Hípica • Generado automáticamente
      </div>
    </div>
  )
}
