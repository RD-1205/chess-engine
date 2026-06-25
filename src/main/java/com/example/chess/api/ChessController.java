package com.example.chess.api;

import com.example.chess.ChessAI;
import com.example.chess.Game;
import com.example.chess.api.dto.MoveDTO;
import com.example.chess.api.dto.GameStateDTO;
import com.example.chess.engine.Color;
import com.example.chess.engine.Position;
import com.example.chess.engine.Move;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/chess")
@CrossOrigin(origins = "*")
public class ChessController {
    
    private final Map<String, Game> activeGames = new ConcurrentHashMap<>();
    
    @PostMapping("/game/new")
    public ResponseEntity<Map<String, String>> newGame() {
        String gameId = UUID.randomUUID().toString();
        Game game = new Game();
        activeGames.put(gameId, game);
        
        Map<String, String> response = new HashMap<>();
        response.put("gameId", gameId);
        response.put("message", "New game created successfully");
        
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/game/{gameId}/state")
    public ResponseEntity<?> getGameState(@PathVariable String gameId) {
        Game game = activeGames.get(gameId);
        
        if (game == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("error", "Game not found"));
        }
        
        GameStateDTO state = new GameStateDTO(game);
        return ResponseEntity.ok(state);
    }
    
    @PostMapping("/game/{gameId}/move")
    public ResponseEntity<?> makeMove(
            @PathVariable String gameId,
            @RequestBody MoveDTO moveDTO) {
        
        Game game = activeGames.get(gameId);
        
        if (game == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("error", "Game not found"));
        }
        
        try {
            Position from = new Position(moveDTO.getFromRow(), moveDTO.getFromCol());
            Position to = new Position(moveDTO.getToRow(), moveDTO.getToCol());
            Move move = new Move(from, to);
            
            boolean success = game.makeMove(move);
            
            if (!success) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Invalid move"));
            }
            
            GameStateDTO state = new GameStateDTO(game);
            return ResponseEntity.ok(state);
            
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Invalid move: " + e.getMessage()));
        }
    }
    
    @GetMapping("/game/{gameId}/valid-moves")
    public ResponseEntity<?> getValidMoves(
            @PathVariable String gameId,
            @RequestParam int row,
            @RequestParam int col) {
        
        Game game = activeGames.get(gameId);
        
        if (game == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("error", "Game not found"));
        }
        
        try {
            Position position = new Position(row, col);
            List<Position> validMoves = game.getValidMoves(position);
            
            return ResponseEntity.ok(Map.of("validMoves", validMoves));
            
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", e.getMessage()));
        }
    }
    
    @PostMapping("/game/{gameId}/reset")
    public ResponseEntity<?> resetGame(@PathVariable String gameId) {
        Game game = activeGames.get(gameId);
        
        if (game == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("error", "Game not found"));
        }
        
        game.reset();
        GameStateDTO state = new GameStateDTO(game);
        
        return ResponseEntity.ok(state);
    }
    
    @PostMapping("/game/{gameId}/ai-move")
    public ResponseEntity<?> makeAIMove(
            @PathVariable String gameId,
            @RequestParam(defaultValue = "BLACK") String color) {

        Game game = activeGames.get(gameId);
        if (game == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("error", "Game not found"));
        }

        Color aiColor = "WHITE".equalsIgnoreCase(color) ? Color.WHITE : Color.BLACK;
        ChessAI ai    = new ChessAI(3); // depth-3 minimax with alpha-beta pruning

        Move bestMove = ai.findBestMove(game, aiColor);
        if (bestMove == null) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "No legal moves available for " + color));
        }

        boolean success = game.makeMove(bestMove);
        if (!success) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "AI selected an invalid move — this should not happen"));
        }

        return ResponseEntity.ok(new GameStateDTO(game));
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        Map<String, Object> health = new HashMap<>();
        health.put("status", "UP");
        health.put("activeGames", activeGames.size());
        health.put("timestamp", System.currentTimeMillis());
        
        return ResponseEntity.ok(health);
    }
}