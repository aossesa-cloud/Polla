/**
 * exportStyles.js
 * 
 * Definición de estilos de exportación PNG disponibles para campañas.
 * Cada campaña puede elegir su estilo preferido.
 */

import { detectRaceStatus, getHeaderInfo, generateHeaderText } from './raceStatus'

export const EXPORT_STYLES = {
  EXCEL_CLASSIC: {
    id: 'excel-classic',
    name: 'Excel Clásico',
    description: 'Fondo blanco, header azul, picks naranja, dividendos azul. Ideal para WhatsApp.',
    colors: {
      bg: '#FFFFFF',
      headerBg: '#1F4E79',
      headerText: '#FFFFFF',
      pickBg: '#F4B183',
      pickBorder: '#E8913A',
      divBg: '#2F5496',
      divText: '#FFFFFF',
      emptyBg: '#FFFFFF',
      emptyBorder: '#D9D9D9',
      studBg: '#FFFFFF',
      studBorder: '#D9D9D9',
      pointsText: '#1F4E79',
      rowNumBg: '#1F4E79',
      rowNumText: '#FFFFFF',
    }
  },
  MINIMAL_WHITE: {
    id: 'minimal-white',
    name: 'Minimalista Blanco',
    description: 'Ultra limpio, bordes finos, estilo Excel moderno.',
    colors: {
      bg: '#FFFFFF',
      headerBg: '#E0E0E0',
      headerText: '#000000',
      pickBg: '#FFE5B4',
      pickBorder: '#000000',
      divBg: '#4472C4',
      divText: '#FFFFFF',
      emptyBg: '#FFFFFF',
      emptyBorder: '#CCCCCC',
      studBg: '#FFFFFF',
      studBorder: '#CCCCCC',
      pointsText: '#333333',
      rowNumBg: '#FAFAFA',
      rowNumText: '#000000',
    }
  },
  COMPACT_DENSE: {
    id: 'compact-dense',
    name: 'Compacto Dense',
    description: 'Más compacto, celdas pequeñas. Más filas visibles.',
    colors: {
      bg: '#FFFFFF',
      headerBg: '#2C5282',
      headerText: '#FFFFFF',
      pickBg: '#F6AD55',
      pickBorder: '#DD6B20',
      divBg: '#4299E1',
      divText: '#FFFFFF',
      emptyBg: '#FFFFFF',
      emptyBorder: '#CBD5E0',
      studBg: '#FFFFFF',
      studBorder: '#CBD5E0',
      pointsText: '#2C5282',
      rowNumBg: '#2C5282',
      rowNumText: '#FFFFFF',
    }
  },
  BLUE_PREMIUM: {
    id: 'blue-premium',
    name: 'Azul Oscuro Premium',
    description: 'Fondo oscuro elegante. Para pantallas y presentaciones.',
    colors: {
      bg: '#1E3A5F',
      headerBg: '#0F2940',
      headerText: '#64B5F6',
      pickBg: '#FF8F00',
      pickBorder: '#FF8F00',
      divBg: '#1565C0',
      divText: '#BBDEFB',
      emptyBg: '#1A3A54',
      emptyBorder: '#37474F',
      studBg: '#1A3A54',
      studBorder: '#37474F',
      pointsText: '#FFB74D',
      rowNumBg: '#142E44',
      rowNumText: '#FFFFFF',
    }
  },
  HIPODROMO_CLASSIC: {
    id: 'hipodromo-classic',
    name: 'Hipódromo Clásico',
    description: 'Rojo y dorado. Estilo tradicional de hipódromos.',
    colors: {
      bg: '#FFFFFF',
      headerBg: '#8B0000',
      headerText: '#FFFFFF',
      pickBg: '#FFD700',
      pickBorder: '#FFA000',
      divBg: '#1B5E20',
      divText: '#FFFFFF',
      emptyBg: '#FFFFFF',
      emptyBorder: '#E57373',
      studBg: '#FFFFFF',
      studBorder: '#E57373',
      pointsText: '#8B0000',
      rowNumBg: '#FFEBEE',
      rowNumText: '#8B0000',
    }
  },
  CUSTOM: {
    id: 'custom',
    name: '🎨 Personalizado',
    description: 'Elige tus propios colores para cada elemento.',
    preview: '🎨',
    recommended: false,
    isCustom: true,
  }
}

