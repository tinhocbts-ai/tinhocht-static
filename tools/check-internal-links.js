/* tools/check-internal-links.js — đếm số trang trỏ link tới mỗi trang (chỉ tính trong phần nội dung,
   không tính menu/chân trang vì chúng giống nhau ở mọi trang).
   Dùng để xem sức mạnh nội bộ có bị dồn hết vào vài trang hay không. */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const EXPORT = 'D:\\AUTOMATION\\projects\\tinhocht\\export';
const SKIP = new Set(['node_modules', '.git', 'assets', 'src', 'tools', 'data', 'export', 'partials']);
const LOC = process.argv[2] || '';

function walk(dir, out) {
  out = out || [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith('.html')) out.push(p);
  }
  return out;
}

const dem = new Map();
for (const f of walk(ROOT)) {
  const html = fs.readFileSync(f, 'utf8');
  const main = (html.match(/<main>([\s\S]*?)<\/main>/) || [, ''])[1];
  const daTinh = new Set();
  for (const m of main.matchAll(/href="([^"]+)"/g)) {
    let h = m[1];
    if (/^(https?:|tel:|mailto:|#)/.test(h)) continue;
    h = decodeURIComponent(h).replace(/^(\.\.\/)+/, '').replace(/\.html$/, '');
    if (!h || daTinh.has(h)) continue;
    daTinh.add(h);
    dem.set(h, (dem.get(h) || 0) + 1);
  }
}

// ghép với dữ liệu thứ hạng
const gsc = new Map();
try {
  for (const r of JSON.parse(fs.readFileSync(path.join(EXPORT, 'gsc-pages-with-traffic.json'), 'utf8'))) {
    const p = decodeURIComponent(r.url).replace(/^https?:\/\/(www\.)?tinhocht\.com\//, '').replace(/\/$/, '');
    gsc.set(p, r);
  }
} catch (e) {}

const rows = [...dem.entries()]
  .filter(([k]) => !LOC || k.includes(LOC))
  .map(([k, v]) => ({ k, v, g: gsc.get(k) }))
  .sort((a, b) => b.v - a.v);

console.log('Trang được trỏ link (trong nội dung): ' + rows.length);
console.log('  ít nhất ' + Math.min(...rows.map(r => r.v)) + ' link · nhiều nhất ' + Math.max(...rows.map(r => r.v)) + ' link');

const coGsc = rows.filter(r => r.g);
const nhieu = coGsc.filter(r => r.v >= 8), it = coGsc.filter(r => r.v < 8);
const tb = a => a.length ? (a.reduce((s, r) => s + r.g.pos, 0) / a.length).toFixed(1) : '—';
console.log('  trang ≥8 link: vị trí trung bình ' + tb(nhieu) + ' (' + nhieu.length + ' trang)');
console.log('  trang <8 link: vị trí trung bình ' + tb(it) + ' (' + it.length + ' trang)');

if (LOC) {
  console.log('\nChi tiết:');
  rows.forEach(r => console.log('  ' + String(r.v).padStart(3) + ' link | ' +
    (r.g ? 'vt' + r.g.pos.toFixed(1).padStart(5) + ' ' + String(r.g.impr).padStart(5) + 'i' : '   (chưa có dữ liệu)') +
    ' | ' + r.k));
}
