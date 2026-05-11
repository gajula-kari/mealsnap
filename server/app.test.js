// Integration tests using supertest.
//
// What's different from unit tests:
//   - We import the real Express app and send actual HTTP requests through it.
//   - The full stack runs: supertest → app → router → controller → service → model.
//   - We only mock at the bottom (Meal/UserSettings models) — everything above is real.
//
// This catches wiring bugs that unit tests can't:
//   - Wrong HTTP method or route path
//   - Missing middleware (e.g. body not parsed so req.body is empty)
//   - Wrong status code at the route level
//   - req.params.id / x-user-id not reaching the service correctly

const request = require('supertest')
const app = require('./app')

jest.mock('./models/Meal')
const Meal = require('./models/Meal')

jest.mock('./models/UserSettings')
const UserSettings = require('./models/UserSettings')

beforeEach(() => {
  jest.clearAllMocks()
})

// ─── POST /meals ──────────────────────────────────────────────────────────────

describe('POST /meals', () => {
  it('returns 201 with the created meal', async () => {
    const fakeMeal = { _id: 'abc', tag: 'CLEAN', occurredAt: 1700000000000 }
    Meal.create.mockResolvedValue(fakeMeal)

    const res = await request(app)
      .post('/meals')
      .set('x-user-id', 'user-test')
      .send({ tag: 'CLEAN', occurredAt: 1700000000000 })
      .expect(201)

    expect(res.body).toEqual({ meal: fakeMeal })
  })

  it('returns 400 when occurredAt is missing', async () => {
    const res = await request(app)
      .post('/meals')
      .set('x-user-id', 'user-test')
      .send({ tag: 'CLEAN' })
      .expect(400)

    expect(res.body).toEqual({ error: 'occurredAt is required' })
  })

  it('returns 400 when x-user-id header is missing', async () => {
    const res = await request(app)
      .post('/meals')
      .send({ tag: 'CLEAN', occurredAt: 1700000000000 })
      .expect(400)

    expect(res.body).toEqual({ error: 'x-user-id header is required' })
  })
})

// ─── GET /meals ───────────────────────────────────────────────────────────────

describe('GET /meals', () => {
  it('returns 200 with all meals when no date query param', async () => {
    const fakeMeals = [{ _id: '1' }, { _id: '2' }]
    Meal.find.mockReturnValue({ sort: jest.fn().mockResolvedValue(fakeMeals) })

    const res = await request(app).get('/meals').set('x-user-id', 'user-test').expect(200)

    expect(res.body).toEqual({ meals: fakeMeals })
  })

  it('returns 200 with filtered meals when date query param is given', async () => {
    const fakeMeals = [{ _id: '3' }]
    Meal.find.mockReturnValue({ sort: jest.fn().mockResolvedValue(fakeMeals) })

    const res = await request(app)
      .get('/meals')
      .set('x-user-id', 'user-test')
      .query({ date: '2024-06-15' })
      .expect(200)

    expect(res.body).toEqual({ meals: fakeMeals })
  })

  it('returns 400 when the date format is invalid', async () => {
    const res = await request(app)
      .get('/meals')
      .set('x-user-id', 'user-test')
      .query({ date: 'not-a-date' })
      .expect(400)

    expect(res.body).toEqual({ error: 'date must be in YYYY-MM-DD format' })
  })

  it('returns 400 when x-user-id header is missing', async () => {
    const res = await request(app).get('/meals').expect(400)

    expect(res.body).toEqual({ error: 'x-user-id header is required' })
  })
})

// ─── PATCH /meals/:id ─────────────────────────────────────────────────────────

describe('PATCH /meals/:id', () => {
  it('returns 200 with the updated meal', async () => {
    const fakeMeal = { _id: 'abc', tag: 'INDULGENT', amountSpent: 200 }
    Meal.findOneAndUpdate.mockResolvedValue(fakeMeal)

    const res = await request(app)
      .patch('/meals/abc')
      .set('x-user-id', 'user-test')
      .send({ tag: 'INDULGENT', amountSpent: 200 })
      .expect(200)

    expect(res.body).toEqual({ meal: fakeMeal })
  })

  it('returns 404 when the meal does not exist', async () => {
    Meal.findOneAndUpdate.mockResolvedValue(null)

    const res = await request(app)
      .patch('/meals/nonexistent')
      .set('x-user-id', 'user-test')
      .send({ tag: 'CLEAN' })
      .expect(404)

    expect(res.body).toEqual({ error: 'Meal not found' })
  })

  it('returns 400 when x-user-id header is missing', async () => {
    const res = await request(app).patch('/meals/abc').send({ tag: 'CLEAN' }).expect(400)

    expect(res.body).toEqual({ error: 'x-user-id header is required' })
  })
})

