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
    title: '¿Quién es tu dupla?',
    placeholder: 'Nombre de tu dupla',
    searchPlaceholder: 'Buscar participante...',
    emptyLabel: 'No quedan participantes libres',
    hint: 'Esta relación se guarda para toda la competencia. Se asigna una vez y se reutiliza.',
    currentLabel: 'Dupla actual',
    editLabel: 'Editar dupla',
    saveLabel: 'Guardar dupla',
  },
  'pair-duel-opponent': {
    title: '¿Contra qué dupla compite tu dupla?',
    placeholder: 'Selecciona dupla rival',
    searchPlaceholder: 'Buscar dupla rival...',
    emptyLabel: 'No hay duplas rivales disponibles',
    hint: 'Esta relación se guarda para toda la competencia. Al elegir una dupla rival se asocian sus dos integrantes.',
    saveLabel: 'Guardar duelo de duplas',
    currentLabel: 'Duelo actual',
    editLabel: 'Editar duelo',
  },
  group: {
    title: '¿A qué grupo perteneces?',
    placeholder: 'Selecciona tu grupo',
    searchPlaceholder: 'Buscar grupo...',
    emptyLabel: 'Sin grupos disponibles',
    hint: 'Esta asignación se guarda para toda la competencia.',
    currentLabel: 'Grupo actual',
    editLabel: 'Editar grupo',
  },
  opponent: {
    title: '¿Quién es tu contrincante?',
    placeholder: 'Nombre de tu contrincante',
    searchPlaceholder: 'Buscar participante...',
    emptyLabel: 'No quedan contrincantes libres',
    hint: 'Esta relación se guarda para toda la competencia.',
    currentLabel: 'Contrincante actual',
    editLabel: 'Editar contrincante',
  },
  'daily-opponent': {
    title: '¿Contra quién es el duelo de hoy?',
    placeholder: 'Selecciona rival del día',
    searchPlaceholder: 'Buscar rival...',
    emptyLabel: 'No hay rivales disponibles',
    hint: 'Esta asignación se guarda solo para esta jornada.',
    saveLabel: 'Guardar duelo',
    currentLabel: 'Duelo de hoy',
    editLabel: 'Editar duelo',
  }
}

