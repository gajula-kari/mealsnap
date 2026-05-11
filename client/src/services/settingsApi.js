const ROOT = import.meta.env.VITE_API_URL ?? ''
const BASE = `${ROOT}/settings`

async function request(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Request failed')
  return data
}

export async function fetchSettings() {
  const data = await request(BASE)
  return data.settings
}

export async function saveSettings(monthlyOutsideGoal) {
  const data = await request(BASE, {
    method: 'PATCH',
    body: JSON.stringify({ monthlyOutsideGoal }),
  })
  return data.settings
}
