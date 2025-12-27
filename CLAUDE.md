# KeyHero – Project Documentation

## Project Overview

**KeyHero** is a self-hosted Guitar Hero-style rhythm game for desktop browsers. The project's defining characteristic is **audio-first architecture** – Web Audio API timing is the single source of truth for all game systems.

### Core Identity

- **Type**: Web-based rhythm game (similar to Guitar Hero)
- **Platform**: Desktop browsers (Chrome, Firefox, Safari)
- **Input**: Keyboard only (4 lanes: A, S, D, F keys)
- **Architecture**: Audio-first design with Web Audio API as master clock

### Project Status

**Phase**: Planning → Pre-development

**Documentation Status**:
- ✅ BUILDPLAN.md – Complete technical specification
- ✅ PARALLEL-AGENT.md – Parallel development strategy
- ✅ CLAUDE.md – This file (project documentation)

**Next Step**: Begin Milestone 1 (Audio Engine) implementation

---

## Core Architectural Principles

### 1. Audio Timing is the Single Source of Truth

**Principle**: All gameplay logic derives from `audioContext.currentTime`. Nothing else.

```typescript
// ✅ CORRECT - Every frame starts with this
const songTime = audioEngine.getSongTime();

// ❌ WRONG - Never use frame-based timing
const songTime = frameCount * 0.016;
```

**Why**: Frame timing varies (monitor refresh rate, frame drops, browser scheduling). Audio time is consistent and precise.

### 2. No HTML `<audio>` Elements for Timing

**Principle**: Use Web Audio API exclusively for all timing operations.

```typescript
// ✅ CORRECT - Web Audio API
const audioContext = new AudioContext();
const source = audioContext.createBufferSource();
source.start(0);

// ❌ WRONG - HTML audio element
const audio = new Audio('song.wav');
audio.play();
```

**Why**: `<audio>` element timing is inconsistent across browsers and has no microsecond precision.

### 3. No `setTimeout` or `setInterval` for Gameplay

**Principle**: Use `requestAnimationFrame` for the game loop only.

```typescript
// ✅ CORRECT - Game loop
function gameLoop() {
  const songTime = audioEngine.getSongTime();
  updateGame(songTime);
  requestAnimationFrame(gameLoop);
}

// ❌ WRONG - Timed loop
setInterval(() => {
  updateGame();
}, 16);
```

**Why**: Timers drift and are not synchronized with browser paint cycles.

### 4. Interface-Driven Design

**Principle**: Define interfaces upfront, implement to contract.

```typescript
// Interface defined in src/types.ts
interface AudioEngine {
  start(): Promise<void>;
  getSongTime(): number;
  stop(): void;
}

// Any implementation must match this interface
class WebAudioEngine implements AudioEngine {
  // Implementation details vary, interface is fixed
}
```

**Why**: Enables parallel development and easy mocking for testing.

---

## Technology Stack

### Core Technologies

- **Build Tool**: Vite 5.x (fast dev server, optimized builds)
- **Language**: TypeScript 5.x (strict mode enabled)
- **Rendering**: HTML5 Canvas (2D context)
- **Audio**: Web Audio API only
- **Runtime**: Modern browsers (ES2020+)

### Dependencies

```json
{
  "devDependencies": {
    "vite": "^5.0.0",
    "typescript": "^5.3.0",
    "@types/node": "^20.0.0"
  }
}
```

**No runtime dependencies** – Pure vanilla JavaScript/TypeScript.

### Why No Game Engine?

**Rationale**: Game engines (Phaser, Unity, etc.) add abstraction layers that can introduce timing inconsistencies. By using raw Canvas and Web Audio API, we have direct control over timing and rendering.

**Trade-off**: More code to write, but 100% control over critical timing.

---

## Project Structure

