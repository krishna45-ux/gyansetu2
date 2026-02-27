import React from 'react';
import { ThemeProps, Language } from '../types';
import { ThemeToggle } from '../components/ThemeToggle';
import { LanguageToggle } from '../components/LanguageToggle';
import { translations } from '../utils/translations';

interface LandingPageProps extends ThemeProps {
    onStart: () => void;
    language: Language;
    setLanguage: (lang: Language) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStart, isDark, toggleTheme, language, setLanguage }) => {
    const t = translations[language];

    return (
        <div className={`min-h-screen flex flex-col transition-all duration-500 ${isDark ? 'bg-grid-pattern' : 'bg-paper-texture'}`}>
            <nav className="h-16 md:h-20 flex items-center justify-between px-4 md:px-8 border-b border-opacity-10 border-gray-500 backdrop-blur-sm z-50">
                <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center text-lg md:text-xl font-bold ${isDark ? 'bg-f-neon text-black' : 'bg-h-accent text-white'}`}>G</div>
                    <h1 className={`text-lg md:text-xl font-bold tracking-widest ${isDark ? 'font-future text-f-neon' : 'font-heritage text-h-accent'}`}>{t.appTitle}</h1>
                </div>
                <div className="flex items-center gap-3 md:gap-4">
                    <LanguageToggle language={language} setLanguage={setLanguage} isDark={isDark} />
                    <ThemeToggle isDark={isDark} toggleTheme={toggleTheme} language={language} />
                    <button onClick={onStart} className={`hidden md:block px-6 py-2 rounded-lg font-bold text-xs uppercase tracking-widest border transition-all ${isDark ? 'border-f-neon text-f-neon hover:bg-f-neon hover:text-black' : 'border-h-accent text-h-accent hover:bg-h-accent hover:text-white'}`}>{t.login}</button>
                </div>
            </nav>

            <main className="flex-1 flex flex-col items-center justify-center text-center px-4 md:px-6 py-12 md:py-20 relative overflow-hidden">
                <div className="z-10 animate-fade">
                    <h2 className={`text-4xl md:text-7xl font-bold mb-4 md:mb-6 max-w-4xl leading-tight ${isDark ? 'font-future text-white' : 'font-heritage text-h-ink'}`}>{t.heroTitle}</h2>
                    <p className="text-sm md:text-lg opacity-70 max-w-2xl mx-auto mb-8 md:mb-10 leading-relaxed">{t.heroDesc}</p>
                    <div className="flex flex-col md:flex-row gap-4 justify-center px-4">
                        <button onClick={onStart} className={`w-full md:w-auto px-8 py-4 rounded-xl font-bold uppercase tracking-widest transition-transform hover:scale-105 shadow-xl ${isDark ? 'bg-f-neon text-black shadow-f-neon/20' : 'bg-h-accent text-white'}`}>{t.getStarted}</button>
                        <button className="w-full md:w-auto px-8 py-4 rounded-xl font-bold uppercase tracking-widest border border-gray-500 opacity-60 hover:opacity-100 transition-all">{t.ourMission}</button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mt-20 md:mt-32 max-w-4xl w-full z-10">
                    {[
                        { title: t.features.ai, icon: "solar:magic-stick-3-bold", desc: t.features.aiDesc },
                        { title: t.features.labs, icon: "solar:atom-bold", desc: t.features.labsDesc }
                    ].map((f, i) => (
                        <div key={i} className={`p-6 md:p-8 rounded-2xl text-left transform transition-all hover:-translate-y-2 ${isDark ? 'glass-panel' : 'paper-panel'}`}>
                            <iconify-icon icon={f.icon} className={`text-4xl mb-4 ${isDark ? 'text-f-neon' : 'text-h-accent'}`}></iconify-icon>
                            <h3 className={`text-xl font-bold mb-2 ${isDark ? 'font-future' : 'font-heritage'}`}>{f.title}</h3>
                            <p className="text-sm opacity-60 leading-relaxed">{f.desc}</p>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
};