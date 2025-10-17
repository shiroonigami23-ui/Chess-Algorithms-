/**
 * ui.js: Handles all direct DOM manipulation.
 * Now supports dual board rendering for algorithm comparison.
 */
let elements, squareSize = {}, boardSquares = {};

const pieceSvgs = {
    knight: `<svg viewBox="0 0 45 45"><g fill="none" fill-rule="evenodd" stroke="var(--piece-dark)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22.5 9.5c3.5-2 6.5-2 9 0 .5 4.5-1.5 7.5-3.5 9.5-2.5 2.5-5.5 2.5-8 0-2-2-2.5-4-2.5-6 0-1.5.5-3.5 5-3.5zM15.5 28.5l2-1.5 1.5 1.5c-2 2-2.5 4.5-1.5 6.5l-1 1-1-1c-1-2 0-4 1-5.5z" fill="var(--piece-light)"/><path d="M22.5 26.5c-2.5-2-2-4.5-1-6.5l1-1.5 1.5 1.5-1 1.5-1 1.5c1.5 1.5 2.5 2.5 3.5 4.5l2.5 4.5c.5 1 1.5 1.5 2.5 1.5s2-.5 2.5-1.5l-1.5-5c-.5-1.5 0-2.5 1-3.5 1-1 2-1.5 3.5-1.5 1.5 0 2.5.5 3.5 1.5l1 1" fill="var(--piece-light)"/><path d="M12.5 31.5c-3-1-5-2.5-5-5.5 0-4.5 4-6.5 7-6.5 3 0 4.5 2 4.5 4s-1.5 3.5-4.5 3.5c-2.5 0-5 0-7-1.5z" fill="var(--piece-light)"/><path d="M29.5 32.5c-3 1-5 2.5-5 5.5 0 4.5 4 6.5 7 6.5 3 0 4.5-2 4.5-4s-1.5-3.5-4.5-3.5c-2.5 0-5 0-7-1.5z" fill="var(--piece-light)"/></g></svg>`,
    rook: `<svg viewBox="0 0 45 45"><g fill="var(--piece-light)" fill-rule="evenodd" stroke="var(--piece-dark)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 39h27v-3H9v3zM12 36v-4h21v4H12zM11 14V9h4v2h5V9h5v2h5V9h4v5" stroke-linecap="butt"/><path d="M34 14l-3 3H14l-3-3"/><path d="M31 17v12.5H14V17" stroke-linecap="butt" stroke-linejoin="miter"/><path d="M31 29.5l1.5 2.5h-20l1.5-2.5"/><path d="M14 17h17" fill="none" stroke-linejoin="miter"/></g></svg>`,
    bishop: `<svg viewBox="0 0 45 45"><g fill="var(--piece-light)" fill-rule="evenodd" stroke="var(--piece-dark)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 39h27v-3H9v3zM12 36v-4h21v4H12zM15 32V15h15v17H15z"/><path d="M25 8.5c-1.5-2-3.5-2.5-5-2.5-1.5 0-3.5.5-5 2.5" fill="var(--piece-light)"/><path d="M15 15l7.5 1-7.5-11.5M30 15l-7.5 1 7.5-11.5" fill="var(--piece-light)"/><path d="M22.5 16c2.5-2 4-2.5 5-2.5s2.5.5 3.5 1.5c1 .5 1.5 1.5 1.5 2 0 2-1.5 3-4.5 3-2.5 0-4-1-5.5-2.5zM22.5 25c-2.5-2.5-4-3-5.5-3-2.5 0-4 .5-5 2-1 1.5-1 2.5.5 4 1 1 2.5 1 4 0 2-1 3.5-2 5-3.5z" fill="var(--piece-light)"/><path d="M22.5 22.5c0 4-2.5 5.5-5.5 5.5s-5.5-1.5-5.5-5.5c0-4 2.5-5.5 5.5-5.5s5.5 1.5 5.5 5.5z" fill="var(--piece-light)"/></g></svg>`,
    queen: `<svg viewBox="0 0 45 45"><g fill="var(--piece-light)" fill-rule="evenodd" stroke="var(--piece-dark)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM41 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM14 13.5a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM35 13.5a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM22.5 7a2 2 0 1 1-4 0 2 2 0 0 1 4 0z" fill="var(--piece-light)"/><path d="M9 39h27v-3H9v3zM12 36v-4h21v4H12z"/><path d="M11.5 32l3.5-15.5h15L33.5 32" stroke-linecap="butt"/><path d="M12 18.5h21" fill="none"/><circle cx="6" cy="12" r="2" fill="var(--piece-light)"/><circle cx="12" cy="13.5" r="2" fill="var(--piece-light)"/><circle cx="20.5" cy="7" r="2" fill="var(--piece-light)"/><circle cx="24.5" cy="7" r="2" fill="var(--piece-light)"/><circle cx="33" cy="13.5" r="2" fill="var(--piece-light)"/><circle cx="39" cy="12" r="2" fill="var(--piece-light)"/></g></svg>`,
};

