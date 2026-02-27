import React from 'react';

interface StatCardProps {
    label: string;
    value: string;
    sub: string;
    icon: string;
    isDark: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, sub, icon, isDark }) => (
    <div className={`p-5 rounded-2xl flex flex-col justify-between h-32 relative overflow-hidden group transition-all duration-300 hover:-translate-y-1 ${isDark ? 'glass-panel' : 'paper-panel'}`}>
        <div className="flex justify-between items-start z-10">
            <span className="text-xs font-bold uppercase tracking-widest opacity-60">{label}</span>
            <iconify-icon icon={icon} className={`text-2xl ${isDark ? 'text-f-neon' : 'text-h-accent'}`}></iconify-icon>
        </div>
        <div className="z-10">
            <div className={`text-2xl font-bold ${isDark ? 'font-mono' : 'font-heritage'}`}>{value}</div>
            <div className="text-[10px] opacity-70 mt-1">{sub}</div>
        </div>
    </div>
);