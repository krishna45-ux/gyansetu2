<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# 🌟 GyaanSeetu (ज्ञानसीतु)
### *Bridging Ancient Wisdom with Future Technology*

GyaanSeetu is a state-of-the-art educational ecosystem designed for CBSE/NCERT Class 6–10 students and their teachers. By combining rigorous curriculum frameworks with Google Gemini-powered artificial intelligence, GyaanSeetu transforms primary education into an inspiring, adaptive, and career-aligned adventure.

---

## 📖 Key Documentation
*   📘 **[User Guide & Feature Guide](USER_GUIDE.md)** — A complete, one-page guide explaining all features, how the platform helps students/teachers, and how to get started.
*   📊 **[Architecture & Analysis Report (ANALYSIS.md)](ANALYSIS.md)** — Comprehensive deep dive into the technology stack, project directory mappings, database schemas, and AI integration systems.

---

## 🚀 Key Features

*   🧠 **Personalized AI Guru Mentorship:** Adaptive, real-time guidance via Google Gemini (`gemini-3-flash-preview`), dynamic critical-thinking grading, and interactive soft-skills roleplays.
*   📚 **Interactive CBSE Syllabus Engine:** Full coverage of Maths, Science, English, and Social Science across Classes 6–10 with 3-tier lecture sources (Concept, Animated, Real-world).
*   🧪 **Interactive Laboratory Sandbox:** Drag-and-drop visual simulations that bridge mathematical formulas with physical experiments.
*   🗺️ **Personalized Career Roadmaps:** Intelligent keyword scanning maps textbook chapters directly to high-impact career targets like Software Engineering, Civil Services, and Medical Research.
*   🤝 **Moderated Global Q&A Forum:** Safe, localized discussion boards with downvoting/upvoting, teacher verified flags, and custom student profile cards.

---

## 💻 Running GyaanSeetu Locally

GyaanSeetu supports both a **FastAPI production backend** and a standalone **Mock LocalStorage backend** for serverless frontend execution.

### Prerequisites
*   [Node.js](https://nodejs.org/) (v18 or higher)
*   [Python 3.10+](https://www.python.org/) *(Optional, only if running Python backend)*

---

### Option A: One-Click Startup (Frontend + Mock Backend)
Double-click the pre-configured Windows startup script in the root directory:
```bash
start.bat
```
This automatically installs dependencies, sets up configurations, and boots the Vite dev server at `http://localhost:5173`.

---

### Option B: Manual Setup

#### 1. Setup the Frontend
1. Navigate to the root directory and install dependencies:
   ```bash
   npm install
   ```
2. Create a `.env.local` file in the root folder and add your Gemini API Key:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
3. Boot the development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:5173](http://localhost:5173) in your browser.

#### 2. Setup the Python Backend (Optional)
1. Navigate to the `backend/` folder:
   ```bash
   cd backend
   ```
2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Configure your `.env` file (see `backend/.env.example`).
4. Boot the FastAPI API server:
   ```bash
   uvicorn main:app --reload
   ```

---

*GyaanSeetu: Sparking curiosity, connecting timelines, and building scholars.*
