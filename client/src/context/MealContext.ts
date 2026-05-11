import { createContext } from 'react'
import type { MealContextValue } from '../types'

export const MealContext = createContext<MealContextValue | null>(null)
