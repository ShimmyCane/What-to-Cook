/* What to Cook — content: version log, to-do list and the page links shown in Settings.
 * Data only. Add a page or a to-do here, not in the code. */
(function (root) {
  'use strict';
  var VERSION = '0.9.3';
  var VERSIONS = [
    { v: '0.9.3', date: '2026-11-12', text: 'Recipe book is now a tab right after Kitchen (recipes.html redirects here). Prep and Week have solid side panels; Week shows dinners and breakfasts side by side on a wide screen. Kitchen shows an in-stock count. Scripts carry a version so a stale copy in the browser cannot mix with the new page.' },
    { v: '0.9.2', date: '2026-11-12', text: 'Pantry is now Kitchen: everything shows, grouped as Fridge, Freezer, Pantry, Kitchen and Unsorted, each folded until opened, with lower-priority items inside their place and headings by category. Search field. Add: pick which place you are reviewing (or let it guess). Done notes show 🔒✅. A soft panel sits behind the content so the dotted background no longer cuts across text.' },
    { v: '0.9.1', date: '2026-11-12', text: 'Prep tab: recipes on the left, ingredients on the right (stacked on a phone). Everything in stock starts ticked; untick items, or use Select all, Deselect all, Only use soon, and all/none per place. Shorter item names.' },
    { v: '0.9.0', date: '2026-11-12', text: 'Recipe book: grouped shelves (ready now, missing one, use soon, quick, by cuisine) with a list view and fewer outlines. Each recipe has prep, wait, cook and total time, a difficulty score, flourishes by role, and a Cooked it button that records how hard it was. New tabs: Prep (pick what to use up, then fully covered recipes first, partial after) and Week (five dinners and five breakfasts; new-to-us or favourites first).' },
    { v: '0.8.0', date: '2026-11-08', text: 'Tracking: choose Priority or Lower priority in each card\'s Details; it saves to the family database. Eggs, bread and wines are on the lower list. Recipe versions: once a recipe is started, add Jimmy\'s, Ying\'s, Athena\'s or Felix\'s tweak; each version shows that person\'s letter on the card. Starting a recipe saves its ingredients, linked to the food list.' },
    { v: '0.7.0', date: '2026-11-07', text: 'Fridge life on entry: new items are stamped with the day they went in, and fridge items without a date get one from the food list (marked ?). Pantry list ordered by favourites, then by how often a food is used; eggs, bread and wines move to a Lower priority list. Recipe book: favourites and starts saved to the family database, and short steps on the back once a recipe is started. Code split by feature.' },
    { v: '0.6.0', date: '2026-11-07', text: 'Recipe book (explore): 50 starter cards from what the family buys, with pantry matches, favourites, start, a use-soon filter, and a search for versions online. Linked from Settings → Pages.' },
    { v: '0.5.0', date: '2026-11-07', text: 'Notes log shows ✅ for notes marked done in the database (it reads their status when signed in). To-do panel in Settings with ✅ for what is built. Text stays readable on white panels in dark mode.' },
    { v: '0.4.0', date: '2026-11-07', text: 'Food list page (from Settings → Pages): each food with its place (fridge, pantry, freezer, other), kind, category, fridge days and notes. Saves to the family database; blanks allowed. Notes now saved to the database too.' },
    { v: '0.3.0', date: '2026-11-06', text: 'Family database wired: sign in with the family login, changes sync to the family pantry, same name, expiry and place overwrite on the server, database check in settings. The device keeps its own copy and works offline.' },
    { v: '0.2.0', date: '2026-11-06', text: 'Use-soon cards for food about to expire. Swipe left for ate or tossed, right to remain, tap for a favourite. Quantity tweak with Save and next. Predicted index for things eaten over time, with ate more / about right / ate less. Apple Voice Memo input. Same name, expiry and place overwrites; a new expiry makes a new line. Settings: pages, transcript archive, version log, notes log.' },
    { v: '0.1.0', date: '2026-11-06', text: 'Pantry with swipe check-ins, transcript capture with review, notes for improvement, opt-in errors.' }
  ];
  var TODO = [
    { done: true, text: 'Pantry saves to the family database.' },
    { done: true, text: 'Notes save to the family database; done notes show ✅ here.' },
    { done: true, text: 'Food list page (Settings → Pages): each food with its place, kind, category, fridge days and notes. Master list of fridge life.' },
    { done: true, text: 'Place tabs: Fridge, Freezer, Pantry, Other, with each food tagged by place.' },
    { done: true, text: 'Family database updated with the food list, fridge days and the food journal tables.' },
    { done: true, text: 'Fridge life on entry: stamped, with an expiry from the food list (95 foods from the inventory).' },
    { done: true, text: 'Pantry ordered by favourites and how often a food is used; a Lower priority list for eggs, bread and wines.' },
    { done: true, text: 'Recipe book: favourites and starts saved to the family database; steps on the back once started.' },
    { done: true, text: 'Tracking column and recipe versions pasted; priority, versions and ingredient links built (0.8.0).' },
    { done: false, text: 'Kitchen button (not added: places cover it for now).' },
    { done: false, text: 'Food journal (convo v0.3): questions still open.' },
    { done: false, text: 'Recipe book, week plan and shopping list (MVP-2 to MVP-5).' }
  ];
  var PAGES = [
    { label: '🏠 Kitchen', tab: 'pantry' },
    { label: '🧾 Food list (fridge days and places)', href: 'foods.html' },
    { label: '📖 Recipe book', tab: 'recipes' },
    { label: '🎙️ Add from a memo or list', tab: 'capture' },
    { label: '🍱 Meal prep', tab: 'prep' },
    { label: '💡 Ideas for the week', tab: 'week' },
    { label: '🥘 Food Lab (cuisines; name to confirm)', planned: 'convo v0.3' },
    { label: '📅 Week plan', planned: 'MVP-4' },
    { label: '🛒 Shopping list', planned: 'MVP-5' },
    { label: '🍽️ Food journal', planned: 'convo v0.3' }
  ];
  root.WTC = root.WTC || {};
  root.WTC.content = { VERSION: VERSION, VERSIONS: VERSIONS, TODO: TODO, PAGES: PAGES };
})(window);
