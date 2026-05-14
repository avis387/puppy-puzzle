const fs = require('fs');
const path = require('path');

const BOARD_SIZE = 5;

const PIECE_SETS = {
    classic: [
        { id: 'A', shape: [[2, 1, 1], [1, 0, 0]] },
        { id: 'B', shape: [[1, 2, 1], [0, 1, 0]] },
        { id: 'C', shape: [[1, 1, 0], [0, 2, 1]] },
        { id: 'D', shape: [[2, 1], [1, 2]] }
    ],
    cave: [
        { id: 'A', shape: [[2, 1, 1], [1, 0, 0]] },
        { id: 'B', shape: [[1, 2, 1], [0, 0, 1]] },
        { id: 'C', shape: [[1, 0, 1], [0, 2, 1]] },
        { id: 'D', shape: [[2, 1], [1, 2]] }
    ],
    expert: [
        { id: 'A', shape: [[2, 1, 0], [0, 1, 1]] },
        { id: 'B', shape: [[1, 2], [1, 0], [1, 0]] },
        { id: 'C', shape: [[1, 1, 1], [0, 2, 0]] },
        { id: 'D', shape: [[2, 1], [1, 2]] }
    ],
    master: [
        { id: 'A', shape: [[2, 1, 1], [1, 0, 0]] },
        { id: 'B', shape: [[1, 2, 1], [0, 1, 0]] },
        { id: 'C', shape: [[1, 1, 0], [0, 2, 1]] },
        { id: 'D', shape: [[2, 1], [1, 2]] },
        { id: 'E', shape: [[1]] }
    ]
};

const TYPES = {
    BONE: 6,
    TREE: 7,
    FLOWER: 8,
    MUD: 9,
    HOLE: 10,
    FENCE: 11
};

const TILING_LIMITS = {
    classic: 130000,
    cave: 150000,
    expert: 130000,
    master: 120000
};

const CHAPTERS = [
    { group: '草地篇', range: '1-20', count: 20, pieceSet: 'classic', bones: 1, trees: 1, flowers: 0, mud: 0, holes: 0, fences: 0, requireConnectedPaths: false, minScore: 15000, rank: 1, maxAttempts: 2800, variants: 2, intent: '狗、骨頭、樹' },
    { group: '花園篇', range: '21-40', count: 20, pieceSet: 'classic', bones: 2, trees: 1, flowers: 1, mud: 0, holes: 0, fences: 0, requireConnectedPaths: false, minScore: 18000, rank: 2, maxAttempts: 2800, variants: 2, intent: '新增花圃' },
    { group: '雨後篇', range: '41-60', count: 20, pieceSet: 'classic', bones: 2, trees: 2, flowers: 1, mud: 1, holes: 0, fences: 0, requireConnectedPaths: false, minScore: 20000, rank: 3, maxAttempts: 2800, variants: 2, intent: '新增泥地' },
    { group: '地洞篇', range: '61-80', count: 20, pieceSet: 'cave', bones: 3, trees: 2, flowers: 1, mud: 1, holes: 1, fences: 0, requireConnectedPaths: false, minScore: 22000, rank: 4, maxAttempts: 3000, variants: 2, intent: '新增有洞拼塊與地洞' },
    { group: '木柵篇', range: '81-100', count: 20, pieceSet: 'cave', bones: 3, trees: 2, flowers: 1, mud: 1, holes: 1, fences: 2, requireConnectedPaths: false, minScore: 23000, rank: 5, maxAttempts: 3000, variants: 2, intent: '新增柵欄' },
    { group: '專家篇', range: '101-130', count: 30, pieceSet: 'expert', bones: 4, trees: 3, flowers: 2, mud: 2, holes: 0, fences: 1, requireConnectedPaths: false, minScore: 24000, rank: 6, maxAttempts: 3500, variants: 2, intent: '新拼塊包' },
    { group: '大師篇', range: '131-160', count: 30, pieceSet: 'master', bones: 2, trees: 1, flowers: 1, mud: 1, holes: 0, fences: 0, requireConnectedPaths: true, minScore: 15000, rank: 7, maxAttempts: 7000, variants: 3, intent: '5 塊拼塊、連通路徑' }
];

