// We're testing the controller layer in isolation.
// The controller's only jobs are:
//   1. Extract userId from x-user-id header and reject if missing
//   2. Pull data out of req (body, params, query)
//   3. Call the right service function with userId + payload
//   4. Send the right HTTP response (status code + JSON shape)

const {
  createMealController,
  getMealsController,
  updateMealController,
  deleteMealController,
} = require('./mealsController')

jest.mock('../services/mealService')

const {
  createMeal,
  getMeals,
  getMealsByDate,
  updateMeal,
  deleteMeal,
} = require('../services/mealService')

// ─── Test helpers ─────────────────────────────────────────────────────────────

function makeReq({ body = {}, params = {}, query = {}, headers = {} } = {}) {
  return { body, params, query, headers }
}

function makeRes() {
  const res = {}
  res.status = jest.fn().mockReturnValue(res)
  res.json = jest.fn().mockReturnValue(res)
  return res
}

const USER_ID = 'device-uuid-123'
const withUser = { 'x-user-id': USER_ID }

beforeEach(() => {
  jest.clearAllMocks()
})

// ─── createMealController ─────────────────────────────────────────────────────

describe('createMealController', () => {
  it('responds 201 with the created meal on success', async () => {
    const fakeMeal = { _id: 'abc', tag: 'CLEAN', occurredAt: 1700000000000 }
    createMeal.mockResolvedValue(fakeMeal)

    const req = makeReq({ headers: withUser, body: { tag: 'CLEAN', occurredAt: 1700000000000 } })
    const res = makeRes()

    await createMealController(req, res)

    expect(createMeal).toHaveBeenCalledWith(USER_ID, req.body)
    expect(res.status).toHaveBeenCalledWith(201)
    expect(res.json).toHaveBeenCalledWith({ meal: fakeMeal })
  })

  it('responds 400 with the error message when the service throws', async () => {
    createMeal.mockRejectedValue(new Error('occurredAt is required'))

    const req = makeReq({ headers: withUser, body: {} })
    const res = makeRes()

    await createMealController(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ error: 'occurredAt is required' })
  })

  it('responds 400 when x-user-id header is missing', async () => {
    const req = makeReq({ body: { tag: 'CLEAN', occurredAt: 1700000000000 } })
    const res = makeRes()

    await createMealController(req, res)

    expect(createMeal).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ error: 'x-user-id header is required' })
  })
})

// ─── getMealsController ───────────────────────────────────────────────────────

describe('getMealsController', () => {
  it('calls getMeals() with userId and responds with all meals when no date is given', async () => {
    const fakeMeals = [{ _id: '1' }, { _id: '2' }]
    getMeals.mockResolvedValue(fakeMeals)

    const req = makeReq({ headers: withUser })
    const res = makeRes()

    await getMealsController(req, res)

    expect(getMeals).toHaveBeenCalledWith(USER_ID)
    expect(getMealsByDate).not.toHaveBeenCalled()
    expect(res.status).not.toHaveBeenCalled()
    expect(res.json).toHaveBeenCalledWith({ meals: fakeMeals })
  })

  it('calls getMealsByDate() with userId and date string when date query param is present', async () => {
    const fakeMeals = [{ _id: '3' }]
    getMealsByDate.mockResolvedValue(fakeMeals)

    const req = makeReq({ headers: withUser, query: { date: '2024-06-15' } })
    const res = makeRes()

    await getMealsController(req, res)

    expect(getMealsByDate).toHaveBeenCalledWith(USER_ID, '2024-06-15')
    expect(getMeals).not.toHaveBeenCalled()
    expect(res.json).toHaveBeenCalledWith({ meals: fakeMeals })
  })

  it('responds 400 when getMealsByDate throws (e.g. bad date format)', async () => {
    getMealsByDate.mockRejectedValue(new Error('date must be in YYYY-MM-DD format'))

    const req = makeReq({ headers: withUser, query: { date: 'not-a-date' } })
    const res = makeRes()

    await getMealsController(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ error: 'date must be in YYYY-MM-DD format' })
  })

  it('responds 400 when getMeals throws (e.g. DB error)', async () => {
    getMeals.mockRejectedValue(new Error('DB connection lost'))

    const req = makeReq({ headers: withUser })
    const res = makeRes()

    await getMealsController(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ error: 'DB connection lost' })
  })

  it('responds 400 when x-user-id header is missing', async () => {
    const req = makeReq()
    const res = makeRes()

    await getMealsController(req, res)

    expect(getMeals).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ error: 'x-user-id header is required' })
  })
})

