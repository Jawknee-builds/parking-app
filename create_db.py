from database import engine, Base
import models

# This command looks at every class in models.py 
# and creates a corresponding table in your Postgres database
print("Creating tables in 'parking-app' database...")
Base.metadata.create_all(bind=engine)
print("Tables created successfully!")