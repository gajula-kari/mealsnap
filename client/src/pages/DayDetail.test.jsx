// DayDetail's job: given a date from the URL, filter the full meals list
// and render only the meals that occurred on that day.
//
// We mock useParams to control the date, and useMealContext to control the meals.
// MemoryRouter satisfies useNavigate.

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import DayDetail from './DayDetail'

vi.mock('../hooks/useMealContext.js')
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useParams: vi.fn(),
    useNavigate: vi.fn(() => vi.fn()),
  }
})

import { useMealContext } from '../hooks/useMealContext.js'
import { useParams, useNavigate } from 'react-router-dom'

const DATE = '2024-06-15'

// A meal that falls on DATE (June 15 2024, local noon).
function mealOnDate(id, tag = 'HOME') {
  return {
    id,
    tag,
    imageUrl: null,
    note: null,
    amountSpent: null,
    occurredAt: new Date(2024, 5, 15, 12, 0, 0).getTime(),
  }
}

// A meal that falls on a different date (June 14 2024).
function mealOffDate(id) {
  return {
    id,
    tag: 'HOME',
    imageUrl: null,
    note: null,
    amountSpent: null,
    occurredAt: new Date(2024, 5, 14, 12, 0, 0).getTime(),
  }
}

function renderDayDetail() {
  return render(
    <MemoryRouter>
      <DayDetail />
    </MemoryRouter>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  useParams.mockReturnValue({ date: DATE })
})

describe('DayDetail', () => {
  it('shows the empty state when no meals match the date', () => {
    useMealContext.mockReturnValue({
      meals: [mealOffDate('other')],
      updateMeal: vi.fn(),
      deleteMeal: vi.fn(),
    })
    renderDayDetail()

    expect(screen.getByText('No meals logged')).toBeInTheDocument()
  })

  it('renders only the meals that match the URL date', () => {
    useMealContext.mockReturnValue({
      meals: [mealOnDate('match-1'), mealOnDate('match-2'), mealOffDate('no-match')],
      updateMeal: vi.fn(),
      deleteMeal: vi.fn(),
    })
    renderDayDetail()

    // Each matching MealCard renders its tag badge.
    // 2 HOME meals → 2 HOME badges. The off-date meal must not appear.
    expect(screen.getAllByText('HOME')).toHaveLength(2)
    expect(screen.queryByText('No meals logged')).not.toBeInTheDocument()
  })

  it('displays the correctly formatted date heading', () => {
    useMealContext.mockReturnValue({ meals: [], updateMeal: vi.fn(), deleteMeal: vi.fn() })
    renderDayDetail()

    // new Date(2024, 5, 15).toLocaleDateString('en-US', { weekday: 'long', ... })
    expect(screen.getByText(/Saturday, June 15, 2024/)).toBeInTheDocument()
  })

  it('Back button navigates to /', async () => {
    const navigate = vi.fn()
    useNavigate.mockReturnValue(navigate)
    useMealContext.mockReturnValue({ meals: [], updateMeal: vi.fn(), deleteMeal: vi.fn() })
    renderDayDetail()

    await userEvent.click(screen.getByRole('button', { name: 'Back' }))

    expect(navigate).toHaveBeenCalledWith('/')
  })

  it('navigates to /tag with the file and date when a file is selected', async () => {
    const navigate = vi.fn()
    useNavigate.mockReturnValue(navigate)
    useMealContext.mockReturnValue({ meals: [], updateMeal: vi.fn(), deleteMeal: vi.fn() })
    renderDayDetail()

    const file = new File(['img'], 'meal.jpg', { type: 'image/jpeg' })
    const input = document.querySelector('input[type="file"]')
    await userEvent.upload(input, file)

    expect(navigate).toHaveBeenCalledWith('/tag', { state: { image: file, date: DATE } })
  })
})