function rotate(shape) {
    const rows = shape.length;
    const cols = shape[0].length;
    const result = Array.from({ length: cols }, () => Array(rows).fill(0));
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            result[c][rows - 1 - r] = shape[r][c];
        }
    }
    return result;
}

function flip(shape) {
    return shape.map(row => [...row].reverse());
}

function getOrientations(shape) {
    const seen = new Set();
    const orientations = [];

    for (let flipped = 0; flipped < 2; flipped++) {
        let current = flipped ? flip(shape) : shape;
        for (let rotation = 0; rotation < 4; rotation++) {
            const key = JSON.stringify(current);
            if (!seen.has(key)) {
                seen.add(key);
                orientations.push(current);
            }
            current = rotate(current);
        }
    }

    return orientations;
}

function makePrng(seed) {
    let state = seed >>> 0;
    return function next() {
        state = (state * 1664525 + 1013904223) >>> 0;
        return state / 0x100000000;
    };
}

function shuffle(array, random) {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}

function takeCells(cells, count) {
    if (cells.length < count) return null;
    return cells.slice(0, count);
}

function cellKey(cell) {
    return `${cell.r},${cell.c}`;
}

function cellSpread(cells) {
    let spread = 0;
    for (let i = 0; i < cells.length; i++) {
        for (let j = i + 1; j < cells.length; j++) {
            spread += Math.abs(cells[i].r - cells[j].r) + Math.abs(cells[i].c - cells[j].c);
        }
    }
    return spread;
}

function createRuntime(pieceSetId) {
    const pieces = PIECE_SETS[pieceSetId];
    if (!pieces) throw new Error(`Unknown piece set: ${pieceSetId}`);

    const runtime = {
        pieceSetId,
        pieces,
        pieceOrientations: pieces.map(piece => getOrientations(piece.shape)),
        placementBoard: Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(0)),
        tilings: [],
        maxTilings: TILING_LIMITS[pieceSetId] || 120000
    };

    enumerateTilings(runtime, 0, []);
    return runtime;
}

function enumerateTilings(runtime, pieceIndex, currentPlacements) {
    if (runtime.tilings.length >= runtime.maxTilings) return;

    if (pieceIndex === runtime.pieces.length) {
        const houses = [];
        const paths = [];
        const empties = [];
        const cutouts = [];
        const cutoutKeys = new Set();

        for (let r = 0; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
                const value = runtime.placementBoard[r][c];
                if (value === 2) houses.push({ r, c });
                else if (value === 1) paths.push({ r, c });
                else empties.push({ r, c });
            }
        }

        currentPlacements.forEach(placement => {
            for (let pr = 0; pr < placement.shape.length; pr++) {
                for (let pc = 0; pc < placement.shape[pr].length; pc++) {
                    const r = placement.r + pr;
                    const c = placement.c + pc;
                    if (placement.shape[pr][pc] === 0 && runtime.placementBoard[r][c] === 0) {
                        const key = `${r},${c}`;
                        if (!cutoutKeys.has(key)) {
                            cutoutKeys.add(key);
                            cutouts.push({ r, c });
                        }
                    }
                }
            }
        });

        runtime.tilings.push({
            dogs: houses,
            paths,
            empties,
            cutouts,
            solution: JSON.parse(JSON.stringify(currentPlacements))
        });
        return;
    }

    for (const orientation of runtime.pieceOrientations[pieceIndex]) {
        const rows = orientation.length;
        const cols = orientation[0].length;

        for (let r = 0; r <= BOARD_SIZE - rows; r++) {
            for (let c = 0; c <= BOARD_SIZE - cols; c++) {
                let valid = true;

                for (let pr = 0; pr < rows && valid; pr++) {
                    for (let pc = 0; pc < cols; pc++) {
                        if (orientation[pr][pc] !== 0 && runtime.placementBoard[r + pr][c + pc] !== 0) {
                            valid = false;
                            break;
                        }
                    }
                }

                if (!valid) continue;

                for (let pr = 0; pr < rows; pr++) {
                    for (let pc = 0; pc < cols; pc++) {
                        if (orientation[pr][pc] !== 0) runtime.placementBoard[r + pr][c + pc] = orientation[pr][pc];
                    }
                }

                currentPlacements.push({ r, c, shape: orientation });
                enumerateTilings(runtime, pieceIndex + 1, currentPlacements);
                currentPlacements.pop();

                for (let pr = 0; pr < rows; pr++) {
                    for (let pc = 0; pc < cols; pc++) {
                        if (orientation[pr][pc] !== 0) runtime.placementBoard[r + pr][c + pc] = 0;
                    }
                }

                if (runtime.tilings.length >= runtime.maxTilings) return;
            }
        }
    }
}

