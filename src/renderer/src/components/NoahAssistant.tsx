import React, { useState, useRef, useEffect } from 'react';
import { ModernIcon } from './ModernIcon';
import { AIService, ChatMessage } from '../services/AIService';

interface NoahAssistantProps {
    userId: string;
    isOpen: boolean;
    onClose: () => void;
}

export const NoahAssistant: React.FC<NoahAssistantProps> = ({ userId, isOpen, onClose }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([
        { role: 'system', content: 'You are Noah, the advanced AI assistant integrated into Cordoval OS. You are professional, witty, and extremely helpful. You specialize in managing business workflows and providing intelligent insights.' },
        { role: 'assistant', content: 'Hello! I am Noah. How can I assist you with your Cordoval OS experience today?' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const aiService = useRef(new AIService(userId));

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        aiService.current = new AIService(userId);
    }, [userId, isOpen]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage: ChatMessage = { role: 'user', content: input };
        const newMessages = [...messages, userMessage];
        setMessages(newMessages);
        setInput('');
        setIsLoading(true);

        try {
            const response = await aiService.current.sendMessage(newMessages);
            setMessages(prev => [...prev, { role: 'assistant', content: response }]);
        } catch (error: any) {
            setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${error.message}` }]);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="noah-widget" style={{
            position: 'absolute', bottom: 100, right: 30, width: 300, height: 550,
            background: 'rgba(255, 255, 255, 0.75)', backdropFilter: 'blur(30px) saturate(180%)',
            borderRadius: 24, padding: '0', color: '#333', border: '1px solid rgba(255, 255, 255, 0.5)',
            boxShadow: '0 15px 45px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', overflow: 'hidden', zIndex: 100
        }}>
            <div className="ai-header" style={{ padding: '15px 20px', borderBottom: '1px solid rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: 12 }}>
                <ModernIcon iconName="Sparkles" size={32} gradient="linear-gradient(135deg, #8b5cf6, #d946ef)" />
                <div className="ai-header-title">
                    <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>Noah AI</h2>
                    <p style={{ margin: 0, fontSize: 10, opacity: 0.6 }}>System Assistant</p>
                </div>
                <button onClick={onClose} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', opacity: 0.5, fontSize: 18 }}>✕</button>
            </div>

            <div className="ai-messages" style={{ flex: 1, overflowY: 'auto', padding: 15, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {messages.filter(m => m.role !== 'system').map((msg, i) => (
                    <div key={i} className={`chat-bubble ${msg.role}`} style={{
                        maxWidth: '85%', padding: '10px 14px', borderRadius: 15, fontSize: 12, lineHeight: 1.4,
                        alignSelf: msg.role === 'assistant' ? 'flex-start' : 'flex-end',
                        background: msg.role === 'assistant' ? 'white' : 'var(--accent-color)',
                        color: msg.role === 'assistant' ? '#333' : 'white',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                        borderBottomLeftRadius: msg.role === 'assistant' ? 2 : 15,
                        borderBottomRightRadius: msg.role === 'user' ? 2 : 15,
                    }}>
                        {msg.content}
                    </div>
                ))}
                {isLoading && (
                    <div className="chat-bubble assistant" style={{ alignSelf: 'flex-start', background: 'white', padding: '10px 14px', borderRadius: 15, fontSize: 11, color: '#888' }}>
                        <span className="typing-indicator">Noah is thinking...</span>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="ai-input-area" style={{ padding: 15, background: 'rgba(255,255,255,0.3)', borderTop: '1px solid rgba(0,0,0,0.05)', display: 'flex', gap: 8 }}>
                <input
                    type="text"
                    placeholder="Type to Noah..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    disabled={isLoading}
                    style={{ flex: 1, padding: '8px 15px', borderRadius: 20, border: '1px solid rgba(0,0,0,0.1)', outline: 'none', fontSize: 12 }}
                />
                <button
                    onClick={handleSend}
                    disabled={isLoading || !input.trim()}
                    style={{ width: 34, height: 34, borderRadius: '50%', border: 'none', background: 'var(--accent-color)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                >
                    <ModernIcon iconName="Send" size={14} gradient="transparent" />
                </button>
            </div>
        </div>
    );
};
