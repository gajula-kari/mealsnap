// Integration tests using supertest.
//
// What's different from unit tests:
//   - We import the real Express app and send actual HTTP requests through it.
//   - The full stack runs: supertest → app → router → controller → service → model.
//   - We only mock at the bottom (Meal model) — everything above it is real code.
//
// This catches wiring bugs that unit tests can't:
//   - Wrong HTTP method or route path
//   - Missing middleware (e.g. body not parsed so req.body is empty)
//   - Wrong status code at the route level
//   - req.params.id not reaching the service correctly
//
// We still mock the Mongoose model so no real DB is needed.

const request = require('supertest')
const app = require('./app')

// Mock the Meal model at the bottom of the stack.
// The controller calls the service, the service calls the model —
// mocking here means all three layers above it run for real.
jest.mock('./models/Meal')
const Meal = require('./models/Meal')

beforeEach(() => {
  jest.clearAllMocks()
})

// ─── POST /meals ──────────────────────────────────────────────────────────────

describe('POST /meals', () => {
  it('returns 201 with the created meal', async () => {
    const fakeMeal = { _id: 'abc', tag: 'HOME', occurredAt: 1700000000000 }
    Meal.create.mockResolvedValue(fakeMeal)

    // request(app) creates a test HTTP server bound to the app — no port needed.
    // .post() / .get() etc. set the method and path.
    // .send() sets the request body (supertest sets Content-Type: application/json automatically).
    // .expect() asserts on the response — you can chain multiple expects.
    const res = await request(app)
      .post('/meals')
      .send({ tag: 'HOME', occurredAt: 1700000000000 })
      .expect(201)

    expect(res.body).toEqual({ meal: fakeMeal })
  })

  it('returns 400 when the service throws (e.g. missing occurredAt)', async () => {
    // Meal.create won't be called because the service throws before it.
    // But we send a body that the real service will reject.
    const res = await request(app)
      .post('/meals')
      .send({ tag: 'HOME' }) // no occurredAt
      .expect(400)

    expect(res.body).toEqual({ error: 'occurredAt is required' })
  })
})

// ─── GET /meals ───────────────────────────────────────────────────────────────

describe('GET /meals', () => {
  it('returns 200 with all meals when no date query param', async () => {
    const fakeMeals = [{ _id: '1' }, { _id: '2' }]
    // getMeals() chains: Meal.find().sort() — mock both.
    Meal.find.mockReturnValue({ sort: jest.fn().mockResolvedValue(fakeMeals) })

    const res = await request(app).get('/meals').expect(200)

    expect(res.body).toEqual({ meals: fakeMeals })
  })

  it('returns 200 with filtered meals when date query param is given', async () => {
    const fakeMeals = [{ _id: '3' }]
    Meal.find.mockReturnValue({ sort: jest.fn().mockResolvedValue(fakeMeals) })

    // Query params go in .query() — supertest appends them as ?date=...
    const res = await request(app).get('/meals').query({ date: '2024-06-15' }).expect(200)

    expect(res.body).toEqual({ meals: fakeMeals })
  })

  it('returns 400 when the date format is invalid', async () => {
    // The real service validates the format — no model mock needed here.
    const res = await request(app).get('/meals').query({ date: 'not-a-date' }).expect(400)

    expect(res.body).toEqual({ error: 'date must be in YYYY-MM-DD format' })
  })
})

// ─── PATCH /meals/:id ─────────────────────────────────────────────────────────

describe('PATCH /meals/:id', () => {
  it('returns 200 with the updated meal', async () => {
    const fakeMeal = { _id: 'abc', tag: 'OUTSIDE', amountSpent: 200 }
    Meal.findOneAndUpdate.mockResolvedValue(fakeMeal)

    // The :id in the URL becomes req.params.id inside the controller.
    // This verifies the route correctly extracts and forwards the param.
    const res = await request(app)
      .patch('/meals/abc')
      .send({ tag: 'OUTSIDE', amountSpent: 200 })
      .expect(200)

    expect(res.body).toEqual({ meal: fakeMeal })
  })

  it('returns 404 when the meal does not exist', async () => {
    // findOneAndUpdate returning null triggers the 'Meal not found' error in the service.
    Meal.findOneAndUpdate.mockResolvedValue(null)

    const res = await request(app).patch('/meals/nonexistent').send({ tag: 'HOME' }).expect(404)

    expect(res.body).toEqual({ error: 'Meal not found' })
  })
})

// ─── DELETE /meals/:id ────────────────────────────────────────────────────────

describe('DELETE /meals/:id', () => {
  it('returns 200 with { success: true }', async () => {
    Meal.findOneAndDelete.mockResolvedValue({ _id: 'abc' })

    const res = await request(app).delete('/meals/abc').expect(200)

    expect(res.body).toEqual({ success: true })
  })

  it('returns 404 when the meal does not exist', async () => {
    Meal.findOneAndDelete.mockResolvedValue(null)

    const res = await request(app).delete('/meals/nonexistent').expect(404)

    expect(res.body).toEqual({ error: 'Meal not found' })
  })
})
