/**
 * script.js: Manages application state and core logic.
 * FIXES: Corrected BFS for sliding pieces, fixed theme logic, added animations.
 * NEW: Board size is now configurable.
 */
import * as ui from './ui.js';

const state = {
    boardSize: 8, theme: 'dark', mode: 'tour', currentPiece: 'knight',
    startPos: null, endPos: null, steps: [], moveIndex: -1,
    animationInterval: null, animDelay: 300, isPaused: true, isCalculating: false,
};

const pieceMoves = { /* ... same as before ... */ 
    knight: [[2, 1], [1, 2], [-1, 2], [-2, 1], [-2, -1], [-1, -2], [1, -2], [2, -1]],
    rook: [[0, 1], [0, -1], [1, 0], [-1, 0]], bishop: [[1, 1], [1, -1], [-1, 1], [-1, -1]],
    queen: [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [1, -1], [-1, 1], [-1, -1]],
};
const isSlidingPiece = { rook: true, bishop: true, queen: true, knight: false };
const positionToString = (r, c) => `${String.fromCharCode(97 + c)}${state.boardSize - r}`;
const isSafe = (r, c) => r >= 0 && c >= 0 && r < state.boardSize && c < state.boardSize;

// --- ALGORITHMS ---
function getKnightTour(startR, startC) { /* ... same as before ... */
    let visited = Array(state.boardSize).fill(0).map(() => Array(state.boardSize).fill(false));
    let path = [];
    function getNextMoves(r, c) {
        const moves = [];
        for (const [dr, dc] of pieceMoves.knight) {
            const nr = r + dr, nc = c + dc;
            if (isSafe(nr, nc) && !visited[nr][nc]) {
                let count = 0;
                for (const [dr2, dc2] of pieceMoves.knight) if (isSafe(nr + dr2, nc + dc2) && !visited[nr + dr2][nc + dc2]) count++;
                moves.push({ r: nr, c: nc, count });
            }
        }
        return moves.sort((a, b) => a.count - b.count);
    }
    function solve(r, c) {
        visited[r][c] = true; path.push([r, c]);
        if (path.length === state.boardSize * state.boardSize) return true;
        const nextMoves = getNextMoves(r, c);
        for (const move of nextMoves) if (solve(move.r, move.c)) return true;
        visited[r][c] = false; path.pop();
        return false;
    }
    solve(startR, startC); return path;
}

function getSimpleTour(startR, startC) { /* ... same as before ... */
    const path = [[startR, startC]];
    const visited = new Set([`${startR},${startC}`]);
    let count = 0;
    while(path.length < state.boardSize * state.boardSize && count < 10000) {
        const [lastR, lastC] = path[path.length-1];
        let found = false;
        for (let r_offset = 0; r_offset < state.boardSize; r_offset++) {
            for (let c_offset = 0; c_offset < state.boardSize; c_offset++) {
                 const r = (lastR + r_offset) % state.boardSize;
                 const c = (lastC + c_offset) % state.boardSize;
                 if(!visited.has(`${r},${c}`)) {
                     path.push([r,c]);
                     visited.add(`${r},${c}`);
                     found = true;
                     break;
                 }
            }
            if (found) break;
        }
        count++;
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
                        visited.add(`${nr},${nc}`);
                        const newPath = [...path, [nr, nc]];
                        queue.push([[nr, nc], newPath]);
                        if (nr === end[0] && nc === end[1]) return newPath;
                    }
                    nr += dr; nc += dc;
                }
            } else {
                if (isSafe(nr, nc) && !visited.has(`${nr},${nc}`)) {
                    visited.add(`${nr},${nc}`);
                    const newPath = [...path, [nr, nc]];
                    queue.push([[nr, nc], newPath]);
                    if (nr === end[0] && nc === end[1]) return newPath;
                }
            }
        }
    }
    return [];
}

// --- ANIMATION & STATE --- (Functions are the same, omitted for brevity)
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
    if(state.steps.length > 0) ui.updateStatus('Calculation complete. Ready to animate.');
}


