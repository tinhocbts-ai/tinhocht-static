/* tools/audit.js — kiểm tra nhanh chất lượng site đã build (SEO cơ bản + nội dung mỏng). */
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

const files = walk(ROOT);
let noTitle = 0, noDesc = 0, noCanon = 0, noH1 = 0, words = 0;
const thin = [], dupTitle = new Map(), noImg = [];

for (const f of files) {
  const t = fs.readFileSync(f, 'utf8');
  const rel = path.relative(ROOT, f).replace(/\\/g, '/');
  if (/http-equiv="refresh"/.test(t)) continue; // stub redirect
  if (!/<title>[^<]{5,}/.test(t)) noTitle++;
  if (!/name="description" content="[^"]{20,}/.test(t)) noDesc++;
  if (!/rel="canonical"/.test(t)) noCanon++;
  if (!/<h1[ >]/.test(t)) noH1++;
  const mainRaw = (t.match(/<main>([\s\S]*?)<\/main>/) || [, ''])[1];
  const main = mainRaw.replace(/<[^>]+>/g, ' ');
  const w = main.trim().split(/\s+/).filter(Boolean).length;
  words += w;
  if (w < 120) thin.push(rel + ' (' + w + ' từ)');
  const title = (t.match(/<title>([^<]*)/) || [, ''])[1];
  dupTitle.set(title, (dupTitle.get(title) || 0) + 1);
  if (!/<img[^>]+assets\/img/.test(mainRaw)) noImg.push(rel);
}

console.log('Trang HTML: ' + files.length);
console.log('Thiếu title: ' + noTitle + ' | thiếu meta description: ' + noDesc + ' | thiếu canonical: ' + noCanon + ' | thiếu H1: ' + noH1);
console.log('Tổng số từ nội dung: ' + words.toLocaleString('vi-VN') + ' | trung bình ' + Math.round(words / files.length) + ' từ/trang');
console.log('Trang mỏng (<120 từ): ' + thin.length);
thin.slice(0, 10).forEach(x => console.log('   · ' + x));
const dup = [...dupTitle.entries()].filter(([, v]) => v > 1);
console.log('Title trùng nhau: ' + dup.length);
dup.slice(0, 5).forEach(([k, v]) => console.log('   · "' + k.slice(0, 60) + '" ×' + v));
console.log('Trang không có ảnh nội dung: ' + noImg.length);