```
keyhero/
├── public/
│   ├── audio/
│   │   └── track.wav          # CC0 music file (Option A)
│   └── sfx/
│       ├── hit.wav            # Sound effects
│       ├── miss.wav
│       └── combo.wav
├── src/
│   ├── audio/
│   │   ├── audioEngine.ts     # Core audio system
│   │   ├── proceduralTrack.ts # Procedural music (Option B)
│   │   └── audioLoader.ts     # WAV file loader (Option A)
│   ├── game/
│   │   ├── chart.ts           # Note data and charts
│   │   ├── input.ts           # Keyboard handling
│   │   ├── scoring.ts         # Hit detection and score
│   │   ├── loop.ts            # Game loop orchestration
│   │   └── gameState.ts       # State management
│   ├── render/
│   │   ├── canvas.ts          # Canvas rendering
│   │   └── draw.ts            # Drawing helpers
│   ├── ui/
│   │   ├── calibration.ts     # Calibration UI
│   │   └── stats.ts           # End screen stats
│   ├── types.ts               # Shared interfaces
│   ├── config.ts              # Configuration
│   └── index.ts               # Entry point
├── BUILDPLAN.md               # Technical specification (READ THIS)
├── PARALLEL-AGENT.md          # Parallel development strategy
├── CLAUDE.md                  # This file (project documentation)
├── package.json
├── tsconfig.json
└── vite.config.ts
```

### Module Overview

**Audio Layer** (`src/audio/`):
- `audioEngine.ts` – Core timing system, most critical module
- `proceduralTrack.ts` – Generates music via oscillators
- `audioLoader.ts` – Loads and decodes WAV files

**Game Logic** (`src/game/`):
- `chart.ts` – Note data structures and chart management
- `input.ts` – Keyboard input handling with debouncing
- `scoring.ts` – Hit detection and score calculation
- `loop.ts` – Main game loop orchestration
- `gameState.ts` – Score, combo, statistics tracking

**Rendering** (`src/render/`):
- `canvas.ts` – Canvas renderer for lanes, notes, hit line
- `draw.ts` – Helper functions for drawing shapes

**User Interface** (`src/ui/`):
- `calibration.ts` – Audio latency calibration mode
- `stats.ts` – End screen statistics display

---

## Development Commands

### Initial Setup

```bash
# Create project directory
mkdir keyhero && cd keyhero

# Initialize project
npm init -y

# Install dependencies
npm install --save-dev vite typescript @types/node

# Initialize TypeScript
npx tsc --init

# Configure Vite (create vite.config.ts)
# Configure TypeScript (edit tsconfig.json)
```

### Development Workflow

```bash
# Start development server
npm run dev

# Open browser to http://localhost:5173
# Game loads with "Click to Start" overlay

# Build for production
npm run build

# Preview production build
npm run preview
```

### File Watching

Vite provides hot module replacement (HMR) by default:
- Edit `.ts` files → browser auto-refreshes
- Edit `public/` files → changes reflected immediately

**Note**: Audio context requires user interaction, so HMR may pause audio. Click "Start" again after refresh.

---

## Core Game Mechanics

### Visual Layout

```
┌─────────────────────────────────────┐
│         Score: 1000                  │
│         Combo: 5                     │
├──────────┬──────────┬──────────┬─────┤
│  Lane A  │  Lane S  │  Lane D  │  F  │
│          │          │          │     │
│          │    ○     │          │     │
│          │          │    ○     │     │
│          │          │          │     │
├──────────┴──────────┴──────────┴─────┤
│           HIT LINE                   │
└─────────────────────────────────────┘
```

### Input Controls

| Lane | Key | Finger |
|------|-----|--------|
| 1 (left) | A | Pinky |
| 2 | S | Ring |
| 3 | D | Middle |
| 4 (right) | F | Index |

### Timing Windows

| Rating | Window | Score |
|--------|--------|-------|
| PERFECT | ±60ms | 100 pts |
| GOOD | ±120ms | 50 pts |
| MISS | >120ms | 0 pts (combo reset) |

### Combo System

