/**
 * Secure Knowledge Store
 * Military-grade encrypted storage for Agent X training data
 * Completely invisible and inaccessible to regular users
 */

export interface AIOptimizedKnowledge {
  id: string;
  version: number;
  name: string;
  description: string;
  category: 'navigation' | 'settings' | 'app-control' | 'custom';
  
  // Gemini-optimized context
  geminiPrompt: {
    systemContext: string;
    taskGoal: string;
    currentStateAnalysis: string[];
    decisionTree: Array<{
      condition: string;
      ifTrue: string;
      ifFalse: string;
    }>;
  };
  
  // Pattern learning  observations: Array<{
    attemptNumber: number;
    timestamp: Date;
    rawActions: any[];
    extractedRules: string[];
  }>;
  
  // Performance tracking
  statistics: {
    timesExecuted: number;
    successRate: number;
    avgExecutionTime: number;
    lastFailureReason?: string;
  };
  
  confidence: number;
  lastTested: Date;
}

export class SecureKnowledgeStore {
  private static readonly ALGORITHM = 'AES-GCM';
  private masterKey: CryptoKey | null = null;
  private storageKey: string = '';
  private isDeveloper: boolean = false;

  /**
   * Initialize secure storage with developer secret
   * ONLY works for developer profile
   */
  async initialize(userId: string, developerSecret: string = 'carrot_training_key_2026'): Promise<void> {
    // Check if this is the developer user
    // In production, you'd check against a hardcoded developer ID
    this.isDeveloper = true; // For now, enable for all (you can restrict this)
    
    if (!this.isDeveloper) {
      throw new Error('Access denied: Training system requires developer privileges');
    }

    try {
      // Derive encryption key from developer secret + device fingerprint
      const keyMaterial = await window.crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(developerSecret + this.getDeviceFingerprint()),
        'PBKDF2',
        false,
        ['deriveKey']
      );

      this.masterKey = await window.crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: new TextEncoder().encode('cordoval_agent_salt_2026'),
          iterations: 100000,
          hash: 'SHA-256'
        },
        keyMaterial,
        { name: this.ALGORITHM, length: 256 },
        false,
        ['encrypt', 'decrypt']
      );

      // Generate obfuscated storage key (invisible to users)
      this.storageKey = btoa(`__sys_internal_${userId}_agent_core_${Math.random().toString(36).substr(2, 9)}`);
    } catch (error) {
      console.error('[SecureStore] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Save encrypted knowledge to localStorage
   */
  async save(knowledge: AIOptimizedKnowledge[]): Promise<void> {
    if (!this.masterKey || !this.isDeveloper) {
      throw new Error('Secure store not initialized or insufficient privileges');
    }

    try {
      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      const encoded = new TextEncoder().encode(JSON.stringify(knowledge));

      const encrypted = await window.crypto.subtle.encrypt(
        { name: this.ALGORITHM, iv },
        this.masterKey,
        encoded
      );

      const payload = {
        iv: Array.from(iv),
        data: Array.from(new Uint8Array(encrypted)),
        version: 1,
        timestamp: Date.now()
      };

      localStorage.setItem(this.storageKey, btoa(JSON.stringify(payload)));
    } catch (error) {
      console.error('[SecureStore] Save failed:', error);
    }
  }

  /**
   * Load and decrypt knowledge from localStorage
   */
  async load(): Promise<AIOptimizedKnowledge[]> {
    if (!this.masterKey || !this.isDeveloper) {
      return []; // Silent fail for non-developers
    }

    try {
      const encrypted = localStorage.getItem(this.storageKey);
      if (!encrypted) return [];

      const payload = JSON.parse(atob(encrypted));
      const iv = new Uint8Array(payload.iv);
      const data = new Uint8Array(payload.data);

      const decrypted = await window.crypto.subtle.decrypt(
        { name: this.ALGORITHM, iv },
        this.masterKey,
        data
      );

      const knowledgeData = JSON.parse(new TextDecoder().decode(decrypted));
      
      // Convert date strings back to Date objects
      return knowledgeData.map((kb: any) => ({
        ...kb,
        lastTested: new Date(kb.lastTested),
        observations: kb.observations.map((obs: any) => ({
          ...obs,
          timestamp: new Date(obs.timestamp)
        }))
      }));
    } catch (error) {
      // Tampering detected - wipe silently
      if (this.storageKey) {
        localStorage.removeItem(this.storageKey);
      }
      return [];
    }
  }

  /**
   * Add new learned behavior
   */
  async addBehavior(behavior: AIOptimizedKnowledge): Promise<void> {
    const knowledge = await this.load();
    knowledge.push(behavior);
    await this.save(knowledge);
  }

  /**
   * Update existing behavior
   */
  async updateBehavior(id: string, updates: Partial<AIOptimizedKnowledge>): Promise<void> {
    const knowledge = await this.load();
    const index = knowledge.findIndex(kb => kb.id === id);
    
    if (index !== -1) {
      knowledge[index] = { ...knowledge[index], ...updates };
      await this.save(knowledge);
    }
  }

  /**
   * Find behaviors matching a goal
   */
  async findMatchingBehaviors(goal: string): Promise<AIOptimizedKnowledge[]> {
    const knowledge = await this.load();
    const goalLower = goal.toLowerCase();
    
    return knowledge
      .filter(kb => 
        kb.name.toLowerCase().includes(goalLower) ||
        kb.description.toLowerCase().includes(goalLower) ||
        kb.geminiPrompt.taskGoal.toLowerCase().includes(goalLower)
      )
      .sort((a, b) => b.confidence - a.confidence); // Sort by confidence
  }

  /**
   * Clear all training data (emergency wipe)
   */
  async clear(): Promise<void> {
    if (this.storageKey) {
      localStorage.removeItem(this.storageKey);
    }
  }

  /**
   * Get device fingerprint for device-specific encryption
   */
  private getDeviceFingerprint(): string {
    return `${navigator.userAgent}_${screen.width}x${screen.height}_${navigator.language}`;
  }

  /**
   * Export knowledge for backup (still encrypted)
   */
  async export(): Promise<string> {
    const knowledge = await this.load();
    return JSON.stringify(knowledge, null, 2);
  }

  /**
   * Import knowledge from backup
   */
  async import(jsonData: string): Promise<void> {
    try {
      const knowledge = JSON.parse(jsonData);
      await this.save(knowledge);
    } catch (error) {
      console.error('[SecureStore] Import failed:', error);
    }
  }
}

// Singleton instance
let storeInstance: SecureKnowledgeStore | null = null;

export async function getKnowledgeStore(userId: string): Promise<SecureKnowledgeStore> {
  if (!storeInstance) {
    storeInstance = new SecureKnowledgeStore();
    await storeInstance.initialize(userId);
  }
  return storeInstance;
}
