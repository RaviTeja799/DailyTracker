// API Configuration
const API_BASE = 'http://localhost:3000/api';

// State Management
let currentDate = new Date();
let currentData = null;
let debounceTimers = {};

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
    loadTodayData();
});

/**
 * Initialize the application
 */
function initializeApp() {
    updateDateDisplay();
    console.log('🚀 Daily Tracker initialized');
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Date navigation
    document.getElementById('prevDay').addEventListener('click', () => navigateDate(-1));
    document.getElementById('nextDay').addEventListener('click', () => navigateDate(1));

    // Exercise toggle
    document.getElementById('exerciseToggle').addEventListener('change', handleExerciseToggle);

    // DSA inputs
    document.getElementById('dsaTopic').addEventListener('input', (e) => handleTopicInput('dsa', e.target.value));
    document.getElementById('dsaDone').addEventListener('change', (e) => handleCheckboxChange('dsa', e.target.checked));

    // Cyber Security inputs
    document.getElementById('cyberTopic').addEventListener('input', (e) => handleTopicInput('cybersecurity', e.target.value));
    document.getElementById('cyberDone').addEventListener('change', (e) => handleCheckboxChange('cybersecurity', e.target.checked));
}

/**
 * Load data for today
 */
async function loadTodayData() {
    currentDate = new Date();
    await loadData();
}

/**
 * Load data for current date
 */
async function loadData() {
    const dateStr = formatDate(currentDate);

    try {
        const response = await fetch(`${API_BASE}/data/${dateStr}`);
        const data = await response.json();
        currentData = data;

        updateUI(data);
        await updateStats();
    } catch (error) {
        console.error('Error loading data:', error);
        showToast('Failed to load data', 'error');
    }
}

/**
 * Update UI with data
 */
function updateUI(data) {
    // Update exercise toggle
    const exerciseTask = data.tasks.find(t => t.id === 'exercise');
    const exerciseToggle = document.getElementById('exerciseToggle');
    exerciseToggle.checked = exerciseTask?.value || false;
    updateExerciseStatus(exerciseTask?.value || false);

    // Update DSA
    const dsaTask = data.tasks.find(t => t.id === 'dsa');
    document.getElementById('dsaTopic').value = dsaTask?.topic || '';
    document.getElementById('dsaDone').checked = dsaTask?.done || false;

    // Update Cyber Security
    const cyberTask = data.tasks.find(t => t.id === 'cybersecurity');
    document.getElementById('cyberTopic').value = cyberTask?.topic || '';
    document.getElementById('cyberDone').checked = cyberTask?.done || false;
}

/**
 * Update statistics
 */
async function updateStats() {
    try {
        const response = await fetch(`${API_BASE}/stats`);
        const stats = await response.json();

        updateCommitProgress(stats.todayCount);
        updateRecentCommits(stats.recentCommits);
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

/**
 * Update commit progress
 */
function updateCommitProgress(count) {
    const progress = Math.min((count / 10) * 100, 100);
    const countElement = document.getElementById('commitCount');
    const fillElement = document.getElementById('progressFill');
    const messageElement = document.getElementById('progressMessage');

    countElement.textContent = `${count}/10`;
    fillElement.style.width = `${progress}%`;

    // Update message based on progress
    if (count === 0) {
        messageElement.textContent = "Let's get started! 🚀";
    } else if (count < 5) {
        messageElement.textContent = "Great start! Keep going! 💪";
    } else if (count < 10) {
        messageElement.textContent = `Almost there! ${10 - count} more to go! 🔥`;
    } else {
        messageElement.textContent = "Goal achieved! You're crushing it! 🎉";
        fillElement.classList.add('complete');
    }
}

/**
 * Update recent commits list
 */
function updateRecentCommits(commits) {
    const container = document.getElementById('recentCommits');

    if (!commits || commits.length === 0) {
        container.innerHTML = '<div class="activity-empty">No commits yet today. Start tracking!</div>';
        return;
    }

    container.innerHTML = commits.map(commit => `
        <div class="activity-item">
            <strong>${commit.hash}</strong> - ${commit.message}
        </div>
    `).join('');
}

/**
 * Handle exercise toggle
 */
async function handleExerciseToggle(e) {
    const value = e.target.checked;
    updateExerciseStatus(value);

    await updateTask('exercise', { value },
        value ? 'Exercise completed' : 'Exercise unchecked',
        value ? 'Marked exercise as done' : 'Unmarked exercise'
    );
}

/**
 * Update exercise status display
 */
function updateExerciseStatus(value) {
    const statusElement = document.getElementById('exerciseStatus');
    statusElement.textContent = value ? '✅ Completed today!' : 'Not completed';
    statusElement.style.color = value ? 'var(--accent-green)' : 'var(--text-muted)';
}

/**
 * Handle topic input with debounce
 */
function handleTopicInput(taskId, value) {
    // Clear existing timer
    if (debounceTimers[taskId]) {
        clearTimeout(debounceTimers[taskId]);
    }

    // Set new timer
    debounceTimers[taskId] = setTimeout(async () => {
        if (value.trim()) {
            const category = taskId === 'dsa' ? 'DSA' : 'Cyber Security';
            await updateTask(taskId, { topic: value },
                `${category} topic updated`,
                `Studying: ${value}`
            );
        }
    }, 1000); // Wait 1 second after user stops typing
}

/**
 * Handle checkbox change
 */
async function handleCheckboxChange(taskId, checked) {
    const category = taskId === 'dsa' ? 'DSA' : 'Cyber Security';
    await updateTask(taskId, { done: checked },
        checked ? `${category} completed` : `${category} unchecked`,
        checked ? `Finished ${category} task` : `Unmarked ${category} task`
    );
}

/**
 * Update task on server
 */
async function updateTask(taskId, updates, action, details) {
    const dateStr = formatDate(currentDate);

    try {
        const response = await fetch(`${API_BASE}/update`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                date: dateStr,
                taskId,
                updates,
                action,
                details
            })
        });

        const result = await response.json();

        if (result.success) {
            currentData = result.data;
            showToast(`✅ ${action} - Commit created!`);
            await updateStats();
        }
    } catch (error) {
        console.error('Error updating task:', error);
        showToast('Failed to save changes', 'error');
    }
}

/**
 * Navigate to different date
 */
function navigateDate(days) {
    currentDate.setDate(currentDate.getDate() + days);
    updateDateDisplay();
    loadData();
}

/**
 * Update date display
 */
function updateDateDisplay() {
    const dateElement = document.getElementById('currentDate');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const current = new Date(currentDate);
    current.setHours(0, 0, 0, 0);

    if (current.getTime() === today.getTime()) {
        dateElement.textContent = 'Today';
    } else {
        const options = { month: 'short', day: 'numeric', year: 'numeric' };
        dateElement.textContent = currentDate.toLocaleDateString('en-US', options);
    }
}

/**
 * Format date as YYYY-MM-DD
 */
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Show toast notification
 */
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const messageElement = toast.querySelector('.toast-message');

    messageElement.textContent = message;
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}
