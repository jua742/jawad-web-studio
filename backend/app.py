"""Jawad Web Studio — FastAPI backend.

Serves the plain HTML/CSS/JS frontend from ../frontend and provides
REST APIs for services, projects, plans, inquiries, bookings, auth
and the admin panel. Database: SQLite via SQLAlchemy.

Run:
    python3 -m venv .venv && source .venv/bin/activate
    pip install -r requirements.txt
    uvicorn backend.app:app --host 127.0.0.1 --port 8000 --reload
Then open http://127.0.0.1:8000/
"""
import os
import sys

# Allow running as `uvicorn backend.app:app` from the project root,
# and as `python backend/app.py` from the backend folder.
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI, Depends, HTTPException, Header
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from typing import Optional

from database import get_db, init_db
from models import User, Session as UserSession, Service, Project, Plan, Inquiry, Booking, Setting
from auth import hash_password, verify_password, new_token

FRONTEND_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "frontend")
FRONTEND_DIR = os.path.normpath(FRONTEND_DIR)

app = FastAPI(title="Jawad Web Studio API")


@app.on_event("startup")
def startup():
    init_db()


# ---------- helpers ----------
def user_out(u: User):
    return {"id": u.id, "name": u.name, "email": u.email, "is_admin": bool(u.is_admin)}


