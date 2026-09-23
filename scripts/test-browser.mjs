import http from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname } from 'node:path';
import { once } from 'node:events';
import { spawn } from 'node:child_process';
import { publicFiles } from './release-files.mjs';

// A static-only server mounted at the actual GitHub project path.
const prefix = '/poe2-farming/';
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp' };
const server = http.createServer(async (req, res) => {
  try {
    const path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const file = path.slice(prefix.length) || 'index.html';
    if (req.method !== 'GET' || !path.startsWith(prefix) || !publicFiles.includes(file)) { res.writeHead(404); res.end(); return; }
    const body = await readFile(`dist/${file}`);
    res.writeHead(200, { 'Content-Type': `${mime[extname(file)] || 'text/plain'}; charset=utf-8`, 'Cache-Control': 'no-store' }); res.end(body);
  } catch { res.writeHead(404); res.end(); }
});
server.listen(0, '127.0.0.1'); await once(server, 'listening');
await mkdir('test-results', { recursive: true });
try {
  const suites = ['release-browser', 'visual-setup-browser', 'detail-layout-browser', 'catalog-browser', 'editor-save-browser', 'trade-browser', 'migration-browser', 'usability-browser', 'recheck-browser', 'local-admin-browser'];
  const selected = process.argv.slice(2);
  if (selected.some(s => !suites.includes(s))) throw Error('Unknown browser suite');
  for (const suite of selected.length ? selected : suites) {
    console.log(`Browser check: ${suite}`);
    await new Promise((resolve, reject) => {
      const child = spawn(process.execPath, [`tests/${suite}.mjs`], {
        stdio: 'inherit', env: { ...process.env, APP_URL: `http://127.0.0.1:${server.address().port}${prefix}` }, windowsHide: true
      });
      child.on('error', reject); child.on('exit', code => code === 0 ? resolve() : reject(Error(`${suite} failed (${code})`)));
    });
  }
} finally { await new Promise(resolve => server.close(resolve)); }
