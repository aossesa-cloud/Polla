/**
 * html2canvasHelper.js
 *
 * Workaround para html2canvas que no soporta color-mix() ni color() (CSS Color Level 4).
 * Chrome resuelve color-mix() como color(srgb ...) en estilos computados,
 * lo que rompe html2canvas al parsear.
 *
 * Estrategia: en onclone, reemplazar color-mix() con estilos inline seguros
 * usando el valor base de la mezcla (primer argumento).
 */

const UNSAFE_COLOR_RE = /\bcolor-mix\s*\(|color\s*\(|oklch\s*\(|oklab\s*\(|lch\s*\(|lab\s*\(/

function getFallbackFromColorMix(value) {
  // color-mix(in srgb, #hex XX%, ...) → use #hex as fallback
  const m = value.match(/color-mix\s*\([^,]+,\s*(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)|var\([^)]+\)|[a-z]+)\s+\d/)
  if (m) return m[1]
  return null
}

function sanitizeElementStyles(el, doc) {
  if (!el.style) return
  const propsToCheck = ['background', 'background-color', 'color', 'border-color',
    'border-top-color', 'border-bottom-color', 'border-left-color', 'border-right-color',
    'outline-color', 'box-shadow']

  propsToCheck.forEach(prop => {
    const val = el.style.getPropertyValue(prop)
    if (val && UNSAFE_COLOR_RE.test(val)) {
      const fallback = getFallbackFromColorMix(val)
      if (fallback && !fallback.startsWith('var(')) {
        el.style.setProperty(prop, fallback, el.style.getPropertyPriority(prop))
      } else {
        el.style.removeProperty(prop)
      }
    }
  })
}

function sanitizeStylesheets(doc) {
  try {
    Array.from(doc.styleSheets).forEach(sheet => {
      try {
        const rules = Array.from(sheet.cssRules || [])
        const toDelete = []

        rules.forEach((rule, idx) => {
          if (!rule.style) return
          const propsToClean = Array.from(rule.style).filter(prop => {
            const val = rule.style.getPropertyValue(prop)
            return val && UNSAFE_COLOR_RE.test(val)
          })
          if (propsToClean.length === 0) return

          // Try to replace with fallback inline style on matched elements
          try {
            const selector = rule.selectorText
            if (selector) {
              doc.querySelectorAll(selector).forEach(el => {
                propsToClean.forEach(prop => {
                  const val = rule.style.getPropertyValue(prop)
                  const fallback = getFallbackFromColorMix(val)
                  if (fallback && !fallback.startsWith('var(')) {
                    if (!el.style.getPropertyValue(prop)) {
                      el.style.setProperty(prop, fallback)
                    }
                  }
                })
              })
            }
          } catch {}

          // Remove the problematic properties from the rule
          propsToClean.forEach(prop => {
            try { rule.style.removeProperty(prop) } catch {}
          })
        })
      } catch {}
    })
  } catch {}
}

function sanitizeClonedDoc(clonedDoc) {
  sanitizeStylesheets(clonedDoc)
  clonedDoc.querySelectorAll('[style]').forEach(el => sanitizeElementStyles(el, clonedDoc))
}

export function html2canvasOptions(extra = {}) {
  const { onclone: extraOnclone, ...rest } = extra
  return {
    useCORS: true,
    logging: false,
    onclone: (clonedDoc) => {
      sanitizeClonedDoc(clonedDoc)
      if (extraOnclone) extraOnclone(clonedDoc)
    },
    ...rest,
  }
}
