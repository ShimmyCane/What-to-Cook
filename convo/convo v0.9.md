# What to Cook — Convo v0.9

**Project:** What to Cook
**Round:** 9. Voice note from Jimmy on the recipe display, flourishes, difficulty, meal prep and weekly ideas. Ideas only; nothing is built from this round yet.

## What I heard

1. **The screen is cluttered.** Too many boxes and outlines. With many ingredients it needs grouping, and fewer borders.
2. **Recipes work.** The generated recipes are good: a Google link and a plain ingredient list. Jimmy did not know the pantry could make this many dishes.
3. **Flourishes.** Extras that lift a dish: aromatics (carrot, celery, onion: the mirepoix idea), garnishes, anything that adds depth or a sub-flavour. Shown apart from the base ingredients.
4. **Rank by difficulty.** A mix of time, ingredient count, a personal rating, and how intricate the steps are (pan-sear then bake is harder than bake). Split *total time* from *cook time*.
5. **Meal prep tab.** Weekend use: pick the ingredients to clear from the fridge, then see what can be made from those plus the rest of the pantry. Strict: nothing the pantry does not have.
6. **Substitutions are a later step.** Green check = have it, yellow check = a substitute is possible. Not now. In meal prep, show *fully covered* first, then *partial*, so Jimmy can guess substitutes by eye.
7. **Ideas for the week.** A new front-page section. Five dinners (major proteins) and five breakfasts. No portions, no times. Breakfasts lean on staples, so they depend less on the ingredient list.

## Display: three ways to cut the clutter

Same data in each. Rule for all three: **one outline per card, none inside it.** Inside a card, use spacing, small caps headings and a thin divider line instead of boxes. Chips become plain text toggles until selected.

**A. Grouped shelves (recommended).** The book groups by what you can do tonight, not by cuisine. Each group is a collapsed row with a count, and a horizontal strip of cards.

    ▾ Ready now (12)          → card card card card …
    ▾ Missing one thing (9)   → card card card …
    ▸ Use-soon rescues (5)
    ▸ Quick (under 30 min) (14)
    ▸ By cuisine (Korean 6, Italian 8, …)

Fewer cards on screen at once, and the headings answer "what can I make".

**B. Compact list, cards on demand.** One line per recipe: name, total time, difficulty dots, a "have 4 of 5" bar. Tap a line to open the flip card. Densest; best when the book reaches hundreds.

    Kimchi fried rice     20 min   ●○○   ████░ 4/5
    Bibimbap              55 min   ●●○   ███░░ 3/5

**C. Photo wall.** Large photo tiles, no text except the name, with a small corner dot for difficulty. Most scrapbook-like (matches v0.8) but needs photos first, and shows the fewest recipes per screen.

I would build **A**, using **B** as a "list view" toggle. C waits for photos.

**On the card back,** the ingredient list reads in three quiet blocks instead of boxes:

    Base        ✅ rice  ✅ egg  ◻ kimchi
    Aromatics   ✅ onion  ✅ garlic
    Flourishes  ✅ sesame seeds  ◻ scallion  ✅ chili flakes

## Flourishes

A flourish is an optional ingredient that is not needed for the dish to work. Each carries a **role** so the card can say why it is there.

| Role | Example |
|---|---|
| Aromatic base | onion, carrot, celery, garlic, ginger |
| Garnish | scallion, sesame seeds, herbs, lemon zest |
| Depth | miso, fish sauce, anchovy, tomato paste, a splash of wine |
| Heat | chili flakes, hot sauce, pepper |
| Acid / fresh finish | lemon, vinegar, pickles |
| Crunch | toasted nuts, fried onion, crumbs |

How they work:
- Each recipe has a short list of **suggested flourishes**, with the role. The card shows ✅ for those in the pantry. Only the pantry ones are highlighted; missing ones stay quiet, so they never read as a shopping demand.
- A **flourish score** per recipe is the count of suggested flourishes in stock. It can sort within a group ("make it amazing": ready and 4 flourishes at hand).
- Tapping a flourish role opens a tip line ("fish sauce: a teaspoon late in cooking adds depth").
- Dormant pantry items with no use (the dried anchovies in the to-do list) can be offered here as a role match. That answers that open question.

## Difficulty

Four parts, each scored 1–5, then averaged. The weights are a starting guess and can change.

| Part | How it is scored | Weight |
|---|---|---|
| Time | from *total time*: ≤20 min 1, ≤40 2, ≤60 3, ≤90 4, longer 5 | 30% |
| Ingredients | count of base + aromatic items (flourishes excluded): ≤5 1, ≤8 2, ≤11 3, ≤14 4, more 5 | 20% |
| Technique | steps and methods: one method 1; two (sear then bake) 2–3; three or more, or a hard one (laminating, tempering, deep frying) 4–5 | 30% |
| Personal | each family member's "how hard was this?" 1–5 after a trial, averaged | 20% |

