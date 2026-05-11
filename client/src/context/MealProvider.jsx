import { useCallback, useEffect, useMemo, useState } from 'react'
import { MealContext } from './MealContext.js'
import * as api from '../services/mealApi.js'

export function MealProvider({ children }) {
  const [meals, setMeals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    api
      .fetchMeals()
      .then(setMeals)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const addMeal = useCallback(async (payload) => {
    const meal = await api.createMeal(payload)
    setMeals((prev) => [meal, ...prev])
    return meal
  }, [])

  const updateMeal = useCallback(async (id, payload) => {
    const updated = await api.updateMeal(id, payload)
    setMeals((prev) => prev.map((m) => (m.id === id ? updated : m)))
    return updated
  }, [])

  const deleteMeal = useCallback(async (id) => {
    await api.deleteMeal(id)
    setMeals((prev) => prev.filter((m) => m.id !== id))
  }, [])

  const value = useMemo(
    () => ({ meals, loading, error, addMeal, updateMeal, deleteMeal }),
    [meals, loading, error, addMeal, updateMeal, deleteMeal]
  )

  return <MealContext.Provider value={value}>{children}</MealContext.Provider>
}
