
import os
import json
from dotenv import load_dotenv
from fastapi import FastAPI, Depends, HTTPException, status, Request, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from datetime import datetime, timedelta
from typing import List, Optional
from passlib.context import CryptContext
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from sqlalchemy import or_
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import cloudinary
import cloudinary.uploader

# Absolute imports for direct execution
import schemas
import database
import models

# ─────────────────────────────────────────────
# LOAD ENV VARS
# ─────────────────────────────────────────────
load_dotenv()  # Loads backend/.env for local development

# ─────────────────────────────────────────────
# CONFIGURATION
# ─────────────────────────────────────────────
SECRET_KEY = os.environ.get("SECRET_KEY", "local-dev-secret-change-in-production")
REFRESH_SECRET_KEY = os.environ.get("REFRESH_SECRET_KEY", "local-refresh-secret-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7

# ── Startup env-var guard ────────────────────
IS_PRODUCTION = os.environ.get("RENDER") or os.environ.get("ENV") == "production"
if IS_PRODUCTION:
    if SECRET_KEY == "local-dev-secret-change-in-production":
        raise RuntimeError("FATAL: SECRET_KEY must be set as a real secret in production!")
    if REFRESH_SECRET_KEY == "local-refresh-secret-change-in-production":
        raise RuntimeError("FATAL: REFRESH_SECRET_KEY must be set as a real secret in production!")

# ── Cloudinary Configuration (Phase 2) ──────
cloudinary.config(
    cloud_name=os.environ.get("CLOUDINARY_CLOUD_NAME", "di66mvmgz"),
    api_key=os.environ.get("CLOUDINARY_API_KEY", "549631319941797"),
    api_secret=os.environ.get("CLOUDINARY_API_SECRET", "KN7IUP36_pCwLhJFGuVSdPHaUqg"),
    secure=True
)

# ── Firebase Admin (Phase 2 — Google OAuth) ─
firebase_app = None
try:
    import firebase_admin
    from firebase_admin import credentials, auth as firebase_auth
    service_account_path = os.environ.get("FIREBASE_SERVICE_ACCOUNT_PATH", "./serviceAccountKey.json")
    if os.path.exists(service_account_path):
        cred = credentials.Certificate(service_account_path)
        firebase_app = firebase_admin.initialize_app(cred)
        print("[OK] Firebase Admin SDK initialized.")
    else:
        print("[WARN] Firebase service account not found - Google OAuth disabled locally.")
except Exception as e:
    print(f"[WARN] Firebase Admin init skipped: {e}")

# Create Database Tables
models.User.metadata.create_all(bind=database.engine)

# ─────────────────────────────────────────────
# APP & RATE LIMITER SETUP
# ─────────────────────────────────────────────
limiter = Limiter(key_func=get_remote_address)
app = FastAPI(title="GyanSetu API", version="2.0.0")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ─────────────────────────────────────────────
# CORS
# ─────────────────────────────────────────────
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
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def create_refresh_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, REFRESH_SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(database.get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        token_type: str = payload.get("type")
        if email is None or token_type != "access":
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(models.User).filter(models.User.email == email).first()
    if user is None:
        raise credentials_exception
    return user

# ─────────────────────────────────────────────
# AUTH ROUTES
# ─────────────────────────────────────────────

@app.post("/auth/register", status_code=201)
@limiter.limit("10/minute")
def register(request: Request, user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    existing = db.query(models.User).filter(models.User.email == user.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    new_user = models.User(
        email=user.email,
        hashed_password=get_password_hash(user.password),
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
@limiter.limit("5/minute")
def login(request: Request, form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(data={"sub": user.email})
    refresh_token = create_refresh_token(data={"sub": user.email})
    user.refresh_token = refresh_token
    db.commit()

    return {"access_token": access_token, "refresh_token": refresh_token, "token_type": "bearer"}


@app.post("/auth/google", response_model=schemas.Token)
@limiter.limit("10/minute")
def google_auth(request: Request, body: schemas.GoogleAuthRequest, db: Session = Depends(database.get_db)):
    """
    Phase 2: Google OAuth via Firebase (client-side verified).
    Frontend sends the authenticated user's email + display name.
    Backend creates the user in DB if new, returns JWT tokens.
    """
    google_email = body.email.strip().lower()
    google_name = body.full_name or google_email.split("@")[0]

    if not google_email:
        raise HTTPException(status_code=400, detail="Google account has no email address")

    # Get or create user
    user = db.query(models.User).filter(models.User.email == google_email).first()
    if not user:
        user = models.User(
            email=google_email,
            hashed_password=get_password_hash(os.urandom(32).hex()),  # Random — Google users don't use password
            full_name=google_name,
            role=body.role,
            institution=body.institution or "",
            bio="Ready to bridge the gap.",
            join_date=datetime.now().strftime("%b %Y"),
            interests="[]",
            completed_chapters="[]"
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    access_token = create_access_token(data={"sub": user.email})
    refresh_token = create_refresh_token(data={"sub": user.email})
    user.refresh_token = refresh_token
    db.commit()

    return {"access_token": access_token, "refresh_token": refresh_token, "token_type": "bearer"}


@app.post("/auth/refresh", response_model=schemas.Token)
def refresh_token(body: schemas.RefreshRequest, db: Session = Depends(database.get_db)):
    credentials_exception = HTTPException(status_code=401, detail="Invalid or expired refresh token")
    try:
        payload = jwt.decode(body.refresh_token, REFRESH_SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        token_type: str = payload.get("type")
        if email is None or token_type != "refresh":
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(models.User).filter(models.User.email == email).first()
    if user is None or user.refresh_token != body.refresh_token:
        raise credentials_exception

    new_access = create_access_token(data={"sub": user.email})
    new_refresh = create_refresh_token(data={"sub": user.email})
    user.refresh_token = new_refresh
    db.commit()

    return {"access_token": new_access, "refresh_token": new_refresh, "token_type": "bearer"}


@app.post("/auth/logout")
def logout(current_user: models.User = Depends(get_current_user), db: Session = Depends(database.get_db)):
    current_user.refresh_token = None
    db.commit()
    return {"message": "Logged out successfully"}


@app.get("/auth/me", response_model=schemas.UserProfile)
def read_users_me(current_user: models.User = Depends(get_current_user)):
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

# ─────────────────────────────────────────────
# USER DATA ROUTES
# ─────────────────────────────────────────────

@app.put("/users/profile")
def update_profile(
    data: schemas.ProfileUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db)
):
    if data.bio is not None:
        current_user.bio = data.bio
    if data.name is not None:
        current_user.full_name = data.name
    if data.interests is not None:
        current_user.interests = json.dumps(data.interests)
    if data.completed_chapters is not None:
        current_user.completed_chapters = json.dumps(data.completed_chapters)
    db.commit()
    return {"message": "Profile updated"}


@app.put("/users/career-goal")
def update_career_goal(
    data: schemas.CareerGoalUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db)
):
    current_user.career_goal = data.career_goal
    db.commit()
    return {"message": "Goal updated"}

# ─────────────────────────────────────────────
# RESOURCE ROUTES
# ─────────────────────────────────────────────

@app.get("/resources", response_model=List[schemas.ResourceResponse])
def get_resources(skip: int = 0, limit: int = 20, db: Session = Depends(database.get_db)):
    if limit > 100:
        limit = 100
    resources = db.query(models.Resource).order_by(models.Resource.id.desc()).offset(skip).limit(limit).all()
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
            "targetStudent": r.target_student,
            "attachment_url": r.attachment_url,
        }
        for r in resources
    ]


@app.post("/resources", status_code=201)
def create_resource(
    res: schemas.ResourceCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db)
):
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
        target_student=res.targetStudent,
        attachment_url=res.attachment_url,      # Phase 2: Cloudinary URL
    )
    db.add(new_res)
    db.commit()
    return {"message": "Resource created"}


@app.post("/resources/upload", response_model=schemas.UploadResponse)
async def upload_resource_file(
    file: UploadFile = File(...),
    current_user: models.User = Depends(get_current_user)
):
    """
    Phase 2: Upload a file (PDF, image, doc) to Cloudinary.
    Returns the secure URL to store alongside the resource.
    Teacher-only.
    """
    if current_user.role != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers can upload files")

    # Validate file size (10 MB max)
    MAX_SIZE = 10 * 1024 * 1024
    contents = await file.read()
    if len(contents) > MAX_SIZE:
        raise HTTPException(status_code=413, detail="File too large. Maximum size is 10 MB.")

    try:
        result = cloudinary.uploader.upload(
            contents,
            resource_type="auto",           # Handles PDFs, images, docs
            folder="gyansetu/resources",    # Organise in Cloudinary
            public_id=f"{current_user.email.split('@')[0]}_{datetime.utcnow().timestamp()}",
            use_filename=True,
            unique_filename=True,
        )
        return {
            "url": result["secure_url"],
            "filename": file.filename,
            "resource_type": result["resource_type"],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


@app.delete("/resources/{resource_id}")
def delete_resource(
    resource_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db)
):
    if current_user.role != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers can delete resources")
    res = db.query(models.Resource).filter(models.Resource.id == resource_id).first()
    if res:
        db.delete(res)
        db.commit()
    return {"message": "Deleted"}

# ─────────────────────────────────────────────
# SEARCH ROUTE (Phase 2)
# ─────────────────────────────────────────────

@app.get("/search", response_model=schemas.SearchResult)
def search(q: str, skip: int = 0, limit: int = 10, db: Session = Depends(database.get_db)):
    """
    Phase 2: Full-text search across resources and quizzes.
    Usage: GET /search?q=physics
    """
    if not q or len(q.strip()) < 2:
        return {"resources": [], "quizzes": []}
    if limit > 50:
        limit = 50

    term = f"%{q.strip()}%"

    matching_resources = (
        db.query(models.Resource)
        .filter(
            or_(
                models.Resource.title.ilike(term),
                models.Resource.subject.ilike(term),
                models.Resource.content.ilike(term),
            )
        )
        .offset(skip).limit(limit).all()
    )

    matching_quizzes = (
        db.query(models.Quiz)
        .filter(
            or_(
                models.Quiz.title.ilike(term),
                models.Quiz.subject.ilike(term),
            )
        )
        .filter(models.Quiz.active == True)
        .offset(skip).limit(limit).all()
    )

    return {
        "resources": [
            {"id": r.id, "title": r.title, "type": r.type, "subject": r.subject, "author": r.author_name}
            for r in matching_resources
        ],
        "quizzes": [
            {"id": q.id, "title": q.title, "subject": q.subject, "dateCreated": q.date_created}
            for q in matching_quizzes
        ],
    }

# ─────────────────────────────────────────────
# QUIZ ROUTES
# ─────────────────────────────────────────────

@app.get("/quizzes")
def get_quizzes(skip: int = 0, limit: int = 20, db: Session = Depends(database.get_db)):
    if limit > 100:
        limit = 100
    quizzes = (
        db.query(models.Quiz)
        .filter(models.Quiz.active == True)
        .order_by(models.Quiz.id.desc())
        .offset(skip).limit(limit).all()
    )
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


@app.post("/quizzes", status_code=201)
def create_quiz(
    quiz_data: schemas.QuizCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db)
):
    if current_user.role != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers can create quizzes")

    new_quiz = models.Quiz(
        title=quiz_data.title,
        subject=quiz_data.subject,
        questions_json=json.dumps([q.dict() for q in quiz_data.questions]),
        date_created=datetime.now().strftime("%Y-%m-%d"),
        active=True
    )
    db.add(new_quiz)
    db.commit()
    return {"message": "Quiz created"}


@app.post("/quizzes/{quiz_id}/submit", status_code=201)
@limiter.limit("30/minute")
def submit_quiz(
    request: Request,
    quiz_id: int,
    submission: schemas.QuizSubmissionCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db)
):
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Only students can submit quizzes")

    quiz = db.query(models.Quiz).filter(models.Quiz.id == quiz_id, models.Quiz.active == True).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found or inactive")

    new_submission = models.QuizSubmission(
        student_email=current_user.email,
        quiz_id=quiz_id,
        score=submission.score,
        submitted_at=datetime.utcnow()
    )
    db.add(new_submission)
    db.commit()
    return {"message": "Score submitted", "score": submission.score}


