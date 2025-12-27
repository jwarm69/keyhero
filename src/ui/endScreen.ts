// End-game stats screen for KeyHero
// Displays final score, accuracy, grade, and stats with restart button

import type { GameStats } from '../game/scoring.js';

export class EndScreen {
  private overlay: HTMLDivElement | null = null;
  private restartCallback: (() => void) | null = null;

  constructor() {
    this.createOverlay();
  }

  /**
   * Create the overlay DOM element (hidden by default)
   */
  private createOverlay(): void {
    this.overlay = document.createElement('div');
    this.overlay.id = 'end-screen-overlay';
    this.overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.95);
      display: none;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      z-index: 2000;
      font-family: Arial, sans-serif;
      color: white;
    `;
    document.body.appendChild(this.overlay);
  }

  /**
   * Show the end screen with game statistics
   */
  show(stats: GameStats, score: number, accuracy: number, grade: string): void {
    if (!this.overlay) return;

    // Get grade color
    const gradeColor = this.getGradeColor(grade);

    // Build the content
    this.overlay.innerHTML = `
      <div style="
        background: rgba(26, 26, 46, 0.98);
        border-radius: 20px;
        padding: 50px 80px;
        box-shadow: 0 10px 50px rgba(0, 0, 0, 0.5);
        text-align: center;
        max-width: 600px;
        border: 3px solid ${gradeColor};
      ">
        <h1 style="
          font-size: 48px;
          margin: 0 0 20px 0;
          color: #ffffff;
          text-shadow: 0 0 20px rgba(255, 255, 255, 0.5);
        ">GAME OVER</h1>
        
        <div style="
          font-size: 72px;
          font-weight: bold;
          margin: 30px 0;
          color: ${gradeColor};
          text-shadow: 0 0 30px ${gradeColor};
        ">${grade}</div>
        
        <div style="
          font-size: 48px;
          font-weight: bold;
          margin: 20px 0;
          color: #ffd700;
        ">${score.toLocaleString()}</div>
        
        <div style="
          font-size: 24px;
          color: #aaaaaa;
          margin-bottom: 30px;
        ">Final Score</div>
        
        <div style="
          font-size: 32px;
          margin: 20px 0;
          color: #4ecdc4;
        ">${accuracy.toFixed(1)}%</div>
        
        <div style="
          font-size: 18px;
          color: #aaaaaa;
          margin-bottom: 40px;
        ">Accuracy</div>
        
        <div style="
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin: 30px 0;
          font-size: 18px;
        ">
          <div style="text-align: right; color: #888;">Perfect:</div>
          <div style="text-align: left; color: #ffd700; font-weight: bold;">${stats.perfectCount}</div>
          
          <div style="text-align: right; color: #888;">Good:</div>
          <div style="text-align: left; color: #4ecdc4; font-weight: bold;">${stats.goodCount}</div>
          
          <div style="text-align: right; color: #888;">Miss:</div>
          <div style="text-align: left; color: #ff6b6b; font-weight: bold;">${stats.missCount}</div>
          
          <div style="text-align: right; color: #888;">Max Combo:</div>
          <div style="text-align: left; color: #ff9ff3; font-weight: bold;">${stats.maxCombo}</div>
        </div>
        
        <button id="restart-button" style="
          margin-top: 40px;
          padding: 20px 60px;
          font-size: 24px;
          font-weight: bold;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 50px;
          cursor: pointer;
          box-shadow: 0 5px 20px rgba(102, 126, 234, 0.4);
          transition: all 0.3s ease;
          text-transform: uppercase;
          letter-spacing: 2px;
        " onmouseover="this.style.transform='scale(1.05)'; this.style.boxShadow='0 8px 30px rgba(102, 126, 234, 0.6)';" 
           onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 5px 20px rgba(102, 126, 234, 0.4)';"
           onmousedown="this.style.transform='scale(0.98)';"
           onmouseup="this.style.transform='scale(1.05)';">
          Play Again
        </button>
      </div>
    `;

    // Show overlay
    this.overlay.style.display = 'flex';

    // Attach restart button handler
    const restartButton = document.getElementById('restart-button');
    if (restartButton && this.restartCallback) {
      restartButton.addEventListener('click', () => {
        if (this.restartCallback) {
          this.restartCallback();
        }
      });
    }
  }

  /**
   * Hide the end screen
   */
  hide(): void {
    if (this.overlay) {
      this.overlay.style.display = 'none';
    }
  }

  /**
   * Register a callback for restart button
   */
  onRestart(callback: () => void): void {
    this.restartCallback = callback;
  }

  /**
   * Get color for grade
   */
  private getGradeColor(grade: string): string {
    switch (grade) {
      case 'S': return '#ffd700'; // Gold
      case 'A': return '#4ecdc4'; // Cyan
      case 'B': return '#95e1d3'; // Light cyan
      case 'C': return '#f38181'; // Light red
      case 'D': return '#ff6b6b'; // Red
      case 'F': return '#aa4465'; // Dark red
      default: return '#888888'; // Gray
    }
  }

  /**
   * Clean up and remove overlay
   */
  destroy(): void {
    if (this.overlay && this.overlay.parentElement) {
      this.overlay.parentElement.removeChild(this.overlay);
      this.overlay = null;
    }
  }
}


