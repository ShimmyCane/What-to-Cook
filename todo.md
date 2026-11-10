# What to Cook — To do

One current list (consolidated 2026-11-07). The history lives in the convo files; `convo/convo v0.5.md` to `v0.8.md` hold the decisions. Notes are marked done only after Jimmy confirms (`02 Refs/Skills/read_notes_and_update.md`).

## Waiting on Jimmy (paste, check, decide)

- [x] **Pasted `supabase/what_to_cook_MVP.sql`** (checked on the live database, 2026-11-07). Expect three table rows (rls_on true, policies 1, anon_grants 0, registered 1) and column count 2. This includes the food list table. The older food-list paste is archived at `supabase/archive/foods_what_to_cook.sql`.
- [x] **Pasted `supabase/wtc_items_tracking.sql`** (PR #121). Expect column_exists 1 and check_exists 1. Then say so, and eggs and bread move to the low list.
- [x] **Pasted `supabase/recipes_what_to_cook.sql`** after the MVP file (recipe versions and pantry links). Expect dish_column_count 2 and food_column 1.
- [ ] **Merge the drafts** when ready: PR #121 (tracking priority), PR #122 (pantry follow-ups), PR #124 (recipe book, with the explore page), PR #116 (nursery task tracker). Say "merge" for each.
- [ ] **Test the recipe book** on a phone or iPad (Settings → Pages → Recipe book): the flip, the filters, and whether the starter recipes fit the family.
- [ ] **Recipe book questions** (convo v0.8): should Athena and Felix edit recipes and add scores, or only read and tap a score? Which small logo for each person? Show me a flip-card example you like.
- [ ] **Choose the first cuisines** to start from the cuisine library, and move them to "in the book".
- [ ] **Food journal** (convo v0.3, questions 4–8): app name, cuisine list or free tags, restaurant fields, brand links to pantry items, kids' access.
- [ ] **Owner-only calorie log:** decide first. It needs `04 AI/Supabase/platform_owner.sql` pasted before any owner-only rule.
- [ ] **Freezer: full look.** Older chicken breasts may be there from earlier trips. Five bags were logged from today's memo.
- [ ] **Storage next to the stove:** not listed yet.
- [ ] **Cabinet over the counter:** to go through later.
- [ ] **Water filter:** replacement not done.
- [ ] **Expiry dates marked "?":** check them against the packages, starting with "use soon" and "use now" items.
- [ ] **Chia seeds:** the bag does not close; move them to a sealed container.
- [ ] **Anchovies (dried):** no use yet. Ask for ideas later.
- [ ] **Orange juice:** take it to the soccer game (expires 8 November, estimated).
- [ ] **Reminders for items about to expire:** the Use soon panel does this for now. Scheduled reminders are a later choice.
- [ ] **Cooking salt level:** record it as a note on each cooking wine, vinegar and sauce (done for the vinegars, not yet for every cooking wine).
- [ ] **Milk:** the lactose-free split is not recorded. Tell me the split if you want it added.
- [ ] **Left out of the database:** "Casey's mom" and "123-4567 wines" (unclear in the memos).

## Claude to build (once the above is pasted or decided)

- [x] **Fridge life on entry:** new items are stamped; fridge items without a date get one from the food list, marked "?" (0.7.0). The food list was seeded with 95 foods from the inventory; 36 have estimated fridge days. Check and correct them on the Food list page.
- [x] **Priority ordering:** favourites first, then by how often a food is used; low items on a Lower priority list (0.7.0). Uses the "LOW PRIORITY" note until `wtc_items_tracking.sql` is pasted; then add `tracking` to the sync fields.
- [x] **Recipe book, database:** favourites and starts are saved in `wtc_recipes` (keyed by the recipe id in notes), 0.7.0.
- [x] **Recipe versions:** once started, add a person's tweak; their letter shows on the card (0.8.0). Logos are letters in coloured circles until Jimmy picks others.
- [x] **Recipe back:** short starter steps for all 50 recipes, shown once a recipe is started (0.7.0).
- [x] **Pantry links:** starting a recipe saves its ingredients with `food_id` linked to the food list (0.8.0). The card's "have it" still reads this device's pantry; switching it to the database is a later step.
- [ ] **Cuisine library:** decide whether it moves into the database (`wtc_cuisines`) or stays a file.
- [ ] **Kitchen button:** not built. Places cover it for now (decided in convo v0.6).

## Done (2026-11-07)

- [x] Code review: shared helpers (storage, errors, ids), sync out of `app.js`, screens split by feature (core, content, pantry, capture, settings), and cuisine names aligned. Tested headless: pantry flow, sign-in, sync with a mocked network, recipe filters.

- [x] Pantry saves to the Family database; sign-in works.
- [x] Notes save to the database, and done notes show ✅ in the Notes log (0.5.0).
- [x] To-do panel in Settings with ✅ and ⬜ (0.5.0).
- [x] Food list page (`foods.html`), with places (fridge, pantry, freezer, other), fridge days and notes. Linked from Settings → Pages (0.4.0).
- [x] Dark-mode text fix: white panels keep dark text (PR #117).
- [x] Nursery home page links to What to Cook; `CLAUDE.md` allows `index.html` changes when Jimmy asks (PR #123).
- [x] Recipe book, explore: 50 starter cards, filters, start and favourite buttons, search for versions (0.6.0, on PR #124).
- [x] Cuisine library: 66 cuisines and cooking styles (`cuisine_library.json`).
- [x] Pantry entered from four memos (wet, dry, cold and cabinet stock), with expiry estimates marked "?".
- [x] Notes round answered and closed (convo v0.6). Done notes ignored, not deleted.
