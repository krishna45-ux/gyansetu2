
// services/dbService.ts — Phase 2 updated

import { apiRequest } from "./api";
import { UserProfile, ClassResource, StudentPerformance, Quiz, QuizQuestion } from "../types";

// --- USER FUNCTIONS ---

export const getUserProfile = async (): Promise<UserProfile | null> => {
    try {
        const data = await apiRequest('/auth/me', 'GET');
        return data as UserProfile;
    } catch (error) {
        console.warn("Failed to fetch profile (User might be guest):", error);
        return null;
    }
};

export const updateUserProfile = async (uid: string, data: Partial<UserProfile>) => {
    // uid is ignored; backend uses the JWT token to identify the user
    await apiRequest('/users/profile', 'PUT', data);
};

// --- PROGRESS & DASHBOARD FUNCTIONS ---

export const saveLastWatched = async (uid: string, data: { subject: string; chapter: string }) => {
    await apiRequest('/progress/update-last-watched', 'POST', data);
};

export const getLastWatched = async (uid: string) => {
    try {
        const response = await apiRequest('/progress', 'GET');
        return response.last_watched || null;
    } catch (e) {
        return null;
    }
};

export const saveCareerGoal = async (uid: string, goal: string) => {
    await apiRequest('/users/career-goal', 'PUT', { career_goal: goal });
};

export const getCareerGoal = async (uid: string) => {
    try {
        const profile = await getUserProfile();
        return profile?.career_goal || null;
    } catch (e) {
        return null;
    }
};

// --- CURRICULUM PROGRESS ---

export const getCompletedChapters = async (): Promise<string[]> => {
    try {
        const profile = await getUserProfile();
        return profile?.completed_chapters || [];
    } catch (e) {
        return [];
    }
};

export const markChapterCompleteDB = async (chapterTitle: string) => {
    const profile = await getUserProfile();
    if (profile) {
        const currentChapters = profile.completed_chapters || [];
        if (!currentChapters.includes(chapterTitle)) {
            await updateUserProfile("", {
                completed_chapters: [...currentChapters, chapterTitle]
            });
        }
    }
};

// --- RESOURCES (GLOBAL) ---

export const postResource = async (resource: ClassResource & { attachment_url?: string }) => {
    await apiRequest('/resources', 'POST', resource);
};

export const deleteResource = async (resourceId: number) => {
    await apiRequest(`/resources/${resourceId}`, 'DELETE');
};

export const getResources = async (): Promise<ClassResource[]> => {
    try {
        const resources = await apiRequest('/resources', 'GET');
        return resources || [];
    } catch (e) {
        console.error("Failed to fetch resources", e);
        return [];
    }
};

/**
 * Phase 2: Upload a file to Cloudinary via the backend.
 * Returns the secure URL to store alongside the resource.
 */
export const uploadResourceFile = async (file: File): Promise<{ url: string; filename: string; resource_type: string }> => {
    const formData = new FormData();
    formData.append('file', file);

    const token = localStorage.getItem('gyansetu_token');
    const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/resources/upload`,
        {
            method: 'POST',
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            body: formData,
        }
    );

    if (!response.ok) {
        const err = await response.json().catch(() => ({ detail: 'Upload failed' }));
        throw new Error(err.detail || 'Upload failed');
    }
    return response.json();
};

// --- QUIZZES (GLOBAL) ---

/**
 * Phase 2 fix: Teacher quiz builder uses `correctIndex` (number).
 * The backend QuizCreate schema expects `answer` (string).
 * This function transforms the format before sending to the API.
 */
export const postQuiz = async (quiz: Quiz) => {
    const transformedQuestions = quiz.questions.map((q: QuizQuestion) => ({
        question: q.question,
        options: q.options.filter(o => o.trim() !== ''),   // Remove empty options
        answer: q.options[q.correctIndex] || q.options[0], // Convert index → answer string
    }));

    await apiRequest('/quizzes', 'POST', {
        title: quiz.title,
        subject: quiz.subject,
        questions: transformedQuestions,
    });
};

export const getQuizzes = async (): Promise<Quiz[]> => {
    try {
        const quizzes = await apiRequest('/quizzes', 'GET');
        // Map backend format back to frontend Quiz type
        return (quizzes || []).map((q: any) => ({
            id: q.id,
            title: q.title,
            subject: q.subject,
            dateCreated: q.dateCreated,
            active: q.active,
            questions: (q.questions || []).map((qq: any, idx: number) => ({
                id: idx,
                question: qq.question,
                options: qq.options,
                correctIndex: qq.options.indexOf(qq.answer),  // Map answer string → index
            })),
        }));
    } catch (e) {
        console.error("Failed to fetch quizzes", e);
        return [];
    }
};

/**
 * Phase 2: Submit a student's quiz score to the backend.
 */
export const submitQuizScore = async (quizId: number, score: number): Promise<void> => {
    await apiRequest(`/quizzes/${quizId}/submit`, 'POST', { quiz_id: quizId, score });
};

// --- TEACHER FUNCTIONS ---

export const getAllStudents = async (): Promise<StudentPerformance[]> => {
    try {
        return await apiRequest('/teacher/students', 'GET');
    } catch (e) {
        console.error("Failed to fetch students", e);
        return [];
    }
};

// --- SEARCH (Phase 2) ---

export interface SearchResults {
    resources: Array<{ id: number; title: string; type: string; subject: string; author: string }>;
    quizzes: Array<{ id: number; title: string; subject: string; dateCreated: string }>;
}

export const searchContent = async (query: string): Promise<SearchResults> => {
    if (!query || query.trim().length < 2) return { resources: [], quizzes: [] };
    try {
        return await apiRequest(`/search?q=${encodeURIComponent(query)}`, 'GET');
    } catch (e) {
        console.error("Search failed", e);
        return { resources: [], quizzes: [] };
    }
};