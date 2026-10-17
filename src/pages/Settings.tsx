import { FormEvent, useCallback, useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { supabase, supabaseUrl, supabaseKey } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
type P = { id: string; full_name: string | null; role: string }
export default function Settings() {
  const { session } = useAuth(); const [users, setUsers] = useState<P[]>([]); const [email, setEmail] = useState(''); const [pass, setPass] = useState(''); const [admin, setAdmin] = useState(false); const [msg, setMsg] = useState('')
  const load = useCallback(() => { supabase.from('profiles').select('*').order('created_at').then(r => setUsers((r.data as P[]) ?? [])) }, [])
  useEffect(load, [load])
  async function create(e: FormEvent) {
    e.preventDefault(); setMsg('')
    const tmp = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } })
    const { data, error } = await tmp.auth.signUp({ email, password: pass })
    if (error || !data.user) return setMsg('No se pudo crear: ' + (error?.message ?? 'intenta de nuevo'))
    await supabase.from('profiles').update({ role: admin ? 'admin' : 'staff' }).eq('id', data.user.id)
    setEmail(''); setPass(''); setAdmin(false); setMsg('Usuario creado.'); load()
  }
  async function toggle(u: P) { await supabase.from('profiles').update({ role: u.role === 'admin' ? 'staff' : 'admin' }).eq('id', u.id); load() }
  return (
    <div><h2>Configuración</h2>
      <section className="block"><h3>Usuarios</h3>
        <form className="card" onSubmit={create}>
          <input type="email" placeholder="Correo del nuevo usuario" value={email} onChange={e => setEmail(e.target.value)} required />
          <input type="password" placeholder="Contraseña (mínimo 6)" minLength={6} value={pass} onChange={e => setPass(e.target.value)} required />
          <label><input type="checkbox" checked={admin} onChange={e => setAdmin(e.target.checked)} /> Administrador (acceso total)</label>
          <button className="btn">Crear usuario</button>{msg && <p>{msg}</p>}</form>
        <div className="card">{users.map(u => <div className="row" key={u.id}><div>{u.full_name}</div>
          <button className={'tag ' + (u.role === 'admin' ? 'g' : 'a')} disabled={u.id === session?.user.id} onClick={() => toggle(u)}>{u.role}</button></div>)}</div>
        <p className="k">En esta versión solo los administradores pueden entrar a los datos; los usuarios “staff” quedan sin acceso hasta que se defina su rol.</p>
      </section></div>
  )
}
