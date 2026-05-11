// Home has two pieces of real logic worth testing:
//   1. calculateStreak — counts consecutive days ending today
//   2. UI states — loading dash, plural/singular day, error message
//
// Neither function is exported, so we test them through the rendered output.
// useMealContext is mocked so we control exactly what data the component sees.

import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Home from './Home'

vi.mock('../hooks/useMealContext.js')
import { useMealContext } from '../hooks/useMealContext.js'

// Renders Home inside MemoryRouter so useNavigate doesn't throw.
function renderHome() {
  return render(
    <MemoryRouter>
      <Home />
    </MemoryRouter>,
  )
}

// Builds a meal that occurred on a given Date object.
function mealOn(date) {
  return { id: String(date.getTime()), tag: 'HOME', occurredAt: date.getTime() }
}

// Returns a Date set to N days before today (same wall-clock day, noon).
function daysAgo(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(12, 0, 0, 0)
  return d
}

beforeEach(() => {
  vi.clearAllMocks()
})

// ─── Loading and error states ─────────────────────────────────────────────────

describe('loading and error states', () => {
  it('shows "—" while meals are loading', () => {
    useMealContext.mockReturnValue({ meals: [], loading: true, error: null })
    renderHome()

    // The streak section renders "—" instead of a number during load.
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('shows the error message when loading fails', () => {
    useMealContext.mockReturnValue({ meals: [], loading: false, error: 'Failed to load' })
    renderHome()

    expect(screen.getByText('Failed to load')).toBeInTheDocument()
  })
})

// ─── calculateStreak ─────────────────────────────────────────────────────────

describe('calculateStreak (via rendered streak text)', () => {
  it('shows "0 days" when no meals are logged', () => {
    useMealContext.mockReturnValue({ meals: [], loading: false, error: null })
    renderHome()

    expect(screen.getByText('0 days')).toBeInTheDocument()
  })

  it('shows "0 days" when the most recent meal is not today', () => {
    // A meal from yesterday means today is unlogged → streak breaks.
    useMealContext.mockReturnValue({
      meals: [mealOn(daysAgo(1))],
      loading: false,
      error: null,
    })
    renderHome()

    expect(screen.getByText('0 days')).toBeInTheDocument()
  })

  it('shows "1 day" (singular) when only today is logged', () => {
    useMealContext.mockReturnValue({
      meals: [mealOn(daysAgo(0))],
      loading: false,
      error: null,
    })
    renderHome()

    // Singular: "1 day" not "1 days".
    expect(screen.getByText('1 day')).toBeInTheDocument()
    expect(screen.queryByText('1 days')).not.toBeInTheDocument()
  })

  it('shows "2 days" for today + yesterday', () => {
    useMealContext.mockReturnValue({
      meals: [mealOn(daysAgo(0)), mealOn(daysAgo(1))],
      loading: false,
      error: null,
    })
    renderHome()

    expect(screen.getByText('2 days')).toBeInTheDocument()
  })

  it('breaks the streak on a gap — counts only the unbroken run', () => {
    // Today + 2 days ago, skipping yesterday → streak = 1 despite 2 logged days.
    useMealContext.mockReturnValue({
      meals: [mealOn(daysAgo(0)), mealOn(daysAgo(2))],
      loading: false,
      error: null,
    })
    renderHome()

    expect(screen.getByText('1 day')).toBeInTheDocument()
  })

  it('counts multiple meals on the same day as one streak day', () => {
    // Three meals today should still be a 1-day streak, not 3.
    useMealContext.mockReturnValue({
      meals: [mealOn(daysAgo(0)), mealOn(daysAgo(0)), mealOn(daysAgo(0))],
      loading: false,
      error: null,
    })
    renderHome()

    expect(screen.getByText('1 day')).toBeInTheDocument()
  })
})
