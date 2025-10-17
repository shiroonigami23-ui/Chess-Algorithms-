/**
 * ui.js: Handles all direct DOM manipulation.
 */

// New, high-quality SVG icons for chess pieces
const pieceSvgs = {
    knight: `<svg viewBox="0 0 45 45"><g fill="none" fill-rule="evenodd" stroke="var(--piece-dark)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22.5 9.5c3.5-2 6.5-2 9 0 .5 4.5-1.5 7.5-3.5 9.5-2.5 2.5-5.5 2.5-8 0-2-2-2.5-4-2.5-6 0-1.5.5-3.5 5-3.5zM15.5 28.5l2-1.5 1.5 1.5c-2 2-2.5 4.5-1.5 6.5l-1 1-1-1c-1-2 0-4 1-5.5z" fill="var(--piece-light)"/><path d="M22.5 26.5c-2.5-2-2-4.5-1-6.5l1-1.5 1.5 1.5-1 1.5-1 1.5c1.5 1.5 2.5 2.5 3.5 4.5l2.5 4.5c.5 1 1.5 1.5 2.5 1.5s2-.5 2.5-1.5l-1.5-5c-.5-1.5 0-2.5 1-3.5 1-1 2-1.5 3.5-1.5 1.5 0 2.5.5 3.5 1.5l1 1" fill="var(--piece-light)"/><path d="M12.5 31.5c-3-1-5-2.5-5-5.5 0-4.5 4-6.5 7-6.5 3 0 4.5 2 4.5 4s-1.5 3.5-4.5 3.5c-2.5 0-5 0-7-1.5z" fill="var(--piece-light)"/><path d="M29.5 32.5c-3 1-5 2.5-5 5.5 0 4.5 4 6.5 7 6.5 3 0 4.5-2 4.5-4s-1.5-3.5-4.5-3.5c-2.5 0-5 0-7-1.5z" fill="var(--piece-light)"/></g></svg>`,
    rook: `<svg viewBox="0 0 45 45"><g fill="var(--piece-light)" fill-rule="evenodd" stroke="var(--piece-dark)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 39h27v-3H9v3zM12 36v-4h21v4H12zM11 14V9h4v2h5V9h5v2h5V9h4v5" stroke-linecap="butt"/><path d="M34 14l-3 3H14l-3-3"/><path d="M31 17v12.5H14V17" stroke-linecap="butt" stroke-linejoin="miter"/><path d="M31 29.5l1.5 2.5h-20l1.5-2.5"/><path d="M14 17h17" fill="none" stroke-linejoin="miter"/></g></svg>`,
    bishop: `<svg viewBox="0 0 45 45"><g fill="var(--piece-light)" fill-rule="evenodd" stroke="var(--piece-dark)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 39h27v-3H9v3zM12 36v-4h21v4H12zM15 32V15h15v17H15z"/><path d="M25 8.5c-1.5-2-3.5-2.5-5-2.5-1.5 0-3.5.5-5 2.5" fill="var(--piece-light)"/><path d="M15 15l7.5 1-7.5-11.5M30 15l-7.5 1 7.5-11.5" fill="var(--piece-light)"/><path d="M22.5 16c2.5-2 4-2.5 5-2.5s2.5.5 3.5 1.5c1 .5 1.5 1.5 1.5 2 0 2-1.5 3-4.5 3-2.5 0-4-1-5.5-2.5zM22.5 25c-2.5-2.5-4-3-5.5-3-2.5 0-4 .5-5 2-1 1.5-1 2.5.5 4 1 1 2.5 1 4 0 2-1 3.5-2 5-3.5z" fill="var(--piece-light)"/><path d="M22.5 22.5c0 4-2.5 5.5-5.5 5.5s-5.5-1.5-5.5-5.5c0-4 2.5-5.5 5.5-5.5s5.5 1.5 5.5 5.5z" fill="var(--piece-light)"/></g></svg>`,
    queen: `<svg viewBox="0 0 45 45"><g fill="var(--piece-light)" fill-rule="evenodd" stroke="var(--piece-dark)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM41 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM14 13.5a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM35 13.5a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM22.5 7a2 2 0 1 1-4 0 2 2 0 0 1 4 0z" fill="var(--piece-light)"/><path d="M9 39h27v-3H9v3zM12 36v-4h21v4H12z"/><path d="M11.5 32l3.5-15.5h15L33.5 32" stroke-linecap="butt"/><path d="M12 18.5h21" fill="none"/><circle cx="6" cy="12" r="2" fill="var(--piece-light)"/><circle cx="12" cy="13.5" r="2" fill="var(--piece-light)"/><circle cx="20.5" cy="7" r="2" fill="var(--piece-light)"/><circle cx="24.5" cy="7" r="2" fill="var(--piece-light)"/><circle cx="33" cy="13.5" r="2" fill="var(--piece-light)"/><circle cx="39" cy="12" r="2" fill="var(--piece-light)"/></g></svg>`,
};

let elements, squareSize = 0, boardSquares = [];

export function initUI() {
    elements = { /* ... all element lookups ... */ 
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
    };
}

