import { useState, useEffect, useCallback, useRef } from 'react';
import { Chess } from 'chess.js';

// Piece values for evaluation
const PIECE_VALUES = {
    p: 100,
    n: 320,
    b: 330,
    r: 500,
    q: 900,
    k: 20000
};

// Position bonuses for pieces (encourages good positions)
const PAWN_TABLE = [
    0, 0, 0, 0, 0, 0, 0, 0,
    50, 50, 50, 50, 50, 50, 50, 50,
    10, 10, 20, 30, 30, 20, 10, 10,
    5, 5, 10, 25, 25, 10, 5, 5,
    0, 0, 0, 20, 20, 0, 0, 0,
    5, -5, -10, 0, 0, -10, -5, 5,
    5, 10, 10, -20, -20, 10, 10, 5,
    0, 0, 0, 0, 0, 0, 0, 0
];

const KNIGHT_TABLE = [
    -50, -40, -30, -30, -30, -30, -40, -50,
    -40, -20, 0, 0, 0, 0, -20, -40,
    -30, 0, 10, 15, 15, 10, 0, -30,
    -30, 5, 15, 20, 20, 15, 5, -30,
    -30, 0, 15, 20, 20, 15, 0, -30,
    -30, 5, 10, 15, 15, 10, 5, -30,
    -40, -20, 0, 5, 5, 0, -20, -40,
    -50, -40, -30, -30, -30, -30, -40, -50
];

