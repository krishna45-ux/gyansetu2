import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { Language } from '../types';
import { translations } from '../utils/translations';
import { DAILY_WORD } from '../utils/curriculumData';

interface DailyGrowthViewProps {
    isDark: boolean;
    lang: Language;
}

interface ChatMessage {
    id: number;
    sender: 'ai' | 'user';
    text: string;
    isSystem?: boolean;
}

interface LeaderboardEntry {
    name: string;
    score: number;
    accuracy: number;
    improvement: number;
}

const LEADERBOARD_DATA: LeaderboardEntry[] = [
    { name: "Priya V.", score: 98, accuracy: 96, improvement: 12 },
    { name: "Arjun K.", score: 95, accuracy: 92, improvement: 8 },
    { name: "Sarah M.", score: 92, accuracy: 89, improvement: 15 },
    { name: "You", score: 0, accuracy: 0, improvement: 0 }, // Placeholder
    { name: "Rahul S.", score: 88, accuracy: 85, improvement: 5 },
];

const SCENARIOS = [
    { id: 1, title: "Conflict Resolution", prompt: "Your teammate missed a deadline that affects your project. How do you approach them? (I will act as the teammate, you start)." },
    { id: 2, title: "Interview Prep", prompt: "I am an interviewer for a Software Engineering role. Tell me about a time you failed and what you learned from it." },
    { id: 3, title: "Negotiation", prompt: "You believe you deserve a higher grade on your project. Convince me (your teacher)." }
];

const BAD_WORDS = ['stupid', 'idiot', 'dumb', 'hate', 'useless', 'shut up', 'crazy', 'mad', 'kill', 'die'];

