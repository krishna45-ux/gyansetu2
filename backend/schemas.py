
from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List
from datetime import datetime

# --- Auth Schemas ---
class UserCreate(BaseModel):
    email: str = Field(..., min_length=5, max_length=100)
    password: str = Field(..., min_length=6, max_length=128)
    full_name: str = Field(..., min_length=2, max_length=100)
    role: str = Field(..., pattern="^(student|teacher)$")
    institution: Optional[str] = Field(None, max_length=200)

class UserLogin(BaseModel):
    username: str   # OAuth2 spec uses 'username' for email
    password: str

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str

class RefreshRequest(BaseModel):
    refresh_token: str

class GoogleAuthRequest(BaseModel):
    """Phase 2: Used by POST /auth/google to accept Firebase ID token + desired role."""
    id_token: str
    role: str = Field("student", pattern="^(student|teacher)$")
    institution: Optional[str] = Field(None, max_length=200)

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

class ProfileUpdate(BaseModel):
    bio: Optional[str] = Field(None, max_length=500)
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    interests: Optional[List[str]] = None
    completed_chapters: Optional[List[str]] = None

class CareerGoalUpdate(BaseModel):
    career_goal: str = Field(..., min_length=2, max_length=200)

# --- Resource Schemas ---
class ResourceCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    type: str = Field(..., pattern="^(assignment|note|remedial)$")
    subject: str = Field(..., min_length=1, max_length=100)
    content: str = Field(..., min_length=1)
    dueDate: Optional[str] = None
    targetStudent: Optional[str] = None
    attachment_url: Optional[str] = None  # Phase 2: Cloudinary URL

class ResourceResponse(BaseModel):
    id: int
    title: str
    type: str
    subject: str
    content: str
    date: str
    dueDate: Optional[str] = None
    author: str
    targetStudent: Optional[str] = None
    attachment_url: Optional[str] = None  # Phase 2: Cloudinary URL

    class Config:
        from_attributes = True

# --- Quiz Schemas ---
class QuestionOption(BaseModel):
    text: str = Field(..., min_length=1, max_length=500)

class QuestionSchema(BaseModel):
    question: str = Field(..., min_length=5, max_length=1000)
    options: List[str] = Field(..., min_length=2, max_length=6)
    answer: str = Field(..., min_length=1)

class QuizCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    subject: str = Field(..., min_length=1, max_length=100)
    questions: List[QuestionSchema] = Field(..., min_length=1, max_length=50)

# --- Quiz Submission Schemas ---
class QuizSubmissionCreate(BaseModel):
    quiz_id: int
    score: int = Field(..., ge=0, le=100)

class QuizSubmissionResponse(BaseModel):
    id: int
    quiz_id: int
    score: int
    submitted_at: datetime

    class Config:
        from_attributes = True

# --- Progress Schemas ---
class LastWatchedUpdate(BaseModel):
    subject: str = Field(..., min_length=1, max_length=100)
    chapter: str = Field(..., min_length=1, max_length=200)

# --- Search Schemas ---
class SearchResult(BaseModel):
    resources: List[dict] = []
    quizzes: List[dict] = []

# --- File Upload Schema ---
class UploadResponse(BaseModel):
    url: str
    filename: str
    resource_type: str
