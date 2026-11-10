/* What to Cook — database settings. Publishable key only: safe in browser code, protected by row-level security.
 * Never put a service-role or secret key in this file or anywhere in the repo. */
window.WTC_CONFIG = {
  url: 'https://twvqvutrcobedvuhnzxq.supabase.co',
  publishableKey: 'sb_publishable_eqUo8HEdEB1hMQM4CpSVqA_9i6b0qCo',
  tables: ['wtc_items', 'wtc_checkins', 'wtc_recipes', 'wtc_recipe_ingredients', 'wtc_recipe_trials',
           'wtc_taste_votes', 'wtc_food_log', 'wtc_plan', 'wtc_shopping', 'wtc_transcripts', 'wtc_photos', 'wtc_notes', 'wtc_foods', 'wtc_journal_entries', 'wtc_journal_ratings']
};
