/**
 * script.js: Manages application state and core logic for Chess Pathfinding.
 * This is the main script file, now with algorithm racing.
 */
import * as ui from './ui.js';

// --- STATE MANAGEMENT ---
const state = {
    boardSize: 8, theme: 'dark', mode: 'tour', currentPiece: 'knight',
    startPos: null, endPos: null, steps: [], obstacles: [], moveIndex: -1,
    animationInterval: null, animDelay: 300, isPaused: true, isCalculating: false,
};

// --- ALGORITHMS & HELPERS ---
const pieceMoves = {
    knight: [[2, 1], [1, 2], [-1, 2], [-2, 1], [-2, -1], [-1, -2], [1, -2], [2, -1]],
    rook: [[0, 1], [0, -1], [1, 0], [-1, 0]],
    bishop: [[1, 1], [1, -1], [-1, 1], [-1, -1]],
    queen: [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [1, -1], [-1, 1], [-1, -1]],
};
const isSlidingPiece = { rook: true, bishop: true, queen: true, knight: false };
const positionToString = (r, c) => `${String.fromCharCode(97 + c)}${state.boardSize - r}`;
const isSafe = (r, c, visited) => {
    if (r < 0 || c < 0 || r >= state.boardSize || c >= state.boardSize) return false;
    if (state.obstacles.some(obs => obs[0] === r && obs[1] === c)) return false;
    if (visited && visited.has(`${r},${c}`)) return false;
    return true;
};
const heuristic = (a, b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]); // Manhattan distance

function getKnightTour(startR, startC) { /* ... same as before ... */ 
    let visited = new Set();
    let path = [];
    let tourSize = state.boardSize * state.boardSize - state.obstacles.length;
    
    function getNextMoves(r, c) {
        const moves = [];
        for (const [dr, dc] of pieceMoves.knight) {
            const nr = r + dr, nc = c + dc;
            if (isSafe(nr, nc, visited)) {
                let count = 0;
                for (const [dr2, dc2] of pieceMoves.knight) {
                    if (isSafe(nr + dr2, nc + dc2, visited)) count++;
                }
                moves.push({ pos: [nr, nc], onward: count });
            }
        }
        return moves.sort((a, b) => a.onward - b.onward);
    }

    function solve(r, c) {
        visited.add(`${r},${c}`);
        path.push([r, c]);
        if (path.length === tourSize) return true;
        const nextMoves = getNextMoves(r, c);
        for (const move of nextMoves) {
            if (solve(...move.pos)) return true;
        }
        visited.delete(`${r},${c}`);
        path.pop();
        return false;
    }

    solve(startR, startC);
    return path;
}

function getSimpleTour(startR, startC) { /* ... same as before ... */
    const path = [[startR, startC]];
    const visited = new Set([`${startR},${startC}`]);
    let tourSize = state.boardSize * state.boardSize - state.obstacles.length;
    let [r,c] = [startR, startC];

    while(path.length < tourSize){
        let moved = false;
        for(let i=0; i<state.boardSize*state.boardSize; i++){
            c = (c+1) % state.boardSize;
            if(c === 0) r = (r+1) % state.boardSize;
            if(isSafe(r,c) && !visited.has(`${r},${c}`)){
                 path.push([r, c]);
                 visited.add(`${r},${c}`);
                 moved = true;
                 break;
            }
        }
        if(!moved) break;
    }
    return path;
}


function getShortestPathBFS(piece, start, end) {
    const queue = [[start, [start]]];
    const visited = new Set([`${start[0]},${start[1]}`]);
    const explored = [];
    while (queue.length > 0) {
        const [[r, c], path] = queue.shift();
        explored.push([r,c]);
        if (r === end[0] && c === end[1]) return { path, explored };
        for (const [dr, dc] of pieceMoves[piece]) {
            let nr = r + dr, nc = c + dc;
            if (isSlidingPiece[piece]) {
                while(isSafe(nr, nc)) {
                    if (!visited.has(`${nr},${nc}`)) {
                        visited.add(`${nr},${nc}`); const newPath = [...path, [nr, nc]];
                        queue.push([[nr, nc], newPath]);
                    }
                    nr += dr; nc += dc;
                }
            } else {
                if (isSafe(nr, nc) && !visited.has(`${nr},${nc}`)) {
                    visited.add(`${nr},${nc}`); const newPath = [...path, [nr, nc]];
                    queue.push([[nr, nc], newPath]);
                }
            }
        }
    }
    return { path: [], explored };
}

function getShortestPathGreedy(piece, start, end) {
    let path = [start];
    let current = start;
    const visited = new Set([`${start[0]},${start[1]}`]);
    const explored = [];
    let safety = 0;
    while((current[0] !== end[0] || current[1] !== end[1]) && safety < 1000) {
        explored.push(current);
        let bestMove = null;
        let minHeuristic = Infinity;
        for (const [dr, dc] of pieceMoves[piece]) {
            let nr = current[0] + dr, nc = current[1] + dc;
             if (isSlidingPiece[piece]) {
                while(isSafe(nr, nc)) {
                    if (!visited.has(`${nr},${nc}`)) {
                        const h = heuristic([nr,nc], end);
                        if(h < minHeuristic) {
                            minHeuristic = h;
                            bestMove = [nr,nc];
                        }
                    }
                    nr += dr; nc += dc;
                }
            } else {
                 if (isSafe(nr, nc) && !visited.has(`${nr},${nc}`)) {
                    const h = heuristic([nr,nc], end);
                    if(h < minHeuristic) {
                        minHeuristic = h;
                        bestMove = [nr,nc];
                    }
                }
            }
        }

        if(bestMove) {
            path.push(bestMove);
            visited.add(`${bestMove[0]},${bestMove[1]}`);
            current = bestMove;
        } else {
            break; // Stuck
        }
        safety++;
    }
    return { path, explored };
}