export function initUI() {
    elements = {
        board: document.getElementById('board'), animatedPiece: document.getElementById('animated-piece'),
        pathSvg: document.getElementById('path-svg'), pieceSelect: document.getElementById('pieceSelect'),
        startPosSelect: document.getElementById('startPos'), endPosSelect: document.getElementById('endPos'),
        endPosContainer: document.getElementById('end-pos-container'), calculateBtn: document.getElementById('calculateBtn'),
        statusEl: document.getElementById('status'), speedLabel: document.getElementById('speedLabel'),
        stepJumpLabel: document.getElementById('stepJumpLabel'), stepJump: document.getElementById('stepJump'),
        animationControls: document.getElementById('animation-controls'), modeSelector: document.getElementById('mode-selector'),
        themeSelector: document.getElementById('theme-selector'), boardSizeSlider: document.getElementById('boardSize'),
        boardSizeLabel: document.getElementById('boardSizeLabel'), startBtn: document.getElementById('startBtn'),
        pauseBtn: document.getElementById('pauseBtn'), resetBtn: document.getElementById('resetBtn'),
        stepBackBtn: document.getElementById('stepBackBtn'), stepForwardBtn: document.getElementById('stepForwardBtn'),
        singleBoardView: document.getElementById('single-board-view'), dualBoardView: document.getElementById('dual-board-view'),
        boardBfs: document.getElementById('board-bfs'), boardGreedy: document.getElementById('board-greedy'),
        pathSvgBfs: document.getElementById('path-svg-bfs'), pathSvgGreedy: document.getElementById('path-svg-greedy'),
        statusBfs: document.getElementById('status-bfs'), statusGreedy: document.getElementById('status-greedy'),
    };
}

export function createBoard(boardId, boardSize, onSquareClick, onSquareRightClick) {
    const boardEl = document.getElementById(boardId);
    boardEl.innerHTML = '';
    boardSquares[boardId] = [];
    boardEl.style.setProperty('--board-size', boardSize);
    squareSize[boardId] = boardEl.clientWidth / boardSize;
    if (boardId === 'board') {
        elements.animatedPiece.style.width = `${squareSize[boardId]}px`;
        elements.animatedPiece.style.height = `${squareSize[boardId]}px`;
    }
    for (let r = 0; r < boardSize; r++) {
        boardSquares[boardId][r] = [];
        for (let c = 0; c < boardSize; c++) {
            const sq = document.createElement('div');
            sq.className = 'square selectable';
            sq.classList.add((r + c) % 2 === 0 ? 'light' : 'dark');
            sq.addEventListener('click', () => onSquareClick(r, c, boardId));
            sq.addEventListener('contextmenu', (e) => { e.preventDefault(); onSquareRightClick(r, c); });
            boardSquares[boardId][r][c] = sq;
            boardEl.appendChild(sq);
        }
    }
}

export function renderBoardState(state) {
    clearAllSquareStyles('board');
    elements.pathSvg.innerHTML = '';
    elements.pathSvg.className = `path-svg ${state.mode}-path`;
    if (state.startPos) boardSquares['board'][state.startPos[0]][state.startPos[1]].classList.add('start-point');
    if (state.endPos && state.mode === 'path') boardSquares['board'][state.endPos[0]][state.endPos[1]].classList.add('end-point');
    state.obstacles.forEach(obs => boardSquares['board'][obs[0]][obs[1]].classList.add('obstacle'));
    if (state.moveIndex < 0 || state.steps.length === 0) {
        elements.animatedPiece.style.opacity = '0'; return;
    }
    state.steps.slice(0, state.moveIndex + 1).forEach(([r, c]) => boardSquares['board'][r][c].classList.add('visited'));
    const [currR, currC] = state.steps[state.moveIndex];
    if (boardSquares['board'][currR]?.[currC]) boardSquares['board'][currR][currC].classList.add('current-path');
    moveAnimatedPiece(currR, currC, state.currentPiece);
    drawPath(elements.pathSvg, 'board', state.steps, state.moveIndex);
}

function moveAnimatedPiece(r, c, piece) {
    elements.animatedPiece.innerHTML = pieceSvgs[piece] || '';
    elements.animatedPiece.style.transform = `translate(${c * squareSize['board']}px, ${r * squareSize['board']}px)`;
    elements.animatedPiece.style.opacity = '1';
}

function drawPath(svgEl, boardId, steps, moveIndex) {
    let pathHtml = '';
    for (let i = 0; i < moveIndex; i++) {
        const [r1, c1] = steps[i]; const [r2, c2] = steps[i + 1];
        const x1 = (c1 + 0.5) * squareSize[boardId], y1 = (r1 + 0.5) * squareSize[boardId];
        const x2 = (c2 + 0.5) * squareSize[boardId], y2 = (r2 + 0.5) * squareSize[boardId];
        pathHtml += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" />`;
    }
    svgEl.innerHTML = pathHtml;
    svgEl.classList.add('path-path');
}

