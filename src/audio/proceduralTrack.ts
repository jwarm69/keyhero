// Procedural music generation using Web Audio API
// Generates a 60-second electronic track at 120 BPM

interface TrackConfig {
  tempo: number;
  duration: number;
  sampleRate: number;
}

export class ProceduralTrackGenerator {
  private config: TrackConfig;

  constructor(tempo: number = 120, duration: number = 60, sampleRate: number = 44100) {
    this.config = { tempo, duration, sampleRate };
  }

  /**
   * Generate a complete 60-second music track
   * Uses oscillators and noise buffers for drum synthesis
   */
  public generateTrack(audioContext: AudioContext): AudioBuffer {
    const { duration, sampleRate } = this.config;
    const buffer = audioContext.createBuffer(2, sampleRate * duration, sampleRate);
    const leftChannel = buffer.getChannelData(0);
    const rightChannel = buffer.getChannelData(1);

    // Clear buffers
    for (let i = 0; i < leftChannel.length; i++) {
      leftChannel[i] = 0;
      rightChannel[i] = 0;
    }

    // Generate drum patterns
    this.generateKickDrum(leftChannel, rightChannel);
    this.generateSnare(leftChannel, rightChannel);
    this.generateHiHat(leftChannel, rightChannel);

    // Add bass line
    this.generateBass(leftChannel, rightChannel);

    // Normalize to prevent clipping
    this.normalizeBuffer(leftChannel, rightChannel);

    return buffer;
  }

  /**
   * Generate kick drum pattern (4/4 beat, on 1 and 3)
   */
  private generateKickDrum(left: Float32Array, right: Float32Array): void {
    const { tempo, sampleRate } = this.config;
    const beatDuration = 60 / tempo; // 0.5 seconds at 120 BPM
    const kickSamples = Math.floor(0.15 * sampleRate); // 150ms kick

    for (let beat = 0; beat < (this.config.duration / beatDuration); beat++) {
      // Kick on 1 and 3
      if (beat % 4 === 0 || beat % 4 === 2) {
        const startTime = Math.floor(beat * beatDuration * sampleRate);
        this.renderKick(left, right, startTime, kickSamples);
      }
    }
  }

  /**
   * Render a single kick drum hit
   */
  private renderKick(left: Float32Array, right: Float32Array, start: number, duration: number): void {
    const { sampleRate } = this.config;
    const frequency = 60; // Low frequency for kick

    for (let i = 0; i < duration && (start + i) < left.length; i++) {
      const t = i / sampleRate;
      const amplitude = Math.exp(-t * 15); // Fast decay
      const pitchEnvelope = Math.exp(-t * 20); // Pitch drop

      const sample = Math.sin(2 * Math.PI * frequency * pitchEnvelope * t) * amplitude * 0.8;
      left[start + i] += sample;
      right[start + i] += sample;
    }
  }

  /**
   * Generate snare pattern (4/4 beat, on 2 and 4)
   */
  private generateSnare(left: Float32Array, right: Float32Array): void {
    const { tempo, sampleRate } = this.config;
    const beatDuration = 60 / tempo;
    const snareSamples = Math.floor(0.2 * sampleRate); // 200ms snare

    for (let beat = 0; beat < (this.config.duration / beatDuration); beat++) {
      // Snare on 2 and 4
      if (beat % 4 === 1 || beat % 4 === 3) {
        const startTime = Math.floor(beat * beatDuration * sampleRate);
        this.renderSnare(left, right, startTime, snareSamples);
      }
    }
  }

  /**
   * Render a single snare hit using filtered noise
   */
  private renderSnare(left: Float32Array, right: Float32Array, start: number, duration: number): void {
    const { sampleRate } = this.config;

    for (let i = 0; i < duration && (start + i) < left.length; i++) {
      const t = i / sampleRate;
      const amplitude = Math.exp(-t * 12); // Fast decay

      // White noise
      let noise = (Math.random() * 2 - 1);

      // Simple high-pass effect
      const sample = noise * amplitude * 0.4;
      left[start + i] += sample;
      right[start + i] += sample;
    }
  }

