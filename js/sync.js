/* What to Cook — sync with the family database: pull, push, and the status pill.
 * app.js creates it with WTCSync.create(ctx), passing the state it needs.
 * Pull is the only place the item list is replaced; it goes back through ctx.replaceItems. */
(function (root) {
  'use strict';
  function create(ctx) {
    var DB = ctx.DB, KEY = ctx.KEY;
    var checks = ctx.checks, transcripts = ctx.transcripts, notes = ctx.notes, foods = ctx.foods || [];
    var items = ctx.items, replaceItems = ctx.replaceItems;
    var find = ctx.find, write = ctx.write, reportError = ctx.reportError;
    var renderAll = ctx.renderAll, renderNotes = ctx.renderNotes;
    var isUuid = root.WTCUtil.isUuid, newUuid = root.WTCUtil.newUuid;

    var DB_FIELDS = ['id', 'name', 'kind', 'category', 'subcategory', 'quality', 'quantity', 'unit', 'servings_left',
      'expires_on', 'freshness', 'stored_location', 'purchase_cost', 'notes', 'status', 'source', 'raw_text',
      'purchased_on', 'counted_on', 'daily_rate', 'fav', 'reviewed_on', 'updated_at', 'stamped_on', 'fridge_days', 'tracking'];
    var syncTimer = null, syncing = false;


    function toRow(item) {
      var row = {};
      DB_FIELDS.forEach(function (k) { if (item[k] !== undefined) row[k] = item[k]; });
      return row;
    }

    function fromRow(r) {
      var it = {};
      DB_FIELDS.forEach(function (k) { it[k] = r[k] === undefined ? null : r[k]; });
      it.synced = true; it.dirty = false;
      return it;
    }

    function likeEscape(s) {
      return String(s).replace(/\*/g, '').replace(/[\\%_]/g, function (c) { return '\\' + c; });
    }

    function unsentCount() {
      return items.filter(function (it) { return it.dirty; }).length +
        checks.filter(function (c) { return !c.synced; }).length +
        transcripts.filter(function (t) { return !t.synced; }).length;
    }

    function setStatusPill(extra) {
      var s = DB.session();
      var unsent = unsentCount();
      var tail = extra || (unsent ? unsent + ' not sent yet' : '');
      document.getElementById('statusPill').textContent = s ? 'signed in: ' + s.email + (tail ? ' · ' + tail : '') : 'this device only';
    }

    function pullNotes() {
      return DB.select('wtc_notes', 'select=id,text,status,page,version,noted_at&order=noted_at.asc').then(function (res) {
        var byId = {};
        notes.forEach(function (n) { byId[n.id] = n; });
        (res.data || []).forEach(function (r) {
          var n = byId[r.id];
          if (n) { n.status = r.status; n.text = r.text; n.synced = true; }
          else notes.push({ id: r.id, at: r.noted_at, status: r.status, text: r.text, where: r.page, version: r.version, synced: true });
        });
        write(KEY.notes, notes);
        renderNotes();
      }, function (e) { reportError('Notes: ' + DB.explain(e)); });
    }

    function pull() {
      return DB.select('wtc_items', 'select=*&order=updated_at.desc&limit=2000').then(function (res) {
        var dirtyIds = {};
        items.forEach(function (it) { if (it.dirty) dirtyIds[it.id] = true; });
        var remote = (res.data || []).filter(function (r) { return !dirtyIds[r.id]; }).map(fromRow);
        replaceItems(items.filter(function (it) { return it.dirty; }).concat(remote));
        write(KEY.items, items);
        renderAll();
      });
    }

    function pushItem(it) {
      var oldId = it.id;
      function remap(newId) {
        if (newId === oldId) return;
        it.id = newId;
        checks.forEach(function (c) { if (c.item_id === oldId) c.item_id = newId; });
      }
      if (it.synced && isUuid(it.id)) {
        return DB.patch('wtc_items', 'id=eq.' + it.id, toRow(it)).then(function () { it.dirty = false; });
      }
      if (it.status !== 'in_stock') {
        remap(isUuid(it.id) ? it.id : newUuid());
        return DB.insert('wtc_items', [toRow(it)]).then(function () { it.synced = true; it.dirty = false; });
      }
      // Same rule as on the device: same name, expiry and place overwrites the line on the server.
      var q = 'select=id,expires_on&status=eq.in_stock&stored_location=eq.' + encodeURIComponent(it.stored_location) +
        '&name=ilike.' + encodeURIComponent(likeEscape(it.name));
      return DB.select('wtc_items', q).then(function (res) {
        var hit = (res.data || []).find(function (r) { return (r.expires_on || null) === (it.expires_on || null); });
        if (hit) {
          remap(hit.id);
          return DB.patch('wtc_items', 'id=eq.' + hit.id, toRow(it)).then(function () { it.synced = true; it.dirty = false; });
        }
        remap(isUuid(it.id) ? it.id : newUuid());
        return DB.insert('wtc_items', [toRow(it)]).then(function () { it.synced = true; it.dirty = false; });
      });
    }

    function pushLog() {
      var chain = Promise.resolve();
      checks.filter(function (c) { return !c.synced; }).forEach(function (c) {
        chain = chain.then(function () {
          var item = find(c.item_id);
          if (!item || !isUuid(item.id) || !item.synced) return;   // its item is not on the server yet: try next time
          return DB.insert('wtc_checkins', [{ item_id: item.id, action: c.action, note: 'by ' + c.member, at: c.at }])
            .then(function () { c.synced = true; });
        });
      });
      transcripts.filter(function (t) { return !t.synced; }).forEach(function (t) {
        chain = chain.then(function () {
          return DB.insert('wtc_transcripts', [{ text: t.text, method: t.method, parsed_count: t.parsed_count, at: t.at }])
            .then(function () { t.synced = true; });
        });
      });
      notes.filter(function (n) { return !n.synced; }).forEach(function (n) {
        chain = chain.then(function () {
          if (!isUuid(n.id)) n.id = newUuid();   // notes typed before the database had its own ids
          return DB.insert('wtc_notes', [{ id: n.id, text: n.text, page: n.where, version: n.version, noted_at: n.at, status: n.status }])
            .then(function () { n.synced = true; });
        });
      });
      return chain;
    }

    function pushAll() {
      if (!DB.session() || syncing) return Promise.resolve();
      syncing = true;
      setStatusPill('syncing…');
      var chain = Promise.resolve();
      items.filter(function (it) { return it.dirty; }).forEach(function (it) {
        chain = chain.then(function () { return pushItem(it); });
      });
      return chain.then(pushLog).then(function () {
        syncing = false;
        write(KEY.items, items); write(KEY.checks, checks); write(KEY.transcripts, transcripts); write(KEY.notes, notes);
        setStatusPill('synced ' + new Date().toLocaleTimeString());
      }, function (e) {
        syncing = false;
        write(KEY.items, items); write(KEY.checks, checks); write(KEY.transcripts, transcripts); write(KEY.notes, notes);
        setStatusPill('not synced');
        reportError('Sync: ' + DB.explain(e));
      });
    }

    function queueSync() {
      if (!DB.session()) return;
      clearTimeout(syncTimer);
      syncTimer = setTimeout(pushAll, 400);
    }
    // The food list (fridge days per food) is edited on foods.html; here it is only read.
    // Rows that page has not sent yet stay as they are.
    function pullFoods() {
      return DB.select('wtc_foods', 'select=*&order=name.asc').then(function (res) {
        var keep = foods.filter(function (f) { return f.dirty; });
        var dirtyIds = {};
        keep.forEach(function (f) { if (f.id) dirtyIds[f.id] = true; });
        var remote = (res.data || []).filter(function (r) { return !dirtyIds[r.id]; }).map(function (r) {
          return { id: r.id, name: r.name || '', location: r.location || 'pantry', kind: r.kind || '',
            category: r.category || '', fridge_days: r.fridge_days, notes: r.notes || '', dirty: false };
        });
        foods.length = 0;
        Array.prototype.push.apply(foods, keep.concat(remote));
        write(KEY.foods, foods);
      }, function (e) { reportError('Food list: ' + DB.explain(e)); });
    }

    return { pullFoods: pullFoods, toRow: toRow, fromRow: fromRow, unsentCount: unsentCount, setStatusPill: setStatusPill, pullNotes: pullNotes, pull: pull, pushItem: pushItem, pushLog: pushLog, pushAll: pushAll, queueSync: queueSync };
  }
  root.WTCSync = { create: create };
})(window);
