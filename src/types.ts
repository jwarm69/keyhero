// Core type definitions for KeyHero rhythm game

export interface Note {
  lane: number;        // 0-3 (corresponds to lanes A, S, D, F)
  hitTime: number;     // Seconds since song start (float)
  hit?: boolean;       // Track whether note was hit
}

export interface AudioEngine {
  start(): Promise<void>;
  getSongTime(): number;
  stop(): void;
  setOffset(offset: number): void;
  pause(): void;
  resume(): void;
  getAudioContext(): AudioContext | null;
}

export type NoteChart = Note[];

export interface AudioEngineConfig {
  tempo: number;           // BPM
  duration: number;        // Seconds
  calibrationOffset: number; // Audio latency compensation
}

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface GameConfig {
  songId: string;
  difficulty: Difficulty;
}

export interface SongMetadata {
  id: string;
  title: string;
  artist: string;
  bpm: number;
  duration: number;
  audioPath: string;
  license: string;
  charts: {
    easy: NoteChart;
    medium: NoteChart;
    hard: NoteChart;
  };
}

export interface GameStats {
  score: number;
  maxCombo: number;
  perfectCount: number;
  goodCount: number;
  missCount: number;
}

export interface LeaderboardEntry {
  playerName: string;
  score: number;
  maxCombo: number;
  perfectCount: number;
  goodCount: number;
  missCount: number;
  timestamp: number;
}
