-- ============================================================================
-- What to Cook — ONE setup file for the Family Supabase project.
-- Paste the whole file into the SQL editor and press Run once. Re-runnable.
-- Optional first: test_001_what_to_cook.sql (rolls back; ends with an error starting RESULT:
-- when all checks are true). It is kept in its own file because it always stops with that error.
-- Family project only. Prefix wtc_. family_members is read, never changed.
-- ============================================================================

-- Pantry, fridge, freezer, tools and space. One row per stock lot.
create table if not exists public.wtc_items (
    id              uuid primary key default gen_random_uuid(),
    name            text not null,
    kind            text not null default 'dry' check (kind in ('dry', 'wet', 'tool', 'space')),
    category        text not null default '',
    subcategory     text not null default '',
    quality         text not null default 'unknown' check (quality in ('new', 'good', 'fair', 'poor', 'unknown')),
    quantity        numeric,
    unit            text not null default '',
    servings_left   numeric,
    expires_on      date,
    freshness       text not null default 'unknown' check (freshness in ('fresh', 'use soon', 'use now', 'past', 'unknown')),
    stored_location text not null default '',
    purchase_cost   numeric(10, 2),
    notes           text not null default '',
    status          text not null default 'in_stock' check (status in ('in_stock', 'eaten', 'tossed', 'used_up')),
    source          text not null default 'manual' check (source in ('manual', 'raw', 'apple_memo', 'photo', 'ai_review')),
    raw_text        text not null default '',
    purchased_on    date,
    counted_on      date,                                   -- day the quantity was last confirmed or changed (predictions count from here)
    daily_rate      numeric check (daily_rate is null or daily_rate >= 0),  -- units eaten per day, for the predicted index
    fav             boolean not null default false,         -- tapped as a favourite
    reviewed_on     date,                                   -- swiped right (remain) on this day; hides it from "use soon" today
    created_by      uuid default auth.uid(),
    created_at      timestamptz not null default timezone('utc', now()),
    updated_at      timestamptz not null default timezone('utc', now())
);
alter table public.wtc_items enable row level security;

-- One line per stock item, per expiry date and place. Same name + same expiry +
-- same place is a duplicate and is overwritten (on conflict do update). A new
-- expiry date is a new line, so versions of an item stay separate.
create unique index if not exists wtc_items_stock_key
    on public.wtc_items (lower(name), coalesce(expires_on, date '1900-01-01'), stored_location)
    where status = 'in_stock';

-- Swipe check-ins: did you eat it, toss it, or keep it. Append-only log.
create table if not exists public.wtc_checkins (
    id              uuid primary key default gen_random_uuid(),
    item_id         uuid not null references public.wtc_items (id) on delete cascade,
    action          text not null check (action in ('ate', 'tossed', 'kept', 'ate_more', 'ate_about_right', 'ate_less')),
    member_id       uuid,
    quantity_used   numeric,
    note            text not null default '',
    at              timestamptz not null default timezone('utc', now())
);
alter table public.wtc_checkins enable row level security;

-- Recipe book.
create table if not exists public.wtc_recipes (
    id              uuid primary key default gen_random_uuid(),
    name            text not null,
    photo_path      text not null default '',              -- path in the storage bucket, never a personal photo in the repo
    cook_minutes    integer check (cook_minutes is null or cook_minutes >= 0),
    servings        integer check (servings is null or servings > 0),
    favourite       boolean not null default false,
    wish            boolean not null default false,        -- on the wish list, not yet planned
    steps           text not null default '',
    notes           text not null default '',
    created_by      uuid default auth.uid(),
    created_at      timestamptz not null default timezone('utc', now()),
    updated_at      timestamptz not null default timezone('utc', now())
);
alter table public.wtc_recipes enable row level security;

create table if not exists public.wtc_recipe_ingredients (
    id              uuid primary key default gen_random_uuid(),
    recipe_id       uuid not null references public.wtc_recipes (id) on delete cascade,
    name            text not null,
    quantity        numeric,
    unit            text not null default '',
    sort            integer not null default 0
);
alter table public.wtc_recipe_ingredients enable row level security;

-- "How did it turn out?" One row per time a recipe was cooked.
create table if not exists public.wtc_recipe_trials (
    id              uuid primary key default gen_random_uuid(),
    recipe_id       uuid not null references public.wtc_recipes (id) on delete cascade,
    cooked_on       date not null default current_date,
    outcome         text not null default '' check (outcome in ('', 'great', 'good', 'ok', 'not again')),
    notes           text not null default '',
    created_at      timestamptz not null default timezone('utc', now())
);
alter table public.wtc_recipe_trials enable row level security;

-- What each family member likes. Latest vote per member and recipe counts.
create table if not exists public.wtc_taste_votes (
    id              uuid primary key default gen_random_uuid(),
    recipe_id       uuid not null references public.wtc_recipes (id) on delete cascade,
    member_id       uuid not null,
    score           smallint not null check (score between 1 and 5),
    at              timestamptz not null default timezone('utc', now())
);
alter table public.wtc_taste_votes enable row level security;

-- Food log, per family member. Calories are health data: family sign-in only, never in the repo.
create table if not exists public.wtc_food_log (
    id              uuid primary key default gen_random_uuid(),
    member_id       uuid not null,
    logged_on       date not null default current_date,
    meal            text not null default 'snack' check (meal in ('breakfast', 'lunch', 'dinner', 'snack')),
    recipe_id       uuid references public.wtc_recipes (id) on delete set null,
    description     text not null default '',
    kcal            integer check (kcal is null or kcal >= 0),
    at              timestamptz not null default timezone('utc', now())
);
alter table public.wtc_food_log enable row level security;