- Combo increments on successful hit
- Combo resets to 0 on miss
- No combo multiplier (keeps scoring simple for MVP)
- Milestone chimes at 10, 20, 50, 100 combo

---

## Audio System Architecture

### Audio Engine API

```typescript
interface AudioEngine {
  // Initialize and start playback
  start(): Promise<void>;

  // Get current song time (THE critical method)
  getSongTime(): number;

  // Stop and reset
  stop(): void;

  // Adjust for device latency
  setOffset(seconds: number): void;
}
```

### Timing Mathematics

```typescript
getSongTime(): number {
  const now = this.audioContext.currentTime;
  const elapsed = now - this.songStartTime;
  const calibrated = elapsed - this.calibrationOffset;
  return Math.max(0, calibrated);
}
```

**Critical**: `songStartTime` is recorded when audio starts playing. All time calculations derive from this.

### Calibration System

**Purpose**: Different devices have different audio/visual latency.

**Solution**: User adjusts offset slider until visual metronome flash aligns with audio beep.

**Storage**: `localStorage.setItem('audioOffset', offsetValue)`

**Range**: ±100ms (most device latency falls within this range)

---

## Milestone-Based Development

### Milestone 1: Audio Proof (Foundation)

**Focus**: Audio timing only. No visuals.

**Tasks**:
- [ ] Implement `AudioEngine` class
- [ ] Load/decode audio (WAV or procedural)
- [ ] Implement `getSongTime()` with drift-free timing
- [ ] Implement `stop()` and restart logic
- [ ] Console log `songTime` for verification

**Validation**:
- ✅ 60-second playback with <1ms drift
- ✅ 50 consecutive restarts with no timing anomalies
- ✅ Console shows smooth time progression

**Definition of Done**: All audio tests pass. No visual work until this is complete.

---

### Milestone 2: Playable Prototype (Core Gameplay)

**Focus**: Make it playable.

**Tasks**:
- [ ] Implement Canvas renderer (lanes, notes, hit line)
- [ ] Implement keyboard input
- [ ] Implement hit detection
- [ ] Implement basic scoring
- [ ] Create test chart (~30 notes)

**Validation**:
- ✅ Notes fall smoothly
- ✅ Keyboard input works
- ✅ Hit detection feels fair
- ✅ Score increments correctly

**Definition of Done**: You can play through a song and it feels like a rhythm game.

---

### Milestone 3: Polish (Complete Experience)

**Focus**: Make it feel finished.

**Tasks**:
- [ ] Add sound effects
- [ ] Implement combo display
- [ ] Add end screen stats
- [ ] Implement calibration mode
- [ ] Add visual feedback (Perfect/Good/Miss)
- [ ] Add screen shake on miss

**Validation**:
- ✅ All features work
- ✅ Game is fun to play
- ✅ No crashes or bugs

**Definition of Done**: Game is complete. **Stop here.**

---

## Anti-Patterns to Avoid

### ❌ HTML Audio for Timing

```typescript
// WRONG
const audio = new Audio('song.wav');
const time = audio.currentTime;
```

**Why**: `<audio>` element timing is imprecise and inconsistent.

**Correct**: Use Web Audio API `audioContext.currentTime`.

---

### ❌ Frame-Based Timing

```typescript
// WRONG
let frameCount = 0;
function loop() {
  frameCount++;
  const songTime = frameCount * 0.016;
}
```

**Why**: Frame rate varies (60fps → 30fps → 144fps), causing timing drift.

**Correct**: `const songTime = audioEngine.getSongTime();`

---

### ❌ setTimeout for Gameplay

```typescript
// WRONG
setTimeout(() => {
  spawnNote();
}, 1000);
```

**Why**: Timers drift and are not synchronized with audio.

**Correct**: Spawn notes based on `songTime` in the game loop.

---

### ❌ Complex Visuals Before Audio

```typescript
// WRONG - Don't build this yet
function renderParticles() {
  // Particle system with 1000 particles
}
```

