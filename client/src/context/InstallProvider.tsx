import { useState, useEffect, useRef, type ReactNode } from 'react'
import { InstallContext } from './InstallContext'
import { logEvent } from '../services/eventsApi'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISSED_KEY = 'aaharya_install_dismissed'
const VISIT_COUNT_KEY = 'aaharya_visit_count'
const SESSION_KEY = 'aaharya_session_counted'
const BANNER_ANIMATED_KEY = 'aaharya_install_banner_animated'
const VISIT_THRESHOLD = 3
const WAS_INSTALLED_KEY = 'aaharya_was_installed'

function resetInstallFlow() {
  localStorage.removeItem(DISMISSED_KEY)
  localStorage.removeItem(VISIT_COUNT_KEY)
  localStorage.removeItem(BANNER_ANIMATED_KEY)
  sessionStorage.removeItem(SESSION_KEY)
  localStorage.removeItem(WAS_INSTALLED_KEY)
}

export function InstallProvider({ children }: { children: ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [dismissed, setDismissed] = useState(() => !!localStorage.getItem(DISMISSED_KEY))
  const [visitCount] = useState(() => {
    if (!sessionStorage.getItem(SESSION_KEY)) {
      sessionStorage.setItem(SESSION_KEY, 'true')
      const next = parseInt(localStorage.getItem(VISIT_COUNT_KEY) ?? '0', 10) + 1
      localStorage.setItem(VISIT_COUNT_KEY, String(next))
      return next
    }
    return parseInt(localStorage.getItem(VISIT_COUNT_KEY) ?? '0', 10)
  })
  const [isInstalled, setIsInstalled] = useState(
    () =>
      window.matchMedia('(display-mode: standalone)').matches ||
      !!(navigator as { standalone?: boolean }).standalone
  )

  const wasStandaloneOnMount = useRef(isInstalled)
  useEffect(() => {
    if (wasStandaloneOnMount.current) logEvent('standalone_visit')
  }, [])

  useEffect(() => {
    if (isInstalled) return
    const handler = (e: Event) => {
      e.preventDefault()
      if (localStorage.getItem(WAS_INSTALLED_KEY) === 'true') {
        resetInstallFlow()
        setDismissed(false)
      }
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)
    const mq = window.matchMedia('(display-mode: standalone)')
    const mqHandler = (e: MediaQueryListEvent) => {
      if (e.matches) setIsInstalled(true)
    }
    mq.addEventListener('change', mqHandler)
    const installedHandler = () => {
      localStorage.setItem(WAS_INSTALLED_KEY, 'true')
      logEvent('app_installed')
      setIsInstalled(true)
    }
    window.addEventListener('appinstalled', installedHandler)
    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      mq.removeEventListener('change', mqHandler)
      window.removeEventListener('appinstalled', installedHandler)
    }
  }, [isInstalled])

  async function install() {
    if (!deferredPrompt) return
    logEvent('install_clicked')
    deferredPrompt.prompt()
    await deferredPrompt.userChoice
    setDeferredPrompt(null)
  }

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, 'true')
    setDismissed(true)
  }

  return (
    <InstallContext.Provider
      value={{
        canInstall: !!deferredPrompt && !isInstalled,
        dismissed,
        readyToShow: visitCount >= VISIT_THRESHOLD,
        install,
        dismiss,
      }}
    >
      {children}
    </InstallContext.Provider>
  )
}
