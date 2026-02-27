import React from 'react';

declare global {
    namespace JSX {
        interface IntrinsicElements {
            'iconify-icon': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
                icon?: string;
                width?: string | number;
                height?: string | number;
                [key: string]: any;
            };
        }
    }
}

// Also augment 'react' module directly for newer React type definitions (React 18+)
declare module 'react' {
    namespace JSX {
        interface IntrinsicElements {
            'iconify-icon': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
                icon?: string;
                width?: string | number;
                height?: string | number;
                [key: string]: any;
            };
        }
    }
}

export type Role = 'student' | 'teacher';
export type Language = 'en' | 'hi';

export type ViewState = 'landing' | 'auth' | 'student_dashboard' | 'teacher_dashboard' | 'settings' | 'career_path' | 'daily_growth' | 'curriculum';

export interface ThemeProps {
    isDark: boolean;
    toggleTheme: () => void;
}

export interface NavItem {
    id: ViewState;
    icon: string;
    label: string;
}

export interface UserProfile {
    name: string;
    role: Role;
    bio: string;
    joinDate: string;
    interests: string[];
    email?: string;
    career_goal?: string;
    completed_chapters?: string[];
}

export interface ClassResource {
    id: number;
    title: string;
    type: 'assignment' | 'note' | 'remedial';
    subject: string;
    content: string;
    date: string;
    dueDate?: string;
    author: string;
    targetStudent?: string; // If null, for everyone. If set, only for that student.
    linkToChapter?: string; // For remedial video assignments
}

export interface QuizQuestion {
    id: number;
    question: string;
    options: string[];
    correctIndex: number;
}

export interface Quiz {
    id: number;
    title: string;
    subject: string;
    questions: QuizQuestion[];
    dateCreated: string;
    active: boolean;
}

export interface StudentPerformance {
    id: string; // Use name as ID for simplicity in this demo
    name: string;
    averageScore: number;
    quizzesTaken: number;
    lastTwoScores: number[]; // e.g. [45, 50]
    status: 'Online' | 'Offline';
    careerGoal: string;
    currentModule: string;
}