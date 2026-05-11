import type { Meal, CreateMealPayload, UpdateMealPayload, MealTag } from '../types'

const ROOT = import.meta.env.VITE_API_URL ?? ''
const BASE = `${ROOT}/meals`

export function ping(): void {
  fetch(`${ROOT}/health`).catch(() => {})
}

interface RawMeal {
  _id: string
  tag: MealTag
  imageUrl: string | null
  amountSpent: number | null
  note: string | null
  occurredAt: number
  userId?: string
  date?: string
  createdAt?: number
  updatedAt?: number
}

function normalize(raw: RawMeal): Meal {
  return { ...raw, id: raw._id }
}

async function request(url: string, options: RequestInit = {}): Promise<unknown> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  const data = (await res.json()) as { error?: string }
  if (!res.ok) throw new Error(data.error || 'Request failed')
  return data
}

export async function fetchMeals(): Promise<Meal[]> {
  const data = (await request(BASE)) as { meals: RawMeal[] }
  return data.meals.map(normalize)
}

export async function createMeal(payload: CreateMealPayload): Promise<Meal> {
  const data = (await request(BASE, {
    method: 'POST',
    body: JSON.stringify(payload),
  })) as { meal: RawMeal }
  return normalize(data.meal)
}

export async function updateMeal(id: string, payload: UpdateMealPayload): Promise<Meal> {
  const data = (await request(`${BASE}/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })) as { meal: RawMeal }
  return normalize(data.meal)
}

export async function deleteMeal(id: string): Promise<void> {
  await request(`${BASE}/${id}`, { method: 'DELETE' })
}
