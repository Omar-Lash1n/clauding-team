-- ============================================================================
-- UrbanFix — Full Database Schema
-- Run ONCE in Supabase SQL Editor. Requires pgcrypto + postgis. pg_cron optional.
-- ============================================================================

-- Extensions -----------------------------------------------------------------
create extension if not exists pgcrypto;
create extension if not exists postgis;
-- create extension if not exists pg_cron;  -- uncomment if available on your plan

-- ============================================================================
-- ENUMS
-- ============================================================================
do $$ begin create type user_role as enum ('citizen','technician','district_manager','governor'); exception when duplicate_object then null; end $$;
do $$ begin create type specialty_type as enum ('plumber','electrician','road_maintenance','sanitation','general'); exception when duplicate_object then null; end $$;
do $$ begin create type priority_level as enum ('critical','high','medium','low','scheduled'); exception when duplicate_object then null; end $$;
do $$ begin create type report_status as enum ('submitted','approved','rejected','cancelled','assigned','in_progress','resolved','rated','disputed','archived'); exception when duplicate_object then null; end $$;
do $$ begin create type leave_status as enum ('pending','approved','rejected','cancelled','completed'); exception when duplicate_object then null; end $$;
do $$ begin create type dispute_resolution as enum ('assign_new','same_tech_again','dispute_rejected'); exception when duplicate_object then null; end $$;
do $$ begin create type cross_district_status as enum ('pending','approved','rejected','expired'); exception when duplicate_object then null; end $$;
do $$ begin create type escalation_type as enum ('pickup_missed','resolve_missed','critical_unassigned'); exception when duplicate_object then null; end $$;
do $$ begin create type notification_type as enum ('report_status_change','report_assigned','report_resolved','feedback_request','dispute_filed','escalation','leave_decision','cross_district_decision','new_task','generic'); exception when duplicate_object then null; end $$;
do $$ begin create type photo_type as enum ('before','after'); exception when duplicate_object then null; end $$;
do $$ begin create type gender_type as enum ('male','female'); exception when duplicate_object then null; end $$;

-- ============================================================================
-- TABLES
-- ============================================================================

-- Districts (seeded) ---------------------------------------------------------
create table if not exists public.districts (
  id uuid primary key default gen_random_uuid(),
  name_en text not null,
  name_ar text not null,
  center_lat double precision not null,
  center_lng double precision not null,
  bounding_radius_km numeric not null default 10,
  created_at timestamptz not null default now()
);

-- Profiles -------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role user_role not null,
  full_name text not null,
  full_name_ar text,
  email text not null unique,
  phone text,
  national_id varchar(14) unique,
  employee_id text unique,
  district_id uuid references public.districts(id),
  specialty specialty_type,
  is_on_leave boolean not null default false,
  substitute_for_user_id uuid references public.profiles(id),
  birth_date date,
  gender gender_type,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint citizen_needs_nid check (role <> 'citizen' or national_id is not null),
  constraint staff_needs_empid check (role = 'citizen' or employee_id is not null),
  constraint tech_needs_specialty check (role <> 'technician' or specialty is not null),
  constraint dm_or_tech_needs_district check (role not in ('district_manager','technician') or district_id is not null)
);

create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_profiles_district on public.profiles(district_id);
create index if not exists idx_profiles_specialty on public.profiles(specialty);
create index if not exists idx_profiles_on_leave on public.profiles(is_on_leave);

-- Categories (CRUD by Governor) ---------------------------------------------
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name_en text not null,
  name_ar text not null,
  icon_name text not null default 'AlertCircle',
  default_specialty specialty_type not null default 'general',
  default_priority priority_level not null default 'medium',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Reports (workflow core) ----------------------------------------------------
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id),
  district_id uuid not null references public.districts(id),
  category_id uuid not null references public.categories(id),
  priority priority_level not null default 'medium',
  status report_status not null default 'submitted',
  description text not null,
  address_description text,
  location_lat double precision not null,
  location_lng double precision not null,
  location_geog geography(point, 4326) generated always as (st_setsrid(st_makepoint(location_lng, location_lat), 4326)::geography) stored,
  assigned_technician_id uuid references public.profiles(id),
  approved_by uuid references public.profiles(id),
  rejected_reason text,
  resolved_cost numeric(10,2),
  is_public boolean not null default false,
  sla_pickup_deadline timestamptz,
  sla_resolve_deadline timestamptz,
  escalated_at timestamptz,
  submitted_at timestamptz not null default now(),
  approved_at timestamptz,
  assigned_at timestamptz,
  started_at timestamptz,
  resolved_at timestamptz,
  archived_at timestamptz,
  updated_at timestamptz not null default now()
);

create index if not exists idx_reports_status on public.reports(status);
create index if not exists idx_reports_district on public.reports(district_id);
create index if not exists idx_reports_category on public.reports(category_id);
create index if not exists idx_reports_reporter on public.reports(reporter_id);
create index if not exists idx_reports_tech on public.reports(assigned_technician_id);
create index if not exists idx_reports_priority on public.reports(priority);
create index if not exists idx_reports_public on public.reports(is_public) where is_public = true;
create index if not exists idx_reports_geog on public.reports using gist(location_geog);
create index if not exists idx_reports_sla_pickup on public.reports(sla_pickup_deadline) where status in ('approved','assigned');
create index if not exists idx_reports_sla_resolve on public.reports(sla_resolve_deadline) where status in ('assigned','in_progress');

-- Report photos (max 4 before + 1 after) -------------------------------------
create table if not exists public.report_photos (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports(id) on delete cascade,
  storage_path text not null,
  photo_type photo_type not null,
  uploaded_by uuid not null references public.profiles(id),
  uploaded_at timestamptz not null default now()
);
create index if not exists idx_photos_report on public.report_photos(report_id);

