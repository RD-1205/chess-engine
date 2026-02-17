package com.example.chess.engine;

import com.example.chess.engine.Position;

import com.example.chess.engine.Move;
import com.example.chess.pieces.Piece;


public class Board {
   
    private final Piece[][] board;

    public Board() {
        board = new Piece[8][8];
       
    }
public void clear() {
    for (int row = 0; row < 8; row++) {
        for (int col = 0; col < 8; col++) {
            setPiece(new Position(row, col), null);
        }
    }
}
    public Piece getPieceAt(int row, int col) {
    return getPiece(new Position(row, col));
}
    public Piece getPiece(Position position) {
        return board[position.row][position.col];
    }

   
    public void setPiece(Position position, Piece piece) {
        board[position.row][position.col] = piece;
    }

 
    public boolean isEmpty(Position position) {
        return getPiece(position) == null;
    }

  
    public void movePiece(Move move) {
        Piece piece = getPiece(move.from);
    setPiece(move.to, piece);
    setPiece(move.from, null);

    if(piece != null) {
        piece.markMoved();
    } 
    }
    public void printBoard() {
    System.out.println("  a b c d e f g h");
    for (int row = 0; row < 8; row++) {
        System.out.print((8 - row) + " ");
        for (int col = 0; col < 8; col++) {
            Piece piece = board[row][col];
            if (piece == null) {
                System.out.print(". ");
            } else {
                System.out.print(piece.getClass().getSimpleName().charAt(0) + " ");
            }
        }
        System.out.println();
    }
    System.out.println();
}

}