**Why**: Visual polish is irrelevant if audio timing is broken.

**Correct**: Flat colors, simple rendering. Audio first, always.

---

## Audio Correctness Validation

### Test 1: Basic Timing

```typescript
const engine = new WebAudioEngine();
await engine.start();

const t1 = engine.getSongTime();
await delay(1000); // Wait 1 second
const t2 = engine.getSongTime();

const diff = t2 - t1;
console.log(`Elapsed: ${diff}s`);

// Should be ~1.000s (±0.001s tolerance)
assert(Math.abs(diff - 1.0) < 0.001, "Drift detected");
```

### Test 2: Restart Reliability

```typescript
const engine = new WebAudioEngine();

for (let i = 0; i < 50; i++) {
  await engine.start();
  const time = engine.getSongTime();

  assert(time >= 0, `Negative time on restart ${i}`);
  assert(time < 0.1, `Excessive time on restart ${i}`);

  engine.stop();
}

console.log("✅ 50 restarts successful");
```

### Test 3: Long-Term Drift

```typescript
await engine.start();

const startTime = engine.getSongTime();
await delay(60000); // Wait 60 seconds
const endTime = engine.getSongTime();

const expected = 60.0;
const actual = endTime - startTime;
const drift = Math.abs(actual - expected);

console.log(`Drift over 60s: ${drift * 1000}ms`);

assert(drift < 0.001, "Unacceptable drift");
```

### Manual Test: Metronome Sync

1. Create chart with metronome notes (every 1.0 seconds)
2. Add audio metronome beep (same timing)
3. Play game and observe
4. Visual notes and audio beeps should align perfectly
5. Any visible drift = audio timing bug

---

## Common Issues & Solutions

### Issue: Audio Context Won't Start

**Symptom**: `AudioContext` state is `suspended` after creation.

**Cause**: Browser policy requires user interaction before audio can play.

**Solution**:
```typescript
// Show "Click to Start" overlay
startButton.addEventListener('click', async () => {
  await audioContext.resume();
  await audioEngine.start();
});
```

---

### Issue: Notes Don't Align with Audio

**Symptom**: Visual notes early/late compared to audio beats.

**Diagnosis**:
1. Check `getSongTime()` math
2. Verify `songStartTime` is recorded correctly
3. Check for frame-based timing anywhere in code
4. Test calibration offset

**Solution**: Ensure ALL timing derives from `audioContext.currentTime`.

---

### Issue: Combo Resets Incorrectly

**Symptom**: Combo resets even on successful hits.

**Cause**: Hit detection logic bug or combo reset called multiple times.

**Solution**:
```typescript
// Check combo reset logic
if (result.rating === 'MISS') {
  this.combo = 0; // Only reset on miss
}
```

---

### Issue: Frame Rate Drops

**Symptom**: Game stutters, notes jump.

**Cause**: Too many notes being rendered, or expensive calculations in loop.

**Solution**:
1. Cull off-screen notes (only render visible ones)
2. Avoid object allocations in loop
3. Use flat colors instead of gradients
4. Profile with browser DevTools

---

## Development Workflow

### Daily Workflow

1. **Morning**: Pull latest code, run tests
2. **Start**: `npm run dev`
3. **Work**: Implement feature or fix bug
4. **Test**: Run validation tests for current milestone
5. **Commit**: Git commit with descriptive message
6. **Repeat**

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/audio-engine

# Make changes
git add .
git commit -m "Implement AudioEngine.getSongTime() with drift-free timing"

# Push to remote
git push origin feature/audio-engine

