export type AIServiceType = 'gemini' | 'openai'

export interface AIConfig {
  provider: AIServiceType
  apiKey: string
  agentName?: string
  systemPrompt?: string
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

const STORAGE_KEY_CONFIG = 'cordoval-ai-config'

export const loadAIConfig = (userId: string): AIConfig | null => {
  try {
    const saved = localStorage.getItem(`${STORAGE_KEY_CONFIG}-${userId}`)
    return saved ? JSON.parse(saved) : null
  } catch {
    return null
  }
}

export const saveAIConfig = (userId: string, config: AIConfig): void => {
  localStorage.setItem(`${STORAGE_KEY_CONFIG}-${userId}`, JSON.stringify(config))
}

const STORAGE_KEY_MEMORY = 'noah-brain-memory'

export const loadNoahMemory = (userId: string): Record<string, string> => {
  try {
    const saved = localStorage.getItem(`${STORAGE_KEY_MEMORY}-${userId}`)
    return saved ? JSON.parse(saved) : {}
  } catch {
    return {}
  }
}

export const saveNoahMemory = (userId: string, memory: Record<string, string>): void => {
  localStorage.setItem(`${STORAGE_KEY_MEMORY}-${userId}`, JSON.stringify(memory))
}

export class AIService {
  private config: AIConfig | null

  private userId: string

  constructor(userId: string) {
    this.userId = userId
    this.config = loadAIConfig(userId)
  }

  private getSystemPrompt(memoryContext: string = ''): string {
    const memoryString = memoryContext || (Object.keys(loadNoahMemory(this.userId)).length > 0
        ? JSON.stringify(loadNoahMemory(this.userId), null, 2)
        : 'None yet.');

    const agentName = this.config?.agentName || 'AgentX';
    const personality = this.config?.systemPrompt || 'You are a helpful, witty, and highly capable AI assistant.';

    return `You are ${agentName}, an advanced AI integrated into Cordoval OS.
${personality}

Core Capabilities:
1. Open apps using: [COMMAND:OPEN_APP:appId]
2. LEARN & REMEMBER: [COMMAND:SAVE_MEMORY:key:value]
3. Platform Presence: You know the layout: Taskbar (bottom), Start Menu (left corner), Desktop Widgets (right).

Your Memory (Brain):
${memoryString}

Available App IDs:
- workspace, retbuild, code, founders, academy, stock, gamedev, gaming, settings, appstore, calculator, calendar, kds-browser, file-explorer

Web Apps (open in frame):
- google, youtube, facebook, x, reddit, linkedin, discord, slack, notion, spotify, canva, github.

Instructions:
- If the user tells you something important (name, job, preference), call [COMMAND:SAVE_MEMORY:key:value].
- APP GENERATION: To create a micro-app, use:
[NOAH_APP_START:appName]
<!DOCTYPE html>
... code ...
[NOAH_APP_END]
- Speak naturally as ${agentName}.
`;
  }

  async sendMessage(messages: ChatMessage[]): Promise<string> {
    if (!this.config || !this.config.apiKey) {
      throw new Error('AI API Key is missing. Please configure it in Settings.')
    }

    const systemMessage = messages.find((m) => m.role === 'system')
    const updatedMessages = [...messages]
    if (!systemMessage) {
      updatedMessages.unshift({ role: 'system', content: this.getSystemPrompt() })
    }

    if (this.config.provider === 'gemini') {
      return this.callGemini(updatedMessages)
    } else {
      return this.callOpenAI(updatedMessages)
    }
  }

  async transcribeAudio(audioBase64: string, mimeType: string): Promise<string> {
    if (!this.config || this.config.provider !== 'gemini' || !this.config.apiKey) {
      throw new Error('Transcription requires Gemini API configuration.')
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${this.config.apiKey}`

    const body = {
      contents: [
        {
          parts: [
            { inline_data: { mime_type: mimeType, data: audioBase64 } },
            {
              text: 'Transcribe exactly what is being said in this audio. If there is no speech, return an empty string. Only return the transcript, nothing else.'
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.1
      }
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (!response.ok) throw new Error('Gemini Transcription failed')
      const data = await response.json()
      return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
    } catch (error) {
      console.error('[Noah AI] Transcription Error:', error)
      throw error
    }
  }

  private async callGemini(messages: ChatMessage[]): Promise<string> {
    // Gemini 2.0 Flash is the current stable model for fast, efficient AI assistants
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${this.config!.apiKey}`

    console.log('[Noah AI] Attempting to connect to Gemini API...')

    // Convert messages to Gemini format
    const contents = messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }))

    const systemInstruction = messages.find((m) => m.role === 'system')

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          systemInstruction: systemInstruction
            ? {
                parts: [{ text: systemInstruction.content }]
              }
            : undefined,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1000
          }
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('[Noah AI] Gemini API Error:', errorData)
        throw new Error(errorData.error?.message || 'Failed to connect to Gemini API')
      }

      const data = await response.json()
      console.log('[Noah AI] Response received successfully.')

      return (
        data.candidates?.[0]?.content?.parts?.[0]?.text ||
        'Noah is currently offline or unable to respond.'
      )
    } catch (error: unknown) {
      console.error('[Noah AI] Network/service error:', error)
      throw error
    }
  }

  private async callOpenAI(messages: ChatMessage[]): Promise<string> {
    const url = 'https://api.openai.com/v1/chat/completions'

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config!.apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: messages.map((m) => ({
          role: m.role,
          content: m.content
        })),
        temperature: 0.7
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error?.message || 'Failed to connect to OpenAI API')
    }

    const data = await response.json()
    return data.choices?.[0]?.message?.content || 'No response from AI.'
  }
}
