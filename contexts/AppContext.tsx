import React, { createContext, useContext } from 'react';
import { Role, ViewState, Language } from '../types';

interface AppContextType {
    isDark: boolean;
    toggleTheme: () => void;
    language: Language;
    setLanguage: (lang: Language) => void;
    userRole: Role | null;
    userEmail: string | null;
    view: ViewState;
    setView: (view: ViewState) => void;
    logout: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{
    value: AppContextType;
    children: React.ReactNode;
}> = ({ value, children }) => {
    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
};

export const useAppContext = () => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
};
