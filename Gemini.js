import React, { useState, useEffect, useMemo } from 'react';
import {
    CheckCircle2,
    Circle,
    LayoutDashboard,
    Calendar as CalendarIcon,
    Trophy,
    Clock,
    BookOpen,
    ShieldCheck,
    Lock,
    ChevronLeft,
    ChevronRight,
    TrendingUp,
    AlertCircle
} from 'lucide-react';

const APP_ID = 'war-time-tracker-2026';

const TASKS = [
    { id: 'wake', label: 'Wake Up (05:30)', weight: 1, icon: Clock, color: 'text-orange-500' },
    { id: 'dsa', label: 'DSA (05:45-06:45)', weight: 2, icon: BookOpen, color: 'text-blue-500' },
    { id: 'college', label: 'College Hack', weight: 1, icon: ShieldCheck, color: 'text-purple-500' },
    { id: 'dev', label: 'Dev/GSoC (17:30)', weight: 2, icon: LayoutDashboard, color: 'text-emerald-500' },
    { id: 'gate', label: 'GATE Core (19:15)', weight: 2, icon: Lock, color: 'text-indigo-500' },
    { id: 'rev', label: 'Rev/Apt (21:30)', weight: 1, icon: TrendingUp, color: 'text-rose-500' },
];

const SCHEDULE = {
    "05:30 AM": "Wake Up - No Snooze",
    "05:45 AM": "DSA (Java) - Striver A2Z",
    "06:45 AM": "Chores & Prep (8:00 Departure)",
    "08:40 AM": "College (Hack boring lectures for GATE/NetSec)",
    "03:20 PM": "Commute & Decompress",
    "05:30 PM": "Web Dev (Spring Boot/Next.js) or GSoC",
    "07:15 PM": "GATE Core (NetSec/Compiler Design)",
    "08:45 PM": "Dinner & Family",
    "09:30 PM": "Revision / Aptitude / LLD",
    "10:15 PM": "Phone Away & Lockdown",
    "10:30 PM": "Sleep (Critical for 05:30 Wakeup)"
};

