/**


// --- DOM Element References ---
const elements = {
    board: document.getElementById('board'),
    boardContainer: document.getElementById('board-container'),
    animatedPiece: document.getElementById('animated-piece'),
    pathSvg: document.getElementById('path-svg'),
    startPosSelect: document.getElementById('startPos'),
    statusEl: document.getElementById('status'),
    speedLabel: document.getElementById('speedLabel'),
    stepJumpLabel: document.getElementById('stepJumpLabel'),
    stepJump: document.getElementById('stepJump'),
    // Buttons
    startBtn: document.getElementById('startBtn'),
    pauseBtn: document.getElementById('pauseBtn'),
    resetBtn: document.getElementById('resetBtn'),
    stepBackBtn: document.getElementById('stepBackBtn'),
    stepForwardBtn: document.getElementById('stepForwardBtn'),
    // Inputs
    pieceSelect: document.getElementById('pieceSelect'),
    speedRange: document.getElementById('speedRange'),
};

let squareSize = 0;
let boardSquares = [];

// --- SVG Icons for Chess Pieces ---
const pieceSvgs = {
    knight: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" fill="#FFFFFF"><path d="M96 32a32 32 0 1 0-64 0 32 32 0 1 0 64 0zM32 128a32 32 0 1 0 0-64 32 32 0 1 0 0 64zM208 64a32 32 0 1 0-64 0 32 32 0 1 0 64 0zm96 64a32 32 0 1 0 0-64 32 32 0 1 0 0 64zM320 32a32 32 0 1 0-64 0 32 32 0 1 0 64 0zm-80 32a32 32 0 1 0-64 0 32 32 0 1 0 64 0zm-16 64a32 32 0 1 0 0-64 32 32 0 1 0 0 64zm-32-64a32 32 0 1 0-64 0 32 32 0 1 0 64 0zm-16 64a32 32 0 1 0 0-64 32 32 0 1 0 0 64zM160 32a32 32 0 1 0-64 0 32 32 0 1 0 64 0zM32 224a32 32 0 1 0 0-64 32 32 0 1 0 0 64zM64 320a32 32 0 1 0 -64 0 32 32 0 1 0 64 0zm-32 32a32 32 0 1 0 0-64 32 32 0 1 0 0 64zm160-32a32 32 0 1 0 -64 0 32 32 0 1 0 64 0zm-48 64a32 32 0 1 0 0-64 32 32 0 1 0 0 64zm-80-64a32 32 0 1 0 -64 0 32 32 0 1 0 64 0zm96 160a32 32 0 1 0 0-64 32 32 0 1 0 0 64zm-32-64a32 32 0 1 0 -64 0 32 32 0 1 0 64 0zm-16 64a32 32 0 1 0 0-64 32 32 0 1 0 0 64zm-32-64a32 32 0 1 0 -64 0 32 32 0 1 0 64 0zm-16 64a32 32 0 1 0 0-64 32 32 0 1 0 0 64zm-80-160a32 32 0 1 0 -64 0 32 32 0 1 0 64 0zm-16 64a32 32 0 1 0 0-64 32 32 0 1 0 0 64zm32-64a32 32 0 1 0 -64 0 32 32 0 1 0 64 0zm-16 64a32 32 0 1 0 0-64 32 32 0 1 0 0 64zm32 64a32 32 0 1 0 0-64 32 32 0 1 0 0 64zm128-96a32 32 0 1 0 -64 0 32 32 0 1 0 64 0zm-16-64a32 32 0 1 0 0-64 32 32 0 1 0 0 64zm-32 64a32 32 0 1 0 -64 0 32 32 0 1 0 64 0zm-16-64a32 32 0 1 0 0-64 32 32 0 1 0 0 64zm-32-64a32 32 0 1 0 -64 0 32 32 0 1 0 64 0zm112 160a32 32 0 1 0 0-64 32 32 0 1 0 0 64zm-32-64a32 32 0 1 0 -64 0 32 32 0 1 0 64 0zm-16 64a32 32 0 1 0 0-64 32 32 0 1 0 0 64zm-32-64a32 32 0 1 0 -64 0 32 32 0 1 0 64 0zm-16 64a32 32 0 1 0 0-64 32 32 0 1 0 0 64zm112-96a32 32 0 1 0 0-64 32 32 0 1 0 0 64zm-32-64a32 32 0 1 0 -64 0 32 32 0 1 0 64 0zm-16 64a32 32 0 1 0 0-64 32 32 0 1 0 0 64zm-32-64a32 32 0 1 0 -64 0 32 32 0 1 0 64 0zm144 32a32 32 0 1 0 0-64 32 32 0 1 0 0 64zm32-64a32 32 0 1 0 -64 0 32 32 0 1 0 64 0zm16 64a32 32 0 1 0 0-64 32 32 0 1 0 0 64zm-64 32a32 32 0 1 0 0-64 32 32 0 1 0 0 64zm-32 64a32 32 0 1 0 0-64 32 32 0 1 0 0 64zm-16-64a32 32 0 1 0 -64 0 32 32 0 1 0 64 0zm112 160a32 32 0 1 0 0-64 32 32 0 1 0 0 64zm-32-64a32 32 0 1 0 -64 0 32 32 0 1 0 64 0zm-16 64a32 32 0 1 0 0-64 32 32 0 1 0 0 64zM320 288a32 32 0 1 0 0-64 32 32 0 1 0 0 64zm-32-64a32 32 0 1 0 -64 0 32 32 0 1 0 64 0zm-16 64a32 32 0 1 0 0-64 32 32 0 1 0 0 64z"/></svg>`,
    rook: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" fill="#FFFFFF"><path d="M32 192V48c0-8.8 7.2-16 16-16h32c8.8 0 16 7.2 16 16V88c0 4.4 3.6 8 8 8h32c4.4 0 8-3.6 8-8V48c0-8.8 7.2-16 16-16h32c8.8 0 16 7.2 16 16V88c0 4.4 3.6 8 8 8h32c4.4 0 8-3.6 8-8V48c0-8.8 7.2-16 16-16h32c8.8 0 16 7.2 16 16V192H32zM416 192H320v32h96V192zM32 224H128V192H32v32zm128 32H288V192H160v64zm160 0h96V192H320v32zM32 288V464c0 26.5 21.5 48 48 48H368c26.5 0 48-21.5 48-48V288H32z"/></svg>`,
    bishop: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" fill="#FFFFFF"><path d="M128 0C110.3 0 96 14.3 96 32c0 16.2 11.9 29.8 27.6 31.8C78.4 106.8 8 192.2 8 320c0 17.7 14.3 32 32 32h240c17.7 0 32-14.3 32-32c0-127.8-70.4-213.2-115.6-256.2C212.1 61.8 224 48.2 224 32c0-17.7-14.3-32-32-32H128zM48 480c0-17.7-14.3-32-32-32s-32 14.3-32 32s14.3 32 32 32s32-14.3 32-32zm224 0c0-17.7-14.3-32-32-32s-32 14.3-32 32s14.3 32 32 32s32-14.3 32-32z"/></svg>`,
    queen: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="#FFFFFF"><path d="M256 0c17.7 0 32 14.3 32 32V48h16c8.8 0 16 7.2 16 16s-7.2 16-16 16H288v16c0 8.8-7.2 16-16 16s-16-7.2-16-16V80H240c-8.8 0-16-7.2-16-16s7.2-16 16-16h16V32c0-17.7 14.3-32 32-32zM128 144c0-35.3 28.7-64 64-64h128c35.3 0 64 28.7 64 64V256h48c17.7 0 32 14.3 32 32s-14.3 32-32 32H448v32c0 17.7-14.3 32-32 32s-32-14.3-32-32V320H128v32c0 17.7-14.3 32-32 32s-32-14.3-32-32V320H16c-17.7 0-32-14.3-32-32s14.3-32 32-32H64V144zM416 480c0 17.7-14.3 32-32 32H128c-17.7 0-32-14.3-32-32s14.3-32 32-32H384c17.7 0 32 14.3 32 32z"/></svg>`,
};

/**
 * Initializes the UI, creating the board and calculating sizes.
 * @param {number} boardSize - The dimension of the board (e.g., 8 for 8x8).
 * @param {function} onSquareClick - Callback function for when a square is clicked.
 */
