import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <div className="min-h-screen p-6">
      <div className="mx-auto max-w-xl space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-4xl font-bold text-slate-900">MealSnap</h1>
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
    </div>
  )
}
