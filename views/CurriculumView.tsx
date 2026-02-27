import React, { useState, useEffect } from 'react';
import { Language } from '../types';
import { translations } from '../utils/translations';
import { SYLLABUS_DATA, SUBJECT_ICONS, CHAPTER_VIDEO_MAP } from '../utils/curriculumData';
import { GoogleGenAI, Type } from "@google/genai";
import { saveLastWatched, getLastWatched, getCompletedChapters, markChapterCompleteDB } from '../services/dbService';

interface CurriculumViewProps {
    isDark: boolean;
    lang: Language;
    userEmail: string; // Add User Email Prop
}

interface AiQuizQuestion {
    question: string;
    options: string[];
    correctIndex: number;
}

interface VideoOption {
    id: string;
    title: string;
    type: 'Concept' | 'Animated' | 'RealWorld';
    duration: string;
}

// Helper to simulate content fetching with real mapped videos
const getChapterContent = (title: string, subject: string) => {
    
    // 1. Check if we have a specific mapping for this chapter
    const primaryVideoId = CHAPTER_VIDEO_MAP[title] || "OoO5d5P0Jn4"; // Updated fallback to requested video

    const videos: VideoOption[] = [
        { 
            id: primaryVideoId, 
            title: "Core Concepts Lecture", 
            type: "Concept", 
            duration: "15:20" 
        },
        { 
            id: "OoO5d5P0Jn4", // Using same video as placeholder for animated
            title: "Visual & Animated Guide", 
            type: "Animated", 
            duration: "08:45" 
        },
        { 
            id: "OoO5d5P0Jn4", // Using same video as placeholder for Real World
            title: "Real World Applications", 
            type: "RealWorld", 
            duration: "12:10" 
        }
    ];

    const mockNotes = `
# ${title}

**1. Introduction**
Welcome to the comprehensive study guide for ${title}. This chapter explores the fundamental concepts that form the building blocks of this subject.

**2. Key Definitions**
* **Concept A**: The primary driver of the phenomenon.
* **Concept B**: The reaction mechanism observed in controlled environments.
* **Variable X**: The independent factor changing over time.

**3. Core Principles**
Understanding the relationship between mass and energy is crucial here. As observed in previous modules, the linearity of the equation suggests a direct correlation.

**4. Summary**
In conclusion, ${title} serves as a pivotal point in the curriculum, bridging the gap between theoretical knowledge and practical application. Remember to practice the exercises at the end of the section.

*Note: These are generated study notes for demonstration purposes.*
    `;

    return { videos, notes: mockNotes };
};

