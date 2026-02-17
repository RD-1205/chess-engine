class ChessAPI {
    constructor() {
        // Use same server for API (no need for separate URL)
        this.baseURL = window.location.origin;
        this.gameId = localStorage.getItem('currentGameId') || null;
    }
    
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}/api/chess${endpoint}`;
        const config = {
            headers: { 'Content-Type': 'application/json' },
            ...options
        };
        
        const response = await fetch(url, config);
        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.error || `HTTP ${response.status}`);
        }
        return await response.json();
    }
    
    async checkHealth() {
        return await this.request('/health');
    }
    
    async createNewGame() {
        const response = await this.request('/game/new', { method: 'POST' });
        this.gameId = response.gameId;
        localStorage.setItem('currentGameId', this.gameId);
        return response;
    }
    
    async getGameState() {
        if (!this.gameId) throw new Error('No active game');
        return await this.request(`/game/${this.gameId}/state`);
    }
    
    async makeMove(fromRow, fromCol, toRow, toCol) {
        if (!this.gameId) throw new Error('No active game');
        return await this.request(`/game/${this.gameId}/move`, {
            method: 'POST',
            body: JSON.stringify({ fromRow, fromCol, toRow, toCol })
        });
    }
    
    async getValidMoves(row, col) {
        if (!this.gameId) throw new Error('No active game');
        return await this.request(`/game/${this.gameId}/valid-moves?row=${row}&col=${col}`);
    }
    
    async resetGame() {
        if (!this.gameId) throw new Error('No active game');
        return await this.request(`/game/${this.gameId}/reset`, { method: 'POST' });
    }
}

const chessAPI = new ChessAPI();