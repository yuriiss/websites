/* ==========================================================================
   Maritime.Studio — Liquid UI runtime
   - liquid page transitions (fetch + swap <main>, SVG wave veil)
   - WebGL ocean behind heroes
   - reveal-on-scroll, counters, pointer light, magnetic buttons
   - nav liquid pill, dropdowns, mobile menu
   - filters, forms, glossary search, article view
   Everything degrades to plain multi-page navigation without JS,
   and to instant, static states under prefers-reduced-motion / Calm mode.
   ========================================================================== */
(function () {
  'use strict';

  var root = document.documentElement;
  root.classList.add('js');

  var mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var calm = false;
  try { calm = localStorage.getItem('ms-calm') === '1'; } catch (e) { /* storage blocked */ }
  function reduced() { return mqReduce.matches || calm; }
  root.classList.toggle('reduce-motion', calm);

  var isFile = location.protocol === 'file:';
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var cleanups = [];
  function onCleanup(fn) { cleanups.push(fn); }

  /* ------------------------------------------------------------------
     Helpers
     ------------------------------------------------------------------ */
  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
  function easeInOut(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
  function normPath(p) {
    p = p.replace(/index\.html$/, '');
    if (p.length > 1 && p.charAt(p.length - 1) !== '/') p += '/';
    return p;
  }
  function tween(duration, step) {
    return new Promise(function (resolve) {
      var start = performance.now();
      function frame(now) {
        var t = clamp((now - start) / duration, 0, 1);
        step(t);
        if (t < 1) requestAnimationFrame(frame); else resolve();
      }
      requestAnimationFrame(frame);
    });
  }

  /* When opened straight from disk, directory links need an explicit index.html */
  function fixFileLinks(ctx) {
    if (!isFile) return;
    $$('a[href]', ctx).forEach(function (a) {
      var href = a.getAttribute('href');
      if (/^(https?:|mailto:|tel:|#)/.test(href)) return;
      var parts = href.split('#');
      var base = parts[0];
      var q = '';
      if (base.indexOf('?') > -1) { q = base.slice(base.indexOf('?')); base = base.slice(0, base.indexOf('?')); }
      if (base === '' || base.charAt(base.length - 1) === '/') {
        a.setAttribute('href', base + 'index.html' + q + (parts[1] !== undefined ? '#' + parts[1] : ''));
      }
    });
  }

  /* ------------------------------------------------------------------
     Header: scrolled state, hide on fast scroll down
     ------------------------------------------------------------------ */
  var header = $('.site-header');
  var lastY = window.scrollY;
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      var y = window.scrollY;
      header.classList.toggle('is-scrolled', y > 24);
      var menuOpen = document.body.classList.contains('menu-open') || $('.dropdown.is-open');
      header.classList.toggle('is-hidden', !menuOpen && y > 480 && y > lastY + 4);
      if (y < lastY - 4) header.classList.remove('is-hidden');
      lastY = y;
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ------------------------------------------------------------------
     Navigation: current page, liquid pill, dropdowns
     ------------------------------------------------------------------ */
  var nav = $('.nav');
  var blob = $('.nav-blob');

  function setActiveNav() {
    var here = normPath(location.pathname);
    $$('[data-nav-link]').forEach(function (a) {
      var target = normPath(new URL(a.href, location.href).pathname);
      var isHome = a.hasAttribute('data-home');
      var match = isHome ? here === target : (here === target || (a.hasAttribute('data-prefix') && here.indexOf(target) === 0));
      if (match) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    $$('.nav-item[data-has-menu]').forEach(function (item) {
      var btn = $('.nav-link', item);
      btn.classList.toggle('is-current', !!$('[aria-current="page"]', item));
    });
    moveBlob(currentNavEl(), true);
  }

  function currentNavEl() {
    if (!nav) return null;
    var cur = $('.nav > .nav-item > .nav-link[aria-current="page"], .nav > .nav-item > .nav-link.is-current', nav);
    return cur;
  }

  function moveBlob(el, instant) {
    if (!blob || !nav) return;
    if (!el) { blob.style.opacity = '0'; return; }
    var nr = nav.getBoundingClientRect();
    var r = el.getBoundingClientRect();
    if (instant) blob.style.transition = 'none';
    blob.style.width = r.width + 'px';
    blob.style.transform = 'translateX(' + (r.left - nr.left) + 'px)';
    blob.style.opacity = '1';
    if (instant) { void blob.offsetWidth; blob.style.transition = ''; }
  }

  if (nav) {
    nav.addEventListener('pointerover', function (e) {
      var link = e.target.closest('.nav > .nav-item > .nav-link');
      if (link) moveBlob(link);
    });
    nav.addEventListener('pointerleave', function () { moveBlob(currentNavEl()); });
    nav.addEventListener('focusin', function (e) {
      var link = e.target.closest('.nav > .nav-item > .nav-link');
      if (link) moveBlob(link);
    });
    window.addEventListener('resize', function () { moveBlob(currentNavEl(), true); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { moveBlob(currentNavEl(), true); });
  }

  var openDropdown = null;
  var hoverTimer = null;
  function setDropdown(item, open) {
    var btn = $('.nav-link', item);
    var menu = $('.dropdown', item);
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    menu.classList.toggle('is-open', open);
    if (open) {
      if (openDropdown && openDropdown !== item) setDropdown(openDropdown, false);
      openDropdown = item;
    } else if (openDropdown === item) {
      openDropdown = null;
    }
  }
  function closeDropdowns() { if (openDropdown) setDropdown(openDropdown, false); }

  $$('.nav-item[data-has-menu]').forEach(function (item) {
    var btn = $('.nav-link', item);
    btn.addEventListener('click', function () {
      setDropdown(item, btn.getAttribute('aria-expanded') !== 'true');
    });
    if (finePointer) {
      item.addEventListener('pointerenter', function () { clearTimeout(hoverTimer); setDropdown(item, true); });
      item.addEventListener('pointerleave', function () {
        clearTimeout(hoverTimer);
        hoverTimer = setTimeout(function () { setDropdown(item, false); }, 220);
      });
    }
    item.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { setDropdown(item, false); btn.focus(); }
      if (e.key === 'ArrowDown' && document.activeElement === btn) {
        e.preventDefault(); setDropdown(item, true);
        var first = $('.dropdown a', item); if (first) first.focus();
      }
    });
    item.addEventListener('focusout', function (e) {
      if (!item.contains(e.relatedTarget)) setDropdown(item, false);
    });
  });
  document.addEventListener('click', function (e) {
    if (openDropdown && !openDropdown.contains(e.target)) closeDropdowns();
  });

  /* Mobile menu */
  var toggle = $('.nav-toggle');
  var mobile = $('.mobile-menu');
  function setMenu(open) {
    if (!toggle || !mobile) return;
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    mobile.classList.toggle('is-open', open);
    document.body.classList.toggle('menu-open', open);
    document.body.style.overflow = open ? 'hidden' : '';
    $$('a', mobile).forEach(function (a, i) {
      a.style.transitionDelay = open && !reduced() ? (0.18 + i * 0.03) + 's' : '0s';
    });
    if (open) {
      var first = $('a', mobile);
      if (first) setTimeout(function () { first.focus(); }, reduced() ? 0 : 300);
    }
  }
  if (toggle) {
    toggle.addEventListener('click', function () { setMenu(toggle.getAttribute('aria-expanded') !== 'true'); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && mobile.classList.contains('is-open')) { setMenu(false); toggle.focus(); }
    });
    window.addEventListener('resize', function () { if (window.innerWidth > 1180) setMenu(false); });
  }

  /* ------------------------------------------------------------------
     Pointer light on glass cards + magnetic buttons (delegated)
     ------------------------------------------------------------------ */
  var magnet = null;
  if (finePointer) {
    document.addEventListener('pointermove', function (e) {
      var card = e.target.closest && e.target.closest('.glass');
      if (card) {
        var r = card.getBoundingClientRect();
        card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        card.style.setProperty('--my', (e.clientY - r.top) + 'px');
      }
      var btn = e.target.closest && e.target.closest('.btn');
      if (magnet && magnet !== btn) releaseMagnet();
      if (btn) {
        var b = btn.getBoundingClientRect();
        var dx = e.clientX - (b.left + b.width / 2);
        var dy = e.clientY - (b.top + b.height / 2);
        btn.style.setProperty('--px', (e.clientX - b.left) + 'px');
        btn.style.setProperty('--py', (e.clientY - b.top) + 'px');
        if (!reduced()) {
          btn.style.setProperty('--tx', (dx * 0.18).toFixed(1) + 'px');
          btn.style.setProperty('--ty', (dy * 0.28).toFixed(1) + 'px');
        }
        magnet = btn;
      }
    }, { passive: true });
  }
  function releaseMagnet() {
    if (!magnet) return;
    magnet.style.setProperty('--tx', '0px');
    magnet.style.setProperty('--ty', '0px');
    magnet = null;
  }

  /* ------------------------------------------------------------------
     Calm mode toggle (site-level reduced motion)
     ------------------------------------------------------------------ */
  function syncCalmButtons() {
    $$('[data-calm-toggle]').forEach(function (b) {
      b.setAttribute('aria-pressed', calm ? 'true' : 'false');
      var label = $('[data-calm-label]', b);
      if (label) label.textContent = calm ? 'Calm mode: on' : 'Calm mode: off';
    });
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-calm-toggle]');
    if (!b) return;
    calm = !calm;
    try { localStorage.setItem('ms-calm', calm ? '1' : '0'); } catch (err) { /* ignore */ }
    root.classList.toggle('reduce-motion', calm);
    syncCalmButtons();
    unmountPage();
    mountPage();
  });

  /* ------------------------------------------------------------------
     WebGL ocean
     ------------------------------------------------------------------ */
  var VERT = 'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}';
  var FRAG = [
    'precision mediump float;',
    'uniform vec2 u_res;uniform float u_time;uniform vec2 u_mouse;uniform float u_int;uniform float u_ripple;',
    'float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}',
    'float noise(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.-2.*f);',
    'return mix(mix(hash(i),hash(i+vec2(1.,0.)),u.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),u.x),u.y);}',
    'float fbm(vec2 p){float v=0.,a=.5;mat2 m=mat2(1.6,1.2,-1.2,1.6);for(int i=0;i<5;i++){v+=a*noise(p);p=m*p;a*=.5;}return v;}',
    'void main(){',
    ' vec2 uv=gl_FragCoord.xy/u_res;float asp=u_res.x/u_res.y;vec2 p=vec2(uv.x*asp,uv.y);',
    ' vec2 m=vec2(u_mouse.x*asp,u_mouse.y);float md=distance(p,m);',
    ' float t=u_time*.035;',
    ' vec2 q=vec2(fbm(p*1.5+vec2(0.,t)),fbm(p*1.5+vec2(5.2,1.3)-t));',
    ' vec2 r=vec2(fbm(p*1.5+3.4*q+vec2(1.7,9.2)+t*1.3),fbm(p*1.5+3.4*q+vec2(8.3,2.8)-t*1.1));',
    ' r+=u_ripple*.16*exp(-md*3.5)*vec2(sin(u_time*1.4-md*16.));',
    ' float f=fbm(p*1.5+4.*r);',
    ' vec3 abyss=vec3(.024,.110,.173);vec3 ink=vec3(.039,.255,.455);vec3 lagoon=vec3(.306,.557,.635);',
    ' vec3 sky=vec3(.482,.741,.910);vec3 sand=vec3(.851,.706,.541);',
    ' vec3 col=mix(abyss,ink,clamp(f*f*2.1,0.,1.));',
    ' col=mix(col,lagoon,clamp(length(q)*.6-.2,0.,1.)*.5);',
    ' col=mix(col,sky,clamp(pow(r.x,3.)*1.5,0.,1.)*.42);',
    ' col+=sand*pow(clamp((f-.6)*2.7,0.,1.),3.)*.55;',
    ' col+=sky*.09*exp(-md*5.)*u_ripple;',
    ' col*=.62+.48*uv.y;',
    ' col=mix(abyss,col,u_int);',
    ' gl_FragColor=vec4(col,1.);',
    '}'
  ].join('\n');

  function initOcean(host) {
    var canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    var gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power', preserveDrawingBuffer: false });
    if (!gl) return;
    function sh(type, src) {
      var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
      return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
    }
    var vs = sh(gl.VERTEX_SHADER, VERT), fs = sh(gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return;
    var prog = gl.createProgram();
    gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);
    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(prog, 'a');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    var uRes = gl.getUniformLocation(prog, 'u_res');
    var uTime = gl.getUniformLocation(prog, 'u_time');
    var uMouse = gl.getUniformLocation(prog, 'u_mouse');
    var uInt = gl.getUniformLocation(prog, 'u_int');
    var uRip = gl.getUniformLocation(prog, 'u_ripple');
    host.appendChild(canvas);

    var intensity = parseFloat(host.getAttribute('data-intensity') || '1');
    var scale = Math.min(window.devicePixelRatio || 1, 1.5) * (window.innerWidth < 700 ? 0.45 : 0.55);
    var mouse = { x: 0.7, y: 0.6, tx: 0.7, ty: 0.6 };
    var ripple = 0, rippleT = 0;
    var running = false, visible = true, raf = 0;
    var t0 = performance.now() - 20000 * Math.random();

    function resize() {
      var w = Math.max(1, Math.floor(host.clientWidth * scale));
      var h = Math.max(1, Math.floor(host.clientHeight * scale));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w; canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
    }
    function draw(now) {
      resize();
      mouse.x += (mouse.tx - mouse.x) * 0.04;
      mouse.y += (mouse.ty - mouse.y) * 0.04;
      ripple += (rippleT - ripple) * 0.05;
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, (now - t0) / 1000);
      gl.uniform2f(uMouse, mouse.x, mouse.y);
      gl.uniform1f(uInt, intensity);
      gl.uniform1f(uRip, ripple);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    function loop(now) {
      draw(now);
      raf = requestAnimationFrame(loop);
    }
    function start() { if (!running && visible && !document.hidden) { running = true; raf = requestAnimationFrame(loop); } }
    function stop() { running = false; cancelAnimationFrame(raf); }

    function onMove(e) {
      var r = host.getBoundingClientRect();
      mouse.tx = clamp((e.clientX - r.left) / r.width, 0, 1);
      mouse.ty = 1 - clamp((e.clientY - r.top) / r.height, 0, 1);
      rippleT = 1;
    }
    function onLeave() { rippleT = 0; }
    function onVis() { if (document.hidden) stop(); else start(); }

    if (reduced()) {
      draw(t0 + 24000);
      canvas.classList.add('is-ready');
    } else {
      var io = new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        if (visible) start(); else stop();
      });
      io.observe(host);
      var hero = host.parentElement;
      hero.addEventListener('pointermove', onMove, { passive: true });
      hero.addEventListener('pointerleave', onLeave);
      document.addEventListener('visibilitychange', onVis);
      start();
      requestAnimationFrame(function () { canvas.classList.add('is-ready'); });
      onCleanup(function () {
        io.disconnect();
        hero.removeEventListener('pointermove', onMove);
        hero.removeEventListener('pointerleave', onLeave);
        document.removeEventListener('visibilitychange', onVis);
      });
    }
    onCleanup(function () {
      stop();
      var lose = gl.getExtension('WEBGL_lose_context');
      if (lose) lose.loseContext();
      canvas.remove();
    });
  }

  /* ------------------------------------------------------------------
     Reveal on scroll + counters + gauges
     ------------------------------------------------------------------ */
  function animateCount(el) {
    var target = parseFloat(el.getAttribute('data-count'));
    var suffix = el.getAttribute('data-suffix') || '';
    var prefix = el.getAttribute('data-prefix') || '';
    if (reduced()) { el.textContent = prefix + target + suffix; return; }
    var dur = 1800;
    tween(dur, function (t) {
      el.textContent = prefix + Math.round(target * easeOut(t)) + suffix;
    });
  }

  function prepGauge(g) {
    var fill = $('.gauge-fill', g);
    if (!fill || !fill.getTotalLength) return;
    var len = fill.getTotalLength();
    var val = parseFloat(g.getAttribute('data-value') || '0') / 100;
    fill.style.setProperty('--len', len.toFixed(1));
    fill.style.setProperty('--off', (len * (1 - val)).toFixed(1));
  }

  function initReveal(ctx) {
    var items = $$('[data-reveal], [data-count], .stat, .gauge, .split-line', ctx);
    $$('.gauge', ctx).forEach(prepGauge);
    // stagger children of [data-stagger]
    $$('[data-stagger]', ctx).forEach(function (group) {
      var step = parseFloat(group.getAttribute('data-stagger')) || 0.08;
      $$(':scope > [data-reveal]', group).forEach(function (el, i) { el.style.setProperty('--d', (i * step).toFixed(2) + 's'); });
    });
    $$('.split-line', ctx).forEach(function (line, i) {
      $('span', line).style.transitionDelay = (0.15 + i * 0.12) + 's';
    });
    function show(el) {
      el.classList.add('is-in');
      if (el.hasAttribute('data-count')) animateCount(el);
    }
    if (reduced() || !('IntersectionObserver' in window)) { items.forEach(show); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { show(en.target); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    items.forEach(function (el) { io.observe(el); });
    onCleanup(function () { io.disconnect(); });
  }

  /* Instrument panel tilt */
  function initTilt(ctx) {
    var panel = $('.instrument', ctx);
    if (!panel || !finePointer || reduced()) return;
    var hero = panel.closest('.hero');
    function move(e) {
      var r = hero.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - 0.5;
      var y = (e.clientY - r.top) / r.height - 0.5;
      panel.style.setProperty('--ry', (x * 8).toFixed(2) + 'deg');
      panel.style.setProperty('--rx', (-y * 6).toFixed(2) + 'deg');
    }
    function leave() { panel.style.setProperty('--ry', '0deg'); panel.style.setProperty('--rx', '0deg'); }
    hero.addEventListener('pointermove', move, { passive: true });
    hero.addEventListener('pointerleave', leave);
    onCleanup(function () { hero.removeEventListener('pointermove', move); hero.removeEventListener('pointerleave', leave); });
  }

  /* ------------------------------------------------------------------
     Filters (case studies, resources)
     ------------------------------------------------------------------ */
  function initFilters(ctx) {
    $$('[data-filter-group]', ctx).forEach(function (group) {
      var scope = document.getElementById(group.getAttribute('data-filter-group'));
      if (!scope) return;
      var items = $$('[data-filter-item]', scope);
      var status = $('[data-filter-status]', ctx);
      group.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-filter]');
        if (!btn) return;
        var val = btn.getAttribute('data-filter');
        $$('[data-filter]', group).forEach(function (b) { b.setAttribute('aria-pressed', b === btn ? 'true' : 'false'); });
        var shown = 0;
        items.forEach(function (it) {
          var match = val === 'all' || it.getAttribute('data-cat') === val;
          if (match) shown++;
          if (reduced()) { it.hidden = !match; return; }
          if (match && it.hidden) {
            it.hidden = false;
            it.classList.add('is-leaving');
            requestAnimationFrame(function () { requestAnimationFrame(function () { it.classList.remove('is-leaving'); }); });
          } else if (!match && !it.hidden) {
            it.classList.add('is-leaving');
            setTimeout(function () { if (it.classList.contains('is-leaving')) { it.hidden = true; it.classList.remove('is-leaving'); } }, 420);
          }
        });
        if (status) status.textContent = shown + (shown === 1 ? ' item' : ' items') + ' shown';
      });
    });
  }

  /* Services: in-page index follows the section you are reading */
  function initScrollSpy(ctx) {
    var links = $$('[data-spy] a[href*="#"]', ctx);
    if (!links.length || !('IntersectionObserver' in window)) return;
    var map = {};
    links.forEach(function (a) { map[a.getAttribute('href').split('#')[1]] = a; });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        links.forEach(function (a) { a.classList.remove('is-active'); });
        var a = map[en.target.id];
        if (a) {
          a.classList.add('is-active');
          var bar = a.parentElement;
          var left = a.offsetLeft - bar.clientWidth / 2 + a.clientWidth / 2;
          bar.scrollTo({ left: left, behavior: reduced() ? 'auto' : 'smooth' });
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    $$('.service-block', ctx).forEach(function (s) { io.observe(s); });
    onCleanup(function () { io.disconnect(); });
  }

  /* ------------------------------------------------------------------
     Forms: validation; POST to data-endpoint if set, otherwise mailto
     ------------------------------------------------------------------ */
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  function initForms(ctx) {
    $$('form[data-form]', ctx).forEach(function (form) {
      form.setAttribute('novalidate', '');
      function validateField(field) {
        var input = $('input, select, textarea', field);
        if (!input) return true;
        var err = $('.field-error', field);
        var msg = '';
        var v = (input.value || '').trim();
        if (input.required && !v) msg = 'This field is required.';
        else if (input.type === 'email' && v && !EMAIL_RE.test(v)) msg = 'Please enter a valid email address.';
        field.classList.toggle('is-invalid', !!msg);
        input.setAttribute('aria-invalid', msg ? 'true' : 'false');
        if (err) err.textContent = msg;
        return !msg;
      }
      form.addEventListener('blur', function (e) {
        var field = e.target.closest('.field');
        if (field && field.classList.contains('is-invalid')) validateField(field);
      }, true);
      form.addEventListener('input', function (e) {
        var field = e.target.closest('.field');
        if (field && field.classList.contains('is-invalid')) validateField(field);
      });
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var fields = $$('.field', form);
        var ok = true, firstBad = null;
        fields.forEach(function (f) { if (!validateField(f)) { ok = false; if (!firstBad) firstBad = f; } });
        if (!ok) { $('input, select, textarea', firstBad).focus(); return; }
        var status = $('.form-status', form);
        var submit = $('[type="submit"]', form);
        var data = new FormData(form);
        var endpoint = form.getAttribute('data-endpoint');
        function done(text) {
          if (status) { status.textContent = text; status.classList.add('is-visible'); status.focus && status.focus(); }
          if (submit) submit.disabled = false;
        }
        if (submit) submit.disabled = true;
        if (endpoint) {
          fetch(endpoint, { method: 'POST', body: data, headers: { Accept: 'application/json' } })
            .then(function (res) {
              if (!res.ok) throw new Error(res.status);
              form.reset();
              done(form.getAttribute('data-success') || 'Thank you — we will be in touch within 24 hours.');
            })
            .catch(function () { mailtoFallback(form, data); done('We could not send the form automatically, so your email app has been opened with the message ready to send.'); });
        } else {
          mailtoFallback(form, data);
          done(form.getAttribute('data-success-mailto') || 'Your email app has opened with the message ready to send to info@maritime.studio.');
        }
      });
    });
  }
  function mailtoFallback(form, data) {
    var to = form.getAttribute('data-mailto') || 'info@maritime.studio';
    var subject = form.getAttribute('data-subject') || 'Website enquiry';
    var lines = [];
    data.forEach(function (v, k) {
      var label = form.querySelector('[name="' + k + '"]');
      var l = label && label.id ? form.querySelector('label[for="' + label.id + '"]') : null;
      lines.push((l ? l.textContent.replace(/\s*\*$/, '') : k) + ': ' + v);
    });
    window.location.href = 'mailto:' + to + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(lines.join('\n'));
  }

  /* ------------------------------------------------------------------
     Glossary search (hub list + category pages)
     ------------------------------------------------------------------ */
  function initGlossary(ctx) {
    var input = $('[data-gloss-search]', ctx);
    if (!input) return;
    var mode = input.getAttribute('data-gloss-search'); // "hub" or "terms"
    var count = $('[data-gloss-count]', ctx);
    var empty = $('.empty-state', ctx);
    var groups = $$(mode === 'hub' ? '.az-group' : '.term-group', ctx);
    var index = [];
    groups.forEach(function (g) {
      $$(mode === 'hub' ? 'li' : '.term', g).forEach(function (el) {
        index.push({ el: el, group: g, text: el.textContent.toLowerCase() });
      });
    });
    var total = index.length;
    var timer = null;
    function run() {
      var q = input.value.trim().toLowerCase();
      var shown = 0;
      var groupHits = new Map();
      index.forEach(function (it) {
        var hit = !q || it.text.indexOf(q) > -1;
        it.el.hidden = !hit;
        if (hit) { shown++; groupHits.set(it.group, true); }
      });
      groups.forEach(function (g) { g.hidden = !groupHits.get(g); });
      var letters = $('.letters', ctx);
      if (letters) letters.style.display = q ? 'none' : '';
      if (count) count.textContent = q ? (shown + ' of ' + total + ' terms match “' + input.value.trim() + '”') : (total + ' terms');
      if (empty) empty.classList.toggle('is-visible', shown === 0);
    }
    input.addEventListener('input', function () { clearTimeout(timer); timer = setTimeout(run, 110); });
    var params = new URLSearchParams(location.search);
    if (params.get('q')) { input.value = params.get('q'); }
    run();
  }

  function highlightHash() {
    if (!location.hash) return;
    var el;
    try { el = document.getElementById(decodeURIComponent(location.hash.slice(1))); } catch (e) { el = null; }
    if (el && el.classList.contains('term')) {
      el.classList.remove('is-target');
      void el.offsetWidth;
      el.classList.add('is-target');
    }
  }

  /* ------------------------------------------------------------------
     Article view (blog-post/?post=slug)
     ------------------------------------------------------------------ */
  function initArticle(ctx) {
    var view = $('[data-article-view]', ctx);
    if (!view) return;
    var dataEl = $('#articles-data', ctx);
    var list = $('[data-article-list]', ctx);
    var slug = new URLSearchParams(location.search).get('post');
    if (!dataEl || !slug) { view.hidden = true; if (list) list.hidden = false; return; }
    var posts = [];
    try { posts = JSON.parse(dataEl.textContent); } catch (e) { posts = []; }
    var post = posts.filter(function (p) { return p.slug === slug; })[0];
    if (!post) { view.hidden = true; if (list) list.hidden = false; return; }
    $$('[data-field]', view).forEach(function (el) { el.textContent = post[el.getAttribute('data-field')] || ''; });
    view.hidden = false;
    if (list) list.hidden = true;
    document.title = post.title + ' | Maritime.Studio';
  }

  function initYear(ctx) {
    $$('[data-year]', ctx).forEach(function (el) { el.textContent = new Date().getFullYear(); });
  }

  /* ------------------------------------------------------------------
     Page lifecycle
     ------------------------------------------------------------------ */
  function mountPage() {
    var main = $('main');
    fixFileLinks(document);
    initArticle(main);
    $$('.ocean', main).forEach(function (host) { if (host.offsetParent !== null || getComputedStyle(host).position === 'fixed') initOcean(host); });
    initReveal(main);
    initTilt(main);
    initFilters(main);
    initScrollSpy(main);
    initForms(main);
    initGlossary(main);
    initYear(document);
    syncCalmButtons();
    setActiveNav();
    highlightHash();
    // hero headline: let it rise in once mounted
    var heroCopy = $('.hero-copy, .page-hero', main);
    if (heroCopy) requestAnimationFrame(function () { heroCopy.classList.add('is-in'); });
  }
  function unmountPage() {
    while (cleanups.length) { try { cleanups.pop()(); } catch (e) { /* keep going */ } }
  }

  /* ------------------------------------------------------------------
     Liquid page transitions
     ------------------------------------------------------------------ */
  var veil = $('.veil');
  var veilA = veil && $('.veil-a', veil);
  var veilB = veil && $('.veil-b', veil);
  var status = $('#route-status');
  var cache = new Map();
  var busy = false;
  var currentKey = location.pathname + location.search;
  var canRoute = !isFile && 'fetch' in window && window.DOMParser && history.pushState && veil;

  function riseD(p) {
    // liquid rising from the bottom, crest bulging upward mid-way
    var y = 100 - 100 * p;
    var b = Math.sin(Math.PI * p) * 22;
    return 'M0 100 L0 ' + y.toFixed(2) + ' C 28 ' + (y - b).toFixed(2) + ' 72 ' + (y - b).toFixed(2) + ' 100 ' + y.toFixed(2) + ' L100 100 Z';
  }
  function drainD(p) {
    // liquid draining upward, trailing edge curves up in the middle
    var y = 100 - 100 * p;
    var b = Math.sin(Math.PI * p) * 22;
    return 'M0 0 L0 ' + y.toFixed(2) + ' C 28 ' + (y - b).toFixed(2) + ' 72 ' + (y - b).toFixed(2) + ' 100 ' + y.toFixed(2) + ' L100 0 Z';
  }
  function veilIn() {
    if (reduced()) return Promise.resolve();
    veil.classList.add('is-active');
    return tween(760, function (t) {
      var a = easeInOut(clamp(t / 0.85, 0, 1));
      var b = easeInOut(clamp((t - 0.15) / 0.85, 0, 1));
      veilA.setAttribute('d', riseD(a));
      veilB.setAttribute('d', riseD(b));
    });
  }
  function veilOut() {
    if (reduced()) { veil.classList.remove('is-active'); return Promise.resolve(); }
    return tween(860, function (t) {
      var b = easeInOut(clamp(t / 0.85, 0, 1));
      var a = easeInOut(clamp((t - 0.15) / 0.85, 0, 1));
      veilB.setAttribute('d', drainD(b));
      veilA.setAttribute('d', drainD(a));
    }).then(function () {
      veilA.setAttribute('d', '');
      veilB.setAttribute('d', '');
      veil.classList.remove('is-active');
    });
  }

  function fetchPage(url) {
    var key = url.pathname + url.search;
    if (!cache.has(key)) {
      var p = fetch(url.href, { headers: { 'X-Requested-With': 'liquid' } }).then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        var type = res.headers.get('content-type') || '';
        if (type.indexOf('text/html') === -1) throw new Error('not html');
        return res.text();
      });
      p.catch(function () { cache.delete(key); });
      cache.set(key, p);
    }
    return cache.get(key);
  }

  function routable(a, e) {
    if (!canRoute || !a) return null;
    if (e && (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)) return null;
    if ((a.target && a.target !== '_self') || a.hasAttribute('download') || a.hasAttribute('data-no-route')) return null;
    var href = a.getAttribute('href');
    if (!href || /^(mailto:|tel:|javascript:)/i.test(href)) return null;
    var url = new URL(a.href, location.href);
    if (url.origin !== location.origin) return null;
    if (/\.(pdf|png|jpe?g|webp|svg|zip|xml|txt|json|webmanifest)$/i.test(url.pathname)) return null;
    return url;
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    var url = routable(a, e);
    if (!url) return;
    var samePage = url.pathname === location.pathname && url.search === location.search;
    if (samePage) {
      if (url.hash) return; // native in-page anchor
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: reduced() ? 'auto' : 'smooth' });
      return;
    }
    e.preventDefault();
    navigate(url, true);
  });

  // warm the cache on intent
  function prefetch(e) {
    var a = e.target.closest && e.target.closest('a[href]');
    var url = routable(a);
    if (url && (url.pathname !== location.pathname || url.search !== location.search)) fetchPage(url).catch(function () {});
  }
  document.addEventListener('pointerover', prefetch, { passive: true });
  document.addEventListener('touchstart', prefetch, { passive: true });
  document.addEventListener('focusin', prefetch);

  window.addEventListener('popstate', function () {
    var key = location.pathname + location.search;
    if (key === currentKey) { highlightHash(); return; } // hash-only change
    navigate(new URL(location.href), false);
  });

  function navigate(url, push) {
    if (busy) return;
    busy = true;
    closeDropdowns();
    setMenu(false);
    releaseMagnet();
    var pending = fetchPage(url);
    veilIn()
      .then(function () { return pending; })
      .then(function (html) {
        var next = new DOMParser().parseFromString(html, 'text/html');
        var newMain = next.querySelector('main');
        if (!newMain) throw new Error('no main');
        unmountPage();
        var oldMain = $('main');
        oldMain.replaceWith(document.importNode(newMain, true));
        document.title = next.title;
        ['description'].forEach(function (name) {
          var src = next.querySelector('meta[name="' + name + '"]');
          var dst = document.querySelector('meta[name="' + name + '"]');
          if (src && dst) dst.setAttribute('content', src.getAttribute('content'));
        });
        var canon = next.querySelector('link[rel="canonical"]');
        var canonHere = document.querySelector('link[rel="canonical"]');
        if (canon && canonHere) canonHere.setAttribute('href', canon.getAttribute('href'));
        document.body.setAttribute('data-page', next.body.getAttribute('data-page') || '');
        if (push) history.pushState({ liquid: true }, '', url.href);
        currentKey = location.pathname + location.search;

        root.style.scrollBehavior = 'auto';
        var target = url.hash ? document.getElementById(decodeURIComponent(url.hash.slice(1))) : null;
        if (target) target.scrollIntoView(); else window.scrollTo(0, 0);
        root.style.scrollBehavior = '';
        header.classList.remove('is-hidden');

        mountPage();

        var h1 = $('main h1');
        if (h1) { h1.setAttribute('tabindex', '-1'); h1.focus({ preventScroll: true }); }
        if (status) status.textContent = 'Loaded: ' + document.title;
        if (!reduced()) {
          document.body.classList.add('page-enter');
          setTimeout(function () { document.body.classList.remove('page-enter'); }, 1100);
        }
        return veilOut();
      })
      .catch(function () {
        window.location.href = url.href;
      })
      .then(function () { busy = false; });
  }

  // first paint
  mountPage();
})();
