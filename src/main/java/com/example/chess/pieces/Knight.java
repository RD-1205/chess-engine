package com.example.chess.pieces;
import com.example.chess.engine.Board;
import com.example.chess.engine.Color;
import com.example.chess.engine.Move;
import com.example.chess.engine.Position;

import java.util.ArrayList;
import java.util.List;
public class Knight extends Piece {
      private static final int[][] OFFSETS = {
        {-2, -1}, {-2, 1},
        {-1, -2}, {-1, 2},
        {1, -2},  {1, 2},
        {2, -1},  {2, 1}
    };

    public Knight(Color color) {
        super(color);
    }

    @Override
    public List<Move> getLegalMoves(Board board, Position from) {
        List<Move> moves = new ArrayList<>();

        for (int[] offset : OFFSETS) {
            int newRow = from.row + offset[0];
            int newCol = from.col + offset[1];

            Position target = new Position(newRow, newCol);

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

        return moves;
    }
}
