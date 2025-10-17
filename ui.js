/**
 * ui.js: Handles all direct DOM manipulation. DEFINITIVE STABLE REBUILD.
 * This file is loaded first and creates the global 'ui' object.
 */
const ui = (() => {
    const pieceSvgs = {
        knight: `<svg viewBox="0 0 45 45"><g fill="none" fill-rule="evenodd" stroke="var(--piece-dark)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22.5 9.5c3.5-2 6.5-2 9 0 .5 4.5-1.5 7.5-3.5 9.5-2.5 2.5-5.5 2.5-8 0-2-2-2.5-4-2.5-6 0-1.5.5-3.5 5-3.5zM15.5 28.5l2-1.5 1.5 1.5c-2 2-2.5 4.5-1.5 6.5l-1 1-1-1c-1-2 0-4 1-5.5z" fill="var(--piece-light)"/><path d="M22.5 26.5c-2.5-2-2-4.5-1-6.5l1-1.5 1.5 1.5-1 1.5-1 1.5c1.5 1.5 2.5 2.5 3.5 4.5l2.5 4.5c.5 1 1.5 1.5 2.5 1.5s2-.5 2.5-1.5l-1.5-5c-.5-1.5 0-2.5 1-3.5 1-1 2-1.5 3.5-1.5 1.5 0 2.5.5 3.5 1.5l1 1" fill="var(--piece-light)"/><path d="M12.5 31.5c-3-1-5-2.5-5-5.5 0-4.5 4-6.5 7-6.5 3 0 4.5 2 4.5 4s-1.5 3.5-4.5 3.5c-2.5 0-5 0-7-1.5z" fill="var(--piece-light)"/><path d="M29.5 32.5c-3 1-5 2.5-5 5.5 0 4.5 4 6.5 7 6.5 3 0 4.5-2 4.5-4s-1.5-3.5-4.5-3.5c-2.5 0-5 0-7-1.5z" fill="var(--piece-light)"/></g></svg>`,
        rook: `<svg viewBox="0 0 45 45"><g fill="var(--piece-light)" fill-rule="evenodd" stroke="var(--piece-dark)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 39h27v-3H9v3zM12 36v-4h21v4H12zM11 14V9h4v2h5V9h5v2h5V9h4v5" stroke-linecap="butt"/><path d="M34 14l-3 3H14l-3-3"/><path d="M31 17v12.5H14V17" stroke-linecap="butt" stroke-linejoin="miter"/><path d="M31 29.5l1.5 2.5h-20l1.5-2.5"/><path d="M14 17h17" fill="none" stroke-linejoin="miter"/></g></svg>`,
        bishop: `<svg viewBox="0 0 45 45"><g fill="var(--piece-light)" fill-rule="evenodd" stroke="var(--piece-dark)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 39h27v-3H9v3zM12 36v-4h21v4H12zM15 32V15h15v17H15z"/><path d="M25 8.5c-1.5-2-3.5-2.5-5-2.5-1.5 0-3.5.5-5 2.5" fill="var(--piece-light)"/><path d="M15 15l7.5 1-7.5-11.5M30 15l-7.5 1 7.5-11.5" fill="var(--piece-light)"/><path d="M22.5 16c2.5-2 4-2.5 5-2.5s2.5.5 3.5 1.5c1 .5 1.5 1.5 1.5 2 0 2-1.5 3-4.5 3-2.5 0-4-1-5.5-2.5zM22.5 25c-2.5-2.5-4-3-5.5-3-2.5 0-4 .5-5 2-1 1.5-1 2.5.5 4 1 1 2.5 1 4 0 2-1 3.5-2 5-3.5z" fill="var(--piece-light)"/><path d="M22.5 22.5c0 4-2.5 5.5-5.5 5.5s-5.5-1.5-5.5-5.5c0-4 2.5-5.5 5.5-5.5s5.5 1.5 5.5 5.5z" fill="var(--piece-light)"/></g></svg>`,
        queen: `<svg viewBox="0 0 45 45"><g fill="var(--piece-light)" fill-rule="evenodd" stroke="var(--piece-dark)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM41 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM14 13.5a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM35 13.5a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM22.5 7a2 2 0 1 1-4 0 2 2 0 0 1 4 0z" fill="var(--piece-light)"/><path d="M9 39h27v-3H9v3zM12 36v-4h21v4H12z"/><path d="M11.5 32l3.5-15.5h15L33.5 32" stroke-linecap="butt"/><path d="M12 18.5h21" fill="none"/><circle cx="6" cy="12" r="2" fill="var(--piece-light)"/><circle cx="12" cy="13.5" r="2" fill="var(--piece-light)"/><circle cx="20.5" cy="7" r="2" fill="var(--piece-light)"/><circle cx="24.5" cy="7" r="2" fill="var(--piece-light)"/><circle cx="33" cy="13.5" r="2" fill="var(--piece-light)"/><circle cx="39" cy="12" r="2" fill="var(--piece-light)"/></g></svg>`,
    };

    let squareSize = 0;
    let boardSquares = {}; // boardId -> squares array

    function createBoard(elements, boardId, boardSize, onSquareClick, onSquareRightClick) {
        const boardEl = elements[boardId];
        boardEl.innerHTML = '';
        boardSquares[boardId] = Array(boardSize).fill(null).map(() => Array(boardSize).fill(null));
        boardEl.style.setProperty('--board-size', boardSize);
        
        squareSize = boardEl.clientWidth / boardSize;
        if (boardId === 'board') {
            elements.animatedPiece.style.width = `${squareSize}px`;
            elements.animatedPiece.style.height = `${squareSize}px`;
        }

        for (let r = 0; r < boardSize; r++) {
            for (let c = 0; c < boardSize; c++) {
                const sq = document.createElement('div');
                sq.className = 'square selectable';
                sq.classList.add((r + c) % 2 === 0 ? 'light' : 'dark');
                sq.addEventListener('click', () => onSquareClick(r, c));
                sq.addEventListener('contextmenu', (e) => { e.preventDefault(); onSquareRightClick(r, c); });
                boardSquares[boardId][r][c] = sq;
                boardEl.appendChild(sq);
            }
        }
    }

    function renderBoardState(elements, state) {
        clearAllSquareStyles('board');
        elements.pathSvg.innerHTML = '';
        elements.animatedPiece.classList.remove('visible');

        elements.pathSvg.className = `path-svg ${state.mode}-path`;
        if (state.tour.path.length > 0) {
            const finalPath = state.tour.path;
            const [currR, currC] = finalPath[finalPath.length - 1];
            moveAnimatedPiece(elements, currR, currC, state.currentPiece);
            drawPath(elements, finalPath);
            finalPath.forEach(([r,c]) => boardSquares['board'][r][c].classList.add('visited'));
        }
        
        state.obstacles.forEach(obs => boardSquares['board'][obs[0]][obs[1]].classList.add('obstacle'));
        if (state.startPos) boardSquares['board'][state.startPos[0]][state.startPos[1]].classList.add('start-point');
        if (state.endPos && state.mode === 'path') boardSquares['board'][state.endPos[0]][state.endPos[1]].classList.add('end-point');
    }

    function renderHeatmap(boardId, heatmapData, startPos, obstacles) {
        if (!heatmapData) return;
        clearAllSquareStyles(boardId);
        const { distances, maxDistance } = heatmapData;
        for (let r = 0; r < boardSquares[boardId].length; r++) {
            for (let c = 0; c < boardSquares[boardId][r].length; c++) {
                const dist = distances[r][c];
                if (dist === Infinity) {
                    // Unreachable
                } else if (dist >= 0) {
                    const hue = 120 * Math.max(0, (1 - (dist / maxDistance)));
                    boardSquares[boardId][r][c].style.backgroundColor = `hsl(${hue}, 90%, 50%)`;
                    const label = document.createElement('div');
                    label.className = 'heatmap-label';
                    label.textContent = dist;
                    boardSquares[boardId][r][c].appendChild(label);
                }
            }
        }
        if (startPos) boardSquares[boardId][startPos[0]][startPos[1]].classList.add('start-point');
        obstacles.forEach(obs => boardSquares[boardId][obs[0]][obs[1]].classList.add('obstacle'));
    }

    function moveAnimatedPiece(elements, r, c, piece) {
        elements.animatedPiece.innerHTML = pieceSvgs[piece] || '';
        elements.animatedPiece.style.transform = `translate(${c * squareSize}px, ${r * squareSize}px)`;
        elements.animatedPiece.classList.add('visible');
    }

    function drawPath(elements, steps) {
        let pathHtml = '';
        for (let i = 0; i < steps.length - 1; i++) {
            const [r1, c1] = steps[i]; const [r2, c2] = steps[i + 1];
            const x1 = (c1 + 0.5) * squareSize, y1 = (r1 + 0.5) * squareSize;
            const x2 = (c2 + 0.5) * squareSize, y2 = (r2 + 0.5) * squareSize;
            pathHtml += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" />`;
        }
        elements.pathSvg.innerHTML = pathHtml;
    }

    function renderExplorationStep(step) {
        if (!step) return;
        const {r, c, type} = step;
        const squares = boardSquares['board'];
        if (squares && squares[r]?.[c]) {
            const sq = squares[r][c];
            sq.classList.remove('exploring', 'visited');
            void sq.offsetWidth;
            sq.classList.add(type === 'visit' ? 'visited' : 'exploring');
        }
    }

    function renderHeuristic(heuristicMoves) {
        if (!heuristicMoves) return;
        const squares = boardSquares['board'];
        const maxOnward = Math.max(...heuristicMoves.map(m => m.onward).filter(o => o !== Infinity)) || 1;
        heuristicMoves.forEach(move => {
            const [r,c] = move.pos;
            const hue = 120 * (1 - (move.onward / maxOnward));
            squares[r][c].style.backgroundColor = `hsl(${hue}, 90%, 50%)`;
            const label = document.createElement('div');
            label.className = 'heuristic-label';
            label.textContent = move.onward;
            squares[r][c].appendChild(label);
        });
    }

    function clearAllSquareStyles(boardId) {
        const squares = boardSquares[boardId];
        if (!squares) return;
        squares.flat().forEach(sq => {
            if(sq) {
                sq.classList.remove('visited', 'exploring', 'start-point', 'end-point', 'obstacle');
                sq.style.backgroundColor = '';
                sq.innerHTML = '';
            }
        });
    }

    // Public methods
    return {
        createBoard, renderBoardState, renderHeatmap, renderExplorationStep, renderHeuristic,
        updateControls(elements, state) {
            elements.calculateBtn.disabled = state.isCalculating;
            elements.calculateBtn.textContent = state.isCalculating ? "Calculating..." : "Calculate";
            elements.boardSizeLabel.textContent = `${state.boardSize}x${state.boardSize}`;
        },
        setModeUI(elements, state) {
            const { mode, currentPiece } = state;
            elements.singleBoardView.classList.toggle('hidden', mode === 'compare');
            elements.compareBoardView.classList.toggle('hidden', mode !== 'compare');
            elements.endPosContainer.classList.toggle('hidden', mode !== 'path');
            elements.vizControlsContainer.classList.toggle('hidden', mode === 'compare' || (mode === 'tour' && currentPiece !== 'knight'));
            elements.pieceSelect2Container.classList.toggle('hidden', mode !== 'compare');
            elements.pieceSelectLabel.textContent = mode === 'compare' ? 'Piece 1' : 'Piece';
            
            if (mode === 'tour' && currentPiece === 'knight') {
                elements.vizAlgoLabel.textContent = 'Show Heuristic';
            } else {
                elements.vizAlgoLabel.textContent = 'Animate Algorithm';
            }
            
            document.querySelectorAll('#mode-selector button').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.mode === mode);
            });
        },
        applyTheme(theme) {
            document.body.dataset.theme = theme;
            document.querySelectorAll('#theme-selector button').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.theme === theme);
            });
        },
        updateStatus(elements, text) { elements.statusEl.textContent = text; },
        populateAllSelects(elements, boardSize, positionToString) {
            const pieceOptions = `<option value="knight">Knight</option><option value="rook">Rook</option><option value="bishop">Bishop</option><option value="queen">Queen</option>`;
            elements.pieceSelect.innerHTML = pieceOptions;
            elements.pieceSelect2.innerHTML = pieceOptions;

            const populateSelect = (selectEl) => {
                selectEl.innerHTML = '';
                for (let r = 0; r < boardSize; r++) for (let c = 0; c < boardSize; c++) {
                    const option = document.createElement('option');
                    option.value = `${r},${c}`; option.textContent = positionToString(r, c);
                    selectEl.appendChild(option);
                }
            };
            populateSelect(elements.startPosSelect);
            populateSelect(elements.endPosSelect);
        },
        updatePositionDropdown(elements, selectId, r, c) {
            const el = selectId === 'start' ? elements.startPosSelect : elements.endPosSelect;
            if (el) el.value = `${r},${c}`;
        },
        clearAllSquareStyles,
        showShareModal(elements, url) {
            elements.shareUrlInput.value = url;
            elements.shareModal.classList.remove('hidden');
        },
        hideShareModal(elements) {
            elements.shareModal.classList.add('hidden');
        }
    };
})();
