/* ═══════════════════════════════════════════════════
   Chess UI  –  Board rendering, interaction, move log
═══════════════════════════════════════════════════ */
class ChessUI {
    constructor() {
        /* Board state */
        this.board          = null;
        this.currentPlayer  = 'WHITE';
        this.selectedSquare = null;
        this.validMoves     = [];
        this.flipped        = false;
        this.gameOver       = false;

        /* Pre-move */
        this.preMoveFrom    = null;
        this.preMoveTo      = null;

        /* Move history for log & notation */
        this.moves          = [];   // { white, black } pairs
        this.halfMoves      = 0;    // total half-moves played
        this.lastFromRow    = null;
        this.lastFromCol    = null;
        this.lastToRow      = null;
        this.lastToCol      = null;

        /* Captured piece tracking */
        this.initialCounts  = { WHITE: {}, BLACK: {} };
        this.PIECE_ORDER    = ['QUEEN','ROOK','BISHOP','KNIGHT','PAWN'];

        /* Unicode symbols */
        this.symbols = {
            WHITE: { KING:'♔', QUEEN:'♕', ROOK:'♖', BISHOP:'♗', KNIGHT:'♘', PAWN:'♙' },
            BLACK: { KING:'♚', QUEEN:'♛', ROOK:'♜', BISHOP:'♝', KNIGHT:'♞', PAWN:'♟' }
        };

        /* Callbacks injected by app.js */
        this.onMoveMade = null;
    }

