/* tools/new-pages.js — Dựng nội dung cho các trang MỚI viết thêm (data/pages-new.json).
 *
 * Vì sao viết thêm: cụm "phần mềm reset máy in" là ngách site đang thắng (215/270 từ khoá
 * đã nằm top 10, tỷ lệ nhấp 8,8% — gấp 4 lần phần còn lại). Mỗi model máy in thêm vào là
 * một cơ hội top gần như chắc chắn vì đi trên nền uy tín sẵn có.
 *
 * Quy trình kỹ thuật viết theo đúng cách làm thực tế của từng hãng — KHÔNG bịa bước.
 * Chỗ nào máy mỗi đời một khác thì nói rõ để khách gọi hỏi, thay vì hướng dẫn sai.
 */
'use strict';

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* ---------- các bước reset theo từng hãng ---------- */
function cacBuoc(p) {
  if (p.canon) return [
    ['Đưa máy vào chế độ Service Mode', 'Tắt máy in. Nhấn giữ nút <strong>Stop</strong>, đồng thời nhấn giữ nút <strong>Nguồn</strong>. Giữ nguyên nút Nguồn rồi thả nút Stop, sau đó nhấn nút Stop <strong>5 lần liên tiếp</strong>, cuối cùng thả cả hai nút. Máy sẽ đứng im, đèn nguồn sáng — đó là đã vào Service Mode.'],
    ['Cắm máy vào máy tính và mở Service Tool', 'Giải nén file vừa tải, chạy <strong>ServiceTool.exe</strong> bằng chuột phải → Run as administrator. Nếu Windows chặn, tắt tạm phần mềm diệt virus rồi mở lại.'],
    ['Chọn vùng máy in', 'Trong mục <strong>Set Destination</strong>, chọn khu vực tương ứng rồi bấm <strong>Set</strong>. Máy sẽ in ra một trang giấy trắng — đó là dấu hiệu nhận lệnh thành công.'],
    ['Xoá bộ đếm mực thải', 'Ở mục <strong>Clear Ink Counter</strong>, chọn <strong>Main</strong> rồi bấm <strong>Set</strong>. Máy tiếp tục in ra một trang trắng nữa.'],
    ['Xoá bộ nhớ EEPROM', 'Bấm <strong>EEPROM Clear</strong> để đưa bộ đếm về 0. Đây là bước quyết định — sau bước này máy mới hết báo lỗi.'],
    ['Tắt máy và khởi động lại', 'Tắt máy in bằng nút nguồn, chờ khoảng 10 giây rồi bật lại. Máy trở về trạng thái bình thường và in được tiếp.'],
  ];

  if (p.brother) return [
    ['Mở nắp trước của máy in', 'Máy đang bật, mở nắp trước (nắp che hộp mực). Màn hình sẽ hiện thông báo nắp đang mở — giữ nguyên trạng thái này.'],
    ['Gọi menu reset mực', 'Nhấn giữ nút <strong>OK</strong> khoảng 5 giây cho tới khi màn hình hiện dòng <strong>Reset Menu</strong> hoặc <strong>TNR-STD / TNR-HC</strong>.'],
    ['Chọn đúng loại hộp mực', 'Dùng phím mũi tên chọn <strong>TNR-STD</strong> nếu dùng hộp mực thường, hoặc <strong>TNR-HC</strong> nếu dùng hộp mực dung lượng cao (loại in được nhiều trang hơn).'],
    ['Xác nhận reset', 'Nhấn <strong>OK</strong>. Màn hình hỏi xác nhận thì chọn <strong>Yes</strong> (hoặc nhấn mũi tên lên) để đồng ý.'],
    ['Đóng nắp và in thử', 'Đóng nắp trước lại. Máy khởi động khoảng 5–10 giây, thông báo hết mực biến mất. In thử một trang để kiểm tra bản in.'],
  ];

  if (p.hpChip) return [
    ['Xác định máy đang báo gì', 'Phân biệt rõ hai trường hợp: máy báo <strong>“Toner low”</strong> (mực yếu — vẫn in được, chỉ là cảnh báo) và máy <strong>ngừng in hẳn</strong> (chip đã đếm hết số trang cho phép). Cách xử lý của hai trường hợp khác nhau.'],
    ['Bỏ qua cảnh báo để in tiếp', 'Với trường hợp chỉ cảnh báo: vào <strong>Control Panel → Devices and Printers</strong>, chuột phải máy in → <strong>Printer properties → Device Settings</strong>, chuyển mục cảnh báo mực sang <strong>Continue</strong>. Máy sẽ in tiếp cho tới khi mực nhạt thật.'],
    ['Tháo hộp mực và kiểm tra chip', 'Tắt máy, mở nắp, rút hộp mực ra. Chip là miếng mạch nhỏ màu đen hoặc xanh gắn ở cạnh bên hộp mực. Lau sạch chân tiếp xúc bằng khăn khô rồi lắp lại — nhiều trường hợp chỉ bẩn chân chip.'],
    ['Thay chip mới nếu vẫn báo lỗi', 'Nếu đã nạp mực đầy mà máy vẫn không in, chip đã đếm hết hạn mức và <strong>bắt buộc phải thay chip mới</strong> — dòng HP 105A/106A không reset lại được bằng phần mềm. Chip rời bán sẵn, giá rẻ, tháo lắp bằng tay trong vài phút.'],
    ['Lắp lại và in thử', 'Lắp hộp mực vào đúng khớp, đóng nắp, bật máy và in thử một trang. Nếu bản in mờ hoặc có sọc thì vấn đề nằm ở mực hoặc trống, không phải chip.'],
  ];

  /* Mặc định: dòng Epson dùng phần mềm Adjustment Program */
  return [
    ['Tắt phần mềm diệt virus và tường lửa', 'Adjustment Program hay bị các phần mềm diệt virus chặn nhầm. Tắt tạm Windows Defender và phần mềm diệt virus đang dùng, sau khi reset xong thì bật lại.'],
    ['Giải nén và chạy phần mềm', 'Giải nén file vừa tải, chạy <strong>AdjProg.exe</strong> bằng chuột phải → <strong>Run as administrator</strong>. Cắm dây USB nối máy in với máy tính, bật máy in lên.'],
    ['Chọn đúng model máy in', 'Bấm nút <strong>Select</strong>, ở mục Model Name chọn đúng <strong>' + esc(p.model) + '</strong>, mục Port chọn <strong>Auto selection</strong> rồi bấm <strong>OK</strong>. Chọn sai model là reset không ăn.'],
    ['Vào chế độ Particular adjustment mode', 'Ở màn hình chính, bấm <strong>Particular adjustment mode</strong> để mở danh sách các chức năng chỉnh máy.'],
    ['Chọn Waste ink pad counter', 'Trong danh sách, tìm và chọn dòng <strong>Waste ink pad counter</strong> (bộ đếm mực thải) rồi bấm <strong>OK</strong>.'],
    ['Kiểm tra mức đếm hiện tại', 'Tích vào ô <strong>Main pad counter</strong>, bấm <strong>Check</strong> để xem bộ đếm đang ở bao nhiêu phần trăm. Nếu hiện 100% hoặc hơn thì đúng là máy đã tràn bộ đếm.'],
    ['Bấm Initialize để đưa bộ đếm về 0', 'Vẫn giữ ô <strong>Main pad counter</strong> đang tích, bấm <strong>Initialize</strong> rồi bấm <strong>OK</strong> khi có hộp thoại xác nhận. Đây là bước chính, làm xong bộ đếm về 0.'],
    ['Tắt máy in và bật lại', 'Tắt máy in bằng nút nguồn trên máy, chờ 10 giây rồi bật lại. Đèn đỏ tắt, máy nhận lệnh in bình thường.'],
  ];
}

