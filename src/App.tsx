import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './routes/ProtectedRoute'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Clients from './pages/Clients'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import { Services, Support, Agenda, Billing, Systems, Regulatory, Hours } from './pages/modules'
export default function App() {
  return (
    <AuthProvider><BrowserRouter><Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute />}><Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="clientes" element={<Clients />} />
        <Route path="servicios" element={<Services />} />
        <Route path="soporte" element={<Support />} />
        <Route path="agenda" element={<Agenda />} />
        <Route path="cobros" element={<Billing />} />
        <Route path="sistemas" element={<Systems />} />
        <Route path="regulatorio" element={<Regulatory />} />
        <Route path="horas" element={<Hours />} />
        <Route path="reportes" element={<Reports />} />
        <Route path="configuracion" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route></Route>
    </Routes></BrowserRouter></AuthProvider>
  )
}
