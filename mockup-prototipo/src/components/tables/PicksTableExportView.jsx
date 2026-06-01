/**
 * PicksTableExportView.jsx
 *
 * Vista optimizada para exportacion PNG.
 * Prioriza un look claro, limpio y legible tipo planilla.
 */

import React from 'react'
import { getExportStyleColors } from '../../services/exportStyles'

const CELL_SIZE = {
  rowNum: 38,
  stud: 250,
  points: 110,
  pick: 48,
  height: 22,
}

function formatPick(value) {
  if (!value || value === '-' || value === '—') return ''
  return String(value).trim()
}

function formatValue(value) {
  if (value === undefined || value === null || value === '') return ''
  const number = Number(value)
  if (!Number.isFinite(number)) return String(value)
  return number % 1 === 0 ? String(number) : number.toFixed(1).replace('.', ',')
}

export default function PicksTableExportView({
  picks,
  raceCount,
  title,
  date,
  styleId = 'excel-classic',
}) {
  const colors = getExportStyleColors(styleId)
  const sorted = [...(picks || [])]

  const totalWidth =
    CELL_SIZE.rowNum + CELL_SIZE.stud + CELL_SIZE.points + raceCount * CELL_SIZE.pick

  return (
    <div
      style={{
        width: `${totalWidth}px`,
        backgroundColor: colors.bg,
        fontFamily: 'Arial, Helvetica, sans-serif',
        padding: '10px 10px 8px',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          textAlign: 'center',
          marginBottom: '8px',
          fontSize: '18px',
          fontWeight: 800,
          color: colors.titleText,
        }}
      >
        {title || 'Tabla de Pronosticos'}
        {date ? (
          <span style={{ fontWeight: 700, fontSize: '13px', color: '#6B7280' }}> — {date}</span>
        ) : null}
      </div>

      <table
        style={{
          borderCollapse: 'collapse',
          width: '100%',
          fontSize: '13px',
          fontWeight: 700,
          backgroundColor: colors.surfaceBg,
          boxShadow: `0 0 0 1px ${colors.tableBorder} inset`,
        }}
        cellPadding="0"
        cellSpacing="0"
      >
        <thead>
          <tr>
            <th
              style={{
                width: `${CELL_SIZE.rowNum}px`,
                backgroundColor: colors.headerBg,
                color: colors.headerText,
                padding: '6px 4px',
                border: `1px solid ${colors.tableBorder}`,
                textAlign: 'center',
                fontSize: '12px',
                fontWeight: 800,
              }}
            >
              N°
            </th>
            <th
              style={{
                width: `${CELL_SIZE.stud}px`,
                backgroundColor: colors.headerBg,
                color: colors.headerText,
                padding: '6px 8px',
                border: `1px solid ${colors.tableBorder}`,
                textAlign: 'center',
                fontSize: '14px',
                fontWeight: 800,
              }}
            >
              STUD
            </th>
            <th
              style={{
                width: `${CELL_SIZE.points}px`,
                backgroundColor: colors.headerBg,
                color: colors.headerText,
                padding: '6px 4px',
                border: `1px solid ${colors.tableBorder}`,
                textAlign: 'center',
                fontSize: '12px',
                fontWeight: 800,
              }}
            >
              Puntos
            </th>
            {Array.from({ length: raceCount }, (_, i) => i + 1).map((race) => (
              <th
                key={race}
                style={{
                  width: `${CELL_SIZE.pick}px`,
                  backgroundColor: colors.headerBg,
                  color: colors.headerText,
                  padding: '6px 2px',
                  border: `1px solid ${colors.tableBorder}`,
                  textAlign: 'center',
                  fontSize: '13px',
                  fontWeight: 800,
                }}
              >
                {race}
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
                <tr>
                  <td
                    style={{
                      width: `${CELL_SIZE.rowNum}px`,
                      backgroundColor: colors.rowNumBg,
                      color: colors.rowNumText,
                      padding: '5px 4px',
                      border: `1px solid ${colors.tableBorder}`,
                      textAlign: 'center',
                      fontSize: '13px',
                      fontWeight: 800,
                    }}
                    rowSpan={2}
                  >
                    {idx + 1}
                  </td>

                  <td
                    style={{
                      width: `${CELL_SIZE.stud}px`,
                      backgroundColor: colors.studBg,
                      color: colors.studText,
                      padding: '5px 8px',
                      border: `1px solid ${colors.tableBorder}`,
                      fontSize: '14px',
                      fontWeight: 800,
                      textAlign: 'center',
                      whiteSpace: 'nowrap',
                    }}
                    rowSpan={2}
                  >
                    {entry?.participant || entry?.name || ''}
                  </td>

                  <td
                    style={{
                      width: `${CELL_SIZE.points}px`,
                      backgroundColor: colors.pointsBg,
                      color: colors.pointsText,
                      padding: '5px 4px',
                      border: `1px solid ${colors.tableBorder}`,
                      textAlign: 'center',
                      fontSize: '14px',
                      fontWeight: 800,
                    }}
                    rowSpan={2}
                  >
                    {formatValue(points)}
                  </td>

                  {Array.from({ length: raceCount }, (_, i) => {
                    const pickObj = picksList[i]
                    const pick = formatPick(pickObj?.horse || pickObj?.pick || '')
                    const hasPick = Boolean(pick)

                    return (
                      <td
                        key={`pick-${idx}-${i}`}
                        style={{
                          width: `${CELL_SIZE.pick}px`,
                          backgroundColor: hasPick ? colors.pickBg : colors.emptyBg,
                          color: hasPick ? colors.pickText : 'transparent',
                          padding: '4px 3px',
                          border: `1px solid ${colors.tableBorder}`,
                          textAlign: 'center',
                          fontSize: '13px',
                          fontWeight: 800,
                          height: `${CELL_SIZE.height}px`,
                        }}
                      >
                        {hasPick ? pick : ''}
                      </td>
                    )
                  })}
                </tr>

                <tr>
                  {Array.from({ length: raceCount }, (_, i) => {
                    const pickObj = picksList[i]
                    const divValue = pickObj?.score || pickObj?.dividendo || 0
                    const hasDiv = Number(divValue) > 0

                    return (
                      <td
                        key={`div-${idx}-${i}`}
                        style={{
                          width: `${CELL_SIZE.pick}px`,
                          backgroundColor: hasDiv ? colors.divBg : colors.emptyBg,
                          color: hasDiv ? colors.divText : 'transparent',
                          padding: '3px 3px',
                          border: `1px solid ${colors.tableBorder}`,
                          textAlign: 'center',
                          fontSize: '11px',
                          fontWeight: 800,
                          height: `${CELL_SIZE.height - 2}px`,
                        }}
                      >
                        {hasDiv ? formatValue(divValue) : ''}
                      </td>
                    )
                  })}
                </tr>
              </React.Fragment>
            )
          })}
        </tbody>
      </table>

      <div
        style={{
          marginTop: '8px',
          textAlign: 'center',
          fontSize: '10px',
          color: '#6B7280',
        }}
      >
        Polla Hipica • Generado automaticamente
      </div>
    </div>
  )
}
