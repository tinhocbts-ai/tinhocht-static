/* tools/dich-vu-quan.js — Trang dịch vụ SỬA MÁY TÍNH / SỬA MÁY IN theo quận, viết lại từ đầu.
 *
 * Vì sao có file này (đo GSC 10/06–13/09/2026): cụm trang "sửa máy tính quận X" nhận
 * 7.000+ lượt hiển thị mà chỉ có 6 lượt nhấp. Riêng "sửa máy tính quận tân phú" 850 hiển thị,
 * vị trí 11,7, 0 nhấp — trang hiện tại 629 từ, không có H2, và còn nguyên chữ "quận 3" chép
 * từ trang khác. Cùng lúc "sửa máy in quận tân phú" chưa có trang riêng, Google đành xếp trang
 * nạp mực Tân Phú ở vị trí 22.
 *
 * Cách làm: mỗi trang là một mục trong data/dich-vu-quan.json (tiêu đề, mở bài, các khối,
 * hỏi–đáp, liên kết). File này chỉ lo dựng HTML bằng đúng các class CSS đã có trên site
 * (price-table, check-list, steps, hoi-dap, lan-can, dia-ban) — không thêm CSS mới.
 *
 * Trang có mặt trong DOM cũ (sửa máy tính Tân Phú) → nội dung ở đây THAY HẲN bản cũ.
 * Trang chưa từng có (sửa máy in Tân Phú) → tạo mới, tự vào menu / sitemap / breadcrumb.
 * Liên kết chỉ in ra khi trang đích thật sự tồn tại — không bao giờ sinh link gãy. */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');

const DATA = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'dich-vu-quan.json'), 'utf8'));
const GIA_MT = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'bang-gia-sua-may-tinh.json'), 'utf8'));
const DIA_BAN = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'quan-dia-ban.json'), 'utf8'));
const LAN_CAN = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'quan-lan-can.json'), 'utf8'));
const TEN_QUAN = LAN_CAN._ten_hien_thi;

const PAGES = DATA.pages;
const BY_PATH = new Map(PAGES.map(p => [p.path, p]));

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const encPath = p => p.split('/').map(encodeURIComponent).join('/');
const boTag = s => String(s).replace(/<[^>]+>/g, '');

/* Đường dẫn trang cùng loại dịch vụ ở quận khác — để dựng khối "khu vực lân cận".
   Đường dẫn của trang cũ không theo một mẫu chung, nên tra trong chính pageSet. */
function trangCungLoai(loai, quan, pageSet) {
  const q = quan.replace(/^quan-/, '');
  const mau = loai === 'sua-may-tinh'
    ? [`sua-may-tinh-tan-noi/sua-may-tinh-quan-${q}`]
    : [`sua-may-in-tai-hcm/sua-may-in-quan-${q}`, `sua-may-in-tai-hcm/sua-may-in-tai-nha-quan-${q}`,
       `sua-may-in-tai-hcm/sửa-máy-in-quận-${TEN_QUAN[quan] ? TEN_QUAN[quan].replace(/^Quận /, '').toLowerCase().replace(/\s+/g, '-') : q}`];
  return mau.find(p => pageSet.has(p)) || null;
}

function bangGiaMayTinh() {
  const rows = GIA_MT.muc.map(m => `<tr><th scope="row">${esc(m.viec)}</th><td class="pt-gia"><strong>${esc(m.gia)}</strong></td></tr>`).join('\n          ');
  return `<div class="price-table-wrap"><table class="price-table price-table-compact">
        <thead><tr><th scope="col">Việc cần làm</th><th scope="col">Tiền công</th></tr></thead>
        <tbody>
          ${rows}
        </tbody>
      </table></div>
      <ul class="price-notes">${GIA_MT.ghiChu.map(x => '<li>' + esc(x) + '</li>').join('')}</ul>`;
}

function diaBan(p) {
  const d = DIA_BAN[p.quan];
  if (!d) return { html: '', blocks: [] };
  const duong = d.duong.map(esc);
  const dsDuong = duong.slice(0, -1).join(', ') + ' và ' + duong[duong.length - 1];
  const html = `<section class="dia-ban">
        <h2>${esc(p.diaBan.h2)}</h2>
        <p>${esc(p.diaBan.mo)} Kỹ thuật nhận việc trên các tuyến ${dsDuong}, quanh ${d.diaDiem.map(esc).join(', ')}.</p>
        <p>${esc(p.diaBan.ket)}</p>
      </section>`;
  return { html, blocks: [{ t: 'h2', text: p.diaBan.h2 }, { t: 'p', text: p.diaBan.mo }, { t: 'p', text: p.diaBan.ket }] };
}

function lanCan(p, prefix, pageSet) {
  const ds = (LAN_CAN[p.quan] || []).map(q => ({ q, path: trangCungLoai(p.loai, q, pageSet) })).filter(x => x.path);
  if (ds.length < 2) return '';
  const nhan = p.loai === 'sua-may-tinh' ? 'Sửa máy tính' : 'Sửa máy in';
  return `<section class="lan-can">
        <h2>${esc(nhan)} ở khu vực giáp ${esc(TEN_QUAN[p.quan])}</h2>
        <p>${esc(p.lanCan)}</p>
        <ul class="link-list">${ds.map(x => `<li><a href="${prefix}${encPath(x.path)}">${esc(nhan)} ${esc(TEN_QUAN[x.q])}</a></li>`).join('')}</ul>
      </section>`;
}

