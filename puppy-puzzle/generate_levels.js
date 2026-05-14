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
    garden: [
        { id: 'A', shape: [[2, 1, 1], [0, 1, 0]] },
        { id: 'B', shape: [[1, 2, 0], [0, 1, 1]] },
        { id: 'C', shape: [[1, 0], [1, 2], [1, 0]] },
        { id: 'D', shape: [[2, 1], [1, 2]] }
    ],
    expert: [
        { id: 'A', shape: [[2, 1, 0], [0, 1, 1]] },
        { id: 'B', shape: [[1, 2], [1, 0], [1, 0]] },
        { id: 'C', shape: [[1, 1, 1], [0, 2, 0]] },
        { id: 'D', shape: [[2, 1], [1, 2]] }
    ]
};

const TYPES = {
    BONE: 6,
    TREE: 7,
    FLOWER: 8,
    MUD: 9
};

const CHAPTERS = [
    { group: '草地篇', count: 10, pieceSet: 'classic', bones: 1, trees: 1, flowers: 0, mud: 0, minScore: 16000, rank: 1, intent: 'Teach the base dog, bone, and tree grammar.' },
    { group: '花園篇', count: 10, pieceSet: 'classic', bones: 2, trees: 1, flowers: 1, mud: 0, minScore: 19000, rank: 2, intent: 'Introduce flower cells that reject path coverage.' },
    { group: '雨後篇', count: 10, pieceSet: 'classic', bones: 2, trees: 2, flowers: 1, mud: 1, minScore: 21000, rank: 3, intent: 'Introduce mud cells that reject house coverage.' },
    { group: '花園巧拼篇', count: 12, pieceSet: 'garden', bones: 3, trees: 2, flowers: 1, mud: 1, minScore: 23000, rank: 4, intent: 'Switch to a new piece grammar while keeping familiar objects.' },
    { group: '密林篇', count: 12, pieceSet: 'garden', bones: 3, trees: 3, flowers: 2, mud: 1, minScore: 25000, rank: 5, intent: 'Increase blocked cells and anti-path reads.' },
    { group: '專家篇', count: 16, pieceSet: 'expert', bones: 4, trees: 3, flowers: 2, mud: 2, minScore: 27000, rank: 6, intent: 'Use the hardest piece set with dense mixed constraints.' }
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
        tilings: []
    };

    enumerateTilings(runtime, 0, []);
    return runtime;
}

