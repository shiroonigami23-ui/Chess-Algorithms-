/**
 * script.js: Manages application state and core logic.
 */
import * as ui from './ui.js';

// --- STATE ---
const state = {
    boardSize: 8,
    mode: 'tour', // 'tour' or 'path'
    currentPiece: 'knight',
    startPos: [0, 0],
    endPos: [7, 7],
    steps: [],
    moveIndex: -1,
    animationInterval: null,
    animDelay: 300,
    isPaused: true,
    isCalculating: false,
};

// --- MOVESET DEFINITIONS ---
const pieceMoves = {
    knight: [[2, 1], [1, 2], [-1, 2], [-2, 1], [-2, -1], [-1, -2], [1, -2], [2, -1]],
    rook: [[0, 1], [0, -1], [1, 0], [-1, 0]],
    bishop: [[1, 1], [1, -1], [-1, 1], [-1, -1]],
    queen: [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [1, -1], [-1, 1], [-1, -1]],
};

const isSlidingPiece = { rook: true, bishop: true, queen: true, knight: false };

const positionToString = (r, c) => `${String.fromCharCode(97 + c)}${state.boardSize - r}`;
const isSafe = (r, c) => r >= 0 && c >= 0 && r < state.boardSize && c < state.boardSize;

// --- ALGORITHMS ---

function getKnightTour(startR, startC) {
    let visited = Array(state.boardSize).fill(0).map(() => Array(state.boardSize).fill(false));
    let path = [];
    
    function getNextMoves(r, c) {
        const moves = [];
        for (const [dr, dc] of pieceMoves.knight) {
            const nr = r + dr, nc = c + dc;
            if (isSafe(nr, nc) && !visited[nr][nc]) {
                let count = 0;
                for (const [dr2, dc2] of pieceMoves.knight) {
                    if (isSafe(nr + dr2, nc + dc2) && !visited[nr + dr2][nc + dc2]) count++;
                }
                moves.push({ r: nr, c: nc, count });
            }
        }
        return moves.sort((a, b) => a.count - b.count);
    }

    function solve(r, c) {
        visited[r][c] = true;
        path.push([r, c]);
        if (path.length === state.boardSize * state.boardSize) return true;
        const nextMoves = getNextMoves(r, c);
        for (const move of nextMoves) {
            if (solve(move.r, move.c)) return true;
        }
        visited[r][c] = false;
        path.pop();
        return false;
    }
    solve(startR, startC);
    return path;
}

function getSimpleTour(piece, startR, startC) {
    // Simplified tour for other pieces for demonstration
    const path = [[startR, startC]];
    const visited = new Set([`${startR},${startC}`]);
    let r = startR, c = startC;
    while(path.length < state.boardSize * state.boardSize){
        c++;
        if(c >= state.boardSize){ c=0; r = (r+1)%state.boardSize; }
        if(!visited.has(`${r},${c}`)){
            path.push([r,c]);
            visited.add(`${r},${c}`);
        }
    }
    return path;
}

function getShortestPath(piece, start, end) {
    const queue = [[start, [start]]]; // [[pos], [path]]
    const visited = new Set([`${start[0]},${start[1]}`]);

    while (queue.length > 0) {
        const [[r, c], path] = queue.shift();
        if (r === end[0] && c === end[1]) return path;

        const moves = pieceMoves[piece];
        for (const [dr, dc] of moves) {
            let nr = r + dr, nc = c + dc;
            
            if (isSlidingPiece[piece]) {
                 while(isSafe(nr, nc)) {
                    if (!visited.has(`${nr},${nc}`)) {
                        visited.add(`${nr},${nc}`);
                        queue.push([[nr, nc], [...path, [nr, nc]]]);
                    }
                    nr += dr; nc += dc;
                 }
            } else { // Knight
                if (isSafe(nr, nc) && !visited.has(`${nr},${nc}`)) {
                    visited.add(`${nr},${nc}`);
                    queue.push([[nr, nc], [...path, [nr, nc]]]);
                }
            }
        }
    }
    return []; // No path found
}


