import { useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useMealContext } from '../hooks/useMealContext'
import MealCard from '../components/MealCard'
import Spinner from '../components/Spinner'

export default function DayDetail() {
  const { date } = useParams<{ date: string }>()
  const { meals, loading, deleteMeal } = useMealContext()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file)
      navigate('/tag', {
        replace: true,
        state: { image: file, date, source: isToday ? 'camera' : 'gallery' },
      })
  }

  const [y, m, d] = (date ?? '').split('-').map(Number)
  const selectedDate = new Date(y, m - 1, d)
  const isToday = selectedDate.toDateString() === new Date().toDateString()
  const selectedMeals = meals.filter(
    (meal) => new Date(meal.occurredAt).toDateString() === selectedDate.toDateString()
  )

  const formattedDate = selectedDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="relative space-y-4 pb-24">
      {loading && (
        <div
          role="status"
          aria-label="Loading"
          className="absolute inset-0 z-10 flex items-center justify-center bg-slate-50/60"
        >
          <Spinner />
        </div>
      )}
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Day</p>
            <h1 className="mt-1 text-2xl font-semibold text-slate-900">
              {formattedDate}
              {!isToday && <span className="ml-2 text-sm font-normal text-slate-400">· past</span>}
            </h1>
          </div>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-600 transition hover:bg-slate-50"
          >
            Back
          </button>
        </div>
      </section>

      {selectedMeals.length > 0 ? (
        <div className="columns-2 gap-3">
          {selectedMeals.map((meal) => (
            <MealCard
              key={meal.id}
              meal={meal}
              onTap={() => navigate('/tag', { replace: true, state: { meal } })}
              onDelete={deleteMeal}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <p className="text-lg font-medium text-slate-900">No meals logged</p>
          <p className="mt-1 text-sm text-slate-500">Tap Add Meal to log one.</p>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        {...(isToday ? { capture: 'environment' } : {})}
        onChange={handleFileChange}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 flex items-center gap-2 rounded-full bg-slate-900 px-6 py-4 text-sm font-semibold text-white shadow-2xl shadow-slate-900/25 transition hover:bg-slate-700"
      >
        {isToday ? (
          <>
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
          </>
        ) : (
          'Add from Photos'
        )}
      </button>
    </div>
  )
}