// ─── updateMealController ─────────────────────────────────────────────────────

describe('updateMealController', () => {
  it('responds 200 with the updated meal on success', async () => {
    const fakeMeal = { _id: 'abc', tag: 'INDULGENT', amountSpent: 350 }
    updateMeal.mockResolvedValue(fakeMeal)

    const req = makeReq({
      headers: withUser,
      params: { id: 'abc' },
      body: { tag: 'INDULGENT', amountSpent: 350 },
    })
    const res = makeRes()

    await updateMealController(req, res)

    expect(updateMeal).toHaveBeenCalledWith(USER_ID, 'abc', req.body)
    expect(res.status).not.toHaveBeenCalled()
    expect(res.json).toHaveBeenCalledWith({ meal: fakeMeal })
  })

  it('responds 404 when the service throws "Meal not found"', async () => {
    updateMeal.mockRejectedValue(new Error('Meal not found'))

    const req = makeReq({
      headers: withUser,
      params: { id: 'nonexistent' },
      body: { tag: 'CLEAN' },
    })
    const res = makeRes()

    await updateMealController(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({ error: 'Meal not found' })
  })

  it('responds 400 for any other service error', async () => {
    updateMeal.mockRejectedValue(new Error('DB connection lost'))

    const req = makeReq({ headers: withUser, params: { id: 'abc' }, body: { tag: 'INDULGENT' } })
    const res = makeRes()

    await updateMealController(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ error: 'DB connection lost' })
  })

  it('responds 400 when x-user-id header is missing', async () => {
    const req = makeReq({ params: { id: 'abc' }, body: { tag: 'CLEAN' } })
    const res = makeRes()

    await updateMealController(req, res)

    expect(updateMeal).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ error: 'x-user-id header is required' })
  })
})

// ─── deleteMealController ─────────────────────────────────────────────────────

describe('deleteMealController', () => {
  it('responds { success: true } on successful delete', async () => {
    deleteMeal.mockResolvedValue(true)

    const req = makeReq({ headers: withUser, params: { id: 'abc' } })
    const res = makeRes()

    await deleteMealController(req, res)

    expect(deleteMeal).toHaveBeenCalledWith(USER_ID, 'abc')
    expect(res.status).not.toHaveBeenCalled()
    expect(res.json).toHaveBeenCalledWith({ success: true })
  })

  it('responds 404 when the service throws "Meal not found"', async () => {
    deleteMeal.mockRejectedValue(new Error('Meal not found'))

    const req = makeReq({ headers: withUser, params: { id: 'ghost-id' } })
    const res = makeRes()

    await deleteMealController(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({ error: 'Meal not found' })
  })

  it('responds 400 for any other service error', async () => {
    deleteMeal.mockRejectedValue(new Error('DB connection lost'))

    const req = makeReq({ headers: withUser, params: { id: 'abc' } })
    const res = makeRes()

    await deleteMealController(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ error: 'DB connection lost' })
  })

  it('responds 400 when x-user-id header is missing', async () => {
    const req = makeReq({ params: { id: 'abc' } })
    const res = makeRes()

    await deleteMealController(req, res)

    expect(deleteMeal).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ error: 'x-user-id header is required' })
  })
})
