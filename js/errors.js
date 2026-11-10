/* What to Cook — error log. Keeps the last messages; each page draws them its own way.
 * create(render): render(lines) is called with the list, oldest first, after each report. */
(function (root) {
  'use strict';
  function create(render, max) {
    var lines = [], cap = max || 30;
    function report(msg) {
      lines.push(new Date().toLocaleTimeString() + ' · ' + msg);
      if (lines.length > cap) lines.splice(0, lines.length - cap);
      render(lines.slice());
    }
    function redraw() { render(lines.slice()); }
    return { report: report, redraw: redraw };
  }
  root.WTCErrors = { create: create };
})(window);
