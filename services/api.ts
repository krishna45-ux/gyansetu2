
// services/api.ts

// SETTING: Set this to 'true' to run without the Python backend (Serverless Mode)
// Set to 'false' if you have the Python server running on localhost:8000
const USE_MOCK_BACKEND = false;

// --- CONFIGURATION FOR DEPLOYMENT ---
// Set VITE_API_URL in Vercel Dashboard → Environment Variables
// For local dev: set VITE_API_URL=http://localhost:8000 in .env.local
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";


// --- MOCK BACKEND IMPLEMENTATION (Simulation) ---
const mockBackend = async (endpoint: string, method: string, body: any, isFormData: boolean) => {
    // Simulate network latency (500ms)
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log(`[MockAPI] ${method} ${endpoint}`, body);

    // --- Database Helpers (LocalStorage) ---
    const getDBUsers = () => JSON.parse(localStorage.getItem('gyansetu_db_users') || '[]');
    const saveDBUser = (user: any) => {
        const users = getDBUsers();
        users.push(user);
        localStorage.setItem('gyansetu_db_users', JSON.stringify(users));
    };
    const findUser = (email: string) => getDBUsers().find((u: any) => u.email === email);
    const updateDBUser = (email: string, updates: any) => {
        const users = getDBUsers();
        const index = users.findIndex((u: any) => u.email === email);
        if (index !== -1) {
            users[index] = { ...users[index], ...updates };
            localStorage.setItem('gyansetu_db_users', JSON.stringify(users));
        }
    };

    // --- ROUTER LOGIC ---

    // 1. LOGIN
    if (endpoint === '/auth/login' && method === 'POST') {
        // Handle FormData (URLSearchParams)
        const username = isFormData ? body.get('username') : body.username;
        const password = isFormData ? body.get('password') : body.password;

        const user = findUser(username);

        if (user && user.password === password) {
            return {
                access_token: `mock-token-${user.email}`,
                refresh_token: `mock-refresh-${user.email}`,
                token_type: 'bearer'
            };
        }
        throw new Error("Invalid email or password");
    }

    // 2. REGISTER
    if (endpoint === '/auth/register' && method === 'POST') {
        if (findUser(body.email)) {
            throw new Error("Email already registered");
        }
        const newUser = {
            ...body,
            bio: "Ready to bridge the gap between wisdom and technology.",
            interests: [],
            joinDate: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
            career_goal: "",
            completed_chapters: []
        };
        saveDBUser(newUser);
        return { message: "User created successfully" };
    }

    // 3. GET CURRENT USER (Protected)
    if (endpoint === '/auth/me') {
        const token = localStorage.getItem('gyansetu_token');
        if (!token || !token.startsWith('mock-token-')) {
            throw new Error("Invalid token");
        }
        const email = token.replace('mock-token-', '');
        const user = findUser(email);
        if (!user) throw new Error("User not found");

        return {
            name: user.full_name,
            role: user.role,
            bio: user.bio,
            joinDate: user.joinDate,
            interests: user.interests,
            email: user.email,
            career_goal: user.career_goal,
            completed_chapters: user.completed_chapters || []
        };
    }

    // 4. UPDATE PROFILE
    if (endpoint === '/users/profile' && method === 'PUT') {
        const token = localStorage.getItem('gyansetu_token') || "";
        const email = token.replace('mock-token-', '');
        const updateData: any = {};
        if (body.bio !== undefined) updateData.bio = body.bio;
        if (body.interests !== undefined) updateData.interests = body.interests;
        if (body.name !== undefined) updateData.full_name = body.name;
        if (body.completed_chapters !== undefined) updateData.completed_chapters = body.completed_chapters;

        updateDBUser(email, updateData);
        return { message: "Profile updated" };
    }

    // 5. UPDATE CAREER GOAL
    if (endpoint === '/users/career-goal' && method === 'PUT') {
        const token = localStorage.getItem('gyansetu_token') || "";
        const email = token.replace('mock-token-', '');
        updateDBUser(email, { career_goal: body.career_goal });
        return { message: "Goal updated" };
    }

    // 6. RESOURCES
    if (endpoint === '/resources') {
        if (method === 'GET') {
            return JSON.parse(localStorage.getItem('gyansetu_db_resources') || '[]');
        }
        if (method === 'POST') {
            const resources = JSON.parse(localStorage.getItem('gyansetu_db_resources') || '[]');
            const newRes = {
                ...body,
                id: Date.now(),
                date: new Date().toLocaleDateString()
            };
            resources.unshift(newRes);
            localStorage.setItem('gyansetu_db_resources', JSON.stringify(resources));
            return { message: "Resource created" };
        }
    }

    // 7. PROGRESS
    if (endpoint === '/progress' && method === 'GET') {
        const token = localStorage.getItem('gyansetu_token') || "";
        const email = token.replace('mock-token-', '');
        const userData = findUser(email);
        return { last_watched: userData?.last_watched || null };
    }

    if (endpoint === '/progress/update-last-watched' && method === 'POST') {
        const token = localStorage.getItem('gyansetu_token') || "";
        const email = token.replace('mock-token-', '');
        updateDBUser(email, { last_watched: body });
        return { message: "Progress saved" };
    }

    // 8. TEACHER STUDENTS
    if (endpoint === '/teacher/students') {
        const allUsers = getDBUsers();
        // Convert stored users to StudentPerformance format
        return allUsers
            .filter((u: any) => u.role === 'student')
            .map((u: any) => ({
                id: u.email,
                name: u.full_name,
                careerGoal: u.career_goal || "Undecided",
                currentModule: u.last_watched ? `${u.last_watched.subject}: ${u.last_watched.chapter}` : "Not Started",
                averageScore: Math.floor(Math.random() * 40) + 60, // Mock score
                quizzesTaken: Math.floor(Math.random() * 10),
                lastTwoScores: [75, 80],
                status: "Online"
            }));
    }

    throw new Error("404 Not Found");
};


