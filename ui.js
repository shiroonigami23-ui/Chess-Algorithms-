/**
 * ui.js - UI helpers for board rendering, controls, and view state.
 */

const UI = (() => {
    const PIECES = {
        knight: '\u265E',
        rook: '\u265C',
        bishop: '\u265D',
        queen: '\u265B',
        king: '\u265A',
        pawn: '\u265F'
    };
    const PIECE_ASSETS = {
        knight: 'assets/pieces/maestro/wN.svg',
        rook: 'assets/pieces/maestro/wR.svg',
        bishop: 'assets/pieces/maestro/wB.svg',
        queen: 'assets/pieces/maestro/wQ.svg',
        king: 'assets/pieces/maestro/wK.svg',
        pawn: 'assets/pieces/maestro/wP.svg'
    };

    let squareSize = 0;
    const boardSquares = {};
    let showNumbers = true;
    let currentPiece = 'knight';

    function createBoard(boardId, size, clickHandler, rightClickHandler) {
        const board = document.getElementById(boardId);
        if (!board) return;

        board.innerHTML = '';
        board.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
        board.style.gridTemplateRows = `repeat(${size}, 1fr)`;

        boardSquares[boardId] = [];
        for (let r = 0; r < size; r++) {
            boardSquares[boardId][r] = [];
            for (let c = 0; c < size; c++) {
                const sq = document.createElement('div');
                sq.className = `square ${(r + c) % 2 === 0 ? 'light' : 'dark'}`;
                sq.dataset.row = r;
                sq.dataset.col = c;

                if (clickHandler) sq.addEventListener('click', () => clickHandler(r, c));
                if (rightClickHandler) {
                    sq.addEventListener('contextmenu', (e) => {
                        e.preventDefault();
                        rightClickHandler(r, c);
                    });
                }

                boardSquares[boardId][r][c] = sq;
                board.appendChild(sq);
            }
        }

        squareSize = board.clientWidth / size;
    }

    function clearBoard(boardId) {
        if (!boardSquares[boardId]) return;
        boardSquares[boardId].flat().forEach((sq) => {
            sq.classList.remove('exploring', 'visited', 'path', 'quantum', 'start', 'end', 'obstacle');
            sq.style.backgroundColor = '';
            sq.style.opacity = '';
            sq.textContent = '';
        });
    }

    function markSquare(boardId, r, c, type) {
        if (!boardSquares[boardId]?.[r]?.[c]) return;
        const sq = boardSquares[boardId][r][c];
        sq.classList.add(type);
        if (type === 'start') {
            renderPieceInSquare(sq, currentPiece);
        }
    }

    function renderStep(boardId, step) {
        if (!step || !boardSquares[boardId]?.[step.r]?.[step.c]) return;
        const sq = boardSquares[boardId][step.r][step.c];
        sq.classList.remove('exploring', 'visited', 'quantum');
        void sq.offsetWidth;

        if (step.type === 'quantum') {
            sq.classList.add('quantum');
            if (step.amp !== undefined) sq.style.opacity = Math.max(0.5, step.amp);
        } else if (step.type === 'visit' || step.type === 'visit_forward' || step.type === 'visit_backward') {
            sq.classList.add('exploring');
        } else if (step.type === 'explore' || step.type === 'explore_forward' || step.type === 'explore_backward') {
            sq.classList.add('visited');
        }

        if (showNumbers && (step.dist !== undefined || step.f !== undefined)) {
            sq.textContent = step.f !== undefined ? step.f : step.dist;
        }
    }

    function drawPath(boardId, path, svgId) {
        const svg = document.getElementById(svgId);
        if (!svg || !path || path.length < 2) return;
        svg.innerHTML = '';

        for (let i = 0; i < path.length - 1; i++) {
            const [r1, c1] = path[i];
            const [r2, c2] = path[i + 1];
            const x1 = (c1 + 0.5) * squareSize;
            const y1 = (r1 + 0.5) * squareSize;
            const x2 = (c2 + 0.5) * squareSize;
            const y2 = (r2 + 0.5) * squareSize;

            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', x1);
            line.setAttribute('y1', y1);
            line.setAttribute('x2', x2);
            line.setAttribute('y2', y2);
            line.setAttribute('stroke', '#f59e0b');
            line.setAttribute('stroke-width', '3');
            svg.appendChild(line);
        }
    }

    function highlightPath(boardId, path) {
        if (!path) return;
        path.forEach(([r, c]) => {
            if (boardSquares[boardId]?.[r]?.[c]) boardSquares[boardId][r][c].classList.add('path');
        });
    }

    function animatePiece(pieceId, piece, pos) {
        const el = document.getElementById(pieceId);
        if (!el || !pos) return;
        const [r, c] = pos;
        const src = PIECE_ASSETS[piece] || PIECE_ASSETS.knight;
        const fallback = PIECES[piece] || PIECES.knight;
        el.innerHTML = `<img class="piece-asset" src="${src}" alt="${piece}" onerror="this.outerHTML='${fallback}'">`;
        el.style.width = `${squareSize}px`;
        el.style.height = `${squareSize}px`;
        el.style.transform = `translate(${c * squareSize}px, ${r * squareSize}px)`;
        el.classList.add('visible');
    }

    function hidePiece(pieceId) {
        const el = document.getElementById(pieceId);
        if (el) el.classList.remove('visible');
    }

    function renderHeatmap(boardId, distances, maxDist) {
        if (!distances || !boardSquares[boardId]) return;

        for (let r = 0; r < distances.length; r++) {
            for (let c = 0; c < distances.length; c++) {
                const sq = boardSquares[boardId][r][c];
                const dist = distances[r][c];
                if (dist === Infinity) {
                    sq.style.backgroundColor = '#1f2937';
                    sq.textContent = '';
                } else {
                    const ratio = maxDist > 0 ? dist / maxDist : 0;
                    const hue = 120 * (1 - ratio);
                    sq.style.backgroundColor = `hsl(${hue}, 90%, 50%)`;
                    sq.textContent = dist;
                }
            }
        }
    }

    function populatePositionSelects(size) {
        const startSel = document.getElementById('startPos');
        const endSel = document.getElementById('endPos');
        if (!startSel || !endSel) return;

        startSel.innerHTML = '';
        endSel.innerHTML = '';
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                const label = `${String.fromCharCode(97 + c)}${size - r}`;
                const startOpt = document.createElement('option');
                startOpt.value = `${r},${c}`;
                startOpt.textContent = label;
                startSel.appendChild(startOpt);

                const endOpt = document.createElement('option');
                endOpt.value = `${r},${c}`;
                endOpt.textContent = label;
                endSel.appendChild(endOpt);
            }
        }

        startSel.value = '0,0';
        endSel.value = `${size - 1},${size - 1}`;
    }

    function setStatus(message) {
        const box = document.getElementById('statusBox');
        if (box) box.textContent = message;
    }

    function updateStats(stats) {
        document.getElementById('statPath').textContent = stats.pathLength || '-';
        document.getElementById('statNodes').textContent = stats.nodesExplored || '-';
        document.getElementById('statTime').textContent = stats.time ? `${stats.time}ms` : '-';
        document.getElementById('statEfficiency').textContent = stats.efficiency ? `${stats.efficiency}%` : '-';
    }

    function updateLeaderboard(results) {
        const content = document.getElementById('leaderboardContent');
        if (!content) return;

        content.innerHTML = '';
        const sorted = results
            .filter((r) => r.result.success)
            .sort((a, b) => {
                if (a.result.stats.pathLength !== b.result.stats.pathLength) {
                    return a.result.stats.pathLength - b.result.stats.pathLength;
                }
                return parseFloat(a.result.stats.time) - parseFloat(b.result.stats.time);
            });

        sorted.forEach((item, idx) => {
            const div = document.createElement('div');
            div.className = `leaderboard-item ${idx === 0 ? 'winner' : ''}`;
            div.innerHTML = `
                <div class="leaderboard-rank">${idx === 0 ? '1' : idx + 1}</div>
                <div class="leaderboard-info">
                    <div class="leaderboard-algo">${item.name}</div>
                    <div class="leaderboard-stats">${item.result.stats.pathLength} moves, ${item.result.stats.time}ms, ${item.result.stats.nodesExplored} nodes</div>
                </div>
            `;
            content.appendChild(div);
        });

        document.getElementById('raceLeaderboard')?.classList.remove('hidden');
    }

    function setTheme(theme) {
        document.body.dataset.theme = theme;
        document.querySelectorAll('.theme-btn').forEach((btn) => {
            btn.classList.toggle('active', btn.dataset.theme === theme);
        });
    }

    function setMode(mode) {
        document.querySelectorAll('.mode-btn').forEach((btn) => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });

        document.getElementById('singleBoardView').classList.toggle('hidden', !['tour', 'path', 'heatmap'].includes(mode));
        document.getElementById('compareView').classList.toggle('hidden', mode !== 'compare');
        document.getElementById('raceView').classList.toggle('hidden', mode !== 'race');
        document.getElementById('learnView').classList.toggle('hidden', mode !== 'learn');

        document.getElementById('endPosContainer').classList.toggle('hidden', !['path', 'race', 'compare'].includes(mode));
        document.getElementById('raceModeSettings').classList.toggle('hidden', mode !== 'race');
        document.getElementById('compareModeSettings').classList.toggle('hidden', mode !== 'compare');
        document.getElementById('pathAlgoContainer').classList.toggle('hidden', mode !== 'path');
        document.getElementById('playbackControls').classList.toggle('hidden', mode === 'learn');
    }

    function setShowNumbers(enabled) {
        showNumbers = !!enabled;
    }

    function setPiece(piece) {
        currentPiece = piece;
    }

    function renderPieceInSquare(square, piece) {
        const src = PIECE_ASSETS[piece] || PIECE_ASSETS.knight;
        const fallback = PIECES[piece] || PIECES.knight;
        square.innerHTML = `<img class="piece-asset" src="${src}" alt="${piece}" onerror="this.outerHTML='${fallback}'">`;
    }

    function showModal(url) {
        const modal = document.getElementById('shareModal');
        const input = document.getElementById('shareInput');
        if (modal && input) {
            input.value = url;
            modal.classList.remove('hidden');
        }
    }

    function hideModal() {
        document.getElementById('shareModal')?.classList.add('hidden');
    }

    function updateProgress(current, total) {
        const fill = document.getElementById('progressFill');
        const text = document.getElementById('progressText');
        if (fill && text) {
            const percent = total > 0 ? (current / total) * 100 : 0;
            fill.style.width = `${percent}%`;
            text.textContent = `Step ${current} / ${total}`;
        }
    }

    return {
        createBoard,
        clearBoard,
        markSquare,
        renderStep,
        drawPath,
        highlightPath,
        animatePiece,
        hidePiece,
        renderHeatmap,
        populatePositionSelects,
        setStatus,
        updateStats,
        updateLeaderboard,
        setTheme,
        setMode,
        setShowNumbers,
        setPiece,
        showModal,
        hideModal,
        updateProgress
    };
})();
