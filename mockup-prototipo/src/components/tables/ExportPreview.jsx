/**
 * ExportPreview.jsx
 *
 * Vista previa en tiempo real de la tabla de exportación PNG.
 * Se actualiza instantáneamente mientras cambias los colores.
 */

import React from 'react'
import { detectRaceStatus, getHeaderInfo, generateHeaderText } from '../../services/raceStatus'

// Datos de ejemplo para la vista previa
const PREVIEW_DATA = [
  { name: 'TOCOCO', picks: ['9', '2', '6', '3'], score: 53.6, divs: ['1.8', '3.8', '6.3', ''] },
  { name: 'MANZOR', picks: ['7', '2', '10', '6'], score: 55.0, divs: ['', '3.8', '6.3', '8.6'] },
]

export default function ExportPreview({ colors, exportStyle }) {
  const {
    bg = '#FFFFFF',
    headerBg = '#1F4E79',
    headerText = '#FFFFFF',
    pickBg = '#F4B183',
    pickBorder = '#E8913A',
    pickText = '#000000',
    divBg = '#2F5496',
    divText = '#FFFFFF',
    emptyBg = '#FFFFFF',
    emptyBorder = '#D9D9D9',
    studBg = '#FFFFFF',
    studBorder = '#D9D9D9',
    pointsBg = '#FFFFFF',
    pointsText = '#1F4E79',
    rowNumBg = '#1F4E79',
    rowNumText = '#FFFFFF',
  } = colors || {}

  // Simular estado de jornada para vista previa
  const raceStatus = detectRaceStatus({ '1': { primero: '9' }, '2': { primero: '2' } }, 4)
  const headerInfo = { campaignType: 'Diaria', hippodrome: 'Club Hípico', date: '13-04-2026' }
  const previewHeaderText = generateHeaderText(headerInfo, raceStatus)

  return (
    <div style={{
      marginTop: '20px',
      padding: '16px',
      background: '#111827',
      borderRadius: '8px',
      border: '2px solid #10b981',
    }}>
      <div style={{
        textAlign: 'center',
        fontSize: '14px',
        fontWeight: 'bold',
        color: '#10b981',
        marginBottom: '12px',
      }}>
        👁️ Vista Previa - Estilo {exportStyle === 'custom' ? 'Personalizado' : 'Predefinido'}
      </div>

      {/* Tabla de vista previa */}
      <div style={{
        background: bg,
        padding: '10px',
        borderRadius: '6px',
        overflow: 'auto',
      }}>
        {/* Header dinámico */}
        <div style={{ textAlign: 'center', marginBottom: '4px' }}>
          <div style={{ fontSize: '14px', fontWeight: 'bold', color: headerBg, marginBottom: '2px' }}>
            {previewHeaderText}
          </div>
          <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#10b981' }}>
            {raceStatus.label}
          </div>
        </div>

        {/* Tabla */}
        <table style={{
          borderCollapse: 'collapse',
          fontSize: '10px',
          width: '100%',
        }} cellPadding="0" cellSpacing="0">
          <thead>
            <tr>
              <th style={{
                width: '30px',
                background: headerBg,
                color: headerText,
                padding: '4px 3px',
                border: `1px solid ${headerBg}`,
                textAlign: 'center',
                fontSize: '10px',
              }}>
                N°
              </th>
              <th style={{
                width: '80px',
                background: headerBg,
                color: headerText,
                padding: '4px 6px',
                border: `1px solid ${headerBg}`,
                textAlign: 'left',
                fontSize: '11px',
              }}>
                STUD
              </th>
              <th style={{
                width: '45px',
                background: headerBg,
                color: headerText,
                padding: '4px 4px',
                border: `1px solid ${headerBg}`,
                textAlign: 'center',
                fontSize: '10px',
              }}>
                Pts
              </th>
              {[1, 2, 3, 4].map(c => (
                <th key={c} style={{
                  width: '35px',
                  background: headerBg,
                  color: headerText,
                  padding: '4px 3px',
                  border: `1px solid ${headerBg}`,
                  textAlign: 'center',
                  fontSize: '11px',
                }}>
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PREVIEW_DATA.map((entry, idx) => (
              <React.Fragment key={idx}>
                {/* Fila de picks */}
                <tr>
                  <td style={{
                    background: rowNumBg,
                    color: rowNumText,
                    padding: '3px 4px',
                    border: `1px solid ${headerBg}`,
                    textAlign: 'center',
                    fontSize: '10px',
                    fontWeight: 'bold',
                  }} rowSpan="2">
                    {idx + 1}
                  </td>
                  <td style={{
                    background: studBg,
                    padding: '3px 6px',
                    border: `1px solid ${studBorder}`,
                    fontSize: '11px',
                    fontWeight: 'bold',
                    whiteSpace: 'nowrap',
                    color: '#000000',
                  }} rowSpan="2">
                    {entry.name}
                  </td>
                  <td style={{
                    background: pointsBg,
                    padding: '3px 4px',
                    border: `1px solid ${studBorder}`,
                    textAlign: 'center',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    color: pointsText,
                  }} rowSpan="2">
                    {entry.score}
                  </td>
                  {entry.picks.map((pick, i) => {
                    const hasPick = pick && pick !== '-' && pick !== ''
                    return (
                      <td key={i} style={{
                        background: hasPick ? pickBg : emptyBg,
                        padding: '3px 4px',
                        border: `1px solid ${hasPick ? pickBorder : emptyBorder}`,
                        textAlign: 'center',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        color: hasPick ? pickText : 'transparent',
                        height: '12px',
                      }}>
                        {hasPick ? pick : ''}
                      </td>
                    )
                  })}
                </tr>
                {/* Fila de dividendos */}
                <tr>
                  {entry.divs.map((div, i) => {
                    const hasDiv = div && div !== ''
                    return (
                      <td key={i} style={{
                        background: hasDiv ? divBg : emptyBg,
                        padding: '3px 4px',
                        border: `1px solid ${hasDiv ? divBg : emptyBorder}`,
                        textAlign: 'center',
                        fontSize: '9px',
                        fontWeight: 'bold',
                        color: hasDiv ? divText : 'transparent',
                        height: '12px',
                      }}>
                        {hasDiv ? div : ''}
                      </td>
                    )
                  })}
                </tr>
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Indicador de actualización */}
      <div style={{
        marginTop: '8px',
        textAlign: 'center',
        fontSize: '10px',
        color: '#6b7280',
        fontStyle: 'italic',
      }}>
        ✨ La vista previa se actualiza en tiempo real
      </div>
    </div>
  )
}