// --- REAL API REQUEST FUNCTION ---
export const apiRequest = async (endpoint: string, method: string = 'GET', body?: any, isFormData: boolean = false) => {

    // Fallback to Mock if enabled
    if (USE_MOCK_BACKEND) {
        try {
            return await mockBackend(endpoint, method, body, isFormData);
        } catch (error: any) {
            console.error("Mock Backend Error:", error);
            throw error; // Re-throw to be caught by UI
        }
    }

    const token = localStorage.getItem('gyansetu_token');

    const headers: HeadersInit = {};

    // FormData (used for login) sets its own Content-Type boundary
    if (!isFormData) {
        headers['Content-Type'] = 'application/json';
    }

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const config: RequestInit = {
        method,
        headers,
        body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
    };

    try {
        const response = await fetch(`${API_URL}${endpoint}`, config);

        if (response.status === 401 && endpoint !== '/auth/refresh') {
            // Try to silently refresh the access token using the stored refresh token
            const refreshToken = localStorage.getItem('gyansetu_refresh_token');
            if (refreshToken) {
                try {
                    console.log("Access token expired. Attempting silent refresh...");
                    const refreshRes = await fetch(`${API_URL}/auth/refresh`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ refresh_token: refreshToken }),
                    });
                    if (refreshRes.ok) {
                        const tokens = await refreshRes.json();
                        localStorage.setItem('gyansetu_token', tokens.access_token);
                        localStorage.setItem('gyansetu_refresh_token', tokens.refresh_token);
                        // Retry the original request with the new access token
                        config.headers = {
                            ...config.headers,
                            'Authorization': `Bearer ${tokens.access_token}`
                        };
                        const retryRes = await fetch(`${API_URL}${endpoint}`, config);
                        return retryRes.json();
                    }
                } catch (refreshErr) {
                    console.warn("Token refresh failed.", refreshErr);
                }
            }
            // Refresh failed — clear session
            localStorage.removeItem('gyansetu_token');
            localStorage.removeItem('gyansetu_refresh_token');
            console.warn("Session expired. Please login again.");
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ detail: response.statusText }));
            throw new Error(errorData.detail || 'API Request Failed');
        }

        // Persist tokens if this was a login or refresh response
        const data = await response.json();
        if (data.access_token) {
            localStorage.setItem('gyansetu_token', data.access_token);
        }
        if (data.refresh_token) {
            localStorage.setItem('gyansetu_refresh_token', data.refresh_token);
        }
        return data;
    } catch (error: any) {
        // Only fallback to mock if it's a true network failure (server unreachable)
        // Do NOT fallback for HTTP errors (4xx/5xx) — those are real meaningful errors
        if (error instanceof TypeError || error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
            console.warn("Server unreachable. Switching to Mock Backend for this request.");
            return await mockBackend(endpoint, method, body, isFormData);
        }
        // Re-throw real HTTP errors so the UI shows the actual error message
        throw error;
    }
};
