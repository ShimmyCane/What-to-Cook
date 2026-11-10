/* What to Cook — start-up. The screens live in their own files (core, content, pantry, capture,
 * settings, sync). This file connects them, then starts. */
(function (root) {
  'use strict';
  var WTC = root.WTC, DB = window.WTCDb;

  WTC.sync = WTCSync.create({
    DB: DB, KEY: WTC.KEY,
    items: WTC.state.items, checks: WTC.state.checks, transcripts: WTC.state.transcripts, notes: WTC.state.notes,
    foods: WTC.state.foods,
    replaceItems: function (list) { WTC.state.items.length = 0; Array.prototype.push.apply(WTC.state.items, list); },
    find: WTC.find, write: WTC.write, reportError: WTC.reportError,
    renderAll: function () { WTC.emit('pantry'); },
    renderNotes: function () { WTC.emit('notes'); }
  });

  window.addEventListener('error', function (e) { WTC.reportError('Page error: ' + e.message); });
  window.addEventListener('unhandledrejection', function (e) {
    var msg = e.reason && e.reason.message ? e.reason.message : String(e.reason);
    WTC.reportError('Unexpected: ' + msg.slice(0, 160));
  });

  WTC.emit('start');
  WTC.emit('pantry');
  WTC.renderErrors();
  WTC.sync.setStatusPill();
  if (DB.session()) {
    WTC.sync.pull().then(WTC.sync.pullNotes).then(WTC.sync.pullFoods).then(WTC.sync.pushAll, function (e) {
      WTC.sync.setStatusPill('offline, this device');
      WTC.reportError(DB.explain(e));
    });
  }
})(window);
