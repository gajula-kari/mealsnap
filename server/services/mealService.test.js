// We're testing the service layer in isolation.
// The service's jobs are:
//   1. Enforce business rules (occurredAt required, HOME meals have no amountSpent, etc.)
//   2. Build the correct query arguments and pass them to the Mongoose model
//   3. Handle model responses (throw 'Meal not found' when the model returns null)
//
// The service depends on the Meal model (MongoDB). We mock it so no DB is needed.
// This is the same pattern as the controller tests — one layer down.

const { createMeal, getMeals, getMealsByDate, updateMeal, deleteMeal } =
  require('./mealService')

// Mock the Mongoose model. Every method (create, find, findOneAndUpdate, etc.)
// becomes a jest.fn() automatically.
jest.mock('../models/Meal')
const Meal = require('../models/Meal')

beforeEach(() => {
  jest.clearAllMocks()
})

// ─── createMeal ───────────────────────────────────────────────────────────────

describe('createMeal', () => {
  it('calls Meal.create with the correct fields and returns the result', async () => {
    const fakeMeal = { _id: '123', tag: 'OUTSIDE', amountSpent: 300, occurredAt: 1700000000000 }
    Meal.create.mockResolvedValue(fakeMeal)

    const result = await createMeal({
      imageUrl: 'https://example.com/img.jpg',
      tag: 'OUTSIDE',
      amountSpent: 300,
      note: 'Lunch',
      occurredAt: 1700000000000,
    })

    // We assert the exact object passed to Meal.create — this pins down the
    // mapping logic between the service inputs and the DB document shape.
    expect(Meal.create).toHaveBeenCalledWith({
      userId: 'user-123',
      imageUrl: 'https://example.com/img.jpg',
      tag: 'OUTSIDE',
      amountSpent: 300,
      note: 'Lunch',
      occurredAt: 1700000000000,
    })

    // The service must return whatever Meal.create resolves with — no transformation.
    expect(result).toBe(fakeMeal)
  })

  // Validation rule: occurredAt is required. The throw must happen BEFORE
  // Meal.create is called — we verify create was never reached.
  it('throws if occurredAt is missing', async () => {
    // rejects.toThrow() is how you assert that an async function throws.
    // You must await the whole expression, not just the function call.
    await expect(createMeal({ tag: 'HOME' })).rejects.toThrow('occurredAt is required')

    expect(Meal.create).not.toHaveBeenCalled()
  })

  // Business rule: HOME meals never have a spend amount, even if the caller passes one.
  // We use expect.objectContaining() to check only the fields we care about,
  // without listing every field in the object.
  it('forces amountSpent to null for HOME meals regardless of input', async () => {
    Meal.create.mockResolvedValue({})

    await createMeal({ tag: 'HOME', amountSpent: 500, occurredAt: 1700000000000 })

    expect(Meal.create).toHaveBeenCalledWith(
      expect.objectContaining({ tag: 'HOME', amountSpent: null }),
    )
  })

  // Counterpart: OUTSIDE and MIXED meals pass amountSpent through unchanged.
  it('passes amountSpent through for OUTSIDE meals', async () => {
    Meal.create.mockResolvedValue({})

    await createMeal({ tag: 'OUTSIDE', amountSpent: 250, occurredAt: 1700000000000 })

    expect(Meal.create).toHaveBeenCalledWith(
      expect.objectContaining({ tag: 'OUTSIDE', amountSpent: 250 }),
    )
  })

  // Null-coalescing: imageUrl and note default to null if not provided.
  it('defaults imageUrl and note to null when omitted', async () => {
    Meal.create.mockResolvedValue({})

    await createMeal({ tag: 'HOME', occurredAt: 1700000000000 })

    expect(Meal.create).toHaveBeenCalledWith(
      expect.objectContaining({ imageUrl: null, note: null }),
    )
  })
})

// ─── getMeals ─────────────────────────────────────────────────────────────────

describe('getMeals', () => {
  // Mongoose chains: Meal.find(...).sort(...) — find() returns an object,
  // and sort() is called on that object. We have to mock the chain explicitly.
  // mockReturnValue (not mockResolvedValue) because find() is synchronous —
  // it returns a query object, not a promise. sort() is what resolves.
  it('queries by userId and sorts by occurredAt descending', async () => {
    const fakeMeals = [{ _id: '1' }, { _id: '2' }]
    const mockSort = jest.fn().mockResolvedValue(fakeMeals)
    Meal.find.mockReturnValue({ sort: mockSort })

    const result = await getMeals()

    expect(Meal.find).toHaveBeenCalledWith({ userId: 'user-123' })
    expect(mockSort).toHaveBeenCalledWith({ occurredAt: -1 })
    expect(result).toBe(fakeMeals)
  })
})

// ─── getMealsByDate ───────────────────────────────────────────────────────────

