import React, { useState, useEffect, useMemo } from 'react';
import {
    CheckCircle2,
    Circle,
    Calendar as CalendarIcon,
    Trophy,
    Clock,
    Dumbbell,
    BookOpen,
    ShieldCheck,
    ChevronLeft,
    ChevronRight,
    TrendingUp,
    GitCommit
} from 'lucide-react';

const APP_ID = 'daily-tracker-git';

{ id: 'dsa', label: 'DSA Practice', weight: 2, icon: BookOpen, color: 'text-blue-600' },
{ id: 'college', label: 'College & Gateway', weight: 1, icon: BookOpen, color: 'text-slate-600' },
{ id: 'dev', label: 'Development & GSoC', weight: 2, icon: GitCommit, color: 'text-indigo-600' },
{ id: 'gate', label: 'GATE Core Study', weight: 2, icon: ShieldCheck, color: 'text-purple-600' },
{ id: 'revision', label: 'Revision & Aptitude', weight: 1, icon: Clock, color: 'text-amber-600' },
];

const TIPS = [
    "Do the hardest thing first (DSA) when your brain is fresh.",
    "Do not be a passive student. Solve GATE PYQs during lectures.",
    "Build active projects. Don't just copy code.",
    "Spaced repetition stops you from forgetting.",
    "Consistency beats intensity.",
];

const SCHEDULE = [
    { time: "05:30 AM", activity: "Wake Up", details: "No snooze. Head start." },
    { time: "05:45 AM - 06:45 AM", activity: "DSA Practice", details: "Data Structures (Java). Arrays/Linked Lists." },
    { time: "07:00 AM - 08:00 AM", activity: "Routine", details: "Bath, Breakfast, Leave by 8:00 AM." },
    { time: "08:00 AM - 08:40 AM", activity: "Commute", details: "Audio Learning: System Design or Network Security." },
    { time: "08:40 AM - 03:20 PM", activity: "College", details: "Solve GATE PYQs. Code Web Tech assignments." },
    { time: "03:20 PM - 04:30 PM", activity: "Commute Home", details: "Decompress. Switch off college mode." },
    { time: "04:30 PM - 05:30 PM", activity: "Refresh", details: "Snacks. Phone rules: 15 mins max." },
    { time: "05:30 PM - 07:00 PM", activity: "Development", details: "Java Backend. Spring Boot. GSoC Prep." },
    { time: "07:00 PM - 07:15 PM", activity: "Break", details: "Walk. No screens." },
    { time: "07:15 PM - 08:45 PM", activity: "GATE Core", details: "Network Security & Compiler Design + PYQs." },
    { time: "08:45 PM - 09:30 PM", activity: "Dinner", details: "Light meal. Socialize." },
    { time: "09:30 PM - 10:15 PM", activity: "Revision", details: "GATE Aptitude OR DSA Revision." },
    { time: "10:15 PM", activity: "Shutdown", details: "No screens." },
    { time: "10:30 PM", activity: "Sleep", details: "Non-negotiable." },
];

