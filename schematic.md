# What to Cook — Schematic

**Status:** MVP-1 on the device, pantry v0.2.0 (use-soon cards, swipe, predicted index, Apple Voice Memo input). Database SQL written, its test passed on the live Family project, not applied.
**Track:** A. Family play (household tool: few words, big touch targets, secondary options in ⚙️). See `02 Refs/Skills/project_track.md`.
**Database:** Supabase **Family** project (`twvqvutrcobedvuhnzxq`), tables `wtc_*`, RLS on, anon revoked. SQL in `supabase/`: one file, `what_to_cook_setup.sql`, plus the optional `test_001_what_to_cook.sql`. Not applied yet; applied by Jimmy pasting the file.
**Private data:** pantry, recipes, photos, transcripts and calories live in Supabase or on the device, never in this public repo.
**Decisions:** `convo/convo v0.2.md`, `convo v0.3.md` (food journal), `convo v0.4.md` (pantry behaviour).

## Purpose

A family kitchen tool that knows what is in the fridge, pantry, freezer, the tools and the space, tells the family what to use up first, learns what they like, and helps decide what to cook.

## Pantry screen (v0.2.0)

- **Use soon** (collapsible, top): food that expires within three days, or has passed its date, and was not kept today. Shown as cards with a coral edge.
- **Pantry, fridge and freezer** (collapsible): everything else in stock, favourites first, filtered by place.
- **Swipe left** on a card: a choice appears, *Ate it* or *Tossed*. The item's status changes.
- **Swipe right**: *remain*. Logged as reviewed today, so the card leaves Use soon until tomorrow.
- **Tap** the card: ⭐ favourite (or back to ☆).
- **Details and quantity** (collapsed inside each card): quantity, unit, *eats per day*, expiry date, place, notes. *Save* keeps the card open; *Save and next ▸* (Use soon only) opens the next card to go through them in order.

## Predicted index (things eaten over time)

For items with a quantity and an *eats per day* rate:

    remaining ≈ quantity at the last count − eats per day × days since that count

Example: 60 eggs counted a week ago, eating 5 a day, so about 25 left (42%).

Feedback buttons on the card:
- **Ate more**: the guess was too high. The count resets to the guess and the rate goes up 25%.
- **About right**: the count resets to the guess; rate unchanged.
- **Ate less**: the guess was too low. The count resets to the guess and the rate goes down 20%.

Settings → *How the guess works* explains this in plain words. Each feedback is logged as a check-in.

## Input routes, one review step

Every route produces draft items, shown on the review screen with a tick per item. Nothing is saved without the tick. Each draft shows whether it will update an existing line.

| Route | How it works | Status |
|---|---|---|
| Apple Voice Memo transcript | Paste the memo's transcript (the usual route); sorted on the device by rules (`js/parse.js`) | built |
| Typed or spoken here | Type, or speak with browser speech recognition where supported | built |
| Photo (Claude) | Claude reads the photo, creates the JSON and writes it **straight to the database**. Nothing is pasted by hand. | planned, needs the database |
| Claude-sorted transcript | Claude sorts a transcript and writes straight to the database, same rules as the photo route | planned, needs the database |

**Duplicate rule (all routes):** the same name, expiry date and place *overwrites* the existing line (quantity and unit take the new values, the count date is today). The same name with a *new expiry date* is a *new line*, so each version of an item keeps its own date. The database enforces this with a partial unique index on in-stock lines.

## Transcript archive

Every save archives the raw transcript in full (method, time, how many lines were new or updated). Settings → *Transcript archive* lists them, each one collapsed to its text.

## The item model (`wtc_items`)

One row per stock line. Fields: name, kind (dry / wet / tool / space), category, subcategory, quality, quantity and unit, servings remaining, expiry date, freshness, stored location, purchase cost, notes, status (in stock / eaten / tossed / used up), source (which input route), raw text, purchased date, counted date, eats per day, favourite, reviewed date.

## Swipe check-ins (`wtc_checkins`)

Each swipe, tap-to-choose, remain or rate feedback is recorded with the family member checking, the time and the action (ate, tossed, kept, ate_more, ate_about_right, ate_less). This is the occasional check: it keeps stock true without a separate stock-take.

