import { useParams, Navigate } from 'react-router-dom'
import { useMealContext } from '../hooks/useMealContext'
import MealCard from '../components/MealCard'
import type { MealTag } from '../types'

const VALID_TAGS: MealTag[] = ['CLEAN', 'INDULGENT']

const TAG_LABEL: Record<MealTag, string> = {
  CLEAN: 'Clean',
  INDULGENT: 'Indulgent',
}

export default function MealsByTag() {
  const { tag } = useParams<{ tag: string }>()
  const { meals } = useMealContext()

  const normalised = tag?.toUpperCase() as MealTag
  if (!VALID_TAGS.includes(normalised)) return <Navigate to="/" replace />

  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth()

  const filtered = meals.filter((m) => {
    const d = new Date(m.occurredAt)
    return d.getFullYear() === year && d.getMonth() === month && m.tag === normalised
  })

  return (
    <div className="space-y-4">
      <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
        {TAG_LABEL[normalised]} meals · {today.toLocaleString('default', { month: 'long' })}
      </p>

      {filtered.length === 0 ? (
        <p className="text-sm text-slate-400">
          No {TAG_LABEL[normalised].toLowerCase()} meals this month.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filtered.map((meal) => (
            <MealCard key={meal.id} meal={meal} />
          ))}
        </div>
      )}
    </div>
  )
}
