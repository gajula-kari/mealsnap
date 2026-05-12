import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MealProvider } from './context/MealProvider'
import type { ReactNode } from 'react'

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return {
    ...actual,
    BrowserRouter: ({ children }: { children: ReactNode }) => (
      <actual.MemoryRouter initialEntries={[initialPath]}>{children}</actual.MemoryRouter>
    ),
    useNavigate: vi.fn(() => vi.fn()),
  }
})

let initialPath = '/'

import App from './App'
import { useNavigate } from 'react-router-dom'

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

  it('shows back arrow and "Aaharya" title on other sub-pages', () => {
    initialPath = '/day/2024-01-01'
    renderApp()

    expect(screen.getAllByRole('button', { name: 'Back' }).length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Aaharya')).toBeInTheDocument()
  })

  it('back button on /settings navigates to / with replace', async () => {
    const navigate = vi.fn()
    vi.mocked(useNavigate).mockReturnValue(navigate)
    initialPath = '/settings'
    renderApp()

    await userEvent.click(screen.getByRole('button', { name: 'Back' }))

    expect(navigate).toHaveBeenCalledWith('/', { replace: true })
  })

  it('back button on /day/:date calls navigate(-1)', async () => {
    const navigate = vi.fn()
    vi.mocked(useNavigate).mockReturnValue(navigate)
    initialPath = '/day/2024-01-01'
    renderApp()

    const backButtons = screen.getAllByRole('button', { name: 'Back' })
    await userEvent.click(backButtons[0])

    expect(navigate).toHaveBeenCalledWith(-1)
  })
})
