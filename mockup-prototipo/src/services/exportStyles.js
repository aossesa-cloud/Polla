/**
 * exportStyles.js
 *
 * Definicion de estilos de exportacion PNG disponibles para campanas.
 * Cada campana puede elegir su estilo preferido.
 */

import { detectRaceStatus, getHeaderInfo, generateHeaderText } from './raceStatus'

const LIGHT_GRID = '#1F2937'
const LIGHT_PICK = '#F28C38'
const LIGHT_DIV = '#1E6B32'
const LIGHT_DIV_TEXT = '#FFF35A'

export const EXPORT_STYLES = {
  EXCEL_CLASSIC: {
    id: 'excel-classic',
    name: 'Excel Clasico',
    description: 'Fondo blanco, encabezado azul, picks naranjas y dividendos verdes. Ideal para WhatsApp.',
    colors: {
      bg: '#FFFFFF',
      surfaceBg: '#FFFFFF',
      headerBg: '#223E99',
      headerText: '#FFFFFF',
      titleText: '#223E99',
      subtitleText: '#16A34A',
      sectionBg: '#223E99',
      sectionText: '#FFFFFF',
      pickBg: LIGHT_PICK,
      pickBorder: LIGHT_GRID,
      pickText: '#111111',
      divBg: LIGHT_DIV,
      divText: LIGHT_DIV_TEXT,
      emptyBg: '#FFFFFF',
      emptyBorder: LIGHT_GRID,
      studBg: '#FFFFFF',
      studText: '#111111',
      studBorder: LIGHT_GRID,
      pointsBg: '#FFFFFF',
      pointsText: '#1F4E79',
      rowNumBg: '#F28C38',
      rowNumText: '#FFFFFF',
      tableBorder: LIGHT_GRID,
    },
  },
  MINIMAL_WHITE: {
    id: 'minimal-white',
    name: 'Minimalista Blanco',
    description: 'Ultra limpio, bordes finos, estilo Excel moderno.',
    colors: {
      bg: '#FFFFFF',
      surfaceBg: '#FFFFFF',
      headerBg: '#E5E7EB',
      headerText: '#111111',
      titleText: '#1D4ED8',
      subtitleText: '#16A34A',
      sectionBg: '#F3F4F6',
      sectionText: '#111111',
      pickBg: '#FFD7A3',
      pickBorder: '#9CA3AF',
      pickText: '#111111',
      divBg: LIGHT_DIV,
      divText: LIGHT_DIV_TEXT,
      emptyBg: '#FFFFFF',
      emptyBorder: '#B8C0CC',
      studBg: '#FFFFFF',
      studText: '#111111',
      studBorder: '#B8C0CC',
      pointsBg: '#FFFFFF',
      pointsText: '#333333',
      rowNumBg: '#FAFAFA',
      rowNumText: '#111111',
      tableBorder: '#B8C0CC',
    },
  },
  COMPACT_DENSE: {
    id: 'compact-dense',
    name: 'Compacto Dense',
    description: 'Mas compacto, celdas pequenas. Mas filas visibles.',
    colors: {
      bg: '#FFFFFF',
      surfaceBg: '#FFFFFF',
      headerBg: '#2C5282',
      headerText: '#FFFFFF',
      titleText: '#2C5282',
      subtitleText: '#16A34A',
      sectionBg: '#2C5282',
      sectionText: '#FFFFFF',
      pickBg: '#F6AD55',
      pickBorder: '#DD6B20',
      pickText: '#111111',
      divBg: LIGHT_DIV,
      divText: LIGHT_DIV_TEXT,
      emptyBg: '#FFFFFF',
      emptyBorder: '#94A3B8',
      studBg: '#FFFFFF',
      studText: '#111111',
      studBorder: '#94A3B8',
      pointsBg: '#FFFFFF',
      pointsText: '#2C5282',
      rowNumBg: '#2C5282',
      rowNumText: '#FFFFFF',
      tableBorder: '#94A3B8',
    },
  },
  BLUE_PREMIUM: {
    id: 'blue-premium',
    name: 'Azul Oscuro Premium',
    description: 'Fondo oscuro elegante. Para pantallas y presentaciones.',
    colors: {
      bg: '#1E3A5F',
      surfaceBg: '#1A3A54',
      headerBg: '#0F2940',
      headerText: '#64B5F6',
      titleText: '#64B5F6',
      subtitleText: '#10B981',
      sectionBg: '#142E44',
      sectionText: '#FFFFFF',
      pickBg: '#FF8F00',
      pickBorder: '#FF8F00',
      pickText: '#111111',
      divBg: '#1565C0',
      divText: '#BBDEFB',
      emptyBg: '#1A3A54',
      emptyBorder: '#37474F',
      studBg: '#1A3A54',
      studText: '#FFFFFF',
      studBorder: '#37474F',
      pointsBg: '#1A3A54',
      pointsText: '#FFB74D',
      rowNumBg: '#142E44',
      rowNumText: '#FFFFFF',
      tableBorder: '#37474F',
    },
  },
  HIPODROMO_CLASSIC: {
    id: 'hipodromo-classic',
    name: 'Hipodromo Clasico',
    description: 'Rojo y verde competitivo. Mas cercano al look tradicional de tablas impresas.',
    colors: {
      bg: '#FFFFFF',
      surfaceBg: '#FFFFFF',
      headerBg: '#A40012',
      headerText: '#FFFFFF',
      titleText: '#A40012',
      subtitleText: '#16A34A',
      sectionBg: '#5C0012',
      sectionText: '#FFFFFF',
      pickBg: LIGHT_PICK,
      pickBorder: LIGHT_GRID,
      pickText: '#111111',
      divBg: LIGHT_DIV,
      divText: LIGHT_DIV_TEXT,
      emptyBg: '#FFFFFF',
      emptyBorder: LIGHT_GRID,
      studBg: '#FFFFFF',
      studText: '#111111',
      studBorder: LIGHT_GRID,
      pointsBg: '#FFFFFF',
      pointsText: '#8B0000',
      rowNumBg: '#F28C38',
      rowNumText: '#FFFFFF',
      tableBorder: LIGHT_GRID,
    },
  },
  CLEAR_BOARD_RED: {
    id: 'clear-board-red',
    name: 'Tablero Claro Rojo',
    description: 'Muy claro y competitivo. Encabezado rojo, picks naranjas y dividendos verdes.',
    colors: {
      bg: '#FFFFFF',
      surfaceBg: '#FFFFFF',
      headerBg: '#F20D0D',
      headerText: '#FFFFFF',
      titleText: '#B10303',
      subtitleText: '#16A34A',
      sectionBg: '#6B0014',
      sectionText: '#FFFFFF',
      pickBg: LIGHT_PICK,
      pickBorder: LIGHT_GRID,
      pickText: '#111111',
      divBg: LIGHT_DIV,
      divText: LIGHT_DIV_TEXT,
      emptyBg: '#FFFFFF',
      emptyBorder: LIGHT_GRID,
      studBg: '#FFFFFF',
      studText: '#111111',
      studBorder: LIGHT_GRID,
      pointsBg: '#FFFFFF',
      pointsText: '#111111',
      rowNumBg: '#F28C38',
      rowNumText: '#FFFFFF',
      tableBorder: LIGHT_GRID,
    },
  },
  CLEAR_BOARD_BLUE: {
    id: 'clear-board-blue',
    name: 'Tablero Claro Azul',
    description: 'Version limpia tipo planilla clasica con encabezado azul y alta legibilidad.',
    colors: {
      bg: '#FFFFFF',
      surfaceBg: '#FFFFFF',
      headerBg: '#2339A7',
      headerText: '#FFFFFF',
      titleText: '#2339A7',
      subtitleText: '#16A34A',
      sectionBg: '#2339A7',
      sectionText: '#FFFFFF',
      pickBg: LIGHT_PICK,
      pickBorder: LIGHT_GRID,
      pickText: '#111111',
      divBg: LIGHT_DIV,
      divText: LIGHT_DIV_TEXT,
      emptyBg: '#FFFFFF',
      emptyBorder: LIGHT_GRID,
      studBg: '#FFFFFF',
      studText: '#111111',
      studBorder: LIGHT_GRID,
      pointsBg: '#FFFFFF',
      pointsText: '#111111',
      rowNumBg: '#F28C38',
      rowNumText: '#FFFFFF',
      tableBorder: LIGHT_GRID,
    },
  },
  CUSTOM: {
    id: 'custom',
    name: 'Personalizado',
    description: 'Elige tus propios colores para cada elemento.',
    preview: '🎨',
    recommended: false,
    isCustom: true,
  },
}

