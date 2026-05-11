import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Home from './Home'
import type { Meal } from '../types'

vi.mock('../hooks/useMealContext')
vi.mock('../services/settingsApi')
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return { ...actual, useNavigate: vi.fn(() => vi.fn()) }
})

import { useMealContext } from '../hooks/useMealContext'
import { fetchSettings } from '../services/settingsApi'
import { useNavigate } from 'react-router-dom'

function renderHome() {
  return render(
    <MemoryRouter>
      <Home />
    </MemoryRouter>
  )
}

function mealOn(date: Date): Meal {
  return {
    id: String(date.getTime()),
    tag: 'HOME',
    imageUrl: null,
    amountSpent: null,
    note: null,
    occurredAt: date.getTime(),
  }
}

function daysAgo(n: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(12, 0, 0, 0)
  return d
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(fetchSettings).mockResolvedValue(null)
})

describe('loading and error states', () => {
  it('shows "—" while meals are loading', () => {
    vi.mocked(useMealContext).mockReturnValue({
      meals: [],
      loading: true,
      error: null,
      addMeal: vi.fn(),
      updateMeal: vi.fn(),
      deleteMeal: vi.fn(),
    })
    renderHome()

    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(1)
  })

  it('shows the error message when loading fails', () => {
    vi.mocked(useMealContext).mockReturnValue({
      meals: [],
      loading: false,
      error: 'Failed to load',
      addMeal: vi.fn(),
      updateMeal: vi.fn(),
      deleteMeal: vi.fn(),
    })
    renderHome()

    expect(screen.getByText('Failed to load')).toBeInTheDocument()
  })
})

describe('calculateStreak (via rendered streak text)', () => {
  it('shows "0 days" when no meals are logged', () => {
    vi.mocked(useMealContext).mockReturnValue({
      meals: [],
      loading: false,
      error: null,
      addMeal: vi.fn(),
      updateMeal: vi.fn(),
      deleteMeal: vi.fn(),
    })
    renderHome()

    expect(screen.getByText('0 days')).toBeInTheDocument()
  })

  it('shows "0 days" when the most recent meal is not today', () => {
    vi.mocked(useMealContext).mockReturnValue({
      meals: [mealOn(daysAgo(1))],
      loading: false,
      error: null,
      addMeal: vi.fn(),
      updateMeal: vi.fn(),
      deleteMeal: vi.fn(),
    })
    renderHome()

    expect(screen.getByText('0 days')).toBeInTheDocument()
  })

  it('shows "1 day" (singular) when only today is logged', () => {
    vi.mocked(useMealContext).mockReturnValue({
      meals: [mealOn(daysAgo(0))],
      loading: false,
      error: null,
      addMeal: vi.fn(),
      updateMeal: vi.fn(),
      deleteMeal: vi.fn(),
    })
    renderHome()

    expect(screen.getByText('1 day')).toBeInTheDocument()
    expect(screen.queryByText('1 days')).not.toBeInTheDocument()
  })

  it('shows "2 days" for today + yesterday', () => {
    vi.mocked(useMealContext).mockReturnValue({
      meals: [mealOn(daysAgo(0)), mealOn(daysAgo(1))],
      loading: false,
      error: null,
      addMeal: vi.fn(),
      updateMeal: vi.fn(),
      deleteMeal: vi.fn(),
    })
    renderHome()

    expect(screen.getByText('2 days')).toBeInTheDocument()
  })

  it('breaks the streak on a gap — counts only the unbroken run', () => {
    vi.mocked(useMealContext).mockReturnValue({
      meals: [mealOn(daysAgo(0)), mealOn(daysAgo(2))],
      loading: false,
      error: null,
      addMeal: vi.fn(),
      updateMeal: vi.fn(),
      deleteMeal: vi.fn(),
    })
    renderHome()

    expect(screen.getByText('1 day')).toBeInTheDocument()
  })

  it('counts multiple meals on the same day as one streak day', () => {
    vi.mocked(useMealContext).mockReturnValue({
      meals: [mealOn(daysAgo(0)), mealOn(daysAgo(0)), mealOn(daysAgo(0))],
      loading: false,
      error: null,
      addMeal: vi.fn(),
      updateMeal: vi.fn(),
      deleteMeal: vi.fn(),
    })
    renderHome()

    expect(screen.getByText('1 day')).toBeInTheDocument()
  })
})

