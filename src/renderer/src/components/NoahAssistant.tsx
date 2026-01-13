import React, { useState, useRef, useEffect, useCallback } from 'react'
import { ModernIcon } from './ModernIcon'
import { AIService, ChatMessage, loadNoahMemory, saveNoahMemory } from '../services/AIService'

interface NoahAssistantProps {
  userId: string
  isOpen: boolean
  onClose: () => void
  onOpen: () => void
  onOpenAppById?: (appId: string) => void
  onGenerateApp?: (appName: string, code: string) => void
}

export const NoahAssistant: React.FC<NoahAssistantProps> = ({
  userId,
  isOpen,
  onClose,
  onOpen,
  onOpenAppById,
  onGenerateApp
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'system',
      content: 'You are Noah, the advanced AI assistant integrated into Cordoval OS.'
    },
    {
      role: 'assistant',
      content: 'Hello! I am Noah. How can I assist you with your Cordoval OS experience today?'
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [isThinking, setIsThinking] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [interimTranscript, setInterimTranscript] = useState('')
  const [sttError, setSttError] = useState<string | null>(null)
  const [micLevel, setMicLevel] = useState(0)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const aiService = useRef(new AIService(userId))
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const isListeningRef = useRef(false)
  const isSpeakingRef = useRef(false)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationFrameRef = useRef<number | null>(null)

  const scrollToBottom = (): void => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    isListeningRef.current = isListening
  }, [isListening])

  useEffect(() => {
    isSpeakingRef.current = isSpeaking
  }, [isSpeaking])

  // Pre-load voices
  useEffect(() => {
    const loadVoices = (): void => {
      window.speechSynthesis.getVoices()
    }
    loadVoices()
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices
    }
  }, [])

  const speak = (text: string): void => {
    if (!window.speechSynthesis) return
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 1.0
    utterance.pitch = 1.0

    const voices = window.speechSynthesis.getVoices()
    // Prioritize natural sounding voices
    const preferredVoice =
      voices.find((v) => v.name.includes('Google US English') && v.name.includes('Male')) ||
      voices.find((v) => v.name.includes('Google') || v.name.includes('Natural')) ||
      voices.find((v) => v.lang.startsWith('en-US')) ||
      voices.find((v) => v.lang.startsWith('en')) ||
      voices[0]

    if (preferredVoice) utterance.voice = preferredVoice

    utterance.onstart = () => {
      setIsSpeaking(true)
    }
    utterance.onend = () => {
      setIsSpeaking(false)
    }

    window.speechSynthesis.speak(utterance)
  }

  const handleSend = useCallback(
    async (overrideInput?: string): Promise<void> => {
      const textToSend = overrideInput || input
      if (!textToSend.trim() || isLoading) return

      const userMessage: ChatMessage = { role: 'user', content: textToSend }
      setMessages((prev) => [...prev, userMessage])
      setInput('')
      setIsThinking(true)
      setIsLoading(true)

      try {
        const currentMessages = [...messages, userMessage]
        const response = await aiService.current.sendMessage(currentMessages)

        const appMatch = response.match(/\[COMMAND:OPEN_APP:(.+?)\]/)
        if (appMatch && onOpenAppById) {
          onOpenAppById(appMatch[1].trim())
        }

        // Handle Memory Updates
        const memoryMatches = response.matchAll(/\[COMMAND:SAVE_MEMORY:(.+?):(.+?)\]/g)
        const currentMemory = loadNoahMemory(userId)
        let memoryUpdated = false
        for (const match of memoryMatches) {
          const key = match[1].trim()
          const value = match[2].trim()
          currentMemory[key] = value
          memoryUpdated = true
        }
        if (memoryUpdated) {
          saveNoahMemory(userId, currentMemory)
        }

        // Handle App Generation
        const appGenMatch = response.match(/\[COMMAND:GENERATE_APP:(.+?):([\s\S]+?)\]/)
        if (appGenMatch && onGenerateApp) {
          onGenerateApp(appGenMatch[1].trim(), appGenMatch[2].trim())
        }

        const cleanResponse = response
          .replace(/\[COMMAND:OPEN_APP:.+?\]/g, '')
          .replace(/\[COMMAND:SAVE_MEMORY:.+?\]/g, '')
          .replace(/\[COMMAND:GENERATE_APP:.+?:[\s\S]+?\]/g, '')
          .trim()
        setMessages((prev) => [...prev, { role: 'assistant', content: cleanResponse }])
        speak(cleanResponse)
      } catch (error: Error | unknown) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: `Error: ${(error as Error).message || 'Failed to fetch response'}`
          }
        ])
      } finally {
        setIsLoading(false)
        setIsThinking(false)
      }
    },
    [input, isLoading, messages, onOpenAppById, onGenerateApp, userId]
  )

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1]
        resolve(base64String)
      }
      reader.readAsDataURL(blob)
    })
  }

  const stopListeningAndProcess = async (): Promise<void> => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') return

    setIsListening(false)
    mediaRecorderRef.current.stop()
    setInterimTranscript('Processing voice...')
  }

  const startListeningForQuery = useCallback(async (): Promise<void> => {
    if (isListening || isSpeaking || isLoading) return

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      audioChunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data)
      }

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        stream.getTracks().forEach((t) => t.stop())

        if (audioBlob.size < 1000) {
          setInterimTranscript('')
          return
        }

        try {
          const base64 = await blobToBase64(audioBlob)
          const transcript = await aiService.current.transcribeAudio(base64, 'audio/webm')

          if (transcript.trim()) {
            setInterimTranscript('')
            handleSend(transcript)
          } else {
            setInterimTranscript('No speech detected.')
            setTimeout(() => setInterimTranscript(''), 2000)
          }
        } catch (err) {
          console.error('Transcription failed:', err)
          setSttError('Voice recognition failed.')
        }
      }

      mediaRecorderRef.current = recorder
      recorder.start()
      setIsListening(true)
      setInterimTranscript('Listening...')

      if (!isOpen) onOpen()
    } catch (err) {
      console.error('Mic access denied:', err)
      setSttError('Microphone not available.')
    }
  }, [isListening, isSpeaking, isLoading, isOpen, onOpen, handleSend])

  useEffect(() => {
    const handleStartListening = (): void => {
      startListeningForQuery()
    }
    window.addEventListener('noah-start-listening', handleStartListening)
    return () => window.removeEventListener('noah-start-listening', handleStartListening)
  }, [startListeningForQuery])

  // Pseudo-VAD and Vol Meter
  useEffect(() => {
    let stream: MediaStream | null = null

    const initMonitor = async (): Promise<void> => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        const audioContext = new (
          window.AudioContext ||
          (window as Window & typeof globalThis & { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext
        )()
        const analyser = audioContext.createAnalyser()
        const source = audioContext.createMediaStreamSource(stream)
        analyser.fftSize = 256
        analyserRef.current = analyser
        source.connect(analyser)

        const dataArray = new Uint8Array(analyser.frequencyBinCount)
        const update = (): void => {
          analyser.getByteFrequencyData(dataArray)
          const sum = dataArray.reduce((s, v) => s + v, 0)
          const average = sum / dataArray.length
          setMicLevel(average)

          // Silence detection when listening
          if (isListeningRef.current) {
            if (average > 15) {
              if (silenceTimerRef.current) {
                clearTimeout(silenceTimerRef.current)
                silenceTimerRef.current = null
              }
            } else if (!silenceTimerRef.current) {
              silenceTimerRef.current = setTimeout(() => {
                stopListeningAndProcess()
              }, 2000)
            }
          }

          animationFrameRef.current = requestAnimationFrame(update)
        }
        update()
      } catch (e) {
        console.error('Monitor fail:', e)
      }
    }

    initMonitor()

    return () => {
      if (stream) stream.getTracks().forEach((t) => t.stop())
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
    }
  }, [])

  return (
    <>
      {isOpen && (
        <div
          className="noah-widget"
          style={{
            position: 'fixed',
            bottom: 100,
            right: 30,
            width: 320,
            height: 600,
            background: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(40px) saturate(180%)',
            borderRadius: 28,
            padding: '0',
            color: '#333',
            border: '1px solid rgba(255, 255, 255, 0.6)',
            boxShadow: '0 25px 60px rgba(0,0,0,0.15)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            zIndex: 100,
            animation: 'fadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          <div
            className="ai-header"
            style={{
              padding: '20px',
              borderBottom: '1px solid rgba(0,0,0,0.05)',
              display: 'flex',
              alignItems: 'center',
              gap: 14
            }}
          >
            <div style={{ position: 'relative' }}>
              <ModernIcon
                iconName="Sparkles"
                size={38}
                gradient="linear-gradient(135deg, #8b5cf6, #d946ef)"
              />
              {(isListening || isSpeaking) && (
                <div
                  style={{
                    position: 'absolute',
                    top: -4,
                    right: -4,
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    background: isListening ? '#ef4444' : '#10b981',
                    boxShadow: `0 0 10px ${isListening ? '#ef4444' : '#10b981'}`,
                    animation: 'pulse 1.5s infinite'
                  }}
                />
              )}
            </div>
            <div className="ai-header-title" style={{ flex: 1 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900, letterSpacing: -0.5 }}>
                Noah
              </h2>
              <p
                style={{
                  margin: 0,
                  fontSize: 11,
                  fontWeight: 600,
                  opacity: 0.5,
                  textTransform: 'uppercase'
                }}
              >
                {isListening
                  ? 'Listening...'
                  : isSpeaking
                    ? 'Speaking...'
                    : isThinking
                      ? 'Thinking...'
                      : sttError
                        ? 'Speech Error'
                        : 'Active Context'}
              </p>
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'rgba(0,0,0,0.05)',
                border: 'none',
                width: 32,
                height: 32,
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              ✕
            </button>
          </div>

          <div
            className="ai-messages"
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: 12
            }}
          >
            {messages
              .filter((m) => m.role !== 'system')
              .map((msg, i) => (
                <div
                  key={i}
                  className={`chat-bubble ${msg.role}`}
                  style={{
                    maxWidth: '90%',
                    padding: '12px 16px',
                    borderRadius: 20,
                    fontSize: 13,
                    lineHeight: 1.5,
                    alignSelf: msg.role === 'assistant' ? 'flex-start' : 'flex-end',
                    background: msg.role === 'assistant' ? 'white' : 'var(--accent-color)',
                    color: msg.role === 'assistant' ? '#333' : 'white',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
                    borderBottomLeftRadius: msg.role === 'assistant' ? 4 : 20,
                    borderBottomRightRadius: msg.role === 'user' ? 4 : 20,
                    fontWeight: msg.role === 'user' ? 500 : 400
                  }}
                >
                  {msg.content}
                </div>
              ))}
            {isThinking && <div className="typing-indicator">Noah is thinking...</div>}
            {interimTranscript && (
              <div
                className="interim-transcript"
                style={{
                  padding: '10px 20px',
                  fontSize: 12,
                  color: '#666',
                  fontStyle: 'italic',
                  textAlign: 'center'
                }}
              >
                {interimTranscript}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div
            className="ai-input-area"
            style={{
              padding: '20px',
              background: 'rgba(255,255,255,0.4)',
              borderTop: '1px solid rgba(0,0,0,0.05)',
              display: 'flex',
              gap: 10,
              alignItems: 'center'
            }}
          >
            <div style={{ position: 'relative', flex: 1 }}>
              <input
                type="text"
                placeholder={isListening ? 'Listening...' : 'Talk to Noah...'}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                disabled={isLoading}
                style={{
                  width: '100%',
                  padding: '12px 18px',
                  borderRadius: 24,
                  border: '1px solid rgba(0,0,0,0.1)',
                  outline: 'none',
                  fontSize: 13,
                  background: 'rgba(255,255,255,0.9)'
                }}
              />
              {isListening && (
                <div
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    display: 'flex',
                    gap: 2,
                    alignItems: 'center'
                  }}
                >
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      style={{
                        width: 3,
                        height: Math.max(4, (micLevel / 50) * 20 * (i === 3 ? 1.5 : 1)),
                        background: '#ef4444',
                        borderRadius: 2,
                        transition: 'height 0.1s ease'
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={() => handleSend()}
              disabled={isLoading || !input.trim()}
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                border: 'none',
                background: 'var(--accent-color)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <ModernIcon iconName="Send" size={18} gradient="transparent" />
            </button>
            <button
              onClick={isListening ? stopListeningAndProcess : startListeningForQuery}
              disabled={isSpeaking || isLoading}
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                border: 'none',
                background: isListening ? '#ef4444' : 'rgba(0,0,0,0.05)',
                color: isListening ? 'white' : '#333',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <ModernIcon iconName="Mic" size={20} gradient="transparent" />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