@app.get("/quizzes/{quiz_id}/submissions", response_model=List[schemas.QuizSubmissionResponse])
def get_quiz_submissions(
    quiz_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db)
):
    if current_user.role != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers can view submissions")
    return db.query(models.QuizSubmission).filter(models.QuizSubmission.quiz_id == quiz_id).all()

# ─────────────────────────────────────────────
# PROGRESS ROUTES
# ─────────────────────────────────────────────

@app.get("/progress")
def get_progress(current_user: models.User = Depends(get_current_user)):
    last = json.loads(current_user.last_watched) if current_user.last_watched else None
    return {"last_watched": last}


@app.post("/progress/update-last-watched")
def update_last_watched(
    data: schemas.LastWatchedUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db)
):
    current_user.last_watched = json.dumps({"subject": data.subject, "chapter": data.chapter})
    db.commit()
    return {"message": "Progress saved"}

# ─────────────────────────────────────────────
# TEACHER ROUTES
# ─────────────────────────────────────────────

@app.get("/teacher/students")
def get_students(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers can view student data")
    if limit > 200:
        limit = 200

    students = (
        db.query(models.User)
        .filter(models.User.role == "student")
        .offset(skip).limit(limit).all()
    )

    result = []
    for s in students:
        last_watched = json.loads(s.last_watched) if s.last_watched else None
        current_mod = f"{last_watched['subject']}: {last_watched['chapter']}" if last_watched else "Not Started"

        submissions = (
            db.query(models.QuizSubmission)
            .filter(models.QuizSubmission.student_email == s.email)
            .order_by(models.QuizSubmission.submitted_at.desc())
            .all()
        )
        scores = [sub.score for sub in submissions]
        avg_score = round(sum(scores) / len(scores)) if scores else 0
        last_two = scores[:2] if len(scores) >= 2 else scores

        result.append({
            "id": s.email,
            "name": s.full_name,
            "careerGoal": s.career_goal or "Undecided",
            "currentModule": current_mod,
            "averageScore": avg_score,
            "quizzesTaken": len(submissions),
            "lastTwoScores": last_two,
            "status": "Active"
        })
    return result