function buildGrid(level) {
    const grid = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(0));
    level.dogs.forEach((dog, index) => { grid[dog.r][dog.c] = index + 1; });
    level.bones.forEach(bone => { grid[bone.r][bone.c] = TYPES.BONE; });
    level.trees.forEach(tree => { grid[tree.r][tree.c] = TYPES.TREE; });
    level.flowers.forEach(flower => { grid[flower.r][flower.c] = TYPES.FLOWER; });
    level.mud.forEach(mud => { grid[mud.r][mud.c] = TYPES.MUD; });
    level.holes.forEach(hole => { grid[hole.r][hole.c] = TYPES.HOLE; });
    level.fences.forEach(fence => { grid[fence.r][fence.c] = TYPES.FENCE; });
    return grid;
}

function getPieceCells(shape, r, c) {
    const solid = [];
    const cutouts = [];
    for (let pr = 0; pr < shape.length; pr++) {
        for (let pc = 0; pc < shape[pr].length; pc++) {
            const cell = { r: r + pr, c: c + pc, value: shape[pr][pc] };
            if (shape[pr][pc] !== 0) solid.push(cell);
            else cutouts.push(cell);
        }
    }
    return { solid, cutouts };
}

function isSoloPlacementValid(grid, shape, r, c) {
    const { solid } = getPieceCells(shape, r, c);
    for (const cell of solid) {
        if (cell.r < 0 || cell.r >= BOARD_SIZE || cell.c < 0 || cell.c >= BOARD_SIZE) return false;

        const boardValue = grid[cell.r][cell.c];
        if (boardValue >= 1 && boardValue <= 5 && cell.value === 1) return false;
        if (boardValue === TYPES.BONE && cell.value === 2) return false;
        if (boardValue === TYPES.TREE) return false;
        if (boardValue === TYPES.FLOWER && cell.value === 1) return false;
        if (boardValue === TYPES.MUD && cell.value === 2) return false;
        if (boardValue === TYPES.HOLE) return false;
        if (boardValue === TYPES.FENCE) return false;
    }

    return true;
}

function isConnected(cells) {
    if (cells.size <= 1) return true;
    const [start] = cells;
    const seen = new Set([start]);
    const queue = [start];

    while (queue.length > 0) {
        const [r, c] = queue.shift().split(',').map(Number);
        [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dr, dc]) => {
            const key = `${r + dr},${c + dc}`;
            if (cells.has(key) && !seen.has(key)) {
                seen.add(key);
                queue.push(key);
            }
        });
    }

    return seen.size === cells.size;
}

