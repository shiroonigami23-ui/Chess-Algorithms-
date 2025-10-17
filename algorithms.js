/**
 * algorithms.js - Complete Suite of Pathfinding Algorithms
 * BFS, DFS, A*, Dijkstra, Quantum, Bidirectional, Knight's Tour
 */

const Algorithms = (() => {

    // ========== PIECE MOVEMENTS ==========
    const MOVES = {
        knight: [[2,1], [1,2], [-1,2], [-2,1], [-2,-1], [-1,-2], [1,-2], [2,-1]],
        rook: [[0,1], [0,-1], [1,0], [-1,0]],
        bishop: [[1,1], [1,-1], [-1,1], [-1,-1]],
        queen: [[0,1], [0,-1], [1,0], [-1,0], [1,1], [1,-1], [-1,1], [-1,-1]],
        king: [[0,1], [0,-1], [1,0], [-1,0], [1,1], [1,-1], [-1,1], [-1,-1]],
        pawn: [[1,0], [-1,0]] // Simplified pawn (forward only)
    };

    const SLIDING = { rook: true, bishop: true, queen: true, knight: false, king: false, pawn: false };

    // ========== HELPERS ==========

    function isValid(r, c, size, obstacles, visited = null) {
        if (r < 0 || r >= size || c < 0 || c >= size) return false;
        if (obstacles.some(([or, oc]) => or === r && oc === c)) return false;
        if (visited && visited.has(`${r},${c}`)) return false;
        return true;
    }

    function heuristic(r1, c1, r2, c2) {
        // Manhattan distance
        return Math.abs(r1 - r2) + Math.abs(c1 - c2);
    }

    function euclidean(r1, c1, r2, c2) {
        return Math.sqrt((r1 - r2) ** 2 + (c1 - c2) ** 2);
    }

    // ========== BFS (Breadth-First Search) ==========

    function BFS(piece, start, end, size, obstacles) {
        const t0 = performance.now();
        const queue = [[start, [start], 0]];
        const visited = new Set([`${start[0]},${start[1]}`]);
        const steps = [];

        while (queue.length > 0) {
            const [[r, c], path, dist] = queue.shift();
            steps.push({ r, c, type: 'visit', dist });

            if (r === end[0] && c === end[1]) {
                return {
                    path,
                    steps,
                    stats: {
                        pathLength: path.length,
                        nodesExplored: visited.size,
                        time: (performance.now() - t0).toFixed(2),
                        efficiency: ((path.length / visited.size) * 100).toFixed(1)
                    },
                    success: true
                };
            }

            for (const [dr, dc] of MOVES[piece]) {
                if (SLIDING[piece]) {
                    let nr = r + dr, nc = c + dc;
                    while (isValid(nr, nc, size, obstacles)) {
                        const key = `${nr},${nc}`;
                        if (!visited.has(key)) {
                            visited.add(key);
                            steps.push({ r: nr, c: nc, type: 'explore', dist: dist + 1 });
                            queue.push([[nr, nc], [...path, [nr, nc]], dist + 1]);
                        }
                        nr += dr; nc += dc;
                    }
                } else {
                    const nr = r + dr, nc = c + dc;
                    const key = `${nr},${nc}`;
                    if (isValid(nr, nc, size, obstacles) && !visited.has(key)) {
                        visited.add(key);
                        steps.push({ r: nr, c: nc, type: 'explore', dist: dist + 1 });
                        queue.push([[nr, nc], [...path, [nr, nc]], dist + 1]);
                    }
                }
            }
        }

        return {
            path: [],
            steps,
            stats: { pathLength: 0, nodesExplored: visited.size, time: (performance.now() - t0).toFixed(2), efficiency: 0 },
            success: false
        };
    }

    // ========== DFS (Depth-First Search) ==========

    function DFS(piece, start, end, size, obstacles) {
        const t0 = performance.now();
        const stack = [[start, [start]]];
        const visited = new Set([`${start[0]},${start[1]}`]);
        const steps = [];

        while (stack.length > 0) {
            const [[r, c], path] = stack.pop();
            steps.push({ r, c, type: 'visit' });

            if (r === end[0] && c === end[1]) {
                return {
                    path,
                    steps,
                    stats: {
                        pathLength: path.length,
                        nodesExplored: visited.size,
                        time: (performance.now() - t0).toFixed(2),
                        efficiency: ((path.length / visited.size) * 100).toFixed(1)
                    },
                    success: true
                };
            }

            for (const [dr, dc] of MOVES[piece]) {
                if (SLIDING[piece]) {
                    let nr = r + dr, nc = c + dc;
                    while (isValid(nr, nc, size, obstacles)) {
                        const key = `${nr},${nc}`;
                        if (!visited.has(key)) {
                            visited.add(key);
                            steps.push({ r: nr, c: nc, type: 'explore' });
                            stack.push([[nr, nc], [...path, [nr, nc]]]);
                        }
                        nr += dr; nc += dc;
                    }
                } else {
                    const nr = r + dr, nc = c + dc;
                    const key = `${nr},${nc}`;
                    if (isValid(nr, nc, size, obstacles) && !visited.has(key)) {
                        visited.add(key);
                        steps.push({ r: nr, c: nc, type: 'explore' });
                        stack.push([[nr, nc], [...path, [nr, nc]]]);
                    }
                }
            }
        }

        return {
            path: [],
            steps,
            stats: { pathLength: 0, nodesExplored: visited.size, time: (performance.now() - t0).toFixed(2), efficiency: 0 },
            success: false
        };
    }

    // ========== A* (A-Star) ==========

    function AStar(piece, start, end, size, obstacles) {
        const t0 = performance.now();
        const openSet = [[0, start, [start], 0]]; // [f, pos, path, g]
        const visited = new Set();
        const steps = [];

        while (openSet.length > 0) {
            openSet.sort((a, b) => a[0] - b[0]);
            const [f, [r, c], path, g] = openSet.shift();
            const key = `${r},${c}`;

            if (visited.has(key)) continue;
            visited.add(key);
            steps.push({ r, c, type: 'visit', f, g });

            if (r === end[0] && c === end[1]) {
                return {
                    path,
                    steps,
                    stats: {
                        pathLength: path.length,
                        nodesExplored: visited.size,
                        time: (performance.now() - t0).toFixed(2),
                        efficiency: ((path.length / visited.size) * 100).toFixed(1)
                    },
                    success: true
                };
            }

            for (const [dr, dc] of MOVES[piece]) {
                if (SLIDING[piece]) {
                    let nr = r + dr, nc = c + dc;
                    while (isValid(nr, nc, size, obstacles)) {
                        const nkey = `${nr},${nc}`;
                        if (!visited.has(nkey)) {
                            const ng = g + 1;
                            const h = heuristic(nr, nc, end[0], end[1]);
                            const nf = ng + h;
                            steps.push({ r: nr, c: nc, type: 'explore', f: nf, g: ng, h });
                            openSet.push([nf, [nr, nc], [...path, [nr, nc]], ng]);
                        }
                        nr += dr; nc += dc;
                    }
                } else {
                    const nr = r + dr, nc = c + dc;
                    const nkey = `${nr},${nc}`;
                    if (isValid(nr, nc, size, obstacles) && !visited.has(nkey)) {
                        const ng = g + 1;
                        const h = heuristic(nr, nc, end[0], end[1]);
                        const nf = ng + h;
                        steps.push({ r: nr, c: nc, type: 'explore', f: nf, g: ng, h });
                        openSet.push([nf, [nr, nc], [...path, [nr, nc]], ng]);
                    }
                }
            }
        }

        return {
            path: [],
            steps,
            stats: { pathLength: 0, nodesExplored: visited.size, time: (performance.now() - t0).toFixed(2), efficiency: 0 },
            success: false
        };
    }

    // ========== DIJKSTRA ==========

    function Dijkstra(piece, start, end, size, obstacles) {
        const t0 = performance.now();
        const pq = [[0, start, [start]]]; // [dist, pos, path]
        const visited = new Set();
        const steps = [];

        while (pq.length > 0) {
            pq.sort((a, b) => a[0] - b[0]);
            const [dist, [r, c], path] = pq.shift();
            const key = `${r},${c}`;

            if (visited.has(key)) continue;
            visited.add(key);
            steps.push({ r, c, type: 'visit', dist });

            if (r === end[0] && c === end[1]) {
                return {
                    path,
                    steps,
                    stats: {
                        pathLength: path.length,
                        nodesExplored: visited.size,
                        time: (performance.now() - t0).toFixed(2),
                        efficiency: ((path.length / visited.size) * 100).toFixed(1)
                    },
                    success: true
                };
            }

            for (const [dr, dc] of MOVES[piece]) {
                if (SLIDING[piece]) {
                    let nr = r + dr, nc = c + dc;
                    while (isValid(nr, nc, size, obstacles)) {
                        const nkey = `${nr},${nc}`;
                        if (!visited.has(nkey)) {
                            steps.push({ r: nr, c: nc, type: 'explore', dist: dist + 1 });
                            pq.push([dist + 1, [nr, nc], [...path, [nr, nc]]]);
                        }
                        nr += dr; nc += dc;
                    }
                } else {
                    const nr = r + dr, nc = c + dc;
                    const nkey = `${nr},${nc}`;
                    if (isValid(nr, nc, size, obstacles) && !visited.has(nkey)) {
                        steps.push({ r: nr, c: nc, type: 'explore', dist: dist + 1 });
                        pq.push([dist + 1, [nr, nc], [...path, [nr, nc]]]);
                    }
                }
            }
        }

        return {
            path: [],
            steps,
            stats: { pathLength: 0, nodesExplored: visited.size, time: (performance.now() - t0).toFixed(2), efficiency: 0 },
            success: false
        };
    }

    // ========== QUANTUM (Parallel Exploration) ==========

    function Quantum(piece, start, end, size, obstacles) {
        const t0 = performance.now();
        let quantumStates = [[start, [start], 1.0]]; // [pos, path, amplitude]
        const visited = new Set([`${start[0]},${start[1]}`]);
        const steps = [];
        let maxParallel = 1;

        while (quantumStates.length > 0) {
            maxParallel = Math.max(maxParallel, quantumStates.length);
            const nextGen = [];

            for (const [[r, c], path, amp] of quantumStates) {
                steps.push({ r, c, type: 'quantum', amp, parallel: quantumStates.length });

                if (r === end[0] && c === end[1]) {
                    return {
                        path,
                        steps,
                        stats: {
                            pathLength: path.length,
                            nodesExplored: visited.size,
                            time: (performance.now() - t0).toFixed(2),
                            efficiency: ((path.length / visited.size) * 100).toFixed(1),
                            maxParallel
                        },
                        success: true
                    };
                }

                for (const [dr, dc] of MOVES[piece]) {
                    if (SLIDING[piece]) {
                        let nr = r + dr, nc = c + dc;
                        while (isValid(nr, nc, size, obstacles)) {
                            const key = `${nr},${nc}`;
                            if (!visited.has(key)) {
                                visited.add(key);
                                nextGen.push([[nr, nc], [...path, [nr, nc]], amp * 0.95]);
                            }
                            nr += dr; nc += dc;
                        }
                    } else {
                        const nr = r + dr, nc = c + dc;
                        const key = `${nr},${nc}`;
                        if (isValid(nr, nc, size, obstacles) && !visited.has(key)) {
                            visited.add(key);
                            nextGen.push([[nr, nc], [...path, [nr, nc]], amp * 0.95]);
                        }
                    }
                }
            }

            // Quantum collapse: keep top 50%
            quantumStates = nextGen.sort((a, b) => b[2] - a[2]).slice(0, Math.max(10, Math.floor(nextGen.length * 0.5)));
        }

        return {
            path: [],
            steps,
            stats: { pathLength: 0, nodesExplored: visited.size, time: (performance.now() - t0).toFixed(2), efficiency: 0, maxParallel },
            success: false
        };
    }

    // ========== BIDIRECTIONAL BFS ==========

    function Bidirectional(piece, start, end, size, obstacles) {
        const t0 = performance.now();
        const forwardQueue = [[start, [start]]];
        const backwardQueue = [[end, [end]]];
        const forwardVisited = new Map([[`${start[0]},${start[1]}`, [start]]]);
        const backwardVisited = new Map([[`${end[0]},${end[1]}`, [end]]]);
        const steps = [];

        while (forwardQueue.length > 0 || backwardQueue.length > 0) {
            // Forward step
            if (forwardQueue.length > 0) {
                const [[r, c], path] = forwardQueue.shift();
                steps.push({ r, c, type: 'visit_forward' });

                // Check if backward visited this
                const key = `${r},${c}`;
                if (backwardVisited.has(key)) {
                    const backPath = backwardVisited.get(key).slice().reverse();
                    const fullPath = [...path.slice(0, -1), ...backPath];
                    return {
                        path: fullPath,
                        steps,
                        stats: {
                            pathLength: fullPath.length,
                            nodesExplored: forwardVisited.size + backwardVisited.size,
                            time: (performance.now() - t0).toFixed(2),
                            efficiency: ((fullPath.length / (forwardVisited.size + backwardVisited.size)) * 100).toFixed(1)
                        },
                        success: true
                    };
                }

                for (const [dr, dc] of MOVES[piece]) {
                    const nr = r + dr, nc = c + dc;
                    const nkey = `${nr},${nc}`;
                    if (isValid(nr, nc, size, obstacles, forwardVisited)) {
                        const newPath = [...path, [nr, nc]];
                        forwardVisited.set(nkey, newPath);
                        forwardQueue.push([[nr, nc], newPath]);
                        steps.push({ r: nr, c: nc, type: 'explore_forward' });
                    }
                }
            }

            // Backward step
            if (backwardQueue.length > 0) {
                const [[r, c], path] = backwardQueue.shift();
                steps.push({ r, c, type: 'visit_backward' });

                const key = `${r},${c}`;
                if (forwardVisited.has(key)) {
                    const forPath = forwardVisited.get(key);
                    const backPath = path.slice().reverse();
                    const fullPath = [...forPath.slice(0, -1), ...backPath];
                    return {
                        path: fullPath,
                        steps,
                        stats: {
                            pathLength: fullPath.length,
                            nodesExplored: forwardVisited.size + backwardVisited.size,
                            time: (performance.now() - t0).toFixed(2),
                            efficiency: ((fullPath.length / (forwardVisited.size + backwardVisited.size)) * 100).toFixed(1)
                        },
                        success: true
                    };
                }

                for (const [dr, dc] of MOVES[piece]) {
                    const nr = r + dr, nc = c + dc;
                    const nkey = `${nr},${nc}`;
                    if (isValid(nr, nc, size, obstacles, backwardVisited)) {
                        const newPath = [...path, [nr, nc]];
                        backwardVisited.set(nkey, newPath);
                        backwardQueue.push([[nr, nc], newPath]);
                        steps.push({ r: nr, c: nc, type: 'explore_backward' });
                    }
                }
            }
        }

        return {
            path: [],
            steps,
            stats: { pathLength: 0, nodesExplored: forwardVisited.size + backwardVisited.size, time: (performance.now() - t0).toFixed(2), efficiency: 0 },
            success: false
        };
    }

    // ========== KNIGHT'S TOUR ==========

    function KnightsTour(start, size, obstacles) {
        const t0 = performance.now();
        const target = size * size - obstacles.length;
        const visited = new Set();
        let path = [];
        const steps = [];

        function countMoves(r, c) {
            let count = 0;
            for (const [dr, dc] of MOVES.knight) {
                const nr = r + dr, nc = c + dc;
                if (isValid(nr, nc, size, obstacles, visited)) count++;
            }
            return count;
        }

        function getNextMoves(r, c) {
            const moves = [];
            for (const [dr, dc] of MOVES.knight) {
                const nr = r + dr, nc = c + dc;
                if (isValid(nr, nc, size, obstacles, visited)) {
                    moves.push({ pos: [nr, nc], onward: countMoves(nr, nc) });
                }
            }
            return moves.sort((a, b) => a.onward - b.onward);
        }

        function solve(r, c) {
            visited.add(`${r},${c}`);
            path.push([r, c]);
            steps.push({ r, c, type: 'visit' });

            if (path.length === target) return true;

            const nextMoves = getNextMoves(r, c);
            steps.push({ heuristic: nextMoves });

            for (const move of nextMoves) {
                if (solve(...move.pos)) return true;
            }

            visited.delete(`${r},${c}`);
            path.pop();
            return false;
        }

        const success = solve(...start);

        return {
            path: success ? path : [],
            steps,
            stats: {
                pathLength: path.length,
                nodesExplored: steps.length,
                time: (performance.now() - t0).toFixed(2),
                efficiency: path.length > 0 ? ((path.length / steps.length) * 100).toFixed(1) : 0
            },
            success
        };
    }

    // ========== HEATMAP ==========

    function Heatmap(piece, start, size, obstacles) {
        const t0 = performance.now();
        const distances = Array(size).fill(null).map(() => Array(size).fill(Infinity));
        const queue = [[start, 0]];
        distances[start[0]][start[1]] = 0;
        const steps = [];
        let maxDist = 0;

        while (queue.length > 0) {
            const [[r, c], dist] = queue.shift();
            steps.push({ r, c, type: 'visit', dist });
            maxDist = Math.max(maxDist, dist);

            for (const [dr, dc] of MOVES[piece]) {
                if (SLIDING[piece]) {
                    let nr = r + dr, nc = c + dc;
                    while (isValid(nr, nc, size, obstacles)) {
                        if (distances[nr][nc] === Infinity) {
                            distances[nr][nc] = dist + 1;
                            steps.push({ r: nr, c: nc, type: 'explore', dist: dist + 1 });
                            queue.push([[nr, nc], dist + 1]);
                        }
                        nr += dr; nc += dc;
                    }
                } else {
                    const nr = r + dr, nc = c + dc;
                    if (isValid(nr, nc, size, obstacles) && distances[nr][nc] === Infinity) {
                        distances[nr][nc] = dist + 1;
                        steps.push({ r: nr, c: nc, type: 'explore', dist: dist + 1 });
                        queue.push([[nr, nc], dist + 1]);
                    }
                }
            }
        }

        const reachable = distances.flat().filter(d => d !== Infinity).length;

        return {
            distances,
            maxDist,
            steps,
            stats: {
                pathLength: maxDist,
                nodesExplored: reachable,
                time: (performance.now() - t0).toFixed(2),
                efficiency: ((reachable / (size * size)) * 100).toFixed(1)
            },
            success: true
        };
    }

    // ========== EXPLANATIONS ==========

    const EXPLANATIONS = {
        BFS: `<strong>Breadth-First Search (BFS)</strong><br>Explores level by level, guarantees shortest path. Uses queue (FIFO). Time: O(V+E).`,
        DFS: `<strong>Depth-First Search (DFS)</strong><br>Explores deeply before backtracking. Uses stack (LIFO). May not find shortest path. Time: O(V+E).`,
        AStar: `<strong>A* Algorithm</strong><br>Uses heuristic to guide search toward goal. f(n) = g(n) + h(n). Optimal with admissible heuristic. Time: O(b^d).`,
        Dijkstra: `<strong>Dijkstra's Algorithm</strong><br>Finds shortest path in weighted graphs. Priority queue based. Guaranteed optimal. Time: O((V+E)logV).`,
        Quantum: `<strong>Quantum-Inspired Parallel BFS</strong><br>Explores multiple paths simultaneously with amplitude tracking. Simulates quantum superposition.`,
        Bidirectional: `<strong>Bidirectional BFS</strong><br>Searches from both start and end simultaneously. Can be twice as fast. Meets in the middle.`,
        KnightsTour: `<strong>Knight's Tour (Warnsdorff's)</strong><br>Visits every square once. Greedy heuristic: choose square with fewest onward moves. Backtracking.`
    };

    // Public API
    return {
        BFS,
        DFS,
        AStar,
        Dijkstra,
        Quantum,
        Bidirectional,
        KnightsTour,
        Heatmap,
        EXPLANATIONS,
        MOVES,
        SLIDING
    };

})();