-- Feedback (1-to-1 per report) -----------------------------------------------
create table if not exists public.report_feedback (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null unique references public.reports(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);

-- Disputes -------------------------------------------------------------------
create table if not exists public.report_disputes (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports(id) on delete cascade,
  feedback_id uuid not null references public.report_feedback(id) on delete cascade,
  resolution dispute_resolution,
  new_technician_id uuid references public.profiles(id),
  resolved_by_dm uuid references public.profiles(id),
  dm_notes text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);
create index if not exists idx_disputes_report on public.report_disputes(report_id);
create index if not exists idx_disputes_unresolved on public.report_disputes(resolved_at) where resolved_at is null;

-- Leave requests -------------------------------------------------------------
create table if not exists public.leave_requests (
  id uuid primary key default gen_random_uuid(),
  technician_id uuid not null references public.profiles(id) on delete cascade,
  start_date date not null,
  end_date date not null,
  reason text not null,
  status leave_status not null default 'pending',
  substitute_id uuid references public.profiles(id),
  approved_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  constraint leave_dates_valid check (end_date >= start_date)
);
create index if not exists idx_leave_tech on public.leave_requests(technician_id);
create index if not exists idx_leave_status on public.leave_requests(status);

-- Cross-district requests (DM -> Governor) -----------------------------------
create table if not exists public.cross_district_requests (
  id uuid primary key default gen_random_uuid(),
  requesting_dm_id uuid not null references public.profiles(id) on delete cascade,
  target_district_id uuid not null references public.districts(id),
  reason text not null,
  status cross_district_status not null default 'pending',
  approved_by_governor uuid references public.profiles(id),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  decided_at timestamptz
);
create index if not exists idx_crossdist_dm on public.cross_district_requests(requesting_dm_id);
create index if not exists idx_crossdist_status on public.cross_district_requests(status);

-- Notifications (in-app, realtime) -------------------------------------------
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type notification_type not null,
  title_en text not null,
  title_ar text not null,
  body_en text,
  body_ar text,
  link_url text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_notif_user_unread on public.notifications(user_id, is_read, created_at desc);

-- Escalations audit ----------------------------------------------------------
create table if not exists public.escalations (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports(id) on delete cascade,
  escalation_type escalation_type not null,
  escalated_to_user_id uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  acknowledged_at timestamptz
);
create index if not exists idx_esc_report on public.escalations(report_id);
create index if not exists idx_esc_user on public.escalations(escalated_to_user_id);

-- Daily summaries (Governor 8AM briefing) ------------------------------------
create table if not exists public.daily_summaries (
  id uuid primary key default gen_random_uuid(),
  summary_date date not null unique,
  new_reports_count int not null default 0,
  resolved_count int not null default 0,
  top_delay_districts jsonb,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- TRIGGERS: updated_at, SLA deadlines, state-transition timestamps
-- ============================================================================

create or replace function public.tg_set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

drop trigger if exists trg_profiles_updated on public.profiles;
create trigger trg_profiles_updated before update on public.profiles
  for each row execute function public.tg_set_updated_at();

drop trigger if exists trg_categories_updated on public.categories;
create trigger trg_categories_updated before update on public.categories
  for each row execute function public.tg_set_updated_at();

drop trigger if exists trg_reports_updated on public.reports;
create trigger trg_reports_updated before update on public.reports
  for each row execute function public.tg_set_updated_at();

-- SLA deadlines + state timestamps -------------------------------------------
create or replace function public.tg_report_state_transitions()
returns trigger language plpgsql as $$
declare
  pickup_interval interval;
  resolve_interval interval;
begin
  -- SLA on approval
  if new.status = 'approved' and (old.status is distinct from 'approved') then
    new.approved_at = coalesce(new.approved_at, now());
    case new.priority
      when 'critical'  then pickup_interval := interval '30 minutes'; resolve_interval := interval '2 hours';
      when 'high'      then pickup_interval := interval '4 hours';    resolve_interval := interval '8 hours';
      when 'medium'    then pickup_interval := interval '24 hours';   resolve_interval := interval '48 hours';
      when 'low'       then pickup_interval := interval '3 days';     resolve_interval := interval '7 days';
      when 'scheduled' then pickup_interval := interval '7 days';     resolve_interval := interval '14 days';
    end case;
    new.sla_pickup_deadline  = now() + pickup_interval;
    new.sla_resolve_deadline = now() + resolve_interval;
  end if;

  if new.status = 'assigned'    and old.status is distinct from 'assigned'    then new.assigned_at = coalesce(new.assigned_at, now()); end if;
  if new.status = 'in_progress' and old.status is distinct from 'in_progress' then new.started_at  = coalesce(new.started_at,  now()); end if;
  if new.status = 'resolved'    and old.status is distinct from 'resolved'    then new.resolved_at = coalesce(new.resolved_at, now()); end if;
  if new.status = 'archived'    and old.status is distinct from 'archived'    then new.archived_at = coalesce(new.archived_at, now()); end if;

  return new;
end; $$;

drop trigger if exists trg_report_transitions on public.reports;
create trigger trg_report_transitions before update on public.reports
  for each row execute function public.tg_report_state_transitions();

-- Cross-district auto-expiry on approval (24h window) ------------------------
create or replace function public.tg_crossdist_approval()
returns trigger language plpgsql as $$
begin
  if new.status = 'approved' and old.status is distinct from 'approved' then
    new.expires_at = coalesce(new.expires_at, now() + interval '24 hours');
    new.decided_at = coalesce(new.decided_at, now());
  elsif new.status = 'rejected' and old.status is distinct from 'rejected' then
    new.decided_at = coalesce(new.decided_at, now());
  end if;
  return new;
end; $$;

drop trigger if exists trg_crossdist_approval on public.cross_district_requests;
create trigger trg_crossdist_approval before update on public.cross_district_requests
  for each row execute function public.tg_crossdist_approval();

-- ============================================================================
-- VIEWS
-- ============================================================================

-- Technician workload with priority weight -----------------------------------
create or replace view public.v_technician_workload as
select
  p.id as technician_id,
  p.full_name,
  p.full_name_ar,
  p.district_id,
  p.specialty,
  p.is_on_leave,
  coalesce(sum(case r.priority
    when 'critical' then 5
    when 'high' then 3
    when 'medium' then 2
    when 'low' then 1
    when 'scheduled' then 0.5
  end), 0)::numeric as workload_score,
  count(r.id) filter (where r.status in ('assigned','in_progress'))::int as active_tasks
from public.profiles p
left join public.reports r
  on r.assigned_technician_id = p.id
 and r.status in ('assigned','in_progress')
where p.role = 'technician'
group by p.id;

-- District stats -------------------------------------------------------------
create or replace view public.v_district_stats as
select
  d.id as district_id,
  d.name_en,
  d.name_ar,
  count(r.id) filter (where r.status = 'submitted')::int as submitted_count,
  count(r.id) filter (where r.status in ('approved','assigned','in_progress'))::int as active_count,
  count(r.id) filter (where r.status in ('resolved','rated','archived'))::int as completed_count,
  count(r.id) filter (where r.status = 'rejected')::int as rejected_count,
  avg(extract(epoch from (r.resolved_at - r.approved_at))/3600)
    filter (where r.resolved_at is not null and r.approved_at is not null)::numeric(10,2)
    as avg_resolution_hours,
  count(r.id) filter (where r.escalated_at is not null)::int as escalation_count,
  coalesce(sum(r.resolved_cost), 0)::numeric(12,2) as total_spent
from public.districts d
left join public.reports r on r.district_id = d.id
group by d.id;

-- Heatmap feed (active + recent) --------------------------------------------
create or replace view public.v_heatmap_points as
select
  r.id, r.district_id, r.location_lat, r.location_lng, r.status, r.priority,
  case r.priority
    when 'critical' then 5 when 'high' then 3 when 'medium' then 2 when 'low' then 1 when 'scheduled' then 0.5
  end as weight
from public.reports r
where r.status not in ('archived','rejected','cancelled');

-- ============================================================================
-- RPC: duplicate detection (50m + same category, Active = not yet assigned)
-- ============================================================================
create or replace function public.find_nearby_active_reports(
  p_lat double precision, p_lng double precision, p_category_id uuid, p_radius_meters int default 50
) returns table (
  id uuid, description text, status report_status, submitted_at timestamptz, distance_meters double precision
) language sql stable as $$
  select r.id, r.description, r.status, r.submitted_at,
         st_distance(r.location_geog, st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography) as distance_meters
  from public.reports r
  where r.category_id = p_category_id
    and r.status in ('submitted','approved')   -- "Active" = not yet handled by a technician
    and st_dwithin(r.location_geog, st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography, p_radius_meters)
  order by distance_meters asc
  limit 5;
$$;

-- ============================================================================
-- RPC: pick least-busy matching-specialty technician in a district
-- ============================================================================
create or replace function public.pick_least_busy_technician(
  p_district_id uuid, p_specialty specialty_type
) returns table (technician_id uuid, full_name text, workload_score numeric, active_tasks int) language sql stable as $$
  select w.technician_id, w.full_name, w.workload_score, w.active_tasks
  from public.v_technician_workload w
  where w.district_id = p_district_id
    and w.specialty   = p_specialty
    and w.is_on_leave = false
  order by w.workload_score asc, w.active_tasks asc
  limit 5;
$$;

-- ============================================================================
-- RPC: SLA escalation sweep (called by cron or Vercel Cron)
-- ============================================================================
create or replace function public.sla_escalation_sweep()
returns int language plpgsql security definer as $$
declare
  esc_count int := 0;
  r record;
  dm_id uuid;
  gov_id uuid;
begin
  select id into gov_id from public.profiles where role = 'governor' limit 1;

  for r in
    select * from public.reports
    where escalated_at is null
      and (
        (status = 'approved'   and sla_pickup_deadline  < now()) or
        (status in ('assigned','in_progress') and sla_resolve_deadline < now())
      )
  loop
    select p.id into dm_id from public.profiles p
    where p.role = 'district_manager' and p.district_id = r.district_id limit 1;

    if dm_id is not null then
      insert into public.escalations(report_id, escalation_type, escalated_to_user_id)
      values (r.id,
        case when r.status = 'approved' then 'pickup_missed'::escalation_type else 'resolve_missed'::escalation_type end,
        dm_id);
      insert into public.notifications(user_id, type, title_en, title_ar, body_en, body_ar, link_url)
      values (dm_id, 'escalation',
        'SLA breach on report', 'تجاوز SLA لبلاغ',
        'A report in your district has missed its SLA deadline.',
        'تجاوز أحد البلاغات في منطقتك الموعد النهائي.',
        '/manager/reports/' || r.id);
    end if;

    if gov_id is not null and r.priority in ('critical','high') and r.status in ('assigned','in_progress') then
      insert into public.notifications(user_id, type, title_en, title_ar, body_en, body_ar, link_url)
      values (gov_id, 'escalation',
        'Critical SLA breach', 'تجاوز حرج لـ SLA',
        'A critical/high priority report has breached its resolution SLA.',
        'تجاوز بلاغ بأولوية عالية/حرجة موعد الحل.',
        '/governor/situation-room?id=' || r.id);
    end if;

    update public.reports set escalated_at = now() where id = r.id;
    esc_count := esc_count + 1;
  end loop;

  return esc_count;
end; $$;

-- ============================================================================
-- RPC: archive resolved reports after 48h with no feedback
-- ============================================================================
create or replace function public.auto_archive_stale_resolved()
returns int language plpgsql security definer as $$
declare archived_count int := 0;
begin
  with cte as (
    update public.reports
       set status = 'archived'
     where status = 'resolved'
       and resolved_at < now() - interval '48 hours'
       and not exists (select 1 from public.report_feedback f where f.report_id = reports.id)
     returning 1
  ) select count(*) into archived_count from cte;
  return archived_count;
end; $$;

-- ============================================================================
-- RPC: auto-assign substitute when leave is approved
-- ============================================================================
create or replace function public.auto_assign_substitute(p_leave_id uuid)
returns uuid language plpgsql security definer as $$
declare
  v_tech public.profiles%rowtype;
  v_sub_id uuid;
  v_report record;
begin
  select p.* into v_tech
  from public.leave_requests l
  join public.profiles p on p.id = l.technician_id
  where l.id = p_leave_id;

  if v_tech.id is null then return null; end if;

  select w.technician_id into v_sub_id
  from public.v_technician_workload w
  where w.district_id = v_tech.district_id
    and w.specialty   = v_tech.specialty
    and w.is_on_leave = false
    and w.technician_id <> v_tech.id
  order by w.workload_score asc, w.active_tasks asc
  limit 1;

  if v_sub_id is null then return null; end if;

  update public.leave_requests set substitute_id = v_sub_id where id = p_leave_id;
  update public.profiles set is_on_leave = true where id = v_tech.id;
  update public.profiles set substitute_for_user_id = v_tech.id where id = v_sub_id;

  for v_report in
    select id from public.reports where assigned_technician_id = v_tech.id and status in ('assigned','in_progress')
  loop
    update public.reports set assigned_technician_id = v_sub_id where id = v_report.id;
    insert into public.notifications(user_id, type, title_en, title_ar, body_en, body_ar, link_url)
    values (v_sub_id, 'new_task',
      'Task reassigned to you (substitute)', 'تم إسناد مهمة إليك (بديل)',
      'You have been assigned a task while the primary technician is on leave.',
      'تم إسناد مهمة إليك أثناء إجازة الفني الأساسي.',
      '/technician/task/' || v_report.id);
  end loop;

  return v_sub_id;
end; $$;

-- ============================================================================
-- Storage policies for `reports` bucket
-- ============================================================================
-- Authenticated users can upload their own report photos
drop policy if exists "reports_bucket_insert" on storage.objects;
create policy "reports_bucket_insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'reports' and auth.uid() is not null);

drop policy if exists "reports_bucket_select" on storage.objects;
create policy "reports_bucket_select" on storage.objects for select to authenticated
  using (bucket_id = 'reports');

drop policy if exists "reports_bucket_update" on storage.objects;
create policy "reports_bucket_update" on storage.objects for update to authenticated
  using (bucket_id = 'reports' and owner = auth.uid());

drop policy if exists "reports_bucket_delete" on storage.objects;
create policy "reports_bucket_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'reports' and owner = auth.uid());

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
alter table public.profiles                enable row level security;
alter table public.districts               enable row level security;
alter table public.categories              enable row level security;
alter table public.reports                 enable row level security;
alter table public.report_photos           enable row level security;
alter table public.report_feedback         enable row level security;
alter table public.report_disputes         enable row level security;
alter table public.leave_requests          enable row level security;
alter table public.cross_district_requests enable row level security;
alter table public.notifications           enable row level security;
alter table public.escalations             enable row level security;
alter table public.daily_summaries         enable row level security;

-- Helpers --------------------------------------------------------------------
create or replace function public.current_role_name() returns user_role language sql stable security definer as
$$ select role from public.profiles where id = auth.uid() $$;

create or replace function public.current_district() returns uuid language sql stable security definer as
$$ select district_id from public.profiles where id = auth.uid() $$;

-- Profiles policies ----------------------------------------------------------
drop policy if exists "profiles_self_read" on public.profiles;
create policy "profiles_self_read" on public.profiles for select to authenticated
  using (id = auth.uid());

drop policy if exists "profiles_governor_read_all" on public.profiles;
create policy "profiles_governor_read_all" on public.profiles for select to authenticated
  using (public.current_role_name() = 'governor');

drop policy if exists "profiles_dm_read_district" on public.profiles;
create policy "profiles_dm_read_district" on public.profiles for select to authenticated
  using (public.current_role_name() = 'district_manager' and district_id = public.current_district());

drop policy if exists "profiles_tech_read_dm" on public.profiles;
create policy "profiles_tech_read_dm" on public.profiles for select to authenticated
  using (public.current_role_name() = 'technician' and role = 'district_manager' and district_id = public.current_district());

drop policy if exists "profiles_self_update" on public.profiles;
create policy "profiles_self_update" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "profiles_governor_write" on public.profiles;
create policy "profiles_governor_write" on public.profiles for all to authenticated
  using (public.current_role_name() = 'governor') with check (public.current_role_name() = 'governor');

drop policy if exists "profiles_dm_manage_tech" on public.profiles;
create policy "profiles_dm_manage_tech" on public.profiles for update to authenticated
  using (public.current_role_name() = 'district_manager' and role = 'technician' and district_id = public.current_district())
  with check (public.current_role_name() = 'district_manager' and role = 'technician' and district_id = public.current_district());

-- Districts: readable by everyone authenticated -----------------------------
drop policy if exists "districts_read" on public.districts;
create policy "districts_read" on public.districts for select to authenticated using (true);

drop policy if exists "districts_governor_write" on public.districts;
create policy "districts_governor_write" on public.districts for all to authenticated
  using (public.current_role_name() = 'governor') with check (public.current_role_name() = 'governor');

-- Categories: read all, write governor only ---------------------------------
drop policy if exists "categories_read" on public.categories;
create policy "categories_read" on public.categories for select to authenticated using (true);

drop policy if exists "categories_governor_write" on public.categories;
create policy "categories_governor_write" on public.categories for all to authenticated
  using (public.current_role_name() = 'governor') with check (public.current_role_name() = 'governor');

-- Reports --------------------------------------------------------------------
drop policy if exists "reports_citizen_own_or_public" on public.reports;
create policy "reports_citizen_own_or_public" on public.reports for select to authenticated
  using (public.current_role_name() = 'citizen' and (reporter_id = auth.uid() or is_public = true));

drop policy if exists "reports_citizen_insert" on public.reports;
create policy "reports_citizen_insert" on public.reports for insert to authenticated
  with check (public.current_role_name() = 'citizen' and reporter_id = auth.uid());

drop policy if exists "reports_citizen_update_own" on public.reports;
create policy "reports_citizen_update_own" on public.reports for update to authenticated
  using (public.current_role_name() = 'citizen' and reporter_id = auth.uid() and status = 'submitted')
  with check (reporter_id = auth.uid());

drop policy if exists "reports_tech_assigned_read" on public.reports;
create policy "reports_tech_assigned_read" on public.reports for select to authenticated
  using (public.current_role_name() = 'technician' and assigned_technician_id = auth.uid());

drop policy if exists "reports_tech_assigned_update" on public.reports;
create policy "reports_tech_assigned_update" on public.reports for update to authenticated
  using (public.current_role_name() = 'technician' and assigned_technician_id = auth.uid())
  with check (assigned_technician_id = auth.uid());

drop policy if exists "reports_dm_district" on public.reports;
create policy "reports_dm_district" on public.reports for all to authenticated
  using (public.current_role_name() = 'district_manager' and (
    district_id = public.current_district()
    or exists (select 1 from public.cross_district_requests c
               where c.requesting_dm_id = auth.uid()
                 and c.target_district_id = reports.district_id
                 and c.status = 'approved'
                 and (c.expires_at is null or c.expires_at > now()))
  ))
  with check (public.current_role_name() = 'district_manager');

drop policy if exists "reports_governor_all" on public.reports;
create policy "reports_governor_all" on public.reports for all to authenticated
  using (public.current_role_name() = 'governor') with check (public.current_role_name() = 'governor');

-- Photos ---------------------------------------------------------------------
drop policy if exists "photos_read" on public.report_photos;
create policy "photos_read" on public.report_photos for select to authenticated
  using (
    exists (
      select 1 from public.reports r where r.id = report_id and (
        (public.current_role_name() = 'citizen'          and (r.reporter_id = auth.uid() or r.is_public = true)) or
        (public.current_role_name() = 'technician'       and r.assigned_technician_id = auth.uid()) or
        (public.current_role_name() = 'district_manager' and r.district_id = public.current_district()) or
        (public.current_role_name() = 'governor')
      )
    )
  );

drop policy if exists "photos_insert" on public.report_photos;
create policy "photos_insert" on public.report_photos for insert to authenticated
  with check (uploaded_by = auth.uid());

-- Feedback -------------------------------------------------------------------
drop policy if exists "feedback_read" on public.report_feedback;
create policy "feedback_read" on public.report_feedback for select to authenticated
  using (
    exists (select 1 from public.reports r where r.id = report_id and (
      r.reporter_id = auth.uid()
      or r.assigned_technician_id = auth.uid()
      or public.current_role_name() in ('district_manager','governor')
    ))
  );

drop policy if exists "feedback_insert" on public.report_feedback;
create policy "feedback_insert" on public.report_feedback for insert to authenticated
  with check (
    public.current_role_name() = 'citizen'
    and exists (select 1 from public.reports r where r.id = report_id and r.reporter_id = auth.uid() and r.status = 'resolved')
  );

-- Disputes -------------------------------------------------------------------
drop policy if exists "disputes_read" on public.report_disputes;
create policy "disputes_read" on public.report_disputes for select to authenticated
  using (
    exists (select 1 from public.reports r where r.id = report_id and (
      r.reporter_id = auth.uid()
      or public.current_role_name() in ('district_manager','governor')
    ))
  );

drop policy if exists "disputes_insert_citizen" on public.report_disputes;
create policy "disputes_insert_citizen" on public.report_disputes for insert to authenticated
  with check (
    public.current_role_name() = 'citizen'
    and exists (select 1 from public.reports r where r.id = report_id and r.reporter_id = auth.uid())
  );

drop policy if exists "disputes_update_dm" on public.report_disputes;
create policy "disputes_update_dm" on public.report_disputes for update to authenticated
  using (public.current_role_name() in ('district_manager','governor'))
  with check (public.current_role_name() in ('district_manager','governor'));

-- Leave requests -------------------------------------------------------------
drop policy if exists "leave_tech_own" on public.leave_requests;
create policy "leave_tech_own" on public.leave_requests for all to authenticated
  using (technician_id = auth.uid()) with check (technician_id = auth.uid());

drop policy if exists "leave_dm_district" on public.leave_requests;
create policy "leave_dm_district" on public.leave_requests for all to authenticated
  using (public.current_role_name() = 'district_manager'
         and exists (select 1 from public.profiles p where p.id = technician_id and p.district_id = public.current_district()))
  with check (public.current_role_name() = 'district_manager');

drop policy if exists "leave_governor_read" on public.leave_requests;
create policy "leave_governor_read" on public.leave_requests for select to authenticated
  using (public.current_role_name() = 'governor');

-- Cross-district requests ----------------------------------------------------
drop policy if exists "crossdist_dm_own" on public.cross_district_requests;
create policy "crossdist_dm_own" on public.cross_district_requests for all to authenticated
  using (requesting_dm_id = auth.uid()) with check (requesting_dm_id = auth.uid());

drop policy if exists "crossdist_governor_all" on public.cross_district_requests;
create policy "crossdist_governor_all" on public.cross_district_requests for all to authenticated
  using (public.current_role_name() = 'governor') with check (public.current_role_name() = 'governor');

-- Notifications --------------------------------------------------------------
drop policy if exists "notif_own_read" on public.notifications;
create policy "notif_own_read" on public.notifications for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "notif_own_update" on public.notifications;
create policy "notif_own_update" on public.notifications for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Escalations ----------------------------------------------------------------
drop policy if exists "esc_own_read" on public.escalations;
create policy "esc_own_read" on public.escalations for select to authenticated
  using (escalated_to_user_id = auth.uid() or public.current_role_name() = 'governor');

-- Daily summaries ------------------------------------------------------------
drop policy if exists "daily_governor" on public.daily_summaries;
create policy "daily_governor" on public.daily_summaries for select to authenticated
  using (public.current_role_name() = 'governor');

-- ============================================================================
-- REALTIME publication (Supabase enables `supabase_realtime` publication)
-- ============================================================================
do $$ begin
  execute 'alter publication supabase_realtime add table public.notifications';
exception when others then null; end $$;
do $$ begin
  execute 'alter publication supabase_realtime add table public.reports';
exception when others then null; end $$;

-- ============================================================================
-- SEED DATA
-- ============================================================================

-- Districts ------------------------------------------------------------------
insert into public.districts (id, name_en, name_ar, center_lat, center_lng, bounding_radius_km) values
  ('11111111-1111-1111-1111-111111111111', 'Aswan 1',      'قسم أول أسوان',  24.0889, 32.8998, 5),
  ('22222222-2222-2222-2222-222222222222', 'Aswan 2',      'قسم ثان أسوان',  24.1020, 32.9050, 5),
  ('33333333-3333-3333-3333-333333333333', 'Aswan Markaz', 'مركز أسوان',     24.0700, 32.8800, 8),
  ('44444444-4444-4444-4444-444444444444', 'Nasr',         'مركز نصر',       23.9800, 32.8500, 10)
on conflict (id) do nothing;

-- Categories -----------------------------------------------------------------
insert into public.categories (id, name_en, name_ar, icon_name, default_specialty, default_priority, is_active) values
  ('aaaaaaa1-0000-0000-0000-000000000001', 'Pothole',           'حفرة بالطريق',      'Construction',   'road_maintenance', 'high',     true),
  ('aaaaaaa1-0000-0000-0000-000000000002', 'Streetlight',       'إنارة شارع',        'Lightbulb',      'electrician',      'medium',   true),
  ('aaaaaaa1-0000-0000-0000-000000000003', 'Water Leak',        'تسرب مياه',         'Droplet',        'plumber',          'critical', true),
  ('aaaaaaa1-0000-0000-0000-000000000004', 'Sewage',            'صرف صحي',           'Waves',          'plumber',          'high',     true),
  ('aaaaaaa1-0000-0000-0000-000000000005', 'Trash/Sanitation',  'قمامة ونظافة',      'Trash2',         'sanitation',       'medium',   true),
  ('aaaaaaa1-0000-0000-0000-000000000006', 'Traffic Signal',    'إشارة مرور',        'TrafficCone',    'electrician',      'high',     true),
  ('aaaaaaa1-0000-0000-0000-000000000007', 'Tree Damage',       'أضرار بالأشجار',    'TreeDeciduous',  'general',          'low',      true),
  ('aaaaaaa1-0000-0000-0000-000000000008', 'Public Bench/Park', 'مقاعد وحدائق عامة', 'Armchair',       'general',          'low',      true)
on conflict (id) do nothing;

-- Demo users via auth.users + profiles (password: Demo@1234) -----------------
-- Password hash for 'Demo@1234' generated by crypt() + gen_salt('bf')
-- We insert into auth.users directly (supabase allows this via service role in SQL editor)

do $$
declare
  v_pwd text := crypt('Demo@1234', gen_salt('bf'));
  v_users jsonb := jsonb_build_array(
    -- Governor
    jsonb_build_object('id','a0000000-0000-0000-0000-000000000001','email','amr.lashin@aswan.gov.eg',
      'role','governor','full_name','Amr Helmy Hassan Lashin','full_name_ar','عمرو حلمي حسن لاشين',
      'employee_id','GOV001','district_id', null,'phone','+201000000001'),
    -- District Managers
    jsonb_build_object('id','b0000000-0000-0000-0000-000000000001','email','dm1@aswan.gov.eg',
      'role','district_manager','full_name','Mohamed Farouk','full_name_ar','محمد فاروق',
      'employee_id','DM001','district_id','11111111-1111-1111-1111-111111111111','phone','+201000000011'),
    jsonb_build_object('id','b0000000-0000-0000-0000-000000000002','email','dm2@aswan.gov.eg',
      'role','district_manager','full_name','Sara Ibrahim','full_name_ar','سارة إبراهيم',
      'employee_id','DM002','district_id','22222222-2222-2222-2222-222222222222','phone','+201000000012'),
    jsonb_build_object('id','b0000000-0000-0000-0000-000000000003','email','dm3@aswan.gov.eg',
      'role','district_manager','full_name','Karim Abdelrahman','full_name_ar','كريم عبدالرحمن',
      'employee_id','DM003','district_id','33333333-3333-3333-3333-333333333333','phone','+201000000013'),
    jsonb_build_object('id','b0000000-0000-0000-0000-000000000004','email','dm4@aswan.gov.eg',
      'role','district_manager','full_name','Mariam Hassan','full_name_ar','مريم حسن',
      'employee_id','DM004','district_id','44444444-4444-4444-4444-444444444444','phone','+201000000014'),
    -- Technicians: 2 plumbers, 2 electricians, 2 road, 1 sanitation, 1 general
    jsonb_build_object('id','c0000000-0000-0000-0000-000000000001','email','tech.plumber1@aswan.gov.eg',
      'role','technician','full_name','Ahmed Nabil','full_name_ar','أحمد نبيل',
      'employee_id','TECH001','district_id','11111111-1111-1111-1111-111111111111','specialty','plumber','phone','+201000000021'),
    jsonb_build_object('id','c0000000-0000-0000-0000-000000000002','email','tech.plumber2@aswan.gov.eg',
      'role','technician','full_name','Tarek Salah','full_name_ar','طارق صلاح',
      'employee_id','TECH002','district_id','22222222-2222-2222-2222-222222222222','specialty','plumber','phone','+201000000022'),
    jsonb_build_object('id','c0000000-0000-0000-0000-000000000003','email','tech.elec1@aswan.gov.eg',
      'role','technician','full_name','Hossam Adel','full_name_ar','حسام عادل',
      'employee_id','TECH003','district_id','11111111-1111-1111-1111-111111111111','specialty','electrician','phone','+201000000023'),
    jsonb_build_object('id','c0000000-0000-0000-0000-000000000004','email','tech.elec2@aswan.gov.eg',
      'role','technician','full_name','Yasser Kamal','full_name_ar','ياسر كمال',
      'employee_id','TECH004','district_id','33333333-3333-3333-3333-333333333333','specialty','electrician','phone','+201000000024'),
    jsonb_build_object('id','c0000000-0000-0000-0000-000000000005','email','tech.road1@aswan.gov.eg',
      'role','technician','full_name','Mahmoud Samir','full_name_ar','محمود سمير',
      'employee_id','TECH005','district_id','22222222-2222-2222-2222-222222222222','specialty','road_maintenance','phone','+201000000025'),
    jsonb_build_object('id','c0000000-0000-0000-0000-000000000006','email','tech.road2@aswan.gov.eg',
      'role','technician','full_name','Islam Fathy','full_name_ar','إسلام فتحي',
      'employee_id','TECH006','district_id','44444444-4444-4444-4444-444444444444','specialty','road_maintenance','phone','+201000000026'),
    jsonb_build_object('id','c0000000-0000-0000-0000-000000000007','email','tech.sanit@aswan.gov.eg',
      'role','technician','full_name','Omar Gamal','full_name_ar','عمر جمال',
      'employee_id','TECH007','district_id','33333333-3333-3333-3333-333333333333','specialty','sanitation','phone','+201000000027'),
    jsonb_build_object('id','c0000000-0000-0000-0000-000000000008','email','tech.general@aswan.gov.eg',
      'role','technician','full_name','Youssef Hany','full_name_ar','يوسف هاني',
      'employee_id','TECH008','district_id','44444444-4444-4444-4444-444444444444','specialty','general','phone','+201000000028'),
    -- Citizens (NIDs valid-format: century digit 3 = 2000s, birth 2000-2005, gov 88 = Aswan, seq 0001, check digit random)
    jsonb_build_object('id','d0000000-0000-0000-0000-000000000001','email','citizen1@example.com',
      'role','citizen','full_name','Nour Adel','full_name_ar','نور عادل',
      'national_id','30001010188011','district_id','11111111-1111-1111-1111-111111111111',
      'birth_date','2000-01-01','gender','female','phone','+201000000101'),
    jsonb_build_object('id','d0000000-0000-0000-0000-000000000002','email','citizen2@example.com',
      'role','citizen','full_name','Khaled Mostafa','full_name_ar','خالد مصطفى',
      'national_id','30105050188022','district_id','11111111-1111-1111-1111-111111111111',
      'birth_date','2001-05-05','gender','male','phone','+201000000102'),
    jsonb_build_object('id','d0000000-0000-0000-0000-000000000003','email','citizen3@example.com',
      'role','citizen','full_name','Heba Ramadan','full_name_ar','هبة رمضان',
      'national_id','30207070188041','district_id','22222222-2222-2222-2222-222222222222',
      'birth_date','2002-07-07','gender','female','phone','+201000000103'),
    jsonb_build_object('id','d0000000-0000-0000-0000-000000000004','email','citizen4@example.com',
      'role','citizen','full_name','Fady Milad','full_name_ar','فادي ميلاد',
      'national_id','30212120188057','district_id','22222222-2222-2222-2222-222222222222',
      'birth_date','2002-12-12','gender','male','phone','+201000000104'),
    jsonb_build_object('id','d0000000-0000-0000-0000-000000000005','email','citizen5@example.com',
      'role','citizen','full_name','Rana Tawfik','full_name_ar','رنا توفيق',
      'national_id','30303030188063','district_id','33333333-3333-3333-3333-333333333333',
      'birth_date','2003-03-03','gender','female','phone','+201000000105'),
    jsonb_build_object('id','d0000000-0000-0000-0000-000000000006','email','citizen6@example.com',
      'role','citizen','full_name','Mina Sherif','full_name_ar','مينا شريف',
      'national_id','30309090188079','district_id','33333333-3333-3333-3333-333333333333',
      'birth_date','2003-09-09','gender','male','phone','+201000000106'),
    jsonb_build_object('id','d0000000-0000-0000-0000-000000000007','email','citizen7@example.com',
      'role','citizen','full_name','Farida Ayman','full_name_ar','فريدة أيمن',
      'national_id','30411110188085','district_id','44444444-4444-4444-4444-444444444444',
      'birth_date','2004-11-11','gender','female','phone','+201000000107'),
    jsonb_build_object('id','d0000000-0000-0000-0000-000000000008','email','citizen8@example.com',
      'role','citizen','full_name','Zeyad Hatem','full_name_ar','زياد حاتم',
      'national_id','30506060188093','district_id','44444444-4444-4444-4444-444444444444',
      'birth_date','2005-06-06','gender','male','phone','+201000000108'),
    jsonb_build_object('id','d0000000-0000-0000-0000-000000000009','email','citizen9@example.com',
      'role','citizen','full_name','Laila Emad','full_name_ar','ليلى عماد',
      'national_id','30008080188104','district_id','11111111-1111-1111-1111-111111111111',
      'birth_date','2000-08-08','gender','female','phone','+201000000109'),
    jsonb_build_object('id','d0000000-0000-0000-0000-000000000010','email','citizen10@example.com',
      'role','citizen','full_name','Marwan Walid','full_name_ar','مروان وليد',
      'national_id','30104040188115','district_id','22222222-2222-2222-2222-222222222222',
      'birth_date','2001-04-04','gender','male','phone','+201000000110')
  );
  u jsonb;
begin
  for u in select * from jsonb_array_elements(v_users) loop
    insert into auth.users (
      id, instance_id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data, is_super_admin
    ) values (
      (u->>'id')::uuid, '00000000-0000-0000-0000-000000000000',
      'authenticated', 'authenticated',
      u->>'email', v_pwd,
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('full_name', u->>'full_name'),
      false
    ) on conflict (id) do nothing;

    insert into auth.identities (
      id, user_id, provider, provider_id, identity_data, created_at, updated_at, last_sign_in_at
    ) values (
      gen_random_uuid(), (u->>'id')::uuid, 'email', u->>'email',
      jsonb_build_object('sub', u->>'id', 'email', u->>'email', 'email_verified', true),
      now(), now(), now()
    ) on conflict do nothing;

    insert into public.profiles (
      id, role, full_name, full_name_ar, email, phone, national_id, employee_id,
      district_id, specialty, birth_date, gender
    ) values (
      (u->>'id')::uuid,
      (u->>'role')::user_role,
      u->>'full_name',
      u->>'full_name_ar',
      u->>'email',
      u->>'phone',
      u->>'national_id',
      u->>'employee_id',
      nullif(u->>'district_id','')::uuid,
      nullif(u->>'specialty','')::specialty_type,
      nullif(u->>'birth_date','')::date,
      nullif(u->>'gender','')::gender_type
    ) on conflict (id) do nothing;
  end loop;
end $$;

-- Flag one technician as on leave for demo (TECH002 - plumber 2) -------------
insert into public.leave_requests (id, technician_id, start_date, end_date, reason, status, substitute_id, approved_by, decided_at)
values (
  'e0000000-0000-0000-0000-000000000001',
  'c0000000-0000-0000-0000-000000000002',
  current_date - 1, current_date + 4,
  'Family emergency',
  'approved',
  'c0000000-0000-0000-0000-000000000001',
  'b0000000-0000-0000-0000-000000000002',
  now() - interval '1 day'
);
update public.profiles set is_on_leave = true where id = 'c0000000-0000-0000-0000-000000000002';
update public.profiles set substitute_for_user_id = 'c0000000-0000-0000-0000-000000000002' where id = 'c0000000-0000-0000-0000-000000000001';

-- A pending leave request for demo ------------------------------------------
insert into public.leave_requests (id, technician_id, start_date, end_date, reason, status)
values (
  'e0000000-0000-0000-0000-000000000002',
  'c0000000-0000-0000-0000-000000000004',
  current_date + 7, current_date + 10,
  'Personal matter',
  'pending'
);

-- Reports: 30 scattered across all statuses ---------------------------------
-- Helper: small jitter around district centers
insert into public.reports (id, reporter_id, district_id, category_id, priority, status, description, address_description, location_lat, location_lng, assigned_technician_id, approved_by, is_public, submitted_at, approved_at, assigned_at, started_at, resolved_at, resolved_cost) values

-- 5 submitted
('f1000000-0000-0000-0000-000000000001','d0000000-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','aaaaaaa1-0000-0000-0000-000000000001','high','submitted','Large pothole near Corniche El Nile, dangerous for cars','Corniche El Nile, near Nubian Museum',24.0880,32.8985,null,null,false,now() - interval '10 minutes',null,null,null,null,null),
('f1000000-0000-0000-0000-000000000002','d0000000-0000-0000-0000-000000000002','11111111-1111-1111-1111-111111111111','aaaaaaa1-0000-0000-0000-000000000003','critical','submitted','Water pipe burst flooding the street','Saad Zaghloul Street',24.0895,32.9002,null,null,false,now() - interval '5 minutes',null,null,null,null,null),
('f1000000-0000-0000-0000-000000000003','d0000000-0000-0000-0000-000000000003','22222222-2222-2222-2222-222222222222','aaaaaaa1-0000-0000-0000-000000000005','medium','submitted','Overflowing trash bins not collected for 3 days','Market area',24.1025,32.9055,null,null,true,now() - interval '2 hours',null,null,null,null,null),
('f1000000-0000-0000-0000-000000000004','d0000000-0000-0000-0000-000000000005','33333333-3333-3333-3333-333333333333','aaaaaaa1-0000-0000-0000-000000000002','medium','submitted','Three streetlights out on main road','Near High Dam Road',24.0705,32.8810,null,null,false,now() - interval '1 hour',null,null,null,null,null),
('f1000000-0000-0000-0000-000000000005','d0000000-0000-0000-0000-000000000007','44444444-4444-4444-4444-444444444444','aaaaaaa1-0000-0000-0000-000000000007','low','submitted','Fallen tree branch blocking sidewalk','Nasr Road',23.9810,32.8510,null,null,false,now() - interval '30 minutes',null,null,null,null,null),

-- 4 approved (awaiting assignment)
('f2000000-0000-0000-0000-000000000001','d0000000-0000-0000-0000-000000000009','11111111-1111-1111-1111-111111111111','aaaaaaa1-0000-0000-0000-000000000006','high','approved','Traffic signal stuck on red at busy intersection','El Geish Street intersection',24.0885,32.8995,null,'b0000000-0000-0000-0000-000000000001',true,now() - interval '3 hours',now() - interval '2 hours',null,null,null,null),
('f2000000-0000-0000-0000-000000000002','d0000000-0000-0000-0000-000000000003','22222222-2222-2222-2222-222222222222','aaaaaaa1-0000-0000-0000-000000000004','high','approved','Sewage smell from manhole','Near Aswan market',24.1030,32.9060,null,'b0000000-0000-0000-0000-000000000002',false,now() - interval '4 hours',now() - interval '3 hours',null,null,null,null),
('f2000000-0000-0000-0000-000000000003','d0000000-0000-0000-0000-000000000006','33333333-3333-3333-3333-333333333333','aaaaaaa1-0000-0000-0000-000000000001','medium','approved','Small pothole forming, needs patching','Side street off main road',24.0710,32.8815,null,'b0000000-0000-0000-0000-000000000003',false,now() - interval '5 hours',now() - interval '4 hours',null,null,null,null),
('f2000000-0000-0000-0000-000000000004','d0000000-0000-0000-0000-000000000008','44444444-4444-4444-4444-444444444444','aaaaaaa1-0000-0000-0000-000000000008','low','approved','Broken park bench','Nasr Park',23.9815,32.8505,null,'b0000000-0000-0000-0000-000000000004',true,now() - interval '6 hours',now() - interval '5 hours',null,null,null,null),

-- 5 assigned
('f3000000-0000-0000-0000-000000000001','d0000000-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','aaaaaaa1-0000-0000-0000-000000000002','medium','assigned','Streetlight flickering at night','Corniche section 3',24.0881,32.8990,'c0000000-0000-0000-0000-000000000003','b0000000-0000-0000-0000-000000000001',false,now() - interval '8 hours',now() - interval '7 hours',now() - interval '6 hours',null,null,null),
('f3000000-0000-0000-0000-000000000002','d0000000-0000-0000-0000-000000000002','11111111-1111-1111-1111-111111111111','aaaaaaa1-0000-0000-0000-000000000003','high','assigned','Slow water leak in front of building','El Souk Street',24.0892,32.9008,'c0000000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-000000000001',false,now() - interval '10 hours',now() - interval '9 hours',now() - interval '8 hours',null,null,null),
('f3000000-0000-0000-0000-000000000003','d0000000-0000-0000-0000-000000000004','22222222-2222-2222-2222-222222222222','aaaaaaa1-0000-0000-0000-000000000001','high','assigned','Deep pothole causing accidents','Aswan 2 ring road',24.1015,32.9045,'c0000000-0000-0000-0000-000000000005','b0000000-0000-0000-0000-000000000002',true,now() - interval '12 hours',now() - interval '11 hours',now() - interval '10 hours',null,null,null),
('f3000000-0000-0000-0000-000000000004','d0000000-0000-0000-0000-000000000005','33333333-3333-3333-3333-333333333333','aaaaaaa1-0000-0000-0000-000000000005','medium','assigned','Trash not collected in alley','Behind markaz building',24.0695,32.8795,'c0000000-0000-0000-0000-000000000007','b0000000-0000-0000-0000-000000000003',false,now() - interval '14 hours',now() - interval '13 hours',now() - interval '12 hours',null,null,null),
('f3000000-0000-0000-0000-000000000005','d0000000-0000-0000-0000-000000000007','44444444-4444-4444-4444-444444444444','aaaaaaa1-0000-0000-0000-000000000001','medium','assigned','Pothole near school','Nasr school street',23.9805,32.8495,'c0000000-0000-0000-0000-000000000006','b0000000-0000-0000-0000-000000000004',false,now() - interval '16 hours',now() - interval '15 hours',now() - interval '14 hours',null,null,null),

-- 4 in_progress
('f4000000-0000-0000-0000-000000000001','d0000000-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','aaaaaaa1-0000-0000-0000-000000000006','critical','in_progress','Traffic light completely down at major intersection','El Corniche & El Geish',24.0878,32.8992,'c0000000-0000-0000-0000-000000000003','b0000000-0000-0000-0000-000000000001',true,now() - interval '20 hours',now() - interval '19 hours',now() - interval '18 hours',now() - interval '2 hours',null,null),
('f4000000-0000-0000-0000-000000000002','d0000000-0000-0000-0000-000000000003','22222222-2222-2222-2222-222222222222','aaaaaaa1-0000-0000-0000-000000000004','high','in_progress','Sewage backup in residential area','Behind the hospital',24.1028,32.9058,'c0000000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-000000000002',false,now() - interval '22 hours',now() - interval '21 hours',now() - interval '20 hours',now() - interval '3 hours',null,null),
('f4000000-0000-0000-0000-000000000003','d0000000-0000-0000-0000-000000000006','33333333-3333-3333-3333-333333333333','aaaaaaa1-0000-0000-0000-000000000002','medium','in_progress','Streetlight pole leaning dangerously','High Dam access road',24.0700,32.8805,'c0000000-0000-0000-0000-000000000004','b0000000-0000-0000-0000-000000000003',false,now() - interval '24 hours',now() - interval '23 hours',now() - interval '22 hours',now() - interval '4 hours',null,null),
('f4000000-0000-0000-0000-000000000004','d0000000-0000-0000-0000-000000000008','44444444-4444-4444-4444-444444444444','aaaaaaa1-0000-0000-0000-000000000001','high','in_progress','Multiple potholes on main road','Nasr main road',23.9820,32.8515,'c0000000-0000-0000-0000-000000000006','b0000000-0000-0000-0000-000000000004',true,now() - interval '26 hours',now() - interval '25 hours',now() - interval '24 hours',now() - interval '5 hours',null,null),

-- 6 resolved (awaiting feedback)
('f5000000-0000-0000-0000-000000000001','d0000000-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','aaaaaaa1-0000-0000-0000-000000000001','medium','resolved','Pothole patched','Aswan 1 residential',24.0883,32.8988,'c0000000-0000-0000-0000-000000000005','b0000000-0000-0000-0000-000000000001',false,now() - interval '2 days',now() - interval '2 days' + interval '1 hour',now() - interval '2 days' + interval '2 hours',now() - interval '2 days' + interval '3 hours',now() - interval '5 hours',350.00),
('f5000000-0000-0000-0000-000000000002','d0000000-0000-0000-0000-000000000002','11111111-1111-1111-1111-111111111111','aaaaaaa1-0000-0000-0000-000000000003','high','resolved','Water leak stopped','Saad Zaghloul area',24.0897,32.9005,'c0000000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-000000000001',false,now() - interval '3 days',now() - interval '3 days' + interval '30 minutes',now() - interval '3 days' + interval '1 hour',now() - interval '3 days' + interval '2 hours',now() - interval '10 hours',520.00),
('f5000000-0000-0000-0000-000000000003','d0000000-0000-0000-0000-000000000003','22222222-2222-2222-2222-222222222222','aaaaaaa1-0000-0000-0000-000000000002','medium','resolved','Streetlight bulb replaced','Aswan 2 main road',24.1022,32.9052,'c0000000-0000-0000-0000-000000000003','b0000000-0000-0000-0000-000000000002',false,now() - interval '4 days',now() - interval '4 days' + interval '2 hours',now() - interval '4 days' + interval '3 hours',now() - interval '4 days' + interval '4 hours',now() - interval '15 hours',180.00),
('f5000000-0000-0000-0000-000000000004','d0000000-0000-0000-0000-000000000005','33333333-3333-3333-3333-333333333333','aaaaaaa1-0000-0000-0000-000000000005','low','resolved','Trash collected','Markaz back alley',24.0708,32.8812,'c0000000-0000-0000-0000-000000000007','b0000000-0000-0000-0000-000000000003',false,now() - interval '5 days',now() - interval '5 days' + interval '4 hours',now() - interval '5 days' + interval '5 hours',now() - interval '5 days' + interval '6 hours',now() - interval '20 hours',120.00),
('f5000000-0000-0000-0000-000000000005','d0000000-0000-0000-0000-000000000007','44444444-4444-4444-4444-444444444444','aaaaaaa1-0000-0000-0000-000000000008','low','resolved','Park bench repaired','Nasr park area',23.9812,32.8508,'c0000000-0000-0000-0000-000000000008','b0000000-0000-0000-0000-000000000004',true,now() - interval '6 days',now() - interval '6 days' + interval '6 hours',now() - interval '6 days' + interval '8 hours',now() - interval '6 days' + interval '10 hours',now() - interval '30 hours',90.00),
('f5000000-0000-0000-0000-000000000006','d0000000-0000-0000-0000-000000000009','11111111-1111-1111-1111-111111111111','aaaaaaa1-0000-0000-0000-000000000007','low','resolved','Tree branch cleared','Corniche park strip',24.0887,32.8993,'c0000000-0000-0000-0000-000000000008','b0000000-0000-0000-0000-000000000001',false,now() - interval '7 days',now() - interval '7 days' + interval '3 hours',now() - interval '7 days' + interval '4 hours',now() - interval '7 days' + interval '5 hours',now() - interval '40 hours',60.00),

-- 3 rated (completed feedback)
('f6000000-0000-0000-0000-000000000001','d0000000-0000-0000-0000-000000000002','11111111-1111-1111-1111-111111111111','aaaaaaa1-0000-0000-0000-000000000001','high','rated','Old pothole fixed','Aswan 1 west side',24.0875,32.8980,'c0000000-0000-0000-0000-000000000005','b0000000-0000-0000-0000-000000000001',false,now() - interval '10 days',now() - interval '10 days' + interval '1 hour',now() - interval '10 days' + interval '2 hours',now() - interval '10 days' + interval '3 hours',now() - interval '9 days',420.00),
('f6000000-0000-0000-0000-000000000002','d0000000-0000-0000-0000-000000000004','22222222-2222-2222-2222-222222222222','aaaaaaa1-0000-0000-0000-000000000003','critical','rated','Major leak fixed','Aswan 2 corner',24.1018,32.9048,'c0000000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-000000000002',true,now() - interval '12 days',now() - interval '12 days' + interval '15 minutes',now() - interval '12 days' + interval '30 minutes',now() - interval '12 days' + interval '45 minutes',now() - interval '11 days',780.00),
('f6000000-0000-0000-0000-000000000003','d0000000-0000-0000-0000-000000000006','33333333-3333-3333-3333-333333333333','aaaaaaa1-0000-0000-0000-000000000006','high','rated','Traffic signal fixed','Markaz roundabout',24.0702,32.8808,'c0000000-0000-0000-0000-000000000004','b0000000-0000-0000-0000-000000000003',false,now() - interval '14 days',now() - interval '14 days' + interval '30 minutes',now() - interval '14 days' + interval '1 hour',now() - interval '14 days' + interval '2 hours',now() - interval '13 days',310.00),

-- 1 disputed
('f7000000-0000-0000-0000-000000000001','d0000000-0000-0000-0000-000000000008','44444444-4444-4444-4444-444444444444','aaaaaaa1-0000-0000-0000-000000000001','medium','disputed','Pothole supposedly fixed but reopened','Nasr main road',23.9822,32.8512,'c0000000-0000-0000-0000-000000000006','b0000000-0000-0000-0000-000000000004',false,now() - interval '8 days',now() - interval '8 days' + interval '2 hours',now() - interval '8 days' + interval '3 hours',now() - interval '8 days' + interval '4 hours',now() - interval '3 days',280.00),

-- 2 archived (rejected + old completed)
('f8000000-0000-0000-0000-000000000001','d0000000-0000-0000-0000-000000000010','22222222-2222-2222-2222-222222222222','aaaaaaa1-0000-0000-0000-000000000005','low','archived','Fully handled and archived','Aswan 2 residential',24.1012,32.9040,'c0000000-0000-0000-0000-000000000007','b0000000-0000-0000-0000-000000000002',false,now() - interval '20 days',now() - interval '20 days' + interval '5 hours',now() - interval '20 days' + interval '6 hours',now() - interval '20 days' + interval '7 hours',now() - interval '19 days',75.00),
('f8000000-0000-0000-0000-000000000002','d0000000-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','aaaaaaa1-0000-0000-0000-000000000008','low','archived','Old bench issue archived','Corniche benches',24.0886,32.8987,'c0000000-0000-0000-0000-000000000008','b0000000-0000-0000-0000-000000000001',false,now() - interval '25 days',now() - interval '25 days' + interval '8 hours',now() - interval '25 days' + interval '9 hours',now() - interval '25 days' + interval '10 hours',now() - interval '24 days',50.00)
on conflict (id) do nothing;

-- Set archived_at for the 2 archived reports
update public.reports set archived_at = now() - interval '18 days' where id = 'f8000000-0000-0000-0000-000000000001';
update public.reports set archived_at = now() - interval '23 days' where id = 'f8000000-0000-0000-0000-000000000002';

-- Sample feedback for rated reports -----------------------------------------
insert into public.report_feedback (id, report_id, rating, comment) values
  ('fb000000-0000-0000-0000-000000000001','f6000000-0000-0000-0000-000000000001',5,'Excellent work, fixed quickly!'),
  ('fb000000-0000-0000-0000-000000000002','f6000000-0000-0000-0000-000000000002',4,'Good, the leak is gone.'),
  ('fb000000-0000-0000-0000-000000000003','f6000000-0000-0000-0000-000000000003',5,'Perfect, signal works again.')
on conflict do nothing;

-- Feedback + dispute for disputed report ------------------------------------
insert into public.report_feedback (id, report_id, rating, comment) values
  ('fb000000-0000-0000-0000-000000000099','f7000000-0000-0000-0000-000000000001',2,'The pothole is back after 2 days — not properly fixed.')
on conflict do nothing;

insert into public.report_disputes (report_id, feedback_id, created_at) values
  ('f7000000-0000-0000-0000-000000000001','fb000000-0000-0000-0000-000000000099', now() - interval '2 days');

-- Sample notifications ------------------------------------------------------
insert into public.notifications (user_id, type, title_en, title_ar, body_en, body_ar, link_url) values
  ('d0000000-0000-0000-0000-000000000001','report_status_change','Your report is in progress','يتم العمل على بلاغك','A technician has started working on your pothole report.','بدأ أحد الفنيين العمل على بلاغ الحفرة.','/citizen/report/f3000000-0000-0000-0000-000000000001'),
  ('d0000000-0000-0000-0000-000000000002','report_resolved','Your report is resolved','تم حل بلاغك','Please rate the service.','برجاء تقييم الخدمة.','/citizen/report/f5000000-0000-0000-0000-000000000002'),
  ('b0000000-0000-0000-0000-000000000001','escalation','SLA warning','تحذير SLA','A high-priority report is approaching its deadline.','بلاغ ذو أولوية عالية يقترب من موعده النهائي.','/manager/reports'),
  ('c0000000-0000-0000-0000-000000000003','new_task','New task assigned','تم إسناد مهمة جديدة','A new streetlight task has been assigned to you.','تم إسناد مهمة إنارة جديدة إليك.','/technician/task/f3000000-0000-0000-0000-000000000001'),
  ('a0000000-0000-0000-0000-000000000001','escalation','Citywide escalation','تصعيد على مستوى المدينة','Critical report breached SLA.','تجاوز بلاغ حرج الـ SLA.','/governor/situation-room');

-- ============================================================================
-- pg_cron (OPTIONAL — requires pg_cron extension)
-- If pg_cron is unavailable on your Supabase plan, call these RPCs from a
-- Vercel Cron endpoint every 5 minutes instead (see CRON_SECRET in .env).
-- ============================================================================
-- select cron.schedule('sla_sweep_every_minute',    '* * * * *', $$ select public.sla_escalation_sweep(); $$);
-- select cron.schedule('auto_archive_every_hour',   '0 * * * *', $$ select public.auto_archive_stale_resolved(); $$);
-- select cron.schedule('daily_summary_8am_cairo',   '0 6 * * *', $$ insert into public.daily_summaries (summary_date, new_reports_count, resolved_count, top_delay_districts, payload) select current_date, (select count(*) from public.reports where submitted_at::date = current_date - 1), (select count(*) from public.reports where resolved_at::date = current_date - 1), (select jsonb_agg(x) from (select district_id, escalation_count from public.v_district_stats order by escalation_count desc limit 3) x), '{}'::jsonb on conflict do nothing; $$);

-- ============================================================================
-- DONE
-- ============================================================================
-- Verify:
--   select count(*) from public.profiles;     -- expect 23
--   select count(*) from public.reports;      -- expect 30
--   select count(*) from public.districts;    -- expect 4
--   select count(*) from public.categories;   -- expect 8