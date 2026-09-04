# Testing without API keys: mock upstream

`mock-upstream.js` is a tiny **fake OpenAI-compatible AI provider**. It implements
`/v1/chat/completions` (streaming), `/images/generations` and `/audio/speech`
exactly like real providers do — so you can run AI OS end-to-end with **no API keys
and no costs** (great for testing the UI, and for dev).

## Run it

```bash
# terminal 1 — fake provider on :9999
node mock-upstream.js

# terminal 2 — AI OS on :3000
node ../server.js

# terminal 3 — run the test suite
node e2e.js
```

To point AI OS at the mock, open **Settings → Custom / Arena**, enable it and set:

- Base URL: `http://127.0.0.1:9999/v1`
- Model: `mock-gpt`

Then pick "Custom / Arena · mock-gpt" in the model selector and chat.

## How this maps to a real Arena / OpenRouter / etc.

A real provider uses the exact same protocol; only the base URL, key and model
change. The mock exists so you never need to "buy a key" just to look at the UI.
