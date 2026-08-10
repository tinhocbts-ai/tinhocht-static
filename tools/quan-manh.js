/* tools/quan-manh.js — khối nội dung tăng cường cho 3 quận mạnh nhất (Tân Bình, Quận 10, Tân Phú).
 *
 * Vì sao có file này: đo GSC 90 ngày cho thấy 3 quận này là nơi tinhocht thật sự thắng
 * (71% / 73% / 53% share click so với 2 web nhà còn lại). Nội dung lấy theo công thức
 * các trang top trong seo/COMPETITOR-INSIGHTS.md: bảng so sánh tận nơi vs mang tiệm,
 * quy trình có hình, dấu hiệu cần nạp, điệp khúc "báo giá trước khi làm".
 *
 * Chống trùng lặp: 3 trang này đã trùng nhau 36-63% từ bản gốc Google Sites, nên MỌI chữ
 * trong data/quan-manh.json viết riêng theo góc từng quận (cửa hàng / văn phòng / hộ kinh
 * doanh), không dùng chung câu nào. SVG cũng mỗi trang một loại khác nhau.
 *
 * Ảnh thật: khối "hinh" chỉ render khi file tồn tại trong assets/img/thuc-te/ — nhờ vậy
 * đẩy web trước, chủ shop chụp ảnh bổ sung sau (theo DANH-SACH-HINH-CAN-CHUP.md) rồi build
 * lại là ảnh tự lên, không phải sửa code. */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const HINH_DIR = path.join(ROOT, 'assets', 'img', 'thuc-te');

/* ---------- SVG quy trình 5 bước (Tân Bình — góc văn phòng) ---------- */
const BUOC = [
  ['Gọi / Zalo', 'đọc mã máy in', 'báo giá sơ bộ ngay'],
  ['Thợ xuất phát', 'khu Tân Bình', 'có mặt ~10 phút'],
  ['Kiểm tra máy', 'báo giá trước', 'đồng ý mới làm'],
  ['Thay mực tại bàn', 'máy chỉ nghỉ', '15–20 phút'],
  ['In test bàn giao', 'kèm phiếu dịch vụ', 'bảo hành hết mực'],
];
const MO_TA_QT = 'Quy trình thay mực máy in cho văn phòng gồm 5 bước: ' +
  'một, gọi điện hoặc Zalo đọc mã máy in để được báo giá sơ bộ ngay; ' +
  'hai, kỹ thuật phụ trách khu Tân Bình xuất phát, có mặt khoảng 10 phút; ' +
  'ba, kiểm tra máy và báo giá trước, khách đồng ý mới làm; ' +
  'bốn, thay mực ngay tại bàn, máy chỉ nghỉ 15 đến 20 phút; ' +
  'năm, in test bàn giao kèm phiếu dịch vụ, bảo hành đến khi hết mực.';

function svgQuyTrinhNgang() {
  const boxes = BUOC.map((b, i) => {
    const x = 10 + i * 178;
    return `
    <g>
      <rect x="${x}" y="46" width="158" height="104" rx="12" fill="#f5f8fc" stroke="#e3e9f0"/>
      <circle cx="${x + 24}" cy="70" r="14" fill="#1f8a70"/>
      <text x="${x + 24}" y="75" text-anchor="middle" font-size="14" font-weight="bold" fill="#fff">${i + 1}</text>
      <text x="${x + 46}" y="75" font-size="13.5" font-weight="bold" fill="#0f3d5c">${b[0]}</text>
      <text x="${x + 14}" y="104" font-size="12.5" fill="#1c2733">${b[1]}</text>
      <text x="${x + 14}" y="126" font-size="12.5" fill="#56626e">${b[2]}</text>
    </g>
    ${i < 4 ? `<path d="M ${x + 158} 98 l 20 0 m -7 -6 l 7 6 l -7 6" stroke="#ff7a30" stroke-width="2.4" fill="none"/>` : ''}`;
  }).join('');
  return `<svg class="qt-ngang" viewBox="0 0 910 196" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${MO_TA_QT}">
    <text x="10" y="26" font-size="15" font-weight="bold" fill="#0f3d5c">5 bước — từ lúc gọi đến lúc máy in lại bình thường</text>
    ${boxes}
  </svg>`;
}