    /* ═══════════════════════════════════════════════
       Board initialisation
    ═══════════════════════════════════════════════ */
    initBoard() {
        const el = document.getElementById('chessboard');
        el.innerHTML = '';
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const sq = document.createElement('div');
                sq.className    = 'square ' + ((r + c) % 2 === 0 ? 'light' : 'dark');
                sq.dataset.row  = r;
                sq.dataset.col  = c;
                sq.addEventListener('click', e => this._handleClick(e));
                el.appendChild(sq);
            }
        }
    }

    /* ═══════════════════════════════════════════════
       Render full board from game state
    ═══════════════════════════════════════════════ */
    renderBoard(gameState, playerColor = null) {
        if (playerColor !== null) this.playerColor = playerColor;
        this.board         = gameState.board;
        this.currentPlayer = gameState.currentPlayer;
        this.gameOver      = gameState.gameOver || gameState.checkmate || gameState.stalemate;

        const squares = document.querySelectorAll('.square');
        squares.forEach(sq => {
            const vRow = parseInt(sq.dataset.row);
            const vCol = parseInt(sq.dataset.col);
            const [r, c] = this._visualToLogical(vRow, vCol);
            const piece  = this.board[r][c];

            sq.textContent = piece ? this.symbols[piece.color][piece.type] : '';
            sq.className   = 'square ' + ((vRow + vCol) % 2 === 0 ? 'light' : 'dark');

            /* Last-move highlight */
            if (this.lastFromRow !== null) {
                if (r === this.lastFromRow && c === this.lastFromCol) sq.classList.add('last-move-from');
                if (r === this.lastToRow   && c === this.lastToCol)   sq.classList.add('last-move-to');
            }

            /* King in check */
            if (gameState.check && !gameState.checkmate && piece &&
                piece.type === 'King' && piece.color === gameState.currentPlayer) {
                sq.classList.add('in-check');
            }
        });

        this._updatePlayerPanels(gameState);
        this._updateCapturedPieces(gameState.board);

        /* Status text */
        let status = `${gameState.currentPlayer === 'WHITE' ? '♔' : '♚'} ${gameState.currentPlayer}'s turn`;
        if (gameState.check && !gameState.checkmate) status = `⚠️ Check! ${gameState.currentPlayer} to move`;
        if (gameState.checkmate) status = `♛ Checkmate — ${gameState.winner} wins!`;
        if (gameState.stalemate) status = `½ Stalemate — Draw!`;
        document.getElementById('game-status-display').textContent = status;
    }

    /* ═══════════════════════════════════════════════
       Click handler
    ═══════════════════════════════════════════════ */
    async _handleClick(e) {
        if (this.gameOver) return;

        const sq   = e.currentTarget;
        const vRow = parseInt(sq.dataset.row);
        const vCol = parseInt(sq.dataset.col);
        const [r, c] = this._visualToLogical(vRow, vCol);

        /* ── Pre-move mode (not your turn) ── */
        if (this.playerColor && this.currentPlayer !== this.playerColor) {
            this._handlePreMove(sq, r, c);
            return;
        }

        /* ── Normal move ── */
        if (this.selectedSquare) {
            const [selR, selC] = this._visualToLogical(
                parseInt(this.selectedSquare.dataset.row),
                parseInt(this.selectedSquare.dataset.col)
            );

            if (this._isValidMove(r, c)) {
                /* Execute move */
                const prevBoard = this.board.map(row => row.map(p => p ? { ...p } : null));
                try {
                    const gameState = await chessAPI.makeMove(selR, selC, r, c);
                    this._recordMove(selR, selC, r, c, prevBoard, gameState);
                    this.lastFromRow = selR; this.lastFromCol = selC;
                    this.lastToRow   = r;    this.lastToCol   = c;
                    this.clearSelection();
                    this.renderBoard(gameState, this.playerColor);
                    if (this.onMoveMade) this.onMoveMade(gameState);
                } catch (err) {
                    this.showMessage(err.message, 'error');
                    this.clearSelection();
                }
                return;
            }

            this.clearSelection();

            /* Re-select a friendly piece */
            const piece = this.board[r][c];
            if (piece && piece.color === this.currentPlayer) {
                await this._selectSquare(sq, r, c);
            }
        } else {
            const piece = this.board[r][c];
            if (piece && piece.color === this.currentPlayer) {
                await this._selectSquare(sq, r, c);
            }
        }
    }

    /* ── Pre-move ── */
    _handlePreMove(sq, r, c) {
        if (!this.preMoveFrom) {
            const piece = this.board[r][c];
            if (piece && piece.color === this.playerColor) {
                this.preMoveFrom = { r, c, sq };
                sq.classList.add('premove-from');
                document.getElementById('premove-indicator').classList.remove('hidden');
            }
        } else {
            /* Set destination */
            if (this.preMoveFrom.sq === sq) {
                this.cancelPreMove();
                return;
            }
            if (this.preMoveTo) this.preMoveTo.sq.classList.remove('premove-to');
            this.preMoveTo = { r, c, sq };
            sq.classList.add('premove-to');
        }
    }

    cancelPreMove() {
        if (this.preMoveFrom) this.preMoveFrom.sq.classList.remove('premove-from');
        if (this.preMoveTo)   this.preMoveTo.sq.classList.remove('premove-to');
        this.preMoveFrom = null;
        this.preMoveTo   = null;
        document.getElementById('premove-indicator').classList.add('hidden');
    }

    async executePreMoveIfSet() {
        if (!this.preMoveFrom || !this.preMoveTo) return false;
        const { r: fr, c: fc } = this.preMoveFrom;
        const { r: tr, c: tc } = this.preMoveTo;
        this.cancelPreMove();
        try {
            const prevBoard = this.board.map(row => row.map(p => p ? { ...p } : null));
            const gameState = await chessAPI.makeMove(fr, fc, tr, tc);
            this._recordMove(fr, fc, tr, tc, prevBoard, gameState);
            this.lastFromRow = fr; this.lastFromCol = fc;
            this.lastToRow   = tr; this.lastToCol   = tc;
            this.renderBoard(gameState, this.playerColor);
            if (this.onMoveMade) this.onMoveMade(gameState);
            return true;
        } catch {
            this.showMessage('Pre-move was illegal — cancelled', 'info');
            return false;
        }
    }

    /* ═══════════════════════════════════════════════
       Square selection & valid-move highlights
    ═══════════════════════════════════════════════ */
    async _selectSquare(sq, r, c) {
        this.selectedSquare = sq;
        sq.classList.add('selected');
        try {
            const res = await chessAPI.getValidMoves(r, c);
            this.validMoves = res.validMoves || [];
            this._highlightMoves();
        } catch { this.validMoves = []; }
    }

    clearSelection() {
        if (this.selectedSquare) {
            this.selectedSquare.classList.remove('selected');
            this.selectedSquare = null;
        }
        this.validMoves = [];
        document.querySelectorAll('.valid-move, .valid-capture').forEach(sq => {
            sq.classList.remove('valid-move', 'valid-capture');
        });
    }

    _highlightMoves() {
        this.validMoves.forEach(({ row, col }) => {
            const [vR, vC] = this._logicalToVisual(row, col);
            const sq = document.querySelector(`[data-row="${vR}"][data-col="${vC}"]`);
            if (!sq) return;
            sq.classList.add(this.board[row][col] ? 'valid-capture' : 'valid-move');
        });
    }

    _isValidMove(r, c) {
        return this.validMoves.some(m => m.row === r && m.col === c);
    }

    /* ═══════════════════════════════════════════════
       Board flip
    ═══════════════════════════════════════════════ */
    flipBoard() {
        this.flipped = !this.flipped;

        /* Reverse rank labels */
        const rankEl = document.getElementById('rank-labels');
        rankEl.innerHTML = '';
        const rankOrder = this.flipped ? ['1','2','3','4','5','6','7','8'] : ['8','7','6','5','4','3','2','1'];
        rankOrder.forEach(n => { const s = document.createElement('span'); s.textContent = n; rankEl.appendChild(s); });

        /* Reverse file labels */
        const fileEl = document.getElementById('file-labels');
        fileEl.innerHTML = '';
        const fileOrder = this.flipped ? ['h','g','f','e','d','c','b','a'] : ['a','b','c','d','e','f','g','h'];
        fileOrder.forEach(l => { const s = document.createElement('span'); s.textContent = l; fileEl.appendChild(s); });

        /* Re-render */
        if (this.board) this.renderBoard({ board: this.board, currentPlayer: this.currentPlayer }, this.playerColor);
    }

    /* ── Coordinate helpers ── */
    _visualToLogical(vRow, vCol) {
        return this.flipped ? [7 - vRow, 7 - vCol] : [vRow, vCol];
    }
    _logicalToVisual(r, c) {
        return this.flipped ? [7 - r, 7 - c] : [r, c];
    }

    /* ═══════════════════════════════════════════════
       Algebraic notation helpers
    ═══════════════════════════════════════════════ */
    _toNotation(fromRow, fromCol, toRow, toCol, prevBoard, gameState) {
        const piece = prevBoard[fromRow][fromCol];
        if (!piece) return '?';

        const FILES  = ['a','b','c','d','e','f','g','h'];
        const NAMES  = { King:'K', Queen:'Q', Rook:'R', Bishop:'B', Knight:'N', Pawn:'' };

        /* Castling */
        if (piece.type === 'King') {
            const diff = toCol - fromCol;
            if (diff === 2)  return 'O-O';
            if (diff === -2) return 'O-O-O';
        }

        const captured = prevBoard[toRow][toCol];
        let note = NAMES[piece.type] || '';
        if (captured || (piece.type === 'Pawn' && fromCol !== toCol)) {
            if (piece.type === 'Pawn') note += FILES[fromCol];
            note += 'x';
        }
        note += FILES[toCol] + (8 - toRow);

        /* Promotion */
        if (piece.type === 'Pawn' && (toRow === 0 || toRow === 7)) note += '=Q';

        /* Check / checkmate */
        if      (gameState.checkmate) note += '#';
        else if (gameState.check)     note += '+';

        return note;
    }

    /* ═══════════════════════════════════════════════
       Move recording & log rendering
    ═══════════════════════════════════════════════ */
    _recordMove(fromRow, fromCol, toRow, toCol, prevBoard, gameState) {
        const note = this._toNotation(fromRow, fromCol, toRow, toCol, prevBoard, gameState);
        this.halfMoves++;
        const moveNum = Math.ceil(this.halfMoves / 2);
        const isWhite = this.halfMoves % 2 === 1;

        if (isWhite) {
            this.moves.push({ num: moveNum, white: note, black: '' });
        } else {
            if (this.moves.length > 0) this.moves[this.moves.length - 1].black = note;
        }
        this._renderMoveLog();
    }

    _renderMoveLog() {
        const log = document.getElementById('move-log');
        log.innerHTML = '';

        this.moves.forEach((m, idx) => {
            const row = document.createElement('div');
            row.className = 'move-row';

            const numEl = document.createElement('span');
            numEl.className = 'move-num';
            numEl.textContent = m.num + '.';

            const wEl = document.createElement('span');
            wEl.className = 'move-cell' + (idx === this.moves.length - 1 && !m.black ? ' current' : '');
            wEl.textContent = m.white;

            const bEl = document.createElement('span');
            bEl.className = 'move-cell' + (m.black && idx === this.moves.length - 1 ? ' current' : '') + (!m.black ? ' empty' : '');
            bEl.textContent = m.black || '';

            row.appendChild(numEl);
            row.appendChild(wEl);
            row.appendChild(bEl);
            log.appendChild(row);
        });

        /* Scroll to bottom */
        log.scrollTop = log.scrollHeight;

        /* Update move count badge */
        document.getElementById('move-count-badge').textContent = this.halfMoves;
    }

    resetMoveLog() {
        this.moves     = [];
        this.halfMoves = 0;
        this.lastFromRow = this.lastFromCol = this.lastToRow = this.lastToCol = null;
        this._renderMoveLog();
    }

    /* ═══════════════════════════════════════════════
       Captured pieces
    ═══════════════════════════════════════════════ */
    setInitialCounts(board) {
        this.initialCounts = { WHITE: {}, BLACK: {} };
        board.forEach(row => row.forEach(p => {
            if (!p) return;
            this.initialCounts[p.color][p.type] = (this.initialCounts[p.color][p.type] || 0) + 1;
        }));
    }

    _updateCapturedPieces(board) {
        const current = { WHITE: {}, BLACK: {} };
        board.forEach(row => row.forEach(p => {
            if (!p) return;
            current[p.color][p.type] = (current[p.color][p.type] || 0) + 1;
        }));

        /* White captured (Black pieces missing) */
        const whiteCap = this._diff('BLACK', current);
        /* Black captured (White pieces missing) */
        const blackCap = this._diff('WHITE', current);

        document.getElementById('white-captures').textContent = whiteCap;
        document.getElementById('black-captures').textContent = blackCap;
    }

    _diff(color, current) {
        let result = '';
        this.PIECE_ORDER.forEach(type => {
            const had  = this.initialCounts[color][type] || 0;
            const has  = current[color][type] || 0;
            const diff = had - has;
            for (let i = 0; i < diff; i++) result += this.symbols[color][type];
        });
        return result;
    }

    /* ═══════════════════════════════════════════════
       Player panel active state
    ═══════════════════════════════════════════════ */
    _updatePlayerPanels(gameState) {
        const wp = document.getElementById('white-panel');
        const bp = document.getElementById('black-panel');
        const isWhiteTurn = gameState.currentPlayer === 'WHITE';
        wp.classList.toggle('active-player', isWhiteTurn);
        bp.classList.toggle('active-player', !isWhiteTurn);
    }

    /* ═══════════════════════════════════════════════
       Connection status
    ═══════════════════════════════════════════════ */
    updateConnectionStatus(connected) {
        const dot  = document.getElementById('status-indicator');
        const text = document.getElementById('status-text');
        dot.className  = 'status-dot ' + (connected ? 'connected' : 'disconnected');
        text.textContent = connected ? 'Connected' : 'Disconnected';
    }

    /* ═══════════════════════════════════════════════
       Toast messages
    ═══════════════════════════════════════════════ */
    showMessage(text, type = 'info') {
        const el = document.getElementById('game-message');
        el.textContent  = text;
        el.className    = `game-message ${type}`;
        el.classList.remove('hidden', 'fade-out');
        clearTimeout(this._msgTimer);
        this._msgTimer = setTimeout(() => {
            el.classList.add('fade-out');
            setTimeout(() => el.classList.add('hidden'), 300);
        }, 2800);
    }
}

const chessUI = new ChessUI();
