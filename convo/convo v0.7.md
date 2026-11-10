# What to Cook — Convo v0.7

**Project:** What to Cook
**Round:** 7. Set up the recipe book (MVP-2), with versions per family member. Questions to answer inline.

## What Jimmy asked

A recipe book where one dish can have several versions: Jimmy's, Ying's, Athena's, Felix's (maybe), and a Family version (maybe).

## Working read (to confirm)

- The database already has the recipe pieces: `wtc_recipes` (one row per recipe), `wtc_recipe_ingredients`, `wtc_recipe_trials` (how each cooking turned out), `wtc_taste_votes` (each member's 1–5 score) and `wtc_photos`. Nothing new is needed for the basic book.
- A **version** is a recipe row that belongs to a **dish**. Two or more rows with the same dish are versions of it. Each version has its own ingredients, steps, trials and votes.
- Proposed additions (not applied yet): on `wtc_recipes`, a `dish` text (the dish name, for example "Pad thai") and a `version_by` text (the label, for example "Ying"). No new tables.

## Questions for Jimmy

**Q1. Version names.** Are these the names to show: Jimmy, Ying, Athena, Felix, Family? Is "Family" a version of its own, or the shared default that the others start from?

**Q2. Dish and version.** Confirm: one dish, several versions, each with its own ingredients and steps. (Recommended.) Or should a version only change a few ingredients of a shared recipe?

**Q3. Who edits.** Anyone signed in can add or change any version, with the owner's name shown. (Recommended, since the family sign-in is shared.) Or only the owner can change their version?

**Q4. Athena and Felix.** Should they see the book only, or also add versions and taste votes? A simple "tap a score" for them would fit a child's use. Which?

**Q5. Taste votes.** Each member scores each version 1–5, as planned. Keep it, or also a "would make again" tick?

**Q6. Ingredients and the pantry.** Should a recipe ingredient link to a pantry item, so "What can I cook?" can count what is in stock? (Later build, not MVP-2, unless you want it now.)

**Q7. Photos.** Keep recipe photos in `wtc_photos` as small base64 rows, as planned (answer to v0.4, item 9), resized to about 200 KB?

## Next

When you answer, I'll add the two columns (as a paste file, not applied), build the recipe list with versions and votes, and test it headless at phone width.
