/* tools/ngay-dang.js — Sinh data/ngay-dang.json: ngày URL này XUẤT HIỆN LẦN ĐẦU trên site tĩnh,
 * lấy từ commit đầu tiên thêm file HTML tương ứng.
 *
 * Vì sao cần: toàn site đang có 0 lần xuất hiện datePublished/dateModified (audit 21/09/2026).
 * Google và các trợ lý AI đều ưu tiên nội dung có ngày; bài hướng dẫn kỹ thuật không ngày
 * trông như đã bỏ hoang.
 *
 * Trung thực về con số này: đây là ngày URL lên bản tĩnh (phần lớn là 28/07/2026 — ngày go-live),
 * KHÔNG phải ngày bài được viết lần đầu trên bản Google Sites cũ. Ngày viết gốc không còn dữ liệu
 * để truy. Vì vậy chỉ khai datePublished cho trang SINH RA cùng bản tĩnh trở về sau; còn
 * dateModified thì luôn chính xác vì lấy từ chính bộ so sánh nội dung của build-site.js.
 *
 * Chạy lại khi thêm trang mới: node tools/ngay-dang.js
 */
'use strict';
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

const out = execFileSync('git', ['log', '--diff-filter=A', '--name-only', '--format=%x01%aI', '--reverse'],
  { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });

const ngay = {};
let hienTai = null;
for (const dong of out.split('\n')) {
  if (dong.startsWith('\x01')) { hienTai = dong.slice(1).trim().slice(0, 10); continue; }
  const f = dong.trim();
  if (!f || !f.endsWith('.html') || !hienTai) continue;
  if (f.startsWith('src/') || f.startsWith('partials/') || f === '404.html') continue;
  let p = f.endsWith('/index.html') ? f.slice(0, -'/index.html'.length) : f.slice(0, -'.html'.length);
  if (p === 'index') p = '';
  if (!(p in ngay)) ngay[p] = hienTai;   // --reverse nên lần gặp đầu tiên là commit sớm nhất
}

const ketQua = {
  _help: 'Ngày URL xuất hiện lần đầu trên bản tĩnh (commit đầu tiên thêm file). Sinh bởi tools/ngay-dang.js.',
  _luu_y: 'KHÔNG phải ngày viết bài gốc trên Google Sites — dữ liệu đó không còn. Xem đầu file tools/ngay-dang.js.',
  _sinh_luc: new Date().toISOString().slice(0, 10),
  trang: Object.fromEntries(Object.entries(ngay).sort()),
};
const dich = path.join(ROOT, 'data', 'ngay-dang.json');
fs.writeFileSync(dich, JSON.stringify(ketQua, null, 2) + '\n', 'utf8');

const theoNgay = {};
for (const d of Object.values(ngay)) theoNgay[d] = (theoNgay[d] || 0) + 1;
console.log('Đã ghi', path.relative(ROOT, dich), '—', Object.keys(ngay).length, 'trang');
for (const [d, n] of Object.entries(theoNgay).sort()) console.log('  ', d, n, 'trang');
