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
const { buildSchema } = require('./tools/schema');
const { renderNewPage, toBlocks } = require('./tools/new-pages');

const ROOT = __dirname;
const EXPORT = 'D:\\AUTOMATION\\projects\\tinhocht\\export';
const DOM_DIR = path.join(EXPORT, 'pages-dom');
/* Domain chính là BẢN CÓ www: 148/149 URL đang có traffic trên GSC đều là www.tinhocht.com
   (bản không www hiện không phục vụ). Canonical + sitemap phải dùng đúng bản này, nếu không
   Google sẽ coi là URL khác và ranking cũ không chuyển sang. */
const SITE_URL = 'https://www.tinhocht.com';
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

/* Trang MỚI viết thêm (data/pages-new.json) — không có trên bản Google Sites cũ.
   Nhắm các model máy in đang có người tìm mà site chưa có trang. */
const NEW_PAGES = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'pages-new.json'), 'utf8')).pages;
const NEW_BY_PATH = new Map(NEW_PAGES.map(p => [p.path, p]));

function loadPages() {
  const pages = [];
  for (const f of fs.readdirSync(DOM_DIR)) {
    if (!f.endsWith('.json')) continue;
    const p = JSON.parse(fs.readFileSync(path.join(DOM_DIR, f), 'utf8'));
    if (!p.path || p.path === 'home') continue;              // /home == trang chủ (stub redirect)
    if (/dịch-vụ-mạng-tổng-đài|untitled-page/.test(p.path)) continue; // đã chốt loại
    pages.push(p);
  }
  // trang mới: tạo "blocks" giả để bộ sinh dữ liệu có cấu trúc đọc được các bước và hỏi–đáp
  for (const np of NEW_PAGES) {
    pages.push({ path: np.path, title: np.title, metaDesc: np.desc, blocks: toBlocks(np), isNew: true });
  }
  return pages;
}

/* Trang trùng nội dung -> gộp về 1 trang chính, URL cũ giữ lại dưới dạng chuyển hướng
   (KHÔNG xoá URL nào, nên link cũ trỏ vào đâu cũng không gãy). */
const MERGE_INTO = { 'bảng-giá': 'bang-gia-nap-muc-may-in-tan-noi' };

/* Ghi đè title/description — CHỈ dùng cho trang gộp có title mơ hồ ("BẢNG GIÁ" bị trùng 2 trang,
   vị trí GSC 27 nên gần như không có ranking để mất). KHÔNG áp dụng cho 8 trang ngôi sao. */
/* Tiêu đề + mô tả viết tay cho các trang nhiều lượt hiển thị nhưng ít người bấm.
   Tách ra data/seo-meta.json để sửa nội dung hiển thị trên Google mà không phải đụng code. */
const SEO_META = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'seo-meta.json'), 'utf8'));

