
import React, { useState } from 'react';
import { ThemeProps, Role, Language } from '../types';
import { ThemeToggle } from '../components/ThemeToggle';
import { LanguageToggle } from '../components/LanguageToggle';
import { translations } from '../utils/translations';
import { apiRequest } from '../services/api';
import { auth, googleProvider, FIREBASE_CONFIGURED } from '../firebase';
import { signInWithPopup } from 'firebase/auth';

interface AuthSystemProps extends ThemeProps {
    onAuth: (role: Role, email: string) => void;
    onBack: () => void;
    language: Language;
    setLanguage: (lang: Language) => void;
}

export const AuthSystem: React.FC<AuthSystemProps> = ({ onAuth, isDark, toggleTheme, onBack, language, setLanguage }) => {
    const [role, setRole] = useState<Role>('student');
    const [isLogin, setIsLogin] = useState(true);

    // Auth State
    const [email, setEmail] = useState("");
    const [institution, setInstitution] = useState("");
    const [password, setPassword] = useState("");

    // Verification State
    const [verificationStep, setVerificationStep] = useState<'details' | 'otp'>('details');
    const [generatedOtp, setGeneratedOtp] = useState<string>("");
    const [userOtp, setUserOtp] = useState("");

    // Status State
    const [error, setError] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    // Simulation State
    const [simulatedEmail, setSimulatedEmail] = useState<{ code: string, visible: boolean } | null>(null);

    const t = translations[language];

    const handleSendCode = () => {
        setError(null);
        if (!email || !password || (!isLogin && !institution)) {
            setError("Please fill in all fields.");
            return;
        }

        setIsProcessing(true);

        // Simulating Domain Verification
        setTimeout(() => {
            const code = Math.floor(100000 + Math.random() * 900000).toString();
            setGeneratedOtp(code);

            // Show Email Simulation
            setSimulatedEmail({ code, visible: true });
            setTimeout(() => {
                setSimulatedEmail(prev => prev ? { ...prev, visible: false } : null);
            }, 10000);

            setIsProcessing(false);
            setVerificationStep('otp');
        }, 1500);
    };

    const handleVerifyAndRegister = async () => {
        setError(null);
        if (userOtp !== generatedOtp) {
            setError(t.wrongCode);
            return;
        }

        setIsProcessing(true);

        try {
            // MONGODB API REGISTRATION
            await apiRequest('/auth/register', 'POST', {
                email,
                password,
                full_name: email.split('@')[0],
                role,
                institution
            });

            // Auto Login after register
            const loginData = new URLSearchParams();
            loginData.append('username', email);
            loginData.append('password', password);

            const response = await apiRequest('/auth/login', 'POST', loginData, true);

            // Save Token
            localStorage.setItem('gyansetu_token', response.access_token);

            setIsProcessing(false);
            onAuth(role, email);

        } catch (err: any) {
            setIsProcessing(false);
            console.error(err);
            setError(err.message || "Registration Failed.");
        }
    };

    const handleLogin = async () => {
        setError(null);
        if (!email || !password) {
            setError("Please fill in all fields.");
            return;
        }
        setIsProcessing(true);

        try {
            // MONGODB API LOGIN
            // OAuth2PasswordRequestForm expects form data
            const formData = new URLSearchParams();
            formData.append('username', email);
            formData.append('password', password);

            const response = await apiRequest('/auth/login', 'POST', formData, true);

            if (response.access_token) {
                // Store JWT
                localStorage.setItem('gyansetu_token', response.access_token);

                // Fetch User Details to get Role
                const profile = await apiRequest('/auth/me', 'GET');

                setIsProcessing(false);
                onAuth(profile.role as Role, profile.email);
            } else {
                throw new Error("No access token received");
            }

        } catch (err: any) {
            setIsProcessing(false);
            console.error(err);
            setError("Invalid email or password.");
        }
    };

    const resetFlow = () => {
        setIsLogin(!isLogin);
        setError(null);
        setVerificationStep('details');
        setGeneratedOtp("");
        setUserOtp("");
        setPassword("");
        setInstitution("");
        setSimulatedEmail(null);
    };

    const handleGoogleSignIn = async () => {
        if (!FIREBASE_CONFIGURED || !auth || !googleProvider) {
            setError("Google Sign-In is not configured yet. Please use email/password.");
            return;
        }
        setError(null);
        setIsProcessing(true);
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const idToken = await result.user.getIdToken();

            // Send Firebase token to our FastAPI backend
            const response = await apiRequest('/auth/google', 'POST', {
                id_token: idToken,
                role,
            });

            localStorage.setItem('gyansetu_token', response.access_token);
            if (response.refresh_token) {
                localStorage.setItem('gyansetu_refresh_token', response.refresh_token);
            }

            // Fetch profile to get confirmed role
            const profile = await apiRequest('/auth/me', 'GET');
            setIsProcessing(false);
            onAuth(profile.role as Role, profile.email);
        } catch (err: any) {
            setIsProcessing(false);
            setError(err.message || "Google Sign-In failed. Please try again.");
        }
    };

    return (
        <div className={`min-h-screen flex flex-col items-center justify-center p-6 transition-all duration-500 ${isDark ? 'bg-grid-pattern' : 'bg-paper-texture'}`}>

            {/* --- SIMULATED EMAIL NOTIFICATION --- */}
            {simulatedEmail && (
                <div className={`fixed top-4 right-4 max-w-sm w-full p-4 rounded-xl shadow-2xl z-[100] transition-all duration-500 transform ${simulatedEmail.visible ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0 pointer-events-none'} 
                    ${isDark ? 'bg-gray-800 border-l-4 border-f-neon text-white' : 'bg-white border-l-4 border-h-accent text-gray-800'}`}>
                    <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-full ${isDark ? 'bg-f-neon/20 text-f-neon' : 'bg-h-accent/10 text-h-accent'}`}>
                            <iconify-icon icon="solar:letter-unread-bold" className="text-xl"></iconify-icon>
                        </div>
                        <div>
                            <h4 className="text-sm font-bold">New Email: noreply@gyansetu.edu</h4>
                            <p className="text-xs opacity-70 mt-1">Your verification code is:</p>
                            <p className="text-2xl font-mono font-bold mt-1 tracking-widest select-all">{simulatedEmail.code}</p>
                            <p className="text-[10px] opacity-50 mt-2 italic">(This is a simulation. In production, check your inbox.)</p>
                        </div>
                        <button onClick={() => setSimulatedEmail(null)} className="opacity-50 hover:opacity-100">
                            <iconify-icon icon="solar:close-circle-bold"></iconify-icon>
                        </button>
                    </div>
                </div>
            )}

            <div className="absolute top-8 left-8">
                <button onClick={onBack} className="flex items-center gap-2 opacity-60 hover:opacity-100 transition-all">
                    <iconify-icon icon="solar:arrow-left-bold"></iconify-icon>
                    <span className="text-xs font-bold uppercase tracking-widest">{t.back}</span>
                </button>
            </div>
            <div className="absolute top-8 right-8 flex items-center gap-4">
                <LanguageToggle language={language} setLanguage={setLanguage} isDark={isDark} />
                <ThemeToggle isDark={isDark} toggleTheme={toggleTheme} language={language} />
            </div>

            <div className={`w-full max-w-md p-8 md:p-10 rounded-3xl animate-fade relative overflow-hidden transition-all duration-500 ${isDark ? 'glass-panel shadow-[0_0_40px_rgba(0,0,0,0.5)]' : 'paper-panel shadow-2xl'}`}>

                {/* Processing Overlay */}
                {isProcessing && (
                    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm animate-fade">
                        <iconify-icon icon="solar:shield-check-bold" className={`text-6xl mb-4 animate-bounce ${isDark ? 'text-f-neon' : 'text-h-accent'}`}></iconify-icon>
                        <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-white'}`}>{isLogin ? 'Logging in...' : (verificationStep === 'details' ? t.verifying : 'Verifying Code...')}</h3>
                    </div>
                )}

                <div className="mb-8 text-center">
                    <h2 className={`text-3xl md:text-4xl font-bold mb-2 ${isDark ? 'font-future text-f-neon' : 'font-heritage text-h-accent'}`}>
                        {isLogin ? t.welcomeBack : t.joinBridge}
                    </h2>
                    <p className="opacity-60 text-sm">{t.accessPortal}</p>
                </div>

                {verificationStep === 'details' && !isLogin && (
                    <div className={`flex p-1.5 rounded-xl mb-8 transition-colors ${isDark ? 'bg-black/40' : 'bg-black/5'}`}>
                        <button
                            onClick={() => setRole('student')}
                            className={`flex-1 py-3 rounded-lg text-xs font-bold uppercase tracking-widest transition-all duration-300
                            ${role === 'student'
                                    ? (isDark ? 'bg-f-neon text-black shadow-[0_0_10px_#00F0FF]' : 'bg-h-accent text-white shadow-md')
                                    : 'opacity-50 hover:opacity-100 hover:bg-white/5'}`}
                        >
                            {t.student}
                        </button>
                        <button
                            onClick={() => setRole('teacher')}
                            className={`flex-1 py-3 rounded-lg text-xs font-bold uppercase tracking-widest transition-all duration-300
                            ${role === 'teacher'
                                    ? (isDark ? 'bg-f-neon text-black shadow-[0_0_10px_#00F0FF]' : 'bg-h-accent text-white shadow-md')
                                    : 'opacity-50 hover:opacity-100 hover:bg-white/5'}`}
                        >
                            {t.teacher}
                        </button>
                    </div>
                )}

                <div className="space-y-5">
                    {/* STEP 1: Details Input */}
                    {verificationStep === 'details' && (
                        <div className="space-y-5 animate-fade">
                            {!isLogin && (
                                <div className="group relative">
                                    <input
                                        type="text"
                                        placeholder={t.institutionPlaceholder}
                                        value={institution}
                                        onChange={(e) => setInstitution(e.target.value)}
                                        className={`w-full p-4 rounded-xl bg-transparent border-2 outline-none transition-all duration-300 
                                            ${isDark
                                                ? 'border-gray-800 focus:border-f-neon focus:bg-white/5 focus:shadow-[0_0_15px_rgba(0,240,255,0.1)] text-white placeholder-gray-600'
                                                : 'border-gray-300 focus:border-h-accent focus:bg-white focus:shadow-md text-h-ink placeholder-gray-400'
                                            } focus:scale-[1.02]`}
                                    />
                                </div>
                            )}

                            <div className="group relative">
                                <input
                                    type="email"
                                    placeholder={t.emailPlaceholder}
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className={`w-full p-4 rounded-xl bg-transparent border-2 outline-none transition-all duration-300 
                                        ${isDark
                                            ? 'border-gray-800 focus:border-f-neon focus:bg-white/5 focus:shadow-[0_0_15px_rgba(0,240,255,0.1)] text-white placeholder-gray-600'
                                            : 'border-gray-300 focus:border-h-accent focus:bg-white focus:shadow-md text-h-ink placeholder-gray-400'
                                        } focus:scale-[1.02]`}
                                />
                            </div>

                            <div className="group relative">
                                <input
                                    type="password"
                                    placeholder={t.passPlaceholder}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className={`w-full p-4 rounded-xl bg-transparent border-2 outline-none transition-all duration-300 
                                        ${isDark
                                            ? 'border-gray-800 focus:border-f-neon focus:bg-white/5 focus:shadow-[0_0_15px_rgba(0,240,255,0.1)] text-white placeholder-gray-600'
                                            : 'border-gray-300 focus:border-h-accent focus:bg-white focus:shadow-md text-h-ink placeholder-gray-400'
                                        } focus:scale-[1.02]`}
                                />
                                {isLogin && (
                                    <div className="flex justify-end mt-2">
                                        <button className={`text-xs font-bold hover:underline opacity-60 hover:opacity-100 transition-opacity ${isDark ? 'text-f-neon' : 'text-h-accent'}`}>
                                            {t.forgotPassword}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* STEP 2: OTP Input */}
                    {!isLogin && verificationStep === 'otp' && (
                        <div className="space-y-6 animate-fade text-center py-4">
                            <div className={`p-4 rounded-xl text-sm border ${isDark ? 'bg-f-neon/10 text-f-neon border-f-neon/20' : 'bg-h-accent/10 text-h-accent border-h-accent/20'}`}>
                                {t.codeSentMsg} <br />
                                <span className="font-bold text-lg">{email}</span>
                            </div>
                            <input
                                type="text"
                                placeholder={t.otpPlaceholder}
                                value={userOtp}
                                onChange={(e) => setUserOtp(e.target.value)}
                                maxLength={6}
                                className={`w-full p-4 text-center text-3xl tracking-[0.5em] font-mono rounded-xl bg-transparent border-2 outline-none transition-all duration-300 
                                    ${isDark
                                        ? 'border-gray-800 focus:border-f-neon focus:bg-white/5 text-white'
                                        : 'border-gray-300 focus:border-h-accent text-black'
                                    } focus:scale-105 shadow-inner`}
                            />
                        </div>
                    )}

                    {error && (
                        <div className="flex items-center gap-2 text-red-500 text-xs font-bold animate-pulse bg-red-500/10 p-3 rounded-xl border border-red-500/20">
                            <iconify-icon icon="solar:danger-circle-bold" className="text-lg"></iconify-icon>
                            {error}
                        </div>
                    )}

                    {/* Action Buttons */}
                    {isLogin ? (
                        <button
                            onClick={handleLogin}
                            disabled={isProcessing}
                            className={`w-full py-4 rounded-xl font-bold uppercase tracking-widest mt-4 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg disabled:opacity-50 disabled:cursor-wait
                            ${isDark ? 'bg-f-neon text-black shadow-f-neon/20 hover:shadow-f-neon/40' : 'bg-h-accent text-white hover:bg-h-accent/90'}`}
                        >
                            {t.enterPortal}
                        </button>
                    ) : (
                        verificationStep === 'details' ? (
                            <button
                                onClick={handleSendCode}
                                disabled={isProcessing}
                                className={`w-full py-4 rounded-xl font-bold uppercase tracking-widest mt-4 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg disabled:opacity-50 disabled:cursor-wait
                                ${isDark ? 'bg-f-neon text-black shadow-f-neon/20 hover:shadow-f-neon/40' : 'bg-h-accent text-white hover:bg-h-accent/90'}`}
                            >
                                {isProcessing ? t.sending : t.sendCode}
                            </button>
                        ) : (
                            <div className="space-y-3">
                                <button
                                    onClick={handleVerifyAndRegister}
                                    disabled={isProcessing}
                                    className={`w-full py-4 rounded-xl font-bold uppercase tracking-widest mt-4 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg disabled:opacity-50 disabled:cursor-wait
                                    ${isDark ? 'bg-f-neon text-black shadow-f-neon/20 hover:shadow-f-neon/40' : 'bg-h-accent text-white hover:bg-h-accent/90'}`}
                                >
                                    {t.createAccount}
                                </button>
                                <button onClick={() => setVerificationStep('details')} className="text-xs opacity-60 hover:opacity-100 hover:underline">
                                    Change Email or Resend
                                </button>
                            </div>
                        )
                    )}
                </div>

                {/* ── Google Sign-In ── */}
                {(isLogin || verificationStep === 'details') && (
                    <div className="mt-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className={`flex-1 h-px ${isDark ? 'bg-gray-700' : 'bg-gray-300'}`} />
                            <span className="text-xs opacity-40 font-bold uppercase tracking-widest">or</span>
                            <div className={`flex-1 h-px ${isDark ? 'bg-gray-700' : 'bg-gray-300'}`} />
                        </div>
                        <button
                            onClick={handleGoogleSignIn}
                            disabled={isProcessing}
                            className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-3 border transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-wait
                            ${isDark
                                    ? 'bg-white/5 border-gray-700 text-white hover:bg-white/10 hover:border-gray-600'
                                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 shadow-sm hover:shadow-md'
                                }`}
                        >
                            <svg width="18" height="18" viewBox="0 0 48 48">
                                <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.7 33.3 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1L37.5 9.5C34 6.3 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.6-7.9 19.6-20 0-1.3-.2-2.7-.4-4z" />
                                <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 16 19 13 24 13c3.1 0 5.8 1.2 7.9 3.1L37.5 9.5C34 6.3 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
                                <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.4-5.1l-6.2-5.2C29.3 35.3 26.8 36 24 36c-5.2 0-9.7-3.4-11.3-8H6.3C9.7 35.7 16.3 44 24 44z" />
                                <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.8 2.3-2.2 4.2-4.1 5.6l6.2 5.2C40.9 35.6 44 30.3 44 24c0-1.3-.2-2.7-.4-4z" />
                            </svg>
                            Continue with Google
                        </button>
                    </div>
                )}

                <p className="text-center mt-6 text-xs opacity-60">
                    {isLogin ? t.noAccount : t.hasAccount}
                    <button
                        onClick={resetFlow}
                        className={`ml-2 font-bold underline transition-colors hover:scale-105 inline-block ${isDark ? 'text-f-neon hover:text-white' : 'text-h-accent hover:text-black'}`}
                    >
                        {isLogin ? t.signUp : t.login}
                    </button>
                </p>
            </div>
        </div>
    );
};
