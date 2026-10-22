import http from 'node:http';
import { readFile, stat, realpath } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApiHandler } from './private/http-api.mjs';
import { publicOrigin, browserRequestOrigin } from './private/browser-origin.mjs';
import {DEFAULT_CSP} from './private/browser-map-configuration.mjs';

export const publicRoot = path.dirname(fileURLToPath(import.meta.url));
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.gif': 'image/gif',
  '.jpg': 'image/jpeg', '.ttf': 'font/ttf', '.otf': 'font/otf', '.ico': 'image/x-icon' };

export function createServer(root = publicRoot, options = {}) {
  if (typeof root === 'object') { options = root; root = publicRoot; }
  const origin = publicOrigin(options.publicOrigin ?? process.env.PUBLIC_ORIGIN ?? '');
  const api = createApiHandler({ ...options, publicOrigin: origin });
  const allowedFiles = new Set(['index.html', 'app.js', 'domain.js', 'gnss.js', 'coordinate-comparison.js', 'collection-save-persil.js', 'scan-controller.js', 'scan-camera.js', 'scan-location.js', 'parcel-map.js', 'styles.css', 'manifest.json']);
  const server = http.createServer(async (req, res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.setHeader('Content-Security-Policy', DEFAULT_CSP);
    res.setHeader('Cache-Control', 'no-store');
    const port = server.address()?.port;
    if (!browserRequestOrigin(req.headers.host, port, origin)) { res.writeHead(403); res.end('Host rejected'); return; }
    let requestPath;
    try {
      requestPath = decodeURIComponent((req.url || '/').split('?')[0]);
    } catch {
      res.writeHead(400); res.end('Invalid URL'); return;
    }
    if (await api.handle(req, res, requestPath)) return;
    if (!['GET', 'HEAD'].includes(req.method)) {
      res.writeHead(405, { Allow: 'GET, HEAD' }); res.end('Method not allowed'); return;
    }
    if (requestPath === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(req.method === 'HEAD' ? undefined : JSON.stringify({ app: 'sentuh-tanahku-local', status: 'ok', mode: 'browser-adapter', officialBackend: false, upstreamConfigured: (await api.configurationPromise).configured, serverValidated: false })); return;
    }
    if (requestPath.includes('\\') || requestPath.includes('\0') || requestPath.split('/').some(p => p === '..' || p.startsWith('.'))) {
      res.writeHead(403); res.end('Forbidden'); return;
    }
    const relative = requestPath === '/' ? 'index.html' : requestPath.replace(/^\/+/, '');
    if (!allowedFiles.has(relative) && !relative.startsWith('assets/') && !relative.startsWith('data/')) {
      res.writeHead(404); res.end('Not found'); return;
    }
    try {
      const candidate = await realpath(path.resolve(root, relative));
      const canonicalRoot = await realpath(root);
      if (!candidate.startsWith(canonicalRoot + path.sep) || !(await stat(candidate)).isFile()) {
        res.writeHead(403); res.end('Forbidden'); return;
      }
      let bytes = await readFile(candidate);
      if(relative==='index.html')res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');
      res.writeHead(200, { 'Content-Type': mime[path.extname(candidate)] || 'application/octet-stream', 'Content-Length': bytes.length });
      res.end(req.method === 'HEAD' ? undefined : bytes);
    } catch (error) {
      res.writeHead(error.code === 'ENOENT' || error.code === 'ENOTDIR' ? 404 : 500);
      res.end('Resource unavailable');
    }
  });
  server.on('close', api.close);
  return server;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT || 4173);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid PORT');
  const bind = process.env.BIND_HOST || '127.0.0.1';
  if (!['127.0.0.1', '0.0.0.0'].includes(bind)) throw new Error('Invalid BIND_HOST');
  const server = createServer();
  server.on('error', () => { console.error('Local server could not start.'); process.exitCode = 1; });
  server.listen(port, bind, () => console.log(`Sentuh Tanahku browser adapter listening on ${bind}:${port}`));
  const stop = () => { server.close(); setTimeout(() => process.exit(0), 5000).unref(); };
  process.once('SIGTERM', stop); process.once('SIGINT', stop);
}
