# What to Cook — Claude Code pointer

Purpose: a family kitchen tool. Captures pantry, fridge, freezer, tool and space stock from transcripts, photos or speech; swipe check-ins (ate or tossed); a recipe book with trials and family tastes; a food log per member; meal planning; and a shopping list.

- Design: `schematic.md`
- Decisions and open questions: `convo/convo v0.2.md` (older: `convo v0.1.md`). Never compact; start a new version instead.
- AI notes: `04 AI/What to Cook/brief.md` and `lessons.md`
- Shared conventions: root `CLAUDE.md` (public repo, privacy rules), `04 AI/Supabase/brief.md` (prefix `wtc_`, registry)
- Track: A. Family play
- Database: Family project (`twvqvutrcobedvuhnzxq`), tables `wtc_*`. SQL in `supabase/`: `what_to_cook_setup.sql` (one file; paste it whole) and the optional `test_001_what_to_cook.sql`. Not applied yet.

Rules:
- Pantry, recipes, photos, transcripts and calories stay in Supabase or on the device, never in this repo. Calories are health data.
- No secret keys in browser code. The publishable key only.
- Database SQL is pasted by hand (`02 Refs/Skills/supabase_link.md`). Do not run `apply_migration` unless Jimmy asks.
- Parser (`js/parse.js`) is pure and offline; keep it free of network calls.

How to run: open `index.html` directly, or serve the folder. Data stays on the device until the Family database is wired.
