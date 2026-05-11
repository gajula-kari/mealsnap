import type { Settings } from '../types'
import { getDeviceId } from '../utils/deviceId'

const ROOT = import.meta.env.VITE_API_URL ?? ''
const BASE = `${ROOT}/settings`

async function request(url: string, options: RequestInit = {}): Promise<unknown> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', 'x-user-id': getDeviceId() },
    ...options,
  })
  const data = (await res.json()) as { error?: string }
  if (!res.ok) throw new Error(data.error || 'Request failed')
  return data
}

export async function fetchSettings(): Promise<Settings | null> {
  const data = (await request(BASE)) as { settings: Settings | null }
  return data.settings
}

export async function saveSettings(monthlyOutsideGoal: number): Promise<Settings> {
  const data = (await request(BASE, {
    method: 'PATCH',
    body: JSON.stringify({ monthlyOutsideGoal }),
  })) as { settings: Settings }
  return data.settings
}
