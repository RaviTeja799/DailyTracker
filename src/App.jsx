import React, { useState, useEffect, useMemo } from 'react';
import {
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';

const APP_ID = 'daily-tracker-git';

const TASKS = [
    { id: 'dsa', label: 'Golden Hour (DSA)', weight: 2 },
    { id: 'commute_morning', label: 'Commute (Audio)', weight: 1 },
    { id: 'college', label: 'College', weight: 1 },
    { id: 'commute_home', label: 'Commute (Home)', weight: 1 },
    { id: 'dev', label: 'Builder Slot (Dev)', weight: 2 },
    { id: 'gate', label: 'GATE Core', weight: 2 },
    { id: 'revision', label: 'Revision', weight: 1 },
];

const TIPS = [
    "Do the hardest thing first (DSA) when your brain is fresh.",
    "Do not be a passive student. Solve GATE PYQs during lectures.",
    "Build active projects. Don't just copy code.",
    "Spaced repetition stops you from forgetting.",
    "Consistency beats intensity.",
];

const SCHEDULE = [
    { time: "05:30 AM", activity: "Wake Up", details: "No snooze. You need this head start to beat the inconsistency." },
    { time: "05:45 AM - 06:45 AM", activity: "☕ The Golden Hour (DSA)", details: "Subject: Data Structures (Java). Task: Striver A2Z Sheet. Arrays/Linked Lists. Why: Your brain is fresh. Do the hardest thing first." },
    { time: "07:00 AM - 08:00 AM", activity: "Chores & Ready", details: "Bath, Breakfast, Pack bag. Leave home at 8:00 AM sharp." },
    { time: "08:00 AM - 08:40 AM", activity: "Commute", details: "Audio Learning: Listen to a podcast on System Design or review Network Security concepts mentally." },
    { time: "08:40 AM - 03:20 PM", activity: "🏫 College (The Battlefield)", details: "Strategy: Do not be a passive student. • Boring Lectures: Solve GATE PYQs for Compiler Design or Network Security .+1 • Labs: Code your Web Tech assignments (Servlets/JSP). Don't copy. Build them." },
    { time: "03:20 PM - 04:30 PM", activity: "Commute Home", details: "Decompress. Listen to music. Switch off \"College Mode.\"" },
    { time: "04:30 PM - 05:30 PM", activity: "Refresh & Reset", details: "Snacks. Shower if needed. Phone rules: No Reels. 15 mins max for messages." },
    { time: "05:30 PM - 07:00 PM", activity: "💻 The Builder Slot (Dev)", details: "Subject: Web Technologies / GSoC Prep. Focus: Java Backend (Spring Boot / Servlets). Task: Work on your Student Management System or browse Checkstyle/Honeynet issues." },
    { time: "07:00 PM - 07:15 PM", activity: "Break", details: "Walk around the house. No screens." },
    { time: "07:15 PM - 08:45 PM", activity: "📚 GATE Core (The Rank)", details: "Subjects: Network Security & Compiler Design. +1 Task: Study one concept (e.g., RSA Algorithm, Parsing) and solve 10 PYQs." },
    { time: "08:45 PM - 09:30 PM", activity: "Dinner & Family", details: "Eat light (no heavy rice). Talk to humans." },
    { time: "09:30 PM - 10:15 PM", activity: "🔄 Revision & Aptitude", details: "Task: 30 mins of GATE Aptitude OR Revise the DSA problem you solved at 5:45 AM. Why: Spaced repetition stops you from forgetting." },
    { time: "10:15 PM", activity: "The Lockdown", details: "Phone away. Laptop closed." },
    { time: "10:30 PM", activity: "Sleep", details: "Non-negotiable. If you don't sleep now, you miss the 5:30 AM slot, and the cycle fails." },
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
        // Get commit count from API
        fetchCommitCount();

        // Load plans
        const savedPlans = localStorage.getItem('daily-tracker-plans');
        if (savedPlans) {
            setPlans(JSON.parse(savedPlans));
        }
    }, []);

    const [plans, setPlans] = useState({});
    const [showPlanningModal, setShowPlanningModal] = useState(false);

    const savePlan = (dateKey, planData) => {
        const updatedPlans = { ...plans, [dateKey]: planData };
        setPlans(updatedPlans);
        localStorage.setItem('daily-tracker-plans', JSON.stringify(updatedPlans));
        setShowPlanningModal(false);
    };

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

        const startDate = new Date(2025, 11, 22); // Dec 22, 2025
        const endDate = new Date(2026, 3, 22);    // Apr 22, 2026

        const dates = [];
        for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
            const current = new Date(d);
            if (current >= startDate && current <= endDate) {
                dates.push(current);
            }
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

        // Limit navigation (Dec 2025 - Apr 2026)
        const minDate = new Date(2025, 11, 1);
        const maxDate = new Date(2026, 3, 1);

        if (newMonth < minDate || newMonth > maxDate) return;

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
                    <button
                        onClick={() => setShowPlanningModal(true)}
                        className="px-4 py-2 rounded-lg text-sm font-bold text-indigo-600 hover:bg-indigo-50 transition-all border-l ml-1"
                    >
                        Plan Tomorrow
                    </button>
                </div>
            </header>

            {plans[formatDateKey(new Date())] && (
                <div className="max-w-6xl mx-auto mb-6 bg-indigo-50 p-6 rounded-2xl border border-indigo-100">
                    <h3 className="text-lg font-bold text-indigo-900 mb-4">🎯 TODAY'S MISSION</h3>
                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="bg-white p-4 rounded-xl shadow-sm">
                            <p className="text-xs font-bold text-indigo-400 uppercase mb-1">DSA Focus</p>
                            <p className="font-medium text-slate-800">{plans[formatDateKey(new Date())].dsa || 'No specific plan'}</p>
                        </div>
                        <div className="bg-white p-4 rounded-xl shadow-sm">
                            <p className="text-xs font-bold text-indigo-400 uppercase mb-1">Dev Focus</p>
                            <p className="font-medium text-slate-800">{plans[formatDateKey(new Date())].dev || 'No specific plan'}</p>
                        </div>
                        <div className="bg-white p-4 rounded-xl shadow-sm">
                            <p className="text-xs font-bold text-indigo-400 uppercase mb-1">GATE Focus</p>
                            <p className="font-medium text-slate-800">{plans[formatDateKey(new Date())].gate || 'No specific plan'}</p>
                        </div>
                    </div>
                </div>
            )}

            <main className="max-w-6xl mx-auto space-y-6">
                {/* Quick Stats Bar */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard
                        label="Consistency Score"
                        value={`${globalStats.percentage}%`}
                    />
                    <StatCard
                        label="Perfect Days"
                        value={globalStats.perfectDays}
                    />
                    <StatCard
                        label="Today's Commits"
                        value={commitCount}
                    />
                    <StatCard
                        label="Month Score"
                        value={`${globalStats.currentScore}/${globalStats.maxScore}`}
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
                                                <span className="hidden md:inline">{task.label}</span>
                                                <span className="md:hidden">{task.id.toUpperCase().slice(0, 3)}</span>
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

                                        const startDate = new Date(2025, 11, 22); // Dec 22, 2025
                                        const endDate = new Date(2026, 3, 22);    // Apr 22, 2026
                                        const isOutOfRange = date < startDate || date > endDate;

                                        return (
                                            <tr
                                                key={key}
                                                className={`border-b transition-colors ${isOutOfRange ? 'opacity-30 pointer-events-none bg-slate-100' :
                                                    isToday ? 'bg-indigo-50/50' :
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
                                                            disabled={isOutOfRange}
                                                            onClick={() => toggleTask(key, task.id)}
                                                            className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all shadow-sm border font-black text-lg mx-auto ${dayData[task.id] === 1
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
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 md:col-span-2">
                            <h3 className="text-lg font-bold mb-6 text-slate-800 border-b pb-2">
                                DAILY SCHEDULE
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
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                            <h3 className="text-lg font-bold mb-6 text-slate-800 border-b pb-2">
                                SCORING CRITERIA
                            </h3>
                            <div className="space-y-4">
                                {TASKS.map(task => (
                                    <div key={task.id} className="flex items-start gap-4 p-3 rounded-lg border border-slate-100">
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
                            <div className="bg-slate-800 p-6 rounded-xl shadow-sm text-white">
                                <h3 className="text-lg font-bold mb-4 text-white border-b border-slate-700 pb-2">
                                    COMMIT TRACKING
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

                            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                                <h3 className="text-lg font-bold mb-4 text-slate-800 border-b pb-2">STRATEGIC REMINDERS</h3>
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

            {showPlanningModal && (
                <PlanningModal
                    onClose={() => setShowPlanningModal(false)}
                    onSave={savePlan}
                />
            )}
        </div>
    );
};

const PlanningModal = ({ onClose, onSave }) => {
    // Calculate tomorrow's date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const year = tomorrow.getFullYear();
    const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const day = String(tomorrow.getDate()).padStart(2, '0');
    const dateKey = `${year}-${month}-${day}`;
    const displayDate = tomorrow.toLocaleDateString('default', { weekday: 'long', month: 'long', day: 'numeric' });

    const [dsa, setDsa] = useState('');
    const [dev, setDev] = useState('');
    const [gate, setGate] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(dateKey, { dsa, dev, gate });
    };

    return (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 animate-in slide-in-from-bottom-4">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">Plan for Tomorrow</h2>
                        <p className="text-slate-500 font-medium">{displayDate}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <span className="text-2xl">&times;</span>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">
                            ☕ The Golden Hour (DSA) <span className="text-slate-400 font-normal ml-1">(05:45 AM - 06:45 AM)</span>
                        </label>
                        <input
                            type="text"
                            value={dsa}
                            onChange={e => setDsa(e.target.value)}
                            placeholder="e.g. Arrays, Linked Lists, Striver Sheet..."
                            className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">
                            💻 The Builder Slot (Dev) <span className="text-slate-400 font-normal ml-1">(05:30 PM - 07:00 PM)</span>
                        </label>
                        <textarea
                            value={dev}
                            onChange={e => setDev(e.target.value)}
                            placeholder="e.g. Spring Boot setup, Student Mgmt System..."
                            className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all h-24 resize-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">
                            📚 GATE Core (The Rank) <span className="text-slate-400 font-normal ml-1">(07:15 PM - 08:45 PM)</span>
                        </label>
                        <input
                            type="text"
                            value={gate}
                            onChange={e => setGate(e.target.value)}
                            placeholder="e.g. Network Security, RSA Algorithm..."
                            className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                        />
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all"
                        >
                            Commit Plan
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const StatCard = ({ label, value }) => (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-tight mb-1">{label}</p>
            <p className="text-2xl font-black text-slate-800">{value}</p>
        </div>
    </div>
);

export default App;
