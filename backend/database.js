// Database module for KeyHero leaderboard
// Uses SQLite for simplicity and portability

import sqlite3 from 'sqlite3';
import { promisify } from 'util';

const sqlite = sqlite3.verbose();

export class Database {
  constructor(dbPath) {
    this.db = new sqlite.Database(dbPath, (err) => {
      if (err) {
        console.error('Error opening database:', err);
      } else {
        console.log('Connected to SQLite database');
        this.initialize();
      }
    });
    
    // Promisify database methods
    this.run = promisify(this.db.run.bind(this.db));
    this.get = promisify(this.db.get.bind(this.db));
    this.all = promisify(this.db.all.bind(this.db));
  }
  
  /**
   * Initialize database schema
   */
  async initialize() {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS scores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        player_name TEXT NOT NULL,
        song_id TEXT NOT NULL,
        difficulty TEXT NOT NULL,
        score INTEGER NOT NULL,
        accuracy REAL NOT NULL,
        max_combo INTEGER NOT NULL,
        grade TEXT NOT NULL,
        perfect_count INTEGER DEFAULT 0,
        good_count INTEGER DEFAULT 0,
        miss_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    const createSongIndexSQL = `
      CREATE INDEX IF NOT EXISTS idx_song_leaderboard 
      ON scores(song_id, difficulty, score DESC)
    `;
    
    const createGlobalIndexSQL = `
      CREATE INDEX IF NOT EXISTS idx_global_leaderboard 
      ON scores(score DESC)
    `;
    
    try {
      await this.run(createTableSQL);
      await this.run(createSongIndexSQL);
      await this.run(createGlobalIndexSQL);
      console.log('Database schema initialized');
    } catch (error) {
      console.error('Error initializing database:', error);
    }
  }
  
  /**
   * Submit a new score
   */
  async submitScore(scoreData) {
    const {
      playerName,
      songId,
      difficulty,
      score,
      accuracy,
      maxCombo,
      grade,
      perfectCount,
      goodCount,
      missCount
    } = scoreData;
    
    const sql = `
      INSERT INTO scores (
        player_name, song_id, difficulty, score, accuracy, max_combo, grade,
        perfect_count, good_count, miss_count
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    try {
      const result = await this.run(sql, [
        playerName,
        songId,
        difficulty,
        score,
        accuracy,
        maxCombo,
        grade,
        perfectCount || 0,
        goodCount || 0,
        missCount || 0
      ]);
      
      return {
        id: result.lastID,
        success: true
      };
    } catch (error) {
      console.error('Error submitting score:', error);
      throw error;
    }
  }
  
  /**
   * Get leaderboard for a specific song and difficulty
   */
  async getSongLeaderboard(songId, difficulty, limit = 10) {
    const sql = `
      SELECT 
        player_name as playerName,
        score,
        accuracy,
        max_combo as maxCombo,
        grade,
        created_at as date
      FROM scores
      WHERE song_id = ? AND difficulty = ?
      ORDER BY score DESC
      LIMIT ?
    `;
    
    try {
      const rows = await this.all(sql, [songId, difficulty, limit]);
      
      // Add rank to each entry
      return rows.map((row, index) => ({
        rank: index + 1,
        ...row
      }));
    } catch (error) {
      console.error('Error getting song leaderboard:', error);
      throw error;
    }
  }
  
  /**
   * Get global leaderboard (all songs, all difficulties)
   */
  async getGlobalLeaderboard(limit = 10) {
    const sql = `
      SELECT 
        player_name as playerName,
        song_id as songId,
        difficulty,
        score,
        accuracy,
        max_combo as maxCombo,
        grade,
        created_at as date
      FROM scores
      ORDER BY score DESC
      LIMIT ?
    `;
    
    try {
      const rows = await this.all(sql, [limit]);
      
      // Add rank to each entry
      return rows.map((row, index) => ({
        rank: index + 1,
        ...row
      }));
    } catch (error) {
      console.error('Error getting global leaderboard:', error);
      throw error;
    }
  }
  
  /**
   * Get player's rank for a specific score
   */
  async getPlayerRank(songId, difficulty, score) {
    const sql = `
      SELECT COUNT(*) + 1 as rank
      FROM scores
      WHERE song_id = ? AND difficulty = ? AND score > ?
    `;
    
    try {
      const result = await this.get(sql, [songId, difficulty, score]);
      return result.rank;
    } catch (error) {
      console.error('Error getting player rank:', error);
      return null;
    }
  }
  
  /**
   * Close database connection
   */
  close() {
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) {
          console.error('Error closing database:', err);
          reject(err);
        } else {
          console.log('Database connection closed');
          resolve();
        }
      });
    });
  }
}



