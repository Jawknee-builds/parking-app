from sqlalchemy.orm import Session
import models, schemas, utils

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = utils.hash_password(user.password)
    db_user = models.User(email=user.email, hashed_password=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def get_zones(db: Session):
    return db.query(models.ParkingZone).all()

def create_parking_zone(db: Session, zone: schemas.ParkingZoneCreate):
    db_zone = models.ParkingZone(**zone.dict())
    db.add(db_zone)
    db.commit()
    db.refresh(db_zone)
    return db_zone

def process_parking(db: Session, request: schemas.ParkRequest):
    zone = db.query(models.ParkingZone).filter(models.ParkingZone.id == request.zone_id).first()
    if not zone:
        return {"error": "Zone not found"}
    
    is_inside = (zone.min_lat <= request.user_lat <= zone.max_lat) and \
                (zone.min_lon <= request.user_lon <= zone.max_lon)
    
    if is_inside:
        return {"status": "success", "message": f"Parked in {zone.name}"}
    return {"status": "fail", "message": "Outside zone boundaries"}

def process_parking(db: Session, request: schemas.ParkRequest):
    # 1. Fetch the Zone from Postgres
    zone = db.query(models.ParkingZone).filter(models.ParkingZone.id == request.zone_id).first()
    
    if not zone:
        return {"status": "error", "message": "Parking Zone not found in Manipal database."}

    # 2. The Geofence Logic (The Bounding Box Check)
    # Checks if: min_lat <= student_lat <= max_lat AND min_lon <= student_lon <= max_lon
    is_inside_lat = zone.min_lat <= request.user_lat <= zone.max_lat
    is_inside_lon = zone.min_lon <= request.user_lon <= zone.max_lon

    if is_inside_lat and is_inside_lon:
        # 3. Update the Zone status (Optional: mark as occupied)
        # zone.is_available = False 
        # db.commit()
        return {
            "status": "success", 
            "message": f"Welcome to {zone.name}! Your parking session has started.",
            "location_verified": True
        }
    else:
        return {
            "status": "denied", 
            "message": "Access Denied: You are outside the designated parking area.",
            "location_verified": False
        }