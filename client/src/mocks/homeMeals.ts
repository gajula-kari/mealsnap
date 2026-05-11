import type { Meal } from '../types'

const yesterday = Date.now() - 1000 * 60 * 60 * 24

export const homeMeals: Meal[] = [
  {
    id: 'meal-1',
    userId: 'user-123',
    imageUrl:
      'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80',
    tag: 'CLEAN',
    amountSpent: null,
    note: 'Quick homemade dinner',
    date: new Date(yesterday - 1000 * 60 * 60 * 3).toISOString(),
    occurredAt: yesterday - 1000 * 60 * 60 * 3,
    createdAt: yesterday - 1000 * 60 * 60 * 4,
    updatedAt: yesterday - 1000 * 60 * 60 * 4,
  },
  {
    id: 'meal-2',
    userId: 'user-123',
    imageUrl:
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80',
    tag: 'INDULGENT',
    amountSpent: 320,
    note: 'Lunch at the cafe',
    date: new Date(yesterday - 1000 * 60 * 60 * 7).toISOString(),
    occurredAt: yesterday - 1000 * 60 * 60 * 7,
    createdAt: yesterday - 1000 * 60 * 60 * 7,
    updatedAt: yesterday - 1000 * 60 * 60 * 7,
  },
  {
    id: 'meal-3',
    userId: 'user-123',
    imageUrl:
      'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=800&q=80',
    tag: 'CLEAN',
    amountSpent: null,
    note: 'Breakfast smoothie',
    date: new Date(yesterday - 1000 * 60 * 60 * 11).toISOString(),
    occurredAt: yesterday - 1000 * 60 * 60 * 11,
    createdAt: yesterday - 1000 * 60 * 60 * 11,
    updatedAt: yesterday - 1000 * 60 * 60 * 11,
  },
]
