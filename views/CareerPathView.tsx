import React, { useState, useEffect } from 'react';
import { ProgressBlock } from '../components/ProgressBlock';
import { Language, ViewState } from '../types';
import { translations } from '../utils/translations';
import { SYLLABUS_DATA } from '../utils/curriculumData';
import { saveCareerGoal, getCareerGoal, saveLastWatched, getCompletedChapters } from '../services/dbService';

interface CareerPathViewProps {
    isDark: boolean;
    lang: Language;
    onNavigate: (view: ViewState) => void;
    userEmail: string; // Add User Email Prop
}

// Map career options to subjects/keywords in the syllabus
const CAREER_OPTIONS = [
    {
        id: "engineer",
        title: "Software Engineer",
        icon: "solar:laptop-3-bold",
        description: "Build the digital future with logic and code.",
        relevantSubjects: ["Mathematics", "Science"],
        focusKeywords: ["Numbers", "Algebra", "Geometry", "Computer", "Motion", "Electricity"] 
    },
    {
        id: "doctor",
        title: "Medical Professional",
        icon: "solar:heart-pulse-bold",
        description: "Save lives by mastering the biological sciences.",
        relevantSubjects: ["Science"],
        focusKeywords: ["Food", "Body", "Plants", "Animals", "Organisms", "Cell", "Reproduction", "Life"]
    },
    {
        id: "scientist",
        title: "Research Scientist",
        icon: "solar:test-tube-bold",
        description: "Unravel the mysteries of the natural world.",
        relevantSubjects: ["Science", "Mathematics"],
        focusKeywords: ["Matter", "Atom", "Chemical", "Force", "Gravitation", "Energy"]
    },
    {
        id: "civil_service",
        title: "Civil Services",
        icon: "solar:flag-bold",
        description: "Serve the nation through policy and administration.",
        relevantSubjects: ["Social Science", "English"],
        focusKeywords: [] // All chapters in these subjects
    },
    {
        id: "artist",
        title: "Digital Artist",
        icon: "solar:palette-bold",
        description: "Express creativity through modern mediums.",
        relevantSubjects: ["English", "Mathematics"], // Math for geometry/proportions
        focusKeywords: ["Geometry", "Shapes", "Visualising"]
    }
];

