import bcrypt
from datetime import datetime, timedelta
from jose import jwt

SECRET_KEY = "MANIPAL_SECRET_2026"
ALGORITHM = "HS256"

def hash_password(password: str):
    # Hash a password using native bcrypt
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def verify_password(plain: str, hashed: str):
    # Verify a password using native bcrypt
    return bcrypt.checkpw(plain.encode('utf-8'), hashed.encode('utf-8'))

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=30)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)