# What to Cook — Convo v0.2

**Project:** What to Cook
**Round:** 2. Answers to v0.1 given as a direction: build it, on the Family database, with the wider scope below. Questions still open are listed at the end.

## Decisions (from Jimmy)

1. **Build it anyway.** Not waiting on the existing-apps question.
2. **Database:** the Family project (`twvqvutrcobedvuhnzxq`), tables prefixed `wtc_`, linked to the family sign-in. (Answers v0.1 Q22.)
3. **Item model** for the pantry: dry / wet / tool / space; category; subcategory; quality; quantity or servings remaining; expiry date; freshness; stored location; purchase cost; notes.
4. **Input methods, all going into one pipeline:**
   - a Claude photo (Claude reads the photo and returns a sorted list),
   - a Claude-sorted transcript (Claude sorts the voice notes into items),
   - a raw transcript (sorted on the device by the rule-based parser),
   - an AI transcript review (the draft is checked by AI before it is saved).
   Every route ends at the same review step, so input is easy whichever way it comes in.
5. **Occasional check, not a chore:** swipe left (tossed) or right (ate) on each item. The check is the main way stock changes.
6. **Recipe trials:** after cooking, record how it turned out, so the app can say "last month you liked X".
7. **Family tastes:** each member's score per recipe.
8. **Food log per family member**, including calories per member.
9. **Link to the family database.**

## Open questions for Jimmy

10. Photo route: does Claude read the photo in the chat, and you paste back the JSON? (The AI JSON loop, `02 Refs/Skills/ai_json_loop.md`, is the model for this: no key in the browser.)
11. Calories: which member entries are private from other members? Owner-only is possible with `platform_is_owner()`, but needs your owner row added by hand.
12. Family members: the app reads the habits app's `family_members` table. Confirm that is the list to use.
13. Recipe photos: Supabase Storage bucket, or device-only for now?
14. Should a swipe on a shared item reduce its quantity, or just mark it eaten/tossed?

## Notes

- Health data (calories) is kept in the database only, never committed to this public repo.
- The family policies in the Family project are open to any signed-in user. Calorie and food-log tables are the first candidates to tighten.
