package com.example.chess.pieces;

import com.example.chess.engine.Board;
import com.example.chess.engine.Color;
import com.example.chess.engine.Move;
import com.example.chess.engine.Position;

import java.util.ArrayList;
import java.util.List;

public class King extends Piece {
     private static final int[][] OFFSETS = {
        {-1, -1}, {-1, 0}, {-1, 1},
        { 0, -1},          { 0, 1},
        { 1, -1}, { 1, 0}, { 1, 1}
    };

    public King(Color color) {
        super(color);
    }

    @Override
    public List<Move> getLegalMoves(Board board, Position from) {
        List<Move> moves = new ArrayList<>();

        for (int[] offset : OFFSETS) {
            Position target = new Position(
                from.row + offset[0],
                from.col + offset[1]
            );

            if (!target.isValid()) {
                continue;
            }

            if (board.isEmpty(target)) {
                moves.add(new Move(from, target));
            } else {
                if (board.getPiece(target).getColor() != color) {
                    moves.add(new Move(from, target));
                }
            }
            
        }
addCastlingMoves(board, from, moves);

        return moves;
    }
    private void addCastlingMoves(Board board, Position from, List<Move> moves) {
    if (hasMoved) return;

    int row = from.row;

  
    Position rookPosKingSide = new Position(row, 7);
    if (canCastle(board, from, rookPosKingSide, 1)) {
        moves.add(new Move(from, new Position(row, from.col + 2)));
    }

    
    Position rookPosQueenSide = new Position(row, 0);
    if (canCastle(board, from, rookPosQueenSide, -1)) {
        moves.add(new Move(from, new Position(row, from.col - 2)));
    }
}
private boolean canCastle(Board board, Position kingPos, Position rookPos, int direction) {
    if (!rookPos.isValid()) return false;

    var rook = board.getPiece(rookPos);
    if (!(rook instanceof com.example.chess.pieces.Rook)) return false;
    if (rook.getColor() != color || rook.hasMoved()) return false;

    // Squares between king and rook must be empty
    int col = kingPos.col + direction;
    while (col != rookPos.col) {
        if (!board.isEmpty(new Position(kingPos.row, col))) {
            return false;
        }
        col += direction;
    }

    return true;
}
}
