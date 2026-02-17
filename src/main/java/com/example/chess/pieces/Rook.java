package com.example.chess.pieces;

import com.example.chess.engine.Board;
import com.example.chess.engine.Color;
import com.example.chess.engine.Move;
import com.example.chess.engine.Position;

import java.util.ArrayList;
import java.util.List;

public class Rook extends Piece {
     private static final int[][] DIRECTIONS = {
        {-1, 0}, 
        {1, 0}, 
        {0, -1}, 
        {0, 1}   
    };

    public Rook(Color color) {
        super(color);
    }

    @Override
    public List<Move> getLegalMoves(Board board, Position from) {
        List<Move> moves = new ArrayList<>();

        for (int[] dir : DIRECTIONS) {
            int row = from.row + dir[0];
            int col = from.col + dir[1];

            while (true) {
                Position target = new Position(row, col);

                if (!target.isValid()) {
                    break;
                }

                if (board.isEmpty(target)) {
                    moves.add(new Move(from, target));
                } else {
                    if (board.getPiece(target).getColor() != color) {
                        moves.add(new Move(from, target));
                    }
                    break; 
                }

                row += dir[0];
                col += dir[1];
            }
        }

        return moves;
    }
}

