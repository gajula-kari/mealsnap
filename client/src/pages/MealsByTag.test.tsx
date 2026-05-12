import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import MealsByTag from './MealsByTag'
import type { Meal } from '../types'

vi.mock('../hooks/useMealContext')
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return {
    ...actual,
    useParams: vi.fn(),
    Navigate: vi.fn(({ to }: { to: string }) => <div data-testid="navigate" data-to={to} />),
  }
})

import { useMealContext } from '../hooks/useMealContext'
import { useParams } from 'react-router-dom'

const now = new Date()

function meal(id: string, tag: Meal['tag'], monthOffset = 0): Meal {
  const d = new Date(now.getFullYear(), now.getMonth() + monthOffset, 10, 12, 0, 0)
  return { id, tag, imageUrl: null, note: null, amountSpent: null, occurredAt: d.getTime() }
}

function mockContext(meals: Meal[]) {
  vi.mocked(useMealContext).mockReturnValue({
    meals,
    loading: false,
    error: null,
    addMeal: vi.fn(),
    updateMeal: vi.fn(),
    deleteMeal: vi.fn(),
  })
}

function renderPage() {
  return render(
    <MemoryRouter>
      <MealsByTag />
    </MemoryRouter>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('MealsByTag', () => {
  it('redirects to / for an invalid tag', () => {
    vi.mocked(useParams).mockReturnValue({ tag: 'invalid' })
    mockContext([])
    renderPage()

    expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/')
  })

  it('shows empty state when no meals match the tag this month', () => {
    vi.mocked(useParams).mockReturnValue({ tag: 'clean' })
    mockContext([meal('m1', 'INDULGENT')])
    renderPage()

    expect(screen.getByText(/no clean meals this month/i)).toBeInTheDocument()
  })

  it('renders only current-month meals matching the tag', () => {
    vi.mocked(useParams).mockReturnValue({ tag: 'clean' })
    mockContext([
      meal('m1', 'CLEAN'),
      meal('m2', 'CLEAN'),
      meal('m3', 'INDULGENT'),
      meal('m4', 'CLEAN', -1),
    ])
    renderPage()

    expect(screen.getAllByText('CLEAN')).toHaveLength(2)
    expect(screen.queryByText(/no clean meals/i)).not.toBeInTheDocument()
  })

  it('renders indulgent meals when tag is indulgent', () => {
    vi.mocked(useParams).mockReturnValue({ tag: 'indulgent' })
    mockContext([meal('m1', 'INDULGENT'), meal('m2', 'CLEAN')])
    renderPage()

    expect(screen.getAllByText('INDULGENT')).toHaveLength(1)
  })
})
