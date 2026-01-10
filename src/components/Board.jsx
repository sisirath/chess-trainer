import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import './Board.css';
import { PIECE_SETS } from './PieceSets';

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'];

export default function Board({ game, theme, pieceSet = 'neo' }) {
    const { board, selectedSquare, onSquareClick, lastMove, turn, gameOver, isThinking } = game;
    const currentPieceSet = PIECE_SETS[pieceSet] || PIECE_SETS.neo;
    const [draggingPiece, setDraggingPiece] = useState(null);
    const boardGridRef = useRef(null);

    const handleDragStart = (square) => {
        if (turn !== 'w' || gameOver || isThinking) return;
        setDraggingPiece(square);
        // Select the square on start if not already selected
        if (selectedSquare !== square) {
            onSquareClick(square);
        }
    };

    const handleDragEnd = (event, info, fromSquare) => {
        setDraggingPiece(null);
        if (turn !== 'w' || gameOver || isThinking || !boardGridRef.current) return;

        // Get the board grid position and size
        const rect = boardGridRef.current.getBoundingClientRect();

        // Use client coordinates (mouse/touch position)
        const clientX = event.clientX || (event.touches && event.touches[0].clientX) || info.point.x;
        const clientY = event.clientY || (event.touches && event.touches[0].clientY) || info.point.y;

        // Check if the drop is within the board boundaries
        if (
            clientX >= rect.left &&
            clientX <= rect.right &&
            clientY >= rect.top &&
            clientY <= rect.bottom
        ) {
            // Calculate which square it was dropped on
            const x = clientX - rect.left;
            const y = clientY - rect.top;

            const fileIndex = Math.floor((x / rect.width) * 8);
            const rankIndex = Math.floor((y / rect.height) * 8);

            if (fileIndex >= 0 && fileIndex < 8 && rankIndex >= 0 && rankIndex < 8) {
                const toSquare = `${FILES[fileIndex]}${RANKS[rankIndex]}`;
                if (toSquare !== fromSquare) {
                    onSquareClick(toSquare);
                }
            }
        }
    };

    return (
        <div className={`chess-board theme-${theme} pieces-${pieceSet}`}>
            {/* Rank labels (left) */}
            <div className="rank-labels">
                {RANKS.map(rank => (
                    <div key={rank} className="rank-label">{rank}</div>
                ))}
            </div>

            {/* Board */}
            <div className="board-grid" ref={boardGridRef}>
                {board.map((row, rankIndex) => (
                    <React.Fragment key={rankIndex}>
                        {row.map((piece, fileIndex) => {
                            const squareName = `${FILES[fileIndex]}${RANKS[rankIndex]}`;
                            const isLight = (rankIndex + fileIndex) % 2 === 0;
                            const isSelected = selectedSquare === squareName;
                            const isLastMoveFrom = lastMove?.from === squareName;
                            const isLastMoveTo = lastMove?.to === squareName;
                            const isLastMove = isLastMoveFrom || isLastMoveTo;
                            const hasPiece = piece !== null;
                            const isDraggable = hasPiece && piece.color === 'w' && turn === 'w' && !gameOver && !isThinking;

                            return (
                                <div
                                    key={squareName}
                                    data-square={squareName}
                                    className={`square ${isLight ? 'light' : 'dark'} ${isSelected ? 'selected' : ''} ${isLastMove ? 'last-move' : ''} ${isLastMoveTo ? 'last-move-to' : ''}`}
                                    onClick={() => !draggingPiece && onSquareClick(squareName)}
                                >
                                    {hasPiece && (
                                        <motion.div
                                            className={`piece ${piece.color === 'w' ? 'white' : 'black'} ${isDraggable ? 'draggable' : ''} ${draggingPiece === squareName ? 'dragging' : ''}`}
                                            drag={isDraggable}
                                            dragSnapToOrigin
                                            onDragStart={() => handleDragStart(squareName)}
                                            onDragEnd={(e, info) => handleDragEnd(e, info, squareName)}
                                            whileDrag={{
                                                scale: 1.2,
                                                zIndex: 1000,
                                                filter: "drop-shadow(0 15px 30px rgba(0,0,0,0.5))"
                                            }}
                                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                            style={{ pointerEvents: isDraggable ? 'auto' : 'none' }}
                                        >
                                            {currentPieceSet.pieces[piece.color][piece.type]}
                                        </motion.div>
                                    )}
                                </div>
                            );
                        })}
                    </React.Fragment>
                ))}
            </div>

            {/* File labels (bottom) */}
            <div className="file-labels">
                {FILES.map(file => (
                    <div key={file} className="file-label">{file}</div>
                ))}
            </div>
        </div>
    );
}
