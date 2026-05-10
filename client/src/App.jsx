import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Camera from './pages/Camera.jsx'
import TagMeal from './pages/TagMeal.jsx'
import Calendar from './pages/Calendar.jsx'
import DayDetail from './pages/DayDetail.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <nav className="border-b border-slate-200 bg-white px-4 py-4 shadow-sm">
          <div className="mx-auto flex flex-wrap items-center justify-center gap-3 max-w-5xl">
            <Link to="/" className="text-sm font-medium text-slate-700 hover:text-slate-900">
              Home
            </Link>
            <Link to="/camera" className="text-sm font-medium text-slate-700 hover:text-slate-900">
              Camera
            </Link>
            <Link to="/tag" className="text-sm font-medium text-slate-700 hover:text-slate-900">
              Tag Meal
            </Link>
            <Link to="/calendar" className="text-sm font-medium text-slate-700 hover:text-slate-900">
              Calendar
            </Link>
            <Link to="/day/2026-05-10" className="text-sm font-medium text-slate-700 hover:text-slate-900">
              Day Detail
            </Link>
          </div>
        </nav>

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/camera" element={<Camera />} />
          <Route path="/tag" element={<TagMeal />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/day/:date" element={<DayDetail />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}
