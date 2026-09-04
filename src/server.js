'use strict';
/* ============================================================
   Aaru AI — Personal AI Studio
   Zero-dependency Node.js server (Node 18+).
   - Serves the dashboard (public/)
   - Routes chat to many AI providers (OpenAI-compatible + Anthropic native)
   - Image generation, text-to-speech, web search, chat history, usage tracking
   ============================================================ */
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = Number(process.env.PORT || 3000);
// Works whether running from src/ (dev) or the built root file (production)
const ROOT = fs.existsSync(path.join(__dirname, 'public')) ? __dirname : path.join(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT, 'public');
const DATA_DIR = path.join(ROOT, 'data');
const GEN_DIR = path.join(DATA_DIR, 'generated');
[PUBLIC_DIR, DATA_DIR, GEN_DIR].forEach((d) => fs.mkdirSync(d, { recursive: true }));

const FILES = {
  config: path.join(DATA_DIR, 'config.json'),
  chats: path.join(DATA_DIR, 'chats.json'),
  usage: path.join(DATA_DIR, 'usage.json'),
  users: path.join(DATA_DIR, 'users.json'),
  sessions: path.join(DATA_DIR, 'sessions.json'),
};

/* ================= optional storage: PostgreSQL / Firebase =================
   Set DATABASE_URL (PostgreSQL) or Firebase credentials to persist everything
   there instead of the JSON files above. Without either, Aaru AI works exactly
   as before (zero-config JSON files). */
const DATABASE_URL = process.env.DATABASE_URL || '';
let dbMode = 'files';           // 'files' | 'postgres' | 'firebase' (Firestore) | 'rtdb' (Realtime DB)
let pgPool = null;
let pgQueue = Promise.resolve(); // serialized writes to keep order
let fbDb = null;                // Firestore handle
let fbRtdb = null;              // Realtime Database handle
let fbQueue = Promise.resolve();
let fbChatIds = new Set();

/* Firebase config sources (any one of these):
   1. FIREBASE_SERVICE_ACCOUNT  — base64 of serviceAccountKey.json  (Render-friendly)
   2. FIREBASE_CREDENTIALS      — raw JSON of serviceAccountKey.json
   3. GOOGLE_APPLICATION_CREDENTIALS — path to serviceAccountKey.json (file)
   4. FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY */
function fbAdminConfig() {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    try { return JSON.parse(fs.readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, 'utf8')); } catch (e) {}
  }
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT || process.env.FIREBASE_CREDENTIALS || '';
  if (raw) {
    try { return JSON.parse(Buffer.from(raw, 'base64').toString('utf8')); } catch (e) {}
    try { return JSON.parse(raw); } catch (e) {}
    return null;
  }
  if (!process.env.FIREBASE_PROJECT_ID) return null;
  const key = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
  if (!key || !process.env.FIREBASE_CLIENT_EMAIL) return null;
  return { project_id: process.env.FIREBASE_PROJECT_ID, client_email: process.env.FIREBASE_CLIENT_EMAIL, private_key: key };
}

async function loadFirestore() {
  const admin = require('firebase-admin'); // optional dependency
  if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(fbAdminConfig()) });
  fbDb = admin.firestore();
  const kv = await fbDb.collection('aaru_kv').get();
  const seen = new Set();
  for (const d of kv.docs) {
    if (d.id === 'chatsIndex') continue;
    seen.add(d.id);
    applyState(d.id, d.data().value);
  }
  const col = await fbDb.collection('aaru_chats').get();
  const loaded = [];
  for (const d of col.docs) {
    fbChatIds.add(d.id);
    loaded.push({ id: d.id, ...d.data() });
  }
  if (loaded.length) { chats = { chats: loaded }; seen.add('chats'); }
  dbMode = 'firebase';
  resetMissingKv(seen);
  console.log('[db] connected to Firebase Firestore ( ' + kv.size + ' kv docs, ' + loaded.length + ' chats )');
}

/* Realtime Database: URL candidates for auto-detection (project_id – default-rtdb). */
function rtdbCandidates(projectId, explicit) {
  const list = [];
  if (explicit) list.push(explicit);
  list.push(
    `https://${projectId}-default-rtdb.firebaseio.com`,
    `https://${projectId}-default-rtdb.asia-southeast1.firebasedatabase.app`,
    `https://${projectId}-default-rtdb.us-central1.firebasedatabase.app`,
    `https://${projectId}-default-rtdb.europe-west1.firebasedatabase.app`
  );
  return list.filter((v, i) => v && list.indexOf(v) === i);
}
async function loadRealtimeDb() {
  const admin = require('firebase-admin');
  const { project_id: pid } = fbAdminConfig();
  const candidates = rtdbCandidates(pid, process.env.FIREBASE_DATABASE_URL);
  let lastErr = null;
  for (const url of candidates) {
    try {
      const app = (admin.apps.find((a) => a.name === 'aaru-rtdb')) || admin.initializeApp({ credential: admin.credential.cert(fbAdminConfig()), databaseURL: url }, 'aaru-rtdb');
      const db = app.database();
      // probe: small write+read+remove to confirm the DB exists & is writable
      await db.ref('__aaru_probe').set({ ok: true, t: Date.now() });
      await db.ref('__aaru_probe').once('value');
      await db.ref('__aaru_probe').remove();
      fbRtdb = db;
      const kv = await db.ref('aaru_kv').once('value');
      const kvv = kv.val() || {};
      const seen = new Set(Object.keys(kvv));
      for (const k of seen) applyState(k, kvv[k]);
      const cs = await db.ref('aaru_chats').once('value');
      const cv = cs.val() || {};
      const loaded = Object.entries(cv).map(([id, d]) => ({ id, ...d }));
      if (loaded.length) { chats = { chats: loaded }; seen.add('chats'); }
      fbChatIds = new Set(loaded.map((c) => c.id));
      resetMissingKv(seen);
      dbMode = 'rtdb';
      console.log('[db] connected to Firebase Realtime Database ( ' + url + ' — ' + Object.keys(kvv).length + ' kv keys, ' + loaded.length + ' chats )');
      return true;
    } catch (e) {
      lastErr = e;
      console.error('[db] Realtime DB not reachable at ' + url + ' → ' + (e.code || e.message || '').slice(0, 120));
      try { (admin.apps.find((a) => a.name === 'aaru-rtdb'))?.delete(); } catch {}
      fbRtdb = null;
    }
  }
  throw lastErr || new Error('Realtime Database not reachable');
}

async function persistChatsFirebase(chatsObj) {
  const list = chatsObj.chats || [];
  const col = fbDb.collection('aaru_chats');
  const seen = new Set();
  await Promise.all(list.map((c) => {
    seen.add(c.id);
    return col.doc(c.id).set({ title: c.title || '', createdAt: c.createdAt || 0, updatedAt: c.updatedAt || 0, messages: c.messages || [] });
  }));
  if (fbChatIds.size) {
    await Promise.all([...fbChatIds].filter((id) => !seen.has(id)).map((id) => col.doc(id).delete().catch(() => {})));
  }
  fbChatIds = seen;
  return fbDb.collection('aaru_kv').doc('chatsIndex').set({ ids: [...seen], updated_at: new Date() });
}
async function persistChatsRealtime(chatsObj) {
  const list = chatsObj.chats || [];
  const seen = new Set();
  await Promise.all(list.map((c) => {
    seen.add(c.id);
    return fbRtdb.ref('aaru_chats/' + c.id).set({ title: c.title || '', createdAt: c.createdAt || 0, updatedAt: c.updatedAt || 0, messages: c.messages || [] });
  }));
  const curSnap = await fbRtdb.ref('aaru_chats').once('value');
  const cur = curSnap.val() || {};
  const removed = Object.keys(cur).filter((id) => !seen.has(id));
  if (removed.length) await Promise.all(removed.map((id) => fbRtdb.ref('aaru_chats/' + id).remove()));
  fbChatIds = seen;
}

