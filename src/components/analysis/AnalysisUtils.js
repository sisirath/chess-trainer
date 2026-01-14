import { PIECE_SETS as PIECE_ICONS } from '../PieceSets';
import { Chess } from 'chess.js';

export const PIECE_NAMES = {
    p: 'Pawn',
    n: 'Knight',
    b: 'Bishop',
    r: 'Rook',
    q: 'Queen',
    k: 'King'
};

export const describeMove = (san, piece, from, to, captured) => {
    if (!san) return null;

    const pieceMap = {
        'N': 'Knight', 'B': 'Bishop', 'R': 'Rook',
        'Q': 'Queen', 'K': 'King', 'O-O': 'King', 'O-O-O': 'King'
    };

    const isCapture = san.includes('x');
    const pieceChar = san[0];
    const pieceName = pieceMap[pieceChar] || 'Pawn';
    const targetSquare = san.match(/[a-h][1-8]/);

    if (san === 'O-O') return "castle kingside to secure your King and activate the Rook";
    if (san === 'O-O-O') return "castle queenside to secure your King and centralize the Rook";

    if (isCapture && captured) {
        const capturedPiece = PIECE_NAMES[captured] || 'piece';
        return `capture the ${capturedPiece} with your ${pieceName}${targetSquare ? ` on ${targetSquare[0]}` : ''}`;
    }

    if (targetSquare) {
        return `move your ${pieceName} to ${targetSquare[0]}`;
    }

    return `develop your ${pieceName} to a better square`;
};

export const getExplanation = (entry) => {
    const gamePhase = entry.gamePhase || 'middlegame';
    const phaseText = gamePhase === 'opening' ? 'opening' : gamePhase === 'endgame' ? 'endgame' : 'middlegame';

    if (entry.quality === 'Excellent') {
        if (entry.captured) {
            const capturedPiece = PIECE_NAMES[entry.captured];
            return `🏆 Brilliant tactical strike! You successfully captured the ${capturedPiece}, gaining material advantage and putting significant pressure on your opponent in the ${phaseText}. This demonstrates excellent tactical awareness and calculation.`;
        }
        return `🏆 Outstanding move! You found the best continuation, creating a significant advantage through superior piece positioning and tactical vision. This move puts you in a commanding position.`;
    }

    if (entry.quality === 'Good') {
        if (entry.captured) {
            const capturedPiece = PIECE_NAMES[entry.captured];
            return `✅ Strong tactical play! You captured the ${capturedPiece} while maintaining good piece coordination and keeping the initiative in the ${phaseText}.`;
        }
        return `✅ Solid positional choice! You improved your piece activity and strengthened your position in the ${phaseText}. This move demonstrates good understanding of chess principles.`;
    }

    if (entry.quality === 'Neutral') {
        return `⚪ Reasonable move that maintains balance. While not the most ambitious, this keeps your position stable without creating major weaknesses in the ${phaseText}.`;
    }

    if (entry.quality === 'Bad') {
        let feedback = `⚠️ This move missed a better opportunity in the ${phaseText}. `;

        if (entry.captured) {
            const capturedPiece = PIECE_NAMES[entry.captured];
            feedback += `While you captured the ${capturedPiece}, this exchange actually weakens your position and gives your opponent the advantage. `;
        } else {
            feedback += `This move weakens your position by allowing your opponent to gain the initiative. `;
        }

        feedback += `You should look for moves that improve piece activity, control key squares, and maintain coordination between your pieces.`;

        return feedback;
    }

    if (entry.quality === 'Terrible') {
        let feedback = `❌ This was a critical mistake in the ${phaseText}. `;

        if (entry.captured) {
            const capturedPiece = PIECE_NAMES[entry.captured];
            feedback += `Losing the ${capturedPiece} here is devastating - this gives your opponent a decisive material advantage and severely damages your defensive structure. `;
        } else {
            feedback += `This move creates serious weaknesses in your position, allowing your opponent to launch a powerful attack or gain overwhelming positional advantage. `;
        }

        feedback += `This type of mistake can cost you the game. Always check for opponent threats before moving.`;

        return feedback;
    }

    return "Move analysis in progress...";
};