const TITLE_OVERRIDE = {
  /* Trang này đang đứng vị trí 3,1 với 256 lượt hiển thị nhưng 0 lượt nhấp (GSC 6 tháng).
     Title cũ có ký tự "▷▷" và mô tả tự cắt từ đoạn mở bài nói về "năm 2020" — người tìm thấy
     nội dung cũ nên không bấm. Đổi title + mô tả để lấy lại lượt nhấp; nội dung bài giữ nguyên. */
  'thu-thuat-tin-hoc/top-3-máy-in-chuyên-in-đơn-hàng-giá-rẻ-tiết-kiệm-chi-phí': {
    title: 'Top 3 Máy In Đơn Hàng Giá Rẻ Cho Shop Online — Chọn Loại Nào?',
    desc: 'So sánh 3 máy in dùng để in đơn hàng cho shop bán online: máy in A4 Canon 2900 in đơn tiết kiệm, và các lựa chọn khác. Kèm giá nạp mực thực tế và tư vấn chọn theo lượng đơn mỗi ngày.',
  },
  /* Bài hướng dẫn ruy băng đang đứng vị trí 6,3 với 727 lượt hiển thị nhưng chỉ 24 lượt nhấp
     (3,3% — thấp so với vị trí này). Giữ nguyên title vì đang xếp hạng tốt, chỉ viết mô tả
     riêng thay cho đoạn tự cắt, để người tìm thấy ngay "có hình từng bước, tự làm được". */
  'thu-thuat-tin-hoc/thu-thuat-may-in/huong-dan-cach-thay-ruy-bang-may-in-hoa-dhon-epson-lq-300-310-2190': {
    title: 'Hướng Dẫn Cách Thay Ruy Băng Máy In Hóa Đơn Epson LQ 300/310/2190',
    desc: 'Cách thay ruy băng (băng mực) máy in kim Epson LQ 300+, LQ 310, LQ 2190 — hướng dẫn từng bước kèm hình, tự làm tại chỗ trong 5 phút, không cần gọi thợ. Kèm mẹo tránh kẹt băng và lệch mực.',
  },
  /* Trang này trùng chủ đề với bài trên nên bị chia phiếu (vị trí 16, 0 lượt nhấp). Nội dung thật
     của nó là TRANG DỊCH VỤ, nên đổi title theo hướng "thay tận nơi" để tách khỏi ý định "tự làm". */
  'home/thay-ruy-bang-muc-may-in-kim-epson-lq-300-lq-310': {
    title: 'Thay Ruy Băng Máy In Kim Epson LQ 300/310 Tận Nơi TP.HCM',
    desc: 'Dịch vụ thay ruy băng máy in kim Epson LQ 300, LQ 310, LQ 2190 tận nơi tại TP.HCM — kỹ thuật có mặt trong 20–30 phút, có sẵn băng mực, kiểm tra đầu kim và căn chỉnh bản in trước khi bàn giao.',
  },
  'bang-gia-nap-muc-may-in-tan-noi': {
    title: 'Bảng Giá Nạp Mực Máy In Tận Nơi TP.HCM — Công Khai, Không Phụ Thu',
    desc: 'Bảng giá nạp mực máy in tận nơi TP.HCM của Tin Học HT: laser trắng đen từ 90.000đ, laser màu 300.000đ, in phun 90.000đ. Miễn phí đi lại nội thành, có mặt 20–30 phút, bảo hành đến hết mực.',
  },
};
for (const [k, v] of Object.entries(SEO_META)) {
  if (k.startsWith('_')) continue;
  TITLE_OVERRIDE[k] = { title: v.title, desc: v.desc };
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
  { key: 'home', label: 'Nạp mực máy in', href: '', hrefIsIndex: false },
  { key: 'Phan-mem-reset-may-in', label: 'Phần mềm reset', href: 'Phan-mem-reset-may-in.html' },
  { key: 'sua-may-in-tai-hcm', label: 'Sửa máy in', href: 'sua-may-in-tai-hcm.html' },
  { key: 'sua-may-tinh-tan-noi', label: 'Sửa máy tính', href: 'sua-may-tinh-tan-noi.html' },
  { key: 'ban-may-in-cu-gia-re', label: 'Máy in cũ', href: 'ban-may-in-cu-gia-re.html' },
  { key: 'thu-thuat-tin-hoc', label: 'Thủ thuật', href: 'thu-thuat-tin-hoc.html' },
  { key: 'bang-gia-nap-muc-may-in-tan-noi', label: 'Bảng giá', href: 'bang-gia-nap-muc-may-in-tan-noi.html' },
  { key: 'liên-hệ', label: 'Liên hệ', href: 'liên-hệ.html' },
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
    const href = pil.key === 'home' ? '' : (self ? pil.href : (children[0] ? encPath(children[0].path) + '.html' : ''));
    menu.push({
      label: pil.label,
      href,
      children: children.map(c => ({ label: shortLabel(c.title), href: encPath(c.path) + '.html' })),
      moreHref: self ? pil.href : '',
    });
  }
  return menu;
}

