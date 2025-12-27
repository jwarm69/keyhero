// Sound Effects Engine for KeyHero
// Generates procedural sound effects using Web Audio API

export class SFXEngine {
  private audioContext: AudioContext;
  private hitBuffer: AudioBuffer | null = null;
  private missBuffer: AudioBuffer | null = null;
  private comboBuffers: Map<number, AudioBuffer> = new Map();
  private masterVolume: number = 0.25; // 25% volume for SFX

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;
  }

  /**
   * Generate all sound effect buffers
   * Call this once at initialization
   */
  async generateSFX(): Promise<void> {
    this.hitBuffer = this.generateHitSound();
    this.missBuffer = this.generateMissSound();
    
    // Generate combo chimes for different milestones
    this.comboBuffers.set(10, this.generateComboChime(523.25)); // C5
    this.comboBuffers.set(20, this.generateComboChime(587.33)); // D5
    this.comboBuffers.set(50, this.generateComboChime(659.25)); // E5
    this.comboBuffers.set(100, this.generateComboChime(783.99)); // G5
  }

  /**
   * Generate hit sound - short sine wave with fast decay
   */
  private generateHitSound(): AudioBuffer {
    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.05; // 50ms
    const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);

    const frequency = 440; // A4
    
    for (let i = 0; i < buffer.length; i++) {
      const t = i / sampleRate;
      // Sine wave with exponential decay
      const envelope = Math.exp(-t * 50);
      data[i] = Math.sin(2 * Math.PI * frequency * t) * envelope;
    }

    return buffer;
  }

  /**
   * Generate miss sound - low frequency noise burst
   */
  private generateMissSound(): AudioBuffer {
    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.1; // 100ms
    const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < buffer.length; i++) {
      const t = i / sampleRate;
      // Filtered noise with fast decay
      const envelope = Math.exp(-t * 30);
      const noise = (Math.random() * 2 - 1) * 0.3;
      
      // Low-pass filter effect (simple moving average)
      if (i > 0) {
        data[i] = (noise * 0.3 + data[i - 1] * 0.7) * envelope;
      } else {
        data[i] = noise * envelope;
      }
    }

    return buffer;
  }

  /**
   * Generate combo chime - pleasant ascending tone
   */
  private generateComboChime(frequency: number): AudioBuffer {
    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.2; // 200ms
    const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < buffer.length; i++) {
      const t = i / sampleRate;
      // Two sine waves for richer sound
      const envelope = Math.exp(-t * 10);
      const wave1 = Math.sin(2 * Math.PI * frequency * t);
      const wave2 = Math.sin(2 * Math.PI * frequency * 2 * t) * 0.3;
      data[i] = (wave1 + wave2) * envelope * 0.5;
    }

    return buffer;
  }

  /**
   * Play hit sound effect
   */
  playHit(): void {
    if (!this.hitBuffer) return;
    this.playBuffer(this.hitBuffer);
  }

  /**
   * Play miss sound effect
   */
  playMiss(): void {
    if (!this.missBuffer) return;
    this.playBuffer(this.missBuffer);
  }

  /**
   * Play combo milestone chime
   * @param combo Current combo count
   */
  playComboChime(combo: number): void {
    // Find the appropriate chime for this combo milestone
    let chimeBuffer: AudioBuffer | null = null;
    
    if (combo >= 100) {
      chimeBuffer = this.comboBuffers.get(100) || null;
    } else if (combo >= 50) {
      chimeBuffer = this.comboBuffers.get(50) || null;
    } else if (combo >= 20) {
      chimeBuffer = this.comboBuffers.get(20) || null;
    } else if (combo >= 10) {
      chimeBuffer = this.comboBuffers.get(10) || null;
    }

    if (chimeBuffer) {
      this.playBuffer(chimeBuffer);
    }
  }

  /**
   * Internal method to play an audio buffer
   */
  private playBuffer(buffer: AudioBuffer): void {
    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;

    const gainNode = this.audioContext.createGain();
    gainNode.gain.value = this.masterVolume;

    source.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    source.start(0);
  }

  /**
   * Set master volume for all SFX (0.0 to 1.0)
   */
  setVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume));
  }
}