function persistKV(key, obj) {
  if (dbMode === 'postgres' && pgPool) {
    const v = JSON.stringify(obj);
    pgQueue = pgQueue
      .then(() => pgPool.query(
        'INSERT INTO aaru_kv(key, value) VALUES($1, $2::jsonb) ON CONFLICT (key) DO UPDATE SET value = $2::jsonb, updated_at = now()',
        [key, v]
      ))
      .catch((e) => console.error('[db] write failed:', e.message));
  } else if (dbMode === 'firebase' && fbDb) {
    const clone = JSON.parse(JSON.stringify(obj));
    fbQueue = fbQueue
      .then(() => (key === 'chats' ? persistChatsFirebase(clone) : fbDb.collection('aaru_kv').doc(key).set({ value: clone, updated_at: new Date() })))
      .catch((e) => console.error('[db] firebase write failed:', e.message));
  } else if (dbMode === 'rtdb' && fbRtdb) {
    const clone = JSON.parse(JSON.stringify(obj));
    fbQueue = fbQueue
      .then(() => (key === 'chats' ? persistChatsRealtime(clone) : fbRtdb.ref('aaru_kv/' + key).set(clone)))
      .catch((e) => console.error('[db] realtime-db write failed:', e.message));
  }
}
function applyState(key, value) {
  try {
    if (key === 'config') config = mergeConfig(value);
    else if (key === 'chats') chats = (value && Array.isArray(value.chats)) ? value : { chats: value || [] };
    else if (key === 'users') authUsers = (value && Array.isArray(value.users)) ? value : { users: value || [] };
    else if (key === 'sessions') sessions = (value && typeof value === 'object') ? value : {};
    else if (key === 'usage') usage = (value && typeof value === 'object') ? value : {};
  } catch (e) { console.error('[db] bad row for', key, e.message); }
}
function resetMissingKv(seen) {
  for (const k of ['config', 'users', 'sessions', 'usage', 'chats']) {
    if (!seen.has(k)) applyState(k, null);
  }
}
async function initStorage() {
  if (fbAdminConfig()) {
    let admin = null;
    try { admin = require('firebase-admin'); } catch (e) { console.error('[db] firebase-admin not installed — skipping Firebase:', e.message); }
    if (admin) {
      try { await loadFirestore(); return; }
      catch (e) { console.error('[db] Firestore unavailable (' + (e.code || e.message || '') + ') — trying Realtime Database…'); }
      try { await loadRealtimeDb(); return; }
      catch (e) { console.error('[db] Realtime Database unavailable too — falling back:', e.message); }
    }
  }
  if (DATABASE_URL) {
    try {
      const { Pool } = require('pg'); // optional dependency
      pgPool = new Pool({ connectionString: DATABASE_URL, max: 5, idleTimeoutMillis: 30000 });
      await pgPool.query('CREATE TABLE IF NOT EXISTS aaru_kv (key text PRIMARY KEY, value jsonb NOT NULL, updated_at timestamptz DEFAULT now())');
      const res = await pgPool.query('SELECT key, value FROM aaru_kv');
      const seen = new Set();
      for (const row of res.rows) { seen.add(row.key); applyState(row.key, row.value); }
      resetMissingKv(seen);
      dbMode = 'postgres';
      console.log('[db] connected to PostgreSQL (', res.rows.length, 'keys loaded )');
      return;
    } catch (e) {
      console.error('[db] PostgreSQL unavailable, falling back to JSON files:', e.message);
      try { if (pgPool) await pgPool.end(); } catch {}
      pgPool = null;
    }
  }
  dbMode = 'files';
}

/* ------------------------- provider catalog ------------------------- */
const CATALOG = [
  { id: 'openai', label: 'OpenAI (GPT)', baseURL: 'https://api.openai.com/v1', defaultModel: 'gpt-4o-mini', keyURL: 'https://platform.openai.com/api-keys', envKey: 'OPENAI_API_KEY', models: ['gpt-4o-mini', 'gpt-4o', 'gpt-4.1-mini', 'gpt-4.1', 'o3-mini', 'gpt-4.5-preview'] },
  { id: 'gemini', label: 'Google Gemini', baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai', defaultModel: 'gemini-2.5-flash', keyURL: 'https://aistudio.google.com/apikey', envKey: 'GEMINI_API_KEY', models: ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-2.5-pro', 'gemini-2.0-flash'] },
  { id: 'deepseek', label: 'DeepSeek', baseURL: 'https://api.deepseek.com/v1', defaultModel: 'deepseek-chat', keyURL: 'https://platform.deepseek.com/api_keys', envKey: 'DEEPSEEK_API_KEY', models: ['deepseek-chat', 'deepseek-reasoner'] },
  { id: 'groq', label: 'Groq (fast)', baseURL: 'https://api.groq.com/openai/v1', defaultModel: 'llama-3.3-70b-versatile', keyURL: 'https://console.groq.com/keys', envKey: 'GROQ_API_KEY', models: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'openai/gpt-oss-120b', 'openai/gpt-oss-20b'] },
  { id: 'openrouter', label: 'OpenRouter (all models)', baseURL: 'https://openrouter.ai/api/v1', defaultModel: 'openrouter/auto', keyURL: 'https://openrouter.ai/keys', envKey: 'OPENROUTER_API_KEY', models: ['openrouter/auto'] },
  { id: 'omniroute', label: 'OmniRoute (free gateway — auto routing)', baseURL: 'http://localhost:20128/v1', defaultModel: 'auto', keyURL: 'https://github.com/diegosouzapw/OmniRoute', envKey: 'OMNIROUTE_TOKEN', local: true, note: 'Self-hosted gateway: 150+ free providers, model "auto" switches automatically. Change Base URL to your public tunnel before enabling.', models: ['auto', 'auto/cheap'] },
  { id: 'anthropic', label: 'Anthropic (Claude)', baseURL: 'https://api.anthropic.com', defaultModel: 'claude-sonnet-4-5', keyURL: 'https://console.anthropic.com/settings/keys', envKey: 'ANTHROPIC_API_KEY', native: true, models: ['claude-sonnet-4-5', 'claude-opus-4-1', 'claude-haiku-4-5'] },
  { id: 'ollama', label: 'Ollama (local, free)', baseURL: 'http://localhost:11434/v1', defaultModel: 'llama3.2', keyURL: 'https://ollama.com', local: true, models: ['llama3.2', 'llama3.3', 'qwen2.5', 'mistral', 'phi4'] },
  { id: 'together', label: 'Together AI', baseURL: 'https://api.together.xyz/v1', defaultModel: 'meta-llama/Llama-3.3-70B-Instruct-Turbo', keyURL: 'https://api.together.xyz/settings/api-keys', envKey: 'TOGETHER_API_KEY', models: ['meta-llama/Llama-3.3-70B-Instruct-Turbo', 'meta-llama/Llama-3.1-8B-Instruct-Turbo', 'deepseek-ai/DeepSeek-V3', 'Qwen/Qwen2.5-72B-Instruct-Turbo'] },
  { id: 'huggingface', label: 'Hugging Face', baseURL: 'https://router.huggingface.co/v1', defaultModel: 'meta-llama/Llama-3.1-8B-Instruct', keyURL: 'https://huggingface.co/settings/tokens', envKey: 'HF_TOKEN', models: ['meta-llama/Llama-3.1-8B-Instruct', 'Qwen/Qwen2.5-72B-Instruct', 'mistralai/Mistral-7B-Instruct-v0.3', 'microsoft/Phi-3.5-mini-instruct'] },
  { id: 'cloudflare', label: 'Cloudflare AI', baseURL: 'https://api.cloudflare.com/client/v4/accounts/YOUR_ACCOUNT_ID/ai/v1', defaultModel: '@cf/meta/llama-3.1-8b-instruct', keyURL: 'https://dash.cloudflare.com', envKey: 'CLOUDFLARE_API_TOKEN', models: ['@cf/meta/llama-3.1-8b-instruct', '@cf/meta/llama-3.3-70b-instruct-fp8-fast', '@cf/qwen/qwen2.5-coder-32b-instruct', '@cf/deepseek-ai/deepseek-r1-distill-qwen-32b'] },
  { id: 'custom', label: 'Custom / Arena (OpenAI-compatible)', baseURL: '', defaultModel: '', keyURL: '', envKey: 'CUSTOM_API_KEY', models: [] },
];

