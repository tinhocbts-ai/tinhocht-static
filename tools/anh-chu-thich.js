/* tools/anh-chu-thich.js — Chèn chú thích lên ẢNH MÁY IN THẬT.
 *
 * Vì sao: ảnh tự vẽ/AI sinh nhìn là biết giả, mà bài hướng dẫn reset thì khách cần thấy
 * ĐÚNG cái nút trên máy của mình. Ảnh gốc lấy từ kho chụp thật của shop bên dự án Chợ Tốt
 * (projects/chotot/chotot-images/<model>/original/) — máy thật, shop tự chụp, không vướng bản quyền.
 *
 * Việc của file này: cắt/thu ảnh về khổ bài viết rồi vẽ khung chú thích + đường chỉ tới đúng
 * bộ phận (nút Go, đèn Toner/Drum, màn hình LCD…). KHÔNG chỉnh sửa gì khác trên ảnh.
 *
 * Chạy:  node tools/anh-chu-thich.js
 * Khai báo ảnh nào, chú thích gì: sửa mảng ANH bên dưới rồi chạy lại.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const KHO = 'D:/AUTOMATION/projects/chotot/chotot-images';
const RA = path.join(__dirname, '..', 'assets', 'img', 'p');
const RONG = 1000; // khổ ngang chuẩn của ảnh trong bài

/* Mỗi mục: ảnh nguồn + danh sách nhãn.
   x,y = điểm CẦN CHỈ TỚI, tính theo % chiều rộng/cao của ảnh gốc (dễ chỉnh bằng mắt).
   nhan = chữ hiện trong khung. ben = khung nằm bên 'trai' hay 'phai' của điểm chỉ.
   khungY = vị trí dọc của KHUNG CHỮ (%), tách khỏi điểm chỉ để nhiều nhãn không đè nhau.
   xa = độ dài đường chỉ tính theo % bề ngang (mặc định 18) — đẩy khung ra khỏi vùng cần nhìn. */
