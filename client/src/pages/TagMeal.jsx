import { useEffect, useMemo, useState, useContext } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { MealContext } from '../context/MealContext.jsx'

export default function TagMeal() {
  const { addMeal } = useContext(MealContext)
  const location = useLocation()
  const navigate = useNavigate()
  const imageFile = location.state?.image
  const [preview, setPreview] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)

  useEffect(() => {
    if (!imageFile) return

    let cancelled = false
    const reader = new FileReader()

    reader.onload = () => {
      if (!cancelled) setPreview(reader.result)
    }

    reader.readAsDataURL(imageFile)

    return () => {
      cancelled = true
    }
  }, [imageFile])

  const mealTagOptions = useMemo(() => ['HOME', 'OUTSIDE', 'MIXED'], [])

  async function handleTag(tag) {
    if (!preview || saving) return

    setSaving(true)
    setSaveError(null)
    try {
      await addMeal({ imageUrl: preview, tag })
      navigate('/')
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
            onClick={() => navigate('/camera')}
            className="inline-flex rounded-2xl border border-slate-900 px-4 py-3 text-slate-900 transition hover:bg-slate-100"
          >
            Go to Camera
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mx-auto max-w-xl space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-bold text-slate-900">Tag Meal</h1>
        <p className="text-slate-600">Preview the image and choose a meal tag.</p>

        <div className="overflow-hidden rounded-3xl bg-slate-100">
          {preview ? (
            <img src={preview} alt="Selected meal" className="h-72 w-full object-cover" />
          ) : (
            <div className="flex h-72 items-center justify-center text-slate-500">Loading preview…</div>
          )}
        </div>

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

        <Link
          to="/"
          className="inline-flex rounded-2xl border border-slate-900 px-4 py-3 text-slate-900 transition hover:bg-slate-100"
        >
          Cancel
        </Link>
      </div>
    </div>
  )
}
