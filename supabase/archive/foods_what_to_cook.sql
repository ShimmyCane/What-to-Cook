-- ============================================================================
-- What to Cook — food list (reference of the foods bought, with fridge life).
-- Paste the whole file into the Family project's SQL editor and press Run.
-- Re-runnable. Separate from what_to_cook_setup.sql and notes_what_to_cook.sql.
-- Family project only. Prefix wtc_. Blanks are allowed: fill it in as the inventory is done.
-- ============================================================================

-- One row per food and place. Fridge life is the master estimate used when an item goes in.
create table if not exists public.wtc_foods (
    id              uuid primary key default gen_random_uuid(),
    name            text not null default '' check (length(name) <= 200),
    location        text not null default 'pantry' check (location in ('fridge', 'pantry', 'freezer', 'other')),
    kind            text not null default '' check (kind in ('', 'dry', 'wet', 'tool', 'space')),
    category        text not null default '',
    fridge_days     numeric check (fridge_days is null or fridge_days >= 0),   -- days it keeps in the fridge
    notes           text not null default '',
    created_by      uuid default auth.uid(),
    created_at      timestamptz not null default timezone('utc', now()),
    updated_at      timestamptz not null default timezone('utc', now())
);
alter table public.wtc_foods enable row level security;

-- Same food in the same place is one row. Blank names are not kept as duplicates of each other.
create unique index if not exists wtc_foods_name_location_key
    on public.wtc_foods (lower(name), location)
    where name <> '';

-- Family-only access, as the other family apps use: signed-in users, anon revoked.
revoke all on public.wtc_foods from anon;
drop policy if exists "Authenticated can manage wtc_foods" on public.wtc_foods;
create policy "Authenticated can manage wtc_foods" on public.wtc_foods
    for all to authenticated using (true) with check (true);

-- Registry: this app owns the table.
insert into public.app_table_registry (app, object_name, object_type, access, description, repo) values
('what-to-cook', 'wtc_foods', 'table', 'owner', 'Food list: each food and its place, with the fridge life estimate used when items go in.', 'ShimmyCane/Index')
on conflict (app, object_name) do nothing;

-- ----------------------------------------------------------------------------
-- Check after Run: expect one row. rls_on = true, policies = 1, anon_grants = 0, registered = 1.
-- ----------------------------------------------------------------------------
select c.relname as table_name,
       c.relrowsecurity as rls_on,
       (select count(*) from pg_policy p where p.polrelid = c.oid) as policies,
       (select count(*) from information_schema.role_table_grants g
         where g.table_schema = 'public' and g.table_name = c.relname and g.grantee = 'anon') as anon_grants,
       (select count(*) from public.app_table_registry r
         where r.app = 'what-to-cook' and r.object_name = c.relname) as registered
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r' and c.relname = 'wtc_foods';