export function getExportStylesArray() {
  return Object.values(EXPORT_STYLES)
}

export function getExportStyleById(id) {
  return Object.values(EXPORT_STYLES).find((style) => style.id === id) || EXPORT_STYLES.EXCEL_CLASSIC
}

function withDefaults(base = {}) {
  return {
    bg: base.bg || '#FFFFFF',
    surfaceBg: base.surfaceBg || base.bg || '#FFFFFF',
    headerBg: base.headerBg || '#1F4E79',
    headerText: base.headerText || '#FFFFFF',
    titleText: base.titleText || base.headerBg || '#1F4E79',
    subtitleText: base.subtitleText || '#16A34A',
    sectionBg: base.sectionBg || base.headerBg || '#1F4E79',
    sectionText: base.sectionText || base.headerText || '#FFFFFF',
    pickBg: base.pickBg || '#F4B183',
    pickBorder: base.pickBorder || '#E8913A',
    pickText: base.pickText || '#111111',
    divBg: base.divBg || '#2F5496',
    divText: base.divText || '#FFFFFF',
    emptyBg: base.emptyBg || '#FFFFFF',
    emptyBorder: base.emptyBorder || '#D9D9D9',
    studBg: base.studBg || '#FFFFFF',
    studText: base.studText || '#111111',
    studBorder: base.studBorder || '#D9D9D9',
    pointsBg: base.pointsBg || '#FFFFFF',
    pointsText: base.pointsText || '#1F4E79',
    rowNumBg: base.rowNumBg || '#1F4E79',
    rowNumText: base.rowNumText || '#FFFFFF',
    tableBorder: base.tableBorder || base.studBorder || '#D9D9D9',
  }
}

