from sqlalchemy import Column, Integer, String, Float, Boolean
from database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_active = Column(Boolean, default=True)

class ParkingZone(Base):
    __tablename__ = "parking_zones"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    min_lat = Column(Float)
    max_lat = Column(Float)
    min_lon = Column(Float)
    max_lon = Column(Float)
    is_available = Column(Boolean, default=True)

from sqlalchemy import ForeignKey, DateTime
from datetime import datetime

class Reservation(Base):
    __tablename__ = "reservations"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id")) # Links to User
    zone_id = Column(Integer, ForeignKey("parking_zones.id")) # Links to Zone
    start_time = Column(DateTime)
    end_time = Column(DateTime)
    is_active = Column(Boolean, default=True)