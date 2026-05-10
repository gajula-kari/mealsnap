import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Camera() {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)

  function handleFileChange(event) {
    const file = event.target.files?.[0]
    if (file) {
      navigate('/tag', { state: { image: file } })
    }
  }

  return (
    <div className="p-6">
      <div className="mx-auto max-w-xl space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-bold text-slate-900">Capture Meal Image</h1>
        <p className="text-slate-600">Select or capture an image, then continue to tagging.</p>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-center text-white shadow-sm transition hover:bg-slate-700"
        >
          Capture / Select Image
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </div>
  )
}
