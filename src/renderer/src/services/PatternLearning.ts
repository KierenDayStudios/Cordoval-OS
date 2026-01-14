// import { VisualRecognition } from './VisualRecognition';
import { AIOptimizedKnowledge } from './SecureKnowledgeStore';

/**
 * Raw action captured during observation
 */
export interface RawAction {
  type: 'mouse' | 'keyboard' | 'scroll' | 'wait';
  timestamp: number;
  data: {
    // Mouse
    x?: number;
    y?: number;
    button?: 'left' | 'right';
    clickCount?: number;
    
    // Keyboard
    key?: string;
    keyCode?: string;
    text?: string;
    
    // Scroll
    deltaY?: number;
    
    // Element context
    element?: {
      tagName: string;
      id?: string;
      className?: string;
      text?: string;
      attributes?: Record<string, string>;
    };
  };
}

/**
 * Complete observation session (one attempt at the task)
 */
export interface ObservationSession {
  sessionId: string;
  attemptNumber: number;
  taskName: string;
  startTime: number;
  endTime: number;
  actions: RawAction[];
  screenshots: string[]; // Base64 data URLs
}

/**
 * Extracted pattern from multiple observations
 */
export interface ExtractedPattern {
  taskName: string;
  totalAttempts: number;
  
  // What's ALWAYS the same
  invariants: Array<{
    step: number;
    description: string;
    actionType: string;
    elementIdentifier: string; // "text:Settings" or "selector:#btn"
  }>;
  
  // What changes but means the same thing
  variants: Array<{
    step: number;
    description: string;
    variationType: 'position' | 'timing' | 'choice';
    values: any[];
    average?: number;
  }>;
  
  // Generated command sequence
  commandSequence: string[];
  
  // Fallback strategies
  fallbackStrategies: Array<{
    step: number;
    primary: string;
    fallbacks: string[];
  }>;
  
  // Success validation
  successCriteria: string;
}

/**
 * Pattern Learning Engine
 * Analyzes multiple repetitions of a task to extract learnable patterns
 */
export class PatternLearningEngine {
//   private visualRecognition: VisualRecognition;

  constructor() {
//     this.visualRecognition = new VisualRecognition();
  }

  /**
   * Analyzes multiple observation sessions to extract patterns
   */
  analyzeRepetitions(observations: ObservationSession[]): ExtractedPattern {
    if (observations.length <1) {
      throw new Error('Need at least 1 observation to analyze');
    }

    const taskName = observations[0].taskName;
    const pattern: ExtractedPattern = {
      taskName,
      totalAttempts: observations.length,
      invariants: [],
      variants: [],
      commandSequence: [],
      fallbackStrategies: [],
      successCriteria: 'Task completed successfully'
    };

    // Group actions by approximate timing/sequence
    const actionGroups = this.groupActionsBySequence(observations);
    
    // Analyze each step across all attempts
    actionGroups.forEach((group, stepIndex) => {
      const analysis = this.analyzeActionGroup(group, stepIndex);
      
      if (analysis.isInvariant) {
        pattern.invariants.push({
          step: stepIndex,
          description: analysis.description,
          actionType: analysis.actionType,
          elementIdentifier: analysis.elementIdentifier
        });
      } else {
        pattern.variants.push({
          step: stepIndex,
          description: analysis.description,
          variationType: analysis.variationType || 'choice', // Default to choice if undefined
          values: analysis.values || [],
          average: analysis.average
        });
      }
      
      // Generate fallback strategies
      if (analysis.elementIdentifier) {
        pattern.fallbackStrategies.push({
          step: stepIndex,
          primary: analysis.primaryStrategy,
          fallbacks: analysis.fallbackStrategies || []
        });
      }
    });

    // Generate command sequence from invariants
    pattern.commandSequence = this.synthesizeCommands(pattern);
    
    return pattern;
  }

  /**
   * Groups similar actions across repetitions by sequence position
   */
  private groupActionsBySequence(observations: ObservationSession[]): RawAction[][] {
    // Find the observation with the most actions (most complete)
    const maxActions = Math.max(...observations.map(o => o.actions.length));
    const groups: RawAction[][] = [];

    for (let i = 0; i < maxActions; i++) {
      const group: RawAction[] = [];
      observations.forEach(obs => {
        if (obs.actions[i]) {
          group.push(obs.actions[i]);
        }
      });
      if (group.length > 0) {
        groups.push(group);
      }
    }

    return groups;
  }

