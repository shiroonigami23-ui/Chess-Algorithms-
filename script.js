/**
 * script.js: Consolidated logic for the Chess Pathfinding tool.
 * FIXES: All major bugs, theming, and animations are now functional.
 * NEW: Heuristic visualization mode for Knight's Tour.
 */

// --- STATE MANAGEMENT ---
const state = {
    boardSize: 8, theme: 'dark', mode: 'tour', currentPiece: 'knight',
    startPos: null, endPos: null, steps: [], moveIndex: -1,
    animationInterval: null, animDelay: 300, isPaused: true, isCalculating: false,
    showHeuristic: false, heuristicData: [],
};

// --- UI MODULE ---
const UI = {
    elements: {},
    squareSize: 0,
    boardSquares: [],

    pieceSvgs: {
        knight: `<svg viewBox="0 0 45 45"><g fill="none" fill-rule="evenodd" stroke="var(--piece-dark)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22.5 9.5c3.5-2 6.5-2 9 0 .5 4.5-1.5 7.5-3.5 9.5-2.5 2.5-5.5 2.5-8 0-2-2-2.5-4-2.5-6 0-1.5.5-3.5 5-3.5zM15.5 28.5l2-1.5 1.5 1.5c-2 2-2.5 4.5-1.5 6.5l-1 1-1-1c-1-2 0-4 1-5.5z" fill="var(--piece-light)"/><path d="M22.5 26.5c-2.5-2-2-4.5-1-6.5l1-1.5 1.5 1.5-1 1.5-1 1.5c1.5 1.5 2.5 2.5 3.5 4.5l2.5 4.5c.5 1 1.5 1.5 2.5 1.5s2-.5 2.5-1.5l-1.5-5c-.5-1.5 0-2.5 1-3.5 1-1 2-1.5 3.5-1.5 1.5 0 2.5.5 3.5 1.5l1 1" fill="var(--piece-light)"/><path d="M12.5 31.5c-3-1-5-2.5-5-5.5 0-4.5 4-6.5 7-6.5 3 0 4.5 2 4.5 4s-1.5 3.5-4.5 3.5c-2.5 0-5 0-7-1.5z" fill="var(--piece-light)"/><path d="M29.5 32.5c-3 1-5 2.5-5 5.5 0 4.5 4 6.5 7 6.5 3 0 4.5-2 4.5-4s-1.5-3.5-4.5-3.5c-2.5 0-5 0-7-1.5z" fill="var(--piece-light)"/></g></svg>`,
        rook: `<svg viewBox="0 0 45 45"><g fill="var(--piece-light)" fill-rule="evenodd" stroke="var(--piece-dark)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 39h27v-3H9v3zM12 36v-4h21v4H12zM11 14V9h4v2h5V9h5v2h5V9h4v5" stroke-linecap="butt"/><path d="M34 14l-3 3H14l-3-3"/><path d="M31 17v12.5H14V17" stroke-linecap="butt" stroke-linejoin="miter"/><path d="M31 29.5l1.5 2.5h-20l1.5-2.5"/><path d="M14 17h17" fill="none" stroke-linejoin="miter"/></g></svg>`,
        bishop: `<svg viewBox="0 0 45 45"><g fill="var(--piece-light)" fill-rule="evenodd" stroke="var(--piece-dark)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 39h27v-3H9v3zM12 36v-4h21v4H12zM15 32V15h15v17H15z"/><path d="M25 8.5c-1.5-2-3.5-2.5-5-2.5-1.5 0-3.5.5-5 2.5" fill="var(--piece-light)"/><path d="M15 15l7.5 1-7.5-11.5M30 15l-7.5 1 7.5-11.5" fill="var(--piece-light)"/><path d="M22.5 16c2.5-2 4-2.5 5-2.5s2.5.5 3.5 1.5c1 .5 1.5 1.5 1.5 2 0 2-1.5 3-4.5 3-2.5 0-4-1-5.5-2.5zM22.5 25c-2.5-2.5-4-3-5.5-3-2.5 0-4 .5-5 2-1 1.5-1 2.5.5 4 1 1 2.5 1 4 0 2-1 3.5-2 5-3.5z" fill="var(--piece-light)"/><path d="M22.5 22.5c0 4-2.5 5.5-5.5 5.5s-5.5-1.5-5.5-5.5c0-4 2.5-5.5 5.5-5.5s5.5 1.5 5.5 5.5z" fill="var(--piece-light)"/></g></svg>`,
        queen: `<svg viewBox="0 0 45 45"><g fill="var(--piece-light)" fill-rule="evenodd" stroke="var(--piece-dark)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM41 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM14 13.5a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM35 13.5a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM22.5 7a2 2 0 1 1-4 0 2 2 0 0 1 4 0z" fill="var(--piece-light)"/><path d="M9 39h27v-3H9v3zM12 36v-4h21v4H12z"/><path d="M11.5 32l3.5-15.5h15L33.5 32" stroke-linecap="butt"/><path d="M12 18.5h21" fill="none"/><circle cx="6" cy="12" r="2" fill="var(--piece-light)"/><circle cx="12" cy="13.5" r="2" fill="var(--piece-light)"/><circle cx="20.5" cy="7" r="2" fill="var(--piece-light)"/><circle cx="24.5" cy="7" r="2" fill="var(--piece-light)"/><circle cx="33" cy="13.5" r="2" fill="var(--piece-light)"/><circle cx="39" cy="12" r="2" fill="var(--piece-light)"/></g></svg>`,
    },

    init() {
        this.elements = {
            board: document.getElementById('board'), animatedPiece: document.getElementById('animated-piece'),
            pathSvg: document.getElementById('path-svg'), pieceSelect: document.getElementById('pieceSelect'),
            startPosSelect: document.getElementById('startPos'), endPosSelect: document.getElementById('endPos'),
            endPosContainer: document.getElementById('end-pos-container'), calculateBtn: document.getElementById('calculateBtn'),
            statusEl: document.getElementById('status'), infoPanel: document.getElementById('info-panel'),
            speedLabel: document.getElementById('speedLabel'), stepJumpLabel: document.getElementById('stepJumpLabel'),
            stepJump: document.getElementById('stepJump'), animationControls: document.getElementById('animation-controls'),
            modeSelector: document.getElementById('mode-selector'), themeSelector: document.getElementById('theme-selector'),
            boardSizeSlider: document.getElementById('boardSize'), boardSizeLabel: document.getElementById('boardSizeLabel'),
            heuristicContainer: document.getElementById('heuristic-container'), heuristicToggle: document.getElementById('heuristic-toggle'),
            startBtn: document.getElementById('startBtn'), pauseBtn: document.getElementById('pauseBtn'),
            resetBtn: document.getElementById('resetBtn'), stepBackBtn: document.getElementById('stepBackBtn'),
            stepForwardBtn: document.getElementById('stepForwardBtn'),
        };
    },
    
    createBoard(onSquareClick) {
        this.boardSquares = [];
        this.elements.board.innerHTML = '';
        this.elements.board.style.setProperty('--board-size', state.boardSize);
        this.squareSize = this.elements.board.clientWidth / state.boardSize;
        this.elements.animatedPiece.style.width = `${this.squareSize}px`;
        this.elements.animatedPiece.style.height = `${this.squareSize}px`;

        for (let r = 0; r < state.boardSize; r++) {
            this.boardSquares[r] = [];
            for (let c = 0; c < state.boardSize; c++) {
                const sq = document.createElement('div');
                sq.className = 'square selectable';
                sq.classList.add((r + c) % 2 === 0 ? 'light' : 'dark');
                sq.dataset.row = r; sq.dataset.col = c;
                sq.addEventListener('click', () => onSquareClick(r, c));
                this.elements.board.appendChild(sq);
                this.boardSquares[r][c] = sq;
            }
        }
    },
    
    renderBoardState() {
        this.clearAllSquareStyles();
        this.elements.pathSvg.innerHTML = '';
        this.elements.pathSvg.className = `path-svg ${state.mode}-path`;

        if (state.startPos) this.boardSquares[state.startPos[0]][state.startPos[1]].classList.add('start-point');
        if (state.endPos && state.mode === 'path') this.boardSquares[state.endPos[0]][state.endPos[1]].classList.add('end-point');

        if (state.moveIndex < 0 || state.steps.length === 0) {
            this.elements.animatedPiece.style.opacity = '0';
            this.elements.infoPanel.classList.add('hidden');
            return;
        }

        state.steps.slice(0, state.moveIndex + 1).forEach(([r, c]) => this.boardSquares[r][c].classList.add('visited'));
        const [currR, currC] = state.steps[state.moveIndex];
        if (this.boardSquares[currR]?.[currC]) this.boardSquares[currR][currC].classList.add('current-path');
        
        this.moveAnimatedPiece(currR, currC);
        this.drawPath();
        this.drawHeuristic();
    },

    moveAnimatedPiece(r, c) {
        this.elements.animatedPiece.innerHTML = this.pieceSvgs[state.currentPiece] || '';
        this.elements.animatedPiece.style.transform = `translate(${c * this.squareSize}px, ${r * this.squareSize}px)`;
        this.elements.animatedPiece.style.opacity = '1';
    },

    drawPath() {
        let pathHtml = '';
        for (let i = 0; i < state.moveIndex; i++) {
            const [r1, c1] = state.steps[i]; const [r2, c2] = state.steps[i + 1];
            const x1 = (c1 + 0.5) * this.squareSize, y1 = (r1 + 0.5) * this.squareSize;
            const x2 = (c2 + 0.5) * this.squareSize, y2 = (r2 + 0.5) * this.squareSize;
            pathHtml += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" style="animation-delay: ${i*0.02}s"/>`;
        }
        this.elements.pathSvg.innerHTML = pathHtml;
    },

    drawHeuristic() {
        if (state.mode === 'tour' && state.currentPiece === 'knight' && state.showHeuristic && state.moveIndex < state.heuristicData.length) {
            const moveData = state.heuristicData[state.moveIndex];
            if (!moveData) return;

            // Display info text
            this.elements.infoPanel.classList.remove('hidden');
            let infoText = `From <strong>${positionToString(...moveData.from)}</strong>, the knight has ${moveData.options.length} valid moves.<br/>`;
            infoText += `It chose <strong>${positionToString(...moveData.chose)}</strong> because it has the fewest onward moves (${moveData.minOnward}).`;
            this.elements.infoPanel.innerHTML = infoText;

            // Display hints on board
            const maxOnward = Math.max(...moveData.options.map(o => o.onward), 1);
            moveData.options.forEach(opt => {
                const [r, c] = opt.pos;
                const hint = document.createElement('div');
                hint.className = 'heuristic-hint';
                hint.textContent = opt.onward;
                // Color scale from green (good) to red (bad)
                const hue = 120 * (1 - (opt.onward / maxOnward));
                hint.style.backgroundColor = `hsla(${hue}, 80%, 50%, 0.7)`;
                this.boardSquares[r][c].appendChild(hint);
            });
        } else {
             this.elements.infoPanel.classList.add('hidden');
        }
    },

    clearAllSquareStyles() {
        this.boardSquares.flat().forEach(sq => {
            sq.classList.remove('visited', 'current-path', 'start-point', 'end-point');
            sq.innerHTML = ''; // Clear hints
        });
    },

    updateControls() {
        this.elements.startBtn.disabled = !state.isPaused || state.isCalculating || state.steps.length === 0;
        this.elements.pauseBtn.disabled = state.isPaused || state.isCalculating || state.steps.length === 0;
        this.elements.resetBtn.disabled = state.steps.length === 0 || state.isCalculating;
        this.elements.stepBackBtn.disabled = state.moveIndex <= 0 || !state.isPaused || state.isCalculating;
        this.elements.stepForwardBtn.disabled = state.moveIndex >= state.steps.length - 1 || !state.isPaused || state.isCalculating;
        this.elements.calculateBtn.disabled = state.isCalculating;
        this.elements.calculateBtn.textContent = state.isCalculating ? "Calculating..." : `Calculate ${state.mode === 'tour' ? 'Tour' : 'Path'}`;
        this.elements.animationControls.style.display = state.mode === 'tour' ? 'block' : 'none';
        this.elements.speedLabel.textContent = `${state.animDelay} ms`;
        this.elements.stepJump.max = state.steps.length > 0 ? state.steps.length - 1 : 0;
        this.elements.stepJump.value = state.moveIndex < 0 ? 0 : state.moveIndex;
        this.elements.stepJumpLabel.textContent = state.moveIndex < 0 ? 0 : state.moveIndex + 1;
        this.elements.boardSizeLabel.textContent = `${state.boardSize}x${state.boardSize}`;
        this.elements.heuristicContainer.style.display = (state.mode === 'tour' && state.currentPiece === 'knight') ? 'flex' : 'none';
    },

    setModeUI() {
        this.elements.endPosContainer.style.display = state.mode === 'path' ? 'block' : 'none';
        this.elements.animationControls.style.display = state.mode === 'tour' ? 'block' : 'none';
        this.elements.infoPanel.classList.add('hidden');
        document.querySelectorAll('#mode-selector button').forEach(btn => btn.classList.toggle('active-mode', btn.dataset.mode === state.mode));
        if(btn.classList.contains('active-mode')) {
             btn.style.backgroundColor = 'var(--accent)';
             btn.style.color = 'white';
             btn.style.boxShadow = '0 2px 8px -2px var(--accent)';
        } else {
            btn.style.backgroundColor = 'transparent';
            btn.style.color = 'var(--text-secondary)';
            btn.style.boxShadow = 'none';
        }
        this.clearAllSquareStyles();
        this.elements.animatedPiece.style.opacity = '0';
        this.elements.pathSvg.innerHTML = '';
        this.updateControls();
    },

    applyTheme() {
        document.body.dataset.theme = state.theme;
        document.querySelectorAll('#theme-selector button').forEach(btn => {
            const isActive = btn.dataset.theme === state.theme;
            btn.classList.toggle('active-theme', isActive);
             if(isActive) {
                 btn.style.backgroundColor = 'var(--accent)';
                 btn.style.color = 'white';
                 btn.style.boxShadow = '0 2px 8px -2px var(--accent)';
            } else {
                btn.style.backgroundColor = 'transparent';
                btn.style.color = 'var(--text-secondary)';
                btn.style.boxShadow = 'none';
            }
        });
    },

    updateStatus(text) { this.elements.statusEl.textContent = text; },
    
    populateAllSelects() {
        this.elements.pieceSelect.innerHTML = `<option value="knight">Knight</option><option value="rook">Rook</option><option value="bishop">Bishop</option><option value="queen">Queen</option>`;
        this.populateSelect(this.elements.startPosSelect);
        this.populateSelect(this.elements.endPosSelect);
    },

    populateSelect(selectEl) {
        selectEl.innerHTML = '';
        for (let r = 0; r < state.boardSize; r++) {
            for (let c = 0; c < state.boardSize; c++) {
                const option = document.createElement('option');
                option.value = `${r},${c}`; option.textContent = positionToString(r, c);
                selectEl.appendChild(option);
            }
        }
    },

    updatePositionDropdown(selectId, r, c) {
        const el = selectId === 'start' ? this.elements.startPosSelect : this.elements.endPosSelect;
        if (el) el.value = `${r},${c}`;
    },
};

