"""SQLite database setup + seed data (Phase 3: 15 approved services, 6 quote packages, no sample projects, no prices)."""
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
    """Seed the 15 approved website services and the 6 quote packages.

    No sample projects are seeded (the Selected Work section is an
    empty state until real projects are added). No prices are seeded:
    every package is quoted on scope ("Request a Custom Quote").
    """
    db = SessionLocal()
    try:
        if db.query(Service).count() == 0:
            db.add_all([
                Service(name="Custom Website Design", description="A website designed around your business, your content and your customers — clear layout, considered typography and a look that fits your brand.", price_from=0, price_to=None),
                Service(name="Website Development", description="Your approved design built as a fast, responsive website that works across phones, tablets and desktop.", price_from=0, price_to=None),
                Service(name="Website Redesign", description="An existing website rebuilt with a clearer structure, a fresh look and a better experience for your visitors.", price_from=0, price_to=None),
                Service(name="Business Website Development", description="A complete website for your business: services, about, contact and everything a visitor needs to reach you.", price_from=0, price_to=None),
                Service(name="E-commerce Website Development", description="An online store where customers can browse products, add to cart and check out.", price_from=0, price_to=None),
                Service(name="Landing Page Design & Development", description="A focused single page built around one offer, with a clear message and a clear next step.", price_from=0, price_to=None),
                Service(name="Premium 3D Website Development", description="A website with carefully crafted three-dimensional elements that add depth where it suits the design.", price_from=0, price_to=None),
                Service(name="Motion & Scroll Animation Websites", description="Subtle scroll and motion that guides visitors through the page without distracting from the content.", price_from=0, price_to=None),
                Service(name="Responsive Website Development", description="Your website checked and tuned so it reads and works well on every screen size.", price_from=0, price_to=None),
                Service(name="Website Fixes & Bug Fixing", description="Broken layouts, forms that do not send, links that go nowhere — found and fixed.", price_from=0, price_to=None),
                Service(name="Website Performance Optimization", description="A review of what slows your site down, with the fixes that make it load and respond faster.", price_from=0, price_to=None),
                Service(name="Website Speed Optimization", description="Faster loading pages, tuned images and leaner code, so visitors do not wait.", price_from=0, price_to=None),
                Service(name="Basic Technical SEO Audit", description="A basic technical check of your site — structure, titles, descriptions and the issues search engines notice first.", price_from=0, price_to=None),
                Service(name="Website Maintenance", description="Ongoing care for your website: updates, small changes and checks that it stays working.", price_from=0, price_to=None),
                Service(name="Website Updates and Improvements", description="Small changes and improvements to your existing website, made carefully and tested before they go live.", price_from=0, price_to=None),
            ])
        # No projects are seeded on purpose: the Selected Work section
        # shows "Selected projects will be showcased here." until the
        # studio adds real projects in the admin panel.
        if db.query(Plan).count() == 0:
            db.add_all([
                Plan(name="Landing Page", price=0, description="A single focused page for one offer or campaign.", features="One page, designed and built\nContact or enquiry form\nResponsive on all devices\nBasic technical SEO check"),
                Plan(name="Business Website", price=0, description="A complete website for your business.", features="Up to 5 pages\nServices, about and contact\nEnquiry form\nResponsive on all devices"),
                Plan(name="E-commerce Website", price=0, description="An online store for your products.", features="Product pages\nCart and checkout\nOrder management\nResponsive on all devices"),
                Plan(name="Premium 3D & Motion Website", price=0, description="A website with 3D elements and scroll motion.", features="Custom 3D elements\nScroll animations\nDesigned around your brand\nResponsive on all devices"),
                Plan(name="Website Redesign", price=0, description="Your existing website, rebuilt.", features="New design, same content refined\nClearer structure\nResponsive on all devices\nChecked before launch"),
                Plan(name="Website Maintenance", price=0, description="Ongoing care for your website.", features="Regular updates\nSmall changes included\nChecks that it stays working\nSupport by enquiry"),
            ])
        db.commit()
    finally:
        db.close()


def init_db():
    Base.metadata.create_all(bind=engine)
    seed_data()
