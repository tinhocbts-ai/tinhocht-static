# tinhocht-static

Website HTML tĩnh chuẩn SEO cho **Tin Học HT** — chuyển từ Google Sites, host trên GitHub Pages.

> ⚠️ **Demo giai đoạn khảo sát — CHƯA trỏ domain thật.** Site gốc `tinhocht.com` (Google Sites) vẫn đang chạy song song, không bị đụng tới cho tới khi bản tĩnh này được duyệt hoàn chỉnh.

---

## ⭐ Quy tắc quan trọng nhất

Website được **build ra HTML tĩnh** để tối ưu SEO (Google/Zalo/Bing đọc được đầy đủ, không phụ thuộc JavaScript).

| Muốn đổi gì | Sửa file nào | Rồi làm gì |
|-------------|--------------|-----------|
| SĐT, Zalo, email, địa chỉ (dùng nhiều nơi) | **`site.config.json`** | chạy `node build.js` |
| Nội dung / bố cục 1 trang | file trong **`src/`** | chạy `node build.js` |
| Redirect URL cũ (Google Sites) → URL mới | **`data/redirects.json`** | chạy `node build.js` |

> ⚠️ **KHÔNG sửa trực tiếp các file `.html` ở thư mục gốc** (index.html, 404.html, partials/…) — chúng là **file tự sinh**, mỗi lần chạy `node build.js` sẽ bị ghi đè.

## Quy tắc nội dung — BẮT BUỘC ĐỌC TRƯỚC KHI BUILD THÊM TRANG

Chủ shop yêu cầu **giữ nguyên 100% nội dung chữ + hình ảnh gốc** khi chuyển nền tảng — chỉ được nâng cấp giao diện, KHÔNG viết lại nội dung (trừ 2 ngoại lệ đã chốt, xem báo cáo khảo sát).

Trước khi build bất kỳ trang nào, đọc:
- `D:\AUTOMATION\projects\tinhocht\export\BAO-CAO-KHAO-SAT-GIAI-DOAN-1.md` — báo cáo khảo sát đầy đủ, mục 3-4 liệt kê trang "ngôi sao" tuyệt đối không đổi title/URL, và 2 ngoại lệ phạm vi (tổng đài loại bỏ, in bill link sang mucinht.com).
- `D:\AUTOMATION\projects\tinhocht\export\pages-crawl\*.json` — nội dung + ảnh gốc từng trang (163 trang), dùng làm nguồn khi build.
- `D:\AUTOMATION\projects\tinhocht\export\url-mapping-proposal.json` — đề xuất URL cũ → mới cho từng trang.
- `D:\AUTOMATION\projects\tinhocht\export\verbatim-recheck-needed.json` — danh sách trang cần đối chiếu trực tiếp với trang gốc (WebFetch có thể đã tóm lược, không phải nguyên văn 100%) trước khi coi là bản final.

## Cấu trúc

```
site.config.json     ← thông tin dùng chung (SĐT, Zalo, email, địa chỉ)
build.js             ← công cụ build: src/ + config → HTML tĩnh ở gốc
src/                 ← BẢN GỐC để sửa (chứa {{placeholder}})
  index.html
  404.html
  partials/{header,footer}.html
assets/              ← css, js, ảnh (không cần build)
data/
  redirects.json     ← URL cũ (Google Sites) → URL mới

index.html           ┐
404.html             │ ← FILE TỰ SINH (GitHub Pages phục vụ) — đừng sửa tay
partials/…           ┘
```

## Quy trình cập nhật

```bash
# 1. Sửa site.config.json hoặc file trong src/
# 2. Build ra HTML tĩnh
node build.js
# 3. Kiểm tra tại chỗ (mở index.html hoặc chạy web server tĩnh)
# 4. Commit & push để cập nhật GitHub Pages
git add -A
git commit -m "Cập nhật nội dung"
git push
```

## Placeholder đang dùng (khai báo trong `site.config.json`)

| Placeholder | Ý nghĩa | Ví dụ |
|-------------|---------|-------|
| `{{hotlineDisplay}}` | SĐT hiển thị | `0934 393 550` |
| `{{hotlineTel}}` | SĐT cho `tel:` | `0934393550` |
| `{{zaloDisplay}}` / `{{zaloTel}}` | Zalo | `089 886 9964` / `0898869964` |
| `{{email}}` | Email | `tinhocbts@gmail.com` |
| `{{addressFull}}` / `{{addressShort}}` / `{{addressStreet}}` | Địa chỉ | `79 Đường Bắc Hải, Phường 15, Quận 10, TP. Hồ Chí Minh` |

---

## Trạng thái hiện tại (khung dự án — giai đoạn chuẩn bị)
- [x] Repo + build tooling (mô phỏng `minhtiengithub`)
- [x] Trang chủ mẫu (nội dung giữ nguyên từ Google Sites)
- [ ] 8 trang "ngôi sao" (ưu tiên cao nhất — xem báo cáo khảo sát mục 3)
- [ ] ~155 trang còn lại theo pillar (nạp mực / reset / sửa máy in / sửa máy tính / thủ thuật / bán máy in cũ)
- [ ] `data/redirects.json` đầy đủ từ `url-mapping-proposal.json`
- [ ] Đối chiếu 21 trang trong `verbatim-recheck-needed.json`
- [ ] Duyệt demo → mới bàn bước trỏ domain thật (ngoài phạm vi hiện tại)

Lưu ý: chưa gắn tên miền thật (`CNAME`) — chỉ thêm khi đã được duyệt xong.
