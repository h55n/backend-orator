import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './hooks/useAuth'

import LandingPage     from './pages/LandingPage'
import LoginPage       from './pages/LoginPage'
import RegisterPage    from './pages/RegisterPage'
import DashboardPage   from './pages/DashboardPage'
import GeneratePage    from './pages/GeneratePage'
import HistoryPage     from './pages/HistoryPage'
import FavoritesPage   from './pages/FavoritesPage'
import SessionPage     from './pages/SessionPage'
import AppLayout       from './components/layout/AppLayout'

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh' }}>
      <div className="spinner spinner-lg" />
    </div>
  )
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

function GuestRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return null
  return !isAuthenticated ? children : <Navigate to="/dashboard" replace />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/"         element={<GuestRoute><LandingPage /></GuestRoute>} />
          <Route path="/login"    element={<GuestRoute><LoginPage /></GuestRoute>} />
          <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />

          {/* Protected */}
          <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route path="dashboard"         element={<DashboardPage />} />
            <Route path="generate"          element={<GeneratePage />} />
            <Route path="session/:id"       element={<SessionPage />} />
            <Route path="history"           element={<HistoryPage />} />
            <Route path="favorites"         element={<FavoritesPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>

      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 3500,
          style: {
            background: '#fff',
            color: '#111',
            borderRadius: '12px',
            border: '1px solid rgba(17,17,17,0.05)',
            boxShadow: '0 4px 12px rgba(17,17,17,0.08)',
            font: '400 14px/20px Inter, sans-serif',
          }
        }}
      />
    </AuthProvider>
  )
}
