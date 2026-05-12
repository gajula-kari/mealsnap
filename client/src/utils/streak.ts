import type { Meal } from '../types'

export function calculateStreak(meals: Meal[]): number {
  const uniqueDays = Array.from(new Set(meals.map((m) => new Date(m.occurredAt).toDateString())))
  uniqueDays.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())

  const todayString = new Date().toDateString()
  if (!uniqueDays.includes(todayString)) return 0

  let streak = 1
  const current = new Date(todayString)
  const datesSet = new Set(uniqueDays)

  while (true) {
    current.setDate(current.getDate() - 1)
    if (!datesSet.has(current.toDateString())) break
    streak += 1
  }

  return streak
}
