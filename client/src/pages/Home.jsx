import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <div className="pb-24">
      <div className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-4xl font-bold text-slate-900">Welcome to MealSnap</h1>
        <p className="text-slate-600">Temporary navigation test screen. Use the buttons below to verify routing.</p>

        <div className="space-y-3">
          <Link
            to="/camera"
            className="block rounded-2xl bg-slate-900 px-4 py-3 text-center text-white shadow-sm transition hover:bg-slate-700"
          >
            Camera
          </Link>
          <Link
            to="/calendar"
            className="block rounded-2xl border border-slate-900 px-4 py-3 text-center text-slate-900 transition hover:bg-slate-100"
          >
            Calendar
          </Link>
        </div>
      </div>

      <Link
        to="/camera"
        className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-slate-900 px-6 py-4 text-sm font-semibold text-white shadow-2xl shadow-slate-900/25 transition hover:bg-slate-700"
      >
        + Add Meal
      </Link>
    </div>
  )
}
