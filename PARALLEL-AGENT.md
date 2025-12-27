# KeyHero – Parallel Development Strategy

## Overview

KeyHero's modular architecture enables **parallel development** of four independent subsystems. This document defines the parallel agent strategy, specifying module boundaries, interface contracts, and integration protocols.

### Why Parallel Development?

With clear interfaces, these four subsystems can be developed **simultaneously** by separate agents or team members:

1. **Audio Engine** – Core timing and music playback
2. **Canvas Renderer** – Visual layer and drawing
3. **Input & Scoring** – Keyboard handling and hit detection
4. **Game Loop & UI** – Orchestration and user interface

Each agent works independently, mocking dependencies as needed, then integrates at defined checkpoints.

---

## Module Dependency Graph

```
                    ┌─────────────────┐
                    │   types.ts      │
                    │  (No Deps)      │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  audioEngine.ts │
                    │ (Depends: types)│
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
┌───────▼──────┐    ┌────────▼────────┐   ┌──────▼──────┐
│  Renderer    │    │ Input & Scoring │   │Game Loop & UI│
│(Depends:     │    │(Depends:        │   │(Depends:    │
│ types,       │    │ types,          │   │ all above)  │
│ audioEngine) │    │ audioEngine)    │   │             │
└──────────────┘    └─────────────────┘   └─────────────┘
```

### Critical Insight

**Agent 1 (Audio Engine) must complete first** – it has no dependencies and everyone else depends on it.

Agents 2, 3, and 4 can work **in parallel** once Audio Engine is stable and interfaces are defined.

---

## Agent 1: Audio Engine Specialist

### Mission
Build the foundational timing system. **No code proceeds until this module is perfect.**

### Responsibilities

1. Initialize `AudioContext` on user interaction
2. Load and decode audio (WAV or procedural)
3. Implement `getSongTime()` with zero drift
4. Handle pause/resume/stop
5. Support calibration offset

### Deliverables

#### File: `src/audio/audioEngine.ts`

```typescript
export interface AudioEngine {
  start(): Promise<void>;
  getSongTime(): number;
  stop(): void;
  setOffset(offset: number): void;
  pause(): void;
  resume(): void;
}

export class WebAudioEngine implements AudioEngine {
  private audioContext: AudioContext;
  private songStartTime: number = 0;
  private calibrationOffset: number = 0;
  private sourceNode: AudioBufferSourceNode | null = null;

  async start(): Promise<void> {
    // Initialize AudioContext
    // Load/decode audio
    // Start playback
    // Record songStartTime
  }

  getSongTime(): number {
    const now = this.audioContext.currentTime;
    const elapsed = now - this.songStartTime;
    return Math.max(0, elapsed - this.calibrationOffset);
  }

  stop(): void {
    // Stop all sources
    // Reset state
  }

  setOffset(offset: number): void {
    this.calibrationOffset = offset;
  }

  pause(): void {
    this.audioContext.suspend();
  }

  resume(): void {
    this.audioContext.resume();
  }
}
```

#### File: `src/audio/proceduralTrack.ts` (Optional)

```typescript
export function generateProceduralTrack(
  audioContext: AudioContext,
  bpm: number,
  duration: number
): AudioBuffer {
  // Generate kick, snare, hi-hat using oscillators
  // Return AudioBuffer
}
```

### Validation Criteria

- ✅ `getSongTime()` returns monotonically increasing values
- ✅ 60-second playback has <1ms cumulative drift
- ✅ 50 consecutive restarts show no timing anomalies
- ✅ Console logs show smooth time progression
- ✅ No memory leaks (AudioContext properly cleaned up)

### Testing Protocol

```typescript
// Test 1: Basic timing
const engine = new WebAudioEngine();
await engine.start();
const t1 = engine.getSongTime();
await delay(1000);
const t2 = engine.getSongTime();
assert(Math.abs(t2 - t1 - 1.0) < 0.001, "Drift detected");

// Test 2: Restart reliability
for (let i = 0; i < 50; i++) {
  await engine.start();
  const time = engine.getSongTime();
  assert(time >= 0, "Negative time after restart");
  engine.stop();
}

// Test 3: Offset adjustment
engine.setOffset(0.050); // +50ms
await engine.start();
const adjustedTime = engine.getSongTime();
// Verify offset is applied
```

### Mock for Other Agents

While Audio Engine is in development, other agents use this mock:

