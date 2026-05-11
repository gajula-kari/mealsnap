// We're testing the controller layer in isolation.
// The controller's only jobs are:
//   1. Pull data out of req (body, params, query)
//   2. Call the right service function
//   3. Send the right HTTP response (status code + JSON shape)
//
// It should NOT know about MongoDB, validation rules, or business logic.
// That's the service's job. So we mock the service entirely.

const {
  createMealController,
  getMealsController,
  updateMealController,
  deleteMealController,
} = require('./mealsController')

// jest.mock() intercepts the require() call inside mealsController.js.
// Every exported function of mealService becomes a jest.fn() automatically —
// a blank function that tracks calls but does nothing until we tell it to.
// This must appear at the top level (not inside a test) so Jest can hoist it.
jest.mock('../services/mealService')

// Now we import those same auto-mocked functions so we can control them.
// Because jest.mock() replaced the real module, this gives us the mocked versions,
// and because Node caches modules, the controller sees the exact same mock objects.
const {
  createMeal,
  getMeals,
  getMealsByDate,
  updateMeal,
  deleteMeal,
} = require('../services/mealService')

// ─── Test helpers ────────────────────────────────────────────────────────────

// Controllers receive (req, res) from Express. In tests we pass fake objects.
// We only need the properties each test actually uses, so we default to empty
// objects and let each test override what it needs.
function makeReq({ body = {}, params = {}, query = {} } = {}) {
  return { body, params, query }
}

// res.status() must be chainable — the real Express res works like:
//   res.status(404).json({ error: '...' })
// so status() must return the same res object.
// jest.fn().mockReturnValue(res) makes it return res, enabling the chain.
function makeRes() {
  const res = {}
  res.status = jest.fn().mockReturnValue(res)
  res.json = jest.fn().mockReturnValue(res)
  return res
}

// Reset every mock's recorded calls before each test so tests don't bleed
// into each other. Without this, a call in test 1 would show up in test 2's
// toHaveBeenCalledWith() checks.
beforeEach(() => {
  jest.clearAllMocks()
})

// ─── createMealController ─────────────────────────────────────────────────────

describe('createMealController', () => {
  // Happy path: service succeeds and we check the exact response shape.
  it('responds 201 with the created meal on success', async () => {
    // Arrange: define what the (mocked) service will return.
    // mockResolvedValue() means "when called, resolve the promise with this value".
    // We use a plain object — no need for a real Mongoose document.
    const fakeMeal = { _id: 'abc', tag: 'HOME', occurredAt: 1700000000000 }
    createMeal.mockResolvedValue(fakeMeal)

    const req = makeReq({ body: { tag: 'HOME', occurredAt: 1700000000000 } })
    const res = makeRes()

    // Act: call the controller as Express would.
    await createMealController(req, res)

    // Assert: did the controller pass req.body to the service unchanged?
    expect(createMeal).toHaveBeenCalledWith(req.body)

    // Did it respond with 201?
    expect(res.status).toHaveBeenCalledWith(201)

    // Did it wrap the meal in { meal: ... } — the exact shape the client expects?
    expect(res.json).toHaveBeenCalledWith({ meal: fakeMeal })
  })

  // Error path: service throws, controller must catch and return 400.
  it('responds 400 with the error message when the service throws', async () => {
    // mockRejectedValue() is the error counterpart of mockResolvedValue().
    // It makes the mock return a promise that rejects — simulating a service failure.
    createMeal.mockRejectedValue(new Error('occurredAt is required'))

    const req = makeReq({ body: {} })
    const res = makeRes()

    await createMealController(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ error: 'occurredAt is required' })
  })
})

// ─── getMealsController ───────────────────────────────────────────────────────

