from sqlalchemy.orm import Session
import models, schemas

# 1. READ: Get all parking zones for the students
def get_zones(db: Session):
    return db.query(models.ParkingZone).all()

# 2. CREATE: Add a new parking zone (like AB5 or Library)
def create_zone(db: Session, zone: schemas.ParkingZoneCreate):
    db_zone = models.ParkingZone(
        name=zone.name,
        min_lat=zone.min_lat,
        max_lat=zone.max_lat,
        min_lon=zone.min_lon,
        max_lon=zone.max_lon
    )
    db.add(db_zone)
    db.commit()
    db.refresh(db_zone)
    return db_zone

# 3. LOGIC: The "Is Inside" Geofencing Check
def process_parking_attempt(db: Session, request: schemas.ParkRequest):
    # Fetch the zone boundaries from the database
    zone = db.query(models.ParkingZone).filter(models.ParkingZone.id == request.zone_id).first()
    
    if not zone:
        return {"status": "error", "message": "Zone not found"}

    # The Bounding Box Logic
    is_inside_lat = zone.min_lat <= request.user_lat <= zone.max_lat
    is_inside_lon = zone.min_lon <= request.user_lon <= zone.max_lon

    if is_inside_lat and is_inside_lon:
        # Update the database to show the spot is taken
        zone.is_available = False
        db.commit()
        return {"status": "success", "message": f"Welcome! You have parked in {zone.name}."}
    else:
        return {"status": "denied", "message": "You are outside the parking boundary!"}