'use strict';
/* ============================================================
   Aaru AI — end-to-end smoke test (no real API keys needed)
   Requires the mock upstream running on :9999 (see mock-upstream.js)
   Usage:  node e2e.js               (assumes Aaru AI on :3000)
   ============================================================ */
const BASE = process.env.AIOS_BASE || 'http://127.0.0.1:3000';
let pass = 0, fail = 0;
const ok = (name, cond, extra = '') => {
  if (cond) { pass++; console.log('  ✅', name); }
  else { fail++; console.log('  ❌', name, extra); }
};

async function readSSE(resp, onEvent, onDone) {
  const reader = resp.body.getReader();
  const dec = new TextDecoder();
  let buf = '';
  const events = [];
  let meta = {};
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let idx;
    while ((idx = buf.indexOf('\n\n')) !== -1) {
      const block = buf.slice(0, idx); buf = buf.slice(idx + 2);
      let ev = 'message', data = '';
      for (const line of block.split('\n')) {
        if (line.startsWith('event:')) ev = line.slice(6).trim();
        else if (line.startsWith('data:')) data += line.slice(5).trim();
      }
      if (!data) continue;
      const j = JSON.parse(data);
      events.push({ ev, j });
      if (ev === 'meta') meta = j;
      if (onEvent) onEvent(ev, j, meta);
    }
  }
  if (onDone) onDone(events, meta);
  return events;
}

