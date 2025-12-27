// Touch controls for mobile gameplay
// Adds on-screen buttons for each lane with multi-touch support

export class TouchControls {
  private container: HTMLDivElement | null = null;
  private buttons: HTMLDivElement[] = [];
  private onTouchStartCallback: ((lane: number, touchId: number) => void) | null = null;
  private onTouchEndCallback: ((lane: number, touchId: number) => void) | null = null;
  private activeTouches = new Map<number, number>(); // touchId -> lane

  constructor() {
    this.createControls();
    this.setupEventListeners();
  }

  private createControls(): void {
    // Main container
    this.container = document.createElement('div');
    this.container.id = 'touch-controls';
    this.container.style.cssText = `
      position: fixed;
      bottom: 0;
      left: 0;
      width: 100%;
      height: 120px;
      display: flex;
      gap: 2px;
      padding: 10px;
      box-sizing: border-box;
      pointer-events: auto;
      z-index: 100;
      background: rgba(0, 0, 0, 0.3);
    `;

    // Create 4 lane buttons
    const laneColors = ['#ff6b6b', '#4ecdc4', '#ffd93d', '#a8e6cf'];
    const laneLabels = ['A', 'S', 'D', 'F'];

    for (let i = 0; i < 4; i++) {
      const button = document.createElement('div');
      button.className = 'touch-lane-button';
      button.dataset.lane = i.toString();
      button.style.cssText = `
        flex: 1;
        background: ${laneColors[i]};
        border-radius: 15px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        font-size: 32px;
        font-weight: bold;
        color: white;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
        user-select: none;
        -webkit-user-select: none;
        touch-action: none;
        transition: all 0.05s ease;
        border: 3px solid rgba(255, 255, 255, 0.3);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
      `;
      
      button.innerHTML = `
        <div>${laneLabels[i]}</div>
        <div style="font-size: 14px; opacity: 0.8;">Lane ${i + 1}</div>
      `;

      this.buttons.push(button);
      this.container.appendChild(button);
    }

    document.body.appendChild(this.container);
  }

  private setupEventListeners(): void {
    // Use pointer events for better compatibility (works for touch and mouse)
    this.buttons.forEach((button, index) => {
      // Pointer down (touch start / mouse down)
      button.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        const pointerId = e.pointerId;
        const lane = index;
        
        // Track this touch
        this.activeTouches.set(pointerId, lane);
        
        // Visual feedback
        button.style.transform = 'scale(0.95)';
        button.style.filter = 'brightness(1.3)';
        button.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.5) inset';
        
        // Trigger callback
        if (this.onTouchStartCallback) {
          this.onTouchStartCallback(lane, pointerId);
        }
        
        // Capture pointer to this element
        button.setPointerCapture(pointerId);
      });

      // Pointer up (touch end / mouse up)
      button.addEventListener('pointerup', (e) => {
        e.preventDefault();
        const pointerId = e.pointerId;
        const lane = this.activeTouches.get(pointerId);
        
        if (lane !== undefined) {
          // Visual feedback reset
          button.style.transform = 'scale(1)';
          button.style.filter = 'brightness(1)';
          button.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.3)';
          
          // Trigger callback
          if (this.onTouchEndCallback) {
            this.onTouchEndCallback(lane, pointerId);
          }
          
          // Remove tracking
          this.activeTouches.delete(pointerId);
        }
      });

      // Pointer cancel (touch cancelled)
      button.addEventListener('pointercancel', (e) => {
        const pointerId = e.pointerId;
        const lane = this.activeTouches.get(pointerId);
        
        if (lane !== undefined) {
          // Visual feedback reset
          button.style.transform = 'scale(1)';
          button.style.filter = 'brightness(1)';
          button.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.3)';
          
          // Trigger callback
          if (this.onTouchEndCallback) {
            this.onTouchEndCallback(lane, pointerId);
          }
          
          // Remove tracking
          this.activeTouches.delete(pointerId);
        }
      });

      // Prevent context menu on long press
      button.addEventListener('contextmenu', (e) => {
        e.preventDefault();
      });
    });
  }

  /**
   * Register callback for touch start
   */
  onTouchStart(callback: (lane: number, touchId: number) => void): void {
    this.onTouchStartCallback = callback;
  }

  /**
   * Register callback for touch end
   */
  onTouchEnd(callback: (lane: number, touchId: number) => void): void {
    this.onTouchEndCallback = callback;
  }

  /**
   * Show touch controls
   */
  show(): void {
    if (this.container) {
      this.container.style.display = 'flex';
    }
  }

  /**
   * Hide touch controls
   */
  hide(): void {
    if (this.container) {
      this.container.style.display = 'none';
    }
  }

  /**
   * Check if device is likely mobile/touch-enabled
   */
  static isTouchDevice(): boolean {
    return (
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      window.matchMedia('(pointer: coarse)').matches
    );
  }

  /**
   * Auto-show on mobile, hide on desktop
   */
  autoToggle(): void {
    if (TouchControls.isTouchDevice()) {
      this.show();
    } else {
      this.hide();
    }
  }

  /**
   * Adjust button height based on screen size
   */
  updateSize(): void {
    if (!this.container) return;
    
    const screenHeight = window.innerHeight;
    const buttonHeight = Math.max(100, Math.min(150, screenHeight * 0.15));
    
    this.container.style.height = `${buttonHeight}px`;
  }

  /**
   * Clear all active touches (cleanup)
   */
  clearTouches(): void {
    this.activeTouches.clear();
    this.buttons.forEach(button => {
      button.style.transform = 'scale(1)';
      button.style.filter = 'brightness(1)';
      button.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.3)';
    });
  }

  /**
   * Destroy touch controls
   */
  destroy(): void {
    if (this.container && this.container.parentElement) {
      this.container.parentElement.removeChild(this.container);
      this.container = null;
    }
    this.buttons = [];
    this.activeTouches.clear();
  }
}

