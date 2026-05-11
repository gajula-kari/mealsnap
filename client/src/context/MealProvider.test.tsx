import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MealProvider } from './MealProvider'
import { useMealContext } from '../hooks/useMealContext'

vi.mock('../services/mealApi')
import * as api from '../services/mealApi'

function TestConsumer() {
  const { meals, loading, addMeal, updateMeal, deleteMeal } = useMealContext()
  return (
    <div>
      {loading && <span>loading</span>}
      <ul>
        {meals.map((m) => (
          <li key={m.id}>
            {m.id}:{m.tag}
          </li>
        ))}
      </ul>
      <button onClick={() => addMeal({ tag: 'OUTSIDE', occurredAt: 1, imageUrl: '' })}>Add</button>
      <button onClick={() => updateMeal('id-1', { tag: 'MIXED' })}>Update</button>
      <button onClick={() => deleteMeal('id-1')}>Delete</button>
    </div>
  )
}

function renderProvider() {
  return render(
    <MealProvider>
      <TestConsumer />
    </MealProvider>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
})

describe('MealProvider', () => {
  it('shows loading state on first visit when no cache exists', async () => {
    vi.mocked(api.fetchMeals).mockResolvedValue([
      { id: 'id-1', tag: 'HOME', imageUrl: null, amountSpent: null, note: null, occurredAt: 0 },
    ])

    renderProvider()
    expect(screen.getByText('loading')).toBeInTheDocument()

    await waitFor(() => expect(screen.queryByText('loading')).not.toBeInTheDocument())
    expect(screen.getByText('id-1:HOME')).toBeInTheDocument()
  })

  it('skips loading state on repeat visit when cache has meals', () => {
    localStorage.setItem(
      'mealsnap_meals',
      JSON.stringify([
        { id: 'id-1', tag: 'HOME', imageUrl: null, amountSpent: null, note: null, occurredAt: 0 },
      ])
    )
    vi.mocked(api.fetchMeals).mockResolvedValue([
      { id: 'id-1', tag: 'HOME', imageUrl: null, amountSpent: null, note: null, occurredAt: 0 },
    ])

    renderProvider()

    expect(screen.queryByText('loading')).not.toBeInTheDocument()
    expect(screen.getByText('id-1:HOME')).toBeInTheDocument()
  })

  it('shows loading state when cache exists but is empty', () => {
    localStorage.setItem('mealsnap_meals', JSON.stringify([]))
    vi.mocked(api.fetchMeals).mockResolvedValue([])

    renderProvider()

    expect(screen.getByText('loading')).toBeInTheDocument()
  })

  it('addMeal calls api.createMeal and prepends the new meal to state', async () => {
    vi.mocked(api.fetchMeals).mockResolvedValue([
      { id: 'id-1', tag: 'HOME', imageUrl: null, amountSpent: null, note: null, occurredAt: 0 },
    ])
    vi.mocked(api.createMeal).mockResolvedValue({
      id: 'id-2',
      tag: 'OUTSIDE',
      imageUrl: null,
      amountSpent: null,
      note: null,
      occurredAt: 1,
    })

    renderProvider()
    await waitFor(() => expect(screen.queryByText('loading')).not.toBeInTheDocument())

    await userEvent.click(screen.getByRole('button', { name: 'Add' }))

    const items = screen.getAllByRole('listitem')
    expect(items[0]).toHaveTextContent('id-2:OUTSIDE')
    expect(items[1]).toHaveTextContent('id-1:HOME')
  })

  it('updateMeal calls api.updateMeal and replaces the meal in state', async () => {
    vi.mocked(api.fetchMeals).mockResolvedValue([
      { id: 'id-1', tag: 'HOME', imageUrl: null, amountSpent: null, note: null, occurredAt: 0 },
    ])
    vi.mocked(api.updateMeal).mockResolvedValue({
      id: 'id-1',
      tag: 'MIXED',
      imageUrl: null,
      amountSpent: null,
      note: null,
      occurredAt: 0,
    })

    renderProvider()
    await waitFor(() => expect(screen.queryByText('loading')).not.toBeInTheDocument())

    await userEvent.click(screen.getByRole('button', { name: 'Update' }))

    expect(screen.getByText('id-1:MIXED')).toBeInTheDocument()
    expect(screen.queryByText('id-1:HOME')).not.toBeInTheDocument()
  })

  it('deleteMeal calls api.deleteMeal and removes the meal from state', async () => {
    vi.mocked(api.fetchMeals).mockResolvedValue([
      { id: 'id-1', tag: 'HOME', imageUrl: null, amountSpent: null, note: null, occurredAt: 0 },
    ])
    vi.mocked(api.deleteMeal).mockResolvedValue()

    renderProvider()
    await waitFor(() => expect(screen.queryByText('loading')).not.toBeInTheDocument())

    await userEvent.click(screen.getByRole('button', { name: 'Delete' }))

    expect(screen.queryByRole('listitem')).not.toBeInTheDocument()
  })

  it('seeds state from localStorage cache so UI shows instantly before fetch', () => {
    localStorage.setItem(
      'mealsnap_meals',
      JSON.stringify([
        {
          id: 'cached-1',
          tag: 'HOME',
          imageUrl: null,
          amountSpent: null,
          note: null,
          occurredAt: 0,
        },
      ])
    )
    vi.mocked(api.fetchMeals).mockResolvedValue([
      { id: 'cached-1', tag: 'HOME', imageUrl: null, amountSpent: null, note: null, occurredAt: 0 },
    ])

    renderProvider()

    expect(screen.getByText('cached-1:HOME')).toBeInTheDocument()
  })

  it('writes fresh meals to localStorage after fetch', async () => {
    vi.mocked(api.fetchMeals).mockResolvedValue([
      { id: 'id-1', tag: 'OUTSIDE', imageUrl: null, amountSpent: null, note: null, occurredAt: 0 },
    ])

    renderProvider()
    await waitFor(() => expect(screen.queryByText('loading')).not.toBeInTheDocument())

    const cached = JSON.parse(localStorage.getItem('mealsnap_meals') ?? '[]')
    expect(cached).toEqual([
      { id: 'id-1', tag: 'OUTSIDE', amountSpent: null, note: null, occurredAt: 0 },
    ])
  })

  it('calls api.ping on mount to wake the server', () => {
    vi.mocked(api.fetchMeals).mockResolvedValue([])

    renderProvider()

    expect(api.ping).toHaveBeenCalledTimes(1)
  })
})
