vi.mock('../utils/deviceId', () => ({ getDeviceId: () => 'test-device-id' }))

import { fetchMeals, createMeal, updateMeal, deleteMeal } from './mealApi'

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn())
})

afterEach(() => {
  vi.unstubAllGlobals()
})

function mockFetch(body: unknown, ok = true) {
  vi.mocked(fetch).mockResolvedValue({
    ok,
    json: vi.fn().mockResolvedValue(body),
  } as unknown as Response)
}

describe('fetchMeals', () => {
  it('calls GET /meals and returns normalized meals', async () => {
    mockFetch({ meals: [{ _id: 'abc', tag: 'CLEAN' }] })

    const result = await fetchMeals()

    expect(fetch).toHaveBeenCalledWith('/meals', expect.objectContaining({}))
    expect(result).toEqual([{ _id: 'abc', tag: 'CLEAN', id: 'abc' }])
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

describe('createMeal', () => {
  it('POSTs to /api/meals with JSON body and returns the normalized meal', async () => {
    const payload = { tag: 'CLEAN' as const, occurredAt: 1700000000000, imageUrl: 'data:img' }
    mockFetch({ meal: { _id: 'xyz', ...payload } })

    const result = await createMeal(payload)

    expect(fetch).toHaveBeenCalledWith(
      '/meals',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(payload),
        headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
      })
    )
    expect(result).toMatchObject({ id: 'xyz', tag: 'CLEAN' })
  })
})

describe('updateMeal', () => {
  it('PATCHes to /api/meals/:id with JSON body and returns the normalized meal', async () => {
    const payload = { tag: 'INDULGENT' as const, amountSpent: 250 }
    mockFetch({ meal: { _id: 'abc', occurredAt: 0, ...payload } })

    const result = await updateMeal('abc', payload)

    expect(fetch).toHaveBeenCalledWith(
      '/meals/abc',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify(payload),
        headers: expect.objectContaining({ 'x-user-id': 'test-device-id' }),
      })
    )
    expect(result).toMatchObject({ id: 'abc', tag: 'INDULGENT' })
  })
})

describe('deleteMeal', () => {
  it('sends DELETE to /api/meals/:id', async () => {
    mockFetch({})

    await deleteMeal('abc')

    expect(fetch).toHaveBeenCalledWith('/meals/abc', expect.objectContaining({ method: 'DELETE' }))
  })

  it('throws on non-ok response', async () => {
    mockFetch({ error: 'Meal not found' }, false)

    await expect(deleteMeal('abc')).rejects.toThrow('Meal not found')
  })
})
