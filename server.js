import express from 'express';
import cors from 'cors';
import GitManager from './git-manager.js';

const app = express();
const PORT = 3000;

// Initialize Git manager
const gitManager = new GitManager();

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Git on startup
gitManager.initialize();

/**
 * Update a task and create Git commit
 */
app.post('/api/update', async (req, res) => {
    try {
        const { date, taskId, value, action, details } = req.body;

        // Create Git commit
        const commitResult = await gitManager.createCommit(action, details);

        res.json({
            success: true,
            commit: commitResult
        });
    } catch (error) {
        console.error('Error in /api/update:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Get commit statistics
 */
app.get('/api/stats', async (req, res) => {
    try {
        const todayCount = await gitManager.getTodayCommitCount();
        const totalCount = await gitManager.getCommitCount();
        const recentCommits = await gitManager.getRecentCommits(10);

        res.json({
            todayCount,
            totalCount,
            recentCommits
        });
    } catch (error) {
        console.error('Error in /api/stats:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Health check
 */
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Daily Tracker API is running' });
});

// Start server
app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║       🚀 Daily Tracker API Running 🚀                ║
║                                                       ║
║       📍 Backend: http://localhost:${PORT}               ║
║       📍 Frontend: http://localhost:5173              ║
║                                                       ║
║       Track your progress with automatic Git commits! ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
    `);
});
