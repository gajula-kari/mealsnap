import { type ReactNode } from 'react'
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import Home from './pages/Home'
import TagMeal from './pages/TagMeal'
import DayDetail from './pages/DayDetail'
import Settings from './pages/Settings'
import ErrorBoundary from './components/ErrorBoundary'

function Header() {
  const navigate = useNavigate()
  const location = useLocation()
  const isHome = location.pathname === '/'

  return (
    <header className="mb-4 rounded-3xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
      {isHome ? (
        <div className="flex items-center justify-between">
          <div>
            <div className="text-lg font-semibold text-slate-900">Aaharya</div>
            <p className="text-xs text-slate-400 tracking-wide">Indulge with intention.</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/settings')}
            className="rounded-2xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Settings"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-2xl p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Back"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
          </button>
          <div className="text-lg font-semibold text-slate-900">
            {location.pathname === '/settings' ? 'Settings' : 'Aaharya'}
          </div>
        </div>
      )}
    </header>
  )
}

function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="h-screen overflow-hidden bg-slate-50 text-slate-900">
      <div className="mx-auto flex h-full w-full max-w-[480px] flex-col px-4 py-4">
        <Header />
        <main className="flex-1 overflow-y-auto pb-24">
          <ErrorBoundary>{children}</ErrorBoundary>
        </main>
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
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}
