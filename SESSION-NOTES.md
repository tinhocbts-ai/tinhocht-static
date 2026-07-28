# SESSION NOTES — Migrate tinhocht.com: Google Sites → GitHub Pages

> Đọc file này đầu tiên khi mở phiên mới cho dự án này. Trí nhớ dự án (memory) cũng đã lưu tóm tắt, nhưng file này chi tiết hơn để tiếp tục đúng mạch.

## 📍 Bối cảnh
tinhocht.com đang chạy Google Sites (traffic thật ~196k impressions/6 tháng, GSC). Đang khảo sát + bắt đầu build bản site tĩnh song song trên GitHub Pages, **chưa trỏ domain thật**, site Google Sites gốc vẫn chạy bình thường không bị đụng.

## 📂 2 thư mục liên quan

| Thư mục | Vai trò |
|---|---|
| `D:\AUTOMATION\projects\tinhocht\export\` | Dữ liệu khảo sát: báo cáo, crawl 163 trang, đề xuất URL map (**KHÔNG đưa lên git public**) |
| `D:\AUTOMATION\projects\tinhochtgithub\` | Code site tĩnh mới — đây là repo Git thật, đã push lên GitHub |

## ✅ ĐÃ XONG

### Giai đoạn 1 — Khảo sát (100%)
- Crawl + kiểm kê đầy đủ **163/163 trang thật** của tinhocht.com (nội dung, ảnh, SĐT, cấu trúc URL).
- Báo cáo đầy đủ: `D:\AUTOMATION\projects\tinhocht\export\BAO-CAO-KHAO-SAT-GIAI-DOAN-1.md` — **đọc file này để biết toàn bộ chi tiết** (trang "ngôi sao" không được đổi, rủi ro URL, v.v).
- Đề xuất URL cũ→mới: `export/url-mapping-proposal.json` (149 dòng).
- 21 trang đã đối chiếu nguyên văn xong (dùng Browser tool đọc DOM, không dùng WebFetch vì hay tóm lược sai).
- **2 quyết định phạm vi đã chốt với chủ shop:**
  - "Dịch vụ mạng tổng đài" → LOẠI BỎ khỏi migrate (dịch vụ cũ đã nghỉ, xác nhận trang này rỗng không có nội dung riêng).
  - "Nạp mực máy in bill" → KHÔNG build đầy đủ, chỉ để trang giới thiệu ngắn + link trỏ sang `mucinht.com` (đúng theo bảng phân vùng keyword hệ thống — cụm máy in bill/POS thuộc site đó).

### Giai đoạn 2 — Bắt đầu build (đang chạy)
- **Cài `gh` CLI + đăng nhập** (winget install GitHub.cli, `gh auth login --web`, tài khoản `tinhocbts-ai`). Từ giờ dùng `git`/`gh` trực tiếp cho mọi thao tác GitHub — **không cần Claude in Chrome** (extension hay bị đứt kết nối trong phiên trước, đây là lối tắt ổn định hơn).
- **Repo đã tạo:** `tinhocbts-ai/tinhocht-static` (public) — GitHub Pages đã bật.
- **Demo:** https://tinhocbts-ai.github.io/tinhocht-static/
- **Trang chủ (`index.html`) đã build xong đúng chuẩn:**
  - Nội dung 100% nguyên văn (lấy từ DOM thật qua Browser tool, không tóm lược).
  - 14 ảnh gốc đã tải về, tự host tại `assets/img/home/`.
  - Logo header dùng đúng ảnh "HT" thật (`assets/img/logo-ht.jpg`), không phải icon tự vẽ.
  - Menu mobile có nút đóng ✕ rõ ràng (fix bug bị đè khuất).
  - **KHÔNG hiển thị email** `tinhocbts@gmail.com` ở bất kỳ đâu (đã gỡ khỏi footer + site.config.json — chủ shop không muốn email dùng chung nhiều site bị lộ ra site này).
- Đã fix 1 bug quan trọng trong `build.js`: từng vô tình skip thư mục `partials/` khỏi build khiến header/footer trống — đã sửa.

## 🔧 Công cụ / quy trình build (đọc kỹ trước khi build trang mới)

**Quy tắc cứng: giữ nguyên 100% nội dung chữ + ảnh gốc khi build mỗi trang — chỉ đổi giao diện/CSS, KHÔNG viết lại câu chữ.** (trừ 2 ngoại lệ phạm vi đã nêu trên)

Quy trình đúng cho MỖI trang (đã rút kinh nghiệm từ lỗi ở trang chủ — lần đầu dùng WebFetch bị tóm lược sai nội dung + quên ảnh):
1. `mcp__Claude_Browser__navigate` mở đúng URL sống trên tinhocht.com (KHÔNG dùng WebFetch — hay tự ý tóm lược dù đã dặn).
2. Lấy text chính xác: `javascript_tool` → `document.body.innerText` (hoặc đúng container).
3. Lấy ảnh thật: `javascript_tool` → query `document.querySelectorAll('img')`, lấy `currentSrc`/`src`. **TUYỆT ĐỐI giữ nguyên URL, không sửa tham số `=w...` cuối URL googleusercontent — sửa là hỏng chữ ký, tải về bị lỗi 403.**
4. Tải ảnh về bằng `curl` (Bash) — dùng đúng URL gốc là tải được bình thường.
5. Viết HTML: giữ đúng thứ tự heading/đoạn/danh sách như bản gốc, không tự bịa section, không gộp/rút gọn.
6. Build (`node build.js`), xem trước bằng server cục bộ (xem mục dưới) — **KHÔNG dùng `file://`** (bị giới hạn, partials không tải được do CORS).
7. **Build xong 1 trang → DỪNG lại, chờ duyệt trước khi làm tiếp** (bài học: làm ẩu 1 lần cho nhiều trang sẽ nhân lỗi lên nhiều lần).

