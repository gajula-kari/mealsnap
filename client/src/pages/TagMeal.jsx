import { Link } from 'react-router-dom'

export default function TagMeal() {
  return (
    <div className="p-6">
      <div className="mx-auto max-w-xl space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-bold text-slate-900">Tag Meal</h1>
        <p className="text-slate-600">This page is a placeholder for meal tagging functionality.</p>
        <Link
          to="/"
          className="inline-flex rounded-2xl border border-slate-900 px-4 py-3 text-slate-900 transition hover:bg-slate-100"
        >
          Back to Home
        </Link>
      </div>
    </div>
  )
}
