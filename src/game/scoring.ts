import type { Note } from '../types.js';

export interface HitResult {
  rating: 'PERFECT' | 'GOOD' | 'MISS';
  scoreDelta: number;
  timeDiff: number;
}

export interface GameStats {
  perfectCount: number;
  goodCount: number;
  missCount: number;
  maxCombo: number;
  currentCombo: number;
}

export class RhythmScoring {
  evaluateHit(note: Note, songTime: number): HitResult {
    const timeDiff = Math.abs(note.hitTime - songTime);

    if (timeDiff <= 0.060) {
      return {
        rating: 'PERFECT',
        scoreDelta: 100,
        timeDiff
      };
    } else if (timeDiff <= 0.120) {
      return {
        rating: 'GOOD',
        scoreDelta: 50,
        timeDiff
      };
    } else {
      return {
        rating: 'MISS',
        scoreDelta: 0,
        timeDiff
      };
    }
  }
}

export class GameState {
  private stats: GameStats = {
    perfectCount: 0,
    goodCount: 0,
    missCount: 0,
    maxCombo: 0,
    currentCombo: 0
  };

  private score: number = 0;

  processHit(result: HitResult): void {
    if (result.rating === 'MISS') {
      this.stats.missCount++;
      this.stats.currentCombo = 0;
    } else {
      if (result.rating === 'PERFECT') {
        this.stats.perfectCount++;
      } else {
        this.stats.goodCount++;
      }

      this.stats.currentCombo++;
      this.stats.maxCombo = Math.max(this.stats.maxCombo, this.stats.currentCombo);
      this.score += result.scoreDelta;
    }
  }

  getStats(): GameStats {
    return { ...this.stats };
  }

  getScore(): number {
    return this.score;
  }

  getCombo(): number {
    return this.stats.currentCombo;
  }

  getMaxCombo(): number {
    return this.stats.maxCombo;
  }

  reset(): void {
    this.stats = {
      perfectCount: 0,
      goodCount: 0,
      missCount: 0,
      maxCombo: 0,
      currentCombo: 0
    };
    this.score = 0;
  }

  getAccuracy(): number {
    const total = this.stats.perfectCount + this.stats.goodCount + this.stats.missCount;
    if (total === 0) return 0;

    const weightedScore = (this.stats.perfectCount * 100 + this.stats.goodCount * 50);
    const maxScore = total * 100;
    return (weightedScore / maxScore) * 100;
  }

  getGrade(): string {
    const accuracy = this.getAccuracy();
    if (accuracy >= 95) return 'S';
    if (accuracy >= 90) return 'A';
    if (accuracy >= 80) return 'B';
    if (accuracy >= 70) return 'C';
    if (accuracy >= 60) return 'D';
    return 'F';
  }
}
