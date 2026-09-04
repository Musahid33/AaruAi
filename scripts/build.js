// Aaru AI — build script
// Minifies the readable sources in src/ into obfuscated, comment-free runtime files.
// Usage:   npm run build      (requires: npm i -D terser)
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const JOBS = [
  { src: 'src/server.js', out: 'server.min.js' },
  { src: 'src/app.js', out: 'public/app.min.js' },
];

let terser = 'terser';
try { execSync('terser --version', { stdio: 'ignore' }); }
catch {
  try { execSync('npx terser --version', { stdio: 'ignore' }); terser = 'npx terser'; }
  catch { console.error('Terser is required for the build.\n  npm i -D terser'); process.exit(1); }
}

for (const job of JOBS) {
  const src = path.join(ROOT, job.src);
  const out = path.join(ROOT, job.out);
  if (!fs.existsSync(src)) { console.error('missing source:', job.src); process.exit(1); }
  execSync(
    `${terser} "${src}" -c -m --comments false -o "${out}"`,
    { stdio: 'inherit' }
  );
  const kb = (fs.statSync(out).size / 1024).toFixed(1);
  console.log(`built ${job.out} (${kb} KB, minified + comment-free)`);
}
console.log('Build complete. Run with: node server.min.js');
