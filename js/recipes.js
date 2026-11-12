/* What to Cook — recipe book tab: shelves, flip cards, favourites, starts, versions and trials.
 * Lives in index.html as a tab. Recipe maths is in recipelib.js. */
(function () {

  'use strict';
  var KEY_FAV = 'wtc.recipeFav', KEY_START = 'wtc.recipeStart';
  var PALETTE = ['#fff3c4', '#cfe8c9', '#ffd9c7', '#bfeee0', '#e3d9ff', '#ffe1dc'];
  var recipes = [], items = [], fav = [], started = [], filter = 'all';
  var $ = function (id) { return document.getElementById(id); };

  function readList(key) { var v = WTCStore.read(key, []); return Array.isArray(v) ? v : []; }
  function writeList(key, v) { WTCStore.write(key, v); }

  var R = window.WTCRecipes, KEY_TRIALS = 'wtc.recipeTrials', KEY_VIEW = 'wtc.recipeView', KEY_SHELF = 'wtc.shelfOpen';
  var trials = [], view = 'shelves', shelfOpen = {};
  function inStock() { return R.inStock(items); }

  function googleUrl(name) { return 'https://www.google.com/search?q=' + encodeURIComponent(name + ' recipe versions'); }

  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function listBlock(title, rows, haveKey) {
    var box = document.createDocumentFragment();
    if (!rows.length) return box;
    box.appendChild(el('h4', '', title));
    var ul = el('ul', 'ing');
    rows.forEach(function (x) { ul.appendChild(el('li', (x.have ? 'yes' : 'no') + (haveKey && !x.have ? ' dim' : ''), x.name)); });
    box.appendChild(ul);
    return box;
  }

  function card(r, i, s) {
    var isFav = fav.indexOf(r.id) !== -1, isStart = started.indexOf(r.id) !== -1;
    var pers = R.personalOf(trials, r.id), df = R.difficulty(r, pers);
    var flip = el('div', 'flip'); flip.dataset.id = r.id;
    var inner = el('div', 'flip-inner');

    var front = el('div', 'face front');
    front.style.background = PALETTE[i % PALETTE.length];
    front.appendChild(el('div', 'tag', r.cuisine));
    if (isFav || isStart) front.appendChild(el('span', 'rmark', (isFav ? '⭐' : '') + (isStart ? '▶' : '')));
    front.appendChild(el('div', 'name', r.name));
    front.appendChild(el('p', 'desc', r.description));
    front.appendChild(el('div', 'meta', (r.total_min || r.minutes) + ' min · ' + R.dots(df.level)));
    front.appendChild(el('div', 'have', s.matched + ' of ' + s.n + ' in the pantry' + (s.flourishes ? ' · ✨ ' + s.flourishes : '') + (s.soon ? ' · use soon' : '')));
    (versions[r.id] || []).length && (function () {
      var lg = el('div', 'logos'); versions[r.id].forEach(function (v) { lg.appendChild(logo(v.version_by)); }); front.appendChild(lg);
    })();

    var back = el('div', 'face back');
    back.appendChild(el('div', 'name', r.name));
    back.appendChild(el('div', 'meta', 'Prep ' + (r.prep_min || 0) + ' · wait ' + (r.wait_min || 0) + ' · cook ' + (r.cook_min || 0) + ' · total ' + (r.total_min || r.minutes) + ' min'));
    var why = df.parts.map(function (p) { return p.k + ' ' + p.s; }).join(', ');
    var dm = el('div', 'meta'); dm.appendChild(el('span', 'dots', R.dots(df.level))); dm.appendChild(document.createTextNode(' difficulty ' + df.score + ' (' + why + ')'));
    back.appendChild(dm);
    if ((r.equipment || []).length) back.appendChild(el('div', 'meta', 'Needs: ' + r.equipment.join(', ')));
    back.appendChild(listBlock('Base', r.ingredients));
    var fl = r.flourishes || [];
    var arom = fl.filter(function (f) { return f.role === 'aromatic'; }), rest = fl.filter(function (f) { return f.role !== 'aromatic'; });
    back.appendChild(listBlock('Aromatics', arom, true));
    back.appendChild(listBlock('Flourishes', rest, true));
    var have = fl.filter(function (f) { return f.have; })[0];
    if (have) back.appendChild(el('p', 'tipline', '✨ ' + have.name + ': ' + have.tip));
    if (isStart && r.steps && r.steps.length) {
      back.appendChild(el('h4', '', 'Steps'));
      var ol = el('ol', 'steps');
      r.steps.forEach(function (t) { ol.appendChild(el('li', '', t)); });
      back.appendChild(ol);
    } else if (r.steps && r.steps.length) {
      back.appendChild(el('p', 'meta', 'Start it to see the steps.'));
    }
    var btns = el('div', 'btns');
    var b1 = el('button', '', isFav ? '⭐ Favourite' : '☆ Favourite'); b1.type = 'button';
    b1.addEventListener('click', function (e) { e.stopPropagation(); toggle(fav, KEY_FAV, r.id); render(); reopen(r.id); share(r); });
    var b2 = el('button', '', isStart ? '▶ Started' : '▷ Start this'); b2.type = 'button';
    b2.addEventListener('click', function (e) { e.stopPropagation(); toggle(started, KEY_START, r.id); render(); reopen(r.id); share(r); });
    var a = el('a', '', '🔎 See versions'); a.href = googleUrl(r.name); a.target = '_blank'; a.rel = 'noopener';
    a.addEventListener('click', function (e) { e.stopPropagation(); });
    var b3 = el('button', '', 'Back'); b3.type = 'button';
    b3.addEventListener('click', function (e) { e.stopPropagation(); flip.classList.remove('open'); });
    btns.appendChild(b1); btns.appendChild(b2); btns.appendChild(a); btns.appendChild(b3);
    back.appendChild(btns);
    // After cooking: how hard was it? This is the personal part of the difficulty.
    back.appendChild(el('h4', '', 'Cooked it?'));
    var cf = el('div', 'cform');
    var hs = document.createElement('select'); hs.setAttribute('aria-label', 'How hard was it');
    [['', 'How hard? (1 easy – 5 hard)'], ['1', '1 easy'], ['2', '2'], ['3', '3'], ['4', '4'], ['5', '5 hard']].forEach(function (o) { var op = el('option', '', o[1]); op.value = o[0]; hs.appendChild(op); });
    var cb = el('button', '', '🍳 Cooked it today'); cb.type = 'button';
    [hs, cb].forEach(function (x) { x.addEventListener('click', function (e) { e.stopPropagation(); }); });
    cb.addEventListener('click', function () {
      trials.push({ id: r.id, on: todayIso(), hard: +hs.value || 0 });
      writeList(KEY_TRIALS, trials); render(); reopen(r.id);
    });
    cf.appendChild(hs); cf.appendChild(cb); back.appendChild(cf);
    var last = R.lastCooked(trials, r.id);
    if (last) back.appendChild(el('p', 'meta', 'Last cooked ' + last + '.'));
    if (isStart) back.appendChild(versionBlock(r));

    inner.appendChild(front); inner.appendChild(back); flip.appendChild(inner);
    flip.addEventListener('click', function () { flip.classList.toggle('open'); });
    return flip;
  }
  function todayIso() { var d = new Date(); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }

  // Keep the card turned over after a re-render, so the steps show at once.
  function reopen(id) { var el = document.querySelector('.flip[data-id="' + id + '"]'); if (el) el.classList.add('open'); }

  // ---- family database: favourites and starts are rows in wtc_recipes, keyed by "explore:<id>" in notes.
  // Start = wish (on the list to cook). Device copy first; the database wins when it has a row.
  var DB = window.WTCDb, remote = {};
  function setSave(msg) { $('saveState').textContent = msg; }
  function setIn(list, id, on) { var at = list.indexOf(id); if (on && at === -1) list.push(id); if (!on && at !== -1) list.splice(at, 1); }
  function saveRemote(r) {
    if (!DB || !DB.session()) return Promise.resolve();
    var body = { favourite: fav.indexOf(r.id) !== -1, wish: started.indexOf(r.id) !== -1, updated_at: new Date().toISOString() };
    // The family version is the starting point; other versions are tweaks with a person's name.
    var row = remote[r.id];
    if (row) return DB.patch('wtc_recipes', 'id=eq.' + row.id, body).then(function () { row.favourite = body.favourite; row.wish = body.wish; });
    body.name = r.name;
    body.dish = r.name;
    body.version_by = 'Family';
    body.notes = 'explore:' + r.id + ' (from the recipe book, explore)';
    return DB.insert('wtc_recipes', [body]).then(function (res) {
      var made = res.data && res.data[0];
      if (!made) return;
      remote[r.id] = made;
      return linkIngredients(r, made.id);
    });
  }
  // ---- versions: a tweak by one person, shown with their letter on the card's corner ----
  var PEOPLE = [{ name: 'Jimmy', color: '#ffd166' }, { name: 'Ying', color: '#bfeee0' },
                { name: 'Athena', color: '#ffc9a8' }, { name: 'Felix', color: '#cfe8c9' }];
  var versions = {};   // explore id -> wtc_recipes rows that are not the family version
  function logo(who) {
    var p = PEOPLE.filter(function (x) { return x.name === who; })[0] || { name: who || '?', color: '#e3d9ff' };
    var el = document.createElement('span'); el.className = 'logo'; el.style.background = p.color;
    el.textContent = String(p.name).charAt(0).toUpperCase(); el.title = p.name + "'s version";
    return el;
  }
  function tweakOf(row) { var t = String(row.notes || ''); var at = t.indexOf('tweak: '); return at === -1 ? '' : t.slice(at + 7); }
  function versionBlock(r) {
    var box = document.createElement('div');
    var vs = versions[r.id] || [];
    if (vs.length) {
      var ul = document.createElement('ul'); ul.className = 'versions';
      vs.forEach(function (v) {
        var li = document.createElement('li'); li.appendChild(logo(v.version_by));
        var t = document.createElement('span'); t.textContent = v.version_by + ': ' + (tweakOf(v) || 'own version'); li.appendChild(t);
        ul.appendChild(li);
      });
      box.appendChild(ul);
    }
    if (!DB || !DB.session() || !remote[r.id]) {
      var hint = document.createElement('p'); hint.className = 'meta';
      hint.textContent = DB && DB.session() ? 'Saving the family version first…' : 'Sign in on the Pantry page to add your own version.';
      box.appendChild(hint);
      return box;
    }
    var form = document.createElement('div'); form.className = 'vform';
    var who = document.createElement('select'); who.setAttribute('aria-label', 'Whose version');
    PEOPLE.forEach(function (p) { var o = document.createElement('option'); o.value = p.name; o.textContent = p.name; who.appendChild(o); });
    var tweak = document.createElement('input'); tweak.type = 'text'; tweak.placeholder = 'The tweak (for example: extra chili)'; tweak.setAttribute('aria-label', 'The tweak');
    var add = document.createElement('button'); add.type = 'button'; add.textContent = '+ Add a version';
    [who, tweak, add].forEach(function (el) { el.addEventListener('click', function (e) { e.stopPropagation(); }); });
    add.addEventListener('click', function () {
      var text = tweak.value.trim();
      if (!text) { setSave('Write the tweak first.'); return; }
      addVersion(r, who.value, text);
    });
    form.appendChild(who); form.appendChild(tweak); form.appendChild(add);
    box.appendChild(form);
    return box;
  }
  function addVersion(r, who, text) {
    setSave('Saving…');
    DB.insert('wtc_recipes', [{ name: r.name + ' (' + who + ')', dish: r.name, version_by: who, wish: true, favourite: false,
      notes: 'explore:' + r.id + ' tweak: ' + text.slice(0, 300) }]).then(function (res) {
      var made = res.data && res.data[0];
      if (made) (versions[r.id] = versions[r.id] || []).push(made);
      render(); reopen(r.id);
      setSave(who + "'s version saved.");
    }, function (e) { setSave('Version not saved: ' + DB.explain(e)); });
  }

  // ---- ingredients: when a recipe is started, its ingredients are saved, each linked to the food list ----
  var foodsCache = null;
  function loadFoods() {
    if (foodsCache) return Promise.resolve(foodsCache);
    return DB.select('wtc_foods', 'select=id,name').then(function (res) { foodsCache = res.data || []; return foodsCache; });
  }
  function linkIngredients(r, recipeId) {
    return loadFoods().then(function (foods) {
      var rows = r.ingredients.map(function (ing, i) {
        var k = String(ing.match || '').toLowerCase();
        var food = foods.filter(function (f) { return String(f.name || '').toLowerCase().indexOf(k) !== -1; })[0];
        return { recipe_id: recipeId, name: ing.name, sort: i, food_id: food ? food.id : null };
      });
      return rows.length ? DB.insert('wtc_recipe_ingredients', rows) : null;
    });
  }

  function share(r) {
    if (!DB || !DB.session()) { setSave('Kept on this device. Sign in on the Pantry page to share with the family.'); return; }
    setSave('Saving…');
    saveRemote(r).then(function () { setSave('Saved to the family database.'); render(); if (started.indexOf(r.id) !== -1) reopen(r.id); },
      function (e) { setSave('Not saved to the family database: ' + DB.explain(e) + ' This device keeps it.'); });
  }
  function loadRemote() {
    if (!DB || !DB.session()) { setSave('Favourites and starts are kept on this device. Sign in on the Pantry page to share them.'); return; }
    DB.select('wtc_recipes', 'select=id,name,favourite,wish,notes,dish,version_by&notes=like.' + encodeURIComponent('explore:') + '*').then(function (res) {
      (res.data || []).forEach(function (row) {
        var key = String(row.notes || '').split(' ')[0];
        if (key.indexOf('explore:') !== 0) return;
        var id = key.slice(8);
        if ((row.version_by || 'Family') === 'Family') remote[id] = row;
        else (versions[id] = versions[id] || []).push(row);
      });
      var pushes = [];
      recipes.forEach(function (r) {
        var row = remote[r.id];
        if (row) { setIn(fav, r.id, !!row.favourite); setIn(started, r.id, !!row.wish); }
        else if (fav.indexOf(r.id) !== -1 || started.indexOf(r.id) !== -1) pushes.push(r);
      });
      writeList(KEY_FAV, fav); writeList(KEY_START, started);
      render();
      return pushes.reduce(function (p, r) { return p.then(function () { return saveRemote(r); }); }, Promise.resolve());
    }).then(function () { setSave('Shared with the family database.'); },
      function (e) { setSave('Could not reach the family database: ' + DB.explain(e) + ' Showing this device.'); });
  }

  function toggle(list, key, id) {
    var at = list.indexOf(id);
    if (at === -1) list.push(id); else list.splice(at, 1);
    writeList(key, list);
  }

  function passes(r) {
    if (filter === 'fav') return fav.indexOf(r.id) !== -1;
    if (filter === 'started') return started.indexOf(r.id) !== -1;
    return true;
  }
  function family(c) { return String(c || '').split(':')[0].replace(/\s*\(.*\)/, ''); }

  function shelf(book, key, title, list, openDefault) {
    if (!list.length) return;
    var d = document.createElement('details'); d.className = 'shelf'; d.dataset.key = key;
    d.open = shelfOpen[key] === undefined ? openDefault : !!shelfOpen[key];
    var sm = el('summary', '', title + ' '); sm.appendChild(el('span', 'count', '(' + list.length + ')')); d.appendChild(sm);
    var strip = el('div', 'strip');
    list.forEach(function (x) { strip.appendChild(card(x.r, x.i, x.sum)); });
    d.appendChild(strip);
    d.addEventListener('toggle', function () { shelfOpen[key] = d.open; WTCStore.write(KEY_SHELF, shelfOpen); });
    book.appendChild(d);
  }

  function renderList(book, rows) {
    book.classList.add('list');
    rows.sort(function (a, b) { return a.r.name < b.r.name ? -1 : 1; });
    rows.forEach(function (x) {
      var wrap = document.createElement('div');
      var b = el('button', 'lrow'); b.type = 'button';
      b.appendChild(el('span', 'grow', x.r.name));
      b.appendChild(el('span', 'meta', (x.r.total_min || x.r.minutes) + ' min'));
      b.appendChild(el('span', 'dots', R.dots(x.diff.level)));
      b.appendChild(el('span', 'meta', x.sum.matched + '/' + x.sum.n));
      var open = null;
      b.addEventListener('click', function () {
        if (open) { open.remove(); open = null; return; }
        open = card(x.r, x.i, x.sum); open.classList.add('open'); wrap.appendChild(open);
      });
      wrap.appendChild(b); book.appendChild(wrap);
    });
  }

  function render() {
    var book = $('book'); book.textContent = ''; book.classList.remove('list');
    var stock = inStock();
    var all = recipes.map(function (r, i) {
      var sum = R.summary(r, stock), diff = R.difficulty(r, R.personalOf(trials, r.id));
      return { r: r, i: i, sum: sum, diff: diff };
    });
    $('cAll').textContent = all.length;
    $('cFav').textContent = all.filter(function (x) { return fav.indexOf(x.r.id) !== -1; }).length;
    $('cStart').textContent = all.filter(function (x) { return started.indexOf(x.r.id) !== -1; }).length;
    var shown = all.filter(function (x) { return passes(x.r); });
    if (view === 'list') renderList(book, shown.slice());
    else {
      var by = function (f) { return shown.filter(f).sort(function (a, b) { return R.byShelf(a, b); }); };
      shelf(book, 'ready', '✅ Ready now', by(function (x) { return x.sum.ready; }), true);
      shelf(book, 'one', 'Missing one thing', by(function (x) { return !x.sum.ready && x.sum.missing.length === 1; }), true);
      shelf(book, 'soon', '⏰ Use-soon rescues', by(function (x) { return x.sum.soon; }), false);
      shelf(book, 'quick', 'Quick (30 min or less)', by(function (x) { return (x.r.total_min || x.r.minutes) <= 30; }), false);
      var fams = {};
      shown.forEach(function (x) { var f = family(x.r.cuisine); (fams[f] = fams[f] || []).push(x); });
      var names = Object.keys(fams).sort();
      if (names.length) book.appendChild(el('p', 'shelflabel', 'By cuisine'));
      names.forEach(function (f) { shelf(book, 'c:' + f, f, fams[f].sort(function (a, b) { return R.byShelf(a, b); }), false); });
    }
    $('empty').hidden = shown.length > 0;
  }

  document.querySelectorAll('#tab-recipes .chip[data-filter]').forEach(function (b) {
    b.addEventListener('click', function () {
      filter = b.dataset.filter;
      document.querySelectorAll('#tab-recipes .chip[data-filter]').forEach(function (x) { x.classList.toggle('on', x === b); });
      render();
    });
  });
  document.querySelectorAll('#tab-recipes .chip[data-view]').forEach(function (b) {
    b.addEventListener('click', function () { setView(b.dataset.view); render(); });
  });
  function setView(v) {
    view = v; WTCStore.write(KEY_VIEW, v);
    document.querySelectorAll('#tab-recipes .chip[data-view]').forEach(function (x) { x.classList.toggle('on', x.dataset.view === v); });
  }

  // Open one card, turned over, from anywhere (Prep, Week, or a link).
  function openRecipe(id) {
    if (!id) return;
    var f = document.querySelector('.flip[data-id="' + id + '"]');
    if (!f && (view === 'list' || filter !== 'all')) {
      // The card is hidden by the list view or a filter: show everything as shelves so it can open.
      filter = 'all'; setView('shelves');
      document.querySelectorAll('#tab-recipes .chip[data-filter]').forEach(function (x) { x.classList.toggle('on', x.dataset.filter === 'all'); });
      render(); f = document.querySelector('.flip[data-id="' + id + '"]');
    }
    if (!f) return;
    var d = f.closest('details'); if (d) d.open = true;
    f.classList.add('open'); f.scrollIntoView({ block: 'center', inline: 'center' });
  }
  var pendingOpen = '';
  WTC.openRecipe = function (id) {
    WTC.showTab('recipes');
    if (ready) { render(); openRecipe(id); } else pendingOpen = id;
  };
  var ready = false, remoteDone = false;
  if (WTC.startHash.indexOf('recipes') === 0) { var hid = WTC.startHash.split(':')[1]; WTC.showTab('recipes'); pendingOpen = hid || '__none__'; }
  document.querySelector('.tab[data-tab="recipes"]').addEventListener('click', function () {
    items = WTC.state.items; if (ready) render();
    if (ready && !remoteDone && DB && DB.session()) { remoteDone = true; loadRemote(); }
  });

  fetch('recipes_explore.json').then(function (res) { return res.json(); }).then(function (data) {
    recipes = data.recipes || [];
    items = (window.WTC && WTC.state && WTC.state.items) || [];
    fav = readList(KEY_FAV);
    started = readList(KEY_START);
    trials = readList(KEY_TRIALS);
    var sh = WTCStore.read(KEY_SHELF, {}); shelfOpen = sh && typeof sh === 'object' ? sh : {};
    setView(WTCStore.read(KEY_VIEW, 'shelves') === 'list' ? 'list' : 'shelves');
    ready = true;
    render();
    if (pendingOpen && pendingOpen !== '__none__') openRecipe(pendingOpen);
    pendingOpen = '';
    if (DB && DB.session()) { remoteDone = true; loadRemote(); }
  }).catch(function () {
    $('empty').hidden = false;
    $('empty').textContent = 'Could not load the recipe list. Open this page from the nursery site.';
  });
})();