export function getExportStyleColors(styleId, customColors = null) {
  if (styleId === 'custom' && customColors) {
    return withDefaults(customColors)
  }

  const style = getExportStyleById(styleId)
  return withDefaults(style.colors)
}

function formatValue(value) {
  if (value === undefined || value === null || value === '') return ''
  const number = Number(value)
  if (!Number.isFinite(number)) return String(value)
  return number % 1 === 0 ? String(number) : number.toFixed(1).replace('.', ',')
}

function buildCellStyles(colors, overrides = '') {
  return `border:1px solid ${colors.tableBorder};${overrides}`
}

export function generateExportHTML(
  picks,
  raceCount,
  title,
  date,
  styleId = 'excel-classic',
  customColors = null,
  campaignInfo = null,
  results = null,
  groupings = null,
) {
  const colors = getExportStyleColors(styleId, customColors)
  const sorted = [...(picks || [])]
  const raceStatus = detectRaceStatus(results, raceCount)
  const headerInfo = getHeaderInfo(campaignInfo, null, date)
  const headerText = generateHeaderText(headerInfo, raceStatus)
  const statusLabel = raceStatus.label
  const compactLayout = raceCount >= 16 || sorted.length >= 16
  const compactHeaderText = headerText.replace(/^🏇\s*/, '')
  const columnWidths = {
    row: compactLayout ? 28 : 38,
    stud: compactLayout ? 180 : 250,
    points: compactLayout ? 76 : 110,
    pick: compactLayout ? 36 : 48,
  }
  const tableWidth =
    columnWidths.row +
    columnWidths.stud +
    columnWidths.points +
    raceCount * columnWidths.pick
  const sectionGap = compactLayout ? 6 : 18
  const outerPadding = compactLayout ? '3px 3px 2px' : '10px 10px 8px'
  const titleFont = compactLayout ? 11 : 18
  const subtitleFont = compactLayout ? 10 : 13
  const headerSpacing = compactLayout ? 3 : 8
  const tableBodyFont = compactLayout ? 13 : 15
  const tableHeaderFont = compactLayout ? 13 : 15
  const dividendsFont = compactLayout ? 11 : 13

  function buildPickRows(entries) {
    return entries
      .map((entry, idx) => {
        const picksList = Array.isArray(entry?.picks) ? entry.picks : []
        const points = Number(entry?.points || entry?.score || 0)

        const picksRow = `
          <tr>
            <td style="${buildCellStyles(colors, `width:${columnWidths.row}px;background:${colors.rowNumBg};color:${colors.rowNumText};padding:${compactLayout ? '2px 2px' : '5px 4px'};text-align:center;font-size:${tableBodyFont}px;font-weight:800;`)}" rowspan="2">${idx + 1}</td>
            <td style="${buildCellStyles(colors, `width:${columnWidths.stud}px;background:${colors.studBg};color:${colors.studText};padding:${compactLayout ? '2px 4px' : '5px 8px'};text-align:center;font-size:${tableBodyFont}px;font-weight:800;white-space:nowrap;`)}" rowspan="2">${entry?.participant || entry?.name || ''}</td>
            <td style="${buildCellStyles(colors, `width:${columnWidths.points}px;background:${colors.pointsBg};color:${colors.pointsText};padding:${compactLayout ? '2px 2px' : '5px 4px'};text-align:center;font-size:${tableBodyFont}px;font-weight:800;`)}" rowspan="2">${formatValue(points)}</td>
            ${Array.from({ length: raceCount }, (_, i) => {
              const pickObj = picksList[i]
              const pick = (pickObj?.horse || pickObj?.pick || '').toString().trim()
              const hasPick = pick && pick !== '-' && pick !== '—'
              return `<td style="${buildCellStyles(colors, `width:${columnWidths.pick}px;background:${hasPick ? colors.pickBg : colors.emptyBg};color:${hasPick ? colors.pickText : 'transparent'};padding:${compactLayout ? '2px 1px' : '4px 3px'};text-align:center;font-size:${tableBodyFont}px;font-weight:800;height:${compactLayout ? 15 : 20}px;`)}">${hasPick ? pick : ''}</td>`
            }).join('')}
          </tr>
        `

        const divsRow = `
          <tr>
            ${Array.from({ length: raceCount }, (_, i) => {
              const pickObj = picksList[i]
              const divValue = pickObj?.score || pickObj?.dividendo || 0
              const hasDiv = Number(divValue) > 0
              return `<td style="${buildCellStyles(colors, `width:${columnWidths.pick}px;background:${hasDiv ? colors.divBg : colors.emptyBg};color:${hasDiv ? colors.divText : 'transparent'};padding:${compactLayout ? '1px 1px' : '3px 3px'};text-align:center;font-size:${dividendsFont}px;font-weight:800;height:${compactLayout ? 13 : 18}px;`)}">${hasDiv ? formatValue(divValue) : ''}</td>`
            }).join('')}
          </tr>
        `

        return picksRow + divsRow
      })
      .join('')
  }

  function buildTable(entries) {
    return `
      <table style="width:${tableWidth}px;border-collapse:collapse;font-size:${tableBodyFont}px;font-weight:bold;background:${colors.surfaceBg};box-shadow:0 0 0 1px ${colors.tableBorder} inset" cellpadding="0" cellspacing="0">
        <thead>
          <tr>
            <th style="${buildCellStyles(colors, `width:${columnWidths.row}px;background:${colors.headerBg};color:${colors.headerText};padding:${compactLayout ? '3px 2px' : '6px 4px'};text-align:center;font-size:${tableHeaderFont}px;font-weight:800;`)}">N°</th>
            <th style="${buildCellStyles(colors, `width:${columnWidths.stud}px;background:${colors.headerBg};color:${colors.headerText};padding:${compactLayout ? '3px 4px' : '6px 8px'};text-align:center;font-size:${tableHeaderFont}px;font-weight:800;`)}">STUD</th>
            <th style="${buildCellStyles(colors, `width:${columnWidths.points}px;background:${colors.headerBg};color:${colors.headerText};padding:${compactLayout ? '3px 2px' : '6px 4px'};text-align:center;font-size:${tableHeaderFont}px;font-weight:800;`)}">Puntos</th>
            ${Array.from({ length: raceCount }, (_, i) => `<th style="${buildCellStyles(colors, `width:${columnWidths.pick}px;background:${colors.headerBg};color:${colors.headerText};padding:${compactLayout ? '3px 1px' : '6px 2px'};text-align:center;font-size:${tableHeaderFont}px;font-weight:800;`)}">${i + 1}</th>`).join('')}
          </tr>
        </thead>
        <tbody>${buildPickRows(entries)}</tbody>
      </table>
    `
  }

  let tablesHtml = ''
  const hasGroupings = Array.isArray(groupings) && groupings.length > 0

  if (hasGroupings) {
    const picksByName = {}
    sorted.forEach((pickEntry) => {
      const name = String(pickEntry?.participant || pickEntry?.name || '').trim()
      if (name) picksByName[name.toLowerCase()] = pickEntry
    })

    tablesHtml = groupings
      .map((section) => {
        const sectionEntries = (section.members || [])
          .map((memberName) => picksByName[String(memberName).toLowerCase()])
          .filter(Boolean)

        if (sectionEntries.length === 0) return ''

        return `
          <div style="margin-bottom:${sectionGap}px">
            <div style="font-size:${compactLayout ? 11 : 13}px;font-weight:800;color:${colors.sectionText};background:${colors.sectionBg};padding:${compactLayout ? '3px 6px' : '6px 10px'};border:1px solid ${colors.tableBorder};border-bottom:none;letter-spacing:0.3px;width:${tableWidth}px;box-sizing:border-box;">
              ${section.name}
            </div>
            ${buildTable(sectionEntries)}
          </div>
        `
      })
      .join('')
  } else {
    tablesHtml = buildTable(sorted)
  }

  return `
    <div style="background:${colors.bg};font-family:Calibri,'Segoe UI',Arial,Helvetica,sans-serif;padding:${outerPadding};width:max-content">
      <div style="text-align:center;margin-bottom:${headerSpacing}px">
        ${compactLayout
          ? `<div style="font-size:${titleFont}px;font-weight:800;color:${colors.titleText};line-height:1.1;">${compactHeaderText}</div>
             <div style="font-size:${subtitleFont}px;font-weight:800;color:${colors.subtitleText};margin-top:1px;">${statusLabel}</div>`
          : `<div style="font-size:${titleFont}px;font-weight:800;color:${colors.titleText};margin-bottom:3px;line-height:1.15;">${headerText}</div>
             <div style="font-size:${subtitleFont}px;font-weight:800;color:${colors.subtitleText};">${statusLabel}</div>`}
      </div>
      ${tablesHtml}
    </div>
  `
}
