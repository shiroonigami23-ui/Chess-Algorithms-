/**
 * ui.js: Handles all direct DOM manipulation.
 */

// --- DOM Element References ---
const elements = {
    board: document.getElementById('board'),
    animatedPiece: document.getElementById('animated-piece'),
    pathSvg: document.getElementById('path-svg'),
    pieceSelect: document.getElementById('pieceSelect'),
    startPosSelect: document.getElementById('startPos'),
    endPosSelect: document.getElementById('endPos'),
    endPosContainer: document.getElementById('end-pos-container'),
    calculateBtn: document.getElementById('calculateBtn'),
    statusEl: document.getElementById('status'),
    speedLabel: document.getElementById('speedLabel'),
    stepJumpLabel: document.getElementById('stepJumpLabel'),
    stepJump: document.getElementById('stepJump'),
    animationControls: document.getElementById('animation-controls'),
    modeSelector: document.getElementById('mode-selector'),
    // Buttons
    startBtn: document.getElementById('startBtn'),
    pauseBtn: document.getElementById('pauseBtn'),
    resetBtn: document.getElementById('resetBtn'),
    stepBackBtn: document.getElementById('stepBackBtn'),
    stepForwardBtn: document.getElementById('stepForwardBtn'),
};

let squareSize = 0;
let boardSquares = [];

