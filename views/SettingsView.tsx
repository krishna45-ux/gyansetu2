import React, { useState, useEffect } from 'react';
import { Role, UserProfile, Language } from '../types';
import { translations } from '../utils/translations';
import { getUserProfile, updateUserProfile } from '../services/dbService';

interface SettingsViewProps {
    isDark: boolean;
    role: Role | null;
    lang: Language;
    userEmail: string; // Add User Email Prop
}

const SUGGESTED_INTERESTS = ['Physics', 'Mathematics', 'Computer Science', 'History', 'Literature', 'Robotics', 'AI', 'Art', 'Debate', 'Space'];

export const SettingsView: React.FC<SettingsViewProps> = ({ isDark, role, lang, userEmail }) => {
    const [profile, setProfile] = useState<UserProfile>({
        name: '',
        role: role || 'student',
        bio: '',
        joinDate: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        interests: [],
        email: ''
    });

    const [tempInterests, setTempInterests] = useState('');
    const [isSaved, setIsSaved] = useState(false);
    const t = translations[lang];

    useEffect(() => {
        const fetchProfile = async () => {
            const data = await getUserProfile();
            if (data) {
                setProfile(data);
                setTempInterests(data.interests ? data.interests.join(', ') : '');
            } else {
                // Fallback Defaults
                setProfile(prev => ({
                    ...prev,
                    name: userEmail.split('@')[0],
                    role: role || 'student',
                    bio: 'Ready to bridge the gap between wisdom and technology.',
                    interests: role === 'teacher' ? ['Teaching', 'Mentorship'] : ['Physics', 'Math'],
                    email: userEmail
                }));
            }
        };
        fetchProfile();
    }, [role, userEmail]);

    const handleSave = async () => {
        const interestsArray = tempInterests.split(',').map(i => i.trim()).filter(i => i);
        const updatedProfile = { ...profile, interests: interestsArray };
        setProfile(updatedProfile);
        
        await updateUserProfile("", updatedProfile);
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
    };

    const addInterest = (interest: string) => {
        const current = tempInterests.split(',').map(i => i.trim()).filter(i => i);
        if (!current.includes(interest)) {
            const newVal = current.length > 0 ? `${tempInterests}, ${interest}` : interest;
            setTempInterests(newVal);
        }
    };

    return (
        <div className="animate-fade max-w-4xl mx-auto pb-20">
            <div className="mb-10">
                <h2 className={`text-3xl font-bold mb-2 ${isDark ? 'font-future text-white' : 'font-heritage text-h-ink'}`}>{t.profileSettings}</h2>
                <p className="opacity-60 text-sm">{t.manageIdentity}</p>
                <p className="text-xs opacity-40 mt-1 font-mono">ID: {userEmail}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Profile Card Preview */}
                <div className="md:col-span-1">
                    <div className={`p-6 rounded-2xl sticky top-8 text-center ${isDark ? 'glass-panel border-f-neon/30' : 'paper-panel'}`}>
                        <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center text-4xl font-bold mb-4 ${isDark ? 'bg-gray-800 text-f-neon shadow-[0_0_20px_rgba(0,240,255,0.2)]' : 'bg-h-accent text-white'}`}>
                            {profile.name.charAt(0) || 'U'}
                        </div>
                        <h3 className={`text-xl font-bold mb-1 ${isDark ? 'text-white' : 'text-h-ink'}`}>{profile.name}</h3>
                        <div className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest mb-4 ${isDark ? 'bg-f-neon text-black' : 'bg-h-accent/10 text-h-accent'}`}>
                            {profile.role}
                        </div>
                        <p className="text-xs opacity-60 leading-relaxed mb-6 italic">"{profile.bio}"</p>
                        
                        <div className="flex flex-wrap gap-2 justify-center">
                            {profile.interests.map((tag, i) => (
                                <span key={i} className={`text-[10px] px-2 py-1 rounded border opacity-70 ${isDark ? 'border-gray-700' : 'border-gray-300'}`}>#{tag}</span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Edit Form */}
                <div className={`md:col-span-2 p-8 rounded-2xl ${isDark ? 'bg-white/5 border border-white/10' : 'bg-white border border-gray-200'}`}>
                    <div className="space-y-6">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-widest opacity-60 mb-2">{t.fullName}</label>
                            <input 
                                type="text" 
                                value={profile.name}
                                onChange={e => setProfile({...profile, name: e.target.value})}
                                className={`w-full p-4 rounded-xl bg-transparent border ${isDark ? 'border-gray-700 focus:border-f-neon' : 'border-gray-300 focus:border-h-accent'} outline-none transition-colors`}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase tracking-widest opacity-60 mb-2">{t.bio}</label>
                            <textarea 
                                value={profile.bio}
                                onChange={e => setProfile({...profile, bio: e.target.value})}
                                className={`w-full p-4 h-32 rounded-xl bg-transparent border ${isDark ? 'border-gray-700 focus:border-f-neon' : 'border-gray-300 focus:border-h-accent'} outline-none transition-colors resize-none`}
                            ></textarea>
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase tracking-widest opacity-60 mb-2">{t.interests}</label>
                            <input 
                                type="text" 
                                value={tempInterests}
                                onChange={e => setTempInterests(e.target.value)}
                                className={`w-full p-4 rounded-xl bg-transparent border ${isDark ? 'border-gray-700 focus:border-f-neon' : 'border-gray-300 focus:border-h-accent'} outline-none transition-colors mb-3`}
                            />
                            
                            <div className="flex flex-wrap gap-2">
                                <span className="text-[10px] uppercase font-bold opacity-50 mr-2 py-1">Quick Add:</span>
                                {SUGGESTED_INTERESTS.map(interest => (
                                    <button 
                                        key={interest}
                                        onClick={() => addInterest(interest)}
                                        className={`px-2 py-1 rounded text-[10px] border transition-all hover:scale-105 ${isDark ? 'border-gray-700 hover:border-f-neon hover:text-f-neon' : 'border-gray-300 hover:border-h-accent hover:text-h-accent'}`}
                                    >
                                        + {interest}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="pt-4 flex items-center justify-between">
                            <span className={`text-xs font-bold text-green-500 transition-opacity ${isSaved ? 'opacity-100' : 'opacity-0'}`}>
                                <iconify-icon icon="solar:check-circle-bold" className="inline mr-1"></iconify-icon>
                                {t.changesSaved}
                            </span>
                            <button 
                                onClick={handleSave}
                                className={`px-8 py-3 rounded-xl font-bold uppercase tracking-widest text-xs transition-all hover:scale-105
                                ${isDark ? 'bg-f-neon text-black shadow-[0_0_15px_rgba(0,240,255,0.3)]' : 'bg-h-accent text-white shadow-md'}`}
                            >
                                {t.save}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};