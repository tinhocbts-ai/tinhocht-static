/* tools/schema.js — Sinh dữ liệu có cấu trúc (JSON-LD) cho từng trang.
 *
 * Vì sao cần: Google Sites không cho chèn schema. Đây là thứ Google và các trợ lý AI
 * (AI Overview, ChatGPT…) đọc để hiểu shop bán gì, ở đâu, giá bao nhiêu, bài viết hướng dẫn
 * gồm những bước nào — thay vì phải đoán từ chữ trong bài.
 *
 * NGUYÊN TẮC: chỉ khai báo thứ THỰC SỰ hiển thị trên trang. Khai khống (giá không có,
 * hỏi-đáp không tồn tại, đánh giá sao tự chế) là vi phạm chính sách và bị phạt.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const biz = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'business.json'), 'utf8'));
const gia = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'bang-gia.json'), 'utf8'));
const DIA_BAN = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'quan-dia-ban.json'), 'utf8'));

/* Giá trong bảng ghi dạng "90.000đ" — lấy ra số để khai báo cho đúng kiểu dữ liệu */
const soGia = s => Number(String(s).replace(/[^\d]/g, '')) || 0;
const mocGia = g => g.nhom.map(x => soGia(x.gia)).filter(Boolean);
const giaThapNhat = g => Math.min(...mocGia(g));
const giaCaoNhat = g => Math.max(...mocGia(g));

const ORG_ID = url => url + '/#business';
const SITE_ID = url => url + '/#website';

/* ---------- các mảnh dùng lại ---------- */
function localBusiness(SITE_URL) {
  return {
    '@type': ['LocalBusiness', 'ComputerStore'],
    '@id': ORG_ID(SITE_URL),
    name: biz.name,
    legalName: biz.legalName,
    taxID: biz.taxID,
    description: biz.description,
    url: SITE_URL + '/',
    telephone: '+84934393550',
    address: {
      '@type': 'PostalAddress',
      streetAddress: biz.street,
      addressLocality: biz.district,
      addressRegion: biz.city,
      postalCode: biz.postalCode,
      addressCountry: biz.countryCode,
    },
    geo: { '@type': 'GeoCoordinates', latitude: biz.latitude, longitude: biz.longitude },
    hasMap: biz.mapUrl,
    sameAs: biz.sameAs,
    openingHoursSpecification: [{
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      opens: '08:00', closes: '19:00',
    }],
    priceRange: biz.priceRangeText,
    areaServed: biz.areaServed.map(a => ({ '@type': 'AdministrativeArea', name: a })),
    makesOffer: gia.nhom.map(g => ({
      '@type': 'Offer',
      itemOffered: { '@type': 'Service', name: 'Nạp mực máy in ' + g.hang + ' — ' + g.loai },
      price: g.gia.replace(/\./g, ''),
      priceCurrency: 'VND',
    })),
  };
}

function breadcrumb(SITE_URL, crumbs) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem', position: i + 1, name: c.name,
      item: c.url ? SITE_URL + c.url : undefined,
    })),
  };
}

/* ---------- nhận dạng loại trang từ chính nội dung ---------- */
const isGuide = p => /huong-dan|hướng-dẫn|reset|cach-|cách-|sua-loi|sửa-lỗi|thu-thuat|thủ-thuật/i.test(p);
const isService = p => /^home\/|sua-may-in-tai-hcm|sua-may-tinh-tan-noi|ban-may-in-cu/i.test(p);

/* Các bước "Bước 1: …" trong bài hướng dẫn */
function extractSteps(blocks) {
  const steps = [];
  for (const b of blocks) {
    const t = (b.text || '').trim();
    const m = t.match(/^(?:bước|buoc)\s*(\d+)\s*[:.\-–]?\s*(.+)$/i);
    if (m && m[2].length > 3) steps.push({ n: +m[1], text: m[2].trim() });
  }
  return steps.length >= 2 ? steps : null;
}

