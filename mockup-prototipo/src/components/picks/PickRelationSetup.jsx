/**
 * PickRelationSetup.jsx
 *
 * Formulario dinámico que configura relaciones especiales:
 * - pareja (modo pairs)
 * - grupo (modo groups)
 * - contrincante (modo head-to-head)
 *
 * Un solo componente adaptable. No se duplica por modo.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import styles from '../PickEntry.module.css'

const RELATION_CONFIG = {
  pair: {
    title: '¿Quién es tu pareja?',
    placeholder: 'Nombre de tu pareja',
    searchPlaceholder: 'Buscar participante...',
    emptyLabel: 'No quedan participantes libres',
    hint: 'Esta relación se guarda para toda la competencia. Se asigna una vez y se reutiliza.'
  },
  group: {
    title: '¿A qué grupo perteneces?',
    placeholder: 'Selecciona tu grupo',
    searchPlaceholder: 'Buscar grupo...',
    emptyLabel: 'Sin grupos disponibles',
    hint: 'Esta asignación se guarda para toda la competencia.'
  },
  opponent: {
    title: '¿Quién es tu contrincante?',
    placeholder: 'Nombre de tu contrincante',
    searchPlaceholder: 'Buscar participante...',
    emptyLabel: 'No quedan contrincantes libres',
    hint: 'Esta relación se guarda para toda la competencia.'
  },
  'daily-opponent': {
    title: '¿Contra quién es el duelo de hoy?',
    placeholder: 'Selecciona rival del día',
    searchPlaceholder: 'Buscar rival...',
    emptyLabel: 'No hay rivales disponibles',
    hint: 'Esta asignación se guarda solo para esta jornada.',
    saveLabel: 'Guardar duelo'
  }
}

export default function PickRelationSetup({
  relationType,
  options,
  participantName,
  onSave,
  initialValue = '',
}) {
  const [value, setValue] = useState(initialValue)
  const config = RELATION_CONFIG[relationType] || RELATION_CONFIG.pair
  const hasOptionList = Array.isArray(options)

  useEffect(() => {
    setValue(initialValue || '')
  }, [initialValue])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!value.trim()) return
    onSave(participantName, relationType, value.trim())
  }

  return (
    <div className={styles.relationSetup}>
      <h3 className={styles.relationTitle}>{config.title}</h3>
      <form onSubmit={handleSubmit}>
        {hasOptionList ? (
          <SearchableRelationSelect
            value={value}
            options={options}
            onChange={setValue}
            placeholder={config.searchPlaceholder || config.placeholder}
            emptyLabel={config.emptyLabel}
          />
        ) : (
          <input
            className={styles.relationInput}
            type="text"
            value={value}
            onChange={e => setValue(e.target.value)}
            placeholder={config.placeholder}
            autoFocus
          />
        )}
        <p className={styles.relationHint}>{config.hint}</p>
        <div className={styles.relationActions}>
          <button className={styles.saveBtn} type="submit" disabled={!value.trim()}>
            {config.saveLabel || 'Guardar relación'}
          </button>
        </div>
      </form>
    </div>
  )
}

function SearchableRelationSelect({
  value,
  options = [],
  onChange,
  placeholder = 'Buscar...',
  emptyLabel = 'Sin opciones',
}) {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const rootRef = React.useRef(null)
  const normalizedQuery = normalizeSearchText(query)

  const selectedOption = useMemo(() => (
    (options || []).find((option) => String(option?.id || '') === String(value || '')) || null
  ), [options, value])

  const filteredOptions = useMemo(() => {
    const list = Array.isArray(options) ? options : []
    if (!normalizedQuery) return list

    return list.filter((option) => {
      const label = normalizeSearchText(option?.label)
      const id = normalizeSearchText(option?.id)
      return label.includes(normalizedQuery) || id.includes(normalizedQuery)
    })
  }, [normalizedQuery, options])

  const visibleOptions = filteredOptions.slice(0, 60)
  const inputValue = isOpen ? query : (selectedOption?.label || value || '')

  useEffect(() => {
    if (!isOpen) return undefined

    const handlePointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setIsOpen(false)
        setQuery('')
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [isOpen])

  useEffect(() => {
    setActiveIndex(0)
  }, [query, options])

  const selectOption = useCallback((optionValue) => {
    onChange?.(optionValue)
    setQuery('')
    setIsOpen(false)
  }, [onChange])

  const handleKeyDown = (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setIsOpen(true)
      setActiveIndex((current) => Math.min(current + 1, Math.max(visibleOptions.length - 1, 0)))
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((current) => Math.max(current - 1, 0))
      return
    }

    if (event.key === 'Enter') {
      if (!isOpen || visibleOptions.length === 0) return
      event.preventDefault()
      selectOption(visibleOptions[activeIndex]?.id || visibleOptions[0]?.id)
      return
    }

    if (event.key === 'Escape') {
      setIsOpen(false)
      setQuery('')
    }
  }

  return (
    <div className={`${styles.participantSearch} ${styles.relationSearch}`} ref={rootRef}>
      <div className={styles.participantSearchInputWrap}>
        <input
          className={styles.participantSearchInput}
          type="search"
          value={inputValue}
          placeholder={placeholder}
          autoComplete="off"
          role="combobox"
          aria-expanded={isOpen}
          aria-autocomplete="list"
          onFocus={() => {
            setIsOpen(true)
            setQuery('')
          }}
          onChange={(event) => {
            setQuery(event.target.value)
            setIsOpen(true)
          }}
          onKeyDown={handleKeyDown}
        />
        {value && (
          <button
            type="button"
            className={styles.participantSearchClear}
            onClick={() => selectOption('')}
            title="Limpiar"
            aria-label="Limpiar selección"
          >
            {'\u00d7'}
          </button>
        )}
        <button
          type="button"
          className={styles.participantSearchToggle}
          onClick={() => {
            setIsOpen((current) => !current)
            setQuery('')
          }}
          aria-label="Abrir lista"
        >
          {'\u25be'}
        </button>
      </div>

      {isOpen && (
        <div className={styles.participantSearchMenu} role="listbox">
          {visibleOptions.length === 0 ? (
            <div className={styles.participantSearchEmpty}>{emptyLabel}</div>
          ) : (
            visibleOptions.map((option, index) => {
              const optionValue = String(option?.id || '')
              const isSelected = optionValue === String(value || '')
              const isActive = index === activeIndex

              return (
                <button
                  key={optionValue || option.label}
                  type="button"
                  className={`${styles.participantSearchOption} ${isSelected ? styles.participantSearchOptionSelected : ''} ${isActive ? styles.participantSearchOptionActive : ''}`}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => selectOption(optionValue)}
                  role="option"
                  aria-selected={isSelected}
                >
                  <span>{option.label || optionValue}</span>
                </button>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}

function normalizeSearchText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}
