from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# The connection string: dialect://user:password@host/dbname
# Since you named your DB 'parking-app', we use that here.
SQLALCHEMY_DATABASE_URL = "postgresql://localhost/parking-app"

# The Engine is the actual connection to the database
engine = create_engine(SQLALCHEMY_DATABASE_URL)

# Each instance of SessionLocal will be a database session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for our database models to inherit from
Base = declarative_base()

# This is a 'Dependency' - it opens a connection and closes it 
# automatically when the API request is finished.
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()