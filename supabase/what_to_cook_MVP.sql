-- ============================================================================
-- What to Cook — MVP compiled paste file (the next migration, in one file).
-- Paste the whole file into the Family project's SQL editor and press Run.
-- Re-runnable: every step is "if not exists", "drop policy if exists" or "on conflict".
-- Family project only. Prefix wtc_.
--
-- Already applied and NOT repeated here: what_to_cook_setup.sql (11 tables) and
-- notes_what_to_cook.sql (wtc_notes). The older food-list paste is archived at
-- supabase/archive/foods_what_to_cook.sql; it is not needed once this file has run
-- (its table is created here too, with the same definition).
--
-- Covers the to-do list and convo v0.3 (food journal):
--   1. wtc_foods               food list page (fridge days, places)      [built, paste pending]
--   2. wtc_items: fridge days  auto-stamp when an item goes in           [todo: auto-stamp]
--   3. wtc_journal_entries     food journal: home, restaurant, brand      [convo v0.3, provisional]
--   4. wtc_journal_ratings     one rating per family member per entry     [convo v0.3, provisional]
--
-- Not included, on purpose:
--   - Owner-only calorie log. Needs 04 AI/Supabase/platform_owner.sql first (not in this project yet).
--     Decide with Jimmy before it is added (convo v0.4, item 7).
--   - Brand links to pantry items (convo v0.3, question 7): open.
-- ============================================================================

-- 1. Food list ---------------------------------------------------------------
create table if not exists public.wtc_foods (
    id              uuid primary key default gen_random_uuid(),
    name            text not null default '' check (length(name) <= 200),
    location        text not null default 'pantry' check (location in ('fridge', 'pantry', 'freezer', 'other')),
    kind            text not null default '' check (kind in ('', 'dry', 'wet', 'tool', 'space')),
    category        text not null default '',
    fridge_days     numeric check (fridge_days is null or fridge_days >= 0),
    notes           text not null default '',
    created_by      uuid default auth.uid(),
    created_at      timestamptz not null default timezone('utc', now()),
    updated_at      timestamptz not null default timezone('utc', now())
);
alter table public.wtc_foods enable row level security;

create unique index if not exists wtc_foods_name_location_key
    on public.wtc_foods (lower(name), location)
    where name <> '';

-- 2. Fridge life on each stock line -------------------------------------------
-- stamped_on: the day the item went in (set when it is saved).
-- fridge_days: the estimate copied from the food list when it went in; may be blank.
alter table public.wtc_items add column if not exists stamped_on date;
alter table public.wtc_items add column if not exists fridge_days numeric;
alter table public.wtc_items drop constraint if exists wtc_items_fridge_days_check;
alter table public.wtc_items add constraint wtc_items_fridge_days_check
    check (fridge_days is null or fridge_days >= 0);

-- 3. Food journal: what we ate, where, and what we thought ------------------------
-- No addresses are stored. place_name is a name only (for example a restaurant's name).
-- cuisine is free text for now (convo v0.3, question 5 is open).
create table if not exists public.wtc_journal_entries (
    id              uuid primary key default gen_random_uuid(),
    entry_date      date not null default current_date,
    kind            text not null default 'home_meal'
                    check (kind in ('home_meal', 'restaurant', 'brand', 'favourite_meal', 'recipe_trial')),
    title           text not null check (length(title) between 1 and 200),
    cuisine         text not null default '' check (length(cuisine) <= 60),
    place_name      text not null default '' check (length(place_name) <= 120),
    recipe_id       uuid references public.wtc_recipes (id) on delete set null,
    note            text not null default '' check (length(note) <= 2000),
    created_by      uuid default auth.uid(),
    created_at      timestamptz not null default timezone('utc', now()),
    updated_at      timestamptz not null default timezone('utc', now())
);
alter table public.wtc_journal_entries enable row level security;

-- 4. One rating per member per entry (latest save wins) ---------------------------
create table if not exists public.wtc_journal_ratings (
    entry_id        uuid not null references public.wtc_journal_entries (id) on delete cascade,
    member_id       uuid not null,                       -- a family_members id; no foreign key, as elsewhere
    rating          smallint not null check (rating between 1 and 5),
    would_again     boolean,                             -- "cook or go again?", blank if not asked
    updated_at      timestamptz not null default timezone('utc', now()),
    primary key (entry_id, member_id)
);
alter table public.wtc_journal_ratings enable row level security;

-- Family-only access, as the other family apps use: signed-in users, anon revoked.
do $$
declare
    t text;
begin
    foreach t in array array['wtc_foods', 'wtc_journal_entries', 'wtc_journal_ratings']
    loop
        execute format('revoke all on public.%I from anon', t);
        execute format('drop policy if exists %I on public.%I', 'Authenticated can manage ' || t, t);
        execute format('create policy %I on public.%I for all to authenticated using (true) with check (true)',
                       'Authenticated can manage ' || t, t);
    end loop;
end $$;

-- Registry: this app owns the new tables.
insert into public.app_table_registry (app, object_name, object_type, access, description, repo) values
('what-to-cook', 'wtc_foods',           'table', 'owner', 'Food list: each food and its place, with the fridge life estimate used when items go in.', 'ShimmyCane/Index'),
('what-to-cook', 'wtc_journal_entries', 'table', 'owner', 'Food journal: home meals, restaurants, brands and favourite meals, with date, cuisine and note. No addresses.', 'ShimmyCane/Index'),
('what-to-cook', 'wtc_journal_ratings', 'table', 'owner', 'Each family member''s rating of a journal entry, and whether they would have it again.', 'ShimmyCane/Index')
on conflict (app, object_name) do nothing;

-- ----------------------------------------------------------------------------
-- Check after Run: expect 3 rows (one per new table), then 2 rows for wtc_items columns.
-- Table rows: rls_on = true, policies = 1, anon_grants = 0, registered = 1.
-- Column rows: column_count = 2.
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
where n.nspname = 'public' and c.relkind = 'r'
  and c.relname in ('wtc_foods', 'wtc_journal_entries', 'wtc_journal_ratings')
order by 1;

select count(*) as column_count
from information_schema.columns
where table_schema = 'public' and table_name = 'wtc_items'
  and column_name in ('stamped_on', 'fridge_days');