/* ---------- sơ đồ quy trình dạng SVG (tự vẽ, không tải ảnh ngoài nên không tốn tốc độ) ----------
   Làm 2 bản: máy tính xếp ngang 2 hàng, điện thoại xếp dọc 1 cột.
   Lý do: cùng một SVG khi thu về bề ngang 375px thì chữ chỉ còn ~5,6px — không ai đọc nổi. */
const NHAN_BUOC = p => p.canon
  ? ['Vào Service Mode', 'Mở Service Tool', 'Set Destination', 'Clear Ink Counter', 'EEPROM Clear', 'Khởi động lại']
  : p.brother ? ['Mở nắp trước', 'Giữ nút OK 5 giây', 'Chọn TNR-STD', 'Xác nhận Yes', 'Đóng nắp, in thử']
  : p.hpChip ? ['Xác định lỗi', 'Bỏ qua cảnh báo', 'Kiểm tra chân chip', 'Thay chip mới', 'Lắp lại, in thử']
  : ['Tắt diệt virus', 'Chạy AdjProg', 'Chọn đúng model', 'Particular mode', 'Waste ink pad', 'Bấm Check', 'Bấm Initialize', 'Bật lại máy'];

function svgNgang(p, nhan) {
  const n = nhan.length, w = 900, cot = Math.ceil(n / 2), oW = 190, oH = 92;
  const gapX = (w - cot * oW) / (cot + 1), gapY = 34, h = 2 * oH + 3 * gapY + 34;
  let out = '';
  nhan.forEach((t, i) => {
    const hang = Math.floor(i / cot), cotI = i % cot;
    const x = gapX + cotI * (oW + gapX), y = 34 + gapY + hang * (oH + gapY);
    out += `<g><rect x="${x}" y="${y}" width="${oW}" height="${oH}" rx="12" class="box"/>` +
      `<circle cx="${x + 26}" cy="${y + 26}" r="15" class="num"/>` +
      `<text x="${x + 26}" y="${y + 31}" class="numTxt">${i + 1}</text>` +
      `<text x="${x + 14}" y="${y + 64}" class="lbl">${esc(t)}</text></g>`;
    if (i < n - 1 && cotI < cot - 1) {
      out += `<path d="M${x + oW + 6} ${y + oH / 2} h${gapX - 12}" class="arw" marker-end="url(#mk1)"/>`;
    }
  });
  return `<svg class="qt-ngang" viewBox="0 0 ${w} ${h}" role="img" xmlns="http://www.w3.org/2000/svg"
             aria-label="Sơ đồ ${n} bước reset ${esc(p.model)}: ${esc(nhan.join(', '))}">
          <defs><marker id="mk1" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto">
            <path d="M0 0 L9 4.5 L0 9 z" fill="currentColor"/></marker>${STYLE_SVG}</defs>
          <text x="14" y="22" class="tit">${esc(n + ' bước reset ' + p.model)}</text>${out}
        </svg>`;
}

