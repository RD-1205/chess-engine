package com.example.chess;

import com.example.chess.engine.Board;
import com.example.chess.engine.Color;
import com.example.chess.engine.Move;
import com.example.chess.engine.Position;
import com.example.chess.pieces.*;

import java.util.List;

public class Game {

    private final Board board;
    private Color currentTurn;
    private boolean gameOver;
    private Color winner;

    public Game() {
        this.board = new Board();
        this.currentTurn = Color.WHITE;
        this.gameOver = false;
        this.winner = null;
        setupInitialPosition();
    }

    public Board getBoard() {
        return board;
    }

    // API needs getCurrentPlayer() not getCurrentTurn()
    public Color getCurrentPlayer() {
        return currentTurn;
    }

    public Color getCurrentTurn() {
        return currentTurn;
    }

    public boolean isGameOver() {
        return gameOver;
    }

    public Color getWinner() {
        return winner;
    }

    // API needs this method
    public boolean isInCheck() {
        return isInCheck(currentTurn);
    }

    // API needs this method
    public boolean isCheckmate() {
        if (!isInCheck(currentTurn)) {
            return false;
        }
        return !hasAnyLegalMoves(currentTurn);
    }

    // API needs this method
    public boolean isStalemate() {
        if (isInCheck(currentTurn)) {
            return false;
        }
        return !hasAnyLegalMoves(currentTurn);
    }

    // API needs makeMove(Move) not makeMove(Position, Position)
    public boolean makeMove(Move move) {
        return makeMove(move.from, move.to);
    }

    // API needs getValidMoves(Position) not getLegalMoves(Position)
    public List<Position> getValidMoves(Position position) {
        return getLegalMoves(position);
    }

    // API needs reset()
    public void reset() {
        board.clear();
        currentTurn = Color.WHITE;
        gameOver = false;
        winner = null;
        setupInitialPosition();
    }

    public boolean makeMove(Position from, Position to) {
        Piece piece = board.getPiece(from);

        if (piece == null) {
            return false;
        }

        if (piece.getColor() != currentTurn) {
            return false;
        }

        Move chosenMove = null;
        for (Move move : piece.getLegalMoves(board, from)) {
            if (move.to.equals(to)) {
                chosenMove = move;
                break;
            }
        }

        if (chosenMove == null) {
            return false;
        }

        Piece captured = makeTemporaryMove(chosenMove);
        boolean illegal = isInCheck(currentTurn);
        undoTemporaryMove(chosenMove, captured);

        if (illegal) {
            return false;
        }

        if (piece instanceof com.example.chess.pieces.King &&
            Math.abs(to.col - from.col) == 2) {

            int row = from.row;

            if (to.col > from.col) {
                Position rookFrom = new Position(row, 7);
                Position rookTo = new Position(row, 5);
                board.movePiece(new Move(rookFrom, rookTo));
            } else {
                Position rookFrom = new Position(row, 0);
                Position rookTo = new Position(row, 3);
                board.movePiece(new Move(rookFrom, rookTo));
            }
        }
        
        board.movePiece(chosenMove);
        handlePromotion(to);
        currentTurn = (currentTurn == Color.WHITE) ? Color.BLACK : Color.WHITE;

        // Check for game over
        if (isCheckmate()) {
            gameOver = true;
            winner = (currentTurn == Color.WHITE) ? Color.BLACK : Color.WHITE;
        } else if (isStalemate()) {
            gameOver = true;
            winner = null;
        }

        return true;
    }

    public List<Position> getLegalMoves(Position from) {
        Piece piece = board.getPiece(from);

        if (piece == null || piece.getColor() != currentTurn) {
            return List.of();
        }

        List<Position> result = new java.util.ArrayList<>();
        List<Move> moves = piece.getLegalMoves(board, from);

        if (moves == null) return List.of();

        for (Move move : moves) {
            result.add(move.to);
        }

        return result;
    }

    public Piece getPieceAt(Position position) {
        return board.getPiece(position);
    }