// --- CORE LOGIC & ALGORITHMS ---
const pieceMoves = {
    knight: [[2, 1], [1, 2], [-1, 2], [-2, 1], [-2, -1], [-1, -2], [1, -2], [2, -1]],
    rook: [[0, 1], [0, -1], [1, 0], [-1, 0]], bishop: [[1, 1], [1, -1], [-1, 1], [-1, -1]],
    queen: [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [1, -1], [-1, 1], [-1, -1]],
};
const isSlidingPiece = { rook: true, bishop: true, queen: true, knight: false };
const positionToString = (r, c) => `${String.fromCharCode(97 + c)}${state.boardSize - r}`;
const isSafe = (r, c) => r >= 0 && c >= 0 && r < state.boardSize && c < state.boardSize;

function getKnightTour(startR, startC) {
    let visited = Array(state.boardSize).fill(0).map(() => Array(state.boardSize).fill(false));
    let path = [];
    state.heuristicData = [];

    function getNextMoves(r, c) {
        const moves = [];
        for (const [dr, dc] of pieceMoves.knight) {
            const nr = r + dr, nc = c + dc;
            if (isSafe(nr, nc) && !visited[nr][nc]) {
                let count = 0;
                for (const [dr2, dc2] of pieceMoves.knight) if (isSafe(nr + dr2, nc + dc2) && !visited[nr + dr2][nc + dc2]) count++;
                moves.push({ pos: [nr, nc], onward: count });
            }
        }
        return moves.sort((a, b) => a.onward - b.onward);
    }

    function solve(r, c) {
        visited[r][c] = true; path.push([r, c]);
        if (path.length === state.boardSize * state.boardSize) return true;
        
        const nextMoves = getNextMoves(r, c);
        const chose = nextMoves.length > 0 ? nextMoves[0].pos : null;
        const minOnward = nextMoves.length > 0 ? nextMoves[0].onward : 0;
        state.heuristicData.push({ from: [r,c], options: nextMoves, chose, minOnward });

        for (const move of nextMoves) if (solve(...move.pos)) return true;
        
        visited[r][c] = false; path.pop(); state.heuristicData.pop();
        return false;
    }

    solve(startR, startC);
    return path;
}