function analyzeLevel(level, runtime) {
    const grid = buildGrid(level);
    const dogTotal = level.dogs.length;
    const boneTotal = level.bones.length;
    const holeTotal = level.holes.length;

    const candidates = runtime.pieces.map((piece, pieceIndex) => {
        const placements = [];
        for (const orientation of runtime.pieceOrientations[pieceIndex]) {
            for (let r = 0; r <= BOARD_SIZE - orientation.length; r++) {
                for (let c = 0; c <= BOARD_SIZE - orientation[0].length; c++) {
                    if (!isSoloPlacementValid(grid, orientation, r, c)) continue;
                    const cells = getPieceCells(orientation, r, c);
                    placements.push({
                        r,
                        c,
                        shape: orientation,
                        solid: cells.solid,
                        cutouts: cells.cutouts
                    });
                }
            }
        }
        return placements;
    });

    let solutionCount = 0;
    let nodes = 0;
    let verifiedSolution = null;
    const occupied = new Set();
    const selected = [];

    function search(pieceIndex, coveredDogs, coveredBones, coveredHoles) {
        nodes++;
        if (solutionCount > 1) return;

        if (pieceIndex === runtime.pieces.length) {
            if (coveredDogs.size !== dogTotal || coveredBones.size !== boneTotal || coveredHoles.size !== holeTotal) return;
            if (level.requireConnectedPaths) {
                const pathCells = new Set();
                selected.forEach(candidate => {
                    candidate.solid.forEach(cell => {
                        if (cell.value === 1) pathCells.add(cellKey(cell));
                    });
                });
                if (!isConnected(pathCells)) return;
            }
            solutionCount++;
            if (!verifiedSolution) {
                verifiedSolution = selected.map(candidate => ({
                    r: candidate.r,
                    c: candidate.c,
                    shape: candidate.shape
                }));
            }
            return;
        }

        for (const candidate of candidates[pieceIndex]) {
            let overlaps = false;
            for (const cell of candidate.solid) {
                if (occupied.has(cellKey(cell))) {
                    overlaps = true;
                    break;
                }
            }
            if (overlaps) continue;

            const nextDogs = new Set(coveredDogs);
            const nextBones = new Set(coveredBones);
            const nextHoles = new Set(coveredHoles);

            candidate.solid.forEach(cell => {
                const boardValue = grid[cell.r][cell.c];
                if (cell.value === 2 && boardValue >= 1 && boardValue <= 5) nextDogs.add(cellKey(cell));
                if (cell.value === 1 && boardValue === TYPES.BONE) nextBones.add(cellKey(cell));
            });

            candidate.cutouts.forEach(cell => {
                if (grid[cell.r]?.[cell.c] === TYPES.HOLE) nextHoles.add(cellKey(cell));
            });

            candidate.solid.forEach(cell => occupied.add(cellKey(cell)));
            selected.push(candidate);
            search(pieceIndex + 1, nextDogs, nextBones, nextHoles);
            selected.pop();
            candidate.solid.forEach(cell => occupied.delete(cellKey(cell)));
        }
    }

    search(0, new Set(), new Set(), new Set());

    const branchSum = candidates.reduce((sum, candidateList) => sum + candidateList.length, 0);
    const branchProduct = candidates.reduce((product, candidateList) => product * Math.max(candidateList.length, 1), 1);
    const objectPressure = (level.bones.length * 650) + (level.trees.length * 750) + (level.flowers.length * 550) + (level.mud.length * 600) + (level.holes.length * 900) + (level.fences.length * 700);
    const connectedBonus = level.requireConnectedPaths ? 2200 : 0;
    const score = nodes + branchSum * 70 + Math.log10(branchProduct) * 1200 + cellSpread(level.dogs) * 250 + objectPressure + connectedBonus;

    return {
        branchSum,
        branchProduct,
        nodes,
        score: Math.round(score),
        solutions: solutionCount,
        solution: verifiedSolution
    };
}

function levelSignature(level) {
    const groups = ['dogs', 'bones', 'trees', 'flowers', 'mud', 'holes', 'fences']
        .map(name => `${name}:${level[name].map(cellKey).sort().join(';')}`);
    return `${level.pieceSet}|${groups.join('|')}|C:${level.requireConnectedPaths ? 1 : 0}`;
}