```typescript
class MockAudioEngine {
  private startTime = 0;

  async start(): Promise<void> {
    this.startTime = performance.now() / 1000;
  }

  getSongTime(): number {
    return (performance.now() / 1000) - this.startTime;
  }

  stop(): void {}
  setOffset(_: number): void {}
  pause(): void {}
  resume(): void {}
}
```

---

## Agent 2: Canvas Renderer Specialist

### Mission
Build the visual layer. Renders notes, lanes, hit line, score, and feedback.

### Responsibilities

1. Initialize and resize Canvas
2. Draw 4 vertical lanes
3. Draw falling notes
4. Draw hit line
5. Draw score/combo text
6. Draw hit feedback ("PERFECT", "GOOD", "MISS")
7. Implement screen shake on miss

### Dependencies

- `types.ts` – Note interface
- `audioEngine.getSongTime()` – For note positioning
- Mock data during development

### Deliverables

#### File: `src/render/canvas.ts`

```typescript
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

  constructor(canvasSelector: string) {
    this.canvas = document.querySelector(canvasSelector)!;
    this.ctx = this.canvas.getContext('2d')!;
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize(): void {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  clear(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  drawLanes(): void {
    const laneWidth = this.canvas.width / 4;
    const colors = ['#2a2a4e', '#1a1a2e'];

    for (let i = 0; i < 4; i++) {
      this.ctx.fillStyle = colors[i % 2];
      this.ctx.fillRect(i * laneWidth, 0, laneWidth, this.canvas.height);
    }
  }

  drawHitLine(): void {
    const y = this.canvas.height * 0.8;
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.moveTo(0, y);
    this.ctx.lineTo(this.canvas.width, y);
    this.ctx.stroke();
  }

  drawNotes(notes: Note[], songTime: number): void {
    const laneWidth = this.canvas.width / 4;
    const hitLineY = this.canvas.height * 0.8;
    const travelTime = 2.0;

    // Filter visible notes only
    const visibleNotes = notes.filter(note => {
      const timeUntilHit = note.hitTime - songTime;
      return timeUntilHit > -0.5 && timeUntilHit < travelTime;
    });

    visibleNotes.forEach(note => {
      const timeUntilHit = note.hitTime - songTime;
      const progress = timeUntilHit / travelTime;
      const y = hitLineY - (progress * hitLineY);
      const x = note.lane * laneWidth;

      // Draw note
      this.ctx.fillStyle = '#ff6b6b';
      this.ctx.fillRect(x + 10, y - 20, laneWidth - 20, 40);
    });
  }

  drawScore(score: number, combo: number): void {
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 48px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(`Score: ${score}`, this.canvas.width / 2, 50);

    if (combo > 0) {
      this.ctx.font = 'bold 36px Arial';
      this.ctx.fillText(`Combo: ${combo}`, this.canvas.width / 2, 100);
    }
  }

  drawFeedback(feedback: string): void {
    if (!feedback) return;

    const y = this.canvas.height * 0.8 + 60;
    this.ctx.font = 'bold 32px Arial';
    this.ctx.textAlign = 'center';

    if (feedback === 'PERFECT') this.ctx.fillStyle = '#ffd700';
    else if (feedback === 'GOOD') this.ctx.fillStyle = '#4ecdc4';
    else if (feedback === 'MISS') this.ctx.fillStyle = '#ff6b6b';

    this.ctx.fillText(feedback, this.canvas.width / 2, y);
  }

  setShake(intensity: number): void {
    this.shakeIntensity = intensity;
  }

  private applyShake(): void {
    if (this.shakeIntensity > 0) {
      const offsetX = (Math.random() - 0.5) * this.shakeIntensity;
      const offsetY = (Math.random() - 0.5) * this.shakeIntensity;
      this.ctx.translate(offsetX, offsetY);
      this.shakeIntensity *= 0.9;
    }
  }
}
```

### Mock Data for Development

```typescript
// Mock notes for testing renderer
const mockNotes: Note[] = [
  { lane: 0, hitTime: 1.0 },
  { lane: 1, hitTime: 1.5 },
  { lane: 2, hitTime: 2.0 },
  { lane: 3, hitTime: 2.5 },
  // ... more notes
];

// Mock song time
let mockSongTime = 0;
setInterval(() => {
  mockSongTime += 0.016; // ~60fps
}, 16);

// Render loop
function renderLoop() {
  renderer.clear();
  renderer.drawLanes();
  renderer.drawHitLine();
  renderer.drawNotes(mockNotes, mockSongTime);
  renderer.drawScore(1000, 5);
  requestAnimationFrame(renderLoop);
}
```

