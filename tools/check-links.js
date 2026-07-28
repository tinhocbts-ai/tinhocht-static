/* tools/check-links.js — kiểm tra mọi link nội bộ của site đã build có trỏ tới file thật không. */
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
let total = 0;
const bad = [];
const imgBad = [];
for (const f of files) {
  const dir = path.dirname(f);
  const html = fs.readFileSync(f, 'utf8');
  const check = (attr, list) => {
    for (const m of html.matchAll(new RegExp(attr + '="([^"]+)"', 'g'))) {
      const h = m[1];
      if (/^(https?:|tel:|mailto:|#|data:)/.test(h)) continue;
      total++;
      let p = decodeURIComponent(h.replace(/[?#].*/, ''));
      let full = path.normalize(path.join(dir, p));
      if (full.endsWith(path.sep) || !path.extname(full)) {
        // GitHub Pages phục vụ /duong-dan bằng file duong-dan.html; nếu không có thì mới tới duong-dan/index.html
        const stripped = full.replace(/[\\/]+$/, '');
        const asFile = stripped + '.html';
        full = fs.existsSync(asFile) ? asFile : path.join(stripped, 'index.html');
      }
      if (!fs.existsSync(full)) list.push(path.relative(ROOT, f).split(path.sep).join('/') + ' -> ' + h);
    }
  };
  check('href', bad);
  check('src', imgBad);
}
console.log('Trang HTML: ' + files.length + ' | link+src nội bộ: ' + total);
console.log('Link hỏng: ' + bad.length + ' | src (ảnh/js/css) hỏng: ' + imgBad.length);
[...new Set(bad.map(b => b.split(' -> ')[1]))].slice(0, 12).forEach(b => console.log('  X ' + b));
[...new Set(imgBad.map(b => b.split(' -> ')[1]))].slice(0, 8).forEach(b => console.log('  IMG X ' + b));
process.exit(bad.length + imgBad.length ? 1 : 0);