export function createBoard(boardSize, onSquareClick) {
    elements.board.innerHTML = '';
    boardSquares = [];
    elements.board.style.setProperty('--board-size', boardSize);
    squareSize = elements.board.clientWidth / boardSize;
    elements.animatedPiece.style.width = `${squareSize}px`;
    elements.animatedPiece.style.height = `${squareSize}px`;
    for (let r = 0; r < boardSize; r++) {
        boardSquares[r] = [];
        for (let c = 0; c < boardSize; c++) {
            const sq = document.createElement('div');
            sq.className = 'square selectable';
            sq.classList.add((r + c) % 2 === 0 ? 'light' : 'dark');
            sq.dataset.row = r; sq.dataset.col = c;
            sq.addEventListener('click', () => onSquareClick(r, c));
            elements.board.appendChild(sq);
            boardSquares[r][c] = sq;
        }
    }
}

export function renderBoardState(state) {
    const { steps, moveIndex, currentPiece, mode, startPos, endPos, boardSize } = state;
    clearAllSquareStyles();
    elements.pathSvg.innerHTML = '';
    elements.pathSvg.className = `path-svg ${mode}-path`;
    if (startPos) boardSquares[startPos[0]][startPos[1]].classList.add('start-point');
    if (endPos && mode === 'path') boardSquares[endPos[0]][endPos[1]].classList.add('end-point');
    if (moveIndex < 0 || steps.length === 0) {
        elements.animatedPiece.style.opacity = '0'; return;
    }
    steps.slice(0, moveIndex + 1).forEach(([r, c]) => boardSquares[r][c].classList.add('visited'));
    const [currR, currC] = steps[moveIndex];
    if (boardSquares[currR]?.[currC]) boardSquares[currR][currC].classList.add('current-path');
    moveAnimatedPiece(currR, currC, currentPiece);
    drawPath(steps, moveIndex);
}

function moveAnimatedPiece(r, c, piece) {
    elements.animatedPiece.innerHTML = pieceSvgs[piece] || '';
    elements.animatedPiece.style.transform = `translate(${c * squareSize}px, ${r * squareSize}px)`;
    elements.animatedPiece.style.opacity = '1';
}

function drawPath(steps, moveIndex) {
    let pathHtml = '';
    for (let i = 0; i < moveIndex; i++) {
        const [r1, c1] = steps[i]; const [r2, c2] = steps[i + 1];
        const x1 = (c1 + 0.5) * squareSize, y1 = (r1 + 0.5) * squareSize;
        const x2 = (c2 + 0.5) * squareSize, y2 = (r2 + 0.5) * squareSize;
        pathHtml += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" style="animation-delay: ${i*0.02}s"/>`;
    }
    elements.pathSvg.innerHTML = pathHtml;
}

export function updateControls(state) {
    const { isPaused, isCalculating, steps, moveIndex, animDelay, mode, boardSize } = state;
    elements.startBtn.disabled = !isPaused || isCalculating || steps.length === 0;
    elements.pauseBtn.disabled = isPaused || isCalculating || steps.length === 0;
    elements.resetBtn.disabled = steps.length === 0 || isCalculating;
    elements.stepBackBtn.disabled = moveIndex <= 0 || !isPaused || isCalculating;
    elements.stepForwardBtn.disabled = moveIndex >= steps.length - 1 || !isPaused || isCalculating;
    elements.calculateBtn.disabled = isCalculating;
    elements.calculateBtn.textContent = isCalculating ? "Calculating..." : `Calculate ${mode === 'tour' ? 'Tour' : 'Path'}`;
    elements.animationControls.style.display = mode === 'tour' ? 'block' : 'none';
    elements.speedLabel.textContent = `${animDelay} ms`;
    elements.stepJump.max = steps.length > 0 ? steps.length - 1 : 0;
    elements.stepJump.value = moveIndex < 0 ? 0 : moveIndex;
    elements.stepJumpLabel.textContent = moveIndex < 0 ? 0 : moveIndex + 1;
    elements.boardSizeLabel.textContent = `${boardSize}x${boardSize}`;
}

export function setModeUI(mode) {
    elements.endPosContainer.style.display = mode === 'path' ? 'block' : 'none';
    elements.animationControls.style.display = mode === 'tour' ? 'block' : 'none';
    document.querySelectorAll('#mode-selector button').forEach(btn => btn.classList.toggle('active-mode', btn.dataset.mode === mode));
    clearAllSquareStyles();
    elements.animatedPiece.style.opacity = '0';
    elements.pathSvg.innerHTML = '';
}

export function applyTheme(theme) {
    document.body.dataset.theme = theme;
    document.querySelectorAll('#theme-selector button').forEach(btn => btn.classList.toggle('active-theme', btn.dataset.theme === theme));
}

export function updateStatus(text) { elements.statusEl.textContent = text; }

function populateSelect(selectEl, boardSize, positionToString) {
    selectEl.innerHTML = '';
    for (let r = 0; r < boardSize; r++) {
        for (let c = 0; c < boardSize; c++) {
            const option = document.createElement('option');
            option.value = `${r},${c}`; option.textContent = positionToString(r, c);
            selectEl.appendChild(option);
        }
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

function clearAllSquareStyles() {
    boardSquares.flat().forEach(sq => sq.classList.remove('visited', 'current-path', 'start-point', 'end-point'));
}
