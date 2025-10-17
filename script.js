document.addEventListener('DOMContentLoaded', () => {
    // --- STATE MANAGEMENT ---
    const state = {
        boardSize: 8,
        boardEl: document.getElementById('board'),
        board: [],
        steps: [],
        moveIndex: -1,
        animationInterval: null,
        animDelay: 400,
        isPaused: true,
        isCalculating: false,
        currentPiece: 'knight'
    };
    
    // --- DOM ELEMENTS ---
    const elements = {
        startPosSelect: document.getElementById('startPos'),
        startBtn: document.getElementById('startBtn'),
        pauseBtn: document.getElementById('pauseBtn'),
        stepBackBtn: document.getElementById('stepBackBtn'),
        stepForwardBtn: document.getElementById('stepForwardBtn'),
        resetBtn: document.getElementById('resetBtn'),
        statusEl: document.getElementById('status'),
        speedRange: document.getElementById('speedRange'),
        speedLabel: document.getElementById('speedLabel'),
        stepJump: document.getElementById('stepJump'),
        stepJumpLabel: document.getElementById('stepJumpLabel'),
        pieceSelect: document.getElementById('pieceSelect')
    };
    
    // --- KNIGHT MOVES ---
    const knightMoves = [
        [2, 1], [1, 2], [-1, 2], [-2, 1],
        [-2, -1], [-1, -2], [1, -2], [2, -1]
    ];

    // --- UTILITY FUNCTIONS ---
    const positionToString = (r, c) => `${String.fromCharCode(97 + c)}${state.boardSize - r}`;

    // --- BOARD CREATION & RENDERING ---
    function createBoard() {
        state.boardEl.innerHTML = '';
        state.board = [];
        for (let r = 0; r < state.boardSize; r++) {
            state.board[r] = [];
            for (let c = 0; c < state.boardSize; c++) {
                const sq = document.createElement('div');
                sq.className = `square flex justify-center items-center font-bold text-lg transition-all duration-300 relative aspect-square`;
                sq.classList.add((r + c) % 2 === 0 ? 'bg-cyan-100 text-cyan-900' : 'bg-cyan-800 text-cyan-200');
                sq.dataset.row = r;
                sq.dataset.col = c;
                state.boardEl.appendChild(sq);
                state.board[r][c] = sq;
            }
        }
    }

    function fillStartPositionOptions() {
        elements.startPosSelect.innerHTML = '';
        for (let r = 0; r < state.boardSize; r++) {
            for (let c = 0; c < state.boardSize; c++) {
                const option = document.createElement('option');
                option.value = `${r},${c}`;
                option.textContent = positionToString(r, c);
                elements.startPosSelect.appendChild(option);
            }
        }
    }

    function clearBoardStyles() {
        for (let r = 0; r < state.boardSize; r++) {
            for (let c = 0; c < state.boardSize; c++) {
                const cell = state.board[r][c];
                cell.classList.remove('visited', 'current', 'highlight-backtrack');
                cell.innerHTML = ''; // Clear move number
            }
        }
    }

    function setMoveNumber(cell, num) {
        cell.innerHTML = `<span class="absolute bottom-1 right-1 text-xs font-medium opacity-90">${num}</span>`;
    }

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
        
        // Add starting cell
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
        // Ensure start position is first
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
        // Move starting position to the front
        const startIndex = path.findIndex(([r,c]) => r === startRow && c === startCol);
        if (startIndex > 0) {
            const startElement = path.splice(startIndex, 1);
            path.unshift(startElement[0]);
        }
        return path;
    }

    function getQueenTour(startRow, startCol) {
        const rookPath = getRookTour(startRow, startCol);
        const bishopPath = getBishopTour(startRow, startCol);
        const uniqueBishop = bishopPath.filter(([r,c]) => !rookPath.some(([rr,rc]) => rr === r && rc === c));
        return [...rookPath, ...uniqueBishop];
    }


    // --- UI & ANIMATION LOGIC ---
    function updateUI() {
        const isRunning = !state.isPaused;
        const hasSteps = state.steps.length > 0;
        const atStart = state.moveIndex <= 0;
        const atEnd = state.moveIndex >= state.steps.length - 1;

        elements.startBtn.disabled = isRunning || state.isCalculating;
        elements.pauseBtn.disabled = !isRunning || state.isCalculating;
        elements.resetBtn.disabled = !hasSteps || state.isCalculating;
        elements.stepBackBtn.disabled = atStart || isRunning || state.isCalculating;
        elements.stepForwardBtn.disabled = atEnd || isRunning || state.isCalculating;

        elements.pieceSelect.disabled = state.isCalculating;
        elements.startPosSelect.disabled = state.isCalculating;
        elements.speedRange.disabled = state.isCalculating;
        elements.stepJump.disabled = !hasSteps || state.isCalculating;
        
        if (hasSteps) {
            elements.stepJump.max = state.steps.length - 1;
            elements.stepJump.value = state.moveIndex;
            elements.stepJumpLabel.textContent = state.moveIndex + 1;
        } else {
            elements.stepJump.max = 0;
            elements.stepJump.value = 0;
            elements.stepJumpLabel.textContent = 0;
        }
    }

    function animateStep(index) {
        if (index < 0 || index >= state.steps.length) return;
        
        clearBoardStyles();
        state.moveIndex = index;
        
        for (let j = 0; j <= index; j++) {
            const [r, c] = state.steps[j];
            state.board[r][c].classList.add('visited');
            setMoveNumber(state.board[r][c], j + 1);
        }
        
        const [currR, currC] = state.steps[index];
        state.board[currR][currC].classList.add('current');
        
        elements.statusEl.textContent = `Step ${index + 1}/${state.steps.length}: ${positionToString(currR, currC)}`;
        updateUI();
    }
    
    function startAnimation() {
        if (state.steps.length === 0 || !state.isPaused) return;
        state.isPaused = false;
        
        if (state.moveIndex >= state.steps.length - 1) {
            state.moveIndex = -1;
        }
        
        state.animationInterval = setInterval(() => {
            if (state.moveIndex >= state.steps.length - 1) {
                pauseAnimation();
            } else {
                animateStep(state.moveIndex + 1);
            }
        }, state.animDelay);

        updateUI();
    }

    function pauseAnimation() {
        state.isPaused = true;
        clearInterval(state.animationInterval);
        state.animationInterval = null;
        updateUI();
    }

    function resetAnimation() {
        pauseAnimation();
        state.moveIndex = -1;
        clearBoardStyles();
        elements.statusEl.textContent = 'Ready to start';
        updateUI();
    }

    // --- EVENT HANDLERS ---
    function handleGenerateTour() {
        pauseAnimation();
        state.isCalculating = true;
        updateUI();

        const [startRow, startCol] = elements.startPosSelect.value.split(',').map(Number);
        state.currentPiece = elements.pieceSelect.value;
        elements.statusEl.textContent = `Calculating ${state.currentPiece} tour...`;

        // Use setTimeout to allow UI to update before heavy calculation
        setTimeout(() => {
            switch(state.currentPiece) {
                case 'knight': state.steps = getKnightTour(startRow, startCol); break;
                case 'rook': state.steps = getRookTour(startRow, startCol); break;
                case 'bishop': state.steps = getBishopTour(startRow, startCol); break;
                case 'queen': state.steps = getQueenTour(startRow, startCol); break;
            }

            state.isCalculating = false;
            if (state.steps.length > 0) {
                 elements.statusEl.textContent = `Tour found! Length: ${state.steps.length}`;
            } else {
                 elements.statusEl.textContent = `No tour found for ${state.currentPiece}.`;
            }
            resetAnimation();
        }, 50);
    }
    
    function handleKeyboard(e) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
        e.preventDefault();
        switch(e.key) {
            case ' ': state.isPaused ? elements.startBtn.click() : elements.pauseBtn.click(); break;
            case 'ArrowRight': elements.stepForwardBtn.click(); break;
            case 'ArrowLeft': elements.stepBackBtn.click(); break;
            case 'r': case 'R': elements.resetBtn.click(); break;
        }
    }

    // --- INITIALIZATION ---
    function init() {
        createBoard();
        fillStartPositionOptions();
        
        // Setup Event Listeners
        elements.startBtn.addEventListener('click', startAnimation);
        elements.pauseBtn.addEventListener('click', pauseAnimation);
        elements.resetBtn.addEventListener('click', resetAnimation);
        elements.stepForwardBtn.addEventListener('click', () => animateStep(state.moveIndex + 1));
        elements.stepBackBtn.addEventListener('click', () => animateStep(state.moveIndex - 1));

        elements.pieceSelect.addEventListener('change', handleGenerateTour);
        elements.startPosSelect.addEventListener('change', handleGenerateTour);
        
        elements.speedRange.addEventListener('input', (e) => {
            state.animDelay = parseInt(e.target.value, 10);
            elements.speedLabel.textContent = `${state.animDelay} ms`;
            if (!state.isPaused) {
                pauseAnimation();
                startAnimation();
            }
        });

        elements.stepJump.addEventListener('input', (e) => {
            pauseAnimation();
            animateStep(parseInt(e.target.value, 10));
        });

        window.addEventListener('keydown', handleKeyboard);

        // Initial tour generation
        handleGenerateTour();
    }

    init();
});
