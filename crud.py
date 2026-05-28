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

def get_user_reservations(db: Session, user_id: int):
    return db.query(models.Reservation).filter(models.Reservation.user_id == user_id).all()

def create_reservation(db: Session, reservation: schemas.ReservationCreate, user_id: int):
    db_res = models.Reservation(
        user_id=user_id,
        zone_id=reservation.zone_id,
        start_time=reservation.start_time,
        end_time=reservation.end_time,
        is_active=True
    )
    db.add(db_res)
    db.commit()
    db.refresh(db_res)
    return db_res

def process_parking(db: Session, request: schemas.ParkRequest):
    # Fetch the Zone from the database
    zone = db.query(models.ParkingZone).filter(models.ParkingZone.id == request.zone_id).first()
    
    if not zone:
        return {
            "status": "error", 
            "message": "Parking Zone not found in Manipal database.",
            "location_verified": False
        }

    # Bounding Box Geofence check
    is_inside_lat = zone.min_lat <= request.user_lat <= zone.max_lat
    is_inside_lon = zone.min_lon <= request.user_lon <= zone.max_lon

    if is_inside_lat and is_inside_lon:
        # Mark zone as occupied if needed in a live implementation
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