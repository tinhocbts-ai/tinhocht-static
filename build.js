/* build.js — Sinh HTML tĩnh chuẩn SEO từ src/ + site.config.json
 *
 * Cách dùng:   node build.js
 *
 * Việc build làm 3 phần:
 *  1. Render mọi trang trong src/ (trừ src/partials/), thay {{key}} từ site.config.json.
 *  2. Tự sinh sitemap.xml từ danh sách trang thật đã build.
 *  3. Sinh trang redirect URL cũ (Google Sites) -> URL mới, từ data/redirects.json
 *     (stub <meta http-equiv="refresh"> + canonical + noindex, GitHub Pages không có 301 server-side).
 *
 * → Đổi SĐT/địa chỉ: sửa site.config.json. Đổi nội dung: sửa src/.
 * → KHÔNG sửa tay các file .html ở thư mục gốc — chúng bị ghi đè mỗi lần build.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const SRC = path.join(ROOT, 'src');
const CONFIG_FILE = path.join(ROOT, 'site.config.json');
const SITE_URL = 'https://tinhocht.com';

function loadConfig() {
  const cfg = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
  delete cfg._help;
  return cfg;
}

function listTemplates(dir, base) {
  base = base || dir;
  let out = [];
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) out = out.concat(listTemplates(full, base));
    else if (name.toLowerCase().endsWith('.html')) out.push(path.relative(base, full));
  }
  return out;
}

function render(content, dict, label) {
  const missing = new Set();
  const result = content.replace(/\{\{\s*([\w.]+)\s*\}\}/g, function (match, key) {
    if (Object.prototype.hasOwnProperty.call(dict, key)) return String(dict[key]);
    missing.add(key);
    return match;
  });
  if (missing.size) console.warn('  ⚠  ' + label + ': thiếu key → ' + Array.from(missing).join(', '));
  return result;
}

function build() {
  const cfg = loadConfig();
  const pagesBuilt = []; // duong dan tuong doi (vd 'nap-muc-may-in/nap-muc-may-in-quan-10/index.html') de sinh sitemap

  // ---- Phan 1: render cac trang src/ ----
  const templates = fs.existsSync(SRC) ? listTemplates(SRC) : [];
  for (const rel of templates) {
    const outPath = path.join(ROOT, rel);
    const rendered = render(fs.readFileSync(path.join(SRC, rel), 'utf8'), cfg, rel);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, rendered, 'utf8');
    pagesBuilt.push(rel.replace(/\\/g, '/'));
    console.log('  ✓ ' + rel);
  }

  // ---- Phan 2: sitemap.xml (khong gom partials, 404, trang redirect) ----
  const urls = pagesBuilt
    .filter(rel => !rel.startsWith('partials/') && rel !== '404.html')
    .map(rel => rel.replace(/index\.html$/, ''))
    .map(rel => SITE_URL + '/' + rel)
    .sort();
  const today = new Date().toISOString().slice(0, 10);
  const xml = '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls.map(u => '  <url><loc>' + u + '</loc><lastmod>' + today + '</lastmod></url>').join('\n') +
    '\n</urlset>\n';
  fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), xml, 'utf8');
  console.log('  ✓ sitemap.xml (' + urls.length + ' URL)');

  // ---- Phan 3: trang redirect URL cu (Google Sites) -> URL moi (data/redirects.json) ----
  const REDIRECTS_FILE = path.join(ROOT, 'data', 'redirects.json');
  if (fs.existsSync(REDIRECTS_FILE)) {
    const redirects = JSON.parse(fs.readFileSync(REDIRECTS_FILE, 'utf8'));
    let n = 0;
    for (const [from, to] of Object.entries(redirects)) {
      const rel = from.replace(/^\//, '').replace(/\/$/, '');
      if (!rel) continue;
      const depth = rel.split('/').length;
      const relTarget = new Array(depth + 1).join('../') + to.replace(/^\//, '');
      const stub = '<!DOCTYPE html>\n<html lang="vi">\n<head>\n<meta charset="UTF-8">\n' +
        '<title>Đang chuyển hướng…</title>\n' +
        '<link rel="canonical" href="' + SITE_URL + to + '">\n' +
        '<meta name="robots" content="noindex">\n' +
        '<meta http-equiv="refresh" content="0; url=' + relTarget + '">\n' +
        '<script>location.replace("' + relTarget + '");</script>\n' +
        '</head>\n<body>\n<p>Trang này đã chuyển về địa chỉ mới: <a href="' + relTarget + '">' + SITE_URL + to + '</a></p>\n</body>\n</html>\n';
      const outPath = path.join(ROOT, rel, 'index.html');
      fs.mkdirSync(path.dirname(outPath), { recursive: true });
      fs.writeFileSync(outPath, stub, 'utf8');
      n++;
    }
    console.log('  ✓ ' + n + ' trang redirect (URL cũ Google Sites -> URL mới, ngoài sitemap)');
  }

  console.log('\nXong. ' + pagesBuilt.length + ' trang. Kiểm tra rồi commit & push để cập nhật GitHub Pages.');
}

build();