const DEFAULT_CONFIG = {
  name: 'Musahid',
  wsName: 'Aaru AI',
  tagline: 'Personal AI Studio',
  logo: '',
  accent: 'indigo',
  compact: false,
  systemPrompt:
    'You are Aaru AI, a personal AI assistant inside the user\'s creative workbench. ' +
    'You help with coding, images, videos, voice, music, presentations, websites and apps. ' +
    'Be concise, friendly and practical. Use markdown formatting when useful and always put code in fenced code blocks.',
  autoProvider: true,
  search: { provider: 'auto', tavily: '', jina: '' },
  stt: { provider: 'assemblyai', key: '' },
  authAllowSignup: false,
  temperature: 0.7,
  maxTokens: 4096,
  limits: { text: 50, images: 20, voice: 10, video: 5, music: 10 },
  providers: {},
  aiModels: [
    { id: 'm-gemini', name: 'Gemini 2.5 Flash', provider: 'gemini', model: 'gemini-2.5-flash' },
    { id: 'm-claude', name: 'Claude Sonnet', provider: 'anthropic', model: 'claude-sonnet-4-5' },
    { id: 'm-gpt', name: 'GPT-4o', provider: 'openai', model: 'gpt-4o' },
    { id: 'm-llama', name: 'Llama 3.3', provider: 'groq', model: 'llama-3.3-70b-versatile' },
    { id: 'm-mistral', name: 'Mistral Small', provider: 'openrouter', model: 'mistralai/mistral-small-3.1-24b-instruct' },
    { id: 'm-custom', name: 'Custom Model', provider: 'custom', model: '' },
  ],
  mcp: { fileSystem: true, word: false, notion: false, figma: false, playwright: false, custom: false },
  plugins: { codePreview: true, vision: true, voice: true, webSearch: false },
  agents: [
    { id: 'a-dev', name: 'Super Developer', icon: 'code', builtin: true, instruction: 'You are a senior full-stack engineer. Write clean, complete, runnable code. Prefer single-file apps (HTML+CSS+JS or JSX) so they can be previewed instantly. Explain briefly.' },
    { id: 'a-design', name: 'UI/UX Designer', icon: 'pen', builtin: true, instruction: 'You are a world-class UI/UX designer. Produce modern, polished interface code and thoughtful design rationale; use Tailwind-style utility classes or clean CSS.' },
    { id: 'a-data', name: 'Data Analyst', icon: 'grid', builtin: true, instruction: 'You are a data analyst. Reason carefully over any data or files provided, show your calculations, and summarize findings in clear tables.' },
    { id: 'a-copy', name: 'Copywriter', icon: 'pen', builtin: true, instruction: 'You are a persuasive copywriter. Write engaging, conversion-focused copy with strong hooks, short paragraphs and clear calls to action.' },
    { id: 'a-research', name: 'Researcher', icon: 'web', builtin: true, instruction: 'You are a careful researcher. Structure answers with facts, sources when available, and separate confirmed facts from speculation.' },
    { id: 'a-translator', name: 'Translator', icon: 'globe', builtin: true, instruction: 'You are a professional translator. Translate faithfully while keeping tone and nuance; offer brief notes on cultural context when helpful.' },
  ],
  image: { provider: 'openai', model: 'gpt-image-1', size: '1024x1024' },
  tts: { provider: 'openai', model: 'tts-1', voice: 'alloy' },
};

/* ------------------------- tiny JSON store ------------------------- */
function readJson(p, fallback) {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return fallback; }
}
function writeJson(p, obj) {
  const tmp = p + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(obj, null, 2));
  fs.renameSync(tmp, p);
}
function mergeConfig(loaded) {
  const base = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
  if (loaded && typeof loaded === 'object') {
    for (const k of ['name', 'wsName', 'tagline', 'logo', 'accent', 'compact', 'systemPrompt', 'temperature', 'maxTokens', 'autoProvider', 'authAllowSignup', 'limits', 'image', 'tts', 'aiModels', 'mcp', 'plugins', 'agents', 'search', 'stt']) {
      if (loaded[k] !== undefined) base[k] = loaded[k];
    }
    const prov = (loaded.providers && typeof loaded.providers === 'object') ? loaded.providers : {};
    base.providers = {};
    for (const c of CATALOG) {
      base.providers[c.id] = Object.assign({}, prov[c.id] || {});
    }
  }
  return base;
}
function resetToDefaults(session) {
  config = mergeConfig(null);
  chats = { chats: [] };
  usage = {};
  saveConfig(); saveChats(); saveUsage();
  // NOTE: accounts (data/users.json) are kept so you are not locked out.
  return getState(session);
}

let config = mergeConfig(readJson(FILES.config, null));
let chats = readJson(FILES.chats, { chats: [] });
let usage = readJson(FILES.usage, {});
let authUsers = readJson(FILES.users, { users: [] });
let sessions = readJson(FILES.sessions, {}); // token -> { username, exp }

/* ------------------------- auth ------------------------- */
const SESSION_TTL = 30 * 24 * 3600 * 1000; // 30 days
const COOKIE_SECURE = process.env.COOKIE_SECURE === '1'; // set 1 when served over HTTPS
function saveUsers() { writeJson(FILES.users, authUsers); persistKV('users', authUsers); }
function saveSessions() { writeJson(FILES.sessions, sessions); persistKV('sessions', sessions); }
function pruneSessions() {
  let dirty = false;
  const now = Date.now();
  for (const k of Object.keys(sessions)) {
    if (sessions[k].exp < now) { delete sessions[k]; dirty = true; }
  }
  if (dirty) saveSessions();
}
function hashPassword(pw) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(pw, salt, 32).toString('hex');
  return { salt, hash };
}
function verifyPassword(pw, salt, hash) {
  try {
    const h = crypto.scryptSync(pw, salt, 32).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(h, 'hex'), Buffer.from(hash, 'hex'));
  } catch { return false; }
}
function createSession(username) {
  pruneSessions();
  let t;
  do { t = crypto.randomBytes(32).toString('hex'); } while (sessions[t]);
  sessions[t] = { username, exp: Date.now() + SESSION_TTL };
  saveSessions();
  return t;
}
function sessionCookie(token) {
  return `aaru_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${Math.floor(SESSION_TTL / 1000)}${COOKIE_SECURE ? '; Secure' : ''}`;
}
function getSession(req) {
  const m = (req.headers.cookie || '').match(/(?:^|;\s*)aaru_session=([^;]+)/);
  if (!m) return null;
  const s = sessions[m[1]];
  if (!s || s.exp < Date.now()) {
    if (s) { delete sessions[m[1]]; saveSessions(); }
    return null;
  }
  return { token: m[1], username: s.username };
}
function clearSession(req, res) {
  const m = (req.headers.cookie || '').match(/(?:^|;\s*)aaru_session=([^;]+)/);
  if (m && sessions[m[1]]) { delete sessions[m[1]]; saveSessions(); }
  res.setHeader('Set-Cookie', `aaru_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${COOKIE_SECURE ? '; Secure' : ''}`);
}

/* ------------------------- rate limiting ------------------------- */
const rateBuckets = {};
function rateLimit(req, scope, max, windowMs) {
  const ip = req.socket.remoteAddress || 'unknown';
  const key = scope + ':' + ip; // one independent bucket per scope per IP
  const now = Date.now();
  let b = rateBuckets[key];
  if (!b || b.reset < now) b = { count: 0, reset: now + windowMs, lock: 0 };
  if (b.lock > now) return { ok: false, retry: Math.ceil((b.lock - now) / 1000) };
  b.count++;
  if (b.count > max) {
    b.lock = now + 60 * 1000;
    rateBuckets[key] = b;
    return { ok: false, retry: 60 };
  }
  rateBuckets[key] = b;
  return { ok: true };
}
setInterval(() => {
  const now = Date.now();
  for (const k of Object.keys(rateBuckets)) if (rateBuckets[k].reset < now) delete rateBuckets[k];
}, 10 * 60 * 1000).unref();

