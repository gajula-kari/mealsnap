import { renderHook } from '@testing-library/react'
import { useInstallContext } from './useInstallContext'

it('returns the install context default value and default handlers are callable', async () => {
  const { result } = renderHook(() => useInstallContext())
  expect(result.current.canInstall).toBe(false)
  expect(result.current.dismissed).toBe(false)
  await result.current.install()
  result.current.dismiss()
})
