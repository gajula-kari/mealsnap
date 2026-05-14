import { useRef, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMealContext } from '../hooks/useMealContext'
import { useSettingsContext } from '../hooks/useSettingsContext'
import { useInstallContext } from '../hooks/useInstallContext'
import Spinner from '../components/Spinner'
import type { Meal, MealTag } from '../types'

const BANNER_ANIMATED_KEY = 'aaharya_install_banner_animated'

function InstallBanner() {
  const { canInstall, dismissed, install, dismiss } = useInstallContext()
  const [shouldAnimate] = useState(() => !localStorage.getItem(BANNER_ANIMATED_KEY))
  const [isOffset, setIsOffset] = useState(shouldAnimate)

  const visible = canInstall && !dismissed

  useEffect(() => {
    if (!visible || !shouldAnimate) return
    localStorage.setItem(BANNER_ANIMATED_KEY, 'true')
    // Delay until after the splash screen finishes (~2s: 1.5s pause + 0.5s fade)
    const timer = setTimeout(() => setIsOffset(false), 2500)
    return () => clearTimeout(timer)
  }, [visible, shouldAnimate])

  if (!visible) return null
  return (
    <div
      className="flex items-center justify-between rounded-2xl bg-slate-900 px-4 py-3"
      style={{
        transform: isOffset ? 'translateY(-150%)' : 'translateY(0)',
        opacity: isOffset ? 0 : 1,
        ...(shouldAnimate && { transition: 'transform 0.5s ease-out, opacity 0.5s ease-out' }),
      }}
    >
      <div>
        <p className="text-sm font-medium text-white">Install App</p>
        <p className="text-xs text-slate-400">Add Aaharya to your home screen</p>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={install}
          className="rounded-xl bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 transition hover:bg-slate-100"
        >
          Install
        </button>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Close"
          className="text-slate-500 transition hover:text-white"
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
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>
  )
}

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

export default function Home() {
  const { meals, loading, error } = useMealContext()
  const { settings } = useSettingsContext()
  const navigate = useNavigate()
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)
  const monthlyGoal = settings?.monthlyIndulgentLimit ?? null

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>, source: 'camera' | 'gallery') {
    const file = e.target.files?.[0]
    if (file) navigate('/tag', { replace: true, state: { image: file, source } })
  }

  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth()
  const monthName = today.toLocaleString('default', { month: 'long' })
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
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

  const atLimit = monthlyGoal != null && indulgentDays === monthlyGoal
  const overGoal = monthlyGoal != null && indulgentDays > monthlyGoal
  const overBy = overGoal ? indulgentDays - monthlyGoal! : 0

  const limitMessage = atLimit
    ? "You've reached your limit"
    : overBy === 1
      ? "You've gone over your limit"
      : overBy > 1
        ? `You're ${overBy} days over your limit`
        : null

  return (
    <div className="relative space-y-4 pb-24">
      <InstallBanner />
      {loading && (
        <div
          role="status"
          aria-label="Loading"
          className="absolute inset-0 z-10 flex items-center justify-center bg-slate-50/60"
        >
          <Spinner />
        </div>
      )}
      {error && <p className="text-sm text-rose-500">{error}</p>}

      <section
        className={`rounded-3xl border p-5 shadow-sm ${overGoal ? 'border-rose-200 bg-rose-50' : atLimit ? 'border-amber-200 bg-amber-50' : 'border-slate-200 bg-white'}`}
      >
        <p className="mb-3 text-xs uppercase tracking-[0.3em] text-slate-500">{monthName}</p>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="text-2xl font-semibold text-emerald-600">{cleanDays}</p>
            <p className="mt-0.5 text-xs text-slate-500">Clean days</p>
          </div>
          <div>
            <p
              className={`text-2xl font-semibold ${overGoal ? 'text-rose-600' : atLimit ? 'text-amber-600' : 'text-slate-900'}`}
            >
              {indulgentDays}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              Indulgent days
              {monthlyGoal != null && (
                <span
                  className={`ml-1 ${overGoal ? 'text-rose-400' : atLimit ? 'text-amber-400' : 'text-slate-400'}`}
                >
                  / {monthlyGoal}
                </span>
              )}
            </p>
          </div>
        </div>
        {limitMessage && (
          <p className={`mt-3 text-xs ${overGoal ? 'text-rose-500' : 'text-amber-600'}`}>
            {limitMessage}
          </p>
        )}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            {monthName} {year}
          </h2>
          <div className="flex gap-2 text-[10px]">
            <button
              type="button"
              onClick={() => navigate('/meals/clean')}
              className="rounded-xl bg-emerald-100 px-2 py-1 text-emerald-700 transition hover:bg-emerald-200"
            >
              CLEAN
            </button>
            <button
              type="button"
              onClick={() => navigate('/meals/indulgent')}
              className="rounded-xl bg-amber-100 px-2 py-1 text-amber-700 transition hover:bg-amber-200"
            >
              INDULGENT
            </button>
            {monthlyGoal != null && (
              <span className="rounded-xl bg-rose-100 px-2 py-1 text-rose-700">OVER LIMIT</span>
            )}
          </div>
        </div>

        {monthlyGoal != null && (
          <p className="mb-3 text-xs text-slate-400">
            First {monthlyGoal} indulgent day{monthlyGoal === 1 ? '' : 's'} are within your limit.
          </p>
        )}

        <div className="grid grid-cols-7 gap-1.5">
          {days.map((day) => {
            const date = new Date(year, month, day)
            const dateStr = formatLocalDate(date)
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
                onClick={() => navigate(`/day/${dateStr}`)}
                className={`${colorClass} aspect-square rounded-xl text-xs font-semibold transition
                  ${isFuture ? 'cursor-not-allowed opacity-40' : 'hover:opacity-80'}
                  ${isToday ? 'ring-1 ring-slate-300' : ''}
                `}
              >
                {day}
              </button>
            )
          })}
        </div>
      </section>

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => handleFileChange(e, 'camera')}
        className="hidden"
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => handleFileChange(e, 'gallery')}
        className="hidden"
      />
      <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 flex flex-col items-center gap-2">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            className="flex items-center gap-2 rounded-full bg-slate-900 px-6 py-4 text-sm font-semibold text-white shadow-2xl shadow-slate-900/25 transition hover:bg-slate-700"
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
          <button
            type="button"
            onClick={() => galleryInputRef.current?.click()}
            aria-label="Choose from gallery"
            className="rounded-full border border-slate-200 bg-white p-3.5 text-slate-600 shadow-lg transition hover:bg-slate-50"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </button>
        </div>
        <p className="text-[11px] text-slate-400">Mark if it was indulgent</p>
      </div>
    </div>
  )
}
