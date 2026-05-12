import { useCallback, useEffect, useMemo, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import exifr from 'exifr'
import { useMealContext } from '../hooks/useMealContext'
import Spinner from '../components/Spinner'
import type { Meal, MealTag } from '../types'

interface TagMealLocationState {
  image?: File
  date?: string
  meal?: Meal
  source?: 'camera' | 'gallery'
}

function formatTimeDisplay(time: string): string {
  const [hh, mm] = time.split(':').map(Number)
  const d = new Date()
  d.setHours(hh, mm, 0, 0)
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

function formatDateLabel(date: Date, includeTime: boolean): string {
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

function formatLocalDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const TAG_OPTIONS: MealTag[] = ['CLEAN', 'INDULGENT']

export default function TagMeal() {
  const { addMeal, updateMeal } = useMealContext()
  const location = useLocation()
  const navigate = useNavigate()
  const state = location.state as TagMealLocationState | null

  const imageFile = state?.image
  const dateFromState = state?.date
  const existingMeal = state?.meal
  const source = state?.source

  const [preview, setPreview] = useState<string | null>(existingMeal?.imageUrl ?? null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [mountedAt] = useState(() => Date.now())
  const [selectedTag, setSelectedTag] = useState<MealTag>(existingMeal?.tag ?? 'CLEAN')
  const [note, setNote] = useState(existingMeal?.note ?? '')
  const [amountSpent, setAmountSpent] = useState<number | string>(existingMeal?.amountSpent ?? '')
  const [selectedTime, setSelectedTime] = useState<string | null>(() => {
    if (state?.source !== 'camera' || state?.meal) return null
    const d = new Date()
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  })
  const [timeSource, setTimeSource] = useState<'auto' | 'manual' | null>(() =>
    state?.source === 'camera' && !state?.meal ? 'auto' : null
  )
  const [showTimePicker, setShowTimePicker] = useState(false)

  const { occurredAt, dateLabel } = useMemo(() => {
    if (existingMeal) {
      const d = new Date(existingMeal.occurredAt)
      return { occurredAt: existingMeal.occurredAt, dateLabel: formatDateLabel(d, true) }
    }

    const base = dateFromState
      ? (() => {
          const [y, m, d] = dateFromState.split('-').map(Number)
          return new Date(y, m - 1, d)
        })()
      : new Date(mountedAt)

    const dateLabel = formatDateLabel(base, false)

    if (selectedTime) {
      const [hh, mm] = selectedTime.split(':').map(Number)
      const d = new Date(base)
      d.setHours(hh, mm, 0, 0)
      return { occurredAt: d.getTime(), dateLabel }
    }

    if (source === 'camera') {
      const mounted = new Date(mountedAt)
      const d = new Date(base)
      d.setHours(mounted.getHours(), mounted.getMinutes(), mounted.getSeconds(), 0)
      return { occurredAt: d.getTime(), dateLabel }
    }

    const noon = new Date(base)
    noon.setHours(12, 0, 0, 0)
    return { occurredAt: noon.getTime(), dateLabel }
  }, [existingMeal, dateFromState, mountedAt, selectedTime, source])

  useEffect(() => {
    if (existingMeal?.imageUrl) return
    if (!imageFile) return
    let cancelled = false
    const reader = new FileReader()
    reader.onload = () => {
      if (!cancelled) setPreview(reader.result as string)
    }
    reader.readAsDataURL(imageFile)
    return () => {
      cancelled = true
    }
  }, [imageFile, existingMeal])

  useEffect(() => {
    if (source !== 'gallery' || !imageFile || existingMeal) return
    let cancelled = false
    exifr
      .parse(imageFile, ['DateTimeOriginal'])
      .then((data) => {
        if (cancelled) return
        const exifDate = data?.DateTimeOriginal
        if (exifDate instanceof Date && !isNaN(exifDate.getTime())) {
          const hh = String(exifDate.getHours()).padStart(2, '0')
          const mm = String(exifDate.getMinutes()).padStart(2, '0')
          setSelectedTime(`${hh}:${mm}`)
          setTimeSource('auto')
        }
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [source, imageFile, existingMeal])

  const backTarget = useMemo(() => {
    if (existingMeal) return `/day/${formatLocalDate(new Date(existingMeal.occurredAt))}`
    if (dateFromState) return `/day/${dateFromState}`
    return '/'
  }, [existingMeal, dateFromState])

  const handleSave = useCallback(async () => {
    if (saving) return

    setSaving(true)
    setSaveError(null)
    try {
      const trimmedNote = note.trim() || null
      const parsedAmount =
        selectedTag === 'CLEAN' ? null : amountSpent !== '' ? Number(amountSpent) : null

      if (existingMeal) {
        await updateMeal(existingMeal.id, {
          tag: selectedTag,
          note: trimmedNote,
          amountSpent: parsedAmount,
        })
      } else {
        if (!imageFile || !preview) return
        await addMeal({
          image: imageFile,
          tag: selectedTag,
          occurredAt: occurredAt ?? Date.now(),
          note: trimmedNote,
          amountSpent: parsedAmount,
        })
      }

      navigate(backTarget, { replace: true })
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Unknown error')
      setSaving(false)
    }
  }, [
    saving,
    note,
    selectedTag,
    amountSpent,
    existingMeal,
    imageFile,
    preview,
    occurredAt,
    updateMeal,
    addMeal,
    navigate,
    backTarget,
  ])

  if (!imageFile && !existingMeal) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="p-6">
      <div className="mx-auto max-w-xl space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-bold text-slate-900">
          {existingMeal ? 'Edit Meal' : 'Tag Meal'}
        </h1>

        <div className="overflow-hidden rounded-3xl bg-slate-100">
          {preview ? (
            <img src={preview} alt="Meal" className="h-72 w-full object-cover" />
          ) : (
            <div className="flex h-72 items-center justify-center">
              <Spinner />
            </div>
          )}
        </div>

        <p className="text-sm text-slate-500">{dateLabel}</p>

        {!existingMeal && (
          <div className="mt-1">
            {showTimePicker ? (
              <input
                type="time"
                value={selectedTime ?? ''}
                autoFocus
                onChange={(e) => {
                  setSelectedTime(e.target.value || null)
                  setTimeSource('manual')
                  setShowTimePicker(false)
                }}
                onBlur={() => setShowTimePicker(false)}
                className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-slate-400"
              />
            ) : selectedTime ? (
              <button
                type="button"
                onClick={() => setShowTimePicker(true)}
                className="text-sm text-slate-600 transition hover:text-slate-900"
              >
                {formatTimeDisplay(selectedTime)}
                {timeSource === 'auto' && (
                  <span className="ml-1.5 text-xs text-slate-400">· tap to edit</span>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowTimePicker(true)}
                className="text-xs text-slate-400 transition hover:text-slate-600"
              >
                + Add time (optional)
              </button>
            )}
          </div>
        )}

        {saveError && (
          <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-600">{saveError}</p>
        )}

        <div className="grid grid-cols-2 gap-3">
          {TAG_OPTIONS.map((tag) => (
            <button
              key={tag}
              type="button"
              disabled={saving || !preview}
              className={`rounded-3xl border px-4 py-4 text-sm font-semibold transition disabled:opacity-50 ${
                selectedTag === tag
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
              }`}
              onClick={() => setSelectedTag(tag)}
            >
              {tag === 'CLEAN' ? '✓ Clean' : '⚠ Indulgent'}
            </button>
          ))}
        </div>

        {selectedTag !== 'CLEAN' && (
          <input
            type="number"
            placeholder="Amount spent (optional)"
            value={amountSpent}
            onChange={(e) => setAmountSpent(e.target.value)}
            className="w-full rounded-3xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
          />
        )}

        <textarea
          placeholder="Note (optional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          className="w-full resize-none rounded-3xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
        />

        <button
          type="button"
          disabled={saving || !preview}
          onClick={handleSave}
          className="w-full rounded-3xl bg-slate-900 px-4 py-4 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50"
        >
          {saving ? (
            <span className="flex items-center justify-center gap-2">
              <Spinner size="sm" /> Saving
            </span>
          ) : (
            'Save'
          )}
        </button>

        <button
          type="button"
          onClick={() => navigate(backTarget, { replace: true })}
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-600 transition hover:bg-slate-50"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
