package com.example.chess.api.dto;

import com.example.chess.pieces.Piece;

public class PieceDTO {
    private String type;
    private String color;
    
    public PieceDTO() {}
    
    public PieceDTO(Piece piece) {
        this.type = piece.getClass().getSimpleName().toUpperCase();
        this.color = piece.getColor().toString();
    }
    
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    
    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }
}