- Until a recipe has been tried, the personal part is left out and the other three share its weight.
- Shown as dots (●●○) on the front, with the breakdown on the back.
- **Total time** = prep + wait (marinate, rest, rise) + cook. **Cook time** = hands-on or heat time only. Both shown on the back; the front shows total.
- Equipment is a list per recipe (pan, oven, pot, blender). It feeds technique, and can be checked against the tools already in `wtc_items` (kind = tool): "needs a dutch oven: have it".

### Fields each recipe needs

Added to `recipes_explore.json` (and later `wtc_recipes`): `prep_min`, `wait_min`, `cook_min`, `total_min`, `methods` (list), `equipment` (list), `technique` (1–5, set by Claude when written), `ingredients[].role` (base / aromatic), and `flourishes[]` (name, match, role, tip). Personal rating goes in `wtc_recipe_trials` as a new `difficulty` column (1–5), not in the recipe itself.

## Meal prep tab (new, beside Pantry and Add)

1. **Pick** the ingredients to clear (tick from the pantry, with use-soon items first).
2. **Result**, in two sections:
   - **Fully covered**: every ingredient in the recipe is in stock. Anything the recipe needs that is not in the pantry makes it *partial*; nothing is invented.
   - **Partial**: grouped by how many are missing (1, 2, 3+), with the missing items named in plain text. Jimmy supplies substitutes by eye.
3. **Ranking** inside each section: recipes using the most picked ingredients first, then difficulty, then flourishes in stock.
4. Flourishes do not count toward "fully covered", only base and aromatic ingredients do.
5. A batch view is a later idea: pick several recipes that share the picked ingredients so one prep session covers a week.

## Substitutions (future to-do)

- A separate file, `substitutions.json`, researched once: grouped by role (protein swaps, dairy, sauces and condiments, fats, acids, baking). Baking needs its own ratios and is the hardest group; treat it last.
- In recipes: green check = have it, yellow check = a substitute is in the pantry (shown with the swap). Not built until the file exists.
- Jimmy's note: staples cover most baking, proteins swap freely, and the family already has many sauces, so this should be straightforward.

## Ideas for the week (new front-page section)

- **Dinners:** five suggestions, each built around a major protein in the pantry. Use-soon proteins first, then variety (no two with the same protein, no two of the same cuisine in a row). Name and one line only. No time, no portions.
- **Breakfasts:** five suggestions from staples (eggs, oats, bread, yogurt, fruit). Ranked less by pantry fit and more by variety and what the family rated well.
- A *Shuffle* button redraws one slot. Tapping a dinner opens its recipe card. A later step can send the five to the plan (`wtc_plan`) and the shopping list.

## Decisions I made (say if you want them changed)

- Layout A with a list toggle (B); photo wall (C) later.
- Flourishes are optional, never block a recipe, and never count toward "ready".
- Difficulty weights as above; personal part joins after the first trial.
- Meal prep is strict; partial results are shown, never filled in.
- Substitutions stay a future to-do; ideas for the week shows no times.

## Files

None yet. This round adds only this note and the to-do items. Build order if approved: (1) recipe data fields and difficulty, (2) grouped shelves and card-back blocks, (3) meal prep tab, (4) ideas for the week.

## Open

1. Layout: A (grouped shelves), B (list), C (photo wall), or a mix? I recommend A with a list toggle.
2. Should flourishes be written for all 50 starter recipes by Claude, then corrected by the family?
3. Do the difficulty weights feel right? (Technique at 30% is the one I am least sure of.)
4. Meal prep: should it also let you *exclude* ingredients (do not use the milk), or only pick ones to use?
5. Ideas for the week: should the dinner five avoid anything cooked in the last week (needs trials logged)?
6. Where should Ideas for the week live: a tab in the pantry page, or its own page linked from the front?

## Answers (Jimmy, 2026-11-12) and what was built (app 0.9.0)

1. **Layout:** A, grouped shelves. Built, with the list view (B) as a toggle.
2. **Flourishes:** go. Written by Claude for all 50 starter recipes (205 suggestions, each with a role and a tip). To be corrected by the family.
3. **Difficulty weights:** go as proposed.
4. **Meal prep:** no exclude option; only pick ingredients to use. Built as the **Prep** tab.
5. **Dinner ideas:** skip anything cooked in the last 7 days, and sort either **New to us first** or **Favourites first**. Built. "Cooked" comes from a new *Cooked it today* button on the card back, which also asks how hard it was (the personal part of difficulty). Kept on this device for now.
6. **Ideas for the week:** its own tab (**Week**) on the front page.

Notes on the build:
- Recipe maths (pantry match, difficulty, shelves) is in `js/recipelib.js`, pure and offline.
- `breakfast_ideas.json` holds 12 breakfast ideas matched against staples.
- Aromatics are written as flourishes with role `aromatic` (no separate field on ingredients); the card back shows them under their own heading.
- Trials are in the device's local storage (`wtc.recipeTrials`). Moving them to `wtc_recipe_trials` (with a `difficulty` column) needs a SQL paste, left for Jimmy.
- Checked headless at 390 px: shelves, flip, list view, link to a card from Prep, prep results, week plan, shuffle, sort toggle; no JS errors, no sideways scroll. Not checked on a real phone.
