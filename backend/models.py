
from sqlalchemy import Column, Integer, String, Boolean, Text
import database  # Changed from .database to database for direct execution

class User(database.Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    full_name = Column(String)
    role = Column(String) # 'student' or 'teacher'
    institution = Column(String, nullable=True)
    
    # Profile Data
    bio = Column(String, default="Ready to bridge the gap.")
    join_date = Column(String)
    
    # Storing Arrays/Objects as JSON Strings for SQLite
    interests = Column(Text, default="[]") 
    career_goal = Column(String, nullable=True)
    completed_chapters = Column(Text, default="[]")
    last_watched = Column(Text, nullable=True)

class Resource(database.Base):
    __tablename__ = "resources"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    type = Column(String) # 'assignment', 'note', 'remedial'
    subject = Column(String)
    content = Column(Text)
    date_created = Column(String)
    due_date = Column(String, nullable=True)
    author_name = Column(String)
    target_student = Column(String, nullable=True)

class Quiz(database.Base):
    __tablename__ = "quizzes"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    subject = Column(String)
    questions_json = Column(Text) # Store the array of questions as JSON string
    date_created = Column(String)
    active = Column(Boolean, default=True)
