import { createContext, useEffect, useMemo, useState } from 'react'

const STORAGE_KEY = 'meals'

export const MealContext = createContext({
  meals: [],
  addMeal: () => {},
})

export function MealProvider({ children }) {
  const [meals, setMeals] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(meals))
  }, [meals])

  const addMeal = (meal) => {
    setMeals((prev) => [meal, ...prev])
  }

  const value = useMemo(
    () => ({ meals, addMeal }),
    [meals],
  )

  return <MealContext.Provider value={value}>{children}</MealContext.Provider>
}
