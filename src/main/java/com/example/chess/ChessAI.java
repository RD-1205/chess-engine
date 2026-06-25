package com.example.chess;

import com.example.chess.engine.Color;
import com.example.chess.engine.Move;
import com.example.chess.pieces.*;

import java.util.List;

/**
 * Chess AI using minimax with alpha-beta pruning.
 *
 * Evaluation = material balance + piece-square table bonuses,
 * always from the perspective of the AI's colour (positive = good for AI).
 *
 * Default search depth: 3 half-moves (ply).  Alpha-beta pruning typically
 * reduces the effective branching factor from ~30 to ~10, keeping
 * response time well under a second for middlegame positions.
 */
public class ChessAI {

    // ── Piece values (centipawns) ────────────────────────────────────────────
    private static final int PAWN_VALUE   =   100;
    private static final int KNIGHT_VALUE =   320;
    private static final int BISHOP_VALUE =   330;
    private static final int ROOK_VALUE   =   500;
    private static final int QUEEN_VALUE  =   900;
    private static final int KING_VALUE   = 20000;

    // ── Piece-square tables (white's perspective; row 0 = rank 8) ───────────
    // For black pieces the table is mirrored by flipping the row index.
    private static final int[][] PAWN_TABLE = {
        {  0,  0,  0,  0,  0,  0,  0,  0 },
        { 50, 50, 50, 50, 50, 50, 50, 50 },
        { 10, 10, 20, 30, 30, 20, 10, 10 },
        {  5,  5, 10, 25, 25, 10,  5,  5 },
        {  0,  0,  0, 20, 20,  0,  0,  0 },
        {  5, -5,-10,  0,  0,-10, -5,  5 },
        {  5, 10, 10,-20,-20, 10, 10,  5 },
        {  0,  0,  0,  0,  0,  0,  0,  0 }
    };

    private static final int[][] KNIGHT_TABLE = {
        {-50,-40,-30,-30,-30,-30,-40,-50 },
        {-40,-20,  0,  0,  0,  0,-20,-40 },
        {-30,  0, 10, 15, 15, 10,  0,-30 },
        {-30,  5, 15, 20, 20, 15,  5,-30 },
        {-30,  0, 15, 20, 20, 15,  0,-30 },
        {-30,  5, 10, 15, 15, 10,  5,-30 },
        {-40,-20,  0,  5,  5,  0,-20,-40 },
        {-50,-40,-30,-30,-30,-30,-40,-50 }
    };

    private static final int[][] BISHOP_TABLE = {
        {-20,-10,-10,-10,-10,-10,-10,-20 },
        {-10,  0,  0,  0,  0,  0,  0,-10 },
        {-10,  0,  5, 10, 10,  5,  0,-10 },
        {-10,  5,  5, 10, 10,  5,  5,-10 },
        {-10,  0, 10, 10, 10, 10,  0,-10 },
        {-10, 10, 10, 10, 10, 10, 10,-10 },
        {-10,  5,  0,  0,  0,  0,  5,-10 },
        {-20,-10,-10,-10,-10,-10,-10,-20 }
    };

    private static final int[][] ROOK_TABLE = {
        {  0,  0,  0,  0,  0,  0,  0,  0 },
        {  5, 10, 10, 10, 10, 10, 10,  5 },
        { -5,  0,  0,  0,  0,  0,  0, -5 },
        { -5,  0,  0,  0,  0,  0,  0, -5 },
        { -5,  0,  0,  0,  0,  0,  0, -5 },
        { -5,  0,  0,  0,  0,  0,  0, -5 },
        { -5,  0,  0,  0,  0,  0,  0, -5 },
        {  0,  0,  0,  5,  5,  0,  0,  0 }
    };

    private static final int[][] QUEEN_TABLE = {
        {-20,-10,-10, -5, -5,-10,-10,-20 },
        {-10,  0,  0,  0,  0,  0,  0,-10 },
        {-10,  0,  5,  5,  5,  5,  0,-10 },
        { -5,  0,  5,  5,  5,  5,  0, -5 },
        {  0,  0,  5,  5,  5,  5,  0, -5 },
        {-10,  5,  5,  5,  5,  5,  0,-10 },
        {-10,  0,  5,  0,  0,  0,  0,-10 },
        {-20,-10,-10, -5, -5,-10,-10,-20 }
    };

    private static final int[][] KING_TABLE = {
        {-30,-40,-40,-50,-50,-40,-40,-30 },
        {-30,-40,-40,-50,-50,-40,-40,-30 },
        {-30,-40,-40,-50,-50,-40,-40,-30 },
        {-30,-40,-40,-50,-50,-40,-40,-30 },
        {-20,-30,-30,-40,-40,-30,-30,-20 },
        {-10,-20,-20,-20,-20,-20,-20,-10 },
        { 20, 20,  0,  0,  0,  0, 20, 20 },
        { 20, 30, 10,  0,  0, 10, 30, 20 }
    };

