
import { apiRequest } from "./api";
import { UserProfile, ClassResource, StudentPerformance, Quiz } from "../types";

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
    // uid is ignored as the backend uses the token to identify the user
    await apiRequest('/users/profile', 'PUT', data);
};

// --- PROGRESS & DASHBOARD FUNCTIONS ---

export const saveLastWatched = async (uid: string, data: any) => {
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
    // In a real Mongo implementation, you would add an endpoint for this.
    // For now, mapping to profile fetch
    try {
        const profile = await getUserProfile();
        return profile?.completed_chapters || [];
    } catch (e) {
        return [];
    }
};

export const markChapterCompleteDB = async (chapterTitle: string) => {
    // Ideally create specific endpoint, using profile update for now
    // This requires the backend to handle array union logic or we fetch-modify-save
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

export const postResource = async (resource: ClassResource) => {
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

// --- QUIZZES (GLOBAL) ---

export const postQuiz = async (quiz: Quiz) => {
    await apiRequest('/quizzes', 'POST', quiz);
};

export const getQuizzes = async (): Promise<Quiz[]> => {
    try {
        return await apiRequest('/quizzes', 'GET');
    } catch (e) {
        console.error("Failed to fetch quizzes", e);
        return [];
    }
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