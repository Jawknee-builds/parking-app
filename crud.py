from sqlalchemy.orm import Session
from fastapi import HTTPException
import models, schemas

def get_zones(db: Session):
    return db.query(models.ParkingZone).all()

def create_zone(db: Session, zone: schemas.ParkingZoneCreate):
    db_zone = models.ParkingZone(**zone.dict())
    db.add(db_zone)
    db.commit()
    db.refresh(db_zone)
    return db_zone

def process_parking_attempt(db: Session, request: schemas.ParkRequest):
    zone = db.query(models.ParkingZone).filter(models.ParkingZone.id == request.zone_id).first()
    if not zone:
        raise HTTPException(status_code=404, detail="Zone not found")
    
    # Check if user is within the zone bounds
    if (zone.min_lat <= request.user_lat <= zone.max_lat and
        zone.min_lon <= request.user_lon <= zone.max_lon):
        # Assuming parking is allowed
        return {"message": "Parking allowed", "zone": zone.name}
    else:
        return {"message": "Outside zone boundaries", "zone": zone.name}