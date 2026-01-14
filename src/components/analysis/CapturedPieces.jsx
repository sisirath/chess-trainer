import React from 'react';
import { PIECE_SETS as PIECE_ICONS } from '../PieceSets';
import { Award } from 'lucide-react';

export default function CapturedPieces({ white = [], black = [], pieceSet = 'neo', size = '1rem', showEmptyMessage = false }) {
    if (white.length === 0 && black.length === 0) {
        if (showEmptyMessage) {
            return (
                <div className="empty-killed-large">
                    <Award size={40} opacity={0.1} />
                    <p>The battle has just begun. No casualties reported.</p>
                </div>
            );
        }
        return (
            <div className="empty-killed-minimal">
                <p>No casualties yet</p>
            </div>
        );
    }

    // If showEmptyMessage is true (large view), we render the grid layout
    if (showEmptyMessage) {
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
    }

    // Default minimal inline view
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
}
