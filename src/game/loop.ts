import type { AudioEngine, NoteChart } from '../types.js';
import type { CanvasRenderer } from '../render/canvas.js';
import type { InputHandler } from './input.js';
import type { RhythmScoring } from './scoring.js';
import type { GameState } from './scoring.js';
import type { SFXEngine } from '../audio/sfxEngine.js';
import type { EndScreen } from '../ui/endScreen.js';

export class GameLoop {
  private isRunning: boolean = false;
  private animationFrameId: number | null = null;
  private feedbackTimeout: number | null = null;
  private currentFeedback: string = '';
  private chartDuration: number;
  private lastComboMilestone: number = 0; // Track last combo milestone for chimes

  constructor(
    private audioEngine: AudioEngine,
    private renderer: CanvasRenderer,
    private input: InputHandler,
    private scoring: RhythmScoring,
    private gameState: GameState,
    private chart: NoteChart,
    private sfxEngine: SFXEngine,
    private endScreen: EndScreen
  ) {
    this.chartDuration = this.chart[this.chart.length - 1].hitTime + 2.0;
  }

  async start(): Promise<void> {
    await this.audioEngine.start();
    this.isRunning = true;
    this.loop();
  }

  stop(): void {
    this.isRunning = false;
    this.audioEngine.stop();
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (this.feedbackTimeout) {
      clearTimeout(this.feedbackTimeout);
      this.feedbackTimeout = null;
    }
  }

  private loop(): void {
    if (!this.isRunning) return;

    const songTime = this.audioEngine.getSongTime();

    if (songTime > this.chartDuration) {
      this.endGame();
      return;
    }

    this.renderer.clear();
    this.renderer.drawLanes();
    this.renderer.drawHitLine();
    this.renderer.drawNotes(this.chart, songTime);
    this.renderer.drawScore(this.gameState.getScore(), this.gameState.getCombo());
    this.renderer.drawFeedback(this.currentFeedback);

    this.checkMissedNotes(songTime);

    this.animationFrameId = requestAnimationFrame(() => this.loop());
  }

  private checkMissedNotes(songTime: number): void {
    this.chart.forEach(note => {
      if (note.hit) return;

      const timeDiff = note.hitTime - songTime;
      if (timeDiff < -0.120) {
        const result = this.scoring.evaluateHit(note, songTime);
        this.gameState.processHit(result);
        note.hit = true;
        this.showFeedback(result.rating);

        if (result.rating === 'MISS') {
          this.renderer.setShake(5);
          this.sfxEngine.playMiss();
        }
      }
    });
  }

  handleKeyPress(key: string): void {
    if (!this.isRunning) return;

    if (this.input.isKeyPressed(key)) return;

    this.input.onKeyDown(key);

    const lane = this.input.getLane(key);
    if (lane === undefined) return;

    const songTime = this.audioEngine.getSongTime();
    const note = this.findNearestNote(lane, songTime);

    if (note && !note.hit) {
      const result = this.scoring.evaluateHit(note, songTime);
      const previousCombo = this.gameState.getCombo();
      this.gameState.processHit(result);
      note.hit = true;
      this.showFeedback(result.rating);

      // Play appropriate sound effect
      if (result.rating === 'MISS') {
        this.renderer.setShake(5);
        this.sfxEngine.playMiss();
      } else {
        this.sfxEngine.playHit();
        
        // Check for combo milestones
        const currentCombo = this.gameState.getCombo();
        this.checkComboMilestone(currentCombo);
      }
    }
  }

  handleKeyUp(key: string): void {
    this.input.onKeyUp(key);
  }

  private findNearestNote(lane: number, songTime: number): any {
    const notesInLane = this.chart.filter(note =>
      note.lane === lane &&
      !note.hit &&
      note.hitTime >= songTime - 0.120 &&
      note.hitTime <= songTime + 0.120
    );

    if (notesInLane.length === 0) return null;

    notesInLane.sort((a, b) => Math.abs(a.hitTime - songTime) - Math.abs(b.hitTime - songTime));
    return notesInLane[0];
  }

  private checkComboMilestone(combo: number): void {
    // Play chime on combo milestones: 10, 20, 50, 100
    const milestones = [10, 20, 50, 100];
    
    for (const milestone of milestones) {
      if (combo === milestone && this.lastComboMilestone < milestone) {
        this.sfxEngine.playComboChime(combo);
        this.lastComboMilestone = milestone;
        break;
      }
    }
    
    // Reset milestone tracker if combo is broken
    if (combo === 0) {
      this.lastComboMilestone = 0;
    }
  }

  private showFeedback(feedback: string): void {
    this.currentFeedback = feedback;

    if (this.feedbackTimeout) {
      clearTimeout(this.feedbackTimeout);
    }

    this.feedbackTimeout = window.setTimeout(() => {
      this.currentFeedback = '';
    }, 500);
  }

  private endGame(): void {
    this.isRunning = false;
    const stats = this.gameState.getStats();
    const score = this.gameState.getScore();
    const accuracy = this.gameState.getAccuracy();
    const grade = this.gameState.getGrade();

    // Log to console for debugging
    console.log('=== GAME OVER ===');
    console.log(`Final Score: ${score}`);
    console.log(`Max Combo: ${stats.maxCombo}`);
    console.log(`Perfect: ${stats.perfectCount}`);
    console.log(`Good: ${stats.goodCount}`);
    console.log(`Miss: ${stats.missCount}`);
    console.log(`Accuracy: ${accuracy.toFixed(2)}%`);
    console.log(`Grade: ${grade}`);

    // Show end screen
    this.endScreen.show(stats, score, accuracy, grade);
  }

  /**
   * Reset game state for restart
   */
  reset(): void {
    // Reset game state
    this.gameState.reset();
    
    // Reset combo milestone tracker
    this.lastComboMilestone = 0;
    
    // Clear feedback
    this.currentFeedback = '';
    if (this.feedbackTimeout) {
      clearTimeout(this.feedbackTimeout);
      this.feedbackTimeout = null;
    }
    
    // Un-mark all notes in the chart
    this.chart.forEach(note => {
      note.hit = false;
    });
    
    // Hide end screen
    this.endScreen.hide();
  }
}