-- Week calendar: one slot per day (dinner to start), a recipe or a free note.
create table if not exists public.wtc_plan (
    id              uuid primary key default gen_random_uuid(),
    plan_date       date not null,
    slot            text not null default 'dinner' check (slot in ('breakfast', 'lunch', 'dinner')),
    recipe_id       uuid references public.wtc_recipes (id) on delete set null,
    note            text not null default '',
    unique (plan_date, slot)
);
alter table public.wtc_plan enable row level security;

-- Shopping list: generated from the plan and wish recipes, or added by hand.
create table if not exists public.wtc_shopping (
    id              uuid primary key default gen_random_uuid(),
    name            text not null,
    quantity        numeric,
    unit            text not null default '',
    source          text not null default 'manual' check (source in ('manual', 'plan', 'wish')),
    ticked          boolean not null default false,
    created_at      timestamptz not null default timezone('utc', now())
);
alter table public.wtc_shopping enable row level security;

-- Raw observations, kept so they can be parsed again later.
create table if not exists public.wtc_transcripts (
    id              uuid primary key default gen_random_uuid(),
    text            text not null,
    method          text not null default 'raw' check (method in ('raw', 'apple_memo', 'photo', 'ai_review')),
    parsed_count    integer not null default 0,
    created_by      uuid default auth.uid(),
    at              timestamptz not null default timezone('utc', now())
);
alter table public.wtc_transcripts enable row level security;

-- Recipe photos, kept in a separate table for now (not a storage bucket).
-- Keep each photo small (resize to about 200 KB or less before saving).
create table if not exists public.wtc_photos (
    id              uuid primary key default gen_random_uuid(),
    recipe_id       uuid references public.wtc_recipes (id) on delete cascade,
    mime_type       text not null default 'image/jpeg' check (mime_type in ('image/jpeg', 'image/png', 'image/webp')),
    data_base64     text not null check (length(data_base64) <= 300000),
    created_by      uuid default auth.uid(),
    created_at      timestamptz not null default timezone('utc', now())
);
alter table public.wtc_photos enable row level security;

-- Family-only access, as the other family apps use: signed-in users, anon revoked.
do $$
declare
    t text;
begin
    foreach t in array array['wtc_items', 'wtc_checkins', 'wtc_recipes', 'wtc_recipe_ingredients',
                             'wtc_recipe_trials', 'wtc_taste_votes', 'wtc_food_log', 'wtc_plan',
                             'wtc_shopping', 'wtc_transcripts', 'wtc_photos']
    loop
        execute format('revoke all on public.%I from anon', t);
        execute format('drop policy if exists %I on public.%I', 'Authenticated can manage ' || t, t);
        execute format('create policy %I on public.%I for all to authenticated using (true) with check (true)',
                       'Authenticated can manage ' || t, t);
    end loop;
end $$;

-- Registry: every table is owned by this app; family_members is only read.
insert into public.app_table_registry (app, object_name, object_type, access, description, repo) values
('what-to-cook', 'wtc_items',               'table', 'owner', 'Pantry, fridge, freezer, tools and space: one row per stock lot.', 'ShimmyCane/Index'),
('what-to-cook', 'wtc_checkins',            'table', 'owner', 'Swipe check-ins: ate, tossed or kept, per item.', 'ShimmyCane/Index'),
('what-to-cook', 'wtc_recipes',             'table', 'owner', 'Recipe book: name, photo path, cook time, favourite, wish.', 'ShimmyCane/Index'),
('what-to-cook', 'wtc_recipe_ingredients',  'table', 'owner', 'Ingredient lines for each recipe.', 'ShimmyCane/Index'),
('what-to-cook', 'wtc_recipe_trials',       'table', 'owner', 'How each cooking of a recipe turned out.', 'ShimmyCane/Index'),
('what-to-cook', 'wtc_taste_votes',         'table', 'owner', 'Each family member''s score for a recipe.', 'ShimmyCane/Index'),
('what-to-cook', 'wtc_food_log',            'table', 'owner', 'Food log per member, with calories (health data).', 'ShimmyCane/Index'),
('what-to-cook', 'wtc_plan',                'table', 'owner', 'Week calendar: one slot per day.', 'ShimmyCane/Index'),
('what-to-cook', 'wtc_shopping',            'table', 'owner', 'Shopping list from the plan, wish recipes or by hand.', 'ShimmyCane/Index'),
('what-to-cook', 'wtc_transcripts',         'table', 'owner', 'Raw transcripts archived in full (Apple Voice Memo and typed).', 'ShimmyCane/Index'),
('what-to-cook', 'wtc_photos',              'table', 'owner', 'Recipe photos as small base64 rows, kept until moved to a storage bucket.', 'ShimmyCane/Index'),
('what-to-cook', 'family_members',          'table', 'reads', 'Family members, owned by the habits app. Read for names and colours only.', 'ShimmyCane/Index')
on conflict (app, object_name) do nothing;

-- ----------------------------------------------------------------------------
-- Check after Run: one row per table. Expect rls_on = true, policies = 1,
-- anon_grants = 0 and registered = 1 for all 11 wtc_ tables.
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
where n.nspname = 'public' and c.relkind = 'r' and c.relname like 'wtc\_%'
order by 1;
