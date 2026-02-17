package com.example.chess.api.dto;

import com.example.chess.Game;
import com.example.chess.engine.Board;
import com.example.chess.pieces.Piece;

public class GameStateDTO {
    private PieceDTO[][] board;
    private String currentPlayer;
    private boolean gameOver;
    private String winner;
    private boolean check;
    private boolean checkmate;
    private boolean stalemate;
    
    public GameStateDTO() {}
    
    public GameStateDTO(Game game) {
        this.board = convertBoard(game.getBoard());
        this.currentPlayer = game.getCurrentPlayer().toString();
        this.gameOver = game.isGameOver();
        this.winner = game.getWinner() != null ? game.getWinner().toString() : null;
        this.check = game.isInCheck();
        this.checkmate = game.isCheckmate();
        this.stalemate = game.isStalemate();
    }
    
    private PieceDTO[][] convertBoard(Board board) {
        PieceDTO[][] pieceBoard = new PieceDTO[8][8];
        
        for (int row = 0; row < 8; row++) {
            for (int col = 0; col < 8; col++) {
                Piece piece = board.getPieceAt(row, col);
                if (piece != null) {
                    pieceBoard[row][col] = new PieceDTO(piece);
                } else {
                    pieceBoard[row][col] = null;
                }
            }
        }
        
        return pieceBoard;
    }
    
    public PieceDTO[][] getBoard() { return board; }
    public void setBoard(PieceDTO[][] board) { this.board = board; }
    
    public String getCurrentPlayer() { return currentPlayer; }
    public void setCurrentPlayer(String currentPlayer) { this.currentPlayer = currentPlayer; }
    
    public boolean isGameOver() { return gameOver; }
    public void setGameOver(boolean gameOver) { this.gameOver = gameOver; }
    
    public String getWinner() { return winner; }
    public void setWinner(String winner) { this.winner = winner; }
    
    public boolean isCheck() { return check; }
    public void setCheck(boolean check) { this.check = check; }
    
    public boolean isCheckmate() { return checkmate; }
    public void setCheckmate(boolean checkmate) { this.checkmate = checkmate; }
    
    public boolean isStalemate() { return stalemate; }
    public void setStalemate(boolean stalemate) { this.stalemate = stalemate; }
}