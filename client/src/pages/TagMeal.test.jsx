// TagMeal is mostly orchestration (FileReader, location state, navigation).
// FileReader is a browser API that's cumbersome to mock in jsdom.
//
// The one case we can test cleanly and that matters:
// when no image is in location state, the component shows a fallback UI
// instead of the tagging form. This guards against the user landing on /tag
// without going through the image picker.

import { render, screen } from '@testing-library/react'
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
import { useLocation } from 'react-router-dom'

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