// --- EVENT HANDLERS ---
function handleCalculation() {
    pauseAnimation();
    state.isCalculating = true;
    updateStateFromInputs();
    ui.updateControls(state);
    ui.updateStatus(`Calculating ${state.currentPiece} ${state.mode}...`);

    setTimeout(() => {
        if (state.mode === 'tour') {
            state.steps = state.currentPiece === 'knight' ? getKnightTour(...state.startPos) : getSimpleTour(...state.startPos);
        } else {
            state.steps = getShortestPath(state.currentPiece, state.startPos, state.endPos);
        }
        state.isCalculating = false;
        if (state.steps.length > 0) {
            const msg = state.mode === 'tour' ? `Tour found! Length: ${state.steps.length}` : `Shortest path found in ${state.steps.length - 1} moves.`;
            ui.updateStatus(msg);
            resetAnimation();
            runStep(state.mode === 'path' ? state.steps.length - 1 : 0);
            if (state.mode === 'tour') pauseAnimation();
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
    if (state.mode === 'tour' || !state.startPos) {
        state.startPos = [r, c];
    } else {
        // In path mode, determine if we are setting start or end
        const startDist = Math.abs(r - state.startPos[0]) + Math.abs(c - state.startPos[1]);
        const endDist = state.endPos ? Math.abs(r - state.endPos[0]) + Math.abs(c - state.endPos[1]) : Infinity;
        if(startDist < endDist) {
             state.startPos = [r,c];
        } else {
             state.endPos = [r, c];
        }
    }
    ui.updatePositionDropdown('start', ...state.startPos);
    if(state.endPos) ui.updatePositionDropdown('end', ...state.endPos);
    ui.renderBoardState(state); // Immediate visual feedback
}

function updateStateFromInputs() {
    state.currentPiece = document.getElementById('pieceSelect').value;
    state.startPos = document.getElementById('startPos').value.split(',').map(Number);
    if (state.mode === 'path') {
        state.endPos = document.getElementById('endPos').value.split(',').map(Number);
    }
}

function reinitialize() {
    pauseAnimation();
    state.steps = [];
    state.moveIndex = -1;
    state.startPos = [0,0];
    state.endPos = [state.boardSize-1, state.boardSize-1];
    ui.createBoard(state.boardSize, handleSquareClick);
    ui.populateAllSelects(state.boardSize, positionToString);
    ui.updatePositionDropdown('start', ...state.startPos);
    ui.updatePositionDropdown('end', ...state.endPos);
    ui.renderBoardState(state);
    ui.updateControls(state);
    ui.updateStatus('Ready to calculate.');
}

// --- INITIALIZATION ---
function init() {
    ui.initUI();
    const elements = { /* Get all element references for listeners */
        calculateBtn: document.getElementById('calculateBtn'), startBtn: document.getElementById('startBtn'),
        pauseBtn: document.getElementById('pauseBtn'), resetBtn: document.getElementById('resetBtn'),
        stepForwardBtn: document.getElementById('stepForwardBtn'), stepBackBtn: document.getElementById('stepBackBtn'),
        modeSelector: document.getElementById('mode-selector'), themeSelector: document.getElementById('theme-selector'),
        speedRange: document.getElementById('speedRange'), stepJump: document.getElementById('stepJump'),
        boardSizeSlider: document.getElementById('boardSize'),
    };
    elements.calculateBtn.addEventListener('click', handleCalculation);
    elements.startBtn.addEventListener('click', startAnimation);
    elements.pauseBtn.addEventListener('click', pauseAnimation);
    elements.resetBtn.addEventListener('click', resetAnimation);
    elements.stepForwardBtn.addEventListener('click', () => runStep(state.moveIndex + 1));
    elements.stepBackBtn.addEventListener('click', () => runStep(state.moveIndex - 1));
    elements.modeSelector.addEventListener('click', e => { if (e.target.dataset.mode) { state.mode = e.target.dataset.mode; ui.setModeUI(state.mode); } });
    elements.themeSelector.addEventListener('click', e => { if (e.target.dataset.theme) { state.theme = e.target.dataset.theme; ui.applyTheme(state.theme); } });
    elements.speedRange.addEventListener('input', e => { state.animDelay = parseInt(e.target.value, 10); ui.updateControls(state); if (!state.isPaused) { pauseAnimation(); startAnimation(); } });
    elements.stepJump.addEventListener('input', e => { pauseAnimation(); runStep(parseInt(e.target.value, 10)); });
    elements.boardSizeSlider.addEventListener('input', e => { state.boardSize = parseInt(e.target.value, 10); reinitialize(); });
    
    reinitialize();
    ui.applyTheme(state.theme);
    ui.setModeUI(state.mode);
}

document.addEventListener('DOMContentLoaded', init);
