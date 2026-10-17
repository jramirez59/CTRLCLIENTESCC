import Crud, { Field } from '../components/Crud'
import Vault from './Vault'
const C: Field = { key: 'client_id', label: 'Cliente', type: 'ref', ref: { table: 'clients', label: 'name' }, required: true }
const PR = ['baja', 'media', 'alta', 'urgente']
const CUR: Field = { key: 'currency', label: 'Moneda', type: 'select', options: ['BOB', 'USD'], required: true, def: 'USD' }
const Page = ({ t, children }: { t: string; children: React.ReactNode }) => <div><h2>{t}</h2>{children}</div>
export const Services = () => <Page t="Servicios contratados"><Crud title="Servicios" table="client_services" order="name" fields={[C,
  { key: 'name', label: 'Nombre', required: true, main: true }, { key: 'kind', label: 'Tipo', type: 'select', options: ['soporte_mensual', 'desarrollo', 'extraordinario', 'licencia', 'regulatorio'], required: true },
  { key: 'price', label: 'Precio', type: 'number' }, CUR, { key: 'periodicity', label: 'Periodicidad', type: 'select', options: ['mensual', 'trimestral', 'anual', 'unico'] },
  { key: 'starts_on', label: 'Inicio', type: 'date' }, { key: 'ends_on', label: 'Fin', type: 'date' }, { key: 'renews_on', label: 'Renovación', type: 'date' },
  { key: 'active', label: 'Activo', type: 'checkbox', def: true }, { key: 'notes', label: 'Observaciones', type: 'textarea' }]} /></Page>
export const Support = () => <Page t="Soporte técnico"><Crud title="Solicitudes" table="support_tickets" order="received_at" fields={[C,
  { key: 'description', label: 'Descripción', type: 'textarea', required: true, main: true }, { key: 'channel', label: 'Canal', type: 'select', options: ['whatsapp', 'correo', 'llamada'], required: true },
  { key: 'priority', label: 'Prioridad', type: 'select', options: PR, def: 'media' }, { key: 'status', label: 'Estado', type: 'select', options: ['abierta', 'en_curso', 'resuelta', 'cerrada'], def: 'abierta' },
  { key: 'resolved_at', label: 'Resuelta el', type: 'date' }, { key: 'solution', label: 'Solución aplicada', type: 'textarea' }]} /></Page>
export const Agenda = () => <Page t="Agenda de tareas">
  <Crud title="Tareas" table="tasks" order="due_on" fields={[C, { key: 'title', label: 'Título', required: true, main: true },
    { key: 'kind', label: 'Tipo', type: 'select', options: ['incidente', 'mantenimiento', 'desarrollo', 'mejora', 'otro'], def: 'otro' }, { key: 'priority', label: 'Prioridad', type: 'select', options: PR, def: 'media' },
    { key: 'status', label: 'Estado', type: 'select', options: ['pendiente', 'en_curso', 'completada', 'cancelada'], def: 'pendiente' }, { key: 'starts_on', label: 'Inicio', type: 'date' }, { key: 'due_on', label: 'Vence', type: 'date' },
    { key: 'ticket_id', label: 'Solicitud relacionada', type: 'ref', ref: { table: 'support_tickets', label: 'description' } }, { key: 'result', label: 'Resultado', type: 'textarea' }]} />
  <Crud title="Comentarios y avances" table="task_updates" order="created_at" fields={[{ key: 'task_id', label: 'Tarea', type: 'ref', ref: { table: 'tasks', label: 'title' }, required: true }, { key: 'comment', label: 'Comentario', type: 'textarea', required: true, main: true }]} /></Page>
export const Billing = () => <Page t="Cuentas por cobrar">
  <Crud title="Cargos" table="billing_items" source="v_billing_balance" order="due_on" extra={[{ key: 'paid', label: 'Pagado' }, { key: 'balance', label: 'Saldo' }, { key: 'status', label: 'Estado' }]} fields={[C,
    { key: 'description', label: 'Concepto', required: true, main: true }, { key: 'kind', label: 'Tipo', type: 'select', options: ['soporte_mensual', 'extraordinario', 'desarrollo', 'licencia'], required: true },
    { key: 'amount', label: 'Importe', type: 'number', required: true }, { ...CUR, hide: false }, { key: 'issued_on', label: 'Emisión', type: 'date', def: 'today', required: true }, { key: 'due_on', label: 'Vence', type: 'date', required: true }, { key: 'notes', label: 'Observaciones', type: 'textarea' }]} />
  <Crud title="Pagos" table="payments" order="paid_on" fields={[{ key: 'billing_item_id', label: 'Cargo', type: 'ref', ref: { table: 'billing_items', label: 'description' }, required: true },
    { key: 'reference', label: 'Referencia', main: true }, { key: 'amount', label: 'Monto', type: 'number', required: true }, { key: 'paid_on', label: 'Fecha', type: 'date', def: 'today', required: true }, { key: 'notes', label: 'Notas', type: 'textarea' }]} /></Page>
export const Systems = () => <Page t="Sistemas y credenciales">
  <Crud title="Sistemas y plataformas" table="systems" order="updated_at" fields={[C, { key: 'name', label: 'Sistema', required: true, main: true }, { key: 'url', label: 'URL' }, { key: 'provider', label: 'Proveedor / institución' }, { key: 'kind', label: 'Tipo' }, { key: 'contact', label: 'Contacto' }, { key: 'notes', label: 'Observaciones', type: 'textarea' }]} />
  <Vault /></Page>
export const Regulatory = () => <Page t="Obligaciones regulatorias">
  <Crud title="Obligaciones" table="regulatory_obligations" order="name" fields={[C, { key: 'institution', label: 'Institución', required: true }, { key: 'name', label: 'Obligación', required: true, main: true },
    { key: 'periodicity', label: 'Periodicidad', type: 'select', options: ['mensual', 'trimestral', 'semestral', 'anual', 'unico'] }, { key: 'system_id', label: 'Plataforma', type: 'ref', ref: { table: 'systems', label: 'name' } }, { key: 'active', label: 'Activa', type: 'checkbox', def: true }, { key: 'notes', label: 'Observaciones', type: 'textarea' }]} />
  <Crud title="Presentaciones por período" table="compliance_records" order="due_on" fields={[{ key: 'obligation_id', label: 'Obligación', type: 'ref', ref: { table: 'regulatory_obligations', label: 'name' }, required: true },
    { key: 'period_label', label: 'Período (ej. 2026-09)', required: true, main: true }, { key: 'due_on', label: 'Fecha límite', type: 'date', required: true }, { key: 'status', label: 'Estado', type: 'select', options: ['pendiente', 'en_preparacion', 'presentada', 'requiere_correccion'], def: 'pendiente' },
    { key: 'submitted_on', label: 'Presentada el', type: 'date' }, { key: 'receipt_ref', label: 'Constancia / referencia' }, { key: 'notes', label: 'Notas', type: 'textarea' }]} /></Page>
export const Hours = () => <Page t="Registro de horas"><Crud title="Horas" table="time_entries" order="worked_on" fields={[C, { key: 'task_id', label: 'Tarea', type: 'ref', ref: { table: 'tasks', label: 'title' } },
  { key: 'worked_on', label: 'Fecha', type: 'date', def: 'today', required: true }, { key: 'hours', label: 'Horas', type: 'number', required: true }, { key: 'description', label: 'Descripción', main: true }, { key: 'billable', label: 'Facturable', type: 'checkbox', def: true }]} /></Page>
