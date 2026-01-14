import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Lightbulb, Info, Target, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, GripVertical } from 'lucide-react';
import { getExplanation, getRecommendation } from './AnalysisUtils';

export default function MoveHistoryWidget({
    moveHistory,
    collapsed,
    onToggle,
    containerStyle,
    onStartResize,
    // Navigation props
    currentMoveIndex,
    onMoveClick,
    onNext,
    onPrev,
    onStart,
    onEnd,
    dragHandleProps,
    dropTargetProps
}) {
    const [localSelectedMove, setLocalSelectedMove] = useState(null);
    const [showAllMoves, setShowAllMoves] = useState(false);
    const [alwaysExpand, setAlwaysExpand] = useState(true);

    // Determine which move is active/expanded
    // If currentMoveIndex is provided (review mode), use it.
    // Otherwise use local state.
    const activeIndex = currentMoveIndex !== undefined ? currentMoveIndex : localSelectedMove;

    // Scroll active move into view is disabled globally per user request
    // to prevent intrusive jumping of the analysis panel.

    const handleMoveClick = (index) => {
        if (onMoveClick) {
            onMoveClick(index);
        } else {
            setLocalSelectedMove(localSelectedMove === index ? null : index);
        }
    };

    return (
        <div
            className={`analysis-widget history-widget ${collapsed ? 'collapsed' : ''}`}
            style={containerStyle}
            {...dropTargetProps}
        >
            <div
                className="widget-header clickable"
                onClick={onToggle}
                {...dragHandleProps}
                style={{ ...dragHandleProps.style, cursor: 'grab' }}
            >
                <div className="header-title">
                    <GripVertical size={16} className="drag-handle" style={{ marginRight: '0.5rem', opacity: 0.5 }} />
                    <h3>Move History & Logic</h3>
                    <ChevronDown
                        size={16}
                        className={`collapse-icon ${collapsed ? 'collapsed' : ''}`}
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
            {!collapsed && (
                <>
                    <div className="widget-content history-scroll">
                        {moveHistory.length === 0 ? (
                            <div className="empty-history">
                                <Lightbulb size={32} opacity={0.2} />
                                <p>Play a move to start analysis</p>
                            </div>
                        ) : (
                            [...moveHistory]
                                .reverse() // Display latest first
                                .filter(m => showAllMoves || m.player === 'human')
                                .map((entry, idx) => {
                                    const originalIndex = moveHistory.indexOf(entry);
                                    const moveNum = Math.floor(originalIndex / 2) + 1;
                                    const isExpanded = alwaysExpand || activeIndex === originalIndex;
                                    const isActive = activeIndex === originalIndex;

                                    return (
                                        <motion.div
                                            key={originalIndex}
                                            id={`move-${originalIndex}`}
                                            className={`interactive-move-card ${isExpanded ? 'expanded' : ''} ${isActive ? 'active-move' : ''}`}
                                            onClick={() => !alwaysExpand && handleMoveClick(originalIndex)}
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
                                                    {isActive && <div className="active-indicator" />}
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
                    {/* Navigation Controls */}
                    {onNext && (
                        <div className="history-controls">
                            <button className="nav-btn" onClick={onStart} title="Start of Game">
                                <ChevronsLeft size={18} />
                            </button>
                            <button className="nav-btn" onClick={onPrev} title="Previous Move">
                                <ChevronLeft size={18} />
                            </button>
                            <button className="nav-btn" onClick={onNext} title="Next Move">
                                <ChevronRight size={18} />
                            </button>
                            <button className="nav-btn" onClick={onEnd} title="Return to Live">
                                <ChevronsRight size={18} />
                            </button>
                        </div>
                    )}
                </>
            )}
            {!collapsed && <div className="resizer" onMouseDown={onStartResize} />}
        </div>
    );
}