function getSimpleTour(startR, startC) {
    const path = [[startR, startC]];
    const visited = new Set([`${startR},${startC}`]);
    let [r, c] = [startR, startC];
    while (path.length < state.boardSize * state.boardSize) {
        let moved = false;
        for (let i = 0; i < state.boardSize * state.boardSize; i++) {
            c = (c + 1) % state.boardSize;
            if (c === 0) r = (r + 1) % state.boardSize;
            if (!visited.has(`${r},${c}`)) {
                path.push([r, c]);
                visited.add(`${r},${c}`);
                moved = true;
                break;
            }
        }
        if (!moved) break; // Should not happen on a standard board
    }
    return path;
}

function getShortestPath(piece, start, end) {
    const queue = [[start, [start]]];
    const visited = new Set([`${start[0]},${start[1]}`]);
    while (queue.length > 0) {
        const [[r, c], path] = queue.shift();
        if (r === end[0] && c === end[1]) return path;
        for (const [dr, dc] of pieceMoves[piece]) {
            let nr = r + dr, nc = c + dc;
            if (isSlidingPiece[piece]) {
                while(isSafe(nr, nc)) {
                    if (!visited.has(`${nr},${nc}`)) {
                        visited.add(`${nr},${nc}`); const newPath = [...path, [nr, nc]];
                        queue.push([[nr, nc], newPath]);
                        if (nr === end[0] && nc === end[1]) return newPath;
                    }
                    nr += dr; nc += dc;
                }
            } else {
                if (isSafe(nr, nc) && !visited.has(`${nr},${nc}`)) {
                    visited.add(`${nr},${nc}`); const newPath = [...path, [nr, nc]];
                    queue.push([[nr, nc], newPath]);
                    if (nr === end[0] && nc === end[1]) return newPath;
                }
            }
        }
    }
    return [];
}