function svgQuyTrinhDoc() {
  const boxes = BUOC.map((b, i) => {
    const y = 40 + i * 100;
    return `
    <g>
      <rect x="10" y="${y}" width="360" height="84" rx="12" fill="#f5f8fc" stroke="#e3e9f0"/>
      <circle cx="38" cy="${y + 28}" r="15" fill="#1f8a70"/>
      <text x="38" y="${y + 33}" text-anchor="middle" font-size="14.5" font-weight="bold" fill="#fff">${i + 1}</text>
      <text x="62" y="${y + 33}" font-size="14.5" font-weight="bold" fill="#0f3d5c">${b[0]}</text>
      <text x="62" y="${y + 58}" font-size="13.2" fill="#1c2733">${b[1]} · ${b[2]}</text>
    </g>
    ${i < 4 ? `<path d="M 190 ${y + 84} l 0 16 m -6 -7 l 6 7 l 6 -7" stroke="#ff7a30" stroke-width="2.4" fill="none"/>` : ''}`;
  }).join('');
  return `<svg class="qt-doc" viewBox="0 0 380 546" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${MO_TA_QT}">
    <text x="10" y="24" font-size="14.5" font-weight="bold" fill="#0f3d5c">5 bước — từ lúc gọi đến máy chạy lại</text>
    ${boxes}
  </svg>`;
}

/* ---------- SVG 4 dấu hiệu sắp hết mực (Tân Phú — góc hộ kinh doanh) ---------- */
const DAU_HIEU = [
  ['Bản in mờ nhạt dần', 'chữ xám dần đều cả trang'],
  ['Sọc trắng dọc trang', 'một vệt trống chạy suốt'],
  ['Màu in lệch, loang', 'ảnh và tem sai màu'],
  ['Đèn mực nhấp nháy', 'máy tự báo trên thân'],
];
const MO_TA_DH = 'Bốn dấu hiệu máy in sắp hết mực: một, bản in mờ nhạt dần, chữ xám dần đều cả trang; ' +
  'hai, xuất hiện sọc trắng dọc trang, một vệt trống chạy suốt từ trên xuống; ' +
  'ba, màu in lệch và loang, ảnh và tem in sai màu; ' +
  'bốn, đèn báo mực trên thân máy nhấp nháy.';

/* biểu tượng từng ô — vẽ tay bằng hình cơ bản, mỗi ô một hình khác nhau */
function iconDauHieu(i, cx, cy) {
  if (i === 0) return `
    <rect x="${cx - 22}" y="${cy - 28}" width="44" height="56" rx="4" fill="#fff" stroke="#0f3d5c" stroke-width="1.6"/>
    <line x1="${cx - 14}" y1="${cy - 16}" x2="${cx + 14}" y2="${cy - 16}" stroke="#1c2733" stroke-width="3"/>
    <line x1="${cx - 14}" y1="${cy - 5}" x2="${cx + 14}" y2="${cy - 5}" stroke="#56626e" stroke-width="3"/>
    <line x1="${cx - 14}" y1="${cy + 6}" x2="${cx + 14}" y2="${cy + 6}" stroke="#9aa7b2" stroke-width="3"/>
    <line x1="${cx - 14}" y1="${cy + 17}" x2="${cx + 14}" y2="${cy + 17}" stroke="#d5dde4" stroke-width="3"/>`;
  if (i === 1) return `
    <rect x="${cx - 22}" y="${cy - 28}" width="44" height="56" rx="4" fill="#fff" stroke="#0f3d5c" stroke-width="1.6"/>
    <rect x="${cx - 16}" y="${cy - 22}" width="12" height="44" fill="#56626e"/>
    <rect x="${cx + 6}" y="${cy - 22}" width="10" height="44" fill="#56626e"/>
    <rect x="${cx - 3}" y="${cy - 24}" width="7" height="50" fill="#fff"/>`;
  if (i === 2) return `
    <path d="M ${cx} ${cy - 26} C ${cx + 17} ${cy - 3} ${cx + 19} ${cy + 8} ${cx} ${cy + 24}
             C ${cx - 19} ${cy + 8} ${cx - 17} ${cy - 3} ${cx} ${cy - 26} Z"
          fill="none" stroke="#0f3d5c" stroke-width="1.6"/>
    <path d="M ${cx} ${cy - 18} C ${cx + 11} ${cy - 1} ${cx + 13} ${cy + 6} ${cx} ${cy + 17} L ${cx} ${cy - 18} Z" fill="#1f8a70"/>
    <path d="M ${cx} ${cy - 18} C ${cx - 11} ${cy - 1} ${cx - 13} ${cy + 6} ${cx} ${cy + 17} L ${cx} ${cy - 18} Z" fill="#ff7a30"/>`;
  return `
    <circle cx="${cx}" cy="${cy}" r="13" fill="#ff7a30"/>
    <circle cx="${cx}" cy="${cy}" r="6" fill="#fff"/>
    ${[0, 45, 90, 135, 180, 225, 270, 315].map(g => {
      const r = g * Math.PI / 180;
      return `<line x1="${(cx + Math.cos(r) * 19).toFixed(1)}" y1="${(cy + Math.sin(r) * 19).toFixed(1)}"
                    x2="${(cx + Math.cos(r) * 26).toFixed(1)}" y2="${(cy + Math.sin(r) * 26).toFixed(1)}"
                    stroke="#ff7a30" stroke-width="2.4"/>`;
    }).join('')}`;
}

