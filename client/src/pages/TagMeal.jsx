import { useEffect, useMemo, useRef, useState, useContext } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { MealContext } from '../context/MealContext.jsx'

function formatDateLabel(date, includeTime) {
  const dateStr = date.toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  if (!includeTime) return dateStr
  const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  return `${dateStr} · ${timeStr}`
}

function formatLocalDate(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export default function TagMeal() {
  const { addMeal } = useContext(MealContext)
  const location = useLocation()
  const navigate = useNavigate()
  const imageFile = location.state?.image
  const dateFromState = location.state?.date  // 'YYYY-MM-DD' if coming from a past day
  const [preview, setPreview] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const mountedAt = useRef(Date.now())

  const { occurredAt, dateLabel } = useMemo(() => {
    if (dateFromState) {
      const [y, m, d] = dateFromState.split('-').map(Number)
      const noon = new Date(y, m - 1, d, 12, 0, 0, 0)
      return {
        occurredAt: noon.getTime(),
        dateLabel: formatDateLabel(noon, false),
      }
    }
    const now = new Date(mountedAt.current)
    return {
      occurredAt: null, // will use Date.now() at save time for today
      dateLabel: formatDateLabel(now, true),
    }
  }, [dateFromState])

  useEffect(() => {
    if (!imageFile) return
    let cancelled = false
    const reader = new FileReader()
    reader.onload = () => { if (!cancelled) setPreview(reader.result) }
    reader.readAsDataURL(imageFile)
    return () => { cancelled = true }
  }, [imageFile])

  const mealTagOptions = useMemo(() => ['HOME', 'OUTSIDE', 'MIXED'], [])

  async function handleTag(tag) {
    if (!preview || saving) return

    setSaving(true)
    setSaveError(null)
    try {
      const finalOccurredAt = occurredAt ?? Date.now()
      await addMeal({ imageUrl: preview, tag, occurredAt: finalOccurredAt })

      const targetDate = dateFromState ?? formatLocalDate(new Date())
      navigate(`/day/${targetDate}`)
    } catch (err) {
      setSaveError(err.message)
      setSaving(false)
    }
  }

  if (!imageFile) {
    return (
      <div className="p-6">
        <div className="mx-auto max-w-xl space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-bold text-slate-900">Tag Meal</h1>
          <p className="text-slate-600">No image found. Please capture an image first.</p>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex rounded-2xl border border-slate-900 px-4 py-3 text-slate-900 transition hover:bg-slate-100"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mx-auto max-w-xl space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-bold text-slate-900">Tag Meal</h1>

        <div className="overflow-hidden rounded-3xl bg-slate-100">
          {preview ? (
            <img src={preview} alt="Selected meal" className="h-72 w-full object-cover" />
          ) : (
            <div className="flex h-72 items-center justify-center text-slate-500">Loading preview…</div>
          )}
        </div>

        <p className="text-sm text-slate-500">{dateLabel}</p>

        {saveError && (
          <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-600">{saveError}</p>
        )}

        <div className="grid gap-3 sm:grid-cols-3">
          {mealTagOptions.map((tag) => (
            <button
              key={tag}
              type="button"
              disabled={saving || !preview}
              className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-semibold text-slate-900 transition hover:bg-slate-100 disabled:opacity-50"
              onClick={() => handleTag(tag)}
            >
              {saving ? 'Saving…' : tag}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => navigate(-1)}
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-600 transition hover:bg-slate-50"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