function makeLevelFromTiling(tiling, chapter, random) {
    const shuffledPaths = shuffle(tiling.paths, random);
    const shuffledEmpties = shuffle(tiling.empties, random);
    const shuffledCutouts = shuffle(tiling.cutouts, random);

    const bones = takeCells(shuffledPaths, chapter.bones);
    if (!bones) return null;

    const mud = takeCells(shuffledPaths.slice(chapter.bones), chapter.mud);
    if (!mud) return null;

    const holes = takeCells(shuffledCutouts, chapter.holes);
    if (!holes) return null;
    const holeKeys = new Set(holes.map(cellKey));
    const openEmpties = shuffledEmpties.filter(cell => !holeKeys.has(cellKey(cell)));

    const trees = takeCells(openEmpties, chapter.trees);
    if (!trees) return null;

    const flowers = takeCells(openEmpties.slice(chapter.trees), chapter.flowers);
    if (!flowers) return null;

    const fences = takeCells(openEmpties.slice(chapter.trees + chapter.flowers), chapter.fences);
    if (!fences) return null;

    return {
        pieceSet: chapter.pieceSet,
        requireConnectedPaths: chapter.requireConnectedPaths,
        dogs: tiling.dogs,
        bones,
        trees,
        flowers,
        mud,
        holes,
        fences,
        solution: tiling.solution
    };
}

function pickLevelsForChapter(chapter, runtime, random, usedSignatures) {
    const candidates = [];
    const shuffledTilings = shuffle(runtime.tilings, random);
    const maxAttempts = Math.min(shuffledTilings.length, chapter.maxAttempts || 3000);

    for (let i = 0; i < maxAttempts; i++) {
        const tiling = shuffledTilings[i];

        for (let variant = 0; variant < (chapter.variants || 2); variant++) {
            const level = makeLevelFromTiling(tiling, chapter, random);
            if (!level) continue;

            const signature = levelSignature(level);
            if (usedSignatures.has(signature)) continue;

            const analysis = analyzeLevel(level, runtime);
            if (analysis.solutions !== 1) continue;

            candidates.push({ ...level, solution: analysis.solution, analysis, signature });
        }
    }

    candidates.sort((a, b) => b.analysis.score - a.analysis.score);

    const selected = [];
    for (const candidate of candidates) {
        if (selected.length >= chapter.count) break;
        if (candidate.analysis.score < chapter.minScore && selected.length >= Math.ceil(chapter.count * 0.75)) continue;

        selected.push(candidate);
        usedSignatures.add(candidate.signature);
    }

    if (selected.length < chapter.count) {
        throw new Error(`Not enough levels for ${chapter.group}. Needed ${chapter.count}, got ${selected.length}.`);
    }

    selected.sort((a, b) => a.analysis.score - b.analysis.score);
    return selected;
}

function toOutputLevel(level, chapter) {
    const items = [];
    level.dogs.forEach((dog, index) => items.push({ type: index + 1, r: dog.r, c: dog.c }));
    level.bones.forEach(bone => items.push({ type: TYPES.BONE, r: bone.r, c: bone.c }));
    level.trees.forEach(tree => items.push({ type: TYPES.TREE, r: tree.r, c: tree.c }));
    level.flowers.forEach(flower => items.push({ type: TYPES.FLOWER, r: flower.r, c: flower.c }));
    level.mud.forEach(mud => items.push({ type: TYPES.MUD, r: mud.r, c: mud.c }));
    level.holes.forEach(hole => items.push({ type: TYPES.HOLE, r: hole.r, c: hole.c }));
    level.fences.forEach(fence => items.push({ type: TYPES.FENCE, r: fence.r, c: fence.c }));

    return {
        group: chapter.group,
        chapter: chapter.group,
        chapterRange: chapter.range,
        chapterIntent: chapter.intent,
        pieceSet: chapter.pieceSet,
        difficultyRank: chapter.rank,
        difficultyScore: level.analysis.score,
        solverNodes: level.analysis.nodes,
        branchSum: level.analysis.branchSum,
        requireConnectedPaths: chapter.requireConnectedPaths,
        items,
        solution: level.solution
    };
}

