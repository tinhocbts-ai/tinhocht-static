/* tools/gia-tri-trang.js — Kéo giá trị thật của từng trang từ Google Search Console.
 *
 * Vì sao cần: khối "Bài viết / dịch vụ liên quan" trước đây lấy 8 trang anh em ĐẦU BẢNG CHỮ CÁI.
 * Kết quả đo 20/08/2026: trang "bơm mực quận 4" (6 lượt hiển thị, 0 nhấp) nhận 44 link nội bộ,
 * trong khi trang "phần mềm reset Epson L310" (91 nhấp — trang kiếm khách thứ nhì của site)
 * chỉ nhận 6 link. Link nội bộ đang chảy ngược hoàn toàn.
 *
 * File này ghi ra data/gia-tri-trang.json để build-site.js xếp trang liên quan theo GIÁ TRỊ THẬT.
 * Chạy lại mỗi 1–2 tháng:  node tools/gia-tri-trang.js
 *
 * Không chạy được (mất mạng, hết hạn khoá) cũng không sao — build-site.js tự quay về
 * cách xếp cũ, chỉ là không tối ưu.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const SA_FILE = 'D:/AUTOMATION/projects/tinhocnamphong/_config/gsc_service_account.json';
const SITE = 'sc-domain:tinhocht.com';
const NGAY = 90;                                   // lấy 90 ngày gần nhất
const RA = path.join(__dirname, '..', 'data', 'gia-tri-trang.json');

const b64u = o => Buffer.from(typeof o === 'string' ? o : JSON.stringify(o)).toString('base64url');
const dec = s => { try { return decodeURIComponent(s); } catch { return s; } };

async function token(sa) {
  const now = Math.floor(Date.now() / 1000);
  const unsigned = b64u({ alg: 'RS256', typ: 'JWT' }) + '.' + b64u({
    iss: sa.client_email, scope: 'https://www.googleapis.com/auth/webmasters.readonly',
    aud: 'https://oauth2.googleapis.com/token', exp: now + 3600, iat: now,
  });
  const sig = crypto.createSign('RSA-SHA256').update(unsigned).sign(sa.private_key).toString('base64url');
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: unsigned + '.' + sig }),
  });
  const j = await r.json();
  if (!j.access_token) throw new Error('không lấy được token: ' + JSON.stringify(j).slice(0, 200));
  return j.access_token;
}

(async () => {
  if (!fs.existsSync(SA_FILE)) { console.error('Thiếu khoá service account: ' + SA_FILE); process.exit(1); }
  const tk = await token(JSON.parse(fs.readFileSync(SA_FILE, 'utf8')));
  const het = new Date(Date.now() - 3 * 86400000).toISOString().slice(0, 10);   // GSC trễ ~3 ngày
  const dau = new Date(Date.now() - (NGAY + 3) * 86400000).toISOString().slice(0, 10);

  const gom = new Map();
  let start = 0;
  for (;;) {
    const r = await fetch(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(SITE)}/searchAnalytics/query`, {
      method: 'POST', headers: { Authorization: 'Bearer ' + tk, 'Content-Type': 'application/json' },
      body: JSON.stringify({ startDate: dau, endDate: het, dimensions: ['page'], rowLimit: 25000, startRow: start, type: 'web' }),
    });
    const j = await r.json();
    if (j.error) throw new Error(j.error.code + ' ' + j.error.message);
    const rows = j.rows || [];
    for (const x of rows) {
      // gộp bản .html và bản không đuôi về cùng một đường dẫn
      const p = dec(x.keys[0])
        .replace(/^https?:\/\/(www\.)?tinhocht\.com\/?/, '')
        .replace(/\.html$/, '').replace(/\/$/, '');
      const cu = gom.get(p) || { nhap: 0, hienThi: 0 };
      gom.set(p, { nhap: cu.nhap + x.clicks, hienThi: cu.hienThi + x.impressions });
    }
    if (rows.length < 25000) break;
    start += rows.length;
  }

  /* Điểm giá trị: nhấp là thứ đáng kể nhất (khách thật vào trang), hiển thị chỉ là tiềm năng.
     Nhân 10 cho nhấp để một trang 5 nhấp luôn xếp trên trang 400 hiển thị mà 0 nhấp. */
  const bang = {};
  for (const [p, v] of gom) bang[p] = { nhap: v.nhap, hienThi: v.hienThi, diem: v.nhap * 10 + v.hienThi / 100 };

  fs.writeFileSync(RA, JSON.stringify({
    _ghichu: 'Sinh bởi tools/gia-tri-trang.js — build-site.js dùng để xếp khối "Bài viết / dịch vụ liên quan" theo giá trị thật thay vì theo bảng chữ cái. Chạy lại mỗi 1-2 tháng.',
    ky: dau + ' → ' + het,
    trang: bang,
  }, null, 1), 'utf8');

  const xep = Object.entries(bang).sort((a, b) => b[1].diem - a[1].diem);
  console.log('Kỳ ' + dau + ' → ' + het + ' · ' + xep.length + ' trang có dữ liệu');
  console.log('Đã ghi ' + path.relative(path.join(__dirname, '..'), RA) + '\n');
  console.log('10 trang giá trị nhất:');
  xep.slice(0, 10).forEach(([p, v]) =>
    console.log('  ' + String(v.nhap).padStart(4) + ' nhấp ' + String(v.hienThi).padStart(5) + ' hiển thị   /' + p.slice(0, 66)));
})().catch(e => { console.error('LỖI: ' + e.message); process.exit(1); });
