import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
type Bal = { client_name: string; description: string; currency: string; balance: number; due_on: string }
type Tk = { id: string; title: string; due_on: string | null }
type Rg = { id: string; period_label: string; due_on: string }
export default function Dashboard() {
  const [bills, setBills] = useState<Bal[]>([]); const [tasks, setTasks] = useState<Tk[]>([]); const [regs, setRegs] = useState<Rg[]>([]); const [rens, setRens] = useState<{ id: string; name: string; d: string }[]>([])
  const today = new Date().toISOString().slice(0, 10)
  const in7 = new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10)
  useEffect(() => {
    supabase.from('v_billing_balance').select('*').gt('balance', 0).lte('due_on', in7).order('due_on').then(r => setBills((r.data as Bal[]) ?? []))
    supabase.from('tasks').select('id,title,due_on').not('status', 'in', '(completada,cancelada)').lte('due_on', in7).order('due_on').then(r => setTasks((r.data as Tk[]) ?? []))
    supabase.from('compliance_records').select('id,period_label,due_on').in('status', ['pendiente', 'en_preparacion', 'requiere_correccion']).lte('due_on', in7).order('due_on').then(r => setRegs((r.data as Rg[]) ?? []))
    const in30 = new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10)
    supabase.from('client_services').select('id,name,renews_on,ends_on').eq('active', true).then(r => setRens(((r.data ?? []) as any[]).map(x => ({ id: x.id, name: x.name, d: x.renews_on || x.ends_on })).filter(x => x.d && x.d <= in30)))
  }, [in7])
  const tag = (d: string | null) => d && d < today ? <span className="tag r">Vencido</span> : <span className="tag a">Próximo</span>
  return (
    <div>
      <h2>Panel principal</h2>
      <div className="grid">
        <div className="card"><div className="k">Cobros vencidos o por vencer</div><div className="v">{bills.length}</div></div>
        <div className="card"><div className="k">Tareas atrasadas o próximas</div><div className="v">{tasks.length}</div></div>
        <div className="card"><div className="k">Obligaciones próximas</div><div className="v">{regs.length}</div></div>
      </div>
      <div className="card"><b>Requiere atención (próximos 7 días)</b>
        {bills.map((b, i) => <div className="row" key={'b' + i}><div>Cobro: {b.description}<small>{b.client_name} · {b.balance} {b.currency} · vence {b.due_on}</small></div>{tag(b.due_on)}</div>)}
        {tasks.map(t => <div className="row" key={t.id}><div>Tarea: {t.title}<small>vence {t.due_on}</small></div>{tag(t.due_on)}</div>)}
        {regs.map(r => <div className="row" key={r.id}><div>Obligación: {r.period_label}<small>vence {r.due_on}</small></div>{tag(r.due_on)}</div>)}
        {rens.map(r => <div className="row" key={r.id}><div>Renovación: {r.name}<small>vence {r.d}</small></div>{tag(r.d)}</div>)}
        {!rens.length && !bills.length && !tasks.length && !regs.length && <p>Todo al día.</p>}
      </div>
    </div>
  )
}
