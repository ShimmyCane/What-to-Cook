# What to Cook — Convo v0.5

**Project:** What to Cook
**Round:** 5. Questions from the feedback notes read on 2026-11-07. Answer inline, under each question.

## What the notes say (summary)

Four open notes, all typed on the pantry screen in version 0.3.0. Test note aside, they ask for three things: fridge life stamped when an item goes in, an editable master list of fridge life, and fridge and kitchen buttons. One note says some other things are not built but does not name them.

Status now: saving to the database works for the pantry (the notes themselves reached the database today). Nothing in the code has changed for these notes yet.

## Questions for Jimmy

**Q1. Fridge life stamp.** When an item goes in the pantry, the app stamps today's date and estimates how many days it will last in the fridge. Should the estimate:
- (a) come from a master list by item name (for example, "milk: 7 days"), filled in once and reused? *Recommended.* Or
- (b) be typed by hand each time?

If (a), the expiry date is set automatically as stamp date + fridge life, and you can still change it on the card.

**Q2. Master list.** Where should the master list be edited?
- (a) In a new panel in ⚙️ Settings, one row per item name with its fridge days. *Recommended.* Or
- (c) On the pantry screen, next to each item.

The master list is kept separate from quantity and from in-pantry status, as the note asks.

**Q3. Fridge and kitchen buttons.** Which of these do you mean?
- (a) They are **places**, like the fridge, pantry and freezer choice already on each item, and they filter the list to that place. *Recommended.* Each place button also shows the kinds inside it (wet, dry, tool, space). Or
- (b) They are **kinds** (wet, dry, tool, space), and "kitchen" is a new kind for kitchen tools and space. Or
- (c) Something else. Please describe it.

Also: should the existing "Pantry" button stay as it is, or change to match?

**Q4. Unbuilt list.** Your note from 6 November, 23:44 says "there's a few other things that are not built". Please list them, even briefly, so I can add them to `todo.md`.

**Q5. Test note.** "Test note 1 round two" (7 November, 00:45) looks like a test. Should I mark it done, or leave it open?

## After you answer

I will update `todo.md` with your answers, build the items you choose, and mark the notes done after you confirm each one. Nothing in the database changes until you say so.
