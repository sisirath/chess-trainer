import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw, Lightbulb, BookOpen, Trophy, Palette, Layers } from 'lucide-react';
import './GameUI.css';

const THEMES = [
    { id: 'classic', name: 'Classic', icon: '🏛️' },
    { id: 'modern', name: 'Modern', icon: '✨' },
    { id: 'minimal', name: 'Minimal', icon: '⚪' },
    { id: 'wooden', name: 'Wooden', icon: '🪵' }
];

const PIECE_SETS = [
    { id: 'neo', name: 'Neo', icon: '♞' },
    { id: 'classic', name: 'Traditional', icon: '♘' },
    { id: 'minimal', name: 'Minimal', icon: 'N' },
    { id: 'abstract', name: 'Abstract', icon: '⬢' }
];

export default function GameUI({ game, theme, setTheme, pieceSet, setPieceSet }) {
    const { turn, check, gameOver, winner, resetGame, undoMove } = game;
    const [showTrainer, setShowTrainer] = useState(false);
    const [showSettings, setShowSettings] = useState(false);

    const getTrainingTip = () => {
        if (check) {
            return "🚨 You're in check! Protect your king by moving it, blocking the attack, or capturing the attacking piece.";
        }

        const tips = [
            "💡 Control the center: Occupy d4, d5, e4, and e5 squares early in the game.",
            "♟️ Develop your pieces: Get your knights and bishops out before moving the same piece twice.",
            "🏰 Castle early: Protect your king and connect your rooks for better endgame positioning.",
            "👁️ Look for forks: Knights can attack two pieces at once - a powerful tactical weapon.",
            "⚔️ Pins and skewers: Attack valuable pieces through less valuable ones.",
            "🎯 Think ahead: Always ask 'What is my opponent threatening?' before making a move.",
            "♕ Queen safety: Your queen is powerful but vulnerable - don't bring it out too early.",
            "🔄 Trade when ahead: If you're up material, trading pieces simplifies your path to victory.",
        ];

        return tips[Math.floor(Math.random() * tips.length)];
    };

    return (
        <div className="game-ui">
            {/* Top Bar removed - now in AnalysisPanel */}


            {/* Settings Selector */}
            <AnimatePresence>
                {showSettings && (
                    <motion.div
                        className="settings-panel glass-panel"
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -20, opacity: 0 }}
                    >
                        <div className="settings-section">
                            <h3>Board Theme</h3>
                            <div className="settings-grid">
                                {THEMES.map(t => (
                                    <button
                                        key={t.id}
                                        className={`setting-btn ${theme === t.id ? 'active' : ''}`}
                                        onClick={() => setTheme(t.id)}
                                    >
                                        <span className="setting-icon">{t.icon}</span>
                                        <span className="setting-name">{t.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="settings-section">
                            <h3>Piece Style</h3>
                            <div className="settings-grid">
                                {PIECE_SETS.map(p => (
                                    <button
                                        key={p.id}
                                        className={`setting-btn ${pieceSet === p.id ? 'active' : ''}`}
                                        onClick={() => setPieceSet(p.id)}
                                    >
                                        <span className="setting-icon">{p.icon}</span>
                                        <span className="setting-name">{p.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Trainer Panel */}
            <AnimatePresence>
                {showTrainer && (
                    <motion.div
                        className="trainer-panel glass-panel"
                        initial={{ x: -300, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -300, opacity: 0 }}
                        transition={{ type: "spring", damping: 20 }}
                    >
                        <div className="panel-header">
                            <BookOpen size={20} />
                            <h3>Training Tips</h3>
                            <button
                                className="close-btn"
                                onClick={() => setShowTrainer(false)}
                            >
                                ×
                            </button>
                        </div>
                        <div className="panel-content">
                            <div className="tip-card">
                                <Lightbulb size={24} className="tip-icon" />
                                <p>{getTrainingTip()}</p>
                            </div>

                            <div className="strategy-section">
                                <h4>Opening Principles</h4>
                                <ul>
                                    <li>Control the center (e4, d4, e5, d5)</li>
                                    <li>Develop knights before bishops</li>
                                    <li>Castle early (usually by move 10)</li>
                                    <li>Don't move the same piece twice in opening</li>
                                </ul>
                            </div>

                            <div className="strategy-section">
                                <h4>Tactical Patterns</h4>
                                <ul>
                                    <li>Fork: Attack two pieces at once</li>
                                    <li>Pin: Attack through a piece</li>
                                    <li>Skewer: Force a valuable piece to move</li>
                                    <li>Discovered attack: Move to reveal an attack</li>
                                </ul>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Game Over Modal */}
            <AnimatePresence>
                {gameOver && (
                    <motion.div
                        className="modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="modal glass-panel"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                        >
                            <Trophy size={64} className="trophy-icon" />
                            <h2>Game Over!</h2>
                            <p className="winner-text">
                                {winner === 'Draw' ? "It's a draw!" : `${winner} wins!`}
                            </p>
                            <button className="btn-primary" onClick={resetGame}>
                                Play Again
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
