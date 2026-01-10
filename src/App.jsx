import React, { useState } from 'react';
import Board from './components/Board';
import GameUI from './components/GameUI';
import AnalysisPanel from './components/AnalysisPanel';
import { useChessGame } from './hooks/useChessGame';
import './App.css';

function App() {
  const game = useChessGame();
  const [theme, setTheme] = useState('classic');
  const [pieceSet, setPieceSet] = useState('neo');

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
      <GameUI
        game={game}
        theme={theme}
        setTheme={setTheme}
        pieceSet={pieceSet}
        setPieceSet={setPieceSet}
      />
    </div>
  );
}

export default App;
