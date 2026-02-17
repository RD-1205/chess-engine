package com.example.chess.engine;

public class Move {

    public final Position from;
    public final Position to;

    public Move(Position from, Position to) {
        this.from = from;
        this.to = to;
    }
}
