import { FormEvent, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Client } from '../types'
export default function Clients() {
  const [list, setList] = useState<Client[]>([]); const [name, setName] = useState(''); const [contact, setContact] = useState(''); const [phone, setPhone] = useState(''); const [err, setErr] = useState('')
  const load = () => supabase.from('clients').select('*').order('name').then(r => setList((r.data as Client[]) ?? []))
  useEffect(() => { load() }, [])
  async function add(e: FormEvent) {
    e.preventDefault(); setErr('')
    const { error } = await supabase.from('clients').insert({ name, contact_name: contact || null, phone: phone || null })
    if (error) return setErr('No se pudo guardar: ' + error.message)
    setName(''); setContact(''); setPhone(''); load()
  }
  async function toggle(c: Client) {
    await supabase.from('clients').update({ status: c.status === 'activo' ? 'inactivo' : 'activo' }).eq('id', c.id); load()
  }
  return (
    <div>
      <h2>Clientes</h2>
      <form className="card" onSubmit={add}>
        <input placeholder="Nombre de la casa de cambio *" value={name} onChange={e => setName(e.target.value)} required />
        <input placeholder="Contacto" value={contact} onChange={e => setContact(e.target.value)} />
        <input placeholder="Teléfono" value={phone} onChange={e => setPhone(e.target.value)} />
        <button className="btn">Agregar cliente</button>{err && <p className="bad">{err}</p>}
      </form>
      <div className="card">
        {list.map(c => <div className="row" key={c.id}><div>{c.name}<small>{c.contact_name} {c.phone}</small></div>
          <button className={'tag ' + (c.status === 'activo' ? 'g' : 'r')} onClick={() => toggle(c)}>{c.status}</button></div>)}
        {!list.length && <p>Aún no hay clientes.</p>}
      </div>
    </div>
  )
}
