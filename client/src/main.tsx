import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { MealProvider } from './context/MealProvider'
import { SettingsProvider } from './context/SettingsProvider'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MealProvider>
      <SettingsProvider>
        <App />
      </SettingsProvider>
    </MealProvider>
  </StrictMode>
)
