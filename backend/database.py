"""SQLite database setup + seed data (draft, editable in admin)."""
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import Base, Service, Project, Plan

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "jawad.db")
SQLALCHEMY_DATABASE_URL = f"sqlite:///{DB_PATH}"

engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def seed_data():
    """Seed 6 services, 4 sample projects, 3 USD plans — only if tables are empty."""
    db = SessionLocal()
    try:
        if db.query(Service).count() == 0:
            db.add_all([
                Service(name="Web Design", description="Modern, responsive website design with a premium editorial look — warm ivory, deep navy, teal and copper.", price_from=249, price_to=799),
                Service(name="Web Development", description="Hand-coded HTML, CSS and JavaScript frontends with clean, fast, accessible markup.", price_from=499, price_to=1499),
                Service(name="UI/UX Design", description="User research, wireframes, prototypes and design systems that are easy to use.", price_from=299, price_to=999),
                Service(name="E-commerce", description="Online stores with product pages, cart, checkout and order management.", price_from=799, price_to=1499),
                Service(name="SEO", description="Technical SEO, on-page optimisation and performance so customers can find you.", price_from=249, price_to=699),
                Service(name="Python/FastAPI Backend", description="FastAPI backends, REST APIs, auth and SQLite/Postgres databases for real apps.", price_from=499, price_to=1499),
            ])
        if db.query(Project).count() == 0:
            db.add_all([
                Project(title="Sample Storefront", category="E-commerce", client_label="Sample project — Sample Store", description="A sample online store with product grid, cart and checkout flow."),
                Project(title="Sample Agency Site", category="Web Design", client_label="Sample project — Sample Studio", description="A sample agency portfolio with a 3D work ribbon and case-study cards."),
                Project(title="Sample Dashboard App", category="Web Development", client_label="Sample project — Sample App", description="A sample dashboard with login, admin panel and data tables."),
                Project(title="Sample Brand Redesign", category="UI/UX Design", client_label="Sample project — Sample Brand", description="A sample brand and website redesign with a new palette and type system."),
            ])
        if db.query(Plan).count() == 0:
            db.add_all([
                Plan(name="Starter", price=499, description="A clean one-page / small business website.", features="Up to 5 pages\nResponsive design\nContact form\nSEO basics\n1 week delivery"),
                Plan(name="Business", price=999, description="A full business website with CMS-style admin.", features="Up to 12 pages\nAdmin panel\nBlog / portfolio\nBooking or inquiry forms\n2 weeks delivery"),
                Plan(name="Pro Web App", price=1999, description="A full web app with auth, database and admin.", features="Custom web app\nLogin / signup + admin\nPython / FastAPI backend\nDatabase + APIs\nPriority support"),
            ])
        db.commit()
    finally:
        db.close()


def init_db():
    Base.metadata.create_all(bind=engine)
    seed_data()
