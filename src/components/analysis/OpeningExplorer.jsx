// ... (imports remain)
import React, { useMemo } from 'react';
import { BookOpen, Compass, ChevronRight, ChevronDown, GripVertical } from 'lucide-react';
import { identifyOpening, getBookMoves } from '../../utils/OpeningLogic';

export default function OpeningExplorer({
    moveHistory,
    collapsed,
    onToggle,
    height,
    onStartResize,
    dragHandleProps,
    onPlayMove,
    dropTargetProps
}) {
    const identifiedOpening = useMemo(() => identifyOpening(moveHistory), [moveHistory]);
    const bookMoves = useMemo(() => getBookMoves(moveHistory), [moveHistory]);

    return (
        <div
            className={`analysis-widget opening-explorer ${collapsed ? 'collapsed' : ''}`}
            style={{
                height: collapsed ? 'auto' : height,
                flexShrink: 0
            }}
            {...dropTargetProps}
        >
            <div
                className="widget-header clickable"
                onClick={onToggle}
                {...dragHandleProps}
                style={{ cursor: 'grab' }}
            >
                <div className="header-title">
                    <GripVertical size={16} className="drag-handle" style={{ marginRight: '0.5rem', opacity: 0.5 }} />
                    <BookOpen size={16} className="icon-accent" />
                    <h3>Opening Explorer</h3>
                    <ChevronDown
                        size={16}
                        className={`collapse-icon ${collapsed ? 'collapsed' : ''}`}
                    />
                </div>
            </div>

            {!collapsed && (
                <div className="widget-content" style={{ overflowY: 'auto' }}>
                    {/* Current Opening Logic */}
                    {/* Current Opening Logic - Only show if we have data or need to warn */}
                    {(identifiedOpening || moveHistory.length > 0) && (
                        <div className="opening-status">
                            {identifiedOpening ? (
                                <>
                                    <span className="label">Current Opening:</span>
                                    <h4 className="opening-name">{identifiedOpening.name}</h4>
                                    <p className="opening-desc">{identifiedOpening.description}</p>
                                </>
                            ) : (
                                <p className="unknown-opening">No further book moves found. Try undoing.</p>
                            )}
                        </div>
                    )}

                    {/* Suggested Moves */}
                    {bookMoves.length > 0 && (
                        <div className="book-moves-section">
                            <span className="section-label">Book Moves:</span>
                            <div className="book-moves-list">
                                {bookMoves.map((suggestion, idx) => (
                                    <div
                                        key={idx}
                                        className="book-move-row"
                                        onClick={() => onPlayMove && onPlayMove(suggestion.san)}
                                        title={`Play ${suggestion.san}`}
                                    >
                                        <div className="move-badge">{suggestion.san}</div>
                                        <div className="move-info">
                                            <span className="leads-to">{suggestion.opening}</span>
                                            {suggestion.pros && <span className="move-note pros">✓ {suggestion.pros}</span>}
                                            {suggestion.cons && <span className="move-note cons">⚠ {suggestion.cons}</span>}
                                        </div>
                                        <ChevronRight size={14} opacity={0.5} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
            {!collapsed && <div className="resizer" onMouseDown={onStartResize} />}
        </div>
    );
}
