/* tools/check-schema.js — kiểm tra dữ liệu có cấu trúc (JSON-LD) trên mọi trang đã build. */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const SKIP = new Set(['node_modules', '.git', 'assets', 'src', 'tools', 'data', 'export', 'partials']);

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

let hasSchema = 0, bad = 0, stub = 0;
const types = new Map();
const missing = [];

for (const f of walk(ROOT)) {
  const html = fs.readFileSync(f, 'utf8');
  const rel = path.relative(ROOT, f).replace(/\\/g, '/');
  if (/http-equiv="refresh"/.test(html)) { stub++; continue; }
  const m = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  if (!m) { missing.push(rel); continue; }
  hasSchema++;
  try {
    const j = JSON.parse(m[1]);
    for (const g of (j['@graph'] || [j])) {
      const t = [].concat(g['@type']).join('+');
      types.set(t, (types.get(t) || 0) + 1);
    }
  } catch (e) {
    bad++;
    console.log('  ✗ JSON lỗi: ' + rel + ' — ' + e.message.slice(0, 70));
  }
}

console.log('Trang có dữ liệu có cấu trúc: ' + hasSchema + ' | JSON lỗi: ' + bad + ' | trang chuyển hướng (bỏ qua): ' + stub);
if (missing.length) {
  console.log('Trang CHƯA có: ' + missing.length);
  missing.slice(0, 8).forEach(x => console.log('   · ' + x));
}
console.log('Các loại đã khai báo:');
[...types.entries()].sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log('  ' + String(v).padStart(4) + '  ' + k));
/* Kiểm tra riêng: trang dịch vụ theo quận có gán đúng khu vực không
   (bẫy hay gặp: "quan-1" khớp nhầm cả "quan-10", "quan-11") */
const norm = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9]/g, '');
let svc = 0, chung = 0;
const saiKV = [];
for (const f of walk(ROOT)) {
  const html = fs.readFileSync(f, 'utf8');
  const m = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  if (!m) continue;
  let j; try { j = JSON.parse(m[1]); } catch (e) { continue; }
  const s = (j['@graph'] || []).find(x => x['@type'] === 'Service');
  if (!s) continue;
  svc++;
  const kv = (s.areaServed && s.areaServed.name) || '';
  const rel = path.relative(ROOT, f).split(path.sep).join('/');
  if (/Hồ Chí Minh/.test(kv)) { chung++; continue; }
  const mq = rel.match(/quan-([a-z0-9-]+?)(\/|$)/);
  if (mq && !norm(kv).includes(norm(mq[1]))) saiKV.push(rel + '  ->  ' + kv);
}
console.log('\nTrang dịch vụ: ' + svc + ' | gán khu vực cụ thể: ' + (svc - chung) + ' | chỉ ghi chung TP.HCM: ' + chung + ' | gán SAI: ' + saiKV.length);
saiKV.slice(0, 6).forEach(x => console.log('   ✗ ' + x));
process.exit(bad || saiKV.length ? 1 : 0);
