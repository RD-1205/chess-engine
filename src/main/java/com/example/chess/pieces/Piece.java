package com.example.chess.pieces;

import com.example.chess.engine.Board;
import com.example.chess.engine.Color;
import com.example.chess.engine.Move;
import com.example.chess.engine.Position;

import java.util.List;

public abstract class Piece {

    protected final Color color;

    public Piece(Color color) {
        this.color = color;
    }

    public Color getColor() {
        return color;
    }
    protected boolean hasMoved = false;

public boolean hasMoved() {
    return hasMoved;
}

public void markMoved() {
    hasMoved = true;
}


    /**
     * Returns all legal moves this piece can make from a given position.
     */
    public abstract List<Move> getLegalMoves(Board board, Position from);
}