export function useChessGame() {
    const [chess] = useState(new Chess());
    const [fen, setFen] = useState(chess.fen());
    const [turn, setTurn] = useState('w');
    const [check, setCheck] = useState(false);
    const [gameOver, setGameOver] = useState(false);
    const [winner, setWinner] = useState(null);
    const [moveHistory, setMoveHistory] = useState([]);
    const [board, setBoard] = useState(chess.board());
    const [selectedSquare, setSelectedSquare] = useState(null);
    const [winProbability, setWinProbability] = useState(50);
    const [isThinking, setIsThinking] = useState(false);
    const [currentEval, setCurrentEval] = useState(0);
    const [lastMove, setLastMove] = useState(null);

    // Player skill tracking with smoothing
    const playerSkillRef = useRef(1200);
    const recentMovesRef = useRef([]); // Track recent move qualities for smoother adaptation
    const consecutiveGoodMovesRef = useRef(0);
    const consecutiveBadMovesRef = useRef(0);
    
    // Beast mode - AI plays at maximum strength to win ASAP
    const [beastMode, setBeastMode] = useState(false);

    const updateGameState = useCallback(() => {
        setFen(chess.fen());
        setBoard(chess.board());
        setTurn(chess.turn());
        setCheck(chess.inCheck());

        if (chess.isGameOver()) {
            setGameOver(true);
            if (chess.isCheckmate()) {
                setWinner(chess.turn() === 'w' ? 'Black' : 'White');
            } else {
                setWinner('Draw');
            }
        }
    }, [chess]);

    // Evaluate board position
    const evaluateBoard = useCallback((game) => {
        let score = 0;
        const board = game.board();

        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = board[row][col];
                if (piece) {
                    let value = PIECE_VALUES[piece.type] || 0;

                    // Add position bonus
                    const idx = row * 8 + col;
                    if (piece.type === 'p') {
                        value += piece.color === 'w' ? PAWN_TABLE[63 - idx] : PAWN_TABLE[idx];
                    } else if (piece.type === 'n') {
                        value += piece.color === 'w' ? KNIGHT_TABLE[63 - idx] : KNIGHT_TABLE[idx];
                    }

                    score += piece.color === 'w' ? value : -value;
                }
            }
        }

        // Reduced mobility impact to avoid redundant game.moves() calls
        return score;
    }, []);

    // Minimax with alpha-beta pruning
    // Minimax with alpha-beta pruning and move ordering
    const minimax = useCallback((game, depth, alpha, beta, isMaximizing) => {
        if (depth === 0 || game.isGameOver()) {
            return evaluateBoard(game);
        }

        const moves = game.moves();
        // Move ordering: Prioritize captures to improve alpha-beta pruning efficiency
        moves.sort((a, b) => {
            const aIsCapture = a.includes('x');
            const bIsCapture = b.includes('x');
            if (aIsCapture && !bIsCapture) return -1;
            if (!aIsCapture && bIsCapture) return 1;
            return 0;
        });

        if (isMaximizing) {
            let maxEval = -Infinity;
            for (const move of moves) {
                game.move(move);
                const evalScore = minimax(game, depth - 1, alpha, beta, false);
                game.undo();
                maxEval = Math.max(maxEval, evalScore);
                alpha = Math.max(alpha, evalScore);
                if (beta <= alpha) break;
            }
            return maxEval;
        } else {
            let minEval = Infinity;
            for (const move of moves) {
                game.move(move);
                const evalScore = minimax(game, depth - 1, alpha, beta, true);
                game.undo();
                minEval = Math.min(minEval, evalScore);
                beta = Math.min(beta, evalScore);
                if (beta <= alpha) break;
            }
            return minEval;
        }
    }, [evaluateBoard]);

    // Find best move for computer with adaptive difficulty
    // Normal mode: AI tries to keep player around 38% win probability, wins when possible
    // Beast mode: AI plays at maximum strength to win ASAP
    const findBestMove = useCallback((game) => {
        const moves = game.moves({ verbose: true });
        if (moves.length === 0) return null;

        // Beast mode uses higher depth for stronger play, but not too deep to avoid lag
        let depth = beastMode ? 4 : 3;
        const moveCount = game.history().length;
        if (!beastMode && playerSkillRef.current > 1800) depth = 4;
        if (!beastMode && moveCount < 10) depth = Math.min(depth, 3); // Faster opening moves only in normal mode

        // Helper to calculate win prob from score
        const scoreToWinProb = (score) => {
            const normalized = score / 100;
            return Math.max(5, Math.min(95, 50 + (normalized * 5)));
        };

        // Get current position evaluation
        const currentScore = evaluateBoard(game);
        const currentWinProb = scoreToWinProb(currentScore);

        // Evaluate all moves
        const scoredMoves = [];
        for (const move of moves) {
            game.move(move);
            const score = minimax(game, depth - 1, -Infinity, Infinity, true);
            game.undo();
            
            const resultingWinProb = scoreToWinProb(score);
            scoredMoves.push({ move, score, winProb: resultingWinProb });
        }

        // Sort moves by score (best for black = lowest score)
        scoredMoves.sort((a, b) => a.score - b.score);

        let selectedMove;

        // === BEAST MODE: Play the absolute best move always ===
        if (beastMode) {
            selectedMove = scoredMoves[0]; // Always play the strongest move
            return { move: selectedMove.move, score: selectedMove.score };
        }

        // === NORMAL MODE: Target ~38% win probability, but try to win ===
        const targetWinProb = 38; // Keep player slightly behind
        
        // Check if AI can win or get decisive advantage
        const winningMoves = scoredMoves.filter(m => m.winProb <= 20); // Moves that give AI big advantage
        const crushingMoves = scoredMoves.filter(m => m.winProb <= 10); // Near-winning moves
        
        // If there's a crushing/winning move, take it!
        if (crushingMoves.length > 0) {
            selectedMove = crushingMoves[0];
        } else if (winningMoves.length > 0 && currentWinProb <= 45) {
            // Take winning moves if player isn't already ahead
            selectedMove = winningMoves[0];
        } else {
            // Try to keep player around 38% win probability
            const targetMoves = scoredMoves.filter(m => m.winProb >= 30 && m.winProb <= 45);
            
            if (targetMoves.length > 0) {
                // Sort by how close to target
                targetMoves.sort((a, b) => Math.abs(a.winProb - targetWinProb) - Math.abs(b.winProb - targetWinProb));
                const varietyRange = Math.min(3, targetMoves.length);
                const index = Math.floor(Math.random() * varietyRange);
                selectedMove = targetMoves[index];
            } else if (currentWinProb > 50) {
                // Player is ahead, AI plays stronger to catch up
                selectedMove = scoredMoves[0];
            } else if (currentWinProb < 30) {
                // Player is too far behind, ease up a bit
                const easeMoves = scoredMoves.filter(m => m.winProb > currentWinProb);
                if (easeMoves.length > 0) {
                    const easeIndex = Math.min(Math.floor(easeMoves.length * 0.3), easeMoves.length - 1);
                    selectedMove = easeMoves[easeIndex];
                } else {
                    selectedMove = scoredMoves[Math.min(2, scoredMoves.length - 1)];
                }
            } else {
                // Default: pick from top moves with variety
                const index = Math.floor(Math.random() * Math.min(3, scoredMoves.length));
                selectedMove = scoredMoves[index];
            }
        }

        // Frustration prevention (only in normal mode)
        if (consecutiveBadMovesRef.current >= 4 && currentWinProb < 25) {
            const helpMoves = scoredMoves.filter(m => m.winProb > currentWinProb + 8);
            if (helpMoves.length > 0) {
                selectedMove = helpMoves[Math.floor(Math.random() * Math.min(2, helpMoves.length))];
            }
        }

        return { move: selectedMove.move, score: selectedMove.score };
    }, [minimax, evaluateBoard, beastMode]);

    // Calculate win probability from evaluation
    const calculateWinProbability = useCallback((evalScore) => {
        // Convert centipawn-like score to probability
        // Positive = good for white (player), negative = good for black (computer)
        const normalizedScore = evalScore / 100;
        const prob = 50 + (normalizedScore * 5); // 5% per pawn advantage
        return Math.max(5, Math.min(95, prob));
    }, []);

    // Determine game phase based on material and move count
    const getGamePhase = useCallback((game) => {
        const moveCount = game.history().length;
        const board = game.board();
        let materialCount = 0;
        
        // Count major pieces (not pawns or kings)
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = board[row][col];
                if (piece && piece.type !== 'p' && piece.type !== 'k') {
                    materialCount++;
                }
            }
        }
        
        if (moveCount < 20) return 'opening';
        if (materialCount <= 6) return 'endgame';
        return 'middlegame';
    }, []);

    // Enhanced move analysis - uses win percentage change for categorization
    const analyzeMoveQuality = useCallback((game, move, prevEval, bestMoveResult) => {
        const currentEval = minimax(game, 2, -Infinity, Infinity, false);
        const evalChange = currentEval - prevEval;
        
        const gamePhase = getGamePhase(game);
        
        // Calculate win percentage change
        const prevWinProb = calculateWinProbability(prevEval);
        const currentWinProb = calculateWinProbability(currentEval);
        const winProbChange = currentWinProb - prevWinProb;
        
        // Categorize based on win percentage change
        let quality;
        if (winProbChange >= 20) {
            quality = 'Excellent';  // +20% or more win probability
        } else if (winProbChange >= 10) {
            quality = 'Good';       // +10% to +20% win probability
        } else if (winProbChange > -10) {
            quality = 'Neutral';    // above -10% win probability
        } else if (winProbChange > -20) {
            quality = 'Bad';        // -10% to -20% win probability
        } else {
            quality = 'Terrible';   // -20% or worse win probability
        }
        
        return {
            quality,
            evalChange,
            currentEval,
            gamePhase,
            winProbChange
        };
    }, [getGamePhase, minimax, calculateWinProbability]);

    // Computer makes a move - optimized for smoothness
    const makeComputerMove = useCallback(() => {
        if (chess.isGameOver()) {
            setIsThinking(false);
            return;
        }

        setIsThinking(true);

        // Use requestAnimationFrame for smoother UI updates
        requestAnimationFrame(() => {
            // Small delay to let UI update before heavy computation
            setTimeout(() => {
                const result = findBestMove(chess);

                if (result && result.move) {
                    const move = chess.move(result.move);

                    if (move) {
                        const prevEval = currentEval;
                        const evalScore = result.score;
                        const change = prevEval - evalScore;
                        
                        let quality = 'Good';
                        if (change > 100) quality = 'Excellent';
                        else if (change < -50) quality = 'Neutral';

                        // Batch state updates for smoother rendering
                        const newHistoryEntry = {
                            move: move.san,
                            from: move.from,
                            to: move.to,
                            piece: move.piece,
                            captured: move.captured,
                            player: 'computer',
                            alternatives: [],
                            bestMoveScore: evalScore,
                            fen: chess.fen(),
                            quality,
                            evalChange: change,
                            evalScore,
                            gamePhase: getGamePhase(chess)
                        };

                        // Update all state in one go
                        setMoveHistory(prev => [...prev, newHistoryEntry]);
                        setLastMove({ from: move.from, to: move.to });
                        setCurrentEval(evalScore);
                        setWinProbability(calculateWinProbability(evalScore));
                        updateGameState();
                        setIsThinking(false);
                    } else {
                        setIsThinking(false);
                    }
                } else {
                    setIsThinking(false);
                }
            }, 50); // Minimal delay for UI responsiveness
        });
    }, [chess, findBestMove, currentEval, calculateWinProbability, updateGameState, getGamePhase]);

    // Update player skill based on move quality with smoothing
    const updatePlayerSkill = useCallback((quality) => {
        // Track recent moves for smoother adaptation
        recentMovesRef.current.push(quality);
        if (recentMovesRef.current.length > 10) {
            recentMovesRef.current.shift();
        }

        // Track consecutive good/bad moves
        if (quality === 'Excellent' || quality === 'Good') {
            consecutiveGoodMovesRef.current++;
            consecutiveBadMovesRef.current = 0;
        } else if (quality === 'Bad' || quality === 'Terrible') {
            consecutiveBadMovesRef.current++;
            consecutiveGoodMovesRef.current = 0;
        } else {
            // Neutral moves slowly reset streaks
            consecutiveGoodMovesRef.current = Math.max(0, consecutiveGoodMovesRef.current - 1);
            consecutiveBadMovesRef.current = Math.max(0, consecutiveBadMovesRef.current - 1);
        }

        // Base adjustments
        const baseAdjustments = {
            Excellent: 30,
            Good: 12,
            Neutral: 0,
            Bad: -15,
            Terrible: -40
        };

        let adjustment = baseAdjustments[quality] || 0;

        // Streak bonuses/penalties for more responsive adaptation
        if (consecutiveGoodMovesRef.current >= 3) {
            adjustment += 10; // Bonus for consistent good play
        }
        if (consecutiveBadMovesRef.current >= 3) {
            adjustment -= 5; // Extra penalty for struggling
        }

        // Calculate weighted average from recent moves for stability
        const recentQualityScores = recentMovesRef.current.map(q => {
            const scores = { Excellent: 2, Good: 1, Neutral: 0, Bad: -1, Terrible: -2 };
            return scores[q] || 0;
        });
        
        if (recentQualityScores.length >= 5) {
            const avgRecent = recentQualityScores.reduce((a, b) => a + b, 0) / recentQualityScores.length;
            // Dampen extreme swings based on recent performance
            if (avgRecent > 0.5 && adjustment < 0) {
                adjustment *= 0.7; // Reduce penalty if generally playing well
            } else if (avgRecent < -0.5 && adjustment > 0) {
                adjustment *= 0.7; // Reduce bonus if generally struggling
            }
        }

        // Apply adjustment with bounds
        playerSkillRef.current = Math.max(600, Math.min(2600, 
            playerSkillRef.current + adjustment
        ));
    }, []);

    const onSquareClick = useCallback((square) => {
        if (gameOver || isThinking || turn !== 'w') return;

        if (selectedSquare) {
            try {
                const beforeFen = chess.fen();
                const altMoves = chess.moves({ square: selectedSquare, verbose: true })
                    .slice(0, 4)
                    .map(m => m.san);

                const move = chess.move({
                    from: selectedSquare,
                    to: square,
                    promotion: 'q',
                });

                if (move) {
                    const prevEval = currentEval;
                    
                    // Quick evaluation without heavy findBestMove call
                    const newEval = evaluateBoard(chess);
                    const prevWinProb = calculateWinProbability(prevEval);
                    const newWinProb = calculateWinProbability(newEval);
                    const winProbChange = newWinProb - prevWinProb;
                    
                    // Categorize based on win percentage change
                    let quality;
                    if (winProbChange >= 20) quality = 'Excellent';
                    else if (winProbChange >= 10) quality = 'Good';
                    else if (winProbChange > -10) quality = 'Neutral';
                    else if (winProbChange > -20) quality = 'Bad';
                    else quality = 'Terrible';

                    const alternatives = altMoves.filter(m => m !== move.san);
                    const gamePhase = getGamePhase(chess);

                    const newHistoryEntry = {
                        move: move.san,
                        from: move.from,
                        to: move.to,
                        piece: move.piece,
                        captured: move.captured,
                        promotion: move.promotion,
                        player: 'human',
                        alternatives,
                        bestMissed: null,
                        bestMoveScore: newEval,
                        fen: chess.fen(),
                        quality,
                        evalChange: newEval - prevEval,
                        evalScore: newEval,
                        gamePhase,
                        winProbChange
                    };

                    // Update player skill
                    updatePlayerSkill(quality);

                    // Batch state updates - immediate response
                    setMoveHistory(prev => [...prev, newHistoryEntry]);
                    setCurrentEval(newEval);
                    setWinProbability(newWinProb);
                    setLastMove({ from: move.from, to: move.to });
                    setSelectedSquare(null);
                    updateGameState();

                    // Trigger computer response
                    if (!chess.isGameOver()) {
                        setTimeout(() => makeComputerMove(), 50);
                    }
                    return;
                }
            } catch (e) {
                // Invalid move, fall through to selection logic
            }
        }

        // Select/deselect square
        if (selectedSquare === square) {
            setSelectedSquare(null);
        } else {
            const piece = chess.get(square);
            if (piece && piece.color === 'w') {
                setSelectedSquare(square);
            } else {
                setSelectedSquare(null);
            }
        }
    }, [chess, selectedSquare, gameOver, isThinking, turn, currentEval, updateGameState, makeComputerMove, evaluateBoard, calculateWinProbability, getGamePhase, updatePlayerSkill]);

    const resetGame = useCallback(() => {
        chess.reset();
        setGameOver(false);
        setWinner(null);
        setSelectedSquare(null);
        setMoveHistory([]);
        setWinProbability(50);
        setCurrentEval(0);
        setIsThinking(false);
        setLastMove(null);
        // Reset skill tracking
        playerSkillRef.current = 1200;
        recentMovesRef.current = [];
        consecutiveGoodMovesRef.current = 0;
        consecutiveBadMovesRef.current = 0;
        updateGameState();
    }, [chess, updateGameState]);

    const moveStats = moveHistory.reduce((stats, move) => {
        if (move.player === 'human' && move.quality) {
            stats[move.quality]++;
        }
        return stats;
    }, { Excellent: 0, Good: 0, Neutral: 0, Bad: 0, Terrible: 0 });

    const undoMove = useCallback(() => {
        if (moveHistory.length >= 2 && !isThinking) {
            chess.undo();
            chess.undo();
            setMoveHistory(prev => prev.slice(0, -2));

            const evalScore = evaluateBoard(chess);
            setCurrentEval(evalScore);
            setWinProbability(calculateWinProbability(evalScore));

            updateGameState();
        }
    }, [chess, moveHistory, isThinking, updateGameState, evaluateBoard, calculateWinProbability]);

    // Initialize
    useEffect(() => {
        updateGameState();
    }, [updateGameState]);

    return {
        fen,
        board,
        turn,
        check,
        gameOver,
        winner,
        selectedSquare,
        onSquareClick,
        resetGame,
        undoMove,
        moveHistory,
        winProbability,
        isThinking,
        currentEval,
        lastMove,
        moveStats,
        beastMode,
        setBeastMode
    };
}
