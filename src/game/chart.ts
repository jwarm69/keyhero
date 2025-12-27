import type { NoteChart } from '../types.js';

// Generate a full 60-second chart with varied patterns aligned to 120 BPM (0.5s per beat)
function generateChart(): NoteChart {
  const notes: NoteChart = [];
  const BPM = 120;
  const beatDuration = 60 / BPM; // 0.5 seconds per beat
  
  // Helper to add single note
  const addNote = (lane: number, beat: number) => {
    notes.push({ lane, hitTime: beat * beatDuration });
  };
  
  // Helper to add chord (multiple lanes at once)
  const addChord = (lanes: number[], beat: number) => {
    lanes.forEach(lane => addNote(lane, beat));
  };
  
  // Section 1: Intro - Simple alternating pattern (beats 4-16)
  for (let beat = 4; beat < 16; beat++) {
    addNote(beat % 4, beat);
  }
  
  // Section 2: Building up - Two notes per measure (beats 16-32)
  for (let beat = 16; beat < 32; beat += 2) {
    addNote(Math.floor((beat / 2) % 4), beat);
    addNote(Math.floor((beat / 2 + 2) % 4), beat + 1);
  }
  
  // Section 3: Faster single notes (beats 32-48)
  for (let beat = 32; beat < 48; beat++) {
    addNote((beat * 2) % 4, beat);
  }
  
  // Section 4: Chord section - Intensity builds (beats 48-64)
  for (let beat = 48; beat < 64; beat += 2) {
    if (beat % 4 === 0) {
      addChord([0, 2], beat);
    } else {
      addChord([1, 3], beat);
    }
  }
  
  // Section 5: Complex patterns (beats 64-80)
  for (let beat = 64; beat < 80; beat++) {
    if (beat % 4 === 0) {
      addNote(0, beat);
    } else if (beat % 4 === 1) {
      addNote(1, beat);
      addNote(2, beat);
    } else if (beat % 4 === 2) {
      addNote(3, beat);
    } else {
      addNote(2, beat);
    }
  }
  
  // Section 6: Galloping pattern (beats 80-96)
  for (let beat = 80; beat < 96; beat++) {
    const pattern = beat % 3;
    if (pattern === 0) addNote(0, beat);
    else if (pattern === 1) addNote(1, beat);
    else addNote(2, beat);
  }
  
  // Section 7: Build to climax with chords (beats 96-112)
  for (let beat = 96; beat < 112; beat++) {
    if (beat % 2 === 0) {
      addChord([0, 1, 2], beat);
    } else {
      addNote(3, beat);
    }
  }
  
  // Section 8: Final section - Dense notes (beats 112-116)
  for (let beat = 112; beat < 116; beat++) {
    addNote((beat * 3) % 4, beat);
    if (beat % 2 === 0) {
      addNote((beat * 3 + 2) % 4, beat);
    }
  }
  
  // Sort by hitTime to ensure proper ordering
  notes.sort((a, b) => a.hitTime - b.hitTime);
  
  return notes;
}

export const TEST_CHART: NoteChart = generateChart();

export function getChartDuration(chart: NoteChart): number {
  if (chart.length === 0) return 0;
  const lastNote = chart[chart.length - 1];
  return lastNote.hitTime + 2.0;
}
