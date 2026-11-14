/* Đo kích thước thật của mọi ảnh trong assets/img → data/img-size.json.
   build-site.js đọc file này để gắn width/height cho thẻ <img> còn thiếu (chống nhảy bố cục — CLS).
   Chạy lại mỗi khi thêm ảnh mới:  node tools/img-size.js */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.join(__dirname, '..');
const IMG = path.join(ROOT, 'assets', 'img');
const OUT = path.join(ROOT, 'data', 'img-size.json');

function walk(dir, out = []) {
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, f.name);
    if (f.isDirectory()) walk(p, out);
    else if (/\.(webp|jpe?g|png|gif|avif)$/i.test(f.name)) out.push(p);
  }
  return out;
}

(async () => {
  const map = {};
  let loi = 0;
  for (const f of walk(IMG)) {
    try {
      const m = await sharp(f, { animated: false }).metadata();
      if (m.width && m.height) map[path.relative(ROOT, f).split(path.sep).join('/')] = [m.width, m.height];
    } catch { loi++; }
  }
  const sorted = Object.fromEntries(Object.keys(map).sort().map(k => [k, map[k]]));
  fs.writeFileSync(OUT, JSON.stringify(sorted, null, 0).replace(/\],"/g, '],\n"'), 'utf8');
  console.log('Đã đo', Object.keys(map).length, 'ảnh', loi ? '(' + loi + ' ảnh lỗi)' : '', '→', path.relative(ROOT, OUT));
})();
