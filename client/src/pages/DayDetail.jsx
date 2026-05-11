import { useContext } from 'react'
import { useParams, Link } from 'react-router-dom'
import { MealContext } from '../context/MealContext.jsx'
import MealCard from '../components/MealCard.jsx'

export default function DayDetail() {
  const { date } = useParams()
  const { meals, updateMeal, deleteMeal } = useContext(MealContext)

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
    <div className="pb-24">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Day details</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">{formattedDate}</h1>
          </div>
          <Link
            to="/calendar"
            className="rounded-2xl border border-slate-900 px-4 py-3 text-sm font-medium text-slate-900 transition hover:bg-slate-100"
          >
            Calendar
          </Link>
        </div>

        {selectedMeals.length > 0 ? (
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-900">Meals</h2>
              <span className="text-sm text-slate-500">{selectedMeals.length} items</span>
            </div>

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
          </div>
        ) : (
          <div className="mt-6 rounded-3xl bg-slate-50 p-8 text-center">
            <p className="text-lg font-medium text-slate-900">No meals logged</p>
            <p className="mt-2 text-slate-600">No meals were recorded for this day.</p>
          </div>
        )}
      </section>
    </div>
  )
}
