/* Jawad Web Studio — script.js (plain JavaScript, no framework)
   Phase 3: services / packages / quote-to-contact / inquiry / auth. */
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
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
  async function api(path, opts) {
    const res = await fetch(API + path, Object.assign({ headers: { 'Content-Type': 'application/json' } }, opts || {}));
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.detail || data.message || ('Request failed: ' + res.status));
    return data;
  }
  function authHeaders() { return token ? { Authorization: 'Bearer ' + token } : {}; }
  function goToContact() { document.getElementById('contact').scrollIntoView({ behavior: 'smooth' }); }

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

  /* --- Quote flow: preselect a package in the contact form --- */
  function requestQuote(packageName) {
    const sel = $('#inquiryPackage');
    if (sel) sel.value = packageName;
    goToContact();
    toast('Package selected: ' + packageName + ' — describe your project below.');
  }

  /* --- Load services / projects / packages from backend --- */
  async function loadContent() {
    try {
      const services = await api('/api/services');
      const grid = $('#serviceGrid');
      if (grid) grid.innerHTML = services.map(s =>
        '<article class="service-card"><span class="svc-tag">Website service</span><h3>' + esc(s.name) + '</h3><p>' + esc(s.description || '') + '</p>' +
        '<button class="btn btn-outline btn-sm" type="button" data-service="' + esc(s.name) + '">Enquire about this</button></article>').join('');
      $$('#serviceGrid [data-service]').forEach(b => b.addEventListener('click', () => {
        const sel = $('#inquiryService'); if (sel) sel.value = b.dataset.service;
        goToContact();
        toast('Service selected: ' + b.dataset.service);
      }));
    } catch (e) { const g = $('#serviceGrid'); if (g) g.innerHTML = '<p>Services could not be loaded. Please refresh the page.</p>'; }

    try {
      const projects = await api('/api/projects');
      window.__jwsProjects = projects;
      const workGrid = $('#workGrid');
      if (workGrid) workGrid.innerHTML = projects.map(p =>
        '<article class="work-card"><div class="work-art" aria-hidden="true">J</div>' +
        '<h3>' + esc(p.title) + '</h3><p>' + esc(p.description || '') + '</p>' +
        '<p><span class="tag">' + esc(p.category || 'Website') + '</span>' + (p.client_label ? ' · ' + esc(p.client_label) : '') + '</p>' +
        '<button class="btn btn-outline btn-sm" type="button" data-project="' + esc(p.title) + '">View case study</button></article>').join('');
      $$('#workGrid [data-project]').forEach(b => b.addEventListener('click', () => {
        const p = (window.__jwsProjects || []).find(x => x.title === b.dataset.project);
        if (p) openCaseModal(p);
      }));
    } catch (e) { const w = $('#workGrid'); if (w) w.innerHTML = '<p>Projects could not be loaded. Please refresh the page.</p>'; }

    try {
      const plans = await api('/api/plans');
      const pg = $('#planGrid');
      if (pg) pg.innerHTML = plans.map((p, i) =>
        '<article class="plan-card' + (i === 1 ? ' featured' : '') + '">' +
        '<h3>' + esc(p.name) + '</h3><p class="plan-quote">Request a Custom Quote</p>' +
        '<p>' + esc(p.description || '') + '</p><ul>' + (p.features || []).map(f => '<li>' + esc(f) + '</li>').join('') + '</ul>' +
        '<button class="btn btn-copper" type="button" data-quote-plan="' + esc(p.name) + '">Request a Custom Quote</button></article>').join('');
      $$('#planGrid [data-quote-plan]').forEach(b => b.addEventListener('click', () => requestQuote(b.dataset.quotePlan)));
    } catch (e) { const pg = $('#planGrid'); if (pg) pg.innerHTML = '<p>Packages could not be loaded. Please refresh the page.</p>'; }
  }

  /* --- Case study modal (used when real projects are added via the admin panel) --- */
  const caseModal = $('#caseModal');
  function openCaseModal(p) {
    $('#caseTitle').textContent = p.title;
    $('#caseMeta').textContent = (p.category || 'Website') + (p.client_label ? ' · ' + p.client_label : '');
    $('#caseDesc').textContent = p.description || '';
    caseModal.classList.remove('hidden');
  }
  function closeCaseModal() { if (caseModal) caseModal.classList.add('hidden'); }
  if (caseModal) {
    $('#caseClose').addEventListener('click', closeCaseModal);
    caseModal.addEventListener('click', e => { if (e.target === caseModal) closeCaseModal(); });
    $('#caseEnquire').addEventListener('click', () => {
      closeCaseModal();
      goToContact();
      toast('Tell us about your project in the enquiry form.');
    });
  }

  /* --- Inquiry form --- */
  const inquiryForm = $('#inquiryForm');
  if (inquiryForm) inquiryForm.addEventListener('submit', async e => {
    e.preventDefault();
    const msg = $('#inquiryMsg');
    const fd = new FormData(inquiryForm);
    const payload = {
      name: fd.get('name'), email: fd.get('email'),
      business: fd.get('business') || '', service: fd.get('service'),
      package: fd.get('package') || '', budget: fd.get('budget') || '',
      message: fd.get('message')
    };
    try {
      await api('/api/inquiries', { method: 'POST', body: JSON.stringify(payload) });
      msg.textContent = 'Enquiry sent — we will reply to ' + payload.email + '.'; msg.className = 'form-msg ok';
      inquiryForm.reset();
    } catch (err) { msg.textContent = 'Could not send: ' + err.message; msg.className = 'form-msg err'; }
  });

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
  const fl = $('#footerLogin'); if (fl) fl.addEventListener('click', () => openAuth('login'));
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
      msg.textContent = (authMode === 'login' ? 'Logged in' : 'Account created') + (data.user.is_admin ? ' — you are the admin (first registered user).' : '');
      msg.className = 'form-msg ok';
      setTimeout(() => { closeAuth(); if (data.user.is_admin) window.location.href = '/admin.html'; }, 900);
    } catch (err) { msg.textContent = 'Auth failed: ' + err.message; msg.className = 'form-msg err'; }
  });
  // OAuth buttons — intentionally NOT a fake flow
  function oauthDisabled(provider) { toast(provider + ' sign-in needs the studio’s Google/GitHub client IDs in Admin → Settings. Email login works now.'); }
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
      box.innerHTML = '<b>Enquiries:</b> ' + (data.inquiries || []).map(i => esc(i.service) + ' — ' + esc(i.status)).join('<br>') +
        '<br><b>Bookings:</b> ' + (data.bookings || []).map(b => esc(b.plan_name || ('Package #' + b.plan_id)) + ' — ' + esc(b.status)).join('<br>');
      if (!data.inquiries.length && !data.bookings.length) box.innerHTML = 'No requests yet.';
    } catch (e) { box.textContent = 'Could not load requests: ' + e.message; }
  });

  document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeAuth(); closeCaseModal(); closeMenu(); } });
  updateAuthUI();
  loadContent();
})();
