/* What to Cook — settings: members, the page links, version log, transcript archive, notes, to-do, and the family database sign-in. */
(function (root) {
  'use strict';
  var WTC = root.WTC;
  var $ = WTC.$, read = WTC.read, write = WTC.write, uid = WTC.uid, nowIso = WTC.nowIso,
    reportError = WTC.reportError, renderErrors = WTC.renderErrors, showTab = WTC.showTab, KEY = WTC.KEY;
  var VERSION = WTC.content.VERSION, VERSIONS = WTC.content.VERSIONS, TODO = WTC.content.TODO, PAGES = WTC.content.PAGES;
  var members = WTC.state.members, transcripts = WTC.state.transcripts, notes = WTC.state.notes;
  var DB = window.WTCDb;

  // ---- members ----
  function renderMembers() {
    var sel = $('member'), keep = sel.value;
    sel.textContent = '';
    members.forEach(function (m) {
      var o = document.createElement('option'); o.value = m; o.textContent = m; sel.appendChild(o);
    });
    if (members.indexOf(keep) !== -1) sel.value = keep;
    $('memberList').value = members.join('\n');
  }
  $('saveMembers').addEventListener('click', function () {
    var list = $('memberList').value.split('\n').map(function (s) { return s.trim(); }).filter(Boolean);
    members.length = 0; Array.prototype.push.apply(members, list.length ? list : ['Me']);
    write(KEY.members, members);
    renderMembers();
  });
  function renderPages() {
    var ul = $('pageLinks');
    ul.textContent = '';
    PAGES.forEach(function (p) {
      var li = document.createElement('li');
      if (p.href) {
        var a = document.createElement('a');
        a.className = 'tiny'; a.href = p.href; a.textContent = p.label;
        li.appendChild(a);
      } else if (p.tab) {
        var b = document.createElement('button');
        b.type = 'button'; b.className = 'tiny'; b.textContent = p.label;
        b.addEventListener('click', function () { showTab(p.tab); $('drawer').hidden = true; });
        li.appendChild(b);
      } else {
        li.textContent = p.label + ' · planned (' + p.planned + ')';
      }
      ul.appendChild(li);
    });
  }

  function renderArchive() {
    var ul = $('archiveList');
    ul.textContent = '';
    if (!transcripts.length) {
      var empty = document.createElement('li'); empty.textContent = 'No transcripts yet.'; ul.appendChild(empty);
      return;
    }
    transcripts.slice().reverse().forEach(function (t) {
      var li = document.createElement('li');
      var d = document.createElement('details');
      var s = document.createElement('summary');
      s.textContent = new Date(t.at).toLocaleString() + ' · ' + (t.method === 'apple_memo' ? 'Apple Voice Memo' : t.method) +
        ' · ' + (t.added || 0) + ' new, ' + (t.updated || 0) + ' updated';
      var pre = document.createElement('pre');
      pre.textContent = t.text;
      d.appendChild(s); d.appendChild(pre);
      li.appendChild(d);
      ul.appendChild(li);
    });
  }

  function renderVersions() {
    var ul = $('versionList');
    ul.textContent = '';
    VERSIONS.forEach(function (v) {
      var li = document.createElement('li');
      li.textContent = 'v' + v.v + ' · ' + v.date + '\n' + v.text;
      ul.appendChild(li);
    });
  }

  function renderNotes() {
    var ul = $('noteList');
    ul.textContent = '';
    notes.slice().reverse().forEach(function (n) {
      var li = document.createElement('li');
      li.textContent = (n.status === 'done' ? '🔒✅ ' : '') + new Date(n.at).toLocaleString() + ' · ' + n.where + ' · v' + n.version + '\n' + n.text;
      ul.appendChild(li);
    });
  }
  $('noteSave').addEventListener('click', function () {
    var text = $('noteText').value.trim();
    if (!text) return;
    var current = document.querySelector('.tab.on');
    var where = current ? current.dataset.tab : 'page';
    notes.push({ id: uid('n'), at: nowIso(), status: 'open', text: text, where: where, version: VERSION, synced: false });
    write(KEY.notes, notes);
    $('noteText').value = '';
    renderNotes();
    if (DB.session()) WTC.sync.pushAll();   // sends it to wtc_notes; if that fails it stays on this device and is retried
  });

  $('showErrors').checked = read(KEY.errors, false) === true;
  WTC.on('notes', function () { renderNotes(); });
  WTC.on('archive', function () { renderArchive(); });
  $('showErrors').addEventListener('change', function (e) { write(KEY.errors, e.target.checked); renderErrors(); });
  function renderTodo() {
    var ul = $('todoList');
    ul.textContent = '';
    TODO.forEach(function (t) {
      var li = document.createElement('li');
      li.textContent = (t.done ? '✅ ' : '⬜ ') + t.text;
      ul.appendChild(li);
    });
  }

  $('signIn').addEventListener('click', function () {
    var email = $('dbEmail').value.trim(), password = $('dbPassword').value;
    if (!email || !password) { $('dbStatus').textContent = 'Enter the family email and password.'; return; }
    $('dbStatus').textContent = 'Signing in…';
    DB.signIn(email, password).then(function () {
      $('dbPassword').value = '';
      $('dbStatus').textContent = 'Signed in. Syncing…';
      return WTC.sync.pull().then(WTC.sync.pullNotes).then(WTC.sync.pullFoods).then(WTC.sync.pushAll);
    }).then(function () {
      $('dbStatus').textContent = 'Signed in.';
      WTC.sync.setStatusPill();
    }, function (e) {
      $('dbStatus').textContent = 'Sign-in failed. ' + DB.explain(e);
      reportError('Sign-in: ' + DB.explain(e));
    });
  });
  $('signOut').addEventListener('click', function () {
    DB.signOut();
    $('dbStatus').textContent = 'Signed out. This device keeps its own copy.';
    WTC.sync.setStatusPill();
  });
  $('dbCheck').addEventListener('click', function () {
    var out = $('dbResult');
    if (!DB.session()) { out.textContent = 'Not signed in. Sign in first; until then this device keeps its own copy.'; return; }
    out.textContent = 'Checking…';
    Promise.all(window.WTC_CONFIG.tables.map(function (t) {
      return DB.count(t).then(function (n) { return t + ': ok, ' + n + ' rows'; },
        function (e) { return t + ': ' + DB.explain(e); });
    })).then(function (lines) { out.textContent = lines.join('\n'); });
  });

  WTC.on('start', function () {
    renderMembers();
    renderPages();
    renderVersions();
    renderArchive();
    renderNotes();
    renderTodo();
  });
})(window);