function renderMenu(menu, prefix, curPath) {
  const items = menu.map(m => {
    const active = curPath && m.href && curPath.startsWith(m.href.replace(/\.html$/, '')) ? ' active' : '';
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
/* Từ nhiễu trong slug quảng cáo. KHÔNG bỏ chữ số (số quận là thông tin phân biệt quan trọng:
   "quận 7" khác "quận 10"); chỉ bỏ cụm "24/7" khi 2 số đi liền nhau. */
const STOP = new Set(['i', 'la', 'va', 'cho', 'the', 'gia', 're', 'nhanh', 'nhat', 'uy', 'tin', 'tai', 'nha', 'o', '247', 'hcm', 'tphcm', 'tp']);
function tokenList(s) {
  return deaccent(s).replace(/dh/g, 'd')
    .replace(/\b24[\s\-\/]*7\b/g, ' ')          // "24/7", "24-7" -> bỏ, nhưng giữ số quận
    .replace(/\btan[\s\-]+noi\b/g, ' ')         // "tận nơi" -> bỏ, nhưng giữ "Tân" trong Tân Phú/Tân Bình
    .replace(/[^a-z0-9]+/g, ' ').trim().split(' ').filter(Boolean);
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
function indexPages(allPages) {
  const pages = allPages.filter(p => !MERGE_INTO[p.path]);   // trang đã gộp không còn là đích
  PAGE_SET = new Set(pages.map(p => p.path));
  BASE_MAP = new Map();
  TOKEN_IDX = [];
  // URL của trang bị gộp -> trỏ thẳng sang trang chính
  for (const [from, to] of Object.entries(MERGE_INTO)) BASE_MAP.set(normKey(from.split('/').pop()), to);
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
/* Vài link gãy mà máy không tự đoán an toàn được -> chỉ định tay (đã đối chiếu nội dung trang đích) */
const ALIAS = {
  'kinh-nghiem---thu-thuat': 'thu-thuat-tin-hoc',
  'home/bom-muc-may-in-sieu-toc-quan-tan-binh-gia-80-000': 'home/nap-muc-may-in-quan-tan-binh',
  'home/nap-muc-may-in-gia-re-tp-hcm---chi-con-80k/nap-muc-may-in-hp-pro-m402dn':
    'home/nap-muc-may-in-gia-re-tp-hcm---chi-con-80k/nạp-mực-máy-in-hp-pro-m-404dn-giá-rẻ-nhất', // trang này viết về cả M402 và M404
};

function fixInternalPath(p, fromPath) {
  if (!p || PAGE_SET.has(p)) return p;
  if (ALIAS[p] && PAGE_SET.has(ALIAS[p])) { FIX_LOG.set(p, ALIAS[p]); return ALIAS[p]; }
  const base = p.split('/').pop();
  const exact = BASE_MAP.get(normKey(base)) || BASE_MAP.get(normKey(p.replace(/\//g, '')));
  if (exact) { FIX_LOG.set(p, exact); return exact; }

  const want = tokens(base);
  const wantBg = bigrams(base);
  if (want.size < 2) { unresolved.add(p); return p; }
  // số trong tên trang (quận 4, L3110, M254…) là yếu tố phân biệt — thiếu số là loại thẳng
  const wantNums = [...want].filter(t => /\d/.test(t));
  let best = null, bestScore = 0;
  for (const cand of TOKEN_IDX) {
    if (wantNums.length && !wantNums.every(n => cand.tk.has(n))) continue;
    let inter = 0;
    for (const t of want) if (cand.tk.has(t)) inter++;
    if (inter < 2) continue;
    // Dice cân bằng 2 phía; chỉ cho phép chấm theo "chứa trọn" khi ứng viên không quá ngắn
    // (nếu không, mọi link sẽ rơi hết về trang tổng vì tên trang tổng chỉ vài từ).
    const dice = 2 * inter / (want.size + cand.tk.size);
    const cont = inter / Math.min(want.size, cand.tk.size);
    const score = cand.tk.size >= want.size * 0.6 ? Math.max(dice, cont) : dice;
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
  return prefix + encPath(p) + '.html';
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

/* Danh sách cấp bậc trang — dùng chung cho breadcrumb hiển thị và dữ liệu có cấu trúc */
function crumbList(page, pages) {
  const parts = page.path.split('/');
  const byPath = new Map(pages.map(p => [p.path, p]));
  const out = [{ name: 'Trang chủ', url: '/' }];
  for (let i = 0; i < parts.length - 1; i++) {
    const sub = parts.slice(0, i + 1).join('/');
    if (sub === 'home') continue;
    const pg = byPath.get(sub);
    const pil = PILLARS.find(p => p.key === sub);
    if (pg || pil) out.push({ name: pil ? pil.label : shortLabel(pg.title), url: '/' + encPath(sub) });
  }
  out.push({ name: shortLabel(page.title), url: null });
  return out;
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
    if (pg || pil) crumbs.push({ label: pil ? pil.label : shortLabel(pg.title), href: prefix + encPath(sub) + '.html' });
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
    kids.map(k => '<li><a href="' + prefix + encPath(k.path) + '.html"><strong>' + esc(shortLabel(k.title)) + '</strong>' +
      '<span>' + esc(metaDescOf(k).slice(0, 110)) + '…</span></a></li>').join('') + '</ul></section>';
}

function relatedSection(page, pages, prefix) {
  const parent = page.path.split('/').slice(0, -1).join('/');
  if (!parent) return '';
  const sib = pages.filter(p => p.path !== page.path && p.path.startsWith(parent + '/') &&
    p.path.split('/').length === page.path.split('/').length).slice(0, 8);
  if (sib.length < 2) return '';
  return '\n      <section class="related"><h2>Bài viết / dịch vụ liên quan</h2><ul class="link-list">' +
    sib.map(s => '<li><a href="' + prefix + encPath(s.path) + '.html">' + esc(shortLabel(s.title)) + '</a></li>').join('') + '</ul></section>';
}

/* ---------------- trang Bảng giá (gộp 2 trang gốc) ---------------- */
const PRICE_PATH = 'bang-gia-nap-muc-may-in-tan-noi';   // trang chính (đang có traffic GSC)
const PRICE_MERGED = 'bảng-giá';                        // trang trùng nội dung -> chuyển hướng về trang chính

/* ---------------- liên kết chéo sang mucinht.com ----------------
   Mảng máy in bill / hoá đơn / tem mã vạch thuộc lãnh địa mucinht.com (đã chốt theo bảng phân
   vùng keyword). Các trang dưới đây của tinhocht đang có thứ hạng thật cho nhóm từ khoá đó,
   nên GIỮ NGUYÊN nội dung để không mất vị trí, chỉ thêm một khối dẫn khách sang mucinht.com. */
const MUCINHT = {
  service: 'https://mucinht.com/category/dich-vu-sua-chua/sua-may-in-bill-ma-vach/',
  home: 'https://mucinht.com/',
};
/* Chỉ 3 trang thuộc mảng in nhiệt / in hoá đơn mới dẫn sang mucinht, và dẫn NHẸ:
   một dòng chữ cuối bài, không tiêu đề, không nút — chỉ để anchor mang từ khoá đi qua.
   2 bài ruy băng máy in kim KHÔNG dẫn đi: đó là ngách nạp mực/ruy băng của chính tinhocht. */
const CROSS_LINK = {
  'nap-muc-may-in-bill---thay-muc-may-in-hoa-don': {
    truoc: 'Khách cần thay máy, mua giấy in nhiệt khổ 80mm hoặc',
    anchor: 'sửa máy in bill, máy in tem mã vạch',
    sau: 'có thể xem thêm bên mucinht.com cùng hệ thống.',
  },
  'nap-muc-may-in-bill---thay-muc-may-in-hoa-don/thay-muc-may-in-bill-epson-tm-u220': {
    truoc: 'Ngoài ra, nếu cần',
    anchor: 'máy in hoá đơn Epson và giấy in nhiệt khổ 80mm',
    sau: 'thì bên mucinht.com có sẵn hàng.',
  },
  'thu-thuat-tin-hoc/top-3-máy-in-chuyên-in-đơn-hàng-giá-rẻ-tiết-kiệm-chi-phí': {
    truoc: 'Shop in nhiều đơn mỗi ngày thường chuyển sang',
    anchor: 'máy in nhiệt in tem vận đơn khổ A6',
    sau: '— dòng máy này bên mucinht.com có bán và bảo hành.',
  },
};

function crossLinkBlock(o) {
  return `
      <p class="cross-hint">${esc(o.truoc)}
        <a href="${MUCINHT.service}" rel="noopener">${esc(o.anchor)}</a> ${esc(o.sau)}</p>`;
}

/* Hai bài cùng nhắm cụm "thay ruy băng máy in kim Epson LQ" đang giẫm chân nhau trên Google:
   bài hướng dẫn (290 từ) đứng vị trí 6,3 với 24 lượt nhấp, còn trang dịch vụ (929 từ) đứng
   vị trí 16 và 0 lượt nhấp. Cho trang yếu trỏ về bài mạnh để dồn tín hiệu về một chỗ. */
const BOOST_LINK = {
  'home/thay-ruy-bang-muc-may-in-kim-epson-lq-300-lq-310': {
    to: 'thu-thuat-tin-hoc/thu-thuat-may-in/huong-dan-cach-thay-ruy-bang-may-in-hoa-dhon-epson-lq-300-310-2190',
    anchor: 'Hướng dẫn cách thay ruy băng máy in kim Epson LQ 300 / LQ 310 / LQ 2190',
    lead: 'Muốn tự thay ruy băng tại chỗ, xem hướng dẫn từng bước kèm hình:',
  },
};

function boostLinkBlock(cfgBoost, prefix) {
  return `
      <aside class="inline-guide">
        <p>${esc(cfgBoost.lead)}
          <a href="${prefix}${encPath(cfgBoost.to)}.html"><strong>${esc(cfgBoost.anchor)}</strong></a>
        </p>
      </aside>`;
}

/* Trang hỏi về giá nhưng bản gốc Google Sites bị rớt cột giá (chỉ còn danh sách máy).
   Chèn thẳng bảng giá thật vào để khách đọc là biết luôn, không phải nhảy sang trang khác. */
const PRICE_EMBED = new Set([
  'home/bơm-mực-máy-in-bao-nhiêu-tiền',
  'home/nap-muc-may-in-gia-re-tp-hcm---chi-con-80k/nạp-mực-máy-in-giá-bao-nhiêu-rẻ-nhất-247',
]);

function priceTableCompact(prefix) {
  const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'bang-gia.json'), 'utf8'));
  const rows = data.nhom.map(g => `<tr>
            <th scope="row"><span class="pt-hang">${esc(g.hang)}</span><span class="pt-loai">${esc(g.loai)}</span></th>
            <td class="pt-gia"><strong>${esc(g.gia)}</strong><small>${esc(data.donVi)}</small></td>
          </tr>`).join('\n          ');
  return `
      <section class="price-inline">
        <h2>Giá nạp mực máy in bao nhiêu tiền?</h2>
        <p>Bảng giá áp dụng tại TP.HCM, đã gồm công đến tận nơi — không phụ thu phí đi lại:</p>
        <div class="price-table-wrap">
          <table class="price-table price-table-compact">
            <thead><tr><th scope="col">Loại máy in</th><th scope="col">Giá nạp mực</th></tr></thead>
            <tbody>
          ${rows}
            </tbody>
          </table>
        </div>
        <ul class="price-notes"><li>${data.ghiChu.slice(0, 2).map(esc).join('</li><li>')}</li></ul>
        <p><a class="btn btn-outline" href="${prefix}${encPath(PRICE_PATH)}.html">Xem bảng giá đầy đủ theo từng dòng máy →</a></p>
      </section>`;
}

function renderPricePage(page, pages, prefix) {
  const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'bang-gia.json'), 'utf8'));

  const rows = data.nhom.map(g => `
        <tr>
          <th scope="row">
            ${g.anh ? '<img class="pt-anh" src="' + prefix + esc(g.anh) + '" alt="Máy in ' + esc(g.hang) + ' ' + esc(g.loai) + '" loading="lazy">' : ''}
            <span class="pt-hang">${esc(g.hang)}</span><span class="pt-loai">${esc(g.loai)}</span>
          </th>
          <td class="pt-models"><ul>${g.models.map(m => '<li>' + esc(m) + '</li>').join('')}</ul></td>
          <td class="pt-gia"><strong>${esc(g.gia)}</strong><small>${esc(data.donVi)}</small></td>
        </tr>`).join('');
  const gallery = '';

  // giữ nguyên văn các đoạn mô tả / quy trình của trang gốc (bỏ phần liệt kê model & giá rời rạc)
  const keep = page.blocks.filter(b =>
    (b.t === 'p' || b.t === 'li') && b.text && b.text.length > 60 &&
    !/^-\s*Máy in/i.test(b.text) && !/^\d+[kK]$/.test(b.text.trim()));
  const intro = keep.slice(0, 2).map(b => '<p>' + linkify(b.text, b.links, prefix, page.path) + '</p>').join('\n      ');
  const rest = keep.slice(2).map(b => '<p>' + linkify(b.text, b.links, prefix, page.path) + '</p>').join('\n        ');

  return `<h1>${esc(page.title === 'BẢNG GIÁ' ? 'Bảng giá nạp mực máy in tận nơi TP.HCM' : page.title)}</h1>
      ${intro}

      <div class="price-highlight">
        <div><span class="ph-num">20–30′</span><span class="ph-lbl">Có mặt tận nơi</span></div>
        <div><span class="ph-num">90.000đ</span><span class="ph-lbl">Nạp mực laser từ</span></div>
        <div><span class="ph-num">0đ</span><span class="ph-lbl">Phí đi lại nội thành</span></div>
        <div><span class="ph-num">Hết mực</span><span class="ph-lbl">Thời gian bảo hành</span></div>
      </div>

      <section>
        <h2>Bảng giá nạp mực máy in theo hãng</h2>
        <div class="price-table-wrap">
          <table class="price-table">
            <thead><tr><th scope="col">Hãng máy in</th><th scope="col">Dòng máy áp dụng</th><th scope="col">Đơn giá</th></tr></thead>
            <tbody>${rows}
            </tbody>
          </table>
        </div>
        <ul class="price-notes">${data.ghiChu.map(x => '<li>' + esc(x) + '</li>').join('')}</ul>
      </section>

      <section class="price-commit">
        <h2>Cam kết khi nạp mực tại Tin Học HT</h2>
        <ul class="check-list">${data.camKet.map(x => '<li>' + esc(x) + '</li>').join('')}</ul>
      </section>

      <section class="khu-vuc-gia">
        <h2>Bảng giá này áp dụng ở những khu vực nào?</h2>
        <p>Mức giá trên áp dụng cho toàn bộ khu vực nội thành TP.HCM, đã gồm công tới tận nơi.
           Bấm vào quận của bạn để xem thời gian kỹ thuật có mặt và các dịch vụ kèm theo:</p>
        <ul class="link-list">${Object.keys(TEN_QUAN)
          .filter(q => PAGE_SET.has(pathCuaQuan(q)))
          .map(q => `<li><a href="${prefix}${encPath(pathCuaQuan(q))}.html">Nạp mực máy in ${esc(TEN_QUAN[q])}</a></li>`)
          .join('')}</ul>
      </section>
${gallery}
      <section class="price-more">
        ${rest}
      </section>`;
}

/* ---------------- khu vực lân cận + hỏi đáp cho trang dịch vụ theo quận ----------------
   Hai mục đích cùng lúc:
   1) Khách ở giáp ranh hai quận tìm được đúng trang mình cần.
   2) Chia đều liên kết nội bộ. Đo trên chính site: trang được ≥8 liên kết trỏ tới đứng
      trung bình vị trí 18,8; trang dưới 8 liên kết tụt xuống 23,1. Nhóm quận 7, 8, 9, 12,
      Gò Vấp, Bình Tân đang ở nhóm ít liên kết và cũng đang xếp hạng thấp nhất. */
const LAN_CAN = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'quan-lan-can.json'), 'utf8'));
const TEN_QUAN = LAN_CAN._ten_hien_thi;
/* Vài trang đặt URL không theo mẫu chung (giữ nguyên slug gốc nên không đổi được) */
const QUAN_PATH = {
  'quan-4': 'home/bơm-mực-máy-in-quận-4-có-mặt-nhanh-nhất-giá-rẻ',
};
const pathCuaQuan = q => QUAN_PATH[q] || ('home/nap-muc-may-in-' + q);

function quanCuaTrang(p) {
  for (const [q, duongDan] of Object.entries(QUAN_PATH)) if (duongDan === p) return q;
  const m = p.match(/^home\/nap-muc-may-in-(quan-[a-z0-9-]+)$/);
  return m && LAN_CAN[m[1]] ? m[1] : null;
}

function khuVucLanCan(quan, prefix, pageSet) {
  const ds = (LAN_CAN[quan] || []).filter(q => pageSet.has(pathCuaQuan(q)));
  if (ds.length < 2) return '';
  const ten = TEN_QUAN[quan];
  return `
      <section class="lan-can">
        <h2>Nạp mực máy in ở khu vực gần ${esc(ten)}</h2>
        <p>Kỹ thuật phụ trách ${esc(ten)} cũng nhận việc ở các quận sát bên. Nhà hoặc công ty nằm ở
           ranh giới thì bấm vào khu vực gần mình nhất để xem giá và thời gian có mặt:</p>
        <ul class="link-list">${ds.map(q =>
          `<li><a href="${prefix}${encPath(pathCuaQuan(q))}.html">Nạp mực máy in ${esc(TEN_QUAN[q])}</a></li>`).join('')}</ul>
      </section>`;
}

/* Địa bàn phục vụ của từng quận: tuyến đường, địa điểm quen thuộc, quãng đường từ cửa hàng.
   Lý do thêm: đo trên chính site cho thấy trang quận 3 dài hơn và được nhiều liên kết hơn
   trang quận 10 nhưng vẫn đứng sau 4 bậc. Khác biệt còn lại là mức độ cụ thể về địa lý —
   trang nào cũng nói chung chung "phục vụ toàn quận" thì không có gì để Google phân biệt.
   Nêu đúng tên đường, chợ, toà nhà và thời gian di chuyển thật là thứ khách cần biết,
   đồng thời bắt được các tìm kiếm kèm tên đường. */
const DIA_BAN = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'quan-dia-ban.json'), 'utf8'));

