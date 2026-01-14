import React from 'react';
import { Award, ChevronDown, GripVertical } from 'lucide-react';

export default function MoveAnalysisStatsWidget({
    moveStats,
    collapsed,
    onToggle,
    height,
    onStartResize,
    dragHandleProps,
    dropTargetProps
}) {
    const totalStats = Object.values(moveStats).reduce((a, b) => a + b, 0);

    return (
        <div
            className={`analysis-widget stats-widget ${height < 150 ? 'condensed' : ''} ${collapsed ? 'collapsed' : ''}`}
            style={{ height: collapsed ? 'auto' : height, flexShrink: 0 }}
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
                    <h3>Move Analysis Stats</h3>
                    <Award size={16} opacity={0.5} />
                    <ChevronDown
                        size={16}
                        className={`collapse-icon ${collapsed ? 'collapsed' : ''}`}
                    />
                </div>
            </div>
            {!collapsed && (
                <div className="widget-content">
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
            {!collapsed && <div className="resizer" onMouseDown={onStartResize} />}
        </div>
    );
}
