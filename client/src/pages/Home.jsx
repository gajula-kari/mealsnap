import { useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MealContext } from '../context/MealContext.jsx'

function formatLocalDate(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function getMealColorClass(meals, date) {
  const dateString = date.toDateString()
  const mealsForDay = meals.filter((meal) => new Date(meal.occurredAt).toDateString() === dateString)
  if (!mealsForDay.length) return 'bg-slate-100 text-slate-500'

  const latest = mealsForDay.reduce((a, b) => (a.occurredAt > b.occurredAt ? a : b))
  switch (latest.tag) {
    case 'HOME': return 'bg-emerald-100 text-emerald-700'
    case 'OUTSIDE': return 'bg-rose-100 text-rose-700'
    case 'MIXED': return 'bg-amber-100 text-amber-700'
    default: return 'bg-slate-100 text-slate-500'
  }
}

function calculateStreak(meals) {
  const uniqueDays = Array.from(
    new Set(meals.map((m) => new Date(m.occurredAt).toDateString())),
  )
  uniqueDays.sort((a, b) => new Date(b) - new Date(a))

  const todayString = new Date().toDateString()
  if (!uniqueDays.includes(todayString)) return 0

  let streak = 1
  const current = new Date(todayString)
  const datesSet = new Set(uniqueDays)

  while (true) {
    current.setDate(current.getDate() - 1)
    if (!datesSet.has(current.toDateString())) break
    streak += 1
  }

  return streak
}

export default function Home() {
  const { meals, loading, error } = useContext(MealContext)
  const navigate = useNavigate()

  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth()
  const monthName = today.toLocaleString('default', { month: 'long' })
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  const streak = calculateStreak(meals)

  return (
    <div className="space-y-4 pb-24">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Streak</p>
        <p className="mt-1 text-3xl font-semibold text-slate-900">
          {loading ? '—' : `${streak} day${streak === 1 ? '' : 's'}`}
        </p>
        {error && <p className="mt-2 text-sm text-rose-500">{error}</p>}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">{monthName} {year}</h2>
          <div className="flex gap-3 text-[10px]">
            <span className="rounded-xl bg-emerald-100 px-2 py-1 text-emerald-700">HOME</span>
            <span className="rounded-xl bg-rose-100 px-2 py-1 text-rose-700">OUTSIDE</span>
            <span className="rounded-xl bg-amber-100 px-2 py-1 text-amber-700">MIXED</span>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {days.map((day) => {
            const date = new Date(year, month, day)
            const isFuture = date > today
            const isToday = date.toDateString() === today.toDateString()
            const colorClass = isFuture ? 'bg-slate-100 text-slate-300' : getMealColorClass(meals, date)
            return (
              <button
                key={day}
                type="button"
                disabled={isFuture}
                onClick={() => navigate(`/day/${formatLocalDate(date)}`)}
                className={`${colorClass} aspect-square rounded-xl text-xs font-semibold transition
                  ${isFuture ? 'cursor-not-allowed opacity-40' : 'hover:opacity-80'}
                  ${isToday ? 'ring-2 ring-slate-400 ring-offset-1' : ''}
                `}
              >
                {day}
              </button>
            )
          })}
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
