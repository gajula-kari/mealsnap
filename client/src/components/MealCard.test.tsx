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
  it('renders the meal image with correct src', () => {
    render(<MealCard meal={meal} />)
    expect(screen.getByRole('img')).toHaveAttribute('src', meal.imageUrl)
  })

  it('shows note and amount in footer', () => {
    render(<MealCard meal={meal} />)
    expect(screen.getByText('Lunch')).toBeInTheDocument()
    expect(screen.getByText('₹200')).toBeInTheDocument()
  })

  it('hides footer when note and amount are both null', () => {
    render(<MealCard meal={{ ...meal, note: null, amountSpent: null }} />)
    expect(screen.queryByText('Lunch')).not.toBeInTheDocument()
    expect(screen.queryByText(/₹/)).not.toBeInTheDocument()
  })

  it('shows "No image" placeholder when imageUrl is null', () => {
    render(<MealCard meal={{ ...meal, imageUrl: null }} />)
    expect(screen.getByText('No image')).toBeInTheDocument()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('shows dustbin when onDelete is provided', () => {
    render(<MealCard meal={meal} onDelete={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Delete meal' })).toBeInTheDocument()
  })

  it('hides dustbin when onDelete is not provided', () => {
    render(<MealCard meal={meal} />)
    expect(screen.queryByRole('button', { name: 'Delete meal' })).not.toBeInTheDocument()
  })
})

describe('tap', () => {
  it('calls onTap when image is clicked', async () => {
    const user = userEvent.setup()
    const onTap = vi.fn()
    render(<MealCard meal={meal} onTap={onTap} />)

    await user.click(screen.getByRole('img'))
    expect(onTap).toHaveBeenCalled()
  })

  it('does not call onTap when dustbin is clicked', async () => {
    const user = userEvent.setup()
    const onTap = vi.fn()
    render(<MealCard meal={meal} onTap={onTap} onDelete={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: 'Delete meal' }))
    expect(onTap).not.toHaveBeenCalled()
  })
})

describe('delete flow', () => {
  it('shows confirmation when dustbin is clicked', async () => {
    const user = userEvent.setup()
    render(<MealCard meal={meal} onDelete={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: 'Delete meal' }))
    expect(screen.getByText('Delete this meal?')).toBeInTheDocument()
  })

  it('calls onDelete when confirmed', async () => {
    const user = userEvent.setup()
    const onDelete = vi.fn().mockResolvedValue(undefined)
    render(<MealCard meal={meal} onDelete={onDelete} />)

    await user.click(screen.getByRole('button', { name: 'Delete meal' }))
    await user.click(screen.getByRole('button', { name: 'Yes, delete' }))
    expect(onDelete).toHaveBeenCalledWith(meal.id)
  })

  it('dismisses confirmation on Cancel', async () => {
    const user = userEvent.setup()
    render(<MealCard meal={meal} onDelete={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: 'Delete meal' }))
    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(screen.queryByText('Delete this meal?')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Delete meal' })).toBeInTheDocument()
  })
})
