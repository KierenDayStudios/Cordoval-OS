import React, { useState, useRef, useEffect } from 'react';
import { ModernIcon } from './ModernIcon';
import { AIService, ChatMessage } from '../services/AIService';

interface NoahAssistantProps {
    userId: string;
    isOpen: boolean;
    onClose: () => void;
    onOpen: () => void;
    onOpenAppById?: (appId: string) => void;
}

interface SpeechRecognitionEvent extends Event {
    resultIndex: number;
    results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
    error: string;
}

export const NoahAssistant: React.FC<NoahAssistantProps> = ({ userId, isOpen, onClose, onOpen, onOpenAppById }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([
        { role: 'system', content: 'You are Noah, the advanced AI assistant integrated into Cordoval OS.' },
        { role: 'assistant', content: 'Hello! I am Noah. How can I assist you with your Cordoval OS experience today?' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isThinking, setIsThinking] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [interimTranscript, setInterimTranscript] = useState('');

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const aiService = useRef(new AIService(userId));
    const recognitionRef = useRef<any>(null);
    const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const isListeningRef = useRef(isListening);
    const isSpeakingRef = useRef(isSpeaking);

    useEffect(() => {
        isListeningRef.current = isListening;
    }, [isListening]);

    useEffect(() => {
        isSpeakingRef.current = isSpeaking;
    }, [isSpeaking]);

    // Initialize Speech Recognition
    useEffect(() => {
        const primeMic = async (): Promise<void> => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                console.log('Noah: Microphone primed successfully.');
                stream.getTracks().forEach(track => track.stop());
            } catch (err) {
                console.error('Noah: Failed to prime microphone:', err);
            }
        };

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) return;

        primeMic();

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: SpeechRecognitionEvent) => {
            let currentTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                currentTranscript += event.results[i][0].transcript;
            }

            console.log('Noah Speech Status:', {
                isListening: isListeningRef.current,
                isSpeaking: isSpeakingRef.current,
                transcript: currentTranscript
            });

            setInterimTranscript(currentTranscript);

            // Wake word detection
            if (!isListeningRef.current && !isSpeakingRef.current && currentTranscript.toLowerCase().includes('noah')) {
                console.log('Noah detected wake word!');
                startListeningForQuery();
                return;
            }

            if (isListeningRef.current) {
                if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
                silenceTimeoutRef.current = setTimeout(() => {
                    handleVoiceInputComplete(currentTranscript);
                }, 2000);
            }
        };

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
            console.error('Noah Speech Recognition Error:', event.error);
            if (event.error === 'not-allowed') {
                console.warn('Microphone access denied.');
            } else if (event.error === 'network') {
                console.error('Noah Speech Recognition network error. This often means Google Speech API is blocked or unavailable in this environment.');
            }
        };

        let restartTimeout: NodeJS.Timeout | null = null;
        let consecutiveErrors = 0;

        recognition.onstart = () => {
            console.log('Noah Speech Recognition: Engine Started Successfully');
            consecutiveErrors = 0;
        };

        recognition.onend = () => {
            console.log('Noah Speech Recognition: Engine Stopped');
            // Longer backoff to prevent spam if network is failing
            if (restartTimeout) clearTimeout(restartTimeout);
            restartTimeout = setTimeout(() => {
                if (!isSpeakingRef.current) {
                    try {
                        recognition.start();
                    } catch (e) {
                        consecutiveErrors++;
                    }
                }
            }, 3000);
        };

        recognitionRef.current = recognition;
        try { recognition.start(); } catch (e) { }

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.onend = null;
                recognitionRef.current.stop();
            }
        };
    }, []);

    const startListeningForQuery = () => {
        setIsListening(true);
        setInterimTranscript('');
        // Stop and restart to clear buffer
        if (recognitionRef.current) {
            try { recognitionRef.current.stop(); } catch (e) { }
        }
        // Trigger UI open if not open
        if (!isOpen) {
            onOpen();
        }
    };

    const handleVoiceInputComplete = (transcript: string) => {
        setIsListening(false);
        setInterimTranscript('');
        if (transcript.trim()) {
            // Clean wake word from transcript if it was just for activation
            const cleanTranscript = transcript.toLowerCase().includes('noah')
                ? transcript.replace(/noah/i, '').trim()
                : transcript;

            if (cleanTranscript) {
                setInput(cleanTranscript);
                handleSend(cleanTranscript);
            }
        }
    };

    const handleSend = async (overrideInput?: string) => {
        const textToSend = overrideInput || input;
        if (!textToSend.trim() || isLoading) return;

        const userMessage: ChatMessage = { role: 'user', content: textToSend };
        const newMessages = [...messages, userMessage];
        setMessages(newMessages);
        setInput('');
        setIsThinking(true);
        setIsLoading(true);

        try {
            const response = await aiService.current.sendMessage(newMessages);

            // Handle app opening commands
            const appMatch = response.match(/\[COMMAND:OPEN_APP:(.+?)\]/);
            if (appMatch && onOpenAppById) {
                const appId = appMatch[1].trim();
                onOpenAppById(appId);
            }

            // Cleanup commands from response for speaking and displaying
            const cleanResponse = response.replace(/\[COMMAND:OPEN_APP:.+?\]/g, '').trim();

            setMessages(prev => [...prev, { role: 'assistant', content: cleanResponse }]);
            speak(cleanResponse);
        } catch (error: any) {
            setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${error.message}` }]);
        } finally {
            setIsLoading(false);
            setIsThinking(false);
        }
    };

    const speak = (text: string) => {
        if (!window.speechSynthesis) return;

        // Stop current speaking
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;

        // Try to find a nice premium voice
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(v => v.name.includes('Google') || v.name.includes('Premium')) || voices[0];
        if (preferredVoice) utterance.voice = preferredVoice;

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => {
            setIsSpeaking(false);
            // Resume listening for wake word
            if (recognitionRef.current) try { recognitionRef.current.start(); } catch (e) { }
        };

        window.speechSynthesis.speak(utterance);
    };

    return (
        <>
            {isOpen && (
                <div className="noah-widget" style={{
                    position: 'absolute', bottom: 100, right: 30, width: 320, height: 600,
                    background: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(40px) saturate(180%)',
                    borderRadius: 28, padding: '0', color: '#333', border: '1px solid rgba(255, 255, 255, 0.6)',
                    boxShadow: '0 25px 60px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', overflow: 'hidden', zIndex: 100,
                    animation: 'fadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}>
                    <div className="ai-header" style={{ padding: '20px', borderBottom: '1px solid rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{ position: 'relative' }}>
                            <ModernIcon iconName="Sparkles" size={38} gradient="linear-gradient(135deg, #8b5cf6, #d946ef)" />
                            {(isListening || isSpeaking) && (
                                <div style={{
                                    position: 'absolute', top: -4, right: -4, width: 12, height: 12,
                                    borderRadius: '50%', background: isListening ? '#ef4444' : '#10b981',
                                    boxShadow: `0 0 10px ${isListening ? '#ef4444' : '#10b981'}`,
                                    animation: 'pulse 1.5s infinite'
                                }} />
                            )}
                        </div>
                        <div className="ai-header-title" style={{ flex: 1 }}>
                            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900, letterSpacing: -0.5 }}>Noah</h2>
                            <p style={{ margin: 0, fontSize: 11, fontWeight: 600, opacity: 0.5, textTransform: 'uppercase' }}>
                                {isListening ? 'Listening...' : isSpeaking ? 'Speaking...' : isThinking ? 'Thinking...' : 'Active Context'}
                            </p>
                        </div>
                        <button onClick={onClose} style={{ background: 'rgba(0,0,0,0.05)', border: 'none', width: 32, height: 32, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.2s' }}>✕</button>
                    </div>

                    <div className="ai-messages" style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {messages.filter(m => m.role !== 'system').map((msg, i) => (
                            <div key={i} className={`chat-bubble ${msg.role}`} style={{
                                maxWidth: '90%', padding: '12px 16px', borderRadius: 20, fontSize: 13, lineHeight: 1.5,
                                alignSelf: msg.role === 'assistant' ? 'flex-start' : 'flex-end',
                                background: msg.role === 'assistant' ? 'white' : 'var(--accent-color)',
                                color: msg.role === 'assistant' ? '#333' : 'white',
                                boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
                                borderBottomLeftRadius: msg.role === 'assistant' ? 4 : 20,
                                borderBottomRightRadius: msg.role === 'user' ? 4 : 20,
                                fontWeight: msg.role === 'user' ? 500 : 400
                            }}>
                                {msg.content}
                            </div>
                        ))}
                        {isThinking && (
                            <div className="chat-bubble assistant" style={{ alignSelf: 'flex-start', background: 'white', padding: '12px 16px', borderRadius: 20, fontSize: 12, color: '#888', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
                                <div className="typing-loader" style={{ display: 'flex', gap: 4 }}>
                                    <div className="dot" style={{ width: 6, height: 6, borderRadius: '50%', background: '#8b5cf6', animation: 'bounce 1s infinite' }} />
                                    <div className="dot" style={{ width: 6, height: 6, borderRadius: '50%', background: '#d946ef', animation: 'bounce 1s infinite 0.2s' }} />
                                    <div className="dot" style={{ width: 6, height: 6, borderRadius: '50%', background: '#8b5cf6', animation: 'bounce 1s infinite 0.4s' }} />
                                </div>
                            </div>
                        )}
                        {interimTranscript && (
                            <div className="chat-bubble user interim" style={{ alignSelf: 'flex-end', background: 'rgba(0,0,0,0.05)', padding: '10px 14px', borderRadius: 20, fontSize: 12, color: '#666', fontStyle: 'italic' }}>
                                {interimTranscript}...
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="ai-input-area" style={{ padding: '20px', background: 'rgba(255,255,255,0.4)', borderTop: '1px solid rgba(0,0,0,0.05)', display: 'flex', gap: 10, alignItems: 'center' }}>
                        <div style={{ position: 'relative', flex: 1 }}>
                            <input
                                type="text"
                                placeholder={isListening ? "Listening to you..." : "Talk to Noah..."}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                disabled={isLoading}
                                style={{ width: '100%', padding: '12px 18px', borderRadius: 24, border: '1px solid rgba(0,0,0,0.1)', outline: 'none', fontSize: 13, background: 'rgba(255,255,255,0.9)' }}
                            />
                            {isListening && (
                                <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', display: 'flex', gap: 2 }}>
                                    {[1, 2, 3].map(i => <div key={i} style={{ width: 3, height: 12, background: '#ef4444', borderRadius: 2, animation: `scaleY 0.5s infinite ${i * 0.1}s` }} />)}
                                </div>
                            )}
                        </div>
                        <button
                            onClick={() => handleSend()}
                            disabled={isLoading || !input.trim()}
                            style={{ width: 44, height: 44, borderRadius: '50%', border: 'none', background: 'var(--accent-color)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: '0.2s', boxShadow: '0 8px 20px rgba(0,0,0,0.1)' }}
                        >
                            <ModernIcon iconName="Send" size={18} gradient="transparent" />
                        </button>
                    </div>
                    <style>{`
                @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
                @keyframes pulse { 0% { transform: scale(1); opacity: 0.8; } 50% { transform: scale(1.3); opacity: 0.4; } 100% { transform: scale(1); opacity: 0.8; } }
                @keyframes scaleY { 0%, 100% { transform: scaleY(1); } 50% { transform: scaleY(2); } }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
                </div>
            )}
        </>
    );
};
