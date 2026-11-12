/* What to Cook — core: the shared state, storage, errors, dates, and the events that
 * screens use to talk to each other. Loaded before every other What to Cook script.
 * WTC.state arrays are never replaced: modules keep references to them. */
(function (root) {
  'use strict';
  var WTC = root.WTC = root.WTC || {};
  var KEY = WTC.KEY = {
    items: 'wtc.items', checks: 'wtc.checkins', transcripts: 'wtc.transcripts',
    members: 'wtc.members', notes: 'wtc.notes', errors: 'wtc.showErrors', foods: 'wtc.foods'
  };
  WTC.$ = function (id) { return document.getElementById(id); };
  var $ = WTC.$;
  // storage (try/catch: the page still works if storage is blocked)
  function read(key, fallback) { return WTCStore.read(key, fallback, reportError); }
  function write(key, value) { return WTCStore.write(key, value, reportError); }
  function uid(prefix) { return prefix + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7); }
  WTC.read = read; WTC.write = write; WTC.uid = uid;

  WTC.state = { items: read(KEY.items, []), checks: read(KEY.checks, []), transcripts: read(KEY.transcripts, []),
    members: read(KEY.members, ['Me']), notes: read(KEY.notes, []), foods: read(KEY.foods, []) };
  if (!Array.isArray(WTC.state.foods)) WTC.state.foods = [];
  var items = WTC.state.items, checks = WTC.state.checks, transcripts = WTC.state.transcripts, notes = WTC.state.notes;
  // Rows saved before sync existed are not on the server yet.
  items.forEach(function (it) { if (it.synced === undefined) { it.synced = false; it.dirty = true; } });
  checks.forEach(function (c) { if (c.synced === undefined) c.synced = false; });
  transcripts.forEach(function (t) { if (t.synced === undefined) t.synced = false; });

  function persist() {
    write(KEY.items, items);
    write(KEY.checks, checks);
    write(KEY.transcripts, transcripts);
    if (WTC.sync) WTC.sync.queueSync();
  }
  function touch(item) { item.updated_at = WTC.nowIso(); item.dirty = true; }
  WTC.persist = persist; WTC.touch = touch;

  // errors: kept at the bottom, shown only when the user opts in
  var errorLog = WTCErrors.create(function (lines) {
    var panel = $('errorPanel');
    var show = WTCStore.read(KEY.errors, false) === true;
    panel.hidden = !(show && lines.length);
    panel.textContent = lines.join('\n');
  }, 20);
  function reportError(msg) { errorLog.report(msg); }
  function renderErrors() { errorLog.redraw(); }
  WTC.reportError = reportError; WTC.renderErrors = renderErrors;

  // dates and numbers
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function today() { var d = new Date(); return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
  function isoDay(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function todayIso() { return isoDay(today()); }
  function parseDay(s) { if (!s) return null; var p = String(s).split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function daysBetween(a, b) { return Math.round((b - a) / 86400000); }
  function nowIso() { return new Date().toISOString(); }
  function norm(s) { return String(s || '').toLowerCase().replace(/\s+/g, ' ').trim(); }
  function round1(n) { return Math.round(n * 10) / 10; }
  function round2(n) { return Math.round(n * 100) / 100; }
  WTC.pad = pad; WTC.today = today; WTC.isoDay = isoDay; WTC.todayIso = todayIso; WTC.parseDay = parseDay;
  WTC.daysBetween = daysBetween; WTC.nowIso = nowIso; WTC.norm = norm; WTC.round1 = round1; WTC.round2 = round2;

  function find(id) { return items.find(function (it) { return it.id === id; }); }
  WTC.find = find;

  // events: screens listen for what they need; nothing calls another screen directly
  var listeners = {};
  WTC.on = function (name, fn) { (listeners[name] = listeners[name] || []).push(fn); };
  WTC.emit = function (name) { (listeners[name] || []).forEach(function (fn) { fn(); }); };

  // tabs
  function showTab(name) {
    document.querySelectorAll('.tab').forEach(function (b) { b.classList.toggle('on', b.dataset.tab === name); });
    document.querySelectorAll('.view').forEach(function (v) { v.hidden = v.id !== 'tab-' + name; });
  }
  document.querySelectorAll('.tab').forEach(function (btn) {
    btn.addEventListener('click', function () { showTab(btn.dataset.tab); });
  });
  WTC.showTab = showTab;
  // index.html#recipes or #recipes:<id> opens the recipe book (used by the old recipes.html link)
  WTC.startHash = (location.hash || '').replace('#', '');

  // the page shell: the settings drawer and the collapsible panels
  $('gear').addEventListener('click', function () {
    var open = $('drawer').hidden;
    $('drawer').hidden = !open;
    $('gear').setAttribute('aria-expanded', String(open));
  });
  $('closeDrawer').addEventListener('click', function () {
    $('drawer').hidden = true;
    $('gear').setAttribute('aria-expanded', 'false');
  });
  // Panels marked data-open="false" start closed; their header stays visible.
  document.querySelectorAll('.panel').forEach(function (sec) {
    var closed = sec.dataset.open === 'false';
    sec.dataset.collapsed = String(closed);
    var head = sec.querySelector('.panelHead');
    head.setAttribute('aria-expanded', String(!closed));
    head.querySelector('.mark').textContent = closed ? '▸' : '▾';
  });
  document.querySelectorAll('.panelHead').forEach(function (head) {
    head.addEventListener('click', function () {
      var sec = head.parentElement;
      var collapsed = sec.dataset.collapsed !== 'true';
      sec.dataset.collapsed = String(collapsed);
      head.setAttribute('aria-expanded', String(!collapsed));
      head.querySelector('.mark').textContent = collapsed ? '▸' : '▾';
    });
  });

})(window);
