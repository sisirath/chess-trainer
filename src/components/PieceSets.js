import React from 'react';

// Piece Set Definitions
export const PIECE_SETS = {
    neo: {
        name: 'Neo Modern',
        pieces: {
            w: { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' },
            b: { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' }
        },
        useStroke: true
    },
    classic: {
        name: 'Classic',
        pieces: {
            w: { k: '♔', q: '♕', r: '♖', b: '♗', n: '♘', p: '♙' },
            b: { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' }
        }
    },
    minimal: {
        name: 'Minimalist',
        pieces: {
            w: { k: 'K', q: 'Q', r: 'R', b: 'B', n: 'N', p: 'P' },
            b: { k: 'k', q: 'q', r: 'r', b: 'b', n: 'n', p: 'p' }
        }
    },
    abstract: {
        name: 'Abstract',
        pieces: {
            w: { k: '◆', q: '◈', r: '■', b: '▲', n: '⬢', p: '●' },
            b: { k: '◇', q: '◇', r: '□', b: '△', n: '⬡', p: '○' }
        }
    }
};
