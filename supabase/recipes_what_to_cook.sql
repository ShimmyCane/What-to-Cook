-- ============================================================================
-- What to Cook — recipe versions and pantry links.
-- Paste AFTER what_to_cook_MVP.sql (it needs wtc_foods). Re-runnable.
-- Adds to existing tables only; no new tables. Family project. Prefix wtc_.
--   wtc_recipes.dish:               the dish name shared by its versions (for example "Pad thai").
--   wtc_recipes.version_by:         whose version it is: Family (the starting point), Jimmy, Ying, Athena, Felix.
--   wtc_recipe_ingredients.food_id: the food in the food list; "do we have it" = any in-stock item of that food.
-- ============================================================================

alter table public.wtc_recipes add column if not exists dish text not null default '';
alter table public.wtc_recipes add column if not exists version_by text not null default 'Family';
alter table public.wtc_recipes drop constraint if exists wtc_recipes_version_by_check;
alter table public.wtc_recipes add constraint wtc_recipes_version_by_check
    check (length(version_by) between 1 and 40);
create index if not exists wtc_recipes_dish_idx on public.wtc_recipes (dish);

alter table public.wtc_recipe_ingredients add column if not exists food_id uuid
    references public.wtc_foods (id) on delete set null;
create index if not exists wtc_recipe_ingredients_food_idx on public.wtc_recipe_ingredients (food_id);

-- ----------------------------------------------------------------------------
-- Check after Run: expect one row. dish_column = 1, version_column = 1, food_column = 1.
-- ----------------------------------------------------------------------------
select (select count(*) from information_schema.columns where table_schema = 'public'
         and table_name = 'wtc_recipes' and column_name in ('dish', 'version_by')) as dish_column_count,
       (select count(*) from information_schema.columns where table_schema = 'public'
         and table_name = 'wtc_recipe_ingredients' and column_name = 'food_id') as food_column;
