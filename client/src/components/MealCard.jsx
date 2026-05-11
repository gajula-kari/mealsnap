import { useState } from 'react'

const TAG_OPTIONS = ['HOME', 'OUTSIDE', 'MIXED']

export default function MealCard({ meal, onEdit, onDelete }) {
  const [editing, setEditing] = useState(false)
  const [tag, setTag] = useState(meal.tag)
  const [note, setNote] = useState(meal.note ?? '')
  const [amountSpent, setAmountSpent] = useState(meal.amountSpent ?? '')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  function openEdit() {
    setTag(meal.tag)
    setNote(meal.note ?? '')
    setAmountSpent(meal.amountSpent ?? '')
    setEditing(true)
  }

  async function handleSave() {
    setSaving(true)
    try {
      await onEdit(meal.id, {
        tag,
        note: note.trim() || null,
        amountSpent: tag === 'HOME' ? null : (amountSpent !== '' ? Number(amountSpent) : null),
      })
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      await onDelete(meal.id)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="h-48 w-full overflow-hidden bg-slate-100">
        {meal.imageUrl ? (
          <img src={meal.imageUrl} alt={`${meal.tag} meal`} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-slate-500">No image</div>
        )}
      </div>

      <div className="space-y-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
            {meal.tag}
          </span>
          {(onEdit || onDelete) && (
            <div className="flex gap-2">
              {onEdit && !editing && (
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
                  onClick={handleDelete}
                  disabled={deleting}
                  className="rounded-xl border border-rose-200 px-3 py-1 text-xs text-rose-500 transition hover:bg-rose-50 disabled:opacity-50"
                >
                  {deleting ? '…' : 'Delete'}
                </button>
              )}
            </div>
          )}
        </div>

        {!editing && meal.note && (
          <p className="text-sm text-slate-500">{meal.note}</p>
        )}
        {!editing && meal.amountSpent != null && (
          <p className="text-sm font-medium text-slate-700">₹{meal.amountSpent}</p>
        )}

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
