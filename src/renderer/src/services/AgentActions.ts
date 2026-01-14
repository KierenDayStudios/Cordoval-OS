import { VisualRecognition } from './VisualRecognition';

/**
 * Agent Actions Service
 * Centralized execution engine for all Agent X commands
 * Handles keyboard, mouse, and system-level interactions
 */
export class AgentActions {
  private visualRecognition: VisualRecognition;

  constructor() {
    this.visualRecognition = new VisualRecognition();
  }

  // ========== KEYBOARD ACTIONS ==========

  /**
   * Types text at the current focus/cursor position
   */
  typeText(text: string): void {
    const activeElement = document.activeElement as HTMLInputElement | HTMLTextAreaElement;
    
    if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
      // Simulate typing with proper events
      const chars = text.split('');
      let currentValue = activeElement.value;
      
      chars.forEach((char, index) => {
        setTimeout(() => {
          currentValue += char;
          activeElement.value = currentValue;
          
          // Dispatch input event for React/Vue compatibility
          const inputEvent = new Event('input', { bubbles: true });
          activeElement.dispatchEvent(inputEvent);
        }, index * 50); // 50ms delay per character for human-like typing
      });
    } else if (activeElement && activeElement.isContentEditable) {
      // Handle contentEditable elements
      activeElement.textContent = (activeElement.textContent || '') + text;
    }
  }

  /**
   * Presses a single keyboard key
   */
  pressKey(key: string): void {
    const activeElement = document.activeElement as HTMLElement;
    
    const keyboardEvent = new KeyboardEvent('keydown', {
      key,
      code: this.getKeyCode(key),
      bubbles: true,
      cancelable: true
    });
    
    activeElement?.dispatchEvent(keyboardEvent);
    
    // Also dispatch keyup
    setTimeout(() => {
      const keyupEvent = new KeyboardEvent('keyup', {
        key,
        code: this.getKeyCode(key),
        bubbles: true,
        cancelable: true
      });
      activeElement?.dispatchEvent(keyupEvent);
    }, 50);
  }

  /**
   * Executes a keyboard combination (e.g., Ctrl+C, Alt+Tab)
   */
  keyCombo(combo: string): void {
    const parts = combo.toLowerCase().split('+');
    const modifiers: { [key: string]: boolean } = {
      ctrl: false,
      alt: false,
      shift: false,
      meta: false
    };
    
    let mainKey = '';
    
    parts.forEach(part => {
      const trimmed = part.trim();
      if (trimmed === 'ctrl' || trimmed === 'control') modifiers.ctrl = true;
      else if (trimmed === 'alt') modifiers.alt = true;
      else if (trimmed === 'shift') modifiers.shift = true;
      else if (trimmed === 'meta' || trimmed === 'cmd') modifiers.meta = true;
      else mainKey = trimmed;
    });
    
    const activeElement = document.activeElement as HTMLElement;
    
    const event = new KeyboardEvent('keydown', {
      key: mainKey,
      code: this.getKeyCode(mainKey),
      ctrlKey: modifiers.ctrl,
      altKey: modifiers.alt,
      shiftKey: modifiers.shift,
      metaKey: modifiers.meta,
      bubbles: true,
      cancelable: true
    });
    
    activeElement?.dispatchEvent(event);
  }

  /**
   * Simulates backspace key presses
   */
  backspace(count: number = 1): void {
    for (let i = 0; i < count; i++) {
      setTimeout(() => this.pressKey('Backspace'), i * 50);
    }
  }

  private getKeyCode(key: string): string {
    const keyMap: { [key: string]: string } = {
      'enter': 'Enter',
      'escape': 'Escape',
      'tab': 'Tab',
      'backspace': 'Backspace',
      'delete': 'Delete',
      'arrowup': 'ArrowUp',
      'arrowdown': 'ArrowDown',
      'arrowleft': 'ArrowLeft',
      'arrowright': 'ArrowRight',
      'home': 'Home',
      'end': 'End',
      'pageup': 'PageUp',
      'pagedown': 'PageDown',
      'space': 'Space'
    };
    
    return keyMap[key.toLowerCase()] || `Key${key.toUpperCase()}`;
  }

  // ========== MOUSE ACTIONS ==========

  /**
   * Clicks at specified coordinates
   */
  click(x: number, y: number, button: 'left' | 'right' = 'left'): HTMLElement | null {
    const element = document.elementFromPoint(x, y) as HTMLElement;
    
    if (element) {
      const mouseButton = button === 'right' ? 2 : 0;
      
      // Dispatch mousedown
      const mousedownEvent = new MouseEvent('mousedown', {
        bubbles: true,
        cancelable: true,
        clientX: x,
        clientY: y,
        button: mouseButton
      });
      element.dispatchEvent(mousedownEvent);
      
      // Dispatch mouseup
      setTimeout(() => {
        const mouseupEvent = new MouseEvent('mouseup', {
          bubbles: true,
          cancelable: true,
          clientX: x,
          clientY: y,
          button: mouseButton
        });
        element.dispatchEvent(mouseupEvent);
        
        // Dispatch click
        const clickEvent = new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          clientX: x,
          clientY: y,
          button: mouseButton
        });
        element.dispatchEvent(clickEvent);
        
        // Focus the element
        if (element.focus) element.focus();
      }, 50);
    }
    
    return element;
  }

  /**
   * Right-clicks at specified coordinates
   */
  rightClick(x: number, y: number): HTMLElement | null {
    return this.click(x, y, 'right');
  }

  /**
   * Double-clicks at specified coordinates
   */
  doubleClick(x: number, y: number): HTMLElement | null {
    const element = document.elementFromPoint(x, y) as HTMLElement;
    
    if (element) {
      // First click
      this.click(x, y);
      
      // Second click after short delay
      setTimeout(() => {
        const dblClickEvent = new MouseEvent('dblclick', {
          bubbles: true,
          cancelable: true,
          clientX: x,
          clientY: y
        });
        element.dispatchEvent(dblClickEvent);
      }, 100);
    }
    
    return element;
  }

  /**
   * Scrolls at specified coordinates
   */
  scroll(x: number, y: number, direction: 'up' | 'down', amount: number): void {
    const element = document.elementFromPoint(x, y) as HTMLElement;
    
    if (element) {
      const scrollableElement = this.findScrollableParent(element);
      const deltaY = direction === 'down' ? amount : -amount;
      
      if (scrollableElement) {
        scrollableElement.scrollBy({
          top: deltaY,
          behavior: 'smooth'
        });
      }
    }
  }

  /**
   * Drags from start to end coordinates
   */
  drag(startX: number, startY: number, endX: number, endY: number): void {
    const element = document.elementFromPoint(startX, startY) as HTMLElement;
    
    if (element) {
      // Mousedown at start
      const mousedownEvent = new MouseEvent('mousedown', {
        bubbles: true,
        cancelable: true,
        clientX: startX,
        clientY: startY
      });
      element.dispatchEvent(mousedownEvent);
      
      // Simulate drag movement
      const steps = 10;
      const deltaX = (endX - startX) / steps;
      const deltaY = (endY - startY) / steps;
      
      for (let i = 1; i <= steps; i++) {
        setTimeout(() => {
          const currentX = startX + (deltaX * i);
          const currentY = startY + (deltaY * i);
          
          const mousemoveEvent = new MouseEvent('mousemove', {
            bubbles: true,
            cancelable: true,
            clientX: currentX,
            clientY: currentY
          });
          document.dispatchEvent(mousemoveEvent);
        }, i * 20);
      }
      
      // Mouseup at end
      setTimeout(() => {
        const mouseupEvent = new MouseEvent('mouseup', {
          bubbles: true,
          cancelable: true,
          clientX: endX,
          clientY: endY
        });
        element.dispatchEvent(mouseupEvent);
      }, (steps + 1) * 20);
    }
  }

  private findScrollableParent(element: HTMLElement): HTMLElement | null {
    let current: HTMLElement | null = element;
    
    while (current && current !== document.body) {
      const style = window.getComputedStyle(current);
      const overflowY = style.overflowY;
      
      if (overflowY === 'auto' || overflowY === 'scroll') {
        return current;
      }
      
      current = current.parentElement;
    }
    
    return document.documentElement; // Default to page scroll
  }

  // ========== ELEMENT INTERACTION ==========

  /**
   * Focuses an element using CSS selector or text content
   */
  focusElement(selector: string): HTMLElement | null {
    let element: HTMLElement | null = null;
    
    // Try CSS selector first
    if (selector.startsWith('#') || selector.startsWith('.') || selector.includes('[')) {
      element = document.querySelector(selector) as HTMLElement;
    } else {
      // Try finding by text content
      element = this.visualRecognition.findByText(selector);
    }
    
    if (element && element.focus) {
      element.focus();
      
      // If it's an input, also click it
      if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
        element.click();
      }
    }
    
    return element;
  }

  /**
   * Reads text content from an element
   */
  readText(selector: string): string {
    const element = document.querySelector(selector);
    return element?.textContent?.trim() || '';
  }

  // ========== UTILITY ACTIONS ==========

  /**
   * Waits for specified milliseconds
   */
  async wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Captures a screenshot (returns base64 data URL)
   */
  async captureScreenshot(): Promise<string> {
    // Use html2canvas if available, otherwise return placeholder
    // This would require installing html2canvas: npm install html2canvas
    // For now, return a placeholder
    return 'data:image/png;base64,placeholder';
  }

  /**
   * Validates if a condition is met
   */
  verify(condition: string): boolean {
    // Basic condition checking
    // In a full implementation, this would parse and evaluate conditions
    if (condition.includes('exists:')) {
      const selector = condition.replace('exists:', '').trim();
      return document.querySelector(selector) !== null;
    }
    
    if (condition.includes('text:')) {
      const text = condition.replace('text:', '').trim();
      return document.body.textContent?.includes(text) || false;
    }
    
    return false;
  }
}
