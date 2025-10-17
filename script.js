/**
 * script.js
 * This script manages the application state and core logic for the Chess Tour visualizer.
 * It handles tour calculations, animation timing, and user input, but delegates
 * all direct DOM manipulation to the `ui.js` module.
 */
import * as ui from './ui.js';

// --- STATE MANAGEMENT ---
const state = {
    boardSize: 8,
    steps: [],
    moveIndex: -1,
    animationInterval: null,
    animDelay: 300,
    isPaused: true,
    isCalculating: false,
    currentPiece: 'knight'
};

// --- KNIGHT MOVES ---
const knightMoves = [
    [2, 1], [1, 2], [-1, 2], [-2, 1],
    [-2, -1], [-1, -2], [1, -2], [2, -1]
];

// --- UTILITY FUNCTIONS ---
const positionToString = (r, c) => `${String.fromCharCode(97 + c)}${state.boardSize - r}`;

// --- TOUR ALGORITHMS ---

function getKnightTour(startRow, startCol) {
    let visitedGrid = Array(state.boardSize).fill(null).map(() => Array(state.boardSize).fill(false));
    let path = [];
    let tourFound = false;

    function isSafe(x, y) {
        return x >= 0 && y >= 0 && x < state.boardSize && y < state.boardSize && !visitedGrid[x][y];
    }

    function getNextMovesOrdered(x, y) {
        const possibleMoves = [];
        for (const [dx, dy] of knightMoves) {
            let nx = x + dx, ny = y + dy;
            if (isSafe(nx, ny)) {
                let onwardCount = 0;
                for (const [ddx, ddy] of knightMoves) {
                    if (isSafe(nx + ddx, ny + ddy)) onwardCount++;
                }
                possibleMoves.push({ pos: [nx, ny], onward: onwardCount });
            }
        }
        possibleMoves.sort((a, b) => a.onward - b.onward);
        return possibleMoves.map(m => m.pos);
    }

    function solve(x, y, moveCount) {
        visitedGrid[x][y] = true;
        path.push([x, y]);

        if (moveCount === state.boardSize * state.boardSize) {
            tourFound = true;
            return true;
        }

        const nextMoves = getNextMovesOrdered(x, y);
        for (const [nx, ny] of nextMoves) {
            if (tourFound) return true;
            if (solve(nx, ny, moveCount + 1)) return true;
        }

        // Backtrack
        visitedGrid[x][y] = false;
        path.pop();
        return false;
    }

    solve(startRow, startCol, 1);
    return path;
}
    
function getRookTour(startRow, startCol) {
    const path = [];
    const visited = new Set();
    
    path.push([startRow, startCol]);
    visited.add(`${startRow},${startCol}`);
    
    for (let r = 0; r < state.boardSize; r++) {
        const rowOrder = (r % 2 === 0) ? Array.from({length: state.boardSize}, (_, i) => i) : Array.from({length: state.boardSize}, (_, i) => state.boardSize - 1 - i);
        for(const c of rowOrder) {
             if (!visited.has(`${r},${c}`)) {
                path.push([r, c]);
                visited.add(`${r},${c}`);
            }
        }
    }
    const startIndex = path.findIndex(([r,c]) => r === startRow && c === startCol);
    if(startIndex > 0){
         const startElement = path.splice(startIndex, 1);
         path.unshift(startElement[0]);
    }
    return path;
}

function getBishopTour(startRow, startCol) {
    const path = [];
    const startColor = (startRow + startCol) % 2;
    for (let r = 0; r < state.boardSize; r++) {
        for (let c = 0; c < state.boardSize; c++) {
            if ((r + c) % 2 === startColor) {
                path.push([r, c]);
            }
        }
    }
    const startIndex = path.findIndex(([r,c]) => r === startRow && c === startCol);
    if (startIndex > 0) {
        const startElement = path.splice(startIndex, 1);
        path.unshift(startElement[0]);
    }
    return path;
}

function getQueenTour(startRow, startCol) {
    const rookPath = getRookTour(startRow, startCol);
    const visited = new Set(rookPath.map(([r, c]) => `${r},${c}`));
    const bishopPath = getBishopTour(startRow, startCol);
    const uniqueBishop = bishopPath.filter(([r,c]) => !visited.has(`${r},${c}`));
    return [...rookPath, ...uniqueBishop];
}

// --- ANIMATION & STATE LOGIC ---

function runStep(index) {
    if (index < -1 || index >= state.steps.length) return;
    state.moveIndex = index;
    ui.renderBoardState(state);
    ui.updateControls(state);
}

