import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import TagMeal from './TagMeal'

vi.mock('../hooks/useMealContext')
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return {
    ...actual,
    useLocation: vi.fn(),
    useNavigate: vi.fn(() => vi.fn()),
  }
})

import { useMealContext } from '../hooks/useMealContext'
import { useLocation, useNavigate } from 'react-router-dom'

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(useMealContext).mockReturnValue({
    meals: [],
    loading: false,
    error: null,
    addMeal: vi.fn(),
    updateMeal: vi.fn(),
    deleteMeal: vi.fn(),
  })
})

describe('TagMeal', () => {
  it('shows a fallback message when no image is in location state', () => {
    vi.mocked(useLocation).mockReturnValue({
      state: null,
      pathname: '/tag',
      search: '',
      hash: '',
      key: 'default',
    })

    render(
      <MemoryRouter>
        <TagMeal />
      </MemoryRouter>
    )

    expect(screen.getByText('No image found. Please capture an image first.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Go Back' })).toBeInTheDocument()
  })

  it('does not render the tagging form when there is no image', () => {
    vi.mocked(useLocation).mockReturnValue({
      state: null,
      pathname: '/tag',
      search: '',
      hash: '',
      key: 'default',
    })

    render(
      <MemoryRouter>
        <TagMeal />
      </MemoryRouter>
    )

    expect(screen.queryByRole('button', { name: '✓ Clean' })).not.toBeInTheDocument()
  })
})

describe('TagMeal with image', () => {
  class MockFileReader {
    result: string | ArrayBuffer | null = null
    onload: ((ev: Event) => void) | null = null

    readAsDataURL(_url: string): void {
      this.result = 'data:image/jpeg;base64,fake'
      queueMicrotask(() => this.onload?.(new Event('load')))
    }
  }

  beforeEach(() => {
    vi.stubGlobal('FileReader', MockFileReader)
    vi.mocked(useMealContext).mockReturnValue({
      meals: [],
      loading: false,
      error: null,
      addMeal: vi.fn(),
      updateMeal: vi.fn(),
      deleteMeal: vi.fn(),
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  function imageFile() {
    return new File(['img'], 'photo.jpg', { type: 'image/jpeg' })
  }

  it('renders Clean and Indulgent tag buttons plus Save once the preview loads', async () => {
    vi.mocked(useLocation).mockReturnValue({
      state: { image: imageFile() },
      pathname: '/tag',
      search: '',
      hash: '',
      key: 'default',
    })

    render(
      <MemoryRouter>
        <TagMeal />
      </MemoryRouter>
    )

    await screen.findByAltText('Selected meal')

    expect(screen.getByRole('button', { name: '✓ Clean' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '⚠ Indulgent' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument()
  })

  it('calls addMeal with CLEAN tag by default and navigates to the day detail', async () => {
    const navigate = vi.fn()
    vi.mocked(useNavigate).mockReturnValue(navigate)
    const addMeal = vi.fn().mockResolvedValue({})
    vi.mocked(useMealContext).mockReturnValue({
      meals: [],
      loading: false,
      error: null,
      addMeal,
      updateMeal: vi.fn(),
      deleteMeal: vi.fn(),
    })
    vi.mocked(useLocation).mockReturnValue({
      state: { image: imageFile() },
      pathname: '/tag',
      search: '',
      hash: '',
      key: 'default',
    })

    render(
      <MemoryRouter>
        <TagMeal />
      </MemoryRouter>
    )
    await screen.findByAltText('Selected meal')

    await userEvent.click(screen.getByRole('button', { name: 'Save' }))

    expect(addMeal).toHaveBeenCalledWith(expect.objectContaining({ tag: 'CLEAN' }))
    const today = new Date()
    const y = today.getFullYear()
    const m = String(today.getMonth() + 1).padStart(2, '0')
    const d = String(today.getDate()).padStart(2, '0')
    expect(navigate).toHaveBeenCalledWith(`/day/${y}-${m}-${d}`)
  })

  it('uses noon of dateFromState as occurredAt when coming from a past day', async () => {
    const addMeal = vi.fn().mockResolvedValue({})
    vi.mocked(useMealContext).mockReturnValue({
      meals: [],
      loading: false,
      error: null,
      addMeal,
      updateMeal: vi.fn(),
      deleteMeal: vi.fn(),
    })
    vi.mocked(useLocation).mockReturnValue({
      state: { image: imageFile(), date: '2024-06-15' },
      pathname: '/tag',
      search: '',
      hash: '',
      key: 'default',
    })

    render(
      <MemoryRouter>
        <TagMeal />
      </MemoryRouter>
    )
    await screen.findByAltText('Selected meal')

    await userEvent.click(screen.getByRole('button', { name: '⚠ Indulgent' }))
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))

    expect(addMeal).toHaveBeenCalledWith(
      expect.objectContaining({
        tag: 'INDULGENT',
        occurredAt: new Date(2024, 5, 15, 12, 0, 0, 0).getTime(),
      })
    )
  })

  it('navigates to the dateFromState day after tagging', async () => {
    const navigate = vi.fn()
    vi.mocked(useNavigate).mockReturnValue(navigate)
    const addMeal = vi.fn().mockResolvedValue({})
    vi.mocked(useMealContext).mockReturnValue({
      meals: [],
      loading: false,
      error: null,
      addMeal,
      updateMeal: vi.fn(),
      deleteMeal: vi.fn(),
    })
    vi.mocked(useLocation).mockReturnValue({
      state: { image: imageFile(), date: '2024-06-15' },
      pathname: '/tag',
      search: '',
      hash: '',
      key: 'default',
    })

    render(
      <MemoryRouter>
        <TagMeal />
      </MemoryRouter>
    )
    await screen.findByAltText('Selected meal')

    await userEvent.click(screen.getByRole('button', { name: 'Save' }))

    expect(navigate).toHaveBeenCalledWith('/day/2024-06-15')
  })

  it('shows a save error when addMeal throws', async () => {
    vi.mocked(useMealContext).mockReturnValue({
      meals: [],
      loading: false,
      error: null,
      addMeal: vi.fn().mockRejectedValue(new Error('Network error')),
      updateMeal: vi.fn(),
      deleteMeal: vi.fn(),
    })
    vi.mocked(useLocation).mockReturnValue({
      state: { image: imageFile() },
      pathname: '/tag',
      search: '',
      hash: '',
      key: 'default',
    })

    render(
      <MemoryRouter>
        <TagMeal />
      </MemoryRouter>
    )
    await screen.findByAltText('Selected meal')

    await userEvent.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByText('Network error')).toBeInTheDocument()
  })

  it('Cancel button navigates back when image is present', async () => {
    const navigate = vi.fn()
    vi.mocked(useNavigate).mockReturnValue(navigate)
    vi.mocked(useLocation).mockReturnValue({
      state: { image: imageFile() },
      pathname: '/tag',
      search: '',
      hash: '',
      key: 'default',
    })

    render(
      <MemoryRouter>
        <TagMeal />
      </MemoryRouter>
    )

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(navigate).toHaveBeenCalledWith(-1)
  })
})
