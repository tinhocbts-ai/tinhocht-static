/* assets/js/nav.js — menu 2 cấp: desktop mở bằng hover/focus (CSS), mobile mở bằng nút ▾ */
(function () {
  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  ready(function () {
    var toggle = document.getElementById('navToggle');
    var nav = document.getElementById('mainNav');

    if (toggle && nav) {
      toggle.addEventListener('click', function () {
        var open = document.body.classList.toggle('nav-open');
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
      nav.querySelectorAll('a').forEach(function (a) {
        a.addEventListener('click', function () {
          document.body.classList.remove('nav-open');
          toggle.setAttribute('aria-expanded', 'false');
        });
      });
    }

    // Mobile: nút ▾ mở/đóng danh sách con (desktop dùng :hover trong CSS)
    document.querySelectorAll('.sub-toggle').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        var item = btn.closest('.nav-item');
        var wasOpen = item.classList.contains('open');
        item.parentNode.querySelectorAll('.nav-item.open').forEach(function (el) { el.classList.remove('open'); });
        if (!wasOpen) item.classList.add('open');
      });
    });

    // Đóng menu con khi bấm ra ngoài
    document.addEventListener('click', function (e) {
      if (!e.target.closest('.nav-item.has-sub')) {
        document.querySelectorAll('.nav-item.open').forEach(function (el) { el.classList.remove('open'); });
      }
    });

    // Esc: đóng tất cả
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      document.querySelectorAll('.nav-item.open').forEach(function (el) { el.classList.remove('open'); });
      document.body.classList.remove('nav-open');
      if (toggle) toggle.setAttribute('aria-expanded', 'false');
    });
  });
})();
