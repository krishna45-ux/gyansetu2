import React from 'react';
import { Language } from '../types';

interface LanguageToggleProps {
    language: Language;
    setLanguage: (lang: Language) => void;
    isDark: boolean;
}

export const LanguageToggle: React.FC<LanguageToggleProps> = ({ language, setLanguage, isDark }) => (
    <div className={`flex rounded-lg border p-1 ${isDark ? 'border-f-neon/50 bg-black/20' : 'border-h-accent/30 bg-white/50'}`}>
        <button 
            onClick={() => setLanguage('en')} 
            className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all
            ${language === 'en' 
                ? (isDark ? 'bg-f-neon text-black' : 'bg-h-accent text-white') 
                : 'opacity-50 hover:opacity-100'}`}
        >
            EN
        </button>
        <button 
            onClick={() => setLanguage('hi')} 
            className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all
            ${language === 'hi' 
                ? (isDark ? 'bg-f-neon text-black' : 'bg-h-accent text-white') 
                : 'opacity-50 hover:opacity-100'}`}
        >
            HI
        </button>
    </div>
);