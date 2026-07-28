/* assets/js/include.js
   Fetches shared header/footer partials, rewrites their internal links so the
   site works correctly both at the domain root and nested one folder deep,
   wires up the mobile hamburger menu. */
(function () {
  var NESTED_PAGES = ['nap-muc-may-in', 'phan-mem-reset-may-in', 'sua-may-in', 'sua-may-tinh', 'ban-may-in-cu', 'thu-thuat', 'lien-he', 'bang-gia'];

  function computeDepth() {
    var parts = window.location.pathname.split('/').filter(Boolean);
    if (parts.length && parts[parts.length - 1] === 'index.html') parts.pop();
    for (var i = parts.length - 1; i >= 0; i--) {
      if (NESTED_PAGES.indexOf(parts[i]) !== -1) return parts.length - i;
    }
    return 0;
  }

  var depth = computeDepth();
  var prefix = new Array(depth + 1).join('../');

  function applyPrefix(root) {
    root.querySelectorAll('[data-href]').forEach(function (el) {
      el.setAttribute('href', prefix + el.getAttribute('data-href'));
    });
    root.querySelectorAll('[data-src]').forEach(function (el) {
      el.setAttribute('src', prefix + el.getAttribute('data-src'));
    });
  }

  function currentKey() {
    var parts = window.location.pathname.split('/').filter(Boolean);
    if (parts.length && parts[parts.length - 1] === 'index.html') parts.pop();
    for (var i = parts.length - 1; i >= 0; i--) {
      if (NESTED_PAGES.indexOf(parts[i]) !== -1) return parts[i] + '/';
    }
    return 'index.html';
  }

  function markActive(root) {
    var key = currentKey();
    root.querySelectorAll('.main-nav a[data-href]').forEach(function (a) {
      if (a.getAttribute('data-href') === key) {
        a.classList.add('active');
        a.setAttribute('aria-current', 'page');
      }
    });
  }

  function setupMobileNav() {
    var toggle = document.getElementById('navToggle');
    var nav = document.getElementById('mainNav');
    if (!toggle || !nav) return;
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

  function include(id, file, cb) {
    fetch(prefix + file)
      .then(function (r) { return r.text(); })
      .then(function (html) {
        var el = document.getElementById(id);
        if (!el) return;
        el.innerHTML = html;
        applyPrefix(el);
        if (cb) cb(el);
      })
      .catch(function (e) { console.error('include() failed for', file, e); });
  }

  document.addEventListener('DOMContentLoaded', function () {
    include('site-header', 'partials/header.html', function (el) {
      markActive(el);
      setupMobileNav();
    });
    include('site-footer', 'partials/footer.html', function (el) {
      markActive(el);
    });
  });
})();