/* Cặp hỏi–đáp thật sự hiển thị: heading kết thúc bằng "?" + đoạn văn ngay sau */
function extractFaq(blocks) {
  const faq = [];
  for (let i = 0; i < blocks.length - 1; i++) {
    const b = blocks[i];
    if (!/^h[2-4]$/.test(b.t)) continue;
    const q = (b.text || '').trim();
    if (!/\?\s*$/.test(q) || q.length < 12) continue;
    const ans = [];
    for (let j = i + 1; j < blocks.length && ans.length < 3; j++) {
      const nb = blocks[j];
      if (/^h[1-4]$/.test(nb.t)) break;
      if ((nb.t === 'p' || nb.t === 'li') && (nb.text || '').length > 25) ans.push(nb.text.trim());
    }
    if (ans.length) faq.push({ q: q.replace(/\s*\?+\s*$/, ' ?'), a: ans.join(' ') });
  }
  return faq.length >= 2 ? faq : null;
}

/* ---------- API chính ---------- */
function buildSchema(opts) {
  const { SITE_URL, page, crumbs, title, description, imageUrl } = opts;
  const url = SITE_URL + '/' + page.path.split('/').map(encodeURIComponent).join('/') + '/';
  const graph = [];

  // 1) Trang chủ: hồ sơ doanh nghiệp + website
  if (!page.path) {
    graph.push(localBusiness(SITE_URL));
    graph.push({
      '@type': 'WebSite', '@id': SITE_ID(SITE_URL), url: SITE_URL + '/',
      name: biz.name, publisher: { '@id': ORG_ID(SITE_URL) }, inLanguage: 'vi-VN',
    });
  } else {
    graph.push({ '@type': 'WebPage', '@id': url + '#page', url, name: title,
      description, isPartOf: { '@id': SITE_ID(SITE_URL) }, inLanguage: 'vi-VN',
      publisher: { '@id': ORG_ID(SITE_URL) } });
  }

  // 2) Đường dẫn phân cấp — hiện ngay dưới tiêu đề trong kết quả tìm kiếm
  if (crumbs && crumbs.length > 1) graph.push(breadcrumb(SITE_URL, crumbs));

  // 3) Bài hướng dẫn có các bước rõ ràng
  const steps = isGuide(page.path) ? extractSteps(page.blocks || []) : null;
  if (steps) {
    graph.push({
      '@type': 'HowTo', name: title, description, inLanguage: 'vi-VN',
      image: imageUrl || undefined,
      step: steps.map((s, i) => ({
        '@type': 'HowToStep', position: i + 1,
        name: s.text.length > 70 ? s.text.slice(0, 68) + '…' : s.text,
        text: s.text, url: url + '#buoc-' + s.n,
      })),
      publisher: { '@id': ORG_ID(SITE_URL) },
    });
  } else if (isGuide(page.path) && page.path) {
    graph.push({
      '@type': 'Article', headline: title.slice(0, 110), description,
      image: imageUrl || undefined, inLanguage: 'vi-VN',
      author: { '@id': ORG_ID(SITE_URL) }, publisher: { '@id': ORG_ID(SITE_URL) },
      mainEntityOfPage: { '@id': url + '#page' },
    });
  }

  // 4) Trang dịch vụ theo khu vực
  if (isService(page.path)) {
    /* Khớp tên quận theo BIÊN từ, nếu không "quan-1" sẽ khớp nhầm cả "quan-10", "quan-11", "quan-12" */
    const slug = page.path.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd');
    const khuVuc = biz.areaServed.find(a => {
      const k = a.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd')
        .replace(/^(quan|thanh pho)\s+/, '').trim().replace(/\s+/g, '-');
      return new RegExp('(^|[-/])(quan-)?' + k + '([-/]|$)').test(slug);
    });
    graph.push({
      '@type': 'Service', name: title,
      serviceType: /sua-may-tinh/.test(page.path) ? 'Sửa máy tính tại nhà'
        : /sua-may-in|ban-may-in/.test(page.path) ? 'Sửa chữa máy in' : 'Nạp mực máy in tận nơi',
      description, provider: { '@id': ORG_ID(SITE_URL) },
      areaServed: khuVuc
        ? { '@type': 'AdministrativeArea', name: khuVuc + ', TP.HCM' }
        : { '@type': 'City', name: 'Thành phố Hồ Chí Minh' },
      availableChannel: {
        '@type': 'ServiceChannel', servicePhone: '+84934393550', serviceUrl: url,
      },
    });

    /* Trang dịch vụ theo quận: nói rõ vùng phục vụ bằng toạ độ và mức giá khởi điểm.
       Toạ độ giúp phân biệt trang quận này với quận kia — nếu không thì mọi trang đều
       chỉ mang một địa chỉ cửa hàng duy nhất. Giá khởi điểm là thứ khách hỏi nhiều nhất
       và cũng là dữ liệu Google trích ra để trả lời trực tiếp trên trang kết quả. */
    const db = Object.entries(DIA_BAN).find(([k]) =>
      k !== '_help' && new RegExp('(^|[-/])' + k + '([-/]|$)').test(slug));
    if (db) {
      const d = db[1];
      const svc = graph[graph.length - 1];
      svc.areaServed = {
        '@type': 'AdministrativeArea', name: d.ten + ', TP.HCM',
        geo: {
          '@type': 'GeoCircle',
          geoMidpoint: { '@type': 'GeoCoordinates', latitude: d.lat, longitude: d.lon },
          geoRadius: 3000,
        },
      };
      /* Chỉ khai giá ở trang thật sự in bảng giá ra màn hình. Trang sửa máy in và sửa máy
         tính theo quận cũng khớp tên quận nhưng không có bảng giá nào — khai giá ở đó là
         khai khống, đúng thứ mục NGUYÊN TẮC đầu file này cấm. */
      if (page.coBangGia) svc.offers = {
        '@type': 'Offer', priceCurrency: 'VND', price: giaThapNhat(gia),
        priceSpecification: {
          '@type': 'PriceSpecification', priceCurrency: 'VND',
          minPrice: giaThapNhat(gia), maxPrice: giaCaoNhat(gia),
          valueAddedTaxIncluded: false,
        },
        availability: 'https://schema.org/InStock',
        areaServed: { '@type': 'AdministrativeArea', name: d.ten + ', TP.HCM' },
        description: 'Giá đã gồm công đến tận nơi trong ' + d.ten + ', không phụ thu phí đi lại.',
      };
    }
  }

  // 5) Bảng giá — danh mục dịch vụ kèm giá
  if (page.path === 'bang-gia-nap-muc-may-in-tan-noi') {
    graph.push({
      '@type': 'OfferCatalog', name: 'Bảng giá nạp mực máy in tận nơi TP.HCM',
      url, provider: { '@id': ORG_ID(SITE_URL) },
      itemListElement: gia.nhom.map((g, i) => ({
        '@type': 'Offer', position: i + 1,
        name: 'Nạp mực máy in ' + g.hang + ' (' + g.loai + ')',
        price: g.gia.replace(/\./g, ''), priceCurrency: 'VND',
        itemOffered: { '@type': 'Service', name: 'Nạp mực máy in ' + g.hang,
          description: g.models.slice(0, 6).join(', ') },
        areaServed: { '@type': 'City', name: 'Thành phố Hồ Chí Minh' },
      })),
    });
  }

  // 6) Hỏi–đáp (chỉ khi trang thật sự có cặp hỏi–đáp hiển thị)
  const faq = extractFaq(page.blocks || []);
  if (faq) {
    graph.push({
      '@type': 'FAQPage', mainEntity: faq.slice(0, 8).map(f => ({
        '@type': 'Question', name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a.slice(0, 900) },
      })),
    });
  }

  return JSON.stringify({ '@context': 'https://schema.org', '@graph': graph },
    (k, v) => v === undefined ? undefined : v);
}

module.exports = { buildSchema };
