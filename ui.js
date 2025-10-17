/**
 * ui.js - Complete UI Management with Race Mode Support
 */

const UI = (() => {

    const PIECES = {
        knight: '♞',
        rook: '♜',
        bishop: '♝',
        queen: '♛',
        king: '♚',
        pawn: '♟'
    };

    let squareSize = 0;
    let boardSquares = {}; // boardId -> squares

    // ========== BOARD CREATION ==========

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

                if (clickHandler) {
                    sq.addEventListener('click', () => clickHandler(r, c));
                }
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

    // ========== CLEAR BOARD ==========

    function clearBoard(boardId) {
        if (!boardSquares[boardId]) return;
        boardSquares[boardId].flat().forEach(sq => {
            if (sq) {
                sq.classList.remove('exploring', 'visited', 'path', 'quantum', 'start', 'end', 'obstacle');
                sq.style.backgroundColor = '';
                sq.style.opacity = '';
                sq.innerHTML = '';
            }
        });
    }

    // ========== MARK SQUARES ==========

    function markSquare(boardId, r, c, type) {
        if (!boardSquares[boardId]?.[r]?.[c]) return;
        boardSquares[boardId][r][c].classList.add(type);
    }

    // ========== RENDER STEP ==========

    function renderStep(boardId, step) {
        if (!step || !boardSquares[boardId]?.[step.r]?.[step.c]) return;

        const sq = boardSquares[boardId][step.r][step.c];
        sq.classList.remove('exploring', 'visited', 'quantum');
        void sq.offsetWidth; // Reflow

        if (step.type === 'quantum') {
            sq.classList.add('quantum');
            if (step.amp) {
                sq.style.opacity = Math.max(0.5, step.amp);
            }
        } else if (step.type === 'visit' || step.type === 'visit_forward' || step.type === 'visit_backward') {
            sq.classList.add('exploring');
        } else if (step.type === 'explore' || step.type === 'explore_forward' || step.type === 'explore_backward') {
            sq.classList.add('visited');
        }

        // Show distance/heuristic numbers if enabled
        if (step.dist !== undefined || step.f !== undefined) {
            const val = step.f !== undefined ? step.f : step.dist;
            sq.textContent = val;
        }
    }

    // ========== DRAW PATH ==========

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
            line.setAttribute('stroke', '#fbbf24');
            line.setAttribute('stroke-width', '3');

            svg.appendChild(line);
        }
    }

    // ========== HIGHLIGHT PATH ==========

    function highlightPath(boardId, path) {
        if (!path) return;
        path.forEach(([r, c]) => {
            if (boardSquares[boardId]?.[r]?.[c]) {
                boardSquares[boardId][r][c].classList.add('path');
            }
        });
    }

    // ========== ANIMATE PIECE ==========

    function animatePiece(pieceId, piece, pos) {
        const el = document.getElementById(pieceId);
        if (!el) return;

        const [r, c] = pos;
        el.textContent = PIECES[piece] || '♞';
        el.style.width = `${squareSize}px`;
        el.style.height = `${squareSize}px`;
        el.style.transform = `translate(${c * squareSize}px, ${r * squareSize}px)`;
        el.classList.add('visible');
    }

    function hidePiece(pieceId) {
        const el = document.getElementById(pieceId);
        if (el) el.classList.remove('visible');
    }

    // ========== HEATMAP ==========

    function renderHeatmap(boardId, distances, maxDist) {
        if (!distances || !boardSquares[boardId]) return;

        const size = distances.length;
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                const sq = boardSquares[boardId][r][c];
                if (!sq) continue;

                const dist = distances[r][c];
                if (dist === Infinity) {
                    sq.style.backgroundColor = '#1f2937';
                } else {
                    const ratio = maxDist > 0 ? dist / maxDist : 0;
                    const hue = 120 * (1 - ratio);
                    sq.style.backgroundColor = `hsl(${hue}, 90%, 50%)`;
                    sq.textContent = dist;
                }
            }
        }
    }

    // ========== POPULATE SELECTS ==========

    function populatePositionSelects(size) {
        const startSel = document.getElementById('startPos');
        const endSel = document.getElementById('endPos');
        if (!startSel || !endSel) return;

        startSel.innerHTML = '';
        endSel.innerHTML = '';

        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                const label = `${String.fromCharCode(97 + c)}${size - r}`;

                const opt1 = document.createElement('option');
                opt1.value = `${r},${c}`;
                opt1.textContent = label;
                startSel.appendChild(opt1);

                const opt2 = document.createElement('option');
                opt2.value = `${r},${c}`;
                opt2.textContent = label;
                endSel.appendChild(opt2);
            }
        }

        startSel.value = '0,0';
        endSel.value = `${size-1},${size-1}`;
    }

    // ========== STATUS ==========

    function setStatus(message) {
        const box = document.getElementById('statusBox');
        if (box) box.textContent = message;
    }

    // ========== STATISTICS ==========

    function updateStats(stats) {
        document.getElementById('statPath').textContent = stats.pathLength || '-';
        document.getElementById('statNodes').textContent = stats.nodesExplored || '-';
        document.getElementById('statTime').textContent = stats.time ? `${stats.time}ms` : '-';
        document.getElementById('statEfficiency').textContent = stats.efficiency ? `${stats.efficiency}%` : '-';
    }

    // ========== LEADERBOARD ==========

    function updateLeaderboard(results) {
        const content = document.getElementById('leaderboardContent');
        if (!content) return;

        content.innerHTML = '';

        // Sort by pathLength (shortest first), then by time
        const sorted = results
            .filter(r => r.result.success)
            .sort((a, b) => {
                if (a.result.stats.pathLength !== b.result.stats.pathLength) {
                    return a.result.stats.pathLength - b.result.stats.pathLength;
                }
                return parseFloat(a.result.stats.time) - parseFloat(b.result.stats.time);
            });

        sorted.forEach((item, idx) => {
            const div = document.createElement('div');
            div.className = `leaderboard-item ${idx === 0 ? 'winner' : ''}`;

            const rank = document.createElement('div');
            rank.className = 'leaderboard-rank';
            rank.textContent = idx === 0 ? '🏆' : `${idx + 1}`;

            const info = document.createElement('div');
            info.className = 'leaderboard-info';

            const algo = document.createElement('div');
            algo.className = 'leaderboard-algo';
            algo.textContent = item.name;

            const stats = document.createElement('div');
            stats.className = 'leaderboard-stats';
            stats.textContent = `${item.result.stats.pathLength} moves, ${item.result.stats.time}ms, ${item.result.stats.nodesExplored} nodes`;

            info.appendChild(algo);
            info.appendChild(stats);
            div.appendChild(rank);
            div.appendChild(info);
            content.appendChild(div);
        });

        document.getElementById('raceLeaderboard').classList.remove('hidden');
    }

    // ========== THEME ==========

    function setTheme(theme) {
        document.body.dataset.theme = theme;
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.theme === theme);
        });
    }

    // ========== MODE ==========

    function setMode(mode) {
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });

        // Show/hide views
        document.getElementById('singleBoardView').classList.toggle('hidden', mode !== 'tour' && mode !== 'path' && mode !== 'heatmap');
        document.getElementById('compareView').classList.toggle('hidden', mode !== 'compare');
        document.getElementById('raceView').classList.toggle('hidden', mode !== 'race');
        document.getElementById('learnView').classList.toggle('hidden', mode !== 'learn');

        // Show/hide controls
        document.getElementById('endPosContainer').classList.toggle('hidden', mode !== 'path' && mode !== 'race');
        document.getElementById('raceModeSettings').classList.toggle('hidden', mode !== 'race');
    }

    // ========== MODAL ==========

    function showModal(url) {
        const modal = document.getElementById('shareModal');
        const input = document.getElementById('shareInput');
        if (modal && input) {
            input.value = url;
            modal.classList.remove('hidden');
        }
    }

    function hideModal() {
        const modal = document.getElementById('shareModal');
        if (modal) modal.classList.add('hidden');
    }

    // ========== PROGRESS ==========

    function updateProgress(current, total) {
        const fill = document.getElementById('progressFill');
        const text = document.getElementById('progressText');
        if (fill && text) {
            const percent = total > 0 ? (current / total * 100) : 0;
            fill.style.width = `${percent}%`;
            text.textContent = `Step ${current} / ${total}`;
        }
    }

    // Public API
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
        showModal,
        hideModal,
        updateProgress
    };

})();
