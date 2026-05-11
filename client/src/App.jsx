import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home.jsx'
import TagMeal from './pages/TagMeal.jsx'
import DayDetail from './pages/DayDetail.jsx'

function Layout({ children }) {
  return (
    <div className="h-screen overflow-hidden bg-slate-50 text-slate-900">
      <div className="mx-auto flex h-full w-full max-w-[480px] flex-col px-4 py-4">
        <header className="mb-4 rounded-3xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
          <div className="text-lg font-semibold text-slate-900">MealSnap</div>
          <p className="text-xs text-slate-400 tracking-wide">Snap. Tag. Stay consistent.</p>
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
          <Route path="/tag" element={<TagMeal />} />
          <Route path="/day/:date" element={<DayDetail />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}
