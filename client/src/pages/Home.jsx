import { Link } from 'react-router-dom'
import MealCard from '../components/MealCard.jsx'
import { homeMeals } from '../mocks/homeMeals.js'

export default function Home() {
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
          <p className="text-sm text-slate-500">Streak</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">5</p>
        </div>
      </section>

      <section className="mt-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900">Today&apos;s Meals</h2>
          <span className="text-sm text-slate-500">{homeMeals.length} items</span>
        </div>

        <div className="space-y-4">
          {homeMeals.map((meal) => (
            <MealCard key={meal.id} imageUrl={meal.imageUrl} type={meal.tag} />
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
