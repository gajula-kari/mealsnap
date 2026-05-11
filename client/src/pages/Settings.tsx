import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchSettings, saveSettings } from '../services/settingsApi'

const QUICK_OPTIONS = [5, 7, 10, 15]

function formatDate(ts: number | null | undefined): string | null {
  if (!ts) return null
  return new Date(ts).toLocaleDateString('default', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export default function Settings() {
  const navigate = useNavigate()
  const [goal, setGoal] = useState('')
  const [previousGoal, setPreviousGoal] = useState<number | null | undefined>(null)
  const [goalUpdatedAt, setGoalUpdatedAt] = useState<number | null | undefined>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchSettings()
      .then((s) => {
        if (s) {
          setGoal(s.monthlyOutsideGoal != null ? String(s.monthlyOutsideGoal) : '')
          setPreviousGoal(s.previousGoal)
          setGoalUpdatedAt(s.goalUpdatedAt)
        }
      })
      .catch(() => {})
  }, [])

  async function handleSave() {
    const parsed = parseInt(goal, 10)
    if (!parsed || parsed < 1) {
      setError('Please enter a valid number')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const updated = await saveSettings(parsed)
      setPreviousGoal(updated.previousGoal)
      setGoalUpdatedAt(updated.goalUpdatedAt)
      navigate('/')
    } catch {
      setError('Failed to save. Try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Outside Eating Limit</h2>
        <p className="mt-1 text-sm text-slate-500">
          Set how many days you're okay eating outside each month
        </p>

        <div className="mt-4 flex gap-2">
          {QUICK_OPTIONS.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setGoal(String(opt))}
              className={`rounded-xl px-3 py-2 text-sm font-semibold transition
                ${
                  goal === String(opt)
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
            >
              {opt}
            </button>
          ))}
        </div>

        <input
          type="number"
          min="1"
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder="Custom number"
          className="mt-3 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-400"
        />

        {(goalUpdatedAt || previousGoal != null) && (
          <div className="mt-4 space-y-1 text-xs text-slate-400">
            {goalUpdatedAt && <p>Last updated: {formatDate(goalUpdatedAt)}</p>}
            {previousGoal != null && <p>Previous goal: {previousGoal} days</p>}
          </div>
        )}

        {error && <p className="mt-2 text-sm text-rose-500">{error}</p>}

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="mt-5 w-full rounded-2xl bg-slate-900 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </section>
    </div>
  )
}
