import { useContext } from 'react'
import { MealContext } from '../context/MealContext'
import type { MealContextValue } from '../types'

export function useMealContext(): MealContextValue {
  const ctx = useContext(MealContext)
  if (!ctx) throw new Error('useMealContext must be used within MealProvider')
  return ctx
}
