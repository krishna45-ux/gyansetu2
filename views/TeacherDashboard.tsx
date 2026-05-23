import React, { useState, useEffect } from 'react';
import { StatCard } from '../components/StatCard';
import { ClassResource, Language, StudentPerformance, Quiz, QuizQuestion } from '../types';
import { translations } from '../utils/translations';
import { getAllStudents, postResource, getResources, deleteResource, postQuiz, getQuizzes, uploadResourceFile, getChapterVideosDB, updateChapterVideosDB } from '../services/dbService';
import { useAppContext } from '../contexts/AppContext';
import { SYLLABUS_DATA, CHAPTER_VIDEO_MAP } from '../utils/curriculumData';

export const TeacherDashboard: React.FC = () => {
    const { isDark, language: lang, userEmail } = useAppContext();
    const [viewMode, setViewMode] = useState<'dashboard' | 'all_students' | 'at_risk' | 'create_quiz' | 'manage_videos'>('dashboard');
    const [students, setStudents] = useState<StudentPerformance[]>([]);
    const [resources, setResources] = useState<ClassResource[]>([]);
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [loading, setLoading] = useState(true);

    // Resource Form State
    const [showForm, setShowForm] = useState(false);
    const [newRes, setNewRes] = useState({
        title: '',
        type: 'note' as 'assignment' | 'note' | 'remedial',
        subject: '',
        content: '',
        dueDate: '',
        attachment_url: '' as string,
    });
    const [uploadingFile, setUploadingFile] = useState(false);
    const [uploadedFileName, setUploadedFileName] = useState('');

    // Quiz Form State
    const [quizTitle, setQuizTitle] = useState("");
    const [quizSubject, setQuizSubject] = useState("");
    const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
    const [currentQuestion, setCurrentQuestion] = useState({ q: "", o1: "", o2: "", o3: "", o4: "", correct: 0 });

    // Remedial Assignment State
    const [selectedStudentForRemedial, setSelectedStudentForRemedial] = useState<string | null>(null);
    const [selectedRemedialChapter, setSelectedRemedialChapter] = useState("Force and Laws of Motion");

    // Manage Videos Form State
    const [selectedVideoClass, setSelectedVideoClass] = useState<number>(6);
    const [selectedVideoSubject, setSelectedVideoSubject] = useState<string>("Mathematics");
    const [selectedVideoChapter, setSelectedVideoChapter] = useState<string>("");
    const [videoConceptUrl, setVideoConceptUrl] = useState<string>("");
    const [videoAnimatedUrl, setVideoAnimatedUrl] = useState<string>("");
    const [videoRealworldUrl, setVideoRealworldUrl] = useState<string>("");
    const [customVideosList, setCustomVideosList] = useState<any[]>([]);
    const [savingVideos, setSavingVideos] = useState<boolean>(false);

    // Load all custom videos once
    useEffect(() => {
        const loadCustomVideos = async () => {
            try {
                const list = await getChapterVideosDB();
                setCustomVideosList(list);
            } catch (e) {
                console.error("Failed to load custom videos", e);
            }
        };
        loadCustomVideos();
    }, []);

    // Set active chapter when class or subject changes
    useEffect(() => {
        if (SYLLABUS_DATA[selectedVideoClass] && SYLLABUS_DATA[selectedVideoClass][selectedVideoSubject]) {
            const chapters = SYLLABUS_DATA[selectedVideoClass][selectedVideoSubject];
            setSelectedVideoChapter(chapters[0] || "");
        }
    }, [selectedVideoClass, selectedVideoSubject]);

    // Set video inputs when active chapter changes
    useEffect(() => {
        if (!selectedVideoChapter) return;
        const record = customVideosList.find((v: any) =>
            v.class_level === selectedVideoClass &&
            v.subject.toLowerCase() === selectedVideoSubject.toLowerCase() &&
            v.chapter.toLowerCase() === selectedVideoChapter.toLowerCase()
        );
        const defaultVideoId = CHAPTER_VIDEO_MAP[selectedVideoChapter] || "OoO5d5P0Jn4";
        setVideoConceptUrl(record?.concept_video || defaultVideoId);
        setVideoAnimatedUrl(record?.animated_video || defaultVideoId);
        setVideoRealworldUrl(record?.realworld_video || defaultVideoId);
    }, [selectedVideoChapter, selectedVideoClass, selectedVideoSubject, customVideosList]);

    const extractYoutubeId = (urlOrId: string): string => {
        if (!urlOrId) return "";
        const clean = urlOrId.trim();
        if (clean.length === 11) return clean; // Already a raw ID
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = clean.match(regExp);
        return (match && match[2].length === 11) ? match[2] : clean;
    };

    const handleSaveVideos = async () => {
        if (!selectedVideoChapter) {
            alert("Please select a chapter first!");
            return;
        }

        const conceptId = extractYoutubeId(videoConceptUrl);
        const animatedId = extractYoutubeId(videoAnimatedUrl);
        const realworldId = extractYoutubeId(videoRealworldUrl);

        if (!conceptId || !animatedId || !realworldId) {
            alert("Please provide valid YouTube URLs or Video IDs for all three types.");
            return;
        }

        setSavingVideos(true);
        try {
            const updated = await updateChapterVideosDB({
                class_level: selectedVideoClass,
                subject: selectedVideoSubject,
                chapter: selectedVideoChapter,
                concept_video: conceptId,
                animated_video: animatedId,
                realworld_video: realworldId
            });

            // Update local list
            const index = customVideosList.findIndex((v: any) =>
                v.class_level === selectedVideoClass &&
                v.subject.toLowerCase() === selectedVideoSubject.toLowerCase() &&
                v.chapter.toLowerCase() === selectedVideoChapter.toLowerCase()
            );

            const newList = [...customVideosList];
            if (index > -1) {
                newList[index] = updated;
            } else {
                newList.push(updated);
            }
            setCustomVideosList(newList);
            alert("🎉 Curriculum videos updated successfully! These changes are now live for all students.");
        } catch (e) {
            console.error(e);
            alert("Failed to save custom videos. Please try again.");
        } finally {
            setSavingVideos(false);
        }
    };

    const t = translations[lang];

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                // Fetch Real Data from Firestore
                const fetchedStudents = await getAllStudents();
                setStudents(fetchedStudents);

                const fetchedResources = await getResources();
                setResources(fetchedResources);

                const fetchedQuizzes = await getQuizzes();
                setQuizzes(fetchedQuizzes);
            } catch (error) {
                console.error("Error loading dashboard data", error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    const atRiskStudents = students.filter(s => {
        // Condition: Average score < 60 OR Last two scores both < 50
        const badTrend = s.lastTwoScores.length === 2 && s.lastTwoScores.every(score => score < 50);
        return s.averageScore < 60 || badTrend;
    });

    const handlePostResource = async () => {
        if (!newRes.title || !newRes.content || !newRes.subject) return;

        const resource: ClassResource = {
            id: Date.now(),
            title: newRes.title,
            type: newRes.type,
            subject: newRes.subject,
            content: newRes.content,
            date: new Date().toLocaleDateString(),
            dueDate: newRes.type === 'assignment' ? newRes.dueDate : undefined,
            author: userEmail.split('@')[0]
        };

        // Optimistic UI Update
        setResources([resource, ...resources]);

        // Save to Cloud
        await postResource({ ...resource, attachment_url: newRes.attachment_url || undefined });

        setNewRes({ title: '', type: 'note', subject: '', content: '', dueDate: '', attachment_url: '' });
        setUploadedFileName('');
        setShowForm(false);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadingFile(true);
        try {
            const result = await uploadResourceFile(file);
            setNewRes(prev => ({ ...prev, attachment_url: result.url }));
            setUploadedFileName(file.name);
        } catch (err: any) {
            alert('File upload failed: ' + (err.message || 'Unknown error'));
        } finally {
            setUploadingFile(false);
        }
    };

    const handleAssignRemedial = async (studentName: string) => {
        const resource: ClassResource = {
            id: Date.now(),
            title: `Remedial: ${selectedRemedialChapter}`,
            type: 'remedial',
            subject: "Remedial Physics",
            content: `Based on your recent quiz performance, please watch the chapter: ${selectedRemedialChapter}.`,
            date: new Date().toLocaleDateString(),
            author: "Teacher (AI Recommendation)",
            targetStudent: studentName,
            linkToChapter: selectedRemedialChapter
        };

        setResources([resource, ...resources]);
        await postResource(resource);

        alert(`${t.sentSuccess}: ${studentName}`);
        setSelectedStudentForRemedial(null);
    };

    const handleDeleteResource = async (id: number) => {
        setResources(resources.filter(r => r.id !== id));
        await deleteResource(id);
    };

    const addQuestionToQuiz = () => {
        if (!currentQuestion.q || !currentQuestion.o1) return;
        const newQ: QuizQuestion = {
            id: Date.now(),
            question: currentQuestion.q,
            options: [currentQuestion.o1, currentQuestion.o2, currentQuestion.o3, currentQuestion.o4],
            correctIndex: currentQuestion.correct
        };
        setQuizQuestions([...quizQuestions, newQ]);
        setCurrentQuestion({ q: "", o1: "", o2: "", o3: "", o4: "", correct: 0 });
    };

    const publishQuiz = async () => {
        if (!quizTitle || quizQuestions.length === 0) return;
        const newQuiz: Quiz = {
            id: Date.now(),
            title: quizTitle,
            subject: quizSubject || "General",
            questions: quizQuestions,
            dateCreated: new Date().toLocaleDateString(),
            active: true
        };

        setQuizzes([newQuiz, ...quizzes]);
        await postQuiz(newQuiz);

        setQuizTitle("");
        setQuizSubject("");
        setQuizQuestions([]);
        setViewMode('dashboard');
        alert("Quiz Published Successfully!");
    };

    const renderStudentTable = (data: StudentPerformance[], showActions = false) => (
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className={`border-b ${isDark ? 'border-gray-700 text-gray-400' : 'border-gray-300 text-gray-600'}`}>
                        <th className="p-4 text-xs font-bold uppercase tracking-widest">Student Name</th>
                        <th className="p-4 text-xs font-bold uppercase tracking-widest">Avg Score</th>
                        <th className="p-4 text-xs font-bold uppercase tracking-widest">Career Goal</th>
                        <th className="p-4 text-xs font-bold uppercase tracking-widest">Current Module</th>
                        <th className="p-4 text-xs font-bold uppercase tracking-widest">Status</th>
                        {showActions && <th className="p-4 text-xs font-bold uppercase tracking-widest text-right">Actions</th>}
                    </tr>
                </thead>
                <tbody className="text-sm">
                    {data.length === 0 ? (
                        <tr>
                            <td colSpan={6} className="p-8 text-center opacity-50">
                                No students found. Waiting for students to register...
                            </td>
                        </tr>
                    ) : (
                        data.map((student) => (
                            <tr key={student.id} className={`border-b last:border-0 transition-colors ${isDark ? 'border-gray-800 hover:bg-white/5' : 'border-gray-200 hover:bg-black/5'}`}>
                                <td className="p-4 font-bold flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs ${isDark ? 'bg-gray-800 text-white' : 'bg-gray-300 text-black'}`}>
                                        {student.name.charAt(0)}
                                    </div>
                                    {student.name}
                                </td>
                                <td className="p-4">
                                    <span className={`font-bold ${student.averageScore < 60 ? 'text-red-500' : 'text-green-500'}`}>{student.averageScore}%</span>
                                </td>
                                <td className="p-4 opacity-70">{student.careerGoal}</td>
                                <td className="p-4 text-xs font-mono opacity-60">{student.currentModule}</td>
                                <td className="p-4">
                                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold uppercase
                                        ${student.status === 'Online'
                                            ? (isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700')
                                            : 'opacity-50 bg-gray-500/10'}`}>
                                        <div className={`w-2 h-2 rounded-full ${student.status === 'Online' ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                                        {student.status}
                                    </span>
                                </td>
                                {showActions && (
                                    <td className="p-4 text-right">
                                        <button
                                            onClick={() => setSelectedStudentForRemedial(student.name)}
                                            className={`px-3 py-1 rounded text-[10px] font-bold uppercase border hover:scale-105 transition-all
                                            ${isDark ? 'border-f-neon text-f-neon hover:bg-f-neon hover:text-black' : 'border-h-accent text-h-accent hover:bg-h-accent hover:text-white'}`}
                                        >
                                            {t.assignRemedial}
                                        </button>
                                    </td>
                                )}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );

    return (
        <div className="animate-fade space-y-8 pb-20">
            {/* Top Navigation for Teacher Dashboard */}
            <div className="flex flex-wrap gap-4 mb-4">
                <button onClick={() => setViewMode('dashboard')} className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${viewMode === 'dashboard' ? (isDark ? 'bg-white text-black' : 'bg-h-ink text-white') : 'opacity-50 hover:opacity-100'}`}>{t.dashboard}</button>
                <button onClick={() => setViewMode('all_students')} className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${viewMode === 'all_students' ? (isDark ? 'bg-white text-black' : 'bg-h-ink text-white') : 'opacity-50 hover:opacity-100'}`}>{t.totalStudents}</button>
                <button onClick={() => setViewMode('at_risk')} className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${viewMode === 'at_risk' ? (isDark ? 'bg-red-500 text-white' : 'bg-red-600 text-white') : 'opacity-50 hover:opacity-100 text-red-500'}`}>{t.atRisk}</button>
                <button onClick={() => setViewMode('create_quiz')} className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${viewMode === 'create_quiz' ? (isDark ? 'bg-f-purple text-white' : 'bg-h-gold text-white') : 'opacity-50 hover:opacity-100'}`}>{t.createQuiz}</button>
                <button onClick={() => setViewMode('manage_videos')} className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${viewMode === 'manage_videos' ? (isDark ? 'bg-white text-black' : 'bg-h-ink text-white') : 'opacity-50 hover:opacity-100'}`}>📹 Manage Videos</button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className={`w-8 h-8 border-4 border-t-transparent rounded-full animate-spin ${isDark ? 'border-f-neon' : 'border-h-accent'}`}></div>
                </div>
            ) : (
                <>
                    {/* DASHBOARD VIEW */}
                    {viewMode === 'dashboard' && (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                <div onClick={() => setViewMode('all_students')} className="cursor-pointer">
                                    <StatCard label={t.totalStudents} value={students.length.toString()} sub="Registered" icon="solar:users-group-rounded-bold" isDark={isDark} />
                                </div>
                                <StatCard label={t.activeNow} value={students.filter(s => s.status === 'Online').length.toString()} sub="Learning in real-time" icon="solar:laptop-minimalistic-bold" isDark={isDark} />
                                <StatCard label={t.classMastery} value={`${Math.floor(students.reduce((acc, s) => acc + s.averageScore, 0) / (students.length || 1))}%`} sub="Class Average" icon="solar:chart-square-bold" isDark={isDark} />
                                <div onClick={() => setViewMode('at_risk')} className="cursor-pointer">
                                    <StatCard label={t.atRisk} value={atRiskStudents.length.toString()} sub="Need immediate attention" icon="solar:danger-bold" isDark={isDark} />
                                </div>
                            </div>

                            {/* Student Monitor Preview */}
                            <div className={`p-8 rounded-2xl ${isDark ? 'glass-panel border-f-neon/30' : 'paper-panel'}`}>
                                <div className="flex justify-between items-center mb-8">
                                    <h3 className={`text-xl font-bold ${isDark ? 'font-future text-white' : 'font-heritage text-h-ink'}`}>{t.studentMonitor}</h3>
                                    <button onClick={() => setViewMode('all_students')} className="text-xs opacity-60 hover:opacity-100 underline">View All</button>
                                </div>
                                {renderStudentTable(students.slice(0, 5))}
                            </div>

                            {/* Resource Manager */}
                            <div className={`p-8 rounded-2xl ${isDark ? 'glass-panel border-f-neon/30' : 'paper-panel'}`}>
                                <div className="flex justify-between items-center mb-8">
                                    <div>
                                        <h3 className={`text-xl font-bold ${isDark ? 'font-future text-white' : 'font-heritage text-h-ink'}`}>{t.resourceManager}</h3>
                                    </div>
                                    <button
                                        onClick={() => setShowForm(!showForm)}
                                        className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest border flex items-center gap-2 transition-all
                                        ${isDark ? 'bg-f-neon text-black border-f-neon hover:shadow-[0_0_15px_#00F0FF]' : 'bg-h-accent text-white border-h-accent hover:shadow-md'}`}
                                    >
                                        <iconify-icon icon={showForm ? "solar:close-circle-bold" : "solar:add-circle-bold"}></iconify-icon>
                                        {showForm ? t.cancel : t.createNew}
                                    </button>
                                </div>

                                {showForm && (
                                    <div className={`mb-8 p-6 rounded-xl animate-fade ${isDark ? 'bg-white/5 border border-white/10' : 'bg-black/5 border border-black/10'}`}>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                            <input
                                                type="text"
                                                placeholder={t.title}
                                                value={newRes.title}
                                                onChange={e => setNewRes({ ...newRes, title: e.target.value })}
                                                className={`w-full p-3 rounded-lg bg-transparent border outline-none ${isDark ? 'border-gray-700 focus:border-f-neon' : 'border-gray-300 focus:border-h-accent'}`}
                                            />
                                            <div className="flex gap-2">
                                                <select
                                                    value={newRes.type}
                                                    onChange={e => setNewRes({ ...newRes, type: e.target.value as any })}
                                                    className={`p-3 rounded-lg bg-transparent border outline-none ${isDark ? 'border-gray-700 focus:border-f-neon' : 'border-gray-300 focus:border-h-accent'} ${isDark ? 'text-white' : 'text-black'}`}
                                                >
                                                    <option value="note" className="text-black">Note / Announcement</option>
                                                    <option value="assignment" className="text-black">Assignment</option>
                                                </select>
                                                <input
                                                    type="text"
                                                    placeholder={t.subject}
                                                    value={newRes.subject}
                                                    onChange={e => setNewRes({ ...newRes, subject: e.target.value })}
                                                    className={`flex-1 p-3 rounded-lg bg-transparent border outline-none ${isDark ? 'border-gray-700 focus:border-f-neon' : 'border-gray-300 focus:border-h-accent'}`}
                                                />
                                            </div>
                                        </div>
                                        <textarea
                                            placeholder={t.content}
                                            value={newRes.content}
                                            onChange={e => setNewRes({ ...newRes, content: e.target.value })}
                                            className={`w-full h-24 p-3 rounded-lg bg-transparent border outline-none mb-4 resize-none ${isDark ? 'border-gray-700 focus:border-f-neon' : 'border-gray-300 focus:border-h-accent'}`}
                                        ></textarea>
                                        {newRes.type === 'assignment' && (
                                            <div className="mb-4">
                                                <label className="text-xs uppercase font-bold opacity-60 block mb-1">{t.dueDate}</label>
                                                <input
                                                    type="date"
                                                    value={newRes.dueDate}
                                                    onChange={e => setNewRes({ ...newRes, dueDate: e.target.value })}
                                                    className={`p-3 rounded-lg bg-transparent border outline-none ${isDark ? 'border-gray-700 focus:border-f-neon' : 'border-gray-300 focus:border-h-accent'} ${isDark ? 'text-white' : 'text-black'}`}
                                                />
                                            </div>
                                        )}
                                        <div className="flex flex-col gap-3 mb-4">
                                            {/* File Upload */}
                                            <label className={`flex items-center gap-3 p-3 rounded-lg border-2 border-dashed cursor-pointer transition-colors
                                                ${isDark ? 'border-gray-600 hover:border-f-neon text-gray-400 hover:text-f-neon' : 'border-gray-300 hover:border-h-accent text-gray-500 hover:text-h-accent'}`}>
                                                <iconify-icon icon={uploadingFile ? 'solar:refresh-circle-bold' : 'solar:upload-bold'} className={`text-xl ${uploadingFile ? 'animate-spin' : ''}`} />
                                                <span className="text-xs font-bold">
                                                    {uploadingFile ? 'Uploading…' : uploadedFileName ? `✅ ${uploadedFileName}` : 'Attach a file (PDF, image, doc) — max 10MB'}
                                                </span>
                                                <input
                                                    type="file"
                                                    accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.png,.jpg,.jpeg,.gif"
                                                    className="hidden"
                                                    onChange={handleFileUpload}
                                                    disabled={uploadingFile}
                                                />
                                            </label>
                                        </div>
                                        <div className="flex justify-end">
                                            <button
                                                onClick={handlePostResource}
                                                className={`px-6 py-2 rounded-lg font-bold uppercase text-xs tracking-widest ${isDark ? 'bg-f-purple text-white' : 'bg-h-gold text-white'}`}
                                            >
                                                {t.postResource}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {resources.length === 0 && (
                                        <div className="col-span-full text-center py-10 opacity-40">
                                            <iconify-icon icon="solar:folder-open-bold" className="text-4xl mb-2"></iconify-icon>
                                            <p>No resources posted yet.</p>
                                        </div>
                                    )}
                                    {resources.map(res => (
                                        <div key={res.id} className={`p-4 rounded-xl border relative group ${isDark ? 'bg-white/5 border-gray-700' : 'bg-white border-gray-200'}`}>
                                            <button
                                                onClick={() => handleDeleteResource(res.id)}
                                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-500"
                                            >
                                                <iconify-icon icon="solar:trash-bin-trash-bold"></iconify-icon>
                                            </button>
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest ${res.type === 'assignment'
                                                    ? (isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-600')
                                                    : res.type === 'remedial'
                                                        ? (isDark ? 'bg-orange-500/20 text-orange-400' : 'bg-orange-100 text-orange-600')
                                                        : (isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600')
                                                    }`}>
                                                    {res.type}
                                                </span>
                                                <span className="text-xs opacity-60 font-bold">{res.subject}</span>
                                            </div>
                                            <h4 className={`font-bold mb-1 ${isDark ? 'text-white' : 'text-h-ink'}`}>{res.title}</h4>
                                            <p className="text-sm opacity-70 mb-3 line-clamp-2">{res.content}</p>
                                            {res.targetStudent && <p className="text-xs font-bold text-orange-500 mb-1">Assigned to: {res.targetStudent}</p>}
                                            {/* Phase 2: Show attachment link if present */}
                                            {(res as any).attachment_url && (
                                                <a
                                                    href={(res as any).attachment_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className={`inline-flex items-center gap-1 text-xs font-bold mb-2 hover:underline ${isDark ? 'text-f-neon' : 'text-h-accent'}`}
                                                >
                                                    <iconify-icon icon="solar:paperclip-bold" />
                                                    View Attachment
                                                </a>
                                            )}
                                            <div className="flex justify-between items-center text-[10px] opacity-50 font-mono">
                                                <span>Posted: {res.date}</span>
                                                {res.dueDate && <span className="text-red-400 font-bold">Due: {res.dueDate}</span>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    {/* TOTAL STUDENTS VIEW */}
                    {viewMode === 'all_students' && (
                        <div className={`p-8 rounded-2xl ${isDark ? 'glass-panel' : 'paper-panel'}`}>
                            <h2 className={`text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-h-ink'}`}>{t.studentList}</h2>
                            {renderStudentTable(students)}
                        </div>
                    )}

                    {/* AT RISK VIEW */}
                    {viewMode === 'at_risk' && (
                        <div className={`p-8 rounded-2xl ${isDark ? 'glass-panel border-red-500/30' : 'paper-panel border-red-500/30'}`}>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-3 rounded-full bg-red-500/20 text-red-500">
                                    <iconify-icon icon="solar:danger-triangle-bold" className="text-2xl"></iconify-icon>
                                </div>
                                <div>
                                    <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-h-ink'}`}>{t.atRisk}</h2>
                                    <p className="opacity-60 text-sm">Students with &lt;60% average or declining performance in last 2 quizzes.</p>
                                </div>
                            </div>
                            {renderStudentTable(atRiskStudents, true)}

                            {/* Remedial Assignment Modal */}
                            {selectedStudentForRemedial && (
                                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                                    <div className={`w-full max-w-md p-6 rounded-2xl ${isDark ? 'bg-gray-900 border border-f-neon' : 'bg-white border border-h-accent'}`}>
                                        <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-h-ink'}`}>{t.assignRemedial}</h3>
                                        <p className="mb-4 text-sm opacity-80">{t.assignTo}: <strong>{selectedStudentForRemedial}</strong></p>

                                        <label className="block text-xs font-bold uppercase tracking-widest opacity-60 mb-2">{t.selectVideo}</label>
                                        <select
                                            className={`w-full p-3 rounded-lg mb-6 bg-transparent border outline-none ${isDark ? 'border-gray-700' : 'border-gray-300'}`}
                                            value={selectedRemedialChapter}
                                            onChange={(e) => setSelectedRemedialChapter(e.target.value)}
                                        >
                                            <option value="Force and Laws of Motion">Force and Laws of Motion</option>
                                            <option value="Gravitation">Gravitation</option>
                                            <option value="Work and Energy">Work and Energy</option>
                                            <option value="Structure of the Atom">Structure of the Atom</option>
                                        </select>

                                        <div className="flex justify-end gap-3">
                                            <button onClick={() => setSelectedStudentForRemedial(null)} className="px-4 py-2 text-xs font-bold uppercase opacity-60 hover:opacity-100">{t.cancel}</button>
                                            <button
                                                onClick={() => handleAssignRemedial(selectedStudentForRemedial)}
                                                className={`px-6 py-2 rounded-lg font-bold uppercase text-xs tracking-widest ${isDark ? 'bg-f-neon text-black' : 'bg-h-accent text-white'}`}
                                            >
                                                {t.submit}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* CREATE QUIZ VIEW */}
                    {viewMode === 'create_quiz' && (
                        <div className={`p-8 rounded-2xl ${isDark ? 'glass-panel' : 'paper-panel'}`}>
                            <h2 className={`text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-h-ink'}`}>{t.createQuiz}</h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-widest opacity-60 mb-2">{t.quizTitle}</label>
                                    <input
                                        type="text"
                                        value={quizTitle}
                                        onChange={(e) => setQuizTitle(e.target.value)}
                                        className={`w-full p-3 rounded-lg bg-transparent border outline-none ${isDark ? 'border-gray-700 focus:border-f-neon' : 'border-gray-300 focus:border-h-accent'}`}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-widest opacity-60 mb-2">{t.subject}</label>
                                    <input
                                        type="text"
                                        value={quizSubject}
                                        onChange={(e) => setQuizSubject(e.target.value)}
                                        className={`w-full p-3 rounded-lg bg-transparent border outline-none ${isDark ? 'border-gray-700 focus:border-f-neon' : 'border-gray-300 focus:border-h-accent'}`}
                                    />
                                </div>
                            </div>

                            <div className={`p-6 rounded-xl mb-6 ${isDark ? 'bg-white/5' : 'bg-black/5'}`}>
                                <h4 className="font-bold mb-4">{t.addQuestion}</h4>
                                <input
                                    type="text"
                                    placeholder="Question Text"
                                    className={`w-full p-3 rounded-lg bg-transparent border outline-none mb-3 ${isDark ? 'border-gray-700' : 'border-gray-300'}`}
                                    value={currentQuestion.q}
                                    onChange={(e) => setCurrentQuestion({ ...currentQuestion, q: e.target.value })}
                                />
                                <div className="grid grid-cols-2 gap-3 mb-3">
                                    {[1, 2, 3, 4].map((num, idx) => (
                                        <input
                                            key={idx}
                                            type="text"
                                            placeholder={`${t.option} ${num}`}
                                            className={`w-full p-3 rounded-lg bg-transparent border outline-none ${isDark ? 'border-gray-700' : 'border-gray-300'}`}
                                            value={(currentQuestion as any)[`o${num}`]}
                                            onChange={(e) => setCurrentQuestion({ ...currentQuestion, [`o${num}`]: e.target.value })}
                                        />
                                    ))}
                                </div>
                                <input
                                    type="number"
                                    min="0" max="3"
                                    placeholder={t.correctOption}
                                    className={`w-full p-3 rounded-lg bg-transparent border outline-none mb-4 ${isDark ? 'border-gray-700' : 'border-gray-300'}`}
                                    value={currentQuestion.correct}
                                    onChange={(e) => setCurrentQuestion({ ...currentQuestion, correct: parseInt(e.target.value) })}
                                />
                                <button
                                    onClick={addQuestionToQuiz}
                                    className={`w-full py-2 rounded-lg font-bold uppercase text-xs border ${isDark ? 'border-white text-white hover:bg-white hover:text-black' : 'border-black text-black hover:bg-black hover:text-white'}`}
                                >
                                    + Add Question to Quiz
                                </button>
                            </div>

                            {quizQuestions.length > 0 && (
                                <div className="mb-6">
                                    <h4 className="opacity-60 uppercase text-xs font-bold mb-2">Questions Added ({quizQuestions.length})</h4>
                                    <div className="space-y-2">
                                        {quizQuestions.map((q, i) => (
                                            <div key={q.id} className={`p-3 rounded-lg text-sm flex justify-between ${isDark ? 'bg-white/5' : 'bg-white border'}`}>
                                                <span>{i + 1}. {q.question}</span>
                                                <span className="opacity-50">Ans: {q.options[q.correctIndex]}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={publishQuiz}
                                className={`w-full py-4 rounded-xl font-bold uppercase tracking-widest transition-all
                                ${isDark ? 'bg-f-purple text-white hover:shadow-[0_0_20px_rgba(189,0,255,0.4)]' : 'bg-h-gold text-white hover:shadow-lg'}`}
                            >
                                {t.publishQuiz}
                            </button>
                        </div>
                    )}

                    {/* MANAGE VIDEOS VIEW */}
                    {viewMode === 'manage_videos' && (
                        <div className={`p-8 rounded-2xl animate-fade ${isDark ? 'glass-panel' : 'paper-panel'}`}>
                            <div className="flex justify-between items-center mb-8">
                                <div>
                                    <h3 className={`text-xl font-bold ${isDark ? 'font-future text-white' : 'font-heritage text-h-ink'}`}>Manage Curriculum Videos</h3>
                                    <p className="text-xs opacity-60 mt-1">Assign custom YouTube video lessons for each chapter, subject, and class level.</p>
                                </div>
                            </div>

                            {/* SELECTORS */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider opacity-60 mb-2">Class</label>
                                    <select
                                        value={selectedVideoClass}
                                        onChange={e => setSelectedVideoClass(parseInt(e.target.value))}
                                        className={`w-full p-3 rounded-xl bg-transparent border outline-none ${isDark ? 'border-gray-700 focus:border-f-neon text-white bg-gray-905' : 'border-gray-300 focus:border-h-accent text-black bg-white'}`}
                                        style={{ colorScheme: isDark ? 'dark' : 'light' }}
                                    >
                                        {[6, 7, 8, 9, 10].map(cls => (
                                            <option key={cls} value={cls} className={isDark ? 'bg-gray-900 text-white' : 'bg-white text-black'}>Class {cls}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider opacity-60 mb-2">Subject</label>
                                    <select
                                        value={selectedVideoSubject}
                                        onChange={e => setSelectedVideoSubject(e.target.value)}
                                        className={`w-full p-3 rounded-xl bg-transparent border outline-none ${isDark ? 'border-gray-700 focus:border-f-neon text-white bg-gray-905' : 'border-gray-300 focus:border-h-accent text-black bg-white'}`}
                                        style={{ colorScheme: isDark ? 'dark' : 'light' }}
                                    >
                                        {Object.keys(SYLLABUS_DATA[selectedVideoClass] || {}).map(sub => (
                                            <option key={sub} value={sub} className={isDark ? 'bg-gray-900 text-white' : 'bg-white text-black'}>{sub}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider opacity-60 mb-2">Chapter</label>
                                    <select
                                        value={selectedVideoChapter}
                                        onChange={e => setSelectedVideoChapter(e.target.value)}
                                        className={`w-full p-3 rounded-xl bg-transparent border outline-none ${isDark ? 'border-gray-700 focus:border-f-neon text-white bg-gray-905' : 'border-gray-300 focus:border-h-accent text-black bg-white'}`}
                                        style={{ colorScheme: isDark ? 'dark' : 'light' }}
                                    >
                                        {(SYLLABUS_DATA[selectedVideoClass]?.[selectedVideoSubject] || []).map(ch => (
                                            <option key={ch} value={ch} className={isDark ? 'bg-gray-900 text-white' : 'bg-white text-black'}>{ch}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* VIDEO URL INPUTS & LIVE PREVIEWS */}
                            <div className="space-y-8">
                                {/* CONCEPT VIDEO */}
                                <div className={`p-6 rounded-xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10'}`}>
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        <div>
                                            <div className="flex justify-between items-center mb-2">
                                                <label className="text-sm font-bold uppercase tracking-wider text-green-500">1. Core Concept Video</label>
                                                <span className="text-[10px] opacity-50">Paste any YouTube Link or Video ID</span>
                                            </div>
                                            <input
                                                type="text"
                                                placeholder="e.g. https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                                                value={videoConceptUrl}
                                                onChange={e => setVideoConceptUrl(e.target.value)}
                                                className={`w-full p-3 rounded-lg bg-transparent border outline-none ${isDark ? 'border-gray-700 focus:border-f-neon text-white' : 'border-gray-300 focus:border-h-accent text-black'}`}
                                            />
                                            <p className="text-[10px] opacity-40 mt-1">Current ID: {extractYoutubeId(videoConceptUrl) || 'None'}</p>
                                        </div>
                                        <div className="aspect-video w-full max-w-[320px] rounded-lg overflow-hidden border border-gray-700 bg-black flex items-center justify-center mx-auto lg:mx-0">
                                            {extractYoutubeId(videoConceptUrl) ? (
                                                <iframe
                                                    className="w-full h-full"
                                                    src={`https://www.youtube.com/embed/${extractYoutubeId(videoConceptUrl)}`}
                                                    title="Concept Preview"
                                                    frameBorder="0"
                                                    allowFullScreen
                                                ></iframe>
                                            ) : (
                                                <div className="text-xs opacity-50">No Preview Available</div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* ANIMATED VIDEO */}
                                <div className={`p-6 rounded-xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10'}`}>
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        <div>
                                            <div className="flex justify-between items-center mb-2">
                                                <label className="text-sm font-bold uppercase tracking-wider text-blue-500">2. Animated & Visual Guide</label>
                                                <span className="text-[10px] opacity-50">Paste any YouTube Link or Video ID</span>
                                            </div>
                                            <input
                                                type="text"
                                                placeholder="e.g. https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                                                value={videoAnimatedUrl}
                                                onChange={e => setVideoAnimatedUrl(e.target.value)}
                                                className={`w-full p-3 rounded-lg bg-transparent border outline-none ${isDark ? 'border-gray-700 focus:border-f-neon text-white' : 'border-gray-300 focus:border-h-accent text-black'}`}
                                            />
                                            <p className="text-[10px] opacity-40 mt-1">Current ID: {extractYoutubeId(videoAnimatedUrl) || 'None'}</p>
                                        </div>
                                        <div className="aspect-video w-full max-w-[320px] rounded-lg overflow-hidden border border-gray-700 bg-black flex items-center justify-center mx-auto lg:mx-0">
                                            {extractYoutubeId(videoAnimatedUrl) ? (
                                                <iframe
                                                    className="w-full h-full"
                                                    src={`https://www.youtube.com/embed/${extractYoutubeId(videoAnimatedUrl)}`}
                                                    title="Animated Preview"
                                                    frameBorder="0"
                                                    allowFullScreen
                                                ></iframe>
                                            ) : (
                                                <div className="text-xs opacity-50">No Preview Available</div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* REAL WORLD VIDEO */}
                                <div className={`p-6 rounded-xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10'}`}>
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        <div>
                                            <div className="flex justify-between items-center mb-2">
                                                <label className="text-sm font-bold uppercase tracking-wider text-purple-500">3. Real World Application Video</label>
                                                <span className="text-[10px] opacity-50">Paste any YouTube Link or Video ID</span>
                                            </div>
                                            <input
                                                type="text"
                                                placeholder="e.g. https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                                                value={videoRealworldUrl}
                                                onChange={e => setVideoRealworldUrl(e.target.value)}
                                                className={`w-full p-3 rounded-lg bg-transparent border outline-none ${isDark ? 'border-gray-700 focus:border-f-neon text-white' : 'border-gray-300 focus:border-h-accent text-black'}`}
                                            />
                                            <p className="text-[10px] opacity-40 mt-1">Current ID: {extractYoutubeId(videoRealworldUrl) || 'None'}</p>
                                        </div>
                                        <div className="aspect-video w-full max-w-[320px] rounded-lg overflow-hidden border border-gray-700 bg-black flex items-center justify-center mx-auto lg:mx-0">
                                            {extractYoutubeId(videoRealworldUrl) ? (
                                                <iframe
                                                    className="w-full h-full"
                                                    src={`https://www.youtube.com/embed/${extractYoutubeId(videoRealworldUrl)}`}
                                                    title="Real World Preview"
                                                    frameBorder="0"
                                                    allowFullScreen
                                                ></iframe>
                                            ) : (
                                                <div className="text-xs opacity-50">No Preview Available</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* SAVE BUTTON */}
                            <button
                                onClick={handleSaveVideos}
                                disabled={savingVideos}
                                className={`w-full py-4 rounded-xl font-bold uppercase tracking-widest transition-all mt-8 flex items-center justify-center gap-2
                                ${isDark ? 'bg-f-neon text-black hover:shadow-[0_0_20px_#00F0FF]' : 'bg-h-accent text-white hover:shadow-lg'} disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                                <iconify-icon icon={savingVideos ? "solar:refresh-bold" : "solar:diskette-bold"} className={savingVideos ? "animate-spin text-lg" : "text-lg"}></iconify-icon>
                                {savingVideos ? "Saving Videos..." : "Save Custom Videos"}
                            </button>
                        </div>
                    )}
                </>
            )
            }
        </div >
    );
};