/* ------------------------- security headers ------------------------- */
const CSP = [
  "default-src 'self'",
  // 'unsafe-inline' is required by the login page inline script and the Live Preview srcdoc iframe
  // 'unsafe-eval' is required by Babel to compile JSX inside the Live Preview; remove both to
  // harden further if you don't use those features.
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://unpkg.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "media-src 'self' blob: data:",
  "connect-src 'self'",
  "font-src 'self' data:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');
function secureHeaders(res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Permissions-Policy', 'camera=(), geolocation=(), microphone=(self)');
  res.setHeader('Content-Security-Policy', CSP);
  // NOTE: no X-Frame-Options / frame-ancestors — the app is designed to be embedded
  // (Arena live preview). Add them in your reverse proxy for stricter deployments.
}
async function handleAuth(req, res, kind) {
  if (kind === 'status') {
    const s = getSession(req);
    return sendJson(res, {
      authenticated: !!s,
      needsSetup: authUsers.users.length === 0,
      allowSignup: config.authAllowSignup === true,
      wsName: config.wsName,
      user: s ? { username: s.username } : null,
    });
  }
  // brute-force protection: max 10 login/register attempts per 10 minutes per IP
  const rl = rateLimit(req, 'auth', 10, 10 * 60 * 1000);
  if (!rl.ok) return sendJson(res, { error: 'Too many attempts — try again in ' + rl.retry + 's' }, 429);
  let body;
  try { body = JSON.parse((await readBody(req, 100e3)) || '{}'); } catch { return sendJson(res, { error: 'Invalid request' }, 400); }
  const username = String(body.username || '').trim();
  const password = String(body.password || '');
  if (kind !== 'logout') {
    if (!/^[A-Za-z0-9_.-]{3,32}$/.test(username)) return sendJson(res, { error: 'Username: 3–32 chars, letters/digits/._- only' }, 400);
    if (password.length < 6) return sendJson(res, { error: 'Password must be at least 6 characters' }, 400);
  }
  if (kind === 'register') {
    if (!(authUsers.users.length === 0 || config.authAllowSignup === true)) return sendJson(res, { error: 'Account setup already done. Sign in instead.' }, 403);
    if (authUsers.users.some((u) => u.username === username)) return sendJson(res, { error: 'Username already taken' }, 409);
    const { salt, hash } = hashPassword(password);
    authUsers.users.push({ id: makeId(6), username, salt, hash, createdAt: Date.now() });
    saveUsers();
    res.setHeader('Set-Cookie', sessionCookie(createSession(username)));
    return sendJson(res, { ok: true, user: { username } });
  }
  if (kind === 'login') {
    const u = authUsers.users.find((x) => x.username === username);
    if (!u || !verifyPassword(password, u.salt, u.hash)) return sendJson(res, { error: 'Invalid username or password' }, 401);
    res.setHeader('Set-Cookie', sessionCookie(createSession(username)));
    return sendJson(res, { ok: true, user: { username } });
  }
  clearSession(req, res);
  sendJson(res, { ok: true });
}

function saveChats() { writeJson(FILES.chats, chats); persistKV('chats', chats); }
function saveConfig() { writeJson(FILES.config, config); persistKV('config', config); }
function saveUsage() { writeJson(FILES.usage, usage); persistKV('usage', usage); }

const makeId = (n = 6) => crypto.randomBytes(n).toString('hex');
const dayKey = () => new Date().toISOString().slice(0, 10);

function usageFor(day) {
  return usage[day] || { prompt: 0, completion: 0, requests: 0, images: 0, tts: 0, video: 0, music: 0, byProvider: {} };
}
function addUsage({ provider = 'unknown', prompt = 0, completion = 0, kind = 'text' }) {
  const day = dayKey();
  const u = usageFor(day);
  u.prompt += prompt || 0;
  u.completion += completion || 0;
  u.requests += 1;
  if (kind === 'image') u.images += 1;
  if (kind === 'tts') u.tts += (completion || 0); // chars spoken
  if (kind === 'video') u.video += 1;
  if (kind === 'music') u.music += 1;
  const bp = u.byProvider[provider] || (u.byProvider[provider] = { prompt: 0, completion: 0, requests: 0 });
  bp.prompt += prompt || 0; bp.completion += completion || 0; bp.requests += 1;
  usage[day] = u;
  saveUsage();
  return u;
}

/* ------------------------- provider helpers ------------------------- */
function catalogById(id) { return CATALOG.find((c) => c.id === id); }
function envKeyFor(id) {
  const cat = catalogById(id);
  return (cat && cat.envKey && process.env[cat.envKey]) || '';
}
function providerKey(id) {
  const p = (config.providers || {})[id] || {};
  return p.key || envKeyFor(id);
}
function maskKey(k) {
  if (!k) return '';
  const s = String(k);
  return s.length <= 4 ? '••••' : '••••' + s.slice(-4);
}
function providerSettings(id) {
  const cat = catalogById(id);
  const p = (config.providers || {})[id] || {};
  return {
    id,
    label: cat ? cat.label : id,
    native: !!(cat && cat.native),
    local: !!(cat && cat.local),
    keyURL: (cat && cat.keyURL) || '',
    models: (cat && cat.models) || [],
    enabled: !!p.enabled,
    hasKey: !!providerKey(id),
    keyTail: maskKey(providerKey(id)),
    baseURL: (p.baseURL || (cat && cat.baseURL) || '').replace(/\/+$/, ''),
    model: p.model || (cat && cat.defaultModel) || '',
    defaultModel: (cat && cat.defaultModel) || '',
  };
}
function resolveChatProvider(requestedId) {
  const want = (requestedId || 'auto').trim();
  if (want && want !== 'auto') {
    const s = providerSettings(want);
    if (!s.enabled) throw new ApiError(400, `Provider "${want}" is disabled. Enable it in Settings.`, s);
    if (!s.hasKey && !s.local) throw new ApiError(400, `No API key found for ${s.label}. Add one in Settings.`, s);
    return s;
  }
  for (const c of CATALOG) {
    const s = providerSettings(c.id);
    if (s.enabled && (s.hasKey || s.local)) return s;
  }
  return null;
}

/* Auto mode: try providers in priority order, fall back automatically. */
const AUTO_PRIORITY = ['omniroute', 'openrouter', 'openai', 'deepseek', 'groq', 'gemini', 'anthropic', 'custom', 'ollama'];
function isLocalURL(u) { return /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])/i.test(String(u || '')); }
function autoCandidates() {
  const list = [];
  for (const id of AUTO_PRIORITY) {
    const st = providerSettings(id);
    if (st && st.enabled && (st.hasKey || st.local) && !isLocalURL(st.baseURL)) list.push(st);
  }
  for (const c of CATALOG) {
    const st = providerSettings(c.id);
    if (st && st.enabled && (st.hasKey || st.local) && !isLocalURL(st.baseURL) && !list.includes(st)) list.push(st);
  }
  return list;
}

/* ------------------------- message conversion ------------------------- */
function partsOf(m) {
  if (m && Array.isArray(m.parts) && m.parts.length) return m.parts;
  const c = (m && m.content) || '';
  return c ? [{ type: 'text', text: c }] : [];
}
function textOf(m) { return partsOf(m).map((p) => (p.type === 'text' ? p.text : '')).filter(Boolean).join('\n\n'); }
function hasImages(m) { return partsOf(m).some((p) => p.type === 'image'); }
function toOpenAIContent(m) {
  const parts = partsOf(m);
  if (!parts.length) return { role: m.role, content: '' };
  if (!hasImages(m)) return { role: m.role, content: parts.map((p) => p.text).join('\n\n') };
  const content = [];
  for (const p of parts) {
    if (p.type === 'image') content.push({ type: 'image_url', image_url: { url: `data:${p.mime || 'image/png'};base64,${p.b64}` } });
    else content.push({ type: 'text', text: p.text || '' });
  }
  return { role: m.role, content };
}
function toAnthropicContent(m) {
  const parts = partsOf(m);
  if (!parts.length) return { role: m.role, content: '' };
  if (!hasImages(m)) return { role: m.role, content: parts.map((p) => p.text).join('\n\n') };
  const content = [];
  for (const p of parts) {
    if (p.type === 'image') content.push({ type: 'image', source: { type: 'base64', media_type: p.mime || 'image/png', data: p.b64 } });
    else content.push({ type: 'text', text: p.text || '' });
  }
  return { role: m.role, content };
}

