
from sqlalchemy import Column, Integer, String, Boolean, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
import database  # Changed from .database to database for direct execution

class User(database.Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    full_name = Column(String)
    role = Column(String)  # 'student' or 'teacher'
    institution = Column(String, nullable=True)

    # Profile Data
    bio = Column(String, default="Ready to bridge the gap.")
    join_date = Column(String)

    # Storing Arrays/Objects as JSON Strings (compatible with both SQLite and PostgreSQL)
    interests = Column(Text, default="[]")
    career_goal = Column(String, nullable=True)
    completed_chapters = Column(Text, default="[]")
    last_watched = Column(Text, nullable=True)

    # Refresh token support
    refresh_token = Column(String, nullable=True)

    # Relationships
    quiz_submissions = relationship("QuizSubmission", back_populates="student")


class Resource(database.Base):
    __tablename__ = "resources"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    type = Column(String)   # 'assignment', 'note', 'remedial'
    subject = Column(String)
    content = Column(Text)
    date_created = Column(String)
    due_date = Column(String, nullable=True)
    author_name = Column(String)
    target_student = Column(String, nullable=True)
    attachment_url = Column(String, nullable=True)   # Phase 2: Cloudinary file URL


class Quiz(database.Base):
    __tablename__ = "quizzes"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    subject = Column(String)
    questions_json = Column(Text)   # Store the array of questions as JSON string
    date_created = Column(String)
    active = Column(Boolean, default=True)

    # Relationships
    submissions = relationship("QuizSubmission", back_populates="quiz")


class QuizSubmission(database.Base):
    """Tracks every time a student submits a quiz — used for real score analytics."""
    __tablename__ = "quiz_submissions"

    id = Column(Integer, primary_key=True, index=True)
    student_email = Column(String, ForeignKey("users.email"), index=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id"), index=True)
    score = Column(Integer)                     # 0–100
    submitted_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    student = relationship("User", back_populates="quiz_submissions")
    quiz = relationship("Quiz", back_populates="submissions")
