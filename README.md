# Jawad Web Studio — website (Phase 4)

Premium, minimal, editorial portfolio website for a website studio.
Stack (code and docs only — the public site never mentions it):
HTML5 + CSS3 + vanilla JavaScript frontend, Python + FastAPI backend,
SQLite via SQLAlchemy.

## Design system (Phase 2, approved)

- Paper `#F7F3EC`, ink navy `#0F2340`, muted `#5B6472`, line `#E3DCCB`
- One accent only: copper `#B7793A` (display) / `#9A6A2F` (interactive)
- Fraunces serif headings, Inter body; pill buttons; 18px cards; 1180px container
- No gradients, no glassmorphism, no teal

## Homepage sections (Phase 3)

1. Premium pill navigation · 2. Hero — "Thoughtful Design. Exceptional Websites."
3. Studio introduction · 4. Services overview (15 approved website services)
5. Selected work — empty state: "Selected projects will be showcased here."
   (no sample projects are seeded; real projects can be added in the admin panel)
6. Why choose us · 7. Working process (Discovery → Launch)
8. Packages — 6 quote packages, no fixed prices · 9. FAQ · 10. Contact
11. Professional footer

## Services (the only 15 offered)

Custom Website Design, Website Development, Website Redesign,
Business Website Development, E-commerce Website Development,
Landing Page Design & Development, Premium 3D Website Development,
Motion & Scroll Animation Websites, Responsive Website Development,
Website Fixes & Bug Fixing, Website Performance Optimization,
Website Speed Optimization, Basic Technical SEO Audit,
Website Maintenance, Website Updates and Improvements.

## Packages (quoted on scope — no prices shown)

Landing Page, Business Website, E-commerce Website,
Premium 3D & Motion Website, Website Redesign, Website Maintenance.
Every package button says "Request a Custom Quote", opens the contact
form and preselects that package. The selection is preserved in the
enquiry (stored as a "Package: …" line at the start of the message).

## Service pages (Phase 4)

11 individual pages at `/services/<slug>`, one shared template
(`frontend/service.html`) + one content file (`frontend/services-data.js`)
holding the unique copy for each page, rendered by `frontend/service.js`.
Routes in `backend/app.py` serve the template with a unique server-side
`<title>` and meta description per page; unknown slugs return a 404 page.
Each page has its own introduction, description, 4–6 benefits, 5–7
deliverables, 3–4 FAQs, related-service links, a breadcrumb
(Home / Services / Service) and a "Start a Project" CTA.

Slugs: `website-design`, `website-development`, `website-redesign`,
`ecommerce-websites`, `landing-pages`, `3d-websites`, `motion-websites`,
`website-fixes`, `website-speed-optimization`, `basic-seo-audit`,
`website-maintenance`. The 4 services without a dedicated page
(Business Website Development, Responsive Website Development,
Website Performance Optimization, Website Updates and Improvements)
link from the homepage overview straight to the contact form, as before.

CTA preselection across pages: a service page stores the chosen service
(and package, for "Request a Custom Quote") in `sessionStorage`
(`jws_preselect_service` / `jws_preselect_package`), then navigates to
`/#contact`. The homepage reads those keys once on load, sets the form
selects, clears the keys and scrolls to the contact form. `sessionStorage`
was chosen over a query string so the selection survives the navigation
without appearing in the URL; if storage is unavailable the form still
opens, just without preselection.

## Contact form

Name, Email, Business name (optional), Required website service,
Package (optional), Budget (optional), Project description.
Business name and package are stored server-side as "Business: …" /
"Package: …" lines prefixed to the enquiry message — no extra columns.
Enquiries are saved in the database and shown in the admin panel;
there is no email notification yet (Phase 6).

## How to run locally

```bash
cd jawad-web-studio-code
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn backend.app:app --host 127.0.0.1 --port 8000 --reload
```

Open: **http://127.0.0.1:8000/** — admin at **http://127.0.0.1:8000/admin.html**

First: register an account on the site — the first registered user becomes the admin. Then log in and open the admin panel to edit services, packages, projects, inquiries, bookings and users.

## API (all under http://127.0.0.1:8000)

- `GET /api/health` — `{"status": "ok"}`
- `GET /api/services` · `GET /api/projects` (empty until real projects are added) · `GET /api/plans`
- `POST /api/inquiries` — `{name, email, business?, service, package?, budget?, message}`
- `POST /api/bookings` — `{plan_id, name, email, notes}` (kept for the admin panel; the public booking flow was replaced by quote-to-contact in Phase 3)
- `POST /api/auth/register` · `POST /api/auth/login` · `GET /api/auth/me` (Bearer token)
- `GET /api/me/requests` (logged in)
- `GET /api/admin/inquiries` · `GET /api/admin/bookings` · `GET /api/admin/users` · `DELETE /api/admin/users/{id}` · `GET/PUT /api/admin/settings` (admin only)
- `POST/PUT/DELETE /api/admin/services[/id]` · `PUT /api/admin/plans/{id}` (price is always 0 — packages are quoted) · `POST/DELETE /api/admin/projects[/id]` · `PUT /api/admin/inquiries/{id}` · `PUT /api/admin/bookings/{id}`

## Project layout

```
jawad-web-studio-code/
├── README.md
├── requirements.txt
├── .gitignore
├── frontend/
│   ├── index.html
│   ├── service.html      # Phase 4 template for /services/<slug>
│   ├── services-data.js  # Phase 4 unique copy for the 11 service pages
│   ├── service.js        # Phase 4 renderer + shared nav/auth
│   ├── styles.css
│   ├── script.js
│   └── admin.html
└── backend/
    ├── app.py        # FastAPI app + all routes, serves frontend
    ├── database.py   # SQLite engine + seed data (15 services, 6 packages)
    ├── models.py     # SQLAlchemy tables
    └── auth.py       # PBKDF2 password hashing + session tokens
```

## Notes

- No passwords or secrets are in the code or in git. The database file (`backend/jawad.db`) is git-ignored.
- Google/GitHub sign-in is not live until the studio adds its own OAuth client IDs in Admin → Settings. The buttons honestly say so — no fake sign-in is used.
- No invented projects, testimonials, awards or client numbers anywhere on the public site.
