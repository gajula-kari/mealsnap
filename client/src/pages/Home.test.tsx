import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Home from './Home'
import type { Meal } from '../types'

vi.mock('../hooks/useMealContext')
vi.mock('../hooks/useSettingsContext')
vi.mock('../hooks/useInstallContext')
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return { ...actual, useNavigate: vi.fn(() => vi.fn()) }
})

import { useMealContext } from '../hooks/useMealContext'
import { useSettingsContext } from '../hooks/useSettingsContext'
import { useNavigate } from 'react-router-dom'
import { useInstallContext } from '../hooks/useInstallContext'

function renderHome() {
  return render(
    <MemoryRouter>
      <Home />
    </MemoryRouter>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(useSettingsContext).mockReturnValue({
    settings: null,
    settingsLoading: false,
    saveSettings: vi.fn(),
  })
  vi.mocked(useInstallContext).mockReturnValue({
    canInstall: false,
    dismissed: false,
    readyToShow: false,
    install: vi.fn(),
    dismiss: vi.fn(),
  })
})

describe('loading and error states', () => {
  it('shows a loading spinner while meals are loading', () => {
    vi.mocked(useMealContext).mockReturnValue({
      meals: [],
      loading: true,
      error: null,
      addMeal: vi.fn(),
      updateMeal: vi.fn(),
      deleteMeal: vi.fn(),
    })
    renderHome()

    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument()
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
      meals: [mealToday('CLEAN')],
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
      meals: [mealToday('INDULGENT')],
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

  it('applies amber class to today when there are both CLEAN and INDULGENT meals', () => {
    vi.mocked(useMealContext).mockReturnValue({
      meals: [mealToday('CLEAN'), mealToday('INDULGENT')],
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
      meals: [mealToday('INDULGENT'), mealToday('INDULGENT')],
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
    vi.mocked(useSettingsContext).mockReturnValue({
      settings: { monthlyIndulgentLimit: 0 },
      settingsLoading: false,
      saveSettings: vi.fn(),
    })
    vi.mocked(useMealContext).mockReturnValue({
      meals: [mealToday('INDULGENT')],
      loading: false,
      error: null,
      addMeal: vi.fn(),
      updateMeal: vi.fn(),
      deleteMeal: vi.fn(),
    })
    renderHome()

    await screen.findByText('OVER LIMIT')
    expect(screen.getByRole('button', { name: String(today.getDate()) })).toHaveClass('bg-rose-100')
  })

  it('applies emerald class when all meals today are HOME', () => {
    vi.mocked(useMealContext).mockReturnValue({
      meals: [mealToday('CLEAN'), mealToday('CLEAN')],
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

  it('shows Clean days and Indulgent days labels', () => {
    vi.mocked(useMealContext).mockReturnValue({
      meals: [],
      loading: false,
      error: null,
      addMeal: vi.fn(),
      updateMeal: vi.fn(),
      deleteMeal: vi.fn(),
    })
    renderHome()

    expect(screen.getByText('Clean days')).toBeInTheDocument()
    expect(screen.getByText('Indulgent days')).toBeInTheDocument()
  })

  it('counts a day with only CLEAN meals as a clean day', () => {
    vi.mocked(useMealContext).mockReturnValue({
      meals: [mealThisMonth('CLEAN', 0), mealThisMonth('CLEAN', 0)],
      loading: false,
      error: null,
      addMeal: vi.fn(),
      updateMeal: vi.fn(),
      deleteMeal: vi.fn(),
    })
    renderHome()

    expect(screen.getByText('Clean days').previousSibling?.textContent).toBe('1')
  })

  it('counts a day with CLEAN + INDULGENT meals as an indulgent day', () => {
    vi.mocked(useMealContext).mockReturnValue({
      meals: [mealThisMonth('CLEAN', 0), mealThisMonth('INDULGENT', 0)],
      loading: false,
      error: null,
      addMeal: vi.fn(),
      updateMeal: vi.fn(),
      deleteMeal: vi.fn(),
    })
    renderHome()

    expect(screen.getByText('Indulgent days').previousSibling?.textContent).toBe('1')
    expect(screen.getByText('Clean days').previousSibling?.textContent).toBe('0')
  })

  it('shows "You\'ve reached your limit" when exactly at limit', async () => {
    vi.mocked(useSettingsContext).mockReturnValue({
      settings: { monthlyIndulgentLimit: 2 },
      settingsLoading: false,
      saveSettings: vi.fn(),
    })
    vi.mocked(useMealContext).mockReturnValue({
      meals: [mealThisMonth('INDULGENT', 0), mealThisMonth('INDULGENT', 1)],
      loading: false,
      error: null,
      addMeal: vi.fn(),
      updateMeal: vi.fn(),
      deleteMeal: vi.fn(),
    })
    renderHome()

    expect(await screen.findByText("You've reached your limit")).toBeInTheDocument()
  })

  it('shows "You\'ve gone over your limit" when over by 1', async () => {
    vi.mocked(useSettingsContext).mockReturnValue({
      settings: { monthlyIndulgentLimit: 1 },
      settingsLoading: false,
      saveSettings: vi.fn(),
    })
    vi.mocked(useMealContext).mockReturnValue({
      meals: [mealThisMonth('INDULGENT', 0), mealThisMonth('INDULGENT', 1)],
      loading: false,
      error: null,
      addMeal: vi.fn(),
      updateMeal: vi.fn(),
      deleteMeal: vi.fn(),
    })
    renderHome()

    expect(await screen.findByText("You've gone over your limit")).toBeInTheDocument()
  })

  it('shows "You\'re N days over your limit" when over by more than 1', async () => {
    vi.mocked(useSettingsContext).mockReturnValue({
      settings: { monthlyIndulgentLimit: 1 },
      settingsLoading: false,
      saveSettings: vi.fn(),
    })
    vi.mocked(useMealContext).mockReturnValue({
      meals: [
        mealThisMonth('INDULGENT', 0),
        mealThisMonth('INDULGENT', 1),
        mealThisMonth('INDULGENT', 2),
        mealThisMonth('INDULGENT', 3),
      ],
      loading: false,
      error: null,
      addMeal: vi.fn(),
      updateMeal: vi.fn(),
      deleteMeal: vi.fn(),
    })
    renderHome()

    expect(await screen.findByText("You're 3 days over your limit")).toBeInTheDocument()
  })

  it('does not show a limit message when indulgent total is within the limit', async () => {
    vi.mocked(useSettingsContext).mockReturnValue({
      settings: { monthlyIndulgentLimit: 5 },
      settingsLoading: false,
      saveSettings: vi.fn(),
    })
    vi.mocked(useMealContext).mockReturnValue({
      meals: [mealThisMonth('INDULGENT', 0)],
      loading: false,
      error: null,
      addMeal: vi.fn(),
      updateMeal: vi.fn(),
      deleteMeal: vi.fn(),
    })
    renderHome()

    await screen.findByText('Indulgent days')
    expect(screen.queryByText(/reached your limit|over your limit/)).not.toBeInTheDocument()
  })

  it('does not show a limit message when no limit is set', () => {
    vi.mocked(useMealContext).mockReturnValue({
      meals: [
        mealThisMonth('INDULGENT', 0),
        mealThisMonth('INDULGENT', 1),
        mealThisMonth('INDULGENT', 2),
      ],
      loading: false,
      error: null,
      addMeal: vi.fn(),
      updateMeal: vi.fn(),
      deleteMeal: vi.fn(),
    })
    renderHome()

    expect(screen.queryByText(/reached your limit|over your limit/)).not.toBeInTheDocument()
  })
})

describe('install banner', () => {
  function withMeals() {
    vi.mocked(useMealContext).mockReturnValue({
      meals: [],
      loading: false,
      error: null,
      addMeal: vi.fn(),
      updateMeal: vi.fn(),
      deleteMeal: vi.fn(),
    })
  }

  it('does not show the banner when canInstall is false', () => {
    withMeals()
    renderHome()
    expect(screen.queryByText('Install App')).not.toBeInTheDocument()
  })

  it('shows the banner when canInstall is true and not dismissed', () => {
    withMeals()
    vi.mocked(useInstallContext).mockReturnValue({
      canInstall: true,
      dismissed: false,
      readyToShow: true,
      install: vi.fn(),
      dismiss: vi.fn(),
    })
    renderHome()
    expect(screen.getByText('Install App')).toBeInTheDocument()
  })

  it('calls install when the Install button is clicked', async () => {
    withMeals()
    const install = vi.fn()
    vi.mocked(useInstallContext).mockReturnValue({
      canInstall: true,
      dismissed: false,
      readyToShow: true,
      install,
      dismiss: vi.fn(),
    })
    renderHome()
    await userEvent.click(screen.getByRole('button', { name: 'Install' }))
    expect(install).toHaveBeenCalled()
  })

  it('calls dismiss when the close button is clicked', async () => {
    withMeals()
    const dismiss = vi.fn()
    vi.mocked(useInstallContext).mockReturnValue({
      canInstall: true,
      dismissed: false,
      readyToShow: true,
      install: vi.fn(),
      dismiss,
    })
    renderHome()
    await userEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(dismiss).toHaveBeenCalled()
  })

  it('fires the drop-in animation after the splash delay and cleans up on unmount', () => {
    localStorage.removeItem('aaharya_install_banner_animated')
    withMeals()
    vi.useFakeTimers()
    vi.mocked(useInstallContext).mockReturnValue({
      canInstall: true,
      dismissed: false,
      readyToShow: true,
      install: vi.fn(),
      dismiss: vi.fn(),
    })
    const { unmount } = renderHome()
    act(() => {
      vi.advanceTimersByTime(2600)
    })
    unmount()
    vi.useRealTimers()
  })
})

describe('FAB file input', () => {
  it('navigates to /tag with source camera when a file is chosen via camera', async () => {
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
    const cameraInput = document.querySelector('input[type="file"]') as HTMLInputElement
    await userEvent.upload(cameraInput, file)

    expect(navigate).toHaveBeenCalledWith('/tag', {
      replace: true,
      state: { image: file, source: 'camera' },
    })
  })

  it('navigates to /tag with source gallery when a file is chosen via gallery', async () => {
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

    await userEvent.click(screen.getByRole('button', { name: 'Choose from gallery' }))

    const file = new File(['img'], 'meal.jpg', { type: 'image/jpeg' })
    const galleryInput = document.querySelectorAll('input[type="file"]')[1] as HTMLInputElement
    await userEvent.upload(galleryInput, file)

    expect(navigate).toHaveBeenCalledWith('/tag', {
      replace: true,
      state: { image: file, source: 'gallery' },
    })
  })
})