function enumerateTilings(runtime, pieceIndex, currentPlacements) {
    if (pieceIndex === runtime.pieces.length) {
        const houses = [];
        const paths = [];
        const empties = [];

        for (let r = 0; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
                const value = runtime.placementBoard[r][c];
                if (value === 2) houses.push({ r, c });
                else if (value === 1) paths.push({ r, c });
                else empties.push({ r, c });
            }
        }

        runtime.tilings.push({
            dogs: houses,
            paths,
            empties,
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
    return grid;
}

function getPieceCells(shape, r, c) {
    const cells = [];
    for (let pr = 0; pr < shape.length; pr++) {
        for (let pc = 0; pc < shape[0].length; pc++) {
            if (shape[pr][pc] !== 0) cells.push({ r: r + pr, c: c + pc, value: shape[pr][pc] });
        }
    }
    return cells;
}

function isSoloPlacementValid(grid, shape, r, c) {
    for (const cell of getPieceCells(shape, r, c)) {
        if (cell.r < 0 || cell.r >= BOARD_SIZE || cell.c < 0 || cell.c >= BOARD_SIZE) return false;

        const boardValue = grid[cell.r][cell.c];
        if (boardValue >= 1 && boardValue <= 5 && cell.value === 1) return false;
        if (boardValue === TYPES.BONE && cell.value === 2) return false;
        if (boardValue === TYPES.TREE) return false;
        if (boardValue === TYPES.FLOWER && cell.value === 1) return false;
        if (boardValue === TYPES.MUD && cell.value === 2) return false;
    }

    return true;
}

function analyzeLevel(level, runtime) {
    const grid = buildGrid(level);
    const dogTotal = level.dogs.length;
    const boneTotal = level.bones.length;

    const candidates = runtime.pieces.map((piece, pieceIndex) => {
        const placements = [];
        for (const orientation of runtime.pieceOrientations[pieceIndex]) {
            for (let r = 0; r <= BOARD_SIZE - orientation.length; r++) {
                for (let c = 0; c <= BOARD_SIZE - orientation[0].length; c++) {
                    if (!isSoloPlacementValid(grid, orientation, r, c)) continue;
                    placements.push({
                        r,
                        c,
                        shape: orientation,
                        cells: getPieceCells(orientation, r, c)
                    });
                }
            }
        }
        return placements;
    });

    let solutionCount = 0;
    let nodes = 0;
    const occupied = new Set();

    function search(pieceIndex, coveredDogs, coveredBones) {
        nodes++;
        if (solutionCount > 1) return;

        if (pieceIndex === runtime.pieces.length) {
            if (coveredDogs.size === dogTotal && coveredBones.size === boneTotal) solutionCount++;
            return;
        }

        for (const candidate of candidates[pieceIndex]) {
            let overlaps = false;
            for (const cell of candidate.cells) {
                if (occupied.has(cellKey(cell))) {
                    overlaps = true;
                    break;
                }
            }
            if (overlaps) continue;

            const nextDogs = new Set(coveredDogs);
            const nextBones = new Set(coveredBones);

            candidate.cells.forEach(cell => {
                const boardValue = grid[cell.r][cell.c];
                if (cell.value === 2 && boardValue >= 1 && boardValue <= 5) nextDogs.add(cellKey(cell));
                if (cell.value === 1 && boardValue === TYPES.BONE) nextBones.add(cellKey(cell));
            });

            candidate.cells.forEach(cell => occupied.add(cellKey(cell)));
            search(pieceIndex + 1, nextDogs, nextBones);
            candidate.cells.forEach(cell => occupied.delete(cellKey(cell)));
        }
    }

    search(0, new Set(), new Set());

    const branchSum = candidates.reduce((sum, candidateList) => sum + candidateList.length, 0);
    const branchProduct = candidates.reduce((product, candidateList) => product * Math.max(candidateList.length, 1), 1);
    const objectPressure = (level.bones.length * 650) + (level.trees.length * 750) + (level.flowers.length * 550) + (level.mud.length * 600);
    const score = nodes + branchSum * 70 + Math.log10(branchProduct) * 1200 + cellSpread(level.dogs) * 250 + objectPressure;

    return {
        branchSum,
        branchProduct,
        nodes,
        score: Math.round(score),
        solutions: solutionCount
    };
}

function levelSignature(level) {
    const dogs = level.dogs.map(cellKey).sort().join(';');
    const bones = level.bones.map(cellKey).sort().join(';');
    const trees = level.trees.map(cellKey).sort().join(';');
    const flowers = level.flowers.map(cellKey).sort().join(';');
    const mud = level.mud.map(cellKey).sort().join(';');
    return `${level.pieceSet}|D:${dogs}|B:${bones}|T:${trees}|F:${flowers}|M:${mud}`;
}

function makeLevelFromTiling(tiling, chapter, random) {
    const shuffledPaths = shuffle(tiling.paths, random);
    const shuffledEmpties = shuffle(tiling.empties, random);
    const bones = takeCells(shuffledPaths, chapter.bones);
    if (!bones) return null;

    const mud = takeCells(shuffledPaths.slice(chapter.bones), chapter.mud);
    if (!mud) return null;

    const trees = takeCells(shuffledEmpties, chapter.trees);
    if (!trees) return null;

    const flowers = takeCells(shuffledEmpties.slice(chapter.trees), chapter.flowers);
    if (!flowers) return null;

    return {
        pieceSet: chapter.pieceSet,
        dogs: tiling.dogs,
        bones,
        trees,
        flowers,
        mud,
        solution: tiling.solution
    };
}

function pickLevelsForChapter(chapter, runtime, random, usedSignatures) {
    const candidates = [];
    const shuffledTilings = shuffle(runtime.tilings, random);
    const maxAttempts = Math.min(shuffledTilings.length, 4200);

    for (let i = 0; i < maxAttempts; i++) {
        const tiling = shuffledTilings[i];

        for (let variant = 0; variant < 3; variant++) {
            const level = makeLevelFromTiling(tiling, chapter, random);
            if (!level) continue;

            const signature = levelSignature(level);
            if (usedSignatures.has(signature)) continue;

            const analysis = analyzeLevel(level, runtime);
            if (analysis.solutions !== 1) continue;

            candidates.push({ ...level, analysis, signature });
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

    return {
        group: chapter.group,
        chapter: chapter.group,
        pieceSet: chapter.pieceSet,
        difficultyRank: chapter.rank,
        difficultyScore: level.analysis.score,
        solverNodes: level.analysis.nodes,
        branchSum: level.analysis.branchSum,
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
                pieceSet: chapter.pieceSet,
                bones: chapter.bones,
                trees: chapter.trees,
                flowers: chapter.flowers,
                mud: chapter.mud,
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
        'Levels are generated from verified full-board piece tilings. Dogs are placed on solution house cells, bones and mud on solution path cells, and trees and flowers on solution empty cells. A level is accepted only when the solver confirms exactly one valid solution.',
        '',
        'The upgraded generator ranks candidates by solver search cost, legal placement branch count, dog spread, object pressure, and chapter-specific piece grammar. Later chapters change how pieces read before simply adding more objects.',
        '',
        '## Chapter Rules',
        '',
        '| Chapter | Count | Piece Set | Bones | Trees | Flowers | Mud | Intent |',
        '|---|---:|---|---:|---:|---:|---:|---|',
        ...CHAPTERS.map(chapter => `| ${chapter.group} | ${chapter.count} | ${chapter.pieceSet} | ${chapter.bones} | ${chapter.trees} | ${chapter.flowers} | ${chapter.mud} | ${chapter.intent} |`),
        '',
        '## Generated Levels',
        '',
        '| Level | Chapter | Piece Set | Bones | Trees | Flowers | Mud | Difficulty Score | Solver Nodes | Branch Sum |',
        '|---:|---|---|---:|---:|---:|---:|---:|---:|---:|',
        ...reportRows.map(row => `| ${row.id} | ${row.group} | ${row.pieceSet} | ${row.bones} | ${row.trees} | ${row.flowers} | ${row.mud} | ${row.score} | ${row.nodes} | ${row.branchSum} |`),
        '',
        '## Follow-Up Suggestions',
        '',
        '- Add failure-aware hints: first hint unlocks after repeated failed placements, deeper hints after continued struggle.',
        '- Add optional challenge badges for no-hint clears, low-move clears, and daily challenge clears.',
        '- Add a later expert pack with five pieces or hole pieces once the chapter model is stable.'
    ].join('\n');

    fs.writeFileSync(reportPath, `${report}\n`, 'utf8');

    console.log(`Wrote ${Object.keys(output).length} levels to ${levelsPath}`);
    console.log(`Wrote difficulty report to ${reportPath}`);
}

main();
