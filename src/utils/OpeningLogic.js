import { CHESS_OPENINGS } from '../data/openings';

/**
 * Identifies the current opening based on move history.
 * @param {Array} history - Array of move objects or SAN strings
 * @returns {Object|null} - The identified opening object or null
 */
export const identifyOpening = (history) => {
    if (!history || history.length === 0) return null;

    // Convert history objects to simple SAN array if needed
    const moves = history.map(m => typeof m === 'string' ? m : m.move);

    // Sort openings by depth (longest match first) to find most specific variation
    const sortedOpenings = [...CHESS_OPENINGS].sort((a, b) => b.moves.length - a.moves.length);

    for (const opening of sortedOpenings) {
        if (isMatch(moves, opening.moves)) {
            return opening;
        }
    }

    return null;
};

/**
 * Checks if the current game moves match an opening sequence
 */
const isMatch = (gameMoves, openingMoves) => {
    if (gameMoves.length < openingMoves.length) {
        // Potential match (transposition or incomplete), but for now we look for exact prefix match in history
        // Actually, if game is shorter than opening, we can't call it that opening yet.
        return false;
    }

    for (let i = 0; i < openingMoves.length; i++) {
        if (gameMoves[i] !== openingMoves[i]) {
            return false;
        }
    }
    return true;
};

/**
 * Gets candidate moves for the current position from the database
 */
// Helper for basic move strategy comments
const getStrategy = (san, index) => {
    if (index === 0) {
        if (san === 'e4') return { pros: 'Best command of center', cons: 'Weakens d4, f4' };
        if (san === 'd4') return { pros: 'Solid, protected', cons: 'Less dynamic than e4' };
        if (san === 'Nf3') return { pros: 'Flexible deployment', cons: 'Allows Black options' };
        if (san === 'c4') return { pros: 'Imbalance (English)', cons: 'Slower development' };
    }
    return { pros: 'Standard book move', cons: null };
};

export const getBookMoves = (history) => {
    const moves = history.map(m => typeof m === 'string' ? m : m.move);

    // Find openings that start with the current sequence
    const candidates = CHESS_OPENINGS.filter(op => {
        if (op.moves.length <= moves.length) return false;
        for (let i = 0; i < moves.length; i++) {
            if (op.moves[i] !== moves[i]) return false;
        }
        return true;
    });

    // Group by next move
    const moveMap = new Map();

    candidates.forEach(op => {
        const nextMove = op.moves[moves.length];
        if (!moveMap.has(nextMove)) {
            moveMap.set(nextMove, {
                mainOpening: op,
                count: 1,
                variations: [op.name]
            });
        } else {
            const data = moveMap.get(nextMove);
            data.count++;
            data.variations.push(op.name);
            // Prefer the opening that exactly matches the sequence length if possible, or shortest
            if (op.moves.length === moves.length + 1) {
                data.mainOpening = op;
            } else if (op.moves.length < data.mainOpening.moves.length) {
                data.mainOpening = op;
            }
        }
    });

    return Array.from(moveMap.entries()).map(([san, data]) => {
        const strat = getStrategy(san, moves.length);
        return {
            san,
            opening: data.mainOpening.name,
            description: data.mainOpening.description,
            variationCount: data.count,
            pros: strat.pros,
            cons: strat.cons
        };
    });
};
