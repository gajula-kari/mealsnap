import { useParams, Link } from 'react-router-dom'

export default function DayDetail() {
  const { date } = useParams()

  return (
    <div className="p-6">
      <div className="mx-auto max-w-xl space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-bold text-slate-900">Day Detail</h1>
        <p className="text-slate-600">Showing details for <span className="font-semibold text-slate-900">{date}</span>.</p>
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