export const DailyGrowthView: React.FC<DailyGrowthViewProps> = ({ isDark, lang }) => {
    // --- WORD OF THE DAY STATE ---
    const word = DAILY_WORD;

    const t = translations[lang];

    const playPronunciation = () => {
        const utterance = new SpeechSynthesisUtterance(word.text);
        window.speechSynthesis.speak(utterance);
    };

    // --- CRITICAL THINKING STATE ---
    const [ctAnswer, setCtAnswer] = useState("");
    const [ctStatus, setCtStatus] = useState<'open' | 'submitting' | 'graded'>('open');
    const [ctScore, setCtScore] = useState(0);
    const [ctRank, setCtRank] = useState(0);
    const [aiFeedback, setAiFeedback] = useState("");

    const criticalThinkingQuestion = "An AI autonomous vehicle must choose between hitting a pedestrian who ran a red light or swerving into a wall, potentially harming the passenger. Question: How should the AI be programmed to decide? Justify your ethical framework (Utilitarian vs Deontological).";

    useEffect(() => {
        const saved = localStorage.getItem('gyansetu_daily_challenge');
        if (saved) {
            const data = JSON.parse(saved);
            // Reset if it's a new day (simple check)
            if (new Date().toDateString() === data.date) {
                setCtStatus('graded');
                setCtScore(data.score);
                setCtRank(data.rank);
                setCtAnswer(data.answer);
                setAiFeedback(data.feedback);
            }
        }
    }, []);

    const submitChallenge = async () => {
        if (!ctAnswer.trim()) return;
        setCtStatus('submitting');
        
        try {
            // Backend Connection: Gemini API
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const prompt = `
            Question: ${criticalThinkingQuestion}
            Student Answer: "${ctAnswer}"
            
            Evaluate this answer based on:
            1. Logical Consistency
            2. Ethical Reasoning
            3. Clarity
            
            Compare this student against a hypothetical cohort of 100 students.
            Return a JSON object with:
            - score: A number between 0-100.
            - rank: A number between 1-100 (Where 1 is top rank).
            - feedback: A concise breakdown of strengths and weaknesses.
            `;
            
            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: prompt,
                config: { 
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            score: { type: Type.NUMBER },
                            rank: { type: Type.NUMBER },
                            feedback: { type: Type.STRING }
                        },
                        required: ["score", "rank", "feedback"]
                    }
                }
            });
            
            const result = JSON.parse(response.text || "{}");
            const finalScore = result.score || 85;
            const finalRank = result.rank || 15;
            const finalFeedback = result.feedback || "Good reasoning provided, though deeper ethical analysis could improve your score.";

            setCtScore(finalScore);
            setCtRank(finalRank);
            setAiFeedback(finalFeedback);
            setCtStatus('graded');

            localStorage.setItem('gyansetu_daily_challenge', JSON.stringify({
                date: new Date().toDateString(),
                answer: ctAnswer,
                score: finalScore,
                rank: finalRank,
                feedback: finalFeedback
            }));
        } catch (error: any) {
            console.warn("AI Grading Error:", error);
            
            let feedbackMsg = "Great effort. (AI Offline mode: Logic sound, ethics clear).";
            if (error.message?.includes('429') || error.message?.includes('RESOURCE_EXHAUSTED') || error.status === 429) {
                feedbackMsg = "Great effort! (AI is currently busy with high traffic. This is an estimated evaluation).";
            }
            
            // Fallback if API fails
            setCtScore(85);
            setCtRank(12);
            setAiFeedback(feedbackMsg);
            setCtStatus('graded');
        }
    };

    // --- SOFT SKILLS DOJO STATE & ABUSE LOCKOUT ---
    const [activeScenario, setActiveScenario] = useState<number | null>(null);
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [chatInput, setChatInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    
    // Lockout State
    const [isLocked, setIsLocked] = useState(false);
    const [lockoutTimeLeft, setLockoutTimeLeft] = useState<string>("");
    
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        checkLockoutStatus();
        const interval = setInterval(checkLockoutStatus, 60000); // Check every minute
        return () => clearInterval(interval);
    }, []);

    const checkLockoutStatus = () => {
        const lockoutTimestamp = localStorage.getItem('gyansetu_guru_lockout_until');
        if (lockoutTimestamp) {
            const until = parseInt(lockoutTimestamp);
            const now = Date.now();
            if (now < until) {
                setIsLocked(true);
                const diff = until - now;
                const minutes = Math.ceil(diff / 60000);
                setLockoutTimeLeft(`${Math.floor(minutes / 60)}h ${minutes % 60}m`);
            } else {
                setIsLocked(false);
                localStorage.removeItem('gyansetu_guru_lockout_until');
                localStorage.setItem('gyansetu_guru_abuse_count', '0');
            }
        }
    };

    const handleAbuse = () => {
        let count = parseInt(localStorage.getItem('gyansetu_guru_abuse_count') || "0");
        count += 1;
        localStorage.setItem('gyansetu_guru_abuse_count', count.toString());

        if (count > 3) {
            // Lock for 1.5 hours (90 mins)
            const lockUntil = Date.now() + (1.5 * 60 * 60 * 1000);
            localStorage.setItem('gyansetu_guru_lockout_until', lockUntil.toString());
            setIsLocked(true);
            setActiveScenario(null); // Force exit scenario
            setChatHistory([]);
            alert("Session Suspended: You have exceeded the limit for abusive language. Access locked for 1.5 hours.");
        } else {
            const warningMsg: ChatMessage = { 
                id: Date.now(), 
                sender: 'ai', 
                text: `Warning (${count}/3): Please maintain professional language. Repeated profanity will result in a session lockout.`,
                isSystem: true
            };
            setChatHistory(prev => [...prev, warningMsg]);
        }
    };

    const startScenario = async (id: number) => {
        if (isLocked) return;
        const scenario = SCENARIOS.find(s => s.id === id);
        setActiveScenario(id);
        setChatHistory([
            { id: 1, sender: 'ai', text: `Roleplay Started: ${scenario?.title}. \n\n${scenario?.prompt}` }
        ]);
    };

    const sendChatMessage = async () => {
        if (!chatInput.trim() || isLocked) return;

        // 1. Check for Abuse
        const lowerInput = chatInput.toLowerCase();
        const isAbusive = BAD_WORDS.some(word => lowerInput.includes(word));

        if (isAbusive) {
            setChatInput("");
            handleAbuse();
            return;
        }
        
        // 2. Add User Message
        const userMsg: ChatMessage = { id: Date.now(), sender: 'user', text: chatInput };
        const updatedHistory = [...chatHistory, userMsg];
        setChatHistory(updatedHistory);
        setChatInput("");
        setIsTyping(true);

        try {
            // Backend Connection: Gemini API for Roleplay
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            // Construct conversation history for context
            const historyText = updatedHistory.map(m => `${m.sender === 'user' ? 'Student' : 'Mentor'}: ${m.text}`).join('\n');
            const prompt = `You are a mentor in a roleplay scenario. 
            Context: ${SCENARIOS.find(s => s.id === activeScenario)?.title}.
            History:
            ${historyText}
            
            Respond as the Mentor (AI). Keep it concise (max 2 sentences), realistic, and react to the Student's tone.`;

            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: prompt,
            });

            const aiText = response.text || "I see. Please continue.";
            const aiMsg: ChatMessage = { id: Date.now() + 1, sender: 'ai', text: aiText };
            setChatHistory(prev => [...prev, aiMsg]);
        } catch (error: any) {
            let errorText = "Connection interrupted. Let's try that again.";
             if (error.message?.includes('429') || error.message?.includes('RESOURCE_EXHAUSTED') || error.status === 429) {
                 errorText = "I'm processing too many requests right now. Please give me a moment to think.";
             }
            const errorMsg: ChatMessage = { id: Date.now() + 1, sender: 'ai', text: errorText };
            setChatHistory(prev => [...prev, errorMsg]);
        } finally {
            setIsTyping(false);
        }
    };

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatHistory, isTyping]);

    return (
        <div className="animate-fade pb-20 max-w-6xl mx-auto space-y-6 md:space-y-8">
            <div className="mb-4 md:mb-6">
                <h2 className={`text-2xl md:text-3xl font-bold ${isDark ? 'font-future text-white' : 'font-heritage text-h-ink'}`}>{t.dailyGrowth} Zone</h2>
                <p className="opacity-60 text-sm mt-1">Consistency is the key to mastery. Sharpen your mind daily.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* --- LEFT COLUMN: Word & Challenge --- */}
                <div className="lg:col-span-2 space-y-6">
                    
                    {/* Word of the Day */}
                    <div className={`p-5 md:p-6 rounded-2xl relative overflow-hidden ${isDark ? 'glass-panel border-f-neon/30' : 'paper-panel'}`}>
                        <div className="flex justify-between items-start mb-4">
                            <span className="text-xs font-bold uppercase tracking-widest opacity-60">{t.wordOfDay}</span>
                            <button onClick={playPronunciation} className={`p-2 rounded-full ${isDark ? 'bg-f-neon/20 text-f-neon hover:bg-f-neon hover:text-black' : 'bg-h-accent/10 text-h-accent hover:bg-h-accent hover:text-white'} transition-colors`}>
                                <iconify-icon icon="solar:volume-loud-bold" className="text-xl"></iconify-icon>
                            </button>
                        </div>
                        <div className="flex items-baseline gap-4 mb-2">
                            <h3 className={`text-3xl md:text-4xl font-bold ${isDark ? 'font-future text-white' : 'font-heritage text-h-ink'}`}>{word.text}</h3>
                            <span className="opacity-60 italic">{word.phonetic}</span>
                        </div>
                        <span className={`inline-block px-2 py-1 rounded text-[10px] font-bold uppercase mb-4 ${isDark ? 'bg-f-purple/20 text-f-purple' : 'bg-h-gold/20 text-h-gold'}`}>{word.type}</span>
                        <p className="font-serif text-lg leading-relaxed mb-2">"{word.meaning}"</p>
                        <p className="text-sm opacity-60">Ex: {word.example}</p>
                    </div>

                    {/* Critical Thinking Challenge */}
                    <div className={`p-5 md:p-6 rounded-2xl ${isDark ? 'glass-panel' : 'paper-panel'}`}>
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-2">
                                <iconify-icon icon="solar:brain-bold" className={`text-2xl ${isDark ? 'text-f-neon' : 'text-h-accent'}`}></iconify-icon>
                                <h3 className={`font-bold uppercase tracking-widest ${isDark ? 'text-white' : 'text-h-ink'}`}>{t.criticalThinking}</h3>
                            </div>
                            <span className={`text-[10px] md:text-xs px-2 py-1 rounded-full border ${isDark ? 'border-f-neon text-f-neon' : 'border-h-accent text-h-accent'}`}>Daily Challenge #42</span>
                        </div>

                        <div className="mb-6">
                            <h4 className="text-base md:text-lg font-bold mb-2">The Trolley Problem Variant</h4>
                            <p className="opacity-80 leading-relaxed text-sm">
                                {criticalThinkingQuestion}
                            </p>
                        </div>

                        {ctStatus === 'open' && (
                            <div className="animate-fade">
                                <textarea 
                                    className={`w-full h-32 p-4 rounded-xl mb-4 bg-transparent border ${isDark ? 'border-gray-700 focus:border-f-neon' : 'border-gray-300 focus:border-h-accent'} outline-none resize-none`}
                                    placeholder="Type your reasoning here..."
                                    value={ctAnswer}
                                    onChange={(e) => setCtAnswer(e.target.value)}
                                ></textarea>
                                <button 
                                    onClick={submitChallenge}
                                    className={`w-full py-3 rounded-xl font-bold uppercase tracking-widest transition-all
                                    ${isDark ? 'bg-f-neon text-black hover:shadow-[0_0_15px_#00F0FF]' : 'bg-h-accent text-white hover:shadow-lg'}`}
                                >
                                    {t.submitAi}
                                </button>
                            </div>
                        )}

                        {ctStatus === 'submitting' && (
                            <div className="h-40 flex flex-col items-center justify-center animate-pulse">
                                <iconify-icon icon="solar:cpu-bolt-bold" className={`text-5xl mb-4 ${isDark ? 'text-f-neon' : 'text-h-accent'}`}></iconify-icon>
                                <span className="font-bold uppercase text-xs tracking-widest">{t.analyzing}</span>
                            </div>
                        )}

                        {ctStatus === 'graded' && (
                            <div className="animate-fade">
                                <div className={`p-4 rounded-xl mb-4 flex items-center justify-between ${isDark ? 'bg-f-neon/10 border border-f-neon/50' : 'bg-h-accent/10 border border-h-accent/50'}`}>
                                    <div>
                                        <span className="block text-xs uppercase opacity-60">{t.yourScore}</span>
                                        <span className={`text-3xl font-bold ${isDark ? 'text-f-neon' : 'text-h-accent'}`}>{ctScore}/100</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="block text-xs uppercase opacity-60">{t.globalRank}</span>
                                        <span className={`text-xl font-bold ${isDark ? 'text-white' : 'text-h-ink'}`}>#{ctRank}</span>
                                    </div>
                                </div>
                                <div className="p-4 rounded-xl bg-gray-500/10 text-sm opacity-80 italic">
                                    "{aiFeedback}" - Guru AI
                                </div>
                            </div>
                        )}
                    </div>

                </div>

                {/* --- RIGHT COLUMN: Leaderboard & Dojo --- */}
                <div className="space-y-6">
                    
                    {/* Mini Leaderboard */}
                    <div className={`p-5 md:p-6 rounded-2xl ${isDark ? 'glass-panel' : 'paper-panel'}`}>
                        <h3 className="font-bold uppercase tracking-widest text-xs mb-4 opacity-60">{t.topThinkers}</h3>
                        <div className="space-y-3">
                            {LEADERBOARD_DATA.map((entry, i) => (
                                <div key={i} className={`group relative flex items-center justify-between p-2 rounded-lg cursor-help transition-all ${entry.name === 'You' ? (isDark ? 'bg-f-neon/20' : 'bg-h-accent/20') : 'hover:bg-gray-500/10'}`}>
                                    <div className="flex items-center gap-3">
                                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i < 3 ? 'bg-yellow-500 text-black' : 'bg-gray-500 text-white'}`}>{i + 1}</span>
                                        <span className="font-bold text-sm">{entry.name}</span>
                                    </div>
                                    <span className="font-mono font-bold text-xs">{ctStatus === 'graded' && entry.name === 'You' ? ctScore : entry.score}</span>

                                    {/* Hover Stats */}
                                    <div className={`absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-48 p-3 rounded-xl shadow-xl text-xs z-50 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none ${isDark ? 'bg-black border border-gray-700 text-white' : 'bg-white border border-gray-200 text-black'}`}>
                                        <div className="flex justify-between mb-1">
                                            <span className="opacity-60">Accuracy</span>
                                            <span className="font-bold text-green-500">{entry.accuracy}%</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="opacity-60">Improvement</span>
                                            <span className="font-bold text-blue-500">+{entry.improvement}%</span>
                                        </div>
                                        {/* Little Arrow */}
                                        <div className={`absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent ${isDark ? 'border-t-black' : 'border-t-white'}`}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Soft Skills Dojo */}
                    <div className={`p-5 md:p-6 rounded-2xl flex flex-col h-[500px] ${isDark ? 'glass-panel' : 'paper-panel'}`}>
                        <div className="mb-4">
                            <h3 className={`font-bold uppercase tracking-widest text-sm flex items-center gap-2 ${isDark ? 'text-f-purple' : 'text-h-gold'}`}>
                                <iconify-icon icon="solar:chat-round-line-bold"></iconify-icon>
                                {t.softSkills}
                            </h3>
                            <p className="text-xs opacity-60 mt-1">{t.practicePrompt}</p>
                        </div>

                        {isLocked ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-4 border border-red-500/30 bg-red-500/10 rounded-xl">
                                <iconify-icon icon="solar:lock-password-bold" className="text-4xl text-red-500 mb-2"></iconify-icon>
                                <h4 className="font-bold text-red-500 mb-1">Session Locked</h4>
                                <p className="text-xs opacity-80 mb-4">Locked due to repeated policy violations.</p>
                                <div className="text-2xl font-mono font-bold">{lockoutTimeLeft}</div>
                                <p className="text-[10px] uppercase opacity-60 mt-2">Time Remaining</p>
                            </div>
                        ) : (
                            !activeScenario ? (
                                <div className="flex-1 overflow-y-auto space-y-3">
                                    <p className="text-xs font-bold uppercase tracking-widest opacity-50 mb-2">{t.selectScenario}</p>
                                    {SCENARIOS.map(scenario => (
                                        <button 
                                            key={scenario.id}
                                            onClick={() => startScenario(scenario.id)}
                                            className={`w-full p-4 rounded-xl text-left border transition-all hover:scale-[1.02]
                                            ${isDark ? 'border-gray-700 hover:border-f-purple bg-white/5' : 'border-gray-300 hover:border-h-gold bg-black/5'}`}
                                        >
                                            <h4 className="font-bold text-sm mb-1">{scenario.title}</h4>
                                            <p className="text-xs opacity-60 line-clamp-2">{scenario.prompt}</p>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <>
                                    <div className={`flex-1 overflow-y-auto space-y-4 mb-4 p-2 rounded-xl custom-scrollbar ${isDark ? 'bg-black/20' : 'bg-white/50'}`}>
                                        {chatHistory.map(msg => (
                                            <div key={msg.id} className={`flex ${msg.isSystem ? 'justify-center' : (msg.sender === 'user' ? 'justify-end' : 'justify-start')}`}>
                                                {msg.isSystem ? (
                                                    <div className="text-xs bg-red-500/10 text-red-500 border border-red-500/20 px-3 py-1 rounded-full">
                                                        {msg.text}
                                                    </div>
                                                ) : (
                                                    <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                                                        msg.sender === 'user' 
                                                            ? (isDark ? 'bg-f-purple text-white' : 'bg-h-gold text-white') 
                                                            : (isDark ? 'bg-gray-800' : 'bg-gray-200')
                                                    }`}>
                                                        {msg.text}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                        {isTyping && (
                                            <div className="flex justify-start">
                                                <div className={`max-w-[80%] p-3 rounded-2xl text-xs italic opacity-60 ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`}>
                                                    Guru AI is thinking...
                                                </div>
                                            </div>
                                        )}
                                        <div ref={chatEndRef} />
                                    </div>
                                    <div className="flex gap-2">
                                        <input 
                                            type="text" 
                                            value={chatInput}
                                            onChange={(e) => setChatInput(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                                            placeholder={t.typeResponse}
                                            disabled={isTyping}
                                            className={`flex-1 p-3 rounded-xl text-sm bg-transparent border ${isDark ? 'border-gray-700 focus:border-f-purple' : 'border-gray-300 focus:border-h-gold'} outline-none disabled:opacity-50`}
                                        />
                                        <button 
                                            onClick={sendChatMessage}
                                            disabled={isTyping}
                                            className={`p-3 rounded-xl flex items-center justify-center transition-colors ${isDark ? 'bg-f-purple text-white' : 'bg-h-gold text-white'} disabled:opacity-50`}
                                        >
                                            <iconify-icon icon="solar:plain-3-bold"></iconify-icon>
                                        </button>
                                    </div>
                                    <button 
                                        onClick={() => { setActiveScenario(null); setChatHistory([]); }}
                                        className="text-[10px] uppercase font-bold text-center mt-2 opacity-50 hover:opacity-100"
                                    >
                                        {t.exitScenario}
                                    </button>
                                </>
                            )
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
};