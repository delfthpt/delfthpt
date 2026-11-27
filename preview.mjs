// Shows the built site on your own computer the way GitHub Pages serves it:
// /people shows people.html, and an unknown address shows 404.html.
// Usage: node build.mjs && node preview.mjs        (then open http://localhost:8000)
//        node preview.mjs 8080                     (another port)
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';

const root = resolve('dist');
const port = Number(process.argv[2]) || 8000;
const types = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8', '.json': 'application/json', '.bin': 'application/octet-stream',
};

createServer(async (req, res) => {
  let path = '/';
  try { path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); } catch (e) { /* keep "/" */ }
  if (path.endsWith('/')) path += 'index.html';
  const file = resolve(root, `.${path}`);
  const inside = file.startsWith(root + sep);
  for (const [name, code] of [[file, 200], [`${file}.html`, 200], [resolve(root, '404.html'), 404]]) {
    if (!inside && code === 200) continue;
    try {
      const body = await readFile(name);
      res.writeHead(code, { 'Content-Type': types[extname(name)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      res.end(body);
      return;
    } catch (e) { /* try the next candidate */ }
  }
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not found');
}).listen(port, () => console.log(`Preview: http://localhost:${port}`));
