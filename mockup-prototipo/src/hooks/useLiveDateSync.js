import { useCallback, useEffect, useRef, useState } from 'react'
import api from '../api'
import useAppStore from '../store/useAppStore'

export function useLiveDateSync(date, {
  enabled = true,
  intervalMs = 30000,
  refreshOnMount = true,
} = {}) {
  const refreshDateData = useAppStore(state => state.refreshDateData)
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSyncAt, setLastSyncAt] = useState(null)
  const [syncError, setSyncError] = useState(null)
  const lastRevisionRef = useRef('')

  useEffect(() => {
    lastRevisionRef.current = ''
  }, [date])

  const checkForUpdates = useCallback(async ({ force = false } = {}) => {
    if (!enabled || !date) return null

    try {
      const status = await api.getSyncStatus(date)
      const previousRevision = lastRevisionRef.current
      const nextRevision = status?.revision || ''
      const shouldRefresh = force || !previousRevision
        ? refreshOnMount || force
        : nextRevision && nextRevision !== previousRevision

      lastRevisionRef.current = nextRevision

      if (shouldRefresh) {
        setIsSyncing(true)
        await refreshDateData(date)
      }

      setLastSyncAt(new Date())
      setSyncError(null)
      return status
    } catch (error) {
      setSyncError(error)
      return null
    } finally {
      setIsSyncing(false)
    }
  }, [date, enabled, refreshDateData, refreshOnMount])

  useEffect(() => {
    if (!enabled || !date) return undefined

    let cancelled = false
    const runCheck = () => {
      if (!cancelled) checkForUpdates()
    }

    runCheck()
    const interval = window.setInterval(runCheck, intervalMs)

    return () => {
      cancelled = true
      window.clearInterval(interval)
    }
  }, [checkForUpdates, date, enabled, intervalMs])

  return {
    isSyncing,
    lastSyncAt,
    syncError,
    checkForUpdates,
  }
}
