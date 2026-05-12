import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MealProvider } from './context/MealProvider'
import App from './App'

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn())
})

afterEach(() => {
  vi.unstubAllGlobals()
  window.history.pushState({}, '', '/')
})

function mockFetch(meals: unknown[]) {
  vi.mocked(fetch).mockResolvedValue({
    ok: true,
    json: vi.fn().mockResolvedValue({ meals }),
  } as unknown as Response)
}

function mockFetchError(message: string) {
  vi.mocked(fetch).mockResolvedValue({
    ok: false,
    json: vi.fn().mockResolvedValue({ error: message }),
  } as unknown as Response)
}

function renderApp() {
  return render(
    <MealProvider>
      <App />
    </MealProvider>
  )
}

describe('App integration', () => {
  it('shows a spinner while loading then displays the streak once data arrives', async () => {
    const today = new Date()
    today.setHours(12, 0, 0, 0)

    mockFetch([{ _id: 'meal-1', tag: 'HOME', occurredAt: today.getTime() }])

    renderApp()

    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument()
    expect(await screen.findByText('1 day')).toBeInTheDocument()
  })

  it('shows "0 days" when the server returns an empty meals list', async () => {
    mockFetch([])
    renderApp()

    expect(await screen.findByText('0 days')).toBeInTheDocument()
  })

  it('shows the server error message when fetch fails', async () => {
    mockFetchError('Failed to connect to database')
    renderApp()

    expect(await screen.findByText('Failed to connect to database')).toBeInTheDocument()
  })

  it('normalizes _id to id through the full stack', async () => {
    const today = new Date()
    today.setHours(12, 0, 0, 0)

    mockFetch([{ _id: 'mongo-id-123', tag: 'HOME', occurredAt: today.getTime() }])

    renderApp()

    expect(await screen.findByText('1 day')).toBeInTheDocument()
    expect(fetch).toHaveBeenCalledWith('/meals', expect.anything())
  })
})

describe('Header', () => {
  it('shows back arrow and "Settings" title after navigating to /settings', async () => {
    mockFetch([])
    renderApp()

    await screen.findByText('0 days')
    await userEvent.click(screen.getByRole('button', { name: 'Settings' }))

    expect(await screen.findByRole('button', { name: 'Back' })).toBeInTheDocument()
    expect(screen.getByText('Settings')).toBeInTheDocument()
  })
})
