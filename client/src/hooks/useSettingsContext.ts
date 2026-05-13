import { useContext } from 'react'
import { SettingsContext, type SettingsContextValue } from '../context/SettingsContext'

export function useSettingsContext(): SettingsContextValue {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettingsContext must be used within SettingsProvider')
  return ctx
}