export function renderRaceState(bfsResult, greedyResult, state) {
    ['bfs', 'greedy'].forEach(type => {
        const boardId = `board-${type}`;
        const result = type === 'bfs' ? bfsResult : greedyResult;
        clearAllSquareStyles(boardId);
        if (state.startPos) boardSquares[boardId][state.startPos[0]][state.startPos[1]].classList.add('start-point');
        if (state.endPos) boardSquares[boardId][state.endPos[0]][state.endPos[1]].classList.add('end-point');
        state.obstacles.forEach(obs => boardSquares[boardId][obs[0]][obs[1]].classList.add('obstacle'));
        
        result.explored.forEach(([r,c]) => boardSquares[boardId][r][c].classList.add(`explored-${type}`));
        result.path.forEach(([r,c]) => boardSquares[boardId][r][c].classList.add('visited'));

        drawPath(elements[`pathSvg${type.charAt(0).toUpperCase() + type.slice(1)}`], boardId, result.path, result.path.length);
        elements[`status${type.charAt(0).toUpperCase() + type.slice(1)}`].textContent = `Found in ${result.path.length-1} moves. Explored ${result.explored.length} squares.`;
    });
}

export function updateControls(state) {
    elements.startBtn.disabled = !state.isPaused || state.isCalculating || state.steps.length === 0;
    elements.pauseBtn.disabled = state.isPaused || state.isCalculating || state.steps.length === 0;
    elements.resetBtn.disabled = state.steps.length === 0 || state.isCalculating;
    elements.stepBackBtn.disabled = state.moveIndex <= 0 || !state.isPaused || state.isCalculating;
    elements.stepForwardBtn.disabled = state.moveIndex >= state.steps.length - 1 || !state.isPaused || state.isCalculating;
    elements.calculateBtn.disabled = state.isCalculating;
    elements.calculateBtn.textContent = state.isCalculating ? "Calculating..." : `Calculate ${state.mode === 'tour' ? 'Tour' : 'Path'}`;
    elements.animationControls.style.display = state.mode === 'tour' ? 'block' : 'none';
    elements.speedLabel.textContent = `${state.animDelay} ms`;
    elements.stepJump.max = state.steps.length > 0 ? state.steps.length - 1 : 0;
    elements.stepJump.value = state.moveIndex < 0 ? 0 : state.moveIndex;
    elements.stepJumpLabel.textContent = state.moveIndex < 0 ? 0 : state.moveIndex + 1;
    elements.boardSizeLabel.textContent = `${state.boardSize}x${state.boardSize}`;
}

export function setModeUI(mode) {
    elements.endPosContainer.classList.toggle('hidden', mode !== 'path');
    elements.animationControls.style.display = mode === 'tour' ? 'block' : 'none';
    elements.singleBoardView.classList.toggle('hidden', mode === 'path');
    elements.dualBoardView.classList.toggle('hidden', mode !== 'path');
    document.querySelectorAll('#mode-selector button').forEach(btn => btn.classList.toggle('active-mode', btn.dataset.mode === mode));
}

export function applyTheme(theme) {
    document.body.dataset.theme = theme;
    document.querySelectorAll('#theme-selector button').forEach(btn => btn.classList.toggle('active-theme', btn.dataset.theme === theme));
}

export function updateStatus(text) { elements.statusEl.textContent = text; }

function populateSelect(selectEl, boardSize, positionToString) {
    selectEl.innerHTML = '';
    for (let r = 0; r < boardSize; r++) for (let c = 0; c < boardSize; c++) {
        const option = document.createElement('option');
        option.value = `${r},${c}`; option.textContent = positionToString(r, c);
        selectEl.appendChild(option);
    }
}

export function populateAllSelects(boardSize, positionToString) {
    elements.pieceSelect.innerHTML = `<option value="knight">Knight</option><option value="rook">Rook</option><option value="bishop">Bishop</option><option value="queen">Queen</option>`;
    populateSelect(elements.startPosSelect, boardSize, positionToString);
    populateSelect(elements.endPosSelect, boardSize, positionToString);
}

export function updatePositionDropdown(selectId, r, c) {
    const el = selectId === 'start' ? elements.startPosSelect : elements.endPosSelect;
    if (el) el.value = `${r},${c}`;
}

function clearAllSquareStyles(boardId) {
    if (!boardSquares[boardId]) return;
    boardSquares[boardId].flat().forEach(sq => sq.classList.remove('visited', 'current-path', 'start-point', 'end-point', 'obstacle', 'explored-bfs', 'explored-greedy'));
}
