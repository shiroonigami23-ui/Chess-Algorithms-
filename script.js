/**
 * script.js: Manages application state and core logic. DEFINITIVE STABLE REBUILD.
 * This file is loaded second, after the global 'ui' object is created.
 */
document.addEventListener('DOMContentLoaded', () => {
    // All DOM elements are fetched once and passed around.
    const elements = {
        board: document.getElementById('board'), board1: document.getElementById('board1'), board2: document.getElementById('board2'),
        animatedPiece: document.getElementById('animated-piece'), pathSvg: document.getElementById('path-svg'),
        pieceSelect: document.getElementById('pieceSelect'), pieceSelect2: document.getElementById('pieceSelect2'),
        pieceSelectLabel: document.getElementById('pieceSelectLabel'), pieceSelect2Container: document.getElementById('pieceSelect2-container'),
        startPosSelect: document.getElementById('startPos'), endPosSelect: document.getElementById('endPos'),
        startPosContainer: document.getElementById('start-pos-container'), endPosContainer: document.getElementById('end-pos-container'),
        calculateBtn: document.getElementById('calculateBtn'), statusEl: document.getElementById('status'),
        modeSelector: document.getElementById('mode-selector'), themeSelector: document.getElementById('theme-selector'),
        boardSizeSlider: document.getElementById('boardSize'), boardSizeLabel: document.getElementById('boardSizeLabel'),
        shareBtn: document.getElementById('shareBtn'), resetBtn: document.getElementById('resetBtn'),
        shareModal: document.getElementById('share-modal'), shareUrlInput: document.getElementById('share-url-input'),
        copyLinkBtn: document.getElementById('copy-link-btn'), closeModalBtn: document.getElementById('close-modal-btn'),
        vizControlsContainer: document.getElementById('viz-controls-container'),
        vizAlgoToggle: document.getElementById('viz-algo-toggle'), vizAlgoLabel: document.getElementById('viz-algo-label'),
        singleBoardView: document.getElementById('single-board-view'), compareBoardView: document.getElementById('compare-board-view'),
        compareTitle1: document.getElementById('compare-title1'), compareTitle2: document.getElementById('compare-title2'),
    };

    // The single source of truth for the application's state.
    let state = {
        boardSize: 8, theme: 'dark', mode: 'tour', currentPiece: 'knight', currentPiece2: 'rook',
        startPos: [0, 0], endPos: [7, 7], obstacles: [],
        tour: { path: [], steps: [] }, // Holds final path and exploration steps for single view
        isCalculating: false, heatmapData: null, visualizeAlgorithm: false,
        animationFrameId: null,
    };

    // --- ALGORITHMS & HELPERS ---
    const pieceMoves = {
        knight: [[2, 1], [1, 2], [-1, 2], [-2, 1], [-2, -1], [-1, -2], [1, -2], [2, -1]],
        rook: [[0, 1], [0, -1], [1, 0], [-1, 0]], bishop: [[1, 1], [1, -1], [-1, 1], [-1, -1]],
        queen: [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [1, -1], [-1, 1], [-1, -1]],
    };
    const isSlidingPiece = { rook: true, bishop: true, queen: true, knight: false };
    const positionToString = (r, c) => `${String.fromCharCode(97 + c)}${state.boardSize - r}`;
    const isSafe = (r, c, visited = new Set()) => r >= 0 && c < state.boardSize && c >= 0 && c < state.boardSize && !state.obstacles.some(obs => obs[0] === r && obs[1] === c) && !visited.has(`${r},${c}`);

    // --- ALGORITHMS (Each returns an object with path and steps for visualization) ---
    function getKnightTour(startR, startC) {
        let visited = new Set();
        let path = [];
        const explorationSteps = [];
        const tourSize = state.boardSize * state.boardSize - state.obstacles.length;

        function getNextMoves(r, c) {
            const moves = [];
            for (const [dr, dc] of pieceMoves.knight) {
                const nr = r + dr, nc = c + dc;
                if (isSafe(nr, nc, visited)) {
                    let onwardCount = 0;
                    for (const [dr2, dc2] of pieceMoves.knight) if (isSafe(nr + dr2, nc + dc2, visited)) onwardCount++;
                    moves.push({ pos: [nr, nc], onward: onwardCount });
                }
            }
            return moves.sort((a, b) => a.onward - b.onward);
        }
        function solve(r, c) {
            visited.add(`${r},${c}`);
            path.push([r, c]);
            explorationSteps.push({ r, c, type: 'visit' });
            if (path.length === tourSize) return true;
            const nextMoves = getNextMoves(r, c);
            explorationSteps.push({ heuristicMoves: nextMoves });
            for (const move of nextMoves) {
                if (solve(...move.pos)) return true;
            }
            visited.delete(`${r},${c}`);
            path.pop();
            return false;
        }
        solve(startR, startC);
        return { path, steps: explorationSteps };
    }

    function getShortestPath(piece, start, end) {
        const queue = [[start, [start]]];
        const visited = new Set([`${start[0]},${start[1]}`]);
        const explorationSteps = [];
        while (queue.length > 0) {
            const [[r, c], path] = queue.shift();
            explorationSteps.push({r, c, type: 'visit'});
            if (r === end[0] && c === end[1]) return { path, steps: explorationSteps };
            for (const [dr, dc] of pieceMoves[piece]) {
                let nr = r + dr, nc = c + dc;
                if (isSlidingPiece[piece]) {
                    while (isSafe(nr, nc)) {
                        if (!visited.has(`${nr},${nc}`)) {
                            visited.add(`${nr},${nc}`);
                            explorationSteps.push({r: nr, c: nc, type: 'explore'});
                            queue.push([[nr, nc], [...path, [nr, nc]]]);
                        }
                        nr += dr; nc += dc;
                    }
                } else if (isSafe(nr, nc) && !visited.has(`${nr},${nc}`)) {
                    visited.add(`${nr},${nc}`);
                    explorationSteps.push({r: nr, c: nc, type: 'explore'});
                    queue.push([[nr, nc], [...path, [nr, nc]]]);
                }
            }
        }
        return { path: [], steps: explorationSteps };
    }

    function getHeatmap(piece, start) {
        let distances = Array(state.boardSize).fill(null).map(() => Array(state.boardSize).fill(Infinity));
        let maxDistance = 0;
        const explorationSteps = [];
        if (!isSafe(start[0], start[1])) return { path: [], steps: [], finalData: { distances, maxDistance } };
        const queue = [[start, 0]];
        distances[start[0]][start[1]] = 0;
        while(queue.length > 0) {
            const [[r,c], dist] = queue.shift();
            explorationSteps.push({r, c, type: 'visit'});
            maxDistance = Math.max(maxDistance, dist);
            for (const [dr, dc] of pieceMoves[piece]) {
                let nr = r + dr, nc = c + dc;
                if (isSlidingPiece[piece]) {
                    while(isSafe(nr, nc)) {
                        if (distances[nr][nc] === Infinity) {
                            distances[nr][nc] = dist + 1;
                            explorationSteps.push({r: nr, c: nc, type: 'explore'});
                            queue.push([[nr, nc], dist + 1]);
                        }
                        nr += dr; nc += dc;
                    }
                } else if (isSafe(nr, nc) && distances[nr][nc] === Infinity) {
                    distances[nr][nc] = dist + 1;
                    explorationSteps.push({r: nr, c: nc, type: 'explore'});
                    queue.push([[nr, nc], dist + 1]);
                }
            }
        }
        return { path: [], steps: explorationSteps, finalData: { distances, maxDistance } };
    }

    // --- CORE LOGIC & ANIMATION ---
    function handleCalculation() {
        if (state.isCalculating) return;
        state.isCalculating = true;
        cancelAnimationFrame(state.animationFrameId);
        updateStateFromInputs();
        ui.updateControls(elements, state);
        ui.updateStatus(elements, `Calculating...`);

        setTimeout(() => { // Gives UI time to update
            let result;
            if (state.mode === 'tour') {
                if (state.currentPiece !== 'knight') {
                    ui.updateStatus(elements, 'Full tour is only available for the Knight.');
                    state.isCalculating = false;
                    ui.updateControls(elements, state);
                    return;
                }
                result = getKnightTour(state.startPos[0], state.startPos[1]);
            } else if (state.mode === 'path') {
                result = getShortestPath(state.currentPiece, state.startPos, state.endPos);
            } else if (state.mode === 'heatmap') {
                result = getHeatmap(state.currentPiece, state.startPos);
            } else if (state.mode === 'compare') {
                const heatmap1 = getHeatmap(state.currentPiece, state.startPos).finalData;
                const heatmap2 = getHeatmap(state.currentPiece2, state.startPos).finalData;
                ui.renderHeatmap('board1', heatmap1, state.startPos, state.obstacles);
                ui.renderHeatmap('board2', heatmap2, state.startPos, state.obstacles);
                elements.compareTitle1.textContent = state.currentPiece;
                elements.compareTitle2.textContent = state.currentPiece2;
                ui.updateStatus(elements, 'Comparison complete.');
                state.isCalculating = false;
                ui.updateControls(elements, state);
                return;
            }
            
            state.isCalculating = false;
            ui.updateControls(elements, state);
            
            if (state.visualizeAlgorithm && state.mode !== 'compare') {
                animateAlgorithm(result);
            } else {
                state.tour = { path: result.path || [], steps: [] };
                if (state.mode === 'heatmap') state.heatmapData = result.finalData;
                ui.renderBoardState(elements, state);
                updateFinalStatus(result);
            }
        }, 50);
    }
    
    function animateAlgorithm(result) {
        let stepIndex = 0;
        const { steps, path, finalData } = result;
        const animSpeed = (state.mode === 'tour' && state.currentPiece === 'knight') ? 400 : 20;

        function animationLoop() {
            if (stepIndex >= steps.length) {
                state.tour = { path: path || [], steps: [] };
                if (state.mode === 'heatmap') state.heatmapData = finalData;
                ui.renderBoardState(elements, state);
                updateFinalStatus(result);
                return;
            }
            const step = steps[stepIndex];
            if (step.heuristicMoves) {
                ui.renderHeuristic(step.heuristicMoves);
                setTimeout(() => {
                    stepIndex++;
                    state.animationFrameId = requestAnimationFrame(animationLoop);
                }, animSpeed);
            } else {
                ui.renderExplorationStep(step);
                stepIndex++;
                state.animationFrameId = setTimeout(animationLoop, animSpeed / 2);
            }
        }
        ui.clearAllSquareStyles('board');
        ui.renderBoardState(elements, {...state, tour: {path:[]}}); 
        animationLoop();
    }

    function updateFinalStatus(result) {
        if (state.mode === 'tour') ui.updateStatus(elements, result.path.length > 1 ? `Tour found: ${result.path.length} moves.` : 'No complete tour found.');
        else if (state.mode === 'path') ui.updateStatus(elements, result.path.length > 0 ? `Shortest path: ${result.path.length - 1} moves.` : 'No path found.');
        else if (state.mode === 'heatmap') ui.updateStatus(elements, 'Heatmap calculated.');
    }

    // --- EVENT HANDLERS & INITIALIZATION ---
    function handleSquareClick(r, c) {
        if (state.isCalculating) return;
        if (state.obstacles.some(obs => obs[0] === r && obs[1] === c)) return;
        
        if (state.mode === 'path') {
            if (!state.startPos || (JSON.stringify(state.startPos) === JSON.stringify([r,c])) || !state.endPos) state.startPos = [r,c];
            else state.endPos = [r,c];
        } else state.startPos = [r, c];

        if (state.mode === 'heatmap' || state.mode === 'compare' || (state.mode === 'tour' && state.visualizeAlgorithm)) {
            handleCalculation();
        } else ui.renderBoardState(elements, state);
        
        ui.updatePositionDropdown(elements, 'start', ...state.startPos);
        if(state.endPos) ui.updatePositionDropdown(elements, 'end', ...state.endPos);
    }
    
    function handleSquareRightClick(r, c) {
        if (state.isCalculating) return;
        const index = state.obstacles.findIndex(obs => obs[0] === r && obs[1] === c);
        if (index > -1) state.obstacles.splice(index, 1);
        else state.obstacles.push([r, c]);
        
        if (state.mode === 'heatmap' || state.mode === 'compare') handleCalculation();
        else ui.renderBoardState(elements, state);
    }

    function updateStateFromInputs() {
        state.currentPiece = elements.pieceSelect.value;
        state.currentPiece2 = elements.pieceSelect2.value;
        state.visualizeAlgorithm = elements.vizAlgoToggle.checked;
        state.startPos = elements.startPosSelect.value.split(',').map(Number);
        if (state.mode === 'path') state.endPos = elements.endPosSelect.value.split(',').map(Number);
    }

    function reinitialize(newState = {}, fromUrl = false) {
        cancelAnimationFrame(state.animationFrameId);
        const oldState = JSON.parse(JSON.stringify(state));
        state = {...oldState, ...newState, isCalculating: false, tour: {path: [], steps:[]}, heatmapData: null};
        
        ui.createBoard(elements, 'board', state.boardSize, handleSquareClick, handleSquareRightClick);
        ui.createBoard(elements, 'board1', state.boardSize, ()=>{}, ()=>{});
        ui.createBoard(elements, 'board2', state.boardSize, ()=>{}, ()=>{});

        ui.populateAllSelects(elements, state.boardSize, positionToString);
        
        elements.pieceSelect.value = state.currentPiece;
        elements.pieceSelect2.value = state.currentPiece2;
        elements.boardSizeSlider.value = state.boardSize;
        elements.vizAlgoToggle.checked = state.visualizeAlgorithm;
        ui.updatePositionDropdown(elements, 'start', ...state.startPos);
        ui.updatePositionDropdown(elements, 'end', ...state.endPos);
        
        ui.applyTheme(state.theme);
        ui.setModeUI(elements, state);
        ui.renderBoardState(elements, state);
        ui.updateControls(elements, state);
        if (!fromUrl) ui.updateStatus(elements, 'Ready.');
    }

    function handleShare() {
        const config = {
            bs: state.boardSize, t: state.theme, m: state.mode, p: state.currentPiece, p2: state.currentPiece2,
            s: state.startPos, e: state.endPos, o: state.obstacles, v: state.visualizeAlgorithm
        };
        const encoded = btoa(JSON.stringify(config));
        const url = `${window.location.origin}${window.location.pathname}?config=${encoded}`;
        ui.showShareModal(elements, url);
    }

    function loadStateFromURL() {
        const params = new URLSearchParams(window.location.search);
        const encodedConfig = params.get('config');
        if (encodedConfig) {
            try {
                const config = JSON.parse(atob(encodedConfig));
                reinitialize({
                    boardSize: config.bs, theme: config.t, mode: config.m, currentPiece: config.p, currentPiece2: config.p2 || 'rook',
                    startPos: config.s, endPos: config.e, obstacles: config.o, visualizeAlgorithm: config.v
                }, true);
                handleCalculation();
            } catch (e) { reinitialize(); }
        } else reinitialize();
    }

    // --- Event Listeners ---
    elements.calculateBtn.addEventListener('click', handleCalculation);
    elements.resetBtn.addEventListener('click', () => {
        const preservedState = { theme: state.theme, boardSize: state.boardSize, mode: state.mode };
        state = {}; // Clear everything else
        reinitialize(preservedState);
    });
    elements.modeSelector.addEventListener('click', e => { if (e.target.dataset.mode) reinitialize({ mode: e.target.dataset.mode }); });
    elements.themeSelector.addEventListener('click', e => { if (e.target.dataset.theme) { state.theme = e.target.dataset.theme; ui.applyTheme(state.theme); } });
    elements.pieceSelect.addEventListener('change', () => { state.currentPiece = elements.pieceSelect.value; ui.setModeUI(elements, state); });
    elements.boardSizeSlider.addEventListener('input', e => reinitialize({ boardSize: parseInt(e.target.value, 10), startPos: [0,0], endPos: [parseInt(e.target.value, 10) - 1, parseInt(e.target.value, 10) - 1], obstacles: [] }));
    elements.shareBtn.addEventListener('click', handleShare);
    elements.copyLinkBtn.addEventListener('click', () => { elements.shareUrlInput.select(); document.execCommand('copy'); elements.copyLinkBtn.textContent = 'Copied!'; setTimeout(() => { elements.copyLinkBtn.textContent = 'Copy'; }, 1500); });
    elements.closeModalBtn.addEventListener('click', () => ui.hideShareModal(elements));
    window.addEventListener('resize', () => reinitialize(state));

    loadStateFromURL();
});
