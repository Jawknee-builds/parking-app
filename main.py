from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

import crud, models, schemas, utils
from database import engine, get_db, SessionLocal

# 1. Initialize Database Tables
models.Base.metadata.create_all(bind=engine)

# 2. Define the FastAPI App Instance
app = FastAPI(title="Manipal Smart Parking")

# 3. Configure CORS to be production-ready (allows Vercel deployments to connect seamlessly)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow any frontend origin to eliminate CORS blocks in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 4. Define Security Scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

# --- DATABASE AUTOMATED STARTUP SEEDING ---
@app.on_event("startup")
def seed_database_on_startup():
    db = SessionLocal()
    try:
        # Check if parking zones exist. If empty, seed realistic campus zones
        if db.query(models.ParkingZone).count() == 0:
            print("[*] Empty database detected. Seeding realistic Manipal Campus Parking Zones...")
            zones_to_seed = [
                {
                    "name": "MIT Food Court (Zone A)",
                    "min_lat": 13.348,
                    "max_lat": 13.351,
                    "min_lon": 74.791,
                    "max_lon": 74.793,
                    "is_available": True
                },
                {
                    "name": "KMC Hospital (Zone B)",
                    "min_lat": 13.353,
                    "max_lat": 13.356,
                    "min_lon": 74.787,
                    "max_lon": 74.789,
                    "is_available": True
                },
                {
                    "name": "Library & Admin Block (Zone C)",
                    "min_lat": 13.351,
                    "max_lat": 13.353,
                    "min_lon": 74.793,
                    "max_lon": 74.795,
                    "is_available": False # Seed as full to demonstrate geofence occupancy checks
                },
                {
                    "name": "Student Center North (Zone D)",
                    "min_lat": 13.354,
                    "max_lat": 13.357,
                    "min_lon": 74.790,
                    "max_lon": 74.792,
                    "is_available": True
                }
            ]
            for zone_data in zones_to_seed:
                db_zone = models.ParkingZone(**zone_data)
                db.add(db_zone)
            db.commit()
            print("[+] Seeding completed successfully!")
    except Exception as e:
        print(f"[-] Database seeding failed: {e}")
    finally:
        db.close()


# --- AUTHENTICATION ROUTES ---

@app.post("/signup", response_model=schemas.User)
def signup(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    return crud.create_user(db=db, user=user)

@app.post("/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = crud.get_user_by_email(db, email=form_data.username)
    if not user or not utils.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    access_token = utils.create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}


# --- PARKING ZONE ROUTES ---

@app.get("/zones", response_model=List[schemas.ParkingZone])
def read_zones(db: Session = Depends(get_db)):
    return crud.get_zones(db)

@app.post("/zones", response_model=schemas.ParkingZone)
def create_zone(zone: schemas.ParkingZoneCreate, db: Session = Depends(get_db)):
    return crud.create_parking_zone(db=db, zone=zone)


# --- RESERVATION & PARKING ROUTES ---

@app.post("/park")
def park_vehicle(
    request: schemas.ParkRequest, 
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
):
    """Immediate parking with Geofence verification"""
    return crud.process_parking(db, request)

@app.post("/reserve", response_model=schemas.Reservation)
def book_spot(
    res_data: schemas.ReservationCreate, 
    db: Session = Depends(get_db), 
    token: str = Depends(oauth2_scheme)
):
    """Future booking for a specific time slot"""
    # Auto-infer user from DB or default to 1 for MVP simplicity
    return crud.create_reservation(db, res_data, user_id=1)

@app.get("/reservations", response_model=List[schemas.Reservation])
def list_reservations(
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
):
    """List all active parking reservations for the user"""
    return crud.get_user_reservations(db, user_id=1)