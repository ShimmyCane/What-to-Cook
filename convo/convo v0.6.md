# What to Cook — Convo v0.6

**Project:** What to Cook
**Round:** 6. Answers to convo v0.5 (Q1–Q5).

## Answers

**Q1. Fridge life stamp.** Answer (a): a master list by food name gives the fridge days. Leave blanks for now. Jimmy first does an inventory, so the list is a reference of the foods bought. The automatic stamp when an item goes in is a later build, after the list has entries.

**Q2. Master list.** A separate HTML page, **Food list**, linked from the Settings button (under Pages). It is not a panel inside Settings.

**Q3. Fridge and kitchen buttons.** Answer (a), as places. Tap Fridge, Freezer, Pantry or Other and only that place's foods are shown. Each food is tagged with its place. New foods are tagged with the place on screen. The "kitchen" button is not added as a separate place for now.

**Q4. Unbuilt list.** Skipped. Jimmy said "let's just skip it".

**Q5. Test note and done items.** Done items are **ignored from future review**, not deleted. The four notes stay in `wtc_notes` marked done with the `Done- ` prefix. The read-notes skill now says so.

## Decisions recorded from this round

- New table `wtc_foods` (paste file `supabase/foods_what_to_cook.sql`). Name, place (fridge, pantry, freezer, other), kind, category, fridge days and notes. Blank names are allowed, and the same name in the same place is one row.
- New page `foods.html`: saves to `wtc_foods` when signed in, keeps a device copy otherwise. Save is manual (a button), so nothing is written by accident.
- Settings → Pages links to the Food list.
- Version 0.4.0.

## Open

- The paste file `foods_what_to_cook.sql` is not applied yet. Jimmy pastes it into the Family SQL editor, and sends back the one-row check.
- Auto-stamp of fridge days when an item goes in (answer to Q1, later build).
