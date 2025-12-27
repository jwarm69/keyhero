// Leaderboard service for communicating with backend API
// Handles score submission and leaderboard retrieval

import type { Difficulty, GameStats } from '../types.js';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface ScoreSubmission {
  playerName: string;
  songId: string;
  difficulty: Difficulty;
  score: number;
  accuracy: number;
  maxCombo: number;
  grade: string;
  perfectCount?: number;
  goodCount?: number;
  missCount?: number;
}

export interface LeaderboardEntry {
  rank: number;
  playerName: string;
  score: number;
  accuracy: number;
  maxCombo: number;
  grade: string;
  date: string;
  songId?: string; // Only present in global leaderboard
  difficulty?: string; // Only present in global leaderboard
}

export interface ScoreSubmissionResponse {
  success: boolean;
  id: number;
  rank: number;
}

export class LeaderboardService {
  private baseUrl: string;
  
  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }
  
  /**
   * Submit a score to the leaderboard
   */
  async submitScore(data: ScoreSubmission): Promise<ScoreSubmissionResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/scores`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit score');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error submitting score:', error);
      throw error;
    }
  }
  
  /**
   * Get leaderboard for a specific song and difficulty
   */
  async getLeaderboard(
    songId: string,
    difficulty: Difficulty,
    limit: number = 10
  ): Promise<LeaderboardEntry[]> {
    try {
      const params = new URLSearchParams({
        songId,
        difficulty,
        limit: limit.toString(),
      });
      
      const response = await fetch(
        `${this.baseUrl}/api/leaderboard?${params}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch leaderboard');
      }
      
      const data = await response.json();
      return data.leaderboard || [];
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      throw error;
    }
  }
  
  /**
   * Get global leaderboard (all songs, all difficulties)
   */
  async getGlobalLeaderboard(limit: number = 10): Promise<LeaderboardEntry[]> {
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
      });
      
      const response = await fetch(
        `${this.baseUrl}/api/leaderboard/global?${params}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch global leaderboard');
      }
      
      const data = await response.json();
      return data.leaderboard || [];
    } catch (error) {
      console.error('Error fetching global leaderboard:', error);
      throw error;
    }
  }
  
  /**
   * Check if backend is available
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/health`, {
        method: 'GET',
      });
      
      return response.ok;
    } catch (error) {
      console.error('Backend health check failed:', error);
      return false;
    }
  }
  
  /**
   * Create score submission from game stats
   */
  createScoreSubmission(
    playerName: string,
    songId: string,
    difficulty: Difficulty,
    score: number,
    accuracy: number,
    grade: string,
    stats: GameStats
  ): ScoreSubmission {
    return {
      playerName,
      songId,
      difficulty,
      score,
      accuracy,
      grade,
      maxCombo: stats.maxCombo,
      perfectCount: stats.perfectCount,
      goodCount: stats.goodCount,
      missCount: stats.missCount,
    };
  }
}

// Singleton instance
export const leaderboardService = new LeaderboardService();

// Local storage helpers
export class PlayerStorage {
  private static PLAYER_NAME_KEY = 'keyhero_player_name';
  
  /**
   * Get saved player name from localStorage
   */
  static getPlayerName(): string | null {
    try {
      return localStorage.getItem(this.PLAYER_NAME_KEY);
    } catch (error) {
      console.error('Error reading player name from localStorage:', error);
      return null;
    }
  }
  
  /**
   * Save player name to localStorage
   */
  static savePlayerName(name: string): void {
    try {
      localStorage.setItem(this.PLAYER_NAME_KEY, name);
    } catch (error) {
      console.error('Error saving player name to localStorage:', error);
    }
  }
  
  /**
   * Clear saved player name
   */
  static clearPlayerName(): void {
    try {
      localStorage.removeItem(this.PLAYER_NAME_KEY);
    } catch (error) {
      console.error('Error clearing player name from localStorage:', error);
    }
  }
}


