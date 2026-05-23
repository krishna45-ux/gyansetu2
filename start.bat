@echo off
echo ==========================================
echo        Starting GyanSetu Application
echo ==========================================

echo.
echo [1/4] Installing Backend Dependencies...
cd backend
pip install -r requirements.txt

echo.
echo [2/4] Starting FastAPI Backend...
start cmd /k "title GyanSetu Backend && uvicorn main:app --host 0.0.0.0 --port 8000"

cd ..

echo.
echo [3/4] Installing Frontend Dependencies...
call npm install

echo.
echo [4/4] Starting React/Vite Frontend...
start cmd /k "title GyanSetu Frontend && npm run dev"

echo.
echo ==========================================
echo GyanSetu is starting!
echo Two new command prompt windows have been opened for the frontend and backend.
echo You can close this window now.
echo ==========================================
pause