// --- ANIMATION & STATE ---

function runStep(index) {
    if (index < -1 || index >= state.steps.length) return;
    state.moveIndex = index;
    ui.renderBoardState(state);
    ui.updateControls(state);
}

function startAnimation() {
    if (state.steps.length === 0 || !state.isPaused) return;
    state.isPaused = false;
    if (state.moveIndex >= state.steps.length - 1) state.moveIndex = -1;
    ui.updateControls(state);

    state.animationInterval = setInterval(() => {
        if (state.moveIndex >= state.steps.length - 1) pauseAnimation();
        else runStep(state.moveIndex + 1);
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
    ui.updateStatus('Calculation complete. Ready to animate.');
}

// --- EVENT HANDLERS ---

function handleCalculation() {
    pauseAnimation();
    state.isCalculating = true;
    ui.updateControls(state);
    updateStateFromInputs();

    ui.updateStatus(`Calculating ${state.currentPiece} ${state.mode}...`);

    setTimeout(() => {
        if (state.mode === 'tour') {
            state.steps = state.currentPiece === 'knight' 
                ? getKnightTour(...state.startPos)
                : getSimpleTour(state.currentPiece, ...state.startPos);
        } else {
            state.steps = getShortestPath(state.currentPiece, state.startPos, state.endPos);
        }

        state.isCalculating = false;
        if (state.steps.length > 0) {
            const message = state.mode === 'tour' 
                ? `Tour found! Length: ${state.steps.length}`
                : `Shortest path found in ${state.steps.length - 1} moves.`;
            ui.updateStatus(message);
            resetAnimation();
            if (state.mode === 'path') {
                runStep(state.steps.length - 1); // Show full path instantly
            } else {
                 runStep(0); // Show first step for tour
            }
        } else {
            ui.updateStatus(`No path found for ${state.currentPiece}.`);
            state.steps = [];
            resetAnimation();
        }
        ui.updateControls(state);
    }, 50);
}

function handleSquareClick(r, c) {
    if (state.isCalculating) return;
    ui.updatePositionDropdown('start', r, c);
    handleCalculation();
}

function updateStateFromInputs() {
    state.currentPiece = document.getElementById('pieceSelect').value;
    state.startPos = document.getElementById('startPos').value.split(',').map(Number);
    state.endPos = document.getElementById('endPos').value.split(',').map(Number);
}

// --- INITIALIZATION ---
function init() {
    ui.initialize(state.boardSize, handleSquareClick);
    ui.populateAllSelects(state.boardSize, positionToString);
    ui.setMode(state.mode);
    ui.updateControls(state);

    // Event Listeners
    document.getElementById('calculateBtn').addEventListener('click', handleCalculation);
    document.getElementById('startBtn').addEventListener('click', startAnimation);
    document.getElementById('pauseBtn').addEventListener('click', pauseAnimation);
    document.getElementById('resetBtn').addEventListener('click', resetAnimation);
    document.getElementById('stepForwardBtn').addEventListener('click', () => runStep(state.moveIndex + 1));
    document.getElementById('stepBackBtn').addEventListener('click', () => runStep(state.moveIndex - 1));
    
    document.getElementById('mode-selector').addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON') {
            state.mode = e.target.dataset.mode;
            ui.setMode(state.mode);
        }
    });

    document.getElementById('speedRange').addEventListener('input', (e) => {
        state.animDelay = parseInt(e.target.value, 10);
        ui.updateControls(state);
        if (!state.isPaused) { pauseAnimation(); startAnimation(); }
    });

    document.getElementById('stepJump').addEventListener('input', (e) => {
        pauseAnimation();
        runStep(parseInt(e.target.value, 10));
    });
    
    window.addEventListener('resize', () => {
        ui.initialize(state.boardSize, handleSquareClick);
        ui.renderBoardState(state);
    });
}

document.addEventListener('DOMContentLoaded', init);
