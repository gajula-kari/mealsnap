import { useRef, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMealContext } from '../hooks/useMealContext'
import { fetchSettings } from '../services/settingsApi'
import type { Meal, MealTag } from '../types'

function formatLocalDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function getMealColorClass(meals: Meal[], date: Date, redDaySet: Set<string>): string {
  const dateString = date.toDateString()
  const mealsForDay = meals.filter(
    (meal) => new Date(meal.occurredAt).toDateString() === dateString
  )
  if (!mealsForDay.length) return 'bg-slate-100 text-slate-500'

  const hasIndulgent = mealsForDay.some((m) => m.tag === 'INDULGENT')
  if (!hasIndulgent) return 'bg-emerald-100 text-emerald-700'
  if (redDaySet.has(dateString)) return 'bg-rose-100 text-rose-700'
  return 'bg-amber-100 text-amber-700'
}

function calculateStreak(meals: Meal[]): number {
  const uniqueDays = Array.from(new Set(meals.map((m) => new Date(m.occurredAt).toDateString())))
  uniqueDays.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())

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
  const { meals, loading, error } = useMealContext()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [monthlyGoal, setMonthlyGoal] = useState<number | null>(null)

  useEffect(() => {
    fetchSettings()
      .then((s) => {
        if (s?.monthlyIndulgentLimit != null) setMonthlyGoal(s.monthlyIndulgentLimit)
      })
      .catch(() => {})
  }, [])

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) navigate('/tag', { state: { image: file } })
  }

  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth()
  const monthName = today.toLocaleString('default', { month: 'long' })
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  const streak = calculateStreak(meals)

  const thisMonthMeals = meals.filter((m) => {
    const d = new Date(m.occurredAt)
    return d.getFullYear() === year && d.getMonth() === month
  })

  const dayTagMap: Record<string, MealTag[]> = {}
  thisMonthMeals.forEach((m) => {
    const key = new Date(m.occurredAt).toDateString()
    if (!dayTagMap[key]) dayTagMap[key] = []
    dayTagMap[key].push(m.tag)
  })

  let cleanDays = 0,
    indulgentDays = 0
  Object.values(dayTagMap).forEach((tags) => {
    const hasIndulgent = tags.includes('INDULGENT')
    if (hasIndulgent) indulgentDays++
    else cleanDays++
  })

  // Sort indulgent days chronologically to apply goal cutoff in order.
  const sortedIndulgentDays = Array.from(
    new Set(
      thisMonthMeals
        .filter((m) => m.tag === 'INDULGENT')
        .map((m) => new Date(m.occurredAt).toDateString())
    )
  ).sort((a, b) => new Date(a).getTime() - new Date(b).getTime())

  const redDaySet = new Set(monthlyGoal != null ? sortedIndulgentDays.slice(monthlyGoal) : [])

  const overGoal = monthlyGoal != null && indulgentDays > monthlyGoal

  return (
    <div className="space-y-4 pb-24">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Streak</p>
        <p className="mt-1 text-3xl font-semibold text-slate-900">
          {loading ? '—' : `${streak} day${streak === 1 ? '' : 's'}`}
        </p>
        {error && <p className="mt-2 text-sm text-rose-500">{error}</p>}
      </section>

      <section
        className={`rounded-3xl border p-5 shadow-sm ${overGoal ? 'border-rose-200 bg-rose-50' : 'border-slate-200 bg-white'}`}
      >
        <p className="mb-3 text-xs uppercase tracking-[0.3em] text-slate-500">{monthName}</p>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="text-2xl font-semibold text-emerald-600">{loading ? '—' : cleanDays}</p>
            <p className="mt-0.5 text-xs text-slate-500">Clean days</p>
          </div>
          <div>
            <p
              className={`text-2xl font-semibold ${overGoal ? 'text-rose-600' : 'text-slate-900'}`}
            >
              {loading ? '—' : indulgentDays}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              Indulgent days
              {monthlyGoal != null && (
                <span className={`ml-1 ${overGoal ? 'text-rose-400' : 'text-slate-400'}`}>
                  / {monthlyGoal}
                </span>
              )}
            </p>
          </div>
        </div>
        {overGoal && <p className="mt-3 text-xs text-rose-500">Indulgent day limit reached</p>}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            {monthName} {year}
          </h2>
          <div className="flex gap-2 text-[10px]">
            <span className="rounded-xl bg-emerald-100 px-2 py-1 text-emerald-700">CLEAN</span>
            <span className="rounded-xl bg-amber-100 px-2 py-1 text-amber-700">INDULGENT</span>
            {monthlyGoal != null && (
              <span className="rounded-xl bg-rose-100 px-2 py-1 text-rose-700">OVER</span>
            )}
          </div>
        </div>

        {monthlyGoal != null && (
          <p className="mb-3 text-xs text-slate-400">
            First {monthlyGoal} indulgent day{monthlyGoal === 1 ? '' : 's'} are within your limit.
            Days beyond that are red.
          </p>
        )}

        <div className="grid grid-cols-7 gap-1.5">
          {days.map((day) => {
            const date = new Date(year, month, day)
            const isFuture = date > today
            const isToday = date.toDateString() === today.toDateString()
            const colorClass = isFuture
              ? 'bg-slate-100 text-slate-300'
              : getMealColorClass(meals, date, redDaySet)
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

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 flex items-center gap-2 rounded-full bg-slate-900 px-6 py-4 text-sm font-semibold text-white shadow-2xl shadow-slate-900/25 transition hover:bg-slate-700"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
          <circle cx="12" cy="13" r="4" />
        </svg>
        Add Meal
      </button>
    </div>
  )
}
