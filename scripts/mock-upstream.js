'use strict';
/* ============================================================
   MOCK UPSTREAM — a fake OpenAI-compatible AI provider
   Use it to test AI OS end-to-end with NO real API keys.
   It simulates: chat streaming, image generation, TTS.
   (A real "Arena" bridge or any provider speaks the same API.)
   Run:  node mock.js   (listens on :9999)
   ============================================================ */
const http = require('http');
const PORT = process.env.MOCK_PORT || 9999;

const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
);
const FAKE_MP3 = Buffer.from('ID3\x04\x00\x00\x00\x00\x00\x00mock-audio-stream-ai-os', 'binary');

function readBody(req) {
  return new Promise((resolve) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
  });
}
function sse(res, obj) {
  res.write(`data: ${JSON.stringify(obj)}\n\n`);
}
function replyFor(body) {
  const msgs = body.messages || [];
  const last = msgs[msgs.length - 1] || {};
  let text = '';
  const content = Array.isArray(last.content) ? last.content : [{ type: 'text', text: last.content || '' }];
  for (const p of content) {
    if (p.type === 'text') text += p.text;
    else if (p.type === 'image_url') text += ' 👁️[vision:image received]';
  }
  if (text.includes('image received')) {
    return [
      'I received your screenshot or image. 👁️',
      '',
      '**Mock vision reply** — in real mode, the provider\'s vision model would describe this image.',
    ].join('\n\n');
  }
  return `Mock reply from "${body.model}":\n\nYou said: "${text.slice(0, 120)}"\n\nThis is a **fake** provider used for testing AI OS. Add a real API key in Settings → AI Providers to get real answers. ✨`;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  try {
    if (req.method === 'GET' && url.pathname.endsWith('/models')) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ data: [{ id: 'mock-gpt' }, { id: 'mock-vision' }, { id: 'mock-image' }, { id: 'mock-tts' }] }));
    }
    if (req.method === 'POST' && url.pathname.endsWith('/chat/completions')) {
      const body = JSON.parse((await readBody(req)) || '{}');
      const text = replyFor(body);
      res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' });
      // stream word-ish chunks
      const words = text.split(/(\s+)/).filter(Boolean);
      let i = 0;
      const push = () => {
        if (i >= words.length) {
          sse(res, { choices: [{ delta: {} }], usage: { prompt_tokens: 25, completion_tokens: words.length } });
          res.write('data: [DONE]\n\n');
          return res.end();
        }
        sse(res, { choices: [{ delta: { content: words[i++] } }] });
        setTimeout(push, 12);
      };
      push();
      return;
    }
    if (req.method === 'POST' && url.pathname.endsWith('/images/generations')) {
      await readBody(req);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ data: [{ b64_json: TINY_PNG.toString('base64') }] }));
    }
    if (req.method === 'POST' && url.pathname.endsWith('/audio/speech')) {
      await readBody(req);
      res.writeHead(200, { 'Content-Type': 'audio/mpeg' });
      return res.end(FAKE_MP3);
    }
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: { message: 'mock: unknown route ' + url.pathname } }));
  } catch (e) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: { message: e.message } }));
  }
});
server.listen(PORT, '0.0.0.0', () => console.log('mock upstream on :' + PORT));
