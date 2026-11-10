# What to Cook — Convo v0.1

**Project:** What to Cook
**Round:** 1 of clarifying questions (started by `/start-project`)

Answer inline under each number. Leave a question blank if you don't know yet. This repo is public, so keep family details (names beyond a first name, school, health, locations) out of answers here.

## Purpose and users

1. Who will use it day to day? (you, the whole household, a partner, the kids)
2. Where will it mostly be used: on the kitchen counter tablet, a phone in the shop, a laptop at the planning desk?
3. Is it mainly for a quick "what can I cook?" moment, or for planning the whole week? Which matters more?

## Track

4. Is this for the family to use (track A, family play style), or is it more of a tool to organise? My recommendation is track A: few words, big buttons, secondary options in ⚙️. Confirm or change.

## Capture (voice transcripts)

5. Where do the transcripts come from? (phone voice memo and then paste, the browser's speech recognition in the page, typed notes, something else)
6. What does a typical observation sound like? Please paste two or three made-up examples (not real shopping habits, if they are private).
7. For parsing, is rule-based on the device enough to start (my recommendation), with an optional "paste into any AI chat" step later, or do you want AI parsing from the start? The AI route keeps no key in the browser but needs a copy and paste.
8. Should the review step show every item before saving (my recommendation), or save straight away and let you fix later?

## Pantry

9. Which places do you track: fridge, pantry, freezer, spice rack, other?
10. Do quantities matter in the pantry (2 eggs, 400 g of rice), or only "have it / running low"?
11. Metric or US units? Any unit that must be supported (for example, cans, bunches, cloves)?
12. Should the low-stock flag use a threshold per item, or one rule for everything?

## Recipe book

13. What must a recipe have? My list: name, photo, cook time, favourite, ingredient list, steps. Add or remove.
14. Photos: keep them in Supabase Storage (needs the family login) or only on the device? Are the photos private (family food, people in the background)? If yes, they stay out of the repo either way.
15. Do you want cook time split into prep and cook, or one number?
16. Should recipes come from anywhere (a website you copy from, a book, your family's own recipes)? Any import needed, or type-in only for now?

## Planning and wish list

17. The week calendar: dinner only, or breakfast and lunch too?
18. In a pinch, should "What can I cook?" rank by what is in stock, by cook time, by favourites, or a mix? Show the top three only?
19. Wish list: is a wish recipe something you want to cook in the next few weeks, or just a "someday" list? Does a wish recipe have a priority?
20. Shopping list: grouped by store aisle or by food type? Shared as text (copy or share button), or only on screen?
21. When a shopping item is bought, should it go into the pantry automatically (my recommendation: ask with a tick, not automatic)?

## Database and sign-in

22. Use the Family Supabase project (shared with the family login, as Adventure and Family Habits do), or a separate one? My recommendation: Family, table prefix `wtc_`.
23. Does data need to be shared by everyone in the house, or only by you?
24. Is it OK to start with device-only storage and add the database in MVP-5 (my recommendation), so the first version works without signing in?

## Feedback and settings

25. Confirm the ⚙️ panel: show errors, database check, sign in, units, shopping order, notes for improvement. Anything to add or remove?
26. Who will test the first version, and on which device? Their notes will be saved with the screen and item they were on.

## Visibility (public repo)

27. This repo is public. The project name "What to Cook" is fine to keep here. Confirm that the app's own data (pantry, recipes, photos, transcripts) will live only in Supabase or in `private/`, never in the repo.