/* ------------------------- SSE pump for upstream ------------------------- */
async function pumpSSE(resp, onData) {
  const reader = resp.body.getReader();
  const dec = new TextDecoder();
  let buf = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let i;
    while ((i = buf.indexOf('\n')) !== -1) {
      const line = buf.slice(0, i).replace(/\r$/, '');
      buf = buf.slice(i + 1);
      if (!line.startsWith('data:')) continue;
      const data = line.slice(5).trim();
      if (!data || data === '[DONE]') continue;
      try { onData(JSON.parse(data)); } catch { /* skip malformed */ }
    }
  }
}

class ApiError extends Error {
  constructor(status, message, prov) { super(message); this.status = status; this.prov = prov; }
}
function extractApiError(text) {
  try {
    const j = JSON.parse(text);
    return j.error && (j.error.message || j.error) || j.message || text.slice(0, 300);
  } catch { return (text || '').slice(0, 300); }
}
function friendlyError(e, prov) {
  const p = prov ? `${prov.label}: ` : '';
  if (e instanceof ApiError) {
    if (e.status === 401 || e.status === 403) return `${p}Invalid API key (401/403). Check the key in Settings.`;
    if (e.status === 429) return `${p}Rate limited (429). Wait a moment and try again.`;
    if (e.status === 404) return `${p}Model or endpoint not found (404). Check the model name / base URL in Settings.`;
    if (e.status >= 500) return `${p}Provider error (${e.status}). Try again shortly.`;
    return `${p}${e.message}`;
  }
  if (e.name === 'AbortError') return 'Generation stopped.';
  return `${p}${e.message || 'Request failed'}`;
}

async function streamOpenAICompat(prov, model, system, msgs, cb) {
  const url = `${prov.baseURL}/chat/completions`;
  const messages = [{ role: 'system', content: system }, ...msgs.map(toOpenAIContent)];
  const basePayload = {
    model, messages, stream: true,
    temperature: typeof config.temperature === 'number' ? config.temperature : 0.7,
  };
  if (config.maxTokens && !prov.local) basePayload.max_tokens = config.maxTokens;
  const headers = { 'Content-Type': 'application/json' };
  headers["Authorization"] = "Bearer " + providerKey(prov.id);
  let payload = { ...basePayload };
  if (!prov.local) payload.stream_options = { include_usage: true };
  let r = await fetch(url, { method: 'POST', headers, body: JSON.stringify(payload), signal: cb.signal });
  if (!r.ok) {
    const text = await r.text().catch(() => '');
    if (!prov.local && /stream_options/i.test(text)) { // strict providers may reject stream_options
      r = await fetch(url, { method: 'POST', headers, body: JSON.stringify(basePayload), signal: cb.signal });
    }
    if (!r.ok) throw new ApiError(r.status, extractApiError(text), prov);
  }
  await pumpSSE(r, (j) => {
    const ch = j.choices && j.choices[0];
    if (ch && ch.delta) {
      if (ch.delta.content) cb.onDelta(ch.delta.content);
      if (ch.delta.reasoning_content) cb.onReasoning(ch.delta.reasoning_content);
    }
    if (j.usage) cb.onUsage(j.usage.prompt_tokens || 0, j.usage.completion_tokens || 0);
  });
}

async function streamAnthropic(prov, model, system, msgs, cb) {
  const url = `${prov.baseURL}/v1/messages`;
  const payload = {
    model,
    max_tokens: config.maxTokens || 4096,
    stream: true,
    system,
    messages: msgs.map(toAnthropicContent),
  };
  const headers = { 'Content-Type': 'application/json', 'x-api-key': providerKey(prov.id), 'anthropic-version': '2023-06-01' };
  const r = await fetch(url, { method: 'POST', headers, body: JSON.stringify(payload), signal: cb.signal });
  if (!r.ok) {
    const text = await r.text().catch(() => '');
    throw new ApiError(r.status, extractApiError(text), prov);
  }
  await pumpSSE(r, (j) => {
    if (j.type === 'message_start') cb.onUsage((j.message && j.message.usage && j.message.usage.input_tokens) || 0, 0);
    else if (j.type === 'content_block_delta') {
      const d = j.delta || {};
      if (d.type === 'text_delta' && d.text) cb.onDelta(d.text);
      else if (d.type === 'thinking_delta' && d.thinking) cb.onReasoning(d.thinking);
    } else if (j.type === 'message_delta') cb.onUsage(0, (j.usage && j.usage.output_tokens) || 0);
    else if (j.type === 'error') throw new Error((j.error && j.error.message) || 'Anthropic stream error');
  });
}

