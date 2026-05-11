import { useState } from 'react'
import type { Meal, MealTag, UpdateMealPayload } from '../types'

const TAG_OPTIONS: MealTag[] = ['HOME', 'OUTSIDE', 'MIXED']

const TAG_COLOR: Record<MealTag, string> = {
  HOME: 'bg-emerald-100 text-emerald-700',
  OUTSIDE: 'bg-rose-100 text-rose-700',
  MIXED: 'bg-amber-100 text-amber-700',
}

interface MealCardProps {
  meal: Meal
  onEdit?: (id: string, payload: UpdateMealPayload) => Promise<Meal>
  onDelete?: (id: string) => Promise<void>
}

export default function MealCard({ meal, onEdit, onDelete }: MealCardProps) {
  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [tag, setTag] = useState<MealTag>(meal.tag)
  const [note, setNote] = useState(meal.note ?? '')
  const [amountSpent, setAmountSpent] = useState<number | string>(meal.amountSpent ?? '')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const timeLabel = new Date(meal.occurredAt).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })

  function openEdit() {
    setTag(meal.tag)
    setNote(meal.note ?? '')
    setAmountSpent(meal.amountSpent ?? '')
    setConfirmDelete(false)
    setEditing(true)
  }

  async function handleSave() {
    setSaving(true)
    try {
      await onEdit?.(meal.id, {
        tag,
        note: note.trim() || null,
        amountSpent: tag === 'HOME' ? null : amountSpent !== '' ? Number(amountSpent) : null,
      })
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

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
    <article className="overflow-hidden rounded-3xl bg-white shadow-md">
      {/* Portrait image */}
      <div className="aspect-[3/4] w-full overflow-hidden bg-slate-100">
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
      </div>

      {/* Footer */}
      <div className="space-y-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider ${TAG_COLOR[meal.tag] ?? 'bg-slate-100 text-slate-600'}`}
            >
              {meal.tag}
            </span>
            <span className="text-xs text-slate-400">{timeLabel}</span>
          </div>

          {(onEdit || onDelete) && !editing && !confirmDelete && (
            <div className="flex gap-2">
              {onEdit && (
                <button
                  type="button"
                  onClick={openEdit}
                  className="rounded-xl border border-slate-200 px-3 py-1 text-xs text-slate-500 transition hover:bg-slate-50"
                >
                  Edit
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="rounded-xl border border-rose-200 px-3 py-1 text-xs text-rose-500 transition hover:bg-rose-50"
                >
                  Delete
                </button>
              )}
            </div>
          )}
        </div>

        {!editing && meal.note && <p className="text-sm text-slate-500">{meal.note}</p>}
        {!editing && meal.amountSpent != null && (
          <p className="text-sm font-medium text-slate-700">₹{meal.amountSpent}</p>
        )}

        {/* Delete confirmation */}
        {confirmDelete && (
          <div className="flex items-center justify-between gap-2 rounded-2xl bg-rose-50 px-4 py-3">
            <p className="text-sm text-rose-700">Delete this meal?</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-xl bg-rose-600 px-3 py-1 text-xs font-semibold text-white disabled:opacity-50"
              >
                {deleting ? '…' : 'Yes'}
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="rounded-xl border border-rose-200 px-3 py-1 text-xs text-rose-600 hover:bg-rose-100"
              >
                No
              </button>
            </div>
          </div>
        )}

        {/* Edit form */}
        {editing && (
          <div className="space-y-3 border-t border-slate-100 pt-3">
            <div className="grid grid-cols-3 gap-2">
              {TAG_OPTIONS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTag(t)}
                  className={`rounded-2xl border px-2 py-2 text-xs font-semibold transition ${
                    tag === t
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {tag !== 'HOME' && (
              <input
                type="number"
                placeholder="Amount spent"
                value={amountSpent}
                onChange={(e) => setAmountSpent(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
              />
            )}

            <textarea
              placeholder="Note (optional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              className="w-full resize-none rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
            />

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="flex-1 rounded-2xl bg-slate-900 py-2 text-sm font-semibold text-white transition disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-600 transition hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </article>
  )
}