  /**
   * Analyzes a group of actions (same step across attempts)
   */
  private analyzeActionGroup(actions: RawAction[], stepIndex: number): {
    isInvariant: boolean;
    description: string;
    actionType: string;
    elementIdentifier: string;
    variationType?: 'position' | 'timing' | 'choice';
    values?: any[];
    average?: number;
    primaryStrategy: string;
    fallbackStrategies?: string[];
  } {
    const firstAction = actions[0];
    const actionType = firstAction.type;

    // Check if all actions are the same type
    const allSameType = actions.every(a => a.type === actionType);
    
    if (!allSameType) {
      return {
        isInvariant: false,
        description: 'Mixed action types',
        actionType: 'mixed',
        elementIdentifier: '',
        variationType: 'choice',
        values: actions.map(a => a.type),
        primaryStrategy: 'Use most common action type'
      };
    }

    // Analyze based on action type
    if (actionType === 'mouse') {
      return this.analyzeMouseActions(actions, stepIndex);
    } else if (actionType === 'keyboard') {
      return this.analyzeKeyboardActions(actions, stepIndex);
    } else if (actionType === 'scroll') {
      return this.analyzeScrollActions(actions, stepIndex);
    }

    return {
      isInvariant: true,
      description: `${actionType} action`,
      actionType,
      elementIdentifier: '',
      primaryStrategy: actionType.toUpperCase()
    };
  }

  /**
   * Analyzes mouse click actions
   */
  private analyzeMouseActions(actions: RawAction[], _stepIndex: number): any {
    // Check if clicking same element (by text/id)
    const elementTexts = actions.map(a => a.data.element?.text).filter(Boolean);
    // const elementIds = actions.map(a => a.data.element?.id).filter(Boolean);
    
    // Check for invariant element
    if (elementTexts.length > 0) {
      const uniqueTexts = new Set(elementTexts);
      if (uniqueTexts.size === 1) {
        // Always clicking same text
        const text = elementTexts[0]!;
        return {
          isInvariant: true,
          description: `Click element containing "${text}"`,
          actionType: 'click',
          elementIdentifier: `text:${text}`,
          primaryStrategy: `FOCUS_ELEMENT:${text} then CLICK`,
          fallbackStrategies: [
            `Find by approximate position`,
            `Find by element type`
          ]
        };
      }
    }

    // Check positions - if similar, it's an invariant position
    const positions = actions.map(a => ({ x: a.data.x || 0, y: a.data.y || 0 }));
    const positionVariance = this.calculateVariance(positions);
    
    if (positionVariance.x < 50 && positionVariance.y < 50) {
      // Positions very similar - probably same element
      const avgX = Math.round(positions.reduce((sum, p) => sum + p.x, 0) / positions.length);
      const avgY = Math.round(positions.reduce((sum, p) => sum + p.y, 0) / positions.length);
      
      return {
        isInvariant: true,
        description: `Click at approximately [${avgX}, ${avgY}]`,
        actionType: 'click',
        elementIdentifier: `position:${avgX},${avgY}`,
        primaryStrategy: `MOUSE_MOVE:${avgX}:${avgY} then CLICK`,
        fallbackStrategies: [`Search nearby area for clickable element`]
      };
    }

    // Position varies significantly - it's a variant
    return {
      isInvariant: false,
      description: `Click varies by position`,
      actionType: 'click',
      elementIdentifier: '',
      variationType: 'position' as const,
      values: positions,
      primaryStrategy: 'CLICK at detected element',
      fallbackStrategies: []
    };
  }

  /**
   * Analyzes keyboard actions
   */
  private analyzeKeyboardActions(actions: RawAction[], _stepIndex: number): any {
    // Check if typing same text
    const texts = actions.map(a => a.data.text).filter(Boolean);
    const keys = actions.map(a => a.data.key).filter(Boolean);
    
    if (texts.length > 0) {
      const uniqueTexts = new Set(texts);
      if (uniqueTexts.size === 1) {
        // Always typing same thing
        return {
          isInvariant: true,
          description: `Type "${texts[0]}"`,
          actionType: 'type',
          elementIdentifier: '',
          primaryStrategy: `TYPE:${texts[0]}`
        };
      } else {
        // Typing different things each time
        return {
          isInvariant: false,
          description: 'Typing varies',
          actionType: 'type',
          elementIdentifier: '',
          variationType: 'choice' as const,
          values: texts,
          primaryStrategy: 'TYPE:{user_input}'
        };
      }
    }

    if (keys.length > 0 && new Set(keys).size === 1) {
      // Always pressing same key
      return {
        isInvariant: true,
        description: `Press ${keys[0]} key`,
        actionType: 'keypress',
        elementIdentifier: '',
        primaryStrategy: `PRESS_KEY:${keys[0]}`
      };
    }

    return {
      isInvariant: true,
      description: 'Keyboard action',
      actionType: 'keyboard',
      elementIdentifier: '',
      primaryStrategy: 'KEYBOARD_ACTION'
    };
  }

