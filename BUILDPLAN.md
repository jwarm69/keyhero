# KeyHero – Rhythm Game Build Plan (Audio-First Architecture)

## Executive Summary

KeyHero is a self-hosted Guitar Hero-style rhythm game for desktop browsers. The project's defining characteristic is **audio-first architecture** – Web Audio API timing is the single source of truth. All visual elements, scoring, and input logic derive from audio time, never the reverse.

This build plan provides the complete technical specification for a three-milestone development process, with strict validation gates at each stage.

---

## 0. Core Principle (Read First)

### Audio Timing is the Single Source of Truth

- Web Audio `AudioContext.currentTime` drives **everything**
- Visuals, scoring, and input must all derive from audio time
- No HTML `<audio>` elements permitted for timing (loading only)
- No `setTimeout` or `setInterval` for gameplay logic
- Frame-based timing is forbidden for scoring

**If audio timing is incorrect, the game is broken. Fix audio first, always.**

---

## 1. Technology Constraints (Non-Negotiable)

### Platform & Input

- **Target**: Web (desktop browsers only)
- **Input**: Keyboard only (no mouse during gameplay)
- **Controls**: 4 lanes mapped to A, S, D, F keys

### Technology Stack

- **Build Tool**: Vite 5.x
- **Language**: TypeScript 5.x (strict mode)
- **Rendering**: HTML5 Canvas (2D context)
- **Audio**: Web Audio API only
- **Engines**: No external game engines (Phaser, Unity, etc. forbidden)

### Audio Rules (Critical)

1. Use `AudioContext` for all audio operations
2. Use decoded `AudioBuffer` for music playback
3. Use `audioContext.currentTime` as the master clock
4. All playback starts only after user interaction (browser policy)
5. No HTML `<audio>` elements for timing purposes
6. No `performance.now()` or `Date.now()` for game time

---

## 2. Music Strategy (Selectable Options)

The build must support one of three music strategies, selectable via configuration:

### Option A — CC0 / Public Domain Track (Default)

**Configuration**: `musicStrategy: 'file'`

- Load a single WAV file (≈60–90 seconds)
- BPM known in advance (hardcoded)
- No vocals preferred (instrumental only)
- File stored in `/public/audio/track.wav`
- **Advantage**: Real music, production quality
- **Disadvantage**: File size, licensing concerns

