# Aaru AI — Personal AI Studio ✨

Your own personal AI assistant dashboard — modern dark UI, multiple AI providers, agents, PPT generation,
 live app preview, login, and deployment-ready packaging. **Zero runtime dependencies**
(only Node.js ≥ 18) — no database, no `npm install` needed to run.

**New Feature**: 📊 PPT Generation - Create PowerPoint presentations from text prompts!

```
aaru-ai/
├── server.min.js          # production server (minified, comment-free) — run this
├── public/
│   ├── index.html         # the dashboard (branded "Aaru AI")
│   ├── login.html         # minimal login page: Welcome · username · password · Sign in
│   ├── app.min.js         # frontend logic (minified, obfuscated, comment-free)
│   ├── styles.css         # dark theme (comments stripped)
│   └── assets/hero.jpg    # artwork
├── src/                   # READABLE SOURCES — dev only, never deployed
│   ├── server.js
│   └── app.js
├── scripts/               # build + tests (dev tools)
├── data/                  # created at runtime: accounts, chats, usage, API keys
├── Dockerfile             # multi-stage: minified-only image (src/ stays out)
├── docker-compose.yml
└── package.json
```

## Quick start (local)

```bash
node server.min.js        # → http://localhost:3000
```

First visit shows the **Welcome** page — create your account (username + password) and
you're in. Then ⚙ Settings → API Manager → add at least one provider key.

## 🔐 Security — what is protected

| Layer | Protection |
|---|---|
| **Login** | scrypt-hashed passwords (`timingSafeEqual`), HTTP-only 30-day session cookies, first-account-only setup, optional signups |
| **Brute force** | 10 auth attempts / 10 min / IP → lockout; 400 API requests / min / IP |
| **API keys** | never sent to the browser — only masked tails are shown; stored in `data/config.json` |
| **Session hijack** | `HttpOnly`, `SameSite=Lax`, optional `Secure` (`COOKIE_SECURE=1` behind HTTPS) |
| **Path traversal** | normalized paths, `/files/` restricted to `data/generated` |
| **Headers** | CSP, `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, `Permissions-Policy` |
| **Error leaks** | generic `Internal server error` to clients — details stay in server logs |
| **Code readability** | shipped JS is **minified + mangled + comment-free** (built with terser). Readable sources stay in `src/` which is **excluded from the Docker image** |

> Honest limitation: browser-side JavaScript can always be inspected with DevTools — no
> obfuscation makes it impossible. What matters is that **all secrets stay server-side**
> (they do here) and the server is hardened (it is). Don't redistribute `src/`.

## 🌍 GO LIVE — use Aaru AI from your phone, anywhere (10 minutes)

The app listens on `0.0.0.0` and is fully deployable. The easiest zero-cost way to get a
**public URL you can open from any phone / any internet** is Render (Docker + free
PostgreSQL):

1. Make sure this repo is pushed to GitHub (already done: `Musahid33/AaruAi`)
2. Go to **https://render.com** → sign up with GitHub
3. **New + → Blueprint** → pick `Musahid33/AaruAi` → **Apply**.
   The included `render.yaml` automatically creates:
   - a **web service** (free) running the Docker image
   - a **free PostgreSQL** database with `DATABASE_URL` already wired in
4. Wait ~4 minutes for the build → open your URL: **https://aaruai.onrender.com**
5. Open it on your **mobile**, create your **username + password** (first run), done —
   **kahin se bhi, kisi bhi internet se!**

> ⚠️ Free-tier notes: the web service **sleeps after ~15 min** of no traffic (waking takes
> ~50s); the free PostgreSQL expires after **30 days** — export your data or upgrade before
> that. For 24×7 access, any $5/mo VPS + `docker compose up -d` works identically.

With `DATABASE_URL` set, **everything persists in PostgreSQL** (accounts, sessions, chats,
usage, settings, API keys). Without it, Aaru AI silently uses the zero-config `data/`
JSON files — same code, no setup needed.

### Option A — Docker (recommended)

```bash
npm run build            # regenerates server.min.js + public/app.min.js from src/
docker compose up -d --build
# → http://localhost:3000   (data persists in ./data)
```

The image is built in two stages; the final image contains **only** the minified runtime
— `src/`, `scripts/` and `data/` are never copied in.

### Option B — bare Node

```bash
node server.min.js
# or with PM2:
pm2 start server.min.js --name aaru-ai
```

### Option C — systemd unit (example)

```ini
[Unit]
Description=Aaru AI
After=network.target

