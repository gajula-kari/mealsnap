import { calculateStreak } from './streak'
import type { Meal } from '../types'

function meal(daysAgo: number): Meal {
  const d = new Date()
  d.setHours(12, 0, 0, 0)
  d.setDate(d.getDate() - daysAgo)
  return {
    id: String(daysAgo),
    tag: 'CLEAN',
    imageUrl: null,
    amountSpent: null,
    note: null,
    occurredAt: d.getTime(),
  }
}

describe('calculateStreak', () => {
  it('returns 0 with no meals', () => {
    expect(calculateStreak([])).toBe(0)
  })

  it('returns 0 when most recent meal is not today', () => {
    expect(calculateStreak([meal(1)])).toBe(0)
  })

  it('returns 1 when only today has a meal', () => {
    expect(calculateStreak([meal(0)])).toBe(1)
  })

  it('returns 2 for today + yesterday', () => {
    expect(calculateStreak([meal(0), meal(1)])).toBe(2)
  })

  it('breaks on a gap', () => {
    expect(calculateStreak([meal(0), meal(2)])).toBe(1)
  })

  it('counts multiple meals on the same day as one streak day', () => {
    expect(calculateStreak([meal(0), meal(0), meal(1), meal(2)])).toBe(3)
  })
})
