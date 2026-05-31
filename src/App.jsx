import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import { ProtectedRoute } from './components/ProtectedRoute'
import ErrorBoundary from './components/ErrorBoundary'

// Páginas de auth — carga inmediata (pequeñas, necesarias sin login)
import LoginPage        from './pages/LoginPage'
import RegisterPage     from './pages/RegisterPage'
import ResetPasswordPage from './pages/ResetPasswordPage'

// Páginas principales — carga diferida (pesadas: Firebase, date-fns, IA)
const DashboardPage    = lazy(() => import('./pages/DashboardPage'))
const PlanificadorPage = lazy(() => import('./pages/PlanificadorPage'))
const ComprarCreditos  = lazy(() => import('./pages/ComprarCreditos'))
const AdminPage        = lazy(() => import('./pages/AdminPage'))
const PerfilPage       = lazy(() => import('./pages/PerfilPage'))

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="w-8 h-8 border-4 border-slate-200 dark:border-slate-800 border-t-primary-500 rounded-full animate-spin" />
    </div>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Rutas públicas */}
          <Route path="/login"          element={<LoginPage />} />
          <Route path="/register"       element={<RegisterPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* Rutas protegidas — todos los usuarios autenticados */}
          <Route element={<ProtectedRoute />}>
            <Route path="/"                  element={<DashboardPage />} />
            <Route path="/materia/:id"       element={<PlanificadorPage />} />
            <Route path="/comprar-creditos"  element={<ComprarCreditos />} />
            <Route path="/perfil"            element={<PerfilPage />} />
          </Route>

          {/* Rutas protegidas — solo admin */}
          <Route element={<ProtectedRoute requireAdmin />}>
            <Route path="/admin" element={<AdminPage />} />
          </Route>
        </Routes>
      </Suspense>
    </ErrorBoundary>
  )
}
