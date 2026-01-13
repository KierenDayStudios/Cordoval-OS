export type AIServiceType = 'gemini' | 'openai';

export interface AIConfig {
    provider: AIServiceType;
    apiKey: string;
}

export interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

const STORAGE_KEY_CONFIG = 'cordoval-ai-config';

export const loadAIConfig = (userId: string): AIConfig | null => {
    try {
        const saved = localStorage.getItem(`${STORAGE_KEY_CONFIG}-${userId}`);
        return saved ? JSON.parse(saved) : null;
    } catch {
        return null;
    }
};

export const saveAIConfig = (userId: string, config: AIConfig) => {
    localStorage.setItem(`${STORAGE_KEY_CONFIG}-${userId}`, JSON.stringify(config));
};

export class AIService {
    private config: AIConfig | null;

    constructor(userId: string) {
        this.config = loadAIConfig(userId);
    }

    async sendMessage(messages: ChatMessage[]): Promise<string> {
        if (!this.config || !this.config.apiKey) {
            throw new Error('AI API Key is missing. Please configure it in Settings.');
        }

        if (this.config.provider === 'gemini') {
            return this.callGemini(messages);
        } else {
            return this.callOpenAI(messages);
        }
    }

    private async callGemini(messages: ChatMessage[]): Promise<string> {
        // Gemini 2.0 Flash is the current stable model for fast, efficient AI assistants
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${this.config!.apiKey}`;
        
        console.log('[Noah AI] Attempting to connect to Gemini API...');

        // Convert messages to Gemini format (note: 'system' role is handled separately in systemInstruction if supported, 
        // but for simplicity we wrap it into the conversation context here if the model requires it)
        const contents = messages.filter(m => m.role !== 'system').map(m => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }]
        }));

        const systemInstruction = messages.find(m => m.role === 'system');

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents,
                    systemInstruction: systemInstruction ? {
                        parts: [{ text: systemInstruction.content }]
                    } : undefined,
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 1000,
                    }
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('[Noah AI] Gemini API Error:', errorData);
                throw new Error(errorData.error?.message || 'Failed to connect to Gemini API');
            }

            const data = await response.json();
            console.log('[Noah AI] Response received successfully.');
            return data.candidates?.[0]?.content?.parts?.[0]?.text || 'Noah is currently offline or unable to respond.';
        } catch (error: any) {
            console.error('[Noah AI] Network/service error:', error);
            throw error;
        }
    }

    private async callOpenAI(messages: ChatMessage[]): Promise<string> {
        const url = 'https://api.openai.com/v1/chat/completions';
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.config!.apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: messages.map(m => ({
                    role: m.role,
                    content: m.content
                })),
                temperature: 0.7
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || 'Failed to connect to OpenAI API');
        }

        const data = await response.json();
        return data.choices?.[0]?.message?.content || 'No response from AI.';
    }
}