function diaBanQuan(quan) {
  const d = DIA_BAN[quan];
  if (!d) return '';
  const ten = d.ten;
  const duong = d.duong.map(esc);
  const dsDuong = duong.slice(0, -1).join(', ') + ' và ' + duong[duong.length - 1];
  const diaDiem = d.diaDiem.map(esc);
  const dsDiaDiem = diaDiem.slice(0, -1).join(', ') + ' và ' + diaDiem[diaDiem.length - 1];
  const taiCho = d.km <= 1;
  const cauDiChuyen = taiCho
    ? `Cửa hàng nằm ngay tại ${esc(ten)} — số 79 Bắc Hải — nên khách trong quận gọi là kỹ thuật có mặt nhanh nhất,
       thường trong vòng 15 phút.`
    : `Từ cửa hàng ở 79 Bắc Hải (Quận 10) sang ${esc(ten)} khoảng ${String(d.km).replace('.', ',')} km, kỹ thuật chạy mất chừng
       ${d.phut} phút. Đây là quãng đường đi lại hằng ngày nên khách gọi buổi sáng thường được nhận trong buổi.`;
  return `
      <section class="dia-ban">
        <h2>Địa bàn nhận nạp mực máy in tại ${esc(ten)}</h2>
        <p>${cauDiChuyen}</p>
        <p>Kỹ thuật nhận việc trên khắp các tuyến ${dsDuong} cùng những khu vực lân cận. Khách ở quanh
           ${dsDiaDiem} là nhóm gọi thường xuyên nhất, phần lớn là văn phòng, cửa hàng photo và hộ kinh doanh
           in hoá đơn mỗi ngày.</p>
        <p>Nhà hoặc công ty nằm trong hẻm, trên tầng cao hay trong toà nhà văn phòng đều nhận bình thường,
           không tính thêm phí. Máy đặt ở đâu thì bơm mực ngay tại đó, không cần tháo máy mang đi.</p>
      </section>`;
}

