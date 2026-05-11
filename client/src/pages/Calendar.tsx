import { Link, useNavigate } from 'react-router-dom'
import { useMealContext } from '../hooks/useMealContext'
import type { Meal, MealTag } from '../types'

function getMonthDays(): number[] {
  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  return Array.from({ length: daysInMonth }, (_, index) => index + 1)
}

function formatLocalDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getMealColorClass(meals: Meal[], date: Date): string {
  const dateString = date.toDateString()
  const mealsForDay = meals.filter(
    (meal) => new Date(meal.occurredAt).toDateString() === dateString
  )
  if (!mealsForDay.length) {
    return 'bg-slate-100 text-slate-500'
  }

  const latestMeal = mealsForDay.reduce((latest, meal) =>
    meal.occurredAt > latest.occurredAt ? meal : latest
  )

  const colorMap: Record<MealTag, string> = {
    CLEAN: 'bg-emerald-100 text-emerald-700',
    INDULGENT: 'bg-amber-100 text-amber-700',
  }

  return colorMap[latestMeal.tag] ?? 'bg-slate-100 text-slate-500'
}

export default function Calendar() {
  const { meals } = useMealContext()
  const navigate = useNavigate()
  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth()
  const monthName = today.toLocaleString('default', { month: 'long' })
  const days = getMonthDays()

  return (
    <div className="pb-24">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Current month</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">
              {monthName} {year}
            </h1>
          </div>
          <Link
            to="/"
            className="rounded-2xl border border-slate-900 px-4 py-3 text-sm font-medium text-slate-900 transition hover:bg-slate-100"
          >
            Home
          </Link>
        </div>

        <div className="mt-6 grid grid-cols-7 gap-2">
          {days.map((day) => {
            const date = new Date(year, month, day)
            const isFuture = date > today
            const colorClass = isFuture
              ? 'bg-slate-100 text-slate-300'
              : getMealColorClass(meals, date)
            return (
              <button
                key={day}
                type="button"
                disabled={isFuture}
                onClick={() => navigate(`/day/${formatLocalDate(date)}`)}
                className={`${colorClass} aspect-square rounded-2xl border border-slate-200 p-2 text-xs font-semibold shadow-sm transition ${isFuture ? 'cursor-not-allowed opacity-50' : 'hover:shadow-md'}`}
              >
                <span>{day}</span>
              </button>
            )
          })}
        </div>

        <div className="mt-6 grid grid-cols-2 gap-2 text-center text-[10px]">
          <div className="rounded-2xl bg-emerald-100 px-2 py-2 text-emerald-700">CLEAN</div>
          <div className="rounded-2xl bg-amber-100 px-2 py-2 text-amber-700">INDULGENT</div>
        </div>
      </section>
    </div>
  )
}
