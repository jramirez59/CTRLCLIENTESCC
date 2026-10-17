import { useEffect, useState, ReactNode } from 'react'
import { supabase } from '../lib/supabase'
type R = Record<string, any>
const sum = (a: R[], f: (x: R) => string, v: (x: R) => number) => { const o: Record<string, number> = {}; a.forEach(x => { o[f(x)] = (o[f(x)] ?? 0) + v(x) }); return o }
const B = ({ t, children }: { t: string; children: ReactNode }) => <section className="card"><b>{t}</b>{children}</section>
const L = ({ o }: { o: Record<string, number> }) => <>{Object.entries(o).sort().map(([k, v]) => <div className="row" key={k}><span>{k}</span><b>{Math.round(v * 100) / 100}</b></div>)}{!Object.keys(o).length && <p className="k">Sin datos.</p>}</>
export default function Reports() {
  const [d, setD] = useState<Record<string, R[]>>({})
  useEffect(() => {
    const q = (k: string, p: PromiseLike<{ data: any }>) => p.then(r => setD(s => ({ ...s, [k]: r.data ?? [] })))
    q('bill', supabase.from('v_billing_balance').select('*')); q('pay', supabase.from('payments').select('amount,paid_on,billing_items(currency,kind)'))
    q('time', supabase.from('time_entries').select('hours,billable,clients(name)')); q('tasks', supabase.from('tasks').select('status')); q('tk', supabase.from('support_tickets').select('status,clients(name)'))
    q('svc', supabase.from('client_services').select('name,renews_on,ends_on,clients(name)').eq('active', true)); q('reg', supabase.from('compliance_records').select('status'))
  }, [])
  const g = (k: string) => d[k] ?? []
  const today = Date.now(); const open = g('bill').filter(b => b.balance > 0)
  const age = (b: R) => { const n = Math.floor((today - new Date(b.due_on).getTime()) / 864e5); return (n <= 0 ? '0 Al día' : n <= 30 ? '1 Vencido 1-30 días' : n <= 60 ? '2 Vencido 31-60 días' : '3 Vencido +60 días') + ' · ' + b.currency }
  const soon = g('svc').map(s => ({ n: s.name + ' (' + (s.clients?.name ?? '') + ')', d: s.renews_on || s.ends_on })).filter(s => s.d).sort((a, b) => a.d.localeCompare(b.d))
  return (
    <div><h2>Reportes</h2>
      <B t="Cuentas por cobrar: saldo por antigüedad"><L o={sum(open, age, x => x.balance)} /></B>
      <B t="Saldo pendiente por cliente"><L o={sum(open, x => x.client_name + ' · ' + x.currency, x => x.balance)} /></B>
      <B t="Pagos registrados por mes y moneda"><L o={sum(g('pay'), x => x.paid_on.slice(0, 7) + ' · ' + (x.billing_items?.currency ?? ''), x => x.amount)} /></B>
      <B t="Ingresos cobrados por tipo de servicio"><L o={sum(g('pay'), x => (x.billing_items?.kind ?? '') + ' · ' + (x.billing_items?.currency ?? ''), x => x.amount)} /></B>
      <B t="Tareas por estado"><L o={sum(g('tasks'), x => x.status, () => 1)} /></B>
      <B t="Solicitudes de soporte por estado"><L o={sum(g('tk'), x => x.status, () => 1)} /></B>
      <B t="Solicitudes por cliente"><L o={sum(g('tk'), x => x.clients?.name ?? '', () => 1)} /></B>
      <B t="Horas por cliente"><L o={sum(g('time'), x => x.clients?.name ?? '', x => x.hours)} /></B>
      <B t="Horas facturables / no facturables"><L o={sum(g('time'), x => x.billable ? 'Facturables' : 'No facturables', x => x.hours)} /></B>
      <B t="Obligaciones regulatorias por estado"><L o={sum(g('reg'), x => x.status, () => 1)} /></B>
      <B t="Servicios y renovaciones próximos">{soon.slice(0, 15).map((s, i) => <div className="row" key={i}><span>{s.n}</span><b>{s.d}</b></div>)}{!soon.length && <p className="k">Sin datos.</p>}</B>
    </div>
  )
}
