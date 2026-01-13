import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AIService, ChatMessage } from '../services/AIService';
import { useUser } from '../context/UserContext';

// --- Types ---
interface AIAgentProps {
    isOpen: boolean;
    onClose: () => void;
    // Window Management exposed to Agent
    windows: any[];
    onMoveWindow: (id: string, x: number, y: number) => void;
    onCloseWindow: (id: string) => void;
    onFocusWindow: (id: string) => void;
    onOpenApp: (appId: string) => void;
}

type ControlLevel = 'copilot' | 'autonomous';

export const AIAgent: React.FC<AIAgentProps> = ({
    isOpen,
    onClose,
    windows,
    onMoveWindow,
    onCloseWindow,
    onFocusWindow,
    onOpenApp
}) => {
    const { currentUser } = useUser();
    const [controlLevel, setControlLevel] = useState<ControlLevel>('copilot');
    const [status, setStatus] = useState('Idle');

    // Cursor State (Visual) & Ref (Logic)
    const [agentCursor, setAgentCursor] = useState({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
    const agentCursorRef = useRef(agentCursor);

    // Windows Ref for Loop Access
    const windowsRef = useRef(windows);
    useEffect(() => { windowsRef.current = windows; }, [windows]);

    const [logs, setLogs] = useState<string[]>(['Agent initialized.']);

    // Chat & Goal
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [goal, setGoal] = useState('');

    // AI Service Instance
    const aiService = useRef<AIService | null>(null);
    useEffect(() => {
        aiService.current = new AIService(currentUser?.id || 'default');
    }, [currentUser?.id]);
    const isProcessingRef = useRef(false);

    // --- Agent Actions ---
    const log = useCallback((msg: string) => setLogs(prev => [msg, ...prev].slice(0, 50)), []);

    const updateCursor = useCallback((x: number, y: number) => {
        setAgentCursor({ x, y });
        agentCursorRef.current = { x, y };
    }, []);

    const executeCommand = useCallback(async (command: string) => {
        log(`Executing: ${command}`);

        if (command.startsWith('MOUSE_MOVE')) {
            const parts = command.split(':');
            const x = parseFloat(parts[1]);
            const y = parseFloat(parts[2]);
            updateCursor(x, y);
        } else if (command.startsWith('CLICK')) {
            const { x, y } = agentCursorRef.current;
            const el = document.elementFromPoint(x, y) as HTMLElement;
            if (el) {
                el.click();
                el.focus();
                log(`Clicked on ${el.tagName}.${el.className}`);
            }
        } else if (command.startsWith('OPEN_APP')) {
            const appId = command.split(':')[1];
            onOpenApp(appId);
        } else if (command.startsWith('CLOSE_WINDOW')) {
            const winId = command.split(':')[1];
            onCloseWindow(winId);
        } else if (command.startsWith('MOVE_WINDOW')) {
            const parts = command.split(':');
            const winId = parts[1];
            const { x, y } = agentCursorRef.current;
            onMoveWindow(winId, x, y);
        } else if (command.startsWith('FINISHED')) {
            setGoal('');
            setControlLevel('copilot');
            log('Goal completed.');
            setStatus('Finished');
        }
    }, [log, onOpenApp, onCloseWindow, onMoveWindow, updateCursor]);

    // --- Autonomous Loop ---
    useEffect(() => {
        let timer: NodeJS.Timeout;

        const loop = async () => {
            if (controlLevel !== 'autonomous' || !isOpen || !goal || isProcessingRef.current) return;

            isProcessingRef.current = true;
            setStatus('Thinking (Auto)...');

            try {
                const currentWindows = windowsRef.current;
                const currentCursor = agentCursorRef.current;

                const windowList = currentWindows.map(w => `${w.id} (${w.title}) at [${Math.round(w.x)}, ${Math.round(w.y)}]`).join(', ');
                const statePrompt = `
[AUTONOMOUS MODE]
GOAL: "${goal}"
CURRENT STATE:
- Windows: ${windowList || 'None'}
- Cursor: [${Math.round(currentCursor.x)}, ${Math.round(currentCursor.y)}]
- Screen: ${window.innerWidth}x${window.innerHeight}

INSTRUCTIONS:
Determine the NEXT SINGLE step to achieve the goal.
Output ONE command from:
- [COMMAND:MOUSE_MOVE:x:y]
- [COMMAND:CLICK]
- [COMMAND:OPEN_APP:id]
- [COMMAND:CLOSE_WINDOW:id]
- [COMMAND:MOVE_WINDOW:id:x:y]
- [COMMAND:FINISHED] (If goal is done)

If you need to think, output a thought using normal text, then the command.
`;
                if (!aiService.current) throw new Error('AI Service not ready');
                const response = await aiService.current.sendMessage([
                    { role: 'system', content: statePrompt }
                ]);

                // Update logs with thought
                const thought = response.replace(/\[COMMAND:.+?\]/g, '').trim();
                if (thought) log(`d: ${thought}`);

                // Execute Command
                const match = response.match(/\[COMMAND:(.+?)\]/);
                if (match) {
                    await executeCommand(match[1]);
                }

            } catch (e) {
                console.error(e);
                log('Auto Loop Error');
            } finally {
                isProcessingRef.current = false;
                setStatus('Observing...');
            }
        };

        if (controlLevel === 'autonomous' && goal) {
            timer = setInterval(loop, 4000); // 4 second loop
            loop(); // Run immediately
        }

        return () => clearInterval(timer);
    }, [controlLevel, goal, isOpen, executeCommand]); // Removed windows/cursor from deps

    const handleSend = async () => {
        if (!input.trim()) return;

        // If autonomous mode is active, set input as goal
        if (controlLevel === 'autonomous') {
            setGoal(input);
            setMessages(prev => [...prev, { role: 'user', content: `Set Goal: ${input}` }]);
            setInput('');
            return;
        }

        // Copilot Mode
        const userMsg: ChatMessage = { role: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setStatus('Thinking...');

        const currentWindows = windowsRef.current;
        const windowList = currentWindows.map(w => `${w.id} (${w.title})`).join(', ');
        const contextMsg = `
[COPILOT MODE]
Context: Windows: ${windowList}, Screen: ${window.innerWidth}x${window.innerHeight}.
User Request: ${input}.
Output commands if needed: [COMMAND:OPEN_APP:id], [COMMAND:MOVE_WINDOW:id:x:y], etc.
`;

        try {
            if (!aiService.current) {
                log('AI Service not initialized');
                return;
            }
            const response = await aiService.current.sendMessage([
                { role: 'system', content: contextMsg },
                ...messages,
                userMsg
            ]);

            const commands = response.match(/\[COMMAND:(.+?)\]/g);
            if (commands) {
                for (const cmd of commands) {
                    const clean = cmd.replace('[', '').replace(']', '').replace('COMMAND:', '');
                    await executeCommand(clean);
                    await new Promise(r => setTimeout(r, 500));
                }
            }

            setMessages(prev => [...prev, { role: 'assistant', content: response.replace(/\[COMMAND:.+?\]/g, '') }]);
            setStatus('Idle');
        } catch (e) {
            log('Error connecting to AI');
            setStatus('Error');
        }
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Agent "Body" / Window */}
            <div style={{
                position: 'fixed',
                top: 100,
                right: 100,
                width: 350,
                height: 500,
                background: 'rgba(25, 25, 35, 0.95)',
                backdropFilter: 'blur(20px)',
                borderRadius: 20,
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
                display: 'flex',
                flexDirection: 'column',
                zIndex: 9999, // Highest
                color: 'white',
                fontFamily: 'Inter, sans-serif'
            }}>
                {/* Header */}
                <div style={{ padding: 20, borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: status === 'Idle' || status === 'Observing...' ? '#10b981' : '#f59e0b', boxShadow: '0 0 10px currentColor' }} />
                        <span style={{ fontWeight: 600 }}>Cortex Agent</span>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', opacity: 0.5 }}>✕</button>
                </div>

                {/* Control Level */}
                <div style={{ padding: 20, background: 'rgba(0,0,0,0.2)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 10, opacity: 0.7 }}>
                        <span>Copilot</span>
                        <span>Autonomous</span>
                    </div>
                    <input
                        type="range"
                        min="0" max="1" step="1"
                        value={controlLevel === 'autonomous' ? 1 : 0}
                        onChange={(e) => {
                            const val = e.target.value === '1' ? 'autonomous' : 'copilot';
                            setControlLevel(val);
                            if (val === 'copilot') setGoal('');
                        }}
                        style={{ width: '100%', accentColor: '#8b5cf6' }}
                    />
                    <p style={{ fontSize: 11, marginTop: 10, color: '#aaa', minHeight: 30 }}>
                        {controlLevel === 'copilot'
                            ? 'I will suggest actions but wait for your confirmation.'
                            : goal ? `Working on: "${goal}"` : 'Ready. Give me a goal below.'}
                    </p>
                </div>

                {/* Logs / Chat */}
                <div style={{ flex: 1, overflowY: 'auto', padding: 20, fontSize: 13, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {messages.map((m, i) => (
                        <div key={i} style={{
                            alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                            background: m.role === 'user' ? '#8b5cf6' : 'rgba(255,255,255,0.1)',
                            padding: '8px 12px',
                            borderRadius: 12,
                            maxWidth: '85%'
                        }}>
                            {m.content}
                        </div>
                    ))}
                    {status !== 'Idle' && <div style={{ fontSize: 11, fontStyle: 'italic', opacity: 0.5 }}>{status}</div>}
                    <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, opacity: 0.5 }}>ACTION LOG</span>
                        {logs.map((l, i) => (
                            <div key={i} style={{ fontFamily: 'monospace', fontSize: 11, opacity: 0.7, margin: '2px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{`> ${l}`}</div>
                        ))}
                    </div>
                </div>

                {/* Input */}
                <div style={{ padding: 15, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder={controlLevel === 'autonomous' && !goal ? "Set a Goal (e.g. 'Organize windows')..." : "Message..."}
                        style={{
                            width: '100%',
                            background: 'rgba(0,0,0,0.3)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            padding: '10px',
                            borderRadius: 8,
                            color: 'white',
                            outline: 'none'
                        }}
                    />
                </div>
            </div>

            {/* Simulated Agent Cursor */}
            <div style={{
                position: 'fixed',
                left: agentCursor.x,
                top: agentCursor.y,
                width: 20,
                height: 20,
                pointerEvents: 'none',
                zIndex: 10000,
                transition: 'all 0.3s ease-out'
            }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 3L10.07 19.97L12.58 12.58L19.97 10.07L3 3Z" fill="#8b5cf6" stroke="white" strokeWidth="2" />
                </svg>
            </div>
        </>
    );
};
