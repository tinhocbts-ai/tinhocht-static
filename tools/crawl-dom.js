/* tools/crawl-dom.js — Crawl NGUYÊN VĂN toàn bộ trang tinhocht.com từ HTML thật.
 *
 * Chạy:  node tools/crawl-dom.js
 *
 * Google Sites publish HTML có sẵn nội dung server-side (đã kiểm chứng) nên đọc
 * thẳng bằng https.get là lấy đúng 100% câu chữ — KHÔNG dùng WebFetch (hay tóm lược).
 *
 * Kết quả:
 *   export/pages-dom/<slug>.json   — blocks có cấu trúc (h1/h2/h3/p/li/img/link)
 *   assets/img/p/<hash>.<ext>      — ảnh gốc tải về, dedupe theo URL
 *   data/images.json               — map URL gốc -> file local
 *   export/crawl-dom-report.json   — thống kê
 */
'use strict';

const fs = require('fs');
const path = require('path');
const https = require('https');

const ROOT = path.join(__dirname, '..');
const EXPORT = 'D:\\AUTOMATION\\projects\\tinhocht\\export';
const OUT_DIR = path.join(EXPORT, 'pages-dom');
const IMG_DIR = path.join(ROOT, 'assets', 'img', 'p');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const HOTLINE = '0934 393 550';

function get(url, isBinary) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { 'User-Agent': UA }, timeout: 30000 }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume();
        return resolve(get(new URL(res.headers.location, url).href, isBinary));
      }
      if (res.statusCode !== 200) { res.resume(); return reject(new Error('HTTP ' + res.statusCode)); }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(isBinary
        ? { buf: Buffer.concat(chunks), type: res.headers['content-type'] || '' }
        : Buffer.concat(chunks).toString('utf8')));
    });
    req.on('timeout', () => { req.destroy(new Error('timeout')); });
    req.on('error', reject);
  });
}

