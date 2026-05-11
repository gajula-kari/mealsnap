import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MealProvider } from './MealProvider.jsx'
import { useMealContext } from '../hooks/useMealContext.js'

vi.mock('../services/mealApi.js')
import * as api from '../services/mealApi.js'

// A minimal consumer that renders state and exposes all three mutation buttons.
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
      <button onClick={() => addMeal({ tag: 'OUTSIDE', occurredAt: 1 })}>Add</button>
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
    api.fetchMeals.mockResolvedValue([{ id: 'id-1', tag: 'HOME' }])

    renderProvider()
    expect(screen.getByText('loading')).toBeInTheDocument()

    await waitFor(() => expect(screen.queryByText('loading')).not.toBeInTheDocument())
    expect(screen.getByText('id-1:HOME')).toBeInTheDocument()
  })

  it('skips loading state on repeat visit when cache exists', () => {
    localStorage.setItem('mealsnap_meals', JSON.stringify([{ id: 'id-1', tag: 'HOME' }]))
    api.fetchMeals.mockResolvedValue([{ id: 'id-1', tag: 'HOME' }])

    renderProvider()

    expect(screen.queryByText('loading')).not.toBeInTheDocument()
    expect(screen.getByText('id-1:HOME')).toBeInTheDocument()
  })

  it('addMeal calls api.createMeal and prepends the new meal to state', async () => {
    api.fetchMeals.mockResolvedValue([{ id: 'id-1', tag: 'HOME' }])
    api.createMeal.mockResolvedValue({ id: 'id-2', tag: 'OUTSIDE' })

    renderProvider()
    await waitFor(() => expect(screen.queryByText('loading')).not.toBeInTheDocument())

    await userEvent.click(screen.getByRole('button', { name: 'Add' }))

    const items = screen.getAllByRole('listitem')
    expect(items[0]).toHaveTextContent('id-2:OUTSIDE')
    expect(items[1]).toHaveTextContent('id-1:HOME')
  })

  it('updateMeal calls api.updateMeal and replaces the meal in state', async () => {
    api.fetchMeals.mockResolvedValue([{ id: 'id-1', tag: 'HOME' }])
    api.updateMeal.mockResolvedValue({ id: 'id-1', tag: 'MIXED' })

    renderProvider()
    await waitFor(() => expect(screen.queryByText('loading')).not.toBeInTheDocument())

    await userEvent.click(screen.getByRole('button', { name: 'Update' }))

    expect(screen.getByText('id-1:MIXED')).toBeInTheDocument()
    expect(screen.queryByText('id-1:HOME')).not.toBeInTheDocument()
  })

  it('deleteMeal calls api.deleteMeal and removes the meal from state', async () => {
    api.fetchMeals.mockResolvedValue([{ id: 'id-1', tag: 'HOME' }])
    api.deleteMeal.mockResolvedValue()

    renderProvider()
    await waitFor(() => expect(screen.queryByText('loading')).not.toBeInTheDocument())

    await userEvent.click(screen.getByRole('button', { name: 'Delete' }))

    expect(screen.queryByRole('listitem')).not.toBeInTheDocument()
  })

  it('seeds state from localStorage cache so UI shows instantly before fetch', () => {
    localStorage.setItem('mealsnap_meals', JSON.stringify([{ id: 'cached-1', tag: 'HOME' }]))
    api.fetchMeals.mockResolvedValue([{ id: 'cached-1', tag: 'HOME' }])

    renderProvider()

    // Cache is loaded synchronously — visible before any async work completes.
    expect(screen.getByText('cached-1:HOME')).toBeInTheDocument()
  })

  it('writes fresh meals to localStorage after fetch', async () => {
    api.fetchMeals.mockResolvedValue([{ id: 'id-1', tag: 'OUTSIDE' }])

    renderProvider()
    await waitFor(() => expect(screen.queryByText('loading')).not.toBeInTheDocument())

    const cached = JSON.parse(localStorage.getItem('mealsnap_meals'))
    expect(cached).toEqual([{ id: 'id-1', tag: 'OUTSIDE' }])
  })

  it('calls api.ping on mount to wake the server', () => {
    api.fetchMeals.mockResolvedValue([])

    renderProvider()

    expect(api.ping).toHaveBeenCalledTimes(1)
  })
})
