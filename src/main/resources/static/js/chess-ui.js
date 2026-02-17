class ChessUI {
    constructor() {
        this.board = null;
        this.selectedSquare = null;
        this.validMoves = [];
        this.currentPlayer = 'WHITE';
        
        this.pieces = {
            WHITE: { KING: '♔', QUEEN: '♕', ROOK: '♖', BISHOP: '♗', KNIGHT: '♘', PAWN: '♙' },
            BLACK: { KING: '♚', QUEEN: '♛', ROOK: '♜', BISHOP: '♝', KNIGHT: '♞', PAWN: '♟' }
        };
    }
    
    initBoard() {
        const boardElement = document.getElementById('chessboard');
        boardElement.innerHTML = '';
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const square = document.createElement('div');
                square.className = 'square ' + ((row + col) % 2 === 0 ? 'light' : 'dark');
                square.dataset.row = row;
                square.dataset.col = col;
                square.addEventListener('click', (e) => this.handleSquareClick(e));
                boardElement.appendChild(square);
            }
        }
    }
    
    renderBoard(gameState) {
        this.board = gameState.board;
        this.currentPlayer = gameState.currentPlayer;
        
        const squares = document.querySelectorAll('.square');
        squares.forEach(square => {
            const row = parseInt(square.dataset.row);
            const col = parseInt(square.dataset.col);
            const piece = this.board[row][col];
            square.textContent = piece ? this.pieces[piece.color][piece.type] : '';
            square.classList.remove('selected', 'valid-move', 'has-piece');
        });
        
        document.getElementById('current-turn').textContent = gameState.currentPlayer;
        
        let status = 'Active';
        if (gameState.checkmate) status = `Checkmate! ${gameState.winner} wins!`;
        else if (gameState.stalemate) status = 'Stalemate - Draw!';
        else if (gameState.check) status = 'Check!';
        
        document.getElementById('game-status').textContent = status;
        document.getElementById('check-warning').classList.toggle('hidden', !gameState.check || gameState.checkmate);
    }
    
    async handleSquareClick(event) {
        const square = event.currentTarget;
        const row = parseInt(square.dataset.row);
        const col = parseInt(square.dataset.col);
        
        if (this.selectedSquare) {
            const selectedRow = parseInt(this.selectedSquare.dataset.row);
            const selectedCol = parseInt(this.selectedSquare.dataset.col);
            
            if (this.isValidMove(row, col)) {
                try {
                    const gameState = await chessAPI.makeMove(selectedRow, selectedCol, row, col);
                    this.renderBoard(gameState);
                    this.showMessage('Move successful!', 'success');
                } catch (error) {
                    this.showMessage(error.message, 'error');
                }
            }
            
            this.clearSelection();
            
            const piece = this.board[row][col];
            if (piece && piece.color === this.currentPlayer) {
                await this.selectSquare(square);
            }
        } else {
            const piece = this.board[row][col];
            if (piece && piece.color === this.currentPlayer) {
                await this.selectSquare(square);
            }
        }
    }
    
    async selectSquare(square) {
        this.selectedSquare = square;
        square.classList.add('selected');
        
        const row = parseInt(square.dataset.row);
        const col = parseInt(square.dataset.col);
        
        try {
            const response = await chessAPI.getValidMoves(row, col);
            this.validMoves = response.validMoves || [];
            this.highlightValidMoves();
        } catch (error) {
            this.validMoves = [];
        }
    }
    
    clearSelection() {
        if (this.selectedSquare) {
            this.selectedSquare.classList.remove('selected');
            this.selectedSquare = null;
        }
        this.validMoves = [];
        document.querySelectorAll('.valid-move').forEach(sq => {
            sq.classList.remove('valid-move', 'has-piece');
        });
    }
    
    highlightValidMoves() {
        this.validMoves.forEach(move => {
            const square = document.querySelector(`[data-row="${move.row}"][data-col="${move.col}"]`);
            if (square) {
                square.classList.add('valid-move');
                if (this.board[move.row][move.col]) {
                    square.classList.add('has-piece');
                }
            }
        });
    }
    
    isValidMove(row, col) {
        return this.validMoves.some(move => move.row === row && move.col === col);
    }
    
    showMessage(text, type = 'info') {
        const messageElement = document.getElementById('message');
        messageElement.textContent = text;
        messageElement.className = `message ${type}`;
        setTimeout(() => {
            messageElement.textContent = '';
            messageElement.className = 'message';
        }, 3000);
    }
    
    updateConnectionStatus(connected) {
        const indicator = document.getElementById('status-indicator');
        const text = document.getElementById('status-text');
        
        if (connected) {
            indicator.classList.add('connected');
            indicator.classList.remove('disconnected');
            text.textContent = 'Connected';
        } else {
            indicator.classList.add('disconnected');
            indicator.classList.remove('connected');
            text.textContent = 'Disconnected';
        }
    }
}

const chessUI = new ChessUI();