# Create pull request
# Request review from team
```

### Branch Naming

- `feature/audio-engine` – Audio Engine work
- `feature/canvas-renderer` – Renderer work
- `feature/input-scoring` – Input/Scoring work
- `feature/game-loop` – Game Loop work
- `bugfix/timing-drift` – Bug fixes
- `wip/calibration-ui` – Work in progress

---

## Success Criteria

The project is **complete** when:

1. ✅ **Audio Reliability**: Music starts reliably after user interaction
2. ✅ **Note Alignment**: Notes align to beats for full song duration
3. ✅ **Restart Stability**: Restart never desyncs (50 consecutive tests)
4. ✅ **Input Feel**: Input feels forgiving but precise
5. ✅ **No Licensing Issues**: All audio is CC0 or procedurally generated
6. ✅ **Measurable Criteria**: All milestone validation tests pass

### Quantitative Metrics

| Metric | Target | Test Method |
|--------|--------|-------------|
| Audio start success rate | 100% | 100 start attempts |
| Audio drift over 60s | <1ms | Log start/end times |
| Restart reliability | 100% | 50 consecutive restarts |
| Visual-audio offset | <10ms | Metronome test |
| Hit window accuracy | ±5ms | Unit test |

---

## Resources & References

### Documentation

- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
- [Vite Guide](https://vitejs.dev/guide/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

### Audio Resources

- [Free Music Archive (CC0)](https://freemusicarchive.org/)
- [Freesound (SFX)](https://freesound.org/)
- [Incompetech (Kevin MacLeod)](https://incompetech.com/music/royalty-free/)

### Game Design References

- [Guitar Hero Wikipedia](https://en.wikipedia.org/wiki/Guitar_Hero) – Game mechanics
- [osu! rhythm game patterns](https://osu.ppy.sh/wiki/en/Article_comments/Ranking_Criteria) – Note placement theory
- [Clone Hero tips](https://clonehero.net/) – Community rhythm game

---

## Questions & Troubleshooting

### "How do I know if audio timing is correct?"

Run the validation tests in Milestone 1. If all tests pass, audio timing is correct.

### "Should I add feature X?"

Check BUILDPLAN.md Milestones 1-3. If the feature isn't listed, **don't build it**. The project has a strict scope to prevent creep.

### "Can I use a different music format?"

For MVP, use WAV only. MP3 introduces variable decoding latency. After Milestone 3, you can experiment with other formats.

### "How do I add more songs?"

Not in scope for MVP. BUILDPLAN.md explicitly says "Stop after Milestone 3". Future versions can add song selection.

### "What if I find a bug in the Audio Engine?"

Stop everything. Fix the bug. Re-run all Milestone 1 tests. Audio bugs are critical – they break the entire game.

---

## Appendix: Quick Reference

### Key Interfaces

```typescript
interface Note {
  lane: number;        // 0-3
  hitTime: number;     // seconds
  hit?: boolean;
}

interface AudioEngine {
  start(): Promise<void>;
  getSongTime(): number;
  stop(): void;
  setOffset(offset: number): void;
}

interface CanvasRenderer {
  drawNotes(notes: Note[], songTime: number): void;
  drawScore(score: number, combo: number): void;
}
```

### Key Formulas

```typescript
// Note Y position
const y = hitLineY - ((note.hitTime - songTime) / travelTime) * hitLineY;

// Hit detection
const timeDiff = Math.abs(note.hitTime - songTime);
if (timeDiff <= 0.060) rating = 'PERFECT';
else if (timeDiff <= 0.120) rating = 'GOOD';
else rating = 'MISS';

// Song time
const songTime = audioContext.currentTime - songStartTime - calibrationOffset;
```

### Critical Constants

```typescript
const HIT_WINDOW_PERFECT = 0.060;  // ±60ms
const HIT_WINDOW_GOOD = 0.120;     // ±120ms
const NOTE_TRAVEL_TIME = 2.0;      // 2 seconds from top to hit line
const HIT_LINE_Y = 0.8;            // 80% of screen height
const CALIBRATION_RANGE = 0.100;   // ±100ms
```

---

**End of Project Documentation**

*For detailed technical specifications, see BUILDPLAN.md*
*For parallel development strategy, see PARALLEL-AGENT.md*
*For this project's core principle: **Audio timing is everything***