const App = () => {
    const [data, setData] = useState({});
    const [currentMonth, setCurrentMonth] = useState(new Date(2025, 11, 23)); // Start Dec 2025
    const [view, setView] = useState('grid'); // 'grid' or 'stats'

    // Initialize/Load Data
    useEffect(() => {
        const saved = localStorage.getItem(APP_ID);
        if (saved) {
            setData(JSON.parse(saved));
        }
    }, []);

    const saveToLocal = (updatedData) => {
        setData(updatedData);
        localStorage.setItem(APP_ID, JSON.stringify(updatedData));
    };

    // Generate date range from Dec 23 to Apr 22
    const allDates = useMemo(() => {
        const start = new Date(2025, 11, 23);
        const end = new Date(2026, 3, 22);
        const dates = [];
        let curr = new Date(start);
        while (curr <= end) {
            dates.push(new Date(curr));
            curr.setDate(curr.getDate() + 1);
        }
        return dates;
    }, []);

    const toggleTask = (dateKey, taskId) => {
        const dayData = data[dateKey] || {};
        const updatedDay = {
            ...dayData,
            [taskId]: dayData[taskId] === 1 ? 0 : 1
        };
        saveToLocal({ ...data, [dateKey]: updatedDay });
    };

    const getDayScore = (dateKey) => {
        const dayData = data[dateKey] || {};
        return TASKS.reduce((acc, t) => acc + (dayData[t.id] || 0) * t.weight, 0);
    };

    const maxPossibleDayScore = TASKS.reduce((acc, t) => acc + t.weight, 0);

    const globalStats = useMemo(() => {
        const totalPossible = allDates.length * maxPossibleDayScore;
        let actual = 0;
        let daysCompleted = 0;

        Object.keys(data).forEach(key => {
            const score = getDayScore(key);
            actual += score;
            if (score === maxPossibleDayScore) daysCompleted++;
        });

        return {
            percentage: totalPossible ? ((actual / totalPossible) * 100).toFixed(1) : 0,
            streak: 0, // Simplified for this logic
            perfectDays: daysCompleted,
            totalDays: allDates.length
        };
    }, [data, allDates, maxPossibleDayScore]);

    const formatDateKey = (date) => date.toISOString().split('T')[0];

    const filteredDates = allDates.filter(d =>
        d.getMonth() === currentMonth.getMonth() && d.getFullYear() === currentMonth.getFullYear()
    );

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-4 md:p-8">
            {/* Header */}
            <header className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-800">WAR TIME TRACKER</h1>
                    <p className="text-slate-500 font-medium">Dec 23, 2025 — Apr 22, 2026 | Semester 6 & GATE Prep</p>
                </div>

                <div className="flex bg-white rounded-xl shadow-sm border p-1">
                    <button
                        onClick={() => setView('grid')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${view === 'grid' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                        Daily Grid
                    </button>
                    <button
                        onClick={() => setView('stats')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${view === 'stats' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                        Insights
                    </button>
                </div>
            </header>

            <main className="max-w-6xl mx-auto space-y-6">

                {/* Quick Stats Bar */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard label="Consistency Score" value={`${globalStats.percentage}%`} icon={TrendingUp} color="text-indigo-600" />
                    <StatCard label="Perfect Days" value={globalStats.perfectDays} icon={Trophy} color="text-amber-500" />
                    <StatCard label="Phase" value={currentMonth.getFullYear() === 2026 && currentMonth.getMonth() > 0 ? "Web & Dev" : "GATE & DSA"} icon={ShieldCheck} color="text-emerald-600" />
                    <StatCard label="Status" value="Fresh Start" icon={AlertCircle} color="text-rose-500" />
                </div>

                {view === 'grid' ? (
                    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                        {/* Month Navigation */}
                        <div className="flex items-center justify-between p-4 bg-slate-50 border-b">
                            <button
                                onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))}
                                className="p-2 hover:bg-white rounded-full transition-colors border shadow-sm"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <h2 className="text-xl font-bold uppercase tracking-widest text-slate-700">
                                {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                            </h2>
                            <button
                                onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))}
                                className="p-2 hover:bg-white rounded-full transition-colors border shadow-sm"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Desktop Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-100/50">
                                        <th className="p-4 border-b font-bold text-slate-600 text-xs uppercase">Date</th>
                                        {TASKS.map(task => (
                                            <th key={task.id} className="p-4 border-b font-bold text-slate-600 text-xs uppercase text-center">
                                                <div className="flex flex-col items-center gap-1">
                                                    <task.icon className={`w-4 h-4 ${task.color}`} />
                                                    <span className="hidden md:inline">{task.label}</span>
                                                    <span className="md:hidden">{task.id.toUpperCase()}</span>
                                                </div>
                                            </th>
                                        ))}
                                        <th className="p-4 border-b font-bold text-slate-600 text-xs uppercase text-center">Score</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredDates.map(date => {
                                        const key = formatDateKey(date);
                                        const dayData = data[key] || {};
                                        const score = getDayScore(key);
                                        const isWeekend = date.getDay() === 0 || date.getDay() === 6;

                                        return (
                                            <tr key={key} className={`border-b transition-colors ${isWeekend ? 'bg-amber-50/20' : 'hover:bg-slate-50'}`}>
                                                <td className="p-4 font-bold text-slate-500 text-sm">
                                                    {date.getDate()} {date.toLocaleDateString('default', { weekday: 'short' })}
                                                </td>
                                                {TASKS.map(task => (
                                                    <td key={task.id} className="p-2 text-center">
                                                        <button
                                                            onClick={() => toggleTask(key, task.id)}
                                                            className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all shadow-sm border ${dayData[task.id] === 1
                                                                    ? 'bg-indigo-600 text-white border-indigo-700 font-black'
                                                                    : 'bg-white text-slate-300 border-slate-100 hover:border-slate-300'
                                                                }`}
                                                        >
                                                            {dayData[task.id] === 1 ? '1' : '0'}
                                                        </button>
                                                    </td>
                                                ))}
                                                <td className="p-4 text-center">
                                                    <div className={`text-sm font-black px-2 py-1 rounded inline-block ${score === maxPossibleDayScore ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                                                        }`}>
                                                        {score}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Schedule Card */}
                        <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200">
                            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <Clock className="text-indigo-600" /> Hourly Schedule
                            </h3>
                            <div className="space-y-4">
                                {Object.entries(SCHEDULE).map(([time, task], i) => (
                                    <div key={time} className="flex items-start gap-4">
                                        <span className="text-xs font-bold text-slate-400 w-16 pt-1">{time}</span>
                                        <div className="flex-1 pb-4 border-l-2 border-indigo-100 pl-4 relative">
                                            <div className="absolute -left-1.5 top-1.5 w-2.5 h-2.5 rounded-full bg-indigo-400 border-2 border-white shadow-sm" />
                                            <p className="font-bold text-slate-700 leading-tight">{task}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Strategic Advice */}
                        <div className="space-y-6">
                            <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-6 rounded-2xl shadow-lg text-white">
                                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                    <ShieldCheck className="text-white" /> The Combat Rule
                                </h3>
                                <ul className="space-y-3 text-indigo-100 font-medium">
                                    <li>• Use binary scoring (0 or 1). No half-efforts.</li>
                                    <li>• If you fail a morning slot, start again at the 5:30 PM slot.</li>
                                    <li>• College Hack: Use the 8:40-3:20 time for GATE PYQs.</li>
                                    <li>• Lockdown: No screens after 10:15 PM or tomorrow's 5:30 AM is a 0.</li>
                                </ul>
                            </div>

                            <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200">
                                <h3 className="text-xl font-bold mb-4 text-slate-800">Monthly Syllabus Focus</h3>
                                <div className="space-y-4 text-sm">
                                    <FocusItem month="Dec" focus="Arrays (Java), NetSec Unit 1" active={currentMonth.getMonth() === 11} />
                                    <FocusItem month="Jan" focus="Linked Lists, Compiler Unit 1-2" active={currentMonth.getMonth() === 0} />
                                    <FocusItem month="Feb" focus="GATE Mock Tests, Spring Boot Intro" active={currentMonth.getMonth() === 1} />
                                    <FocusItem month="Mar" focus="Trees/Graphs, GSoC Proposal" active={currentMonth.getMonth() === 2} />
                                    <FocusItem month="Apr" focus="DP, Semester Final Exams" active={currentMonth.getMonth() === 3} />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Persistence Note */}
            <footer className="max-w-6xl mx-auto mt-8 text-center text-slate-400 text-xs">
                <p>Progress is saved locally in your browser. Complete every task to maintain a 100% consistency score.</p>
            </footer>
        </div>
    );
};

const StatCard = ({ label, value, icon: Icon, color }) => (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
        <div className={`p-2 rounded-lg bg-slate-50 ${color}`}>
            <Icon className="w-5 h-5" />
        </div>
        <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-tight">{label}</p>
            <p className="text-xl font-black text-slate-800">{value}</p>
        </div>
    </div>
);

const FocusItem = ({ month, focus, active }) => (
    <div className={`p-3 rounded-lg border flex items-center justify-between ${active ? 'border-indigo-200 bg-indigo-50/50 ring-1 ring-indigo-500' : 'border-slate-100 text-slate-400'}`}>
        <span className="font-bold">{month}</span>
        <span className="font-medium">{focus}</span>
    </div>
);

export default App;