describe('getMealsController', () => {
  // The controller branches on whether req.query.date exists.
  // We need one test for each branch.

  it('calls getMeals() and responds with all meals when no date is given', async () => {
    const fakeMeals = [{ _id: '1' }, { _id: '2' }]
    getMeals.mockResolvedValue(fakeMeals)

    // No query.date — makeReq() defaults query to {}.
    const req = makeReq()
    const res = makeRes()

    await getMealsController(req, res)

    // Confirm the right branch ran.
    expect(getMeals).toHaveBeenCalledTimes(1)
    expect(getMealsByDate).not.toHaveBeenCalled()

    // No explicit status call — Express defaults to 200 when you call res.json() directly.
    // Asserting status was NOT called proves the controller isn't accidentally setting a
    // wrong status code on the success path.
    expect(res.status).not.toHaveBeenCalled()
    expect(res.json).toHaveBeenCalledWith({ meals: fakeMeals })
  })

  it('calls getMealsByDate() with the date string when date query param is present', async () => {
    const fakeMeals = [{ _id: '3' }]
    getMealsByDate.mockResolvedValue(fakeMeals)

    const req = makeReq({ query: { date: '2024-06-15' } })
    const res = makeRes()

    await getMealsController(req, res)

    // The controller must forward the exact date string — not transform it.
    expect(getMealsByDate).toHaveBeenCalledWith('2024-06-15')
    expect(getMeals).not.toHaveBeenCalled()
    expect(res.json).toHaveBeenCalledWith({ meals: fakeMeals })
  })

  // Edge case: the service (getMealsByDate) can throw if the date format is wrong.
  // The controller shouldn't crash — it must catch and return 400.
  it('responds 400 when getMealsByDate throws (e.g. bad date format)', async () => {
    getMealsByDate.mockRejectedValue(new Error('date must be in YYYY-MM-DD format'))

    const req = makeReq({ query: { date: 'not-a-date' } })
    const res = makeRes()

    await getMealsController(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ error: 'date must be in YYYY-MM-DD format' })
  })

  it('responds 400 when getMeals throws (e.g. DB error)', async () => {
    getMeals.mockRejectedValue(new Error('DB connection lost'))

    const req = makeReq()
    const res = makeRes()

    await getMealsController(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ error: 'DB connection lost' })
  })
})

// ─── updateMealController ─────────────────────────────────────────────────────

describe('updateMealController', () => {
  it('responds 200 with the updated meal on success', async () => {
    const fakeMeal = { _id: 'abc', tag: 'OUTSIDE', amountSpent: 350 }
    updateMeal.mockResolvedValue(fakeMeal)

    // The controller reads the id from req.params.id and the payload from req.body.
    const req = makeReq({
      params: { id: 'abc' },
      body: { tag: 'OUTSIDE', amountSpent: 350 },
    })
    const res = makeRes()

    await updateMealController(req, res)

    // Must forward both the id and the body — not just one.
    expect(updateMeal).toHaveBeenCalledWith('abc', req.body)
    expect(res.status).not.toHaveBeenCalled()
    expect(res.json).toHaveBeenCalledWith({ meal: fakeMeal })
  })

  // Critical edge case: "Meal not found" must map to 404, not 400.
  // This distinction matters — 404 means "the resource doesn't exist",
  // 400 means "your request is malformed". They have different meanings to clients.
  it('responds 404 when the service throws "Meal not found"', async () => {
    updateMeal.mockRejectedValue(new Error('Meal not found'))

    const req = makeReq({ params: { id: 'nonexistent' }, body: { tag: 'HOME' } })
    const res = makeRes()

    await updateMealController(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({ error: 'Meal not found' })
  })

  // Any other service error (validation, DB) must fall through to 400.
  it('responds 400 for any other service error', async () => {
    updateMeal.mockRejectedValue(new Error('DB connection lost'))

    const req = makeReq({ params: { id: 'abc' }, body: { tag: 'OUTSIDE' } })
    const res = makeRes()

    await updateMealController(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ error: 'DB connection lost' })
  })
})

// ─── deleteMealController ─────────────────────────────────────────────────────

describe('deleteMealController', () => {
  it('responds { success: true } on successful delete', async () => {
    // deleteMeal resolves with true — but we only care that the controller
    // doesn't use the return value in the response (it always sends { success: true }).
    deleteMeal.mockResolvedValue(true)

    const req = makeReq({ params: { id: 'abc' } })
    const res = makeRes()

    await deleteMealController(req, res)

    // The id must flow from req.params into the service.
    expect(deleteMeal).toHaveBeenCalledWith('abc')
    expect(res.status).not.toHaveBeenCalled()
    expect(res.json).toHaveBeenCalledWith({ success: true })
  })

  // Same 404 rule as update — if the meal doesn't exist, say so explicitly.
  it('responds 404 when the service throws "Meal not found"', async () => {
    deleteMeal.mockRejectedValue(new Error('Meal not found'))

    const req = makeReq({ params: { id: 'ghost-id' } })
    const res = makeRes()

    await deleteMealController(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({ error: 'Meal not found' })
  })

  it('responds 400 for any other service error', async () => {
    deleteMeal.mockRejectedValue(new Error('DB connection lost'))

    const req = makeReq({ params: { id: 'abc' } })
    const res = makeRes()

    await deleteMealController(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ error: 'DB connection lost' })
  })
})
