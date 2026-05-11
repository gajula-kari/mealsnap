const BASE = `${import.meta.env.VITE_API_URL ?? ''}/meals`

function normalize(meal) {
  return { ...meal, id: meal._id }
}

async function request(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Request failed')
  return data
}

export async function fetchMeals() {
  const data = await request(BASE)
  return data.meals.map(normalize)
}

export async function createMeal(payload) {
  const data = await request(BASE, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return normalize(data.meal)
}

export async function updateMeal(id, payload) {
  const data = await request(`${BASE}/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
  return normalize(data.meal)
}

export async function deleteMeal(id) {
  await request(`${BASE}/${id}`, { method: 'DELETE' })
}
