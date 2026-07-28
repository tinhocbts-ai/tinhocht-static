/* tools/url-map.js — Xuất bảng đối chiếu URL cũ (Google Sites) ↔ URL mới (site tĩnh).
 * Chạy: node tools/url-map.js   →  export/doi-chieu-url.json + export/doi-chieu-url.md
 */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const EXPORT = 'D:\\AUTOMATION\\projects\\tinhocht\\export';
const OLD = 'https://www.tinhocht.com';
const NEW = 'https://tinhocht.com';
const SKIP = new Set(['node_modules', '.git', 'assets', 'src', 'tools', 'data', 'export', 'partials']);

function walk(dir, out) {
  out = out || [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name === 'index.html') out.push(p);
  }
  return out;
}

// traffic GSC để biết trang nào quan trọng
const gsc = new Map();
try {
  const raw = JSON.parse(fs.readFileSync(path.join(EXPORT, 'gsc-pages-with-traffic.json'), 'utf8'));
  for (const r of (raw.rows || raw)) {
    const u = decodeURIComponent(String(r.url || r.page || '')).replace(/^https?:\/\/(www\.)?tinhocht\.com\/?/, '').replace(/\/$/, '');
    gsc.set(u, { clicks: r.clicks || 0, impr: r.impr || r.impressions || 0, pos: r.pos || r.position || 0 });
  }
} catch (e) { console.warn('Không đọc được GSC:', e.message); }

const rows = [];
for (const f of walk(ROOT)) {
  const rel = path.relative(ROOT, f).replace(/\\/g, '/').replace(/\/index\.html$/, '').replace(/^index\.html$/, '');
  const html = fs.readFileSync(f, 'utf8');
  const isStub = /http-equiv="refresh"/.test(html);
  const title = (html.match(/<title>([^<]*)/) || [, ''])[1].trim();
  const g = gsc.get(rel) || null;

  if (isStub) {
    const canon = (html.match(/rel="canonical" href="([^"]+)"/) || [, ''])[1];
    const to = decodeURIComponent(canon.replace(/^https?:\/\/(www\.)?tinhocht\.com\/?/, '')).replace(/\/$/, '');
    rows.push({
      cu: '/' + rel, moi: '/' + to,
      loai: rel === 'home' ? 'Gộp về trang chủ' : (to === 'bang-gia-nap-muc-may-in-tan-noi' && rel === 'bảng-giá' ? 'Gộp trang trùng' : 'Chuyển hướng'),
      title: '', clicks: g ? g.clicks : 0, impr: g ? g.impr : 0,
    });
  } else {
    rows.push({
      cu: '/' + rel, moi: '/' + rel, loai: rel === '' ? 'Trang chủ' : 'Giữ nguyên',
      title, clicks: g ? g.clicks : 0, impr: g ? g.impr : 0,
    });
  }
}

// các trang đã chốt loại khỏi phạm vi
for (const p of ['dịch-vụ-mạng-tổng-đài', 'home/nap-muc-may-in-gia-re-tp-hcm---chi-con-80k/untitled-page']) {
  rows.push({ cu: '/' + p, moi: '(không dựng)', loai: 'Loại khỏi phạm vi', title: '', clicks: 0, impr: 0 });
}

const order = { 'Trang chủ': 0, 'Giữ nguyên': 1, 'Gộp trang trùng': 2, 'Gộp về trang chủ': 2, 'Chuyển hướng': 3, 'Loại khỏi phạm vi': 4 };
rows.sort((a, b) => (order[a.loai] - order[b.loai]) || (b.clicks - a.clicks) || a.cu.localeCompare(b.cu, 'vi'));

fs.writeFileSync(path.join(EXPORT, 'doi-chieu-url.json'), JSON.stringify(rows, null, 1), 'utf8');

const dem = {};
rows.forEach(r => dem[r.loai] = (dem[r.loai] || 0) + 1);
const md = ['# Đối chiếu URL: Google Sites (cũ) ↔ Site tĩnh (mới)', '',
  'Lập ' + new Date().toLocaleDateString('vi-VN') + ' · Tổng ' + rows.length + ' URL.', '',
  Object.entries(dem).map(([k, v]) => '- **' + k + '**: ' + v).join('\n'), '',
  '| URL cũ (tinhocht.com) | URL mới | Trạng thái | Clicks | Impr |', '|---|---|---|---:|---:|',
  ...rows.map(r => '| `' + r.cu + '` | `' + r.moi + '` | ' + r.loai + ' | ' + (r.clicks || '') + ' | ' + (r.impr || '') + ' |'),
].join('\n');
fs.writeFileSync(path.join(EXPORT, 'doi-chieu-url.md'), md, 'utf8');

console.log('Tổng ' + rows.length + ' URL:');
Object.entries(dem).forEach(([k, v]) => console.log('  ' + k + ': ' + v));
console.log('→ export/doi-chieu-url.md + .json');
