import { useContext } from 'react'
import { InstallContext } from '../context/InstallContext'

export function useInstallContext() {
  return useContext(InstallContext)
}