function svgDoc(p, nhan) {
  const n = nhan.length, w = 380, oH = 54, gapY = 12, top = 40;
  const h = top + n * oH + (n - 1) * gapY + 10;
  let out = '';
  nhan.forEach((t, i) => {
    const y = top + i * (oH + gapY);
    out += `<g><rect x="10" y="${y}" width="${w - 20}" height="${oH}" rx="10" class="box"/>` +
      `<circle cx="40" cy="${y + oH / 2}" r="16" class="num"/>` +
      `<text x="40" y="${y + oH / 2 + 6}" class="numTxt">${i + 1}</text>` +
      `<text x="68" y="${y + oH / 2 + 6}" class="lbl">${esc(t)}</text></g>`;
    if (i < n - 1) out += `<path d="M40 ${y + oH + 1} v${gapY - 3}" class="arw" marker-end="url(#mk2)"/>`;
  });
  return `<svg class="qt-doc" viewBox="0 0 ${w} ${h}" role="img" xmlns="http://www.w3.org/2000/svg"
             aria-label="Sơ đồ ${n} bước reset ${esc(p.model)}: ${esc(nhan.join(', '))}">
          <defs><marker id="mk2" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
            <path d="M0 0 L8 4 L0 8 z" fill="currentColor"/></marker>${STYLE_SVG}</defs>
          <text x="12" y="24" class="tit">${esc(n + ' bước reset ' + p.model)}</text>${out}
        </svg>`;
}

const STYLE_SVG = `<style>
              .box{fill:var(--bg-alt,#f5f8fc);stroke:var(--line,#e3e9f0)}
              .num{fill:var(--brand,#1f8a70)}
              .numTxt{fill:#fff;font:700 15px system-ui,sans-serif;text-anchor:middle}
              .lbl{fill:var(--ink,#1c2733);font:600 15px system-ui,sans-serif}
              .arw{stroke:var(--brand,#1f8a70);stroke-width:2;fill:none;color:var(--brand,#1f8a70)}
              .tit{fill:var(--brand-dark,#0f3d5c);font:700 17px system-ui,sans-serif}
            </style>`;

function anhQuyTrinh(p) {
  const nhan = NHAN_BUOC(p);
  return `<figure class="quy-trinh">
        ${svgNgang(p, nhan)}
        ${svgDoc(p, nhan)}
        <figcaption>Tóm tắt ${nhan.length} bước reset ${esc(p.model)} — chi tiết từng bước ở phần bên dưới.</figcaption>
      </figure>`;
}

