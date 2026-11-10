-- ============================================================================
-- What to Cook — tracking priority on each stock line.
-- Paste the whole file into the Family project's SQL editor and press Run.
-- Re-runnable. Adds one column to wtc_items. Existing rows become 'priority'.
--   priority: tracked closely, shown at the top (default).
--   low:      tracked on a lower list, revisited later (for example eggs and bread).
-- Family project only. Prefix wtc_.
-- ============================================================================

alter table public.wtc_items add column if not exists tracking text not null default 'priority';
alter table public.wtc_items drop constraint if exists wtc_items_tracking_check;
alter table public.wtc_items add constraint wtc_items_tracking_check check (tracking in ('priority', 'low'));

create index if not exists wtc_items_tracking_idx on public.wtc_items (tracking, status);

-- ----------------------------------------------------------------------------
-- Check after Run: expect one row. column_exists = 1, check_exists = 1.
-- ----------------------------------------------------------------------------
select (select count(*) from information_schema.columns
         where table_schema = 'public' and table_name = 'wtc_items' and column_name = 'tracking') as column_exists,
       (select count(*) from pg_constraint
         where conname = 'wtc_items_tracking_check') as check_exists;