export const CurriculumView: React.FC<CurriculumViewProps> = ({ isDark, lang, userEmail }) => {
    const [selectedClass, setSelectedClass] = useState<number | null>(null);
    const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
    const [selectedChapter, setSelectedChapter] = useState<string | null>(null);
    const [completedChapters, setCompletedChapters] = useState<string[]>([]);
    
    // --- VIDEO STATE ---
    const [currentVideoId, setCurrentVideoId] = useState<string | null>(null);

    // --- QUIZ STATE ---
    const [quizMode, setQuizMode] = useState(false);
    const [quizLoading, setQuizLoading] = useState(false);
    const [quizQuestions, setQuizQuestions] = useState<AiQuizQuestion[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [quizScore, setQuizScore] = useState(0);
    const [quizFinished, setQuizFinished] = useState(false);

    const t = translations[lang];
    const classes = [6, 7, 8, 9, 10];

    // 1. Initial Load: Check for Resume Flag & Load Cloud Progress
    useEffect(() => {
        const init = async () => {
            // Load Cloud Progress
            const completed = await getCompletedChapters();
            setCompletedChapters(completed);

            // Check for "Continue Learning" flag from Dashboard
            const resumeFlag = localStorage.getItem(`gyansetu_${userEmail}_resume_flag`);
            
            if (resumeFlag === 'true') {
                // If resuming, trust the cloud 'last_watched' data
                const lastWatched = await getLastWatched("");
                if (lastWatched) {
                    setSelectedClass(lastWatched.classLevel);
                    setSelectedSubject(lastWatched.subject);
                    setSelectedChapter(lastWatched.chapter);
                }
                localStorage.removeItem(`gyansetu_${userEmail}_resume_flag`);
            }
        };
        init();
    }, [userEmail]);

    // 2. Persist Last Watched to Cloud when selection changes
    useEffect(() => {
        if (selectedClass && selectedSubject && selectedChapter) {
            const history = {
                classLevel: selectedClass,
                subject: selectedSubject,
                chapter: selectedChapter,
                progress: Math.floor(Math.random() * 80) + 10 
            };
            
            // Save to Cloud
            saveLastWatched("", history);
            
            // Reset video to first option
            const content = getChapterContent(selectedChapter, selectedSubject);
            if (content.videos.length > 0) {
                setCurrentVideoId(content.videos[0].id);
            }
        }
    }, [selectedClass, selectedSubject, selectedChapter]);

    const handleBack = () => {
        if (quizMode) {
            setQuizMode(false);
            setQuizFinished(false);
            setQuizQuestions([]);
            setQuizScore(0);
            setCurrentQuestionIndex(0);
        } else if (selectedChapter) {
            setSelectedChapter(null);
            setCurrentVideoId(null);
        } else if (selectedSubject) {
            setSelectedSubject(null);
        } else if (selectedClass) {
            setSelectedClass(null);
        }
    };

    const handleMarkComplete = async () => {
        if (selectedChapter && !completedChapters.includes(selectedChapter)) {
            // Optimistic Update
            setCompletedChapters([...completedChapters, selectedChapter]);
            
            // Save to Cloud
            await markChapterCompleteDB(selectedChapter);
            
            alert("Chapter marked as complete! Great job!");
        }
    };

    const handleGenerateQuiz = async () => {
        if (!selectedChapter || !selectedSubject) return;
        setQuizLoading(true);
        setQuizMode(true);
        
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const prompt = `Generate a 10-question multiple choice quiz for Class ${selectedClass}, Subject: ${selectedSubject}, Chapter: ${selectedChapter}.
            Ensure questions are relevant to the curriculum.
            Return a JSON array of objects.`;

            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: prompt,
                config: { 
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                question: { type: Type.STRING },
                                options: { 
                                    type: Type.ARRAY,
                                    items: { type: Type.STRING }
                                },
                                correctIndex: { type: Type.NUMBER, description: "Index of the correct option (0-3)" }
                            },
                            required: ["question", "options", "correctIndex"]
                        }
                    }
                }
            });

            const questions = JSON.parse(response.text || "[]");
            if (questions.length > 0) {
                setQuizQuestions(questions);
            } else {
                throw new Error("No questions generated");
            }
        } catch (error: any) {
            console.warn("Quiz Gen Error:", error);
            const fallbackQuiz: AiQuizQuestion[] = [
                { question: `Which of the following is a key concept in ${selectedChapter}?`, options: ["Concept A", "Concept B", "Concept C", "Concept D"], correctIndex: 0 },
                { question: "This topic fundamentally relates to:", options: ["Biology", "Physics", "Chemistry", "Mathematics"], correctIndex: 1 },
                { question: "True or False: This is an essential part of the Class curriculum.", options: ["True", "False", "Maybe", "Unknown"], correctIndex: 0 },
                { question: "What happens when variable X increases?", options: ["It decreases", "It increases", "Stays same", "None"], correctIndex: 1 },
                { question: "Who is a famous figure associated with this field?", options: ["Newton", "Einstein", "Darwin", "Curie"], correctIndex: 0 }
            ];
            setQuizQuestions(fallbackQuiz);
        } finally {
            setQuizLoading(false);
        }
    };

    const handleAnswerSelect = (optionIndex: number) => {
        if (optionIndex === quizQuestions[currentQuestionIndex].correctIndex) {
            setQuizScore(prev => prev + 1);
        }
        
        if (currentQuestionIndex < quizQuestions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        } else {
            setQuizFinished(true);
        }
    };

    const activeContent = selectedChapter && selectedSubject 
        ? getChapterContent(selectedChapter, selectedSubject) 
        : null;

    const isCompleted = selectedChapter && completedChapters.includes(selectedChapter);

    return (
        <div className="animate-fade max-w-7xl mx-auto pb-20 relative">
            
            {/* QUIZ MODAL OVERLAY */}
            {quizMode && (
                <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade`}>
                    <div className={`w-full max-w-2xl p-8 rounded-3xl relative shadow-2xl ${isDark ? 'bg-gray-900 border border-f-purple/50' : 'bg-white border border-h-gold'}`}>
                        <button onClick={handleBack} className="absolute top-6 right-6 opacity-60 hover:opacity-100">
                            <iconify-icon icon="solar:close-circle-bold" className="text-3xl"></iconify-icon>
                        </button>

                        {quizLoading ? (
                            <div className="flex flex-col items-center justify-center py-20">
                                <iconify-icon icon="solar:magic-stick-3-bold" className={`text-6xl mb-4 animate-bounce ${isDark ? 'text-f-purple' : 'text-h-gold'}`}></iconify-icon>
                                <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-h-ink'}`}>Crafting Quiz...</h3>
                                <p className="opacity-60 text-sm mt-2">AI is analyzing {selectedChapter}</p>
                            </div>
                        ) : quizFinished ? (
                            <div className="text-center py-10">
                                <h3 className={`text-3xl font-bold mb-4 ${isDark ? 'text-white' : 'text-h-ink'}`}>Quiz Complete!</h3>
                                <div className={`text-6xl font-bold mb-6 ${quizScore > 7 ? 'text-green-500' : 'text-yellow-500'}`}>
                                    {quizScore} / {quizQuestions.length}
                                </div>
                                <p className="opacity-60 mb-8">
                                    {quizScore > 7 ? "Excellent mastery of the topic!" : "Good effort. Review the notes and try again."}
                                </p>
                                <div className="flex justify-center gap-4">
                                    <button onClick={handleBack} className={`px-6 py-3 rounded-xl font-bold uppercase tracking-widest ${isDark ? 'bg-white/10 text-white' : 'bg-black/10 text-black'}`}>
                                        Back to Chapter
                                    </button>
                                    <button onClick={() => { setQuizFinished(false); setCurrentQuestionIndex(0); setQuizScore(0); }} className={`px-6 py-3 rounded-xl font-bold uppercase tracking-widest ${isDark ? 'bg-f-purple text-white' : 'bg-h-gold text-white'}`}>
                                        Retry Quiz
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <div className="flex justify-between items-center mb-6">
                                    <span className={`text-xs font-bold uppercase tracking-widest opacity-60`}>Question {currentQuestionIndex + 1} of {quizQuestions.length}</span>
                                    <span className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-f-purple' : 'text-h-gold'}`}>Score: {quizScore}</span>
                                </div>
                                
                                <h3 className={`text-xl font-bold mb-8 ${isDark ? 'text-white' : 'text-h-ink'}`}>
                                    {quizQuestions[currentQuestionIndex].question}
                                </h3>

                                <div className="space-y-3">
                                    {quizQuestions[currentQuestionIndex].options.map((option, idx) => (
                                        <button 
                                            key={idx}
                                            onClick={() => handleAnswerSelect(idx)}
                                            className={`w-full p-4 rounded-xl text-left border transition-all hover:scale-[1.01] hover:shadow-lg
                                            ${isDark ? 'border-gray-700 hover:border-f-purple bg-white/5' : 'border-gray-300 hover:border-h-gold bg-black/5'}`}
                                        >
                                            <span className="font-bold opacity-50 mr-3">{String.fromCharCode(65 + idx)}.</span>
                                            {option}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Header with Breadcrumbs */}
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h2 className={`text-3xl font-bold ${isDark ? 'font-future text-white' : 'font-heritage text-h-ink'}`}>{t.curriculum}</h2>
                    <div className="flex flex-wrap items-center gap-2 mt-2 text-sm opacity-60">
                        <span className={!selectedClass ? 'font-bold' : ''}>{t.selectClass}</span>
                        {selectedClass && (
                            <>
                                <iconify-icon icon="solar:alt-arrow-right-bold"></iconify-icon>
                                <span className={!selectedSubject ? 'font-bold' : ''}>{t.class} {selectedClass}</span>
                            </>
                        )}
                        {selectedSubject && (
                            <>
                                <iconify-icon icon="solar:alt-arrow-right-bold"></iconify-icon>
                                <span className={!selectedChapter ? 'font-bold' : ''}>{selectedSubject}</span>
                            </>
                        )}
                        {selectedChapter && (
                            <>
                                <iconify-icon icon="solar:alt-arrow-right-bold"></iconify-icon>
                                <span className="font-bold truncate max-w-[150px]">{selectedChapter}</span>
                            </>
                        )}
                    </div>
                </div>
                {(selectedClass || selectedSubject) && (
                    <button 
                        onClick={handleBack}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-widest border transition-all
                        ${isDark ? 'border-gray-700 hover:bg-white/10 text-white' : 'border-gray-300 hover:bg-black/5 text-black'}`}
                    >
                        <iconify-icon icon="solar:arrow-left-bold"></iconify-icon>
                        {t.back}
                    </button>
                )}
            </div>

            {/* VIEW 1: CLASS SELECTION */}
            {!selectedClass && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade">
                    {classes.map((cls) => (
                        <div 
                            key={cls}
                            onClick={() => setSelectedClass(cls)}
                            className={`p-8 rounded-2xl cursor-pointer group transition-all duration-300 hover:-translate-y-2 relative overflow-hidden
                            ${isDark ? 'glass-panel hover:bg-white/5' : 'paper-panel hover:shadow-lg'}`}
                        >
                            <div className="relative z-10 flex justify-between items-start">
                                <div>
                                    <h3 className={`text-5xl font-bold mb-2 ${isDark ? 'font-future text-f-neon' : 'font-heritage text-h-accent'}`}>{cls}</h3>
                                    <p className="text-sm opacity-60 font-bold uppercase tracking-widest">{t.class}</p>
                                </div>
                                <iconify-icon icon="solar:diploma-bold" className={`text-6xl opacity-20 group-hover:opacity-40 transition-opacity ${isDark ? 'text-white' : 'text-h-ink'}`}></iconify-icon>
                            </div>
                            <div className="mt-8 flex gap-2">
                                {Object.keys(SYLLABUS_DATA[cls]).slice(0, 3).map((subj, i) => (
                                    <span key={i} className={`text-[10px] px-2 py-1 rounded border opacity-60 ${isDark ? 'border-gray-700' : 'border-gray-300'}`}>{subj}</span>
                                ))}
                                <span className="text-[10px] px-2 py-1 opacity-60">+More</span>
                            </div>
                            {/* Decorative Line */}
                            <div className={`absolute bottom-0 left-0 h-1 w-0 group-hover:w-full transition-all duration-500 ${isDark ? 'bg-f-neon' : 'bg-h-accent'}`}></div>
                        </div>
                    ))}
                </div>
            )}

            {/* VIEW 2: SUBJECT SELECTION */}
            {selectedClass && !selectedSubject && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade">
                    {Object.keys(SYLLABUS_DATA[selectedClass]).map((subject) => (
                        <div 
                            key={subject}
                            onClick={() => setSelectedSubject(subject)}
                            className={`p-6 rounded-2xl cursor-pointer text-center transition-all hover:scale-105 border-2
                            ${isDark 
                                ? 'border-gray-800 bg-f-panel hover:border-f-purple hover:shadow-[0_0_15px_rgba(189,0,255,0.2)]' 
                                : 'border-gray-200 bg-white hover:border-h-gold hover:shadow-md'}`}
                        >
                            <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center text-3xl mb-4
                                ${isDark ? 'bg-gray-800 text-white' : 'bg-h-base text-h-accent'}`}>
                                <iconify-icon icon={SUBJECT_ICONS[subject] || "solar:book-2-bold"}></iconify-icon>
                            </div>
                            <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-h-ink'}`}>{subject}</h3>
                            <p className="text-xs opacity-60 mt-1">{SYLLABUS_DATA[selectedClass][subject].length} {t.chapters}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* VIEW 3: CHAPTER LIST */}
            {selectedClass && selectedSubject && !selectedChapter && (
                <div className="animate-fade">
                    <div className={`rounded-2xl overflow-hidden ${isDark ? 'bg-white/5 border border-white/10' : 'bg-white border border-gray-200'}`}>
                        {SYLLABUS_DATA[selectedClass][selectedSubject].map((chapter, index) => {
                            const isDone = completedChapters.includes(chapter);
                            return (
                                <div 
                                    key={index}
                                    className={`p-6 flex items-center justify-between border-b last:border-0 transition-colors
                                    ${isDark ? 'border-gray-800 hover:bg-white/5' : 'border-gray-200 hover:bg-black/5'}`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="relative">
                                            <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${isDone ? 'bg-green-500 text-white' : (isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-200 text-gray-600')}`}>
                                                {isDone ? <iconify-icon icon="solar:check-bold"></iconify-icon> : index + 1}
                                            </span>
                                        </div>
                                        <div>
                                            <h4 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-h-ink'} ${isDone ? 'line-through opacity-50' : ''}`}>{chapter}</h4>
                                            <p className="text-xs opacity-50 mt-0.5">{isDone ? 'Completed' : 'Not Started'}</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => setSelectedChapter(chapter)}
                                        className={`px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-widest flex items-center gap-2 transition-all hover:scale-105
                                        ${isDark ? 'bg-f-neon text-black' : 'bg-h-accent text-white'}`}
                                    >
                                        <iconify-icon icon="solar:play-circle-bold" className="text-lg"></iconify-icon>
                                        <span className="hidden sm:inline">{isDone ? 'Re-watch' : t.startLearning}</span>
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* VIEW 4: LEARNING MODE (VIDEO & NOTES) */}
            {selectedChapter && activeContent && (
                <div className="animate-fade grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
                    
                    {/* Video Player Section with Multi-Select Sidebar */}
                    <div className="lg:col-span-2 flex flex-col h-full gap-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 h-full">
                            
                            {/* Main Video Player */}
                            <div className="md:col-span-3 flex flex-col h-full">
                                <div className={`w-full aspect-video rounded-2xl overflow-hidden border-2 mb-4 relative z-10
                                    ${isDark ? 'border-f-neon shadow-[0_0_20px_rgba(0,240,255,0.2)] bg-black' : 'border-h-accent shadow-xl bg-h-ink'}`}>
                                    <iframe 
                                        className="w-full h-full"
                                        src={`https://www.youtube.com/embed/${currentVideoId || activeContent.videos[0].id}`} 
                                        title="YouTube video player" 
                                        frameBorder="0" 
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                                        allowFullScreen
                                    ></iframe>
                                </div>
                                
                                <div className={`p-6 rounded-2xl flex-1 ${isDark ? 'glass-panel' : 'paper-panel'}`}>
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-h-ink'}`}>{selectedChapter}</h3>
                                        {isCompleted && <span className="text-green-500 font-bold text-xs uppercase border border-green-500 px-2 py-1 rounded">Completed</span>}
                                    </div>
                                    <p className="text-sm opacity-60 mb-4">{t.videoLecture} • {selectedSubject} • Class {selectedClass}</p>
                                    
                                    <div className="flex gap-4">
                                        <button 
                                            onClick={handleMarkComplete}
                                            disabled={!!isCompleted}
                                            className={`flex-1 py-3 rounded-xl font-bold uppercase tracking-widest text-xs transition-all hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed
                                            ${isDark ? 'bg-f-purple text-white shadow-[0_0_10px_rgba(189,0,255,0.3)]' : 'bg-h-gold text-white'}`}
                                        >
                                            {isCompleted ? "Completed" : t.markChapterComplete}
                                        </button>
                                        <button 
                                            onClick={handleGenerateQuiz}
                                            className={`flex-1 py-3 rounded-xl font-bold uppercase tracking-widest text-xs transition-all hover:scale-[1.01]
                                            ${isDark ? 'bg-f-neon text-black' : 'bg-h-accent text-white'}`}
                                        >
                                            Take AI Quiz
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Video Source Sidebar */}
                            <div className={`md:col-span-1 p-3 rounded-2xl overflow-y-auto ${isDark ? 'glass-panel' : 'paper-panel'}`}>
                                <h4 className="text-xs font-bold uppercase tracking-widest opacity-60 mb-3">Video Sources</h4>
                                <div className="space-y-2">
                                    {activeContent.videos.map((vid) => (
                                        <button
                                            key={vid.id}
                                            onClick={() => setCurrentVideoId(vid.id)}
                                            className={`w-full text-left p-2 rounded-lg border transition-all hover:scale-105
                                            ${currentVideoId === vid.id 
                                                ? (isDark ? 'bg-f-neon/20 border-f-neon text-white' : 'bg-h-accent/20 border-h-accent text-black') 
                                                : (isDark ? 'border-gray-700 bg-white/5 opacity-60 hover:opacity-100' : 'border-gray-200 bg-black/5 opacity-60 hover:opacity-100')}`}
                                        >
                                            <div className="text-[10px] font-bold uppercase mb-1">{vid.type}</div>
                                            <div className="text-xs font-bold leading-tight mb-1">{vid.title}</div>
                                            <div className="text-[10px] opacity-60">{vid.duration}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                        </div>
                    </div>

                    {/* Notes Section */}
                    <div className={`flex flex-col h-full rounded-2xl overflow-hidden border ${isDark ? 'bg-black/40 border-gray-700' : 'bg-white border-h-accent/30'}`}>
                        <div className={`p-4 border-b ${isDark ? 'border-gray-700 bg-gray-900/50' : 'border-h-accent/20 bg-h-paper'}`}>
                            <h3 className={`font-bold uppercase tracking-widest text-sm flex items-center gap-2 ${isDark ? 'text-f-neon' : 'text-h-accent'}`}>
                                <iconify-icon icon="solar:notebook-bold"></iconify-icon>
                                {t.chapterNotes}
                            </h3>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                            <div className={`prose max-w-none ${isDark ? 'prose-invert font-mono text-sm' : 'font-heritage text-h-ink'}`}>
                                {activeContent.notes.split('\n').map((line, i) => {
                                    if (line.startsWith('# ')) return <h1 key={i} className="text-2xl font-bold mb-4">{line.replace('# ', '')}</h1>;
                                    if (line.startsWith('**')) return <p key={i} className="font-bold mt-4 mb-2">{line.replace(/\*\*/g, '')}</p>;
                                    if (line.startsWith('* ')) return <li key={i} className="ml-4 mb-1">{line.replace('* ', '')}</li>;
                                    return <p key={i} className="mb-2 opacity-80 leading-relaxed">{line}</p>;
                                })}
                            </div>
                        </div>
                        <div className={`p-4 border-t ${isDark ? 'border-gray-700 bg-gray-900/50' : 'border-h-accent/20 bg-h-paper'}`}>
                            <button className={`w-full py-2 rounded-lg text-xs font-bold uppercase border flex items-center justify-center gap-2 transition-all
                                ${isDark ? 'border-white/20 hover:bg-white/10' : 'border-black/20 hover:bg-black/5'}`}>
                                <iconify-icon icon="solar:file-download-bold"></iconify-icon>
                                {t.downloadPdf}
                            </button>
                        </div>
                    </div>

                </div>
            )}
        </div>
    );
};