(async () => {
  console.log('\n— Aaru AI e2e (base ' + BASE + ') —\n');
  let COOKIE = '';
  const afetch = (url, opt = {}) => {
    const h = { ...(opt.headers || {}) };
    if (COOKIE) h.Cookie = COOKIE;
    return fetch(url, { ...opt, headers: h });
  };

  /* ---------- 0. auth flow ---------- */
  let r = await fetch(BASE + '/api/health');
  ok('health endpoint public', r.ok);
  const h0 = await r.json().catch(() => ({}));
  ok('health reports storage db mode', h0.db === 'files' || h0.db === 'postgres', JSON.stringify(h0));
  r = await fetch(BASE + '/api/state');
  ok('state requires auth (401)', r.status === 401);
  r = await fetch(BASE + '/api/auth/status');
  const st0 = await r.json();
  ok('fresh install = setup mode', st0.needsSetup === true);
  r = await fetch(BASE + '/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: 'tester', password: 'secret123' }) });
  COOKIE = (r.headers.get('set-cookie') || '').split(';')[0];
  ok('register creates account + session cookie', r.ok && !!COOKIE, COOKIE);
  r = await fetch(BASE + '/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: 'tester2', password: 'secret123' }) });
  ok('second signup blocked (403)', r.status === 403);
  r = await fetch(BASE + '/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: 'tester', password: 'wrong-pass' }) });
  ok('wrong password rejected (401)', r.status === 401);
  r = await fetch(BASE + '/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: 'tester', password: 'secret123' }) });
  ok('login works', r.ok);
  r = await fetch(BASE + '/', { redirect: 'manual' });
  ok('logged-out / redirects to login', r.status === 302 || r.status === 303 || r.status === 307);
  r = await fetch(BASE + '/login.html');
  ok('login page public', r.ok && (r.headers.get('content-type') || '').includes('text/html'));

  /* ---------- 1. state ---------- */
  r = await afetch(BASE + '/api/state');
  const st = await r.json();
  ok('state loads with session', r.ok && Array.isArray(st.providers) && st.providers.length >= 8);
  ok('state exposes user', st.user && st.user.username === 'tester');
  const custom = st.providers.find((p) => p.id === 'custom');
  ok('custom/arena provider present', !!custom);

  // 1b. enable custom provider pointing at the mock upstream (self-sufficient setup)
  await afetch(BASE + '/api/settings', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      providers: { custom: { enabled: true, key: 'test-key-123', baseURL: 'http://127.0.0.1:9999/v1', model: 'mock-gpt' } },
      image: { provider: 'custom', model: 'mock-image', size: '1024x1024' },
      tts: { provider: 'custom', model: 'mock-tts', voice: 'alloy' },
    }),
  });

  /* ---------- 2. basic chat (streaming) ---------- */
  let events = await readSSE(await afetch(BASE + '/api/chat', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ provider: 'custom', model: 'mock-gpt', history: [], userParts: [{ type: 'text', text: 'Hello Aaru AI!' }], commitUser: true }),
  }));
  const deltas = events.filter((e) => e.ev === 'delta').map((e) => e.j.text).join('');
  const done = events[events.length - 1];
  ok('chat streams text', deltas.includes('Mock reply'), JSON.stringify(deltas).slice(0, 80));
  ok('chat meta has chatId', events.some((e) => e.ev === 'meta' && e.j.chatId));
  ok('chat done event', done.ev === 'done');

  /* ---------- 3. persistence ---------- */
  const chatId = events.find((e) => e.ev === 'meta').j.chatId;
  r = await afetch(BASE + '/api/chats/' + chatId);
  const chat = await r.json();
  ok('chat persisted: user msg', chat.messages.some((m) => m.role === 'user' && m.parts && m.parts[0].text.includes('Hello Aaru AI')));
  ok('chat persisted: assistant msg', chat.messages.some((m) => m.role === 'assistant' && m.content.includes('Mock reply')));
  ok('chat titled', (chat.title || '').includes('Hello Aaru AI'));

  /* ---------- 4. multi-turn ---------- */
  events = await readSSE(await afetch(BASE + '/api/chat', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ provider: 'custom', model: 'mock-gpt', chatId, history: chat.messages, userParts: [{ type: 'text', text: 'And a second turn' }], commitUser: true }),
  }));
  const d2 = events.filter((e) => e.ev === 'delta').map((e) => e.j.text).join('');
  ok('multi-turn works', d2.includes('second turn'));

  /* ---------- 5. vision ---------- */
  const b64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  events = await readSSE(await afetch(BASE + '/api/chat', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ provider: 'custom', model: 'mock-vision', history: [], userParts: [{ type: 'text', text: 'What is in this image?' }, { type: 'image', mime: 'image/png', b64 }], commitUser: true }),
  }));
  const d3 = events.filter((e) => e.ev === 'delta').map((e) => e.j.text).join('');
  ok('vision parts forwarded', d3.includes('screenshot'));

  /* ---------- 6. images ---------- */
  r = await afetch(BASE + '/api/images', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: 'A red fox in the snow' }),
  });
  const img = await r.json();
  ok('image generation returns url', r.ok && (img.url || '').startsWith('/files/generated/'));
  if (img.url) {
    const fr = await afetch(BASE + img.url);
    ok('generated image is served', fr.ok && fr.headers.get('content-type').startsWith('image/'));
  }

  /* ---------- 7. TTS ---------- */
  r = await afetch(BASE + '/api/tts', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: 'hello from ai os' }),
  });
  ok('TTS returns audio', r.ok && (r.headers.get('content-type') || '').includes('audio'));

  /* ---------- 8. search ---------- */
  r = await afetch(BASE + '/api/search?q=artificial+intelligence');
  const sj = await r.json();
  ok('search endpoint responds', r.ok && typeof sj === 'object');

  /* ---------- 9. settings round trip ---------- */
  r = await afetch(BASE + '/api/settings', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Tester', providers: {} }),
  });
  const s2 = await r.json();
  ok('settings update (name)', s2.name === 'Tester');
  r = await afetch(BASE + '/api/settings', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Musahid', providers: {} }),
  });
  ok('settings restored', (await r.json()).name === 'Musahid');

  /* ---------- 10. static ---------- */
  for (const p of ['/', '/styles.css', '/app.min.js', '/assets/hero.jpg']) {
    const fr = await afetch(BASE + p);
    ok('static ' + p, fr.ok);
  }

  /* ---------- 11. model profiles ---------- */
  const profId = 'm-tt' + Date.now().toString(36).slice(-4);
  await afetch(BASE + '/api/settings', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ aiModels: [{ id: profId, name: 'Test Profile', provider: 'custom', model: 'mock-gpt' }] }),
  });
  events = await readSSE(await afetch(BASE + '/api/chat', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ modelProfile: profId, history: [], userParts: [{ type: 'text', text: 'via profile' }], commitUser: true }),
  }));
  ok('model profile routes chat', events.some((e) => e.ev === 'meta' && e.j.profile && e.j.profile.id === profId));
  const dP = events.filter((e) => e.ev === 'delta').map((e) => e.j.text).join('');
  ok('model profile streams', dP.includes('via profile'));

  /* ---------- 12. agents / mcp / plugins in state ---------- */
  ok('agents in state', Array.isArray(st.agents) && st.agents.length >= 6 && st.agents.some(a => a.id === 'a-dev'));
  ok('aiModels in state', Array.isArray(st.aiModels) && st.aiModels.length >= 6);
  ok('mcp & plugins in state', !!st.mcp && !!st.plugins);

  /* ---------- 13. export / import / reset ---------- */
  r = await afetch(BASE + '/api/export');
  const backup = await r.json();
  ok('export backup', r.ok && backup.config && backup.chats);
  const before = (await (await afetch(BASE + '/api/state')).json()).name;
  await afetch(BASE + '/api/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'BACKUP-TEST' }) });
  r = await afetch(BASE + '/api/import', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(backup) });
  ok('import restores', (await r.json()).name === before);
  r = await afetch(BASE + '/api/reset', { method: 'POST' });
  const afterReset = await r.json();
  ok('reset to defaults', afterReset.name === 'Musahid' && afterReset.chats.length === 0 && afterReset.wsName === 'Aaru AI');
  r = await afetch(BASE + '/api/state');
  ok('account survives reset', (await r.json()).user && (await (await afetch(BASE + '/api/state')).json()).user.username === 'tester');

  /* ---------- 14. error path ---------- */
  events = await readSSE(await afetch(BASE + '/api/chat', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ provider: 'openai', model: 'x', history: [], userParts: [{ type: 'text', text: 'hi' }], commitUser: true }),
  }).catch(() => null));
  ok('missing key -> SSE error event', events && events.some((e) => e.ev === 'error'));

  /* ---------- 15. logout ---------- */
  r = await afetch(BASE + '/api/auth/logout', { method: 'POST' });
  ok('logout ok', r.ok);
  r = await fetch(BASE + '/api/state', { headers: { Cookie: COOKIE } });
  ok('old session invalid after logout', r.status === 401);
  // re-login so the app session keeps working after the test
  r = await fetch(BASE + '/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: 'tester', password: 'secret123' }) });
  ok('re-login works', r.ok);

  console.log(`\n— RESULT: ${pass} passed, ${fail} failed —\n`);
  process.exit(fail ? 1 : 0);
})();