## Recipes and tastes

- `wtc_recipes`: name, photo path, cook time, servings, favourite, wish, steps, notes.
- `wtc_recipe_ingredients`: ingredient lines per recipe.
- `wtc_recipe_trials`: each time a recipe is cooked, the outcome (great / good / ok / not again) and notes. This is the "how did it turn out?" record, and what makes "last month you liked X" possible.
- `wtc_taste_votes`: each member's 1–5 score per recipe. Latest vote per member counts.
- `wtc_photos`: recipe photos as small base64 rows, in a separate table for now (answer to Q13). Resize to about 200 KB before saving.

## Food log (`wtc_food_log`)

Per family member: date, meal, recipe (optional), description, calories (optional). Calories are health data, so the table is family sign-in only, never committed. Calorie privacy between members is a future to-do (convo v0.4, item 7).

## Planning and shopping (planned)

- `wtc_plan`: one dinner slot per day to start; a recipe or a note.
- `wtc_shopping`: generated from the plan and wish recipes (needed minus pantry), or added by hand. Ticked items stay ticked.
- Quick plan ("What can I cook?") ranks favourites by how many ingredients are in stock, then by cook time.

## Family members

`family_members` is owned by the habits app and read here (names and colours). Member columns in this app are plain uuids with no foreign key, so a change to the family list never touches this app's rows. Until the family sign-in is wired, the page uses a names-only list kept on the device.

## Settings (⚙️)

Per `02 Refs/Skills/settings_gear.md`, and the request in convo v0.4:
- **Pages**: links to Pantry and Add now; the planned pages are listed with what they wait for.
- **Family members** (this device, until sign-in).
- **How the guess works** (plain-words explanation of the predicted index).
- **Transcript archive** (every raw transcript, in full).
- **Version log** (what changed in each version).
- **Notes log** (feedback, saved with the screen it was typed on; sent to `wtc_notes` when signed in, kept on the device otherwise).
- **Show errors** (opt-in, at the bottom of the page).
- Database check and sign-in: when the database is wired.

## Offline-first

Live database (8 s timeout) → last good copy on the device → empty state. Right now only the device copy exists (local storage keys `wtc.*`). Nothing is bundled as personal data.

## Increments

1. **MVP-1 (done on the device):** pantry with use-soon cards, swipe, favourites, quantity tweak with Save and next, predicted index with feedback; Apple Voice Memo and typed transcripts with review, duplicate overwrite and archive; settings with pages, version log, notes log, errors opt-in.
2. **MVP-2 (next):** Family database applied by paste (`001`), the page wired to it, database check in ⚙️, photo route (Claude writes the rows), recipe book with photos, trials and tastes.
3. **MVP-3:** food log per member with calories and daily totals.
4. **MVP-4:** week calendar and quick plan.
5. **MVP-5:** wish list and shopping list generated from the plan.
6. **MVP-6:** Claude-sorted transcript and AI review, written straight to the database.
7. **Planned extension: food journal** (`convo v0.3.md`, name to confirm: Digital Kitchen, Twin Kitchen or Food Lab). One journal of what the family ate and where: home meals, restaurant visits, brands and favourites, each with a date, who, a rating per member and a note. A cuisine tag shows what has been practised. No addresses stored.

Each increment is smoke-tested (`02 Refs/Skills/smoke_test.md`) before it is called working.

## Verified vs. not verified

- Verified (headless Chromium, 390 px): 19 checks on the pantry flows (use-soon split, predicted index 25 left (42%), ate less feedback, favourite tap, Save and next, swipe right remain, swipe left choice and ate, duplicate line rule, transcript archived in full, version and archive panels, no horizontal scroll, no JS errors). Script: `scratchpad/flow.js` (not committed).
- Verified: the parser on sample lines; the page at phone and iPad width.
- Verified on the live Family project: the rolled-back test (`test_001`) returns all five checks true (RESULT, rolled back); `family_members` columns and policies read; no `wtc_` tables exist yet.
- Not verified: the SQL is not applied; the database link is not wired; no real phone, real touch or real speech; no real family sign-in.
