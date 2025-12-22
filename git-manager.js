import simpleGit from 'simple-git';
import fs from 'fs';
import path from 'path';

class GitManager {
    constructor(repoPath = './') {
        this.git = simpleGit(repoPath);
        this.repoPath = repoPath;
    }

    /**
     * Initialize Git repository if not already initialized
     */
    async initialize() {
        try {
            const isRepo = await this.git.checkIsRepo();
            if (!isRepo) {
                await this.git.init();
                console.log('✅ Git repository initialized');

                // Create initial commit with .gitignore
                try {
                    await this.git.add('.gitignore');
                    await this.git.commit('Initial commit: Daily Tracker setup');
                } catch (e) {
                    // Ignore if .gitignore doesn't exist yet
                    console.log('⚠️ Initial commit skipped (no files to commit)');
                }
            } else {
                console.log('✅ Git repository already initialized');
            }
        } catch (error) {
            console.error('Error initializing Git:', error.message);
        }
    }

    /**
     * Create daily progress file and 5 commits
     */
    async createDailyCommit(date, data) {
        try {
            // 1. Create tracking directory if it doesn't exist
            const trackingDir = path.join(this.repoPath, 'tracking');
            if (!fs.existsSync(trackingDir)) {
                fs.mkdirSync(trackingDir, { recursive: true });
            }

            // 2. Create/Update the day's JSON file
            const filePath = path.join(trackingDir, `${date}.json`);
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

            // 3. Stage and Commit the file (Commit #1)
            await this.git.add(filePath);
            await this.git.commit(`Update tracking data for ${date}`);

            // 4. Create 4 more empty commits (Commits #2-5)
            for (let i = 2; i <= 5; i++) {
                const timestamp = new Date().toISOString();
                await this.git.raw(['commit', '--allow-empty', '-m', `Progress sync #${i} for ${date} [${timestamp}]`]);
            }

            // 5. Push changes
            await this.git.push();

            console.log(`✅ 5 Commits created and pushed for ${date}`);
            return { success: true, message: "5 commits created and pushed" };

        } catch (error) {
            console.error('Error in createDailyCommit:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Create a commit with a descriptive message
     */
    async createCommit(action, details) {
        try {
            // Check if there are any changes to commit
            const status = await this.git.status();

            // If no changes in working directory, stage all changes
            // This handles the case where data is in localStorage
            // We'll create a dummy commit or you can modify to track a data file

            // For now, let's create a commit even without file changes
            // by using --allow-empty flag through raw git command
            const timestamp = new Date().toLocaleString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });

            const message = `${action} [${timestamp}]\n\n${details}`;

            try {
                // Try to commit with allow-empty in case there are no file changes
                await this.git.raw(['commit', '--allow-empty', '-m', message]);
                console.log(`✅ Commit created: ${action}`);

                return {
                    success: true,
                    message: message
                };
            } catch (commitError) {
                // If commit fails, it might be because there's no user configured
                console.warn('⚠️ Git commit failed:', commitError.message);
                return {
                    success: false,
                    error: commitError.message
                };
            }
        } catch (error) {
            console.error('Error creating commit:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get total commit count
     */
    async getCommitCount() {
        try {
            const log = await this.git.log();
            return log.total;
        } catch (error) {
            console.error('Error getting commit count:', error.message);
            return 0;
        }
    }

    /**
     * Get today's commit count
     */
    async getTodayCommitCount() {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const log = await this.git.log();
            const todayCommits = log.all.filter(commit => {
                const commitDate = new Date(commit.date);
                commitDate.setHours(0, 0, 0, 0);
                return commitDate.getTime() === today.getTime();
            });

            return todayCommits.length;
        } catch (error) {
            console.error('Error getting today\'s commit count:', error.message);
            return 0;
        }
    }

    /**
     * Get recent commits
     */
    async getRecentCommits(count = 10) {
        try {
            const log = await this.git.log({ maxCount: count });
            return log.all.map(commit => ({
                hash: commit.hash.substring(0, 7),
                message: commit.message,
                date: commit.date,
                author: commit.author_name
            }));
        } catch (error) {
            console.error('Error getting recent commits:', error.message);
            return [];
        }
    }
}

export default GitManager;
