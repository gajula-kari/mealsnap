import { useState } from 'react'
import { useSettingsContext } from '../hooks/useSettingsContext'

const QUICK_OPTIONS = [5, 7, 10, 15]

const SCREENS = [
  {
    title: 'Eating out more than you planned?',
    subtitle: 'It adds up without you noticing.',
  },
  {
    title: 'Stay aware of indulgent meals',
    subtitle: 'Track when you go off track — no calories, no complexity.',
  },
  {
    title: 'Set your monthly limit',
    subtitle: 'How many indulgent days do you allow yourself per month?',
  },
]

export default function Onboard({ onComplete }: { onComplete: () => void }) {
  const { saveSettings } = useSettingsContext()
  const [step, setStep] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)

  async function handleStart() {
    if (selected === null) return
    setSaving(true)
    try {
      await saveSettings(selected)
      localStorage.setItem('aaharya_onboarded', 'true')
      onComplete()
    } catch {
      setSaving(false)
    }
  }

  const screen = SCREENS[step]

  return (
    <div className="flex h-screen flex-col justify-between bg-slate-50 px-6 py-12">
      <div className="mx-auto w-full max-w-[480px] flex-1 flex flex-col justify-center space-y-4">
        <h1 className="text-2xl font-semibold text-slate-900">{screen.title}</h1>
        <p className="text-sm text-slate-500">{screen.subtitle}</p>

        {step === 2 && (
          <div className="mt-6 flex gap-2">
            {QUICK_OPTIONS.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setSelected(opt)}
                className={`rounded-xl px-4 py-3 text-sm font-semibold transition
                  ${selected === opt ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
              >
                {opt}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mx-auto w-full max-w-[480px] space-y-4">
        <div className="flex justify-center gap-2">
          {SCREENS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 w-6 rounded-full transition ${i === step ? 'bg-slate-900' : 'bg-slate-200'}`}
            />
          ))}
        </div>

        {step < SCREENS.length - 1 ? (
          <button
            type="button"
            onClick={() => setStep((s) => s + 1)}
            className="w-full rounded-2xl bg-slate-900 py-4 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            Next
          </button>
        ) : (
          <button
            type="button"
            onClick={handleStart}
            disabled={selected === null || saving}
            className="w-full rounded-2xl bg-slate-900 py-4 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50"
          >
            {saving ? 'Setting up…' : 'Get Started'}
          </button>
        )}
      </div>
    </div>
  )
}
