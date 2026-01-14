import React, { useState, useEffect } from 'react';
import { Lightbulb, ChevronDown, ChevronRight, GripVertical, CheckCircle, AlertTriangle } from 'lucide-react';
import { generateEducationalExplanation } from './AnalysisUtils';
import { PIECE_SETS } from '../PieceSets';

export default function HintWidget({
    game,
    collapsed,
    onToggle,
    height,
    onStartResize,
    dragHandleProps,
    pieceSet = 'neo'
}) {
    const { analyzeBestMoves, fen, turn, isThinking } = game;
    const [hints, setHints] = useState([]);
    const [isEnabled, setIsEnabled] = useState(false);
    const [expandedHint, setExpandedHint] = useState(null);
    const [analyzing, setAnalyzing] = useState(false);

    // ...

    // Re-analyze when position changes if enabled
    useEffect(() => {
        if (isEnabled && !isThinking && !game.gameOver && typeof analyzeBestMoves === 'function') {
            setAnalyzing(true);
            // Small delay to allow UI to render the loading state
            setTimeout(() => {
                if (typeof analyzeBestMoves === 'function') {
                    const bestMoves = analyzeBestMoves(); // Returns top 3
                    setHints(bestMoves);
                }
                setAnalyzing(false);
            }, 100);
        } else if (!isEnabled) {
            setHints([]);
        }
    }, [fen, isEnabled, isThinking, analyzeBestMoves, game.gameOver]);

    const getPieceIcon = (moveSan) => {
        // If it's O-O or O-O-O, it's a King move
        if (moveSan.startsWith('O-O')) return PIECE_SETS[pieceSet].pieces[turn].k;

        const firstChar = moveSan[0];
        const pieceMap = {
            'N': 'n', 'B': 'b', 'R': 'r', 'Q': 'q', 'K': 'k'
        };

        const pieceType = pieceMap[firstChar] || 'p';
        return PIECE_SETS[pieceSet].pieces[turn][pieceType];
    };

    const getCleanMove = (moveSan) => {
        // Remove the piece letter if present
        if (/^[NBRQK]/.test(moveSan)) {
            return moveSan.substring(1);
        }
        return moveSan;
    };

    const handleExpandHint = (index) => {
        setExpandedHint(expandedHint === index ? null : index);
    };

    return (
        <div
            className={`analysis-widget hint-widget ${collapsed ? 'collapsed' : ''}`}
            style={{
                height: collapsed ? 'auto' : (height || 'auto'), // Allow auto height or specified
                minHeight: collapsed ? 'auto' : '150px',
                flexShrink: 0
            }}
        >
            <div
                className="widget-header clickable"
                onClick={onToggle}
                {...dragHandleProps}
                style={{ cursor: 'grab' }}
            >
                <div className="header-title">
                    <GripVertical size={16} className="drag-handle" style={{ marginRight: '0.5rem', opacity: 0.5 }} />
                    <Lightbulb size={16} className="icon-accent" color={isEnabled ? "#fbbf24" : "currentColor"} />
                    <h3>Hint / Logic Engine</h3>
                    <ChevronDown
                        size={16}
                        className={`collapse-icon ${collapsed ? 'collapsed' : ''}`}
                    />
                </div>
                <div className="header-actions" onClick={e => e.stopPropagation()}>
                    <label className="toggle-switch" title="Enable Educational Hints">
                        <input
                            type="checkbox"
                            checked={isEnabled}
                            onChange={(e) => setIsEnabled(e.target.checked)}
                        />
                        <span className="toggle-slider" />
                        <span className="toggle-label">{isEnabled ? 'On' : 'Off'}</span>
                    </label>
                </div>
            </div>

            {!collapsed && (
                <div className="widget-content" style={{ overflowY: 'auto' }}>
                    {!isEnabled ? (
                        <div className="empty-state">
                            <p style={{ opacity: 0.6, fontSize: '0.9rem', textAlign: 'center', padding: '1rem' }}>
                                Toggle ON to see best moves and educational explanations.
                            </p>
                        </div>
                    ) : analyzing ? (
                        <div className="analyzing-state" style={{ padding: '1rem', textAlign: 'center', opacity: 0.7 }}>
                            <p>Analyzing best continuations...</p>
                        </div>
                    ) : hints.length === 0 ? (
                        <div className="empty-state">
                            <p>No hints available.</p>
                        </div>
                    ) : (
                        <div className="hints-list">
                            {hints.map((hint, index) => {
                                const isExpanded = expandedHint === index;
                                const winChange = hint.winProb > 50 ? `+${hint.winProb - 50}%` : `${hint.winProb - 50}%`;
                                const winColor = hint.winProb > 50 ? '#4ade80' : hint.winProb < 40 ? '#f87171' : '#fbbf24';

                                return (
                                    <div key={index} className={`hint-item ${isExpanded ? 'expanded' : ''}`} style={{ marginBottom: '0.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '4px' }}>
                                        <div
                                            className="hint-header"
                                            onClick={() => handleExpandHint(index)}
                                            style={{ display: 'flex', alignItems: 'center', padding: '0.5rem', cursor: 'pointer', justifyContent: 'space-between' }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <span className="move-badge" style={{ fontWeight: 'bold', minWidth: '60px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    {index + 1}.
                                                    <span style={{ fontSize: '1.3em', color: 'var(--color-accent)', lineHeight: 1 }}>{getPieceIcon(hint.move)}</span>
                                                    {getCleanMove(hint.move)}
                                                </span>
                                                <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>
                                                    {isExpanded ? 'Hide Analysis' : 'Show Logic'}
                                                </span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <span style={{ color: winColor, fontSize: '0.85rem', fontWeight: 600 }}>Win: {hint.winProb}%</span>
                                                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                            </div>
                                        </div>

                                        {isExpanded && (
                                            <div className="hint-details" style={{ padding: '0.5rem 0.5rem 0.75rem 0.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', fontSize: '0.9rem', lineHeight: '1.4' }}>
                                                <p style={{ marginBottom: '0.5rem' }}>
                                                    <strong>Why this move?</strong>
                                                </p>
                                                <p style={{ opacity: 0.9 }}>
                                                    {generateEducationalExplanation(fen, hint.move)}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
            {!collapsed && <div className="resizer" onMouseDown={onStartResize} />}
        </div>
    );
}