export const getRecommendation = (entry) => {
    if (entry.quality === 'Excellent') {
        if (entry.bestMissed) {
            const desc = describeMove(entry.bestMissed, entry.piece, entry.from, entry.to, entry.captured);
            if (desc) {
                return `Perfect execution! While ${entry.bestMissed} was also strong, your move was the absolute best. Keep analyzing positions this deeply!`;
            }
        }
        return `Excellent! This was the best move in the position. Continue looking for these game-changing opportunities that maximize your advantage!`;
    }

    if (entry.quality === 'Good') {
        if (entry.bestMissed) {
            const desc = describeMove(entry.bestMissed, entry.piece, entry.from, entry.to, entry.captured);
            if (desc) {
                return `Good move! To reach excellence, consider ${entry.bestMissed} - ${desc}. This would have created even more pressure on your opponent.`;
            }
        }
        if (entry.alternatives && entry.alternatives.length > 0) {
            const altMove = entry.alternatives[0];
            const altDesc = describeMove(altMove, entry.piece, entry.from, entry.to);
            if (altDesc) {
                return `Solid choice! For an even stronger position, you could have ${altDesc} with ${altMove}, creating additional threats.`;
            }
        }
        return `Good move! To improve further, look for moves that not only strengthen your position but also create concrete threats against your opponent.`;
    }

    if (entry.quality === 'Bad') {
        if (entry.bestMissed) {
            const desc = describeMove(entry.bestMissed, entry.piece, entry.from, entry.to, entry.captured);
            if (desc) {
                return `❌ What went wrong: This move allowed your opponent to seize the initiative. ✅ Better alternative: ${entry.bestMissed} - You should have ${desc} to maintain control and keep your pieces coordinated.`;
            }
        }

        if (entry.alternatives && entry.alternatives.length > 0) {
            const altMove = entry.alternatives[0];
            const altDesc = describeMove(altMove, entry.piece, entry.from, entry.to);
            if (altDesc) {
                return `❌ What went wrong: This weakened your position. ✅ Better alternative: Consider ${altMove} - ${altDesc} to maintain better piece coordination and defensive structure.`;
            }
            return `❌ What went wrong: This gave your opponent the advantage. ✅ Better alternative: ${altMove} would have kept your position solid.`;
        }

        return `❌ What went wrong: This move weakened your position. ✅ What to focus on: Look for moves that improve piece coordination, control key central squares, and don't leave pieces undefended.`;
    }

    if (entry.quality === 'Terrible') {
        if (entry.bestMissed) {
            const desc = describeMove(entry.bestMissed, entry.piece, entry.from, entry.to, entry.captured);
            if (desc) {
                return `❌ Critical error: This move handed your opponent a winning advantage by creating severe weaknesses. ✅ You needed: ${entry.bestMissed} - ${desc} to maintain defensive stability and keep the game competitive.`;
            }
        }

        if (entry.alternatives && entry.alternatives.length > 0) {
            const altMove = entry.alternatives[0];
            const altDesc = describeMove(altMove, entry.piece, entry.from, entry.to);
            if (altDesc) {
                return `❌ Critical error: This was a game-losing blunder. ✅ You needed: ${altMove} - ${altDesc} to avoid catastrophic material loss or positional collapse.`;
            }
            return `❌ Critical error: This severely damaged your position. ✅ You needed: ${altMove} to prevent your opponent from gaining a decisive advantage.`;
        }

        return `❌ Critical error: This was a devastating mistake. ✅ Key lesson: Always check what your opponent is threatening before moving. Protect your pieces and maintain defensive coordination.`;
    }

    return "Focus on moves that maintain or improve your position.";
};

export const getCapturedPieces = (moveHistory) => {
    const whiteCaptured = [];
    const blackCaptured = [];
    moveHistory.forEach(m => {
        if (m.captured) {
            if (m.player === 'human') {
                blackCaptured.push(m.captured);
            } else {
                whiteCaptured.push(m.captured);
            }
        }
    });
    return { white: whiteCaptured, black: blackCaptured };
};

export const generateEducationalExplanation = (fen, moveSan, pv = []) => {
    try {
        const game = new Chess(fen);
        const moves = game.moves({ verbose: true });
        const verboseMove = moves.find(m => m.san === moveSan);

        if (!verboseMove) return "Strategically positions pieces for long-term advantage.";

        const pieceName = PIECE_NAMES[verboseMove.piece];
        const isCapture = verboseMove.captured;
        const targetSquare = verboseMove.to;

        // Simulate the move
        const moveResult = game.move(moveSan);
        if (!moveResult) return "Prepares a complex tactical sequence.";

        const explanations = [];

        // 1. Immediate Strategic Goals
        if (game.inCheck()) {
            explanations.push(`By placing the opponent's King in **check**, this move seizes the immediate **initiative**, forcing a reactive response and disrupting their defensive coordination.`);
        }

        if (isCapture) {
            const capName = PIECE_NAMES[verboseMove.captured];
            explanations.push(`The capture of the **${capName}** significantly alters the material balance and simplifies the technical task, while often removing a key defender of the opponent's position.`);
        }

        // 2. Positional and Structural Analysis
        const centerSquares = ['d4', 'e4', 'd5', 'e5', 'c4', 'f4', 'c5', 'f5'];
        if (centerSquares.includes(targetSquare)) {
            explanations.push(`This move asserts **central dominance**, securing vital space and restricting the opponent's piece mobility. Control of the center is the cornerstone of a successful middlegame strategy.`);
        }

        const isDevelopment = (moveResult.color === 'w' && parseInt(moveResult.from[1]) <= 2 && parseInt(moveResult.to[1]) > 2) ||
            (moveResult.color === 'b' && parseInt(moveResult.from[1]) >= 7 && parseInt(moveResult.to[1]) < 7);

        if (isDevelopment && verboseMove.piece !== 'p') {
            explanations.push(`It prioritizes **harmonious development**, activating the ${pieceName} and preparing it for future operations while contributing to overall piece coordination.`);
        }

        // 3. Principal Variation (Future Sequence) Analysis
        if (pv && pv.length > 0) {
            const variation = pv.slice(0, 3).join(' → ');
            explanations.push(`Deep engine analysis reveals a powerful tactical sequence: **${variation}**. `);

            const lastMoveInPV = pv[pv.length - 1];
            if (lastMoveInPV && (lastMoveInPV.includes('x') || lastMoveInPV.includes('#'))) {
                explanations.push(`This line leads to a **decisive advantage**, preparing a crushing tactical blow or a critical breakthrough in the opponent's structure.`);
            } else {
                explanations.push(`This continuation ensures a **sustained positional squeeze**, gradually improving your standing while leaving the opponent with few active counter-chances.`);
            }
        }

        // 4. Strategic Nuance (Structure & Tempo)
        if (verboseMove.piece === 'p') {
            explanations.push(`This pawn thrust challenges the **central structure** and gains valuable space, potentially creating anchors for your minor pieces or opening lines for your heavy artillery.`);
        }

        if (explanations.length < 2) {
            explanations.push(`This is a high-level prophylaxis move that anticipates opponent threats while subtly improving your king safety and piece harmony.`);
        }

        return explanations.join(" ");
    } catch (e) {
        return "Executes a principled strategic plan based on deep positional calculation.";
    }
};
