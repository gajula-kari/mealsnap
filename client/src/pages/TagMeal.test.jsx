// TagMeal is mostly orchestration (FileReader, location state, navigation).
// FileReader is a browser API that's cumbersome to mock in jsdom.
//
// The one case we can test cleanly and that matters:
// when no image is in location state, the component shows a fallback UI
// instead of the tagging form. This guards against the user landing on /tag
// without going through the image picker.

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import TagMeal from './TagMeal'

vi.mock('../hooks/useMealContext.js')
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useLocation: vi.fn(),
    useNavigate: vi.fn(() => vi.fn()),
  }
})

import { useMealContext } from '../hooks/useMealContext.js'
import { useLocation, useNavigate } from 'react-router-dom'

beforeEach(() => {
  vi.clearAllMocks()
  useMealContext.mockReturnValue({ addMeal: vi.fn() })
})

describe('TagMeal', () => {
  it('shows a fallback message when no image is in location state', () => {
    useLocation.mockReturnValue({ state: null })

    render(
      <MemoryRouter>
        <TagMeal />
      </MemoryRouter>,
    )

    expect(screen.getByText('No image found. Please capture an image first.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Go Back' })).toBeInTheDocument()
  })

  it('does not render the tagging form when there is no image', () => {
    useLocation.mockReturnValue({ state: null })

    render(
      <MemoryRouter>
        <TagMeal />
      </MemoryRouter>,
    )

    // The tag buttons (HOME / OUTSIDE / MIXED) must not appear in the fallback view.
    expect(screen.queryByRole('button', { name: 'HOME' })).not.toBeInTheDocument()
  })
})

// ─── With image ───────────────────────────────────────────────────────────────

describe('TagMeal with image', () => {
  // FileReader is async in real browsers. This mock fires onload via queueMicrotask
  // so RTL's findBy* queries can await the preview state update.
  class MockFileReader {
    readAsDataURL() {
      this.result = 'data:image/jpeg;base64,fake'
      queueMicrotask(() => this.onload())
    }
  }

  beforeEach(() => {
    vi.stubGlobal('FileReader', MockFileReader)
    useMealContext.mockReturnValue({ addMeal: vi.fn() })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  function imageFile() {
    return new File(['img'], 'photo.jpg', { type: 'image/jpeg' })
  }

  it('renders the tag buttons once the preview loads', async () => {
    useLocation.mockReturnValue({ state: { image: imageFile() } })

    render(<MemoryRouter><TagMeal /></MemoryRouter>)

    await screen.findByAltText('Selected meal')

    expect(screen.getByRole('button', { name: 'HOME' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'OUTSIDE' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'MIXED' })).toBeInTheDocument()
  })

  it('calls addMeal with the chosen tag and navigates to the day detail', async () => {
    const navigate = vi.fn()
    useNavigate.mockReturnValue(navigate)
    const addMeal = vi.fn().mockResolvedValue({})
    useMealContext.mockReturnValue({ addMeal })
    useLocation.mockReturnValue({ state: { image: imageFile() } })

    render(<MemoryRouter><TagMeal /></MemoryRouter>)
    await screen.findByAltText('Selected meal')

    await userEvent.click(screen.getByRole('button', { name: 'HOME' }))

    expect(addMeal).toHaveBeenCalledWith(expect.objectContaining({ tag: 'HOME' }))
    const today = new Date()
    const y = today.getFullYear()
    const m = String(today.getMonth() + 1).padStart(2, '0')
    const d = String(today.getDate()).padStart(2, '0')
    expect(navigate).toHaveBeenCalledWith(`/day/${y}-${m}-${d}`)
  })

  it('uses noon of dateFromState as occurredAt when coming from a past day', async () => {
    const addMeal = vi.fn().mockResolvedValue({})
    useMealContext.mockReturnValue({ addMeal })
    useLocation.mockReturnValue({ state: { image: imageFile(), date: '2024-06-15' } })

    render(<MemoryRouter><TagMeal /></MemoryRouter>)
    await screen.findByAltText('Selected meal')

    await userEvent.click(screen.getByRole('button', { name: 'OUTSIDE' }))

    expect(addMeal).toHaveBeenCalledWith(
      expect.objectContaining({
        tag: 'OUTSIDE',
        occurredAt: new Date(2024, 5, 15, 12, 0, 0, 0).getTime(),
      }),
    )
  })

  it('navigates to the dateFromState day after tagging', async () => {
    const navigate = vi.fn()
    useNavigate.mockReturnValue(navigate)
    const addMeal = vi.fn().mockResolvedValue({})
    useMealContext.mockReturnValue({ addMeal })
    useLocation.mockReturnValue({ state: { image: imageFile(), date: '2024-06-15' } })

    render(<MemoryRouter><TagMeal /></MemoryRouter>)
    await screen.findByAltText('Selected meal')

    await userEvent.click(screen.getByRole('button', { name: 'MIXED' }))

    expect(navigate).toHaveBeenCalledWith('/day/2024-06-15')
  })

  it('shows a save error when addMeal throws', async () => {
    useMealContext.mockReturnValue({
      addMeal: vi.fn().mockRejectedValue(new Error('Network error')),
    })
    useLocation.mockReturnValue({ state: { image: imageFile() } })

    render(<MemoryRouter><TagMeal /></MemoryRouter>)
    await screen.findByAltText('Selected meal')

    await userEvent.click(screen.getByRole('button', { name: 'HOME' }))

    expect(await screen.findByText('Network error')).toBeInTheDocument()
  })

  it('Cancel button navigates back when image is present', async () => {
    const navigate = vi.fn()
    useNavigate.mockReturnValue(navigate)
    useLocation.mockReturnValue({ state: { image: imageFile() } })

    render(<MemoryRouter><TagMeal /></MemoryRouter>)

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(navigate).toHaveBeenCalledWith(-1)
  })
})
