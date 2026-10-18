import { FormEvent, useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
type Row = Record<string, any>
export type Field = { key: string; label: string; type?: 'text' | 'number' | 'date' | 'textarea' | 'checkbox' | 'select' | 'ref'; options?: string[]; ref?: { table: string; label: string }; required?: boolean; def?: any; main?: boolean; hide?: boolean }
type Props = { title: string; table: string; source?: string; fields: Field[]; order: string; extra?: { key: string; label: string }[] }
const today = () => new Date().toISOString().slice(0, 10)
export default function Crud({ title, table, source, fields, order, extra = [] }: Props) {
  const init = () => Object.fromEntries(fields.map(f => [f.key, f.def === 'today' ? today() : f.def ?? (f.type === 'checkbox' ? false : '')]))
  const [rows, setRows] = useState<Row[]>([]); const [opts, setOpts] = useState<Record<string, Row[]>>({})
  const [form, setForm] = useState<Row>(init()); const [open, setOpen] = useState(false); const [err, setErr] = useState('')
  const [editId, setEditId] = useState<string | null>(null); const [draft, setDraft] = useState<Row>({})
  const load = useCallback(async () => {
    const { data } = await supabase.from(source || table).select('*').order(order, { ascending: false })
    setRows(data ?? [])
  }, [source, table, order])
  useEffect(() => {
    load()
    fields.filter(f => f.type === 'ref').forEach(f => supabase.from(f.ref!.table).select('*').then(r => setOpts(o => ({ ...o, [f.key]: r.data ?? [] }))))
  }, [load]) // eslint-disable-line
  const payload = (v: Row) => { const p: Row = {}; fields.forEach(f => { const x = v[f.key]; p[f.key] = f.type === 'number' ? (x === '' || x == null ? null : Number(x)) : f.type === 'checkbox' ? !!x : x === '' ? null : x }); return p }
  async function add(e: FormEvent) {
    e.preventDefault(); setErr('')
    const { error } = await supabase.from(table).insert(payload(form))
    if (error) return setErr('No se pudo guardar: ' + error.message)
    setForm(init()); setOpen(false); load()
  }
  async function saveEdit() {
    setErr('')
    const missing = fields.find(f => f.required && (draft[f.key] === '' || draft[f.key] == null))
    if (missing) return setErr('Falta completar: ' + missing.label)
    const { error } = await supabase.from(table).update(payload(draft)).eq('id', editId!)
    if (error) return setErr('No se pudo grabar: ' + error.message)
    setEditId(null); load()
  }
  async function del(id: string) {
    if (!confirm('¿Eliminar este registro?')) return
    const { error } = await supabase.from(table).delete().eq('id', id)
    if (error) setErr('No se pudo eliminar: ' + error.message); else load()
  }
  const inp = (f: Field, v: any, on: (x: any) => void) =>
    f.type === 'textarea' ? <textarea value={v ?? ''} onChange={e => on(e.target.value)} />
      : f.type === 'checkbox' ? <input type="checkbox" checked={!!v} onChange={e => on(e.target.checked)} />
      : f.type === 'select' ? <select value={v ?? ''} onChange={e => on(e.target.value)}><option value="">—</option>{f.options!.map(o => <option key={o}>{o}</option>)}</select>
      : f.type === 'ref' ? <select value={v ?? ''} onChange={e => on(e.target.value)}><option value="">—</option>{(opts[f.key] ?? []).map(o => <option key={o.id} value={o.id}>{o[f.ref!.label]}</option>)}</select>
      : <input type={f.type ?? 'text'} step={f.type === 'number' ? '0.01' : undefined} value={v ?? ''} onChange={e => on(e.target.value)} />
  const val = (r: Row, f: Field) => f.type === 'ref' ? (opts[f.key]?.find(o => o.id === r[f.key])?.[f.ref!.label] ?? '') : f.type === 'checkbox' ? (r[f.key] ? 'Sí' : 'No') : (r[f.key] ?? '')
  const shown = fields.filter(f => !f.hide)
  const main = shown.find(f => f.main) ?? shown[0]
  return (
    <section className="block">
      <div className="head"><h3>{title}</h3><button className="btn" onClick={() => { setOpen(!open); setForm(init()) }}>{open ? 'Cerrar' : '+ Nuevo'}</button></div>
      {err && <p className="bad">{err}</p>}
      {open && <form className="card" onSubmit={add}>
        {fields.map(f => <label key={f.key}><span className="k">{f.label}{f.required ? ' *' : ''}</span>
          {f.type === 'textarea' || f.type === 'checkbox' || f.type === 'select' || f.type === 'ref' ? inp(f, form[f.key], x => setForm(p => ({ ...p, [f.key]: x }))) : <input type={f.type ?? 'text'} step={f.type === 'number' ? '0.01' : undefined} value={form[f.key] ?? ''} required={f.required} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} />}
        </label>)}
        <button className="btn">Guardar</button>
      </form>}
      <div className="card">
        {rows.map(r => editId === r.id
          ? <div className="editrow" key={r.id}>
            {fields.map(f => <label key={f.key}><span className="k">{f.label}{f.required ? ' *' : ''}</span>{inp(f, draft[f.key], x => setDraft(p => ({ ...p, [f.key]: x })))}</label>)}
            <div className="acts"><button className="btn" onClick={saveEdit}>Grabar</button><button className="tag a" onClick={() => setEditId(null)}>Cancelar</button></div>
          </div>
          : <div className="row" key={r.id}>
            <div>{val(r, main)}<small>{[...shown.filter(f => f !== main).map(f => [f.label, val(r, f)]), ...extra.map(x => [x.label, r[x.key]])].filter(([, v]) => v !== '' && v != null).map(([l, v]) => l + ': ' + v).join(' · ')}</small></div>
            <div className="acts"><button className="tag g" onClick={() => { setDraft(Object.fromEntries(fields.map(f => [f.key, r[f.key] ?? (f.type === 'checkbox' ? false : '')]))); setEditId(r.id); setErr('') }}>Actualizar</button><button className="tag r" onClick={() => del(r.id)}>Borrar</button></div>
          </div>)}
        {!rows.length && <p className="k">Sin registros.</p>}
      </div>
    </section>
  )
}
