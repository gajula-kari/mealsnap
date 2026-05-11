// mealApi is the network boundary between the client and the server.
// Its jobs:
//   1. Call the correct URL with the correct method and body
//   2. Normalize the response (_id → id) so the rest of the app never sees _id
//   3. Throw a meaningful error when the server responds with !ok
//
// We mock global fetch — no real network needed.

import { fetchMeals, createMeal, updateMeal, deleteMeal } from './mealApi'

// Replace the global fetch with a vi.fn() before every test.
// vi.stubGlobal wires it up so that references to `fetch` inside mealApi.js
// hit this mock too (same global scope in jsdom).
beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn())
})

afterEach(() => {
  vi.unstubAllGlobals()
})

// Helper: build a fake fetch response. ok=true simulates a 2xx, ok=false simulates 4xx/5xx.
function mockFetch(body, ok = true) {
  fetch.mockResolvedValue({
    ok,
    json: vi.fn().mockResolvedValue(body),
  })
}

// ─── fetchMeals ───────────────────────────────────────────────────────────────

describe('fetchMeals', () => {
  it('calls GET /api/meals and returns normalized meals', async () => {
    mockFetch({ meals: [{ _id: 'abc', tag: 'HOME' }] })

    const result = await fetchMeals()

    // Verify the URL and that no extra options were passed (GET has no body).
    expect(fetch).toHaveBeenCalledWith('/api/meals', expect.objectContaining({}))

    // normalize() must copy _id into id — the client uses id everywhere.
    expect(result).toEqual([{ _id: 'abc', tag: 'HOME', id: 'abc' }])
  })

  it('throws with the server error message on non-ok response', async () => {
    mockFetch({ error: 'DB connection lost' }, false)

    await expect(fetchMeals()).rejects.toThrow('DB connection lost')
  })

  it('falls back to "Request failed" when server sends no error field', async () => {
    mockFetch({}, false)

    await expect(fetchMeals()).rejects.toThrow('Request failed')
  })
})

// ─── createMeal ───────────────────────────────────────────────────────────────

describe('createMeal', () => {
  it('POSTs to /api/meals with JSON body and returns the normalized meal', async () => {
    const payload = { tag: 'HOME', occurredAt: 1700000000000 }
    mockFetch({ meal: { _id: 'xyz', ...payload } })

    const result = await createMeal(payload)

    expect(fetch).toHaveBeenCalledWith(
      '/api/meals',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(payload),
        headers: { 'Content-Type': 'application/json' },
      })
    )
    // The returned meal must have id (from _id).
    expect(result).toMatchObject({ id: 'xyz', tag: 'HOME' })
  })
})

// ─── updateMeal ───────────────────────────────────────────────────────────────

describe('updateMeal', () => {
  it('PATCHes to /api/meals/:id with JSON body and returns the normalized meal', async () => {
    const payload = { tag: 'OUTSIDE', amountSpent: 250 }
    mockFetch({ meal: { _id: 'abc', ...payload } })

    const result = await updateMeal('abc', payload)

    expect(fetch).toHaveBeenCalledWith(
      '/api/meals/abc',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify(payload),
      })
    )
    expect(result).toMatchObject({ id: 'abc', tag: 'OUTSIDE' })
  })
})

// ─── deleteMeal ───────────────────────────────────────────────────────────────

describe('deleteMeal', () => {
  it('sends DELETE to /api/meals/:id', async () => {
    mockFetch({})

    await deleteMeal('abc')

    expect(fetch).toHaveBeenCalledWith(
      '/api/meals/abc',
      expect.objectContaining({ method: 'DELETE' })
    )
  })

  it('throws on non-ok response', async () => {
    mockFetch({ error: 'Meal not found' }, false)

    await expect(deleteMeal('abc')).rejects.toThrow('Meal not found')
  })
})
