from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

import models, schemas, crud
from database import engine, get_db

# 1. Create the Database Tables
# This ensures 'users' and 'parking_zones' exist in Postgres
models.Base.metadata.create_all(bind=engine)

# 2. Initialize the FastAPI App
# CRITICAL: This 'app' variable name must match the 'app' in 'uvicorn main:app'
app = FastAPI(title="Manipal Smart Parking API")

@app.get("/")
def read_root():
    return {"message": "Welcome to the MIT Manipal Parking API", "status": "online"}

# 3. Routes linked to CRUD Logic
@app.get("/zones", response_model=List[schemas.ParkingZone])
def read_zones(db: Session = Depends(get_db)):
    return crud.get_zones(db)

@app.post("/zones", response_model=schemas.ParkingZone)
def create_new_zone(zone: schemas.ParkingZoneCreate, db: Session = Depends(get_db)):
    return crud.create_zone(db=db, zone=zone)

@app.post("/park")
def park_vehicle(request: schemas.ParkRequest, db: Session = Depends(get_db)):
    result = crud.process_parking_attempt(db, request)
    if result["status"] == "error":
        raise HTTPException(status_code=404, detail=result["message"])
    return result