const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', '#39': "'", '#34': '"' };
function decode(s) {
  return String(s)
    .replace(/&(amp|lt|gt|quot|apos|nbsp|#39|#34);/g, (m, k) => ENT[k])
    .replace(/&#(\d+);/g, (m, n) => String.fromCharCode(+n))
    .replace(/&#x([0-9a-f]+);/gi, (m, n) => String.fromCharCode(parseInt(n, 16)));
}
function stripTags(html) {
  return decode(String(html)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ''))
    .replace(/​|­/g, '')
    .replace(/[ \t ]+/g, ' ')
    .replace(/\n\s*\n+/g, '\n')
    .trim();
}
function fixPhones(s) {
  return String(s)
    .replace(/089[\s.\-]*886[\s.\-]*0052/g, HOTLINE)
    .replace(/098[\s.\-]*131[\s.\-]*9853/g, HOTLINE)
    .replace(/0981319853|0898860052/g, HOTLINE.replace(/\s/g, ''));
}

/* Trích link bên trong 1 đoạn: trả về [{text, href}] để dựng lại <a> khi build */
function extractLinks(html) {
  const out = [];
  const re = /<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  let m;
  while ((m = re.exec(html))) {
    const text = stripTags(m[2]);
    if (text) out.push({ text, href: decode(m[1]) });
  }
  return out;
}

/* Parse 1 trang HTML Google Sites -> danh sách block theo đúng thứ tự xuất hiện */
function parsePage(html) {
  const title = (html.match(/<title>([\s\S]*?)<\/title>/i) || [, ''])[1];
  const metaDesc = (html.match(/<meta[^>]+name="description"[^>]+content="([^"]*)"/i)
    || html.match(/<meta[^>]+property="og:description"[^>]+content="([^"]*)"/i) || [, ''])[1];

  // Chỉ lấy vùng <section>…</section> (nav/header/footer của Google Sites nằm ngoài)
  const first = html.indexOf('<section');
  const last = html.lastIndexOf('</section>');
  const body = first >= 0 && last > first ? html.slice(first, last + 10) : html;

  const blocks = [];
  const seenImg = new Set();
  const lower = body.toLowerCase();

  function pushImg(attrs) {
    const src = (attrs.match(/\bsrc="([^"]+)"/i) || [, ''])[1];
    if (!src || !/googleusercontent|tinhocht/.test(src)) return;
    if (seenImg.has(src)) return;
    seenImg.add(src);
    blocks.push({
      t: 'img',
      src: decode(src),
      alt: decode((attrs.match(/\balt="([^"]*)"/i) || [, ''])[1] || ''),
      w: +(attrs.match(/\bwidth="(\d+)"/i) || [, 0])[1] || 0,
      h: +(attrs.match(/\bheight="(\d+)"/i) || [, 0])[1] || 0,
    });
  }

  // Quét tuần tự thẻ mở/đóng; giữ cờ inList để phân biệt <li> với <p> thường.
  let inList = 0;
  const tokenRe = /<(\/?)(h1|h2|h3|h4|h5|p|ul|ol|img)\b([^>]*)>/gi;
  let m;
  while ((m = tokenRe.exec(body))) {
    const closing = m[1] === '/';
    const tag = m[2].toLowerCase();
    const attrs = m[3] || '';

    if (tag === 'ul' || tag === 'ol') { inList += closing ? -1 : 1; if (inList < 0) inList = 0; continue; }
    if (closing) continue;
    if (tag === 'img') { pushImg(attrs); continue; }

    const close = lower.indexOf('</' + tag + '>', tokenRe.lastIndex);
    if (close < 0) continue;
    const inner = body.slice(tokenRe.lastIndex, close);

    // ảnh nằm bên trong đoạn văn -> giữ đúng vị trí
    const imgRe = /<img\b([^>]*)>/gi;
    let im;
    while ((im = imgRe.exec(inner))) pushImg(im[1]);

    const text = fixPhones(stripTags(inner));
    if (text) {
      const links = extractLinks(inner).map(l => ({ text: fixPhones(l.text), href: l.href }));
      blocks.push({ t: tag === 'p' ? (inList ? 'li' : 'p') : tag, text, links });
    }
    tokenRe.lastIndex = close + tag.length + 3;
  }

  // gộp block trùng liên tiếp (Google Sites hay lặp do dàn trang)
  const dedup = [];
  for (const b of blocks) {
    const prev = dedup[dedup.length - 1];
    if (prev && prev.t === b.t && prev.text && prev.text === b.text) continue;
    dedup.push(b);
  }

  return { title: decode(title).trim(), metaDesc: decode(metaDesc).trim(), blocks: dedup };
}

function hashUrl(u) {
  let h = 5381;
  for (let i = 0; i < u.length; i++) h = ((h * 33) ^ u.charCodeAt(i)) >>> 0;
  return h.toString(36);
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.mkdirSync(IMG_DIR, { recursive: true });

  // Gom danh sách URL: slugs.json + các file crawl cũ (trang ẩn)
  const slugs = JSON.parse(fs.readFileSync(path.join(EXPORT, 'slugs.json'), 'utf8'));
  const entries = new Map();
  for (const s of slugs) entries.set(s.url.replace(/\/$/, ''), { url: s.url, slug: s.slug, hidden: false });
  for (const f of fs.readdirSync(path.join(EXPORT, 'pages-crawl'))) {
    const slug = f.replace(/\.json$/, '');
    if ([...entries.values()].some(e => e.slug === slug)) continue;
    try {
      const j = JSON.parse(fs.readFileSync(path.join(EXPORT, 'pages-crawl', f), 'utf8'));
      if (j.url && !entries.has(j.url.replace(/\/$/, ''))) entries.set(j.url.replace(/\/$/, ''), { url: j.url, slug, hidden: true });
    } catch (e) {}
  }
  // Trang chủ
  entries.set('https://www.tinhocht.com', { url: 'https://www.tinhocht.com/', slug: '__home__', hidden: false });

  // URL bổ sung truyền qua dòng lệnh:  node tools/crawl-dom.js /sua-may-in-tai-hcm
  const extra = process.argv.slice(2);
  for (const a of extra) {
    const url = a.startsWith('http') ? a : 'https://www.tinhocht.com' + (a.startsWith('/') ? a : '/' + a);
    const slug = decodeURIComponent(new URL(url).pathname).replace(/^\/|\/$/g, '')
      .replace(/[\/]/g, '-').replace(/[^a-zA-Z0-9\-]/g, '').toLowerCase() || 'extra';
    entries.set(url.replace(/\/$/, ''), { url, slug, hidden: false });
  }

  // chỉ crawl URL bổ sung nếu có tham số (chạy nhanh, không quét lại toàn bộ)
  const list = extra.length
    ? extra.map(a => {
        const url = a.startsWith('http') ? a : 'https://www.tinhocht.com' + (a.startsWith('/') ? a : '/' + a);
        return entries.get(url.replace(/\/$/, ''));
      })
    : [...entries.values()];
  const imgMapFile = path.join(ROOT, 'data', 'images.json');
  const imgMap = fs.existsSync(imgMapFile) ? JSON.parse(fs.readFileSync(imgMapFile, 'utf8')) : {};
  const report = { ok: 0, fail: 0, images: 0, imagesFail: 0, pages: [], errors: [] };

  for (let i = 0; i < list.length; i++) {
    const { url, slug, hidden } = list[i];
    try {
      const html = await get(url, false);
      const parsed = parsePage(html);

      // tải ảnh
      for (const b of parsed.blocks) {
        if (b.t !== 'img') continue;
        if (imgMap[b.src]) { b.local = imgMap[b.src]; continue; }
        try {
          const { buf, type } = await get(b.src, true);
          const ext = /png/.test(type) ? 'png' : /webp/.test(type) ? 'webp' : /gif/.test(type) ? 'gif' : 'jpg';
          const name = hashUrl(b.src) + '.' + ext;
          fs.writeFileSync(path.join(IMG_DIR, name), buf);
          imgMap[b.src] = 'assets/img/p/' + name;
          b.local = imgMap[b.src];
          report.images++;
        } catch (e) { report.imagesFail++; }
      }

      const pathname = decodeURIComponent(new URL(url).pathname).replace(/\/+$/, '').replace(/^\/+/, '');
      const out = { url, path: pathname, slug, hidden, title: parsed.title, metaDesc: parsed.metaDesc, blocks: parsed.blocks };
      fs.writeFileSync(path.join(OUT_DIR, slug + '.json'), JSON.stringify(out, null, 1), 'utf8');
      report.ok++;
      report.pages.push({ slug, path: pathname, blocks: parsed.blocks.length, imgs: parsed.blocks.filter(b => b.t === 'img').length });
    } catch (e) {
      report.fail++;
      report.errors.push({ url, err: e.message });
    }
    if ((i + 1) % 10 === 0) console.log('  ' + (i + 1) + '/' + list.length + ' — ok ' + report.ok + ', lỗi ' + report.fail + ', ảnh ' + report.images);
  }

  fs.writeFileSync(imgMapFile, JSON.stringify(imgMap, null, 1), 'utf8');
  fs.writeFileSync(path.join(EXPORT, 'crawl-dom-report.json'), JSON.stringify(report, null, 1), 'utf8');
  console.log('\nXONG: ' + report.ok + ' trang OK, ' + report.fail + ' lỗi, ' + report.images + ' ảnh tải mới (' + report.imagesFail + ' ảnh lỗi).');
  if (report.errors.length) console.log('Lỗi: ' + JSON.stringify(report.errors.slice(0, 5)));
}

main().catch(e => { console.error(e); process.exit(1); });
