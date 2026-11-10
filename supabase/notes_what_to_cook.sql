-- ============================================================================
-- What to Cook — notes table (the feedback box in ⚙️ Settings → Notes log).
-- Paste the whole file into the Family project's SQL editor and press Run.
-- Re-runnable. Separate from what_to_cook_setup.sql, which is already applied.
-- Family project only. Prefix wtc_.
-- ============================================================================

-- Feedback notes typed in the app. Text only; no personal data beyond what is typed.
create table if not exists public.wtc_notes (
    id              uuid primary key default gen_random_uuid(),
    text            text not null check (length(text) between 1 and 2000),
    page            text not null default '',               -- which tab or screen it was typed on
    version         text not null default '',               -- app version when it was typed
    status          text not null default 'open' check (status in ('open', 'done')),
    noted_at        timestamptz not null default timezone('utc', now()),   -- when it was typed on the device
    created_by      uuid default auth.uid(),
    created_at      timestamptz not null default timezone('utc', now())
);
alter table public.wtc_notes enable row level security;

-- Family-only access, as the other family apps use: signed-in users, anon revoked.
revoke all on public.wtc_notes from anon;
drop policy if exists "Authenticated can manage wtc_notes" on public.wtc_notes;
create policy "Authenticated can manage wtc_notes" on public.wtc_notes
    for all to authenticated using (true) with check (true);

-- Registry: this app owns the table.
insert into public.app_table_registry (app, object_name, object_type, access, description, repo) values
('what-to-cook', 'wtc_notes', 'table', 'owner', 'Feedback notes typed in the app, with the page and version they were typed on.', 'ShimmyCane/Index')
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
where n.nspname = 'public' and c.relkind = 'r' and c.relname = 'wtc_notes';
