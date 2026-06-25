/* ═══════════════════════════════════════════════════
   Chess App  –  Modes, Timer, AI, Multiplayer
═══════════════════════════════════════════════════ */

/* ────────────────────────────────────────────────
   ChessTimer
──────────────────────────────────────────────── */
class ChessTimer {
    constructor(minutes, onTick, onTimeout) {
        this.totalSeconds = minutes * 60;
        this.white        = minutes * 60;
        this.black        = minutes * 60;
        this.active       = null;   // 'WHITE' | 'BLACK' | null
        this.running      = false;
        this.onTick       = onTick;
        this.onTimeout    = onTimeout;
        this._interval    = null;
        this.unlimited    = (minutes === 0);
    }

    start(color) {
        if (this.unlimited) return;
        this.active  = color;
        this.running = true;
        this._tick();
        this._interval = setInterval(() => this._tick(), 1000);
    }

    switch(newColor) {
        if (this.unlimited) return;
        this.active = newColor;
    }

    pause() {
        clearInterval(this._interval);
        this._interval = null;
        this.running   = false;
    }

    stop() {
        this.pause();
        this.active = null;
    }

    _tick() {
        if (!this.active) return;
        if (this.active === 'WHITE') this.white = Math.max(0, this.white - 1);
        else                          this.black = Math.max(0, this.black - 1);

        this.onTick(this.white, this.black, this.active);

        const remaining = this.active === 'WHITE' ? this.white : this.black;
        if (remaining <= 0) {
            this.stop();
            this.onTimeout(this.active);
        }
    }

    static fmt(secs) {
        if (secs === null) return '—';
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    }
}

/* ────────────────────────────────────────────────
   ChessApp
──────────────────────────────────────────────── */
class ChessApp {
    constructor() {
        /* Settings from landing */
        this.mode        = 'local';   // 'local' | 'computer' | 'online'
        this.timeMinutes = 5;
        this.playerColor = 'WHITE';   // local player colour (online / computer modes)

        /* Runtime */
        this.timer       = null;
        this.pollHandle  = null;
        this.lastSeenPlayer = null;
        this.gameOver    = false;

        /* Computer difficulty: random for now */
        this.computerColor = 'BLACK';
    }

    /* ═══════════════════════════════════════════
       Boot
    ═══════════════════════════════════════════ */
    init() {
        chessUI.initBoard();
        this._bindLanding();
        this._bindGame();

        /* Check URL for ?join=<code> */
        const params = new URLSearchParams(window.location.search);
        const joinId = params.get('join');
        if (joinId) {
            this._prefillJoinCode(joinId);
        }
    }

    _prefillJoinCode(code) {
        /* Switch to online → join tab */
        const onlineBtn = document.querySelector('[data-mode="online"]');
        if (onlineBtn) onlineBtn.click();
        setTimeout(() => {
            const joinTab = document.querySelector('[data-tab="join"]');
            if (joinTab) joinTab.click();
            const input = document.getElementById('join-code-input');
            if (input) input.value = code;
        }, 50);
    }