/**
 * Obtener estilos como array para dropdown
 */
export function getExportStylesArray() {
  return Object.values(EXPORT_STYLES)
}

/**
 * Obtener estilo por ID
 */
export function getExportStyleById(id) {
  return Object.values(EXPORT_STYLES).find(s => s.id === id) || EXPORT_STYLES.EXCEL_CLASSIC
}

/**
 * Obtener colores de un estilo
 * @param {string} styleId - ID del estilo
 * @param {Object} customColors - Colores personalizados (opcional, solo para estilo 'custom')
 */
export function getExportStyleColors(styleId, customColors = null) {
  // Si es estilo personalizado y hay colores custom, usarlos
  if (styleId === 'custom' && customColors) {
    return {
      bg: customColors.bg || '#FFFFFF',
      headerBg: customColors.headerBg || '#1F4E79',
      headerText: customColors.headerText || '#FFFFFF',
      pickBg: customColors.pickBg || '#F4B183',
      pickBorder: customColors.pickBorder || '#E8913A',
      pickText: customColors.pickText || '#000000',
      divBg: customColors.divBg || '#2F5496',
      divText: customColors.divText || '#FFFFFF',
      emptyBg: customColors.emptyBg || '#FFFFFF',
      emptyBorder: customColors.emptyBorder || '#D9D9D9',
      studBg: customColors.studBg || '#FFFFFF',
      studBorder: customColors.studBorder || '#D9D9D9',
      pointsBg: customColors.pointsBg || '#FFFFFF',
      pointsText: customColors.pointsText || '#1F4E79',
      rowNumBg: customColors.rowNumBg || '#1F4E79',
      rowNumText: customColors.rowNumText || '#FFFFFF',
    }
  }
  
  const style = getExportStyleById(styleId)
  return style.colors
}

/**
 * Generar HTML completo para exportación PNG con el estilo seleccionado
 * @param {Array} picks - Lista de participantes con picks
 * @param {number} raceCount - Número de carreras
 * @param {string} title - Título de la tabla
 * @param {string} date - Fecha opcional
 * @param {string} styleId - ID del estilo a usar
 * @param {Object} customColors - Colores personalizados (para estilo 'custom')
 * @param {Object} campaignInfo - Información de la campaña (tipo, hipódromo)
 * @param {Object} results - Resultados de carreras para detectar estado
 * @returns {string} HTML completo listo para html2canvas
 */
