import type { Note } from '../types.js';

export interface CanvasRenderer {
  resize(): void;
  clear(): void;
  drawLanes(): void;
  drawHitLine(): void;
  drawNotes(notes: Note[], songTime: number): void;
  drawScore(score: number, combo: number): void;
  drawFeedback(feedback: string): void;
  setShake(intensity: number): void;
}

export class Canvas2DRenderer implements CanvasRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private shakeIntensity: number = 0;
  private hitLineY: number;
  private laneWidth: number;

  constructor() {
    this.canvas = document.querySelector('canvas')!;
    this.ctx = this.canvas.getContext('2d')!;

    this.hitLineY = 0;
    this.laneWidth = 0;

    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize(): void {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.laneWidth = this.canvas.width / 4;
    
    // Adjust hit line to be above touch controls on mobile
    // Touch controls are ~120px, so move hit line up a bit more
    const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (isMobile && window.innerHeight < 800) {
      // On smaller screens, move hit line higher
      this.hitLineY = this.canvas.height * 0.65;
    } else if (isMobile) {
      this.hitLineY = this.canvas.height * 0.7;
    } else {
      this.hitLineY = this.canvas.height * 0.8;
    }
  }

  clear(): void {
    this.ctx.save();

    if (this.shakeIntensity > 0) {
      const offsetX = (Math.random() - 0.5) * this.shakeIntensity;
      const offsetY = (Math.random() - 0.5) * this.shakeIntensity;
      this.ctx.translate(offsetX, offsetY);
      this.shakeIntensity *= 0.9;
      if (this.shakeIntensity < 0.1) {
        this.shakeIntensity = 0;
      }
    }

    this.ctx.fillStyle = '#1a1a2e';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.restore();
  }

  drawLanes(): void {
    const colors = ['#2a2a4e', '#1a1a2e'];

    for (let i = 0; i < 4; i++) {
      this.ctx.fillStyle = colors[i % 2];
      this.ctx.fillRect(i * this.laneWidth, 0, this.laneWidth, this.canvas.height);

      this.ctx.strokeStyle = '#3a3a5e';
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.moveTo(i * this.laneWidth, 0);
      this.ctx.lineTo(i * this.laneWidth, this.canvas.height);
      this.ctx.stroke();
    }
  }

  drawHitLine(): void {
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.moveTo(0, this.hitLineY);
    this.ctx.lineTo(this.canvas.width, this.hitLineY);
    this.ctx.stroke();
  }

  drawNotes(notes: Note[], songTime: number): void {
    const travelTime = 2.0;
    const noteHeight = 40;
    const notePadding = 10;

    const visibleNotes = notes.filter(note => {
      const timeUntilHit = note.hitTime - songTime;
      return timeUntilHit > -0.5 && timeUntilHit < travelTime;
    });

    visibleNotes.forEach(note => {
      if (note.hit) return;

      const timeUntilHit = note.hitTime - songTime;
      const progress = timeUntilHit / travelTime;
      const y = this.hitLineY - (progress * this.hitLineY) - (noteHeight / 2);
      const x = note.lane * this.laneWidth + notePadding;
      const width = this.laneWidth - (notePadding * 2);

      this.ctx.fillStyle = '#ff6b6b';
      this.ctx.fillRect(x, y, width, noteHeight);

      this.ctx.strokeStyle = '#ff8888';
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(x, y, width, noteHeight);
    });
  }

  drawScore(score: number, combo: number): void {
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 48px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'top';
    this.ctx.fillText(`Score: ${score}`, this.canvas.width / 2, 20);

    if (combo > 0) {
      this.ctx.font = 'bold 36px Arial';
      this.ctx.fillText(`Combo: ${combo}`, this.canvas.width / 2, 80);
    }
  }

  drawFeedback(feedback: string): void {
    if (!feedback) return;

    const y = this.hitLineY + 60;
    this.ctx.font = 'bold 32px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'top';

    switch (feedback) {
      case 'PERFECT':
        this.ctx.fillStyle = '#ffd700';
        break;
      case 'GOOD':
        this.ctx.fillStyle = '#4ecdc4';
        break;
      case 'MISS':
        this.ctx.fillStyle = '#ff6b6b';
        break;
      default:
        this.ctx.fillStyle = '#ffffff';
    }

    this.ctx.fillText(feedback, this.canvas.width / 2, y);
  }

  setShake(intensity: number): void {
    this.shakeIntensity = intensity;
  }
}
