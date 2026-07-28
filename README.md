# tinhocht-static — bản tĩnh của tinhocht.com

Site tĩnh thay thế Google Sites, chạy trên GitHub Pages. **Chưa gắn domain thật** — bản demo tại
https://tinhocbts-ai.github.io/tinhocht-static/

## Nguyên tắc bất di bất dịch

1. **KHÔNG đổi slug URL.** Mọi trang giữ nguyên 100% đường dẫn gốc của Google Sites (kể cả dấu
   tiếng Việt `/liên-hệ`, chữ hoa `/Phan-mem-reset-may-in/`, dấu `---`). Site đang có traffic thật
   (~196k impressions/6 tháng) — đổi URL là mất ranking.
2. **Giữ nguyên văn nội dung + ảnh gốc.** Chỉ nâng cấp giao diện/CSS. Ngoại lệ đã chốt với chủ shop:
   - Số ngoài hệ thống `089 886 0052`, `098 131 9853` → gom về hotline `0934 393 550`.
   - Trang "nạp mực máy in bill" → chỉ giới thiệu ngắn + link sang mucinht.com.
   - Loại khỏi phạm vi: "dịch vụ mạng tổng đài" (đã nghỉ), "untitled page" (trang rác).

## Quy trình build

```bash
node tools/crawl-dom.js   # crawl nguyên văn 157 trang từ tinhocht.com + tải ảnh về assets/img/p/
node build-site.js        # dựng toàn bộ HTML tĩnh + menu 2 cấp + sitemap
node serve.js             # xem thử: http://localhost:8123
```

- `tools/crawl-dom.js` đọc thẳng HTML thật (Google Sites render server-side) → `export/pages-dom/*.json`.
  **Không dùng WebFetch** — nó tóm lược nội dung.
- `build-site.js` sinh mọi trang từ dữ liệu đó. Menu 2 cấp tự sinh theo cây URL thật.
- Trang chủ lấy từ `src/index.html` (có hero riêng), các trang còn lại render từ crawl.

## Khi gắn domain thật

```bash
NOINDEX=0 node build-site.js   # bỏ thẻ noindex (demo github.io đang bật để Google không index bản demo)
```
rồi thêm file `CNAME` chứa `tinhocht.com`, trỏ DNS về GitHub Pages.

## Cấu trúc

| Đường dẫn | Vai trò |
|---|---|
| `src/index.html` | Nguồn trang chủ (có hero) — sửa ở đây, không sửa `index.html` gốc |
| `site.config.json` | SĐT, địa chỉ dùng chung |
| `assets/img/p/` | Ảnh gốc đã tải về, tự host (dedupe theo URL, map trong `data/images.json`) |
| `tools/crawl-dom.js` | Crawler nguyên văn |
| `build-site.js` | Bộ dựng site |
| `serve.js` | Server xem thử cục bộ |

Dữ liệu khảo sát/GSC nằm ở `D:\AUTOMATION\projects\tinhocht\export\` và **không đưa lên repo public**.
