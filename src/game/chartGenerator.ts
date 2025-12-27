// Chart generator for creating note charts at different difficulty levels
// Generates Easy, Medium, and Hard charts based on BPM and duration

import type { NoteChart, Difficulty } from '../types.js';

export interface ChartGeneratorConfig {
  bpm: number;
  duration: number;
  difficulty: Difficulty;
}

export class ChartGenerator {
  /**
   * Generate a complete chart for a song at a specific difficulty
   */
  generateChart(config: ChartGeneratorConfig): NoteChart {
    const { bpm, duration, difficulty } = config;
    const notes: NoteChart = [];
    
    const beatDuration = 60 / bpm; // Seconds per beat
    const totalBeats = Math.floor(duration / beatDuration);
    
    switch (difficulty) {
      case 'easy':
        return this.generateEasyChart(beatDuration, totalBeats);
      case 'medium':
        return this.generateMediumChart(beatDuration, totalBeats);
      case 'hard':
        return this.generateHardChart(beatDuration, totalBeats);
      default:
        return notes;
    }
  }

  /**
   * Generate Easy difficulty chart
   * - 1-2 notes per measure (4 beats)
   * - Only single lane hits (no chords)
   * - Simple patterns
   * - Focus on quarter notes and half notes
   */
  private generateEasyChart(beatDuration: number, totalBeats: number): NoteChart {
    const notes: NoteChart = [];
    
    // Start after 4 beats intro
    for (let beat = 4; beat < totalBeats - 4; beat += 2) {
      // Simple alternating pattern every 2 beats
      const lane = (Math.floor(beat / 2) % 4);
      notes.push({
        lane,
        hitTime: beat * beatDuration
      });
    }
    
    return notes.sort((a, b) => a.hitTime - b.hitTime);
  }

  /**
   * Generate Medium difficulty chart
   * - 2-4 notes per measure
   * - Occasional 2-note chords
   * - Moderate patterns
   * - Mix of quarter notes and eighth notes
   */
  private generateMediumChart(beatDuration: number, totalBeats: number): NoteChart {
    const notes: NoteChart = [];
    
    // Start after 4 beats intro
    for (let beat = 4; beat < totalBeats - 4; beat++) {
      // Add note on every beat
      if (beat % 4 === 0) {
        // Downbeat - possible chord
        const lane1 = Math.floor(Math.random() * 4);
        notes.push({ lane: lane1, hitTime: beat * beatDuration });
        
        // 30% chance of chord
        if (Math.random() < 0.3) {
          const lane2 = (lane1 + 2) % 4; // Opposite lane
          notes.push({ lane: lane2, hitTime: beat * beatDuration });
        }
      } else if (beat % 2 === 0) {
        // Half beats - single notes
        const lane = Math.floor(Math.random() * 4);
        notes.push({ lane, hitTime: beat * beatDuration });
      }
    }
    
    return notes.sort((a, b) => a.hitTime - b.hitTime);
  }

  /**
   * Generate Hard difficulty chart
   * - 4+ notes per measure
   * - Frequent chords (2-3 lanes simultaneously)
   * - Complex patterns
   * - Eighth notes and sixteenth notes
   */
  private generateHardChart(beatDuration: number, totalBeats: number): NoteChart {
    const notes: NoteChart = [];
    
    // Start after 4 beats intro
    for (let beat = 4; beat < totalBeats - 4; beat++) {
      const subBeat = beat * 2; // Half-beat resolution
      
      // Add notes on every half beat
      if (subBeat % 8 === 0) {
        // Measure start - 3-note chord
        const lanes = this.getRandomLanes(3);
        lanes.forEach(lane => {
          notes.push({ lane, hitTime: beat * beatDuration });
        });
      } else if (subBeat % 4 === 0) {
        // Beat start - 2-note chord
        const lanes = this.getRandomLanes(2);
        lanes.forEach(lane => {
          notes.push({ lane, hitTime: beat * beatDuration });
        });
      } else if (subBeat % 2 === 0) {
        // Half beats - single or double notes
        const noteCount = Math.random() < 0.6 ? 1 : 2;
        const lanes = this.getRandomLanes(noteCount);
        lanes.forEach(lane => {
          notes.push({ lane, hitTime: beat * beatDuration });
        });
      }
    }
    
    return notes.sort((a, b) => a.hitTime - b.hitTime);
  }

  /**
   * Get random unique lanes for chords
   */
  private getRandomLanes(count: number): number[] {
    const allLanes = [0, 1, 2, 3];
    const selected: number[] = [];
    
    for (let i = 0; i < count && allLanes.length > 0; i++) {
      const index = Math.floor(Math.random() * allLanes.length);
      selected.push(allLanes[index]);
      allLanes.splice(index, 1);
    }
    
    return selected;
  }

  /**
   * Generate all three difficulty charts for a song
   */
  generateAllDifficulties(bpm: number, duration: number): {
    easy: NoteChart;
    medium: NoteChart;
    hard: NoteChart;
  } {
    return {
      easy: this.generateChart({ bpm, duration, difficulty: 'easy' }),
      medium: this.generateChart({ bpm, duration, difficulty: 'medium' }),
      hard: this.generateChart({ bpm, duration, difficulty: 'hard' })
    };
  }

  /**
   * Calculate difficulty statistics for a chart
   */
  getChartStats(chart: NoteChart, duration: number) {
    const noteCount = chart.length;
    const notesPerSecond = noteCount / duration;
    
    // Count chords (notes with same hitTime)
    const hitTimes = chart.map(note => note.hitTime);
    const uniqueHitTimes = new Set(hitTimes);
    const chordCount = noteCount - uniqueHitTimes.size;
    
    return {
      noteCount,
      notesPerSecond: notesPerSecond.toFixed(2),
      chordCount,
      averageNotesPerBeat: (noteCount / (duration * 2)).toFixed(2) // Assuming 120 BPM
    };
  }
}

// Singleton instance
export const chartGenerator = new ChartGenerator();