/* Hỏi–đáp cho trang quận. Xoay theo số thứ tự quận để các trang không giống hệt nhau,
   và mỗi câu trả lời đều gắn với chính khu vực đó. */
function cauHoiQuan(quan) {
  const ten = TEN_QUAN[quan];
  const lc = (LAN_CAN[quan] || []).slice(0, 2).map(q => TEN_QUAN[q]).join(' và ');
  const bo = [
    ['Nạp mực máy in ở ' + ten + ' giá bao nhiêu?',
     'Máy in laser trắng đen 90.000đ, laser màu 300.000đ, máy in phun 90.000đ — giá đã gồm công tới tận nơi trong ' + ten + ', không phụ thu phí đi lại. Máy cần thay thêm linh kiện thì báo giá trước khi làm.'],
    ['Bao lâu thì có kỹ thuật tới ' + ten + '?',
     'Trong giờ hành chính thường 20–30 phút kể từ lúc gọi, vì luôn có kỹ thuật trực sẵn ở khu vực ' + ten + ' và ' + lc + '. Giờ cao điểm hoặc trời mưa có thể lâu hơn khoảng 15 phút.'],
    ['Nạp mực xong bản in có đậm đẹp như mực hãng không?',
     'Mực dùng là loại nhập từ Nhật và Mỹ, in ra đậm nét và đều màu. Trước khi bàn giao đều in thử tại chỗ cho khách xem, bản in chưa ưng thì làm lại ngay, không tính thêm tiền.'],
    ['Có làm ngoài giờ và cuối tuần ở ' + ten + ' không?',
     'Có. Nhận cả thứ 7, chủ nhật, ngày lễ và buổi tối. Cần gấp ngoài giờ thì gọi trước để kỹ thuật sắp lịch, không tính phụ phí ngoài giờ.'],
    ['Công ty ở ' + ten + ' có xuất hoá đơn và làm công nợ được không?',
     'Được. Xuất hoá đơn VAT đầy đủ theo yêu cầu, doanh nghiệp dùng thường xuyên có thể ký phiếu từng lần rồi thanh toán gộp cuối tháng.'],
    ['Bảo hành sau khi nạp mực thế nào?',
     'Bảo hành đến khi hết hộp mực. Trong thời gian đó bản in bị mờ, lem hay sọc thì gọi lại, kỹ thuật quay lại xử lý miễn phí.'],
  ];
  /* Mỗi trang lấy 3 câu trong bộ 6, xoay theo tên quận để không trang nào giống hệt trang nào.
     Dùng mã băm từ cả tên chứ không chỉ chữ số — nếu không thì Gò Vấp, Bình Tân, Tân Bình…
     (những quận không có số) sẽ rơi vào cùng một tổ hợp. */
  let h = 0;
  for (let i = 0; i < quan.length; i++) h = (h * 31 + quan.charCodeAt(i)) >>> 0;
  const chon = [], dung = new Set();
  for (let k = 0; chon.length < 3 && k < bo.length * 2; k++) {
    const idx = (h + k * 2 + Math.floor(k / 3)) % bo.length;
    if (dung.has(idx)) continue;
    dung.add(idx);
    chon.push(bo[idx]);
  }
  // câu giá luôn có mặt vì đó là thứ khách hỏi nhiều nhất
  if (!chon.includes(bo[0])) chon[2] = bo[0];

  /* Thêm một câu gắn với đúng địa bàn quận đó. Câu này có mặt ở mọi trang quận nhưng
     nội dung khác nhau hoàn toàn vì tên đường và địa điểm mỗi quận một khác, nên không
     tạo ra các đoạn trùng lặp giữa các trang. */
  const d = DIA_BAN[quan];
  if (d) {
    const duong = d.duong.slice(0, 4).join(', ');
    const noi = d.diaDiem.slice(0, 3).join(', ');
    chon.push([
      'Khu vực nào trong ' + ten + ' được nhận nạp mực tận nơi?',
      'Toàn bộ ' + ten + ', gồm các tuyến ' + duong + ' và vùng quanh ' + noi +
      '. Nhà trong hẻm hay văn phòng trên tầng cao đều nhận, không tính thêm phí đi lại.',
    ]);
  }
  return chon;
}