  /**
   * Analyzes scroll actions
   */
  private analyzeScrollActions(actions: RawAction[], _stepIndex: number): any {
    const deltas = actions.map(a => a.data.deltaY || 0);
    const avgDelta = Math.round(deltas.reduce((sum, d) => sum + d, 0) / deltas.length);
    const variance = this.calculateNumberVariance(deltas);
    
    if (variance < 100) {
      // Scroll amount very consistent
      return {
        isInvariant: true,
        description: `Scroll ${avgDelta > 0 ? 'down' : 'up'} ${Math.abs(avgDelta)}px`,
        actionType: 'scroll',
        elementIdentifier: '',
        primaryStrategy: `SCROLL:${avgDelta > 0 ? 'down' : 'up'}:${Math.abs(avgDelta)}`
      };
    }

    return {
      isInvariant: false,
      description: 'Scroll amount varies',
      actionType: 'scroll',
      elementIdentifier: '',
      variationType: 'position' as const,
      values: deltas,
      average: avgDelta,
      primaryStrategy: `SCROLL:${avgDelta > 0 ? 'down' : 'up'}:${Math.abs(avgDelta)}`
    };
  }

  /**
   * Converts extracted pattern into executable commands
   */
  private synthesizeCommands(pattern: ExtractedPattern): string[] {
    const commands: string[] = [];

    pattern.invariants.forEach(inv => {
      const strategy = pattern.fallbackStrategies.find(f => f.step === inv.step);
      if (strategy) {
        commands.push(strategy.primary);
      }
    });

    return commands;
  }

  /**
   * Converts pattern to Gemini-optimized knowledge format
   */
  toAIOptimizedKnowledge(pattern: ExtractedPattern): AIOptimizedKnowledge {
    const systemContext = this.buildGeminiContext(pattern);
    
    return {
      id: crypto.randomUUID(),
      version: 1,
      name: pattern.taskName,
      description: `Learned from ${pattern.totalAttempts} observations`,
      category: 'custom',
      
      geminiPrompt: {
        systemContext,
        taskGoal: pattern.taskName,
        currentStateAnalysis: ['Learned behavior - adapt to current UI state'],
        decisionTree: pattern.fallbackStrategies.map((fb, idx) => ({
          condition: `Step ${idx + 1} succeeds`,
          ifTrue: fb.primary,
          ifFalse: fb.fallbacks[0] || 'Retry'
        }))
      },
      
      observations: [],
      
      statistics: {
        timesExecuted: 0,
        successRate: 0,
        avgExecutionTime: 0,
        lastFailureReason: undefined
      },
      
      confidence: Math.min(0.7 + (pattern.totalAttempts * 0.1), 0.95),
      lastTested: new Date()
    };
  }

  /**
   * Builds Gemini system context from pattern
   */
  private buildGeminiContext(pattern: ExtractedPattern): string {
    let context = `LEARNED BEHAVIOR: ${pattern.taskName}\n\n`;
    context += `OBSERVATIONS: ${pattern.totalAttempts} repetitions analyzed\n\n`;
    context += `STRATEGY:\n`;

    pattern.invariants.forEach((inv, idx) => {
      const strategy = pattern.fallbackStrategies.find(f => f.step === inv.step);
      context += `Step ${idx + 1}: ${inv.description}\n`;
      if (strategy) {
        context += `  - Primary: ${strategy.primary}\n`;
        if (strategy.fallbacks.length > 0) {
          context += `  - Fallback: ${strategy.fallbacks.join(', ')}\n`;
        }
      }
      context += '\n';
    });

    if (pattern.variants.length > 0) {
      context += `ADAPTATIONS:\n`;
      pattern.variants.forEach(variant => {
        context += `- ${variant.description}`;
        if (variant.average) {
          context += ` (average: ${variant.average})`;
        }
        context += '\n';
      });
      context += '\n';
    }

    context += `SUCCESS CRITERIA: ${pattern.successCriteria}\n`;

    return context;
  }

  /**
   * Calculate position variance
   */
  private calculateVariance(positions: { x: number; y: number }[]): { x: number; y: number } {
    const avgX = positions.reduce((sum, p) => sum + p.x, 0) / positions.length;
    const avgY = positions.reduce((sum, p) => sum + p.y, 0) / positions.length;
    
    const varX = positions.reduce((sum, p) => sum + Math.pow(p.x - avgX, 2), 0) / positions.length;
    const varY = positions.reduce((sum, p) => sum + Math.pow(p.y - avgY, 2), 0) / positions.length;
    
    return {
      x: Math.sqrt(varX),
      y: Math.sqrt(varY)
    };
  }

  /**
   * Calculate number variance
   */
  private calculateNumberVariance(numbers: number[]): number {
    const avg = numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
    const variance = numbers.reduce((sum, n) => sum + Math.pow(n - avg, 2), 0) / numbers.length;
    return Math.sqrt(variance);
  }
}
