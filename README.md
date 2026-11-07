# Jawad Web Studio — plain-code portfolio website

A real portfolio website built in the order the client asked for:

1. **HTML first** — `frontend/index.html` (header/nav, hero, work ribbon, about, services, work, pricing, process, code, testimonials, contact, footer, login/signup modal, booking modal)
2. **CSS next** — `frontend/styles.css` (MotionSites Modern Agency direction + Work Ribbon 3D scrolling carousel; warm ivory / deep navy / teal / copper-gold palette; Fraunces + Inter; real 3D scroll animation with CSS 3D transforms + IntersectionObserver)
3. **JavaScript next** — `frontend/script.js` (plain JS, no framework: mobile menu, smooth scroll, ribbon drag/scroll, pricing toggle, inquiry + booking forms, login/signup, admin actions — every button works)
4. **Python + FastAPI backend** — `backend/app.py` (serves the frontend, REST APIs)
5. **Database** — SQLite via SQLAlchemy (`backend/database.py`, `backend/models.py`), seeded with 6 services, 4 sample projects, 3 USD pricing plans
6. **Auth + admin panel** — `frontend/admin.html` + `/api/auth/*` + `/api/admin/*`; email/password with PBKDF2-hashed passwords, session tokens; **first registered user becomes admin**. Google/GitHub OAuth buttons are shown but clearly marked as needing the studio's OAuth client IDs — no fake OAuth flow.

## Pricing — draft, in USD

- Starter **$499**, Business **$999**, Pro Web App **$1,999**
- Services **$249–$1,499** starting prices

These are draft prices, editable in the admin panel. Projects/testimonials are clearly labelled **sample** projects — not real clients.

## How to run locally

```bash
cd jawad-web-studio-code
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn backend.app:app --host 127.0.0.1 --port 8000 --reload
```

Open: **http://127.0.0.1:8000/** — admin at **http://127.0.0.1:8000/admin.html**

First: register an account on the site — the first registered user becomes the admin. Then log in and open the admin panel to edit services, pricing, projects, inquiries and bookings.

## API (all under http://127.0.0.1:8000)

- `GET /api/health` — `{"status": "ok"}`
- `GET /api/services` · `GET /api/projects` · `GET /api/plans`
- `POST /api/inquiries` — `{name, email, service, budget, message}`
- `POST /api/bookings` — `{plan_id, name, email, notes}`
- `POST /api/auth/register` · `POST /api/auth/login` · `GET /api/auth/me` (Bearer token)
- `GET /api/me/requests` (logged in)
- `GET /api/admin/inquiries` · `GET /api/admin/bookings` · `GET/PUT /api/admin/settings` (admin only)
- `POST/PUT/DELETE /api/admin/services[/id]` · `PUT /api/admin/plans/{id}` · `POST/DELETE /api/admin/projects[/id]` · `PUT /api/admin/inquiries/{id}` · `PUT /api/admin/bookings/{id}`

## Project layout

```
jawad-web-studio-code/
├── README.md
├── requirements.txt
├── .gitignore
├── frontend/
│   ├── index.html
│   ├── styles.css
│   ├── script.js
│   └── admin.html
└── backend/
    ├── app.py        # FastAPI app + all routes, serves frontend
    ├── database.py   # SQLite engine + seed data
    ├── models.py     # SQLAlchemy tables
    └── auth.py       # PBKDF2 password hashing + session tokens
```

## Notes

- No passwords or secrets are in the code or in git. The database file (`backend/jawad.db`) is git-ignored.
- OAuth is not live until the studio adds its own Google/GitHub client IDs in Admin → Settings.
