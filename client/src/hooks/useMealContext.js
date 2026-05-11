import { useContext } from 'react'
import { MealContext } from '../context/MealContext.js'

export function useMealContext() {
  return useContext(MealContext)
}