const pieceSvgs = {
    knight: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" fill="#FFFFFF"><path d="M96 32a32 32 0 1 0-64 0 32 32 0 1 0 64 0zM32 128a32 32 0 1 0 0-64 32 32 0 1 0 0 64zM208 64a32 32 0 1 0-64 0 32 32 0 1 0 64 0zm96 64a32 32 0 1 0 0-64 32 32 0 1 0 0 64zM320 32a32 32 0 1 0-64 0 32 32 0 1 0 64 0zm-80 32a32 32 0 1 0-64 0 32 32 0 1 0 64 0zm-16 64a32 32 0 1 0 0-64 32 32 0 1 0 0 64zm-32-64a32 32 0 1 0-64 0 32 32 0 1 0 64 0zm-16 64a32 32 0 1 0 0-64 32 32 0 1 0 0 64zM160 32a32 32 0 1 0-64 0 32 32 0 1 0 64 0zM32 224a32 32 0 1 0 0-64 32 32 0 1 0 0 64zM64 320a32 32 0 1 0 -64 0 32 32 0 1 0 64 0zm-32 32a32 32 0 1 0 0-64 32 32 0 1 0 0 64zm160-32a32 32 0 1 0 -64 0 32 32 0 1 0 64 0zm-48 64a32 32 0 1 0 0-64 32 32 0 1 0 0 64zm-80-64a32 32 0 1 0 -64 0 32 32 0 1 0 64 0zm96 160a32 32 0 1 0 0-64 32 32 0 1 0 0 64zm-32-64a32 32 0 1 0 -64 0 32 32 0 1 0 64 0zm-16 64a32 32 0 1 0 0-64 32 32 0 1 0 0 64zm-32-64a32 32 0 1 0 -64 0 32 32 0 1 0 64 0zm-16 64a32 32 0 1 0 0-64 32 32 0 1 0 0 64zm-80-160a32 32 0 1 0 -64 0 32 32 0 1 0 64 0zm-16 64a32 32 0 1 0 0-64 32 32 0 1 0 0 64zm32-64a32 32 0 1 0 -64 0 32 32 0 1 0 64 0zm-16 64a32 32 0 1 0 0-64 32 32 0 1 0 0 64zm32 64a32 32 0 1 0 0-64 32 32 0 1 0 0 64zm128-96a32 32 0 1 0 -64 0 32 32 0 1 0 64 0zm-16-64a32 32 0 1 0 0-64 32 32 0 1 0 0 64zm-32 64a32 32 0 1 0 -64 0 32 32 0 1 0 64 0zm-16-64a32 32 0 1 0 0-64 32 32 0 1 0 0 64zm-32-64a32 32 0 1 0 -64 0 32 32 0 1 0 64 0zm112 160a32 32 0 1 0 0-64 32 32 0 1 0 0 64zm-32-64a32 32 0 1 0 -64 0 32 32 0 1 0 64 0zm-16 64a32 32 0 1 0 0-64 32 32 0 1 0 0 64zm-32-64a32 32 0 1 0 -64 0 32 32 0 1 0 64 0zm-16 64a32 32 0 1 0 0-64 32 32 0 1 0 0 64zm112-96a32 32 0 1 0 0-64 32 32 0 1 0 0 64zm-32-64a32 32 0 1 0 -64 0 32 32 0 1 0 64 0zm-16 64a32 32 0 1 0 0-64 32 32 0 1 0 0 64zm-32-64a32 32 0 1 0 -64 0 32 32 0 1 0 64 0zm144 32a32 32 0 1 0 0-64 32 32 0 1 0 0 64zm32-64a32 32 0 1 0 -64 0 32 32 0 1 0 64 0zm16 64a32 32 0 1 0 0-64 32 32 0 1 0 0 64zm-64 32a32 32 0 1 0 0-64 32 32 0 1 0 0 64zm-32 64a32 32 0 1 0 0-64 32 32 0 1 0 0 64zm-16-64a32 32 0 1 0 -64 0 32 32 0 1 0 64 0zm112 160a32 32 0 1 0 0-64 32 32 0 1 0 0 64zm-32-64a32 32 0 1 0 -64 0 32 32 0 1 0 64 0zm-16 64a32 32 0 1 0 0-64 32 32 0 1 0 0 64zM320 288a32 32 0 1 0 0-64 32 32 0 1 0 0 64zm-32-64a32 32 0 1 0 -64 0 32 32 0 1 0 64 0zm-16 64a32 32 0 1 0 0-64 32 32 0 1 0 0 64z"/></svg>`,
    rook: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" fill="#FFFFFF"><path d="M32 192V48c0-8.8 7.2-16 16-16h32c8.8 0 16 7.2 16 16V88c0 4.4 3.6 8 8 8h32c4.4 0 8-3.6 8-8V48c0-8.8 7.2-16 16-16h32c8.8 0 16 7.2 16 16V88c0 4.4 3.6 8 8 8h32c4.4 0 8-3.6 8-8V48c0-8.8 7.2-16 16-16h32c8.8 0 16 7.2 16 16V192H32zM416 192H320v32h96V192zM32 224H128V192H32v32zm128 32H288V192H160v64zm160 0h96V192H320v32zM32 288V464c0 26.5 21.5 48 48 48H368c26.5 0 48-21.5 48-48V288H32z"/></svg>`,
    bishop: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" fill="#FFFFFF"><path d="M128 0C110.3 0 96 14.3 96 32c0 16.2 11.9 29.8 27.6 31.8C78.4 106.8 8 192.2 8 320c0 17.7 14.3 32 32 32h240c17.7 0 32-14.3 32-32c0-127.8-70.4-213.2-115.6-256.2C212.1 61.8 224 48.2 224 32c0-17.7-14.3-32-32-32H128zM48 480c0-17.7-14.3-32-32-32s-32 14.3-32 32s14.3 32 32 32s32-14.3 32-32zm224 0c0-17.7-14.3-32-32-32s-32 14.3-32 32s14.3 32 32 32s32-14.3 32-32z"/></svg>`,
    queen: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="#FFFFFF"><path d="M256 0c17.7 0 32 14.3 32 32V48h16c8.8 0 16 7.2 16 16s-7.2 16-16 16H288v16c0 8.8-7.2 16-16 16s-16-7.2-16-16V80H240c-8.8 0-16-7.2-16-16s7.2-16 16-16h16V32c0-17.7 14.3-32 32-32zM128 144c0-35.3 28.7-64 64-64h128c35.3 0 64 28.7 64 64V256h48c17.7 0 32 14.3 32 32s-14.3 32-32 32H448v32c0 17.7-14.3 32-32 32s-32-14.3-32-32V320H128v32c0 17.7-14.3 32-32 32s-32-14.3-32-32V320H16c-17.7 0-32-14.3-32-32s14.3-32 32-32H64V144zM416 480c0 17.7-14.3 32-32 32H128c-17.7 0-32-14.3-32-32s14.3-32 32-32H384c17.7 0 32 14.3 32 32z"/></svg>`,
};

export function initialize(boardSize, onSquareClick) {
    elements.board.innerHTML = '';
    boardSquares = [];
    squareSize = elements.board.clientWidth / boardSize;
    elements.animatedPiece.style.width = `${squareSize}px`;
    elements.animatedPiece.style.height = `${squareSize}px`;

    for (let r = 0; r < boardSize; r++) {
        boardSquares[r] = [];
        for (let c = 0; c < boardSize; c++) {
            const sq = document.createElement('div');
            sq.className = 'square selectable flex justify-center items-center font-bold text-lg';
            sq.classList.add((r + c) % 2 === 0 ? 'bg-cyan-100/80' : 'bg-cyan-800/80');
            sq.dataset.row = r;
            sq.dataset.col = c;
            sq.addEventListener('click', () => onSquareClick(r, c));
            elements.board.appendChild(sq);
            boardSquares[r][c] = sq;
        }
    }
}

export function renderBoardState(state) {
    const { steps, moveIndex, currentPiece, mode, startPos, endPos } = state;
    clearAllSquareStyles();
    elements.pathSvg.innerHTML = '';
    elements.pathSvg.className = `${mode}-path`;

    if (mode === 'path' && startPos) boardSquares[startPos[0]][startPos[1]].classList.add('start-point');
    if (mode === 'path' && endPos) boardSquares[endPos[0]][endPos[1]].classList.add('end-point');

    if (moveIndex < 0 || steps.length === 0) {
        elements.animatedPiece.style.opacity = '0';
        return;
    }

    steps.slice(0, moveIndex + 1).forEach(([r, c]) => boardSquares[r][c].classList.add('visited'));
    
    const [currR, currC] = steps[moveIndex];
    if (boardSquares[currR]?.[currC]) {
      boardSquares[currR][currC].classList.add('current-path');
    }
    
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
        const [r1, c1] = steps[i];
        const [r2, c2] = steps[i + 1];
        const x1 = (c1 + 0.5) * squareSize, y1 = (r1 + 0.5) * squareSize;
        const x2 = (c2 + 0.5) * squareSize, y2 = (r2 + 0.5) * squareSize;
        pathHtml += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" />`;
    }
    elements.pathSvg.innerHTML = pathHtml;
}

