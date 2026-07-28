/* build-draft-all.js — Sinh BẢN NHÁP OFFLINE toàn bộ URL thật của tinhocht.com để duyệt cục bộ.
 *
 * Cách dùng:   node build-draft-all.js
 *
 * Nguồn dữ liệu: D:\AUTOMATION\projects\tinhocht\export\slugs.json + pages-crawl\*.json
 * Nguyên tắc (chốt với chủ shop 28/07/2026):
 *  - GIỮ NGUYÊN SLUG URL 100% từng ký tự (kể cả dấu tiếng Việt, chữ hoa /Phan-mem-reset-may-in/)
 *    vì site đang có traffic thật — mỗi trang sinh ra đúng tại <path gốc>/index.html.
 *  - Nội dung giữ nguyên văn từ crawl. Trang đã đối chiếu DOM (text_note có 'Nguyên văn DOM')
 *    được đánh dấu ✅; trang còn lại đánh dấu ⚠️ (bản WebFetch — phải đối chiếu DOM khi build thật).
 *  - SĐT ngoài hệ thống 089 886 0052 và 098 131 9853 → thay bằng hotline 0934 393 550.
 *  - LOẠI: 'dịch-vụ-mạng-tổng-đài', 'untitled-page' (đã chốt bỏ).
 *  - Trang 'nạp mực máy in bill' (+trang con): chỉ trang giới thiệu ngắn + link mucinht.com.
 *  - Mọi trang draft đều có <meta name="robots" content="noindex"> — an toàn nếu lỡ push.
 *
 * Trang tổng mục lục để duyệt: /danh-sach-trang/
 * KHÔNG đụng tới index.html (trang chủ đã build thật) và sitemap.xml.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const EXPORT = 'D:\\AUTOMATION\\projects\\tinhocht\\export';
const CRAWL = path.join(EXPORT, 'pages-crawl');
const HOTLINE = '0934 393 550';

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function fixPhones(s) {
  return String(s)
    .replace(/089[\s. ]*886[\s. ]*0052/g, HOTLINE)
    .replace(/098[\s. ]*131[\s. ]*9853/g, HOTLINE)
    .replace(/0981319853|0898860052/g, HOTLINE.replace(/\s/g, ''));
}

function pathFromUrl(url) {
  const p = new URL(url).pathname;
  return decodeURIComponent(p).replace(/\/+$/, '').replace(/^\/+/, '');
}

// Header/footer THẬT của site (đã render từ src/partials qua node build.js) — nhúng thẳng
// vào từng trang, link data-href được gắn prefix tương đối theo độ sâu thư mục.
let HEADER_RAW = null, FOOTER_RAW = null;
function loadPartials() {
  HEADER_RAW = fs.readFileSync(path.join(ROOT, 'partials', 'header.html'), 'utf8');
  FOOTER_RAW = fs.readFileSync(path.join(ROOT, 'partials', 'footer.html'), 'utf8');
}
function inlinePartial(raw, prefix) {
  return raw.replace(/(href|src)="([^"]*)"\s+data-\1="\2"/g, function (m, attr, val) {
    return attr + '="' + prefix + val + '"';
  });
}

function pageShell(opts) {
  const { title, canonical, prefix, banner, bodyHtml, description } = opts;
  return '<!DOCTYPE html>\n<html lang="vi">\n<head>\n<meta charset="UTF-8">\n' +
    '<title>' + esc(title) + '</title>\n' +
    '<meta name="viewport" content="width=device-width, initial-scale=1.0">\n' +
    (description ? '<meta name="description" content="' + esc(description) + '">\n' : '') +
    '<meta name="robots" content="noindex"><!-- draft: gỡ khi build thật + gắn domain -->\n' +
    '<link rel="canonical" href="' + canonical + '">\n' +
    '<link rel="stylesheet" href="' + prefix + 'assets/css/style.css">\n' +
    '<style>.draft-note{font-size:12.5px;line-height:1.5;background:#fff8e1;border:1px solid #eed77a;border-radius:6px;padding:6px 10px;margin:0 0 18px;color:#6b5b00}.draft-note code{background:#fff;padding:0 4px;border-radius:3px;word-break:break-all}.page-content img{max-width:100%;height:auto}.page-content hr{border:none;border-top:1px solid #e3e6ea;margin:26px 0}.draft-imgs{background:#f6f8fa;border:1px solid #dde3ea;border-radius:6px;padding:12px;margin-top:28px}</style>\n' +
    '</head>\n<body>\n' +
    '<div id="site-header">' + inlinePartial(HEADER_RAW, prefix) + '</div>\n' +
    '<main>\n<section class="section">\n<div class="container page-content">\n' +
    '<div class="draft-note">' + banner + '</div>\n' +
    bodyHtml +
    '\n</div>\n</section>\n</main>\n' +
    '<div id="site-footer">' + inlinePartial(FOOTER_RAW, prefix) + '</div>\n' +
    '<script>(function(){var t=document.getElementById("navToggle"),n=document.getElementById("mainNav");if(t&&n){t.addEventListener("click",function(){var o=document.body.classList.toggle("nav-open");t.setAttribute("aria-expanded",o?"true":"false")});n.querySelectorAll("a").forEach(function(a){a.addEventListener("click",function(){document.body.classList.remove("nav-open");t.setAttribute("aria-expanded","false")})})}})();</script>\n' +
    '</body>\n</html>\n';
}

function textToHtml(text, title) {
  const lines = String(text).split('\n');
  const out = [];
  let first = true;
  for (let raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    if (line === '=====') { out.push('<hr>'); continue; }
    if (first && line === String(title).trim()) { first = false; continue; } // H1 render riêng
    first = false;
    out.push('<p>' + esc(fixPhones(line)) + '</p>');
  }
  return out.join('\n');
}

function writePage(relPath, html) {
  const outDir = path.join(ROOT, relPath.replace(/^\//, '').split('/').join(path.sep));
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'index.html'), html, 'utf8');
}

function firstDesc(text, title) {
  for (const raw of String(text || '').split('\n')) {
    const line = raw.trim();
    if (!line || line === '=====' || line === String(title).trim()) continue;
    return fixPhones(line).slice(0, 160);
  }
  return '';
}

function build() {
  loadPartials();
  const slugs = JSON.parse(fs.readFileSync(path.join(EXPORT, 'slugs.json'), 'utf8'));
  // Bổ sung các trang crawl nằm ngoài slugs.json (trang ẩn lấy qua editor, bảng giá cấp 1, bill con...)
  const known = new Set(slugs.map(s => s.slug));
  const entries = slugs.map(s => ({ url: s.url, slug: s.slug, hidden: false }));
  for (const f of fs.readdirSync(CRAWL)) {
    const slug = f.replace(/\.json$/, '');
    if (known.has(slug)) continue;
    try {
      const j = JSON.parse(fs.readFileSync(path.join(CRAWL, f), 'utf8'));
      if (j.url) entries.push({ url: j.url, slug, hidden: true });
    } catch (e) { console.warn('  ⚠ không đọc được ' + f); }
  }

  const built = [], skipped = [], stubs = [], missing = [];
  const seen = new Set();

  for (const { url, slug, hidden } of entries) {
    const relPath = pathFromUrl(url);
    if (!relPath) { skipped.push({ relPath: '/', reason: 'trang chủ — đã build thật (index.html)' }); continue; }
    if (relPath === 'home') { skipped.push({ relPath, reason: 'hợp nhất về trang chủ / (stub redirect do build.js sinh — báo cáo mục 4.1)' }); continue; }
    if (seen.has(relPath)) { skipped.push({ relPath, reason: 'URL trùng (bản có dấu / cuối) — gộp về 1 trang' }); continue; }
    seen.add(relPath);

    if (/dịch-vụ-mạng-tổng-đài|untitled-page/.test(relPath)) {
      skipped.push({ relPath, reason: 'ĐÃ CHỐT LOẠI khỏi migrate' });
      continue;
    }

    const file = path.join(CRAWL, slug + '.json');
    if (!fs.existsSync(file)) { missing.push(relPath); continue; }
    const page = JSON.parse(fs.readFileSync(file, 'utf8'));
    const title = page.title || relPath;
    const depth = relPath.split('/').length;
    const prefix = '../'.repeat(depth);
    const canonical = url;

    // Trang máy in bill → stub giới thiệu ngắn + link mucinht.com (chốt 28/07/2026)
    if (/nap-muc-may-in-bill/.test(relPath)) {
      const body = '<h1>' + esc(title) + '</h1>\n' +
        '<p>Mảng <strong>nạp mực máy in bill / máy in hóa đơn</strong> hiện được phục vụ tại website chuyên trách của hệ thống:</p>\n' +
        '<p><a href="https://mucinht.com/" rel="noopener"><strong>👉 mucinht.com — Nạp mực máy in bill, thay mực máy in hóa đơn</strong></a></p>\n' +
        '<p>Quý khách cần hỗ trợ nhanh vui lòng gọi hotline <a href="tel:0934393550"><strong>0934 393 550</strong></a>.</p>';
      writePage(relPath, pageShell({
        title, canonical, prefix,
        banner: '📄 <strong>TRANG GIỚI THIỆU NGẮN</strong> (đã chốt: nội dung đầy đủ thuộc mucinht.com) — URL gốc giữ nguyên: <code>' + esc(relPath) + '</code>',
        bodyHtml: body,
      }));
      stubs.push({ relPath, title });
      continue;
    }

    const verbatim = /[Nn]guyên văn DOM/.test(String(page.text_note || ''));
    const status = verbatim
      ? '✅ <strong>ĐÃ đối chiếu nguyên văn DOM</strong> (28/07/2026)'
      : '⚠️ Bản crawl WebFetch — <strong>phải đối chiếu DOM trước khi build thật</strong>';
    const banner = status +
      (hidden ? ' · 🔒 <strong>TRANG ẨN 0-traffic — đề xuất BỎ, chờ chủ shop chốt</strong>' : '') +
      ' · URL gốc giữ nguyên: <code>' + esc(relPath) + '</code>' +
      (page.title_note ? '<br>ℹ️ ' + esc(page.title_note) : '');

    let body = '<h1>' + esc(fixPhones(title)) + '</h1>\n' + textToHtml(page.text || '(chưa có nội dung crawl)', title);
    if (Array.isArray(page.external_links) && page.external_links.length) {
      body += '\n<div class="draft-imgs"><p><strong>🔗 Link NGOÀI trên trang gốc (giữ nguyên khi build thật — đã chốt 28/07/2026):</strong></p><ul>' +
        page.external_links.map(u => '<li><a href="' + esc(u) + '" rel="noopener">' + esc(u) + '</a></li>').join('') + '</ul></div>';
    }
    const imgs = Array.isArray(page.image_urls) ? page.image_urls : [];
    if (imgs.length) {
      body += '\n<div class="draft-imgs"><p><strong>🖼 Ảnh gốc trên trang (' + imgs.length +
        ' — đang hotlink Google, sẽ tải về khi build thật):</strong></p>\n' +
        imgs.map(u => '<img src="' + esc(u) + '" loading="lazy" alt="">').join('\n') + '</div>';
    } else if (page.image_count) {
      body += '\n<div class="draft-imgs"><p><strong>🖼 Trang gốc có ' + page.image_count +
        ' ảnh nhưng chưa lấy được URL</strong> — lấy khi đối chiếu DOM lúc build thật.</p></div>';
    }

    writePage(relPath, pageShell({ title, canonical, prefix, banner, bodyHtml: body, description: firstDesc(page.text, title) }));
    built.push({ relPath, title, verbatim, hidden, words: String(page.text || '').split(/\s+/).length });
  }

  // ---- Mục lục duyệt: /danh-sach-trang/ ----
  const groups = {};
  for (const b of built) {
    const top = '/' + b.relPath.split('/')[0];
    (groups[top] = groups[top] || []).push(b);
  }
  let toc = '<h1>📋 Mục lục duyệt bản nháp (' + built.length + ' trang + ' + stubs.length + ' trang giới thiệu ngắn)</h1>\n' +
    '<p>✅ = đã đối chiếu nguyên văn DOM · ⚠️ = bản WebFetch (đối chiếu khi build thật). Mọi URL giữ NGUYÊN slug gốc.</p>\n';
  for (const top of Object.keys(groups).sort()) {
    const rows = groups[top].sort((a, b) => a.relPath.localeCompare(b.relPath));
    toc += '<h2>' + esc(top) + '/ (' + rows.length + ' trang)</h2>\n<ul>\n' + rows.map(b =>
      '<li>' + (b.verbatim ? '✅' : '⚠️') + (b.hidden ? '🔒' : '') + ' <a href="../' + b.relPath.split('/').map(encodeURIComponent).join('/') + '/">' +
      esc(b.title) + '</a> <small>(' + b.words + ' từ) — <code>' + esc('/' + b.relPath) + '</code></small>' +
      (b.hidden ? ' <small><strong>[trang ẩn 0-traffic — đề xuất bỏ]</strong></small>' : '') + '</li>').join('\n') + '\n</ul>\n';
  }
  if (stubs.length) {
    toc += '<h2>📄 Trang giới thiệu ngắn (bill → mucinht.com)</h2>\n<ul>\n' + stubs.map(s =>
      '<li><a href="../' + s.relPath.split('/').map(encodeURIComponent).join('/') + '/">' + esc(s.title) + '</a></li>').join('\n') + '\n</ul>\n';
  }
  if (skipped.length) {
    toc += '<h2>🚫 Đã loại khỏi phạm vi / không build</h2>\n<ul>\n' + skipped.map(s =>
      '<li><code>' + esc('/' + s.relPath.replace(/^\//, '')) + '</code> — ' + esc(s.reason) + '</li>').join('\n') + '\n</ul>\n';
  }
  if (missing.length) {
    toc += '<h2>❓ Thiếu file crawl</h2>\n<ul>\n' + missing.map(m => '<li><code>' + esc(m) + '</code></li>').join('\n') + '\n</ul>\n';
  }
  writePage('danh-sach-trang', pageShell({
    title: 'Mục lục duyệt bản nháp — tinhocht static',
    canonical: 'https://tinhocht.com/danh-sach-trang',
    prefix: '../',
    banner: '📋 Trang mục lục nội bộ để duyệt — KHÔNG thuộc site thật, không đưa lên production.',
    bodyHtml: toc,
  }));

  console.log('Đã sinh ' + built.length + ' trang nháp + ' + stubs.length + ' stub bill + mục lục /danh-sach-trang/.');
  console.log('Bỏ qua: ' + skipped.length + ' (chốt loại/trang chủ) · Thiếu crawl: ' + missing.length);
  const nVerb = built.filter(b => b.verbatim).length;
  console.log('Trong đó ✅ verbatim DOM: ' + nVerb + ' · ⚠️ WebFetch draft: ' + (built.length - nVerb));
}

build();