    public Piece[][] getBoardInstance() {
        Piece[][] instance = new Piece[8][8];

        for (int row = 0; row < 8; row++) {
            for (int col = 0; col < 8; col++) {
                instance[row][col] = board.getPiece(new Position(row, col));
            }
        }

        return instance;
    }

    private Position findKing(Color color) {
        for (int row = 0; row < 8; row++) {
            for (int col = 0; col < 8; col++) {
                Position pos = new Position(row, col);
                var piece = board.getPiece(pos);

                if (piece instanceof King && piece.getColor() == color) {
                    return pos;
                }
            }
        }
        return null;
    }

    public boolean isInCheck(Color color) {
        Position kingPos = findKing(color);
        if (kingPos == null) {
            throw new IllegalStateException("King not found for " + color);
        }

        Color opponent = (color == Color.WHITE) ? Color.BLACK : Color.WHITE;

        for (int row = 0; row < 8; row++) {
            for (int col = 0; col < 8; col++) {
                Position pos = new Position(row, col);
                var piece = board.getPiece(pos);

                if (piece == null || piece.getColor() != opponent) {
                    continue;
                }

                for (Move move : piece.getLegalMoves(board, pos)) {
                    if (move.to.equals(kingPos)) {
                        return true;
                    }
                }
            }
        }

        return false;
    }

    private boolean hasAnyLegalMoves(Color color) {
        for (int row = 0; row < 8; row++) {
            for (int col = 0; col < 8; col++) {
                Position pos = new Position(row, col);
                Piece piece = board.getPiece(pos);

                if (piece == null || piece.getColor() != color) {
                    continue;
                }

                for (Move move : piece.getLegalMoves(board, pos)) {
                    Piece captured = makeTemporaryMove(move);
                    boolean inCheck = isInCheck(color);
                    undoTemporaryMove(move, captured);

                    if (!inCheck) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    private void setupInitialPosition() {
        for (int col = 0; col < 8; col++) {
            board.setPiece(new Position(6, col), new Pawn(Color.WHITE));
            board.setPiece(new Position(1, col), new Pawn(Color.BLACK));
        }

        board.setPiece(new Position(7, 0), new Rook(Color.WHITE));
        board.setPiece(new Position(7, 7), new Rook(Color.WHITE));
        board.setPiece(new Position(0, 0), new Rook(Color.BLACK));
        board.setPiece(new Position(0, 7), new Rook(Color.BLACK));

        board.setPiece(new Position(7, 1), new Knight(Color.WHITE));
        board.setPiece(new Position(7, 6), new Knight(Color.WHITE));
        board.setPiece(new Position(0, 1), new Knight(Color.BLACK));
        board.setPiece(new Position(0, 6), new Knight(Color.BLACK));

        board.setPiece(new Position(7, 2), new Bishop(Color.WHITE));
        board.setPiece(new Position(7, 5), new Bishop(Color.WHITE));
        board.setPiece(new Position(0, 2), new Bishop(Color.BLACK));
        board.setPiece(new Position(0, 5), new Bishop(Color.BLACK));

        board.setPiece(new Position(7, 3), new Queen(Color.WHITE));
        board.setPiece(new Position(0, 3), new Queen(Color.BLACK));

        board.setPiece(new Position(7, 4), new King(Color.WHITE));
        board.setPiece(new Position(0, 4), new King(Color.BLACK));
    }

    private Piece makeTemporaryMove(Move move) {
        Piece captured = board.getPiece(move.to);
        board.movePiece(move);
        return captured;
    }

    private void undoTemporaryMove(Move move, Piece captured) {
        Piece piece = board.getPiece(move.to);
        board.setPiece(move.from, piece);
        board.setPiece(move.to, captured);
    }

    private void handlePromotion(Position to) {
        Piece piece = board.getPiece(to);

        if (!(piece instanceof Pawn)) {
            return;
        }

        if (piece.getColor() == Color.WHITE && to.row == 0) {
            board.setPiece(to, new Queen(Color.WHITE));
        }

        if (piece.getColor() == Color.BLACK && to.row == 7) {
            board.setPiece(to, new Queen(Color.BLACK));
        }
    }
}