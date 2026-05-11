import { useContext } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { MealContext } from '../context/MealContext.jsx'
import MealCard from '../components/MealCard.jsx'

export default function DayDetail() {
  const { date } = useParams()
  const { meals, updateMeal, deleteMeal } = useContext(MealContext)
  const navigate = useNavigate()

  const [y, m, d] = date.split('-').map(Number)
  const selectedDate = new Date(y, m - 1, d)
  const selectedMeals = meals.filter(
    (meal) => new Date(meal.occurredAt).toDateString() === selectedDate.toDateString(),
  )

  const formattedDate = selectedDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="space-y-4 pb-24">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Day</p>
            <h1 className="mt-1 text-2xl font-semibold text-slate-900">{formattedDate}</h1>
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
        <div className="space-y-4">
          {selectedMeals.map((meal) => (
            <MealCard
              key={meal.id}
              meal={meal}
              onEdit={updateMeal}
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

      <button
        type="button"
        onClick={() => navigate('/camera', { state: { date } })}
        className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-slate-900 px-6 py-4 text-sm font-semibold text-white shadow-2xl shadow-slate-900/25 transition hover:bg-slate-700"
      >
        + Add Meal
      </button>
    </div>
  )
}
