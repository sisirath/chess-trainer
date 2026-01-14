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
  const [showGameOverModal, setShowGameOverModal] = useState(false);

  const { gameOver, winner, resetGame } = game;

  // Sync modal state with game over state
  React.useEffect(() => {
    if (gameOver) {
      setShowGameOverModal(true);
    } else {
      setShowGameOverModal(false);
    }
  }, [gameOver]);

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
        {showGameOverModal && (
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
              <div className="modal-actions">
                <button className="btn-secondary" onClick={() => setShowGameOverModal(false)}>
                  Review Game
                </button>
                <button className="btn-primary" onClick={resetGame}>
                  Play Again
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
