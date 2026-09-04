# data/ — runtime data (auto-created)

This folder is created automatically when Aaru AI runs. Nothing here is required to run the app.

⚠️ **WARNING:** once you use the app, this folder will contain SENSITIVE files:
- `config.json` — your AI-provider API keys
- `users.json` — account password hashes
- `chats.json`, `usage.json` — your chats and usage

Files like those are configured to stay OUT of git (`.gitignore`). If you ever want to
include them in a backup, use **Settings → Backup & Sync → Export backup** instead — and
keep that file private.

Only `.gitkeep` and this `README.md` are meant to be committed.
