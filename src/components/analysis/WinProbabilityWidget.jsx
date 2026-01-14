import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Skull, ChevronDown, Award, GripVertical } from 'lucide-react';
import CapturedPieces from './CapturedPieces';
import { getCapturedPieces } from './AnalysisUtils';

export default function WinProbabilityWidget({
    winProbability,
    isThinking,
    moveHistory,
    beastMode,
    setBeastMode,
    collapsed,
    onToggle,
    height,
    onStartResize,
    pieceSet, dragHandleProps
}) {
    const [displayWinProb, setDisplayWinProb] = useState(winProbability);
    const [showProb, setShowProb] = useState(true);
    const prevIsThinking = useRef(isThinking);

    // Sync display probability after thinking finishes or when not thinking
    useEffect(() => {
        if ((prevIsThinking.current && !isThinking) || !isThinking) {
            setDisplayWinProb(winProbability);
        }
        prevIsThinking.current = isThinking;
    }, [isThinking, winProbability]);

    // Reset display when game is reset
    useEffect(() => {
        if (moveHistory.length === 0) {
            setDisplayWinProb(50);
        }
    }, [moveHistory.length]);

    const { white, black } = getCapturedPieces(moveHistory);

    return (
        <div
            className={`analysis-widget prob-widget ${height < 140 ? 'condensed' : ''} ${collapsed ? 'collapsed' : ''}`}
            style={{
                height: collapsed ? 'auto' : height,
                flexShrink: 0
            }}
        >
            <div
                className="widget-header clickable"
                onClick={onToggle}
                {...dragHandleProps}
                style={{ cursor: 'grab' }}
            >
                <div className="header-title"><GripVertical size={16} className="drag-handle" style={{ marginRight: '0.5rem', opacity: 0.5 }} />
                    <h3>{showProb ? 'Position Analysis' : 'Casualties'}</h3>
                    {showProb ? <TrendingUp size={16} opacity={0.5} /> : <Skull size={16} opacity={0.5} />}
                    <ChevronDown
                        size={16}
                        className={`collapse-icon ${collapsed ? 'collapsed' : ''}`}
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
            {!collapsed && (
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
                                    <CapturedPieces white={white} black={black} pieceSet={pieceSet} size="1.2rem" />
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
                                <CapturedPieces white={white} black={black} pieceSet={pieceSet} showEmptyMessage={true} />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}
            {!collapsed && <div className="resizer" onMouseDown={onStartResize} />}
        </div>
    );
}
