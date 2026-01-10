import React, { useState } from 'react';
import Board from './components/Board';
import AnalysisPanel from './components/AnalysisPanel';
import { useChessGame } from './hooks/useChessGame';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy } from 'lucide-react';
import './App.css';

function App() {
  const game = useChessGame();
  const [theme, setTheme] = useState('classic');
  const [pieceSet, setPieceSet] = useState('neo');

  const { gameOver, winner, resetGame } = game;

  return (
    <div className="app">
      <div className="game-container">
        <Board game={game} theme={theme} pieceSet={pieceSet} />
        <AnalysisPanel
          game={game}
          pieceSet={pieceSet}
          theme={theme}
          setTheme={setTheme}
          setPieceSet={setPieceSet}
        />
      </div>
      
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

export default App;
