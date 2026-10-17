-- CambioDesk: pegar completo en Supabase > SQL Editor > Run (una sola vez)
create extension if not exists pgcrypto;

create table profiles(id uuid primary key references auth.users(id) on delete cascade, full_name text, role text not null default 'staff' check(role in('admin','staff')), created_at timestamptz default now());
create function is_admin() returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from profiles where id=auth.uid() and role='admin') $$;
create function handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$
begin insert into profiles(id,full_name,role) values(new.id,new.email, case when exists(select 1 from profiles) then 'staff' else 'admin' end); return new; end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function handle_new_user();

create table clients(id uuid primary key default gen_random_uuid(), name text not null, tax_id text, contact_name text, phone text, email text, status text not null default 'activo' check(status in('activo','inactivo')), notes text, created_at timestamptz default now());
create table client_services(id uuid primary key default gen_random_uuid(), client_id uuid not null references clients(id) on delete cascade, kind text not null check(kind in('soporte_mensual','desarrollo','extraordinario','licencia','regulatorio')), name text not null, price numeric(14,2) check(price>=0), currency text not null default 'USD' check(currency in('BOB','USD')), periodicity text check(periodicity in('mensual','trimestral','anual','unico')), starts_on date, ends_on date, renews_on date, active boolean default true, notes text);
create table support_tickets(id uuid primary key default gen_random_uuid(), client_id uuid not null references clients(id) on delete cascade, channel text not null check(channel in('whatsapp','correo','llamada')), description text not null, priority text not null default 'media' check(priority in('baja','media','alta','urgente')), status text not null default 'abierta' check(status in('abierta','en_curso','resuelta','cerrada')), received_at timestamptz default now(), resolved_at timestamptz, solution text);
create table tasks(id uuid primary key default gen_random_uuid(), client_id uuid not null references clients(id) on delete cascade, ticket_id uuid references support_tickets(id) on delete set null, title text not null, kind text not null default 'otro' check(kind in('incidente','mantenimiento','desarrollo','mejora','otro')), priority text not null default 'media' check(priority in('baja','media','alta','urgente')), status text not null default 'pendiente' check(status in('pendiente','en_curso','completada','cancelada')), starts_on date, due_on date, result text, created_at timestamptz default now());
create table task_updates(id uuid primary key default gen_random_uuid(), task_id uuid not null references tasks(id) on delete cascade, comment text not null, created_at timestamptz default now());
create table billing_items(id uuid primary key default gen_random_uuid(), client_id uuid not null references clients(id) on delete cascade, service_id uuid references client_services(id) on delete set null, kind text not null check(kind in('soporte_mensual','extraordinario','desarrollo','licencia')), description text not null, amount numeric(14,2) not null check(amount>0), currency text not null check(currency in('BOB','USD')), issued_on date not null default current_date, due_on date not null, notes text, created_at timestamptz default now());
create table payments(id uuid primary key default gen_random_uuid(), billing_item_id uuid not null references billing_items(id) on delete restrict, amount numeric(14,2) not null check(amount>0), paid_on date not null default current_date, reference text, notes text, created_at timestamptz default now());
create table systems(id uuid primary key default gen_random_uuid(), client_id uuid not null references clients(id) on delete cascade, name text not null, url text, provider text, kind text, contact text, notes text, updated_at timestamptz default now());
create table credentials(id uuid primary key default gen_random_uuid(), system_id uuid not null references systems(id) on delete cascade, username text, external_ref text, secret_cipher text, secret_iv text, updated_at timestamptz default now());
create table vault_meta(id int primary key default 1 check(id=1), salt text not null, verifier_cipher text not null, verifier_iv text not null);
create table regulatory_obligations(id uuid primary key default gen_random_uuid(), client_id uuid not null references clients(id) on delete cascade, system_id uuid references systems(id) on delete set null, institution text not null, name text not null, periodicity text check(periodicity in('mensual','trimestral','semestral','anual','unico')), notes text, active boolean default true);
create table compliance_records(id uuid primary key default gen_random_uuid(), obligation_id uuid not null references regulatory_obligations(id) on delete cascade, period_label text not null, due_on date not null, status text not null default 'pendiente' check(status in('pendiente','en_preparacion','presentada','requiere_correccion')), submitted_on date, receipt_ref text, notes text, unique(obligation_id,period_label));
create table time_entries(id uuid primary key default gen_random_uuid(), client_id uuid not null references clients(id) on delete cascade, task_id uuid references tasks(id) on delete set null, ticket_id uuid references support_tickets(id) on delete set null, worked_on date not null default current_date, hours numeric(6,2) not null check(hours>0), description text, billable boolean default true);
create table audit_log(id bigint generated always as identity primary key, user_id uuid default auth.uid(), action text not null, entity text, created_at timestamptz default now());

create index on client_services(client_id); create index on tasks(client_id,status,due_on); create index on billing_items(client_id,due_on); create index on payments(billing_item_id);
create index on compliance_records(due_on,status); create index on time_entries(client_id,worked_on); create index on support_tickets(client_id,status);

create view v_billing_balance with(security_invoker=true) as
select b.*, c.name client_name, coalesce(p.paid,0) paid, b.amount-coalesce(p.paid,0) balance,
 case when b.amount-coalesce(p.paid,0)<=0 then 'pagado' when b.due_on<current_date then 'vencido' when coalesce(p.paid,0)>0 then 'parcial' else 'pendiente' end status
from billing_items b join clients c on c.id=b.client_id
left join (select billing_item_id, sum(amount) paid from payments group by 1) p on p.billing_item_id=b.id;

do $$ declare t text; begin
 foreach t in array array['profiles','clients','client_services','support_tickets','tasks','task_updates','billing_items','payments','systems','credentials','vault_meta','regulatory_obligations','compliance_records','time_entries','audit_log'] loop
  execute format('alter table %I enable row level security',t);
  execute format('create policy admin_all on %I for all to authenticated using(is_admin()) with check(is_admin())',t);
 end loop; end $$;
create policy own_profile on profiles for select to authenticated using(id=auth.uid());
