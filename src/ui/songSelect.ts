// Song selection screen UI for KeyHero
// Displays available songs in a card-based grid

import type { SongMetadata } from '../types.js';
import { getAllSongs } from '../game/songMetadata.js';

export class SongSelectScreen {
  private overlay: HTMLDivElement | null = null;
  private onSelectCallback: ((songId: string) => void) | null = null;

  constructor() {
    this.createOverlay();
  }

  /**
   * Create the overlay DOM element (hidden by default)
   */
  private createOverlay(): void {
    this.overlay = document.createElement('div');
    this.overlay.id = 'song-select-overlay';
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
      z-index: 1000;
      font-family: Arial, sans-serif;
      color: white;
      overflow-y: auto;
      padding: 40px 20px;
    `;
    document.body.appendChild(this.overlay);
  }

  /**
   * Show the song selection screen
   */
  show(): void {
    if (!this.overlay) return;

    const songs = getAllSongs();

    this.overlay.innerHTML = `
      <div style="max-width: 1200px; width: 100%;">
        <h1 style="
          font-size: 48px;
          margin: 0 0 40px 0;
          text-align: center;
          color: #ffffff;
          text-shadow: 0 0 20px rgba(255, 255, 255, 0.5);
        ">Select a Song</h1>
        
        <div id="song-grid" style="
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 30px;
          margin-bottom: 40px;
        ">
          ${songs.map(song => this.createSongCard(song)).join('')}
        </div>
      </div>
    `;

    // Show overlay
    this.overlay.style.display = 'flex';

    // Attach click handlers to song cards
    songs.forEach(song => {
      const card = document.getElementById(`song-card-${song.id}`);
      if (card) {
        card.addEventListener('click', () => {
          if (this.onSelectCallback) {
            this.onSelectCallback(song.id);
          }
        });
      }
    });
  }

  /**
   * Create HTML for a song card
   */
  private createSongCard(song: SongMetadata): string {
    const noteCount = {
      easy: song.charts.easy.length,
      medium: song.charts.medium.length,
      hard: song.charts.hard.length
    };

    return `
      <div id="song-card-${song.id}" style="
        background: linear-gradient(135deg, #1a1a2e 0%, #2a2a4e 100%);
        border-radius: 15px;
        padding: 30px;
        cursor: pointer;
        transition: all 0.3s ease;
        border: 2px solid #3a3a5e;
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
      " onmouseover="this.style.transform='translateY(-5px)'; this.style.borderColor='#667eea'; this.style.boxShadow='0 8px 25px rgba(102, 126, 234, 0.4)';" 
         onmouseout="this.style.transform='translateY(0)'; this.style.borderColor='#3a3a5e'; this.style.boxShadow='0 5px 15px rgba(0, 0, 0, 0.3)';">
        
        <h2 style="
          font-size: 28px;
          margin: 0 0 10px 0;
          color: #ffffff;
        ">${song.title}</h2>
        
        <p style="
          font-size: 18px;
          color: #aaaaaa;
          margin: 0 0 20px 0;
        ">by ${song.artist}</p>
        
        <div style="
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-bottom: 20px;
          font-size: 16px;
        ">
          <div style="color: #888;">BPM:</div>
          <div style="color: #4ecdc4; font-weight: bold;">${song.bpm}</div>
          
          <div style="color: #888;">Duration:</div>
          <div style="color: #4ecdc4; font-weight: bold;">${song.duration}s</div>
        </div>
        
        <div style="
          background: rgba(0, 0, 0, 0.3);
          border-radius: 10px;
          padding: 15px;
          margin-top: 15px;
        ">
          <div style="font-size: 14px; color: #888; margin-bottom: 10px;">Note Counts:</div>
          <div style="display: flex; justify-content: space-between; font-size: 14px;">
            <span style="color: #4ecdc4;">Easy: ${noteCount.easy}</span>
            <span style="color: #ffa500;">Med: ${noteCount.medium}</span>
            <span style="color: #ff6b6b;">Hard: ${noteCount.hard}</span>
          </div>
        </div>
        
        <div style="
          font-size: 12px;
          color: #666;
          margin-top: 15px;
          text-align: center;
        ">${song.license}</div>
      </div>
    `;
  }

  /**
   * Hide the song selection screen
   */
  hide(): void {
    if (this.overlay) {
      this.overlay.style.display = 'none';
    }
  }

  /**
   * Register callback for when a song is selected
   */
  onSelect(callback: (songId: string) => void): void {
    this.onSelectCallback = callback;
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