export function initialize(boardSize, onSquareClick) {
    elements.board.innerHTML = '';
    boardSquares = [];
    squareSize = elements.board.clientWidth / boardSize;

    // Set animated piece size
    elements.animatedPiece.style.width = `${squareSize}px`;
    elements.animatedPiece.style.height = `${squareSize}px`;

    for (let r = 0; r < boardSize; r++) {
        boardSquares[r] = [];
        for (let c = 0; c < boardSize; c++) {
            const sq = document.createElement('div');
            sq.className = 'square flex justify-center items-center font-bold text-lg transition-all duration-300 relative aspect-square';
            sq.classList.add((r + c) % 2 === 0 ? 'bg-cyan-100/80 text-cyan-900' : 'bg-cyan-800/80 text-cyan-200');
            sq.dataset.row = r;
            sq.dataset.col = c;
            sq.addEventListener('click', () => onSquareClick(r, c));
            elements.board.appendChild(sq);
            boardSquares[r][c] = sq;
        }
    }
}

/**
 * Renders the entire board state for a given step in the tour.
 * @param {object} state - The current application state.
 */
export function renderBoardState(state) {
    const { steps, moveIndex, currentPiece } = state;

    // Clear previous styles and paths
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            boardSquares[r][c].classList.remove('visited', 'current-path');
        }
    }
    elements.pathSvg.innerHTML = '';

    if (moveIndex < 0 || steps.length === 0) {
        elements.animatedPiece.style.opacity = '0';
        return;
    }

    // Mark visited squares
    for (let i = 0; i <= moveIndex; i++) {
        const [r, c] = steps[i];
        if (boardSquares[r] && boardSquares[r][c]) {
            boardSquares[r][c].classList.add('visited');
        }
    }

    // Highlight the current square under the piece
    const [currR, currC] = steps[moveIndex];
    if (boardSquares[currR] && boardSquares[currR][c]) {
        boardSquares[currR][currC].classList.add('current-path');
    }

    // Move the animated piece
    moveAnimatedPiece(currR, currC, currentPiece);

    // Draw the path
    drawPath(steps, moveIndex);
}