/* ---------- câu hỏi thường gặp ---------- */
function cauHoi(p) {
  const chung = [
    ['Reset xong có in được bao nhiêu trang nữa ?',
     p.soTrangSauReset ||
     'Mỗi lần reset bộ đếm, máy in tiếp được khoảng 5.000–10.000 trang văn bản với độ phủ mực 5%. Nếu in ảnh hoặc bản in nhiều màu (độ phủ 20–40%) thì số trang giảm còn khoảng 1.000–4.000 trang.'],
    ['Reset có làm hỏng máy in không ?',
     'Không. Reset chỉ đưa con số đếm trong bộ nhớ về 0, không tác động tới phần cơ hay đầu in. Tuy nhiên bộ đếm sinh ra để nhắc thay miếng thấm mực thải — nếu miếng thấm đã no mực thật thì cần thay, không thì mực thải có thể tràn ra ngoài.'],
    ['Máy vẫn báo lỗi sau khi reset thì sao ?',
     'Kiểm tra ba thứ theo thứ tự: chọn đúng model chưa, đã tắt phần mềm diệt virus chưa, và dây USB nối trực tiếp máy tính chứ không qua hub hay wifi. Nếu vẫn báo lỗi, khả năng là lỗi phần cứng — gọi ' + '0934 393 550' + ' để kỹ thuật kiểm tra tận nơi.'],
  ];
  if (p.canon) chung.unshift(['Máy Canon báo lỗi 5B00 nghĩa là gì ?',
    'Mã 5B00 (một số đời báo 1700) là báo tràn bộ đếm mực thải. Máy vẫn còn mực và in tốt, chỉ là bộ đếm trong bộ nhớ đã chạm ngưỡng nhà sản xuất đặt ra nên máy tự khoá lệnh in.']);
  if (p.brother) chung.unshift(['Không thấy dòng TNR-STD trên màn hình thì làm sao ?',
    'Một số đời Brother gọi tên khác hoặc yêu cầu giữ nút <strong>Go</strong> thay vì <strong>OK</strong>. Nếu giữ 5 giây không thấy menu, thử giữ lâu hơn khoảng 8–10 giây khi nắp trước đang mở.']);
  if (p.hpChip) chung.unshift(['Chip máy in HP có reset lại được bằng phần mềm không ?',
    'Dòng hộp mực HP 105A/106A dùng cho máy 135A/135W/137W <strong>không reset lại được bằng phần mềm</strong> — chip đếm hết hạn mức thì phải thay chip mới. Chip rời bán sẵn ngoài thị trường, thay bằng tay vài phút là xong.']);
  else chung.push(['Dùng chung phần mềm reset cho nhiều máy được không ?',
    'Mỗi key reset chỉ dùng được cho một máy in và thường chỉ một lần. Muốn reset máy khác hoặc reset lần tiếp theo thì cần key mới — giống như dùng thẻ cào điện thoại.']);
  /* Câu hỏi riêng của từng model đứng trước câu hỏi chung: khách vào trang L805 thì thứ họ
     thắc mắc đầu tiên là chuyện in ảnh, không phải chuyện chung chung của mọi máy Epson. */
  return (p.faqRieng || []).concat(chung);
}

