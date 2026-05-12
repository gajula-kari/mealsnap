const STORAGE_KEY = 'aaharya_device_id'

function generateUUID(): string {
  if (typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  // crypto.randomUUID() requires a secure context; fall back to getRandomValues()
  // which is available over plain HTTP on local network addresses.
  return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, (c) => {
    const n = Number(c)
    return (n ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (n / 4)))).toString(16)
  })
}

export function getDeviceId(): string {
  let id = localStorage.getItem(STORAGE_KEY)
  if (!id) {
    id = generateUUID()
    localStorage.setItem(STORAGE_KEY, id)
  }
  return id
}