describe('calendar grid', () => {
  const today = new Date()

  function mealToday(tag: Meal['tag']): Meal {
    return {
      id: tag,
      tag,
      imageUrl: null,
      amountSpent: null,
      note: null,
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

  it('applies emerald class to today when the latest meal is HOME', () => {
    vi.mocked(useMealContext).mockReturnValue({
      meals: [mealToday('HOME')],
      loading: false,
      error: null,
      addMeal: vi.fn(),
      updateMeal: vi.fn(),
      deleteMeal: vi.fn(),
    })
    renderHome()
    expect(screen.getByRole('button', { name: String(today.getDate()) })).toHaveClass(
      'bg-emerald-100'
    )
  })

  it('applies amber class to today when the meal is OUTSIDE and no goal is set', () => {
    vi.mocked(useMealContext).mockReturnValue({
      meals: [mealToday('OUTSIDE')],
      loading: false,
      error: null,
      addMeal: vi.fn(),
      updateMeal: vi.fn(),
      deleteMeal: vi.fn(),
    })
    renderHome()
    expect(screen.getByRole('button', { name: String(today.getDate()) })).toHaveClass(
      'bg-amber-100'
    )
  })

  it('applies amber class to today when the only meal has legacy MIXED tag', () => {
    vi.mocked(useMealContext).mockReturnValue({
      meals: [mealToday('MIXED')],
      loading: false,
      error: null,
      addMeal: vi.fn(),
      updateMeal: vi.fn(),
      deleteMeal: vi.fn(),
    })
    renderHome()
    expect(screen.getByRole('button', { name: String(today.getDate()) })).toHaveClass(
      'bg-amber-100'
    )
  })

  it('applies amber class to today when there are both HOME and OUTSIDE meals', () => {
    vi.mocked(useMealContext).mockReturnValue({
      meals: [mealToday('HOME'), mealToday('OUTSIDE')],
      loading: false,
      error: null,
      addMeal: vi.fn(),
      updateMeal: vi.fn(),
      deleteMeal: vi.fn(),
    })
    renderHome()
    expect(screen.getByRole('button', { name: String(today.getDate()) })).toHaveClass(
      'bg-amber-100'
    )
  })

  it('applies amber class when all meals today are OUTSIDE and no goal is set', () => {
    vi.mocked(useMealContext).mockReturnValue({
      meals: [mealToday('OUTSIDE'), mealToday('OUTSIDE')],
      loading: false,
      error: null,
      addMeal: vi.fn(),
      updateMeal: vi.fn(),
      deleteMeal: vi.fn(),
    })
    renderHome()
    expect(screen.getByRole('button', { name: String(today.getDate()) })).toHaveClass(
      'bg-amber-100'
    )
  })

  it('applies rose class when the outside day falls beyond the goal cutoff', async () => {
    vi.mocked(fetchSettings).mockResolvedValue({ monthlyOutsideGoal: 0 })
    vi.mocked(useMealContext).mockReturnValue({
      meals: [mealToday('OUTSIDE')],
      loading: false,
      error: null,
      addMeal: vi.fn(),
      updateMeal: vi.fn(),
      deleteMeal: vi.fn(),
    })
    renderHome()

    await screen.findByText('OVER')
    expect(screen.getByRole('button', { name: String(today.getDate()) })).toHaveClass('bg-rose-100')
  })

  it('applies emerald class when all meals today are HOME', () => {
    vi.mocked(useMealContext).mockReturnValue({
      meals: [mealToday('HOME'), mealToday('HOME')],
      loading: false,
      error: null,
      addMeal: vi.fn(),
      updateMeal: vi.fn(),
      deleteMeal: vi.fn(),
    })
    renderHome()
    expect(screen.getByRole('button', { name: String(today.getDate()) })).toHaveClass(
      'bg-emerald-100'
    )
  })

  it('applies slate class to today when no meals are logged', () => {
    vi.mocked(useMealContext).mockReturnValue({
      meals: [],
      loading: false,
      error: null,
      addMeal: vi.fn(),
      updateMeal: vi.fn(),
      deleteMeal: vi.fn(),
    })
    renderHome()
    expect(screen.getByRole('button', { name: String(today.getDate()) })).toHaveClass(
      'bg-slate-100'
    )
  })

  it("clicking today's day button navigates to /day/YYYY-MM-DD", async () => {
    const navigate = vi.fn()
    vi.mocked(useNavigate).mockReturnValue(navigate)
    vi.mocked(useMealContext).mockReturnValue({
      meals: [],
      loading: false,
      error: null,
      addMeal: vi.fn(),
      updateMeal: vi.fn(),
      deleteMeal: vi.fn(),
    })
    renderHome()

    await userEvent.click(screen.getByRole('button', { name: String(today.getDate()) }))

    const y = today.getFullYear()
    const m = String(today.getMonth() + 1).padStart(2, '0')
    const d = String(today.getDate()).padStart(2, '0')
    expect(navigate).toHaveBeenCalledWith(`/day/${y}-${m}-${d}`)
  })
})

describe('stats card', () => {
  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth()

  function mealThisMonth(tag: Meal['tag'], dayOffset = 0): Meal {
    return {
      id: `${tag}-${dayOffset}`,
      tag,
      imageUrl: null,
      amountSpent: null,
      note: null,
      occurredAt: new Date(year, month, 1 + dayOffset, 12, 0, 0).getTime(),
    }
  }

  it('shows Home days and Outside days labels', () => {
    vi.mocked(useMealContext).mockReturnValue({
      meals: [],
      loading: false,
      error: null,
      addMeal: vi.fn(),
      updateMeal: vi.fn(),
      deleteMeal: vi.fn(),
    })
    renderHome()

    expect(screen.getByText('Home days')).toBeInTheDocument()
    expect(screen.getByText('Outside days')).toBeInTheDocument()
  })

  it('counts a day with only HOME meals as a home day', () => {
    vi.mocked(useMealContext).mockReturnValue({
      meals: [mealThisMonth('HOME', 0), mealThisMonth('HOME', 0)],
      loading: false,
      error: null,
      addMeal: vi.fn(),
      updateMeal: vi.fn(),
      deleteMeal: vi.fn(),
    })
    renderHome()

    expect(screen.getByText('Home days').previousSibling?.textContent).toBe('1')
  })

  it('counts a day with HOME + OUTSIDE meals as an outside day', () => {
    vi.mocked(useMealContext).mockReturnValue({
      meals: [mealThisMonth('HOME', 0), mealThisMonth('OUTSIDE', 0)],
      loading: false,
      error: null,
      addMeal: vi.fn(),
      updateMeal: vi.fn(),
      deleteMeal: vi.fn(),
    })
    renderHome()

    expect(screen.getByText('Outside days').previousSibling?.textContent).toBe('1')
    expect(screen.getByText('Home days').previousSibling?.textContent).toBe('0')
  })

  it('shows banner when outside days exceed the goal', async () => {
    vi.mocked(fetchSettings).mockResolvedValue({ monthlyOutsideGoal: 1 })
    vi.mocked(useMealContext).mockReturnValue({
      meals: [
        mealThisMonth('HOME', 0),
        mealThisMonth('HOME', 1),
        mealThisMonth('OUTSIDE', 1),
        mealThisMonth('OUTSIDE', 2),
      ],
      loading: false,
      error: null,
      addMeal: vi.fn(),
      updateMeal: vi.fn(),
      deleteMeal: vi.fn(),
    })
    renderHome()

    expect(await screen.findByText('Outside eating limit reached')).toBeInTheDocument()
  })

  it('does not show the goal banner when outside total is within the limit', async () => {
    vi.mocked(fetchSettings).mockResolvedValue({ monthlyOutsideGoal: 5 })
    vi.mocked(useMealContext).mockReturnValue({
      meals: [mealThisMonth('OUTSIDE', 0)],
      loading: false,
      error: null,
      addMeal: vi.fn(),
      updateMeal: vi.fn(),
      deleteMeal: vi.fn(),
    })
    renderHome()

    await screen.findByText('Outside days')
    expect(screen.queryByText('Outside eating limit reached')).not.toBeInTheDocument()
  })

  it('does not show the goal banner when no goal is set', () => {
    vi.mocked(fetchSettings).mockResolvedValue(null)
    vi.mocked(useMealContext).mockReturnValue({
      meals: [
        mealThisMonth('OUTSIDE', 0),
        mealThisMonth('OUTSIDE', 1),
        mealThisMonth('OUTSIDE', 2),
      ],
      loading: false,
      error: null,
      addMeal: vi.fn(),
      updateMeal: vi.fn(),
      deleteMeal: vi.fn(),
    })
    renderHome()

    expect(screen.queryByText('Outside eating limit reached')).not.toBeInTheDocument()
  })
})

describe('FAB file input', () => {
  it('navigates to /tag with the selected file when a file is chosen', async () => {
    const navigate = vi.fn()
    vi.mocked(useNavigate).mockReturnValue(navigate)
    vi.mocked(useMealContext).mockReturnValue({
      meals: [],
      loading: false,
      error: null,
      addMeal: vi.fn(),
      updateMeal: vi.fn(),
      deleteMeal: vi.fn(),
    })
    renderHome()

    const file = new File(['img'], 'meal.jpg', { type: 'image/jpeg' })
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    await userEvent.upload(input, file)

    expect(navigate).toHaveBeenCalledWith('/tag', { state: { image: file } })
  })
})
