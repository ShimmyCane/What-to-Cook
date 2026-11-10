/* What to Cook — device storage. Every read and write is in try/catch, so a blocked
 * or full storage never stops the page. onError is optional: pass a reporter to show a message. */
(function (root) {
  'use strict';
  function read(key, fallback, onError) {
    try { var v = JSON.parse(localStorage.getItem(key)); return v == null ? fallback : v; }
    catch (e) { if (onError) onError('Could not read ' + key + ': ' + e.message); return fallback; }
  }
  function write(key, value, onError) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch (e) { if (onError) onError('Could not save (storage full or blocked): ' + e.message); return false; }
  }
  root.WTCStore = { read: read, write: write };
})(window);
