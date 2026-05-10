import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

export default function TagMeal() {
  const location = useLocation()
  const navigate = useNavigate()
  const imageFile = location.state?.image
  const [preview, setPreview] = useState(null)

  useEffect(() => {
    if (!imageFile) {
      return
    }

    const objectUrl = URL.createObjectURL(imageFile)
    setPreview(objectUrl)

    return () => {
      URL.revokeObjectURL(objectUrl)
    }
  }, [imageFile])

  const mealTagOptions = useMemo(() => ['HOME', 'OUTSIDE', 'MIXED'], [])

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

        <div className="grid gap-3 sm:grid-cols-3">
          {mealTagOptions.map((tag) => (
            <button
              key={tag}
              type="button"
              className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
              onClick={() => console.log('Selected tag', tag)}
            >
              {tag}
            </button>
          ))}
        </div>

        <Link
          to="/"
          className="inline-flex rounded-2xl border border-slate-900 px-4 py-3 text-slate-900 transition hover:bg-slate-100"
        >
          Done
        </Link>
      </div>
    </div>
  )
}