[Service]
WorkingDirectory=/opt/aaru-ai
ExecStart=/usr/bin/node server.min.js
Restart=always
Environment=PORT=3000
Environment=COOKIE_SECURE=1

[Install]
WantedBy=multi-user.target
```

### Environment variables

| Var | Default | Purpose |
|---|---|---|
| `PORT` | `3000` | listen port |
| `COOKIE_SECURE` | `0` | set `1` when serving over HTTPS (Secure cookies) |
| `DATABASE_URL` | *(unset)* | PostgreSQL connection string → all data persists in PostgreSQL instead of `data/` JSON files (falls back gracefully if unavailable; `pg` is preinstalled in the Docker image) |

Put a TLS reverse proxy (Caddy/nginx) in front for HTTPS — that's also where you should
enable stricter framing rules if you want them.

## ✅ Tests

```bash
node scripts/mock-upstream.js   # fake OpenAI provider on :9999 (test without keys)
node scripts/e2e.js             # 43 checks: auth, chat, vision, images, TTS, backups
```

## Connecting providers

All in **⚙ Settings → API Manager**: OpenAI, Gemini, DeepSeek, Groq, OpenRouter,
Anthropic, local Ollama, and **Custom / Arena** (any OpenAI-compatible endpoint —
set base URL + key + model). Model profiles, agents, MCP toggles, plugins and
backup/restore live in the same Settings hub.

## Rebuilding after editing source

```bash
npm i -D terser
npm run build      # src/server.js → server.min.js, src/app.js → public/app.min.js
```

## 🔥 Firebase (persistent database — recommended)

Aaru AI persists **everything** (accounts, sessions, chats, usage, settings, API keys)
in **Firebase** when credentials are configured. It auto-detects which database your
project has: **Firestore** first, then **Realtime Database** — whichever exists is used.

| Env var | Value |
|---|---|
| `FIREBASE_SERVICE_ACCOUNT` | **base64** of `serviceAccountKey.json` (best for Render — no files) |
| `FIREBASE_CREDENTIALS` | the raw JSON of `serviceAccountKey.json` |
| `GOOGLE_APPLICATION_CREDENTIALS` | path to `serviceAccountKey.json` on disk |
| `FIREBASE_PROJECT_ID` + `FIREBASE_CLIENT_EMAIL` + `FIREBASE_PRIVATE_KEY` | split-key form |
| `FIREBASE_DATABASE_URL` | optional — RTDB URL override (defaults are auto-probed) |

### Setup (Realtime Database)
1. [console.firebase.google.com](https://console.firebase.google.com) → open/create a project
2. **Build → Realtime Database → Create database** (choose a region; the app probes the
   default URL and common regions automatically)
3. **Project settings (⚙) → Service accounts → Generate new private key** →
   downloads `serviceAccountKey.json`
4. Encode and set the env var:
   ```bash
   base64 -w0 serviceAccountKey.json     # copy the output
   # Render: Environment → add FIREBASE_SERVICE_ACCOUNT = that base64 string
   ```
5. Restart Aaru AI → log shows `[db] connected to Firebase Realtime Database` and
   Settings → Workspace shows "Firebase Realtime DB".

> 🔐 The database can contain API keys & password hashes — restrict direct access:
> Realtime Database **Rules** → `{ "rules": { ".read": false, ".write": false } }`
> (the Admin SDK bypasses rules; only browser clients are blocked). Never commit
> `serviceAccountKey.json` to git.

Priority: Firebase (Firestore → Realtime DB, if configured) → PostgreSQL (if `DATABASE_URL` set) → JSON files.

Priority: Firebase (if configured) → PostgreSQL (if `DATABASE_URL` set) → JSON files.

## 📊 PPT Generation

Generate PowerPoint presentations from text prompts using AI.

### Usage
1. Navigate to the PPT section in the dashboard
2. Enter your presentation topic or outline
3. Click "Generate PPT"
4. Download your presentation

**Note**: PPT generation requires an AI provider with presentation capabilities.
