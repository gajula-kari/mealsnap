import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { MealProvider } from './context/MealProvider'
import { SettingsProvider } from './context/SettingsProvider'
import { InstallProvider } from './context/InstallProvider'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MealProvider>
      <SettingsProvider>
        <InstallProvider>
          <App />
        </InstallProvider>
      </SettingsProvider>
    </MealProvider>
  </StrictMode>
)