function startAnimation() {
    if (state.steps.length === 0 || !state.isPaused) return;
    state.isPaused = false;
    
    if (state.moveIndex >= state.steps.length - 1) {
        state.moveIndex = -1;
    }
    
    ui.updateControls(state);

    state.animationInterval = setInterval(() => {
        if (state.moveIndex >= state.steps.length - 1) {
            pauseAnimation();
        } else {
            runStep(state.moveIndex + 1);
        }
    }, state.animDelay);
}

function pauseAnimation() {
    state.isPaused = true;
    clearInterval(state.animationInterval);
    state.animationInterval = null;
    ui.updateControls(state);
}

function resetAnimation() {
    pauseAnimation();
    state.moveIndex = -1;
    runStep(-1);
    ui.updateStatus('Ready to start');
}

// --- EVENT HANDLERS ---

function handleGenerateTour() {
    pauseAnimation();
    state.isCalculating = true;
    ui.updateControls(state);
    
    const startPosSelect = document.getElementById('startPos');
    const [startRow, startCol] = startPosSelect.value.split(',').map(Number);
    state.currentPiece = document.getElementById('pieceSelect').value;
    
    ui.updateStatus(`Calculating ${state.currentPiece} tour...`);

    // Use setTimeout to allow the UI to update before the heavy calculation
    setTimeout(() => {
        switch(state.currentPiece) {
            case 'knight': state.steps = getKnightTour(startRow, startCol); break;
            case 'rook': state.steps = getRookTour(startRow, startCol); break;
            case 'bishop': state.steps = getBishopTour(startRow, startCol); break;
            case 'queen': state.steps = getQueenTour(startRow, startCol); break;
        }

        state.isCalculating = false;
        if (state.steps.length > 0) {
             ui.updateStatus(`Tour found! Length: ${state.steps.length}`);
        } else {
             ui.updateStatus(`No full tour found for ${state.currentPiece}.`);
        }
        resetAnimation();
        runStep(0); // Show the first step
        pauseAnimation(); // But keep it paused
    }, 50);
}

function handleSquareClick(r, c) {
    if (state.isCalculating) return;
    ui.updateStartPosDropdown(r, c);
    handleGenerateTour();
}

function handleKeyboard(e) {
    if (['INPUT', 'SELECT'].includes(e.target.tagName)) return;
    
    const keyMap = {
        ' ': () => state.isPaused ? startAnimation() : pauseAnimation(),
        'ArrowRight': () => document.getElementById('stepForwardBtn').click(),
        'ArrowLeft': () => document.getElementById('stepBackBtn').click(),
        'r': () => document.getElementById('resetBtn').click(),
        'R': () => document.getElementById('resetBtn').click(),
    };

    if (keyMap[e.key]) {
        e.preventDefault();
        keyMap[e.key]();
    }
}

// --- INITIALIZATION ---
function init() {
    // Setup UI
    ui.initialize(state.boardSize, handleSquareClick);
    ui.fillStartPositionOptions(state.boardSize, positionToString);
    
    // Add Event Listeners
    const controls = {
        startBtn: startAnimation,
        pauseBtn: pauseAnimation,
        resetBtn: resetAnimation,
        stepForwardBtn: () => runStep(state.moveIndex + 1),
        stepBackBtn: () => runStep(state.moveIndex - 1),
        pieceSelect: handleGenerateTour,
        startPos: handleGenerateTour
    };

    document.getElementById('startBtn').addEventListener('click', controls.startBtn);
    document.getElementById('pauseBtn').addEventListener('click', controls.pauseBtn);
    document.getElementById('resetBtn').addEventListener('click', controls.resetBtn);
    document.getElementById('stepForwardBtn').addEventListener('click', controls.stepForwardBtn);
    document.getElementById('stepBackBtn').addEventListener('click', controls.stepBackBtn);
    document.getElementById('pieceSelect').addEventListener('change', controls.pieceSelect);
    document.getElementById('startPos').addEventListener('change', controls.startPos);

    document.getElementById('speedRange').addEventListener('input', (e) => {
        state.animDelay = parseInt(e.target.value, 10);
        ui.updateControls(state);
        if (!state.isPaused) { // If animation is running, restart with new speed
            pauseAnimation();
            startAnimation();
        }
    });

    document.getElementById('stepJump').addEventListener('input', (e) => {
        pauseAnimation();
        runStep(parseInt(e.target.value, 10));
    });

    window.addEventListener('keydown', handleKeyboard);
    // Handle resize to recalculate square sizes
    window.addEventListener('resize', () => {
        ui.initialize(state.boardSize, handleSquareClick);
        ui.renderBoardState(state);
    });

    // Initial tour generation
    handleGenerateTour();
}

// Wait for the DOM to be fully loaded before running the script
document.addEventListener('DOMContentLoaded', init);