const ANH = [
  {
    ten: 'brother-2321d-nut-go',
    nguon: 'brother-2321d/original/frame_1787200047103_zv0nmk.jpg',
    alt: 'Bảng điều khiển máy in Brother HL-L2321D: đèn Toner, Drum, Paper, Ready và nút Go',
    nhan: [
      { x: 13.5, y: 8.5, nhan: 'Đèn Toner', ben: 'phai', khungY: 7, xa: 22 },
      { x: 13.5, y: 11.5, nhan: 'Đèn Drum', ben: 'phai', khungY: 17, xa: 22 },
      { x: 11.5, y: 20.5, nhan: 'Nút Go — dùng cho cả reset mực lẫn reset drum', ben: 'phai', khungY: 30, xa: 24 },
    ],
  },
  {
    ten: 'brother-2366dw-man-hinh',
    nguon: 'brother-2366dw/original/frame_1786690650126_lltgvz.jpg',
    alt: 'Bảng điều khiển Brother HL-L2366DW có màn hình LCD, nút Back, OK, phím mũi tên và nút Go',
    nhan: [
      { x: 16, y: 28.5, nhan: 'Màn hình LCD — dòng 2321D không có', ben: 'phai', khungY: 14, xa: 24 },
      { x: 19, y: 33, nhan: 'Nút OK', ben: 'phai', khungY: 26, xa: 30 },
      { x: 15.5, y: 37, nhan: 'Phím mũi tên lên / xuống', ben: 'phai', khungY: 38, xa: 30 },
      { x: 14, y: 43.5, nhan: 'Nút Go', ben: 'phai', khungY: 50, xa: 28 },
    ],
  },
  {
    ten: 'brother-mfc-l2701dw-bang-dieu-khien',
    nguon: 'brother-2701dw/original/frame_1787198985306_7c3ahe.jpg',
    alt: 'Bảng điều khiển máy in Brother MFC-L2701DW với màn hình LCD, nút OK, phím mũi tên và nút Clear',
    nhan: [
      { x: 49, y: 66.7, nhan: 'Màn hình LCD', ben: 'trai', xa: 12, khungY: 28 },
      { x: 66.8, y: 68.7, nhan: 'Nút OK', ben: 'phai', xa: 9, khungY: 24 },
      { x: 66.8, y: 61, nhan: 'Mũi tên lên / xuống', ben: 'trai', xa: 8, khungY: 14 },
      { x: 63, y: 77, nhan: 'Nút Clear', ben: 'trai', xa: 15, khungY: 44 },
    ],
  },
  {
    ten: 'epson-l1210-may-that',
    nguon: 'epson-l1210/dot1/frame_1782455001869_1si5be_d1.jpg',
    // ảnh quay dọc — cắt lấy phần thân máy cho vừa khổ ngang của bài
    cat: { left: 0, top: 380, width: 660, height: 372 },
    alt: 'Máy in phun Epson L1210 EcoTank đang in một bản ảnh màu khổ A4',
    nhan: [
      { x: 82, y: 55, nhan: 'Cụm nút bấm — L1210 không có màn hình', ben: 'trai', xa: 22, khungY: 22 },
    ],
  },
];

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function veLopChuThich(w, h, nhan) {
  const cao = Math.round(w * 0.028);          // cỡ chữ theo bề ngang ảnh
  const dem = Math.round(cao * 0.55);
  const net = Math.max(2, cao * 0.11);
  let ra = '';
  for (const n of nhan) {
    const px = (n.x / 100) * w, py = (n.y / 100) * h;
    const doDaiChi = ((n.xa ?? 18) / 100) * w;
    const rongKhung = Math.round(n.nhan.length * cao * 0.56) + dem * 2;
    const caoKhung = cao + dem * 2;
    const phai = n.ben !== 'trai';
    const le = w * 0.012;
    // kẹp khung vào trong khung ảnh: nhãn dài mà đặt sát mép thì bị cắt mất chữ
    const kx = Math.min(Math.max(phai ? px + doDaiChi : px - doDaiChi - rongKhung, le), w - rongKhung - le);
    const kyTam = Math.min(Math.max(((n.khungY ?? n.y) / 100) * h, caoKhung / 2 + le), h - caoKhung / 2 - le);
    const ky = kyTam - caoKhung / 2;
    const noi = phai ? kx : kx + rongKhung;           // mép khung phía quay về điểm chỉ
    ra += `<line x1="${px}" y1="${py}" x2="${noi}" y2="${kyTam}" stroke="#ffcc00" stroke-width="${net}"/>
           <circle cx="${px}" cy="${py}" r="${cao * 0.3}" fill="none" stroke="#ffcc00" stroke-width="${net}"/>
           <rect x="${kx}" y="${ky}" width="${rongKhung}" height="${caoKhung}" rx="${cao * 0.3}"
             fill="#101820" fill-opacity="0.88" stroke="#ffcc00" stroke-width="${Math.max(1.5, cao * 0.08)}"/>
           <text x="${kx + dem}" y="${ky + caoKhung - dem - cao * 0.12}" font-family="Segoe UI, Arial, sans-serif"
             font-size="${cao}" font-weight="600" fill="#ffffff">${esc(n.nhan)}</text>`;
  }
  return Buffer.from(`<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">${ra}</svg>`);
}

(async () => {
  fs.mkdirSync(RA, { recursive: true });
  const bienNhan = [];
  for (const a of ANH) {
    const src = path.join(KHO, a.nguon);
    if (!fs.existsSync(src)) { console.log('  ✗ thiếu ảnh gốc: ' + a.nguon); continue; }
    // `cat` = cắt bớt trước khi thu nhỏ (ảnh quay dọc thì phải cắt lấy phần ngang cho vừa bài)
    let b = sharp(src);
    if (a.cat) b = b.extract({ left: a.cat.left, top: a.cat.top, width: a.cat.width, height: a.cat.height });
    const meta = await b.metadata();
    const goc = a.cat ? { width: a.cat.width, height: a.cat.height } : meta;
    const w = RONG, h = Math.round(goc.height * (RONG / goc.width));
    const nen = await b.resize(w, h).toBuffer();
    const dich = path.join(RA, a.ten + '.webp');
    await sharp(nen)
      .composite([{ input: veLopChuThich(w, h, a.nhan), top: 0, left: 0 }])
      .webp({ quality: 82 })
      .toFile(dich);
    const kb = Math.round(fs.statSync(dich).size / 1024);
    console.log('  ✓ ' + a.ten + '.webp  ' + w + 'x' + h + '  ' + kb + ' KB  (' + a.nhan.length + ' chú thích)');
    bienNhan.push({ ten: a.ten, alt: a.alt, nguon: a.nguon });
  }
  fs.writeFileSync(path.join(__dirname, '..', 'data', 'anh-chu-thich.json'),
    JSON.stringify(bienNhan, null, 1), 'utf8');
  console.log('\nĐã ghi data/anh-chu-thich.json (' + bienNhan.length + ' ảnh) — build-site dùng alt từ đây.');
})();