### Xem preview cục bộ
- File `serve.js` trong `tinhochtgithub/` là static server nhẹ, port 8123.
- Cấu hình sẵn ở `D:\AUTOMATION\projects\tinhocht\.claude\launch.json` (tên `tinhochtgithub-preview`) — gọi qua `preview_start` (Browser tool) là chạy được ngay.

### Danh sách/loại nội dung (mẹo SEO đã thống nhất)
- Ký hiệu hiển thị (✓ hay •) — **không ảnh hưởng SEO gì cả** (Google chỉ đọc thẻ HTML, không đọc icon).
- Dùng `<ol>` (số 1-2-3 thật) CHỈ cho nội dung **tuần tự thật sự** (quy trình các bước, hướng dẫn) — đây là chỗ AI Overview thực sự ưu tiên.
- Dùng `<ul>` (bullet/✓) cho danh sách **không tuần tự** (lợi ích, tính năng, dịch vụ) — ép thành số không giúp gì thêm.

## ⏳ VIỆC CÒN LẠI (theo thứ tự ưu tiên)

1. **8 trang "ngôi sao"** (CTR cao nhất, top 1-5 — xem mục 3 báo cáo khảo sát) — ưu tiên cao nhất, làm từng trang 1, dừng lại duyệt sau mỗi trang:
   - `/thu-thuat-tin-hoc/thu-thuat-may-in/phan-mem-reset-may-in-epson-l310`
   - `/Phan-mem-reset-may-in/tool-reset-bo-dem-epson-l3210`
   - `/Phan-mem-reset-may-in/phan-mem-reset-epson-l3110`
   - `/Phan-mem-reset-may-in/phan-mem-reset-epson-l1110`
   - `/Phan-mem-reset-may-in/download-phan-mem-reset-epson-l3150`
   - `/home/nap-muc-may-in-quan-10`
   - `/home/nap-muc-may-in-quan-tan-binh`
   - `/home/nap-muc-may-in-quan-tan-phu`
2. ~155 trang còn lại, theo pillar (nạp mực quận → reset máy in → sửa máy tính → blog thủ thuật → sửa máy in → bán máy in cũ).
3. **2 trang "Bảng giá" trùng nhau** (`/bang-gia-nap-muc-may-in-tan-noi` và `/bảng-giá` cấp 1 ẩn) — cần hỏi chủ shop giữ/gộp cái nào trước khi build.
4. `data/redirects.json` — điền đầy đủ từ `export/url-mapping-proposal.json` (đang để trống `{}`).
5. Trang "Nạp mực máy in bill" → build dạng rút gọn + link sang mucinht.com (không phải trang đầy đủ).
6. Sau khi build xong hết + duyệt demo → mới bàn bước trỏ domain thật (ngoài phạm vi hiện tại, cần duyệt riêng).

## 🔑 Thông tin kỹ thuật nhanh
- GitHub: `tinhocbts-ai/tinhocht-static` · `gh` CLI đã auth sẵn, dùng thẳng `git push` bình thường.
- Hotline chính: `0934 393 550` · Zalo: `089 886 9964` · Địa chỉ: `79 Đường Bắc Hải, Phường 15, Quận 10, TP.HCM`.
- KHÔNG hiển thị email `tinhocbts@gmail.com` ở site này.
