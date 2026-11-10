/* RAW VISION · shared behaviour: bar, lightbox (photos + videos), reel loops */
(function () {
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- bar ---- */
  var bar = document.getElementById('bar'), menuBtn = document.getElementById('menuBtn');
  if (menuBtn) {
    menuBtn.addEventListener('click', function () { var o = bar.classList.toggle('is-open'); menuBtn.setAttribute('aria-expanded', o); });
    document.querySelectorAll('#menu a').forEach(function (a) { a.addEventListener('click', function () { bar.classList.remove('is-open'); menuBtn.setAttribute('aria-expanded', 'false'); }); });
  }
  // Scroll-spy: any [data-spy] list of #anchors. A chapter runs from its anchor to the next one.
  var spies = [].map.call(document.querySelectorAll('[data-spy]'), function (list) {
    var links = [].slice.call(list.querySelectorAll('a[href^="#"]'));
    return { el: list, links: links, targets: links.map(function (a) { return document.querySelector(a.getAttribute('href')); }) };
  });
  var fill = document.getElementById('railFill');
  function onScroll() {
    if (bar && !bar.classList.contains('bar--solid')) bar.classList.toggle('is-solid', scrollY > innerHeight * 0.5);
    var mid = innerHeight * 0.45;
    spies.forEach(function (sp) {
      var on = -1;
      sp.targets.forEach(function (t, n) { if (t && t.getBoundingClientRect().top <= mid) on = n; });
      sp.links.forEach(function (a, n) { if (n === on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
      sp.el.classList.toggle('is-live', on >= (sp.el.classList.contains('rail') ? 1 : 0));
    });
    if (fill) { var max = document.documentElement.scrollHeight - innerHeight; fill.style.transform = 'scaleY(' + Math.min(1, Math.max(0, scrollY / max)) + ')'; }
  }
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* ---- lightbox ---- */
  var lb = document.getElementById('lb');
  if (lb) {
    var stage = lb.querySelector('.lb__stage'), lbImg = document.getElementById('lbImg'), lbTitle = document.getElementById('lbTitle'), lbCount = document.getElementById('lbCount');
    var list = [], pos = 0, opener = null, vid = null;
    var show = function (n) {
      pos = (n + list.length) % list.length; var a = list[pos];
      lbImg.src = a.getAttribute('href'); lbImg.alt = a.getAttribute('data-title');
      lbTitle.textContent = a.getAttribute('data-title'); lbCount.textContent = (pos + 1) + ' / ' + list.length;
      var nx = list[(pos + 1) % list.length]; if (nx) { var im = new Image(); im.src = nx.getAttribute('href'); }
    };
    var openVideo = function (src, title, poster) {
      lb.classList.add('lb--video'); lbImg.hidden = true;
      vid = document.createElement('video'); vid.controls = true; vid.playsInline = true; vid.autoplay = true; vid.src = src; if (poster) vid.poster = poster;
      stage.insertBefore(vid, stage.firstChild);
      lbTitle.textContent = title; lbCount.textContent = '';
      document.querySelectorAll('video[data-loop]').forEach(function (v) { v.pause(); });
      lb.showModal(); vid.play().catch(function () {});
    };
    document.querySelectorAll('[data-gallery]').forEach(function (g) {
      g.addEventListener('click', function (e) {
        var a = e.target.closest('.tile__link'); if (!a) return;
        e.preventDefault(); opener = a; lb.classList.remove('lb--video'); lbImg.hidden = false;
        list = [].filter.call(g.querySelectorAll('.tile__link'), function (x) { return x.offsetParent !== null; });
        show(list.indexOf(a)); lb.showModal();
      });
    });
    document.querySelectorAll('[data-video]').forEach(function (b) {
      b.addEventListener('click', function () { opener = b; openVideo(b.getAttribute('data-video'), b.getAttribute('data-title'), b.getAttribute('data-poster')); });
    });
    document.getElementById('lbPrev').onclick = function () { show(pos - 1); };
    document.getElementById('lbNext').onclick = function () { show(pos + 1); };
    document.getElementById('lbClose').onclick = function () { lb.close(); };
    lb.addEventListener('close', function () {
      if (vid) { vid.pause(); vid.remove(); vid = null; }
      if (opener) opener.focus({ preventScroll: true });
      watch();
    });
    lb.addEventListener('keydown', function (e) { if (lb.classList.contains('lb--video')) return; if (e.key === 'ArrowLeft') show(pos - 1); if (e.key === 'ArrowRight') show(pos + 1); });
    lb.addEventListener('click', function (e) { if (e.target === lb || e.target === stage) lb.close(); });
    var tx = null;
    lb.addEventListener('touchstart', function (e) { tx = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', function (e) { if (tx === null || lb.classList.contains('lb--video')) return; var dx = e.changedTouches[0].clientX - tx; if (Math.abs(dx) > 50) show(pos + (dx < 0 ? 1 : -1)); tx = null; });
  }

  /* ---- reel loops: load and play only while on screen, never under reduced motion ---- */
  var loops = [].slice.call(document.querySelectorAll('video[data-loop]'));
  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      var v = en.target;
      if (en.isIntersecting && !reduce && !(lb && lb.open)) {
        if (!v.src) { v.src = v.getAttribute('data-loop'); }
        v.play().catch(function () {});
      } else { v.pause(); }
    });
  }, { threshold: 0.25 }) : null;
  function watch() { if (io) loops.forEach(function (v) { io.unobserve(v); io.observe(v); }); }
  watch();

  /* ---- hero sound toggle ---- */
  var hv = document.getElementById('heroV'), snd = document.getElementById('heroSound');
  if (hv && snd) {
    if (reduce) { hv.removeAttribute('autoplay'); hv.pause(); snd.querySelector('span').textContent = 'Guarda con audio'; }
    snd.addEventListener('click', function () {
      if (hv.paused) { hv.muted = false; hv.play(); }
      else hv.muted = !hv.muted;
      snd.setAttribute('aria-pressed', String(!hv.muted));
      snd.querySelector('span').textContent = hv.muted ? 'Attiva audio' : 'Disattiva audio';
    });
  }

  /* ---- gallery page tabs ---- */
  var tabs = [].slice.call(document.querySelectorAll('[data-tab]'));
  if (tabs.length) {
    var grid = document.getElementById('allGrid');
    var showSet = function (name, push) {
      if (!tabs.some(function (b) { return b.getAttribute('data-tab') === name; })) name = tabs[0].getAttribute('data-tab');
      tabs.forEach(function (b) { b.setAttribute('aria-selected', b.getAttribute('data-tab') === name); });
      grid.querySelectorAll('.tile').forEach(function (t) { t.hidden = t.getAttribute('data-set') !== name; });
      if (push) history.replaceState(null, '', '#' + name);
    };
    tabs.forEach(function (b) { b.addEventListener('click', function () { showSet(b.getAttribute('data-tab'), true); }); });
    showSet((location.hash || '').slice(1), false);
  }
})();