export const CareerPathView: React.FC<CareerPathViewProps> = ({ isDark, lang, onNavigate, userEmail }) => {
    const [careerGoal, setCareerGoal] = useState<string | null>(null);
    const [completedChapters, setCompletedChapters] = useState<string[]>([]);
    const t = translations[lang];

    useEffect(() => {
        // Load USER SPECIFIC Data from Cloud
        const loadData = async () => {
            const goal = await getCareerGoal("");
            setCareerGoal(goal);

            const completed = await getCompletedChapters();
            setCompletedChapters(completed);
        };
        loadData();
    }, [userEmail]);

    const handleGoalSelect = async (id: string) => {
        setCareerGoal(id);
        await saveCareerGoal("", id);
    };

    const handleReset = async () => {
        setCareerGoal(null);
        await saveCareerGoal("", ""); // Clear goal
    };

    // Helper to generate path nodes based on syllabus
    const getPathNodes = () => {
        if (!careerGoal) return [];
        const goal = CAREER_OPTIONS.find(c => c.id === careerGoal);
        if (!goal) return [];

        let nodes: { class: number; subject: string; chapter: string }[] = [];

        Object.entries(SYLLABUS_DATA).forEach(([classLevel, subjects]) => {
            goal.relevantSubjects.forEach(subject => {
                if (subjects[subject]) {
                    subjects[subject].forEach(chapter => {
                        // Filter by keywords if specified, else take all from relevant subjects
                        if (goal.focusKeywords.length === 0 || goal.focusKeywords.some(k => chapter.includes(k))) {
                            nodes.push({
                                class: parseInt(classLevel),
                                subject: subject,
                                chapter: chapter
                            });
                        }
                    });
                }
            });
        });
        
        // Limit for demo purposes so it doesn't explode the UI
        return nodes.sort((a,b) => a.class - b.class); 
    };

    const pathNodes = getPathNodes();
    const selectedCareer = CAREER_OPTIONS.find(c => c.id === careerGoal);

    // Calculate Progress
    const completedCount = pathNodes.filter(n => completedChapters.includes(n.chapter)).length;
    const progress = pathNodes.length > 0 ? Math.round((completedCount / pathNodes.length) * 100) : 0;

    const handleChapterClick = (node: { class: number; subject: string; chapter: string }) => {
        // Set Resume Flag locally (navigation logic) but save state to cloud
        localStorage.setItem(`gyansetu_${userEmail}_resume_flag`, 'true');
        
        const history = {
            classLevel: node.class,
            subject: node.subject,
            chapter: node.chapter,
            progress: 0
        };
        saveLastWatched("", history);

        onNavigate('curriculum');
    };

    if (!careerGoal || !selectedCareer) {
        return (
            <div className="animate-fade pb-20">
                <div className="text-center mb-12">
                    <h2 className={`text-3xl md:text-4xl font-bold mb-4 ${isDark ? 'font-future text-f-neon' : 'font-heritage text-h-accent'}`}>{t.chooseDestiny}</h2>
                    <p className="opacity-60 max-w-2xl mx-auto">Select a path to generate your personalized learning roadmap based on the Class 6-10 curriculum.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {CAREER_OPTIONS.map(career => (
                        <div 
                            key={career.id}
                            onClick={() => handleGoalSelect(career.id)}
                            className={`group cursor-pointer relative p-8 rounded-2xl border-2 transition-all duration-300 hover:-translate-y-2
                            ${isDark ? 'border-gray-800 bg-gray-900/50 hover:border-f-neon hover:shadow-[0_0_20px_rgba(0,240,255,0.2)]' : 'border-gray-300 bg-white hover:border-h-accent hover:shadow-xl'}`}
                        >
                            <div className={`mb-6 text-5xl transition-colors ${isDark ? 'text-gray-600 group-hover:text-f-neon' : 'text-gray-400 group-hover:text-h-accent'}`}>
                                <iconify-icon icon={career.icon}></iconify-icon>
                            </div>
                            <h3 className={`text-xl font-bold mb-3 ${isDark ? 'font-future group-hover:text-white' : 'font-heritage group-hover:text-h-ink'}`}>{career.title}</h3>
                            <p className="text-sm opacity-60 leading-relaxed mb-4">{career.description}</p>
                            
                            <div className="flex flex-wrap gap-2">
                                {career.relevantSubjects.map(sub => (
                                    <span key={sub} className={`text-[10px] px-2 py-1 rounded border opacity-60 ${isDark ? 'border-gray-700' : 'border-gray-300'}`}>{sub}</span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="animate-fade h-full flex flex-col">
            {/* Header */}
            <div className={`flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 p-6 rounded-2xl ${isDark ? 'bg-white/5 border border-white/10' : 'bg-h-accent/5 border border-h-accent/20'}`}>
                <div className="flex items-center gap-4">
                    <button 
                        onClick={handleReset}
                        className={`p-2 rounded-lg hover:bg-gray-500/20 transition-colors shrink-0`}
                    >
                        <iconify-icon icon="solar:arrow-left-bold" className="text-xl"></iconify-icon>
                    </button>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <iconify-icon icon={selectedCareer.icon} className={`text-xl ${isDark ? 'text-f-neon' : 'text-h-accent'}`}></iconify-icon>
                            <span className="text-xs font-bold uppercase tracking-widest opacity-60">{t.careerPath}</span>
                        </div>
                        <h2 className={`text-xl md:text-2xl font-bold ${isDark ? 'font-future' : 'font-heritage'}`}>{selectedCareer.title}</h2>
                    </div>
                </div>
                <div className="w-full md:w-64">
                    <ProgressBlock title={t.pathProgress} progress={progress} isDark={isDark} />
                    <p className="text-[10px] opacity-50 mt-1 text-right">{completedCount} of {pathNodes.length} Modules Completed</p>
                </div>
            </div>

            {/* List Container */}
            <div className="max-w-4xl mx-auto flex-1 px-4 md:px-0 pb-20">
                <div className="space-y-4">
                    {pathNodes.map((node, index) => {
                        const isCompleted = completedChapters.includes(node.chapter);
                        
                        return (
                            <div 
                                key={index} 
                                onClick={() => handleChapterClick(node)}
                                className={`flex items-center gap-4 p-4 rounded-xl border transition-all duration-300 cursor-pointer hover:shadow-md hover:translate-x-1 group
                                    ${isCompleted 
                                        ? (isDark ? 'border-f-neon bg-gray-900/50' : 'border-h-accent bg-white shadow-sm') 
                                        : (isDark ? 'border-gray-800 bg-black/40 hover:border-gray-700' : 'border-gray-200 bg-white hover:border-gray-300')}
                                `}
                            >
                                {/* Sequence Number */}
                                <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm
                                    ${isCompleted 
                                        ? (isDark ? 'bg-f-neon text-black' : 'bg-h-accent text-white') 
                                        : (isDark ? 'bg-gray-800 text-gray-500' : 'bg-gray-200 text-gray-400')}
                                `}>
                                    {index + 1}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap items-center gap-2 mb-1">
                                        <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${isDark ? 'bg-white/10' : 'bg-black/5'}`}>
                                            Class {node.class}
                                        </span>
                                        <span className={`text-[10px] font-bold uppercase opacity-60`}>
                                            {node.subject}
                                        </span>
                                    </div>
                                    <h4 className={`text-base font-bold break-words group-hover:underline ${isCompleted ? (isDark ? 'text-white' : 'text-h-ink') : (isDark ? 'text-gray-400' : 'text-gray-500')}`}>
                                        {node.chapter}
                                    </h4>
                                </div>

                                {/* Status */}
                                <div className={`shrink-0 flex items-center gap-2 text-xs font-bold uppercase tracking-wider 
                                    ${isCompleted ? 'text-green-500' : 'opacity-40'}
                                `}>
                                    <span className="hidden sm:inline">{isCompleted ? t.completed : 'Pending'}</span>
                                    <iconify-icon icon={isCompleted ? "solar:check-circle-bold" : "solar:circle-outline"} className="text-xl"></iconify-icon>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};