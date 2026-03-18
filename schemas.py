from pydantic import BaseModel, Field
from typing import Optional, List

# --- User Schemas (For Auth & System Identity) ---
class UserBase(BaseModel):
    email: str
    full_name: str

class UserCreate(UserBase):
    password: str 

class User(UserBase):
    id: int
    is_active: bool

    class Config:
        from_attributes = True

# --- Parking Zone Schemas (4-Point Geofencing) ---
class ParkingZoneBase(BaseModel):
    name: str
    # These 4 points define the "Rectangle" on the Manipal map
    min_lat: float = Field(description="Bottom boundary")
    max_lat: float = Field(description="Top boundary")
    min_lon: float = Field(description="Left boundary")
    max_lon: float = Field(description="Right boundary")

class ParkingZoneCreate(ParkingZoneBase):
    pass

class ParkingZone(ParkingZoneBase):
    id: int
    is_available: bool = True

    class Config:
        from_attributes = True

# --- The "Action" Schema (What the Mobile App sends) ---
class ParkRequest(BaseModel):
    zone_id: int
    user_lat: float
    user_lon: float