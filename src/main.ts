import { WebAudioEngine } from './audio/audioEngine.js';
import { SFXEngine } from './audio/sfxEngine.js';
import { audioLoader } from './audio/audioLoader.js';
import { Canvas2DRenderer } from './render/canvas.js';
import { KeyboardInput } from './game/input.js';
import { RhythmScoring, GameState } from './game/scoring.js';
import { GameLoop } from './game/loop.js';
import { EndScreen } from './ui/endScreen.js';
import { SongSelectScreen } from './ui/songSelect.js';
import { DifficultySelectScreen } from './ui/difficultySelect.js';
import type { GameConfig } from './types.js';
import { getSongById, getChart } from './game/songMetadata.js';

// Game state machine
type GameScreen = 'start' | 'songSelect' | 'difficultySelect' | 'loading' | 'playing' | 'end';

class KeyHeroGame {
  private currentScreen: GameScreen = 'start';
  private gameConfig: GameConfig | null = null;
  
  // Core systems
  private audioEngine: WebAudioEngine;
  private sfxEngine: SFXEngine | null = null;
  private renderer: Canvas2DRenderer;
  private input: KeyboardInput;
  private scoring: RhythmScoring;
  private gameState: GameState;
  private gameLoop: GameLoop | null = null;
  
  // UI screens
  private startOverlay: HTMLDivElement;
  private songSelectScreen: SongSelectScreen;
  private difficultySelectScreen: DifficultySelectScreen;
  private endScreen: EndScreen;
  private loadingOverlay: HTMLDivElement;
  
