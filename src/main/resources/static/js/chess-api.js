/* ═══════════════════════════════════════════════════
   Chess API  –  HTTP wrapper for the Spring backend
═══════════════════════════════════════════════════ */
class ChessAPI {
    constructor() {
        this.baseURL = window.location.origin;
        this.gameId  = localStorage.getItem('currentGameId') || null;
    }

    /* ── Low-level fetch ── */
    async request(endpoint, options = {}) {
        const url    = `${this.baseURL}/api/chess${endpoint}`;
        const config = { headers: { 'Content-Type': 'application/json' }, ...options };
        const resp   = await fetch(url, config);
        if (!resp.ok) {
            const err = await resp.json().catch(() => ({}));
            throw new Error(err.error || `HTTP ${resp.status}`);
        }
        return resp.json();
    }

    /* ── Connection ── */
    async checkHealth() {
        return this.request('/health');
    }

    /* ── Game lifecycle ── */
    async createNewGame() {
        const data = await this.request('/game/new', { method: 'POST' });
        this.setGameId(data.gameId);
        return data;
    }

    async getGameState() {
        if (!this.gameId) throw new Error('No active game');
        return this.request(`/game/${this.gameId}/state`);
    }

    async makeMove(fromRow, fromCol, toRow, toCol) {
        if (!this.gameId) throw new Error('No active game');
        return this.request(`/game/${this.gameId}/move`, {
            method : 'POST',
            body   : JSON.stringify({ fromRow, fromCol, toRow, toCol })
        });
    }

    async getValidMoves(row, col) {
        if (!this.gameId) throw new Error('No active game');
        return this.request(`/game/${this.gameId}/valid-moves?row=${row}&col=${col}`);
    }

    async resetGame() {
        if (!this.gameId) throw new Error('No active game');
        return this.request(`/game/${this.gameId}/reset`, { method: 'POST' });
    }

    /**
     * Asks the server to compute and execute the best move for the given color
     * using minimax with alpha-beta pruning (depth 3).
     * Returns the new GameStateDTO after the move is applied.
     */
    async getAIMove(color = 'BLACK') {
        if (!this.gameId) throw new Error('No active game');
        return this.request(`/game/${this.gameId}/ai-move?color=${color}`, { method: 'POST' });
    }

    /* ── Multiplayer helpers ── */
    setGameId(id) {
        this.gameId = id;
        if (id) localStorage.setItem('currentGameId', id);
        else     localStorage.removeItem('currentGameId');
    }

    /**
     * Get all valid moves for every piece of `color`.
     * Returns an array of { fromRow, fromCol, toRow, toCol }.
     * Used by the computer AI.
     */
    async getAllValidMovesForColor(board, color) {
        const moves = [];
        const tasks = [];
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = board[r][c];
                if (piece && piece.color === color) {
                    tasks.push(
                        this.getValidMoves(r, c)
                            .then(res => {
                                (res.validMoves || []).forEach(m => {
                                    moves.push({ fromRow: r, fromCol: c, toRow: m.row, toCol: m.col });
                                });
                            })
                            .catch(() => {})
                    );
                }
            }
        }
        await Promise.all(tasks);
        return moves;
    }
}

const chessAPI = new ChessAPI();
