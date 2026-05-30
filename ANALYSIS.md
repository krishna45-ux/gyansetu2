# GyaanSeetu — Complete Project Analysis Report

> **ज्ञानसीतु** (Knowledge Bridge) — An AI-powered personalized learning ecosystem bridging ancient wisdom with future technology.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Technology Stack](#2-technology-stack)
3. [Directory Structure & File Map](#3-directory-structure--file-map)
4. [Architecture & Data Flow](#4-architecture--data-flow)
5. [Feature Deep-Dive](#5-feature-deep-dive)
6. [Design System & Theming](#6-design-system--theming)
7. [AI Integration (Google Gemini)](#7-ai-integration-google-gemini)
8. [Authentication & Security](#8-authentication--security)
9. [Internationalization (i18n)](#9-internationalization-i18n)
10. [Backend API Reference](#10-backend-api-reference)
11. [Database Schema](#11-database-schema)
12. [Deployment & DevOps](#12-deployment--devops)
13. [Known Issues & Improvement Areas](#13-known-issues--improvement-areas)

---

## 1. Executive Summary

**GyaanSeetu** is a full-stack educational platform built for a hackathon, targeting CBSE/NCERT Class 6–10 students and their teachers. It combines:

- **Role-based access** (Student / Teacher) with distinct dashboards
- **AI mentorship** via Google Gemini (motivational messages, quiz generation, answer grading, roleplay scenarios)
- **A structured curriculum engine** covering Math, Science, English, and Social Science across 5 grade levels
- **Community forum** with Q&A, voting, and user profiles
- **Career path mapping** that links curriculum chapters to career goals
- **Bilingual interface** (English & Hindi)
- **Dual-aesthetic theming** — a cyber-futuristic dark mode and a heritage-inspired light mode

The frontend is a React 19 + TypeScript SPA. The backend is a FastAPI Python server with SQLAlchemy ORM. Both are deployment-ready (Vercel/Netlify for frontend, Render for backend).

---

## 2. Technology Stack

### Frontend

| Layer              | Technology                                     |
| ------------------ | ---------------------------------------------- |
| **UI Framework**   | React 19.0.0 (Functional Components + Hooks)   |
| **Language**       | TypeScript (strict mode via `tsconfig.json`)    |
| **Build Tool**     | Vite 6.3.1 (HMR, ESBuild, optimized bundles)   |
| **Styling**        | Tailwind CSS 4.1.3 (utility-first)             |
| **Icons**          | Iconify Web Components (`iconify-icon` CDN)     |
| **AI SDK**         | `@google/genai` ^1.5.0 (Google Gemini API)     |
| **Auth Provider**  | Firebase Auth 11.6.0 (Google OAuth popup flow)  |
| **State Mgmt**     | React Hooks + `localStorage` persistence        |
| **Fonts**          | Google Fonts: Cinzel, Inter, JetBrains Mono, Orbitron |

### Backend

| Layer              | Technology                                     |
| ------------------ | ---------------------------------------------- |
| **Framework**      | FastAPI (Python 3.10+)                         |
| **ORM**            | SQLAlchemy 2.x                                 |
| **Database**       | SQLite (local: `sql_app.db`) / PostgreSQL (prod)|
| **Auth**           | JWT (Access + Refresh tokens), `python-jose`   |
| **Password Hash**  | `passlib[bcrypt]`                              |
| **Validation**     | Pydantic v2 schemas                            |
| **File Storage**   | Cloudinary (secure uploads via backend proxy)  |
| **Rate Limiting**  | `slowapi` (100 req/min per IP)                 |
| **CORS**           | FastAPI middleware (configurable `FRONTEND_URL`)|

### Infrastructure

| Concern          | Solution                                       |
| ---------------- | ---------------------------------------------- |
| **Frontend Host** | Vercel (`vercel.json`) or Netlify (`netlify.toml`) |
| **Backend Host**  | Render (`render.yaml`) with auto-provisioned PostgreSQL |
| **Env Secrets**   | `.env` / `.env.local` (not committed)          |
| **Dev Server**    | `npm run dev` (Vite, port 5173)                |
| **Backend Start** | `start.sh` → `pip install -r requirements.txt && uvicorn main:app` |

---

## 3. Directory Structure & File Map

```
c:\Users\amitk\Desktop\Hakathon 9\
│
├── index.html                  # SPA entry point (96 lines — fonts, Tailwind theme, Iconify CDN)
├── package.json                # React 19, Vite 6, Firebase, Google GenAI deps
├── tsconfig.json               # TypeScript strict config
├── vite.config.ts              # Vite build configuration
├── tailwind.config.ts          # Tailwind custom colors/fonts
├── vercel.json                 # Vercel SPA rewrites
├── netlify.toml                # Netlify SPA redirects
├── ANALYSIS.md                 # ← This file
│
├── App.tsx                     # Root component — auth state, routing, sidebar, views
├── index.tsx                   # React DOM mount + Gemini API key injection
├── types.ts                    # Global TypeScript interfaces (95 lines)
├── firebase.ts                 # Firebase Auth init (conditional on env vars)
│
├── components/                 # Reusable UI widgets
│   ├── LanguageToggle.tsx      # EN/HI language switcher
│   ├── ProgressBlock.tsx       # Animated progress bar
│   ├── SearchBar.tsx           # Debounced search with dropdown (151 lines)
│   ├── StatCard.tsx            # Stat display card (teacher dashboard)
│   └── ThemeToggle.tsx         # Dark/Light mode toggle
│
├── views/                      # Page-level view components
│   ├── LandingPage.tsx         # Hero section + feature cards (55 lines)
│   ├── AuthSystem.tsx          # Login/Register + Google OAuth (313 lines)
│   ├── StudentDashboard.tsx    # Student home — resources, quizzes, AI feedback (385 lines)
│   ├── TeacherDashboard.tsx    # Teacher home — stats, resources, quiz builder (561 lines)
│   ├── CurriculumView.tsx      # Class → Subject → Chapter → Video+Notes (542 lines)
│   ├── CareerPathView.tsx      # Career goal selector + learning roadmap (249 lines)
│   ├── DailyGrowthView.tsx     # Word of day, critical thinking, soft skills dojo (497 lines)
│   ├── CommunityView.tsx       # Q&A Forum with voting + user profiles (388 lines)
│   └── SettingsView.tsx        # User profile editor (160 lines)
│
├── services/                   # Data layer
│   ├── api.ts                  # HTTP client with JWT refresh + mock fallback (266 lines)
│   └── dbService.ts            # Domain-specific API functions (197 lines)
│
├── utils/                      # Static data & helpers
│   ├── translations.ts         # Full EN/HI translation dictionary (298 lines)
│   └── curriculumData.ts       # CBSE syllabus data + video mappings (92 lines)
│
└── backend/                    # FastAPI Python backend
    ├── main.py                 # API routes — auth, resources, quizzes, progress (616 lines)
    ├── models.py               # SQLAlchemy ORM models (User, Resource, Quiz, etc.)
    ├── schemas.py              # Pydantic request/response schemas
    ├── database.py             # DB engine and session factory
    ├── requirements.txt        # Python dependencies
    ├── start.sh                # One-command backend startup script
    ├── render.yaml             # Render.com deployment blueprint
    ├── .env                    # Backend env vars (JWT secret, Cloudinary, Firebase)
    └── serviceAccountKey.json  # Firebase Admin SDK credentials (gitignored)
```

---

## 4. Architecture & Data Flow

### High-Level Architecture

```
┌─────────────────────────────────────────────────────┐
│                    FRONTEND (React SPA)              │
│  ┌────────┐  ┌──────────┐  ┌───────────────────┐    │
│  │ Views  │──│ Services │──│ Google Gemini SDK  │    │
│  │        │  │ (api.ts) │  │ (Client-side AI)   │    │
│  └────────┘  └────┬─────┘  └───────────────────┘    │
│                   │                                   │
│         ┌─────────┴──────────┐                        │
│         │  Hybrid API Layer  │                        │
│         │  (Real or Mock)    │                        │
│         └────────┬───────────┘                        │
└──────────────────┼───────────────────────────────────┘
                   │ HTTP (JWT Bearer)
┌──────────────────┼───────────────────────────────────┐
│              BACKEND (FastAPI)                        │
│  ┌───────────┐  ┌──────────┐  ┌────────────────┐     │
│  │ Routes    │──│ Models   │──│ SQLite/Postgres │     │
│  │ (main.py) │  │ (ORM)    │  │ (sql_app.db)   │     │
│  └─────┬─────┘  └──────────┘  └────────────────┘     │
│        │                                              │
│  ┌─────┴──────┐  ┌────────────────┐                   │
│  │ Cloudinary │  │ Firebase Admin  │                   │
│  │ (Uploads)  │  │ (Google OAuth)  │                   │
│  └────────────┘  └────────────────┘                   │
└──────────────────────────────────────────────────────┘
```

### Hybrid API Layer (`services/api.ts`)

The frontend uses a **dual-mode** API client:

1. **Real Mode** (`USE_MOCK_BACKEND = false`): Sends HTTP requests to the FastAPI server at `VITE_API_URL`. Includes automatic JWT refresh on `401` responses.
2. **Mock Mode** (`USE_MOCK_BACKEND = true`): Simulates API responses using `localStorage`, enabling full-stack development without the Python server.

```
apiRequest(endpoint, method, body)
  → Checks USE_MOCK_BACKEND flag
  → If true  → routes to mockBackend() (localStorage simulation)
  → If false → fetch() with Authorization header
                → On 401 → attempts /auth/refresh
                → On success → retries original request
                → On failure → throws error
```

### Data Flow: Student Learning Cycle

```
Student Dashboard → "Continue Learning" click
  → localStorage resume flag set
  → Navigate to CurriculumView
  → CurriculumView checks resume flag
  → Fetches last_watched from cloud (GET /progress)
  → Auto-navigates to that class/subject/chapter
  → Embedded YouTube video player loads
  → Student watches video → clicks "Mark Complete"
  → POST to /users/profile with updated completed_chapters[]
  → Career Path recalculates progress
```

---

## 5. Feature Deep-Dive

### 5.1 Landing Page (`LandingPage.tsx`)
- Hero section with `heroTitle` / `heroDesc` translations
- Dual CTA buttons: "Get Started" and "Our Mission"
- Feature cards showcasing AI Insights and Interactive Labs
- Full theme awareness (glassmorphism dark / paper-texture light)

### 5.2 Authentication System (`AuthSystem.tsx`)
- **Login**: Email/password → `POST /auth/login` (OAuth2 form data) → JWT stored in localStorage
- **Register**: Email/password/institution/role → `POST /auth/register` → auto-login
- **Google OAuth**: Firebase `signInWithPopup()` → sends Google user info to `POST /auth/google` → backend creates/finds user → returns JWT
- **Conditional Firebase**: Falls back gracefully if Firebase env vars aren't configured
- **Role Selection**: Students and teachers register with a role toggle

### 5.3 Student Dashboard (`StudentDashboard.tsx`)
Key sections:
1. **Welcome Banner** — Personalized greeting with streak stats
2. **Classroom Board** — Aggregates teacher-posted resources:
   - Active Quizzes (from `GET /quizzes`)
   - Remedial Assignments (targeted to specific students)
   - Assignment cards with due dates
   - Notes & Announcements
3. **Continue Learning** — Shows last-watched chapter with progress bar; clicking resumes the curriculum
4. **Daily Challenge** — Physics momentum question with answer validation
5. **Guru AI Feedback** — Gemini-powered personalized motivational message using student context (name, career goal, recent activity)
6. **Upcoming** — Static calendar preview (Physics Quiz, Project Submission)

### 5.4 Teacher Dashboard (`TeacherDashboard.tsx`)
The largest view (561 lines) with 4 sub-views:

| Sub-View | Description |
|----------|-------------|
| **Dashboard** | Stats cards (Total Students, Active Now, Class Mastery, At Risk) + Student Monitor table + Resource Manager |
| **All Students** | Full student table with scores, career goals, modules, online status |
| **At Risk** | Filtered view: students with <60% avg OR last 2 scores both <50. Includes remedial assignment modal |
| **Create Quiz** | Multi-question quiz builder with 4 options per question + correct answer index |

Resource Manager features:
- Create Notes or Assignments
- **File Upload** via Cloudinary (`uploadResourceFile` → `POST /resources/upload` → returns secure URL)
- Delete resources (optimistic UI + `DELETE /resources/{id}`)
- View attachment links

### 5.5 Curriculum Engine (`CurriculumView.tsx`)
A 4-level drill-down navigation:

```
Level 1: Class Selection (6, 7, 8, 9, 10)
Level 2: Subject Selection (Math, Science, English, Social Science)
Level 3: Chapter List (with completion status indicators)
Level 4: Learning Mode — Video Player + Notes + AI Quiz
```

**Learning Mode** includes:
- Embedded YouTube player with **3 video source options** (Concept, Animated, Real World)
- Video source sidebar for switching between content types
- Auto-generated study notes (markdown rendered)
- "Mark Chapter Complete" button → persists to cloud
- **AI Quiz Generator** — sends chapter context to Gemini → returns 10 MCQ questions with structured JSON schema
- Quiz modal with score tracking and retry

**Curriculum Data** (`curriculumData.ts`):
- `SYLLABUS_DATA`: Complete CBSE syllabus for Classes 6–10 across 4 subjects
- `CHAPTER_VIDEO_MAP`: YouTube video ID mappings per chapter (with fallback)
- `SUBJECT_ICONS`: Iconify icon names per subject
- `DAILY_WORD`: Word of the Day with phonetic, meaning, and example

### 5.6 Career Path (`CareerPathView.tsx`)
5 career archetypes with keyword-based chapter mapping:

| Career | Relevant Subjects | Focus Keywords |
|--------|-------------------|----------------|
| Software Engineer | Math, Science | Numbers, Algebra, Geometry, Computer, Motion, Electricity |
| Medical Professional | Science | Food, Body, Plants, Animals, Cell, Reproduction |
| Research Scientist | Science, Math | Matter, Atom, Chemical, Force, Gravitation, Energy |
| Civil Services | Social Science, English | (all chapters) |
| Digital Artist | English, Math | Geometry, Shapes, Visualising |

Selecting a career generates a **personalized learning roadmap** by scanning the syllabus for matching keywords, sorted by class level. Progress is tracked against completed chapters.

### 5.7 Daily Growth Zone (`DailyGrowthView.tsx`)
Three interactive modules:

1. **Word of the Day**: Vocabulary builder with `SpeechSynthesis` API pronunciation
2. **Critical Thinking Challenge**: An ethics-based essay question graded by Gemini AI:
   - Structured JSON response: `{ score, rank, feedback }`
   - Global leaderboard with hover stats (accuracy, improvement)
   - Results cached in `localStorage` (resets daily)
3. **Soft Skills Dojo**: AI-powered roleplay chat:
   - 3 scenarios: Conflict Resolution, Interview Prep, Negotiation
   - Full conversation history context sent to Gemini per message
   - **Abuse Detection**: Bad word filter → 3-warning system → 1.5-hour lockout
   - Lockout persisted in `localStorage` with countdown timer

### 5.8 Community Forum (`CommunityView.tsx`)
- **Q&A System**: Ask questions with title/description, upvote/downvote
- **Reply threads**: Nested replies with teacher verification badges
- **Search**: Real-time filtering by title, description, author, or tags
- **User Profiles**: Click any author → modal with bio, join date, reputation, interests
- **Mock profiles**: `Rahul S.`, `Dr. A. Verma`, `Priya V.` with realistic bios
- **Persistence**: Questions and replies saved to `localStorage`

### 5.9 Settings (`SettingsView.tsx`)
- Profile card preview (avatar initial, name, role badge, bio, interest tags)
- Editable fields: Full Name, Bio/Tagline, Interests (comma-separated)
- Quick-add interest buttons: Physics, Mathematics, Computer Science, etc.
- Save → `PUT /users/profile` → success toast

### 5.10 Global Search (`SearchBar.tsx`)
- Debounced search (300ms delay) with loading spinner
- Queries `GET /search?q=...` endpoint
- Results split into **Resources** and **Quizzes** categories
- Click-outside-to-close behavior
- Desktop only (`hidden md:block`)

---

## 6. Design System & Theming

### Dual Aesthetic System

The app features a unique **Dual-Mode** design identity:

| Property | Future Mode (Dark) | Heritage Mode (Light) |
|----------|--------------------|-----------------------|
| **Background** | Grid pattern (`bg-grid-pattern`) | Paper texture (`bg-paper-texture`) |
| **Primary Color** | Cyan neon (`#00F0FF`, `text-f-neon`) | Deep accent (`text-h-accent`) |
| **Secondary Color** | Purple (`#BD00FF`, `text-f-purple`) | Gold (`text-h-gold`) |
| **Typography** | `font-future` (Orbitron) | `font-heritage` (Cinzel) |
| **Panels** | `glass-panel` (backdrop-blur, border glow) | `paper-panel` (warm bg, subtle shadow) |
| **Body Font** | Inter / JetBrains Mono | Inter |

### CSS Classes

```css
.glass-panel   → backdrop-blur + semi-transparent bg + neon border glow
.paper-panel   → warm cream bg + subtle shadow + accent border
.font-future   → Orbitron (geometric sans-serif)
.font-heritage → Cinzel (classical serif)
.animate-fade  → CSS fade-in animation
.custom-scrollbar → Styled webkit scrollbar
```

### Responsive Design
- Mobile-first with `md:` and `lg:` breakpoints
- Sidebar collapses on mobile with slide-in animation
- Content grids shift from 1 column (mobile) to 2-4 columns (desktop)
- Touch-friendly tap targets (min 44px)

---

## 7. AI Integration (Google Gemini)

The app uses Google's Gemini API (`@google/genai`) client-side for 4 distinct use cases:

### 7.1 Guru AI Motivational Feedback
- **Location**: `StudentDashboard.tsx`
- **Model**: `gemini-3-flash-preview`
- **Input**: Student name, career goal, recent activity
- **Output**: Free-text (2-sentence motivation message)
- **Fallback**: Context-aware offline message

### 7.2 Critical Thinking Grader
- **Location**: `DailyGrowthView.tsx`
- **Model**: `gemini-3-flash-preview`
- **Input**: Question + student's written answer
- **Output**: Structured JSON (`{ score, rank, feedback }`)
- **Schema**: Enforced via `responseSchema` with `responseMimeType: "application/json"`

### 7.3 Curriculum Quiz Generator
- **Location**: `CurriculumView.tsx`
- **Model**: `gemini-3-flash-preview`
- **Input**: Class level, subject, chapter name
- **Output**: JSON array of 10 MCQ objects (`{ question, options[], correctIndex }`)
- **Fallback**: 5 hardcoded generic questions

### 7.4 Soft Skills Roleplay
- **Location**: `DailyGrowthView.tsx`
- **Model**: `gemini-3-flash-preview`
- **Input**: Scenario context + full conversation history
- **Output**: Free-text (concise 2-sentence roleplay response)

### Error Handling
All AI calls include:
- Try/catch with graceful fallbacks
- Rate limit detection (`429` / `RESOURCE_EXHAUSTED`)
- User-friendly error messages (not raw errors)

### API Key Management
- Frontend reads from `process.env.API_KEY` (injected via `index.tsx`)
- **Security concern**: API key is currently client-side; should proxy through backend for production

---

## 8. Authentication & Security

### Auth Flow

```
Registration: POST /auth/register → bcrypt hash → DB insert → 201
Login:        POST /auth/login    → verify password → issue JWT pair → 200
Google OAuth: POST /auth/google   → create/find user → issue JWT → 200
Protected:    Any route with Depends(get_current_user) → decode JWT → fetch user
Refresh:      POST /auth/refresh  → verify refresh token → issue new access token
```

### JWT Configuration
- **Access Token**: 30-minute expiry, HS256 algorithm
- **Refresh Token**: 7-day expiry, separate secret key
- **Storage**: `localStorage` (`gyaanseetu_token`, `gyaanseetu_refresh_token`)
- **Auto-refresh**: `apiRequest()` intercepts `401` → calls `/auth/refresh` → retries

### Security Measures
- Password hashing: `bcrypt` via `passlib`
- Rate limiting: `slowapi` at 100 requests/minute per IP
- CORS: Restricted to `FRONTEND_URL` origin
- File upload validation: Backend-side Cloudinary upload (not direct client upload)

### Abuse Prevention (Client-side)
- Bad word filter: Array of 10 prohibited terms checked on every soft skills dojo message
- 3-strike warning system → 1.5-hour lockout
- Lockout state persisted in `localStorage` with timestamp-based expiry

---

## 9. Internationalization (i18n)

### Implementation (`utils/translations.ts`)
- **Languages**: English (`en`) and Hindi (`hi`)
- **Coverage**: 298 lines covering ~90 UI strings across all views
- **Structure**: Flat object with nested `features` sub-object
- **Toggle**: `LanguageToggle` component persisted to `localStorage`

### Translated Sections
- Navigation, Auth (login/register/OTP), Student Dashboard, Teacher Dashboard
- Career Path, Curriculum, Daily Growth, Settings
- Error messages and action buttons

### Gaps
- Community View strings are hardcoded in English
- Some dynamic content (AI responses, quiz questions) is English-only
- No RTL support

---

## 10. Backend API Reference

### Authentication (`/auth/*`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|:-------------:|
| POST | `/auth/register` | Create new user | ❌ |
| POST | `/auth/login` | Login (OAuth2 form) | ❌ |
| POST | `/auth/google` | Google OAuth login/register | ❌ |
| GET  | `/auth/me` | Get current user profile | ✅ |
| POST | `/auth/refresh` | Refresh access token | ❌ (uses refresh token) |

### User Management (`/users/*`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|:-------------:|
| PUT | `/users/profile` | Update user profile fields | ✅ |
| PUT | `/users/career-goal` | Set career goal | ✅ |

### Resources (`/resources/*`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|:-------------:|
| GET  | `/resources` | List all resources | ✅ |
| POST | `/resources` | Create resource | ✅ (teacher) |
| DELETE | `/resources/{id}` | Delete resource | ✅ (teacher) |
| POST | `/resources/upload` | Upload file to Cloudinary | ✅ (teacher) |

### Quizzes (`/quizzes/*`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|:-------------:|
| GET  | `/quizzes` | List all quizzes | ✅ |
| POST | `/quizzes` | Create quiz | ✅ (teacher) |
| POST | `/quizzes/{id}/submit` | Submit quiz score | ✅ (student) |

### Progress (`/progress/*`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|:-------------:|
| GET  | `/progress` | Get user progress data | ✅ |
| POST | `/progress/update-last-watched` | Save last watched chapter | ✅ |

### Teacher (`/teacher/*`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|:-------------:|
| GET  | `/teacher/students` | List all students with performance | ✅ (teacher) |

### Search (`/search`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|:-------------:|
| GET  | `/search?q=<query>` | Search resources and quizzes | ✅ |

---

## 11. Database Schema

### User Model
```python
class User:
    id              : Integer (PK, auto-increment)
    email           : String (unique, indexed)
    full_name       : String
    hashed_password : String
    role            : String ("student" | "teacher")
    institution     : String (nullable)
    career_goal     : String (nullable)
    interests       : Text   (JSON-serialized string[])
    bio             : Text (nullable)
    completed_chapters : Text (JSON-serialized string[])
    created_at      : DateTime (auto)
```

### Resource Model
```python
class Resource:
    id              : Integer (PK)
    title           : String
    type            : String ("assignment" | "note" | "remedial")
    subject         : String
    content         : Text
    date            : String
    due_date        : String (nullable)
    author          : String
    target_student  : String (nullable, for remedial)
    link_to_chapter : String (nullable)
    attachment_url  : String (nullable, Cloudinary URL)
```

### Quiz Model
```python
class Quiz:
    id              : Integer (PK)
    title           : String
    subject         : String
    questions       : Text (JSON-serialized QuizQuestion[])
    date_created    : String
    active          : Boolean (default True)
```

### QuizScore Model
```python
class QuizScore:
    id              : Integer (PK)
    user_id         : Integer (FK → User)
    quiz_id         : Integer (FK → Quiz)
    score           : Integer
```

---

## 12. Deployment & DevOps

### Frontend Deployment

**Vercel** (`vercel.json`):
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/" }]
}
```

**Netlify** (`netlify.toml`):
```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Backend Deployment

**Render** (`render.yaml`):
```yaml
services:
  - type: web
    name: gyaanseetu-api
    runtime: python
    rootDir: backend
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn main:app --host 0.0.0.0 --port $PORT
    envVars:
      - key: SECRET_KEY
        generateValue: true
      - key: DATABASE_URL
        fromDatabase:
          name: gyaanseetu-db
          property: connectionString
      - key: FRONTEND_URL
        value: https://gyaanseetu.vercel.app

databases:
  - name: gyaanseetu-db
    databaseName: gyaanseetu
    plan: free
```

### Environment Variables

**Frontend (`.env.local`)**:
```
GEMINI_API_KEY=<your-gemini-key>
VITE_API_URL=http://localhost:8000
VITE_FIREBASE_API_KEY=<firebase-key>
VITE_FIREBASE_AUTH_DOMAIN=<project>.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=<project-id>
```

**Backend (`.env`)**:
```
SECRET_KEY=<jwt-secret>
REFRESH_SECRET_KEY=<refresh-jwt-secret>
CLOUDINARY_CLOUD_NAME=<cloud-name>
CLOUDINARY_API_KEY=<api-key>
CLOUDINARY_API_SECRET=<api-secret>
FRONTEND_URL=http://localhost:5173
FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccountKey.json
```

---

## 13. Known Issues & Improvement Areas

### Critical

| Issue | Details |
|-------|---------|
| **Client-side API Key** | Gemini API key is exposed in the browser bundle (`process.env.API_KEY` injected in `index.tsx`). Must proxy through backend. |
| **No Input Sanitization** | Community forum posts are rendered without sanitization — potential XSS risk. |
| **Cloudinary Keys in .env** | API secret is committed in the `.env` file. Should use env vars in deployment only. |

### Important

| Issue | Details |
|-------|---------|
| **No Unit Tests** | Zero test files for either frontend or backend. |
| **Mock Backend Drift** | Mock backend in `api.ts` may not match real API responses as features evolve. |
| **Firebase Optional but Referenced** | If Firebase env vars are missing, Google login shows an error toast but doesn't disable the button. |
| **Static Upcoming Calendar** | Student dashboard "Upcoming" section is hardcoded (Oct 12, Oct 14). |
| **Leaderboard Data** | Daily Growth leaderboard uses hardcoded mock data, not real user scores. |

### Nice to Have

| Improvement | Details |
|-------------|---------|
| **Real-time Updates** | WebSocket integration for live classroom board updates |
| **Offline Support** | Service worker for PWA capabilities |
| **PDF Export** | "Download PDF" button in curriculum is non-functional |
| **Community Localization** | Forum UI strings are only in English |
| **Quiz Analytics** | Student score history visualization (charts) |
| **Mobile Sidebar** | Currently functional but could benefit from swipe gestures |
| **Search Expansion** | Add chapter search (currently only resources + quizzes) |

---

## Summary Statistics

| Metric | Count |
|--------|-------|
| **Total Frontend Files** | ~20 TSX/TS files |
| **Total Backend Files** | ~6 Python files |
| **Lines of Code (Frontend)** | ~4,500+ lines |
| **Lines of Code (Backend)** | ~900+ lines |
| **React Components** | 14 (5 components, 9 views) |
| **API Endpoints** | 14 routes |
| **Supported Languages** | 2 (English, Hindi) |
| **Curriculum Chapters** | 200+ across Classes 6–10 |
| **AI Features** | 4 (Motivation, Quiz Gen, Grading, Roleplay) |
| **Career Paths** | 5 archetypes |

---

*Generated on April 8, 2026. This document reflects the complete state of the codebase as analyzed.*
