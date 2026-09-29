from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

router = APIRouter()

class LoginRequest(BaseModel):
    email: str
    password: str
    role: Optional[str] = "NCMRWF Meteorologist"

class SignUpRequest(BaseModel):
    full_name: str
    email: str
    password: str
    organization: Optional[str] = "NCMRWF"
    role: Optional[str] = "Operational Forecaster"

class UserResponse(BaseModel):
    token: str
    user: dict

@router.post("/login", response_model=UserResponse)
async def login(req: LoginRequest):
    if not req.email or not req.password:
        raise HTTPException(status_code=400, detail="Email and password are required")
    
    # Extract name from email or generate realistic initials
    email_name = req.email.split("@")[0].replace(".", " ").title()
    name = email_name if len(email_name) > 2 else "Dr. Suraj Zaware"
    
    parts = name.split()
    initials = (parts[0][0] + parts[-1][0]).upper() if len(parts) >= 2 else name[:2].upper()

    user_info = {
        "id": f"usr_{hash(req.email) % 10000:04d}",
        "name": name if "Suraj" in name or "Dr" in name else f"Dr. {name}",
        "email": req.email,
        "role": req.role or "NCMRWF Meteorologist",
        "organization": "NCMRWF - Ministry of Earth Sciences",
        "initials": initials,
        "logged_in_at": datetime.utcnow().isoformat(),
    }

    return {
        "token": f"jwt_mock_token_{hash(req.email)}",
        "user": user_info,
    }

@router.post("/signup", response_model=UserResponse)
async def signup(req: SignUpRequest):
    if not req.email or not req.password or not req.full_name:
        raise HTTPException(status_code=400, detail="Full name, email, and password are required")
    
    parts = req.full_name.split()
    initials = (parts[0][0] + parts[-1][0]).upper() if len(parts) >= 2 else req.full_name[:2].upper()

    user_info = {
        "id": f"usr_{hash(req.email) % 10000:04d}",
        "name": req.full_name,
        "email": req.email,
        "role": req.role or "Operational Forecaster",
        "organization": req.organization or "NCMRWF / IMD",
        "initials": initials,
        "logged_in_at": datetime.utcnow().isoformat(),
    }

    return {
        "token": f"jwt_mock_token_{hash(req.email)}",
        "user": user_info,
    }

@router.get("/me")
async def get_me():
    return {
        "id": "usr_2607",
        "name": "Dr. Suraj Zaware",
        "email": "suraj.zaware@ncmrwf.gov.in",
        "role": "Lead Meteorologist & Scientist",
        "organization": "NCMRWF — MoES",
        "initials": "SZ",
        "status": "authenticated",
    }
