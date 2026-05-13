import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Onboard from './Onboard'

vi.mock('../hooks/useSettingsContext')
import { useSettingsContext } from '../hooks/useSettingsContext'

const mockSaveSettings = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
  mockSaveSettings.mockResolvedValue({
    monthlyIndulgentLimit: 5,
    previousGoal: null,
    goalUpdatedAt: null,
  })
  vi.mocked(useSettingsContext).mockReturnValue({
    settings: null,
    settingsLoading: false,
    saveSettings: mockSaveSettings,
  })
})

function renderOnboard(onComplete = vi.fn()) {
  return render(
    <MemoryRouter>
      <Onboard onComplete={onComplete} />
    </MemoryRouter>
  )
}

async function advanceToStep(step: 2 | 3) {
  await userEvent.click(screen.getByRole('button', { name: 'Next' }))
  if (step === 3) {
    await userEvent.click(screen.getByRole('button', { name: 'Next' }))
  }
}

describe('screen 1', () => {
  it('renders the problem headline', () => {
    renderOnboard()
    expect(screen.getByText('Eating out more than you planned?')).toBeInTheDocument()
  })

  it('renders a Next button', () => {
    renderOnboard()
    expect(screen.getByRole('button', { name: 'Next' })).toBeInTheDocument()
  })
})

describe('screen 2', () => {
  it('shows solution content after clicking Next', async () => {
    renderOnboard()
    await advanceToStep(2)
    expect(screen.getByText('Stay aware of indulgent meals')).toBeInTheDocument()
  })
})

describe('screen 3', () => {
  it('shows the limit screen after two Next clicks', async () => {
    renderOnboard()
    await advanceToStep(3)
    expect(screen.getByText('Set your monthly limit')).toBeInTheDocument()
  })

  it('renders all four chips', async () => {
    renderOnboard()
    await advanceToStep(3)
    ;[5, 7, 10, 15].forEach((n) => {
      expect(screen.getByRole('button', { name: String(n) })).toBeInTheDocument()
    })
  })

  it('Get Started is disabled when no chip is selected', async () => {
    renderOnboard()
    await advanceToStep(3)
    expect(screen.getByRole('button', { name: 'Get Started' })).toBeDisabled()
  })

  it('Get Started is enabled after selecting a chip', async () => {
    renderOnboard()
    await advanceToStep(3)
    await userEvent.click(screen.getByRole('button', { name: '7' }))
    expect(screen.getByRole('button', { name: 'Get Started' })).toBeEnabled()
  })

  it('selected chip gets the dark background class', async () => {
    renderOnboard()
    await advanceToStep(3)
    const chip = screen.getByRole('button', { name: '10' })
    await userEvent.click(chip)
    expect(chip).toHaveClass('bg-slate-900')
  })
})

describe('Get Started', () => {
  it('calls saveSettings with the selected chip value', async () => {
    renderOnboard()
    await advanceToStep(3)
    await userEvent.click(screen.getByRole('button', { name: '7' }))
    await userEvent.click(screen.getByRole('button', { name: 'Get Started' }))
    expect(mockSaveSettings).toHaveBeenCalledWith(7)
  })

  it('sets aaharya_onboarded in localStorage', async () => {
    renderOnboard()
    await advanceToStep(3)
    await userEvent.click(screen.getByRole('button', { name: '5' }))
    await userEvent.click(screen.getByRole('button', { name: 'Get Started' }))
    await waitFor(() => expect(localStorage.getItem('aaharya_onboarded')).toBe('true'))
  })

  it('calls onComplete after a successful save', async () => {
    const onComplete = vi.fn()
    renderOnboard(onComplete)
    await advanceToStep(3)
    await userEvent.click(screen.getByRole('button', { name: '5' }))
    await userEvent.click(screen.getByRole('button', { name: 'Get Started' }))
    await waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1))
  })
})
