from pydantic import BaseModel, EmailStr
from typing import List, Optional

# User Schemas
class UserCreate(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    id: int
    email: EmailStr
    class Config:
        from_attributes = True

# Auth Schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# Parking Schemas
class ParkingZoneCreate(BaseModel):
    name: str
    min_lat: float
    max_lat: float
    min_lon: float
    max_lon: float

class ParkingZone(ParkingZoneCreate):
    id: int
    is_available: bool = True
    class Config:
        from_attributes = True

class ParkRequest(BaseModel):
    zone_id: int
    user_lat: float
    user_lon: float

from datetime import datetime

class ReservationCreate(BaseModel):
    zone_id: int
    start_time: datetime
    end_time: datetime

class Reservation(ReservationCreate):
    id: int
    user_id: int
    is_active: bool
    class Config:
        from_attributes = True