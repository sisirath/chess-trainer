import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Trophy, RotateCcw, Save, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import './AnalysisPanel.css';
import OpeningExplorer from './analysis/OpeningExplorer';
import WinProbabilityWidget from './analysis/WinProbabilityWidget';
import MoveAnalysisStatsWidget from './analysis/MoveAnalysisStatsWidget';
import MoveHistoryWidget from './analysis/MoveHistoryWidget';
import HintWidget from './analysis/HintWidget';

export default function AnalysisPanel({
    game,
    pieceSet = 'neo',
    theme = 'classic',
    setTheme = () => { },
    setPieceSet = () => { }
}) {
    if (!game) return null;
    const { moveHistory, winProbability, isThinking, moveStats, resetGame, undoMove, beastMode, setBeastMode, viewMoveIndex, goToMove, nextMove, prevMove, makeMove, isReviewing, exitReview } = game;

    const panelRef = useRef(null);
    const [layoutSaved, setLayoutSaved] = useState(false);

    // Persistence Helper
    const loadSavedState = (key, defaultValue) => {
        try {
            const saved = localStorage.getItem('chess_analysis_layout');
            if (saved && saved !== 'undefined') {
                const parsed = JSON.parse(saved);
                if (!parsed || typeof parsed !== 'object') return defaultValue;

                const savedValue = parsed[key];

                // Merge objects to ensure new keys exist
                if (savedValue && typeof savedValue === 'object' && !Array.isArray(savedValue)) {
                    return { ...defaultValue, ...savedValue };
                }

                // Merge arrays to ensure new widgets exist
                if (key === 'widgetOrder' && Array.isArray(savedValue)) {
                    const missing = defaultValue.filter(item => !savedValue.includes(item));
                    return [...savedValue, ...missing];
                }

                return savedValue !== undefined ? savedValue : defaultValue;
            }
        } catch (e) {
            console.error("Failed to load layout", e);
        }
        return defaultValue;
    };

    // Layout state
    const [heights, setHeights] = useState(() => loadSavedState('heights', {
        prob: 220,
        stats: 155,
        history: 350,
        explorer: 300,
        hints: 200
    }));

    const [collapsed, setCollapsed] = useState(() => loadSavedState('collapsed', {
        prob: false,
        stats: false,
        history: false,
        explorer: false,
        hints: false
    }));

    // Auto-resize Explorer based on game state
    useEffect(() => {
        if (moveHistory.length === 0) {
            // Expansion for exploring openings
            setHeights(prev => ({ ...prev, explorer: 300 }));
        } else if (moveHistory.length === 1) {
            // Collapse to show just identification after first move
            setHeights(prev => ({ ...prev, explorer: 140 }));
        }
    }, [moveHistory.length]);

    // Widget Order State
    const [widgetOrder, setWidgetOrder] = useState(() => loadSavedState('widgetOrder',
        ['prob', 'stats', 'hints', 'explorer', 'history']
    ));

    const handleSaveLayout = () => {
        const layout = { heights, collapsed, widgetOrder };
        localStorage.setItem('chess_analysis_layout', JSON.stringify(layout));
        setLayoutSaved(true);
        setTimeout(() => setLayoutSaved(false), 2000);
    };

    // Drag and Drop Refs
    const dragItem = useRef(null);
    const dragOverItem = useRef(null);

    const isResizing = useRef(null);

    const toggleSection = useCallback((section) => {
        setCollapsed(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    }, []);

    // Drag Handlers
    const handleDragStart = (e, position) => {
        dragItem.current = position;
        // Optional: Set drag effect or ghost image here
        e.dataTransfer.effectAllowed = "move";
        // To drag the whole widget look, we might need a reference, but for now icon drag is okay.
    };

    const handleDragEnter = (e, position) => {
        e.preventDefault(); // Necessary for drop to work
        dragOverItem.current = position;

        const dragIndex = dragItem.current;
        const dragOverIndex = dragOverItem.current;

        if (dragIndex === null || dragIndex === dragOverIndex) return;

        // Reorder list
        const newOrder = [...widgetOrder];
        const draggedItemContent = newOrder[dragIndex];
        newOrder.splice(dragIndex, 1);
        newOrder.splice(dragOverIndex, 0, draggedItemContent);

        setWidgetOrder(newOrder);
        dragItem.current = dragOverIndex; // Update drag index to match new position
    };

    const handleDragEnd = () => {
        dragItem.current = null;
        dragOverItem.current = null;
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

    const renderWidget = (id, index) => {
        const dragHandleProps = {
            draggable: true,
            onDragStart: (e) => handleDragStart(e, index),
            onDragEnd: handleDragEnd,
            style: { cursor: 'grab', marginRight: '0.5rem', opacity: 0.5 }
        };

        const dropTargetProps = {
            onDragEnter: (e) => handleDragEnter(e, index),
            onDragOver: (e) => e.preventDefault()
        };

        switch (id) {
            case 'hints':
                return (
                    <div className="widget-container" style={{ order: index }} key="hints" {...dropTargetProps}>
                        <HintWidget
                            game={game}
                            height={heights.hints}
                            collapsed={collapsed.hints}
                            onToggle={() => toggleSection('hints')}
                            onStartResize={() => startResizing('hints')}
                            dragHandleProps={dragHandleProps}
                            pieceSet={pieceSet}
                        />
                    </div>
                );
            case 'explorer':
                return (
                    <div className="widget-container" style={{ order: index }} key="explorer" {...dropTargetProps}>
                        <OpeningExplorer
                            moveHistory={moveHistory}
                            collapsed={collapsed.explorer}
                            onToggle={() => toggleSection('explorer')}
                            height={heights.explorer}
                            onStartResize={() => startResizing('explorer')}
                            dragHandleProps={dragHandleProps}
                            onPlayMove={makeMove}
                        />
                    </div>
                );
            case 'prob':
                return (
                    <div className="widget-container" style={{ order: index }} key="prob" {...dropTargetProps}>
                        <WinProbabilityWidget
                            winProbability={winProbability}
                            isThinking={isThinking}
                            moveHistory={moveHistory}
                            beastMode={beastMode}
                            setBeastMode={setBeastMode}
                            collapsed={collapsed.prob}
                            onToggle={() => toggleSection('prob')}
                            height={heights.prob}
                            onStartResize={() => startResizing('prob')}
                            pieceSet={pieceSet}
                            dragHandleProps={dragHandleProps}
                        />
                    </div>
                );
            case 'stats':
                return (
                    <div className="widget-container" style={{ order: index }} key="stats" {...dropTargetProps}>
                        <MoveAnalysisStatsWidget
                            moveStats={moveStats}
                            collapsed={collapsed.stats}
                            onToggle={() => toggleSection('stats')}
                            height={heights.stats}
                            onStartResize={() => startResizing('stats')}
                            dragHandleProps={dragHandleProps}
                        />
                    </div>
                );
            case 'history':
                return (
                    <div className="widget-container" style={{ order: index }} key="history" {...dropTargetProps}>
                        <MoveHistoryWidget
                            moveHistory={moveHistory}
                            collapsed={collapsed.history}
                            onToggle={() => toggleSection('history')}
                            containerStyle={{
                                flex: collapsed.history ? 'none' : 1,
                                minHeight: collapsed.history ? 'auto' : 150
                            }}
                            onStartResize={() => startResizing('history')}
                            currentMoveIndex={viewMoveIndex}
                            onMoveClick={(idx) => goToMove(idx)}
                            onNext={nextMove}
                            onPrev={prevMove}
                            onStart={() => goToMove(-1)}
                            onEnd={() => goToMove(null)}
                            dragHandleProps={dragHandleProps}
                        />
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="analysis-panel glass-panel">
            {/* Header - Changes based on review mode */}
            {!isReviewing ? (
                <div className="analysis-widget training-header-widget">
                    <div className="logo-section">
                        <Trophy size={20} className="logo-icon" />
                        <h1>Chess Trainer</h1>
                    </div>

                    <button
                        className="btn-secondary icon-btn-mini"
                        onClick={handleSaveLayout}
                        title="Save Layout"
                        style={{
                            padding: '0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: layoutSaved ? '#4ade80' : 'inherit',
                            borderColor: layoutSaved ? 'rgba(74, 222, 128, 0.3)' : 'inherit'
                        }}
                    >
                        {layoutSaved ? <Check size={14} /> : <Save size={14} />}
                    </button>

                    <div className="controls-section">
                        <button className="btn-secondary icon-btn-mini" onClick={undoMove} title="Undo Move">
                            <RotateCcw size={14} />
                        </button>
                        <button className="btn-primary btn-mini" onClick={resetGame}>
                            New Game
                        </button>
                    </div>
                </div>
            ) : (
                <div className="analysis-widget training-header-widget review-header">
                    <div className="logo-section">
                        <Trophy size={20} className="logo-icon review-icon" />
                        <h1>Game Review</h1>
                    </div>

                    <div className="review-navigation">
                        <button className="icon-btn-mini" onClick={prevMove} title="Previous Move">
                            <ChevronLeft size={18} />
                        </button>
                        <div className="review-move-counter">
                            {viewMoveIndex === -1 ? 'Start' : `Move ${Math.floor(viewMoveIndex / 2) + 1}`}
                        </div>
                        <button className="icon-btn-mini" onClick={nextMove} title="Next Move">
                            <ChevronRight size={18} />
                        </button>
                    </div>

                    <button className="btn-primary btn-mini exit-review-btn" onClick={exitReview}>
                        Exit Review
                    </button>
                </div>
            )}


            {widgetOrder.map((id, index) => renderWidget(id, index))}

            {/* Computer Status */}
            {isThinking && (
                <div className="thinking-overlay">
                    <div className="thinking-ripple">
                        <div /> <div />
                    </div>
                </div>
            )}
        </div>
    );
}