/* ------------------------- HTTP helpers ------------------------- */
function sendJson(res, obj, status = 200) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  res.end(JSON.stringify(obj));
}
function sse(res, event, data) {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}
function readBody(req, limit = 14 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > limit) { reject(new Error('Payload too large')); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml', '.webp': 'image/webp', '.ico': 'image/x-icon', '.woff2': 'font/woff2',
  '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.txt': 'text/plain; charset=utf-8',
};
function serveStatic(req, res, pathname) {
  let rel = pathname === '/' ? 'index.html' : pathname.slice(1);
  let file;
  if (rel.startsWith('files/')) file = path.normalize(path.join(DATA_DIR, rel.slice('files/'.length)));
  else file = path.normalize(path.join(PUBLIC_DIR, rel));
  if (!file.startsWith(DATA_DIR) && !file.startsWith(PUBLIC_DIR)) { res.writeHead(403); return res.end('Forbidden'); }
  fs.readFile(file, (err, buf) => {
    if (err) { res.writeHead(404, { 'Content-Type': 'text/plain' }); return res.end('Not found'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(buf);
  });
}

/* ------------------------- API: state & settings ------------------------- */
function getState(session) {
  return {
    ok: true,
    user: session && session.username ? { username: session.username } : null,
    authAllowSignup: config.authAllowSignup === true,
    name: config.name,
    wsName: config.wsName,
    tagline: config.tagline,
    logo: config.logo,
    accent: config.accent,
    compact: config.compact,
    systemPrompt: config.systemPrompt,
    autoProvider: config.autoProvider,
    temperature: config.temperature,
    maxTokens: config.maxTokens,
    limits: config.limits,
    image: config.image,
    tts: config.tts,
    search: { provider: (config.search && config.search.provider) || 'auto', tavily: !!((config.search || {}).tavily), jina: !!((config.search || {}).jina) },
    stt: { provider: ((config.stt || {}).provider) || 'assemblyai', hasKey: !!((config.stt || {}).key) },
    aiModels: config.aiModels || [],
    mcp: config.mcp || {},
    plugins: config.plugins || {},
    agents: config.agents || [],
    dataDir: DATA_DIR,
    dbMode,
    dbConfigured: !!(DATABASE_URL || fbAdminConfig()),
    usage: usageFor(dayKey()),
    chats: chats.chats
      .map((c) => ({ id: c.id, title: c.title, updatedAt: c.updatedAt, count: c.messages.length }))
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, 200),
    providers: CATALOG.map((c) => {
      const s = providerSettings(c.id);
      return { id: s.id, label: s.label, native: s.native, local: s.local, keyURL: s.keyURL, enabled: s.enabled, hasKey: s.hasKey, keyTail: s.keyTail, baseURL: s.baseURL, model: s.model, defaultModel: s.defaultModel, models: s.models };
    }),
  };
}

async function handleSettings(req, res) {
  const body = JSON.parse((await readBody(req, 2e6)) || '{}');
  for (const k of ['name', 'wsName', 'tagline', 'logo', 'accent', 'compact', 'systemPrompt', 'temperature', 'maxTokens', 'autoProvider', 'authAllowSignup', 'limits', 'image', 'aiModels', 'mcp', 'plugins', 'agents']) {
    if (body[k] !== undefined) config[k] = body[k];
  }
  for (const k of ['tts', 'search', 'stt']) {
    if (body[k] && typeof body[k] === 'object') config[k] = { ...(config[k] || {}), ...body[k] };
  }
  if (body.providers && typeof body.providers === 'object') {
    for (const id of Object.keys(body.providers)) {
      const patch = body.providers[id] || {};
      const cur = config.providers[id] || {};
      const next = { ...cur };
      if (patch.enabled !== undefined) next.enabled = !!patch.enabled;
      if (patch.key !== undefined) next.key = patch.key; // only sent when user typed something
      if (patch.baseURL !== undefined) next.baseURL = patch.baseURL;
      if (patch.model !== undefined) next.model = patch.model;
      config.providers[id] = next;
    }
  }
  saveConfig();
  sendJson(res, getState(req.session));
}

/* ------------------------- API: chats ------------------------- */
function findChat(id) { return chats.chats.find((c) => c.id === id); }
function deriveTitle(parts) {
  const t = parts.map((p) => (p.type === 'text' ? p.text : '')).join(' ').trim();
  return (t || 'New chat').slice(0, 42);
}
function handleCreateChat(req, res) {
  const chat = { id: makeId(), title: 'New chat', createdAt: Date.now(), updatedAt: Date.now(), messages: [] };
  chats.chats.push(chat);
  saveChats();
  sendJson(res, { id: chat.id });
}
function handleGetChat(res, id) {
  const c = findChat(id);
  if (!c) return sendJson(res, { error: 'Chat not found' }, 404);
  sendJson(res, c);
}
function handleDeleteChat(res, id) {
  chats.chats = chats.chats.filter((c) => c.id !== id);
  saveChats();
  sendJson(res, { ok: true });
}
async function handlePatchChat(req, res, id) {
  const c = findChat(id);
  if (!c) return sendJson(res, { error: 'Chat not found' }, 404);
  const body = JSON.parse((await readBody(req, 1e5)) || '{}');
  if (typeof body.title === 'string') c.title = body.title.slice(0, 80);
  c.updatedAt = Date.now();
  saveChats();
  sendJson(res, { ok: true });
}

/* ------------------------- API: chat (SSE stream) ------------------------- */
async function handleChat(req, res) {
  let body;
  try { body = JSON.parse((await readBody(req)) || '{}'); }
  catch { return sendJson(res, { ok: false, error: 'Invalid request body' }, 400); }
  const jsonMode = body.json === true;
  let jErr = null;
  const fail = (msg) => {
    if (jsonMode) return sendJson(res, { ok: false, error: msg, chatId: null }, 400);
    sse(res, 'error', { message: msg });
    sse(res, 'done', {});
    return res.end();
  };
  if (!jsonMode) res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
    'Access-Control-Allow-Origin': '*',
  });

  let profileName = null;
  const profileId = body.modelProfile ? String(body.modelProfile) : '';
  const provs = [];
  try {
    if (profileId) {
      const prof = (config.aiModels || []).find((p) => p.id === profileId);
      if (!prof) throw new ApiError(400, 'Unknown model profile "' + profileId + '"');
      const prov = resolveChatProvider(prof.provider);
      if (!prov) throw new ApiError(400, 'No AI provider configured. Open ⚙ Settings → enable a provider → paste an API key. (Or set up Ollama for free local models.)');
      profileName = prof.name;
      provs.push(prov);
    } else {
      const requested = (body.provider && String(body.provider).trim()) || 'auto';
      if (requested === 'auto') {
        const list = autoCandidates();
        if (!list.length) throw new ApiError(400, 'No AI provider configured. Open ⚙ Settings → enable a provider → paste an API key. (Or set up Ollama for free local models.)');
        provs.push(...list);
      } else {
        const prov = resolveChatProvider(requested);
        if (!prov) throw new ApiError(400, 'No AI provider configured. Open ⚙ Settings → enable a provider → paste an API key. (Or set up Ollama for free local models.)');
        provs.push(prov);
      }
    }
  } catch (e) {
    return fail(friendlyError(e, e.prov));
  }

  let system = (typeof body.system === 'string' && body.system.trim()) || config.systemPrompt || DEFAULT_CONFIG.systemPrompt;
  if (body.reason) system += '\n\nThink carefully, step by step, before answering.';
  if (body.searchContext) system += `\n\nWEB SEARCH CONTEXT (use it; cite sources as [1], [2] where relevant):\n${String(body.searchContext).slice(0, 6000)}`;

  const history = (Array.isArray(body.history) ? body.history : []).filter((m) => m.role === 'user' || m.role === 'assistant');
  const userParts = Array.isArray(body.userParts) ? body.userParts : [];
  const commitUser = body.commitUser !== false;

  let chat = body.chatId ? findChat(body.chatId) : null;
  if (!chat) {
    chat = { id: makeId(), title: deriveTitle(userParts), createdAt: Date.now(), updatedAt: Date.now(), messages: [] };
    chats.chats.push(chat);
  }
  chat.updatedAt = Date.now();
  if (typeof body.truncateAt === 'number') {
    chat.messages = chat.messages.slice(0, Math.max(0, Math.floor(body.truncateAt)));
  } else if (commitUser && userParts.length) {
    chat.messages.push({ id: makeId(), role: 'user', parts: userParts, ts: Date.now() });
  } else {
    // regenerate: drop any trailing assistant message(s) that are being replaced
    while (chat.messages.length && chat.messages[chat.messages.length - 1].role === 'assistant') chat.messages.pop();
  }
  if (chat.messages.length && chat.title === 'New chat') chat.title = deriveTitle(userParts.length ? userParts : partsOf(chat.messages[0]));
  saveChats();
  // messages actually sent upstream: previous history + the new user message (if any)
  const sendMsgs = (commitUser && userParts.length) ? [...history, { role: 'user', parts: userParts }] : history;

  const acc = { text: '', reasoning: '', prompt: 0, completion: 0, finished: false };
  const ctrl = new AbortController();
  req.on('close', () => ctrl.abort());
  const onDelta = (t) => { acc.text += t; if (!jsonMode) sse(res, 'delta', { text: t }); };
  const onReasoning = (t) => { acc.reasoning += t; if (!jsonMode) sse(res, 'reasoning', { text: t }); };
  const onUsage = (p, c) => {
    acc.prompt += p || 0; acc.completion += c || 0;
    if (!jsonMode) sse(res, 'usage', { prompt: acc.prompt, completion: acc.completion });
  };

  // Auto mode: try each candidate provider until one answers (LMArena-style fallback)
  let usedProv = null, usedModel = '', lastErr = null;
  for (const prov of provs) {
    const model = (body.model && String(body.model).trim()) || prov.model || '';
    if (!model) { lastErr = new ApiError(400, 'No model selected for ' + prov.label + '. Choose one in Settings → ' + prov.label + ' → Model.', prov); continue; }
    if (!jsonMode) sse(res, 'meta', { chatId: chat.id, provider: prov.id, model, profile: profileName ? { id: profileId, name: profileName } : null, auto: provs.length > 1 });
    const t0 = acc.text.length, r0 = acc.reasoning.length, u0 = { prompt: acc.prompt, completion: acc.completion };
    const sig = (typeof AbortSignal.any === 'function') ? AbortSignal.any([ctrl.signal, AbortSignal.timeout(90000)]) : ctrl.signal;
    try {
      if (prov.native) await streamAnthropic(prov, model, system, sendMsgs, { onDelta, onReasoning, onUsage, signal: sig });
      else await streamOpenAICompat(prov, model, system, sendMsgs, { onDelta, onReasoning, onUsage, signal: sig });
      acc.finished = true;
      usedProv = prov; usedModel = model;
      break;
    } catch (e) {
      acc.text = acc.text.slice(0, t0); acc.reasoning = acc.reasoning.slice(0, r0);
      acc.prompt = u0.prompt; acc.completion = u0.completion;
      lastErr = e;
      if (ctrl.signal.aborted) break;
    }
  }
  if (!acc.finished && lastErr && !ctrl.signal.aborted) {
    const msg = friendlyError(lastErr, lastErr.prov);
    if (jsonMode) jErr = msg;
    else sse(res, 'error', { message: msg });
  }

  if (acc.text || acc.reasoning) {
    chat.messages.push({
      id: makeId(), role: 'assistant', content: acc.text || '(stopped)',
      reasoning: acc.reasoning || undefined,
      provider: usedProv ? usedProv.id : (lastErr && lastErr.prov ? lastErr.prov.id : ''), model: usedModel || '', usage: { prompt: acc.prompt, completion: acc.completion },
      stopped: !acc.finished, ts: Date.now(),
    });
  }
  saveChats();
  addUsage({ provider: usedProv ? usedProv.id : 'auto', prompt: acc.prompt, completion: acc.completion, kind: 'text' });
  if (jsonMode) {
    const okResp = !jErr || !!(acc.text || acc.reasoning);
    return sendJson(res, {
      ok: okResp, chatId: chat.id,
      provider: usedProv ? usedProv.id : 'auto', model: usedModel || '',
      error: jErr || null,
      message: (acc.text || acc.reasoning) ? {
        content: acc.text || '(stopped)', reasoning: acc.reasoning || undefined,
        stopped: !acc.finished, prompt: acc.prompt, completion: acc.completion,
      } : null,
    }, okResp ? 200 : 502);
  }
  sse(res, 'done', { provider: usedProv ? usedProv.id : 'auto', model: usedModel || '', stopped: !acc.finished, prompt: acc.prompt, completion: acc.completion });
  res.end();
}

