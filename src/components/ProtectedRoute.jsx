import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export const ProtectedRoute = ({ requireAdmin = false }) => {
  const { user, loading, esAdmin } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-slate-200 dark:border-slate-800 border-t-primary-500 rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-slate-500">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace state={{ from: location }} />
  if (requireAdmin && !esAdmin) return <Navigate to="/" replace />
  return <Outlet />
}
