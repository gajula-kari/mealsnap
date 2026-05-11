import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { MealProvider } from './context/MealProvider.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <MealProvider>
      <App />
    </MealProvider>
  </StrictMode>,
)
