import { FormEvent, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { deriveKey, encrypt, decrypt, newSalt } from '../lib/crypto'
type Row = Record<string, any>
export default function Vault() {
  const [meta, setMeta] = useState<Row | null | undefined>(undefined); const [key, setKey] = useState<CryptoKey | null>(null)
  const [pass, setPass] = useState(''); const [err, setErr] = useState(''); const [rows, setRows] = useState<Row[]>([]); const [systems, setSystems] = useState<Row[]>([])
  const [f, setF] = useState({ system_id: '', username: '', external_ref: '', secret: '' }); const [shown, setShown] = useState<Record<string, string>>({}); const timer = useRef<number>()
  useEffect(() => { supabase.from('vault_meta').select('*').maybeSingle().then(r => setMeta(r.data ?? null)); return () => clearTimeout(timer.current) }, [])
  const load = () => {
    supabase.from('credentials').select('*, systems(name, clients(name))').order('updated_at', { ascending: false }).then(r => setRows(r.data ?? []))
    supabase.from('systems').select('id,name').then(r => setSystems(r.data ?? []))
  }
  async function unlock(e: FormEvent) {
    e.preventDefault(); setErr('')
    try {
      if (meta) {
        const k = await deriveKey(pass, meta.salt)
        if ((await decrypt(k, meta.verifier_cipher, meta.verifier_iv)) !== 'ok') throw new Error()
        setKey(k)
      } else {
        if (pass.length < 10) return setErr('Usa al menos 10 caracteres.')
        const salt = newSalt(); const k = await deriveKey(pass, salt); const v = await encrypt(k, 'ok')
        const { error } = await supabase.from('vault_meta').insert({ salt, verifier_cipher: v.c, verifier_iv: v.iv })
        if (error) return setErr('No se pudo crear la bóveda.')
        setMeta({ salt, verifier_cipher: v.c, verifier_iv: v.iv }); setKey(k)
      }
      setPass(''); load()
    } catch { setErr('Contraseña maestra incorrecta.') }
  }
  async function add(e: FormEvent) {
    e.preventDefault(); if (!key) return
    const sec = f.secret ? await encrypt(key, f.secret) : null
    const { error } = await supabase.from('credentials').insert({ system_id: f.system_id, username: f.username || null, external_ref: f.external_ref || null, secret_cipher: sec?.c ?? null, secret_iv: sec?.iv ?? null })
    if (error) return setErr('No se pudo guardar.')
    setF({ system_id: '', username: '', external_ref: '', secret: '' }); load()
  }
  async function reveal(r: Row) {
    if (!key || !r.secret_cipher) return
    try { const t = await decrypt(key, r.secret_cipher, r.secret_iv); setShown(s => ({ ...s, [r.id]: t })); setTimeout(() => setShown(s => { const n = { ...s }; delete n[r.id]; return n }), 15000) } catch { setErr('No se pudo descifrar.') }
  }
  async function del(id: string) { if (confirm('¿Eliminar esta credencial?')) { await supabase.from('credentials').delete().eq('id', id); load() } }
  if (meta === undefined) return null
  return (
    <section className="block"><h3>Bóveda de credenciales</h3>
      <div className="note">Las contraseñas se cifran en tu navegador con tu contraseña maestra; Supabase solo guarda texto cifrado. Si pierdes la contraseña maestra, esos secretos no se pueden recuperar. Para accesos críticos puedes guardar solo el usuario y la referencia a tu gestor externo.</div>
      {!key ? <form className="card" onSubmit={unlock}>
        <p>{meta ? 'Ingresa tu contraseña maestra para desbloquear.' : 'Crea tu contraseña maestra (mínimo 10 caracteres).'}</p>
        <input type="password" placeholder="Contraseña maestra" value={pass} onChange={e => setPass(e.target.value)} required />
        {err && <p className="bad">{err}</p>}<button className="btn">{meta ? 'Desbloquear' : 'Crear bóveda'}</button></form>
        : <>
          <form className="card" onSubmit={add}>
            <select value={f.system_id} onChange={e => setF({ ...f, system_id: e.target.value })} required><option value="">Sistema…</option>{systems.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
            <input placeholder="Usuario" value={f.username} onChange={e => setF({ ...f, username: e.target.value })} />
            <input placeholder="Referencia al gestor externo (opcional)" value={f.external_ref} onChange={e => setF({ ...f, external_ref: e.target.value })} />
            <input type="password" autoComplete="new-password" placeholder="Contraseña (opcional, se cifra)" value={f.secret} onChange={e => setF({ ...f, secret: e.target.value })} />
            <button className="btn">Guardar credencial</button>{err && <p className="bad">{err}</p>}</form>
          <div className="card">{rows.map(r => <div className="row" key={r.id}>
            <div>{r.systems?.name}<small>{r.systems?.clients?.name} · {r.username} {r.external_ref ? '· ref: ' + r.external_ref : ''}</small>{shown[r.id] && <code>{shown[r.id]}</code>}</div>
            <div className="acts">{r.secret_cipher && <button className="tag g" onClick={() => reveal(r)}>Ver</button>}<button className="tag r" onClick={() => del(r.id)}>Borrar</button></div></div>)}
            {!rows.length && <p className="k">Sin credenciales.</p>}</div>
          <button className="tag a" onClick={() => { setKey(null); setShown({}) }}>Bloquear bóveda</button></>}
    </section>
  )
}
