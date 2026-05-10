import { createContext, useMemo, useState } from 'react'
import { homeMeals } from '../mocks/homeMeals.js'

export const MealContext = createContext({
  meals: [],
  addMeal: () => {},
})

export function MealProvider({ children }) {
  const [meals, setMeals] = useState(homeMeals)

  const addMeal = (meal) => {
    setMeals((prev) => [meal, ...prev])
  }

  const value = useMemo(
    () => ({ meals, addMeal }),
    [meals],
  )

  return <MealContext.Provider value={value}>{children}</MealContext.Provider>
}
