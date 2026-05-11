import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { MealProvider } from './context/MealProvider'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MealProvider>
      <App />
    </MealProvider>
  </StrictMode>
)
