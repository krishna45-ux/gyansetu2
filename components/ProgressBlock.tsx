import React from 'react';

interface ProgressBlockProps {
    title: string;
    progress: number;
    isDark: boolean;
}

export const ProgressBlock: React.FC<ProgressBlockProps> = ({ title, progress, isDark }) => (
    <div className="mb-4">
        <div className="flex justify-between text-xs font-bold mb-1">
            <span>{title}</span>
            <span className={isDark ? 'text-f-neon' : 'text-h-accent'}>{progress}%</span>
        </div>
        <div className={`w-full h-2 rounded-full overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`}>
            <div className={`h-full rounded-full transition-all duration-1000 ${isDark ? 'bg-f-neon shadow-[0_0_10px_#00F0FF]' : 'bg-h-accent'}`} style={{width: `${progress}%`}}></div>
        </div>
    </div>
);