def get_current_user(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not logged in")
    token = authorization[7:]
    sess = db.query(UserSession).filter(UserSession.token == token).first()
    if not sess:
        raise HTTPException(status_code=401, detail="Invalid session")
    user = db.query(User).filter(User.id == sess.user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


def require_admin(user: User = Depends(get_current_user)):
    if not user.is_admin:
        raise HTTPException(status_code=403, detail="Admin only")
    return user


# ---------- schemas ----------
class RegisterIn(BaseModel):
    name: str = ""
    email: EmailStr
    password: str


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class InquiryIn(BaseModel):
    name: str
    email: EmailStr
    service: str = ""
    budget: str = ""
    message: str = ""


class BookingIn(BaseModel):
    plan_id: int
    name: str
    email: EmailStr
    notes: str = ""


class ServiceIn(BaseModel):
    name: str
    description: str = ""
    price_from: float = 249
    price_to: Optional[float] = None


class PlanIn(BaseModel):
    name: str
    price: float
    description: str = ""


class ProjectIn(BaseModel):
    title: str
    category: str = "Web Design"
    client_label: str = "Sample project"
    description: str = ""


class StatusIn(BaseModel):
    status: str


class SettingsIn(BaseModel):
    google_client_id: str = ""
    github_client_id: str = ""
    contact_email: str = ""


# ---------- public API ----------
@app.get("/api/health")
def health():
    return {"status": "ok", "site": "Jawad Web Studio"}


@app.get("/api/services")
def list_services(db: Session = Depends(get_db)):
    return [{"id": s.id, "name": s.name, "description": s.description, "price_from": s.price_from, "price_to": s.price_to}
            for s in db.query(Service).order_by(Service.id).all()]


@app.get("/api/projects")
def list_projects(db: Session = Depends(get_db)):
    return [{"id": p.id, "title": p.title, "category": p.category, "client_label": p.client_label, "description": p.description}
            for p in db.query(Project).order_by(Project.id).all()]


@app.get("/api/plans")
def list_plans(db: Session = Depends(get_db)):
    out = []
    for p in db.query(Plan).order_by(Plan.id).all():
        out.append({"id": p.id, "name": p.name, "price": p.price, "description": p.description,
                    "features": [f for f in (p.features or "").split("\n") if f.strip()]})
    return out


@app.post("/api/inquiries", status_code=201)
def create_inquiry(payload: InquiryIn, db: Session = Depends(get_db)):
    row = Inquiry(name=payload.name, email=payload.email, service=payload.service, budget=payload.budget, message=payload.message)
    db.add(row); db.commit(); db.refresh(row)
    return {"id": row.id, "status": row.status}


@app.post("/api/bookings", status_code=201)
def create_booking(payload: BookingIn, db: Session = Depends(get_db)):
    plan = db.query(Plan).filter(Plan.id == payload.plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    row = Booking(plan_id=payload.plan_id, name=payload.name, email=payload.email, notes=payload.notes)
    db.add(row); db.commit(); db.refresh(row)
    return {"id": row.id, "status": row.status, "plan": plan.name}


# ---------- auth ----------
@app.post("/api/auth/register")
def register(payload: RegisterIn, db: Session = Depends(get_db)):
    if len(payload.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    is_admin = db.query(User).count() == 0  # first registered user becomes admin
    user = User(name=payload.name, email=payload.email, password_hash=hash_password(payload.password), is_admin=is_admin)
    db.add(user); db.commit(); db.refresh(user)
    token = new_token()
    db.add(UserSession(token=token, user_id=user.id)); db.commit()
    return {"token": token, "user": user_out(user)}


@app.post("/api/auth/login")
def login(payload: LoginIn, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid login credentials")
    token = new_token()
    db.add(UserSession(token=token, user_id=user.id)); db.commit()
    return {"token": token, "user": user_out(user)}


@app.get("/api/auth/me")
def me(user: User = Depends(get_current_user)):
    return user_out(user)


@app.get("/api/me/requests")
def my_requests(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    inqs = db.query(Inquiry).filter(Inquiry.email == user.email).order_by(Inquiry.id.desc()).all()
    books = db.query(Booking).filter(Booking.email == user.email).order_by(Booking.id.desc()).all()
    plan_names = {p.id: p.name for p in db.query(Plan).all()}
    return {
        "inquiries": [{"id": i.id, "service": i.service, "status": i.status} for i in inqs],
        "bookings": [{"id": b.id, "plan_id": b.plan_id, "plan_name": plan_names.get(b.plan_id, ""), "status": b.status} for b in books],
    }


# ---------- admin ----------
@app.get("/api/admin/users")
def admin_users(_admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    return [user_out(u) for u in db.query(User).order_by(User.id).all()]


@app.delete("/api/admin/users/{user_id}")
def admin_delete_user(user_id: int, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    if user_id == admin.id:
        raise HTTPException(status_code=400, detail="You cannot delete your own admin account")
    row = db.query(User).filter(User.id == user_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="User not found")
    db.query(UserSession).filter(UserSession.user_id == user_id).delete()
    db.delete(row); db.commit()
    return {"ok": True}


@app.get("/api/admin/inquiries")
def admin_inquiries(_admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    return [{"id": i.id, "name": i.name, "email": i.email, "service": i.service, "budget": i.budget, "message": i.message, "status": i.status}
            for i in db.query(Inquiry).order_by(Inquiry.id.desc()).all()]


@app.get("/api/admin/bookings")
def admin_bookings(_admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    plan_names = {p.id: p.name for p in db.query(Plan).all()}
    return [{"id": b.id, "plan_id": b.plan_id, "plan_name": plan_names.get(b.plan_id, ""), "name": b.name, "email": b.email, "notes": b.notes, "status": b.status}
            for b in db.query(Booking).order_by(Booking.id.desc()).all()]


@app.get("/api/admin/settings")
def get_settings(_admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    rows = {r.key: r.value for r in db.query(Setting).all()}
    return {"google_client_id": rows.get("google_client_id", ""), "github_client_id": rows.get("github_client_id", ""), "contact_email": rows.get("contact_email", "")}


@app.put("/api/admin/settings")
def put_settings(payload: SettingsIn, _admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    for key, value in payload.dict().items():
        row = db.query(Setting).filter(Setting.key == key).first()
        if row:
            row.value = value
        else:
            db.add(Setting(key=key, value=value))
    db.commit()
    return {"ok": True}


@app.post("/api/admin/services", status_code=201)
def admin_create_service(payload: ServiceIn, _admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    row = Service(name=payload.name, description=payload.description, price_from=payload.price_from, price_to=payload.price_to)
    db.add(row); db.commit(); db.refresh(row)
    return {"id": row.id}


@app.put("/api/admin/services/{service_id}")
def admin_update_service(service_id: int, payload: ServiceIn, _admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    row = db.query(Service).filter(Service.id == service_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Service not found")
    row.name, row.description, row.price_from, row.price_to = payload.name, payload.description, payload.price_from, payload.price_to
    db.commit()
    return {"ok": True}


@app.delete("/api/admin/services/{service_id}")
def admin_delete_service(service_id: int, _admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    row = db.query(Service).filter(Service.id == service_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Service not found")
    db.delete(row); db.commit()
    return {"ok": True}


@app.put("/api/admin/plans/{plan_id}")
def admin_update_plan(plan_id: int, payload: PlanIn, _admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    row = db.query(Plan).filter(Plan.id == plan_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Plan not found")
    row.name, row.price, row.description = payload.name, payload.price, payload.description
    db.commit()
    return {"ok": True}


@app.post("/api/admin/projects", status_code=201)
def admin_create_project(payload: ProjectIn, _admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    row = Project(title=payload.title, category=payload.category, client_label=payload.client_label, description=payload.description)
    db.add(row); db.commit(); db.refresh(row)
    return {"id": row.id}


@app.delete("/api/admin/projects/{project_id}")
def admin_delete_project(project_id: int, _admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    row = db.query(Project).filter(Project.id == project_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Project not found")
    db.delete(row); db.commit()
    return {"ok": True}


@app.put("/api/admin/inquiries/{inquiry_id}")
def admin_update_inquiry(inquiry_id: int, payload: StatusIn, _admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    row = db.query(Inquiry).filter(Inquiry.id == inquiry_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Inquiry not found")
    row.status = payload.status; db.commit()
    return {"ok": True}


@app.put("/api/admin/bookings/{booking_id}")
def admin_update_booking(booking_id: int, payload: StatusIn, _admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    row = db.query(Booking).filter(Booking.id == booking_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Booking not found")
    row.status = payload.status; db.commit()
    return {"ok": True}


# ---------- frontend (served last, so /api/* wins) ----------
@app.get("/")
def root():
    return FileResponse(os.path.join(FRONTEND_DIR, "index.html"))


@app.get("/admin.html")
def admin_page():
    return FileResponse(os.path.join(FRONTEND_DIR, "admin.html"))


app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="frontend")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)
