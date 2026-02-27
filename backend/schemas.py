
from pydantic import BaseModel
from typing import Optional, List

# --- Auth Schemas ---
class UserCreate(BaseModel):
    email: str
    password: str
    full_name: str
    role: str
    institution: Optional[str] = None

class UserLogin(BaseModel):
    username: str # OAuth2 spec uses 'username' for email
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

# --- Profile Schemas ---
class UserProfile(BaseModel):
    name: str
    role: str
    bio: str
    joinDate: str
    interests: List[str]
    email: str
    career_goal: Optional[str] = None
    completed_chapters: List[str] = []

    class Config:
        from_attributes = True

# --- Resource Schemas ---
class ResourceCreate(BaseModel):
    title: str
    type: str
    subject: str
    content: str
    dueDate: Optional[str] = None
    targetStudent: Optional[str] = None

class ResourceResponse(ResourceCreate):
    id: int
    date: str
    author: str

    class Config:
        from_attributes = True