export function generateExportHTML(picks, raceCount, title, date, styleId = 'excel-classic', customColors = null, campaignInfo = null, results = null, groupings = null) {
  const colors = getExportStyleColors(styleId, customColors)
  const sorted = [...picks]

  // Detectar estado de la jornada
  const raceStatus = detectRaceStatus(results, raceCount)

  // Generar header dinámico
  const headerInfo = getHeaderInfo(campaignInfo, null, date)
  const headerText = generateHeaderText(headerInfo, raceStatus)
  const statusLabel = raceStatus.label
  const titleColor = styleId === 'blue-premium' ? '#64B5F6' : colors.headerBg

  function buildPickRows(entries) {
    return entries.map((entry, idx) => {
      const picksList = Array.isArray(entry?.picks) ? entry.picks : []
      const points = Number(entry?.points || entry?.score || 0)
      const picksRow = `
        <tr>
          <td style="width:35px;background:${colors.rowNumBg};color:${colors.rowNumText};padding:4px 4px;border:1px solid ${colors.headerBg};text-align:center;font-size:12px;font-weight:bold" rowspan="2">${idx + 1}</td>
          <td style="width:120px;background:${colors.studBg};padding:4px 8px;border:1px solid ${colors.studBorder};font-size:13px;font-weight:bold;white-space:nowrap;color:#000000" rowspan="2">${entry?.participant || entry?.name || ''}</td>
          <td style="width:65px;background:${colors.pointsBg};padding:4px 4px;border:1px solid ${colors.studBorder};text-align:center;font-size:14px;font-weight:bold;color:${colors.pointsText}" rowspan="2">${points % 1 === 0 ? points : points.toFixed(1)}</td>
          ${Array.from({ length: raceCount }, (_, i) => {
            const pickObj = picksList[i]
            const pick = (pickObj?.horse || pickObj?.pick || '').toString().trim()
            const hasPick = pick && pick !== '-' && pick !== '—'
            return `<td style="width:50px;background:${hasPick ? colors.pickBg : colors.emptyBg};padding:3px 3px;border:1px solid ${hasPick ? colors.pickBorder : colors.emptyBorder};text-align:center;font-size:13px;font-weight:bold;color:${hasPick ? colors.pickText : 'transparent'};height:14px">${hasPick ? pick : ''}</td>`
          }).join('')}
        </tr>
      `
      const divsRow = `
        <tr>
          ${Array.from({ length: raceCount }, (_, i) => {
            const pickObj = picksList[i]
            const divValue = pickObj?.score || pickObj?.dividendo || 0
            const hasDiv = divValue && divValue > 0
            return `<td style="width:50px;background:${hasDiv ? colors.divBg : colors.emptyBg};padding:3px 3px;border:1px solid ${hasDiv ? colors.divBg : colors.emptyBorder};text-align:center;font-size:10px;font-weight:bold;color:${hasDiv ? colors.divText : 'transparent'};height:14px">${hasDiv ? (divValue % 1 === 0 ? divValue : divValue.toFixed(1)) : ''}</td>`
          }).join('')}
        </tr>
      `
      return picksRow + divsRow
    }).join('')
  }

  function buildTable(entries) {
    const colspanHeader = raceCount + 3
    return `
      <table style="border-collapse:collapse;font-size:12px;font-weight:bold" cellpadding="0" cellspacing="0">
        <thead>
          <tr>
            <th style="width:35px;background:${colors.headerBg};color:${colors.headerText};padding:6px 4px;border:1px solid ${colors.headerBg};text-align:center;font-size:11px">N°</th>
            <th style="width:120px;background:${colors.headerBg};color:${colors.headerText};padding:6px 6px;border:1px solid ${colors.headerBg};text-align:left;font-size:12px">STUD</th>
            <th style="width:65px;background:${colors.headerBg};color:${colors.headerText};padding:6px 4px;border:1px solid ${colors.headerBg};text-align:center;font-size:11px">Pts</th>
            ${Array.from({ length: raceCount }, (_, i) => `
              <th style="width:50px;background:${colors.headerBg};color:${colors.headerText};padding:6px 3px;border:1px solid ${colors.headerBg};text-align:center;font-size:12px">${i + 1}</th>
            `).join('')}
          </tr>
        </thead>
        <tbody>${buildPickRows(entries)}</tbody>
      </table>
    `
  }

  // Build sections: grouped (duelos/parejas/grupos) or flat
  let tablesHtml = ''
  const hasGroupings = Array.isArray(groupings) && groupings.length > 0

  if (hasGroupings) {
    const picksByName = {}
    sorted.forEach(p => {
      const name = String(p?.participant || p?.name || '').trim()
      if (name) picksByName[name.toLowerCase()] = p
    })

    tablesHtml = groupings.map(section => {
      const sectionEntries = (section.members || [])
        .map(memberName => picksByName[memberName.toLowerCase()])
        .filter(Boolean)
      if (sectionEntries.length === 0) return ''

      return `
        <div style="margin-bottom:16px">
          <div style="font-size:13px;font-weight:bold;color:${colors.headerText};background:${colors.headerBg};padding:5px 10px;border-radius:4px 4px 0 0;letter-spacing:0.5px">
            ${section.name}
          </div>
          ${buildTable(sectionEntries)}
        </div>
      `
    }).join('')
  } else {
    tablesHtml = buildTable(sorted)
  }

  return `
    <div style="background:${colors.bg};font-family:Arial,Helvetica,sans-serif;padding:12px;width:max-content">
      <div style="text-align:center;margin-bottom:4px">
        <div style="font-size:16px;font-weight:bold;color:${titleColor};margin-bottom:2px">
          ${headerText}
        </div>
        <div style="font-size:13px;font-weight:bold;color:#10b981">
          ${statusLabel}
        </div>
      </div>
      ${tablesHtml}
      <div style="margin-top:8px;text-align:center;font-size:10px;color:#666">
        Polla Hípica • Generado automáticamente
      </div>
    </div>
  `
}
