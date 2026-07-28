/* Static file server chỉ dùng để preview cục bộ (không commit lên repo, không dùng cho production). */
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PORT = Number(process.env.PORT) || 8123;
const MIME = { '.html':'text/html', '.css':'text/css', '.js':'text/javascript', '.json':'application/json',
  '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.png':'image/png', '.webp':'image/webp', '.svg':'image/svg+xml', '.xml':'application/xml' };

http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p.endsWith('/')) p += 'index.html';
  let full = path.join(ROOT, p);
  if (!full.startsWith(ROOT)) { res.writeHead(403); return res.end('Forbidden'); }
  /* Mô phỏng đúng cách GitHub Pages phân giải URL, để xem thử ở máy giống hệt lúc chạy thật:
     /duong-dan  ->  duong-dan.html  (ưu tiên, giữ nguyên URL không có dấu / cuối)
                 ->  duong-dan/index.html (nếu không có file trên) */
  if (!path.extname(full)) {
    const asFile = full.replace(/[\\/]+$/, '') + '.html';
    if (fs.existsSync(asFile)) full = asFile;
    else { try { if (fs.statSync(full).isDirectory()) full = path.join(full, 'index.html'); } catch (e) {} }
  }
  fs.readFile(full, (err, data) => {
    if (err) {
      fs.readFile(path.join(ROOT, '404.html'), (e2, d2) => {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end(e2 ? 'Not found' : d2);
      });
      return;
    }
    const ext = path.extname(full).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  });
}).listen(PORT, () => console.log('Preview server: http://localhost:' + PORT));
