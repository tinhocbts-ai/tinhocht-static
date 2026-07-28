# SESSION NOTES — Migrate tinhocht.com: Google Sites → GitHub Pages

> Đọc file này đầu tiên khi mở phiên mới cho dự án này.

## 📍 Bối cảnh
tinhocht.com đang chạy Google Sites (traffic thật ~196k impressions/6 tháng theo GSC). Bản tĩnh chạy
song song trên GitHub Pages, **chưa trỏ domain thật** — site Google Sites gốc vẫn chạy bình thường,
không bị đụng vào.

- **Demo:** https://tinhocbts-ai.github.io/tinhocht-static/
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

## 🌐 KHI GẮN TÊN MIỀN THẬT (bước tiếp theo, cần chủ shop duyệt)

```bash
NOINDEX=0 node build-site.js          # bỏ thẻ noindex khỏi toàn bộ trang
echo tinhocht.com > CNAME             # tạo file CNAME ở thư mục gốc repo
git add -A && git commit -m "Go live: bo noindex + them CNAME" && git push
```
Sau đó:
1. DNS tại nhà cung cấp domain: 4 bản ghi **A** cho `tinhocht.com` → `185.199.108.153`,
   `185.199.109.153`, `185.199.110.153`, `185.199.111.153`; bản ghi **CNAME** cho `www` →
   `tinhocbts-ai.github.io`.
2. GitHub → repo → Settings → Pages → điền custom domain `tinhocht.com` → bật **Enforce HTTPS**
   (chờ cấp chứng chỉ vài phút).
3. Google Search Console: gửi lại `sitemap.xml`, dùng URL Inspection kiểm 8 trang ngôi sao.
4. **Chỉ tắt Google Sites sau khi** bản tĩnh đã chạy đúng trên domain thật và index bình thường.

⚠️ Bản demo đang để `noindex` toàn site để Google không index trùng nội dung với site thật đang chạy.

## ⏳ VIỆC CÒN LẠI

1. **2 trang "Bảng giá" trùng title** — `/bang-gia-nap-muc-may-in-tan-noi` và `/bảng-giá` (trang ẩn cấp 1,
   8 ảnh bảng giá theo hãng). Cần chủ shop chốt giữ/gộp cái nào.
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
