import React, { useState, useEffect, useRef } from 'react';
import { ObservationRecorder } from '../services/ObservationRecorder';
import { PatternLearningEngine, ObservationSession, ExtractedPattern } from '../services/PatternLearning';
import { getKnowledgeStore, AIOptimizedKnowledge } from '../services/SecureKnowledgeStore';
import { ModernIcon } from './ModernIcon';

interface AgentTrainerProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
    learnedBehaviors: AIOptimizedKnowledge[];
    onBehaviorsUpdated: () => void;
}

type TrainingPhase = 'idle' | 'naming' | 'recording' | 'reviewing' | 'analyzing';

export const AgentTrainer: React.FC<AgentTrainerProps> = ({
    isOpen,
    onClose,
    userId,
    learnedBehaviors,
    onBehaviorsUpdated
}) => {
    const [phase, setPhase] = useState<TrainingPhase>('idle');
    const [taskName, setTaskName] = useState('');
    const [currentAttempt, setCurrentAttempt] = useState(1);
    const [targetAttempts] = useState(3);

    const [observations, setObservations] = useState<ObservationSession[]>([]);
    const [extractedPattern, setExtractedPattern] = useState<ExtractedPattern | null>(null);
    const [actionCount, setActionCount] = useState(0);
    const [elapsedTime, setElapsedTime] = useState(0);

    const recorder = useRef(new ObservationRecorder());
    const patternEngine = useRef(new PatternLearningEngine());
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (recorder.current.isCurrentlyRecording()) {
                recorder.current.stopRecording();
            }
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, []);

    // Timer for recording UI
    useEffect(() => {
        if (phase === 'recording') {
            timerRef.current = setInterval(() => {
                setActionCount(recorder.current.getActionCount());
                setElapsedTime(recorder.current.getElapsedTime());
            }, 100);
        } else {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        }
        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [phase]);

    const startNaming = () => {
        setPhase('naming');
        setTaskName('');
        setObservations([]);
        setCurrentAttempt(1);
    };

    const startRecording = () => {
        if (!taskName.trim()) {
            alert('Please enter a task name');
            return;
        }

        setPhase('recording');
        setActionCount(0);
        setElapsedTime(0);
        recorder.current.startRecording(taskName, currentAttempt);
    };

    const stopRecording = () => {
        const session = recorder.current.stopRecording();
        if (session) {
            const newObservations = [...observations, session];
            setObservations(newObservations);

            if (currentAttempt < targetAttempts) {
                // Need more attempts
                setCurrentAttempt(currentAttempt + 1);
                setPhase('reviewing');
            } else {
                // Enough attempts - analyze
                analyzePatterns(newObservations);
            }
        }
    };

    const recordAnother = () => {
        setPhase('recording');
        recorder.current.startRecording(taskName, currentAttempt);
    };

    const analyzePatterns = (obs: ObservationSession[]) => {
        setPhase('analyzing');

        // Analyze in background
        setTimeout(() => {
            try {
                const pattern = patternEngine.current.analyzeRepetitions(obs);
                setExtractedPattern(pattern);
                setPhase('reviewing');
            } catch (error) {
                console.error('[AgentTrainer] Pattern analysis failed:', error);
                alert('Failed to analyze patterns. Try recording again.');
                setPhase('idle');
            }
        }, 500);
    };

    const saveBehavior = async () => {
        if (!extractedPattern) return;

        try {
            const knowledge = patternEngine.current.toAIOptimizedKnowledge(extractedPattern);
            const store = await getKnowledgeStore(userId);
            await store.addBehavior(knowledge);

            alert(`✅ Behavior "${knowledge.name}" saved successfully!`);
            onBehaviorsUpdated();
            resetTraining();
        } catch (error) {
            console.error('[AgentTrainer] Save failed:', error);
            alert('Failed to save behavior');
        }
    };

    const resetTraining = () => {
        setPhase('idle');
        setTaskName('');
        setObservations([]);
        setExtractedPattern(null);
        setCurrentAttempt(1);
    };

    if (!isOpen) return null;

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                zIndex: 100000,
                background: 'rgba(0,0,0,0.98)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'Inter, sans-serif',
                color: 'white'
            }}
            onClick={(e) => {
                if (e.target === e.currentTarget && phase === 'idle') {
                    onClose();
                }
            }}
            data-training-interface="true"
        >
            <div
                style={{
                    maxWidth: phase === 'reviewing' ? 900 : 700,
                    width: '90%',
                    maxHeight: '90vh',
                    background: 'rgba(30,30,35,0.95)',
                    backdropFilter: 'blur(20px)',
                    borderRadius: 16,
                    padding: 40,
                    border: '1px solid rgba(139,92,246,0.3)',
                    boxShadow: '0 25px 50px rgba(139,92,246,0.2)',
                    overflowY: 'auto'
                }}
                onClick={(e) => e.stopPropagation()}
                data-training-interface="true"
            >
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 30 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                        <div
                            style={{
                                width: 48,
                                height: 48,
                                borderRadius: 12,
                                background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 24
                            }}
                        >
                            🎓
                        </div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: 24 }}>Agent X Training System</h2>
                            <p style={{ margin: '5px 0 0 0', opacity: 0.6, fontSize: 14 }}>DEVELOPER ONLY</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'rgba(255,255,255,0.1)',
                            border: 'none',
                            color: 'white',
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            cursor: 'pointer',
                            fontSize: 18
                        }}
                    >
                        ✕
                    </button>
                </div>

                {/* Idle Phase - Behavior List */}
                {phase === 'idle' && (
                    <>
                        <div style={{ marginBottom: 30 }}>
                            <h3 style={{ fontSize: 16, marginBottom: 15 }}>📚 Learned Behaviors: {learnedBehaviors.length}</h3>
                            {learnedBehaviors.length === 0 ? (
                                <p style={{ opacity: 0.5, fontSize: 14 }}>No behaviors trained yet. Start recording to teach Agent X.</p>
                            ) : (
                                <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                                    {learnedBehaviors.map((kb) => (
                                        <div
                                            key={kb.id}
                                            style={{
                                                padding: '12px 15px',
                                                background: 'rgba(255,255,255,0.05)',
                                                borderRadius: 8,
                                                marginBottom: 10,
                                                border: '1px solid rgba(255,255,255,0.1)'
                                            }}
                                        >
                                            <div style={{ fontWeight: 600, marginBottom: 5 }}>{kb.name}</div>
                                            <div style={{ fontSize: 12, opacity: 0.6 }}>{kb.description}</div>
                                            <div style={{ fontSize: 11, opacity: 0.4, marginTop: 5 }}>
                                                Confidence: {(kb.confidence * 100).toFixed(0)}% | Executions: {kb.statistics.timesExecuted}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <button
                            onClick={startNaming}
                            style={{
                                width: '100%',
                                padding: '15px 24px',
                                background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                                border: 'none',
                                borderRadius: 12,
                                color: 'white',
                                fontWeight: 600,
                                fontSize: 16,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 10
                            }}
                        >
                            <ModernIcon iconName="Plus" size={20} />
                            Record New Behavior
                        </button>
                    </>
                )}

                {/* Naming Phase */}
                {phase === 'naming' && (
                    <>
                        <div style={{ marginBottom: 30 }}>
                            <label style={{ display: 'block', marginBottom: 10, fontSize: 14, fontWeight: 600 }}>
                                What task do you want to teach Agent X?
                            </label>
                            <input
                                type="text"
                                value={taskName}
                                onChange={(e) => setTaskName(e.target.value)}
                                placeholder="e.g., Open Settings and Change Wallpaper"
                                autoFocus
                                style={{
                                    width: '100%',
                                    padding: '12px 16px',
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.2)',
                                    borderRadius: 8,
                                    color: 'white',
                                    fontSize: 14,
                                    outline: 'none'
                                }}
                                onKeyDown={(e) => e.key === 'Enter' && startRecording()}
                            />
                        </div>

                        <div
                            style={{
                                padding: 20,
                                background: 'rgba(139,92,246,0.1)',
                                borderRadius: 8,
                                marginBottom: 20,
                                fontSize: 14,
                                lineHeight: 1.6
                            }}
                        >
                            <strong>📝 Instructions:</strong>
                            <ol style={{ margin: '10px 0 0 20px', padding: 0 }}>
                                <li>Click "Start Recording" below</li>
                                <li>Perform the task naturally {targetAttempts} times</li>
                                <li>Agent X will learn the pattern automatically</li>
                            </ol>
                        </div>

                        <div style={{ display: 'flex', gap: 10 }}>
                            <button
                                onClick={() => setPhase('idle')}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    background: 'rgba(255,255,255,0.1)',
                                    border: 'none',
                                    borderRadius: 8,
                                    color: 'white',
                                    cursor: 'pointer'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={startRecording}
                                disabled={!taskName.trim()}
                                style={{
                                    flex: 2,
                                    padding: '12px',
                                    background: taskName.trim() ? '#8b5cf6' : 'rgba(255,255,255,0.1)',
                                    border: 'none',
                                    borderRadius: 8,
                                    color: 'white',
                                    fontWeight: 600,
                                    cursor: taskName.trim() ? 'pointer' : 'not-allowed',
                                    opacity: taskName.trim() ? 1 : 0.5
                                }}
                            >
                                Start Recording →
                            </button>
                        </div>
                    </>
                )}

                {/* Recording Phase */}
                {phase === 'recording' && (
                    <>
                        <div
                            style={{
                                textAlign: 'center',
                                padding: 40,
                                background: 'rgba(239,68,68,0.1)',
                                borderRadius: 12,
                                border: '2px dashed rgba(239,68,68,0.5)',
                                marginBottom: 30
                            }}
                        >
                            <div
                                style={{
                                    width: 80,
                                    height: 80,
                                    borderRadius: '50%',
                                    background: 'rgba(239,68,68,0.2)',
                                    margin: '0 auto 20px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    animation: 'pulse 2s infinite'
                                }}
                            >
                                <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#ef4444' }} />
                            </div>
                            <h3 style={{ margin: 0, fontSize: 20, marginBottom: 10 }}>🎬 Recording...</h3>
                            <p style={{ margin: 0, opacity: 0.7, fontSize: 14 }}>
                                Attempt {currentAttempt} of {targetAttempts}
                            </p>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 30 }}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: 32, fontWeight: 700, color: '#8b5cf6' }}>{actionCount}</div>
                                <div style={{ fontSize: 12, opacity: 0.6 }}>Actions Captured</div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: 32, fontWeight: 700, color: '#10b981' }}>
                                    {(elapsedTime / 1000).toFixed(1)}s
                                </div>
                                <div style={{ fontSize: 12, opacity: 0.6 }}>Elapsed Time</div>
                            </div>
                        </div>

                        <button
                            onClick={stopRecording}
                            style={{
                                width: '100%',
                                padding: '15px',
                                background: '#ef4444',
                                border: 'none',
                                borderRadius: 12,
                                color: 'white',
                                fontWeight: 600,
                                fontSize: 16,
                                cursor: 'pointer'
                            }}
                        >
                            ⏹ Stop Recording
                        </button>
                    </>
                )}

                {/* Reviewing Phase */}
                {phase === 'reviewing' && !extractedPattern && (
                    <>
                        <div style={{ marginBottom: 30 }}>
                            <h3 style={{ fontSize: 18, marginBottom: 15 }}>📊 Recording Progress</h3>
                            <div style={{ fontSize: 14, opacity: 0.8, marginBottom: 20 }}>
                                Completed {observations.length} of {targetAttempts} attempts
                            </div>

                            {observations.map((obs, idx) => (
                                <div
                                    key={obs.sessionId}
                                    style={{
                                        padding: 15,
                                        background: 'rgba(16,185,129,0.1)',
                                        border: '1px solid rgba(16,185,129,0.3)',
                                        borderRadius: 8,
                                        marginBottom: 10
                                    }}
                                >
                                    <div style={{ fontWeight: 600, marginBottom: 5 }}>
                                        ✅ Attempt {obs.attemptNumber}: {obs.actions.length} actions
                                    </div>
                                    <div style={{ fontSize: 12, opacity: 0.6 }}>
                                        Duration: {((obs.endTime - obs.startTime) / 1000).toFixed(1)}s
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div style={{ display: 'flex', gap: 10 }}>
                            <button
                                onClick={() => analyzePatterns(observations)}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    background: '#8b5cf6',
                                    border: 'none',
                                    borderRadius: 8,
                                    color: 'white',
                                    fontWeight: 600,
                                    cursor: 'pointer'
                                }}
                            >
                                Finish & Analyze
                            </button>
                            <button
                                onClick={recordAnother}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    background: 'rgba(255,255,255,0.1)',
                                    border: 'none',
                                    borderRadius: 8,
                                    color: 'white',
                                    cursor: 'pointer'
                                }}
                            >
                                Record Again
                            </button>
                        </div>
                    </>
                )}

                {/* Analyzing Phase */}
                {phase === 'analyzing' && (
                    <div style={{ textAlign: 'center', padding: 60 }}>
                        <div style={{ fontSize: 48, marginBottom: 20 }}>🧠</div>
                        <h3 style={{ fontSize: 20, marginBottom: 10 }}>Analyzing Patterns...</h3>
                        <p style={{ opacity: 0.6, fontSize: 14 }}>Extracting invariants and variants from {observations.length} observations</p>
                    </div>
                )}

                {/* Reviewing Pattern */}
                {phase === 'reviewing' && extractedPattern && (
                    <>
                        <div style={{ marginBottom: 30 }}>
                            <h3 style={{ fontSize: 18, marginBottom: 15 }}>✨ Pattern Extracted!</h3>

                            <div style={{ marginBottom: 20 }}>
                                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, opacity: 0.7 }}>INVARIANTS (Always the same):</div>
                                {extractedPattern.invariants.map((inv, idx) => (
                                    <div
                                        key={idx}
                                        style={{
                                            padding: 12,
                                            background: 'rgba(16,185,129,0.1)',
                                            border: '1px solid rgba(16,185,129,0.3)',
                                            borderRadius: 8,
                                            marginBottom: 8,
                                            fontSize: 13
                                        }}
                                    >
                                        <strong>Step {inv.step + 1}:</strong> {inv.description}
                                    </div>
                                ))}
                            </div>

                            {extractedPattern.variants.length > 0 && (
                                <div style={{ marginBottom: 20 }}>
                                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, opacity: 0.7 }}>VARIANTS (Adaptive):</div>
                                    {extractedPattern.variants.map((variant, idx) => (
                                        <div
                                            key={idx}
                                            style={{
                                                padding: 12,
                                                background: 'rgba(59,130,246,0.1)',
                                                border: '1px solid rgba(59,130,246,0.3)',
                                                borderRadius: 8,
                                                marginBottom: 8,
                                                fontSize: 13
                                            }}
                                        >
                                            {variant.description}
                                            {variant.average && ` (avg: ${variant.average.toFixed(0)})`}
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div
                                style={{
                                    padding: 15,
                                    background: 'rgba(139,92,246,0.1)',
                                    borderRadius: 8,
                                    fontSize: 13
                                }}
                            >
                                <div style={{ fontWeight: 600, marginBottom: 8 }}>Generated Commands:</div>
                                {extractedPattern.commandSequence.map((cmd, idx) => (
                                    <div key={idx} style={{ fontFamily: 'monospace', opacity: 0.8, marginBottom: 4 }}>
                                        {idx + 1}. {cmd}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: 10 }}>
                            <button
                                onClick={resetTraining}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    background: 'rgba(255,255,255,0.1)',
                                    border: 'none',
                                    borderRadius: 8,
                                    color: 'white',
                                    cursor: 'pointer'
                                }}
                            >
                                Discard
                            </button>
                            <button
                                onClick={saveBehavior}
                                style={{
                                    flex: 2,
                                    padding: '12px',
                                    background: '#10b981',
                                    border: 'none',
                                    borderRadius: 8,
                                    color: 'white',
                                    fontWeight: 600,
                                    cursor: 'pointer'
                                }}
                            >
                                💾 Save Behavior
                            </button>
                        </div>
                    </>
                )}

                <p style={{ marginTop: 30, fontSize: 11, opacity: 0.4, textAlign: 'center' }}>
                    Training data is encrypted and invisible to regular users
                </p>
            </div>

            {/* Pulse animation */}
            <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.8; }
        }
      `}</style>
        </div>
    );
};
