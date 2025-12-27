// Song metadata registry for KeyHero
// Contains information about all available songs and their charts

import type { SongMetadata, Difficulty, NoteChart } from '../types.js';
import { SONG1_EASY } from './charts/song1-easy.js';
import { SONG1_MEDIUM } from './charts/song1-medium.js';
import { SONG1_HARD } from './charts/song1-hard.js';
import { SONG2_EASY } from './charts/song2-easy.js';
import { SONG2_MEDIUM } from './charts/song2-medium.js';
import { SONG2_HARD } from './charts/song2-hard.js';
import { SONG3_EASY } from './charts/song3-easy.js';
import { SONG3_MEDIUM } from './charts/song3-medium.js';
import { SONG3_HARD } from './charts/song3-hard.js';

/**
 * Song metadata registry
 * Update this after adding actual audio files to public/audio/songs/
 */
export const SONGS: SongMetadata[] = [
  {
    id: 'song1',
    title: 'Electronic Beat',
    artist: 'KeyHero',
    bpm: 120,
    duration: 60,
    audioPath: '/audio/songs/song1/track.wav',
    license: 'CC0 / Public Domain',
    charts: {
      easy: SONG1_EASY,
      medium: SONG1_MEDIUM,
      hard: SONG1_HARD
    }
  },
  {
    id: 'song2',
    title: 'Rhythmic Flow',
    artist: 'KeyHero',
    bpm: 130,
    duration: 75,
    audioPath: '/audio/songs/song2/track.wav',
    license: 'CC0 / Public Domain',
    charts: {
      easy: SONG2_EASY,
      medium: SONG2_MEDIUM,
      hard: SONG2_HARD
    }
  },
  {
    id: 'song3',
    title: 'Speed Run',
    artist: 'KeyHero',
    bpm: 140,
    duration: 90,
    audioPath: '/audio/songs/song3/track.wav',
    license: 'CC0 / Public Domain',
    charts: {
      easy: SONG3_EASY,
      medium: SONG3_MEDIUM,
      hard: SONG3_HARD
    }
  }
];

/**
 * Get song metadata by ID
 */
export function getSongById(id: string): SongMetadata | undefined {
  return SONGS.find(song => song.id === id);
}

/**
 * Get all available songs
 */
export function getAllSongs(): SongMetadata[] {
  return [...SONGS];
}

/**
 * Get chart for a specific song and difficulty
 */
export function getChart(songId: string, difficulty: Difficulty): NoteChart | undefined {
  const song = getSongById(songId);
  return song?.charts[difficulty];
}

/**
 * Check if a song exists
 */
export function songExists(songId: string): boolean {
  return SONGS.some(song => song.id === songId);
}

/**
 * Get difficulty note count
 */
export function getDifficultyNoteCount(songId: string, difficulty: Difficulty): number {
  const chart = getChart(songId, difficulty);
  return chart ? chart.length : 0;
}

/**
 * Get song duration
 */
export function getSongDuration(songId: string): number {
  const song = getSongById(songId);
  return song ? song.duration : 0;
}

