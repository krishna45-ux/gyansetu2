import React, { useState, useEffect } from 'react';
import { Role, UserProfile } from '../types';

interface Reply {
    id: number;
    author: string;
    role: Role;
    text: string;
    time: string;
}

interface Question {
    id: number;
    author: string;
    role: Role;
    title: string;
    desc: string;
    tags: string[];
    upvotes: number;
    replies: Reply[];
    time: string;
}

interface CommunityViewProps {
    isDark: boolean;
    userRole: Role | null;
}

// Mock Database for other users
const MOCK_PROFILES: Record<string, UserProfile> = {
    "Rahul S.": {
        name: "Rahul S.",
        role: "student",
        bio: "Physics enthusiast chasing the mysteries of the universe. Always asking 'Why?'.",
        joinDate: "Sept 2023",
        interests: ["Quantum Physics", "Astronomy", "Sci-Fi"]
    },
    "Dr. A. Verma": {
        name: "Dr. A. Verma",
        role: "teacher",
        bio: "Senior Physics Lecturer with 15 years of experience. Believes in simplified learning for complex concepts.",
        joinDate: "Aug 2020",
        interests: ["Teaching", "Research", "Classical Mechanics"]
    },
    "Priya V.": {
        name: "Priya V.",
        role: "student",
        bio: "Math lover and aspiring engineer. Solving problems one integral at a time.",
        joinDate: "Jan 2024",
        interests: ["Calculus", "Algebra", "Robotics"]
    }
};

const INITIAL_QUESTIONS: Question[] = [
    {
        id: 1,
        author: "Rahul S.",
        role: "student",
        title: "Understanding Quantum Entanglement?",
        desc: "I'm struggling to visualize how two particles remain connected over large distances. Can anyone explain this simply?",
        tags: ["Physics", "Quantum", "Help"],
        upvotes: 12,
        time: "2h ago",
        replies: [
            { id: 101, author: "Dr. A. Verma", role: "teacher", text: "Think of it like a pair of gloves in two different boxes. If you open one box and find a left glove, you instantly know the other is right, no matter how far away it is.", time: "1h ago" }
        ]
    },
    {
        id: 2,
        author: "Priya V.",
        role: "student",
        title: "Best resources for Calculus integration?",
        desc: "Need practice problems for definite integrals. Any recommendations?",
        tags: ["Math", "Calculus"],
        upvotes: 5,
        time: "5h ago",
        replies: []
    }
];

const STORAGE_KEY = 'gyansetu_community_data';
const PROFILE_KEY = 'gyansetu_profile';

