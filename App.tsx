
import React, { useState, useEffect } from 'react';
import { ThemeToggle } from './components/ThemeToggle';
import { LanguageToggle } from './components/LanguageToggle';
import { LandingPage } from './views/LandingPage';
import { AuthSystem } from './views/AuthSystem';
import { StudentDashboard } from './views/StudentDashboard';
import { TeacherDashboard } from './views/TeacherDashboard';
import { CareerPathView } from './views/CareerPathView';
import { SettingsView } from './views/SettingsView';
import { DailyGrowthView } from './views/DailyGrowthView';
import { CurriculumView } from './views/CurriculumView';
import { Role, ViewState, Language } from './types';
import { translations } from './utils/translations';
import { apiRequest } from './services/api';

const App: React.FC = () => {
    // Initial State Logic
    const [isDark, setIsDark] = useState<boolean>(() => {
        const savedTheme = localStorage.getItem('gyansetu_theme');
        return savedTheme ? savedTheme === 'dark' : true;
    });

    const [language, setLanguage] = useState<Language>(() => {
        const savedLang = localStorage.getItem('gyansetu_lang');
        return (savedLang === 'hi' ? 'hi' : 'en') as Language;
    });

    // Authentication State
    const [userRole, setUserRole] = useState<Role | null>(() => {
        return localStorage.getItem('gyansetu_role') as Role | null;
    });
    
    // CURRENT USER EMAIL - This is the key to user-specific data
    const [userEmail, setUserEmail] = useState<string | null>(() => {
        return localStorage.getItem('gyansetu_current_email');
    });

    // Determine initial view based on authentication
    const [view, setView] = useState<ViewState>(() => {
        const savedRole = localStorage.getItem('gyansetu_role');
        const savedEmail = localStorage.getItem('gyansetu_current_email');
        if (savedRole && savedEmail) {
            return savedRole === 'student' ? 'student_dashboard' : 'teacher_dashboard';
        }
        return 'landing';
    });

    // Theme Effect
    useEffect(() => {
        if (isDark) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('gyansetu_theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('gyansetu_theme', 'light');
        }
    }, [isDark]);

    // Language Effect
    useEffect(() => {
        localStorage.setItem('gyansetu_lang', language);
    }, [language]);

    // --- SESSION CHECK ---
    useEffect(() => {
        const checkSession = async () => {
            const token = localStorage.getItem('gyansetu_token');
            if (token) {
                console.log("Found session token, verifying...");
                try {
                    // Validate token with backend
                    const profile = await apiRequest('/auth/me', 'GET');
                    console.log("Session Verified:", profile.email);
                } catch (e) {
                    console.warn("Session invalid, logging out.");
                    logout();
                }
            } else {
                console.log("No active session.");
            }
        };
        checkSession();
    }, []);

    // Role Logic
    const handleAuth = (role: Role, email: string) => {
        localStorage.setItem('gyansetu_role', role);
        localStorage.setItem('gyansetu_current_email', email); // Persist session
        setUserRole(role);
        setUserEmail(email);
        setView(role === 'student' ? 'student_dashboard' : 'teacher_dashboard');
    };

    const logout = () => {
        localStorage.removeItem('gyansetu_role');
        localStorage.removeItem('gyansetu_current_email');
        localStorage.removeItem('gyansetu_token');
        setUserRole(null);
        setUserEmail(null);
        setView('landing');
    };

    const toggleTheme = () => setIsDark(!isDark);
    
    const t = translations[language];

    // Navigation Items Config
    const navItems = userRole === 'student' ? [
        { id: 'student_dashboard', icon: 'solar:widget-5-bold', label: t.dashboard },
        { id: 'curriculum', icon: 'solar:book-bookmark-bold', label: t.curriculum },
        { id: 'daily_growth', icon: 'solar:leaf-bold', label: t.dailyGrowth },
        { id: 'career_path', icon: 'solar:map-point-wave-bold', label: t.careerPath },
        { id: 'settings', icon: 'solar:settings-bold', label: t.settings },
    ] : [
        { id: 'teacher_dashboard', icon: 'solar:widget-5-bold', label: t.dashboard },
        { id: 'curriculum', icon: 'solar:book-bookmark-bold', label: t.curriculum },
        { id: 'settings', icon: 'solar:settings-bold', label: t.settings },
    ];

    // Conditional Rendering for Layout-less views
    if (view === 'landing') return (
        <LandingPage 
            onStart={() => setView('auth')} 
            isDark={isDark} 
            toggleTheme={toggleTheme} 
            language={language}
            setLanguage={setLanguage}
        />
    );
    if (view === 'auth') return (
        <AuthSystem 
            onAuth={handleAuth} 
            isDark={isDark} 
            toggleTheme={toggleTheme} 
            onBack={() => setView('landing')} 
            language={language}
            setLanguage={setLanguage}
        />
    );

    // Main App Layout
    return (
        <div className={`flex h-screen w-screen overflow-hidden ${isDark ? 'bg-grid-pattern' : 'bg-paper-texture'}`}>
            {/* SIDEBAR (Desktop/Tablet) */}
            <aside className={`hidden md:flex w-20 lg:w-64 border-r flex-col transition-all duration-300 z-50 ${isDark ? 'border-gray-800 bg-f-base/90' : 'border-h-accent/20 bg-h-base'}`}>
                <div className="h-20 flex items-center justify-center lg:justify-start lg:px-6 gap-3 border-b border-opacity-10 border-gray-500">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl font-bold ${isDark ? 'bg-f-neon text-black shadow-[0_0_15px_#00F0FF]' : 'bg-h-accent text-white shadow-md'}`}>G</div>
                    <h1 className={`hidden lg:block text-sm font-bold tracking-widest ${isDark ? 'font-future text-f-neon' : 'font-heritage text-h-accent'}`}>GYANSETU</h1>
                </div>
                <nav className="flex-1 py-8 px-3 space-y-2">
                    {navItems.map(item => (
                        <button 
                            key={item.id} 
                            onClick={() => setView(item.id as ViewState)} 
                            className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all ${view === item.id ? (isDark ? 'bg-f-neon/10 text-f-neon' : 'bg-h-accent text-white') : 'opacity-60 hover:opacity-100 hover:bg-gray-500/10'}`}
                        >
                            <iconify-icon icon={item.icon} className="text-2xl"></iconify-icon>
                            <span className="hidden lg:block font-bold text-xs uppercase tracking-widest">{item.label}</span>
                        </button>
                    ))}
                </nav>
                <div className="p-4 border-t border-opacity-10 border-gray-500">
                    <button onClick={logout} className="w-full py-3 flex items-center justify-center gap-3 font-bold uppercase text-[10px] opacity-60 hover:opacity-100 transition-all">
                        <iconify-icon icon="solar:logout-bold"></iconify-icon>
                        <span className="hidden lg:inline">{t.logout}</span>
                    </button>
                </div>
            </aside>

            {/* CONTENT AREA */}
            <main className="flex-1 flex flex-col overflow-hidden relative">
                <header className={`h-16 md:h-20 flex items-center justify-between px-4 md:px-8 border-b border-opacity-10 border-gray-500 ${isDark ? 'bg-f-base/80' : 'bg-h-paper/80'} backdrop-blur-md z-20`}>
                    <h2 className={`text-lg md:text-xl font-bold uppercase tracking-widest ${isDark ? 'text-white font-future' : 'text-h-ink font-heritage'}`}>{view.replace('_', ' ')}</h2>
                    <div className="flex items-center gap-3 md:gap-6">
                        <LanguageToggle language={language} setLanguage={setLanguage} isDark={isDark} />
                        <ThemeToggle isDark={isDark} toggleTheme={toggleTheme} language={language} />
                        <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full border-2 overflow-hidden transition-all duration-300 ${isDark ? 'border-f-neon shadow-[0_0_10px_#00F0FF]' : 'border-h-accent shadow-md'}`}>
                            <div className={`w-full h-full flex items-center justify-center text-lg font-bold ${isDark ? 'bg-gray-800 text-white' : 'bg-h-accent text-white'}`}>
                                {userEmail ? userEmail.charAt(0).toUpperCase() : 'U'}
                            </div>
                        </div>
                    </div>
                </header>
                
                {/* Scrollable View Area - Added bottom padding for mobile nav */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-10 transition-all duration-500 pb-24 md:pb-10">
                    {/* WE PASS THE USER EMAIL AS A PROP TO ENSURE DATA IS SCOPED TO THE USER */}
                    {view === 'student_dashboard' && <StudentDashboard isDark={isDark} lang={language} onNavigate={setView} userEmail={userEmail || 'guest'} />}
                    {view === 'teacher_dashboard' && <TeacherDashboard isDark={isDark} lang={language} userEmail={userEmail || 'guest'} />}
                    {view === 'career_path' && <CareerPathView isDark={isDark} lang={language} onNavigate={setView} userEmail={userEmail || 'guest'} />}
                    {view === 'settings' && <SettingsView isDark={isDark} role={userRole} lang={language} userEmail={userEmail || 'guest'} />}
                    {view === 'daily_growth' && <DailyGrowthView isDark={isDark} lang={language} />} 
                    {view === 'curriculum' && <CurriculumView isDark={isDark} lang={language} userEmail={userEmail || 'guest'} />}
                </div>

                {/* BOTTOM NAVIGATION (Mobile Only) */}
                <nav className={`md:hidden absolute bottom-0 left-0 right-0 h-20 border-t flex justify-around items-center px-2 pb-2 z-50 transition-colors duration-300 ${isDark ? 'bg-f-base/95 border-gray-800 backdrop-blur-md' : 'bg-h-base/95 border-h-accent/20 backdrop-blur-md'}`}>
                     {navItems.map(item => (
                        <button 
                            key={item.id} 
                            onClick={() => setView(item.id as ViewState)} 
                            className={`flex flex-col items-center justify-center gap-1 p-2 rounded-xl transition-all ${view === item.id ? (isDark ? 'text-f-neon' : 'text-h-accent font-bold') : 'opacity-60'}`}
                        >
                            <iconify-icon icon={item.icon} className="text-2xl"></iconify-icon>
                            <span className="text-[9px] font-bold uppercase tracking-widest scale-90">{item.label.split(' ')[0]}</span>
                        </button>
                    ))}
                     <button onClick={logout} className="flex flex-col items-center justify-center gap-1 p-2 opacity-50 text-red-400">
                        <iconify-icon icon="solar:logout-bold-duotone" className="text-2xl"></iconify-icon>
                         <span className="text-[9px] font-bold uppercase tracking-widest scale-90">Exit</span>
                    </button>
                </nav>
            </main>
        </div>
    );
};

export default App;