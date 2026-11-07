"""SQLAlchemy models for Jawad Web Studio.

Tables: users, sessions, services, projects, plans, inquiries, bookings, settings.
No passwords or secrets are stored in code — only salted hashes in the DB.
"""
from sqlalchemy import Column, Integer, String, Text, Boolean, Float, ForeignKey, DateTime
from sqlalchemy.orm import declarative_base, relationship
from datetime import datetime

Base = declarative_base()


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    name = Column(String(120), default="")
    email = Column(String(200), unique=True, nullable=False, index=True)
    password_hash = Column(String(300), nullable=False)
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class Session(Base):
    __tablename__ = "sessions"
    id = Column(Integer, primary_key=True)
    token = Column(String(200), unique=True, nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    user = relationship("User")


class Service(Base):
    __tablename__ = "services"
    id = Column(Integer, primary_key=True)
    name = Column(String(120), nullable=False)
    description = Column(Text, default="")
    price_from = Column(Float, default=249)
    price_to = Column(Float, nullable=True)


class Project(Base):
    __tablename__ = "projects"
    id = Column(Integer, primary_key=True)
    title = Column(String(200), nullable=False)
    category = Column(String(120), default="Web Design")
    client_label = Column(String(200), default="Sample project")
    description = Column(Text, default="")


class Plan(Base):
    __tablename__ = "plans"
    id = Column(Integer, primary_key=True)
    name = Column(String(120), nullable=False)
    price = Column(Float, nullable=False)  # USD, one-time, draft
    description = Column(Text, default="")
    features = Column(Text, default="")  # newline-separated


class Inquiry(Base):
    __tablename__ = "inquiries"
    id = Column(Integer, primary_key=True)
    name = Column(String(120), nullable=False)
    email = Column(String(200), nullable=False)
    service = Column(String(120), default="")
    budget = Column(String(120), default="")
    message = Column(Text, default="")
    status = Column(String(40), default="new")
    created_at = Column(DateTime, default=datetime.utcnow)


class Booking(Base):
    __tablename__ = "bookings"
    id = Column(Integer, primary_key=True)
    plan_id = Column(Integer, ForeignKey("plans.id"), nullable=False)
    name = Column(String(120), nullable=False)
    email = Column(String(200), nullable=False)
    notes = Column(Text, default="")
    status = Column(String(40), default="pending")
    created_at = Column(DateTime, default=datetime.utcnow)
    plan = relationship("Plan")


class Setting(Base):
    __tablename__ = "settings"
    id = Column(Integer, primary_key=True)
    key = Column(String(120), unique=True, nullable=False)
    value = Column(Text, default="")
