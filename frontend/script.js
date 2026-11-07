/* Jawad Web Studio — script.js (plain JavaScript, no framework) */
(function () {
  'use strict';
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));
  const API = '';
  let token = localStorage.getItem('jws_token') || '';
  let currentUser = null;
  try { currentUser = JSON.parse(localStorage.getItem('jws_user') || 'null'); } catch (e) { currentUser = null; }

  function toast(msg) {
    const t = $('#toast'); if (!t) return;
    t.textContent = msg; t.classList.remove('hidden');
    clearTimeout(t._h); t._h = setTimeout(() => t.classList.add('hidden'), 3200);
  }
  function money(n) { return '$' + Number(n).toLocaleString('en-US'); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
  async function api(path, opts) {
    const res = await fetch(API + path, Object.assign({ headers: { 'Content-Type': 'application/json' } }, opts || {}));
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.detail || data.message || ('Request failed: ' + res.status));
    return data;
  }
  function authHeaders() { return token ? { Authorization: 'Bearer ' + token } : {}; }

  /* --- Reveal on scroll (IntersectionObserver) --- */
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); } });
  }, { threshold: 0.12 });
  $$('.reveal').forEach(el => io.observe(el));

  /* --- Mobile menu --- */
  const menuToggle = $('#menuToggle'), mobileMenu = $('#mobileMenu');
  function closeMenu() { if (mobileMenu) mobileMenu.classList.add('hidden'); if (menuToggle) { menuToggle.textContent = 'Menu'; menuToggle.setAttribute('aria-expanded', 'false'); } }
  if (menuToggle && mobileMenu) {
    menuToggle.addEventListener('click', () => {
      const open = mobileMenu.classList.toggle('hidden') === false;
      menuToggle.textContent = open ? 'Close' : 'Menu';
      menuToggle.setAttribute('aria-expanded', String(open));
    });
    $$('a', mobileMenu).forEach(a => a.addEventListener('click', closeMenu));
  }

  /* --- Load services / projects / plans from backend --- */
  async function loadContent() {
    try {
      const services = await api('/api/services');
      const grid = $('#serviceGrid');
      if (grid) grid.innerHTML = services.map(s =>
        '<article class="service-card"><h3>' + esc(s.name) + '</h3><p>' + esc(s.description || '') + '</p>' +
        '<p class="svc-price">From ' + money(s.price_from) + ' · ' + esc(s.price_to ? money(s.price_to) : '') + '</p>' +
        '<button class="btn btn-outline btn-sm" type="button" data-service="' + esc(s.name) + '">Enquire about this</button></article>').join('');
      $$('#serviceGrid [data-service]').forEach(b => b.addEventListener('click', () => {
        const sel = $('#inquiryService'); if (sel) sel.value = b.dataset.service;
        document.getElementById('contact').scrollIntoView({ behavior: 'smooth' });
        toast('Service selected: ' + b.dataset.service);
      }));
    } catch (e) { const g = $('#serviceGrid'); if (g) g.innerHTML = '<p>Services could not be loaded. Is the backend running on port 8000?</p>'; }

    try {
      const projects = await api('/api/projects');
      const ribbon = $('#ribbon'), workGrid = $('#workGrid');
      const art = ['🎨', '🛍️', '📱', '🌐'];
      if (ribbon) ribbon.innerHTML = projects.map((p, i) =>
        '<article class="ribbon-card" tabindex="0"><div class="card-art">' + art[i % art.length] + '</div>' +
        '<h3>' + esc(p.title) + '</h3><p>' + esc(p.description || '') + '</p>' +
        '<p><span class="tag">' + esc(p.category || 'Web') + '</span></p>' +
        '<p class="price">' + esc(p.client_label || 'Sample project') + '</p></article>').join('');
      if (workGrid) workGrid.innerHTML = projects.map((p, i) =>
        '<article class="work-card"><div class="work-art">' + art[i % art.length] + '</div>' +
        '<h3>' + esc(p.title) + '</h3><p>' + esc(p.description || '') + '</p>' +
        '<p><span class="tag">' + esc(p.category || 'Web') + '</span> · ' + esc(p.client_label || 'Sample project') + '</p>' +
        '<button class="btn btn-outline btn-sm" type="button" data-project="' + esc(p.title) + '">View case study</button></article>').join('');
      $$('#workGrid [data-project]').forEach(b => b.addEventListener('click', () => toast(b.dataset.project + ' — sample case study. Full details on request.')));
      initRibbon();
    } catch (e) { const r = $('#ribbon'); if (r) r.innerHTML = '<p>Projects could not be loaded.</p>'; }

    try {
      const plans = await api('/api/plans');
      const pg = $('#planGrid');
      if (pg) pg.innerHTML = plans.map((p, i) =>
        '<article class="plan-card' + (i === 1 ? ' featured' : '') + '">' +
        (i === 1 ? '<span class="badge">Most popular</span>' : '') +
        '<h3>' + esc(p.name) + '</h3><p class="plan-price">' + money(p.price) + '</p>' +
        '<p>' + esc(p.description || '') + '</p><ul>' + (p.features || []).map(f => '<li>' + esc(f) + '</li>').join('') + '</ul>' +
        '<button class="btn btn-copper" type="button" data-book-plan="' + p.id + '" data-plan-name="' + esc(p.name) + '" data-plan-price="' + p.price + '">Book this plan</button></article>').join('');
      $$('#planGrid [data-book-plan]').forEach(b => b.addEventListener('click', () => openBookModal(b.dataset.bookPlan, b.dataset.planName, b.dataset.planPrice)));
    } catch (e) { const pg = $('#planGrid'); if (pg) pg.innerHTML = '<p>Pricing could not be loaded.</p>'; }
  }

  /* --- 3D ribbon: drag / scroll / arrows --- */
  function initRibbon() {
    const wrap = $('#ribbonWrap'), ribbon = $('#ribbon');
    if (!wrap || !ribbon) return;
    const prev = $('#ribbonPrev'), next = $('#ribbonNext');
    if (prev) prev.addEventListener('click', () => wrap.scrollBy({ left: -320, top: 0, behavior: 'smooth' }));
    if (next) next.addEventListener('click', () => wrap.scrollBy({ left: 320, top: 0, behavior: 'smooth' }));
    let down = false, startX = 0, startScroll = 0;
    wrap.addEventListener('pointerdown', e => { down = true; startX = e.clientX; startScroll = wrap.scrollLeft; wrap.setPointerCapture(e.pointerId); });
    wrap.addEventListener('pointermove', e => { if (down) wrap.scrollLeft = startScroll - (e.clientX - startX); });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(ev => wrap.addEventListener(ev, () => { down = false; }));
    // parallax tilt on scroll
    wrap.addEventListener('scroll', () => {
      const cards = $$('.ribbon-card', ribbon);
      const mid = wrap.getBoundingClientRect().left + wrap.clientWidth / 2;
      cards.forEach(c => {
        const r = c.getBoundingClientRect();
        const d = (r.left + r.width / 2 - mid) / wrap.clientWidth;
        c.style.transform = 'rotateY(' + (-d * 18).toFixed(1) + 'deg) translateZ(' + (30 - Math.abs(d) * 40).toFixed(0) + 'px)';
      });
    }, { passive: true });
  }

  /* --- Pricing toggle --- */
  const t1 = $('#toggleOnetime'), t2 = $('#toggleNote'), note = $('#pricingNote');
  if (t1 && t2) {
    t1.addEventListener('click', () => { t1.classList.add('active'); t2.classList.remove('active'); note.classList.add('hidden'); });
    t2.addEventListener('click', () => { t2.classList.add('active'); t1.classList.remove('active'); note.classList.remove('hidden'); });
  }

  /* --- Code tabs + copy --- */
  const SAMPLES = {
    html: '<!-- frontend/index.html -->\n<header>\n  <nav class="nav-pill">\n    <a href="#top">Jawad Web Studio</a>\n  </nav>\n</header>\n<main>\n  <section class="hero">\n    <h1>We craft digital experiences</h1>\n  </section>\n</main>',
    css: '/* frontend/styles.css */\n:root {\n  --ivory: #F7F3EC;\n  --navy: #0F2340;\n  --teal: #0F766E;\n  --copper: #B7793A;\n}\n.hero h1 {\n  font-family: Fraunces, serif;\n  color: var(--navy);\n}',
    js: '// frontend/script.js\nconst ribbon = document.querySelector("#ribbon");\nribbon.addEventListener("pointerdown", (e) => {\n  // drag-to-scroll the 3D work ribbon\n  console.log("ribbon drag started");\n});',
    py: '# backend/app.py — FastAPI\nfrom fastapi import FastAPI\n\napp = FastAPI(title="Jawad Web Studio")\n\n@app.get("/api/health")\ndef health():\n    return {"status": "ok"}\n\n@app.get("/api/services")\ndef list_services():\n    return db_services()'
  };
  const codeBlock = $('#codeBlock');
  function showCode(key) {
    if (codeBlock) codeBlock.textContent = SAMPLES[key] || '';
    $$('.code-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === key));
  }
  $$('.code-tab').forEach(t => t.addEventListener('click', () => showCode(t.dataset.tab)));
  if (codeBlock) showCode('html');
  const copyBtn = $('#copyCodeBtn');
  if (copyBtn) copyBtn.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(codeBlock.textContent); $('#copyMsg').textContent = 'Copied ✓'; }
    catch (e) { $('#copyMsg').textContent = 'Copy failed — select the code manually.'; }
  });

  /* --- Inquiry form --- */
  const inquiryForm = $('#inquiryForm');
  if (inquiryForm) inquiryForm.addEventListener('submit', async e => {
    e.preventDefault();
    const msg = $('#inquiryMsg');
    const fd = new FormData(inquiryForm);
    const payload = { name: fd.get('name'), email: fd.get('email'), service: fd.get('service'), budget: fd.get('budget'), message: fd.get('message') };
    try {
      await api('/api/inquiries', { method: 'POST', body: JSON.stringify(payload) });
      msg.textContent = 'Inquiry sent ✓ — we will reply to ' + payload.email + '.'; msg.className = 'form-msg ok';
      inquiryForm.reset();
    } catch (err) { msg.textContent = 'Could not send: ' + err.message; msg.className = 'form-msg err'; }
  });

  /* --- Booking modal --- */
  const bookModal = $('#bookModal'); let bookingPlanId = null;
  function openBookModal(planId, name, price) {
    bookingPlanId = planId;
    $('#bookPlanInfo').textContent = name + ' — $' + Number(price).toLocaleString('en-US') + ' (draft, one-time).';
    $('#bookMsg').textContent = '';
    bookModal.classList.remove('hidden');
  }
  function closeBookModal() { bookModal.classList.add('hidden'); }
  $('#bookClose').addEventListener('click', closeBookModal);
  bookModal.addEventListener('click', e => { if (e.target === bookModal) closeBookModal(); });
  $('#bookForm').addEventListener('submit', async e => {
    e.preventDefault();
    const msg = $('#bookMsg'); const fd = new FormData(e.target);
    try {
      await api('/api/bookings', { method: 'POST', body: JSON.stringify({ plan_id: Number(bookingPlanId), name: fd.get('name'), email: fd.get('email'), notes: fd.get('notes') }) });
      msg.textContent = 'Booking request sent ✓'; msg.className = 'form-msg ok'; e.target.reset();
    } catch (err) { msg.textContent = 'Could not send: ' + err.message; msg.className = 'form-msg err'; }
  });
  $$('[data-book-cta]').forEach(b => b.addEventListener('click', () => { /* anchor already scrolls to #contact */ }));

  /* --- Auth modal --- */
  const authModal = $('#authModal'); let authMode = 'login';
  function openAuth(mode) {
    authMode = mode || 'login';
    $$('.auth-tab').forEach(t => t.classList.toggle('active', t.dataset.mode === authMode));
    $('#authTitle').textContent = authMode === 'login' ? 'Welcome back — sign in' : 'Create your account';
    $('#authSubmit').textContent = authMode === 'login' ? 'Log in' : 'Sign up';
    $('#authName').closest('label').style.display = authMode === 'register' ? 'block' : 'none';
    $('#authMsg').textContent = '';
    authModal.classList.remove('hidden');
  }
  function closeAuth() { authModal.classList.add('hidden'); }
  function setLoggedIn(user, tok) {
    currentUser = user; token = tok;
    localStorage.setItem('jws_token', tok); localStorage.setItem('jws_user', JSON.stringify(user));
    updateAuthUI();
  }
  function updateAuthUI() {
    const logged = !!token;
    $('#loginBtn').classList.toggle('hidden', logged);
    $('#accountBtn').classList.toggle('hidden', !logged);
    $('#logoutBtn').classList.toggle('hidden', !logged);
    if (logged && currentUser) $('#accountBtn').textContent = currentUser.email + (currentUser.is_admin ? ' (Admin)' : '');
  }
  $('#loginBtn').addEventListener('click', () => openAuth('login'));
  const mlb = $('#mobileLoginBtn'); if (mlb) mlb.addEventListener('click', () => { closeMenu(); openAuth('login'); });
  const fl = $('#footerLogin'); if (fl) fl.addEventListener('click', e => { e.preventDefault(); openAuth('login'); });
  $('#authClose').addEventListener('click', closeAuth);
  authModal.addEventListener('click', e => { if (e.target === authModal) closeAuth(); });
  $$('.auth-tab').forEach(t => t.addEventListener('click', () => openAuth(t.dataset.mode)));
  $('#accountBtn').addEventListener('click', () => { window.location.href = '/admin.html'; });
  $('#logoutBtn').addEventListener('click', () => {
    token = ''; currentUser = null;
    localStorage.removeItem('jws_token'); localStorage.removeItem('jws_user');
    updateAuthUI(); toast('Logged out.');
  });
  $('#authForm').addEventListener('submit', async e => {
    e.preventDefault();
    const msg = $('#authMsg'); const fd = new FormData(e.target);
    const payload = { email: fd.get('email'), password: fd.get('password') };
    if (authMode === 'register') payload.name = fd.get('name') || '';
    try {
      const data = await api(authMode === 'login' ? '/api/auth/login' : '/api/auth/register', { method: 'POST', body: JSON.stringify(payload) });
      setLoggedIn(data.user, data.token);
      msg.textContent = (authMode === 'login' ? 'Logged in ✓' : 'Account created ✓') + (data.user.is_admin ? ' You are the admin (first registered user).' : '');
      msg.className = 'form-msg ok';
      setTimeout(() => { closeAuth(); if (data.user.is_admin) window.location.href = '/admin.html'; }, 900);
    } catch (err) { msg.textContent = 'Auth failed: ' + err.message; msg.className = 'form-msg err'; }
  });
  // OAuth buttons — intentionally NOT a fake flow
  function oauthDisabled(provider) { toast(provider + ' OAuth needs the studio’s Google/GitHub client IDs in Admin → Settings. Email login works now.'); }
  $('#googleBtn').addEventListener('click', () => oauthDisabled('Google'));
  $('#githubBtn').addEventListener('click', () => oauthDisabled('GitHub'));

  /* --- My requests --- */
  const myBtn = $('#myRequestsBtn');
  if (myBtn) myBtn.addEventListener('click', async () => {
    const box = $('#myRequests');
    if (!token) { toast('Log in first to see your requests.'); openAuth('login'); return; }
    box.classList.toggle('hidden');
    if (box.classList.contains('hidden')) return;
    try {
      const data = await fetch('/api/me/requests', { headers: authHeaders() }).then(r => r.json());
      box.innerHTML = '<b>Inquiries:</b> ' + (data.inquiries || []).map(i => esc(i.service) + ' — ' + esc(i.status)).join('<br>') +
        '<br><b>Bookings:</b> ' + (data.bookings || []).map(b => esc(b.plan_name || ('Plan #' + b.plan_id)) + ' — ' + esc(b.status)).join('<br>');
      if (!data.inquiries.length && !data.bookings.length) box.innerHTML = 'No requests yet.';
    } catch (e) { box.textContent = 'Could not load requests: ' + e.message; }
  });

  document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeAuth(); closeBookModal(); closeMenu(); } });
  updateAuthUI();
  loadContent();
})();
