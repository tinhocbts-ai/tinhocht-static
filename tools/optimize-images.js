/* tools/optimize-images.js — Nén ảnh nội dung sang WebP để trang nhẹ và tải nhanh hơn.
 *
 * Chạy:  node tools/optimize-images.js          (nén, giữ file gốc)
 *        node tools/optimize-images.js --clean  (nén xong xoá file gốc đã có bản .webp)
 *
 * Ảnh gốc tải từ Google về nằm ở assets/img/p/. Script tạo bản .webp cùng tên,
 * cập nhật data/images.json để build-site.js dùng bản nhẹ.
 * Ảnh nào nén xong vẫn lớn hơn bản gốc thì giữ nguyên bản gốc.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.join(__dirname, '..');
const DIR = path.join(ROOT, 'assets', 'img', 'p');
const MAP_FILE = path.join(ROOT, 'data', 'images.json');
const MAX_W = 1000;        // đủ lớn cho khung nội dung 900px, kể cả màn hình 2x
const QUALITY = 76;
const CLEAN = process.argv.includes('--clean');

async function main() {
  const files = fs.readdirSync(DIR).filter(f => /\.(jpe?g|png)$/i.test(f));
  let before = 0, after = 0, done = 0, skip = 0;
  const renamed = new Map();   // 'assets/img/p/x.jpg' -> 'assets/img/p/x.webp'

  for (const f of files) {
    const src = path.join(DIR, f);
    const out = path.join(DIR, f.replace(/\.(jpe?g|png)$/i, '.webp'));
    const sizeIn = fs.statSync(src).size;
    try {
      const img = sharp(src);
      const meta = await img.metadata();
      const buf = await img
        .resize({ width: Math.min(meta.width || MAX_W, MAX_W), withoutEnlargement: true })
        .webp({ quality: QUALITY })
        .toBuffer();
      if (buf.length >= sizeIn) { skip++; before += sizeIn; after += sizeIn; continue; }
      fs.writeFileSync(out, buf);
      renamed.set('assets/img/p/' + f, 'assets/img/p/' + path.basename(out));
      before += sizeIn; after += buf.length; done++;
      if (CLEAN) fs.unlinkSync(src);
    } catch (e) {
      skip++; before += sizeIn; after += sizeIn;
      console.warn('  ⚠ bỏ qua ' + f + ': ' + e.message);
    }
  }

  // cập nhật bản đồ ảnh để build dùng bản .webp
  if (fs.existsSync(MAP_FILE)) {
    const map = JSON.parse(fs.readFileSync(MAP_FILE, 'utf8'));
    let n = 0;
    for (const [url, local] of Object.entries(map)) {
      if (renamed.has(local)) { map[url] = renamed.get(local); n++; }
    }
    fs.writeFileSync(MAP_FILE, JSON.stringify(map, null, 1), 'utf8');
    console.log('  ✓ cập nhật ' + n + ' đường dẫn trong data/images.json');
  }
  // cập nhật cả dữ liệu crawl (field .local) để build-site.js lấy đúng bản webp
  const DOM = 'D:\\AUTOMATION\\projects\\tinhocht\\export\\pages-dom';
  let nPage = 0;
  for (const f of fs.readdirSync(DOM)) {
    const p = path.join(DOM, f);
    const j = JSON.parse(fs.readFileSync(p, 'utf8'));
    let changed = false;
    for (const b of j.blocks || []) {
      if (b.local && renamed.has(b.local)) { b.local = renamed.get(b.local); changed = true; }
    }
    if (changed) { fs.writeFileSync(p, JSON.stringify(j, null, 1), 'utf8'); nPage++; }
  }
  console.log('  ✓ cập nhật ảnh trong ' + nPage + ' file dữ liệu trang');

  const mb = n => (n / 1048576).toFixed(1) + ' MB';
  console.log('\nĐã nén ' + done + ' ảnh (bỏ qua ' + skip + ').');
  console.log('Dung lượng: ' + mb(before) + ' → ' + mb(after) +
    '  (giảm ' + Math.round((1 - after / before) * 100) + '%)');
  if (!CLEAN) console.log('File gốc vẫn giữ. Chạy lại với --clean để xoá bản gốc đã có .webp.');
}

main().catch(e => { console.error(e); process.exit(1); });
