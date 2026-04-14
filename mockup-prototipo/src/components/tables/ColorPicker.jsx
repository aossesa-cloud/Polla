/**
 * ColorPicker.jsx
 * 
 * Color picker profesional con:
 * - Selector grande de gradiente (tono + brillo)
 * - Slider de matiz (rainbow)
 * - Cuentagotas (eyedropper)
 * - Inputs RGB y HEX
 */

import React, { useState, useCallback, useRef, useEffect } from 'react'

/**
 * Convertir HSV a RGB
 */
function hsvToRgb(h, s, v) {
  const i = Math.floor(h * 6)
  const f = h * 6 - i
  const p = v * (1 - s)
  const q = v * (1 - f * s)
  const t = v * (1 - (1 - f) * s)
  const mod = i % 6

  const r = Math.round([v, q, p, p, t, v][mod] * 255)
  const g = Math.round([t, v, v, q, p, p][mod] * 255)
  const b = Math.round([p, p, t, v, v, q][mod] * 255)

  return { r, g, b }
}

/**
 * Convertir RGB a HSV
 */
function rgbToHsv(r, g, b) {
  r /= 255
  g /= 255
  b /= 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const d = max - min

  let h = 0
  let s = max === 0 ? 0 : d / max
  const v = max

  if (max !== min) {
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
      default: break
    }
  }

  return { h, s, v }
}

/**
 * Convertir RGB a HEX
 */
function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')
}

/**
 * Convertir HEX a RGB
 */
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null
}

