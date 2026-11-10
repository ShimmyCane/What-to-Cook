/* What to Cook — a small client for the family database (Supabase REST and sign-in, no library).
 * Every call has a timeout. Sign-in keeps the session in local storage, inside try/catch. */
(function (root) {
  'use strict';
  var CFG = root.WTC_CONFIG;
  var SESSION_KEY = 'wtc.session';

  function session() { return WTCStore.read(SESSION_KEY, null) || null; }
  // Storage blocked: the session lasts this page load only (WTCStore never throws).
  function saveSession(s) {
    if (s) WTCStore.write(SESSION_KEY, s);
    else { try { localStorage.removeItem(SESSION_KEY); } catch (e) { /* blocked: nothing to remove */ } }
  }

  function withTimeout(ms) {
    var c = new AbortController();
    var t = setTimeout(function () { c.abort(); }, ms);
    return { signal: c.signal, done: function () { clearTimeout(t); } };
  }

  function errorFrom(res, data) {
    var msg = (data && (data.message || data.msg || data.error_description || data.error)) || ('HTTP ' + res.status);
    var err = new Error(msg);
    err.status = res.status;
    return err;
  }

  // Refresh the access token when it is about to expire.
  function ensureFresh() {
    var s = session();
    if (!s || !s.expires_at || s.expires_at - Date.now() > 60000) return Promise.resolve(s);
    return fetch(CFG.url + '/auth/v1/token?grant_type=refresh_token', {
      method: 'POST',
      headers: { apikey: CFG.publishableKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: s.refresh_token })
    }).then(function (res) {
      return res.json().then(function (j) {
        if (!res.ok) throw errorFrom(res, j);
        var next = { access_token: j.access_token, refresh_token: j.refresh_token,
          expires_at: Date.now() + j.expires_in * 1000, email: s.email };
        saveSession(next);
        return next;
      });
    });
  }

  function request(method, path, opts) {
    opts = opts || {};
    return ensureFresh().then(function (s) {
      var t = withTimeout(opts.timeoutMs || 8000);
      var headers = { apikey: CFG.publishableKey, 'Content-Type': 'application/json',
        Authorization: 'Bearer ' + (s && s.access_token ? s.access_token : CFG.publishableKey) };
      if (opts.prefer) headers.Prefer = opts.prefer;
      var init = { method: method, headers: headers, signal: t.signal };
      if (opts.body !== undefined) init.body = JSON.stringify(opts.body);
      return fetch(CFG.url + path, init).then(function (res) {
        t.done();
        return res.text().then(function (text) {
          var data = null;
          try { data = text ? JSON.parse(text) : null; } catch (e) { data = text; }
          if (!res.ok) throw errorFrom(res, data);
          return { data: data, headers: res.headers };
        });
      }, function (e) { t.done(); throw e; });
    });
  }

  function signIn(email, password) {
    var t = withTimeout(10000);
    return fetch(CFG.url + '/auth/v1/token?grant_type=password', {
      method: 'POST',
      headers: { apikey: CFG.publishableKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email, password: password }),
      signal: t.signal
    }).then(function (res) {
      t.done();
      return res.json().then(function (j) {
        if (!res.ok) throw errorFrom(res, j);
        var s = { access_token: j.access_token, refresh_token: j.refresh_token,
          expires_at: Date.now() + j.expires_in * 1000, email: (j.user && j.user.email) || email };
        saveSession(s);
        return s;
      });
    });
  }

  function signOut() { saveSession(null); }

  function select(table, query, opts) { return request('GET', '/rest/v1/' + table + '?' + query, opts); }
  function insert(table, rows) { return request('POST', '/rest/v1/' + table, { body: rows, prefer: 'return=representation' }); }
  function patch(table, filter, body) { return request('PATCH', '/rest/v1/' + table + '?' + filter, { body: body, prefer: 'return=minimal' }); }

  // Row count for one table. Needs the signed-in policy; anon sees nothing.
  function count(table) {
    return request('GET', '/rest/v1/' + table + '?select=id&limit=0', { prefer: 'count=exact' }).then(function (res) {
      var range = res.headers.get('content-range') || '';
      var n = parseInt(range.split('/')[1], 10);
      if (isNaN(n)) throw new Error('no count returned');
      return n;
    });
  }

  // Turn a raw error into a short sentence for the family. The raw text is kept for the error log.
  function explain(e) {
    var m = String((e && e.message) || e || '');
    if (/secret API key in browser/i.test(m)) return 'The family database is refusing this page right now (its key setting). This device keeps its copy.';
    if (/invalid login credentials/i.test(m)) return 'The email or password is not right.';
    if (/email not confirmed/i.test(m)) return 'This login has not been confirmed yet. Ask Jimmy.';
    if (/jwt expired|invalid jwt|token is expired/i.test(m) || (e && e.status === 401 && session())) return 'Your sign-in has expired. Sign in again.';
    if (/row-level security|permission denied|42501/i.test(m)) return 'Not allowed. Sign in with the family login.';
    if ((e && e.name === 'AbortError') || /failed to fetch|networkerror|load failed|timed out/i.test(m)) return 'No connection to the family database. This device keeps its copy.';
    return 'Something went wrong with the family database: ' + m.slice(0, 120);
  }

  root.WTCDb = {
    session: session, signIn: signIn, signOut: signOut,
    select: select, insert: insert, patch: patch, count: count, explain: explain
  };
})(typeof window !== 'undefined' ? window : globalThis);
