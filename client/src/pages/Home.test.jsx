// Home has two pieces of real logic worth testing:
//   1. calculateStreak — counts consecutive days ending today
//   2. UI states — loading dash, plural/singular day, error message
//
// Neither function is exported, so we test them through the rendered output.
// useMealContext is mocked so we control exactly what data the component sees.

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Home from './Home'

vi.mock('../hooks/useMealContext.js')
vi.mock('../services/settingsApi.js')
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, useNavigate: vi.fn(() => vi.fn()) }
})

import { useMealContext } from '../hooks/useMealContext.js'
import { fetchSettings } from '../services/settingsApi.js'
import { useNavigate } from 'react-router-dom'

// Renders Home inside MemoryRouter so useNavigate doesn't throw.
function renderHome() {
  return render(
    <MemoryRouter>
      <Home />
    </MemoryRouter>
  )
}

// Builds a meal that occurred on a given Date object.
function mealOn(date) {
  return { id: String(date.getTime()), tag: 'CLEAN', occurredAt: date.getTime() }
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
  fetchSettings.mockResolvedValue(null)
})

// ─── Loading and error states ─────────────────────────────────────────────────

describe('loading and error states', () => {
  it('shows "—" while meals are loading', () => {
    useMealContext.mockReturnValue({ meals: [], loading: true, error: null })
    renderHome()

    // Streak + all three stat counters show "—" while loading.
    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(1)
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

// ─── Calendar grid ────────────────────────────────────────────────────────────

describe('calendar grid', () => {
  const today = new Date()

  function mealToday(tag) {
    return {
      id: tag,
      tag,
      occurredAt: new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        12,
        0,
        0
      ).getTime(),
    }
  }

  it('applies emerald class to today when the meal is CLEAN', () => {
    useMealContext.mockReturnValue({ meals: [mealToday('CLEAN')], loading: false, error: null })
    renderHome()
    expect(screen.getByRole('button', { name: String(today.getDate()) })).toHaveClass(
      'bg-emerald-100'
    )
  })

  it('applies amber class to today when the meal is INDULGENT and no limit is set', () => {
    useMealContext.mockReturnValue({ meals: [mealToday('INDULGENT')], loading: false, error: null })
    renderHome()
    expect(screen.getByRole('button', { name: String(today.getDate()) })).toHaveClass(
      'bg-amber-100'
    )
  })

  it('applies amber class to today when there are both CLEAN and INDULGENT meals', () => {
    useMealContext.mockReturnValue({
      meals: [mealToday('CLEAN'), mealToday('INDULGENT')],
      loading: false,
      error: null,
    })
    renderHome()
    expect(screen.getByRole('button', { name: String(today.getDate()) })).toHaveClass(
      'bg-amber-100'
    )
  })

  it('applies amber class when all meals today are INDULGENT and no limit is set', () => {
    useMealContext.mockReturnValue({
      meals: [mealToday('INDULGENT'), mealToday('INDULGENT')],
      loading: false,
      error: null,
    })
    renderHome()
    expect(screen.getByRole('button', { name: String(today.getDate()) })).toHaveClass(
      'bg-amber-100'
    )
  })

  it('applies rose class when the indulgent day falls beyond the limit cutoff', async () => {
    // Limit = 0 means any indulgent day is immediately over the limit → rose.
    fetchSettings.mockResolvedValue({ monthlyIndulgentLimit: 0 })
    useMealContext.mockReturnValue({
      meals: [mealToday('INDULGENT')],
      loading: false,
      error: null,
    })
    renderHome()

    // Wait for settings to resolve — OVER chip only appears once limit is loaded.
    await screen.findByText('OVER')
    expect(screen.getByRole('button', { name: String(today.getDate()) })).toHaveClass('bg-rose-100')
  })

  it('applies emerald class when all meals today are CLEAN', () => {
    useMealContext.mockReturnValue({
      meals: [mealToday('CLEAN'), mealToday('CLEAN')],
      loading: false,
      error: null,
    })
    renderHome()
    expect(screen.getByRole('button', { name: String(today.getDate()) })).toHaveClass(
      'bg-emerald-100'
    )
  })

  it('applies slate class to today when no meals are logged', () => {
    useMealContext.mockReturnValue({ meals: [], loading: false, error: null })
    renderHome()
    expect(screen.getByRole('button', { name: String(today.getDate()) })).toHaveClass(
      'bg-slate-100'
    )
  })

  it("clicking today's day button navigates to /day/YYYY-MM-DD", async () => {
    const navigate = vi.fn()
    useNavigate.mockReturnValue(navigate)
    useMealContext.mockReturnValue({ meals: [], loading: false, error: null })
    renderHome()

    await userEvent.click(screen.getByRole('button', { name: String(today.getDate()) }))

    const y = today.getFullYear()
    const m = String(today.getMonth() + 1).padStart(2, '0')
    const d = String(today.getDate()).padStart(2, '0')
    expect(navigate).toHaveBeenCalledWith(`/day/${y}-${m}-${d}`)
  })
})

// ─── Stats card ──────────────────────────────────────────────────────────────

describe('stats card', () => {
  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth()

  function mealThisMonth(tag, dayOffset = 0) {
    return {
      id: `${tag}-${dayOffset}`,
      tag,
      occurredAt: new Date(year, month, 1 + dayOffset, 12, 0, 0).getTime(),
    }
  }

  it('shows Clean days and Indulgent days labels', () => {
    useMealContext.mockReturnValue({ meals: [], loading: false, error: null })
    renderHome()

    expect(screen.getByText('Clean days')).toBeInTheDocument()
    expect(screen.getByText('Indulgent days')).toBeInTheDocument()
    expect(screen.queryByText('Both days')).not.toBeInTheDocument()
  })

  it('counts a day with only CLEAN meals as a clean day', () => {
    useMealContext.mockReturnValue({
      meals: [mealThisMonth('CLEAN', 0), mealThisMonth('CLEAN', 0)],
      loading: false,
      error: null,
    })
    renderHome()

    expect(screen.getByText('Clean days').previousSibling.textContent).toBe('1')
  })

  it('counts a day with CLEAN + INDULGENT meals as an indulgent day', () => {
    useMealContext.mockReturnValue({
      meals: [mealThisMonth('CLEAN', 0), mealThisMonth('INDULGENT', 0)],
      loading: false,
      error: null,
    })
    renderHome()

    expect(screen.getByText('Indulgent days').previousSibling.textContent).toBe('1')
    expect(screen.getByText('Clean days').previousSibling.textContent).toBe('0')
  })

  it('shows banner when indulgent days exceed the limit', async () => {
    fetchSettings.mockResolvedValue({ monthlyIndulgentLimit: 1 })
    // Day 1: CLEAN only (clean day). Day 2: CLEAN + INDULGENT (indulgent day = 1, at limit).
    // Day 3: INDULGENT (indulgent day = 2, now over limit = 1).
    useMealContext.mockReturnValue({
      meals: [
        mealThisMonth('CLEAN', 0),
        mealThisMonth('CLEAN', 1),
        mealThisMonth('INDULGENT', 1),
        mealThisMonth('INDULGENT', 2),
      ],
      loading: false,
      error: null,
    })
    renderHome()

    expect(await screen.findByText('Indulgent day limit reached')).toBeInTheDocument()
  })

  it('does not show the banner when indulgent total is within the limit', async () => {
    fetchSettings.mockResolvedValue({ monthlyIndulgentLimit: 5 })
    useMealContext.mockReturnValue({
      meals: [mealThisMonth('INDULGENT', 0)],
      loading: false,
      error: null,
    })
    renderHome()

    // Wait for settings to load, then confirm banner is absent.
    await screen.findByText('Indulgent days')
    expect(screen.queryByText('Indulgent day limit reached')).not.toBeInTheDocument()
  })

  it('does not show the banner when no limit is set', () => {
    fetchSettings.mockResolvedValue(null)
    useMealContext.mockReturnValue({
      meals: [
        mealThisMonth('INDULGENT', 0),
        mealThisMonth('INDULGENT', 1),
        mealThisMonth('INDULGENT', 2),
      ],
      loading: false,
      error: null,
    })
    renderHome()

    expect(screen.queryByText('Indulgent day limit reached')).not.toBeInTheDocument()
  })
})

// ─── FAB file input ───────────────────────────────────────────────────────────

describe('FAB file input', () => {
  it('navigates to /tag with the selected file when a file is chosen', async () => {
    const navigate = vi.fn()
    useNavigate.mockReturnValue(navigate)
    useMealContext.mockReturnValue({ meals: [], loading: false, error: null })
    renderHome()

    const file = new File(['img'], 'meal.jpg', { type: 'image/jpeg' })
    const input = document.querySelector('input[type="file"]')
    await userEvent.upload(input, file)

    expect(navigate).toHaveBeenCalledWith('/tag', { state: { image: file } })
  })
})
