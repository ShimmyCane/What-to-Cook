/* What to Cook — meal prep and ideas for the week. Both read the pantry on this device and the
 * recipe file; neither writes to the pantry. Recipe maths lives in recipelib.js. */
(function (root) {
  'use strict';
  var WTC = root.WTC, R = root.WTCRecipes, $ = WTC.$;
  var KEY_PICK = 'wtc.prepPick', KEY_WEEK = 'wtc.week', KEY_TRIALS = 'wtc.recipeTrials', KEY_FAV = 'wtc.recipeFav', KEY_START = 'wtc.recipeStart';
  var recipes = [], breakfasts = [], loaded = false, picks = [], search = '';
  var PLACES = [['fridge', 'Fridge'], ['freezer', 'Freezer'], ['pantry', 'Pantry'], ['other', 'Other']];

  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function list(key) { var v = WTCStore.read(key, []); return Array.isArray(v) ? v : []; }
  function stock() { return R.inStock(WTC.state.items); }
  function summaries() {
    var st = stock();
    return recipes.map(function (r) { return { r: r, sum: R.summary(r, st), diff: R.difficulty(r, R.personalOf(list(KEY_TRIALS), r.id)) }; });
  }

  // ---------- meal prep ----------
  function pickChip(it) {
    var b = el('button', 'pick' + (picks.indexOf(it.id) !== -1 ? ' on' : ''), (picks.indexOf(it.id) !== -1 ? '✓ ' : '') + it.name);
    b.type = 'button';
    b.addEventListener('click', function () {
      var at = picks.indexOf(it.id);
      if (at === -1) picks.push(it.id); else picks.splice(at, 1);
      WTCStore.write(KEY_PICK, picks); renderPrep();
    });
    return b;
  }
  function renderPicker() {
    var box = $('prepPick'); box.textContent = '';
    var q = search.toLowerCase();
    var st = stock().filter(function (it) { return !q || String(it.name || '').toLowerCase().indexOf(q) !== -1; });
    var soon = st.filter(function (it) { return R.isSoon(it); });
    function group(title, arr) {
      if (!arr.length) return;
      box.appendChild(el('h4', 'seg', title));
      var row = el('div', 'picks'); arr.sort(function (a, b) { return a.name < b.name ? -1 : 1; }).forEach(function (it) { row.appendChild(pickChip(it)); });
      box.appendChild(row);
    }
    group('⏰ Use soon', soon);
    PLACES.forEach(function (p) {
      group(p[1], st.filter(function (it) { return !R.isSoon(it) && (it.stored_location === p[0] || (p[0] === 'other' && ['fridge', 'freezer', 'pantry'].indexOf(it.stored_location) === -1)); }));
    });
    if (!st.length) box.appendChild(el('p', 'empty', 'Nothing in stock matches. Add food with 🎙️ Add.'));
  }
  function row(x, extra) {
    var a = el('a', 'rrow'); a.href = 'recipes.html#' + encodeURIComponent(x.r.id);
    a.appendChild(el('span', 'grow', x.r.name));
    a.appendChild(el('span', 'meta', (x.r.total_min || x.r.minutes) + ' min'));
    a.appendChild(el('span', 'dots', R.dots(x.diff.level)));
    if (x.sum.flourishes) a.appendChild(el('span', 'meta', '✨' + x.sum.flourishes));
    var wrap = el('div', 'rwrap'); wrap.appendChild(a);
    if (extra) wrap.appendChild(el('div', 'meta rsub', extra));
    return wrap;
  }
  function renderPrep() {
    renderPicker();
    var out = $('prepOut'); out.textContent = '';
    $('prepCount').textContent = picks.length ? picks.length + ' picked' : 'none picked';
    if (!picks.length) { out.appendChild(el('p', 'hint', 'Tick what you want to use up. Recipes appear here, using only what you have.')); return; }
    if (!loaded) { out.appendChild(el('p', 'hint', 'Loading recipes…')); return; }
    var names = {}; WTC.state.items.forEach(function (it) { names[it.id] = it.name; });
    var cand = summaries().map(function (x) {
      x.picked = x.sum.used.filter(function (id) { return picks.indexOf(id) !== -1; });
      return x;
    }).filter(function (x) { return x.picked.length; });
    cand.sort(function (a, b) { return (b.picked.length - a.picked.length) || (a.diff.score - b.diff.score) || (b.sum.flourishes - a.sum.flourishes); });
    var full = cand.filter(function (x) { return x.sum.ready; });
    var part = cand.filter(function (x) { return !x.sum.ready; });
    function section(title, arr, sub) {
      if (!arr.length) return;
      out.appendChild(el('h3', '', title + ' (' + arr.length + ')'));
      arr.forEach(function (x) { out.appendChild(row(x, sub(x))); });
    }
    section('✅ Fully covered', full, function (x) { return 'Uses ' + x.picked.map(function (id) { return names[id]; }).join(', '); });
    var p1 = part.filter(function (x) { return x.sum.missing.length === 1; });
    var p2 = part.filter(function (x) { return x.sum.missing.length === 2; });
    var p3 = part.filter(function (x) { return x.sum.missing.length >= 3; });
    var miss = function (x) { return 'Missing: ' + x.sum.missing.join(', '); };
    out.appendChild(el('p', 'hint', full.length ? 'Partial recipes follow. Swap in your own substitutes.' : 'Nothing is fully covered. Partial recipes follow; swap in your own substitutes.'));
    section('Missing one', p1, miss); section('Missing two', p2, miss); section('Missing three or more', p3, miss);
    if (!cand.length) out.appendChild(el('p', 'empty', 'No recipe in the book uses those. Try fewer picks.'));
  }

  // ---------- ideas for the week ----------
  function today() { return WTC.todayIso(); }
  function daysAgo(iso) { return iso ? WTC.daysBetween(WTC.parseDay(iso), WTC.today()) : 9999; }
  function loadWeek() {
    var w = WTCStore.read(KEY_WEEK, null);
    return w && typeof w === 'object' ? w : { sort: 'new', dinners: [], breakfasts: [] };
  }
  function saveWeek(w) { WTCStore.write(KEY_WEEK, w); }

  function dinnerPool(sort, avoidIds) {
    var fav = list(KEY_FAV), started = list(KEY_START), trials = list(KEY_TRIALS);
    return summaries().filter(function (x) {
      var r = x.r;
      if (r.kind !== 'dinner' || !r.protein || r.protein === 'none' || r.protein === 'veg') return false;
      if (x.sum.missing.length > 2) return false;
      if (daysAgo(R.lastCooked(trials, r.id)) < 7) return false;
      return avoidIds.indexOf(r.id) === -1;
    }).map(function (x) {
      var s = x.sum.ready ? 3 : x.sum.missing.length === 1 ? 1.5 : 0;
      if (x.sum.soon) s += 1;
      var cooked = trials.some(function (t) { return t.id === x.r.id; });
      if (sort === 'fav') s += (fav.indexOf(x.r.id) !== -1 ? 3 : 0) + (cooked ? 0.5 : 0);
      else s += (!cooked && started.indexOf(x.r.id) === -1 ? 2 : 0) + (!cooked ? 0.5 : 0);
      x.score = s + Math.random() * 1.2;
      return x;
    }).sort(function (a, b) { return b.score - a.score; });
  }
  function pickDinners(sort, keep) {
    // keep: ids already chosen that stay put (so shuffle one slot leaves the rest)
    var chosen = keep.slice(), pool = dinnerPool(sort, []);
    var byId = {}; pool.forEach(function (x) { byId[x.r.id] = x; });
    var proteins = chosen.map(function (id) { return byId[id] ? byId[id].r.protein : ''; });
    var prevCuisine = '';
    pool.forEach(function (x) {
      if (chosen.length >= 5 || chosen.indexOf(x.r.id) !== -1) return;
      if (proteins.indexOf(x.r.protein) !== -1) return;
      if (x.r.cuisine === prevCuisine && pool.length > 12) return;
      chosen.push(x.r.id); proteins.push(x.r.protein); prevCuisine = x.r.cuisine;
    });
    pool.forEach(function (x) { if (chosen.length < 5 && chosen.indexOf(x.r.id) === -1) chosen.push(x.r.id); });
    return chosen.slice(0, 5);
  }
  function pickBreakfasts(keep) {
    var st = stock(), chosen = keep.slice();
    var pool = breakfasts.map(function (b) {
      var m = b.needs.filter(function (k) { return R.hits(st, k).length; }).length;
      return { b: b, m: m, ready: m === b.needs.length, score: (m / b.needs.length) * 2 + Math.random() * 1.5 };
    }).filter(function (x) { return x.m > 0 && chosen.indexOf(x.b.id) === -1; }).sort(function (a, b) { return b.score - a.score; });
    pool.forEach(function (x) { if (chosen.length < 5) chosen.push(x.b.id); });
    return chosen;
  }
  function plan(newSort) {
    var w = loadWeek(); if (newSort) w.sort = newSort;
    w.dinners = pickDinners(w.sort, []); w.breakfasts = pickBreakfasts([]); w.made = today();
    saveWeek(w); renderWeek();
  }
  function shuffleOne(kind, at) {
    var w = loadWeek();
    var arr = kind === 'dinner' ? w.dinners : w.breakfasts;
    var rest = arr.filter(function (_, i) { return i !== at; });
    var next;
    if (kind === 'dinner') {
      var pool = dinnerPool(w.sort, arr).filter(function (x) { return rest.indexOf(x.r.id) === -1; });
      var used = rest.map(function (id) { return (recipes.filter(function (r) { return r.id === id; })[0] || {}).protein; });
      var pick = pool.filter(function (x) { return used.indexOf(x.r.protein) === -1; })[0] || pool[0];
      next = pick && pick.r.id;
    } else {
      var more = pickBreakfasts(rest.concat(arr));   // fills up to five, skipping those on the list
      next = more.filter(function (id) { return arr.indexOf(id) === -1 && rest.indexOf(id) === -1; })[0];
    }
    if (!next) { $('weekNote').textContent = 'No other suggestion fits what is in the pantry.'; return; }
    arr[at] = next; saveWeek(w); renderWeek();
  }
  function slot(kind, id, at) {
    var li = el('li', 'slot');
    var info, link = null;
    if (kind === 'dinner') {
      var r = recipes.filter(function (x) { return x.id === id; })[0];
      if (!r) return null;
      info = [r.name, r.cuisine + ' · ' + r.protein]; link = 'recipes.html#' + encodeURIComponent(r.id);
    } else {
      var b = breakfasts.filter(function (x) { return x.id === id; })[0];
      if (!b) return null;
      info = [b.name, b.line];
    }
    var main = link ? el('a', 'sname', info[0]) : el('span', 'sname', info[0]);
    if (link) main.href = link;
    var txt = el('div', 'grow'); txt.appendChild(main); txt.appendChild(el('div', 'meta', info[1]));
    var sh = el('button', 'shuffle', '↻'); sh.type = 'button'; sh.setAttribute('aria-label', 'Another idea for ' + info[0]);
    sh.addEventListener('click', function () { shuffleOne(kind, at); });
    li.appendChild(txt); li.appendChild(sh);
    return li;
  }
  function renderWeek() {
    if (!loaded) return;
    var w = loadWeek();
    if (!w.dinners.length && !w.breakfasts.length) { w.dinners = pickDinners(w.sort, []); w.breakfasts = pickBreakfasts([]); w.made = today(); saveWeek(w); }
    document.querySelectorAll('[data-wsort]').forEach(function (b) { b.classList.toggle('on', b.dataset.wsort === w.sort); });
    $('weekNote').textContent = '';
    [['dinner', 'dinners', 'weekDinners'], ['breakfast', 'breakfasts', 'weekBreakfasts']].forEach(function (k) {
      var ul = $(k[2]); ul.textContent = '';
      w[k[1]].forEach(function (id, i) { var li = slot(k[0], id, i); if (li) ul.appendChild(li); });
      if (!ul.children.length) ul.appendChild(el('li', 'empty', 'Nothing fits what is in the pantry yet.'));
    });
  }

  // ---------- wiring ----------
  $('prepSearch').addEventListener('input', function () { search = this.value; renderPicker(); });
  $('prepClear').addEventListener('click', function () { picks.length = 0; WTCStore.write(KEY_PICK, picks); renderPrep(); });
  $('weekAgain').addEventListener('click', function () { plan(); });
  document.querySelectorAll('[data-wsort]').forEach(function (b) { b.addEventListener('click', function () { plan(b.dataset.wsort); }); });
  document.querySelectorAll('.tab').forEach(function (b) {
    b.addEventListener('click', function () { if (b.dataset.tab === 'prep') renderPrep(); if (b.dataset.tab === 'week') renderWeek(); });
  });
  WTC.on('pantry', function () { if (!$('tab-prep').hidden) renderPrep(); });

  picks = list(KEY_PICK);
  Promise.all([fetch('recipes_explore.json').then(function (r) { return r.json(); }),
               fetch('breakfast_ideas.json').then(function (r) { return r.json(); })]).then(function (res) {
    recipes = res[0].recipes || []; breakfasts = res[1].ideas || []; loaded = true;
    renderPrep(); renderWeek();
  }).catch(function () {
    WTC.reportError('Could not load the recipe files for meal prep and the week.');
    $('prepOut').textContent = 'Could not load the recipes. Open this page from the nursery site.';
  });
  WTC.renderPrep = renderPrep; WTC.renderWeek = renderWeek;
})(window);
