import { useCallback, useEffect, useMemo, useState } from 'react'
import { MealContext } from './MealContext.js'
import * as api from '../services/mealApi.js'

const CACHE_KEY = 'mealsnap_meals'

function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function writeCache(meals) {
  try {
    // imageUrl is a base64 string — too large for localStorage quota.
    // Tags and timestamps are all we need for streak and calendar colours.
    const slim = meals.map(({ imageUrl: _imageUrl, ...rest }) => rest)
    localStorage.setItem(CACHE_KEY, JSON.stringify(slim))
  } catch {
    // localStorage unavailable (private browsing quota) — silently skip
  }
}

export function MealProvider({ children }) {
  const [meals, setMeals] = useState(() => readCache() ?? [])
  const [loading, setLoading] = useState(() => {
    const cache = readCache()
    return !cache || cache.length === 0
  })
  const [error, setError] = useState(null)

  useEffect(() => {
    writeCache(meals)
  }, [meals])

  useEffect(() => {
    api.ping()
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
