/**
 * usePronosticos.js
 *
 * Custom hook for pronosticos (picks) data.
 */

import { useMemo } from 'react'
import useAppStore from '../store/useAppStore'

export function usePronosticos() {
  const { appData } = useAppStore()

  const events = useMemo(() => {
    return appData?.events || []
  }, [appData])

  const eventsWithParticipants = useMemo(() => {
    return events.filter(ev => (ev.participants || []).length > 0)
  }, [events])

  return {
    events,
    eventsWithParticipants,
    getEventById: (id) => events.find(ev => ev.id === id) || null,
  }
}