// ─── DELETE /meals/:id ────────────────────────────────────────────────────────

describe('DELETE /meals/:id', () => {
  it('returns 200 with { success: true }', async () => {
    Meal.findOneAndDelete.mockResolvedValue({ _id: 'abc' })

    const res = await request(app).delete('/meals/abc').set('x-user-id', 'user-test').expect(200)

    expect(res.body).toEqual({ success: true })
  })

  it('returns 404 when the meal does not exist', async () => {
    Meal.findOneAndDelete.mockResolvedValue(null)

    const res = await request(app)
      .delete('/meals/nonexistent')
      .set('x-user-id', 'user-test')
      .expect(404)

    expect(res.body).toEqual({ error: 'Meal not found' })
  })

  it('returns 400 when x-user-id header is missing', async () => {
    const res = await request(app).delete('/meals/abc').expect(400)

    expect(res.body).toEqual({ error: 'x-user-id header is required' })
  })
})

// ─── GET /settings ────────────────────────────────────────────────────────────

describe('GET /settings', () => {
  it('returns 200 with settings when a record exists', async () => {
    const fakeSettings = { userId: 'user-test', monthlyIndulgentLimit: 7 }
    UserSettings.findOne.mockResolvedValue(fakeSettings)

    const res = await request(app).get('/settings').set('x-user-id', 'user-test').expect(200)

    expect(res.body).toEqual({ settings: fakeSettings })
  })

  it('returns 200 with null when no settings have been saved yet', async () => {
    UserSettings.findOne.mockResolvedValue(null)

    const res = await request(app).get('/settings').set('x-user-id', 'user-test').expect(200)

    expect(res.body).toEqual({ settings: null })
  })

  it('returns 400 when x-user-id header is missing', async () => {
    const res = await request(app).get('/settings').expect(400)

    expect(res.body).toEqual({ error: 'x-user-id header is required' })
  })
})

// ─── PATCH /settings ──────────────────────────────────────────────────────────

describe('PATCH /settings', () => {
  it('returns 200 with the upserted settings', async () => {
    const fakeSettings = {
      userId: 'user-test',
      monthlyIndulgentLimit: 7,
      goalUpdatedAt: 1700000000000,
    }
    UserSettings.findOne.mockResolvedValue(null)
    UserSettings.findOneAndUpdate.mockResolvedValue(fakeSettings)

    const res = await request(app)
      .patch('/settings')
      .set('x-user-id', 'user-test')
      .send({ monthlyIndulgentLimit: 7 })
      .expect(200)

    expect(res.body).toEqual({ settings: fakeSettings })
  })

  it('stores the old goal as previousGoal when the goal changes', async () => {
    const existing = { userId: 'user-test', monthlyIndulgentLimit: 5 }
    const updated = { userId: 'user-test', monthlyIndulgentLimit: 10, previousGoal: 5 }
    UserSettings.findOne.mockResolvedValue(existing)
    UserSettings.findOneAndUpdate.mockResolvedValue(updated)

    const res = await request(app)
      .patch('/settings')
      .set('x-user-id', 'user-test')
      .send({ monthlyIndulgentLimit: 10 })
      .expect(200)

    expect(res.body).toEqual({ settings: updated })
    const setArg = UserSettings.findOneAndUpdate.mock.calls[0][1].$set
    expect(setArg).toMatchObject({ previousGoal: 5, monthlyIndulgentLimit: 10 })
  })

  it('does not set previousGoal when the goal is unchanged', async () => {
    const existing = { userId: 'user-test', monthlyIndulgentLimit: 7 }
    UserSettings.findOne.mockResolvedValue(existing)
    UserSettings.findOneAndUpdate.mockResolvedValue(existing)

    await request(app)
      .patch('/settings')
      .set('x-user-id', 'user-test')
      .send({ monthlyIndulgentLimit: 7 })
      .expect(200)

    const setArg = UserSettings.findOneAndUpdate.mock.calls[0][1].$set
    expect(setArg).not.toHaveProperty('previousGoal')
  })

  it('returns 400 when x-user-id header is missing', async () => {
    const res = await request(app).patch('/settings').send({ monthlyIndulgentLimit: 7 }).expect(400)

    expect(res.body).toEqual({ error: 'x-user-id header is required' })
  })
})
