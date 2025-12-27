// Entry point for KeyHero rhythm game
// Sets up canvas, audio context, and game loop

import { WebAudioEngine } from './audio/audioEngine.js';

interface GameConfig {
  canvasWidth: number;
  canvasHeight: number;
  targetFPS: number;
}

class KeyHeroGame {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private audioEngine: WebAudioEngine;
  private isRunning: boolean = false;
  private animationId: number | null = null;
  private config: GameConfig;

  constructor() {
    // Create canvas
    this.canvas = document.createElement('canvas');
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.canvas.style.display = 'block';
    this.canvas.style.backgroundColor = '#1a1a2e';

    // Get 2D context
    const ctx = this.canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get 2D context');
    }
    this.ctx = ctx;

    // Initialize audio engine
    this.audioEngine = new WebAudioEngine({
      tempo: 120,
      duration: 60,
      calibrationOffset: 0
    });

    // Game configuration
    this.config = {
      canvasWidth: window.innerWidth,
      canvasHeight: window.innerHeight,
      targetFPS: 60
    };

    // Setup event listeners
    this.setupEventListeners();

    // Add canvas to DOM
    document.body.appendChild(this.canvas);

    // Show start screen
    this.showStartScreen();
  }

  /**
   * Setup window event listeners
   */
  private setupEventListeners(): void {
    // Handle window resize
    window.addEventListener('resize', () => {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
      this.config.canvasWidth = window.innerWidth;
      this.config.canvasHeight = window.innerHeight;

      if (!this.isRunning) {
        this.showStartScreen();
      }
    });

    // Handle keyboard input (for testing)
    window.addEventListener('keydown', (e) => {
      if (this.isRunning) {
        // TODO: Handle game input (A, S, D, F keys)
        console.log(`Key pressed: ${e.key}, Song time: ${this.audioEngine.getSongTime().toFixed(3)}s`);
      }

      // Escape to pause
      if (e.key === 'Escape' && this.isRunning) {
        if (this.audioEngine.isPausedState()) {
          this.audioEngine.resume();
        } else {
          this.audioEngine.pause();
        }
      }
    });
  }

  /**
   * Show start screen with "Click to Start" overlay
   */
  private showStartScreen(): void {
    // Clear canvas
    this.ctx.fillStyle = '#1a1a2e';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw title
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 72px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('KEYHERO', this.canvas.width / 2, this.canvas.height / 2 - 100);

    // Draw subtitle
    this.ctx.fillStyle = '#888888';
    this.ctx.font = '24px Arial';
    this.ctx.fillText('Rhythm Game', this.canvas.width / 2, this.canvas.height / 2 - 50);

    // Draw start button
    const buttonWidth = 300;
    const buttonHeight = 60;
    const buttonX = (this.canvas.width - buttonWidth) / 2;
    const buttonY = this.canvas.height / 2 + 50;

    // Button background
    this.ctx.fillStyle = '#4a9eff';
    this.ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);

    // Button text
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 24px Arial';
    this.ctx.fillText('CLICK TO START', this.canvas.width / 2, buttonY + buttonHeight / 2);

    // Draw instructions
    this.ctx.fillStyle = '#666666';
    this.ctx.font = '16px Arial';
    this.ctx.fillText('Press A, S, D, F to hit notes', this.canvas.width / 2, this.canvas.height - 100);
    this.ctx.fillText('Press ESC to pause', this.canvas.width / 2, this.canvas.height - 70);

    // Add click handler
    const startGame = () => {
      this.canvas.removeEventListener('click', startGame);
      this.startGame();
    };

    this.canvas.addEventListener('click', startGame);
  }

  /**
   * Start the game
   * Initializes audio context and begins game loop
   */
  private async startGame(): Promise<void> {
    console.log('Starting KeyHero...');

    try {
      // Start audio engine (must be from user interaction)
      await this.audioEngine.start();
      console.log('Audio engine started successfully');

      this.isRunning = true;

      // Start game loop
      this.gameLoop();

    } catch (error) {
      console.error('Failed to start game:', error);
      alert('Failed to start audio. Please try again.');
      this.showStartScreen();
    }
  }

  /**
   * Main game loop
   * Updates and renders at target FPS
   */
  private gameLoop(): void {
    if (!this.isRunning) {
      return;
    }

    // Clear canvas
    this.ctx.fillStyle = '#1a1a2e';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Get current song time
    const songTime = this.audioEngine.getSongTime();

    // Render game elements
    this.renderLanes();
    this.renderUI(songTime);

    // Check if song has ended
    const bufferDuration = this.audioEngine.getBufferDuration();
    if (songTime >= bufferDuration && bufferDuration > 0) {
      this.endGame();
      return;
    }

    // Continue game loop
    this.animationId = requestAnimationFrame(() => this.gameLoop());
  }

  /**
   * Render the four note lanes
   */
  private renderLanes(): void {
    const laneWidth = this.canvas.width / 4;
    const laneColors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4']; // Colors for A, S, D, F lanes
    const laneLabels = ['A', 'S', 'D', 'F'];

    for (let i = 0; i < 4; i++) {
      const x = i * laneWidth;

      // Lane background
      this.ctx.fillStyle = i % 2 === 0 ? '#16213e' : '#1a1a2e';
      this.ctx.fillRect(x, 0, laneWidth, this.canvas.height);

      // Lane divider
      this.ctx.strokeStyle = '#333333';
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.canvas.height);
      this.ctx.stroke();

      // Lane label at bottom
      this.ctx.fillStyle = laneColors[i];
      this.ctx.font = 'bold 48px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'bottom';
      this.ctx.fillText(laneLabels[i], x + laneWidth / 2, this.canvas.height - 20);

      // Hit line at bottom
      this.ctx.strokeStyle = laneColors[i];
      this.ctx.lineWidth = 4;
      this.ctx.beginPath();
      this.ctx.moveTo(x, this.canvas.height - 100);
      this.ctx.lineTo(x + laneWidth, this.canvas.height - 100);
      this.ctx.stroke();
    }
  }

  /**
   * Render UI elements (score, time, etc.)
   */
  private renderUI(songTime: number): void {
    // Song time display
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 24px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'top';
    this.ctx.fillText(`Time: ${songTime.toFixed(2)}s`, 20, 20);

    // TODO: Add score, combo, etc.
  }

  /**
   * End the game
   */
  private endGame(): void {
    this.isRunning = false;

    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }

    // Stop audio
    this.audioEngine.stop();

    // Show game over screen
    this.showGameOverScreen();
  }

  /**
   * Show game over screen
   */
  private showGameOverScreen(): void {
    // Clear canvas
    this.ctx.fillStyle = '#1a1a2e';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw "Game Over" text
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 72px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 50);

    // Draw restart button
    const buttonWidth = 300;
    const buttonHeight = 60;
    const buttonX = (this.canvas.width - buttonWidth) / 2;
    const buttonY = this.canvas.height / 2 + 50;

    this.ctx.fillStyle = '#4a9eff';
    this.ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);

    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 24px Arial';
    this.ctx.fillText('CLICK TO RESTART', this.canvas.width / 2, buttonY + buttonHeight / 2);

    // Add click handler
    const restartGame = () => {
      this.canvas.removeEventListener('click', restartGame);
      this.startGame();
    };

    this.canvas.addEventListener('click', restartGame);
  }
}

// Initialize game when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new KeyHeroGame();
  });
} else {
  new KeyHeroGame();
}

// Export for testing
export { KeyHeroGame, WebAudioEngine };