### Validation Criteria

- ✅ Notes fall smoothly at constant speed
- ✅ Notes align perfectly with hit line when `songTime === note.hitTime`
- ✅ Lanes are evenly spaced
- ✅ Score/combo text is legible
- ✅ Screen shake is subtle but noticeable
- ✅ No rendering artifacts or flickering

---

## Agent 3: Input & Scoring Specialist

### Mission
Handle keyboard input, detect hits, calculate score, track combos.

### Responsibilities

1. Listen for A, S, D, F key presses
2. Debounce repeated keydown events
3. Find nearest unhit note in lane
4. Evaluate hit/miss based on time window
5. Calculate score and combo
6. Trigger sound effects
7. Track statistics (perfect count, good count, miss count)

### Dependencies

- `types.ts` – Note interface
- `audioEngine.getSongTime()` – For hit detection
- Mock audio engine during development

### Deliverables

#### File: `src/game/input.ts`

```typescript
export interface InputHandler {
  onKeyDown(key: string): void;
  onKeyUp(key: string): void;
  getHeldKeys(): Set<string>;
}

export class KeyboardInput implements InputHandler {
  private heldKeys = new Set<string>();
  private keyToLane: Record<string, number> = { 'a': 0, 's': 1, 'd': 2, 'f': 3 };

  onKeyDown(key: string): void {
    this.heldKeys.add(key.toLowerCase());
  }

  onKeyUp(key: string): void {
    this.heldKeys.delete(key.toLowerCase());
  }

  getHeldKeys(): Set<string> {
    return this.heldKeys;
  }

  getLane(key: string): number | undefined {
    return this.keyToLane[key.toLowerCase()];
  }
}
```

#### File: `src/game/scoring.ts`

```typescript
export interface ScoringSystem {
  evaluateHit(note: Note, songTime: number): HitResult;
  calculateScore(stats: GameStats): number;
}

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

export class RhythmScoring implements ScoringSystem {
  evaluateHit(note: Note, songTime: number): HitResult {
    const timeDiff = Math.abs(note.hitTime - songTime);

    if (timeDiff <= 0.060) {
      return { rating: 'PERFECT', scoreDelta: 100, timeDiff };
    } else if (timeDiff <= 0.120) {
      return { rating: 'GOOD', scoreDelta: 50, timeDiff };
    } else {
      return { rating: 'MISS', scoreDelta: 0, timeDiff };
    }
  }

  calculateScore(stats: GameStats): number {
    return (stats.perfectCount * 100) + (stats.goodCount * 50);
  }
}
```

#### File: `src/game/gameState.ts`

```typescript
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
      if (result.rating === 'PERFECT') this.stats.perfectCount++;
      else this.stats.goodCount++;

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
}
```

### Mock Data for Development

```typescript
// Mock song time
let mockSongTime = 0;

// Mock notes
const mockNotes: Note[] = [
  { lane: 0, hitTime: 2.0, hit: false },
  { lane: 1, hitTime: 2.5, hit: false },
];

// Mock input handler
const input = new KeyboardInput();
window.addEventListener('keydown', (e) => {
  const lane = input.getLane(e.key);
  if (lane === undefined) return;

  if (input.getHeldKeys().has(e.key.toLowerCase())) return; // Debounce

  input.onKeyDown(e.key);

  const songTime = mockSongTime;
  const note = findNearestNote(mockNotes, lane, songTime);

  if (note) {
    const scoring = new RhythmScoring();
    const result = scoring.evaluateHit(note, songTime);
    console.log(`Hit: ${result.rating}, Score: ${result.scoreDelta}`);
    note.hit = true;
  }
});
```

### Validation Criteria

- ✅ Each key press maps to correct lane
- ✅ Holding a key doesn't trigger multiple hits
- ✅ Hit detection respects time windows (±60ms, ±120ms)
- ✅ Combo increments on hit, resets on miss
- ✅ Score calculation is correct
- ✅ Statistics track accurately

---

## Agent 4: Game Loop & UI Specialist

### Mission
Orchestrate all systems. Build game loop, UI, calibration, state management.

### Responsibilities

1. Implement main game loop using `requestAnimationFrame`
2. Coordinate audio, rendering, input, and scoring
3. Manage game state (menu, playing, paused, ended)
4. Implement calibration UI
5. Implement end screen stats
6. Handle restart/stop buttons
7. Manage lifecycle (start → play → end → restart)

