import { createContext } from 'react'

export interface InstallContextValue {
  canInstall: boolean
  dismissed: boolean
  readyToShow: boolean
  install: () => Promise<void>
  dismiss: () => void
}

export const InstallContext = createContext<InstallContextValue>({
  canInstall: false,
  dismissed: false,
  readyToShow: false,
  install: async () => {},
  dismiss: () => {},
})
