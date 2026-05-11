import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import MealCard from './MealCard'
import type { Meal } from '../types'

const meal: Meal = {
  id: 'meal-1',
  tag: 'INDULGENT',
  imageUrl: 'https://example.com/img.jpg',
  note: 'Lunch',
  amountSpent: 200,
  occurredAt: new Date('2024-06-15T12:30:00').getTime(),
}

describe('display', () => {
  it('renders the tag badge, note, and amount', () => {
    render(<MealCard meal={meal} />)

    expect(screen.getByText('INDULGENT')).toBeInTheDocument()
    expect(screen.getByText('Lunch')).toBeInTheDocument()
    expect(screen.getByText('₹200')).toBeInTheDocument()
  })

  it('renders the meal image with correct src', () => {
    render(<MealCard meal={meal} />)

    expect(screen.getByRole('img')).toHaveAttribute('src', meal.imageUrl)
  })

  it('shows "No image" placeholder when imageUrl is null', () => {
    render(<MealCard meal={{ ...meal, imageUrl: null }} />)

    expect(screen.getByText('No image')).toBeInTheDocument()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('hides note and amount when both are null', () => {
    render(<MealCard meal={{ ...meal, note: null, amountSpent: null }} />)

    expect(screen.queryByText('Lunch')).not.toBeInTheDocument()
    expect(screen.queryByText(/₹/)).not.toBeInTheDocument()
  })

  it('hides Edit and Delete buttons when handlers are not provided', () => {
    render(<MealCard meal={meal} />)

    expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument()
  })
})

describe('edit flow', () => {
  it('opens the edit form when Edit is clicked', async () => {
    const user = userEvent.setup()
    render(<MealCard meal={meal} onEdit={vi.fn()} onDelete={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: 'Edit' }))

    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
  })

  it('closes the edit form when Cancel is clicked', async () => {
    const user = userEvent.setup()
    render(<MealCard meal={meal} onEdit={vi.fn()} onDelete={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: 'Edit' }))
    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(screen.queryByRole('button', { name: 'Save' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument()
  })

  it('hides the amount field in the edit form when tag is HOME', async () => {
    const user = userEvent.setup()
    render(
      <MealCard
        meal={{ ...meal, tag: 'CLEAN', amountSpent: null }}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    )

    await user.click(screen.getByRole('button', { name: 'Edit' }))

    expect(screen.queryByPlaceholderText('Amount spent')).not.toBeInTheDocument()
  })

  it('shows the amount field in the edit form when tag is INDULGENT', async () => {
    const user = userEvent.setup()
    render(<MealCard meal={meal} onEdit={vi.fn()} onDelete={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: 'Edit' }))

    expect(screen.getByPlaceholderText('Amount spent')).toBeInTheDocument()
  })

  it('calls onEdit with amountSpent=null when tag is CLEAN', async () => {
    const user = userEvent.setup()
    const onEdit = vi.fn().mockResolvedValue(meal)
    render(
      <MealCard
        meal={{ ...meal, tag: 'CLEAN', amountSpent: null }}
        onEdit={onEdit}
        onDelete={vi.fn()}
      />
    )

    await user.click(screen.getByRole('button', { name: 'Edit' }))
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(onEdit).toHaveBeenCalledWith(
      meal.id,
      expect.objectContaining({ tag: 'CLEAN', amountSpent: null })
    )
  })

  it('trims whitespace from the note before saving', async () => {
    const user = userEvent.setup()
    const onEdit = vi.fn().mockResolvedValue(meal)
    render(<MealCard meal={meal} onEdit={onEdit} onDelete={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: 'Edit' }))

    const noteField = screen.getByPlaceholderText('Note (optional)')
    await user.clear(noteField)
    await user.type(noteField, '  Dinner  ')

    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(onEdit).toHaveBeenCalledWith(meal.id, expect.objectContaining({ note: 'Dinner' }))
  })

  it('saves note as null when the note field is empty', async () => {
    const user = userEvent.setup()
    const onEdit = vi.fn().mockResolvedValue(meal)
    render(<MealCard meal={meal} onEdit={onEdit} onDelete={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: 'Edit' }))
    await user.clear(screen.getByPlaceholderText('Note (optional)'))
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(onEdit).toHaveBeenCalledWith(meal.id, expect.objectContaining({ note: null }))
  })
})

describe('delete flow', () => {
  it('shows a confirmation prompt when Delete is clicked', async () => {
    const user = userEvent.setup()
    render(<MealCard meal={meal} onEdit={vi.fn()} onDelete={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: 'Delete' }))

    expect(screen.getByText('Delete this meal?')).toBeInTheDocument()
  })

  it('calls onDelete with meal.id when deletion is confirmed', async () => {
    const user = userEvent.setup()
    const onDelete = vi.fn().mockResolvedValue(undefined)
    render(<MealCard meal={meal} onEdit={vi.fn()} onDelete={onDelete} />)

    await user.click(screen.getByRole('button', { name: 'Delete' }))
    await user.click(screen.getByRole('button', { name: 'Yes' }))

    expect(onDelete).toHaveBeenCalledWith(meal.id)
  })

  it('dismisses the confirmation when No is clicked', async () => {
    const user = userEvent.setup()
    render(<MealCard meal={meal} onEdit={vi.fn()} onDelete={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: 'Delete' }))
    await user.click(screen.getByRole('button', { name: 'No' }))

    expect(screen.queryByText('Delete this meal?')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument()
  })
})

describe('tag switching in edit form', () => {
  it('switching tag to CLEAN hides the amount field', async () => {
    const user = userEvent.setup()
    render(<MealCard meal={meal} onEdit={vi.fn()} onDelete={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: 'Edit' }))
    expect(screen.getByPlaceholderText('Amount spent')).toBeInTheDocument()

    const tagButtons = screen.getAllByRole('button', { name: 'CLEAN' })
    await user.click(tagButtons[tagButtons.length - 1])

    expect(screen.queryByPlaceholderText('Amount spent')).not.toBeInTheDocument()
  })

  it('switching tag from CLEAN to INDULGENT shows the amount field', async () => {
    const user = userEvent.setup()
    render(
      <MealCard
        meal={{ ...meal, tag: 'CLEAN', amountSpent: null }}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    )

    await user.click(screen.getByRole('button', { name: 'Edit' }))
    expect(screen.queryByPlaceholderText('Amount spent')).not.toBeInTheDocument()

    const tagButtons = screen.getAllByRole('button', { name: 'INDULGENT' })
    await user.click(tagButtons[tagButtons.length - 1])

    expect(screen.getByPlaceholderText('Amount spent')).toBeInTheDocument()
  })
})
