---
name: new-purchase
description: Add new shopping purchases and count corrections to the family pantry (wtc_items in the Family Supabase project). Use when the user says "new purchase", "update inventory", or describes what they bought or counted.
---

# New purchase: update the home inventory

Turns a shopping trip (typed list, Apple Voice Memo transcript, or photo of a receipt) into rows in `public.wtc_items` in the Family Supabase project (`twvqvutrcobedvuhnzxq`). Pantry data is private: never write it to this public repo, commit files of it, or paste it into a URL, header or commit message.

## Steps

1. **Read the input.** Accept what the user gives: a list, a transcript, or a receipt photo. Note the purchase date (default: today, or the date the user says).
2. **Draft the rows.** For each item, work out:
   - `name`: short and specific, with brand or size where given (e.g. "Eggs", "Kirkland lax clear (MiraLAX alternative), kitchen").
   - `quantity` and `unit`: a number and a plain unit (bottle, bag, box, gallon, lb). Use `null` when the count is not given, and say so in `notes`.
   - `stored_location`: one of `fridge`, `freezer`, `pantry`, `kitchen`, or `other`. Anything the app has no place for (e.g. a medical cabinet) goes in as its own name, and tell the user it will show under Unsorted.
   - `kind`: `wet` for fridge and freezer items and liquids, `dry` for pantry items, `tool` or `space` for kitchen equipment.
   - `category`: a short label such as dairy, meat, produce, bakery, frozen, medicine.
   - `tracking`: `priority` (default) or `low` (lower-priority list).
3. **Show the draft and wait for a yes.** List the rows and any open questions (place, fresh or frozen, unknown counts, names to confirm). Write nothing until the user confirms. This matches the app's rule that nothing is saved without a tick.
4. **Check for duplicates.** The database enforces one in-stock row per (lower-cased name, expiry date, place). Query for existing rows with `status = 'in_stock'` and a similar name first. If one exists, update its quantity and `counted_on` rather than inserting a second row.
5. **Write in one transaction.** Use `mcp__Supabase__execute_sql` (or the Supabase connector's equivalent) with `begin; ... commit;`. Set these fields on every new row:
   - `status = 'in_stock'`, `source = 'manual'`, `quality = 'new'`
   - `purchased_on` = the purchase date
   - `counted_on` = today
   - `notes` = where it came from (e.g. "Costco, 2026-11-21") plus anything unknown
   - `raw_text` = the line as the user wrote it
   Leave `id`, `created_at` and `updated_at` to the database defaults, and set `updated_at = now()` on every update.
6. **Count corrections.** When the user gives a current count for something already in stock, update `quantity`, `unit` and `counted_on = today`, and add the reason to `notes`. Do not change `purchased_on`.
7. **Verify.** Read the rows back by `purchased_on = <date>` and by the names updated. Compare them with the draft and report any mismatch. Use the REST read on `wtc_items` if the connector is unavailable.
8. **Report.** Say how many rows were added, how many were updated, and what is still open (counts not given, places to confirm, names to check).

## Rules

- Calories and health items are data too (e.g. laxatives, medicine): record the product and quantity only, with no advice.
- Never delete rows. To use something up, set `status` to `eaten` or `tossed` only when the user says so.
- Schema changes (`apply_migration`) are not part of this skill. Ask first.
- Do not run `supabase` CLI commands or write files into this repo for pantry data. The scratchpad is fine for drafts.