export default function PickRelationSetup({
  relationType,
  options,
  participantName,
  onSave,
  onCreateRivalPair,
  createPairOptions = [],
  initialValue = '',
  isConfigured = false,
}) {
  const [value, setValue] = useState(initialValue)
  const [rivalFirstMember, setRivalFirstMember] = useState('')
  const [rivalSecondMember, setRivalSecondMember] = useState('')
  const [isCreatingRivalPair, setIsCreatingRivalPair] = useState(false)
  const [isEditing, setIsEditing] = useState(!isConfigured)
  const config = RELATION_CONFIG[relationType] || RELATION_CONFIG.pair
  const hasOptionList = Array.isArray(options)
  const canOfferRivalPairCreation = (
    relationType === 'pair-duel-opponent' &&
    typeof onCreateRivalPair === 'function'
  )
  const hasExistingRivalPairs = hasOptionList && options.length > 0
  const shouldCreateRivalPair = (
    canOfferRivalPairCreation &&
    (!hasExistingRivalPairs || isCreatingRivalPair)
  )
  const freePairOptions = Array.isArray(createPairOptions) ? createPairOptions : []
  const firstMemberOptions = freePairOptions.filter(
    (option) => normalizeSearchText(option?.id) !== normalizeSearchText(rivalSecondMember)
  )
  const secondMemberOptions = freePairOptions.filter(
    (option) => normalizeSearchText(option?.id) !== normalizeSearchText(rivalFirstMember)
  )
  const canCreateRivalPair = (
    rivalFirstMember &&
    rivalSecondMember &&
    normalizeSearchText(rivalFirstMember) !== normalizeSearchText(rivalSecondMember)
  )
  const currentOption = useMemo(() => (
    (Array.isArray(options) ? options : []).find(
      (option) => normalizeSearchText(option?.id) === normalizeSearchText(initialValue)
    ) || null
  ), [initialValue, options])
  const currentValueLabel = currentOption?.label || initialValue

  useEffect(() => {
    setValue(initialValue || '')
    setRivalFirstMember('')
    setRivalSecondMember('')
    setIsCreatingRivalPair(false)
    setIsEditing(!isConfigured)
  }, [initialValue, isConfigured, participantName, relationType])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (shouldCreateRivalPair) {
      if (!canCreateRivalPair) return
      const saved = await onCreateRivalPair?.(participantName, rivalFirstMember, rivalSecondMember)
      if (saved !== false) setIsEditing(false)
      return
    }
    if (!value.trim()) return
    const saved = await onSave(participantName, relationType, value.trim())
    if (saved !== false) setIsEditing(false)
  }

  if (isConfigured && !isEditing) {
    return (
      <div className={styles.relationConfigured}>
        <div className={styles.relationConfiguredText}>
          <span className={styles.relationConfiguredLabel}>{config.currentLabel || 'Relación actual'}</span>
          <strong className={styles.relationConfiguredValue}>{currentValueLabel}</strong>
        </div>
        <button
          className={styles.relationEditBtn}
          type="button"
          onClick={() => setIsEditing(true)}
        >
          {config.editLabel || 'Editar relación'}
        </button>
      </div>
    )
  }

  return (
    <div className={styles.relationSetup}>
      <h3 className={styles.relationTitle}>{config.title}</h3>
      <form onSubmit={handleSubmit}>
        {shouldCreateRivalPair ? (
          <div className={styles.rivalPairCreator}>
            <p className={styles.rivalPairNotice}>
              {hasExistingRivalPairs
                ? 'Selecciona dos participantes libres para crear una nueva dupla rival.'
                : 'No hay otra dupla creada. Selecciona dos participantes libres para crear la dupla rival ahora.'}
            </p>
            {freePairOptions.length >= 2 ? (
              <div className={styles.rivalPairFields}>
                <label className={styles.rivalPairField}>
                  <span className={styles.rivalPairFieldLabel}>Primer integrante</span>
                  <SearchableRelationSelect
                    value={rivalFirstMember}
                    options={firstMemberOptions}
                    onChange={setRivalFirstMember}
                    placeholder="Buscar primer participante..."
                    emptyLabel="No quedan participantes libres"
                  />
                </label>
                <label className={styles.rivalPairField}>
                  <span className={styles.rivalPairFieldLabel}>Segundo integrante</span>
                  <SearchableRelationSelect
                    value={rivalSecondMember}
                    options={secondMemberOptions}
                    onChange={setRivalSecondMember}
                    placeholder="Buscar segundo participante..."
                    emptyLabel="No quedan participantes libres"
                  />
                </label>
              </div>
            ) : (
              <p className={styles.rivalPairUnavailable}>
                Se necesitan al menos dos participantes libres para crear otra dupla.
              </p>
            )}
          </div>
        ) : hasOptionList ? (
          <div className={styles.relationChoiceStack}>
            <SearchableRelationSelect
              value={value}
              options={options}
              onChange={setValue}
              placeholder={config.searchPlaceholder || config.placeholder}
              emptyLabel={config.emptyLabel}
            />
            {canOfferRivalPairCreation && freePairOptions.length >= 2 && (
              <button
                className={styles.newRivalPairBtn}
                type="button"
                onClick={() => {
                  setValue('')
                  setRivalFirstMember('')
                  setRivalSecondMember('')
                  setIsCreatingRivalPair(true)
                }}
              >
                + Nueva dupla
              </button>
            )}
          </div>
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
        <p className={styles.relationHint}>
          {shouldCreateRivalPair
            ? 'La nueva dupla y su duelo quedarán guardados en la campaña en una sola acción.'
            : config.hint}
        </p>
        <div className={styles.relationActions}>
          {shouldCreateRivalPair && hasExistingRivalPairs ? (
            <button
              className={styles.relationCancelBtn}
              type="button"
              onClick={() => {
                setRivalFirstMember('')
                setRivalSecondMember('')
                setIsCreatingRivalPair(false)
              }}
            >
              Volver a duplas
            </button>
          ) : isConfigured && (
            <button
              className={styles.relationCancelBtn}
              type="button"
              onClick={() => {
                setValue(initialValue || '')
                setIsEditing(false)
              }}
            >
              Cancelar
            </button>
          )}
          <button
            className={styles.saveBtn}
            type="submit"
            disabled={shouldCreateRivalPair ? !canCreateRivalPair : !value.trim()}
          >
            {shouldCreateRivalPair
              ? 'Crear dupla rival y guardar duelo'
              : (isConfigured ? 'Guardar cambios' : (config.saveLabel || 'Guardar relación'))}
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
