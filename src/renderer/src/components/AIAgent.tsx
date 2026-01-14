import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AIService, ChatMessage, loadAIConfig } from '../services/AIService';
import { useUser } from '../context/UserContext';
import { useFileSystem } from './FileSystem';
import { ModernIcon } from './ModernIcon';
import { AgentActions } from '../services/AgentActions';
import { getKnowledgeStore, AIOptimizedKnowledge } from '../services/SecureKnowledgeStore';
import { AgentTrainer } from './AgentTrainer';

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
    const { files, getFileContent, createFile } = useFileSystem();

    // Config & Identity
    const [agentName, setAgentName] = useState('AgentX');

    // UI State
    const [controlLevel, setControlLevel] = useState<ControlLevel>('copilot');
    const [status, setStatus] = useState('Idle');
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [trainingMode, setTrainingMode] = useState(false); // SECRET TRAINING MODE

    // Services
    const agentActions = useRef(new AgentActions());
    const [learnedBehaviors, setLearnedBehaviors] = useState<AIOptimizedKnowledge[]>([]);

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
        // Load config to set name
        const config = loadAIConfig(currentUser?.id || 'default');
        if (config?.agentName) setAgentName(config.agentName);

        // Load learned behaviors from secure storage
        const loadKnowledge = async () => {
            try {
                const store = await getKnowledgeStore(currentUser?.id || 'default');
                const knowledge = await store.load();
                setLearnedBehaviors(knowledge);
                if (knowledge.length > 0) {
                    log(`📚 Loaded ${knowledge.length} learned behaviors`);
                }
            } catch (error) {
                // Silent fail for non-developer users
            }
        };

        if (isOpen) {
            loadKnowledge();
        }
    }, [currentUser?.id, isOpen, log]); // Reload config when opened

    const isProcessingRef = useRef(false);

    // --- Memory Retrieval ---
    const getMemoryContext = useCallback(() => {
        // Try to find /System/AI/memory.json
        // We do a rough search since matching paths in flat array is complex without IDs
        // But we know the structure created in Settings: System -> AI -> memory.json
        // For robustness, we search for 'memory.json' directly or use the file loaded.

        // Detailed lookup:
        const sys = files.find(f => f.name === 'System');
        const ai = sys ? files.find(f => f.name === 'AI' && f.parentId === sys.id) : null;
        const memFile = ai ? files.find(f => f.name === 'memory.json' && f.parentId === ai.id) : null;

        return memFile?.content || '';
    }, [files]);

    // --- Agent Actions ---
    const log = useCallback((msg: string) => setLogs(prev => [msg, ...prev].slice(0, 50)), []);

    const updateCursor = useCallback((x: number, y: number) => {
        setAgentCursor({ x, y });
        agentCursorRef.current = { x, y };
    }, []);

    const executeCommand = useCallback(async (command: string) => {
        log(`Executing: ${command}`);
        const actions = agentActions.current;

        try {
            // MOUSE COMMANDS
            if (command.startsWith('MOUSE_MOVE')) {
                const parts = command.split(':');
                const x = parseFloat(parts[1]);
                const y = parseFloat(parts[2]);
                updateCursor(x, y);
            } else if (command.startsWith('CLICK')) {
                const { x, y } = agentCursorRef.current;
                actions.click(x, y);
                log(`Clicked at [${x}, ${y}]`);
            } else if (command.startsWith('RIGHT_CLICK')) {
                const { x, y } = agentCursorRef.current;
                actions.rightClick(x, y);
                log(`Right-clicked at [${x}, ${y}]`);
            } else if (command.startsWith('DOUBLE_CLICK')) {
                const { x, y } = agentCursorRef.current;
                actions.doubleClick(x, y);
                log(`Double-clicked at [${x}, ${y}]`);
            } else if (command.startsWith('SCROLL')) {
                const parts = command.split(':');
                const direction = parts[1] as 'up' | 'down';
                const amount = parseFloat(parts[2]);
                const { x, y } = agentCursorRef.current;
                actions.scroll(x, y, direction, amount);
                log(`Scrolled ${direction} ${amount}px`);
            } else if (command.startsWith('DRAG')) {
                const parts = command.split(':');
                const startX = parseFloat(parts[1]);
                const startY = parseFloat(parts[2]);
                const endX = parseFloat(parts[3]);
                const endY = parseFloat(parts[4]);
                actions.drag(startX, startY, endX, endY);
                log(`Dragged from [${startX},${startY}] to [${endX},${endY}]`);

                // KEYBOARD COMMANDS
            } else if (command.startsWith('TYPE')) {
                const text = command.substring(5); // Remove 'TYPE:'
                actions.typeText(text);
                log(`Typed: ${text}`);
            } else if (command.startsWith('PRESS_KEY')) {
                const key = command.split(':')[1];
                actions.pressKey(key);
                log(`Pressed key: ${key}`);
            } else if (command.startsWith('KEY_COMBO')) {
                const combo = command.split(':')[1];
                actions.keyCombo(combo);
                log(`Key combo: ${combo}`);
            } else if (command.startsWith('BACKSPACE')) {
                const count = parseInt(command.split(':')[1] || '1');
                actions.backspace(count);
                log(`Backspace x${count}`);

                // ELEMENT INTERACTION
            } else if (command.startsWith('FOCUS_ELEMENT')) {
                const selector = command.substring(14); // Remove 'FOCUS_ELEMENT:'
                const el = actions.focusElement(selector);
                if (el) log(`Focused element: ${selector}`);
                else log(`Element not found: ${selector}`);

                // SYSTEM COMMANDS
            } else if (command.startsWith('WAIT')) {
                const ms = parseInt(command.split(':')[1]);
                await actions.wait(ms);
                log(`Waited ${ms}ms`);

                // WINDOW MANAGEMENT
            } else if (command.startsWith('OPEN_APP')) {
                const appId = command.split(':')[1];
                onOpenApp(appId);
                log(`Opened app: ${appId}`);
            } else if (command.startsWith('CLOSE_WINDOW')) {
                const winId = command.split(':')[1];
                onCloseWindow(winId);
                log(`Closed window: ${winId}`);
            } else if (command.startsWith('MOVE_WINDOW')) {
                const parts = command.split(':');
                const winId = parts[1];
                const { x, y } = agentCursorRef.current;
                onMoveWindow(winId, x, y);
                log(`Moved window ${winId} to [${x},${y}]`);
            } else if (command.startsWith('FINISHED')) {
                setGoal('');
                setControlLevel('copilot');
                log('✅ Goal completed.');
                setStatus('Finished');
            }
        } catch (error: any) {
            log(`❌ Error: ${error.message}`);
        }
    }, [log, onOpenApp, onCloseWindow, onMoveWindow, updateCursor]);

    // --- Autonomous Loop ---
    useEffect(() => {
        let timer: NodeJS.Timeout;

        const loop = async () => {
            if (controlLevel !== 'autonomous' || !isOpen || !goal || isProcessingRef.current) return;

            isProcessingRef.current = true;
            setStatus(`${agentName} is thinking...`);

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

                // Inject Memory Context implicitly via AIService, but here we trigger the request
                // We'll pass an empty system msg first, relying on AIService to prepend the System Prompt
                // Wait, AIService prepends prompt if not present. So we pass statePrompt as SYSTEM.
                // But we need to update the AIService to use the FRESH memory.

                // TRICKY: The AIService.getSystemPrompt reads memory from params. 
                // We need to re-generate the system prompt with fresh memory for THIS turn if we want it live.
                // However, AIService usually caches/uses its internal method.
                // Let's modify AIService usage: We can pass the memoryContext in the system message? 
                // No, AIService handles system prompt. 
                // Currently AIService logic: if (!systemMessage) prepend default.
                // So if we send a System message, it WON'T prepend the default logic (Name/Personality).
                // FIX: We should let the AIService prepend it. We will send the State Prompt as a USER or ASSISTANT message?
                // No, State Prompt is System-level info.

                // BETTER APPROACH: We manually construct the full prompt here including memory?
                // OR we update AIService to force-inject memory.
                // Let's stick to: We send the State Prompt. AIService sees a 'system' message and might skip its default.
                // The fix in AIService was `if (!systemMessage)`.
                // So if we send `role: 'system'`, existing logic skips the personality injection.
                // WE SHOULD CHANGE role to 'developer' or just 'user' for the state prompt, OR update AIService.
                // For now, let's just prepend the Memory/Personality to the State Prompt here to be safe and robust.

                const memContext = getMemoryContext();
                const config = loadAIConfig(currentUser?.id || 'default');
                const persona = config?.systemPrompt || 'You are a helpful AI.';
                const name = config?.agentName || 'AgentX';

                const fullSystemPrompt = `You are ${name}. ${persona}
Memory: ${memContext}
${statePrompt}`;

                const response = await aiService.current.sendMessage([
                    { role: 'system', content: fullSystemPrompt },
                    { role: 'user', content: 'Analyze state and execute next step.' }
                ]);

                // Update logs with thought
                const thought = response.replace(/\[COMMAND:.+?\]/g, '').trim();
                if (thought) log(`d: ${thought}`);

                // Execute Command
                const match = response.match(/\[COMMAND:(.+?)\]/);
                if (match) {
                    await executeCommand(match[1]);
                }

            } catch (e: any) {
                console.error(e);
                log(`Error: ${e.message || e}`);
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
    }, [controlLevel, goal, isOpen, executeCommand, files, agentName]);

    const handleSend = async () => {
        if (!input.trim()) return;

        // ========== SECRET CODE DETECTION ==========
        // Silent, zero-trace activation of training mode
        if (input.trim() === 'carrotnpc123') {
            setInput(''); // Clear immediately
            setTrainingMode(true); // Activate training interface
            log('🔒 Training mode activated');
            return; // Don't process further
        }

        // Autonomous Goal Setting
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
        setStatus(`${agentName} is thinking...`);

        const currentWindows = windowsRef.current;
        const windowList = currentWindows.map(w => `${w.id} (${w.title})`).join(', ');
        const memContext = getMemoryContext();

        // We construct the "System" prompt with context here to ensure Freshness
        const config = loadAIConfig(currentUser?.id || 'default');
        const persona = config?.systemPrompt || 'You are a helpful AI.';
        const name = config?.agentName || 'AgentX';

        const contextMsg = `You are ${name}. ${persona}
Memory: ${memContext}
[COPILOT MODE]
Context: Windows: ${windowList}, Screen: ${window.innerWidth}x${window.innerHeight}.
Output commands if needed: [COMMAND:OPEN_APP:id], [COMMAND:MOVE_WINDOW:id:x:y], etc.
If generating an app, use [APP_START:name]...[APP_END].
`;

        try {
            if (!aiService.current) {
                log('AI Service not initialized');
                return;
            }
            // we pass the system prompt manually, so AIService won't double-add (due to its check)
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

            // Handle App Generation
            const appMatch = response.match(/\[APP_START:(.+?)\]([\s\S]*?)\[APP_END\]/);
            if (appMatch) {
                const appName = appMatch[1].trim();
                const appContent = appMatch[2].trim();
                const uniqueName = `${appName.toLowerCase().replace(/\s+/g, '_')}_${Date.now().toString().slice(-4)}.html`;

                // Save to Desktop
                let parentId = 'root';
                // Try to find Desktop
                const desktop = files.find(f => f.name === 'Desktop' && f.type === 'folder');
                if (desktop) parentId = desktop.id;

                createFile(uniqueName, appContent, 'text/html', parentId);
            }

            setMessages(prev => [...prev, { role: 'assistant', content: response.replace(/\[COMMAND:.+?\]/g, '').replace(/\[APP_START:[\s\S]+?\[APP_END\]/g, `✨ Generated App: ${appMatch?.[1] || 'App'}`) }]);
            setStatus('Idle');
        } catch (e) {
            log('Error connecting to AI');
            setStatus('Error');
        }
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Training Mode Interface */}
            <AgentTrainer
                isOpen={trainingMode}
                onClose={() => setTrainingMode(false)}
                userId={currentUser?.id || 'default'}
                learnedBehaviors={learnedBehaviors}
                onBehaviorsUpdated={async () => {
                    try {
                        const store = await getKnowledgeStore(currentUser?.id || 'default');
                        const knowledge = await store.load();
                        setLearnedBehaviors(knowledge);
                    } catch (error) {
                        // Silent fail
                    }
                }}
            />

            {/* Agent Window */}
            <div style={{
                position: 'fixed',
                top: isFullScreen ? 0 : 80,
                right: isFullScreen ? 0 : 80,
                width: isFullScreen ? '100vw' : 400,
                height: isFullScreen ? '100vh' : 750, // Taller default height
                background: 'rgba(20, 20, 25, 0.95)',
                backdropFilter: 'blur(30px)',
                borderRadius: isFullScreen ? 0 : 16,
                border: isFullScreen ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
                display: 'flex',
                flexDirection: 'column',
                zIndex: 9999, // Highest priority
                color: 'white',
                fontFamily: 'Inter, sans-serif',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}>
                {/* Header */}
                <div style={{
                    padding: '15px 20px',
                    borderBottom: '1px solid rgba(255,255,255,0.08)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'rgba(255,255,255,0.02)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                            width: 32, height: 32,
                            borderRadius: 10,
                            background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 0 15px rgba(139, 92, 246, 0.3)'
                        }}>
                            <ModernIcon iconName="Sparkles" size={18} color="white" />
                        </div>
                        <div>
                            <div style={{ fontWeight: 700, fontSize: 15, letterSpacing: '-0.01em' }}>{agentName}</div>
                            <div style={{ fontSize: 11, opacity: 0.5, display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{ width: 6, height: 6, borderRadius: '50%', background: status === 'Idle' || status === 'Observing...' ? '#10b981' : '#f59e0b', boxShadow: '0 0 5px currentColor' }} />
                                {status}
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: 10 }}>
                        <button
                            onClick={() => setIsFullScreen(!isFullScreen)}
                            style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', opacity: 0.6, padding: 5 }}
                            title="Toggle Fullscreen"
                        >
                            <ModernIcon iconName={isFullScreen ? "Minimize" : "Maximize"} size={16} />
                        </button>
                        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', opacity: 0.6, padding: 5 }}>✕</button>
                    </div>
                </div>

                {/* Control Level & Stats */}
                <div style={{ padding: 20, background: 'rgba(0,0,0,0.2)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 15, fontWeight: 500, color: '#aaa' }}>
                        <span style={{ color: controlLevel === 'copilot' ? '#fff' : 'inherit' }}>Copilot Mode</span>
                        <span style={{ color: controlLevel === 'autonomous' ? '#8b5cf6' : 'inherit' }}>Autonomous Mode</span>
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
                        style={{ width: '100%', accentColor: '#8b5cf6', cursor: 'pointer' }}
                    />
                    <div style={{
                        marginTop: 15,
                        background: 'rgba(255,255,255,0.05)',
                        padding: '10px 15px',
                        borderRadius: 8,
                        fontSize: 12,
                        lineHeight: 1.5,
                        color: 'rgba(255,255,255,0.7)',
                        display: 'flex', alignItems: 'center', gap: 10
                    }}>
                        <ModernIcon iconName="Info" size={14} />
                        {controlLevel === 'copilot'
                            ? <span>Ask me to open apps, move windows, or draft code. I'll wait for your command.</span>
                            : <span>I will continuously observe and act to achieve: <strong style={{ color: '#fff' }}>{goal || '...'}</strong></span>}
                    </div>
                </div>

                {/* Chat Area */}
                <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 15 }}>
                    {messages.length === 0 && (
                        <div style={{ textAlign: 'center', marginTop: 40, opacity: 0.3 }}>
                            <ModernIcon iconName="Sparkles" size={40} />
                            <p style={{ marginTop: 10, fontSize: 14 }}>How can I help you today?</p>
                        </div>
                    )}
                    {messages.map((m, i) => (
                        <div key={i} style={{
                            alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                            maxWidth: '85%',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: m.role === 'user' ? 'flex-end' : 'flex-start'
                        }}>
                            <div style={{
                                background: m.role === 'user' ? 'linear-gradient(135deg, #8b5cf6, #6366f1)' : 'rgba(255,255,255,0.08)',
                                padding: '10px 16px',
                                borderRadius: 16,
                                borderBottomRightRadius: m.role === 'user' ? 4 : 16,
                                borderBottomLeftRadius: m.role !== 'user' ? 4 : 16,
                                fontSize: 14,
                                lineHeight: 1.5,
                                border: m.role !== 'user' ? '1px solid rgba(255,255,255,0.05)' : 'none',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                            }}>
                                {m.content}
                            </div>
                            <span style={{ fontSize: 10, opacity: 0.3, marginTop: 4, padding: '0 4px' }}>
                                {m.role === 'user' ? 'You' : agentName}
                            </span>
                        </div>
                    ))}
                    <div style={{ height: 20 }} />
                </div>

                {/* Action Log (Bottom Panel) */}
                <div style={{ padding: '10px 20px', background: 'rgba(0,0,0,0.3)', borderTop: '1px solid rgba(255,255,255,0.05)', maxHeight: 150, overflowY: 'auto' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, opacity: 0.4, marginBottom: 5, letterSpacing: '0.05em' }}>SYSTEM LOGS</div>
                    {logs.map((l, i) => (
                        <div key={i} style={{ fontFamily: 'monospace', fontSize: 11, opacity: 0.6, margin: '3px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: l.includes('Error') ? '#f87171' : 'inherit' }}>
                            <span style={{ opacity: 0.5, marginRight: 8 }}>{`>`}</span>
                            {l}
                        </div>
                    ))}
                </div>

                {/* Input Area */}
                <div style={{ padding: 20, paddingTop: 15, background: 'rgba(20, 20, 25, 0.95)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ position: 'relative' }}>
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            placeholder={controlLevel === 'autonomous' && !goal ? `Tell ${agentName} what to achieve...` : `Message ${agentName}...`}
                            style={{
                                width: '100%',
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                padding: '14px 20px',
                                borderRadius: 12,
                                color: 'white',
                                outline: 'none',
                                fontSize: 14,
                                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)',
                                transition: 'all 0.2s'
                            }}
                        />
                        <button
                            onClick={handleSend}
                            style={{
                                position: 'absolute',
                                right: 8,
                                top: 8,
                                background: input.trim() ? '#8b5cf6' : 'rgba(255,255,255,0.1)',
                                border: 'none',
                                width: 30, height: 30,
                                borderRadius: 8,
                                color: 'white',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: input.trim() ? 'pointer' : 'default',
                                opacity: input.trim() ? 1 : 0.5,
                                transition: 'all 0.2s'
                            }}
                        >
                            <ModernIcon iconName="ArrowRight" size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Agent Cursor (Visual) */}
            <div style={{
                position: 'fixed',
                left: agentCursor.x,
                top: agentCursor.y,
                width: 20,
                height: 20,
                pointerEvents: 'none',
                zIndex: 10000,
                transition: 'all 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
            }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 3L10.07 19.97L12.58 12.58L19.97 10.07L3 3Z" fill="#8b5cf6" stroke="white" strokeWidth="2" />
                </svg>
                {status !== 'Idle' && (
                    <div style={{
                        position: 'absolute',
                        left: 14, top: 14,
                        background: '#8b5cf6',
                        color: 'white',
                        padding: '2px 6px',
                        borderRadius: 4,
                        fontSize: 10,
                        whiteSpace: 'nowrap',
                        fontWeight: 600,
                        opacity: 0.9
                    }}>
                        {agentName}
                    </div>
                )}
            </div>
        </>
    );
};
