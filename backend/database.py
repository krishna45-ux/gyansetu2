import os
import ssl
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Use PostgreSQL on cloud (DATABASE_URL is injected via env).
# Falls back to local SQLite for development.
DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./sql_app.db")

# Render/Supabase URLs start with "postgres://" but SQLAlchemy needs "postgresql://"
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

is_sqlite = DATABASE_URL.startswith("sqlite")

# SQLite needs check_same_thread; PostgreSQL needs SSL for cloud providers (Supabase, etc.)
if is_sqlite:
    connect_args = {"check_same_thread": False}
else:
    connect_args = {}

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    # Required for Supabase / cloud Postgres — keeps pool connections alive
    pool_pre_ping=True,
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
