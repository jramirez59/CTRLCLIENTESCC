import { FormEvent, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase, configOk } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
export default function Login() {
  const { session } = useAuth()
  const [email, setEmail] = useState(''); const [pass, setPass] = useState(''); const [err, setErr] = useState('')
  if (session) return <Navigate to="/" replace />
  async function go(e: FormEvent) {
    e.preventDefault(); setErr('')
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass })
    if (error) setErr('Correo o contraseña incorrectos.')
  }
  return (
    <form className="card login" onSubmit={go}>
      <h2>CambioDesk</h2>
      {!configOk && <p className="bad">Falta configurar el archivo .env (URL y clave de Supabase).</p>}
      <input type="email" placeholder="Correo" value={email} onChange={e => setEmail(e.target.value)} required />
      <input type="password" placeholder="Contraseña" value={pass} onChange={e => setPass(e.target.value)} required />
      {err && <p className="bad">{err}</p>}
      <button className="btn">Ingresar</button>
    </form>
  )
}