function main() {
    const random = makePrng(20260514);
    const runtimes = {};

    Object.keys(PIECE_SETS).forEach(pieceSetId => {
        console.log(`Enumerating tilings for ${pieceSetId}...`);
        runtimes[pieceSetId] = createRuntime(pieceSetId);
        console.log(`${pieceSetId} tilings: ${runtimes[pieceSetId].tilings.length}`);
    });

    const usedSignatures = new Set();
    const output = {};
    const reportRows = [];
    let levelId = 1;

    CHAPTERS.forEach(chapter => {
        console.log(`Selecting ${chapter.group} levels...`);
        const runtime = runtimes[chapter.pieceSet];
        const levels = pickLevelsForChapter(chapter, runtime, random, usedSignatures);
        levels.forEach(level => {
            output[levelId] = toOutputLevel(level, chapter);
            reportRows.push({
                id: levelId,
                group: chapter.group,
                range: chapter.range,
                pieceSet: chapter.pieceSet,
                bones: chapter.bones,
                trees: chapter.trees,
                flowers: chapter.flowers,
                mud: chapter.mud,
                holes: chapter.holes,
                fences: chapter.fences,
                connected: chapter.requireConnectedPaths ? 'Yes' : 'No',
                score: level.analysis.score,
                nodes: level.analysis.nodes,
                branchSum: level.analysis.branchSum
            });
            levelId++;
        });
    });

    const projectRoot = path.resolve(__dirname, '..');
    const levelsPath = path.join(projectRoot, 'levels.js');
    const reportPath = path.join(projectRoot, 'production', 'discussions', 'level-difficulty-scorecard.md');

    fs.writeFileSync(levelsPath, `const GAME_LEVELS = ${JSON.stringify(output, null, 2)};\n`, 'utf8');

    const report = [
        '# Level Difficulty Scorecard',
        '',
        '**Date**: 2026-05-14',
        '',
        '## Current Difficulty Model',
        '',
        'Levels are generated from verified full-board or partial-board piece tilings. Dogs are placed on solution house cells, bones and mud on solution path cells, trees/flowers/fences on open cells, and holes on verified piece cutouts. A level is accepted only when the solver confirms exactly one valid solution.',
        '',
        'The chapter curve follows the requested 1-160 structure. Each chapter adds one readable rule family before the next chapter changes the puzzle grammar.',
        '',
        '## Chapter Rules',
        '',
        '| Chapter | Level Range | Count | Piece Set | Bones | Trees | Flowers | Mud | Holes | Fences | Connected Paths | Intent |',
        '|---|---|---:|---|---:|---:|---:|---:|---:|---:|---|---|',
        ...CHAPTERS.map(chapter => `| ${chapter.group} | ${chapter.range} | ${chapter.count} | ${chapter.pieceSet} | ${chapter.bones} | ${chapter.trees} | ${chapter.flowers} | ${chapter.mud} | ${chapter.holes} | ${chapter.fences} | ${chapter.requireConnectedPaths ? 'Yes' : 'No'} | ${chapter.intent} |`),
        '| 每日挑戰 | 無限 | - | rotating verified pool | - | - | - | - | - | - | - | Deterministic daily selection from the verified unique-solution level pool. |',
        '',
        '## Generated Levels',
        '',
        '| Level | Chapter | Piece Set | Bones | Trees | Flowers | Mud | Holes | Fences | Connected | Difficulty Score | Solver Nodes | Branch Sum |',
        '|---:|---|---|---:|---:|---:|---:|---:|---:|---|---:|---:|---:|',
        ...reportRows.map(row => `| ${row.id} | ${row.group} | ${row.pieceSet} | ${row.bones} | ${row.trees} | ${row.flowers} | ${row.mud} | ${row.holes} | ${row.fences} | ${row.connected} | ${row.score} | ${row.nodes} | ${row.branchSum} |`),
        '',
        '## Follow-Up Suggestions',
        '',
        '- Replace the daily rotating pool with a client-side seeded generator only after performance testing on mobile devices.',
        '- Add failure-aware hints: first hint unlocks after repeated failed placements, deeper hints after continued struggle.',
        '- Add chapter clear medals for no-hint clears, low-move clears, and daily challenge streaks.'
    ].join('\n');

    fs.writeFileSync(reportPath, `${report}\n`, 'utf8');

    console.log(`Wrote ${Object.keys(output).length} levels to ${levelsPath}`);
    console.log(`Wrote difficulty report to ${reportPath}`);
}

main();
