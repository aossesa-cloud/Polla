/**
 * pickParser.js - Universal Pick Parser ULTRA PRO
 *
 * Parser inteligente que detecta automáticamente el formato de entrada
 * y extrae picks para 1 o más studs.
 *
 * Formatos soportados:
 * - Simple: "5 12 11 3 7" o "5,12,11,3,7"
 * - Vertical: líneas separadas por \n
 * - Indexado: "1a 6", "1)4", "1= 1", "1. 12"
 * - Multi-stud: "12-1", "6/3", "8+7", "1. 12-1"
 * - Mixto: combina formatos en un solo input
 */

// ============================================
// RESULTADO DEL PARSER
// ============================================
/**
 * @typedef {Object} ParseResult
 * @property {number} studCount - Cantidad de studs detectados (1 o 2)
 * @property {string[][]} studs - Array de arrays, cada uno con los picks del stud
 * @property {string} format - Formato detectado
 * @property {number} raceCount - Cantidad de carreras detectadas
 * @property {string[]} warnings - Advertencias de validación
 * @property {boolean} isValid - Si el resultado es válido
 */

// ============================================
// FUNCIONES AUXILIARES
// ============================================

/**
 * Limpia y normaliza el texto de entrada
 */
function cleanInput(text) {
  if (!text || typeof text !== 'string') return ''
  
  // Eliminar caracteres invisibles y normalizar espacios
  return text
    .replace(/[\u200B-\u200D\uFEFF]/g, '') // Zero-width chars
    .replace(/\r\n/g, '\n') // Windows line endings
    .replace(/\t/g, ' ') // Tabs to spaces
    .trim()
}

/**
 * Extrae solo los números de un token
 */
function extractNumbers(token) {
  const match = token.match(/\d+/g)
  return match ? match.map(Number) : []
}

/**
 * Detecta si una línea tiene formato multi-stud (separadores - / +)
 */
function isMultiStudSeparator(line) {
  // Patrones: "12-1", "6/3", "8+7", "12 - 1", "6 / 3"
  return /^[\d\s]+[\-\/+][\d\s]+$/.test(line.trim())
}

/**
 * Parsea una línea multi-stud y retorna [stud1Pick, stud2Pick]
 */
function parseMultiStudLine(line) {
  const trimmed = line.trim()
  
  // Intentar separadores: - / +
  const separators = ['-', '/', '+']
  
  for (const sep of separators) {
    if (trimmed.includes(sep)) {
      const parts = trimmed.split(sep).map(p => p.trim())
      if (parts.length === 2) {
        const nums1 = extractNumbers(parts[0])
        const nums2 = extractNumbers(parts[1])
        if (nums1.length > 0 && nums2.length > 0) {
          return [String(nums1[0]), String(nums2[0])]
        }
      }
    }
  }
  
  return null
}

/**
 * Detecta si una línea es formato simple (solo números separados por espacios/tabs/comas)
 * Esto debe detectarse ANTES que el formato indexado para evitar falsos positivos
 */
function isSimpleLine(line) {
  const trimmed = line.trim()
  // Debe contener solo números separados por espacios, tabs, comas, punto y coma o pipe
  // Debe tener al menos 2 números para ser considerado "simple line"
  return /^\s*\d+([\s,;|]+\d+)+\s*$/.test(trimmed)
}

/**
 * Detecta formato indexado: "1a 6", "1)4", "1= 1", "1. 12"
 * VERSIÓN ESTRICTA: requiere al menos un carácter separador entre índice y valor
 */
function isIndexedFormat(line) {
  const trimmed = line.trim()
  
  // Primero verificar que NO sea simple line
  if (isSimpleLine(line)) return false
  
  // Regex más estricto: requiere un separador específico después del índice
  // Formatos válidos: "1. 12", "1)6", "1a 4", "1= 1"
  // INVALIDO: "4 7" (simple line)
  return /^[\d]+[\.\)=a-zA-Z]+\s*\d+/i.test(trimmed) ||
         /^[\d]+[\.\)=a-zA-Z]+\d+/.test(trimmed)
}

/**
 * Parsea línea indexada y retorna el número (ignora el índice)
 */
function parseIndexedLine(line) {
  const trimmed = line.trim()
  // Extraer el último número de la línea (el pick real)
  const nums = extractNumbers(trimmed)
  if (nums.length >= 2) {
    // Formato "1. 12" → índice=1, pick=12
    return String(nums[nums.length - 1])
  } else if (nums.length === 1) {
    return String(nums[0])
  }
  return null
}

// ============================================
// PARSER PRINCIPAL
// ============================================

/**
 * Parser universal de pronósticos
 * @param {string} rawText - Texto crudo del textarea
 * @param {number} expectedRaces - Cantidad esperada de carreras (opcional)
 * @returns {ParseResult}
 */
