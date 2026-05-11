// Unit tests for the Header component inside App.jsx.
// We replace BrowserRouter with MemoryRouter (via vi.mock) so we can
// control the starting route without touching window.history.

import { render, screen } from '@testing-library/react'
import { MealProvider } from './context/MealProvider.jsx'

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal()
  // Replace BrowserRouter with a configurable wrapper so tests can set the
  // initial route via the module-level `initialPath` variable.
  return {
    ...actual,
    BrowserRouter: ({ children }) => (
      <actual.MemoryRouter initialEntries={[initialPath]}>{children}</actual.MemoryRouter>
    ),
  }
})

// Mutated by each test before render so the MemoryRouter picks up the right path.
let initialPath = '/'

// App is imported AFTER the mock so it gets the patched BrowserRouter.
import App from './App'

beforeEach(() => {
  initialPath = '/'
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ meals: [] }),
    })
  )
})

afterEach(() => {
  vi.unstubAllGlobals()
})

function renderApp() {
  return render(
    <MealProvider>
      <App />
    </MealProvider>
  )
}

// ─── Header ───────────────────────────────────────────────────────────────────

describe('Header on sub-pages', () => {
  it('shows back arrow and "Settings" title on /settings', () => {
    initialPath = '/settings'
    renderApp()

    expect(screen.getByRole('button', { name: 'Back' })).toBeInTheDocument()
    expect(screen.getByText('Settings')).toBeInTheDocument()
  })

  it('shows back arrow and "MealSnap" title on other sub-pages', () => {
    initialPath = '/day/2024-01-01'
    renderApp()

    // DayDetail may also render a back button — at least one must exist.
    expect(screen.getAllByRole('button', { name: 'Back' }).length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('MealSnap')).toBeInTheDocument()
  })
})
