export interface InputHandler {
  onKeyDown(key: string): void;
  onKeyUp(key: string): void;
  getHeldKeys(): Set<string>;
  getLane(key: string): number | undefined;
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
