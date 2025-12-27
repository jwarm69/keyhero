// Difficulty selection screen UI for KeyHero
// Allows player to choose Easy, Medium, or Hard difficulty

import type { Difficulty, SongMetadata } from '../types.js';
import { getSongById, getDifficultyNoteCount } from '../game/songMetadata.js';

export class DifficultySelectScreen {
  private overlay: HTMLDivElement | null = null;
  private onSelectCallback: ((difficulty: Difficulty) => void) | null = null;
  private onBackCallback: (() => void) | null = null;

  constructor() {
    this.createOverlay();
  }

  /**
   * Create the overlay DOM element (hidden by default)
   */
  private createOverlay(): void {
    this.overlay = document.createElement('div');
    this.overlay.id = 'difficulty-select-overlay';
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
      z-index: 1500;
      font-family: Arial, sans-serif;
      color: white;
      overflow-y: auto;
      padding: 40px 20px;
    `;
    document.body.appendChild(this.overlay);
  }

  /**
   * Show the difficulty selection screen for a specific song
   */
  show(songId: string): void {
    if (!this.overlay) return;

    const song = getSongById(songId);
    if (!song) return;

    const difficulties: Array<{
      id: Difficulty;
      name: string;
      description: string;
      color: string;
      gradient: string;
    }> = [
      {
        id: 'easy',
        name: 'Easy',
        description: '1-2 notes per measure, simple patterns',
        color: '#4ecdc4',
        gradient: 'linear-gradient(135deg, #4ecdc4 0%, #44a3b0 100%)'
      },
      {
        id: 'medium',
        name: 'Medium',
        description: '2-4 notes per measure, some chords',
        color: '#ffa500',
        gradient: 'linear-gradient(135deg, #ffa500 0%, #ff8c00 100%)'
      },
      {
        id: 'hard',
        name: 'Hard',
        description: '4+ notes per measure, frequent chords',
        color: '#ff6b6b',
        gradient: 'linear-gradient(135deg, #ff6b6b 0%, #ff5252 100%)'
      }
    ];

    this.overlay.innerHTML = `
      <div style="max-width: 900px; width: 100%;">
        <button id="back-button" style="
          position: absolute;
          top: 30px;
          left: 30px;
          padding: 12px 24px;
          font-size: 16px;
          background: rgba(255, 255, 255, 0.1);
          color: white;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 25px;
          cursor: pointer;
          transition: all 0.3s ease;
        " onmouseover="this.style.background='rgba(255, 255, 255, 0.2)'; this.style.borderColor='rgba(255, 255, 255, 0.5)';" 
           onmouseout="this.style.background='rgba(255, 255, 255, 0.1)'; this.style.borderColor='rgba(255, 255, 255, 0.3)';">
          ← Back
        </button>
        
        <div style="text-align: center; margin-bottom: 50px;">
          <h1 style="
            font-size: 48px;
            margin: 0 0 10px 0;
            color: #ffffff;
            text-shadow: 0 0 20px rgba(255, 255, 255, 0.5);
          ">${song.title}</h1>
          <p style="
            font-size: 20px;
            color: #aaaaaa;
            margin: 0;
          ">Choose Your Difficulty</p>
        </div>
        
        <div style="
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 25px;
        ">
          ${difficulties.map(diff => this.createDifficultyCard(song, diff)).join('')}
        </div>
      </div>
    `;

    // Show overlay
    this.overlay.style.display = 'flex';

    // Attach click handlers
    difficulties.forEach(diff => {
      const button = document.getElementById(`difficulty-btn-${diff.id}`);
      if (button) {
        button.addEventListener('click', () => {
          if (this.onSelectCallback) {
            this.onSelectCallback(diff.id);
          }
        });
      }
    });

    // Attach back button handler
    const backButton = document.getElementById('back-button');
    if (backButton) {
      backButton.addEventListener('click', () => {
        if (this.onBackCallback) {
          this.onBackCallback();
        }
      });
    }
  }

  /**
   * Create HTML for a difficulty card
   */
  private createDifficultyCard(
    song: SongMetadata,
    difficulty: {
      id: Difficulty;
      name: string;
      description: string;
      color: string;
      gradient: string;
    }
  ): string {
    const noteCount = getDifficultyNoteCount(song.id, difficulty.id);

    return `
      <button id="difficulty-btn-${difficulty.id}" style="
        background: ${difficulty.gradient};
        border-radius: 20px;
        padding: 40px 30px;
        cursor: pointer;
        transition: all 0.3s ease;
        border: 3px solid transparent;
        box-shadow: 0 5px 20px rgba(0, 0, 0, 0.3);
        color: white;
        text-align: center;
      " onmouseover="this.style.transform='translateY(-10px) scale(1.05)'; this.style.boxShadow='0 10px 30px ${difficulty.color}66';" 
         onmouseout="this.style.transform='translateY(0) scale(1)'; this.style.boxShadow='0 5px 20px rgba(0, 0, 0, 0.3)';">
        
        <div style="
          font-size: 36px;
          font-weight: bold;
          margin-bottom: 15px;
          text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
        ">${difficulty.name}</div>
        
        <div style="
          font-size: 14px;
          margin-bottom: 20px;
          opacity: 0.9;
          line-height: 1.4;
        ">${difficulty.description}</div>
        
        <div style="
          background: rgba(0, 0, 0, 0.2);
          border-radius: 10px;
          padding: 15px;
          margin-top: 20px;
        ">
          <div style="font-size: 32px; font-weight: bold;">${noteCount}</div>
          <div style="font-size: 12px; opacity: 0.8;">notes</div>
        </div>
      </button>
    `;
  }

  /**
   * Hide the difficulty selection screen
   */
  hide(): void {
    if (this.overlay) {
      this.overlay.style.display = 'none';
    }
  }

  /**
   * Register callback for when a difficulty is selected
   */
  onSelect(callback: (difficulty: Difficulty) => void): void {
    this.onSelectCallback = callback;
  }

  /**
   * Register callback for back button
   */
  onBack(callback: () => void): void {
    this.onBackCallback = callback;
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


