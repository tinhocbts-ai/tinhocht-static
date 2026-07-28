/* build-site.js — Dựng site tĩnh THẬT từ dữ liệu crawl DOM (export/pages-dom/).
 *
 * Chạy:  node build-site.js
 *
 * Nguyên tắc:
 *  - GIỮ NGUYÊN 100% slug URL gốc (site đang có traffic thật) + nguyên văn nội dung.
 *  - Menu 2 cấp sinh động từ chính cây URL thật.
 *  - Ảnh dùng bản tự host trong assets/img/p/ (crawl-dom.js đã tải về).
 *  - Trang chủ index.html do build.js dựng riêng (hero) — file này không đụng vào.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const EXPORT = 'D:\\AUTOMATION\\projects\\tinhocht\\export';
const DOM_DIR = path.join(EXPORT, 'pages-dom');
const SITE_URL = 'https://tinhocht.com';
const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'site.config.json'), 'utf8'));
const NOINDEX = process.env.NOINDEX !== '0'; // demo github.io: noindex; gắn domain thật -> NOINDEX=0

/* ---------------- tiện ích ---------------- */
/* 2 số ngoài hệ thống -> hotline công ty (đã chốt với chủ shop 28/07/2026).
   Chuẩn hoá cả non-breaking space vì Google Sites hay chèn  giữa các cụm số. */
const fixPhones = s => String(s)
  .replace(/ | | /g, ' ')
  .replace(/089[\s.\-]*886[\s.\-]*0052/g, cfg.hotlineDisplay)
  .replace(/098[\s.\-]*131[\s.\-]*9853/g, cfg.hotlineDisplay)
  .replace(/0981319853|0898860052/g, cfg.hotlineTel);
