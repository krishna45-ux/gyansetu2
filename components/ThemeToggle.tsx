import React from 'react';
import { useAppContext } from '../contexts/AppContext';
import { translations } from '../utils/translations';

export const ThemeToggle: React.FC = () => {
    const { isDark, toggleTheme, language } = useAppContext();
    const t = translations[language];
    return (
        <button 
            onClick={toggleTheme} 
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all duration-300 font-bold uppercase text-[10px] tracking-widest
            ${isDark ? 'border-f-neon text-f-neon hover:bg-f-neon hover:text-black shadow-[0_0_15px_rgba(0,240,255,0.3)]' 
                     : 'border-h-accent text-h-accent hover:bg-h-accent hover:text-white shadow-md'}`}
        >
            <iconify-icon icon={isDark ? "solar:sun-2-bold" : "solar:moon-bold"} className="text-base"></iconify-icon>
            <span>{isDark ? t.systemFuture : t.systemPast}</span>
        </button>
    );
};