const formatDateKey = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const App = () => {
    const [data, setData] = useState({});
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [view, setView] = useState('grid');
    const [commitCount, setCommitCount] = useState(0);

    // Initialize/Load Data from LocalStorage
    useEffect(() => {
        const saved = localStorage.getItem(APP_ID);
        if (saved) {
            setData(JSON.parse(saved));
        }

        // Get commit count from API
        fetchCommitCount();
    }, []);

    const fetchCommitCount = async () => {
        try {
            const response = await fetch('/api/stats');
            const stats = await response.json();
            setCommitCount(stats.todayCount || 0);
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const saveToLocal = (updatedData) => {
        setData(updatedData);
        localStorage.setItem(APP_ID, JSON.stringify(updatedData));
    };

    // Generate dates for current month
    const monthDates = useMemo(() => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        const dates = [];
        for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
            dates.push(new Date(d));
        }
        return dates;
    }, [currentMonth]);

    const toggleTask = async (dateKey, taskId) => {
        const dayData = data[dateKey] || {};
        const newValue = dayData[taskId] === 1 ? 0 : 1;

        const updatedDay = {
            ...dayData,
            [taskId]: newValue
        };

        const updatedData = { ...data, [dateKey]: updatedDay };
        saveToLocal(updatedData);

        // Send to backend to create Git commit
        try {
            const taskLabel = TASKS.find(t => t.id === taskId)?.label || taskId;
            const score = getDayScore(dateKey, updatedData);
            const maxScore = maxPossibleDayScore;

            await fetch('/api/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    date: dateKey,
                    taskId,
                    value: newValue,
                    action: newValue === 1 ? `${taskLabel} completed` : `${taskLabel} unchecked`,
                    details: `${dateKey}: ${taskLabel} = ${newValue} (Score: ${score}/${maxScore})`
                })
            });

            // Update commit count
            fetchCommitCount();
        } catch (error) {
            console.error('Error creating Git commit:', error);
        }
    };

    const getDayScore = (dateKey, dataToUse = data) => {
        const dayData = dataToUse[dateKey] || {};
        return TASKS.reduce((acc, t) => acc + (dayData[t.id] || 0) * t.weight, 0);
    };

    const maxPossibleDayScore = TASKS.reduce((acc, t) => acc + t.weight, 0);

    const globalStats = useMemo(() => {
        const totalPossible = monthDates.length * maxPossibleDayScore;
        let actual = 0;
        let daysCompleted = 0;

        monthDates.forEach(date => {
            const key = formatDateKey(date);
            const score = getDayScore(key);
            actual += score;
            if (score === maxPossibleDayScore) daysCompleted++;
        });

        return {
            percentage: totalPossible ? ((actual / totalPossible) * 100).toFixed(1) : 0,
            perfectDays: daysCompleted,
            totalDays: monthDates.length,
            currentScore: actual,
            maxScore: totalPossible
        };
    }, [data, monthDates, maxPossibleDayScore]);



    const navigateMonth = (direction) => {
        const newMonth = new Date(currentMonth);
        newMonth.setMonth(newMonth.getMonth() + direction);
        setCurrentMonth(newMonth);
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-4 md:p-8">
            {/* Header */}
            <header className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-800">DAILY TRACKER</h1>
                    <p className="text-slate-500 font-medium">Academic and Professional Development Period (Dec '25 - Apr '26)</p>
                </div>

                <div className="flex bg-white rounded-xl shadow-sm border p-1">
                    <button
                        onClick={() => setView('grid')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${view === 'grid' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'
                            }`}
                    >
                        Daily Grid
                    </button>
                    <button
                        onClick={() => setView('insights')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${view === 'insights' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'
                            }`}
                    >
                        Insights
                    </button>
                </div>
            </header>

            <main className="max-w-6xl mx-auto space-y-6">
                {/* Quick Stats Bar */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard
                        label="Consistency Score"
                        value={`${globalStats.percentage}%`}
                        icon={TrendingUp}
                        color="text-indigo-600"
                    />
                    <StatCard
                        label="Perfect Days"
                        value={globalStats.perfectDays}
                        icon={Trophy}
                        color="text-amber-500"
                    />
                    <StatCard
                        label="Today's Commits"
                        value={commitCount}
                        icon={GitCommit}
                        color="text-emerald-600"
                    />
                    <StatCard
                        label="Month Score"
                        value={`${globalStats.currentScore}/${globalStats.maxScore}`}
                        icon={CheckCircle2}
                        color="text-rose-500"
                    />
                </div>

                {view === 'grid' ? (
                    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                        {/* Month Navigation */}
                        <div className="flex items-center justify-between p-4 bg-slate-50 border-b">
                            <button
                                onClick={() => navigateMonth(-1)}
                                className="p-2 hover:bg-white rounded-full transition-colors border shadow-sm"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <h2 className="text-xl font-bold uppercase tracking-widest text-slate-700">
                                {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                            </h2>
                            <button
                                onClick={() => navigateMonth(1)}
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
                                                    <span className="md:hidden">{task.id.toUpperCase().slice(0, 3)}</span>
                                                </div>
                                            </th>
                                        ))}
                                        <th className="p-4 border-b font-bold text-slate-600 text-xs uppercase text-center">Score</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {monthDates.map(date => {
                                        const key = formatDateKey(date);
                                        const dayData = data[key] || {};
                                        const score = getDayScore(key);
                                        const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                                        const isToday = formatDateKey(new Date()) === key;

                                        return (
                                            <tr
                                                key={key}
                                                className={`border-b transition-colors ${isToday ? 'bg-indigo-50/50' :
                                                    isWeekend ? 'bg-amber-50/20' : 'hover:bg-slate-50'
                                                    }`}
                                            >
                                                <td className="p-4 font-bold text-slate-500 text-sm">
                                                    {date.getDate()} {date.toLocaleDateString('default', { weekday: 'short' })}
                                                    {isToday && <span className="ml-2 text-xs text-indigo-600">(Today)</span>}
                                                </td>
                                                {TASKS.map(task => (
                                                    <td key={task.id} className="p-2 text-center">
                                                        <button
                                                            onClick={() => toggleTask(key, task.id)}
                                                            className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all shadow-sm border font-black text-lg ${dayData[task.id] === 1
                                                                ? 'bg-indigo-600 text-white border-indigo-700'
                                                                : 'bg-white text-slate-300 border-slate-200 hover:border-slate-300'
                                                                }`}
                                                        >
                                                            {dayData[task.id] === 1 ? '1' : '0'}
                                                        </button>
                                                    </td>
                                                ))}
                                                <td className="p-4 text-center">
                                                    <div className={`text-sm font-black px-2 py-1 rounded inline-block ${score === maxPossibleDayScore
                                                        ? 'bg-emerald-100 text-emerald-700'
                                                        : score > 0
                                                            ? 'bg-blue-100 text-blue-700'
                                                            : 'bg-slate-100 text-slate-500'
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
                        {/* Schedule View */}
                        <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200 md:col-span-2">
                            <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-slate-800">
                                <Clock className="text-indigo-600" /> Daily Schedule
                            </h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 border-b">
                                            <th className="p-3 font-semibold text-slate-600">Time</th>
                                            <th className="p-3 font-semibold text-slate-600">Activity</th>
                                            <th className="p-3 font-semibold text-slate-600">Details & Strategy</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {SCHEDULE.map((slot, index) => (
                                            <tr key={index} className="hover:bg-slate-50/50">
                                                <td className="p-3 whitespace-nowrap font-medium text-slate-500">{slot.time}</td>
                                                <td className="p-3 font-bold text-slate-700">{slot.activity}</td>
                                                <td className="p-3 text-slate-600">{slot.details}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Task Scoring Rules */}
                        <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200">
                            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <BookOpen className="text-indigo-600" /> Scoring Criteria
                            </h3>
                            <div className="space-y-4">
                                {TASKS.map(task => (
                                    <div key={task.id} className="flex items-start gap-4 p-3 rounded-lg border border-slate-100">
                                        <task.icon className={`w-5 h-5 ${task.color} mt-1`} />
                                        <div className="flex-1">
                                            <p className="font-bold text-slate-700">{task.label}</p>
                                            <p className="text-sm text-slate-500">Weight: {task.weight} point{task.weight > 1 ? 's' : ''}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-6 p-4 bg-slate-50 rounded-lg">
                                <p className="text-sm text-slate-600">
                                    <strong>Max Daily Score:</strong> {maxPossibleDayScore} points
                                </p>
                            </div>
                        </div>

                        {/* Tips & Insights */}
                        <div className="space-y-6">
                            <div className="bg-slate-800 p-6 rounded-2xl shadow-lg text-white">
                                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                    <GitCommit className="text-white" /> Commit Tracking
                                </h3>
                                <p className="text-slate-300 mb-4">
                                    Every task completion triggers an automated Git commit.
                                    This maintains a record of consistency and effort.
                                </p>
                                <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700">
                                    <p className="text-xs font-mono text-slate-400">
                                        "2025-12-22: DSA Practice completed (Score: 4/8)"
                                    </p>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200">
                                <h3 className="text-xl font-bold mb-4 text-slate-800">Strategic Reminders</h3>
                                <ul className="space-y-3">
                                    {TIPS.map((tip, i) => (
                                        <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                                            <span className="text-indigo-600 font-bold">•</span>
                                            <span>{tip}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer className="max-w-6xl mx-auto mt-8 text-center text-slate-400 text-xs">
                <p>Progress is saved locally in your browser and committed to Git automatically.</p>
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

export default App;
