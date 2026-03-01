
import React, { useState, useEffect, useRef } from 'react';
import { searchContent, SearchResults } from '../services/dbService';

interface SearchBarProps {
    isDark: boolean;
    onNavigate: (view: string) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ isDark, onNavigate }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResults>({ resources: [], quizzes: [] });
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Debounced search
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (!query || query.trim().length < 2) {
            setResults({ resources: [], quizzes: [] });
            setIsOpen(false);
            return;
        }
        debounceRef.current = setTimeout(async () => {
            setIsLoading(true);
            const data = await searchContent(query);
            setResults(data);
            setIsOpen(true);
            setIsLoading(false);
        }, 300);
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }, [query]);

    // Close on outside click
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const totalResults = results.resources.length + results.quizzes.length;
    const hasResults = totalResults > 0;

    return (
        <div ref={wrapperRef} className="relative hidden md:block w-64">
            {/* Input */}
            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all duration-200
                ${isDark
                    ? 'bg-white/5 border-gray-700 focus-within:border-f-neon focus-within:shadow-[0_0_10px_rgba(0,240,255,0.15)]'
                    : 'bg-black/5 border-gray-300 focus-within:border-h-accent focus-within:shadow-sm'
                }`}
            >
                <iconify-icon
                    icon={isLoading ? 'solar:refresh-circle-bold' : 'solar:magnifer-bold'}
                    className={`text-lg flex-shrink-0 transition-all ${isLoading ? 'animate-spin' : ''} ${isDark ? 'text-gray-500' : 'text-gray-400'}`}
                />
                <input
                    type="text"
                    placeholder="Search resources, quizzes…"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    onFocus={() => hasResults && setIsOpen(true)}
                    className={`w-full bg-transparent text-sm outline-none placeholder-gray-500
                        ${isDark ? 'text-white' : 'text-gray-800'}`}
                />
                {query && (
                    <button onClick={() => { setQuery(''); setIsOpen(false); }}>
                        <iconify-icon icon="solar:close-circle-bold" className="text-base opacity-50 hover:opacity-100" />
                    </button>
                )}
            </div>

            {/* Dropdown */}
            {isOpen && (
                <div className={`absolute top-full mt-2 left-0 w-80 rounded-2xl shadow-2xl overflow-hidden z-50 border animate-fade
                    ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}
                >
                    {!hasResults ? (
                        <div className="p-4 text-center text-sm opacity-50">
                            No results for <strong>"{query}"</strong>
                        </div>
                    ) : (
                        <div className="max-h-80 overflow-y-auto">
                            {/* Resources */}
                            {results.resources.length > 0 && (
                                <div>
                                    <p className={`px-4 pt-3 pb-1 text-[10px] font-bold uppercase tracking-widest opacity-50`}>
                                        Resources ({results.resources.length})
                                    </p>
                                    {results.resources.map(r => (
                                        <button
                                            key={r.id}
                                            onClick={() => { onNavigate('curriculum'); setIsOpen(false); setQuery(''); }}
                                            className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/5 transition-colors`}
                                        >
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm
                                                ${r.type === 'assignment'
                                                    ? (isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-600')
                                                    : (isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600')
                                                }`}
                                            >
                                                <iconify-icon icon={r.type === 'assignment' ? 'solar:document-bold' : 'solar:notes-bold'} />
                                            </div>
                                            <div className="overflow-hidden">
                                                <p className="text-sm font-bold truncate">{r.title}</p>
                                                <p className="text-xs opacity-50 truncate">{r.subject} · by {r.author}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Quizzes */}
                            {results.quizzes.length > 0 && (
                                <div>
                                    <p className={`px-4 pt-3 pb-1 text-[10px] font-bold uppercase tracking-widest opacity-50`}>
                                        Quizzes ({results.quizzes.length})
                                    </p>
                                    {results.quizzes.map(q => (
                                        <button
                                            key={q.id}
                                            onClick={() => { onNavigate('student_dashboard'); setIsOpen(false); setQuery(''); }}
                                            className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/5 transition-colors`}
                                        >
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
                                                ${isDark ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-600'}`}
                                            >
                                                <iconify-icon icon="solar:clipboard-check-bold" />
                                            </div>
                                            <div className="overflow-hidden">
                                                <p className="text-sm font-bold truncate">{q.title}</p>
                                                <p className="text-xs opacity-50 truncate">{q.subject} · {q.dateCreated}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