function hoiDapQuan(quan) {
  const chon = cauHoiQuan(quan);
  return `
      <section class="hoi-dap">
        <h2>Câu hỏi thường gặp khi nạp mực máy in ${esc(TEN_QUAN[quan])}</h2>
        ${chon.map(c => `<h3>${esc(c[0])}</h3>\n        <p>${esc(c[1])}</p>`).join('\n        ')}
      </section>`;
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
  const allPages = loadPages();
  indexPages(allPages);
  const pages = allPages.filter(p => !MERGE_INTO[p.path]); // trang gộp -> chỉ còn là chuyển hướng
  const menu = buildMenu(pages);
  let n = 0;

  for (const page of pages) {
    const depth = page.path.split('/').length - 1;   // file .html nằm ngay trong thư mục cha
    const prefix = '../'.repeat(depth);
    let body;
    if (NEW_BY_PATH.has(page.path)) {
      body = renderNewPage(NEW_BY_PATH.get(page.path), prefix, cfg, new Map(pages.map(x => [x.path, x.title])));
    } else if (page.path === PRICE_PATH) {
      body = renderPricePage(page, allPages, prefix);
    } else {
      body = '<h1>' + esc(page.title) + '</h1>\n      ' + renderBlocks(page.blocks, prefix, prefix, page.path);
      if (PRICE_EMBED.has(page.path)) { body += priceTableCompact(prefix); page.coBangGia = true; }
      /* Mảng in nhiệt/hoá đơn: giữ nguyên nội dung (đang có thứ hạng thật), chỉ dẫn nhẹ sang mucinht */
      if (CROSS_LINK[page.path]) body += crossLinkBlock(CROSS_LINK[page.path]);
      /* Trang trùng chủ đề: trỏ về bài hướng dẫn đang xếp hạng tốt hơn */
      if (BOOST_LINK[page.path]) body += boostLinkBlock(BOOST_LINK[page.path], prefix);
      /* Trang dịch vụ theo quận: thêm hỏi–đáp riêng và khu vực giáp ranh (chỉ thêm, không sửa bài gốc) */
      const quan = quanCuaTrang(page.path);
      if (quan) {
        // đưa hỏi–đáp vào blocks để bộ sinh dữ liệu có cấu trúc nhận ra FAQPage
        for (const c of cauHoiQuan(quan)) {
          page.blocks.push({ t: 'h3', text: c[0] });
          page.blocks.push({ t: 'p', text: c[1] });
        }
        body += diaBanQuan(quan);
        /* Bảng giá ngay trên trang quận: "giá bao nhiêu" là câu hỏi kèm theo nhiều nhất
           trong các tìm kiếm theo quận, trước đây khách phải nhảy sang trang khác mới thấy. */
        body += priceTableCompact(prefix);
        page.coBangGia = true;   // để phần dữ liệu có cấu trúc chỉ khai giá ở trang thật sự có bảng giá
        body += hoiDapQuan(quan, prefix);
        body += khuVucLanCan(quan, prefix, PAGE_SET);
      }
    }

    const pageTitle = TITLE_OVERRIDE[page.path] ? TITLE_OVERRIDE[page.path].title : page.title;
    const pageDesc = TITLE_OVERRIDE[page.path] ? TITLE_OVERRIDE[page.path].desc : metaDescOf(page);

    const html = `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<title>${esc(pageTitle)}</title>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="description" content="${esc(pageDesc)}">
<link rel="canonical" href="${SITE_URL}/${encPath(page.path)}">${NOINDEX ? '\n<meta name="robots" content="noindex"><!-- demo github.io — bỏ dòng này khi gắn domain thật (NOINDEX=0) -->' : ''}
<link rel="stylesheet" href="${prefix}assets/css/style.css">
<script type="application/ld+json">${buildSchema({
  SITE_URL, page, crumbs: crumbList(page, pages), title: pageTitle,
  description: pageDesc,
  imageUrl: (page.blocks || []).filter(b => b.t === 'img' && b.local)[0]
    ? SITE_URL + '/' + (page.blocks.filter(b => b.t === 'img' && b.local)[0].local) : '',
})}</script>
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
    const outFile = path.join(ROOT, page.path.split('/').join(path.sep) + '.html');
    fs.mkdirSync(path.dirname(outFile), { recursive: true });
    fs.writeFileSync(outFile, html, 'utf8');
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
    // Hồ sơ doanh nghiệp (địa chỉ, toạ độ, giờ mở cửa, khu vực phục vụ, bảng giá) — đặt ở trang chủ
    const homeSchema = buildSchema({
      SITE_URL, page: { path: '', blocks: [], title: 'Trang chủ' }, crumbs: [],
      title: (home.match(/<title>([^<]*)/) || [, ''])[1],
      description: (home.match(/name="description" content="([^"]*)"/) || [, ''])[1],
      imageUrl: SITE_URL + '/assets/img/logo-ht.jpg',
    });
    home = home.replace('</head>', '<script type="application/ld+json">' + homeSchema + '</script>\n</head>');
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
  /* Stub chuyển hướng: URL cũ/sai -> trang thật.
     Gồm /home (gộp trang chủ) + mọi URL gãy mà bộ khớp đã tìm được trang đúng,
     để ai lỡ truy cập URL cũ (hoặc Google còn giữ) vẫn về đúng nội dung, không gặp 404. */
  function writeStub(fromPath, toPath) {
    if (!fromPath || PAGE_SET.has(fromPath)) return false;       // không đè trang thật
    const dir = path.join(ROOT, fromPath.split('/').join(path.sep));
    const cur = path.join(dir, 'index.html');
    // luôn ghi lại: stub từ lần build trước có thể trỏ sai sau khi bộ khớp được sửa
    if (fs.existsSync(cur) && !/http-equiv="refresh"/.test(fs.readFileSync(cur, 'utf8'))) return false;
    const depth = fromPath.split('/').length;
    const target = '../'.repeat(depth) + (toPath ? encPath(toPath) + '.html' : '');
    const canon = SITE_URL + '/' + (toPath ? encPath(toPath) : '');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'index.html'),
      '<!DOCTYPE html>\n<html lang="vi">\n<head>\n<meta charset="UTF-8">\n<title>Đang chuyển hướng…</title>\n' +
      '<link rel="canonical" href="' + canon + '">\n<meta name="robots" content="noindex">\n' +
      '<meta http-equiv="refresh" content="0; url=' + target + '">\n' +
      '<script>location.replace("' + target + '");</script>\n</head>\n' +
      '<body><p>Trang này đã chuyển sang <a href="' + target + '">' + canon + '</a></p></body>\n</html>\n', 'utf8');
    return true;
  }
  let nStub = writeStub('home', '') ? 1 : 0;
  for (const [from, to] of Object.entries(MERGE_INTO)) {
    fs.rmSync(path.join(ROOT, from.split('/').join(path.sep)), { recursive: true, force: true });
    if (writeStub(from, to)) nStub++;
  }
  for (const [from, to] of FIX_LOG.entries()) if (writeStub(from, to)) nStub++;
  console.log('  ✓ ' + nStub + ' trang chuyển hướng (URL cũ/sai -> trang đúng)');

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

  // robots.txt — mở cho mọi bot + chỉ đường tới sitemap
  fs.writeFileSync(path.join(ROOT, 'robots.txt'),
    'User-agent: *\nAllow: /\n\nSitemap: ' + SITE_URL + '/sitemap.xml\n', 'utf8');

  console.log('Đã dựng ' + n + ' trang (nguyên văn DOM) + sitemap ' + urls.length + ' URL + robots.txt.');
  console.log('Menu 2 cấp: ' + menu.map(m => m.label + '(' + m.children.length + ')').join(', '));
  console.log(NOINDEX ? 'noindex: BẬT (demo). Gắn domain thật: NOINDEX=0 node build-site.js' : 'noindex: TẮT — bản production.');
}

build();
