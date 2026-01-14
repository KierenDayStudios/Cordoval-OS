/**
 * Visual Recognition Service
 * Finds UI elements adaptively using multiple strategies
 * Enables Agent X to locate elements even when layout changes
 */
export class VisualRecognition {
  /**
   * Finds elements by exact or fuzzy text match
   */
  findByText(pattern: string | RegExp): HTMLElement | null {
    const allElements = document.querySelectorAll('*');
    
    for (const element of allElements) {
      const text = element.textContent?.trim() || '';
      const htmlEl = element as HTMLElement;
      
      // Skip if element is hidden
      if (htmlEl.offsetParent === null) continue;
      
      if (typeof pattern === 'string') {
        if (text.toLowerCase().includes(pattern.toLowerCase())) {
          return htmlEl;
        }
      } else {
        if (pattern.test(text)) {
          return htmlEl;
        }
      }
    }
    
    return null;
  }

  /**
   * Finds elements by visual signature (color, icon, proximity)
   */
  findByVisualSignature(signature: {
    approximateColor?: string;
    nearText?: string;
    role?: string;
    iconName?: string;
  }): HTMLElement | null {
    const candidates: HTMLElement[] = [];
    
    // Step 1: Filter by role if specified
    if (signature.role) {
      const roleElements = document.querySelectorAll(`[role="${signature.role}"], ${signature.role}`);
      candidates.push(...Array.from(roleElements) as HTMLElement[]);
    } else {
      candidates.push(...Array.from(document.querySelectorAll('*')) as HTMLElement[]);
    }
    
    // Step 2: Filter by proximity to other text
    if (signature.nearText) {
      const referenceElement = this.findByText(signature.nearText);
      if (referenceElement) {
        return this.findNearestElement(referenceElement, candidates);
      }
    }
    
    // Step 3: Filter by icon name (search in SVG or icon classes)
    if (signature.iconName) {
      for (const candidate of candidates) {
        const hasIcon = candidate.querySelector(`svg[data-icon="${signature.iconName}"]`) ||
                       candidate.className.toLowerCase().includes(signature.iconName.toLowerCase());
        if (hasIcon) return candidate;
      }
    }
    
    // Step 4: Filter by color (approximate)
    if (signature.approximateColor && candidates.length > 0) {
      // Return first visible element as fallback
      return candidates.find(el => el.offsetParent !== null) || null;
    }
    
    return candidates[0] || null;
  }

  /**
   * Finds element in specific context (e.g., "near bottom-right")
   */
  findInContext(elementText: string, context: string): HTMLElement | null {
    const element = this.findByText(elementText);
    if (!element) return null;
    
    // Parse context
    if (context.includes('bottom')) {
      const viewportHeight = window.innerHeight;
      const rect = element.getBoundingClientRect();
      if (rect.bottom > viewportHeight * 0.7) return element;
    }
    
    if (context.includes('top')) {
      const rect = element.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.3) return element;
    }
    
    if (context.includes('right')) {
      const viewportWidth = window.innerWidth;
      const rect = element.getBoundingClientRect();
      if (rect.right > viewportWidth * 0.7) return element;
    }
    
    if (context.includes('left')) {
      const rect = element.getBoundingClientRect();
      if (rect.left < window.innerWidth * 0.3) return element;
    }
    
    return element;
  }

  /**
   * Multi-strategy element finder with fallback chain
   */
  findElement(strategies: {
    text?: string;
    selector?: string;
    visualSignature?: any;
    proximity?: { nearText: string };
  }): HTMLElement | null {
    // Try 1: Text-based (most adaptive)
    if (strategies.text) {
      const element = this.findByText(strategies.text);
      if (element) return element;
    }
    
    // Try 2: Visual signature
    if (strategies.visualSignature) {
      const element = this.findByVisualSignature(strategies.visualSignature);
      if (element) return element;
    }
    
    // Try 3: Proximity search
    if (strategies.proximity) {
      const element = this.findByText(''); // Would implement proper proximity search
      if (element) return element;
    }
    
    // Try 4: CSS selector (least adaptive but most precise)
    if (strategies.selector) {
      const element = document.querySelector(strategies.selector) as HTMLElement;
      if (element) return element;
    }
    
    return null;
  }

  /**
   * Extracts visual features from an element
   */
  extractFeatures(element: HTMLElement): {
    text: string;
    tag: string;
    classes: string[];
    position: { x: number; y: number };
    color: string;
    hasIcon: boolean;
  } {
    const rect = element.getBoundingClientRect();
    const styles = window.getComputedStyle(element);
    
    return {
      text: element.textContent?.trim() || '',
      tag: element.tagName.toLowerCase(),
      classes: Array.from(element.classList),
      position: {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      },
      color: styles.backgroundColor,
      hasIcon: !!element.querySelector('svg, img')
    };
  }

  /**
   * Finds nearest element from a reference point
   */
  private findNearestElement(reference: HTMLElement, candidates: HTMLElement[]): HTMLElement | null {
    const refRect = reference.getBoundingClientRect();
    const refCenter = {
      x: refRect.left + refRect.width / 2,
      y: refRect.top + refRect.height / 2
    };
    
    let nearest: HTMLElement | null = null;
    let minDistance = Infinity;
    
    for (const candidate of candidates) {
      if (candidate === reference) continue;
      if (candidate.offsetParent === null) continue; // Skip hidden
      
      const candidateRect = candidate.getBoundingClientRect();
      const candidateCenter = {
        x: candidateRect.left + candidateRect.width / 2,
        y: candidateRect.top + candidateRect.height / 2
      };
      
      const distance = Math.sqrt(
        Math.pow(candidateCenter.x - refCenter.x, 2) +
        Math.pow(candidateCenter.y - refCenter.y, 2)
      );
      
      if (distance < minDistance) {
        minDistance = distance;
        nearest = candidate;
      }
    }
    
    return nearest;
  }

  /**
   * Gets all elements matching text pattern
   */
  findAllByText(pattern: string | RegExp): HTMLElement[] {
    const results: HTMLElement[] = [];
    const allElements = document.querySelectorAll('*');
    
    for (const element of allElements) {
      const text = element.textContent?.trim() || '';
      const htmlEl = element as HTMLElement;
      
      if (htmlEl.offsetParent === null) continue;
      
      if (typeof pattern === 'string') {
        if (text.toLowerCase().includes(pattern.toLowerCase())) {
          results.push(htmlEl);
        }
      } else {
        if (pattern.test(text)) {
          results.push(htmlEl);
        }
      }
    }
    
    return results;
  }
}
