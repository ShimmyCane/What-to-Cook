/* What to Cook — recipe maths, shared by the recipe book, meal prep and ideas for the week.
 * Pure: no page, no network. Pantry items are plain objects with name, status and expiry. */
(function (root) {
  'use strict';
  var DAY = 86400000;

  function inStock(items) { return (items || []).filter(function (it) { return it.status === 'in_stock'; }); }
  function isSoon(it, now) {
    if (it.freshness === 'use soon' || it.freshness === 'use now' || it.freshness === 'past') return true;
    if (!it.expires_on) return false;
    var base = now || new Date();
    var days = Math.round((new Date(it.expires_on + 'T00:00:00') - new Date(base.getFullYear(), base.getMonth(), base.getDate())) / DAY);
    return days <= 3;
  }
  function hits(stock, key) {
    var k = String(key || '').toLowerCase();
    if (!k) return [];
    return stock.filter(function (it) { return String(it.name || '').toLowerCase().indexOf(k) !== -1; });
  }

  // How well the pantry covers a recipe. Flourishes never count toward "ready".
  function summary(r, stock, now) {
    var matched = 0, soon = false, missing = [], used = [];
    (r.ingredients || []).forEach(function (ing) {
      var h = hits(stock, ing.match);
      ing.have = h.length > 0;
      if (h.length) { matched++; h.forEach(function (it) { if (used.indexOf(it.id) === -1) used.push(it.id); if (isSoon(it, now)) soon = true; }); }
      else missing.push(ing.name);
    });
    var fl = (r.flourishes || []).map(function (f) { f.have = hits(stock, f.match).length > 0; return f; });
    var n = (r.ingredients || []).length;
    return { matched: matched, n: n, missing: missing, used: used, soon: soon, ready: n > 0 && matched === n,
             most: matched * 2 >= n, flourishes: fl.filter(function (f) { return f.have; }).length };
  }

  // Difficulty: four parts scored 1-5; the personal part joins after a trial.
  function timeScore(m) { return m <= 20 ? 1 : m <= 40 ? 2 : m <= 60 ? 3 : m <= 90 ? 4 : 5; }
  function ingScore(n) { return n <= 5 ? 1 : n <= 8 ? 2 : n <= 11 ? 3 : n <= 14 ? 4 : 5; }
  function difficulty(r, personal) {
    var parts = [{ k: 'time', s: timeScore(r.total_min || r.minutes || 0), w: 0.3 },
                 { k: 'ingredients', s: ingScore((r.ingredients || []).length), w: 0.2 },
                 { k: 'technique', s: Math.max(1, Math.min(5, r.technique || 2)), w: 0.3 }];
    if (personal) parts.push({ k: 'personal', s: personal, w: 0.2 });
    var wsum = parts.reduce(function (a, p) { return a + p.w; }, 0);
    var score = parts.reduce(function (a, p) { return a + p.s * p.w; }, 0) / wsum;
    return { score: Math.round(score * 10) / 10, level: Math.max(1, Math.min(5, Math.round(score))), parts: parts };
  }
  function dots(level) { var s = ''; for (var i = 1; i <= 5; i++) s += i <= level ? '●' : '○'; return s; }
  function personalOf(trials, id) {
    var v = (trials || []).filter(function (t) { return t.id === id && t.hard >= 1 && t.hard <= 5; });
    return v.length ? v.reduce(function (a, t) { return a + t.hard; }, 0) / v.length : 0;
  }
  function lastCooked(trials, id) {
    var v = (trials || []).filter(function (t) { return t.id === id; }).map(function (t) { return t.on; }).sort();
    return v.length ? v[v.length - 1] : '';
  }

  // Sort inside a shelf: more flourishes at hand first, then easier.
  function byShelf(a, b) {
    return (b.sum.flourishes - a.sum.flourishes) || (a.diff.score - b.diff.score) || (a.r.name < b.r.name ? -1 : 1);
  }

  root.WTCRecipes = { inStock: inStock, isSoon: isSoon, hits: hits, summary: summary, difficulty: difficulty, dots: dots,
    personalOf: personalOf, lastCooked: lastCooked, byShelf: byShelf, timeScore: timeScore, ingScore: ingScore };
})(window);