    /* ═══════════════════════════════════════════
       Landing screen bindings
    ═══════════════════════════════════════════ */
    _bindLanding() {
        /* Mode buttons */
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.mode = btn.dataset.mode;
                document.getElementById('online-options').classList.toggle('hidden', this.mode !== 'online');
            });
        });

        /* Online tabs */
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const tab = btn.dataset.tab;
                document.getElementById('create-tab').classList.toggle('hidden', tab !== 'create');
                document.getElementById('join-tab').classList.toggle('hidden', tab !== 'join');
            });
        });

        /* Time control buttons */
        document.querySelectorAll('.time-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.time-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.timeMinutes = parseInt(btn.dataset.minutes);
            });
        });

        /* Create room */
        document.getElementById('create-room-btn').addEventListener('click', async () => {
            await this._createOnlineRoom();
        });

        /* Copy code */
        document.getElementById('copy-code-btn').addEventListener('click', () => {
            const code = document.getElementById('share-code-text').textContent;
            navigator.clipboard.writeText(code).then(() => alert('Code copied!'));
        });

        /* Join room */
        document.getElementById('join-room-btn').addEventListener('click', async () => {
            const code = document.getElementById('join-code-input').value.trim();
            if (!code) { alert('Please enter a game code'); return; }
            await this._joinOnlineRoom(code);
        });

        /* Start game */
        document.getElementById('start-game-btn').addEventListener('click', () => {
            this._startGame();
        });
    }

    async _createOnlineRoom() {
        try {
            const data = await chessAPI.createNewGame();
            document.getElementById('share-code-text').textContent = data.gameId;
            document.getElementById('share-code-box').classList.remove('hidden');
            localStorage.setItem('playerColor', 'WHITE');
        } catch (e) {
            alert('Could not create room: ' + e.message);
        }
    }

    async _joinOnlineRoom(code) {
        chessAPI.setGameId(code);
        try {
            await chessAPI.getGameState(); // validate the game exists
            localStorage.setItem('playerColor', 'BLACK');
            localStorage.setItem('currentGameId', code);
            document.getElementById('join-code-input').value = '';
            alert('Joined! Click "Start Game".');
        } catch (e) {
            alert('Game not found: ' + e.message);
        }
    }

    /* ═══════════════════════════════════════════
       Start game (transition from landing → game)
    ═══════════════════════════════════════════ */
    async _startGame() {
        /* Hide landing, show game screen */
        document.getElementById('landing-screen').classList.add('hidden');
        document.getElementById('game-screen').classList.remove('hidden');

        /* Labels */
        const modeLabels = { local: '👥 Local', computer: '🤖 vs Computer', online: '🌐 Online' };
        document.getElementById('game-mode-label').textContent = modeLabels[this.mode] || this.mode;
        document.getElementById('time-control-label').textContent =
            this.timeMinutes === 0 ? '∞ Unlimited' : `⏱ ${this.timeMinutes} min`;

        /* Connect */
        await this._checkConnection();

        if (this.mode === 'online') {
            await this._initOnlineMode();
        } else {
            await this._initLocalGame();
        }
    }

    async _checkConnection() {
        try {
            await chessAPI.checkHealth();
            chessUI.updateConnectionStatus(true);
        } catch {
            chessUI.updateConnectionStatus(false);
            chessUI.showMessage('Cannot reach server', 'error');
        }
    }

    /* ═══════════════════════════════════════════
       Local / computer game init
    ═══════════════════════════════════════════ */
    async _initLocalGame() {
        try {
            await chessAPI.createNewGame();
            const state = await chessAPI.getGameState();

            if (this.mode === 'computer') {
                this.playerColor      = 'WHITE';
                this.computerColor    = 'BLACK';
                chessUI.playerColor   = 'WHITE';
                document.getElementById('white-player-name').textContent = 'You';
                document.getElementById('black-player-name').textContent = '🤖 Computer';
            } else {
                chessUI.playerColor = null; // both sides local
                document.getElementById('white-player-name').textContent = 'White';
                document.getElementById('black-player-name').textContent = 'Black';
            }

            chessUI.setInitialCounts(state.board);
            chessUI.resetMoveLog();
            chessUI.renderBoard(state, chessUI.playerColor);
            this._startTimer('WHITE');
            chessUI.onMoveMade = gs => this._afterMove(gs);
        } catch (e) {
            chessUI.showMessage('Error: ' + e.message, 'error');
        }
    }

    /* ═══════════════════════════════════════════
       Online multiplayer init
    ═══════════════════════════════════════════ */
    async _initOnlineMode() {
        this.playerColor    = localStorage.getItem('playerColor') || 'WHITE';
        chessUI.playerColor = this.playerColor;

        /* Flip board if playing black */
        if (this.playerColor === 'BLACK' && !chessUI.flipped) chessUI.flipBoard();

        document.getElementById('white-player-name').textContent =
            this.playerColor === 'WHITE' ? 'You' : 'Opponent';
        document.getElementById('black-player-name').textContent =
            this.playerColor === 'BLACK' ? 'You' : 'Opponent';

        const roomPanel = document.getElementById('online-room-info');
        roomPanel.classList.remove('hidden');
        document.getElementById('room-code-display').textContent = chessAPI.gameId;

        try {
            const state = await chessAPI.getGameState();
            chessUI.setInitialCounts(state.board);
            chessUI.resetMoveLog();
            chessUI.renderBoard(state, this.playerColor);
        } catch (e) {
            chessUI.showMessage('Could not load game: ' + e.message, 'error');
        }

        chessUI.onMoveMade = gs => this._afterMove(gs);
        this._startPolling();
    }

    /* ═══════════════════════════════════════════
       After every move (local / online / AI)
    ═══════════════════════════════════════════ */
    _afterMove(gameState) {
        this.gameOver = gameState.checkmate || gameState.stalemate || gameState.gameOver;

        /* Switch timer */
        if (this.timer) this.timer.switch(gameState.currentPlayer);

        /* Check game over */
        if (this.gameOver) {
            this._endGame(gameState);
            return;
        }

        /* Computer move */
        if (this.mode === 'computer' && gameState.currentPlayer === this.computerColor) {
            setTimeout(() => this._makeComputerMove(gameState), 400);
        }

        /* Try pre-move */
        if (this.mode !== 'computer' &&
            chessUI.playerColor && gameState.currentPlayer === chessUI.playerColor) {
            setTimeout(() => chessUI.executePreMoveIfSet(), 100);
        }
    }

    /* ═══════════════════════════════════════════
       Computer AI  (minimax + alpha-beta, depth 3)
       The move is computed server-side in Java and
       applied atomically — one round-trip replaces
       the old scan-all-moves + random-pick flow.
    ═══════════════════════════════════════════ */
    async _makeComputerMove(gameState) {
        try {
            const prevBoard = gameState.board.map(row => row.map(p => p ? { ...p } : null));
            const newState  = await chessAPI.getAIMove(this.computerColor);

            // Record the move in the move log by diffing boards
            const diff = this._diffBoards(prevBoard, newState.board);
            if (diff) {
                chessUI._recordMove(diff.fromRow, diff.fromCol, diff.toRow, diff.toCol, prevBoard, newState);
                chessUI.lastFromRow = diff.fromRow; chessUI.lastFromCol = diff.fromCol;
                chessUI.lastToRow   = diff.toRow;   chessUI.lastToCol   = diff.toCol;
            }

            chessUI.renderBoard(newState, chessUI.playerColor);
            this._afterMove(newState);
        } catch (e) {
            console.warn('AI move error:', e.message);
        }
    }

    /**
     * Diffs two board states to recover from/to squares for move logging.
     * Looks for the square that lost a piece (from) and the square that
     * gained / changed piece (to).
     */
    _diffBoards(prev, next) {
        let from = null, to = null;
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const p = prev[r][c], n = next[r][c];
                if (p && !n) from = { fromRow: r, fromCol: c };
                else if ((!p && n) || (p && n && p.color !== n.color)) to = { toRow: r, toCol: c };
            }
        }
        return (from && to) ? { ...from, ...to } : null;
    }

    /* ═══════════════════════════════════════════
       Polling (online multiplayer)
    ═══════════════════════════════════════════ */
    _startPolling() {
        this._stopPolling();
        this.pollHandle = setInterval(() => this._poll(), 1200);
    }

    _stopPolling() {
        if (this.pollHandle) { clearInterval(this.pollHandle); this.pollHandle = null; }
    }

    async _poll() {
        if (this.gameOver) { this._stopPolling(); return; }
        try {
            const state = await chessAPI.getGameState();
            const waiting = document.getElementById('waiting-text');

            /* Detect opponent connected (turn switched) */
            if (state.currentPlayer !== this.lastSeenPlayer) {
                this.lastSeenPlayer = state.currentPlayer;

                if (state.currentPlayer === this.playerColor) {
                    /* Opponent just moved — re-render */
                    chessUI.renderBoard(state, this.playerColor);
                    if (waiting) waiting.classList.add('hidden');

                    /* Rebuild move log from last known count */
                    // (We can't reconstruct notation without the prev board,
                    //  so we just show a placeholder row when opponent moves)
                    if (chessUI.halfMoves % 2 === 0 && this.playerColor === 'WHITE') {
                        /* White's turn again after black moved */
                    }

                    if (this.timer) this.timer.switch(state.currentPlayer);
                    if (state.checkmate || state.stalemate) this._endGame(state);
                    chessUI.executePreMoveIfSet();
                } else if (waiting) {
                    waiting.classList.remove('hidden');
                }
            }

            /* Start timer once both sides have moved once (or on first load) */
            if (this.timer && !this.timer.running && !this.timer.unlimited) {
                this.timer.start(state.currentPlayer);
            }
        } catch { /* swallow poll errors */ }
    }

    /* ═══════════════════════════════════════════
       Timer
    ═══════════════════════════════════════════ */
    _startTimer(firstPlayer) {
        if (this.timer) this.timer.stop();

        const wEl = document.getElementById('white-timer');
        const bEl = document.getElementById('black-timer');

        if (this.timeMinutes === 0) {
            wEl.textContent = '∞';
            bEl.textContent = '∞';
            return;
        }

        this.timer = new ChessTimer(
            this.timeMinutes,
            (whiteSecs, blackSecs, active) => {
                wEl.textContent = ChessTimer.fmt(whiteSecs);
                bEl.textContent = ChessTimer.fmt(blackSecs);
                const wWarn = whiteSecs <= 30;
                const bWarn = blackSecs <= 30;
                const wDang = whiteSecs <= 10;
                const bDang = blackSecs <= 10;
                wEl.className = 'timer' + (active === 'WHITE' ? ' active' : '') +
                    (wDang ? ' danger' : wWarn ? ' warning' : '');
                bEl.className = 'timer' + (active === 'BLACK' ? ' active' : '') +
                    (bDang ? ' danger' : bWarn ? ' warning' : '');
            },
            (loser) => {
                this._endGame({ winner: loser === 'WHITE' ? 'BLACK' : 'WHITE', reason: 'timeout' });
            }
        );

        wEl.textContent = ChessTimer.fmt(this.timeMinutes * 60);
        bEl.textContent = ChessTimer.fmt(this.timeMinutes * 60);
        this.timer.start(firstPlayer);
    }

    /* ═══════════════════════════════════════════
       Game over
    ═══════════════════════════════════════════ */
    _endGame(gameState) {
        this.gameOver = true;
        if (this.timer) this.timer.stop();
        this._stopPolling();

        let title, msg, icon;
        if (gameState.reason === 'timeout') {
            title = `Time's up!`;
            msg   = `${gameState.winner} wins on time`;
            icon  = gameState.winner === 'WHITE' ? '♔' : '♚';
        } else if (gameState.checkmate) {
            title = 'Checkmate!';
            msg   = `${gameState.winner} wins`;
            icon  = gameState.winner === 'WHITE' ? '♔' : '♚';
        } else if (gameState.stalemate) {
            title = 'Stalemate';
            msg   = 'The game is a draw';
            icon  = '½';
        } else if (gameState.resigned) {
            title = 'Resignation';
            msg   = `${gameState.winner} wins`;
            icon  = '⚑';
        } else if (gameState.draw) {
            title = 'Draw agreed';
            msg   = '';
            icon  = '½';
        } else {
            title = 'Game over';
            msg   = '';
            icon  = '♟';
        }

        document.getElementById('game-over-icon').textContent   = icon;
        document.getElementById('game-over-title').textContent  = title;
        document.getElementById('game-over-message').textContent = msg;
        document.getElementById('game-over-overlay').classList.remove('hidden');
    }

    /* ═══════════════════════════════════════════
       Game screen bindings
    ═══════════════════════════════════════════ */
    _bindGame() {
        /* Back to menu */
        document.getElementById('back-to-menu-btn').addEventListener('click', () => {
            if (confirm('Leave current game and go to menu?')) this._goToMenu();
        });

        /* Flip */
        document.getElementById('flip-board-btn').addEventListener('click', () => {
            chessUI.flipBoard();
        });

        /* Resign */
        document.getElementById('resign-btn').addEventListener('click', () => {
            if (this.gameOver) return;
            if (confirm('Resign this game?')) {
                const winner = chessUI.currentPlayer === 'WHITE' ? 'BLACK' : 'WHITE';
                this._endGame({ resigned: true, winner });
            }
        });

        /* Draw */
        document.getElementById('draw-btn').addEventListener('click', () => {
            if (this.gameOver) return;
            if (confirm('Claim a draw?')) this._endGame({ draw: true });
        });

        /* New game (in-game) */
        document.getElementById('new-game-btn').addEventListener('click', async () => {
            if (confirm('Start a new game with the same settings?')) {
                this.gameOver = false;
                document.getElementById('game-over-overlay').classList.add('hidden');
                chessUI.cancelPreMove();
                chessUI.clearSelection();
                this._stopPolling();
                if (this.timer) this.timer.stop();
                if (this.mode === 'online') {
                    await this._initOnlineMode();
                } else {
                    await this._initLocalGame();
                }
            }
        });

        /* Cancel pre-move */
        document.getElementById('cancel-premove-btn').addEventListener('click', () => {
            chessUI.cancelPreMove();
        });

        /* Copy room code */
        document.getElementById('copy-room-code-btn').addEventListener('click', () => {
            navigator.clipboard.writeText(chessAPI.gameId || '');
        });

        /* Game-over overlay buttons */
        document.getElementById('rematch-btn').addEventListener('click', async () => {
            this.gameOver = false;
            document.getElementById('game-over-overlay').classList.add('hidden');
            chessUI.cancelPreMove();
            chessUI.clearSelection();
            this._stopPolling();
            if (this.timer) this.timer.stop();
            if (this.mode === 'online') {
                await this._initOnlineMode();
            } else {
                await this._initLocalGame();
            }
        });

        document.getElementById('main-menu-btn').addEventListener('click', () => {
            this._goToMenu();
        });

        /* Escape key */
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape') {
                chessUI.clearSelection();
                chessUI.cancelPreMove();
            }
        });
    }

    _goToMenu() {
        this._stopPolling();
        if (this.timer) this.timer.stop();
        this.gameOver = false;
        document.getElementById('game-over-overlay').classList.add('hidden');
        document.getElementById('game-screen').classList.add('hidden');
        document.getElementById('landing-screen').classList.remove('hidden');
    }
}

/* ── Bootstrap ── */
const app = new ChessApp();
document.addEventListener('DOMContentLoaded', () => app.init());
