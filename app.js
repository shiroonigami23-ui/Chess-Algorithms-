/**
 * app.js - Main Application Controller with Race Mode
 */

document.addEventListener('DOMContentLoaded', () => {

    // ========== STATE ==========
    const state = {
        boardSize: 8,
        theme: 'light',
        mode: 'race',
        piece: 'knight',
        pathAlgo: 'BFS',
        startPos: [0, 0],
        endPos: [7, 7],
        nextPlacement: 'start',
        obstacles: [],

        // Race mode
        raceAlgos: ['BFS', 'DFS', 'AStar', 'Dijkstra', 'Quantum'],
        raceResults: [],
        raceBoards: {},
        compareAlgos: ['AStar', 'BFS'],

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
        lastResult: null,
        monitorEntries: []
    };

    // ========== INIT ==========
    function init() {
        UI.createBoard('mainBoard', state.boardSize, handleSquareClick, handleSquareRightClick);
        UI.populatePositionSelects(state.boardSize);
        setupEventListeners();
        UI.setTheme(state.theme);
        UI.setShowNumbers(state.showNumbers);
        UI.setPiece(state.piece);
        UI.setMode(state.mode);
        initializeMonitoring();
        UI.setStatus('Ready to race. Select algorithms and click Start.');
        renderMainBoard();
        updatePositionDropdowns();
        loadFromURL();
        if (state.mode === 'race') {
            initRaceMode();
        }
        pushMonitor('info', 'Application initialized');
    }

    // ========== EVENT LISTENERS ==========
    function setupEventListeners() {
        document.getElementById('themeSelector').addEventListener('click', e => {
            if (!e.target.dataset.theme) return;
            state.theme = e.target.dataset.theme;
            UI.setTheme(state.theme);
            pushMonitor('info', `Theme set to ${state.theme}`);
        });

        document.getElementById('modeSelector').addEventListener('click', e => {
            if (!e.target.dataset.mode) return;
            state.mode = e.target.dataset.mode;
            UI.setMode(state.mode);
            renderMainBoard();
            if (state.mode === 'race') {
                initRaceMode();
            }
            pushMonitor('info', `Mode switched to ${state.mode}`);
        });

        document.getElementById('boardSize').addEventListener('input', e => {
            state.boardSize = parseInt(e.target.value, 10);
            document.getElementById('boardSizeLabel').textContent = `${state.boardSize}x${state.boardSize}`;
            state.startPos = [0, 0];
            state.endPos = [state.boardSize - 1, state.boardSize - 1];
            state.obstacles = [];
            reinitBoards();
            pushMonitor('info', `Board size changed to ${state.boardSize}x${state.boardSize}`);
        });

        document.getElementById('pieceSelect').addEventListener('change', e => {
            state.piece = e.target.value;
            UI.setPiece(state.piece);
            renderMainBoard();
            if (state.mode === 'race') initRaceMode();
            pushMonitor('info', `Piece set to ${state.piece}`);
        });

        document.getElementById('pathAlgo')?.addEventListener('change', e => {
            state.pathAlgo = e.target.value;
            pushMonitor('info', `Path algorithm set to ${state.pathAlgo}`);
        });

        document.getElementById('startPos').addEventListener('change', e => {
            state.startPos = e.target.value.split(',').map(Number);
            renderMainBoard();
            if (state.mode === 'race') initRaceMode();
        });
        document.getElementById('endPos').addEventListener('change', e => {
            state.endPos = e.target.value.split(',').map(Number);
            renderMainBoard();
            if (state.mode === 'race') initRaceMode();
        });

        document.getElementById('speedSlider').addEventListener('input', e => {
            updateSpeed(parseInt(e.target.value, 10));
        });
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const speed = parseInt(btn.dataset.speed, 10);
                document.getElementById('speedSlider').value = speed;
                updateSpeed(speed);
            });
        });

        document.getElementById('showAnimation').addEventListener('change', e => {
            state.showAnimation = e.target.checked;
        });
        document.getElementById('showNumbers').addEventListener('change', e => {
            state.showNumbers = e.target.checked;
            UI.setShowNumbers(state.showNumbers);
        });
        document.getElementById('showPath').addEventListener('change', e => {
            state.showPath = e.target.checked;
        });
        document.getElementById('showStats').addEventListener('change', e => {
            state.showStats = e.target.checked;
            document.getElementById('statsPanel')?.classList.toggle('hidden', !state.showStats);
        });

        ['BFS', 'DFS', 'AStar', 'Dijkstra', 'Quantum', 'Bidirectional'].forEach(algo => {
            const checkbox = document.getElementById(`race${algo}`);
            if (!checkbox) return;
            checkbox.addEventListener('change', updateRaceAlgos);
        });

        document.getElementById('compareAlgo1')?.addEventListener('change', e => {
            state.compareAlgos[0] = e.target.value;
        });
        document.getElementById('compareAlgo2')?.addEventListener('change', e => {
            state.compareAlgos[1] = e.target.value;
        });

        document.getElementById('calculateBtn').addEventListener('click', handleCalculate);
        document.getElementById('playBtn').addEventListener('click', () => { state.isPlaying = true; });
        document.getElementById('pauseBtn').addEventListener('click', () => { state.isPlaying = false; });
        document.getElementById('stepBtn').addEventListener('click', stepForward);
        document.getElementById('restartBtn').addEventListener('click', restartAnimation);

        document.getElementById('shareBtn').addEventListener('click', handleShare);
        document.getElementById('resetBtn').addEventListener('click', handleReset);
        document.getElementById('saveBtn').addEventListener('click', handleSave);

        document.getElementById('exportCsv').addEventListener('click', exportCSV);
        document.getElementById('exportJson').addEventListener('click', exportJSON);
        document.getElementById('exportImage').addEventListener('click', exportImage);

        document.getElementById('copyBtn').addEventListener('click', copyLink);
        document.getElementById('closeModalBtn').addEventListener('click', () => UI.hideModal());
        document.getElementById('clearMonitorBtn')?.addEventListener('click', clearMonitor);
        document.getElementById('exportMonitorBtn')?.addEventListener('click', exportMonitor);
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
        UI.setStatus('Race starting...');
        pushMonitor('info', `Race started with ${state.raceAlgos.join(', ')}`);
        state.raceResults = [];

        // Run all algorithms simultaneously
        const promises = state.raceAlgos.map(async (algo) => {
            const startTime = performance.now();

            // Update status
            const statusEl = document.getElementById(`status-${algo}`);
            if (statusEl) statusEl.textContent = 'Racing...';

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
                if (statusEl) statusEl.textContent = 'Finished';
                if (statusEl) statusEl.style.background = 'var(--success)';
            } else {
                if (statusEl) statusEl.textContent = 'No path';
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
            UI.setStatus(`${winner.name} wins: ${winner.result.stats.pathLength} moves in ${winner.result.stats.time}ms`);
            pushMonitor('success', `Race winner: ${winner.name}`);
        } else {
            UI.setStatus('No algorithm found a path');
            pushMonitor('warn', 'Race finished with no successful algorithm');
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
        try {
            if (state.mode === 'race') {
                if (state.raceAlgos.length < 2) {
                    UI.setStatus('Select at least 2 algorithms for race mode');
                    pushMonitor('warn', 'Race start blocked: less than 2 algorithms selected');
                    return;
                }
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
        } catch (error) {
            const message = error?.message || String(error);
            UI.setStatus(`Operation failed: ${message}`);
            pushMonitor('error', `handleCalculate failed: ${message}`);
        }
    }

    function calculatePath() {
        UI.setStatus('Calculating path...');
        UI.clearBoard('mainBoard');

        const selected = state.pathAlgo || 'BFS';
        const result = runAlgorithm(selected);
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
            UI.setStatus(`Path found with ${selected}: ${result.stats.pathLength} moves`);
            pushMonitor('success', `Path mode success: ${selected}, length ${result.stats.pathLength}, time ${result.stats.time}ms`);
        } else {
            UI.setStatus(`No path found with ${selected}`);
            pushMonitor('warn', `Path mode failed: ${selected}`);
        }

        document.getElementById('algoContent').innerHTML = Algorithms.EXPLANATIONS[selected] || Algorithms.EXPLANATIONS.BFS;
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
            UI.setStatus('Tour mode only works with Knight piece');
            return;
        }

        UI.setStatus('Calculating Knight\'s Tour...');
        UI.clearBoard('mainBoard');

        const result = Algorithms.KnightsTour(state.startPos, state.boardSize, state.obstacles);
        state.lastResult = result;

        if (result.success) {
            UI.highlightPath('mainBoard', result.path);
            UI.drawPath('mainBoard', result.path, 'mainSvg');
            UI.updateStats(result.stats);
            UI.setStatus(`Tour complete: ${result.stats.pathLength} moves`);
        } else {
            UI.setStatus('No complete tour found');
        }

        document.getElementById('algoContent').innerHTML = Algorithms.EXPLANATIONS.KnightsTour;
    }

    function calculateHeatmap() {
        UI.setStatus('Generating heatmap...');
        UI.clearBoard('mainBoard');

        const result = Algorithms.Heatmap(state.piece, state.startPos, state.boardSize, state.obstacles);
        state.lastResult = result;
        UI.renderHeatmap('mainBoard', result.distances, result.maxDist);
        state.obstacles.forEach(([r, c]) => UI.markSquare('mainBoard', r, c, 'obstacle'));
        UI.markSquare('mainBoard', state.startPos[0], state.startPos[1], 'start');
        UI.updateStats(result.stats);
        UI.setStatus(`Heatmap complete: max distance ${result.maxDist}`);
        pushMonitor('success', `Heatmap complete: max distance ${result.maxDist}`);
    }

    function calculateCompare() {
        UI.setStatus('Comparing algorithms...');
        const [algo1, algo2] = state.compareAlgos;
        if (!algo1 || !algo2) {
            UI.setStatus('Select both algorithms to compare');
            return;
        }
        if (algo1 === algo2) {
            UI.setStatus('Choose two different algorithms');
            return;
        }

        UI.createBoard('board1', state.boardSize, null, null);
        UI.createBoard('board2', state.boardSize, null, null);
        const result1 = runAlgorithm(algo1);
        const result2 = runAlgorithm(algo2);

        document.getElementById('compareTitle1').textContent = algo1;
        document.getElementById('compareTitle2').textContent = algo2;

        showCompareResult('board1', result1);
        showCompareResult('board2', result2);

        state.lastResult = {
            mode: 'compare',
            algorithms: { left: algo1, right: algo2 },
            results: [result1, result2],
            stats: {
                left: result1.stats,
                right: result2.stats
            }
        };

        const summary1 = result1.success ? `${result1.stats.pathLength} moves / ${result1.stats.time}ms` : 'No path';
        const summary2 = result2.success ? `${result2.stats.pathLength} moves / ${result2.stats.time}ms` : 'No path';
        UI.setStatus(`Compare complete: ${algo1} (${summary1}) vs ${algo2} (${summary2})`);
        pushMonitor('success', `Compare complete: ${algo1} vs ${algo2}`);
    }

    function runAlgorithm(algo) {
        if (algo === 'Bidirectional') {
            return Algorithms.Bidirectional(state.piece, state.startPos, state.endPos, state.boardSize, state.obstacles);
        }
        const fn = Algorithms[algo];
        if (typeof fn !== 'function') {
            return Algorithms.BFS(state.piece, state.startPos, state.endPos, state.boardSize, state.obstacles);
        }
        return fn(state.piece, state.startPos, state.endPos, state.boardSize, state.obstacles);
    }

    function showCompareResult(boardId, result) {
        state.obstacles.forEach(([r, c]) => UI.markSquare(boardId, r, c, 'obstacle'));
        UI.markSquare(boardId, state.startPos[0], state.startPos[1], 'start');
        UI.markSquare(boardId, state.endPos[0], state.endPos[1], 'end');

        if (result.success && state.showPath) {
            UI.highlightPath(boardId, result.path);
        }
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
        UI.setStatus('Learning content updated');
        pushMonitor('info', 'Learning content refreshed');
    }

    function initializeMonitoring() {
        renderMonitor();
        window.addEventListener('error', (event) => {
            pushMonitor('error', event.message || 'Unexpected runtime error');
        });
        window.addEventListener('unhandledrejection', (event) => {
            const reason = event.reason?.message || String(event.reason || 'Unhandled promise rejection');
            pushMonitor('error', reason);
        });
    }

    function pushMonitor(level, message) {
        const entry = {
            time: new Date().toISOString(),
            level,
            message
        };
        state.monitorEntries.unshift(entry);
        state.monitorEntries = state.monitorEntries.slice(0, 120);
        renderMonitor();
    }

    function renderMonitor() {
        const feed = document.getElementById('monitorFeed');
        if (!feed) return;
        if (!state.monitorEntries.length) {
            feed.innerHTML = '<div class="monitor-entry info"><strong>INFO</strong> Waiting for events...</div>';
            return;
        }
        feed.innerHTML = state.monitorEntries
            .map(item => {
                const stamp = new Date(item.time).toLocaleTimeString();
                const level = item.level.toUpperCase();
                return `<div class="monitor-entry ${item.level}"><strong>${level}</strong> [${stamp}] ${item.message}</div>`;
            })
            .join('');
    }

    function clearMonitor() {
        state.monitorEntries = [];
        renderMonitor();
        pushMonitor('info', 'Monitor cleared');
    }

    function exportMonitor() {
        const payload = JSON.stringify(state.monitorEntries, null, 2);
        downloadFile(payload, 'monitor-log.json', 'application/json');
        pushMonitor('success', 'Monitor log exported');
    }

    // ========== HELPERS ==========
    function handleSquareClick(r, c) {
        if (state.obstacles.some(([or, oc]) => or === r && oc === c)) return;

        if (state.mode === 'path' || state.mode === 'race' || state.mode === 'compare') {
            if (state.nextPlacement === 'start') {
                state.startPos = [r, c];
                state.nextPlacement = 'end';
            } else {
                state.endPos = [r, c];
                state.nextPlacement = 'start';
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
        if (state.mode === 'path' || state.mode === 'race' || state.mode === 'compare') {
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
        pushMonitor('info', 'Boards reinitialized');
    }

    function stepForward() {
        if (!state.lastResult || !state.lastResult.steps || !state.lastResult.steps.length) return;

        state.isPlaying = false;
        state.isAnimating = true;
        if (state.currentStep === 0) {
            UI.clearBoard('mainBoard');
            renderMainBoard();
        }

        if (state.currentStep < state.lastResult.steps.length) {
            UI.renderStep('mainBoard', state.lastResult.steps[state.currentStep]);
            state.currentStep += 1;
            UI.updateProgress(state.currentStep, state.lastResult.steps.length);
        }

        if (state.currentStep >= state.lastResult.steps.length) {
            state.isAnimating = false;
            if (state.lastResult.success && state.showPath) {
                UI.highlightPath('mainBoard', state.lastResult.path);
            }
        }
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
            pa: state.pathAlgo,
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
        state.nextPlacement = 'start';
        state.lastResult = null;
        reinitBoards();
        const leaderboard = document.getElementById('leaderboardContent');
        if (leaderboard) leaderboard.innerHTML = '';
        const raceLeaderboard = document.getElementById('raceLeaderboard');
        if (raceLeaderboard) raceLeaderboard.classList.add('hidden');
        UI.setStatus('Board reset');
        pushMonitor('info', 'Board reset');
    }

    function handleSave() {
        const data = {
            config: {
                boardSize: state.boardSize,
                theme: state.theme,
                mode: state.mode,
                piece: state.piece,
                pathAlgo: state.pathAlgo,
                startPos: state.startPos,
                endPos: state.endPos,
                obstacles: state.obstacles
            },
            result: state.lastResult,
            timestamp: new Date().toISOString()
        };

        const json = JSON.stringify(data, null, 2);
        downloadFile(json, 'chess-algorithm-save.json', 'application/json');
        UI.setStatus('Configuration saved');
    }

    async function copyLink() {
        const input = document.getElementById('shareInput');
        const value = input.value;
        try {
            await navigator.clipboard.writeText(value);
        } catch (error) {
            input.select();
            document.execCommand('copy');
        }

        const btn = document.getElementById('copyBtn');
        btn.innerHTML = '<i data-lucide="check" class="ic"></i>Copied';
        setTimeout(() => {
            btn.innerHTML = '<i data-lucide="copy" class="ic"></i>Copy';
            if (window.lucide?.createIcons) window.lucide.createIcons();
        }, 2000);
        if (window.lucide?.createIcons) window.lucide.createIcons();
        pushMonitor('success', 'Share link copied');
    }

    // ========== EXPORT ==========
    function exportCSV() {
        if (!state.lastResult || !state.lastResult.path) {
            UI.setStatus('No path data. Run an algorithm first.');
            return;
        }

        let csv = 'Step,Row,Column,Position\n';
        state.lastResult.path.forEach(([r, c], i) => {
            const pos = `${String.fromCharCode(97 + c)}${state.boardSize - r}`;
            csv += `${i + 1},${r},${c},${pos}\n`;
        });

        downloadFile(csv, 'path-result.csv', 'text/csv');
        UI.setStatus('CSV exported');
        pushMonitor('success', 'CSV export completed');
    }

    function exportJSON() {
        if (!state.lastResult) {
            UI.setStatus('No data available. Run an algorithm first.');
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
        UI.setStatus('JSON exported');
        pushMonitor('success', 'JSON export completed');
    }

    async function ensureHtml2Canvas() {
        if (typeof window.html2canvas === 'function') return true;
        try {
            await new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';
                script.async = true;
                script.onload = resolve;
                script.onerror = reject;
                document.head.appendChild(script);
            });
            return typeof window.html2canvas === 'function';
        } catch {
            return false;
        }
    }

    async function exportImage() {
        const targetId = state.mode === 'race'
            ? 'raceView'
            : (state.mode === 'compare' ? 'compareView' : 'singleBoardView');
        const target = document.getElementById(targetId);
        if (!target) {
            UI.setStatus('Nothing to export in current mode');
            return;
        }

        const html2canvasReady = await ensureHtml2Canvas();
        if (!html2canvasReady) {
            UI.setStatus('PNG export unavailable: html2canvas not loaded');
            return;
        }

        const canvas = await window.html2canvas(target, {
            backgroundColor: null,
            useCORS: true,
            scale: 2
        });
        canvas.toBlob(blob => {
            if (!blob) return;
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `chess-algorithms-${state.mode}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 'image/png');
        UI.setStatus('PNG exported');
        pushMonitor('success', `PNG export completed for ${state.mode} view`);
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
                state.theme = config.t || 'light';
                state.mode = config.m || 'race';
                state.piece = config.p || 'knight';
                state.pathAlgo = config.pa || 'BFS';
                state.startPos = config.s || [0, 0];
                state.endPos = config.e || [7, 7];
                state.obstacles = config.o || [];

                document.getElementById('boardSize').value = state.boardSize;
                document.getElementById('boardSizeLabel').textContent = `${state.boardSize}x${state.boardSize}`;
                document.getElementById('pieceSelect').value = state.piece;
                UI.setPiece(state.piece);
                const pathAlgoEl = document.getElementById('pathAlgo');
                if (pathAlgoEl) pathAlgoEl.value = state.pathAlgo;

                reinitBoards();
                UI.setTheme(state.theme);
                UI.setMode(state.mode);
        initializeMonitoring();
            } catch (e) {
                console.error('Failed to load config:', e);
            }
        }
    }

    // ========== START ==========
    init();

});

