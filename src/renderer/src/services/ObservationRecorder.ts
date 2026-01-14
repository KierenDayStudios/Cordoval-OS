import { RawAction, ObservationSession } from './PatternLearning';

/**
 * ObservationRecorder
 * Captures user mouse/keyboard actions for training Agent X
 */
export class ObservationRecorder {
  private isRecording: boolean = false;
  private currentSession: ObservationSession | null = null;
  private actions: RawAction[] = [];
  private startTime: number = 0;
  private sessionId: string = '';
  
  // Event  listeners
  private mouseListener: ((e: MouseEvent) => void) | null = null;
  private keyboardListener: ((e: KeyboardEvent) => void) | null = null;
  private scrollListener: ((e: WheelEvent) => void) | null = null;

  /**
   * Start recording a new observation session
   */
  startRecording(taskName: string, attemptNumber: number): void {
    if (this.isRecording) {
      console.warn('[ObservationRecorder] Already recording');
      return;
    }

    this.isRecording = true;
    this.actions = [];
    this.startTime = Date.now();
    this.sessionId = crypto.randomUUID();

    console.log(`[ObservationRecorder] Started recording: ${taskName} (Attempt ${attemptNumber})`);

    // Setup event listeners
    this.mouseListener = (e: MouseEvent) => this.captureMouseEvent(e);
    this.keyboardListener = (e: KeyboardEvent) => this.captureKeyboardEvent(e);
    this.scrollListener = (e: WheelEvent) => this.captureScrollEvent(e);

    document.addEventListener('click', this.mouseListener, true);
    document.addEventListener('keydown', this.keyboardListener, true);
    document.addEventListener('wheel', this.scrollListener, true);

    this.currentSession = {
      sessionId: this.sessionId,
      attemptNumber,
      taskName,
      startTime: this.startTime,
      endTime: 0,
      actions: [],
      screenshots: []
    };
  }

  /**
   * Stop recording and return the session
   */
  stopRecording(): ObservationSession | null {
    if (!this.isRecording || !this.currentSession) {
      console.warn('[ObservationRecorder] Not recording');
      return null;
    }

    this.isRecording = false;
    const endTime = Date.now();

    // Remove event listeners
    if (this.mouseListener) {
      document.removeEventListener('click', this.mouseListener, true);
    }
    if (this.keyboardListener) {
      document.removeEventListener('keydown', this.keyboardListener, true);
    }
    if (this.scrollListener) {
      document.removeEventListener('wheel', this.scrollListener, true);
    }

    this.currentSession.endTime = endTime;
    this.currentSession.actions = this.actions;

    console.log(`[ObservationRecorder] Stopped recording: ${this.actions.length} actions captured`);

    const session = this.currentSession;
    this.currentSession = null;
    this.actions = [];

    return session;
  }

  /**
   * Capture mouse click event
   */
  private captureMouseEvent(e: MouseEvent): void {
    if (!this.isRecording) return;

    // Don't record clicks on training interface itself
    const target = e.target as HTMLElement;
    if (target.closest('[data-training-interface]')) {
      return;
    }

    const element = this.extractElementInfo(target);
    
    const action: RawAction = {
      type: 'mouse',
      timestamp: Date.now() - this.startTime,
      data: {
        x: e.clientX,
        y: e.clientY,
        button: e.button === 0 ? 'left' : 'right',
        clickCount: e.detail,
        element
      }
    };

    this.actions.push(action);
    console.log('[ObservationRecorder] Mouse:', action);
  }

  /**
   * Capture keyboard event
   */
  private captureKeyboardEvent(e: KeyboardEvent): void {
    if (!this.isRecording) return;

    // Don't record typing in training interface
    const target = e.target as HTMLElement;
    if (target.closest('[data-training-interface]')) {
      return;
    }

    const action: RawAction = {
      type: 'keyboard',
      timestamp: Date.now() - this.startTime,
      data: {
        key: e.key,
        keyCode: e.code,
        text: e.key.length === 1 ? e.key : undefined, // Single character = text
        element: this.extractElementInfo(target)
      }
    };

    this.actions.push(action);
    console.log('[ObservationRecorder] Keyboard:', action);
  }

  /**
   * Capture scroll event
   */
  private captureScrollEvent(e: WheelEvent): void {
    if (!this.isRecording) return;

    const target = e.target as HTMLElement;
    if (target.closest('[data-training-interface]')) {
      return;
    }

    const action: RawAction = {
      type: 'scroll',
      timestamp: Date.now() - this.startTime,
      data: {
        deltaY: e.deltaY,
        x: e.clientX,
        y: e.clientY,
        element: this.extractElementInfo(target)
      }
    };

    this.actions.push(action);
    console.log('[ObservationRecorder] Scroll:', action);
  }

  /**
   * Extract useful information from an HTML element
   */
  private extractElementInfo(element: HTMLElement): {
    tagName: string;
    id?: string;
    className?: string;
    text?: string;
    attributes?: Record<string, string>;
  } {
    // Get visible text (first 50 chars)
    const text = element.textContent?.trim().substring(0, 50) || '';
    
    // Get key attributes
    const attributes = {} as Record<string, string>;
    if (element.hasAttribute('data-app')) {
      attributes['data-app'] = element.getAttribute('data-app')!;
    }
    if (element.hasAttribute('placeholder')) {
      attributes['placeholder'] = element.getAttribute('placeholder')!;
    }
    if (element.hasAttribute('type')) {
      attributes['type'] = element.getAttribute('type')!;
    }

    return {
      tagName: element.tagName.toLowerCase(),
      id: element.id || undefined,
      className: element.className || undefined,
      text: text || undefined,
      attributes: Object.keys(attributes).length > 0 ? attributes : undefined
    };
  }

  /**
   * Check if currently recording
   */
  isCurrentlyRecording(): boolean {
    return this.isRecording;
  }

  /**
   * Get current action count
   */
  getActionCount(): number {
    return this.actions.length;
  }

  /**
   * Get elapsed time
   */
  getElapsedTime(): number {
    if (!this.isRecording) return 0;
    return Date.now() - this.startTime;
  }
}