describe('getMealsByDate', () => {
  it('queries with the correct start/end timestamps for the given date', async () => {
    const fakeMeals = [{ _id: '1' }]
    const mockSort = jest.fn().mockResolvedValue(fakeMeals)
    Meal.find.mockReturnValue({ sort: mockSort })

    const dateString = '2024-06-15'
    const result = await getMealsByDate(dateString)

    // Compute the expected range using the same logic as the service.
    // This way the test stays correct even if the machine's timezone changes.
    const [year, month, day] = dateString.split('-').map(Number)
    const expectedStart = new Date(year, month - 1, day, 0, 0, 0, 0).getTime()
    const expectedEnd   = new Date(year, month - 1, day, 23, 59, 59, 999).getTime()

    expect(Meal.find).toHaveBeenCalledWith({
      userId: 'user-123',
      occurredAt: { $gte: expectedStart, $lte: expectedEnd },
    })
    expect(mockSort).toHaveBeenCalledWith({ occurredAt: -1 })
    expect(result).toBe(fakeMeals)
  })

  // The service uses a regex /^\d{4}-\d{2}-\d{2}$/ to validate the format.
  // Both of these strings fail it — we test two shapes to cover the rule, not just one.
  it('throws if the date string is not in YYYY-MM-DD format', async () => {
    await expect(getMealsByDate('15-06-2024')).rejects.toThrow('date must be in YYYY-MM-DD format')
    await expect(getMealsByDate('not-a-date')).rejects.toThrow('date must be in YYYY-MM-DD format')

    expect(Meal.find).not.toHaveBeenCalled()
  })
})

// ─── updateMeal ───────────────────────────────────────────────────────────────

describe('updateMeal', () => {
  it('calls findOneAndUpdate with correct query, updates, and options, then returns the meal', async () => {
    const fakeMeal = { _id: 'abc', tag: 'OUTSIDE', amountSpent: 200 }
    Meal.findOneAndUpdate.mockResolvedValue(fakeMeal)

    const result = await updateMeal('abc', { tag: 'OUTSIDE', amountSpent: 200, note: 'Dinner' })

    expect(Meal.findOneAndUpdate).toHaveBeenCalledWith(
      // Filter: must scope to userId so users can't update each other's meals.
      { _id: 'abc', userId: 'user-123' },
      // Updates: the exact fields being written.
      { tag: 'OUTSIDE', amountSpent: 200, note: 'Dinner' },
      // Options: new:true returns the updated doc; runValidators re-runs schema rules.
      { new: true, runValidators: true },
    )
    expect(result).toBe(fakeMeal)
  })

  // null return from findOneAndUpdate means the _id didn't exist (or wrong userId).
  // The service translates that into a named error so the controller can map it to 404.
  it('throws "Meal not found" when findOneAndUpdate returns null', async () => {
    Meal.findOneAndUpdate.mockResolvedValue(null)

    await expect(updateMeal('nonexistent', { tag: 'HOME' })).rejects.toThrow('Meal not found')
  })

  // amountSpent is optional for OUTSIDE — null is a valid value.
  // Only HOME meals have special handling (forced to null).
  it('allows null amountSpent for OUTSIDE meals', async () => {
    const fakeMeal = { _id: 'abc', tag: 'OUTSIDE', amountSpent: null }
    Meal.findOneAndUpdate.mockResolvedValue(fakeMeal)

    const result = await updateMeal('abc', { tag: 'OUTSIDE', amountSpent: null })

    expect(Meal.findOneAndUpdate).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ tag: 'OUTSIDE', amountSpent: null }),
      expect.anything(),
    )
    expect(result).toBe(fakeMeal)
  })

  it('forces amountSpent to null when tag is HOME', async () => {
    Meal.findOneAndUpdate.mockResolvedValue({ _id: 'abc', tag: 'HOME', amountSpent: null })

    await updateMeal('abc', { tag: 'HOME', amountSpent: 500 })

    expect(Meal.findOneAndUpdate).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ amountSpent: null }),
      expect.anything(),
    )
  })
})

// ─── deleteMeal ───────────────────────────────────────────────────────────────

describe('deleteMeal', () => {
  it('calls findOneAndDelete with the correct filter and returns true', async () => {
    Meal.findOneAndDelete.mockResolvedValue({ _id: 'abc' })

    const result = await deleteMeal('abc')

    // userId scope is critical — same security concern as update.
    expect(Meal.findOneAndDelete).toHaveBeenCalledWith({ _id: 'abc', userId: 'user-123' })

    // The service always returns true on success — the controller doesn't use
    // the deleted document, so there's nothing meaningful to return.
    expect(result).toBe(true)
  })

  it('throws "Meal not found" when findOneAndDelete returns null', async () => {
    Meal.findOneAndDelete.mockResolvedValue(null)

    await expect(deleteMeal('nonexistent')).rejects.toThrow('Meal not found')
  })
})
