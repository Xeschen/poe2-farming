import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { randomBytes } from 'node:crypto';
import { readLibrary, revisionOf, saveMethod } from './library-overrides.mjs';

const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.webp': 'image/webp' };
export function createLocalServer(root, { admin = false } = {}) {
  root = resolve(root);
  const token = randomBytes(32).toString('hex');
  let saving = false;
  return http.createServer(async (req, res) => {
    const json = (code, value) => { res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(value)); };
    try {
      const allowedHosts = [`127.0.0.1:${req.socket.localPort}`, `localhost:${req.socket.localPort}`];
      if (!allowedHosts.includes(req.headers.host)) return json(403, { error: '로컬 주소로 접속하세요.' });
      const origin = `http://${req.headers.host}`, url = new URL(req.url, origin);
      if (url.pathname.startsWith('/__admin/')) {
        if (!admin) return json(404, { error: 'Not found' });
        if (req.headers['sec-fetch-site'] === 'cross-site' || (req.headers.origin && req.headers.origin !== origin)) return json(403, { error: '같은 로컬 페이지에서만 사용할 수 있습니다.' });
        if (url.pathname === '/__admin/session' && req.method === 'GET') return json(200, { token });
        if (url.pathname !== '/__admin/library' || req.method !== 'PUT') return json(404, { error: 'Not found' });
        if (req.headers.origin !== origin || req.headers['x-admin-token'] !== token || req.headers['content-type'] !== 'application/json') return json(403, { error: '관리 세션을 확인하세요. 새로고침이 필요할 수 있습니다.' });
        if (saving) return json(409, { error: '다른 저장이 진행 중입니다. 잠시 후 다시 저장하세요.' });
        saving = true;
        try {
          let length = 0; const chunks = [];
          for await (const chunk of req) { length += chunk.length; if (length > 2_000_000) return json(413, { error: '저장 요청은 2 MB 이하여야 합니다.' }); chunks.push(chunk); }
          let body;
          try { body = JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { return json(400, { error: 'JSON 형식을 확인하세요.' }); }
          if (!body || typeof body !== 'object' || !body.method || typeof body.method !== 'object') return json(400, { error: '저장할 파밍법이 필요합니다.' });
          return json(200, await saveMethod(root, body));
        } finally { saving = false; }
      }
      if (!['GET', 'HEAD'].includes(req.method)) return json(405, { error: 'Method not allowed' });
      const pathname = decodeURIComponent(url.pathname);
      const path = resolve(root, '.' + pathname, pathname.endsWith('/') ? 'index.html' : '');
      if (!path.startsWith(root + sep) || path.split(sep).some(part => part.startsWith('.'))) return json(404, { error: 'Not found' });
      if (pathname.startsWith('/scripts/') || pathname.includes('library-overrides.ko.json') || (!admin && pathname === '/src/local-admin.js')) return json(404, { error: 'Not found' });
      if (pathname === '/data/library.ko.json') {
        const library = await readLibrary(root);
        res.setHeader('X-Library-Revision', revisionOf(library));
        return json(200, library);
      }
      let body = await readFile(path);
      if (admin && path === resolve(root, 'index.html')) body = body.toString().replace('</head>', '<meta name="local-library-admin" content="enabled"></head>');
      res.writeHead(200, { 'Content-Type': mime[extname(path)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      res.end(req.method === 'HEAD' ? undefined : body);
    } catch (error) { json(error.status || (error.code === 'ENOENT' ? 404 : 500), { error: error.message }); }
  });
}
