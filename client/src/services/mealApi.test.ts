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
  it('POSTs to /meals as FormData and returns the normalized meal', async () => {
    const file = new File(['img'], 'photo.jpg', { type: 'image/jpeg' })
    const payload = { image: file, tag: 'CLEAN' as const, occurredAt: 1700000000000 }
    mockFetch({ meal: { _id: 'xyz', tag: 'CLEAN', occurredAt: 1700000000000, imageUrl: null } })

    const result = await createMeal(payload)

    const [url, options] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit]
    expect(url).toBe('/meals')
    expect(options.method).toBe('POST')
    expect(options.body).toBeInstanceOf(FormData)
    expect((options.headers as Record<string, string>)['x-user-id']).toBe('test-device-id')
    expect((options.headers as Record<string, string>)['Content-Type']).toBeUndefined()

    const form = options.body as FormData
    expect(form.get('tag')).toBe('CLEAN')
    expect(form.get('occurredAt')).toBe('1700000000000')
    expect(form.get('image')).toBe(file)
    expect(result).toMatchObject({ id: 'xyz', tag: 'CLEAN' })
  })

  it('appends note and amountSpent when provided', async () => {
    const file = new File(['img'], 'photo.jpg', { type: 'image/jpeg' })
    mockFetch({ meal: { _id: 'xyz', tag: 'INDULGENT', occurredAt: 0, imageUrl: null } })

    await createMeal({
      image: file,
      tag: 'INDULGENT',
      occurredAt: 0,
      note: 'Lunch',
      amountSpent: 350,
    })

    const form = (vi.mocked(fetch).mock.calls[0] as [string, RequestInit])[1].body as FormData
    expect(form.get('note')).toBe('Lunch')
    expect(form.get('amountSpent')).toBe('350')
  })

  it('throws "Request failed" when server sends no error field', async () => {
    const file = new File(['img'], 'photo.jpg', { type: 'image/jpeg' })
    mockFetch({}, false)

    await expect(createMeal({ image: file, tag: 'CLEAN', occurredAt: 0 })).rejects.toThrow(
      'Request failed'
    )
  })

  it('omits note and amountSpent when null', async () => {
    const file = new File(['img'], 'photo.jpg', { type: 'image/jpeg' })
    mockFetch({ meal: { _id: 'xyz', tag: 'CLEAN', occurredAt: 0, imageUrl: null } })

    await createMeal({ image: file, tag: 'CLEAN', occurredAt: 0, note: null, amountSpent: null })

    const form = (vi.mocked(fetch).mock.calls[0] as [string, RequestInit])[1].body as FormData
    expect(form.get('note')).toBeNull()
    expect(form.get('amountSpent')).toBeNull()
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
