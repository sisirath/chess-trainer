// Common Chess Openings Database
// Format: 
// name: Name of the opening
// moves: Array of SAN moves defining the opening
// description: Brief explanation of the opening's idea

export const CHESS_OPENINGS = [
    // --- King's Pawn Games (1. e4) ---
    {
        name: "Italian Game",
        moves: ["e4", "e5", "Nf3", "Nc6", "Bc4"],
        description: "Controls the center and attacks the weak f7 square."
    },
    {
        name: "Ruy Lopez (Spanish Game)",
        moves: ["e4", "e5", "Nf3", "Nc6", "Bb5"],
        description: "One of the oldest and most popular openings, putting pressure on black's center."
    },
    {
        name: "Sicilian Defense",
        moves: ["e4", "c5"],
        description: "A combative response to 1.e4, fighting for the center from the flank."
    },
    {
        name: "French Defense",
        moves: ["e4", "e6"],
        description: "A solid and resilient defense, aiming to counter-attack later."
    },
    {
        name: "Caro-Kann Defense",
        moves: ["e4", "c6"],
        description: "Extremely solid and hard to crack defense for Black."
    },
    {
        name: "Scandinavian Defense",
        moves: ["e4", "d5"],
        description: "Immediate challenge to White's center pawn."
    },
    {
        name: "Two Knights Defense",
        moves: ["e4", "e5", "Nf3", "Nc6", "Bc4", "Nf6"],
        description: "A sharp counter-attacking line against the Italian Game."
    },

    // --- Queen's Pawn Games (1. d4) ---
    {
        name: "Queen's Gambit",
        moves: ["d4", "d5", "c4"],
        description: "White sacrifices a wing pawn to gain better control of the center."
    },
    {
        name: "King's Indian Defense",
        moves: ["d4", "Nf6", "c4", "g6"],
        description: "Hypermodern defense where Black allows White to build a center to attack it later."
    },
    {
        name: "London System",
        moves: ["d4", "d5", "Nf3", "Nf6", "Bf4"],
        description: "A solid, schematic system for White that is easy to learn."
    },
    {
        name: "Slav Defense",
        moves: ["d4", "d5", "c4", "c6"],
        description: "Solid defense supporting the d5 pawn without blocking the light-squared bishop."
    },

    // --- Flank Openings ---
    {
        name: "English Opening",
        moves: ["c4"],
        description: "Controls the center (d5) from the flank, often leading to positional games."
    },
    {
        name: "Reti Opening",
        moves: ["Nf3"],
        description: "Flexible opening controlling the center from a distance."
    },
    {
        name: "King's Fianchetto",
        moves: ["g3"],
        description: "Prepares to fianchetto the bishop to control long diagonal."
    },
    {
        name: "Nimzo-Larsen Attack",
        moves: ["b3"],
        description: "A hypermodern opening starting with a fianchetto."
    },
    {
        name: "Bird's Opening",
        moves: ["f4"],
        description: "Aggressive flank opening controlling e5."
    },
    {
        name: "King's Pawn Game",
        moves: ["e4"],
        description: "The most popular opening move, controlling the center."
    },
    {
        name: "Queen's Pawn Game",
        moves: ["d4"],
        description: "Solid opening move, controlling the center and protected by the Queen."
    }
];
