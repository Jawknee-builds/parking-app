import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Uses Postgres URL in production (e.g. Railway) and falls back to SQLite locally
if os.getenv("VERCEL"):
    SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:////tmp/parking.db")
else:
    SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./parking.db")

# Standard configuration logic for SQLite compatibility
if SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
    )
else:
    # Ensure correct protocol prefix for SQLAlchemy postgres connections
    url = SQLALCHEMY_DATABASE_URL
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql://", 1)
    engine = create_engine(url)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()