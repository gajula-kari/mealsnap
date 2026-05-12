import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { SettingsContext } from './SettingsContext'
import * as api from '../services/settingsApi'
import type { Settings } from '../types'

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [settingsLoading, setSettingsLoading] = useState(true)

  useEffect(() => {
    api
      .fetchSettings()
      .then(setSettings)
      .catch(() => {})
      .finally(() => setSettingsLoading(false))
  }, [])

  const saveSettings = useCallback(async (limit: number) => {
    const updated = await api.saveSettings(limit)
    setSettings(updated)
    return updated
  }, [])

  const value = useMemo(
    () => ({ settings, settingsLoading, saveSettings }),
    [settings, settingsLoading, saveSettings]
  )

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}