**Example Source**: [Free Music Archive](https://freemusicarchive.org/) (CC0 license)

### Option B — Procedural Music (Fallback / Dev Mode)

**Configuration**: `musicStrategy: 'procedural'`

- Generated entirely via Web Audio API oscillators
- Components: Kick, snare, hi-hat, bass synth
- Fixed BPM (configurable, default 120)
- Infinite looping capability
- **Advantage**: Zero dependencies, perfect timing, no licensing
- **Disadvantage**: Limited musical variety

**Implementation**: `/src/audio/proceduralTrack.ts`

### Option C — Loop-Based Track Assembly

**Configuration**: `musicStrategy: 'loop'`

- Multiple short loops (drums, bass, melody)
- Seamless looping using `loopStart` / `loopEnd`
- Loops stored as separate WAV files
- **Advantage**: More musical variety than procedural
- **Disadvantage**: More complex asset management

**Architecture Requirement**: The gameplay code must be **agnostic to music source**. Swapping strategies must not require changes to scoring, rendering, or input systems.

---

## 3. Game Controls

| Lane | Key | Finger Position |
|------|-----|-----------------|
| Lane 1 (left) | A | Pinky |
| Lane 2 | S | Ring |
| Lane 3 | D | Middle |
| Lane 4 (right) | F | Index |

**Input Rules**:
- One key press = one note evaluation
- No mouse input during gameplay
- Repeated keydown events while key is held are ignored
- Early/late key presses evaluated against hit windows

---

## 4. Core Gameplay Rules

### Visual Layout

- Notes fall **vertically downward** toward a hit line
- Hit line positioned at 80% of screen height
- Notes spawn from top of screen
- Note travel time: ~2 seconds from spawn to hit line

### Timing Windows (Hit Detection)

| Rating | Time Window | Score |
|--------|-------------|-------|
| PERFECT | ±60ms | 100 points |
| GOOD | ±120ms | 50 points |
| MISS | >120ms | 0 points |

### Combo System

- Combo increments on successful hit
- Combo resets to 0 on miss
- No combo multiplier for MVP (keeps scoring simple)
- Combo milestone chimes at 10, 20, 50, 100

---

## 5. Data Models

### Note Interface

```typescript
interface Note {
  lane: number;        // 0-3 (corresponds to lanes A, S, D, F)
  hitTime: number;     // Seconds since song start (float)
  hit?: boolean;       // Track whether note was hit (optional)
}

// Example note
const exampleNote: Note = {
  lane: 1,             // Lane S (second lane)
  hitTime: 12.5,       // 12.5 seconds into song
  hit: false           // Not yet hit
};
```

### Chart Type

```typescript
type NoteChart = Note[];

// Notes MUST be sorted by hitTime (ascending)
const chart: NoteChart = [
  { lane: 0, hitTime: 1.0 },
  { lane: 1, hitTime: 1.5 },
  { lane: 2, hitTime: 2.0 },
  // ... more notes
];
```

---

## 6. Audio Engine (Highest Priority)

### Architecture

The Audio Engine is the **foundation of the entire game**. All other systems depend on its timing accuracy.

### Responsibilities

1. Initialize `AudioContext` (on user interaction)
2. Load and decode audio (async operation)
3. Start playback at a scheduled time
4. Expose authoritative song time
5. Support global offset calibration
6. Handle pause/resume/stop

### Required API Surface

```typescript
interface AudioEngine {
  // Initialize audio context and load/decode music
  start(): Promise<void>;

  // Get current song time in seconds
  // Formula: audioContext.currentTime - songStartTime - calibrationOffset
  getSongTime(): number;

  // Stop playback and reset state
  stop(): void;

  // Adjust timing offset (±100ms for device latency)
  setOffset(seconds: number): void;

  // Pause/resume (optional but recommended)
  pause(): void;
  resume(): void;
}
```

### Critical Behavior Requirements

1. **No Drift**: Playback must not drift over 60+ seconds
   - Use `audioContext.currentTime` directly, never cache it
   - Restart must re-align audio and notes perfectly

2. **Restart Reliability**: Restarting must be perfectly repeatable
   - Option A: Create new `AudioContext` on each restart
   - Option B: Stop all sources and recalculate `songStartTime`

3. **Timing Logic**: No timing logic outside `AudioContext` time
   - Never use `performance.now()` for game time
   - Never use `setInterval` or `setTimeout` for gameplay

4. **Async Safety**: Handle decode operations correctly
   - Show loading state during decode
   - Handle decode failures gracefully

### File Structure

```
src/audio/
├── audioEngine.ts      // Core AudioEngine implementation
├── proceduralTrack.ts  // Procedural music generator (Option B)
├── audioLoader.ts      // WAV file loader (Option A)
└── types.ts            // Audio-related interfaces
```

---

## 7. Game Loop Architecture

### Single Source of Truth Pattern

```typescript
// EVERY frame starts with this:
const songTime = audioEngine.getSongTime();
```

**From this single value, we derive**:
- Note Y positions
- Hit detection
- Spawn/despawn logic
- Score updates
- Everything gameplay-related

### Loop Structure

```typescript
function gameLoop() {
  // 1. Get authoritative time
  const songTime = audioEngine.getSongTime();

  // 2. Update note positions
  updateNotePositions(songTime);

  // 3. Check hit windows
  checkHits(songTime);

  // 4. Render frame
  render(songTime);

  // 5. Request next frame
  requestAnimationFrame(gameLoop);
}
```

### Forbidden Patterns

❌ **NEVER** use `setInterval` for gameplay logic
❌ **NEVER** use `performance.now()` for game time
❌ **NEVER** use frame counting for timing
❌ **NEVER** cache `songTime` across frames

### Required Patterns

✅ **ALWAYS** call `audioEngine.getSongTime()` once per frame
✅ **ALWAYS** derive all gameplay logic from `songTime`
✅ **ALWAYS** use `requestAnimationFrame` for the loop

---

## 8. Rendering (Canvas)

### Elements to Render

1. **Background** – Solid dark color (#1a1a2e)
2. **Vertical Lanes** – 4 columns, alternating colors
3. **Falling Notes** – Rectangles or circles per lane
4. **Hit Line** – Horizontal line at 80% height
5. **Score + Combo Text** – Large, top-center
6. **Hit Feedback** – "PERFECT", "GOOD", "MISS" at hit line

### Visual Simplicity Rules

- Flat colors only (no gradients)
- No particle systems
- No camera effects (except light screen shake on miss)
- No animations besides note movement

### Canvas Coordinate System

```typescript
// Setup
const canvas = document.querySelector('canvas')!;
const ctx = canvas.getContext('2d')!;
const width = canvas.width;
const height = canvas.height;

// Lane calculations
const laneWidth = width / 4;
const hitLineY = height * 0.8;

// Note Y position formula
function noteY(note: Note, songTime: number): number {
  const timeUntilHit = note.hitTime - songTime;
  const travelTime = 2.0; // seconds from top to hit line
  const progress = timeUntilHit / travelTime;
  return hitLineY - (progress * hitLineY);
}

// Lane X position
function laneX(lane: number): number {
  return lane * laneWidth;
}
```

### Rendering Order

1. Clear canvas (`ctx.clearRect`)
2. Draw background
3. Draw lanes (4 rectangles)
4. Draw hit line
5. Draw notes (iterate visible notes only)
6. Draw score/combo text
7. Draw hit feedback (if any)

### Screen Shake on Miss

```typescript
let shakeIntensity = 0;

// On miss:
shakeIntensity = 5; // pixels

// In render loop:
if (shakeIntensity > 0) {
  const offsetX = (Math.random() - 0.5) * shakeIntensity;
  const offsetY = (Math.random() - 0.5) * shakeIntensity;
  ctx.translate(offsetX, offsetY);
  shakeIntensity *= 0.9; // Decay
}
```

---

## 9. Input Handling

### Key Mapping

```typescript
const KEY_TO_LANE: Record<string, number> = {
  'a': 0,
  's': 1,
  'd': 2,
  'f': 3
};
```

### Input Rules

1. **Keyboard events only** – No mouse input during gameplay
2. **One key press → one evaluation** – Debounce repeated keydown
3. **Track key state** – Ignore held keys

### Input Flow

```typescript
// Track held keys to prevent mashing
const heldKeys = new Set<string>();

window.addEventListener('keydown', (e) => {
  const key = e.key.toLowerCase();

  // Ignore if already held
  if (heldKeys.has(key)) return;
  heldKeys.add(key);

  // Determine lane
  const lane = KEY_TO_LANE[key];
  if (lane === undefined) return; // Not a game key

  // Find nearest unhit note in lane
  const note = findNearestNote(lane, getCurrentSongTime());

  // Evaluate hit/miss
  if (note) {
    evaluateHit(note, getCurrentSongTime());
  }
});

window.addEventListener('keyup', (e) => {
  heldKeys.delete(e.key.toLowerCase());
});
```

### Hit Detection Logic

```typescript
function evaluateHit(note: Note, songTime: number): void {
  const timeDiff = Math.abs(note.hitTime - songTime);

  if (timeDiff <= 0.060) {
    // PERFECT
    score += 100;
    combo++;
    showFeedback('PERFECT');
    playSound('hit');
  } else if (timeDiff <= 0.120) {
    // GOOD
    score += 50;
    combo++;
    showFeedback('GOOD');
    playSound('hit');
  } else {
    // MISS
    combo = 0;
    showFeedback('MISS');
    playSound('miss');
  }

  note.hit = true; // Mark as hit
}
```

---

## 10. Sound Effects

### Required Sounds

1. **Hit** – Subtle click or pluck (~50ms)
2. **Miss** – Muted thud (~100ms)
3. **Combo Milestone** – Soft chime (~200ms)
4. **Note Spawn** (Optional) – Subtle tick

### Implementation

```typescript
// Preload all SFX during initialization
const sfxBuffers: Record<string, AudioBuffer> = {};

async function loadSFX() {
  sfxBuffers.hit = await loadAudio('/sfx/hit.wav');
  sfxBuffers.miss = await loadAudio('/sfx/miss.wav');
  sfxBuffers.combo = await loadAudio('/sfx/combo.wav');
}

function playSound(name: string) {
  const buffer = sfxBuffers[name];
  if (!buffer) return;

  const source = audioContext.createBufferSource();
  source.buffer = buffer;

  const gainNode = audioContext.createGain();
  gainNode.gain.value = 0.3; // 30% volume

  source.connect(gainNode);
  gainNode.connect(audioContext.destination);
  source.start(0);
}
```

### Volume Mixing

- Music: 100% volume
- SFX: 20-30% volume
- Never clip or distort

### Timing

- Hit sound: Play immediately on successful hit
- Miss sound: Play when note passes miss threshold
- Combo chime: Play when `combo % 10 === 0` and combo > 0

---

## 11. Calibration Mode (Important)

### Purpose

Different devices have different latency:
- Audio hardware processing latency
- Display refresh latency
- Browser audio pipeline latency

Calibration allows users to adjust for these differences.

### Calibration UI Components

1. **Offset Slider** – Range: -100ms to +100ms
2. **Visual Metronome** – Flashes on beat
3. **Audio Metronome** – Plays beep on beat
4. **Instructions** – "Adjust until flash and beep sync perfectly"

### Offset Storage

```typescript
// Save to localStorage
localStorage.setItem('audioOffset', offsetValue.toString());

// Load on startup
const savedOffset = parseFloat(localStorage.getItem('audioOffset') || '0');
audioEngine.setOffset(savedOffset);
```

### Offset Application

```typescript
getSongTime(): number {
  const rawTime = this.audioContext.currentTime - this.songStartTime;
  return rawTime - this.calibrationOffset;
}
```

**Positive offset** = Audio plays earlier (compensates for lag)
**Negative offset** = Audio plays later

### Calibration Procedure

1. Play metronome (audio beep every 1.0 seconds)
2. Flash visual indicator on same beat
3. User adjusts slider until flash and beep align
4. Offset saved automatically
5. Game uses saved offset for all timing calculations

---

## 12. MVP Milestones

### Milestone 1 — Audio Proof (Foundation)

**Objective**: Verify audio timing is rock-solid

**Tasks**:
- [ ] Implement `AudioEngine.start()` with AudioContext init
- [ ] Load and decode audio (WAV or procedural)
- [ ] Implement `getSongTime()` with proper math
- [ ] Implement `stop()` and restart logic
- [ ] Add console logging for song time
- [ ] No visuals yet, just console output

**Validation Criteria**:
- ✅ Audio starts reliably after user interaction
- ✅ Song plays fully without stuttering
- ✅ Restart works perfectly (10 consecutive tests)
- ✅ No drift after 60 seconds (log start/end time)
- ✅ Console shows `songTime` incrementing smoothly

**Definition of Done**: All audio tests pass. No visual work until this milestone is complete.

---

### Milestone 2 — Playable Prototype (Core Gameplay)

**Objective**: Make it fun to play

**Tasks**:
- [ ] Create hardcoded test chart (~30 notes)
- [ ] Implement Canvas rendering (lanes, notes, hit line)
- [ ] Implement keyboard input handling
- [ ] Implement hit detection (Perfect/Good/Miss)
- [ ] Implement basic scoring
- [ ] Connect audio time to note positions
- [ ] Add note spawn/despawn logic

**Validation Criteria**:
- ✅ Notes fall smoothly and align with audio
- ✅ Keyboard input registers correctly
- ✅ Hit detection feels fair (manual testing)
- ✅ Score increments on hits
- ✅ Combo resets on miss
- ✅ Notes disappear when hit or after hit window

**Definition of Done**: You can play through a song and it feels like a rhythm game.

---

### Milestone 3 — Polish (Complete Experience)

**Objective**: Make it feel finished

**Tasks**:
- [ ] Add sound effects (hit, miss, combo chime)
- [ ] Implement combo tracking and display
- [ ] Add end-of-song stats screen
- [ ] Implement restart button
- [ ] Implement stop button
- [ ] Add calibration mode UI
- [ ] Add visual feedback (Perfect/Good/Miss text)
- [ ] Add screen shake on miss
- [ ] Polish colors and layout

**Validation Criteria**:
- ✅ Sound effects play at correct moments
- ✅ Combo milestone chimes trigger correctly
- ✅ End screen shows accurate stats
- ✅ Restart/stop buttons work reliably
- ✅ Calibration mode is usable
- ✅ Visual feedback is clear and timely

**Definition of Done**: Game is complete and fun to play. **Stop here. No additional features.**

---

## 13. File Structure

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
│   │   └── loop.ts            # Game loop orchestration
│   ├── render/
│   │   ├── canvas.ts          # Canvas rendering
│   │   └── draw.ts            # Drawing helpers
│   ├── ui/
│   │   ├── calibration.ts     # Calibration UI
│   │   └── stats.ts           # End screen stats
│   ├── types.ts               # Shared interfaces (Note, Chart, etc.)
│   ├── config.ts              # Configuration (music strategy, BPM, etc.)
│   └── index.ts               # Entry point
├── BUILDPLAN.md               # This file
├── PARALLEL-AGENT.md          # Parallel development strategy
├── CLAUDE.md                  # Project documentation
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 14. Explicit Anti-Patterns (Must Not Be Used)

### ❌ HTML `<audio>` for Timing

```typescript
// WRONG
const audio = new Audio('song.wav');
const time = audio.currentTime; // DO NOT USE
```

### ❌ `setTimeout` or `setInterval` for Gameplay

```typescript
// WRONG
setInterval(() => {
  updateGame();
}, 16); // DO NOT USE
```

### ❌ Frame-Based Timing for Scoring

```typescript
// WRONG
let frameCount = 0;
function loop() {
  frameCount++;
  const songTime = frameCount * 0.016; // DO NOT USE
}
```

### ❌ MP3 for Initial Testing

```typescript
// WRONG - Use WAV instead
const mp3File = 'song.mp3'; // DO NOT USE (use WAV)
```

**Reason**: MP3 decoding introduces variable latency, making timing tests unreliable.

### ❌ Complex Animations Before Audio Correctness

```typescript
// WRONG - Don't build particle systems yet
function renderParticles() {
  // DO NOT BUILD until audio is perfect
}
```

**Focus on audio first. Visual polish comes later.**

---

## 15. Definition of Done

The game is **complete** when:

1. ✅ **Audio Reliability**: Music starts reliably after user interaction
2. ✅ **Note Alignment**: Notes align to beats for full song duration
3. ✅ **Restart Stability**: Restart never desyncs (50 consecutive tests)
4. ✅ **Input Feel**: Input feels forgiving but precise (manual testing)
5. ✅ **No Licensing Issues**: All audio is CC0 or procedurally generated
6. ✅ **Measurable Criteria**: All milestone validation tests pass

### Quantitative Success Criteria

| Metric | Target | Test Method |
|--------|--------|-------------|
| Audio start success rate | 100% | 100 start attempts |
| Audio drift over 60s | <1ms | Log start/end times |
| Restart reliability | 100% | 50 consecutive restarts |
| Visual-audio offset | <10ms | Metronome test |
| Hit window accuracy | ±5ms | Unit test |

**If any criterion fails, the game is not done.**

---

## 16. Optional Extensions (Do Not Build Yet)

These features are explicitly **out of scope** for MVP:

- ❌ Chart editor / level creator
- ❌ BPM auto-generation from audio analysis
- ❌ Difficulty modes (easy/medium/hard)
- ❌ MIDI controller support
- ❌ Multiplayer or leaderboards
- ❌ Multiple songs or song selection
- ❌ Background videos or complex visuals
- ❌ Mobile touch support

**Build only what is specified in Milestones 1-3.**

---

## 17. Final Instructions

### Audio Correctness is Paramount

> "If audio timing is not correct, stop and fix it before proceeding. Gameplay polish is irrelevant until audio is perfect."

### Development Workflow

1. **Build Milestone 1 first** – Audio only, no visuals
2. **Validate Milestone 1** – Run all audio tests
3. **Only then, build Milestone 2** – Add visuals and input
4. **Validate Milestone 2** – Manual playtesting
5. **Only then, build Milestone 3** – Add polish
6. **Validate Milestone 3** – Full playtesting

### Risk Mitigation

- **Audio drift**: Test continuously with logging
- **Browser compatibility**: Test Chrome, Firefox, Safari
- **Performance**: Cap visible notes, use simple rendering
- **Calibration**: Include calibration mode from Milestone 3

### Success Mindset

- **Perfection over features** – A 60-second game with perfect timing beats a 5-minute game with drift
- **Validation over assumptions** – Test everything, measure everything
- **Simplicity over complexity** – Flat colors, straightforward code, minimal dependencies

---

## Appendix A: Timing Mathematics

### Song Time Calculation

```typescript
getSongTime(): number {
  const now = this.audioContext.currentTime;
  const elapsed = now - this.songStartTime;
  const calibrated = elapsed - this.calibrationOffset;
  return Math.max(0, calibrated); // Clamp to 0
}
```

### Note Position Calculation

```typescript
function noteYPosition(note: Note, songTime: number): number {
  const timeUntilHit = note.hitTime - songTime;
  const travelTime = 2.0; // seconds from top to hit line
  const progress = timeUntilHit / travelTime;
  const hitLineY = canvas.height * 0.8;
  return hitLineY - (progress * hitLineY);
}
```

### Hit Detection

```typescript
function timeWindow(note: Note, songTime: number): number {
  return Math.abs(note.hitTime - songTime);
}

function hitRating(timeDiff: number): string {
  if (timeDiff <= 0.060) return 'PERFECT';
  if (timeDiff <= 0.120) return 'GOOD';
  return 'MISS';
}
```

---

## Appendix B: Testing Checklist

### Milestone 1 Tests

- [ ] Audio starts on first click
- [ ] Audio starts on 10th consecutive restart
- [ ] `songTime` increments smoothly (no jumps)
- [ ] 60-second play has <1ms drift
- [ ] Console shows no errors
- [ ] Memory usage stable (no leaks)

### Milestone 2 Tests

- [ ] All 4 lanes respond to correct keys
- [ ] Notes spawn before hit line
- [ ] Notes despawn after hit line
- [ ] Hit detection works for Perfect/Good/Miss
- [ ] Combo resets on miss
- [ ] Score updates correctly

### Milestone 3 Tests

- [ ] Calibration mode is usable
- [ ] Sound effects play without distortion
- [ ] End screen shows accurate stats
- [ ] Restart/stop buttons work
- [ ] Visual feedback is clear
- [ ] Full song playthrough is fun

---

**End of Build Plan**

*This plan is the single source of truth for KeyHero development. Follow it precisely. Deviate only after completing all three milestones.*