/* ------------------------- API: image generation ------------------------- */
async function handleImages(req, res) {
  let body;
  try { body = JSON.parse((await readBody(req, 1e6)) || '{}'); } catch { return sendJson(res, { error: 'Invalid body' }, 400); }
  const prompt = String(body.prompt || '').trim();
  if (!prompt) return sendJson(res, { error: 'Empty prompt' }, 400);

  const cfg = config.image || {};
  const prov = providerSettings(cfg.provider || 'openai');
  const model = cfg.model || 'gpt-image-1';
  if (!prov.hasKey) return sendJson(res, { error: `No API key for ${prov.label} — needed for image generation. Add it in Settings.` }, 400);
  if (!prov.baseURL) return sendJson(res, { error: 'Set an image-provider base URL in Settings → Image generation.' }, 400);

  const url = `${prov.baseURL}/images/generations`;
  const headers = { 'Content-Type': 'application/json', Authorization: 'Bearer ' + providerKey(prov.id) };
  const payload1 = { model, prompt, n: 1, size: cfg.size || '1024x1024', response_format: 'b64_json' };
  let r = await fetch(url, { method: 'POST', headers, body: JSON.stringify(payload1) });
  if (!r.ok) {
    const t = await r.text().catch(() => '');
    if (/response_format/i.test(t)) { // some models (e.g. gpt-image-1) reject response_format
      r = await fetch(url, { method: 'POST', headers, body: JSON.stringify({ model, prompt, n: 1, size: cfg.size || '1024x1024' }) });
    }
  }
  if (!r.ok) {
    const t = await r.text().catch(() => '');
    return sendJson(res, { error: `${prov.label}: ${extractApiError(t)}` }, r.status || 500);
  }
  const j = await r.json();
  const item = j.data && j.data[0];
  let buf = null;
  if (item && item.b64_json) buf = Buffer.from(item.b64_json, 'base64');
  else if (item && item.url) { const ir = await fetch(item.url); buf = Buffer.from(await ir.arrayBuffer()); }
  if (!buf) return sendJson(res, { error: 'Provider returned no image' }, 502);
  const name = `gen-${Date.now()}-${makeId(3)}.png`;
  fs.writeFileSync(path.join(GEN_DIR, name), buf);
  addUsage({ provider: cfg.provider, kind: 'image' });
  sendJson(res, { url: '/files/generated/' + name, prompt, model });
}

/* ------------------------- API: text-to-speech ------------------------- */
async function handleTTS(req, res) {
  let body;
  try { body = JSON.parse((await readBody(req, 1e6)) || '{}'); } catch { return sendJson(res, { error: 'Invalid body' }, 400); }
  const text = String(body.text || '').trim();
  if (!text) return sendJson(res, { error: 'Empty text' }, 400);
  const cfg = config.tts || {};
  if (cfg.provider === 'elevenlabs') {
    const key = cfg.key || process.env.ELEVENLABS_API_KEY || '';
    if (!key) return sendJson(res, { error: 'Add an ElevenLabs API key in Settings → Voice.' }, 400);
    const voice = cfg.voice || '21m00Tcm4TlvDq8ikWAM';
    const r = await fetch('https://api.elevenlabs.io/v1/text-to-speech/' + encodeURIComponent(voice), {
      method: 'POST',
      headers: { 'xi-api-key': key, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model_id: cfg.model || 'eleven_multilingual_v2', text: text.slice(0, 4000), voice_settings: { stability: 0.5, similarity_boost: 0.75 } }),
      signal: AbortSignal.timeout(60000),
    });
    if (!r.ok) { const t = await r.text().catch(() => ''); return sendJson(res, { error: 'ElevenLabs: ' + extractApiError(t) }, r.status || 500); }
    const buf = Buffer.from(await r.arrayBuffer());
    addUsage({ provider: 'elevenlabs', completion: text.length, kind: 'tts' });
    res.writeHead(200, { 'Content-Type': 'audio/mpeg', 'Cache-Control': 'no-store', 'Access-Control-Allow-Origin': '*' });
    return res.end(buf);
  }
  const prov = providerSettings(cfg.provider || 'openai');
  if (!prov.hasKey) return sendJson(res, { error: `No API key for ${prov.label} — needed for TTS. Add it in Settings.` }, 400);
  if (!prov.baseURL) return sendJson(res, { error: 'Set a TTS base URL in Settings → Voice.' }, 400);
  const url = `${prov.baseURL}/audio/speech`;
  const headers = { 'Content-Type': 'application/json', Authorization: 'Bearer ' + providerKey(prov.id) };
  const r = await fetch(url, {
    method: 'POST', headers,
    body: JSON.stringify({ model: cfg.model || 'tts-1', voice: cfg.voice || 'alloy', input: text.slice(0, 4000) }),
  });
  if (!r.ok) {
    const t = await r.text().catch(() => '');
    return sendJson(res, { error: `${prov.label}: ${extractApiError(t)}` }, r.status || 500);
  }
  const buf = Buffer.from(await r.arrayBuffer());
  addUsage({ provider: cfg.provider, completion: text.length, kind: 'tts' });
  res.writeHead(200, { 'Content-Type': 'audio/mpeg', 'Cache-Control': 'no-store', 'Access-Control-Allow-Origin': '*' });
  res.end(buf);
}

/* ------------------------- API: web search ------------------------- */
async function handleSearch(res, q) {
  if (!q) return sendJson(res, { topics: [] });
  const sc = config.search || {};
  // 1) Tavily
  const tKey = sc.tavily || process.env.TAVILY_API_KEY || '';
  if (tKey) {
    try {
      const r = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: tKey, query: q, max_results: 6, search_depth: 'basic' }),
        signal: AbortSignal.timeout(10000),
      });
      const j = await r.json();
      const topics = (j.results || []).map((x) => ({ text: (x.title || '') + (x.content ? '\n' + x.content : ''), url: x.url || '' }));
      return sendJson(res, { heading: q, abstract: topics.length ? topics[0].text.split('\n')[0] : '', topics, source: 'tavily' });
    } catch (e) { /* fall through */ }
  }
  // 2) Jina AI
  const jKey = sc.jina || process.env.JINA_API_KEY || '';
  if (jKey) {
    try {
      const r = await fetch('https://s.jina.ai/?q=' + encodeURIComponent(q), {
        headers: { Authorization: 'Bearer ' + jKey, 'User-Agent': 'AaruAI/1.0' },
        signal: AbortSignal.timeout(10000),
      });
      const j = await r.json();
      const topics = ((j.data && j.data.results) || []).slice(0, 6).map((x) => ({ text: x.title || x.description || '', url: x.url || '' }));
      return sendJson(res, { heading: q, abstract: topics.length ? topics[0].text : '', topics, source: 'jina' });
    } catch (e) { /* fall through */ }
  }
  // 3) free fallback: DuckDuckGo instant answers + Wikipedia
  try {
    const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(q)}&format=json&no_html=1&skip_disambig=1`;
    const r = await fetch(url, { signal: AbortSignal.timeout(8000), headers: { 'User-Agent': 'AaruAI/1.0' } });
    const j = await r.json();
    const topics = (j.RelatedTopics || [])
      .map((t) => (t.Topics && t.Topics[0]) || t)
      .filter((t) => t && t.Text)
      .slice(0, 6)
      .map((t) => ({ text: t.Text, url: t.FirstURL || '' }));
    let abstract = j.AbstractText || j.Answer || '';
    let heading = j.Heading || '';
    if (!abstract && !topics.length) { // fallback: wikipedia summary
      try {
        const wr = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(q)}`, { signal: AbortSignal.timeout(6000) });
        const wj = await wr.json();
        if (wj.extract) { abstract = wj.extract; heading = wj.title || q; topics.unshift({ text: wj.extract.slice(0, 220), url: wj.content_urls && wj.content_urls.desktop && wj.content_urls.desktop.page || '' }); }
      } catch {}
    }
    sendJson(res, { heading, abstract, topics, source: 'ddg' });
  } catch (e) {
    sendJson(res, { error: e.message, topics: [] });
  }
}