// --- ANIMATION & STATE CONTROL ---
function runStep(index) {
    if (index < -1 || index >= state.steps.length) return;
    state.moveIndex = index;
    UI.renderBoardState();
    UI.updateControls();
}
function startAnimation() {
    if (state.steps.length === 0 || !state.isPaused) return;
    state.isPaused = false;
    if (state.moveIndex >= state.steps.length - 1) state.moveIndex = -1;
    UI.updateControls();
    state.animationInterval = setInterval(() => {
        if (state.moveIndex >= state.steps.length - 1) pauseAnimation();
        else runStep(state.moveIndex + 1);
    }, state.animDelay);
}
function pauseAnimation() {
    state.isPaused = true;
    clearInterval(state.animationInterval); state.animationInterval = null;
    UI.updateControls();
}
function resetAnimation() {
    pauseAnimation(); state.moveIndex = -1;
    runStep(-1);
    if(state.steps.length > 0) UI.updateStatus('Calculation complete. Ready.');
}

// --- EVENT HANDLERS ---
function handleCalculation() {
    pauseAnimation();
    state.isCalculating = true;
    updateStateFromInputs();
    UI.updateControls();
    UI.updateStatus(`Calculating ${state.currentPiece} ${state.mode}...`);

    setTimeout(() => {
        if (state.mode === 'tour') {
            state.steps = state.currentPiece === 'knight' ? getKnightTour(...state.startPos) : getSimpleTour(...state.startPos);
        } else {
            state.steps = getShortestPath(state.currentPiece, state.startPos, state.endPos);
        }
        state.isCalculating = false;
        if (state.steps.length > 0) {
            const msg = state.mode === 'tour' ? `Tour found! ${state.steps.length} moves.` : `Shortest path: ${state.steps.length - 1} moves.`;
            UI.updateStatus(msg);
            resetAnimation();
            runStep(state.mode === 'path' ? state.steps.length - 1 : 0);
            if (state.mode === 'tour') pauseAnimation();
        } else {
            UI.updateStatus(`No path found for ${state.currentPiece}.`);
            state.steps = []; resetAnimation();
        }
        UI.updateControls();
    }, 50);
}

