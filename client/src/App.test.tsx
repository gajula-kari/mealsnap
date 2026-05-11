import { render, screen } from '@testing-library/react'
import { MealProvider } from './context/MealProvider'
import type { ReactNode } from 'react'

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return {
    ...actual,
    BrowserRouter: ({ children }: { children: ReactNode }) => (
      <actual.MemoryRouter initialEntries={[initialPath]}>{children}</actual.MemoryRouter>
    ),
  }
})

let initialPath = '/'

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

    expect(screen.getAllByRole('button', { name: 'Back' }).length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('MealSnap')).toBeInTheDocument()
  })
})
