# What to Cook — Convo v0.8

**Project:** What to Cook
**Round:** 8. Answers to convo v0.7 (recipe book), and the design direction.

## Answers to v0.7

1. **Names and starting point.** The family version is the starting point. Other versions can start from it.
2. **Versions.** Separate full takeoffs are allowed, but not required. A tweak is fine.
3. **Tweaks.** A tweak shows the person's small logo in the corner of the card.
4. **Names.** Each version carries that person's name. Still to confirm: whether Athena and Felix should edit or only read (see open items).
5. **Taste votes.** Keep 1–5. Five means loved too much: "king among kings".
6. **Pantry links.** Yes. Each ingredient links to the food list, so the recipe shows "we have this" or "we don't have it".
7. **Photos.** Yes. Photos are uploaded to the database, as planned.

## Design direction (from Jimmy)

- A digital scrapbook: a bunch of cards laid out on a table, as a full tile.
- Browse the cards. Opening a card flips it over, like a recipe card: the back holds the detail.
- Visually interesting, because food is visual. Few words on the front. More detail on the back.
- Look at cooking sites for ideas.

## What I found (quick look)

- Grid layouts are common for recipe sites. They read clean and tidy.
- Card shape varies: tall cards, landscape cards, or a compact horizontal row.
- A scrollable gallery of cards under a bold heading suits browsing.
- Visible dietary filters help, but no filters are needed for the family yet.
- Flip-card layouts were not found in this search. Still to look at.

Sources: [Recipe Kit card templates](https://help.getrecipekit.com/article/782-recipe-card-templates), [Swiper recipes template](https://studio.swiperjs.com/templates/recipes), [Minimalist Baker](https://minimalistbaker.com).

## Decisions I made (say if you want them changed)

- **Dish and versions:** a dish is a name. Versions share the name and have a `version_by` label. The family version is `Family`.
- **Ingredient links:** an ingredient links to a food in the food list. "Have it" means an in-stock pantry item of that food. Recipes do not link to single stock lines, since those change often.
- **Edits:** anyone signed in can change a version, shown with the owner's name. Not yet confirmed.
- **Scores:** 1–5 as in `wtc_taste_votes`.
- **Photos:** `wtc_photos`, as planned.

## Files

- `supabase/recipes_what_to_cook.sql`: adds `dish` and `version_by` to `wtc_recipes`, and `food_id` to `wtc_recipe_ingredients`. Paste after `what_to_cook_MVP.sql`. Not applied yet.

## Open

1. Should Athena and Felix edit recipes and add scores, or only read the book and tap a score?
2. Which small logo for each person? (A letter in a coloured circle is the simplest; a drawn sticker needs an image.)
3. The flip-card layout: needs a look at a working example before the build.