// --- ANIMATION & STATE CONTROL ---
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
    clearInterval(state.animationInterval); state.animationInterval = null;
    ui.updateControls(state);
}
function resetAnimation() {
    pauseAnimation(); state.moveIndex = -1;
    runStep(-1);
    if(state.steps.length > 0) ui.updateStatus('Calculation complete. Ready.');
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
             if (state.steps.length > 0) {
                const msg = `Tour found! ${state.steps.length} moves.`;
                ui.updateStatus(msg);
                resetAnimation();
                runStep(0);
                pauseAnimation();
            } else {
                ui.updateStatus(`No path found for ${state.currentPiece}.`);
                state.steps = []; resetAnimation();
            }
        } else {
            const bfsResult = getShortestPathBFS(state.currentPiece, state.startPos, state.endPos);
            const greedyResult = getShortestPathGreedy(state.currentPiece, state.startPos, state.endPos);
            ui.renderRaceState(bfsResult, greedyResult, state);
            ui.updateStatus('Algorithm race complete.');
        }
        state.isCalculating = false;
        ui.updateControls(state);
    }, 50);
}

function handleSquareClick(r, c, boardId) {
    if (state.isCalculating) return;
    const posStr = `${r},${c}`;
    if (state.obstacles.some(obs => `${obs[0]},${obs[1]}` === posStr)) return;
    if (state.mode === 'tour') state.startPos = [r,c];
    else {
        if (!state.startPos || (state.startPos[0] === r && state.startPos[1] === c)) state.startPos = [r,c];
        else if (!state.endPos || (state.endPos[0] === r && state.endPos[1] === c)) state.endPos = [r,c];
        else {
            const startDist = Math.hypot(r - state.startPos[0], c - state.startPos[1]);
            const endDist = Math.hypot(r - state.endPos[0], c - state.endPos[1]);
            if (startDist <= endDist) state.startPos = [r,c];
            else state.endPos = [r,c];
        }
    }
    ui.updatePositionDropdown('start', ...state.startPos);
    if(state.endPos) ui.updatePositionDropdown('end', ...state.endPos);
    if (state.mode === 'tour') ui.renderBoardState(state);
}

function handleSquareRightClick(r, c) {
    if (state.isCalculating) return;
    const posStr = `${r},${c}`;
    const index = state.obstacles.findIndex(obs => `${obs[0]},${obs[1]}` === posStr);
    if (index > -1) state.obstacles.splice(index, 1);
    else state.obstacles.push([r, c]);
    if (state.mode === 'tour') ui.renderBoardState(state);
    else {
        // Re-render both boards for race mode
        const bfsResult = {path:[], explored:[]};
        const greedyResult = {path:[], explored:[]};
        ui.renderRaceState(bfsResult, greedyResult, state);
    }
}

function updateStateFromInputs() {
    state.currentPiece = ui.elements.pieceSelect.value;
    state.startPos = ui.elements.startPosSelect.value.split(',').map(Number);
    if (state.mode === 'path') state.endPos = ui.elements.endPosSelect.value.split(',').map(Number);
}

function reinitialize() {
    pauseAnimation();
    state.steps = []; state.moveIndex = -1; state.obstacles = [];
    state.startPos = [0, 0];
    state.endPos = [state.boardSize - 1, state.boardSize - 1];
    ui.createBoard('board', state.boardSize, handleSquareClick, handleSquareRightClick);
    ui.createBoard('board-bfs', state.boardSize, handleSquareClick, handleSquareRightClick);
    ui.createBoard('board-greedy', state.boardSize, handleSquareClick, handleSquareRightClick);
    ui.populateAllSelects(state.boardSize, positionToString);
    ui.updatePositionDropdown('start', ...state.startPos);
    ui.updatePositionDropdown('end', ...state.endPos);
    ui.renderBoardState(state); ui.updateControls(state);
    ui.updateStatus('Ready to calculate.');
}

// --- INITIALIZATION ---
function init() {
    ui.initUI();
    const el = ui.elements;
    el.calculateBtn.addEventListener('click', handleCalculation);
    el.startBtn.addEventListener('click', startAnimation);
    el.pauseBtn.addEventListener('click', pauseAnimation);
    el.resetBtn.addEventListener('click', resetAnimation);
    el.stepForwardBtn.addEventListener('click', () => runStep(state.moveIndex + 1));
    el.stepBackBtn.addEventListener('click', () => runStep(state.moveIndex - 1));
    el.modeSelector.addEventListener('click', e => { if (e.target.dataset.mode) { state.mode = e.target.dataset.mode; ui.setModeUI(state.mode); } });
    el.themeSelector.addEventListener('click', e => { if (e.target.dataset.theme) { state.theme = e.target.dataset.theme; ui.applyTheme(state.theme); } });
    el.speedRange.addEventListener('input', e => { state.animDelay = parseInt(e.target.value, 10); ui.updateControls(state); if (!state.isPaused) { pauseAnimation(); startAnimation(); } });
    el.stepJump.addEventListener('input', e => { pauseAnimation(); runStep(parseInt(e.target.value, 10)); });
    el.boardSizeSlider.addEventListener('input', e => { state.boardSize = parseInt(e.target.value, 10); reinitialize(); });
    window.addEventListener('resize', () => { reinitialize() });

    reinitialize();
    ui.applyTheme(state.theme);
    ui.setModeUI(state.mode);
}

init();
