import { NavLink, Outlet } from 'react-router-dom'
import { supabase } from '../lib/supabase'
const links: [string, string][] = [['/', 'Panel'], ['/clientes', 'Clientes'], ['/servicios', 'Servicios'], ['/soporte', 'Soporte'], ['/agenda', 'Agenda'], ['/cobros', 'Cobros'], ['/sistemas', 'Sistemas'], ['/regulatorio', 'Regulatorio'], ['/horas', 'Horas'], ['/reportes', 'Reportes'], ['/configuracion', 'Config.']]
export default function Layout() {
  return (
    <div className="app">
      <nav>
        <h1>CambioDesk</h1>
        {links.map(([to, t]) => <NavLink key={to} to={to} end={to === '/'}>{t}</NavLink>)}
        <button onClick={() => supabase.auth.signOut()}>Cerrar sesión</button>
      </nav>
      <main><Outlet /></main>
    </div>
  )
}