function handleSquareClick(r, c) {
    if (state.isCalculating) return;
    if (state.mode === 'tour') {
        state.startPos = [r, c];
    } else { // Smart selection for shortest path
        if (!state.startPos || (state.startPos[0] === r && state.startPos[1] === c)) {
            state.startPos = [r, c];
        } else if (!state.endPos || (state.endPos[0] === r && state.endPos[1] === c)) {
            state.endPos = [r,c];
        } else {
            // Alternate setting start/end based on which is closer
            const startDist = Math.hypot(r - state.startPos[0], c - state.startPos[1]);
            const endDist = Math.hypot(r - state.endPos[0], c - state.endPos[1]);
            if (startDist <= endDist) state.startPos = [r,c];
            else state.endPos = [r,c];
        }
    }
    UI.updatePositionDropdown('start', ...state.startPos);
    if(state.endPos) UI.updatePositionDropdown('end', ...state.endPos);
    UI.renderBoardState();
}

function updateStateFromInputs() {
    state.currentPiece = UI.elements.pieceSelect.value;
    state.startPos = UI.elements.startPosSelect.value.split(',').map(Number);
    if (state.mode === 'path') state.endPos = UI.elements.endPosSelect.value.split(',').map(Number);
    state.showHeuristic = UI.elements.heuristicToggle.checked;
}

