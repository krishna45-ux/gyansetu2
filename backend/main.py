
import os
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from datetime import datetime, timedelta
from typing import List
from passlib.context import CryptContext
from jose import JWTError, jwt
from sqlalchemy.orm import Session
import json

# Absolute imports for direct execution
import schemas
import database
import models

# --- CONFIGURATION ---
# SECRET_KEY is loaded from environment variable on Render; fallback for local dev only
SECRET_KEY = os.environ.get("SECRET_KEY", "local-dev-secret-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 3000

# Create Database Tables
models.User.metadata.create_all(bind=database.engine)

app = FastAPI()

# Enable CORS - Allow the Vercel frontend and localhost for dev
# Set FRONTEND_URL env var on Render to your Vercel URL (e.g. https://gyansetu.vercel.app)
FRONTEND_URL = os.environ.get("FRONTEND_URL", "")
allowed_origins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
]
if FRONTEND_URL:
    allowed_origins.append(FRONTEND_URL)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

# --- HELPERS ---
def get_password_hash(password):
    return pwd_context.hash(password)

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(database.get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    user = db.query(models.User).filter(models.User.email == email).first()
    if user is None:
        raise credentials_exception
    return user

# --- AUTH ROUTES ---

@app.post("/auth/register")
def register(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    existing_user = db.query(models.User).filter(models.User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(user.password)
    
    new_user = models.User(
        email=user.email,
        hashed_password=hashed_password,
        full_name=user.full_name,
        role=user.role,
        institution=user.institution,
        bio="Ready to bridge the gap.",
        join_date=datetime.now().strftime("%b %Y"),
        interests="[]",
        completed_chapters="[]"
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"message": "User created successfully"}

@app.post("/auth/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/auth/me", response_model=schemas.UserProfile)
def read_users_me(current_user: models.User = Depends(get_current_user)):
    # Parse JSON strings back to lists for the response
    return {
        "name": current_user.full_name,
        "role": current_user.role,
        "bio": current_user.bio,
        "joinDate": current_user.join_date, 
        "interests": json.loads(current_user.interests) if current_user.interests else [],
        "email": current_user.email,
        "career_goal": current_user.career_goal,
        "completed_chapters": json.loads(current_user.completed_chapters) if current_user.completed_chapters else []
    }

# --- USER DATA ROUTES ---

@app.put("/users/profile")
def update_profile(data: dict, current_user: models.User = Depends(get_current_user), db: Session = Depends(database.get_db)):
    
    if "bio" in data: 
        current_user.bio = data["bio"]
    if "name" in data: 
        current_user.full_name = data["name"]
        
    # Handle Arrays -> JSON String
    if "interests" in data and isinstance(data["interests"], list):
        current_user.interests = json.dumps(data["interests"])
        
    if "completed_chapters" in data and isinstance(data["completed_chapters"], list):
        current_user.completed_chapters = json.dumps(data["completed_chapters"])
    
    db.commit()
    return {"message": "Profile updated"}

@app.put("/users/career-goal")
def update_career_goal(data: dict, current_user: models.User = Depends(get_current_user), db: Session = Depends(database.get_db)):
    if "career_goal" in data:
        current_user.career_goal = data["career_goal"]
        db.commit()
    return {"message": "Goal updated"}

# --- RESOURCE ROUTES ---

@app.get("/resources", response_model=List[schemas.ResourceResponse])
def get_resources(db: Session = Depends(database.get_db)):
    resources = db.query(models.Resource).order_by(models.Resource.id.desc()).all()
    
    return [
        {
            "id": r.id,
            "title": r.title,
            "type": r.type,
            "subject": r.subject,
            "content": r.content,
            "date": r.date_created,
            "dueDate": r.due_date,
            "author": r.author_name,
            "targetStudent": r.target_student
        } 
        for r in resources
    ]

@app.post("/resources")
def create_resource(res: schemas.ResourceCreate, current_user: models.User = Depends(get_current_user), db: Session = Depends(database.get_db)):
    if current_user.role != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers can post resources")
        
    new_res = models.Resource(
        title=res.title,
        type=res.type,
        subject=res.subject,
        content=res.content,
        date_created=datetime.now().strftime("%Y-%m-%d"),
        due_date=res.dueDate,
        author_name=current_user.full_name,
        target_student=res.targetStudent
    )
    db.add(new_res)
    db.commit()
    return {"message": "Resource created"}

@app.delete("/resources/{resource_id}")
def delete_resource(resource_id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(database.get_db)):
    if current_user.role != "teacher":
         raise HTTPException(status_code=403, detail="Only teachers can delete resources")
    
    res = db.query(models.Resource).filter(models.Resource.id == resource_id).first()
    if res:
        db.delete(res)
        db.commit()
    return {"message": "Deleted"}

# --- QUIZ ROUTES ---

@app.get("/quizzes")
def get_quizzes(db: Session = Depends(database.get_db)):
    quizzes = db.query(models.Quiz).filter(models.Quiz.active == True).order_by(models.Quiz.id.desc()).all()
    return [
        {
            "id": q.id,
            "title": q.title,
            "subject": q.subject,
            "questions": json.loads(q.questions_json),
            "dateCreated": q.date_created,
            "active": q.active
        }
        for q in quizzes
    ]

@app.post("/quizzes")
def create_quiz(quiz_data: dict, current_user: models.User = Depends(get_current_user), db: Session = Depends(database.get_db)):
    if current_user.role != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers can create quizzes")

    # Manually extracting because we don't have a rigid Pydantic model for the incoming Quiz structure in schemas yet
    new_quiz = models.Quiz(
        title=quiz_data.get("title"),
        subject=quiz_data.get("subject"),
        questions_json=json.dumps(quiz_data.get("questions", [])),
        date_created=datetime.now().strftime("%Y-%m-%d"),
        active=True
    )
    db.add(new_quiz)
    db.commit()
    return {"message": "Quiz created"}

# --- PROGRESS ROUTES ---

@app.get("/progress")
def get_progress(current_user: models.User = Depends(get_current_user)):
    last = json.loads(current_user.last_watched) if current_user.last_watched else None
    return {"last_watched": last}

@app.post("/progress/update-last-watched")
def update_last_watched(data: dict, current_user: models.User = Depends(get_current_user), db: Session = Depends(database.get_db)):
    current_user.last_watched = json.dumps(data)
    db.commit()
    return {"message": "Progress saved"}

# --- TEACHER ROUTES ---
@app.get("/teacher/students")
def get_students(db: Session = Depends(database.get_db)):
    students = db.query(models.User).filter(models.User.role == "student").all()
    
    result = []
    for s in students:
        last_watched = json.loads(s.last_watched) if s.last_watched else None
        current_mod = f"{last_watched['subject']}: {last_watched['chapter']}" if last_watched else "Not Started"
        
        result.append({
            "id": s.email,
            "name": s.full_name,
            "careerGoal": s.career_goal or "Undecided",
            "currentModule": current_mod,
            "averageScore": 75, # Placeholder, in real app calculate from quiz submissions
            "quizzesTaken": 0,
            "lastTwoScores": [],
            "status": "Online"
        })
    return result
