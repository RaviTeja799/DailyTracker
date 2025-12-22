const fs = require('fs').promises;
const path = require('path');

class DataManager {
  constructor(baseDir = './data') {
    this.baseDir = baseDir;
  }

  /**
   * Get the file path for a specific date
   * Format: data/YYYY/MM/DD.json
   */
  getFilePath(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    
    return path.join(this.baseDir, String(year), month, `${day}.json`);
  }

  /**
   * Ensure directory exists
   */
  async ensureDirectory(filePath) {
    const dir = path.dirname(filePath);
    try {
      await fs.mkdir(dir, { recursive: true });
    } catch (error) {
      console.error('Error creating directory:', error);
    }
  }

  /**
   * Get default data structure for a new day
   */
  getDefaultData(date) {
    const now = new Date().toISOString();
    return {
      date: date,
      tasks: [
        {
          id: 'exercise',
          category: 'Exercise',
          type: 'toggle',
          value: false,
          updatedAt: now
        },
        {
          id: 'dsa',
          category: 'DSA',
          type: 'topic',
          topic: '',
          done: false,
          updatedAt: now
        },
        {
          id: 'cybersecurity',
          category: 'Cyber Security',
          type: 'topic',
          topic: '',
          done: false,
          updatedAt: now
        }
      ],
      commitCount: 0,
      metadata: {
        createdAt: now,
        lastUpdatedAt: now
      }
    };
  }

  /**
   * Read data for a specific date
   */
  async readData(date) {
    const filePath = this.getFilePath(date);
    
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      if (error.code === 'ENOENT') {
        // File doesn't exist, return default data
        return this.getDefaultData(date);
      }
      throw error;
    }
  }

  /**
   * Write data for a specific date
   */
  async writeData(date, data) {
    const filePath = this.getFilePath(date);
    await this.ensureDirectory(filePath);
    
    // Update metadata
    data.metadata.lastUpdatedAt = new Date().toISOString();
    
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return filePath;
  }

  /**
   * Update a specific task
   */
  async updateTask(date, taskId, updates) {
    const data = await this.readData(date);
    const task = data.tasks.find(t => t.id === taskId);
    
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    // Apply updates
    Object.assign(task, updates);
    task.updatedAt = new Date().toISOString();
    
    // Increment commit count
    data.commitCount++;
    
    await this.writeData(date, data);
    return data;
  }
}

module.exports = DataManager;