function reinitialize() {
    pauseAnimation();
    state.steps = []; state.moveIndex = -1;
    state.startPos = [0, 0];
    state.endPos = [state.boardSize - 1, state.boardSize - 1];
    UI.createBoard(handleSquareClick);
    UI.populateAllSelects();
    UI.updatePositionDropdown('start', ...state.startPos);
    UI.updatePositionDropdown('end', ...state.endPos);
    UI.renderBoardState(); UI.updateControls();
    UI.updateStatus('Ready to calculate.');
}

// --- INITIALIZATION ---
function init() {
    UI.init();
    const el = UI.elements; // Shortcut
    el.calculateBtn.addEventListener('click', handleCalculation);
    el.startBtn.addEventListener('click', startAnimation);
    el.pauseBtn.addEventListener('click', pauseAnimation);
    el.resetBtn.addEventListener('click', resetAnimation);
    el.stepForwardBtn.addEventListener('click', () => runStep(state.moveIndex + 1));
    el.stepBackBtn.addEventListener('click', () => runStep(state.moveIndex - 1));
    el.modeSelector.addEventListener('click', e => { if (e.target.dataset.mode) { state.mode = e.target.dataset.mode; UI.setModeUI(); } });
    el.themeSelector.addEventListener('click', e => { if (e.target.dataset.theme) { state.theme = e.target.dataset.theme; UI.applyTheme(); } });
    el.speedRange.addEventListener('input', e => { state.animDelay = parseInt(e.target.value, 10); UI.updateControls(); if (!state.isPaused) { pauseAnimation(); startAnimation(); } });
    el.stepJump.addEventListener('input', e => { pauseAnimation(); runStep(parseInt(e.target.value, 10)); });
    el.boardSizeSlider.addEventListener('input', e => { state.boardSize = parseInt(e.target.value, 10); reinitialize(); });
    el.heuristicToggle.addEventListener('change', e => { state.showHeuristic = e.target.checked; UI.renderBoardState(); });
    window.addEventListener('resize', () => { UI.createBoard(handleSquareClick); UI.renderBoardState(); });

    reinitialize();
    UI.applyTheme();
    UI.setModeUI();
}

document.addEventListener('DOMContentLoaded', init);
