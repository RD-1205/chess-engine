package com.example.chess.pieces;
import com.example.chess.engine.Board;
import com.example.chess.engine.Color;
import com.example.chess.engine.Move;
import com.example.chess.engine.Position;
import java.util.ArrayList;
import java.util.List;

public class Pawn extends Piece {
    public Pawn(Color color) {
        super(color);
    }

    @Override
    public List<Move> getLegalMoves(Board board, Position from) {
        List<Move> moves = new ArrayList<>();

        // Direction depends on color
        int direction;
        if (color == Color.WHITE) {
            direction = -1;
        } else {
            direction = 1;
        }
        int startRow = (color == Color.WHITE) ? 6 : 1;


        // One square forward
        Position forward = new Position(from.row + direction, from.col);

        if (forward.isValid() && board.isEmpty(forward)) {
            moves.add(new Move(from, forward));
        }
        // Two squares forward on first move
        Position twoForward = new Position(from.row + 2 * direction, from.col);

        if (from.row == startRow &&
        forward.isValid() &&
        board.isEmpty(forward) &&
        twoForward.isValid() &&
        board.isEmpty(twoForward)) {

    moves.add(new Move(from, twoForward));
}
// Diagonal captures
Position diagLeft = new Position(from.row + direction, from.col - 1);
Position diagRight = new Position(from.row + direction, from.col + 1);

if (diagLeft.isValid() && !board.isEmpty(diagLeft)) {
    if (board.getPiece(diagLeft).getColor() != color) {
        moves.add(new Move(from, diagLeft));
    }
}

if (diagRight.isValid() && !board.isEmpty(diagRight)) {
    if (board.getPiece(diagRight).getColor() != color) {
        moves.add(new Move(from, diagRight));
    }
}


        return moves;
    }
    public boolean isPromotionRank(Position position) {
    if (color == Color.WHITE) {
        return position.row == 0;
    } else {
        return position.row == 7;
    }
}

    
}
