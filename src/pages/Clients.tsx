import { FormEvent, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Client } from '../types'
const cols: [keyof Client, string][] = [['name', 'Nombre *'], ['tax_id', 'NIT / ID fiscal'], ['contact_name', 'Contacto'], ['phone', 'Teléfono'], ['email', 'Correo']]
export default function Clients() {
  const [list, setList] = useState<Client[]>([]); const [form, setForm] = useState<Record<string, string>>({}); const [err, setErr] = useState('')
  const [editId, setEditId] = useState<string | null>(null); const [draft, setDraft] = useState<Record<string, string>>({})
  const load = () => supabase.from('clients').select('*').order('name').then(r => setList((r.data as Client[]) ?? []))
  useEffect(() => { load() }, [])
  const clean = (v: Record<string, string>) => Object.fromEntries(cols.map(([k]) => [k, (v[k] ?? '').trim() || null]))
  async function add(e: FormEvent) {
    e.preventDefault(); setErr('')
    const { error } = await supabase.from('clients').insert(clean(form))
    if (error) return setErr('No se pudo guardar: ' + error.message)
    setForm({}); load()
  }
  async function saveEdit() {
    setErr('')
    if (!(draft.name ?? '').trim()) return setErr('El nombre es obligatorio.')
    const { error } = await supabase.from('clients').update(clean(draft)).eq('id', editId!)
    if (error) return setErr('No se pudo grabar: ' + error.message)
    setEditId(null); load()
  }
  async function toggle(c: Client) { await supabase.from('clients').update({ status: c.status === 'activo' ? 'inactivo' : 'activo' }).eq('id', c.id); load() }
  return (
    <div>
      <h2>Clientes</h2>
      <form className="card" onSubmit={add}>
        {cols.map(([k, l]) => <input key={k} placeholder={l} value={form[k] ?? ''} onChange={e => setForm({ ...form, [k]: e.target.value })} required={k === 'name'} />)}
        <button className="btn">Agregar cliente</button>
      </form>
      {err && <p className="bad">{err}</p>}
      <div className="card">
        {list.map(c => editId === c.id
          ? <div className="editrow" key={c.id}>
            {cols.map(([k, l]) => <label key={k}><span className="k">{l}</span><input value={draft[k] ?? ''} onChange={e => setDraft({ ...draft, [k]: e.target.value })} /></label>)}
            <div className="acts"><button className="btn" onClick={saveEdit}>Grabar</button><button className="tag a" onClick={() => setEditId(null)}>Cancelar</button></div>
          </div>
          : <div className="row" key={c.id}>
            <div>{c.name}<small>{[c.tax_id, c.contact_name, c.phone, c.email].filter(Boolean).join(' · ')}</small></div>
            <div className="acts">
              <button className={'tag ' + (c.status === 'activo' ? 'g' : 'r')} onClick={() => toggle(c)}>{c.status}</button>
              <button className="tag g" onClick={() => { setDraft(Object.fromEntries(cols.map(([k]) => [k, (c[k] as string) ?? '']))); setEditId(c.id); setErr('') }}>Actualizar</button>
            </div>
          </div>)}
        {!list.length && <p className="k">Aún no hay clientes.</p>}
      </div>
    </div>
  )
}
