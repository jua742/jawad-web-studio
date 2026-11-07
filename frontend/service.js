/* Jawad Web Studio — service.js (Phase 4, plain JavaScript, no framework)
   Renders one service page from services-data.js, using the slug in
   <body data-service-slug>. Also handles the shared nav/auth/toast. */
(function () {
  'use strict';
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));
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
    const res = await fetch(path, Object.assign({ headers: { 'Content-Type': 'application/json' } }, opts || {}));
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.detail || data.message || ('Request failed: ' + res.status));
    return data;
  }

  /* --- Reveal on scroll --- */
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

  /* --- Render the service page --- */
  const slug = document.body.dataset.serviceSlug || '';
  const data = (window.JWS_SERVICES || {})[slug];
  if (!data) {
    // Reached only if the template is opened directly without a valid slug
    // (the server returns a 404 page for unknown slugs).
    $('#svcTitle').textContent = 'Service not found';
    $('#svcIntro').textContent = 'This service page does not exist. See all services on the homepage.';
    $('#crumbService').textContent = 'Not found';
    $('#svcDesc').innerHTML = '<p><a class="btn btn-dark" href="/#services">View all services</a></p>';
    return;
  }
  document.title = data.title;
  $('#svcTitle').textContent = data.pageName;
  $('#svcIntro').textContent = data.intro;
  $('#crumbService').textContent = data.pageName;
  $('#svcDesc').innerHTML = data.description.map(p => '<p>' + esc(p) + '</p>').join('');
  $('#benefitsGrid').innerHTML = data.benefits.map(b =>
    '<article class="benefit-card"><span class="benefit-mark" aria-hidden="true">✓</span><p>' + esc(b) + '</p></article>').join('');
  $('#deliverablesList').innerHTML = data.deliverables.map(d => '<li>' + esc(d) + '</li>').join('');
  $('#faqList').innerHTML = data.faqs.map(f =>
    '<details><summary>' + esc(f[0]) + '</summary><p>' + esc(f[1]) + '</p></details>').join('');
  $('#relatedGrid').innerHTML = data.related.map(r => {
    const rel = (window.JWS_SERVICES || {})[r];
    if (!rel) return '';
    return '<a class="related-card" href="/services/' + esc(r) + '"><b>' + esc(rel.pageName) + '</b><span>' + esc(rel.intro) + '</span></a>';
  }).join('');
  $('#ctaCardText').textContent = 'Tell us about your ' + data.pageName.toLowerCase() + ' project and we will reply with a custom quote.';

  /* --- CTA: preselect this service (and package) on the homepage contact form --- */
  function goToContact(withPackage) {
    try {
      sessionStorage.setItem('jws_preselect_service', data.serviceName);
      if (withPackage) sessionStorage.setItem('jws_preselect_package', data.package);
    } catch (e) { /* storage unavailable: the form still opens without preselection */ }
    window.location.href = '/#contact';
  }
  $('#ctaTop').addEventListener('click', () => goToContact(false));
  $('#ctaSide').addEventListener('click', () => goToContact(false));
  $('#ctaQuote').addEventListener('click', () => goToContact(true));

  /* --- Auth modal (same behaviour as the homepage) --- */
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
      const d = await api(authMode === 'login' ? '/api/auth/login' : '/api/auth/register', { method: 'POST', body: JSON.stringify(payload) });
      setLoggedIn(d.user, d.token);
      msg.textContent = (authMode === 'login' ? 'Logged in' : 'Account created') + (d.user.is_admin ? ' — you are the admin (first registered user).' : '');
      msg.className = 'form-msg ok';
      setTimeout(() => { closeAuth(); if (d.user.is_admin) window.location.href = '/admin.html'; }, 900);
    } catch (err) { msg.textContent = 'Auth failed: ' + err.message; msg.className = 'form-msg err'; }
  });
  function oauthDisabled(provider) { toast(provider + ' sign-in needs the studio’s Google/GitHub client IDs in Admin → Settings. Email login works now.'); }
  $('#googleBtn').addEventListener('click', () => oauthDisabled('Google'));
  $('#githubBtn').addEventListener('click', () => oauthDisabled('GitHub'));

  document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeAuth(); closeMenu(); } });
  updateAuthUI();
})();