  constructor() {
    // Initialize canvas
    const canvas = document.createElement('canvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    document.body.appendChild(canvas);
    
    // Initialize core systems
    this.audioEngine = new WebAudioEngine();
    this.renderer = new Canvas2DRenderer();
    this.input = new KeyboardInput();
    this.scoring = new RhythmScoring();
    this.gameState = new GameState();
    
    // Initialize UI screens
    this.songSelectScreen = new SongSelectScreen();
    this.difficultySelectScreen = new DifficultySelectScreen();
    this.endScreen = new EndScreen();
    this.startOverlay = this.createStartOverlay();
    this.loadingOverlay = this.createLoadingOverlay();
    
    // Set up UI callbacks
    this.setupUICallbacks();
    
    // Set up input handlers
    this.setupInputHandlers();
    
    // Set up resize handler
    window.addEventListener('resize', () => {
      this.renderer.resize();
    });
  }
  
  private createStartOverlay(): HTMLDivElement {
    const overlay = document.createElement('div');
    overlay.id = 'start-overlay';
    overlay.innerHTML = `
      <h1 style="font-size: 72px; margin: 0 0 20px 0;">🎸 KeyHero</h1>
      <p style="font-size: 24px; margin: 0 0 10px 0;">A Rhythm Game</p>
      <button id="start-button" style="
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
      " onmouseover="this.style.transform='scale(1.05)';" 
         onmouseout="this.style.transform='scale(1)';">
        Start Game
      </button>
      <p style="font-size: 18px; margin-top: 40px; color: #aaa;">Controls: A S D F keys</p>
    `;
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.95);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      z-index: 3000;
      color: white;
      font-family: Arial, sans-serif;
      text-align: center;
    `;
    document.body.appendChild(overlay);
    
    const button = overlay.querySelector('#start-button');
    if (button) {
      button.addEventListener('click', () => this.showSongSelect());
    }
    
    return overlay;
  }
  
  private createLoadingOverlay(): HTMLDivElement {
    const overlay = document.createElement('div');
    overlay.id = 'loading-overlay';
    overlay.innerHTML = `
      <div style="text-align: center;">
        <div style="font-size: 48px; margin-bottom: 20px;">♪</div>
        <div style="font-size: 24px; margin-bottom: 10px;">Loading...</div>
        <div id="loading-progress" style="font-size: 16px; color: #aaa;"></div>
      </div>
    `;
    overlay.style.cssText = `
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
      z-index: 4000;
      color: white;
      font-family: Arial, sans-serif;
    `;
    document.body.appendChild(overlay);
    
    return overlay;
  }
  
  private setupUICallbacks(): void {
    // Song selection
    this.songSelectScreen.onSelect((songId) => {
      this.gameConfig = { songId, difficulty: 'medium' }; // Default, will be updated
      this.showDifficultySelect(songId);
    });
    
    // Difficulty selection
    this.difficultySelectScreen.onSelect((difficulty) => {
      if (this.gameConfig) {
        this.gameConfig.difficulty = difficulty;
        this.startGameplay();
      }
    });
    
    this.difficultySelectScreen.onBack(() => {
      this.showSongSelect();
    });
    
    // End screen
    this.endScreen.onMenu(() => {
      this.showSongSelect();
    });
  }
  
  private setupInputHandlers(): void {
    window.addEventListener('keydown', (e) => {
      const key = e.key.toLowerCase();
      if (['a', 's', 'd', 'f'].includes(key) && this.currentScreen === 'playing' && this.gameLoop) {
        e.preventDefault();
        this.gameLoop.handleKeyPress(key);
      }
    });
    
    window.addEventListener('keyup', (e) => {
      const key = e.key.toLowerCase();
      if (['a', 's', 'd', 'f'].includes(key) && this.currentScreen === 'playing' && this.gameLoop) {
        this.gameLoop.handleKeyUp(key);
      }
    });
  }
  
  private showSongSelect(): void {
    this.currentScreen = 'songSelect';
    this.startOverlay.style.display = 'none';
    this.difficultySelectScreen.hide();
    this.endScreen.hide();
    this.songSelectScreen.show();
  }
  
  private showDifficultySelect(songId: string): void {
    this.currentScreen = 'difficultySelect';
    this.songSelectScreen.hide();
    this.difficultySelectScreen.show(songId);
  }
  
  private async startGameplay(): Promise<void> {
    if (!this.gameConfig) return;
    
    this.currentScreen = 'loading';
    this.difficultySelectScreen.hide();
    this.loadingOverlay.style.display = 'flex';
    
    const song = getSongById(this.gameConfig.songId);
    const chart = getChart(this.gameConfig.songId, this.gameConfig.difficulty);
    
    if (!song || !chart) {
      console.error('Song or chart not found');
      this.showSongSelect();
      return;
    }
    
    try {
      // Try to load audio file, fall back to procedural if it fails

      try {
        // Create audio context first
        this.audioEngine.stop();
        await this.audioEngine.start();

        const audioContext = this.audioEngine.getAudioContext();
        if (!audioContext) throw new Error('AudioContext not available');

        // Try to load audio file
        const progressEl = document.getElementById('loading-progress');
        const audioBuffer = await audioLoader.loadAudioFile(
          song.audioPath,
          audioContext,
          (progress) => {
            if (progressEl) {
              progressEl.textContent = `${Math.round(progress.percentage)}%`;
            }
          }
        );
        
        // Update audio engine with loaded buffer
        (this.audioEngine as any).musicBuffer = audioBuffer;
        console.log('Using file audio');
      } catch (error) {
        console.warn('Failed to load audio file, using procedural audio:', error);
        console.log('Using procedural audio');
        
        // Restart with procedural audio
        this.audioEngine.stop();
        await this.audioEngine.start();
      }
      
      // Initialize SFX engine
      const audioContext = this.audioEngine.getAudioContext();
      if (audioContext) {
        this.sfxEngine = new SFXEngine(audioContext);
        await this.sfxEngine.generateSFX();
      }
      
      // Reset game state
      this.gameState.reset();
      
      // Create game loop with selected chart
      this.gameLoop = new GameLoop(
        this.audioEngine,
        this.renderer,
        this.input,
        this.scoring,
        this.gameState,
        chart,
        this.sfxEngine!,
        this.endScreen
      );
      
      // Hide loading, start playing
      this.loadingOverlay.style.display = 'none';
      this.currentScreen = 'playing';
      
      // The game loop is already started by the audio engine
      (this.gameLoop as any).isRunning = true;
      (this.gameLoop as any).loop();
      
    } catch (error) {
      console.error('Failed to start gameplay:', error);
      this.loadingOverlay.style.display = 'none';
      alert('Failed to start game. Please try again.');
      this.showSongSelect();
    }
  }
}

// Initialize the game
async function main() {
  new KeyHeroGame();
}

main().catch(console.error);