export default function ColorPicker({ value = '#FFFFFF', onChange }) {
  const pickerRef = useRef(null)
  const hueSliderRef = useRef(null)

  // Estado interno
  const [hsv, setHsv] = useState(() => {
    const rgb = hexToRgb(value) || { r: 255, g: 255, b: 255 }
    return rgbToHsv(rgb.r, rgb.g, rgb.b)
  })

  const [hexInput, setHexInput] = useState(value)
  const [rgbInput, setRgbInput] = useState(() => {
    const rgb = hexToRgb(value) || { r: 255, g: 255, b: 255 }
    return rgb
  })

  // Actualizar estado interno cuando cambia el valor externo
  useEffect(() => {
    if (value !== hexInput) {
      const rgb = hexToRgb(value) || { r: 255, g: 255, b: 255 }
      setHsv(rgbToHsv(rgb.r, rgb.g, rgb.b))
      setRgbInput(rgb)
      setHexInput(value)
    }
  }, [value])

  // Actualizar valor externo
  const updateColor = useCallback((newRgb) => {
    const hex = rgbToHex(newRgb.r, newRgb.g, newRgb.b)
    setRgbInput(newRgb)
    setHexInput(hex)
    setHsv(rgbToHsv(newRgb.r, newRgb.g, newRgb.b))
    onChange?.(hex)
  }, [onChange])

  // Drag en el picker principal
  const handlePickerDrag = useCallback((e) => {
    if (!pickerRef.current) return

    const rect = pickerRef.current.getBoundingClientRect()
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height))

    const rgb = hsvToRgb(hsv.h, x, 1 - y)
    updateColor(rgb)
  }, [hsv.h, updateColor])

  // Drag en el hue slider
  const handleHueDrag = useCallback((e) => {
    if (!hueSliderRef.current) return

    const rect = hueSliderRef.current.getBoundingClientRect()
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))

    const rgb = hsvToRgb(x, hsv.s, hsv.v)
    updateColor(rgb)
  }, [hsv.s, hsv.v, updateColor])

  // Mouse events para picker
  const handlePickerMouseDown = useCallback((e) => {
    e.preventDefault()
    handlePickerDrag(e)
    
    const handleMouseMove = (e) => handlePickerDrag(e)
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
    
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [handlePickerDrag])

  // Mouse events para hue slider
  const handleHueMouseDown = useCallback((e) => {
    e.preventDefault()
    handleHueDrag(e)
    
    const handleMouseMove = (e) => handleHueDrag(e)
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
    
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [handleHueDrag])

  // Touch events para picker
  const handlePickerTouchStart = useCallback((e) => {
    const touch = e.touches[0]
    handlePickerDrag({ clientX: touch.clientX, clientY: touch.clientY })
    
    const handleTouchMove = (e) => {
      const touch = e.touches[0]
      handlePickerDrag({ clientX: touch.clientX, clientY: touch.clientY })
    }
    
    document.addEventListener('touchmove', handleTouchMove)
    document.addEventListener('touchend', () => {
      document.removeEventListener('touchmove', handleTouchMove)
    }, { once: true })
  }, [handlePickerDrag])

  // Touch events para hue slider
  const handleHueTouchStart = useCallback((e) => {
    const touch = e.touches[0]
    handleHueDrag({ clientX: touch.clientX, clientY: touch.clientY })
    
    const handleTouchMove = (e) => {
      const touch = e.touches[0]
      handleHueDrag({ clientX: touch.clientX, clientY: touch.clientY })
    }
    
    document.addEventListener('touchmove', handleTouchMove)
    document.addEventListener('touchend', () => {
      document.removeEventListener('touchmove', handleTouchMove)
    }, { once: true })
  }, [handleHueDrag])

  // Actualizar desde input HEX
  const handleHexChange = useCallback((e) => {
    const hex = e.target.value
    setHexInput(hex)
    
    if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
      const rgb = hexToRgb(hex)
      if (rgb) {
        updateColor(rgb)
      }
    }
  }, [updateColor])

  // Actualizar desde inputs RGB
  const handleRgbChange = useCallback((channel, value) => {
    const num = Math.max(0, Math.min(255, parseInt(value) || 0))
    const newRgb = { ...rgbInput, [channel]: num }
    updateColor(newRgb)
  }, [rgbInput, updateColor])

  // Copiar con cuentagotas (si está soportado)
  const handleEyedropper = useCallback(async () => {
    if (!window.EyeDropper) {
      alert('El cuentagotas no está soportado en este navegador')
      return
    }

    try {
      const eyeDropper = new EyeDropper()
      const result = await eyeDropper.open()
      updateColor(hexToRgb(result.sRGBHex))
    } catch (err) {
      // Usuario canceló
    }
  }, [updateColor])

  const { r, g, b } = rgbInput

  return (
    <div style={{
      background: '#1f2937',
      borderRadius: '8px',
      padding: '12px',
      border: '1px solid #374151',
    }}>
      {/* Picker principal */}
      <div
        ref={pickerRef}
        onMouseDown={handlePickerMouseDown}
        onTouchStart={handlePickerTouchStart}
        style={{
          width: '100%',
          height: '180px',
          borderRadius: '4px',
          cursor: 'crosshair',
          position: 'relative',
          background: `linear-gradient(to bottom, transparent, black), 
                      linear-gradient(to right, white, hsl(${hsv.h * 360}, 100%, 50%))`,
          marginBottom: '12px',
        }}
      >
        {/* Cursor del picker */}
        <div style={{
          position: 'absolute',
          left: `${hsv.s * 100}%`,
          top: `${(1 - hsv.v) * 100}%`,
          transform: 'translate(-50%, -50%)',
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          border: '3px solid white',
          boxShadow: '0 0 0 1px rgba(0,0,0,0.3), inset 0 0 0 1px rgba(0,0,0,0.3)',
          pointerEvents: 'none',
        }} />
      </div>

      {/* Hue slider */}
      <div
        ref={hueSliderRef}
        onMouseDown={handleHueMouseDown}
        onTouchStart={handleHueTouchStart}
        style={{
          width: '100%',
          height: '16px',
          borderRadius: '8px',
          cursor: 'pointer',
          position: 'relative',
          marginBottom: '12px',
          background: 'linear-gradient(to right, red, yellow, lime, cyan, blue, magenta, red)',
        }}
      >
        {/* Cursor del hue */}
        <div style={{
          position: 'absolute',
          left: `${hsv.h * 100}%`,
          top: '50%',
          transform: 'translate(-50%, -50%)',
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          border: '3px solid white',
          boxShadow: '0 0 0 1px rgba(0,0,0,0.3)',
          pointerEvents: 'none',
        }} />
      </div>

      {/* Controles inferiores */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        {/* Cuentagotas */}
        {window.EyeDropper && (
          <button
            onClick={handleEyedropper}
            style={{
              width: '32px',
              height: '32px',
              border: '1px solid #374151',
              borderRadius: '4px',
              background: '#111827',
              color: '#e5e7eb',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
            }}
            title="Cuentagotas"
          >
            💧
          </button>
        )}

        {/* Color actual */}
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          border: '2px solid #374151',
          background: value,
          flexShrink: 0,
        }} />

        {/* Inputs RGB */}
        <div style={{ display: 'flex', gap: '6px', flex: 1 }}>
          {['r', 'g', 'b'].map(channel => (
            <div key={channel} style={{ flex: 1 }}>
              <div style={{
                fontSize: '10px',
                color: '#6b7280',
                textAlign: 'center',
                marginBottom: '2px',
                textTransform: 'uppercase',
              }}>
                {channel}
              </div>
              <input
                type="number"
                min="0"
                max="255"
                value={rgbInput[channel]}
                onChange={e => handleRgbChange(channel, e.target.value)}
                style={{
                  width: '100%',
                  padding: '4px',
                  background: '#111827',
                  border: '1px solid #374151',
                  borderRadius: '4px',
                  color: '#e5e7eb',
                  fontSize: '12px',
                  textAlign: 'center',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          ))}
        </div>

        {/* Input HEX */}
        <div style={{ width: '100px' }}>
          <div style={{
            fontSize: '10px',
            color: '#6b7280',
            marginBottom: '2px',
          }}>
            HEX
          </div>
          <input
            type="text"
            value={hexInput}
            onChange={handleHexChange}
            style={{
              width: '100%',
              padding: '4px',
              background: '#111827',
              border: '1px solid #374151',
              borderRadius: '4px',
              color: '#e5e7eb',
              fontSize: '12px',
              fontFamily: 'monospace',
              textAlign: 'center',
              boxSizing: 'border-box',
            }}
          />
        </div>
      </div>
    </div>
  )
}
