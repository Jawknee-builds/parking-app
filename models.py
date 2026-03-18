from database import Base
from sqlalchemy import Column, Integer, String, Float, Boolean

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_active = Column(Boolean, default=True)

class ParkingZone(Base):
    __tablename__ = "parking_zones"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True)
    
    # The 4 points for the Geofence
    min_lat = Column(Float)
    max_lat = Column(Float)
    min_lon = Column(Float)
    max_lon = Column(Float)
    
    is_available = Column(Boolean, default=True)