const esc = s => fixPhones(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const encPath = p => p.split('/').map(encodeURIComponent).join('/');

function loadPages() {
  const pages = [];
  for (const f of fs.readdirSync(DOM_DIR)) {
    if (!f.endsWith('.json')) continue;
    const p = JSON.parse(fs.readFileSync(path.join(DOM_DIR, f), 'utf8'));
    if (!p.path || p.path === 'home') continue;              // /home == trang chủ (stub redirect)
    if (/dịch-vụ-mạng-tổng-đài|untitled-page/.test(p.path)) continue; // đã chốt loại
    pages.push(p);
  }
  return pages;
}

/* Tên ngắn gọn cho menu/mục lục: bỏ đuôi quảng cáo sau dấu | - : ▷ */
function shortLabel(title) {
  let t = String(title).split(/\s*[|▷►]\s*/)[0];
  t = t.replace(/\s*[-–:]\s*(24\/7|giá rẻ|nhanh|uy tín|tốc độ|cực nhanh|có mặt).*$/i, '');
  t = t.replace(/["'”“]/g, '').replace(/\s*\?+\s*$/, '').replace(/\s+/g, ' ').trim();
  return t.length > 58 ? t.slice(0, 56).trim() + '…' : t;
}

/* ---------------- menu 2 cấp ---------------- */
const PILLARS = [
  { key: 'home', label: 'Nạp mực máy in', href: 'home/', hrefIsIndex: false },
  { key: 'Phan-mem-reset-may-in', label: 'Phần mềm reset', href: 'Phan-mem-reset-may-in/' },
  { key: 'sua-may-in-tai-hcm', label: 'Sửa máy in', href: 'sua-may-in-tai-hcm/' },
  { key: 'sua-may-tinh-tan-noi', label: 'Sửa máy tính', href: 'sua-may-tinh-tan-noi/' },
  { key: 'ban-may-in-cu-gia-re', label: 'Máy in cũ', href: 'ban-may-in-cu-gia-re/' },
  { key: 'thu-thuat-tin-hoc', label: 'Thủ thuật', href: 'thu-thuat-tin-hoc/' },
  { key: 'bang-gia-nap-muc-may-in-tan-noi', label: 'Bảng giá', href: 'bang-gia-nap-muc-may-in-tan-noi/' },
  { key: 'liên-hệ', label: 'Liên hệ', href: 'liên-hệ/' },
];

function buildMenu(pages) {
  const byPath = new Map(pages.map(p => [p.path, p]));
  const menu = [];
  for (const pil of PILLARS) {
    const children = pages
      .filter(p => p.path.startsWith(pil.key + '/') && p.path.split('/').length === 2)
      .sort((a, b) => shortLabel(a.title).localeCompare(shortLabel(b.title), 'vi'));
    // href: trang mục lục nếu tồn tại, không thì trang chủ (với pillar 'home')
    const self = byPath.get(pil.key);
    const href = pil.key === 'home' ? '' : (self ? pil.href : (children[0] ? encPath(children[0].path) + '/' : ''));
    menu.push({
      label: pil.label,
      href,
      children: children.map(c => ({ label: shortLabel(c.title), href: encPath(c.path) + '/' })),
      moreHref: self ? pil.href : '',
    });
  }
  return menu;
}

function renderMenu(menu, prefix, curPath) {
  const items = menu.map(m => {
    const active = curPath && m.href && curPath.startsWith(m.href.replace(/\/$/, '')) ? ' active' : '';
    const topHref = (prefix + m.href) || 'index.html'; // pillar "Nạp mực" = trang chủ
    const top = '<a href="' + topHref + '" class="nav-top' + active + '">' + esc(m.label) +
      (m.children.length ? '<span class="caret" aria-hidden="true">▾</span>' : '') + '</a>';
    if (!m.children.length) return '<li class="nav-item">' + top + '</li>';
    const cols = m.children.length > 14 ? ' cols-3' : m.children.length > 6 ? ' cols-2' : '';
    const sub = '<ul class="submenu' + cols + '">' +
      m.children.map(c => '<li><a href="' + prefix + c.href + '">' + esc(c.label) + '</a></li>').join('') +
      (m.moreHref ? '<li class="submenu-all"><a href="' + prefix + m.moreHref + '">Xem tất cả ' + esc(m.label.toLowerCase()) + ' →</a></li>' : '') +
      '</ul>';
    return '<li class="nav-item has-sub">' + top +
      '<button class="sub-toggle" type="button" aria-label="Mở mục con">▾</button>' + sub + '</li>';
  }).join('\n        ');

  return `<header class="site-header">
  <div class="container header-inner">
    <a href="${prefix}index.html" class="logo">
      <img class="logo-icon" src="${prefix}assets/img/logo-ht.jpg" alt="Tin Học HT" width="42" height="42">
      <span class="logo-text">
        <span><span class="logo-text-1">Tin Học</span> <span class="logo-text-2">HT</span></span>
        <small>Nạp mực · Sửa máy in · Sửa máy tính</small>
      </span>
    </a>
    <button type="button" class="nav-toggle" id="navToggle" aria-expanded="false" aria-controls="mainNav" aria-label="Mở menu">
      <span></span><span></span><span></span>
    </button>
    <nav class="main-nav" id="mainNav" aria-label="Menu chính">
      <ul class="nav-list">
        <li class="nav-item"><a href="${prefix}index.html" class="nav-top">Trang chủ</a></li>
        ${items}
      </ul>
      <a href="tel:${cfg.hotlineTel}" class="hotline-btn hotline-btn-mobile">📞 Gọi ${cfg.hotlineDisplay}</a>
    </nav>
    <a href="tel:${cfg.hotlineTel}" class="hotline-btn hotline-btn-desktop">📞 ${cfg.hotlineDisplay}</a>
  </div>
</header>

<div class="mobile-cta-bar" aria-label="Liên hệ nhanh">
  <a href="tel:${cfg.hotlineTel}" class="mobile-cta call">📞 Gọi ngay</a>
  <a href="https://zalo.me/${cfg.zaloTel}" class="mobile-cta zalo" target="_blank" rel="noopener">💬 Chat Zalo</a>
</div>
<div class="float-cta" aria-label="Liên hệ nhanh nổi">
  <a href="https://zalo.me/${cfg.zaloTel}" class="float-btn float-zalo" target="_blank" rel="noopener" title="Chat Zalo">Zalo</a>
  <a href="tel:${cfg.hotlineTel}" class="float-btn float-call" title="Gọi điện">📞</a>
</div>`;
}

function renderFooter(menu, prefix) {
  const links = menu.map(m => '<li><a href="' + prefix + m.href + '">' + esc(m.label) + '</a></li>').join('');
  return `<footer class="site-footer">
  <div class="container footer-inner">
    <div class="footer-col">
      <h2>Tin Học HT</h2>
      <p>Chuyên nạp/bơm mực máy in, sửa máy in, sửa máy tính tận nơi tại TP.HCM — hơn 10 năm kinh nghiệm.</p>
      <p>${esc(cfg.addressFull)}</p>
      <p>Hotline: <a href="tel:${cfg.hotlineTel}">${cfg.hotlineDisplay}</a> · Zalo: <a href="https://zalo.me/${cfg.zaloTel}">${cfg.zaloDisplay}</a></p>
    </div>
    <div class="footer-col">
      <h2>Giờ làm việc</h2>
      <p>Thứ 2 – Chủ nhật: 8:00 – 19:00</p>
      <p>Phục vụ 24/7 cho đơn khẩn cấp</p>
    </div>
    <div class="footer-col">
      <h2>Danh mục</h2>
      <ul><li><a href="${prefix}index.html">Trang chủ</a></li>${links}</ul>
    </div>
    <div class="footer-col">
      <h2>Khu vực phục vụ</h2>
      <p>Quận 1, 3, 5, 6, 7, 8, 9, 10, 11, 12, Tân Bình, Tân Phú, Phú Nhuận, Bình Thạnh, Gò Vấp, Bình Tân và các khu vực lân cận TP.HCM.</p>
    </div>
  </div>
  <p class="copyright">© 2026 Tin Học HT. All rights reserved.</p>
</footer>`;
}

/* ---------------- nội dung trang ---------------- */
/* Nhiều link nội bộ trên site gốc trỏ sai (viết không dấu trong khi URL thật có dấu,
   'đ' bị viết thành 'dh'...). Khớp lại bằng tên trang đã chuẩn hoá để link không chết. */
let PAGE_SET = new Set();     // path thật
let BASE_MAP = new Map();     // tên cuối đã chuẩn hoá -> path thật
let TOKEN_IDX = [];           // [{path, tokens:Set}] để khớp gần đúng
const FIX_LOG = new Map();    // href gãy -> path đã khớp lại
let unresolved = new Set();

function deaccent(s) {
  return String(s).toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd');
}
function normKey(s) {
  return deaccent(s).replace(/dh/g, 'd').replace(/[^a-z0-9]/g, '');
}
const STOP = new Set(['i', 'la', 'va', 'cho', 'the', 'gia', 're', 'nhanh', 'nhat', 'uy', 'tin', 'tai', 'nha', 'tan', 'noi', 'o', '24', '7', '247', 'hcm', 'tphcm', 'tp']);
function tokenList(s) {
  return deaccent(s).replace(/dh/g, 'd').replace(/[^a-z0-9]+/g, ' ').trim().split(' ').filter(Boolean);
}
function tokens(s) {
  return new Set(tokenList(s).filter(x => !STOP.has(x)));
}
/* Cặp từ liền kề — để phân biệt "quận Tân Bình" với "quận Bình Tân" (cùng tập từ, khác thứ tự) */
function bigrams(s) {
  const l = tokenList(s);
  const out = new Set();
  for (let i = 0; i < l.length - 1; i++) out.add(l[i] + '|' + l[i + 1]);
  return out;
}
function indexPages(pages) {
  PAGE_SET = new Set(pages.map(p => p.path));
  BASE_MAP = new Map();
  TOKEN_IDX = [];
  for (const p of pages) {
    const base = p.path.split('/').pop();
    const key = normKey(base);
    const cur = BASE_MAP.get(key);
    if (!cur || p.path.length < cur.length) BASE_MAP.set(key, p.path);
    // khoá phụ: chuẩn hoá theo title (nhiều link cũ đặt theo tiêu đề)
    const tkey = normKey(p.title);
    if (tkey && !BASE_MAP.has(tkey)) BASE_MAP.set(tkey, p.path);
    TOKEN_IDX.push({ path: p.path, tk: tokens(base), bg: bigrams(base) });
  }
}
/* Khớp lại link gãy: (1) đúng path, (2) khoá chuẩn hoá, (3) trùng token cao nhất.
   Chỉ nhận khi phần lớn token của bên ngắn hơn nằm trong bên kia (containment ≥ .8). */
function fixInternalPath(p, fromPath) {
  if (!p || PAGE_SET.has(p)) return p;
  const base = p.split('/').pop();
  const exact = BASE_MAP.get(normKey(base)) || BASE_MAP.get(normKey(p.replace(/\//g, '')));
  if (exact) { FIX_LOG.set(p, exact); return exact; }

  const want = tokens(base);
  const wantBg = bigrams(base);
  if (want.size < 2) { unresolved.add(p); return p; }
  let best = null, bestScore = 0;
  for (const cand of TOKEN_IDX) {
    let inter = 0;
    for (const t of want) if (cand.tk.has(t)) inter++;
    if (inter < 2) continue;
    const score = inter / Math.min(want.size, cand.tk.size);
    let bg = 0;
    for (const g of wantBg) if (cand.bg.has(g)) bg++;
    const bgScore = wantBg.size ? bg / Math.min(wantBg.size, Math.max(cand.bg.size, 1)) : 0;
    const bonus = fromPath && cand.path.split('/')[0] === fromPath.split('/')[0] ? 0.03 : 0;
    const total = score + bonus + bgScore * 0.25 + inter / 200;
    // điểm bằng nhau -> ưu tiên trang tổng (path nông/ngắn hơn) thay vì 1 trang con ngẫu nhiên
    if (total > bestScore + 1e-9 ||
        (best && Math.abs(total - bestScore) < 1e-9 && cand.path.length < best.length)) {
      bestScore = Math.max(bestScore, total); best = cand.path;
    }
  }
  if (best && bestScore >= 0.8) { FIX_LOG.set(p, best); return best; }
  unresolved.add(p);
  return p;
}

function resolveHref(href, prefix, fromPath) {
  if (!href) return '';
  if (/^(tel:|mailto:|#)/i.test(href)) return href;
  let raw = null;
  const m = href.match(/^https?:\/\/(?:www\.)?tinhocht\.com(\/.*)?$/i);
  if (m) raw = m[1] || '/';
  else if (href.startsWith('/')) raw = href;
  if (raw === null) return href; // link ngoài (tinhocnamphong.net, mucinht.com…) — giữ nguyên
  let p = decodeURIComponent(raw).replace(/[?#].*$/, '').replace(/^\/+/, '').replace(/\/+$/, '');
  if (!p || p === 'home') return prefix + 'index.html';
  p = fixInternalPath(p, fromPath);
  if (!PAGE_SET.has(p)) return prefix + 'index.html'; // không có trang thật -> về trang chủ, không để 404
  return prefix + encPath(p) + '/';
}

function linkify(text, links, prefix, fromPath) {
  let html = esc(text);
  for (const l of (links || [])) {
    if (!l.text || l.text.length < 3) continue;
    const href = resolveHref(l.href, prefix, fromPath);
    if (!href) continue;
    const needle = esc(l.text);
    const idx = html.indexOf(needle);
    if (idx < 0) continue;
    const ext = /^https?:/i.test(href) ? ' target="_blank" rel="noopener"' : '';
    html = html.slice(0, idx) + '<a href="' + esc(href) + '"' + ext + '>' + needle + '</a>' + html.slice(idx + needle.length);
  }
  return html.replace(/\n/g, '<br>');
}

function renderBlocks(blocks, prefix, imgPrefix, fromPath) {
  const out = [];
  let listBuf = [];
  const flush = () => { if (listBuf.length) { out.push('<ul class="check-list">' + listBuf.join('') + '</ul>'); listBuf = []; } };

  let skipFirstH1 = true;
  for (const b of blocks) {
    if (b.t === 'li') { listBuf.push('<li>' + linkify(b.text, b.links, prefix, fromPath) + '</li>'); continue; }
    flush();
    if (b.t === 'img') {
      const src = b.local ? imgPrefix + b.local : b.src;
      const dim = (b.w && b.h && b.w < 4000) ? ' width="' + b.w + '" height="' + b.h + '"' : '';
      out.push('<img src="' + esc(src) + '" alt="' + esc(b.alt || '') + '"' + dim + ' loading="lazy">');
      continue;
    }
    if (b.t === 'h1') { if (skipFirstH1) { skipFirstH1 = false; continue; } out.push('<h2>' + linkify(b.text, b.links, prefix, fromPath) + '</h2>'); continue; }
    if (/^h[2-5]$/.test(b.t)) {
      const lv = b.t === 'h2' ? 'h2' : b.t === 'h3' ? 'h3' : 'h4';
      out.push('<' + lv + '>' + linkify(b.text, b.links, prefix, fromPath) + '</' + lv + '>');
      continue;
    }
    out.push('<p>' + linkify(b.text, b.links, prefix, fromPath) + '</p>');
  }
  flush();
  return out.join('\n      ');
}

function metaDescOf(page) {
  if (page.metaDesc) return page.metaDesc.replace(/\s+/g, ' ').slice(0, 300);
  const b = page.blocks.find(x => (x.t === 'p' || x.t === 'li') && x.text && x.text.length > 60);
  return b ? b.text.replace(/\s+/g, ' ').slice(0, 300) : shortLabel(page.title);
}

function breadcrumb(page, pages, prefix) {
  const parts = page.path.split('/');
  const byPath = new Map(pages.map(p => [p.path, p]));
  const crumbs = [{ label: 'Trang chủ', href: prefix + 'index.html' }];
  for (let i = 0; i < parts.length - 1; i++) {
    const sub = parts.slice(0, i + 1).join('/');
    const pg = byPath.get(sub);
    const pil = PILLARS.find(p => p.key === sub);
    if (sub === 'home') continue;
    if (pg || pil) crumbs.push({ label: pil ? pil.label : shortLabel(pg.title), href: prefix + encPath(sub) + '/' });
  }
  crumbs.push({ label: shortLabel(page.title), href: null });
  return '<nav class="breadcrumb" aria-label="Đường dẫn"><ol>' + crumbs.map(c =>
    '<li>' + (c.href ? '<a href="' + c.href + '">' + esc(c.label) + '</a>' : '<span>' + esc(c.label) + '</span>') + '</li>').join('') + '</ol></nav>';
}

function childrenSection(page, pages, prefix) {
  const kids = pages.filter(p => p.path.startsWith(page.path + '/') && p.path.split('/').length === page.path.split('/').length + 1);
  if (!kids.length) return '';
  kids.sort((a, b) => shortLabel(a.title).localeCompare(shortLabel(b.title), 'vi'));
  return '\n      <section class="child-list"><h2>Xem thêm trong mục này</h2><ul class="card-grid">' +
    kids.map(k => '<li><a href="' + prefix + encPath(k.path) + '/"><strong>' + esc(shortLabel(k.title)) + '</strong>' +
      '<span>' + esc(metaDescOf(k).slice(0, 110)) + '…</span></a></li>').join('') + '</ul></section>';
}

function relatedSection(page, pages, prefix) {
  const parent = page.path.split('/').slice(0, -1).join('/');
  if (!parent) return '';
  const sib = pages.filter(p => p.path !== page.path && p.path.startsWith(parent + '/') &&
    p.path.split('/').length === page.path.split('/').length).slice(0, 8);
  if (sib.length < 2) return '';
  return '\n      <section class="related"><h2>Bài viết / dịch vụ liên quan</h2><ul class="link-list">' +
    sib.map(s => '<li><a href="' + prefix + encPath(s.path) + '/">' + esc(shortLabel(s.title)) + '</a></li>').join('') + '</ul></section>';
}

function ctaBlock() {
  return `\n      <aside class="cta-box">
        <p><strong>Cần nạp mực / sửa máy in gấp?</strong> Kỹ thuật có mặt trong 20–30 phút tại TP.HCM.</p>
        <p><a class="btn btn-primary" href="tel:${cfg.hotlineTel}">📞 Gọi ${cfg.hotlineDisplay}</a>
           <a class="btn btn-outline" href="https://zalo.me/${cfg.zaloTel}" target="_blank" rel="noopener">💬 Chat Zalo</a></p>
      </aside>`;
}

/* ---------------- build ---------------- */
function build() {
  const pages = loadPages();
  indexPages(pages);
  const menu = buildMenu(pages);
  let n = 0;

  for (const page of pages) {
    const depth = page.path.split('/').length;
    const prefix = '../'.repeat(depth);
    const isBill = /nap-muc-may-in-bill/.test(page.path);

    let body;
    if (isBill) {
      body = '<h1>' + esc(page.title) + '</h1>\n' +
        '<p>Mảng <strong>nạp mực máy in bill / máy in hóa đơn</strong> được phục vụ tại website chuyên trách của hệ thống:</p>\n' +
        '<p><a href="https://mucinht.com/" target="_blank" rel="noopener"><strong>👉 mucinht.com — Nạp mực máy in bill, thay mực máy in hóa đơn</strong></a></p>\n' +
        '<p>Cần hỗ trợ nhanh, quý khách vui lòng gọi <a href="tel:' + cfg.hotlineTel + '">' + cfg.hotlineDisplay + '</a>.</p>';
    } else {
      body = '<h1>' + esc(page.title) + '</h1>\n      ' + renderBlocks(page.blocks, prefix, prefix, page.path);
    }

    const html = `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<title>${esc(page.title)}</title>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="description" content="${esc(metaDescOf(page))}">
<link rel="canonical" href="${SITE_URL}/${encPath(page.path)}">${NOINDEX ? '\n<meta name="robots" content="noindex"><!-- demo github.io — bỏ dòng này khi gắn domain thật (NOINDEX=0) -->' : ''}
<link rel="stylesheet" href="${prefix}assets/css/style.css">
</head>
<body>
${renderMenu(menu, prefix, page.path)}

<main>
  <div class="container">
    ${breadcrumb(page, pages, prefix)}
  </div>
  <section class="section">
    <div class="container page-content">
      ${body}${ctaBlock()}${childrenSection(page, pages, prefix)}${relatedSection(page, pages, prefix)}
    </div>
  </section>
</main>

${renderFooter(menu, prefix)}
<script src="${prefix}assets/js/nav.js"></script>
</body>
</html>
`;
    const dir = path.join(ROOT, page.path.split('/').join(path.sep));
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'index.html'), html, 'utf8');
    n++;
  }

  // Header/footer dùng chung (partials/) — giữ để tham chiếu
  fs.writeFileSync(path.join(ROOT, 'partials', 'header.html'), renderMenu(menu, '', ''), 'utf8');
  fs.writeFileSync(path.join(ROOT, 'partials', 'footer.html'), renderFooter(menu, ''), 'utf8');

  // Trang chủ: render src/index.html (hero riêng) + chèn thẳng header/footer 2 cấp, đổi include.js -> nav.js
  const srcIndex = path.join(ROOT, 'src', 'index.html');
  if (fs.existsSync(srcIndex)) {
    let home = fs.readFileSync(srcIndex, 'utf8');
    home = home.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (m, k) => (k in cfg ? cfg[k] : m));
    home = home.replace('<div id="site-header"></div>', renderMenu(menu, '', ''));
    home = home.replace('<div id="site-footer"></div>', renderFooter(menu, ''));
    home = home.replace('assets/js/include.js', 'assets/js/nav.js');
    if (!NOINDEX) home = home.replace(/\s*<meta name="robots" content="noindex">(<!--[^>]*-->)?/g, '');
    fs.writeFileSync(path.join(ROOT, 'index.html'), home, 'utf8');
    console.log('  ✓ index.html (trang chủ, menu 2 cấp inline)');
  }

  // 404 + stub /home -> /
  const src404 = path.join(ROOT, 'src', '404.html');
  if (fs.existsSync(src404)) {
    let p404 = fs.readFileSync(src404, 'utf8').replace(/\{\{\s*([\w.]+)\s*\}\}/g, (m, k) => (k in cfg ? cfg[k] : m));
    fs.writeFileSync(path.join(ROOT, '404.html'), p404, 'utf8');
  }
  const homeStub = '<!DOCTYPE html>\n<html lang="vi">\n<head>\n<meta charset="UTF-8">\n<title>Đang chuyển hướng…</title>\n' +
    '<link rel="canonical" href="' + SITE_URL + '/">\n<meta name="robots" content="noindex">\n' +
    '<meta http-equiv="refresh" content="0; url=../">\n<script>location.replace("../");</script>\n</head>\n' +
    '<body><p>Trang này đã chuyển về <a href="../">' + SITE_URL + '/</a></p></body>\n</html>\n';
  fs.mkdirSync(path.join(ROOT, 'home'), { recursive: true });
  fs.writeFileSync(path.join(ROOT, 'home', 'index.html'), homeStub, 'utf8');

  // sitemap: trang chủ + tất cả trang (kể cả khi noindex, để sẵn cho lúc gắn domain)
  const today = new Date().toISOString().slice(0, 10);
  const urls = [SITE_URL + '/'].concat(pages.map(p => SITE_URL + '/' + encPath(p.path)).sort());
  fs.writeFileSync(path.join(ROOT, 'sitemap.xml'),
    '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls.map(u => '  <url><loc>' + u + '</loc><lastmod>' + today + '</lastmod></url>').join('\n') +
    '\n</urlset>\n', 'utf8');

  // báo cáo link nội bộ đã khớp lại / không khớp được (link gãy sẵn trên site gốc)
  const rep = {
    khopLai: [...FIX_LOG.entries()].map(([from, to]) => ({ from, to })),
    khongKhop: [...unresolved].sort(),
  };
  fs.writeFileSync(path.join(EXPORT, 'link-fix-report.json'), JSON.stringify(rep, null, 1), 'utf8');
  console.log('Link nội bộ gãy sẵn trên site gốc: đã khớp lại ' + rep.khopLai.length +
    ' kiểu link, không khớp được ' + rep.khongKhop.length + ' (trỏ tạm về trang chủ) — xem export/link-fix-report.json');

  console.log('Đã dựng ' + n + ' trang (nguyên văn DOM) + sitemap ' + urls.length + ' URL.');
  console.log('Menu 2 cấp: ' + menu.map(m => m.label + '(' + m.children.length + ')').join(', '));
  console.log(NOINDEX ? 'noindex: BẬT (demo). Gắn domain thật: NOINDEX=0 node build-site.js' : 'noindex: TẮT — bản production.');
}

build();