/* ------------------------- API: speech-to-text (AssemblyAI) ------------------------- */
async function handleTranscribe(req, res) {
  let body;
  try { body = JSON.parse((await readBody(req, 40e6)) || '{}'); } catch { return sendJson(res, { error: 'Invalid body' }, 400); }
  const key = ((config.stt || {}).key) || process.env.ASSEMBLYAI_API_KEY || '';
  if (!key) return sendJson(res, { error: 'Add an AssemblyAI key in Settings.' }, 400);
  const buf = Buffer.from(String(body.audio || ''), 'base64');
  if (!buf.length) return sendJson(res, { error: 'Empty audio' }, 400);
  try {
    const up = await fetch('https://api.assemblyai.com/v2/upload', { method: 'POST', headers: { authorization: key, 'content-type': 'application/octet-stream' }, body: buf, signal: AbortSignal.timeout(60000) });
    if (!up.ok) return sendJson(res, { error: 'Upload failed: ' + (await up.text().catch(() => '')).slice(0, 140) }, 502);
    const { upload_url } = await up.json();
    const tr = await fetch('https://api.assemblyai.com/v2/transcript', { method: 'POST', headers: { authorization: key, 'content-type': 'application/json' }, body: JSON.stringify({ audio_url: upload_url, language_detection: true }), signal: AbortSignal.timeout(30000) });
    const tj = await tr.json();
    let t = null;
    for (let i = 0; i < 36; i++) {
      await new Promise((r) => setTimeout(r, 1000));
      const sr = await fetch('https://api.assemblyai.com/v2/transcript/' + tj.id, { headers: { authorization: key }, signal: AbortSignal.timeout(20000) });
      t = await sr.json();
      if (t.status === 'completed' || t.status === 'error' || t.status === 'rejected') break;
      if (!t) break;
    }
    if (!t || t.status !== 'completed') return sendJson(res, { error: (t && (t.error || t.status)) ? String(t.error || t.status).slice(0, 160) : 'Transcription timeout' }, 502);
    sendJson(res, { text: t.text || '', words: t.words || [] });
  } catch (e) {
    sendJson(res, { error: 'AssemblyAI: ' + e.message }, 502);
  }
}

/* ------------------------- API: export / import / reset ------------------------- */
function handleExport(res) {
  const out = { exportedAt: new Date().toISOString(), config, chats, usage };
  res.setHeader('Content-Disposition', 'attachment; filename="ai-os-backup.json"');
  sendJson(res, out);
}
async function handleImport(req, res) {
  const body = JSON.parse((await readBody(req, 20e6)) || '{}');
  if (body.config) config = mergeConfig(body.config);
  if (body.chats && Array.isArray(body.chats.chats)) chats = body.chats;
  if (body.usage && typeof body.usage === 'object') usage = body.usage;
  saveConfig(); saveChats(); saveUsage();
  sendJson(res, getState(req.session));
}

/* ------------------------- router & server ------------------------- */
const server = http.createServer(async (req, res) => {
  try {
    const u = new URL(req.url, 'http://localhost');
    const p = u.pathname;
    const m = req.method;
    secureHeaders(res);
    // global API protection: 400 requests / minute / IP (a chat stream is 1 request)
    if (p.startsWith('/api/') && p !== '/api/health') {
      const g = rateLimit(req, 'api', 400, 60 * 1000);
      if (!g.ok) return sendJson(res, { error: 'Too many requests — try again in a minute' }, 429);
    }
    if (m === 'OPTIONS') {
      res.writeHead(204, { 'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' });
      return res.end();
    }
    // ---- auth endpoints (public) ----
    if (p === '/api/auth/status' && m === 'GET') return await handleAuth(req, res, 'status');
    if (p === '/api/auth/register' && m === 'POST') return await handleAuth(req, res, 'register');
    if (p === '/api/auth/login' && m === 'POST') return await handleAuth(req, res, 'login');
    if (p === '/api/auth/logout' && m === 'POST') return await handleAuth(req, res, 'logout');
    // ---- everything else under /api/ requires a session ----
    if (p.startsWith('/api/') && p !== '/api/health') {
      const sess = getSession(req);
      if (!sess) return sendJson(res, { error: 'Unauthorized — please sign in' }, 401);
      req.session = sess;
    }
    if (p === '/api/health' && m === 'GET') return sendJson(res, { ok: true, ts: Date.now(), db: dbMode });
    if (p === '/api/state' && m === 'GET') return sendJson(res, getState(req.session));
    if (p === '/api/settings' && m === 'POST') return await handleSettings(req, res);
    if (p === '/api/chat' && m === 'POST') return await handleChat(req, res);
    if (p === '/api/chats' && m === 'POST') return handleCreateChat(req, res);
    if (p === '/api/images' && m === 'POST') return await handleImages(req, res);
    if (p === '/api/tts' && m === 'POST') return await handleTTS(req, res);
    if (p === '/api/transcribe' && m === 'POST') return await handleTranscribe(req, res);
    if (p === '/api/search' && m === 'GET') return await handleSearch(res, u.searchParams.get('q') || '');
    if (p === '/api/export' && m === 'GET') return handleExport(res);
    if (p === '/api/import' && m === 'POST') return await handleImport(req, res);
    if (p === '/api/reset' && m === 'POST') return sendJson(res, resetToDefaults(req.session));
    const cm = p.match(/^\/api\/chats\/([a-f0-9]+)$/);
    if (cm && m === 'GET') return handleGetChat(res, cm[1]);
    if (cm && m === 'DELETE') return handleDeleteChat(res, cm[1]);
    if (cm && m === 'PATCH') return await handlePatchChat(req, res, cm[1]);
    if (p.startsWith('/api/')) return sendJson(res, { error: 'Not found' }, 404);
    // static files: only the login page and assets are public
    const relStatic = p === '/' ? 'index.html' : p.slice(1);
    const isPublicStatic = relStatic === 'login.html' || relStatic.startsWith('assets/') || relStatic === 'favicon.ico';
    if (!isPublicStatic && !getSession(req)) { res.writeHead(302, { Location: '/login.html' }); return res.end(); }
    return serveStatic(req, res, p);
  } catch (e) {
    console.error('[error]', e.message);
    try { sendJson(res, { error: 'Internal error: ' + e.message }, 500); } catch {}
  }
});

initStorage().then(() => {
  server.listen(PORT, '0.0.0.0', () => {
    console.log('Aaru AI running at http://localhost:' + PORT);
    console.log('Storage:', dbMode === 'postgres' ? 'PostgreSQL' : dbMode === 'firebase' ? 'Firebase Firestore' : dbMode === 'rtdb' ? 'Firebase Realtime DB' : 'JSON files (data/)');
  });
}).catch((e) => {
  console.error('FATAL init failed:', e.message);
  process.exit(1);
});
