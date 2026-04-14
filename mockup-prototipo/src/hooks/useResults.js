/**
 * useResults.js
 *
 * Custom hook for results operations.
 */

import { useMemo, useCallback } from 'react'
import api from '../api'
import useAppStore from '../store/useAppStore'

export function useResults() {
  const { appData, refresh } = useAppStore()

  const events = useMemo(() => {
    return appData?.events || []
  }, [appData])

  const eventsWithResults = useMemo(() => {
    return events.filter(ev =>
      Object.keys(ev.results || {}).length > 0 ||
      Object.keys(ev.participants || {}).length > 0
    )
  }, [events])

  const getEventById = useCallback((eventId) => {
    return events.find(ev => ev.id === eventId) || null
  }, [events])

  const saveResult = useCallback(async (eventId, race, result) => {
    const res = await api.saveResult(eventId, race, result)
    await refresh()
    return res
  }, [refresh])

  const importTeletrakResults = useCallback(async (date, trackId) => {
    const res = await api.importTeletrakResults(date, trackId)
    await refresh()
    return res
  }, [refresh])

  const copyResults = useCallback(async (sourceId, targetIds, options) => {
    const res = await api.copyResults(sourceId, targetIds, options)
    await refresh()
    return res
  }, [refresh])

  return {
    events,
    eventsWithResults,
    getEventById,
    saveResult,
    importTeletrakResults,
    copyResults,
  }
}
