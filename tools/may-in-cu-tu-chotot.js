// Dọn nốt trùng lặp, chuẩn hoá tên máy, tạo ảnh WebP, ghi data/may-in-cu.json
const fs = require('fs'), path = require('path'), sharp = require('D:/AUTOMATION/projects/tinhochtgithub/node_modules/sharp');
const KHO = 'D:/AUTOMATION/projects/chotot/chotot-images';
const REPO = 'D:/AUTOMATION/projects/tinhochtgithub';
const RA_ANH = path.join(REPO, 'assets', 'img', 'may-cu');

// gộp tay các cặp regex không bắt được + tên hiển thị chuẩn
const GOP = {
  'brotherc2701dw': 'brother 2701dw', 'brother 25250d': 'brother 2520d',
  'hp 2035': 'hp p2035', 'hp107w': 'hp 107w', 'hp m211d': 'hp 211d',
  'hp 400dne': 'hp 400', 'hp m402dne': 'hp m402',
};
const BO = new Set(['canon', 'hp', 'brother']);   // dòng chỉ có tên hãng, không rõ model — bỏ

const TEN = {
  'brother 2701dw': 'Brother MFC-L2701DW', 'brother 2701d': 'Brother MFC-L2701D',
  'brother 2520d': 'Brother DCP-L2520D', 'brother 2366dw': 'Brother HL-L2366DW',
  'brother 2361dn': 'Brother HL-L2361DN', 'brother 2321d': 'Brother HL-L2321D',
  'brother 7535dw': 'Brother DCP-B7535DW', 'brother b2100d': 'Brother HL-B2100D',
  'canon 8610': 'Canon LBP 8610', 'canon 3500': 'Canon LBP 3500', 'canon 223dw': 'Canon LBP 223dw',
  'canon 6230dw': 'Canon LBP 6230dw', 'canon 6230dn': 'Canon LBP 6230dn', 'canon 6220dn': 'Canon LBP 6220dn',
  'canon 212dw': 'Canon LBP 212dw', 'canon 6700': 'Canon LBP 6700', 'canon 6200d': 'Canon LBP 6200d',
  'canon 6030w': 'Canon LBP 6030W', 'canon 6030': 'Canon LBP 6030', 'canon 2900': 'Canon LBP 2900',
  'canon 3010': 'Canon MF 3010', 'canon 3300': 'Canon LBP 3300',
  'hp 137fnw': 'HP Laser MFP 137fnw', 'hp 135w': 'HP Laser MFP 135w', 'hp 211d': 'HP Laser MFP 211d',
  'hp 107w': 'HP Laser 107w', 'hp 107a': 'HP Laser 107a', 'hp 108a': 'HP Laser 108a',
  'hp m12w': 'HP LaserJet Pro M12w', 'hp 400': 'HP LaserJet Pro 400', 'hp m402': 'HP LaserJet Pro M402dne',
  'hp p2035': 'HP LaserJet P2035', 'hp 1020': 'HP LaserJet 1020', 'hp m177f': 'HP Color LaserJet Pro M177fw',
  'epson l1210': 'Epson L1210',
};

const may = JSON.parse(fs.readFileSync('may-in-gop.json', 'utf8'));
const gom = new Map();
for (const m of may) {
  let k = GOP[m.khoa] || m.khoa;
  if (BO.has(k)) continue;
  if (!gom.has(k)) gom.set(k, []);
  gom.get(k).push(m);
}

(async () => {
  fs.mkdirSync(RA_ANH, { recursive: true });
  const ra = [];
  for (const [k, arr] of gom) {
    arr.sort((a, b) => b.soAnh - a.soAnh);
    let c = arr[0];
    // Bo may da ban: tab Pool danh dau 'sold'. Mot may co the duoc rao nhieu lan duoi
    // nhieu slug — chi bo khi TAT CA lan rao deu 'sold', con mot cai active/exhausted
    // thi van con hang.
    const moiTrangThai = arr.flatMap(x => x.status);
    if (moiTrangThai.length && moiTrangThai.every(t => /sold/i.test(t))) {
      console.log('  – bo (da ban het): ' + (TEN[k] || arr[0].ten)); continue;
    }
    const conHang = arr;
    const gia = Math.max(...arr.map(x => x.giaChoTot));
    c = conHang[0] || c;
    const ten = TEN[k] || c.ten;
    const slug = k.replace(/\s+/g, '-');
    const src = path.join(KHO, c.anhNguon);
    if (!fs.existsSync(src)) { console.log('  ✗ thiếu ảnh: ' + ten); continue; }
    const dich = path.join(RA_ANH, slug + '.webp');
    await sharp(src).resize(560, 380, { fit: 'contain', background: '#f5f8fc' }).webp({ quality: 80 }).toFile(dich);
    ra.push({
      slug, ten, giaChoTot: gia, giaBan: gia + 200000,
      anh: 'assets/img/may-cu/' + slug + '.webp',
      soAnhKho: arr.reduce((s, x) => s + x.soAnh, 0),
      nguonAnh: c.anhNguon,
    });
  }
  ra.sort((a, b) => b.giaBan - a.giaBan);
  fs.writeFileSync(path.join(REPO, 'data', 'may-in-cu.json'), JSON.stringify({
    _ghichu: 'Sinh từ tab Pool của Google Sheet bot Chợ Tốt + ảnh thật trong projects/chotot/chotot-images. giaBan = giá đang rao trên Chợ Tốt + 200.000đ. Chạy lại: scratchpad/tao-danh-sach.js',
    capNhat: '2026-08-24', soMay: ra.length, may: ra,
  }, null, 1), 'utf8');
  console.log('Đã tạo ' + ra.length + ' máy + ' + ra.length + ' ảnh WebP\n');
  console.log('tên máy                          giá Chợ Tốt   giá bán');
  ra.forEach(m => console.log(m.ten.padEnd(33) + (m.giaChoTot / 1000).toFixed(0).padStart(8) + 'k' +
    ((m.giaBan / 1000).toFixed(0) + 'k').padStart(10)));
})();
