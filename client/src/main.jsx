import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { MealProvider } from './context/MealContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <MealProvider>
      <App />
    </MealProvider>
  </StrictMode>,
)
