export interface InputHandler {
  onKeyDown(key: string): void;
  onKeyUp(key: string): void;
  getHeldKeys(): Set<string>;
  getLane(key: string): number | undefined;
  isKeyPressed(key: string): boolean;
  onTouchStart?(lane: number, touchId: number): void;
  onTouchEnd?(lane: number, touchId: number): void;
  isLanePressed?(lane: number): boolean;
  getActiveLanes?(): Set<number>;
}

export class KeyboardInput implements InputHandler {
  private heldKeys = new Set<string>();
  private keyToLane: Record<string, number> = {
    'a': 0,
    's': 1,
    'd': 2,
    'f': 3
  };

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

  isKeyPressed(key: string): boolean {
    return this.heldKeys.has(key.toLowerCase());
  }
}

/**
 * Enhanced input handler supporting both keyboard and touch input
 * Enables mobile multi-touch gameplay
 */
export class MultiInput implements InputHandler {
  private heldKeys = new Set<string>();
  private activeTouches = new Map<number, number>(); // touchId -> lane
  private activeLanes = new Set<number>();
  private keyToLane: Record<string, number> = {
    'a': 0,
    's': 1,
    'd': 2,
    'f': 3
  };

  // Keyboard input
  onKeyDown(key: string): void {
    const lane = this.getLane(key);
    this.heldKeys.add(key.toLowerCase());
    if (lane !== undefined) {
      this.activeLanes.add(lane);
    }
  }

  onKeyUp(key: string): void {
    const lane = this.getLane(key);
    this.heldKeys.delete(key.toLowerCase());
    if (lane !== undefined) {
      // Only remove lane if no other key is holding it
      let stillPressed = false;
      for (const k of this.heldKeys) {
        if (this.keyToLane[k] === lane) {
          stillPressed = true;
          break;
        }
      }
      if (!stillPressed && !this.isTouchingLane(lane)) {
        this.activeLanes.delete(lane);
      }
    }
  }

  getHeldKeys(): Set<string> {
    return this.heldKeys;
  }

  getLane(key: string): number | undefined {
    return this.keyToLane[key.toLowerCase()];
  }

  isKeyPressed(key: string): boolean {
    return this.heldKeys.has(key.toLowerCase());
  }

  // Touch input
  onTouchStart(lane: number, touchId: number): void {
    this.activeTouches.set(touchId, lane);
    this.activeLanes.add(lane);
  }

  onTouchEnd(lane: number, touchId: number): void {
    this.activeTouches.delete(touchId);
    
    // Only remove lane if no other touch is on it
    if (!this.isTouchingLane(lane) && !this.isKeyPressedForLane(lane)) {
      this.activeLanes.delete(lane);
    }
  }

  isLanePressed(lane: number): boolean {
    return this.activeLanes.has(lane);
  }

  getActiveLanes(): Set<number> {
    return this.activeLanes;
  }

  // Helper methods
  private isTouchingLane(lane: number): boolean {
    for (const touchLane of this.activeTouches.values()) {
      if (touchLane === lane) return true;
    }
    return false;
  }

  private isKeyPressedForLane(lane: number): boolean {
    for (const key of this.heldKeys) {
      if (this.keyToLane[key] === lane) return true;
    }
    return false;
  }

  /**
   * Clear all touch state (useful for cleanup)
   */
  clearTouches(): void {
    this.activeTouches.clear();
    // Recalculate active lanes from keyboard only
    this.activeLanes.clear();
    for (const key of this.heldKeys) {
      const lane = this.keyToLane[key];
      if (lane !== undefined) {
        this.activeLanes.add(lane);
      }
    }
  }
}
