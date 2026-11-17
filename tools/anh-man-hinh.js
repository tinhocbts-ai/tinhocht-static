/* tools/anh-man-hinh.js — Ghép và chú thích ẢNH CHỤP MÀN HÌNH THẬT cho bài hướng dẫn trên máy tính.
 *
 * Ảnh gốc chụp từng cửa sổ Windows bằng D:\AUTOMATION\shared\tools\chup-cua-so.ps1 (PrintWindow).
 * Menu xổ xuống là cửa sổ riêng nên chụp riêng rồi dán lại đúng toạ độ lúc chụp.
 * File này chỉ: cắt viền đen, dán menu, phóng về khổ 1000×563, vẽ khung đỏ + nhãn. Không sửa chữ trong ảnh.
 *
 * Bài "hủy lệnh in" (17/11/2026): máy in trong ảnh là máy in ảo đặt tên "Canon LBP2900" trên máy của shop
 * (không có máy 2900 cắm vào), các cửa sổ và menu là của Windows 11 thật.
 *
 * Chạy:  node tools/anh-man-hinh.js
 */
'use strict';
const path = require('path');
const sharp = require('sharp');

const NGUON = 'D:/AUTOMATION/adsgoogle/data/sites/tinhocht/anh-huy-lenh-in';
const RA = path.join(__dirname, '..', 'assets', 'img', 'p');
const W = 1000, H = 563;

/* cat: vùng giữ lại của ảnh nền [x, y, rộng, cao] · dan: ảnh dán thêm tại toạ độ ảnh nền (trước khi cắt)
   khung: ô đỏ [x, y, rộng, cao] · nhan: chữ + toạ độ góc trái trên của hộp chữ — đều tính theo ảnh nền gốc. */
const ANH = [
  {
    ten: 'huy-lenh-in-hang-cho-canon-2900',
    nen: 'nen_chon.png', cat: [8, 0, 662, 322], tiLe: 1.4,
    khung: [[12, 115, 282, 20]],
    nhan: [{ x: 300, y: 150, chu: 'Lệnh đầu hàng báo Error - Printing: nó kẹt và chặn các lệnh phía sau' }],
  },
  {
    ten: 'huy-lenh-in-cancel-mot-lenh',
    nen: 'nen_chon.png', cat: [8, 0, 662, 322], tiLe: 1.4,
    dan: [{ file: 'menu_document.png', x: 57, y: 50 }],
    khung: [[60, 128, 145, 22]],
    nhan: [{ x: 225, y: 150, chu: 'Chọn lệnh cần bỏ → Document → Cancel (bấm chuột phải cũng ra menu này)' }],
  },
  {
    ten: 'huy-lenh-in-cancel-all-documents',
    nen: 'nen_printer.png', cat: [8, 0, 662, 322], tiLe: 1.4,
    dan: [{ file: 'menu_printer.png', x: 8, y: 50 }],
    khung: [[12, 182, 207, 22]],
    nhan: [{ x: 240, y: 205, chu: 'Printer → Cancel All Documents: xóa hết lệnh trong hàng chờ' }],
  },
  {
    ten: 'huy-lenh-in-services-print-spooler',
    nen: 'services.png', cat: [8, 0, 984, 512], tiLe: 0.98,
    khung: [[348, 343, 505, 20], [138, 149, 90, 16]],
    nhan: [{ x: 140, y: 400, chu: 'Print Spooler → Stop' }],
  },
  {
    ten: 'huy-lenh-in-cmd-net-stop-spooler',
    nen: 'cmd.png', cat: [0, 0, 900, 470], tiLe: 1.05,
    khung: [[4, 60, 330, 20], [4, 160, 668, 20], [4, 320, 340, 20]],
    nhan: [],
  },
];

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

(async () => {
  for (const a of ANH) {
    let nen = sharp(path.join(NGUON, a.nen));
    if (a.dan) nen = sharp(await nen.composite(a.dan.map((d) => ({ input: path.join(NGUON, d.file), left: d.x, top: d.y }))).png().toBuffer());
    const [cx, cy, cw, ch] = a.cat;
    const rw = Math.round(cw * a.tiLe), rh = Math.round(ch * a.tiLe);
    const than = await nen.extract({ left: cx, top: cy, width: cw, height: ch }).resize(rw, rh, { kernel: 'lanczos3' }).png().toBuffer();
    const ox = Math.round((W - rw) / 2), oy = Math.round((H - rh) / 2);
    const X = (x) => ox + (x - cx) * a.tiLe, Y = (y) => oy + (y - cy) * a.tiLe;
    const khung = (a.khung || []).map(([x, y, w, h]) =>
      `<rect x="${X(x)}" y="${Y(y)}" width="${w * a.tiLe}" height="${h * a.tiLe}" rx="5" fill="none" stroke="#e11d48" stroke-width="3.5"/>`).join('');
    const nhan = (a.nhan || []).map((n) => {
      const rong = Math.min(n.chu.length * 8.6 + 28, W - X(n.x) - 12);
      return `<rect x="${X(n.x)}" y="${Y(n.y)}" width="${rong}" height="36" rx="7" fill="#111827" opacity=".94"/>
        <text x="${X(n.x) + 14}" y="${Y(n.y) + 24}" font-family="Segoe UI, Arial, sans-serif" font-size="16.5" font-weight="600" fill="#fff">${esc(n.chu)}</text>`;
    }).join('');
    const svg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${khung}${nhan}</svg>`);
    const ra = path.join(RA, a.ten + '.webp');
    await sharp({ create: { width: W, height: H, channels: 3, background: '#e9edf3' } })
      .composite([{ input: than, left: ox, top: oy }, { input: svg, left: 0, top: 0 }])
      .webp({ quality: 90 }).toFile(ra);
    console.log('✓', a.ten + '.webp');
  }
})().catch((e) => { console.error('LỖI:', e.message); process.exit(1); });
