# What to Cook — Convo v0.4

**Project:** What to Cook
**Round:** 4. Answers to the four questions at the end of v0.2, plus the pantry behaviour.

## Pantry behaviour (from Jimmy)

1. **Clean-up cards.** Food about to expire (three days or less) or past its date appears as cards at the top, under "Use soon", so it gets used first.
2. **Swipe left** = ate or tossed (a choice appears on the card). **Swipe right** = remain (recorded as reviewed today; the card leaves "Use soon" until tomorrow). **Tap** = favourite ⭐.
3. **Tweak quantity** in the card's Details. A **Save and next** button saves and jumps to the next card in "Use soon".
4. **Eggs and other items that get used up over time** have a predicted index. Example: bought 60 a week ago, eat about 5 a day, so about 25 (42%) should be left. Feedback buttons: **ate more**, **about right**, **ate less**. "Ate more" or "ate less" changes the per-day rate (by 25% or 20%) and resets the baseline to the prediction.

## Input (from Jimmy)

5. The usual input is an **Apple Voice Memo transcript**. The raw transcript is **archived** in full, and can be read in Settings.
6. **Photo route (answer to v0.2 Q10):** Claude reads the photo, creates the JSON and uploads it **straight to the database**. Nothing is pasted by hand.
   - **Duplicates are overwritten:** same name, same expiry date, same place updates the existing line.
   - **New versions** of the same item are a **separate line**, with the new expiry date.

## Answers to v0.2 questions

7. **Calorie privacy (Q11):** future to do.
8. **Family members (Q12):** not answered in this round. Current plan stands (read `family_members`).
9. **Recipe photos (Q13):** stored in Supabase as a **separate table** (`wtc_photos`) for now.
10. **Swipe and quantity (Q14):** the swipe does not change quantity; it changes status. Quantity is tweaked in Details, with Save and next.

## Settings (from Jimmy)

11. Settings have a **notes log**, a **version log**, and **links to the various pages** (planned pages are shown, not yet links).

## Open

12. "Mergr" and the trailing "2-" in the message: unclear. Possibly "merge" (the PR into main) or a note. Ask before merging anything: the PR is not merged.
13. Predicted index: the rate is typed in by hand for now. Later, Claude could suggest a rate from the item's history.