### Dependencies

- **All other modules** – This agent integrates everything

### Deliverables

#### File: `src/game/loop.ts`

```typescript
export class GameLoop {
  private audioEngine: AudioEngine;
  private renderer: CanvasRenderer;
  private input: InputHandler;
  private scoring: ScoringSystem;
  private gameState: GameState;

  private isRunning = false;
  private animationFrameId: number | null = null;
  private feedbackTimeout: number | null = null;

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
    }
  }

  private loop(): void {
    if (!this.isRunning) return;

    // 1. Get authoritative time
    const songTime = this.audioEngine.getSongTime();

    // 2. Check for song end
    if (songTime > this.chartDuration) {
      this.endGame();
      return;
    }

    // 3. Clear and render
    this.renderer.clear();
    this.renderer.drawLanes();
    this.renderer.drawHitLine();
    this.renderer.drawNotes(this.chart, songTime);
    this.renderer.drawScore(this.gameState.getScore(), this.gameState.getCombo());

    // 4. Check for missed notes
    this.checkMissedNotes(songTime);

    // 5. Request next frame
    this.animationFrameId = requestAnimationFrame(() => this.loop());
  }

  private checkMissedNotes(songTime: number): void {
    this.chart.forEach(note => {
      if (note.hit) return;

      const timeDiff = note.hitTime - songTime;
      if (timeDiff < -0.120) {
        // Note missed
        const result = this.scoring.evaluateHit(note, songTime);
        this.gameState.processHit(result);
        this.showFeedback(result.rating);
      }
    });
  }

  handleKeyPress(key: string): void {
    const lane = this.input.getLane(key);
    if (lane === undefined) return;

    const songTime = this.audioEngine.getSongTime();
    const note = this.findNearestNote(lane, songTime);

    if (note && !note.hit) {
      const result = this.scoring.evaluateHit(note, songTime);
      this.gameState.processHit(result);
      note.hit = true;
      this.showFeedback(result.rating);
      this.playSound(result.rating);
    }
  }

  private showFeedback(rating: string): void {
    this.renderer.drawFeedback(rating);
    if (rating === 'MISS') {
      this.renderer.setShake(5);
    }
  }

  private endGame(): void {
    this.isRunning = false;
    const stats = this.gameState.getStats();
    this.showEndScreen(stats);
  }
}
```

#### File: `src/ui/calibration.ts`

```typescript
export class CalibrationUI {
  private audioEngine: AudioEngine;
  private renderer: CanvasRenderer;

  async start(): Promise<void> {
    // Show calibration UI
    // Play metronome beep
    // Flash visual indicator
    // User adjusts slider
    // Save offset to localStorage
  }

  private adjustOffset(deltaMs: number): void {
    const currentOffset = parseFloat(localStorage.getItem('audioOffset') || '0');
    const newOffset = currentOffset + (deltaMs / 1000);
    this.audioEngine.setOffset(newOffset);
    localStorage.setItem('audioOffset', newOffset.toString());
  }
}
```

#### File: `src/ui/stats.ts`

```typescript
export class StatsScreen {
  show(stats: GameStats): void {
    const accuracy = this.calculateAccuracy(stats);
    const grade = this.calculateGrade(accuracy);

    // Render end screen with:
    // - Final score
    // - Max combo
    // - Perfect/Good/Miss counts
    // - Accuracy percentage
    // - Letter grade (S, A, B, C, D, F)
    // - Restart button
  }

  private calculateAccuracy(stats: GameStats): number {
    const total = stats.perfectCount + stats.goodCount + stats.missCount;
    if (total === 0) return 0;
    const weightedScore = (stats.perfectCount * 100 + stats.goodCount * 50);
    const maxScore = total * 100;
    return (weightedScore / maxScore) * 100;
  }

  private calculateGrade(accuracy: number): string {
    if (accuracy >= 95) return 'S';
    if (accuracy >= 90) return 'A';
    if (accuracy >= 80) return 'B';
    if (accuracy >= 70) return 'C';
    if (accuracy >= 60) return 'D';
    return 'F';
  }
}
```

### Validation Criteria

- ✅ Game loop runs at 60fps
- ✅ Audio, visuals, and input stay synchronized
- ✅ State transitions work (menu → play → end)
- ✅ Calibration mode saves offset correctly
- ✅ End screen shows accurate stats
- ✅ Restart works reliably

---

## Integration Protocol

