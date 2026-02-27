import React, { useState, useEffect } from 'react';
import { ProgressBlock } from '../components/ProgressBlock';
import { ClassResource, Language, ViewState, Quiz } from '../types';
import { translations } from '../utils/translations';

import { GoogleGenAI } from "@google/genai";
import { getUserProfile, getLastWatched, getCareerGoal, getResources, getQuizzes } from '../services/dbService';

interface StudentDashboardProps {
    isDark: boolean;
    lang: Language;
    onNavigate?: (view: ViewState) => void;
    userEmail: string;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ isDark, lang, onNavigate, userEmail }) => {
    const [name, setName] = useState("Student");
    const [fullName, setFullName] = useState("");
    const [resources, setResources] = useState<ClassResource[]>([]);
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [lastWatched, setLastWatched] = useState<any>(null);
    const [careerGoal, setCareerGoal] = useState<string | null>(null);

    // AI Feedback State
    const [aiFeedback, setAiFeedback] = useState<string>("");
    const [isLoadingFeedback, setIsLoadingFeedback] = useState(false);

    // Daily Challenge State
    const [challengeAnswer, setChallengeAnswer] = useState("");
    const [challengeFeedback, setChallengeFeedback] = useState<string | null>(null);

    const t = translations[lang];

    useEffect(() => {
        const loadDashboardData = async () => {
            // 1. Load Profile
            const profile = await getUserProfile();
            if (profile) {
                setFullName(profile.name);
                setName(profile.name.split(' ')[0]);
            } else {
                const defaultName = userEmail.split('@')[0];
                setName(defaultName);
            }

            // 2. Load Last Watched (No UID needed, backend handles it via token)
            const last = await getLastWatched("");
            if (last) setLastWatched(last);

            // 3. Load Career Goal
            const goal = await getCareerGoal("");
            if (goal) setCareerGoal(goal);

            // 4. Load Resources from Cloud
            const dbResources = await getResources();
            setResources(dbResources);

            // 5. Load Quizzes from Cloud
            const dbQuizzes = await getQuizzes();
            setQuizzes(dbQuizzes);

            // Trigger AI
            generateAiFeedback();
        };

        loadDashboardData();
    }, [userEmail]);

    const generateAiFeedback = async () => {
        if (aiFeedback || isLoadingFeedback) return;

        setIsLoadingFeedback(true);

        // Use loaded state
        const fallbackMessage = lastWatched
            ? `Excellent work studying ${lastWatched.subject}. To reach your goal of being a ${careerGoal || 'Scholar'}, consistency is your greatest weapon.`
            : `Welcome, ${name}. The journey of a thousand miles begins with a single step. Visit the Curriculum to start.`;

        try {
            if (!process.env.API_KEY) {
                console.warn("API Key missing. Using offline Guru message.");
                setTimeout(() => {
                    setAiFeedback(fallbackMessage);
                    setIsLoadingFeedback(false);
                }, 1000);
                return;
            }

            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

            let prompt = `You are 'Guru AI', a wise, encouraging, and futuristic educational mentor.
            
            Context:
            - Student Name: ${fullName}
            - Career Goal: ${careerGoal || "Undecided"}
            - Recent Activity: ${lastWatched ? `Studied ${lastWatched.chapter} in ${lastWatched.subject}` : "No specific recent activity"}
            
            Task:
            Write a SHORT (max 2 sentences) personalized motivation message.
            `;

            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: prompt,
            });

            setAiFeedback(response.text || fallbackMessage);
        } catch (error: any) {
            if (error.message?.includes('429') || error.message?.includes('RESOURCE_EXHAUSTED') || error.status === 429) {
                console.warn("Guru AI Rate Limited.");
            }
            setAiFeedback(fallbackMessage);
        } finally {
            setIsLoadingFeedback(false);
        }
    };



    const handleContinueLearning = () => {
        // We still use localStorage for simple navigation flags between views
        if (lastWatched) {
            localStorage.setItem(`gyansetu_${userEmail}_resume_flag`, 'true');
        }
        if (onNavigate) {
            onNavigate('curriculum');
        }
    };

    const submitDailyChallenge = () => {
        if (!challengeAnswer.trim()) return;
        const answer = challengeAnswer.toLowerCase();
        if (answer.includes("double") || answer.includes("2x") || answer.includes("twice")) {
            setChallengeFeedback("Correct! Momentum (p = mv) is directly proportional to mass.");
        } else {
            setChallengeFeedback("Not quite. Remember, Momentum = Mass × Velocity. If Mass doubles...");
        }
    };

    const myResources = resources.filter(r => !r.targetStudent || r.targetStudent === fullName || r.targetStudent === name);
    const assignments = myResources.filter(r => r.type === 'assignment');
    const notes = myResources.filter(r => r.type === 'note');
    const remedials = myResources.filter(r => r.type === 'remedial');

    const getSubjectIcon = (subject: string) => {
        const lower = subject.toLowerCase();
        if (lower.includes('math')) return 'solar:calculator-bold';
        if (lower.includes('science')) return 'solar:atom-bold';
        if (lower.includes('english')) return 'solar:book-bookmark-bold';
        if (lower.includes('social')) return 'solar:globe-bold';
        return 'solar:book-2-bold';
    };

    return (
        <div className="animate-fade grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
                <div className={`p-5 md:p-8 rounded-2xl relative overflow-hidden flex items-center ${isDark ? 'bg-gradient-to-r from-f-panel to-black border border-gray-800' : 'bg-h-paper border border-h-accent'}`}>
                    <div className="z-10">
                        <h2 className={`text-2xl md:text-3xl font-bold mb-2 ${isDark ? 'font-future' : 'font-heritage'}`}>{t.welcomeUser}, {name}</h2>
                        <p className="text-sm md:text-base opacity-70">{t.streakMsg}</p>
                    </div>
                    <iconify-icon icon="solar:fire-bold" className={`text-6xl md:text-7xl absolute right-4 md:right-8 opacity-10 ${isDark ? 'text-f-neon' : 'text-h-accent'}`}></iconify-icon>
                </div>

                {/* Classroom Board */}
                <div className={`p-5 md:p-6 rounded-2xl ${isDark ? 'glass-panel border-f-neon/30' : 'paper-panel'}`}>
                    <div className="flex items-center gap-2 mb-6">
                        <iconify-icon icon="solar:blackboard-bold" className={`text-xl ${isDark ? 'text-f-neon' : 'text-h-accent'}`}></iconify-icon>
                        <h3 className="font-bold uppercase tracking-widest text-xs opacity-60">{t.classroomBoard}</h3>
                    </div>

                    <div className="space-y-6">
                        {myResources.length === 0 && quizzes.length === 0 && (
                            <div className="text-center py-6 opacity-40">
                                <p className="text-sm">{t.noUpdates}</p>
                            </div>
                        )}

                        {/* Quizzes Section */}
                        {quizzes.length > 0 && (
                            <div>
                                <h4 className={`text-sm font-bold mb-3 flex items-center gap-2 ${isDark ? 'text-purple-400' : 'text-purple-700'}`}>
                                    <iconify-icon icon="solar:question-circle-bold"></iconify-icon> {t.activeQuizzes}
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {quizzes.slice(0, 2).map(q => (
                                        <div key={q.id} className={`p-4 rounded-xl border flex justify-between items-center ${isDark ? 'bg-f-purple/10 border-f-purple/30' : 'bg-white border-gray-200'}`}>
                                            <div>
                                                <h5 className="font-bold text-sm">{q.title}</h5>
                                                <span className="text-[10px] opacity-60 uppercase">{q.subject} • {q.questions.length} Qs</span>
                                            </div>
                                            <button className={`px-3 py-1 rounded text-[10px] font-bold uppercase ${isDark ? 'bg-f-purple text-white' : 'bg-h-gold text-white'}`}>
                                                {t.takeQuiz}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Remedial / Targeted Assignments */}
                        {remedials.length > 0 && (
                            <div>
                                <h4 className={`text-sm font-bold mb-3 flex items-center gap-2 ${isDark ? 'text-orange-400' : 'text-orange-700'}`}>
                                    <iconify-icon icon="solar:danger-circle-bold"></iconify-icon> {t.remedialAction}
                                </h4>
                                <div className="space-y-3">
                                    {remedials.map(res => (
                                        <div key={res.id} className={`p-4 rounded-xl border border-orange-500/30 ${isDark ? 'bg-orange-500/10' : 'bg-orange-50'}`}>
                                            <h5 className="font-bold text-sm mb-1">{res.title}</h5>
                                            <p className="text-xs opacity-70 mb-2">{res.content}</p>
                                            {res.linkToChapter && (
                                                <button onClick={handleContinueLearning} className="flex items-center gap-2 text-[10px] font-bold uppercase underline">
                                                    <iconify-icon icon="solar:play-circle-bold"></iconify-icon> Watch Chapter
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Recent Assignments */}
                        {assignments.length > 0 && (
                            <div>
                                <h4 className={`text-sm font-bold mb-3 flex items-center gap-2 ${isDark ? 'text-red-400' : 'text-red-700'}`}>
                                    <iconify-icon icon="solar:clipboard-check-bold"></iconify-icon> {t.assignmentsDue}
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {assignments.slice(0, 4).map(res => (
                                        <div key={res.id} className={`p-4 rounded-xl border ${isDark ? 'bg-white/5 border-gray-700' : 'bg-white border-gray-200'}`}>
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="text-[10px] font-bold uppercase opacity-60">{res.subject}</span>
                                                {res.dueDate && <span className="text-[10px] font-bold text-red-500 bg-red-500/10 px-2 py-0.5 rounded">Due: {res.dueDate}</span>}
                                            </div>
                                            <h5 className="font-bold text-sm mb-1">{res.title}</h5>
                                            <p className="text-xs opacity-70 line-clamp-2">{res.content}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Recent Notes */}
                        {notes.length > 0 && (
                            <div>
                                <h4 className={`text-sm font-bold mb-3 flex items-center gap-2 ${isDark ? 'text-blue-400' : 'text-blue-700'}`}>
                                    <iconify-icon icon="solar:document-add-bold"></iconify-icon> {t.notesAnnouncements}
                                </h4>
                                <div className="space-y-3">
                                    {notes.slice(0, 3).map(res => (
                                        <div key={res.id} className={`flex items-start gap-4 p-3 rounded-xl ${isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-black/5 hover:bg-black/10'} transition-colors`}>
                                            <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
                                                <iconify-icon icon="solar:bell-bold"></iconify-icon>
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-bold text-sm">{res.title}</span>
                                                    <span className="text-[10px] opacity-50">• {res.subject}</span>
                                                </div>
                                                <p className="text-xs opacity-70 line-clamp-2">{res.content}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Continue Learning - Synced with Curriculum */}
                <div
                    className={`p-5 md:p-6 rounded-2xl cursor-pointer transition-transform hover:scale-[1.01] ${isDark ? 'glass-panel' : 'paper-panel'}`}
                    onClick={handleContinueLearning}
                >
                    <h3 className="font-bold uppercase tracking-widest text-xs mb-6 opacity-60">{t.continueLearning}</h3>
                    {lastWatched ? (
                        <div className="flex items-center gap-4 md:gap-6">
                            <div className={`w-16 h-16 md:w-20 md:h-20 rounded-xl flex items-center justify-center text-3xl ${isDark ? 'bg-f-neon/10 text-f-neon' : 'bg-h-accent/10 text-h-accent'}`}>
                                <iconify-icon icon={getSubjectIcon(lastWatched.subject)}></iconify-icon>
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-base md:text-lg truncate">{lastWatched.chapter}</h4>
                                <p className="text-xs opacity-60 mb-3">{lastWatched.subject} • Class {lastWatched.classLevel}</p>
                                <ProgressBlock title={t.completion} progress={lastWatched.progress} isDark={isDark} />
                            </div>
                            <div className={`hidden md:flex items-center justify-center w-10 h-10 rounded-full border ${isDark ? 'border-f-neon text-f-neon' : 'border-h-accent text-h-accent'}`}>
                                <iconify-icon icon="solar:play-bold"></iconify-icon>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-8 opacity-50">
                            <iconify-icon icon="solar:notebook-minimalistic-bold" className="text-4xl mb-2"></iconify-icon>
                            <p className="text-sm">No recent activity. Start learning from the Curriculum!</p>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">


                    {/* Interactive Daily Challenge */}
                    <div className={`p-5 md:p-6 rounded-2xl ${isDark ? 'glass-panel' : 'paper-panel'}`}>
                        <h3 className={`font-bold uppercase tracking-widest text-xs mb-4 ${isDark ? 'text-f-purple' : 'text-h-gold'}`}>{t.dailyChallenge}</h3>
                        <p className="text-sm font-bold mb-3">If the mass of an object doubles but velocity remains constant, what happens to the momentum?</p>

                        {!challengeFeedback ? (
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={challengeAnswer}
                                    onChange={(e) => setChallengeAnswer(e.target.value)}
                                    placeholder="Your answer..."
                                    className={`flex-1 p-2 text-xs rounded-lg border bg-transparent outline-none ${isDark ? 'border-gray-700' : 'border-gray-300'}`}
                                />
                                <button
                                    onClick={submitDailyChallenge}
                                    className={`px-3 py-2 rounded-lg text-xs font-bold uppercase ${isDark ? 'bg-f-purple/20 text-f-purple' : 'bg-h-gold/20 text-h-gold'}`}
                                >
                                    {t.submitAnswer}
                                </button>
                            </div>
                        ) : (
                            <div className={`p-3 rounded-lg text-xs font-bold ${challengeFeedback.startsWith("Correct") ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                {challengeFeedback}
                                <button onClick={() => { setChallengeFeedback(null); setChallengeAnswer(""); }} className="block mt-2 underline opacity-60">Try Again</button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                <div className={`p-5 md:p-6 rounded-2xl ${isDark ? 'glass-panel' : 'paper-panel'}`}>
                    <h3 className="font-bold uppercase tracking-widest text-xs mb-4 opacity-60">{t.aiFeedback}</h3>
                    {isLoadingFeedback ? (
                        <div className="flex items-center gap-3 animate-pulse">
                            <div className={`w-8 h-8 rounded-full ${isDark ? 'bg-f-neon/20' : 'bg-h-accent/20'}`}></div>
                            <div className={`h-2 w-3/4 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-300'}`}></div>
                        </div>
                    ) : (
                        <div className={`p-4 rounded-xl text-xs leading-relaxed italic ${isDark ? 'bg-white/5' : 'bg-black/5'}`}>
                            "{aiFeedback}"
                        </div>
                    )}
                    <button
                        onClick={() => {
                            setAiFeedback(""); // Clear current feedback to force refresh
                            generateAiFeedback();
                        }}
                        disabled={isLoadingFeedback}
                        className={`w-full mt-4 py-3 rounded-xl font-bold uppercase text-[10px] tracking-widest ${isDark ? 'bg-f-neon text-black' : 'bg-h-accent text-white'}`}
                    >
                        {isLoadingFeedback ? 'Connecting...' : 'Refresh Guru'}
                    </button>
                </div>

                {/* Simplified Calendar / Upcoming replaced Career Roadway */}
                <div className={`p-5 md:p-6 rounded-2xl ${isDark ? 'glass-panel' : 'paper-panel'}`}>
                    <h3 className="font-bold uppercase tracking-widest text-xs mb-4 opacity-60">Upcoming</h3>
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-xs ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`}>
                                <span>12<br />OCT</span>
                            </div>
                            <div>
                                <div className="text-sm font-bold">Physics Quiz</div>
                                <div className="text-xs opacity-60">Chapter 4: Motion</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-xs ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`}>
                                <span>14<br />OCT</span>
                            </div>
                            <div>
                                <div className="text-sm font-bold">Project Submission</div>
                                <div className="text-xs opacity-60">Environmental Science</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};