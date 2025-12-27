// Core audio timing system for KeyHero rhythm game
// This is the CRITICAL module - all timing depends on this implementation

import { AudioEngine, AudioEngineConfig } from '../types.js';
import { generateProceduralTrack } from './proceduralTrack.js';

export class WebAudioEngine implements AudioEngine {
  private audioContext: AudioContext | null = null;
  private sourceNode: AudioBufferSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private musicBuffer: AudioBuffer | null = null;

  // Timing state
  private songStartTime: number = 0;
  private calibrationOffset: number = 0;
  private isPlaying: boolean = false;
  private isPaused: boolean = false;
  private pauseStartTime: number = 0;
  private totalPausedTime: number = 0;

  // Configuration
  private config: AudioEngineConfig;

  constructor(config?: Partial<AudioEngineConfig>) {
    this.config = {
      tempo: 120,
      duration: 60,
      calibrationOffset: 0,
      ...config
    };
  }

  /**
   * Initialize audio context and start playback
   * MUST be called from user interaction event
   */
  public async start(): Promise<void> {
    // Clean up any existing audio
    this.stop();

    // Create new AudioContext for each start (ensures clean state)
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
      sampleRate: 44100
    });

    // Generate procedural music
    this.musicBuffer = generateProceduralTrack(
      this.audioContext,
      this.config.tempo,
      this.config.duration
    );

    // Create audio nodes
    this.sourceNode = this.audioContext.createBufferSource();
    this.sourceNode.buffer = this.musicBuffer;

    this.gainNode = this.audioContext.createGain();
    this.gainNode.gain.value = 0.7;

    // Connect nodes: source -> gain -> destination
    this.sourceNode.connect(this.gainNode);
    this.gainNode.connect(this.audioContext.destination);

    // Handle song end
    this.sourceNode.onended = () => {
      if (this.isPlaying && !this.isPaused) {
        this.isPlaying = false;
      }
    };

    // Reset timing state
    this.songStartTime = this.audioContext.currentTime;
    this.totalPausedTime = 0;
    this.isPaused = false;
    this.isPlaying = true;

    // Start playback
    this.sourceNode.start(0, 0, this.config.duration);
  }

  /**
   * Get the current song time with calibration
   * This is the CRITICAL timing function - MUST be perfectly accurate
   * Uses audioContext.currentTime as master clock
   */
  public getSongTime(): number {
    if (!this.audioContext || !this.isPlaying) {
      return 0;
    }

    const now = this.audioContext.currentTime;
    const elapsed = now - this.songStartTime;
    const calibrated = elapsed - this.totalPausedTime - this.calibrationOffset;
    return Math.max(0, calibrated);
  }

  /**
   * Stop playback and clean up all audio resources
   * Must completely reset state for reliable restart
   */
  public stop(): void {
    if (this.sourceNode) {
      try {
        this.sourceNode.stop();
        this.sourceNode.disconnect();
      } catch (e) {
        // Ignore errors if already stopped
      }
      this.sourceNode = null;
    }

    if (this.gainNode) {
      this.gainNode.disconnect();
      this.gainNode = null;
    }

    if (this.audioContext) {
      try {
        this.audioContext.close();
      } catch (e) {
        // Ignore errors if already closed
      }
      this.audioContext = null;
    }

    // Reset all state
    this.isPlaying = false;
    this.isPaused = false;
    this.totalPausedTime = 0;
    this.songStartTime = 0;
    this.pauseStartTime = 0;
  }

  /**
   * Set audio calibration offset to compensate for latency
   * Positive value shifts song time earlier (notes appear earlier)
   * Negative value shifts song time later (notes appear later)
   */
  public setOffset(offset: number): void {
    this.calibrationOffset = offset;
  }

  /**
   * Pause playback using audioContext.suspend()
   * Preserves audio timing state
   */
  public pause(): void {
    if (!this.audioContext || !this.isPlaying || this.isPaused) {
      return;
    }

    this.pauseStartTime = this.audioContext.currentTime;
    this.audioContext.suspend();
    this.isPaused = true;
  }

  /**
   * Resume playback using audioContext.resume()
   * Tracks total paused time for accurate timing
   */
  public async resume(): Promise<void> {
    if (!this.audioContext || !this.isPaused) {
      return;
    }

    await this.audioContext.resume();
    const pauseDuration = this.audioContext.currentTime - this.pauseStartTime;
    this.totalPausedTime += pauseDuration;
    this.isPaused = false;
  }

  /**
   * Get current playback state
   */
  public isPlayingState(): boolean {
    return this.isPlaying;
  }

  /**
   * Get current pause state
   */
  public isPausedState(): boolean {
    return this.isPaused;
  }

  /**
   * Get the underlying AudioContext (for testing only)
   */
  public getAudioContext(): AudioContext | null {
    return this.audioContext;
  }

  /**
   * Get the music buffer duration (for testing)
   */
  public getBufferDuration(): number {
    return this.musicBuffer ? this.musicBuffer.duration : 0;
  }
}
