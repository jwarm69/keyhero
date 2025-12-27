// Leaderboard view component
// Displays per-song and global leaderboards with tabbed interface

import type { Difficulty } from '../types.js';
import { leaderboardService, type LeaderboardEntry } from '../api/leaderboardService.js';

export class LeaderboardView {
  private container: HTMLDivElement | null = null;
  private currentTab: 'song' | 'global' = 'song';
  private songId: string | null = null;
  private difficulty: Difficulty | null = null;
  
  constructor() {
    this.createContainer();
  }
  
  private createContainer(): void {
    this.container = document.createElement('div');
    this.container.id = 'leaderboard-container';
    this.container.style.cssText = `
      width: 100%;
      max-width: 700px;
      margin-top: 30px;
    `;
  }
  
  /**
   * Show leaderboard for specific song
   */
  async show(songId: string, difficulty: Difficulty): Promise<void> {
    this.songId = songId;
    this.difficulty = difficulty;
    this.currentTab = 'song';
    await this.render();
  }
  
  /**
   * Refresh current leaderboard
   */
  async refresh(): Promise<void> {
    await this.render();
  }
  
  /**
   * Render the leaderboard UI
   */
  private async render(): Promise<void> {
    if (!this.container) return;
    
    // Show loading state
    this.container.innerHTML = `
      <div style="text-align: center; padding: 20px; color: #aaa;">
        Loading leaderboard...
      </div>
    `;
    
    try {
      let entries: LeaderboardEntry[] = [];
      
      if (this.currentTab === 'song' && this.songId && this.difficulty) {
        entries = await leaderboardService.getLeaderboard(this.songId, this.difficulty, 10);
      } else if (this.currentTab === 'global') {
        entries = await leaderboardService.getGlobalLeaderboard(10);
      }
      
      this.container.innerHTML = this.renderLeaderboard(entries);
      this.attachEventListeners();
    } catch (error) {
      console.error('Error loading leaderboard:', error);
      this.container.innerHTML = `
        <div style="text-align: center; padding: 20px; color: #ff6b6b;">
          Failed to load leaderboard. Backend may be offline.
        </div>
      `;
    }
  }
  
  private renderLeaderboard(entries: LeaderboardEntry[]): string {
    return `
      <div style="
        background: rgba(0, 0, 0, 0.5);
        border-radius: 15px;
        padding: 20px;
      ">
        <div style="
          display: flex;
          justify-content: center;
          gap: 10px;
          margin-bottom: 20px;
        ">
          <button id="tab-song" style="
            padding: 10px 30px;
            font-size: 16px;
            background: ${this.currentTab === 'song' ? '#667eea' : 'rgba(255, 255, 255, 0.1)'};
            color: white;
            border: none;
            border-radius: 25px;
            cursor: pointer;
            transition: all 0.3s ease;
          ">Song</button>
          
          <button id="tab-global" style="
            padding: 10px 30px;
            font-size: 16px;
            background: ${this.currentTab === 'global' ? '#667eea' : 'rgba(255, 255, 255, 0.1)'};
            color: white;
            border: none;
            border-radius: 25px;
            cursor: pointer;
            transition: all 0.3s ease;
          ">Global</button>
        </div>
        
        <h3 style="
          font-size: 24px;
          margin: 0 0 20px 0;
          text-align: center;
          color: #ffffff;
        ">${this.currentTab === 'song' ? 'Song Leaderboard' : 'Global Leaderboard'}</h3>
        
        ${entries.length === 0 ? `
          <div style="text-align: center; padding: 30px; color: #aaa;">
            No scores yet. Be the first!
          </div>
        ` : `
          <div style="
            display: flex;
            flex-direction: column;
            gap: 10px;
          ">
            ${entries.map(entry => this.renderLeaderboardEntry(entry)).join('')}
          </div>
        `}
      </div>
    `;
  }
  
  private renderLeaderboardEntry(entry: LeaderboardEntry): string {
    const rankColor = entry.rank === 1 ? '#ffd700' : entry.rank === 2 ? '#c0c0c0' : entry.rank === 3 ? '#cd7f32' : '#888';
    
    return `
      <div style="
        background: rgba(255, 255, 255, 0.05);
        border-radius: 10px;
        padding: 15px 20px;
        display: grid;
        grid-template-columns: auto 1fr auto auto;
        gap: 15px;
        align-items: center;
      ">
        <div style="
          font-size: 24px;
          font-weight: bold;
          color: ${rankColor};
          min-width: 40px;
        ">#${entry.rank}</div>
        
        <div>
          <div style="font-size: 18px; font-weight: bold;">${this.escapeHtml(entry.playerName)}</div>
          ${entry.songId ? `
            <div style="font-size: 12px; color: #888; margin-top: 2px;">
              ${entry.songId} - ${entry.difficulty}
            </div>
          ` : ''}
        </div>
        
        <div style="text-align: right;">
          <div style="font-size: 20px; font-weight: bold; color: #ffd700;">
            ${entry.score.toLocaleString()}
          </div>
          <div style="font-size: 14px; color: #4ecdc4;">
            ${entry.accuracy.toFixed(1)}%
          </div>
        </div>
        
        <div style="
          font-size: 24px;
          font-weight: bold;
          color: ${this.getGradeColor(entry.grade)};
        ">${entry.grade}</div>
      </div>
    `;
  }
  
  private attachEventListeners(): void {
    const songTab = document.getElementById('tab-song');
    const globalTab = document.getElementById('tab-global');
    
    if (songTab) {
      songTab.addEventListener('click', () => {
        this.currentTab = 'song';
        this.render();
      });
    }
    
    if (globalTab) {
      globalTab.addEventListener('click', () => {
        this.currentTab = 'global';
        this.render();
      });
    }
  }
  
  private getGradeColor(grade: string): string {
    switch (grade) {
      case 'S': return '#ffd700';
      case 'A': return '#4ecdc4';
      case 'B': return '#95e1d3';
      case 'C': return '#f38181';
      case 'D': return '#ff6b6b';
      case 'F': return '#aa4465';
      default: return '#888888';
    }
  }
  
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  /**
   * Get the container element to append to parent
   */
  getElement(): HTMLDivElement | null {
    return this.container;
  }
  
  /**
   * Destroy the component
   */
  destroy(): void {
    if (this.container && this.container.parentElement) {
      this.container.parentElement.removeChild(this.container);
      this.container = null;
    }
  }
}