export const CommunityView: React.FC<CommunityViewProps> = ({ isDark, userRole }) => {
    // Initialize state from localStorage
    const [questions, setQuestions] = useState<Question[]>(() => {
        try {
            const savedData = localStorage.getItem(STORAGE_KEY);
            return savedData ? JSON.parse(savedData) : INITIAL_QUESTIONS;
        } catch (error) {
            return INITIAL_QUESTIONS;
        }
    });

    const [newQuestionTitle, setNewQuestionTitle] = useState("");
    const [newQuestionDesc, setNewQuestionDesc] = useState("");
    const [replyText, setReplyText] = useState<{ [key: number]: string }>({});
    const [showAskForm, setShowAskForm] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    
    // User Modal State
    const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

    // Get current user profile
    const getCurrentProfile = (): UserProfile => {
        const saved = localStorage.getItem(PROFILE_KEY);
        if (saved) return JSON.parse(saved);
        return {
            name: userRole === 'teacher' ? 'Instructor' : 'Student',
            role: userRole || 'student',
            bio: 'No bio available.',
            joinDate: 'Just now',
            interests: []
        };
    };

    const currentUser = getCurrentProfile();

    // Persist questions
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(questions));
    }, [questions]);

    const handlePostQuestion = () => {
        if (!newQuestionTitle.trim() || !newQuestionDesc.trim()) return;
        
        const newQ: Question = {
            id: Date.now(),
            author: currentUser.name, 
            role: userRole || 'student',
            title: newQuestionTitle,
            desc: newQuestionDesc,
            tags: ["General"],
            upvotes: 0,
            replies: [],
            time: "Just now"
        };
        
        setQuestions(prevQuestions => [newQ, ...prevQuestions]);
        setNewQuestionTitle("");
        setNewQuestionDesc("");
        setShowAskForm(false);
    };

    const handlePostReply = (qId: number) => {
        if (!replyText[qId]?.trim()) return;

        setQuestions(prevQuestions => prevQuestions.map(q => {
            if (q.id === qId) {
                return {
                    ...q,
                    replies: [...q.replies, {
                        id: Date.now(),
                        author: currentUser.name,
                        role: userRole || 'student',
                        text: replyText[qId],
                        time: "Just now"
                    }]
                };
            }
            return q;
        }));
        setReplyText({ ...replyText, [qId]: "" });
    };

    const handleVote = (qId: number, delta: number) => {
        setQuestions(prev => prev.map(q => 
            q.id === qId ? { ...q, upvotes: q.upvotes + delta } : q
        ));
    };

    const handleUserClick = (name: string) => {
        if (name === currentUser.name) {
            setSelectedUser(currentUser);
            return;
        }
        if (MOCK_PROFILES[name]) {
            setSelectedUser(MOCK_PROFILES[name]);
            return;
        }
        setSelectedUser({
            name: name,
            role: 'student',
            bio: "Profile details not available.",
            joinDate: "Unknown",
            interests: []
        });
    };

    const filteredQuestions = questions.filter(q => 
        q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="animate-fade max-w-5xl mx-auto pb-20 relative">
            
            {/* User Profile Modal */}
            {selectedUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade" onClick={() => setSelectedUser(null)}>
                    <div 
                        className={`w-full max-w-md p-8 rounded-2xl relative shadow-2xl ${isDark ? 'bg-gray-900 border border-f-neon/50' : 'bg-white border border-h-accent'}`} 
                        onClick={e => e.stopPropagation()}
                    >
                        <button 
                            onClick={() => setSelectedUser(null)}
                            className="absolute top-4 right-4 opacity-60 hover:opacity-100"
                        >
                            <iconify-icon icon="solar:close-circle-bold" className="text-2xl"></iconify-icon>
                        </button>

                        <div className="flex flex-col items-center text-center">
                            <div className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold mb-4 ${selectedUser.role === 'teacher' ? 'bg-f-purple text-white shadow-[0_0_15px_rgba(189,0,255,0.4)]' : (isDark ? 'bg-f-neon text-black' : 'bg-h-accent text-white')}`}>
                                {selectedUser.name.charAt(0)}
                            </div>
                            <h3 className={`text-2xl font-bold mb-1 ${isDark ? 'text-white' : 'text-h-ink'}`}>{selectedUser.name}</h3>
                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest mb-4 ${selectedUser.role === 'teacher' ? 'bg-f-purple text-white' : (isDark ? 'bg-white/10 text-white' : 'bg-black/10 text-black')}`}>
                                {selectedUser.role}
                            </span>
                            
                            <p className="text-sm opacity-70 leading-relaxed mb-6">"{selectedUser.bio}"</p>
                            
                            <div className="w-full border-t border-b border-gray-500/20 py-4 mb-4 grid grid-cols-2 gap-4">
                                <div>
                                    <span className="block text-[10px] uppercase opacity-50">Joined</span>
                                    <span className="font-bold text-sm">{selectedUser.joinDate}</span>
                                </div>
                                <div>
                                    <span className="block text-[10px] uppercase opacity-50">Reputation</span>
                                    <span className="font-bold text-sm flex items-center justify-center gap-1">
                                        <iconify-icon icon="solar:star-bold" className="text-yellow-500"></iconify-icon>
                                        High
                                    </span>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2 justify-center">
                                {selectedUser.interests.map((tag, i) => (
                                    <span key={i} className={`text-[10px] px-2 py-1 rounded border opacity-60 ${isDark ? 'border-gray-700' : 'border-gray-300'}`}>#{tag}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Header Action */}
            <div className="flex flex-wrap justify-between items-center mb-8 gap-4">
                <div>
                    <h2 className={`text-3xl font-bold ${isDark ? 'font-future text-white' : 'font-heritage text-h-ink'}`}>Global Forum</h2>
                    <p className="opacity-60 text-sm mt-1">Ask questions, share wisdom, and grow together.</p>
                </div>
                <div className="flex gap-4 items-center w-full md:w-auto">
                    {/* Search Bar */}
                    <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border flex-1 md:w-64 ${isDark ? 'border-gray-700 bg-black/20 focus-within:border-f-neon' : 'border-gray-300 bg-white/50 focus-within:border-h-accent'}`}>
                        <iconify-icon icon="solar:magnifer-bold" className="opacity-50"></iconify-icon>
                        <input 
                            type="text" 
                            placeholder="Search questions..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-transparent outline-none text-sm w-full"
                        />
                    </div>

                    <button 
                        onClick={() => setShowAskForm(!showAskForm)}
                        className={`px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-xs transition-all flex items-center gap-2 shrink-0
                        ${isDark ? 'bg-f-neon text-black hover:shadow-[0_0_15px_#00F0FF]' : 'bg-h-accent text-white hover:bg-h-accent/90'}`}
                    >
                        <iconify-icon icon={showAskForm ? "solar:close-circle-bold" : "solar:pen-new-square-bold"} className="text-lg"></iconify-icon>
                        <span className="hidden md:inline">{showAskForm ? "Cancel" : "Ask"}</span>
                    </button>
                </div>
            </div>

            {/* Ask Form */}
            {showAskForm && (
                <div className={`p-6 rounded-2xl mb-8 animate-fade ${isDark ? 'glass-panel border-f-neon/30' : 'paper-panel border-h-accent/30'}`}>
                    <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-f-neon' : 'text-h-accent'}`}>Draft your Query</h3>
                    <input 
                        type="text" 
                        placeholder="Title: What's on your mind?" 
                        value={newQuestionTitle}
                        onChange={(e) => setNewQuestionTitle(e.target.value)}
                        className={`w-full p-4 rounded-xl mb-4 bg-transparent border ${isDark ? 'border-gray-700 focus:border-f-neon' : 'border-gray-300 focus:border-h-accent'} outline-none transition-colors`}
                    />
                    <textarea 
                        placeholder="Describe your question in detail..." 
                        value={newQuestionDesc}
                        onChange={(e) => setNewQuestionDesc(e.target.value)}
                        className={`w-full p-4 h-32 rounded-xl mb-4 bg-transparent border ${isDark ? 'border-gray-700 focus:border-f-neon' : 'border-gray-300 focus:border-h-accent'} outline-none transition-colors resize-none`}
                    ></textarea>
                    <div className="flex justify-end">
                        <button 
                            onClick={handlePostQuestion}
                            className={`px-8 py-3 rounded-xl font-bold uppercase tracking-widest text-xs
                            ${isDark ? 'bg-f-purple text-white' : 'bg-h-gold text-white'}`}
                        >
                            Post Question
                        </button>
                    </div>
                </div>
            )}

            {/* Feed */}
            <div className="space-y-6">
                {filteredQuestions.length === 0 && (
                    <div className="text-center py-20 opacity-50">
                        <iconify-icon icon="solar:confounded-square-bold" className="text-4xl mb-2"></iconify-icon>
                        <p>No questions found matching your search.</p>
                    </div>
                )}
                {filteredQuestions.map(q => (
                    <div key={q.id} className={`p-6 md:p-8 rounded-2xl transition-all hover:translate-x-1 overflow-hidden ${isDark ? 'glass-panel' : 'paper-panel'}`}>
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3 min-w-0">
                                <button onClick={() => handleUserClick(q.author)} className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold hover:scale-110 transition-transform ${q.role === 'teacher' ? 'bg-f-purple text-white shadow-[0_0_10px_rgba(189,0,255,0.4)]' : (isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-200 text-gray-600')}`}>
                                    {q.author.charAt(0)}
                                </button>
                                <div className="min-w-0">
                                    <button onClick={() => handleUserClick(q.author)} className={`font-bold text-sm hover:underline truncate flex items-center gap-2 ${isDark ? 'text-white' : 'text-h-ink'}`}>
                                        {q.author}
                                        {q.role === 'teacher' && (
                                            <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wider font-bold border ${isDark ? 'border-f-purple text-f-purple' : 'border-h-gold text-h-gold'}`}>Teacher</span>
                                        )}
                                    </button>
                                    <span className="block text-[10px] opacity-50">{q.time}</span>
                                </div>
                            </div>
                            
                            {/* Voting System */}
                            <div className={`flex flex-col items-center gap-1 p-1 rounded-lg ${isDark ? 'bg-white/5' : 'bg-black/5'}`}>
                                <button onClick={() => handleVote(q.id, 1)} className="hover:text-green-500 transition-colors"><iconify-icon icon="solar:alt-arrow-up-bold"></iconify-icon></button>
                                <span className="text-xs font-bold">{q.upvotes}</span>
                                <button onClick={() => handleVote(q.id, -1)} className="hover:text-red-500 transition-colors"><iconify-icon icon="solar:alt-arrow-down-bold"></iconify-icon></button>
                            </div>
                        </div>

                        <h3 className={`text-xl font-bold mb-2 break-words ${isDark ? 'text-f-neon' : 'text-h-accent'}`}>{q.title}</h3>
                        <p className="opacity-80 leading-relaxed mb-4 text-sm break-words">{q.desc}</p>

                        <div className="flex flex-wrap gap-2 mb-6">
                            {q.tags.map((t, i) => (
                                <span key={i} className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded ${isDark ? 'bg-f-neon/10 text-f-neon' : 'bg-h-accent/10 text-h-accent'}`}>#{t}</span>
                            ))}
                        </div>

                        {/* Replies Section */}
                        <div className={`pl-4 md:pl-8 border-l-2 ${isDark ? 'border-gray-800' : 'border-gray-200'} space-y-4`}>
                            {q.replies.map(r => (
                                <div key={r.id} className={`p-4 rounded-xl ${r.role === 'teacher' ? (isDark ? 'bg-f-purple/10 border border-f-purple/20' : 'bg-h-gold/10 border border-h-gold/20') : (isDark ? 'bg-white/5' : 'bg-black/5')}`}>
                                    <div className="flex justify-between items-start mb-1">
                                        <button onClick={() => handleUserClick(r.author)} className={`text-xs font-bold hover:underline flex items-center gap-2 ${r.role === 'teacher' ? (isDark ? 'text-f-purple' : 'text-h-gold') : ''}`}>
                                            {r.author} 
                                            {r.role === 'teacher' && <iconify-icon icon="solar:verified-check-bold" title="Teacher Verified"></iconify-icon>}
                                        </button>
                                        <span className="text-[10px] opacity-40 shrink-0 ml-2">{r.time}</span>
                                    </div>
                                    <p className="text-sm opacity-80 break-words">{r.text}</p>
                                </div>
                            ))}

                            {/* Add Reply Input */}
                            <div className="flex gap-2 mt-4">
                                <input 
                                    type="text" 
                                    placeholder="Write a reply..." 
                                    value={replyText[q.id] || ""}
                                    onChange={(e) => setReplyText({ ...replyText, [q.id]: e.target.value })}
                                    className={`flex-1 p-3 rounded-xl text-sm bg-transparent border ${isDark ? 'border-gray-700 focus:border-gray-500' : 'border-gray-300 focus:border-gray-500'} outline-none min-w-0`}
                                />
                                <button 
                                    onClick={() => handlePostReply(q.id)}
                                    className={`shrink-0 p-3 rounded-xl flex items-center justify-center transition-colors ${isDark ? 'bg-white/10 hover:bg-f-neon hover:text-black' : 'bg-black/10 hover:bg-h-accent hover:text-white'}`}
                                >
                                    <iconify-icon icon="solar:plain-3-bold"></iconify-icon>
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};