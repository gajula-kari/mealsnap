import { useEffect, useState } from 'react'
import type { Meal } from '../types'

const TAG_DOT: Record<string, string> = {
  CLEAN: 'bg-emerald-500',
  INDULGENT: 'bg-amber-500',
}

interface MealCardProps {
  meal: Meal
  onTap?: () => void
  onDelete?: (id: string) => Promise<void>
}

export default function MealCard({ meal, onTap, onDelete }: MealCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [lightbox, setLightbox] = useState(false)

  const timeLabel = new Date(meal.occurredAt).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })

  useEffect(() => {
    if (!lightbox) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setLightbox(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightbox])

  async function handleDelete() {
    setDeleting(true)
    try {
      await onDelete?.(meal.id)
    } finally {
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  return (
    <article className="mb-3 break-inside-avoid overflow-hidden rounded-3xl bg-white shadow-md transition-shadow hover:shadow-lg">
      {/* Image */}
      <div
        className={`relative aspect-[3/4] w-full overflow-hidden bg-slate-100 ${onTap || meal.imageUrl ? 'cursor-pointer' : ''}`}
        onClick={() => {
          if (onTap) onTap()
          else if (meal.imageUrl) setLightbox(true)
        }}
      >
        {meal.imageUrl ? (
          <img
            src={meal.imageUrl}
            alt={`${meal.tag} meal`}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-slate-400">
            No image
          </div>
        )}

        {/* Tag dot — top-left */}
        {!confirmDelete && (
          <span
            className={`absolute left-2 top-2 h-4 w-4 rounded-full shadow-sm ${TAG_DOT[meal.tag]}`}
          />
        )}

        {/* Time — center bottom */}
        {!confirmDelete && (
          <div className="absolute bottom-0 left-0 right-0 flex justify-center pb-3">
            <span className="rounded-full bg-black/30 px-2 py-1 text-xs text-white backdrop-blur-sm">
              {timeLabel}
            </span>
          </div>
        )}

        {/* Dustbin — bottom-right */}
        {onDelete && !confirmDelete && (
          <button
            type="button"
            aria-label="Delete meal"
            onClick={(e) => {
              e.stopPropagation()
              setConfirmDelete(true)
            }}
            className="absolute bottom-2 right-2 rounded-full bg-black/40 p-1.5 text-white transition hover:bg-black/60"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              <path d="M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
            </svg>
          </button>
        )}

        {/* Delete confirmation overlay */}
        {confirmDelete && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/60 px-4"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-center text-sm font-medium text-white">Delete this meal?</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
              >
                {deleting ? '…' : 'Yes, delete'}
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="rounded-xl bg-white/20 px-4 py-2 text-xs font-semibold text-white hover:bg-white/30"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer — note and amount if present */}
      {(meal.note || meal.amountSpent != null) && (
        <div className="space-y-1 p-4">
          {meal.note && <p className="text-sm text-slate-500">{meal.note}</p>}
          {meal.amountSpent != null && (
            <p className="text-sm font-medium text-slate-700">₹{meal.amountSpent}</p>
          )}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && meal.imageUrl && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Meal image"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightbox(false)}
        >
          <img
            src={meal.imageUrl}
            alt={`${meal.tag} meal`}
            className="max-h-[90vh] max-w-full rounded-2xl object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </article>
  )
}