  /**
   * Generate hi-hat pattern (every 8th note)
   */
  private generateHiHat(left: Float32Array, right: Float32Array): void {
    const { tempo, sampleRate } = this.config;
    const beatDuration = 60 / tempo;
    const hatDuration = Math.floor(0.05 * sampleRate); // 50ms hi-hat

    for (let beat = 0; beat < (this.config.duration / beatDuration); beat++) {
      // Hi-hat on every 8th note
      for (let subdivision = 0; subdivision < 2; subdivision++) {
        const startTime = Math.floor((beat + subdivision * 0.5) * beatDuration * sampleRate);
        this.renderHiHat(left, right, startTime, hatDuration);
      }
    }
  }

  /**
   * Render a single hi-hat hit
   */
  private renderHiHat(left: Float32Array, right: Float32Array, start: number, duration: number): void {
    const { sampleRate } = this.config;

    for (let i = 0; i < duration && (start + i) < left.length; i++) {
      const t = i / sampleRate;
      const amplitude = Math.exp(-t * 50); // Very fast decay

      // High-frequency noise
      let noise = (Math.random() * 2 - 1);
      const sample = noise * amplitude * 0.15;

      left[start + i] += sample;
      right[start + i] += sample;
    }
  }

  /**
   * Generate simple bass line
   */
  private generateBass(left: Float32Array, right: Float32Array): void {
    const { tempo, sampleRate } = this.config;
    const beatDuration = 60 / tempo;
    const notes = [55, 55, 65.41, 65.41]; // A1, C2 pattern (frequencies in Hz)

    for (let beat = 0; beat < (this.config.duration / beatDuration); beat++) {
      const noteIndex = Math.floor(beat / 2) % notes.length;
      const frequency = notes[noteIndex];
      const startTime = Math.floor(beat * beatDuration * sampleRate);
      const noteSamples = Math.floor(0.4 * sampleRate); // 400ms notes

      this.renderBassNote(left, right, startTime, noteSamples, frequency);
    }
  }

  /**
   * Render a single bass note
   */
  private renderBassNote(left: Float32Array, right: Float32Array, start: number, duration: number, frequency: number): void {
    const { sampleRate } = this.config;

    for (let i = 0; i < duration && (start + i) < left.length; i++) {
      const t = i / sampleRate;
      const amplitude = Math.exp(-t * 3); // Medium decay

      // Add some harmonics for richer sound
      const fundamental = Math.sin(2 * Math.PI * frequency * t);
      const harmonic = Math.sin(2 * Math.PI * frequency * 2 * t) * 0.3;
      const harmonic2 = Math.sin(2 * Math.PI * frequency * 3 * t) * 0.1;

      const sample = (fundamental + harmonic + harmonic2) * amplitude * 0.3;
      left[start + i] += sample;
      right[start + i] += sample;
    }
  }

  /**
   * Normalize buffer to prevent clipping
   */
  private normalizeBuffer(left: Float32Array, right: Float32Array): void {
    let maxAmplitude = 0;

    for (let i = 0; i < left.length; i++) {
      maxAmplitude = Math.max(maxAmplitude, Math.abs(left[i]), Math.abs(right[i]));
    }

    if (maxAmplitude > 1) {
      const scale = 1 / maxAmplitude;
      for (let i = 0; i < left.length; i++) {
        left[i] *= scale;
        right[i] *= scale;
      }
    }
  }
}

/**
 * Convenience function to generate a track
 */
export function generateProceduralTrack(audioContext: AudioContext, tempo: number = 120, duration: number = 60): AudioBuffer {
  const generator = new ProceduralTrackGenerator(tempo, duration, audioContext.sampleRate);
  return generator.generateTrack(audioContext);
}
