import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    TrendingUp, TrendingDown, Minus, Award, CheckCircle,
    Circle, AlertCircle, XCircle, ChevronDown, ChevronUp,
    Info, Target, Lightbulb, CornerDownRight, Skull,
    Trophy, RotateCcw, Palette
} from 'lucide-react';
import { PIECE_SETS as PIECE_ICONS } from './PieceSets';
import './AnalysisPanel.css';

const QUALITY_ICONS = {
    Excellent: <Award size={14} className="quality-icon excellent" />,
    Good: <CheckCircle size={14} className="quality-icon good" />,
    Neutral: <Circle size={14} className="quality-icon neutral" />,
    Bad: <AlertCircle size={14} className="quality-icon bad" />,
    Terrible: <XCircle size={14} className="quality-icon terrible" />
};

const PIECE_NAMES = {
    p: 'Pawn',
    n: 'Knight',
    b: 'Bishop',
    r: 'Rook',
    q: 'Queen',
    k: 'King'
};

export default function AnalysisPanel({
    game,
    pieceSet = 'neo',
    theme = 'classic',
    setTheme = () => { },
    setPieceSet = () => { }
}) {
    const { moveHistory, winProbability, isThinking, moveStats, resetGame, undoMove, beastMode, setBeastMode } = game;
    const [selectedMove, setSelectedMove] = useState(null);
    const [displayWinProb, setDisplayWinProb] = useState(winProbability);
    const [showProb, setShowProb] = useState(true);
    const [heights, setHeights] = useState({
        prob: 180,
        stats: 200,
        history: 400
    });
    const [showAllMoves, setShowAllMoves] = useState(false);
    const [alwaysExpand, setAlwaysExpand] = useState(false);
    
    // Collapsible sections state
    const [collapsed, setCollapsed] = useState({
        prob: false,
        stats: false,
        history: false
    });

    const isResizing = useRef(null);
    const prevIsThinking = useRef(isThinking);

    // Toggle section collapse
    const toggleSection = (section) => {
        setCollapsed(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    // Sync display probability after thinking finishes
    useEffect(() => {
        if (prevIsThinking.current && !isThinking) {
            setDisplayWinProb(winProbability);
        }
        prevIsThinking.current = isThinking;
    }, [isThinking, winProbability]);

    // Update if winProbability changes while not thinking (e.g. undo)
    useEffect(() => {
        if (!isThinking) {
            setDisplayWinProb(winProbability);
        }
    }, [isThinking, winProbability]);

    // Reset display when game is reset (moveHistory becomes empty)
    useEffect(() => {
        if (moveHistory.length === 0) {
            setDisplayWinProb(50);
        }
    }, [moveHistory.length]);

    const getCapturedPieces = () => {
        const whiteCaptured = [];
        const blackCaptured = [];
        moveHistory.forEach(m => {
            if (m.captured) {
                if (m.player === 'human') {
                    blackCaptured.push(m.captured);
                } else {
                    whiteCaptured.push(m.captured);
                }
            }
        });
        return { white: whiteCaptured, black: blackCaptured };
    };

    // Draggable Resizer Logic
    const startResizing = (section) => {
        isResizing.current = section;
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', stopResizing);
        document.body.style.cursor = 'ns-resize';
    };

    const handleMouseMove = useCallback((e) => {
        if (!isResizing.current) return;
        const delta = e.movementY;
        setHeights(prev => ({
            ...prev,
            [isResizing.current]: Math.max(80, prev[isResizing.current] + delta)
        }));
    }, []);

    const stopResizing = () => {
        isResizing.current = null;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', stopResizing);
        document.body.style.cursor = 'default';
    };

    const describeMove = (san, piece, from, to, captured) => {
        if (!san) return null;
        
        // Enhanced move description with more context
        const pieceMap = { 
            'N': 'Knight', 'B': 'Bishop', 'R': 'Rook', 
            'Q': 'Queen', 'K': 'King', 'O-O': 'King', 'O-O-O': 'King' 
        };
        
        const isCapture = san.includes('x');
        const pieceChar = san[0];
        const pieceName = pieceMap[pieceChar] || 'Pawn';
        const targetSquare = san.match(/[a-h][1-8]/);
        
        if (san === 'O-O') return "castle kingside to secure your King and activate the Rook";
        if (san === 'O-O-O') return "castle queenside to secure your King and centralize the Rook";
        
        if (isCapture && captured) {
            const capturedPiece = PIECE_NAMES[captured] || 'piece';
            return `capture the ${capturedPiece} with your ${pieceName}${targetSquare ? ` on ${targetSquare[0]}` : ''}`;
        }
        
        if (targetSquare) {
            return `move your ${pieceName} to ${targetSquare[0]}`;
        }
        
        return `develop your ${pieceName} to a better square`;
    };

    const getExplanation = (entry) => {
        const evalChange = entry.evalChange || 0;
        const gamePhase = entry.gamePhase || 'middlegame';
        const phaseText = gamePhase === 'opening' ? 'opening' : gamePhase === 'endgame' ? 'endgame' : 'middlegame';
        
        if (entry.quality === 'Excellent') {
            if (entry.captured) {
                const capturedPiece = PIECE_NAMES[entry.captured];
                return `🏆 Brilliant tactical strike! Capturing the ${capturedPiece} in the ${phaseText} creates a decisive advantage and demonstrates excellent calculation.`;
            }
            if (evalChange > 200) {
                return `🏆 Outstanding move! This creates a winning position and shows superior tactical vision. Your opponent will struggle to find adequate defense.`;
            }
            return `🏆 Excellent choice! This critical move significantly improves your position and creates multiple threats that are difficult to handle.`;
        }
        
        if (entry.quality === 'Good') {
            if (entry.captured) {
                const capturedPiece = PIECE_NAMES[entry.captured];
                return `✅ Strong tactical play! Taking the ${capturedPiece} improves your position while maintaining good piece coordination.`;
            }
            if (evalChange > 75) {
                return `✅ Very good move! This significantly improves your position and creates new tactical possibilities for the ${phaseText}.`;
            }
            return `✅ Solid positional choice! This move strengthens your position and maintains good control over key squares.`;
        }
        
        if (entry.quality === 'Neutral') {
            if (Math.abs(evalChange) < 15) {
                return `⚪ Reasonable move that keeps the position balanced. While not creating immediate threats, it maintains equality in the ${phaseText}.`;
            }
            return `⚪ Standard ${phaseText} play. This move doesn't change the evaluation significantly but keeps your position solid.`;
        }
        
        if (entry.quality === 'Bad') {
            let feedback = `⚠️ This move misses a better opportunity in the ${phaseText}. `;
            
            if (entry.captured && evalChange < -30) {
                const capturedPiece = PIECE_NAMES[entry.captured];
                feedback += `While you captured the ${capturedPiece}, this exchange actually favors your opponent. `;
            } else if (evalChange < -75) {
                feedback += `This significantly worsens your position when better moves were available. `;
            }
            
            if (entry.bestMissed) {
                const bestDesc = describeMove(entry.bestMissed, entry.piece, entry.from, entry.to, entry.captured);
                if (bestDesc) {
                    feedback += `You should have looked to ${bestDesc}, which would have maintained a much better position.`;
                }
            } else {
                feedback += `Look for moves that improve piece activity and control important squares.`;
            }
            
            return feedback;
        }
        
        if (entry.quality === 'Terrible') {
            let feedback = `❌ This move creates serious problems in the ${phaseText}. `;
            
            if (entry.captured) {
                const capturedPiece = PIECE_NAMES[entry.captured];
                feedback += `Losing the ${capturedPiece} here gives your opponent a decisive advantage. `;
            } else if (evalChange < -150) {
                feedback += `This move hands your opponent a winning position and may have decided the game. `;
            } else {
                feedback += `This significantly damages your position and gives your opponent excellent winning chances. `;
            }
            
            if (entry.bestMissed) {
                const bestDesc = describeMove(entry.bestMissed, entry.piece, entry.from, entry.to, entry.captured);
                if (bestDesc) {
                    feedback += `You needed to ${bestDesc} to keep the game competitive.`;
                }
            } else {
                feedback += `Focus on protecting key pieces and maintaining defensive coordination.`;
            }
            
            return feedback;
        }
        
        return "Move analysis in progress...";
    };

    const getRecommendation = (entry) => {
        if (entry.quality === 'Excellent') {
            return "Keep looking for these critical tactical opportunities that can decide the game in your favor!";
        }
        
        if (entry.bestMissed) {
            const desc = describeMove(entry.bestMissed, entry.piece, entry.from, entry.to, entry.captured);
            if (desc) {
                return `${entry.bestMissed} - You should have ${desc} to gain tactical superiority and improve your winning chances.`;
            }
        }
        
        if (entry.alternatives && entry.alternatives.length > 0) {
            const altMove = entry.alternatives[0];
            const altDesc = describeMove(altMove, entry.piece, entry.from, entry.to);
            if (altDesc) {
                return `Consider ${altMove} - ${altDesc} to maintain better positional control.`;
            }
            return `Consider ${altMove} to maintain a stronger evaluation.`;
        }
        
        // Quality-specific general advice
        if (entry.quality === 'Bad' || entry.quality === 'Terrible') {
            if (entry.captured) {
                return "Before making exchanges, calculate if the trade improves your position and piece activity.";
            }
            return "Look for moves that improve piece coordination, control key squares, and create tactical threats.";
        }
        
        return "Focus on developing pieces actively, controlling the center, and ensuring King safety.";
    };

    const totalStats = Object.values(moveStats).reduce((a, b) => a + b, 0);

    const PiecesList = ({ white, black, size = '1rem' }) => {
        if (white.length === 0 && black.length === 0) {
            return (
                <div className="empty-killed-minimal">
                    <p>No casualties yet</p>
                </div>
            );
        }
        return (
            <div className="pieces-list-container">
                <div className="pieces-group-inline">
                    {white.map((p, i) => (
                        <span key={i} className="killed-piece white" style={{ fontSize: size }}>{PIECE_ICONS[pieceSet].pieces.w[p]}</span>
                    ))}
                </div>
                <div className="pieces-group-inline">
                    {black.map((p, i) => (
                        <span key={i} className="killed-piece black" style={{ fontSize: size }}>{PIECE_ICONS[pieceSet].pieces.b[p]}</span>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="analysis-panel glass-panel">
            {/* Training Header - Fixed height */}
            <div className="analysis-widget training-header-widget">
                <div className="logo-section">
                    <Trophy size={20} className="logo-icon" />
                    <h1>Chess Trainer</h1>
                </div>
                <div className="controls-section">
                    <button className="btn-secondary icon-btn-mini" onClick={undoMove} title="Undo Move">
                        <RotateCcw size={14} />
                    </button>
                    <button className="btn-primary btn-mini" onClick={resetGame}>
                        New Game
                    </button>
                </div>
            </div>

            {/* Win Probability / Killed Pieces Widget */}
            <div
                className={`analysis-widget prob-widget ${heights.prob < 140 ? 'condensed' : ''} ${collapsed.prob ? 'collapsed' : ''}`}
                style={{
                    height: collapsed.prob ? 'auto' : (!showProb ? Math.max(heights.prob, 250) : heights.prob),
                    flexShrink: 0
                }}
            >
                <div className="widget-header clickable" onClick={() => toggleSection('prob')}>
                    <div className="header-title">
                        <h3>{showProb ? 'Position Analysis' : 'Casualties'}</h3>
                        {showProb ? <TrendingUp size={16} opacity={0.5} /> : <Skull size={16} opacity={0.5} />}
                        <ChevronDown 
                            size={16} 
                            className={`collapse-icon ${collapsed.prob ? 'collapsed' : ''}`}
                        />
                    </div>
                    <div className="header-actions" onClick={(e) => e.stopPropagation()}>
                        <label className="toggle-switch" title={beastMode ? "Beast Mode: AI plays to win ASAP" : "Enable Beast Mode"}>
                            <input
                                type="checkbox"
                                checked={beastMode}
                                onChange={(e) => setBeastMode(e.target.checked)}
                            />
                            <span className="toggle-slider beast" />
                            <span className="toggle-label">Beast</span>
                        </label>
                        <label className="toggle-switch" title={showProb ? "Focus on Casualties" : "Show Win Probability"}>
                            <input
                                type="checkbox"
                                checked={!showProb}
                                onChange={(e) => setShowProb(!e.target.checked)}
                            />
                            <span className="toggle-slider" />
                            <span className="toggle-label">{showProb ? "Killed" : "Prob"}</span>
                        </label>
                    </div>
                </div>
                {!collapsed.prob && (
                    <div className="widget-content">
                        <AnimatePresence mode="wait">
                        {showProb ? (
                            <motion.div
                                key="combined-view"
                                className="view-container combined"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.3 }}
                            >
                                <div className="prob-section">
                                    <AnimatePresence mode="wait">
                                        {displayWinProb >= 45 && displayWinProb <= 55 ? (
                                            <motion.div
                                                key="neutral"
                                                className="prob-display-wrapper"
                                                initial={{ opacity: 0, y: 5 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -5 }}
                                            >
                                                <div className="prob-large neutral-status">
                                                    <span>Position Even</span>
                                                </div>
                                                <div className="prob-meter">
                                                    <div className="meter-fill" style={{ width: `${displayWinProb}%`, background: 'rgba(255,255,255,0.1)' }} />
                                                </div>
                                            </motion.div>
                                        ) : (
                                            <motion.div
                                                key="percentage"
                                                className="prob-display-wrapper"
                                                initial={{ opacity: 0, y: 5 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -5 }}
                                            >
                                                <div className="prob-large">
                                                    <span style={{ color: displayWinProb > 50 ? '#4ade80' : '#f87171' }}>
                                                        {displayWinProb.toFixed(1)}%
                                                    </span>
                                                </div>
                                                <div className="prob-meter">
                                                    <div className="meter-fill" style={{ width: `${displayWinProb}%`, background: displayWinProb > 50 ? 'var(--color-accent)' : '#f87171' }} />
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                                <div className="captured-mini-section">
                                    <PiecesList {...getCapturedPieces()} size="1.2rem" />
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="killed-focused-view"
                                className="view-container killed-focused"
                                initial={{ opacity: 0, scale: 1.05 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 1.05 }}
                                transition={{ duration: 0.3 }}
                            >
                                {(() => {
                                    const { white, black } = getCapturedPieces();
                                    if (white.length === 0 && black.length === 0) {
                                        return (
                                            <div className="empty-killed-large">
                                                <Award size={40} opacity={0.1} />
                                                <p>The battle has just begun. No casualties reported.</p>
                                            </div>
                                        );
                                    }
                                    return (
                                        <div className="killed-grid-fill">
                                            <div className="killed-block">
                                                <span className="block-label">White Lost</span>
                                                <div className="block-pieces">
                                                    {white.map((p, i) => (
                                                        <span key={i} className="killed-piece white large">{PIECE_ICONS[pieceSet].pieces.w[p]}</span>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="killed-block">
                                                <span className="block-label">Black Lost</span>
                                                <div className="block-pieces">
                                                    {black.map((p, i) => (
                                                        <span key={i} className="killed-piece black large">{PIECE_ICONS[pieceSet].pieces.b[p]}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </motion.div>
                        )}
                    </AnimatePresence>
                    </div>
                )}
                {!collapsed.prob && <div className="resizer" onMouseDown={() => startResizing('prob')} />}
            </div>

            {/* Stats Widget */}
            <div className={`analysis-widget stats-widget ${heights.stats < 150 ? 'condensed' : ''} ${collapsed.stats ? 'collapsed' : ''}`} style={{ height: collapsed.stats ? 'auto' : heights.stats, flexShrink: 0 }}>
                <div className="widget-header clickable" onClick={() => toggleSection('stats')}>
                    <div className="header-title">
                        <h3>Move Analysis Stats</h3>
                        <Award size={16} opacity={0.5} />
                        <ChevronDown 
                            size={16} 
                            className={`collapse-icon ${collapsed.stats ? 'collapsed' : ''}`}
                        />
                    </div>
                </div>
                {!collapsed.stats && (
                    <div className="widget-content">
                        <div className="quality-bar-mini">
                            {['Excellent', 'Good', 'Neutral', 'Bad', 'Terrible'].map(q => {
                                const pct = totalStats > 0 ? (moveStats[q] / totalStats) * 100 : 0;
                                return <div key={q} className={`q-seg ${q.toLowerCase()}`} style={{ width: `${pct}%` }} />;
                            })}
                        </div>
                        <div className="stats-legend-grid">
                            {['Excellent', 'Good', 'Neutral', 'Bad', 'Terrible'].map(q => (
                                <div key={q} className="stat-pill">
                                    <span className={`dot ${q.toLowerCase()}`} />
                                    <span className="label">{q}</span>
                                    <span className="val">{moveStats[q]}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                {!collapsed.stats && <div className="resizer" onMouseDown={() => startResizing('stats')} />}
            </div>

            {/* Move History Widget */}
            <div className={`analysis-widget history-widget ${collapsed.history ? 'collapsed' : ''}`} style={{ flex: collapsed.history ? 'none' : 1, minHeight: collapsed.history ? 'auto' : 150 }}>
                <div className="widget-header clickable" onClick={() => toggleSection('history')}>
                    <div className="header-title">
                        <h3>Move History & Logic</h3>
                        <ChevronDown 
                            size={16} 
                            className={`collapse-icon ${collapsed.history ? 'collapsed' : ''}`}
                        />
                    </div>
                    <div className="header-actions" onClick={(e) => e.stopPropagation()}>
                        <label className="toggle-switch" title="Show Computer Moves">
                            <input
                                type="checkbox"
                                checked={showAllMoves}
                                onChange={(e) => setShowAllMoves(e.target.checked)}
                            />
                            <span className="toggle-slider" />
                            <span className="toggle-label">All</span>
                        </label>
                        <label className="toggle-switch" title="Always Expand Analysis">
                            <input
                                type="checkbox"
                                checked={alwaysExpand}
                                onChange={(e) => setAlwaysExpand(e.target.checked)}
                            />
                            <span className="toggle-slider" />
                            <span className="toggle-label">Expand</span>
                        </label>
                    </div>
                </div>
                {!collapsed.history && (
                    <div className="widget-content history-scroll">
                        {moveHistory.length === 0 ? (
                            <div className="empty-history">
                            <Lightbulb size={32} opacity={0.2} />
                            <p>Play a move to start analysis</p>
                        </div>
                    ) : (
                        [...moveHistory]
                            .reverse()
                            .filter(m => showAllMoves || m.player === 'human')
                            .map((entry, idx) => {
                                const originalIndex = moveHistory.indexOf(entry);
                                const moveNum = Math.floor(originalIndex / 2) + 1;
                                const isExpanded = alwaysExpand || selectedMove === originalIndex;

                                return (
                                    <motion.div
                                        key={originalIndex}
                                        className={`interactive-move-card ${isExpanded ? 'expanded' : ''}`}
                                        onClick={() => !alwaysExpand && setSelectedMove(selectedMove === originalIndex ? null : originalIndex)}
                                        layout
                                    >
                                        <div className="card-top">
                                            <span className="m-num">{entry.player === 'human' ? '⚪' : '⚫'} {moveNum}</span>
                                            <span className="m-val">{entry.move}</span>
                                            {entry.quality && (
                                                <div className={`q-badge ${entry.quality.toLowerCase()}`}>
                                                    {entry.quality}
                                                </div>
                                            )}
                                            <div className="expand-icon">
                                                {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                            </div>
                                        </div>

                                        <AnimatePresence initial={false}>
                                            {isExpanded && (
                                                <motion.div
                                                    className="card-details"
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                >
                                                    <div className="detail-row explanation">
                                                        <Info size={14} className="detail-icon" />
                                                        <p>{getExplanation(entry)}</p>
                                                    </div>
                                                    {entry.quality !== 'Excellent' && (
                                                        <div className="detail-row suggestion">
                                                            <Target size={14} className="detail-icon" />
                                                            <div>
                                                                <p className="s-label">Better Choice:</p>
                                                                <p className="s-val">{getRecommendation(entry)}</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </motion.div>
                                );
                            })
                        )}
                    </div>
                )}
                {!collapsed.history && <div className="resizer" onMouseDown={() => startResizing('history')} />}
            </div>

            {/* Computer Status */}
            {isThinking && (
                <div className="thinking-overlay">
                    <div className="thinking-ripple">
                        <div /> <div />
                    </div>
                    <span>Calculating Tactics...</span>
                </div>
            )}
        </div>
    );
}
