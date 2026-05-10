import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Camera from './pages/Camera.jsx'
import TagMeal from './pages/TagMeal.jsx'
import Calendar from './pages/Calendar.jsx'
import DayDetail from './pages/DayDetail.jsx'

function Layout({ children }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto flex h-screen w-full max-w-[480px] flex-col px-4 py-4">
        <header className="mb-4 rounded-3xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
          <div className="text-lg font-semibold text-slate-900">MealSnap</div>
          <p className="mt-1 text-sm text-slate-500">Temporary layout wrapper</p>
        </header>

        <main className="flex-1 overflow-y-auto pb-24">{children}</main>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/camera" element={<Camera />} />
          <Route path="/tag" element={<TagMeal />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/day/:date" element={<DayDetail />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}