function svgDauHieuNgang() {
  const o = DAU_HIEU.map((d, i) => {
    const x = 10 + i * 224;
    return `
    <g>
      <rect x="${x}" y="42" width="206" height="150" rx="12" fill="#f5f8fc" stroke="#e3e9f0"/>
      ${iconDauHieu(i, x + 103, 92)}
      <text x="${x + 103}" y="150" text-anchor="middle" font-size="13.5" font-weight="bold" fill="#0f3d5c">${d[0]}</text>
      <text x="${x + 103}" y="172" text-anchor="middle" font-size="12" fill="#56626e">${d[1]}</text>
    </g>`;
  }).join('');
  return `<svg class="qt-ngang" viewBox="0 0 910 208" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${MO_TA_DH}">
    <text x="10" y="26" font-size="15" font-weight="bold" fill="#0f3d5c">4 dấu hiệu máy in sắp hết mực — thấy là gọi trước, đừng đợi máy dừng</text>
    ${o}
  </svg>`;
}

function svgDauHieuDoc() {
  const o = DAU_HIEU.map((d, i) => {
    const x = 10 + (i % 2) * 185, y = 40 + Math.floor(i / 2) * 178;
    return `
    <g>
      <rect x="${x}" y="${y}" width="175" height="162" rx="12" fill="#f5f8fc" stroke="#e3e9f0"/>
      ${iconDauHieu(i, x + 87, y + 56)}
      <text x="${x + 87}" y="${y + 118}" text-anchor="middle" font-size="13.4" font-weight="bold" fill="#0f3d5c">${d[0]}</text>
      <text x="${x + 87}" y="${y + 140}" text-anchor="middle" font-size="12.2" fill="#56626e">${d[1]}</text>
    </g>`;
  }).join('');
  return `<svg class="qt-doc" viewBox="0 0 380 404" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${MO_TA_DH}">
    <text x="10" y="24" font-size="14" font-weight="bold" fill="#0f3d5c">4 dấu hiệu máy in sắp hết mực</text>
    ${o}
  </svg>`;
}

/* ---------- render ---------- */
function renderQuanManh(qm, prefix, esc, encPath) {
  const out = [];
  for (const b of qm.khoi) {
    if (b.t === 'h2') out.push(`<h2>${esc(b.text)}</h2>`);
    else if (b.t === 'p') out.push(`<p>${esc(b.text)}</p>`);
    else if (b.t === 'svg') {
      const [ng, doc] = b.loai === 'quytrinh'
        ? [svgQuyTrinhNgang(), svgQuyTrinhDoc()]
        : [svgDauHieuNgang(), svgDauHieuDoc()];
      out.push(`<figure class="quy-trinh">${ng}${doc}</figure>`);
    } else if (b.t === 'table') {
      const head = b.cols.map(c => `<th scope="col">${esc(c)}</th>`).join('');
      const rows = b.rows.map(r =>
        `<tr><th scope="row">${esc(r[0])}</th>${r.slice(1).map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('\n          ');
      out.push(`<div class="price-table-wrap"><table class="price-table qm-so-sanh">
        <thead><tr>${head}</tr></thead>
        <tbody>
          ${rows}
        </tbody>
      </table></div>`);
    } else if (b.t === 'plink') {
      out.push(`<p>${esc(b.truoc)} <a href="${prefix}${encPath(b.path)}">${esc(b.anchor)}</a> ${esc(b.sau)}</p>`);
    } else if (b.t === 'hinh') {
      if (!fs.existsSync(path.join(HINH_DIR, b.file))) continue; // ảnh chưa chụp -> bỏ qua, không để ảnh vỡ
      out.push(`<figure class="hinh-thuc-te">
        <img src="${prefix}assets/img/thuc-te/${b.file}" alt="${esc(b.alt)}" loading="lazy">
        <figcaption>${esc(b.chuThich)}</figcaption>
      </figure>`);
    }
  }
  return `\n      <section class="qm-tang-cuong">\n      ${out.join('\n      ')}\n      </section>`;
}

/* đưa phần chữ vào page.blocks để bộ sinh dữ liệu có cấu trúc đọc được như nội dung thật */
function quanManhBlocks(qm) {
  const bs = [];
  for (const b of qm.khoi) {
    if (b.t === 'h2') bs.push({ t: 'h2', text: b.text });
    else if (b.t === 'p') bs.push({ t: 'p', text: b.text });
    else if (b.t === 'plink') bs.push({ t: 'p', text: b.truoc + ' ' + b.anchor + ' ' + b.sau });
  }
  return bs;
}

module.exports = { renderQuanManh, quanManhBlocks };