export function updateControls(state) {
    const { isPaused, isCalculating, steps, moveIndex, animDelay, mode } = state;
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
}

export function setMode(mode) {
    elements.endPosContainer.style.display = mode === 'path' ? 'block' : 'none';
    elements.animationControls.style.display = mode === 'tour' ? 'block' : 'none';
    
    document.querySelectorAll('#mode-selector button').forEach(btn => {
        btn.classList.toggle('active-mode', btn.dataset.mode === mode);
    });
    
    clearAllSquareStyles();
    elements.animatedPiece.style.opacity = '0';
    elements.pathSvg.innerHTML = '';
}

export function updateStatus(text) { elements.statusEl.textContent = text; }

function populateSelect(selectEl, boardSize, positionToString) {
    selectEl.innerHTML = '';
    for (let r = 0; r < boardSize; r++) {
        for (let c = 0; c < boardSize; c++) {
            const option = document.createElement('option');
            option.value = `${r},${c}`;
            option.textContent = positionToString(r, c);
            selectEl.appendChild(option);
        }
    }
}

export function populateAllSelects(boardSize, positionToString) {
    elements.pieceSelect.innerHTML = `
        <option value="knight">Knight</option>
        <option value="rook">Rook</option>
        <option value="bishop">Bishop</option>
        <option value="queen">Queen</option>
    `;
    populateSelect(elements.startPosSelect, boardSize, positionToString);
    populateSelect(elements.endPosSelect, boardSize, positionToString);
    elements.endPosSelect.selectedIndex = boardSize * boardSize - 1;
}

export function updatePositionDropdown(selectId, r, c) {
    const el = selectId === 'start' ? elements.startPosSelect : elements.endPosSelect;
    el.value = `${r},${c}`;
}

function clearAllSquareStyles() {
    boardSquares.flat().forEach(sq => sq.classList.remove('visited', 'current-path', 'start-point', 'end-point'));
}
