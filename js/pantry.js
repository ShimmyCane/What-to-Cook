/* What to Cook — the pantry screen: stock cards, check-ins, the predicted index, feedback and swipe. */
(function (root) {
  'use strict';
  var WTC = root.WTC;
  var $ = WTC.$, read = WTC.read, write = WTC.write, uid = WTC.uid, find = WTC.find, touch = WTC.touch,
    persist = WTC.persist, reportError = WTC.reportError;
  var today = WTC.today, todayIso = WTC.todayIso, parseDay = WTC.parseDay, daysBetween = WTC.daysBetween,
    nowIso = WTC.nowIso, round1 = WTC.round1, round2 = WTC.round2;
  var items = WTC.state.items, checks = WTC.state.checks, members = WTC.state.members;

  function whoChecks() { return $('member').value || members[0]; }

  // ---- expiry and the predicted index ----
  function daysUntilExpiry(item) {
    var e = parseDay(item.expires_on);
    return e ? daysBetween(today(), e) : null;
  }
  function expiryState(item) {
    var d = daysUntilExpiry(item);
    if (d == null) return 'none';
    if (d < 0) return 'past';
    if (d <= 3) return 'soon';
    return 'ok';
  }
  // Predicted remaining = quantity at the last count, minus the daily rate times the days since.
  function predict(item) {
    if (item.quantity == null || !item.daily_rate || !item.counted_on) return null;
    var days = Math.max(0, daysBetween(parseDay(item.counted_on), today()));
    var left = Math.max(0, item.quantity - item.daily_rate * days);
    var pct = item.quantity > 0 ? Math.round(100 * left / item.quantity) : 0;
    return { left: round1(left), pct: pct, days: days };
  }
  function inCleanup(item) {
    if (item.status !== 'in_stock') return false;
    if (item.reviewed_on === todayIso()) return false;
    var s = expiryState(item);
    return s === 'soon' || s === 'past';
  }
  function byExpiry(a, b) {
    var da = daysUntilExpiry(a), db = daysUntilExpiry(b);
    return (da == null ? 1e9 : da) - (db == null ? 1e9 : db);
  }
  function cleanupItems() { return items.filter(inCleanup).sort(byExpiry); }
  // Low-priority items (eggs, bread, wines) sit on their own list and are revisited now and then.
  // The tracking column is used once it exists; until then the "LOW PRIORITY" note marks them.
  function isLow(item) {
    if (item.tracking) return item.tracking === 'low';
    return /^LOW PRIORITY/i.test(item.notes || '');   // rows from before the tracking column
  }
  // How often a food is used: lines bought with the same name, plus check-ins on them.
  function useCounts() {
    var keyOf = {}, counts = {};
    items.forEach(function (it) { var k = WTC.norm(it.name); keyOf[it.id] = k; counts[k] = (counts[k] || 0) + 1; });
    checks.forEach(function (c) { var k = keyOf[c.item_id]; if (k) counts[k] = (counts[k] || 0) + 1; });
    return counts;
  }
  function byPriority(counts) {
    return function (a, b) {
      return (b.fav ? 1 : 0) - (a.fav ? 1 : 0) ||
        (counts[WTC.norm(b.name)] || 0) - (counts[WTC.norm(a.name)] || 0) ||
        a.name.localeCompare(b.name);
    };
  }
  // Kitchen groups: one per place. Lower-priority items sit inside their place, after the priority ones.
  var GROUPS = [['fridge', '🧊', 'Fridge'], ['freezer', '❄️', 'Freezer'], ['pantry', '🥫', 'Pantry'],
                ['kitchen', '🍳', 'Kitchen (tools, space)'], ['other', '📦', 'Unsorted']];
  var groupOpen = {};
  function placeOf(it) { return ['fridge', 'freezer', 'pantry', 'kitchen'].indexOf(it.stored_location) !== -1 ? it.stored_location : 'other'; }
  function matches(it, q) {
    if (!q) return true;
    return [it.name, it.category, it.notes].join(' ').toLowerCase().indexOf(q) !== -1;
  }
  function inGroups(q) {
    return items.filter(function (it) { return it.status === 'in_stock' && !inCleanup(it) && matches(it, q); });
  }
  function byGroup(counts) {
    var pri = byPriority(counts);
    return function (a, b) {
      var ca = a.category || '~', cb = b.category || '~';
      return ca.localeCompare(cb) || (isLow(a) ? 1 : 0) - (isLow(b) ? 1 : 0) || pri(a, b);
    };
  }
  function describe(item) {
    var bits = [];
    if (item.quantity != null) bits.push(round1(item.quantity) + (item.unit ? ' ' + item.unit : ''));
    if (item.stored_location) bits.push(item.stored_location === 'other' ? 'unsorted' : item.stored_location);
    if (isLow(item)) bits.push('lower priority');
    var p = predict(item);
    if (p) bits.push('about ' + p.left + ' left (' + p.pct + '%, a guess)');
    var d = daysUntilExpiry(item);
    if (d != null) bits.push(d < 0 ? 'past its date' : d === 0 ? 'use today' : 'use by ' + item.expires_on);
    return bits.join(' · ');
  }
  // ---- rendering ----
  function renderAll(openId) {
    renderCleanup();
    renderGroups();
    if (openId) openCard(openId);
  }

  function renderCleanup() {
    var list = cleanupItems();
    var ul = $('cleanup');
    ul.textContent = '';
    list.forEach(function (it) { ul.appendChild(card(it, true)); });
    $('cleanCount').textContent = String(list.length);
    $('cleanEmpty').hidden = list.length > 0;
    $('cleanupPanel').dataset.collapsed = list.length ? 'false' : 'true';
    $('cleanupPanel').querySelector('.mark').textContent = list.length ? '▾' : '▸';
  }

  function renderGroups() {
    var box = $('groups'), q = ($('kitchenSearch').value || '').trim().toLowerCase();
    box.textContent = '';
    var pool = inGroups(q), counts = useCounts(), any = false;
    GROUPS.forEach(function (g) {
      var list = pool.filter(function (it) { return placeOf(it) === g[0]; }).sort(byGroup(counts));
      if (!list.length) return;
      any = true;
      var open = q ? true : !!groupOpen[g[0]];
      var sec = document.createElement('section');
      sec.className = 'panel'; sec.dataset.panel = 'g-' + g[0]; sec.dataset.collapsed = String(!open);
      sec.innerHTML = '<button class="panelHead" type="button"><span></span><span class="grow"></span><span class="mark"></span></button><div class="panelBody"><ul class="cards"></ul></div>';
      var head = sec.querySelector('.panelHead');
      head.setAttribute('aria-expanded', String(open));
      head.children[0].textContent = g[1]; head.children[1].textContent = g[2] + ' (' + list.length + ')';
      head.children[2].textContent = open ? '▾' : '▸';
      head.addEventListener('click', function () {
        var now = sec.dataset.collapsed === 'true';   // opening
        groupOpen[g[0]] = now; sec.dataset.collapsed = String(!now);
        head.setAttribute('aria-expanded', String(now)); head.children[2].textContent = now ? '▾' : '▸';
      });
      var ul = sec.querySelector('.cards'), last = null;
      list.forEach(function (it) {
        var cat = it.category || 'Uncategorised';
        if (cat !== last) { var h = document.createElement('li'); h.className = 'catHead'; h.textContent = cat; ul.appendChild(h); last = cat; }
        ul.appendChild(card(it, false));
      });
      box.appendChild(sec);
    });
    $('groupsEmpty').hidden = any;
    $('groupsEmpty').textContent = q ? 'Nothing matches that search.' : 'Nothing in stock here. Use 🎙️ Add.';
  }

  function card(it, cleanup) {
    var li = document.createElement('li');
    li.className = 'card' + (cleanup ? ' clean' : '') + (it.fav ? ' fav' : '');
    li.dataset.id = it.id;
    li.innerHTML =
      '<span class="hintSwipe l">Ate / tossed ←</span>' +
      '<span class="hintSwipe r">→ Remain</span>' +
      '<div class="head"><span class="star"></span><span class="name"></span></div>' +
      '<div class="meta"></div>' +
      '<div class="choice" hidden>' +
        '<button type="button" class="tiny" data-act="ate">✅ Ate it</button>' +
        '<button type="button" class="tiny warm" data-act="tossed">🗑️ Tossed</button>' +
        '<button type="button" class="tiny" data-act="back">Back</button>' +
      '</div>' +
      '<div class="acts"></div>' +
      '<details><summary>Details and quantity</summary><div class="form"></div></details>';
    li.querySelector('.star').textContent = it.fav ? '⭐' : '☆';
    li.querySelector('.name').textContent = it.name;
    li.querySelector('.meta').textContent = describe(it) || 'no details yet';

    var acts = li.querySelector('.acts');
    if (it.daily_rate && it.quantity != null) {
      [['ate_more', 'Ate more'], ['ate_about_right', 'About right'], ['ate_less', 'Ate less']].forEach(function (pair) {
        var b = document.createElement('button');
        b.type = 'button'; b.className = 'tiny'; b.dataset.fb = pair[0]; b.textContent = pair[1];
        acts.appendChild(b);
      });
    } else {
      var hint = document.createElement('span');
      hint.className = 'hint';
      hint.textContent = 'Set "Eats per day" in Details for a guess.';
      acts.appendChild(hint);
    }

    var f = li.querySelector('.form');
    f.innerHTML =
      '<div class="pair">' +
        '<label>Quantity<input type="number" step="any" inputmode="decimal" class="fq"></label>' +
        '<label>Unit<input type="text" class="fu" list="units" autocomplete="off"></label>' +
      '</div>' +
      '<div class="pair">' +
        '<label>Eats per day<input type="number" step="any" inputmode="decimal" class="fr" placeholder="e.g. 5"></label>' +
        '<label>Expiry date<input type="date" class="fe"></label>' +
      '</div>' +
      '<label>Place<select class="fp"><option value="fridge">Fridge</option><option value="pantry">Pantry</option><option value="freezer">Freezer</option><option value="kitchen">Kitchen</option><option value="other">Unsorted</option></select></label>' +
      '<label>Tracking<select class="ft"><option value="priority">Priority</option><option value="low">Lower priority (revisit now and then)</option></select></label>' +
      '<label>Notes<textarea class="fn" rows="2"></textarea></label>' +
      '<div class="row wrap">' +
        '<button type="button" class="primary" data-save="stay">Save</button>' +
        (cleanup ? '<button type="button" class="primary" data-save="next">Save and next ▸</button>' : '') +
      '</div>';
    f.querySelector('.fq').value = it.quantity == null ? '' : String(it.quantity);
    f.querySelector('.fu').value = it.unit || '';
    f.querySelector('.fr').value = it.daily_rate == null ? '' : String(it.daily_rate);
    f.querySelector('.fe').value = it.expires_on || '';
    f.querySelector('.fp').value = ['fridge', 'pantry', 'freezer', 'kitchen', 'other'].indexOf(it.stored_location) !== -1 ? it.stored_location : 'other';
    f.querySelector('.fn').value = it.notes || '';
    f.querySelector('.ft').value = isLow(it) ? 'low' : 'priority';

    attachSwipe(li, it.id);
    return li;
  }

  function openCard(id) {
    var el = document.querySelector('.card[data-id="' + id + '"]');
    if (!el) return;
    var grp = el.closest('.panel');   // open its group if it is folded
    if (grp && grp.dataset.collapsed === 'true') { var h = grp.querySelector('.panelHead'); if (h) h.click(); }
    el.querySelector('details').open = true;
    el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    var fq = el.querySelector('.fq');
    if (fq) fq.focus();
  }
  // ---- actions ----
  function checkIn(itemId, action) {
    var item = find(itemId);
    if (!item) { reportError('Item not found: ' + itemId); return; }
    checks.push({ id: uid('c'), item_id: itemId, action: action, member: whoChecks(), at: nowIso(), synced: false });
    if (action === 'ate') item.status = 'eaten';
    if (action === 'tossed') item.status = 'tossed';
    if (action === 'kept') item.reviewed_on = todayIso();
    touch(item);
    persist();
    renderAll();
  }

  function toggleFav(itemId) {
    var item = find(itemId);
    if (!item) return;
    item.fav = !item.fav;
    touch(item);
    persist();
    renderAll();
  }

  // Feedback on the predicted index: the guess becomes the new count, and the rate moves.
  function feedback(itemId, kind) {
    var item = find(itemId);
    if (!item) return;
    if (item.quantity == null || !item.daily_rate) { reportError('Enter a quantity and "Eats per day" in Details first.'); return; }
    var p = predict(item);
    if (p) { item.quantity = p.left; item.counted_on = todayIso(); }
    if (kind === 'ate_more') item.daily_rate = round2(item.daily_rate * 1.25);
    if (kind === 'ate_less') item.daily_rate = round2(item.daily_rate * 0.8);
    checks.push({ id: uid('c'), item_id: itemId, action: kind, member: whoChecks(), at: nowIso(), synced: false });
    touch(item);
    persist();
    renderAll(itemId);
  }

  function saveForm(li, item, goNext) {
    var nextId = null;
    if (goNext) {
      var list = cleanupItems().map(function (it) { return it.id; });
      var idx = list.indexOf(item.id);
      nextId = idx >= 0 ? list[idx + 1] || null : null;
    }
    var f = li.querySelector('.form');
    var q = parseFloat(f.querySelector('.fq').value);
    var newQ = isNaN(q) ? null : q;
    if (newQ !== item.quantity) { item.quantity = newQ; item.counted_on = todayIso(); }
    item.unit = f.querySelector('.fu').value.trim();
    var r = parseFloat(f.querySelector('.fr').value);
    item.daily_rate = isNaN(r) || r < 0 ? null : r;
    if (item.daily_rate != null && !item.counted_on) item.counted_on = todayIso();
    item.expires_on = f.querySelector('.fe').value || null;
    item.stored_location = f.querySelector('.fp').value;
    item.notes = f.querySelector('.fn').value.trim();
    item.tracking = f.querySelector('.ft').value;
    touch(item);
    persist();
    renderAll(goNext ? nextId : item.id);
    if (goNext && !nextId) {
      $('cleanHint').hidden = false;
      $('cleanHint').textContent = 'That was the last one in Use soon. ✅';
    }
  }

  // ---- swipe: left = ate or tossed (choose), right = remain, tap = favourite ----
  function attachSwipe(li, itemId) {
    var startX = null, dx = 0, pid = null;
    li.addEventListener('pointerdown', function (e) {
      if (e.target.closest('button, input, select, textarea, summary, details, label')) return;
      startX = e.clientX; dx = 0; pid = e.pointerId;
      try { li.setPointerCapture(pid); } catch (err) { /* older browsers: swipe still works without capture */ }
    });
    li.addEventListener('pointermove', function (e) {
      if (startX == null || e.pointerId !== pid) return;
      dx = e.clientX - startX;
      li.style.transform = 'translateX(' + Math.max(-120, Math.min(120, dx)) + 'px)';
      li.querySelector('.hintSwipe.l').style.opacity = dx < -40 ? 1 : 0;
      li.querySelector('.hintSwipe.r').style.opacity = dx > 40 ? 1 : 0;
    });
    function finish(e, cancelled) {
      if (startX == null || e.pointerId !== pid) return;
      var moved = dx;
      startX = null; pid = null;
      li.style.transform = '';
      li.querySelector('.hintSwipe.l').style.opacity = 0;
      li.querySelector('.hintSwipe.r').style.opacity = 0;
      if (cancelled) return;
      if (Math.abs(moved) < 10) toggleFav(itemId);
      else if (moved < -80) li.querySelector('.choice').hidden = false;
      else if (moved > 80) checkIn(itemId, 'kept');
    }
    li.addEventListener('pointerup', function (e) { finish(e, false); });
    li.addEventListener('pointercancel', function (e) { finish(e, true); });
  }

  // One listener for every card button, so new cards need no wiring.
  document.addEventListener('click', function (e) {
    var t = e.target;
    var el = t.closest ? t.closest('.card') : null;
    if (!el) return;
    if (t.dataset && t.dataset.act) {
      if (t.dataset.act === 'back') { el.querySelector('.choice').hidden = true; return; }
      checkIn(el.dataset.id, t.dataset.act);
      return;
    }
    if (t.dataset && t.dataset.fb) { feedback(el.dataset.id, t.dataset.fb); return; }
    if (t.dataset && t.dataset.save) {
      var item = find(el.dataset.id);
      if (item) saveForm(el, item, t.dataset.save === 'next');
    }
  });

  $('kitchenSearch').addEventListener('input', function () { renderGroups(); });
  WTC.on('pantry', function () { renderAll(); });
})(window);