export function parsePicks(rawText, expectedRaces = 12) {
  const cleaned = cleanInput(rawText)
  
  if (!cleaned) {
    return {
      studCount: 0,
      studs: [],
      format: 'empty',
      raceCount: 0,
      warnings: [],
      isValid: false
    }
  }
  
  const lines = cleaned.split('\n').filter(l => l.trim())
  const warnings = []
  
  // ============================================
  // ESTRATEGIA 1: Multi-stud detectado (separadores - / +)
  // ============================================
  const hasMultiStudLines = lines.some(isMultiStudSeparator)
  
  if (hasMultiStudLines) {
    const stud1 = []
    const stud2 = []
    let raceIndex = 0
    
    for (const line of lines) {
      const multiStud = parseMultiStudLine(line)
      if (multiStud) {
        stud1.push(multiStud[0])
        stud2.push(multiStud[1])
        raceIndex++
      } else {
        // Línea simple, asignar a stud1
        const nums = extractNumbers(line)
        if (nums.length > 0) {
          stud1.push(String(nums[0]))
          stud2.push('')
          raceIndex++
        }
      }
    }
    
    // Validar misma cantidad de carreras para ambos studs
    if (stud1.length !== stud2.length) {
      warnings.push(`Studs con diferente cantidad de carreras: Stud1=${stud1.length}, Stud2=${stud2.length}`)
    }
    
    return {
      studCount: 2,
      studs: [stud1, stud2],
      format: 'multi-stud',
      raceCount: Math.max(stud1.length, stud2.length),
      warnings,
      isValid: stud1.length > 0 || stud2.length > 0
    }
  }
  
  // ============================================
  // ESTRATEGIA 2: Formato simple en una línea (prioridad sobre indexado)
  // ============================================
  // Detectar ANTES que indexado para evitar falsos positivos con tabs
  const hasSimpleLine = lines.some(isSimpleLine)
  
  if (hasSimpleLine) {
    const picks = []
    
    for (const line of lines) {
      if (isSimpleLine(line)) {
        // Línea simple: extraer todos los números
        const tokens = line.trim().split(/[\s,;|]+/).filter(t => t && t !== '-')
        for (const token of tokens) {
          const nums = extractNumbers(token)
          if (nums.length > 0) {
            picks.push(String(nums[0]))
          }
        }
      } else {
        // Línea no-simple (puede ser vertical u otro formato)
        const nums = extractNumbers(line)
        if (nums.length > 0) {
          picks.push(String(nums[0]))
        }
      }
    }
    
    return {
      studCount: 1,
      studs: [picks],
      format: 'simple',
      raceCount: picks.length,
      warnings: picks.length !== expectedRaces ? [`Se detectaron ${picks.length} carreras (esperadas: ${expectedRaces})`] : [],
      isValid: picks.length > 0
    }
  }

  // ============================================
  // ESTRATEGIA 3: Formato indexado ("1. 12", "1)6", "1a 4")
  // ============================================
  const hasIndexedLines = lines.some(isIndexedFormat)

  if (hasIndexedLines) {
    const picks = []

    for (const line of lines) {
      const pick = parseIndexedLine(line)
      if (pick) {
        picks.push(pick)
      }
    }

    return {
      studCount: 1,
      studs: [picks],
      format: 'indexed',
      raceCount: picks.length,
      warnings: picks.length !== expectedRaces ? [`Se detectaron ${picks.length} carreras (esperadas: ${expectedRaces})`] : [],
      isValid: picks.length > 0
    }
  }

  // ============================================
  // ESTRATEGIA 4: Formato vertical (una línea = un pick)
  // ============================================
  if (lines.length > 1) {
    const picks = []
    
    for (const line of lines) {
      const nums = extractNumbers(line)
      if (nums.length > 0) {
        picks.push(String(nums[0]))
      }
    }
    
    return {
      studCount: 1,
      studs: [picks],
      format: 'vertical',
      raceCount: picks.length,
      warnings: picks.length !== expectedRaces ? [`Se detectaron ${picks.length} carreras (esperadas: ${expectedRaces})`] : [],
      isValid: picks.length > 0
    }
  }
  
  // ============================================
  // ESTRATEGIA 4: Formato simple (todos en una línea)
  // ============================================
  const firstLine = lines[0] || ''
  const tokens = firstLine.split(/[\s,;|]+/).filter(t => t && t !== '-')
  const picks = tokens.map(t => {
    const nums = extractNumbers(t)
    return nums.length > 0 ? String(nums[0]) : ''
  }).filter(Boolean)
  
  return {
    studCount: 1,
    studs: [picks],
    format: 'simple',
    raceCount: picks.length,
    warnings: picks.length !== expectedRaces ? [`Se detectaron ${picks.length} carreras (esperadas: ${expectedRaces})`] : [],
    isValid: picks.length > 0
  }
}

// ============================================
// VALIDACIONES
// ============================================

/**
 * Valida que los picks sean válidos (números, sin duplicados por carrera)
 */
export function validatePicks(picks, options = {}) {
  const { maxRace = 30, allowEmpty = true } = options
  const warnings = []
  const errors = []
  
  picks.forEach((pick, index) => {
    if (!pick || pick === '') {
      if (!allowEmpty) {
        errors.push(`Carrera ${index + 1}: Pick vacío`)
      }
      return
    }
    
    const num = parseInt(pick)
    if (isNaN(num)) {
      errors.push(`Carrera ${index + 1}: "${pick}" no es un número válido`)
      return
    }
    
    if (num < 1 || num > maxRace) {
      warnings.push(`Carrera ${index + 1}: Pick ${num} fuera de rango (1-${maxRace})`)
    }
  })
  
  return { warnings, errors, isValid: errors.length === 0 }
}

// ============================================
// UTILIDADES DE EXPORTACIÓN
// ============================================

/**
 * Convierte picks a formato para guardar en API
 */
export function formatPicksForAPI(picks) {
  return picks.map(p => String(p || '').trim())
}

/**
 * Genera preview de picks para mostrar al usuario
 */
export function generatePicksPreview(studs, studCount) {
  if (studCount === 1) {
    return studs[0].join(' · ') || 'Sin picks'
  }
  return studs.map((s, i) => `Stud${i + 1}: ${s.join(' · ') || 'vacío'}`).join(' | ')
}
