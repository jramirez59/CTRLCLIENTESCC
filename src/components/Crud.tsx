import { FormEvent, useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
type Row = Record<string, any>
export type Field = { key: string; label: string; type?: 'text' | 'number' | 'date' | 'textarea' | 'checkbox' | 'select' | 'ref'; options?: string[]; ref?: { table: string; label: string }; required?: boolean; def?: any; main?: boolean; hide?: boolean }
type Props = { title: string; table: string; source?: string; fields: Field[]; order: string; extra?: { key: string; label: string }[] }
const today = () => new Date().toISOString().slice(0, 10)
export default function Crud({ title, table, source, fields, order, extra = [] }: Props) {
  const init = () => Object.fromEntries(fields.map(f => [f.key, f.def === 'today' ? today() : f.def ?? (f.type === 'checkbox' ? false : '')]))
  const [rows, setRows] = useState<Row[]>([]); const [opts, setOpts] = useState<Record<string, Row[]>>({})
  const [form, setForm] = useState<Row>(init()); const [editId, setEditId] = useState<string | null>(null); const [err, setErr] = useState(''); const [open, setOpen] = useState(false)
  const load = useCallback(async () => {
    const { data } = await supabase.from(source || table).select('*').order(order, { ascending: false })
    setRows(data ?? [])
  }, [source, table, order])
  useEffect(() => {
    load()
    fields.filter(f => f.type === 'ref').forEach(f => supabase.from(f.ref!.table).select('*').then(r => setOpts(o => ({ ...o, [f.key]: r.data ?? [] }))))
  }, [load]) // eslint-disable-line
  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }))
  async function save(e: FormEvent) {
    e.preventDefault(); setErr('')
    const p: Row = {}
    fields.forEach(f => { const v = form[f.key]; p[f.key] = f.type === 'number' ? (v === '' ? null : Number(v)) : f.type === 'checkbox' ? !!v : v === '' ? null : v })
    const { error } = editId ? await supabase.from(table).update(p).eq('id', editId) : await supabase.from(table).insert(p)
    if (error) return setErr('No se pudo guardar: ' + error.message)
    setForm(init()); setEditId(null); setOpen(false); load()
  }
  async function del(id: string) {
    if (!confirm('¿Eliminar este registro?')) return
    const { error } = await supabase.from(table).delete().eq('id', id)
    if (error) setErr('No se pudo eliminar: ' + error.message); else load()
  }
  const val = (r: Row, f: Field) => f.type === 'ref' ? (opts[f.key]?.find(o => o.id === r[f.key])?.[f.ref!.label] ?? '') : f.type === 'checkbox' ? (r[f.key] ? 'Sí' : 'No') : (r[f.key] ?? '')
  const shown = fields.filter(f => !f.hide)
  const main = shown.find(f => f.main) ?? shown[0]
  return (
    <section className="block">
      <div className="head"><h3>{title}</h3><button className="btn" onClick={() => { setOpen(!open); setEditId(null); setForm(init()) }}>{open ? 'Cerrar' : '+ Nuevo'}</button></div>
      {err && <p className="bad">{err}</p>}
      {open && <form className="card" onSubmit={save}>
        {fields.map(f => <label key={f.key}><span className="k">{f.label}{f.required ? ' *' : ''}</span>
          {f.type === 'textarea' ? <textarea value={form[f.key] ?? ''} onChange={e => set(f.key, e.target.value)} required={f.required} />
            : f.type === 'checkbox' ? <input type="checkbox" checked={!!form[f.key]} onChange={e => set(f.key, e.target.checked)} />
            : f.type === 'select' ? <select value={form[f.key] ?? ''} onChange={e => set(f.key, e.target.value)} required={f.required}><option value="">—</option>{f.options!.map(o => <option key={o}>{o}</option>)}</select>
            : f.type === 'ref' ? <select value={form[f.key] ?? ''} onChange={e => set(f.key, e.target.value)} required={f.required}><option value="">—</option>{(opts[f.key] ?? []).map(o => <option key={o.id} value={o.id}>{o[f.ref!.label]}</option>)}</select>
            : <input type={f.type ?? 'text'} step={f.type === 'number' ? '0.01' : undefined} value={form[f.key] ?? ''} onChange={e => set(f.key, e.target.value)} required={f.required} />}
        </label>)}
        <button className="btn">{editId ? 'Guardar cambios' : 'Guardar'}</button>
      </form>}
      <div className="card">
        {rows.map(r => <div className="row" key={r.id}>
          <div>{val(r, main)}<small>{[...shown.filter(f => f !== main), ...extra.map(x => ({ key: x.key, label: x.label } as Field))].map(f => { const v = extra.some(x => x.key === f.key) ? r[f.key] : val(r, f); return v === '' || v == null ? '' : f.label + ': ' + v }).filter(Boolean).join(' · ')}</small></div>
          <div className="acts"><button className="tag g" onClick={() => { setForm({ ...init(), ...Object.fromEntries(fields.map(f => [f.key, r[f.key] ?? (f.type === 'checkbox' ? false : '')])) }); setEditId(r.id); setOpen(true) }}>Editar</button><button className="tag r" onClick={() => del(r.id)}>Borrar</button></div>
        </div>)}
        {!rows.length && <p className="k">Sin registros.</p>}
      </div>
    </section>
  )
}