/* Khối "dịch vụ khác cùng quận" — một câu dẫn riêng từng trang, trỏ tới trang anh em
   trong cùng quận (nạp mực ↔ sửa máy in ↔ sửa máy tính). Đây là xương sống của chùm Tân Phú:
   ba trang cùng quận phải thấy nhau. */
function cungQuan(p, prefix, pageSet) {
  const ds = (p.cungQuan || []).filter(x => pageSet.has(x.path));
  if (!ds.length) return '';
  return `<aside class="inline-guide">
        <p>${esc(p.cungQuanDan)}
          ${ds.map(x => `<a href="${prefix}${encPath(x.path)}"><strong>${esc(x.anchor)}</strong></a>`).join(' · ')}
        </p>
      </aside>`;
}

function renderKhoi(b, prefix, pageSet, blocks) {
  if (b.t === 'h2') { blocks.push({ t: 'h2', text: b.text }); return `<h2${b.id ? ' id="' + b.id + '"' : ''}>${esc(b.text)}</h2>`; }
  if (b.t === 'p') { blocks.push({ t: 'p', text: boTag(b.text) }); return `<p>${b.text}</p>`; }   // cho phép <strong>
  if (b.t === 'ul') { b.items.forEach(x => blocks.push({ t: 'li', text: boTag(x) })); return `<ul class="check-list">${b.items.map(x => '<li>' + x + '</li>').join('')}</ul>`; }
  if (b.t === 'table') {
    b.rows.forEach(r => blocks.push({ t: 'p', text: r.join(' — ') }));
    const head = b.cols.map(c => `<th scope="col">${esc(c)}</th>`).join('');
    const rows = b.rows.map(r => `<tr><th scope="row">${esc(r[0])}</th>${r.slice(1).map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('\n          ');
    return `<div class="price-table-wrap"><table class="price-table qm-so-sanh">
        <thead><tr>${head}</tr></thead>
        <tbody>
          ${rows}
        </tbody>
      </table></div>`;
  }
  if (b.t === 'steps') {
    b.buoc.forEach((s, i) => blocks.push({ t: 'p', text: 'Bước ' + (i + 1) + ': ' + s[0] + '. ' + boTag(s[1]) }));
    return `<ol class="steps">${b.buoc.map((s, i) => `
        <li><h3>Bước ${i + 1}: ${esc(s[0])}</h3><p>${s[1]}</p></li>`).join('')}
      </ol>`;
  }
  if (b.t === 'plink') {
    if (!pageSet.has(b.path)) { blocks.push({ t: 'p', text: b.truoc + ' ' + b.anchor + ' ' + b.sau }); return `<p>${esc(b.truoc)} ${esc(b.anchor)} ${esc(b.sau)}</p>`; }
    blocks.push({ t: 'p', text: b.truoc + ' ' + b.anchor + ' ' + b.sau });
    return `<p>${esc(b.truoc)} <a href="${prefix}${encPath(b.path)}">${esc(b.anchor)}</a> ${esc(b.sau)}</p>`;
  }
  if (b.t === 'links') {
    const ds = b.items.filter(x => pageSet.has(x.path));
    if (!ds.length) return '';
    return `<p>${esc(b.dan)}</p>
      <ul class="link-list">${ds.map(x => `<li><a href="${prefix}${encPath(x.path)}">${esc(x.anchor)}</a></li>`).join('')}</ul>`;
  }
  if (b.t === 'bang-gia-may-tinh') return bangGiaMayTinh();
  if (b.t === 'cung-quan') return cungQuan(b.page, prefix, pageSet);
  if (b.t === 'callout') { blocks.push({ t: 'p', text: boTag(b.text) }); return `<p class="callout-note">${b.text}</p>`; }
  return '';
}

/* API chính: trả về { html, blocks } — blocks để bộ sinh dữ liệu có cấu trúc đọc FAQ/Service */
function renderDichVuQuan(p, prefix, cfg, pageSet) {
  const blocks = [{ t: 'h1', text: p.h1 }];
  const out = [`<h1>${esc(p.h1)}</h1>`];
  for (const m of p.moBai) { blocks.push({ t: 'p', text: boTag(m) }); out.push(`<p>${m}</p>`); }
  out.push(cungQuan(p, prefix, pageSet));
  for (const b of p.khoi) out.push(renderKhoi(b, prefix, pageSet, blocks));

  const db = diaBan(p);
  out.push(db.html); blocks.push(...db.blocks);

  out.push(`<section class="hoi-dap">
        <h2>${esc(p.faqTieuDe)}</h2>
        ${p.faq.map(f => `<h3>${esc(f[0])}</h3>\n        <p>${esc(f[1])}</p>`).join('\n        ')}
      </section>`);
  for (const f of p.faq) { blocks.push({ t: 'h3', text: f[0] }); blocks.push({ t: 'p', text: f[1] }); }

  out.push(lanCan(p, prefix, pageSet));
  return { html: out.filter(Boolean).join('\n      '), blocks };
}

module.exports = { DICH_VU_QUAN: PAGES, DVQ_BY_PATH: BY_PATH, renderDichVuQuan, trangDichVuQuan: trangCungLoai };