/* ---------- dựng phần thân trang ---------- */
function renderNewPage(p, prefix, cfg, pagesByPath) {
  const buoc = cacBuoc(p);
  const faq = cauHoi(p);
  const dauHieu = p.hpChip
    ? ['Máy hiện thông báo “Toner low” hoặc “Replace toner” dù hộp mực vừa nạp đầy',
       'Đèn báo mực nhấp nháy liên tục, lệnh in bị treo trong hàng đợi',
       'Bản in vẫn đậm đẹp nhưng máy không chịu nhận thêm lệnh in']
    : ['Máy ' + p.loi.replace(/^nháy|^nhấp nháy/, 'nháy'),
       'Lệnh in bị treo trong hàng đợi, bản in không ra dù máy vẫn còn mực',
       'Máy vẫn chạy, đầu in vẫn tốt nhưng không nhận lệnh in mới'];

  const buocHtml = buoc.map((b, i) => `
        <li id="buoc-${i + 1}">
          <h3>Bước ${i + 1}: ${esc(b[0])}</h3>
          <p>${b[1]}</p>
        </li>`).join('');

  const lienQuan = (p.lienQuan || []).filter(x => pagesByPath.has(x)).map(x => {
    const t = pagesByPath.get(x);
    return `<li><a href="${prefix}${x.split('/').map(encodeURIComponent).join('/')}">${esc(t)}</a></li>`;
  }).join('');

  return `<h1>${esc(p.h1)}</h1>

      <p>Máy in <strong>${esc(p.model)}</strong> (và các đời cùng dòng ${esc(p.dongMay)}) sau một thời gian
         sử dụng sẽ ${p.loi}. Đây không phải máy hỏng — bộ đếm mực thải trong bộ nhớ đã chạm mức nhà sản
         xuất đặt sẵn nên máy tự khoá lệnh in. Reset lại bộ đếm là máy in tiếp bình thường.</p>
${p.dacDiem ? `
      <h2>${esc(p.model)} là máy như thế nào</h2>
      <ul class="check-list">${p.dacDiem.map(d => '<li>' + d + '</li>').join('')}</ul>` : ''}
${p.viSaoDay ? `
      <h2>Vì sao ${esc(p.model)} đầy bộ đếm</h2>
      <p>${p.viSaoDay}</p>` : ''}

      ${anhQuyTrinh(p)}

      <h2>Khi nào cần reset ${esc(p.model)}</h2>
      <ul class="check-list">${dauHieu.map(d => '<li>' + esc(d) + '</li>').join('')}</ul>

      <h2>Lưu ý trước khi làm</h2>
      <ul class="check-list">${(p.luuYRieng || []).map(d => '<li>' + d + '</li>').join('')}
        <li>Nối máy in với máy tính bằng <strong>dây USB trực tiếp</strong>, không reset qua wifi hay qua hub chia cổng.</li>
        <li>Tắt phần mềm diệt virus và tường lửa trong lúc chạy, xong thì bật lại.</li>
        <li>Máy in phải đang <strong>bật</strong> và ở trạng thái sẵn sàng, không kẹt giấy, không mở nắp.</li>${p.luuYRieng ? '' : `
        <li>Nếu miếng thấm mực thải đã no mực thật thì nên thay miếng thấm, tránh mực tràn ra bàn.</li>`}
      </ul>

      <h2>Cách reset ${esc(p.model)} — ${buoc.length} bước</h2>
      <ol class="steps">${buocHtml}
      </ol>
${p.tai ? `
      <div class="callout callout-download">
        <p><strong>Tải phần mềm:</strong>
          <a href="${p.tai}" rel="noopener">${esc(p.taiNhan)}</a></p>
        <p class="callout-note">File nằm ở tinhocnamphong.net thuộc cùng hệ thống với chúng tôi — tải miễn phí, không cần đăng ký.</p>
      </div>` : ''}

      <h2>Câu hỏi thường gặp</h2>
      ${faq.map(f => `<h3>${esc(f[0])}</h3>\n      <p>${f[1]}</p>`).join('\n      ')}

      <aside class="cta-box">
        <p><strong>Làm theo hướng dẫn mà máy vẫn không chịu in?</strong> Gọi kỹ thuật tới tận nơi kiểm tra —
           có mặt trong 20–30 phút tại TP.HCM, không sửa được không thu tiền.</p>
        <p><a class="btn btn-primary" href="tel:${cfg.hotlineTel}">📞 Gọi ${cfg.hotlineDisplay}</a>
           <a class="btn btn-outline" href="https://zalo.me/${cfg.zaloTel}" target="_blank" rel="noopener">💬 Nhắn Zalo</a></p>
      </aside>
${lienQuan ? `
      <section class="related">
        <h2>Bài hướng dẫn liên quan</h2>
        <ul class="link-list">${lienQuan}</ul>
      </section>` : ''}`;
}

/* Chuyển trang mới sang dạng "blocks" để bộ sinh dữ liệu có cấu trúc đọc được các bước và hỏi–đáp */
function toBlocks(p) {
  const blocks = [{ t: 'h1', text: p.h1 }];
  (p.dacDiem || []).forEach(d => blocks.push({ t: 'li', text: d.replace(/<[^>]+>/g, '') }));
  if (p.viSaoDay) blocks.push({ t: 'p', text: p.viSaoDay.replace(/<[^>]+>/g, '') });
  (p.luuYRieng || []).forEach(d => blocks.push({ t: 'li', text: d.replace(/<[^>]+>/g, '') }));
  cacBuoc(p).forEach((b, i) => {
    blocks.push({ t: 'p', text: 'Bước ' + (i + 1) + ': ' + b[0] + '. ' + b[1].replace(/<[^>]+>/g, '') });
  });
  cauHoi(p).forEach(f => {
    blocks.push({ t: 'h3', text: f[0] });
    blocks.push({ t: 'p', text: f[1].replace(/<[^>]+>/g, '') });
  });
  return blocks;
}

module.exports = { renderNewPage, toBlocks };
