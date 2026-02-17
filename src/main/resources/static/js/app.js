class ChessApp {
    async init() {
        console.log('Initializing Chess App...');
        chessUI.initBoard();
        this.setupEventListeners();
        await this.checkConnection();
        await this.loadOrCreateGame();
        console.log('Chess App ready!');
    }
    
    async checkConnection() {
        try {
            await chessAPI.checkHealth();
            chessUI.updateConnectionStatus(true);
            chessUI.showMessage('Connected to server!', 'success');
            return true;
        } catch (error) {
            console.error('Connection failed:', error);
            chessUI.updateConnectionStatus(false);
            chessUI.showMessage('Failed to connect to backend', 'error');
            return false;
        }
    }
    
    async loadOrCreateGame() {
        try {
            if (chessAPI.gameId) {
                const gameState = await chessAPI.getGameState();
                chessUI.renderBoard(gameState);
                console.log('Loaded existing game:', chessAPI.gameId);
            } else {
                await this.createNewGame();
            }
        } catch (error) {
            console.error('Error loading game:', error);
            await this.createNewGame();
        }
    }
    
    async createNewGame() {
        try {
            chessUI.showMessage('Creating new game...', 'info');
            await chessAPI.createNewGame();
            const gameState = await chessAPI.getGameState();
            chessUI.renderBoard(gameState);
            chessUI.showMessage('New game started!', 'success');
        } catch (error) {
            console.error('Error creating game:', error);
            chessUI.showMessage('Error: ' + error.message, 'error');
        }
    }
    
    async resetGame() {
        try {
            chessUI.showMessage('Resetting game...', 'info');
            const gameState = await chessAPI.resetGame();
            chessUI.renderBoard(gameState);
            chessUI.showMessage('Game reset!', 'success');
        } catch (error) {
            console.error('Error resetting game:', error);
            chessUI.showMessage('Error: ' + error.message, 'error');
        }
    }
    
    setupEventListeners() {
        document.getElementById('new-game-btn').addEventListener('click', () => {
            this.createNewGame();
        });
        
        document.getElementById('reset-game-btn').addEventListener('click', () => {
            if (confirm('Are you sure you want to reset the game?')) {
                this.resetGame();
            }
        });
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                chessUI.clearSelection();
            }
        });
    }
}

const app = new ChessApp();
document.addEventListener('DOMContentLoaded', () => app.init());