/**
 * Moves the animated piece to a specific square.
 * @param {number} r - The target row.
 * @param {number} c - The target column.
 * @param {string} piece - The type of piece to display.
 */
function moveAnimatedPiece(r, c, piece) {
    elements.animatedPiece.innerHTML = pieceSvgs[piece] || '';
    elements.animatedPiece.style.transform = `translate(${c * squareSize}px, ${r * squareSize}px)`;
    elements.animatedPiece.style.opacity = '1';
}

/**
 * Draws the SVG path connecting the tour steps.
 * @param {Array<Array<number>>} steps - The array of [row, col] steps.
 * @param {number} moveIndex - The current index in the tour.
 */
function drawPath(steps, moveIndex) {
    let pathHtml = '';
    for (let i = 0; i < moveIndex; i++) {
        const [r1, c1] = steps[i];
        const [r2, c2] = steps[i + 1];

        const x1 = (c1 + 0.5) * squareSize;
        const y1 = (r1 + 0.5) * squareSize;
        const x2 = (c2 + 0.5) * squareSize;
        const y2 = (r2 + 0.5) * squareSize;

        pathHtml += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" />`;
    }
    elements.pathSvg.innerHTML = pathHtml;
}

/**
 * Updates all UI controls (buttons, sliders, text) based on the application state.
 * @param {object} state - The current application state.
 */
export function updateControls(state) {
    const { isPaused, isCalculating, steps, moveIndex, animDelay } = state;
    
    // Buttons
    elements.startBtn.disabled = !isPaused || isCalculating;
    elements.pauseBtn.disabled = isPaused || isCalculating;
    elements.resetBtn.disabled = steps.length === 0 || isCalculating;
    elements.stepBackBtn.disabled = moveIndex <= 0 || !isPaused || isCalculating;
    elements.stepForwardBtn.disabled = moveIndex >= steps.length - 1 || !isPaused || isCalculating;
    
    // Inputs
    elements.pieceSelect.disabled = isCalculating;
    elements.startPosSelect.disabled = isCalculating;
    elements.speedRange.disabled = isCalculating;
    elements.stepJump.disabled = steps.length === 0 || isCalculating;
    
    // Labels & Sliders
    elements.speedLabel.textContent = `${animDelay} ms`;
    if (steps.length > 0) {
        elements.stepJump.max = steps.length - 1;
        elements.stepJump.value = moveIndex;
        elements.stepJumpLabel.textContent = moveIndex < 0 ? 0 : moveIndex + 1;
    } else {
        elements.stepJump.max = 0;
        elements.stepJump.value = 0;
        elements.stepJumpLabel.textContent = 0;
    }
}

/**
 * Updates the main status text display.
 * @param {string} text - The message to display.
 */
export function updateStatus(text) {
    elements.statusEl.textContent = text;
}

/**
 * Populates the start position dropdown menu.
 * @param {number} boardSize - The dimension of the board.
 * @param {function} positionToString - A utility function to convert [r, c] to "a1" style.
 */
export function fillStartPositionOptions(boardSize, positionToString) {
    elements.startPosSelect.innerHTML = '';
    for (let r = 0; r < boardSize; r++) {
        for (let c = 0; c < boardSize; c++) {
            const option = document.createElement('option');
            option.value = `${r},${c}`;
            option.textContent = positionToString(r, c);
            elements.startPosSelect.appendChild(option);
        }
    }
}

/**
 * Updates the selected value of the start position dropdown.
 * @param {number} r - The row to select.
 * @param {number} c - The column to select.
 */
export function updateStartPosDropdown(r, c) {
    elements.startPosSelect.value = `${r},${c}`;
    }
