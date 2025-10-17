/**
 * app.js - Main Application Controller with Race Mode
 */

document.addEventListener('DOMContentLoaded', () => {

    // ========== STATE ==========
    const state = {
        boardSize: 8,
        theme: 'dark',
        mode: 'race',
        piece: 'knight',
        startPos: [0, 0],
        endPos: [7, 7],
        obstacles: [],

        // Race mode
        raceAlgos: ['BFS', 'DFS', 'AStar', 'Dijkstra', 'Quantum'],
        raceResults: [],
        raceBoards: {},

        // Animation
        speed: 1.0,
        isAnimating: false,
        isPlaying: true,
        currentStep: 0,
        totalSteps: 0,

        // Options
        showAnimation: true,
        showNumbers: true,
        showPath: true,
        showStats: true,

        // Data
        lastResult: null
    };

    // ========== INIT ==========
    function init() {
        UI.createBoard('mainBoard', state.boardSize, handleSquareClick, handleSquareRightClick);
        UI.populatePositionSelects(state.boardSize);
        setupEventListeners();
        UI.setTheme(state.theme);
        UI.setMode(state.mode);
        UI.setStatus('🏁 Ready to race! Select algorithms and click Start.');
        loadFromURL();
        if (state.mode === 'race') {
            initRaceMode();
        }
    }

    // ========== EVENT LISTENERS ==========
    function setupEventListeners() {
        // Theme
        document.getElementById('themeSelector').addEventListener('click', e => {
            if (e.target.dataset.theme) {
                state.theme = e.target.dataset.theme;
                UI.setTheme(state.theme);
            }
        });

        // Mode
        document.getElementById('modeSelector').addEventListener('click', e => {
            if (e.target.dataset.mode) {
                state.mode = e.target.dataset.mode;
                UI.setMode(state.mode);
                if (state.mode === 'race') {
                    initRaceMode();
                }
            }
        });

        // Board size
        document.getElementById('boardSize').addEventListener('input', e => {
            state.boardSize = parseInt(e.target.value);
            document.getElementById('boardSizeLabel').textContent = `${state.boardSize}x${state.boardSize}`;
            state.startPos = [0, 0];
            state.endPos = [state.boardSize - 1, state.boardSize - 1];
            state.obstacles = [];
            reinitBoards();
        });

        // Piece
        document.getElementById('pieceSelect').addEventListener('change', e => {
            state.piece = e.target.value;
        });

        // Positions
        document.getElementById('startPos').addEventListener('change', e => {
            state.startPos = e.target.value.split(',').map(Number);
        });
        document.getElementById('endPos').addEventListener('change', e => {
            state.endPos = e.target.value.split(',').map(Number);
        });

        // Speed
        document.getElementById('speedSlider').addEventListener('input', e => {
            updateSpeed(parseInt(e.target.value));
        });
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const speed = parseInt(btn.dataset.speed);
                document.getElementById('speedSlider').value = speed;
                updateSpeed(speed);
            });
        });

        // Options
        document.getElementById('showAnimation').addEventListener('change', e => {
            state.showAnimation = e.target.checked;
        });
        document.getElementById('showNumbers').addEventListener('change', e => {
            state.showNumbers = e.target.checked;
        });
        document.getElementById('showPath').addEventListener('change', e => {
            state.showPath = e.target.checked;
        });
        document.getElementById('showStats').addEventListener('change', e => {
            state.showStats = e.target.checked;
        });

        // Race checkboxes
        ['BFS', 'DFS', 'AStar', 'Dijkstra', 'Quantum', 'Bidirectional'].forEach(algo => {
            const checkbox = document.getElementById(`race${algo}`);
            if (checkbox) {
                checkbox.addEventListener('change', () => {
                    updateRaceAlgos();
                });
            }
        });

        // Calculate
        document.getElementById('calculateBtn').addEventListener('click', handleCalculate);

        // Playback
        document.getElementById('playBtn').addEventListener('click', () => {
            state.isPlaying = true;
        });
        document.getElementById('pauseBtn').addEventListener('click', () => {
            state.isPlaying = false;
        });
        document.getElementById('stepBtn').addEventListener('click', stepForward);
        document.getElementById('restartBtn').addEventListener('click', restartAnimation);

        // Actions
        document.getElementById('shareBtn').addEventListener('click', handleShare);
        document.getElementById('resetBtn').addEventListener('click', handleReset);
        document.getElementById('saveBtn').addEventListener('click', handleSave);

        // Export
        document.getElementById('exportCsv').addEventListener('click', exportCSV);
        document.getElementById('exportJson').addEventListener('click', exportJSON);
        document.getElementById('exportImage').addEventListener('click', exportImage);

        // Modal
        document.getElementById('copyBtn').addEventListener('click', copyLink);
        document.getElementById('closeModalBtn').addEventListener('click', () => UI.hideModal());
    }

    // ========== RACE MODE ==========
    function initRaceMode() {
        updateRaceAlgos();
        const container = document.getElementById('raceContainer');
        if (!container) return;

        container.innerHTML = '';
        state.raceBoards = {};

        state.raceAlgos.forEach(algo => {
            const item = document.createElement('div');
            item.className = 'race-board-item';
            item.id = `race-${algo}`;

            const header = document.createElement('div');
            header.className = 'race-board-header';

            const title = document.createElement('div');
            title.className = 'race-board-title';
            title.textContent = algo;

            const status = document.createElement('div');
            status.className = 'race-board-status';
            status.id = `status-${algo}`;
            status.textContent = 'Ready';

            header.appendChild(title);
            header.appendChild(status);

            const stats = document.createElement('div');
            stats.className = 'race-board-stats';
            stats.id = `stats-${algo}`;
            stats.textContent = 'Waiting to start...';

            const wrapper = document.createElement('div');
            wrapper.className = 'board-wrapper';

            const board = document.createElement('div');
            board.className = 'chess-board';
            board.id = `board-${algo}`;

            wrapper.appendChild(board);
            item.appendChild(header);
            item.appendChild(stats);
            item.appendChild(wrapper);
            container.appendChild(item);

            UI.createBoard(`board-${algo}`, state.boardSize, null, null);
            state.raceBoards[algo] = board;

            // Mark start and end
            UI.markSquare(`board-${algo}`, state.startPos[0], state.startPos[1], 'start');
            UI.markSquare(`board-${algo}`, state.endPos[0], state.endPos[1], 'end');
        });
    }

    function updateRaceAlgos() {
        state.raceAlgos = [];
        ['BFS', 'DFS', 'AStar', 'Dijkstra', 'Quantum', 'Bidirectional'].forEach(algo => {
            const checkbox = document.getElementById(`race${algo}`);
            if (checkbox && checkbox.checked) {
                state.raceAlgos.push(algo);
            }
        });
    }

    async function startRace() {
        UI.setStatus('🏁 Race starting! Watch algorithms compete...');
        state.raceResults = [];

        // Run all algorithms simultaneously
        const promises = state.raceAlgos.map(async (algo) => {
            const startTime = performance.now();

            // Update status
            const statusEl = document.getElementById(`status-${algo}`);
            if (statusEl) statusEl.textContent = '🏃 Racing...';

            document.getElementById(`race-${algo}`).classList.add('racing');

            // Run algorithm
            let result;
            if (algo === 'Bidirectional') {
                result = Algorithms.Bidirectional(state.piece, state.startPos, state.endPos, state.boardSize, state.obstacles);
            } else {
                result = Algorithms[algo](state.piece, state.startPos, state.endPos, state.boardSize, state.obstacles);
            }

            // Animate if enabled
            if (state.showAnimation) {
                await animateRaceBoard(algo, result);
            } else {
                showRaceFinal(algo, result);
            }

            const endTime = performance.now();

            // Update status
            document.getElementById(`race-${algo}`).classList.remove('racing');
            document.getElementById(`race-${algo}`).classList.add('finished');

            if (result.success) {
                if (statusEl) statusEl.textContent = '✅ Finished';
                if (statusEl) statusEl.style.background = 'var(--success)';
            } else {
                if (statusEl) statusEl.textContent = '❌ No path';
                if (statusEl) statusEl.style.background = 'var(--error)';
            }

            return { name: algo, result, finishTime: endTime - startTime };
        });

        // Wait for all to complete
        const results = await Promise.all(promises);
        state.raceResults = results;

        // Determine winner
        const winner = results
            .filter(r => r.result.success)
            .sort((a, b) => {
                if (a.result.stats.pathLength !== b.result.stats.pathLength) {
                    return a.result.stats.pathLength - b.result.stats.pathLength;
                }
                return a.finishTime - b.finishTime;
            })[0];

        if (winner) {
            document.getElementById(`race-${winner.name}`).classList.add('winner');
            UI.setStatus(`🏆 ${winner.name} WINS! Path: ${winner.result.stats.pathLength} moves in ${winner.result.stats.time}ms`);
        } else {
            UI.setStatus('❌ No algorithm found a path!');
        }

        // Update leaderboard
        UI.updateLeaderboard(results);
    }

    async function animateRaceBoard(algo, result) {
        const boardId = `board-${algo}`;
        const { steps, path } = result;

        for (let i = 0; i < steps.length; i += Math.max(1, Math.floor(10 / state.speed))) {
            if (!state.isPlaying) {
                await new Promise(resolve => {
                    const checkPlay = setInterval(() => {
                        if (state.isPlaying) {
                            clearInterval(checkPlay);
                            resolve();
                        }
                    }, 100);
                });
            }

            const step = steps[i];
            UI.renderStep(boardId, step);
            await new Promise(resolve => setTimeout(resolve, 10 / state.speed));

            // Update stats
            const statsEl = document.getElementById(`stats-${algo}`);
            if (statsEl) {
                statsEl.textContent = `Step ${i}/${steps.length} | Nodes: ${result.stats.nodesExplored}`;
            }
        }

        showRaceFinal(algo, result);
    }

    function showRaceFinal(algo, result) {
        const boardId = `board-${algo}`;
        if (result.success && result.path && state.showPath) {
            UI.highlightPath(boardId, result.path);
        }

        const statsEl = document.getElementById(`stats-${algo}`);
        if (statsEl && result.stats) {
            statsEl.textContent = `Path: ${result.stats.pathLength} | Nodes: ${result.stats.nodesExplored} | Time: ${result.stats.time}ms | Efficiency: ${result.stats.efficiency}%`;
        }
    }

    // ========== CALCULATE ==========
    function handleCalculate() {
        if (state.mode === 'race') {
            startRace();
        } else if (state.mode === 'path') {
            calculatePath();
        } else if (state.mode === 'tour') {
            calculateTour();
        } else if (state.mode === 'heatmap') {
            calculateHeatmap();
        } else if (state.mode === 'compare') {
            calculateCompare();
        } else if (state.mode === 'learn') {
            showLearnContent();
        }
    }

    function calculatePath() {
        UI.setStatus('🔄 Calculating shortest path...');
        UI.clearBoard('mainBoard');

        const result = Algorithms.BFS(state.piece, state.startPos, state.endPos, state.boardSize, state.obstacles);
        state.lastResult = result;

        if (result.success) {
            if (state.showAnimation) {
                animatePath(result);
            } else {
                UI.highlightPath('mainBoard', result.path);
                UI.drawPath('mainBoard', result.path, 'mainSvg');
                UI.animatePiece('mainPiece', state.piece, result.path[result.path.length - 1]);
            }
            UI.updateStats(result.stats);
            UI.setStatus(`✅ Path found: ${result.stats.pathLength} moves`);
        } else {
            UI.setStatus('❌ No path found');
        }

        // Show algorithm explanation
        document.getElementById('algoContent').innerHTML = Algorithms.EXPLANATIONS.BFS;
    }

    async function animatePath(result) {
        const { steps, path } = result;
        state.isAnimating = true;
        state.totalSteps = steps.length;
        state.currentStep = 0;

        for (let i = 0; i < steps.length && state.isAnimating; i++) {
            if (!state.isPlaying) {
                await new Promise(resolve => {
                    const check = setInterval(() => {
                        if (state.isPlaying) {
                            clearInterval(check);
                            resolve();
                        }
                    }, 100);
                });
            }

            UI.renderStep('mainBoard', steps[i]);
            state.currentStep = i;
            UI.updateProgress(i, steps.length);
            await new Promise(resolve => setTimeout(resolve, 20 / state.speed));
        }

        state.isAnimating = false;
        UI.highlightPath('mainBoard', path);
        UI.drawPath('mainBoard', path, 'mainSvg');
        UI.animatePiece('mainPiece', state.piece, path[path.length - 1]);
    }

    function calculateTour() {
        if (state.piece !== 'knight') {
            UI.setStatus('⚠️ Tour mode only works with Knight piece');
            return;
        }

        UI.setStatus('🔄 Calculating Knight\'s Tour...');
        UI.clearBoard('mainBoard');

        const result = Algorithms.KnightsTour(state.startPos, state.boardSize, state.obstacles);
        state.lastResult = result;

        if (result.success) {
            UI.highlightPath('mainBoard', result.path);
            UI.drawPath('mainBoard', result.path, 'mainSvg');
            UI.updateStats(result.stats);
            UI.setStatus(`✅ Tour complete: ${result.stats.pathLength} moves`);
        } else {
            UI.setStatus('❌ No complete tour found');
        }

        document.getElementById('algoContent').innerHTML = Algorithms.EXPLANATIONS.KnightsTour;
    }

    function calculateHeatmap() {
        UI.setStatus('🔄 Generating heatmap...');
        UI.clearBoard('mainBoard');

        const result = Algorithms.Heatmap(state.piece, state.startPos, state.boardSize, state.obstacles);
        UI.renderHeatmap('mainBoard', result.distances, result.maxDist);
        UI.markSquare('mainBoard', state.startPos[0], state.startPos[1], 'start');
        UI.updateStats(result.stats);
        UI.setStatus(`✅ Heatmap complete: max distance ${result.maxDist}`);
    }

    function calculateCompare() {
        // Compare two algorithms
        UI.setStatus('🔄 Comparing algorithms...');
        // Implement comparison logic
    }

    function showLearnContent() {
        document.getElementById('learnContent').innerHTML = `
            <h3>Algorithm Learning Hub</h3>
            <p>Learn how different pathfinding algorithms work!</p>
            <ul>
                <li><strong>BFS:</strong> ${Algorithms.EXPLANATIONS.BFS}</li>
                <li><strong>DFS:</strong> ${Algorithms.EXPLANATIONS.DFS}</li>
                <li><strong>A*:</strong> ${Algorithms.EXPLANATIONS.AStar}</li>
                <li><strong>Dijkstra:</strong> ${Algorithms.EXPLANATIONS.Dijkstra}</li>
                <li><strong>Quantum:</strong> ${Algorithms.EXPLANATIONS.Quantum}</li>
            </ul>
        `;
    }

    // ========== HELPERS ==========
    function handleSquareClick(r, c) {
        if (state.obstacles.some(([or, oc]) => or === r && oc === c)) return;

        if (state.mode === 'path' || state.mode === 'race') {
            if (JSON.stringify(state.startPos) === JSON.stringify([r, c])) return;
            if (!state.startPos) {
                state.startPos = [r, c];
            } else {
                state.endPos = [r, c];
            }
        } else {
            state.startPos = [r, c];
        }

        renderMainBoard();
        updatePositionDropdowns();
    }

    function handleSquareRightClick(r, c) {
        const idx = state.obstacles.findIndex(([or, oc]) => or === r && oc === c);
        if (idx > -1) {
            state.obstacles.splice(idx, 1);
        } else {
            state.obstacles.push([r, c]);
        }
        renderMainBoard();
    }

    function renderMainBoard() {
        UI.clearBoard('mainBoard');
        state.obstacles.forEach(([r, c]) => UI.markSquare('mainBoard', r, c, 'obstacle'));
        UI.markSquare('mainBoard', state.startPos[0], state.startPos[1], 'start');
        if (state.mode === 'path' || state.mode === 'race') {
            UI.markSquare('mainBoard', state.endPos[0], state.endPos[1], 'end');
        }
    }

    function updatePositionDropdowns() {
        const startSel = document.getElementById('startPos');
        const endSel = document.getElementById('endPos');
        if (startSel) startSel.value = `${state.startPos[0]},${state.startPos[1]}`;
        if (endSel) endSel.value = `${state.endPos[0]},${state.endPos[1]}`;
    }

    function updateSpeed(speedPercent) {
        state.speed = speedPercent / 100;
        document.getElementById('speedValue').textContent = `${state.speed.toFixed(2)}x`;
        document.documentElement.style.setProperty('--animation-speed', state.speed);
    }

    function reinitBoards() {
        UI.createBoard('mainBoard', state.boardSize, handleSquareClick, handleSquareRightClick);
        UI.populatePositionSelects(state.boardSize);
        renderMainBoard();
        if (state.mode === 'race') {
            initRaceMode();
        }
    }

    function stepForward() {
        // Implement step forward
    }

    function restartAnimation() {
        state.currentStep = 0;
        state.isPlaying = true;
    }

    // ========== ACTIONS ==========
    function handleShare() {
        const config = {
            bs: state.boardSize,
            t: state.theme,
            m: state.mode,
            p: state.piece,
            s: state.startPos,
            e: state.endPos,
            o: state.obstacles
        };
        const encoded = btoa(JSON.stringify(config));
        const url = `${window.location.origin}${window.location.pathname}?c=${encoded}`;
        UI.showModal(url);
    }

    function handleReset() {
        state.obstacles = [];
        state.startPos = [0, 0];
        state.endPos = [state.boardSize - 1, state.boardSize - 1];
        reinitBoards();
        UI.setStatus('✨ Board reset');
    }

    function handleSave() {
        const data = {
            config: {
                boardSize: state.boardSize,
                theme: state.theme,
                mode: state.mode,
                piece: state.piece,
                startPos: state.startPos,
                endPos: state.endPos,
                obstacles: state.obstacles
            },
            result: state.lastResult,
            timestamp: new Date().toISOString()
        };

        const json = JSON.stringify(data, null, 2);
        downloadFile(json, 'chess-algorithm-save.json', 'application/json');
        UI.setStatus('✅ Configuration saved!');
    }

    function copyLink() {
        const input = document.getElementById('shareInput');
        input.select();
        document.execCommand('copy');

        const btn = document.getElementById('copyBtn');
        btn.textContent = '✅ Copied!';
        setTimeout(() => {
            btn.textContent = '📋 Copy';
        }, 2000);
    }

    // ========== EXPORT ==========
    function exportCSV() {
        if (!state.lastResult || !state.lastResult.path) {
            alert('⚠️ No path data. Calculate first!');
            return;
        }

        let csv = 'Step,Row,Column,Position\n';
        state.lastResult.path.forEach(([r, c], i) => {
            const pos = `${String.fromCharCode(97 + c)}${state.boardSize - r}`;
            csv += `${i + 1},${r},${c},${pos}\n`;
        });

        downloadFile(csv, 'path-result.csv', 'text/csv');
        UI.setStatus('✅ CSV exported');
    }

    function exportJSON() {
        if (!state.lastResult) {
            alert('⚠️ No data. Calculate first!');
            return;
        }

        const data = {
            mode: state.mode,
            piece: state.piece,
            boardSize: state.boardSize,
            startPosition: state.startPos,
            endPosition: state.endPos,
            obstacles: state.obstacles,
            path: state.lastResult.path,
            statistics: state.lastResult.stats,
            timestamp: new Date().toISOString()
        };

        const json = JSON.stringify(data, null, 2);
        downloadFile(json, 'algorithm-result.json', 'application/json');
        UI.setStatus('✅ JSON exported');
    }

    function exportImage() {
        alert('📸 Use browser screenshot (Print Screen) to capture the visualization!');
    }

    function downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // ========== LOAD FROM URL ==========
    function loadFromURL() {
        const params = new URLSearchParams(window.location.search);
        const configStr = params.get('c');

        if (configStr) {
            try {
                const config = JSON.parse(atob(configStr));
                state.boardSize = config.bs || 8;
                state.theme = config.t || 'dark';
                state.mode = config.m || 'race';
                state.piece = config.p || 'knight';
                state.startPos = config.s || [0, 0];
                state.endPos = config.e || [7, 7];
                state.obstacles = config.o || [];

                document.getElementById('boardSize').value = state.boardSize;
                document.getElementById('boardSizeLabel').textContent = `${state.boardSize}x${state.boardSize}`;
                document.getElementById('pieceSelect').value = state.piece;

                reinitBoards();
                UI.setTheme(state.theme);
                UI.setMode(state.mode);
            } catch (e) {
                console.error('Failed to load config:', e);
            }
        }
    }

    // ========== START ==========
    init();

});