    private final int depth;

    public ChessAI(int depth) {
        this.depth = depth;
    }

    // ── Public entry point ───────────────────────────────────────────────────

    /**
     * Finds the best move for {@code aiColor} in the given game position.
     * Returns null only when the position is already checkmate or stalemate.
     */
    public Move findBestMove(Game game, Color aiColor) {
        List<Move> moves = game.getAllLegalMovesForColor(aiColor);
        if (moves.isEmpty()) return null;

        Move bestMove    = null;
        int  bestScore   = Integer.MIN_VALUE;
        Color opponent   = opponent(aiColor);

        for (Move move : moves) {
            Piece captured = game.applyMoveForSearch(move);
            game.setCurrentTurn(opponent);

            int score = -negamax(game, depth - 1, Integer.MIN_VALUE + 1, Integer.MAX_VALUE, opponent, aiColor);

            game.setCurrentTurn(aiColor);
            game.undoMoveForSearch(move, captured);

            if (score > bestScore) {
                bestScore = score;
                bestMove  = move;
            }
        }

        return bestMove;
    }

    // ── Negamax with alpha-beta pruning ──────────────────────────────────────

    /**
     * Negamax variant of alpha-beta: always returns the score from the
     * perspective of {@code currentColor} (positive = good for currentColor).
     *
     * {@code aiColor} is carried through solely for the leaf evaluation,
     * which is always framed from the AI's perspective and then flipped
     * as we unwind the recursion.
     */
    private int negamax(Game game, int depth, int alpha, int beta, Color currentColor, Color aiColor) {
        if (depth == 0) {
            int eval = evaluate(game, aiColor);
            return (currentColor == aiColor) ? eval : -eval;
        }

        List<Move> moves = game.getAllLegalMovesForColor(currentColor);

        if (moves.isEmpty()) {
            if (game.isInCheck(currentColor)) {
                // Checkmate — worst possible outcome for currentColor.
                // Scale by depth so the AI prefers faster mates.
                return -100_000 - depth;
            }
            return 0; // Stalemate — draw
        }

        Color next = opponent(currentColor);
        int best = Integer.MIN_VALUE + 1;

        for (Move move : moves) {
            Piece captured = game.applyMoveForSearch(move);
            game.setCurrentTurn(next);

            int score = -negamax(game, depth - 1, -beta, -alpha, next, aiColor);

            game.setCurrentTurn(currentColor);
            game.undoMoveForSearch(move, captured);

            if (score > best)  best  = score;
            if (score > alpha) alpha = score;
            if (alpha >= beta) break; // Beta cut-off
        }

        return best;
    }

    // ── Static evaluation ────────────────────────────────────────────────────

    /**
     * Evaluates the board from {@code aiColor}'s perspective.
     * Positive = good for AI, negative = good for opponent.
     */
    private int evaluate(Game game, Color aiColor) {
        int score = 0;
        for (int row = 0; row < 8; row++) {
            for (int col = 0; col < 8; col++) {
                Piece piece = game.getBoard().getPieceAt(row, col);
                if (piece == null) continue;

                int pieceScore = materialValue(piece) + positionalBonus(piece, row, col);
                score += (piece.getColor() == aiColor) ? pieceScore : -pieceScore;
            }
        }
        return score;
    }

    private int materialValue(Piece piece) {
        if (piece instanceof Pawn)   return PAWN_VALUE;
        if (piece instanceof Knight) return KNIGHT_VALUE;
        if (piece instanceof Bishop) return BISHOP_VALUE;
        if (piece instanceof Rook)   return ROOK_VALUE;
        if (piece instanceof Queen)  return QUEEN_VALUE;
        if (piece instanceof King)   return KING_VALUE;
        return 0;
    }

    /**
     * Looks up the piece-square table bonus.
     * White uses the table as-is (row 0 = black's back rank = most advanced for white).
     * Black mirrors the table by flipping the row index.
     */
    private int positionalBonus(Piece piece, int row, int col) {
        int r = (piece.getColor() == Color.WHITE) ? row : (7 - row);
        if (piece instanceof Pawn)   return PAWN_TABLE[r][col];
        if (piece instanceof Knight) return KNIGHT_TABLE[r][col];
        if (piece instanceof Bishop) return BISHOP_TABLE[r][col];
        if (piece instanceof Rook)   return ROOK_TABLE[r][col];
        if (piece instanceof Queen)  return QUEEN_TABLE[r][col];
        if (piece instanceof King)   return KING_TABLE[r][col];
        return 0;
    }

    // ── Utility ──────────────────────────────────────────────────────────────

    private static Color opponent(Color color) {
        return (color == Color.WHITE) ? Color.BLACK : Color.WHITE;
    }
}
