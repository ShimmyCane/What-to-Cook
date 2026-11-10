/* What to Cook — capture: paste or speak a list, review the sorted items, save them with the duplicate rule. */
(function (root) {
  'use strict';
  var WTC = root.WTC;
  var $ = WTC.$, uid = WTC.uid, nowIso = WTC.nowIso, todayIso = WTC.todayIso, norm = WTC.norm,
    touch = WTC.touch, persist = WTC.persist, reportError = WTC.reportError, showTab = WTC.showTab;
  var items = WTC.state.items, transcripts = WTC.state.transcripts, foods = WTC.state.foods;

  // The food list says how many days a food keeps in the fridge. Exact name first, then a close match.
  function findFood(name) {
    var n = norm(name);
    if (!n) return null;
    var hasDays = function (f) { return f.fridge_days !== null && f.fridge_days !== undefined && f.fridge_days !== '' && !isNaN(Number(f.fridge_days)); };
    var exact = foods.filter(function (f) { return norm(f.name) === n; });
    var pool = exact.length ? exact : foods.filter(function (f) {
      var fn = norm(f.name);
      return fn.length > 2 && (n.indexOf(fn) !== -1 || fn.indexOf(n) !== -1);
    });
    return pool.filter(function (f) { return f.location === 'fridge' && hasDays(f); })[0] ||
      pool.filter(hasDays)[0] || null;
  }
  function addDays(iso, n) { var d = WTC.parseDay(iso); d.setDate(d.getDate() + Math.round(n)); return WTC.isoDay(d); }
  // Stamp on entry: the day it went in, and (for the fridge) an expiry from the food list, marked as a guess.
  function fridgeStamp(d, day) {
    var food = findFood(d.name);
    var days = food ? Number(food.fridge_days) : null;
    var out = { days: days, expires_on: d.expires_on || null, note: '' };
    if (!out.expires_on && days !== null && (d.stored_location || 'pantry') === 'fridge') {
      out.expires_on = addDays(day, days);
      out.note = 'Expiry from the food list: keeps about ' + days + ' days in the fridge (?).';
    }
    return out;
  }
  var draft = [];


  // ---- capture: sort a transcript into draft items, then save with duplicate rules ----
  function findDuplicate(name, expiresOn, place) {
    return items.find(function (it) {
      return it.status === 'in_stock' && norm(it.name) === norm(name) &&
        (it.expires_on || null) === (expiresOn || null) && it.stored_location === place;
    }) || null;
  }

  $('parse').addEventListener('click', function () {
    var source = $('source').value;
    var parsed = window.WTCParse.parseTranscript($('transcript').value);
    draft = parsed.map(function (d) {
      return Object.assign({ keep: true, expires_on: null, source: source }, d);
    });
    if (!draft.length) { reportError('Nothing to sort. Paste or type something first.'); $('review').hidden = true; return; }
    renderDraft();
    $('review').hidden = false;
  });

  function renderDraft() {
    var list = $('draft');
    list.textContent = '';
    draft.forEach(function (d, idx) {
      var li = document.createElement('li');
      li.className = 'card';
      li.innerHTML =
        '<div class="draft-row">' +
          '<label class="check"><input type="checkbox" class="keep"> keep</label>' +
          '<input type="text" class="dname" aria-label="Name">' +
          '<input type="number" step="any" inputmode="decimal" class="dqty" aria-label="Quantity">' +
          '<select class="dunit" aria-label="Unit"></select>' +
          '<select class="dkind" aria-label="Kind"><option>dry</option><option>wet</option><option>tool</option><option>space</option></select>' +
          '<select class="dplace" aria-label="Place"><option>fridge</option><option>pantry</option><option>freezer</option><option>other</option></select>' +
          '<input type="date" class="dexp" aria-label="Expiry date">' +
        '</div><div class="meta"></div>';
      li.querySelector('.keep').checked = d.keep;
      li.querySelector('.dname').value = d.name;
      li.querySelector('.dqty').value = d.quantity == null ? '' : String(d.quantity);
      var unit = li.querySelector('.dunit');
      ['', 'g', 'kg', 'ml', 'l', 'cup', 'tin', 'bag', 'box', 'pack', 'bottle', 'loaf', 'bunch', 'clove', 'slice', 'pot', 'tub', 'each'].forEach(function (u) {
        var o = document.createElement('option'); o.value = u; o.textContent = u || '(no unit)'; unit.appendChild(o);
      });
      unit.value = d.unit || '';
      li.querySelector('.dkind').value = d.kind;
      li.querySelector('.dplace').value = d.stored_location;
      li.querySelector('.dexp').value = d.expires_on || '';
      var dup = findDuplicate(d.name, d.expires_on, d.stored_location);
      var food = findFood(d.name);
      li.querySelector('.meta').textContent = 'from: "' + d.raw + '" · ' +
        (dup ? 'already in the pantry, will update that line' : 'new line') +
        (food ? ' · keeps about ' + Number(food.fridge_days) + ' days in the fridge' : '');

      li.querySelector('.keep').addEventListener('change', function (e) { draft[idx].keep = e.target.checked; });
      li.querySelector('.dname').addEventListener('input', function (e) { draft[idx].name = e.target.value; });
      li.querySelector('.dqty').addEventListener('input', function (e) {
        var n = parseFloat(e.target.value); draft[idx].quantity = isNaN(n) ? null : n;
      });
      unit.addEventListener('change', function (e) { draft[idx].unit = e.target.value; });
      li.querySelector('.dkind').addEventListener('change', function (e) { draft[idx].kind = e.target.value; });
      li.querySelector('.dplace').addEventListener('change', function (e) { draft[idx].stored_location = e.target.value; });
      li.querySelector('.dexp').addEventListener('change', function (e) { draft[idx].expires_on = e.target.value || null; });
      list.appendChild(li);
    });
  }

  $('save').addEventListener('click', function () {
    var keep = draft.filter(function (d) { return d.keep && d.name; });
    if (!keep.length) { reportError('Nothing ticked to save.'); return; }
    var now = nowIso(), day = todayIso(), added = 0, updated = 0;
    keep.forEach(function (d) {
      var dup = findDuplicate(d.name, d.expires_on, d.stored_location);
      if (dup) {
        if (d.quantity != null) dup.quantity = d.quantity;
        if (d.unit) dup.unit = d.unit;
        dup.kind = d.kind;
        dup.category = d.category || dup.category;
        dup.counted_on = day;
        dup.raw_text = d.raw;
        dup.source = d.source;
        touch(dup);
        updated++;
      } else {
        var stamp = fridgeStamp(d, day);
        items.push({
          id: uid('i'), name: d.name, kind: d.kind, category: d.category || '', subcategory: '',
          quality: d.quality || 'unknown', quantity: d.quantity, unit: d.unit || '', servings_left: null,
          expires_on: stamp.expires_on, freshness: 'unknown', stored_location: d.stored_location || 'pantry',
          purchase_cost: null, notes: [d.notes || '', stamp.note].filter(Boolean).join(' '), status: 'in_stock', source: d.source,
          raw_text: d.raw, purchased_on: day, counted_on: day, daily_rate: null,
          fav: false, reviewed_on: null, stamped_on: day, fridge_days: stamp.days, tracking: 'priority', created_at: now, updated_at: now, dirty: true, synced: false
        });
        added++;
      }
    });
    // The raw transcript is archived in full, whatever was saved.
    transcripts.push({
      id: uid('t'), text: $('transcript').value, method: $('source').value,
      parsed_count: keep.length, added: added, updated: updated, at: now, synced: false
    });
    persist();
    draft = [];
    $('transcript').value = '';
    $('review').hidden = true;
    renderDraft();
    WTC.emit('archive');
    $('saveNote').hidden = false;
    $('saveNote').textContent = 'Saved: ' + added + ' new, ' + updated + ' updated. The transcript is in the archive.';
    showTab('pantry');
    WTC.emit('pantry');
  });

  // Speech in, where the browser supports it. Typing always works.
  $('listen').addEventListener('click', function () {
    var Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
    var note = $('listenNote');
    if (!Rec) {
      note.hidden = false;
      note.textContent = 'Speech is not available in this browser. Type, or use the keyboard microphone.';
      return;
    }
    try {
      var rec = new Rec();
      rec.lang = 'en-GB'; rec.interimResults = false; rec.maxAlternatives = 1;
      note.hidden = false; note.textContent = 'Listening… say the list, then pause.';
      rec.onresult = function (ev) {
        var said = ev.results[0][0].transcript;
        $('transcript').value = ($('transcript').value ? $('transcript').value + '\n' : '') + said;
        note.textContent = 'Heard it. Check the words, then sort.';
      };
      rec.onerror = function (ev) {
        note.textContent = 'Speech stopped: ' + ev.error + '. Type instead.';
        reportError('Speech: ' + ev.error);
      };
      rec.start();
    } catch (e) { reportError('Speech could not start: ' + e.message); }
  });

})(window);
