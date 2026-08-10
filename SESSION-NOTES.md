# SESSION NOTES — Migrate tinhocht.com: Google Sites → GitHub Pages

> Đọc file này đầu tiên khi mở phiên mới cho dự án này.

## 📍 Bối cảnh

**🟢 ĐÃ GO-LIVE 28/07/2026** — bản tĩnh đang phục vụ tại **https://www.tinhocht.com/** (GitHub Pages,
commit efc8532). Google Sites cũ không còn được trỏ tới; giữ nguyên tài khoản, chưa xoá.

- **Site thật:** https://www.tinhocht.com/ · HTTPS bắt buộc, chứng chỉ GitHub đã cấp
- **Demo cũ:** https://tinhocbts-ai.github.io/tinhocht-static/ (nay tự chuyển sang domain thật)
- **Repo:** `tinhocbts-ai/tinhocht-static` · code local `D:\AUTOMATION\projects\tinhochtgithub`
- **Dữ liệu khảo sát/crawl:** `D:\AUTOMATION\projects\tinhocht\export\` (KHÔNG đưa lên git public)

## ✅ TRẠNG THÁI: đã dựng xong toàn bộ site (28/07/2026)

| Hạng mục | Số liệu |
|---|---|
| Trang đã dựng | **162** (159 trang nội dung + trang chủ + 404 + stub `/home`) |
| Nội dung | **149.654 từ**, trung bình 924 từ/trang — nguyên văn DOM thật |
| Ảnh | **562 ảnh** tải về tự host `assets/img/p/` (23 MB) |
| Link nội bộ | **0/21.208 gãy** (trước đó 187 link gãy) |
| SEO cơ bản | 0 trang thiếu title/H1/canonical; 1 cặp title trùng ("BẢNG GIÁ" — xem việc còn lại) |

### Quy trình build (3 lệnh)

```bash
node tools/crawl-dom.js     # crawl nguyên văn từ tinhocht.com + tải ảnh  (chạy lại khi site gốc đổi)
node build-site.js          # dựng toàn bộ HTML + menu 2 cấp + sitemap
node serve.js               # xem thử http://localhost:8123
```
Kiểm tra: `node tools/check-links.js` (link gãy) · `node tools/audit.js` (SEO, trang mỏng).

Crawl thêm 1 URL lẻ: `node tools/crawl-dom.js "https://www.tinhocht.com/duong-dan"` (dùng URL đầy đủ,
Git Bash sẽ bẻ `/duong-dan` thành đường dẫn Windows).

### Cách hoạt động

- **`tools/crawl-dom.js`** đọc thẳng HTML thật bằng `https.get` — Google Sites render sẵn nội dung
  server-side nên lấy được nguyên văn 100%. **Tuyệt đối không dùng WebFetch** (tóm lược sai nội dung,
  đây là lỗi đã mắc 2 lần trong dự án này). Parser quét token tuần tự, giữ đúng thứ tự h1/h2/h3/p/li/img.
- **`build-site.js`** dựng mọi trang từ `export/pages-dom/*.json`:
  - Menu 2 cấp sinh động từ cây URL thật (hover trên desktop, accordion trên mobile).
  - Mỗi trang: breadcrumb → nội dung → CTA gọi/Zalo → mục lục trang con → bài liên quan.
  - **Bộ khớp lại link gãy**: site gốc có sẵn ~187 link trỏ sai (viết không dấu, `đ`→`dh`, slug tự
    đoán). Bộ khớp dùng khoá chuẩn hoá + trùng token + **cặp từ liền kề** (để không nhầm
    "Tân Bình" với "Bình Tân"). Báo cáo: `export/link-fix-report.json`.
  - Trang chủ lấy `src/index.html` (có hero riêng), chèn header/footer rồi ghi ra `index.html`.

## 🔒 Nguyên tắc bất di bất dịch

1. **KHÔNG đổi slug URL** — giữ nguyên 100% ký tự đường dẫn gốc (dấu tiếng Việt `/liên-hệ`, chữ hoa
   `/Phan-mem-reset-may-in/`, `---` trong slug). Site có traffic thật, đổi URL là mất ranking.
   Phương án đổi slug + redirect trong `export/url-mapping-proposal.json` đã **HỦY**.
2. **Giữ nguyên văn nội dung + ảnh gốc**, chỉ nâng cấp giao diện/CSS.
3. Ngoại lệ đã chốt với chủ shop:
   - SĐT ngoài hệ thống `089 886 0052` (trang Q9) và `098 131 9853` (trang Gia Lai) → **gom về hotline
     `0934 393 550`** (build tự thay, kể cả khi có non-breaking space).
   - Trang **"nạp mực máy in bill"** → chỉ giới thiệu ngắn + link sang mucinht.com.
   - **Loại khỏi phạm vi:** "dịch vụ mạng tổng đài" (đã nghỉ kinh doanh), "untitled page" (trang rác).
   - Link tải tool trỏ sang **tinhocnamphong.net** → **GIỮ NGUYÊN** (chung hệ thống).
   - **KHÔNG hiển thị email** `tinhocbts@gmail.com` ở bất kỳ trang nào.
4. **Pillar sửa máy tính**: nghề không làm nữa, giữ trang chỉ để kéo traffic — build y nguyên,
   không đầu tư tối ưu thêm.
5. 8 trang "ngôi sao" (CTR cao, top 1-5): nạp mực Q10/Tân Bình/Tân Phú, reset Epson
   L310/L3210/L1110/L3110/L3150 — không đổi title/URL. Lưu ý **title thật trên site đã khác bản GSC cũ**
   ở 8 trang (đợt SEO batch sửa) — build lấy title thật hiện tại, không lấy từ GSC export.

## 🌐 TÊN MIỀN — ĐÃ GẮN XONG (28/07/2026)

Cấu hình đang chạy:

| Thành phần | Giá trị |
|---|---|
| File `CNAME` trong repo | `www.tinhocht.com` |
| GitHub Pages custom domain | `www.tinhocht.com` · Enforce HTTPS **bật** · chứng chỉ **approved** |
| DNS `www` | CNAME → `tinhocbts-ai.github.io.` ✅ |
| DNS `@` (apex) | 4 bản ghi A → 185.199.108–111.153 ✅ |
| DNS `@` TXT | 3 bản ghi google-site-verification — giữ nguyên ✅ |

`SITE_URL` = `https://www.tinhocht.com` (canonical + sitemap + robots.txt). **Không bao giờ bỏ www**:
148/149 URL có traffic đều là bản www, đổi canonical = mất ranking.

### ✅ DNS đã hoàn tất (29/07/2026)

Đã xoá bản ghi URL REDIRECT của apex. Kiểm tra thực tế: gõ `tinhocht.com` (không www) 6/6 lần
vào đúng GitHub và chuyển 301 sang `https://www.tinhocht.com/`. Cả 4 kiểu gõ (có/không www,
http/https) đều về đúng một địa chỉ.

### Việc nên làm trong Search Console (sau go-live)

1. Gửi lại sitemap: `https://www.tinhocht.com/sitemap.xml` (159 URL).
2. URL Inspection → Request indexing cho 8 trang ngôi sao.
3. Theo dõi 2–4 tuần: so clicks/vị trí trước–sau. Nếu tụt bất thường ở trang nào, kiểm tra
   canonical + nội dung trang đó trước tiên.
4. **Chưa xoá Google Sites** — để nguyên vài tuần phòng khi cần đối chiếu nội dung gốc.

## 🔀 Gộp trang trùng & trang chuyển hướng (28/07/2026)

- **2 trang "Bảng giá" đã gộp**: nội dung dồn về `/bang-gia-nap-muc-may-in-tan-noi` (trang có traffic GSC),
  còn `/bảng-giá` **giữ nguyên URL** nhưng thành trang chuyển hướng → **không link nào bị gãy**.
  Khai báo trong `MERGE_INTO` (build-site.js) — muốn gộp thêm trang nào chỉ cần thêm 1 dòng.
- Trang bảng giá được dựng lại từ `data/bang-gia.json`: bảng 9 nhóm hãng × (dòng máy · đơn giá · ảnh máy in),
  4 chỉ số nổi bật, ghi chú giá, khối cam kết. **Sửa giá chỉ cần sửa JSON** rồi build lại.
  Title cũ "BẢNG GIÁ" (trùng, GSC vị trí 27) đã đổi qua `TITLE_OVERRIDE` — không đụng title 8 trang ngôi sao.
- **52 trang chuyển hướng** sinh tự động cho URL cũ/sai (link gãy sẵn trên site gốc + `/home` + `/bảng-giá`),
  ai vào URL cũ vẫn ra đúng nội dung. Stub luôn được ghi đè mỗi lần build (tránh giữ lại đích sai cũ).
- Bộ khớp link đã sửa 3 lỗi nghiêm trọng: số quận bị nuốt (do quy tắc "24/7"), chữ "Tân" bị nuốt
  (do "tận nơi"), và điểm "chứa trọn" kéo mọi link về trang tổng. Kết quả: **50/50 link gãy nối đúng trang**.

## 🚀 Tối ưu cho Google & trợ lý AI (28/07/2026)

### Ảnh — đã nén
`node tools/optimize-images.js --clean` → 551 ảnh sang WebP (tối đa 1000px, chất lượng 76):
**20,7 MB → 7,0 MB (giảm 66%)**. Giữ nguyên 22 ảnh GIF động. Script tự cập nhật đường dẫn trong
`data/images.json`, `export/pages-dom/*.json` và `data/bang-gia.json`.

### Dữ liệu có cấu trúc (JSON-LD) — thứ Google Sites không cho làm
`tools/schema.js` sinh theo từng loại trang, hồ sơ shop nằm ở `data/business.json`:

| Loại | Số trang | Dùng để làm gì |
|---|---:|---|
| LocalBusiness + ComputerStore | 1 (trang chủ) | Tên, địa chỉ 79 Bắc Hải Q10, toạ độ thật từ Google Maps, giờ 8–19h, 19 khu vực, 9 mức giá, link Maps |
| WebPage + BreadcrumbList | 158 | Hiện đường dẫn phân cấp ngay trong kết quả tìm kiếm |
| Service | 93 | Dịch vụ gì, phục vụ quận nào (53 trang gắn quận cụ thể) |
| HowTo | 21 | Bài có "Bước 1-2-3" rõ ràng, gồm cả 5 trang ngôi sao reset Epson |
| Article | 37 | Bài hướng dẫn không có cấu trúc bước |
| FAQPage | 12 | Chỉ trang thật sự có cặp hỏi–đáp hiển thị |
| OfferCatalog | 1 | Bảng giá 9 nhóm, máy đọc được giá |

**Nguyên tắc:** chỉ khai báo thứ THẬT SỰ hiển thị trên trang. Không bịa giá, không bịa đánh giá sao
(khai khống là vi phạm chính sách Google, bị phạt nặng hơn là không khai).

Kiểm tra: `node tools/check-schema.js` → 0 lỗi JSON, 0 trang gắn sai khu vực.

**3 lỗi đã bắt được khi kiểm tra** (đáng nhớ nếu sau này sửa `tools/schema.js`):
1. `quan-1` khớp nhầm cả `quan-10`, `quan-11`, `quan-12` → nay so khớp theo biên từ.
2. Thiếu Quận 2 và Quận 9 trong danh sách khu vực (đã sáp nhập TP Thủ Đức từ 2021 nhưng khách
   và Google vẫn tìm theo tên cũ, site cũng có trang riêng cho 2 khu vực này).
3. Trang **sửa máy in / sửa máy tính theo quận** cũng khớp tên quận nên nhận luôn phần khai giá
   nạp mực, trong khi trên trang không có bảng giá nào → khai khống. Nay builder đặt cờ
   `page.coBangGia` đúng chỗ chèn bảng, schema chỉ khai `offers` khi có cờ này (18 trang).

## 📍 Tín hiệu địa phương cho trang quận (29/07/2026)

**Vì sao làm:** nhóm từ khoá theo quận đang đứng vị trí 5–10 (quận 3, 6, 5, Phú Nhuận, Bình Thạnh,
quận 8) — khoảng 3.400 lượt hiển thị/6 tháng nhưng rất ít lượt nhấp. Đo trên chính site cho thấy
điểm nghẽn **không phải** nội dung hay liên kết nội bộ: trang quận 3 dài hơn (2.982 từ) và được
nhiều liên kết hơn (65) trang quận 10 nhưng vẫn đứng sau 4 bậc. Khác biệt còn lại là mức độ cụ thể
về địa lý — trước đây trang nào cũng chỉ nói chung chung "phục vụ toàn quận".

`data/quan-dia-ban.json` — 18 quận, mỗi quận có: tuyến đường lớn, địa điểm quen thuộc (chợ, bệnh
viện, trung tâm thương mại), quãng đường + thời gian chạy từ cửa hàng 79 Bắc Hải, toạ độ trung tâm.

> **Cố ý dùng tên đường và địa điểm, KHÔNG dùng tên phường.** Đường và chợ không đổi khi sắp xếp
> lại đơn vị hành chính, còn khách cũng tìm theo đường/chợ nhiều hơn theo số phường.

Mỗi trang quận nay có thêm (chỉ thêm, không đụng nội dung gốc):
- khối **"Địa bàn nhận nạp mực"** — thời gian di chuyển thật, danh sách đường và địa điểm
- **bảng giá rút gọn** ngay trên trang (trước đây khách phải nhảy sang trang khác mới thấy giá)
- 1 câu hỏi gắn với địa bàn trong phần hỏi–đáp → 88 câu trên 18 trang
- schema `Service`: `areaServed` kèm `GeoCircle` theo toạ độ từng quận + `offers` 90.000–300.000đ

Kết quả kiểm tra: 18/18 trang đủ 4 hạng mục, 52 trang dịch vụ có toạ độ vùng phục vụ,
0/23.619 liên kết gãy, không đổi slug nào.

## 🔗 Cấu trúc file & URL — ĐỌC TRƯỚC KHI SỬA BUILD

**Mỗi trang là một FILE `<đường-dẫn>.html`, KHÔNG phải thư mục `<đường-dẫn>/index.html`.**

Lý do (đã kiểm chứng bằng 3 trang thử trên chính domain, 28/07/2026):

| Cấu trúc trong repo | Khi khách/Google vào `/duong-dan` |
|---|---|
| `duong-dan.html` | **200 trực tiếp** ✅ |
| `duong-dan/index.html` | **301** chuyển sang `/duong-dan/` ❌ |
| có cả hai | `/duong-dan` lấy file · `/duong-dan/` lấy thư mục (2 URL trùng nội dung — tránh) |

Google đã index toàn bộ URL dạng **không có dấu `/` cuối**. Nếu build ra thư mục, mỗi lần Google
ghé đều gặp 301 → Search Console báo *"chưa được lập chỉ mục"*. Đây chính là lỗi đã gặp và đã
sửa ngày 28/07/2026. **Đừng đổi ngược lại.**

Kéo theo: canonical, sitemap, menu, breadcrumb, link nội bộ, trang chuyển hướng — tất cả đều
KHÔNG có dấu `/` cuối. `serve.js` và `tools/check-links.js` đã mô phỏng đúng cách GitHub Pages
phân giải URL (thử `<path>.html` trước, rồi mới tới `<path>/index.html`).

Có file `.nojekyll` ở gốc repo: tắt Jekyll để nó không bỏ qua file bắt đầu bằng `_` và không xử
lý lạ với thư mục tên tiếng Việt.

### ⚠️ Ba cái bẫy đã cắn thật (07/08/2026)

**1. `node build-site.js` trần sẽ gắn `noindex` cho toàn bộ 166 trang.** Mặc định `NOINDEX` bật
(dành cho bản demo github.io). Bản production **luôn** phải chạy:
```bash
NOINDEX=0 node build-site.js
```
Kiểm tra sau khi dựng: chỉ được có 53 file chứa `noindex` = 52 trang chuyển hướng + `404.html`.

**2. KHÔNG BAO GIỜ sửa tay file `.html` đã dựng.** Commit `ebd50f7` sửa 3 backlink mucinht trực
tiếp trong file `.html`; lần build kế tiếp ghi đè sạch, mất luôn thay đổi mà không ai biết. Mọi
thứ phải sửa ở nguồn: `build-site.js`, `tools/*.js`, `data/*.json`.

**3. Link nội bộ phải trỏ URL chính tắc, KHÔNG có đuôi `.html`, không trỏ `index.html`.** Vì
`duong-dan.html` phục vụ được cả `/duong-dan` và `/duong-dan.html`, nếu link nội bộ trỏ bản `.html`
thì Google index cả hai rồi báo "Trang thay thế có thẻ chính tắc thích hợp" cho mọi trang — có lúc
nó chọn nhầm bản `.html` làm bản chính. Link tới trang chủ dùng `'./'`/`'../'` để ra đúng `/`,
đừng dùng `index.html` (đó là URL trùng nữa) và đừng để `href=""`.
Kiểm tra nhanh sau mỗi lần build:
```bash
grep -roh 'href="[^"]*\.html"' --include='*.html' . | grep -v 'href="http' | wc -l   # phải = 0
```

### Sitemap `lastmod`

Build so nội dung trang mới với bản cũ trên đĩa, **chỉ trang thật sự đổi mới nhận ngày hôm nay**.
Trước đây mỗi lần build là cả 167 URL cùng khai đổi — tín hiệu sai, Google sẽ thôi tin `lastmod`
của site này. Đừng bỏ đoạn so sánh đó khi sửa `build-site.js`.

## ⏳ VIỆC CÒN LẠI

1. **Đổi DNS + go-live** — xem mục "KHI GẮN TÊN MIỀN THẬT" ở trên (chờ chủ shop bấm nút).
2. **12 trang ẩn 0-traffic** (11 trang tỉnh xa Bình Dương/Vũng Tàu/Bạc Liêu/Bắc Kạn/Bắc Giang/Long Xuyên
   + trang lẻ) — chủ shop nói *"mấy cái ở tỉnh do muốn ăn traffic, có người quen chạy làm được"* nên
   **tạm GIỮ**; chốt lại lần cuối trước khi go-live.
3. **Nén ảnh** — 562 ảnh/23 MB đang là bản gốc từ Google. Có thể chuyển WebP ≤640px để trang nhẹ hơn
   (chưa làm, không chặn go-live).
4. 4 trang mỏng <120 từ: `ban-may-in-cu-gia-re`, `home/nap-muc-may-in-mau-tai-nha/thay-muc-may-in-mau-hp`,
   `nap-muc-may-in-bill.../thay-muc-may-in-bill-epson-tm-u220` (bill — cố ý ngắn), `404.html` (bình thường).
5. Sau go-live: theo dõi GSC 2-4 tuần, so ranking 8 trang ngôi sao trước/sau.

## 🔧 Ghi chú kỹ thuật

- **Claude in Chrome (extension) hay mất kết nối** — đừng loay hoay sửa Chrome. 90% việc dùng được
  `mcp__Claude_Browser__*` (Browser pane tích hợp) + `git`/`gh` CLI. Chỉ việc **sửa nội dung trên
  Google Sites gốc** mới cần side panel Chrome thật (shortcut `seo-mayin`).
- `gh` CLI không có trong PATH của Git Bash → gọi bằng đường dẫn đầy đủ trong PowerShell:
  `& "$env:LOCALAPPDATA\Microsoft\WinGet\Links\gh.exe" api ...`
- `serve.js` nhận `PORT` từ env và phục vụ URL không có `/` cuối; `.claude/launch.json` bật `autoPort`.
- Nhánh git là **master** (không phải main).
