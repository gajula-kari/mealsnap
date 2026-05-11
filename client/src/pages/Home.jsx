import { useContext } from 'react'
import { Link } from 'react-router-dom'
import MealCard from '../components/MealCard.jsx'
import { MealContext } from '../context/MealContext.jsx'

function isToday(occurredAt) {
  return new Date(occurredAt).toDateString() === new Date().toDateString()
}

function calculateStreak(meals) {
  const uniqueDays = Array.from(
    new Set(meals.map((meal) => new Date(meal.occurredAt).toDateString())),
  )

  uniqueDays.sort((a, b) => new Date(b) - new Date(a))

  const todayString = new Date().toDateString()
  if (!uniqueDays.includes(todayString)) return 0

  let streak = 1
  let current = new Date(todayString)
  const datesSet = new Set(uniqueDays)

  while (true) {
    current.setDate(current.getDate() - 1)
    if (!datesSet.has(current.toDateString())) break
    streak += 1
  }

  return streak
}

export default function Home() {
  const { meals, loading, error, updateMeal, deleteMeal } = useContext(MealContext)
  const todayMeals = meals.filter((meal) => isToday(meal.occurredAt))
  const streak = calculateStreak(meals)

  return (
    <div className="pb-24">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Today</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">Today Status</h1>
          </div>
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700">Good</span>
        </div>

        <div className="mt-6 rounded-3xl bg-slate-50 p-4">
          <p className="text-sm text-slate-500">🔥 Streak</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{streak} day{streak === 1 ? '' : 's'}</p>
        </div>
      </section>

      <section className="mt-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900">Today&apos;s Meals</h2>
          <span className="text-sm text-slate-500">{todayMeals.length} items</span>
        </div>

        {loading && (
          <p className="py-8 text-center text-sm text-slate-400">Loading meals…</p>
        )}
        {error && (
          <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</p>
        )}

        <div className="space-y-4">
          {todayMeals.map((meal) => (
            <MealCard
              key={meal.id}
              meal={meal}
              onEdit={updateMeal}
              onDelete={deleteMeal}
            />
          ))}
        </div>
      </section>

      <Link
        to="/camera"
        className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-slate-900 px-6 py-4 text-sm font-semibold text-white shadow-2xl shadow-slate-900/25 transition hover:bg-slate-700"
      >
        + Add Meal
      </Link>
    </div>
  )
}
