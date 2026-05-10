import { Link } from 'react-router-dom'

export default function Calendar() {
  return (
    <div className="min-h-screen p-6">
      <div className="mx-auto max-w-xl space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-bold text-slate-900">Calendar</h1>
        <p className="text-slate-600">This page is a placeholder for the Calendar route.</p>
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
