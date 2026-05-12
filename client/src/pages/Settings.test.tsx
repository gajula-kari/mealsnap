import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Settings from './Settings'

vi.mock('../services/settingsApi')
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return { ...actual, useNavigate: vi.fn(() => vi.fn()) }
})

import { fetchSettings, saveSettings } from '../services/settingsApi'
import { useNavigate } from 'react-router-dom'

function renderSettings() {
  return render(
    <MemoryRouter>
      <Settings />
    </MemoryRouter>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(fetchSettings).mockResolvedValue(null)
  vi.mocked(saveSettings).mockResolvedValue({
    monthlyIndulgentLimit: 7,
    previousGoal: null,
    goalUpdatedAt: Date.now(),
  })
})

describe('Settings rendering', () => {
  it('renders the heading and description', () => {
    renderSettings()
    expect(screen.getByText('Indulgent Days Limit')).toBeInTheDocument()
    expect(
      screen.getByText('Set how many indulgent days you allow yourself per month')
    ).toBeInTheDocument()
  })

  it('renders all four quick-pick chips', () => {
    renderSettings()
    ;[5, 7, 10, 15].forEach((n) => {
      expect(screen.getByRole('button', { name: String(n) })).toBeInTheDocument()
    })
  })

  it('renders the Save button', () => {
    renderSettings()
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument()
  })
})

describe('Settings with existing data', () => {
  it('pre-fills the input with the current goal', async () => {
    vi.mocked(fetchSettings).mockResolvedValue({
      monthlyIndulgentLimit: 10,
      previousGoal: null,
      goalUpdatedAt: null,
    })
    renderSettings()
    expect(await screen.findByDisplayValue('10')).toBeInTheDocument()
  })

  it('shows previous goal when one exists', async () => {
    vi.mocked(fetchSettings).mockResolvedValue({
      monthlyIndulgentLimit: 10,
      previousGoal: 5,
      goalUpdatedAt: 1700000000000,
    })
    renderSettings()
    expect(await screen.findByText('Previous goal: 5 days')).toBeInTheDocument()
  })

  it('shows last updated date when goalUpdatedAt exists', async () => {
    vi.mocked(fetchSettings).mockResolvedValue({
      monthlyIndulgentLimit: 10,
      previousGoal: null,
      goalUpdatedAt: 1700000000000,
    })
    renderSettings()
    expect(await screen.findByText(/Last updated:/)).toBeInTheDocument()
  })
})

describe('quick-pick chips', () => {
  it('clicking a chip sets that value in the input', async () => {
    renderSettings()
    await userEvent.click(screen.getByRole('button', { name: '7' }))
    expect(screen.getByRole('spinbutton')).toHaveValue(7)
  })

  it('typing a custom number directly into the input updates the value', async () => {
    renderSettings()
    const input = screen.getByRole('spinbutton')
    await userEvent.clear(input)
    await userEvent.type(input, '12')
    expect(input).toHaveValue(12)
  })

  it('the selected chip gets a dark background class', async () => {
    renderSettings()
    const chip = screen.getByRole('button', { name: '10' })
    await userEvent.click(chip)
    expect(chip).toHaveClass('bg-slate-900')
  })
})

describe('saving', () => {
  it('calls saveSettings with the chosen goal and navigates to /', async () => {
    const navigate = vi.fn()
    vi.mocked(useNavigate).mockReturnValue(navigate)
    renderSettings()

    await userEvent.click(screen.getByRole('button', { name: '7' }))
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))

    expect(saveSettings).toHaveBeenCalledWith(7)
    expect(navigate).toHaveBeenCalledWith('/', { replace: true })
  })

  it('shows a validation error when saving with no value entered', async () => {
    renderSettings()
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(screen.getByText('Please enter a valid number')).toBeInTheDocument()
  })

  it('shows an error message when saveSettings throws', async () => {
    vi.mocked(saveSettings).mockRejectedValue(new Error('Network error'))
    renderSettings()

    await userEvent.click(screen.getByRole('button', { name: '5' }))
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByText('Failed to save. Try again.')).toBeInTheDocument()
  })

  it('shows "Saving…" on the button while the request is in flight', async () => {
    let resolve!: (value: {
      monthlyIndulgentLimit: number
      previousGoal: null
      goalUpdatedAt: number
    }) => void
    vi.mocked(saveSettings).mockReturnValue(new Promise((r) => (resolve = r)))
    renderSettings()

    await userEvent.click(screen.getByRole('button', { name: '5' }))
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))

    expect(screen.getByRole('button', { name: 'Saving…' })).toBeInTheDocument()
    resolve({ monthlyIndulgentLimit: 5, previousGoal: null, goalUpdatedAt: Date.now() })
  })
})
