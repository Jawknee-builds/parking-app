from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List

from fastapi.middleware.cors import CORSMiddleware

# Add this right after app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, change this to your URL
    allow_methods=["*"],
    allow_headers=["*"],
)

import crud, models, schemas, utils
from database import SessionLocal, engine

# This creates the physical tables in your Postgres database
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Manipal Smart Parking API")

# This enables the "Authorize" button in the /docs UI
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

# --- DATABASE DEPENDENCY ---
def get_db():
    db = SessionLocal()
    try:
        yield db
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
    
    # Generate the "Digital ID Card" (JWT)
    access_token = utils.create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

# --- PARKING ZONE ROUTES (The "Getters" and "Setters") ---

@app.get("/zones", response_model=List[schemas.ParkingZone])
def read_zones(db: Session = Depends(get_db)):
    """ Returns all zones so the Streamlit UI can show them to students """
    return crud.get_zones(db)

@app.post("/zones", response_model=schemas.ParkingZone)
def create_zone(zone: schemas.ParkingZoneCreate, db: Session = Depends(get_db)):
    """ Admin route to add new spots like AB5, KC, or the Library """
    return crud.create_parking_zone(db=db, zone=zone)

# --- PROTECTED PARKING ROUTE ---

@app.post("/park")
def park_vehicle(
    request: schemas.ParkRequest, 
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme) # <--- THIS LOCKS THE ROUTE
):
    """ Only logged-in students with a valid Token can use this """
    return crud.process_parking(db, request)


@app.post("/park")
def park_vehicle(
    request: schemas.ParkRequest, 
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme) # Requires JWT Token
):
    """
    The main 'Park' button action. 
    Verifies identity via Token and Location via Geofence.
    """
    return crud.process_parking(db, request)

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Manipal Smart Parking")

# --- THE FIX STARTS HERE ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], # Allows your React app
    allow_credentials=True,
    allow_methods=["*"], # Allows GET, POST, etc.
    allow_headers=["*"], # Allows Tokens/Auth headers
)
# --- THE FIX ENDS HERE ---