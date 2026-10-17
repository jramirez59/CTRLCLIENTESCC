import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
export default function ProtectedRoute() {
  const { session, isAdmin, loading } = useAuth()
  if (loading) return <p style={{ padding: 24 }}>Cargando…</p>
  if (!session) return <Navigate to="/login" replace />
  if (!isAdmin) return <p style={{ padding: 24 }}>Tu usuario no tiene permisos de administrador.</p>
  return <Outlet />
}