### Phase 1: Audio Engine Foundation (Agent 1 Only)

**Week 1**: Agent 1 builds Audio Engine alone.
- Other agents wait.
- Daily validation of timing correctness.
- No other work begins until Audio Engine passes all tests.

### Phase 2: Parallel Development (Agents 2, 3, 4)

**Week 2-3**: Agents 2, 3, and 4 work in parallel.

**Agent 2 (Renderer)**:
- Uses mock audio engine
- Uses mock note data
- Builds all rendering in isolation

**Agent 3 (Input & Scoring)**:
- Uses mock audio engine
- Tests with hardcoded note data
- Builds hit detection and scoring

**Agent 4 (Game Loop)**:
- Waits for Agents 2 and 3 to make progress
- Starts with mock versions of all dependencies
- Gradually replaces mocks with real implementations

### Phase 3: Integration (All Agents)

**Week 4**: Integrate all modules.

**Day 1-2**: Replace mocks with real implementations
- Agent 4 swaps mock audio engine for real one
- Agent 4 connects real renderer and input

**Day 3-4**: Full integration testing
- Run complete game loop
- Test all state transitions
- Validate audio-visual synchronization

**Day 5**: Bug fixes and polish
- Fix integration issues
- Smooth out rough edges

### Phase 4: Validation (All Agents)

**Week 5**: Milestone validation.

- Run Milestone 1 tests (audio only)
- Run Milestone 2 tests (playable prototype)
- Run Milestone 3 tests (polish)
- Fix any failing tests

---

## Communication Protocol

### Interface Contracts

Before parallel work begins, **all agents must agree on interfaces**:

```typescript
// src/types.ts - Shared by all agents
export interface Note {
  lane: number;
  hitTime: number;
  hit?: boolean;
}

export interface AudioEngine {
  start(): Promise<void>;
  getSongTime(): number;
  stop(): void;
  setOffset(offset: number): void;
}

export interface CanvasRenderer {
  resize(): void;
  clear(): void;
  drawLanes(): void;
  drawHitLine(): void;
  drawNotes(notes: Note[], songTime: number): void;
  drawScore(score: number, combo: number): void;
}

export interface InputHandler {
  getLane(key: string): number | undefined;
  onKeyDown(key: string): void;
  onKeyUp(key: string): void;
}
```

### Mock Implementations

Each agent provides mocks for their dependencies:

```typescript
// Agent 1 provides MockAudioEngine
// Agent 2 uses MockAudioEngine and MockNotes
// Agent 3 uses MockAudioEngine and MockNotes
// Agent 4 uses all mocks initially
```

### Integration Checkpoint

**Every Friday**: All agents sync up.
- Demo current progress
- Test integration points
- Resolve interface mismatches
- Update contracts if needed

---

## Risk Mitigation

### Risk 1: Interface Mismatch

**Mitigation**: Define interfaces upfront, write them in stone, use TypeScript strict mode.

### Risk 2: Audio Engine Delay

**Mitigation**: Agent 1 starts first. Others wait with mock implementations.

### Risk 3: Integration Nightmares

**Mitigation**: Weekly integration checkpoints. Test integration early and often.

### Risk 4: Drifting Requirements

**Mitigation**: BUILDPLAN.md is source of truth. No changes without all-agent agreement.

---

## Success Metrics

### Agent 1 (Audio Engine)
- ✅ 100% of timing tests pass
- ✅ Zero drift in 60-second tests
- ✅ 50 consecutive successful restarts

### Agent 2 (Renderer)
- ✅ 60fps with 100 visible notes
- ✅ Notes align with hit line at exact time
- ✅ Zero rendering artifacts

### Agent 3 (Input & Scoring)
- ✅ All 4 keys respond correctly
- ✅ Hit detection within ±5ms of target
- ✅ Combo tracking 100% accurate

### Agent 4 (Game Loop)
- ✅ Full song plays without crashes
- ✅ All state transitions work
- ✅ Audio-visual sync maintained

### Integration
- ✅ All modules work together
- ✅ Milestone 1-3 tests pass
- ✅ Game is fun to play

---

## Conclusion

Parallel development accelerates KeyHero development **if and only if**:

1. Interfaces are defined upfront
2. Audio Engine is rock-solid first
3. Mock implementations are comprehensive
4. Integration happens frequently
5. Communication is clear and frequent

**Follow this protocol, and KeyHero will come together smoothly. Deviate from it, and integration becomes a nightmare.**

---

*End of Parallel Agent Strategy*
