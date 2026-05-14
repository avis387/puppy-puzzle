const fs = require('fs');
const path = require('path');

const BOARD_SIZE = 5;
const PIECES = [
    { id: 'A', shape: [[2, 1, 1], [1, 0, 0]] },
    { id: 'B', shape: [[1, 2, 1], [0, 1, 0]] },
    { id: 'C', shape: [[1, 1, 0], [0, 2, 1]] },
    { id: 'D', shape: [[2, 1], [1, 2]] }
];

const TYPES = {
    BONE: 6,
    TREE: 7
};

const TIERS = [
    { group: '入門', count: 8, bones: 1, trees: 1, minScore: 12000 },
    { group: '進階', count: 10, bones: 2, trees: 1, minScore: 15000 },
    { group: '困難', count: 10, bones: 2, trees: 2, minScore: 17000 },
    { group: '高手', count: 10, bones: 3, trees: 2, minScore: 19000 },
    { group: '燒腦', count: 12, bones: 3, trees: 3, minScore: 21000 },
    { group: '地獄', count: 10, bones: 4, trees: 3, minScore: 23000 }
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

function sampleCombination(items, count, random) {
    return shuffle(items, random).slice(0, count);
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

const pieceOrientations = PIECES.map(piece => getOrientations(piece.shape));
const placementBoard = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(0));
const tilings = [];

function enumerateTilings(pieceIndex, currentPlacements) {
    if (pieceIndex === PIECES.length) {
        const houses = [];
        const paths = [];
        const empties = [];

        for (let r = 0; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
                const value = placementBoard[r][c];
                if (value === 2) houses.push({ r, c });
                else if (value === 1) paths.push({ r, c });
                else empties.push({ r, c });
            }
        }

        tilings.push({
            dogs: houses,
            paths,
            empties,
            solution: JSON.parse(JSON.stringify(currentPlacements))
        });
        return;
    }

    for (const orientation of pieceOrientations[pieceIndex]) {
        const rows = orientation.length;
        const cols = orientation[0].length;

        for (let r = 0; r <= BOARD_SIZE - rows; r++) {
            for (let c = 0; c <= BOARD_SIZE - cols; c++) {
                let valid = true;

                for (let pr = 0; pr < rows && valid; pr++) {
                    for (let pc = 0; pc < cols; pc++) {
                        if (orientation[pr][pc] !== 0 && placementBoard[r + pr][c + pc] !== 0) {
                            valid = false;
                            break;
                        }
                    }
                }

                if (!valid) continue;

                for (let pr = 0; pr < rows; pr++) {
                    for (let pc = 0; pc < cols; pc++) {
                        if (orientation[pr][pc] !== 0) placementBoard[r + pr][c + pc] = orientation[pr][pc];
                    }
                }

                currentPlacements.push({ r, c, shape: orientation });
                enumerateTilings(pieceIndex + 1, currentPlacements);
                currentPlacements.pop();

                for (let pr = 0; pr < rows; pr++) {
                    for (let pc = 0; pc < cols; pc++) {
                        if (orientation[pr][pc] !== 0) placementBoard[r + pr][c + pc] = 0;
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
    }

    return true;
}

function analyzeLevel(level) {
    const grid = buildGrid(level);
    const dogTotal = level.dogs.length;
    const boneTotal = level.bones.length;

    const candidates = PIECES.map((piece, pieceIndex) => {
        const placements = [];
        for (const orientation of pieceOrientations[pieceIndex]) {
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

        if (pieceIndex === PIECES.length) {
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
    const branchProduct = candidates.reduce((product, candidateList) => product * candidateList.length, 1);
    const score = nodes + branchSum * 70 + Math.log10(branchProduct) * 1200 + cellSpread(level.dogs) * 250;

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
    return `D:${dogs}|B:${bones}|T:${trees}`;
}

function makeLevelFromTiling(tiling, tier, random) {
    return {
        dogs: tiling.dogs,
        bones: sampleCombination(tiling.paths, tier.bones, random),
        trees: sampleCombination(tiling.empties, tier.trees, random),
        solution: tiling.solution
    };
}

function pickLevelsForTier(tier, random, usedSignatures) {
    const candidates = [];
    const shuffledTilings = shuffle(tilings, random);
    const maxAttempts = Math.min(shuffledTilings.length, 2800);

    for (let i = 0; i < maxAttempts; i++) {
        const tiling = shuffledTilings[i];

        for (let variant = 0; variant < 2; variant++) {
            const level = makeLevelFromTiling(tiling, tier, random);
            const signature = levelSignature(level);
            if (usedSignatures.has(signature)) continue;

            const analysis = analyzeLevel(level);
            if (analysis.solutions !== 1) continue;

            candidates.push({ ...level, analysis, signature });
        }
    }

    candidates.sort((a, b) => b.analysis.score - a.analysis.score);

    const selected = [];
    for (const candidate of candidates) {
        if (selected.length >= tier.count) break;
        if (candidate.analysis.score < tier.minScore && selected.length >= Math.ceil(tier.count * 0.7)) continue;

        selected.push(candidate);
        usedSignatures.add(candidate.signature);
    }

    if (selected.length < tier.count) {
        throw new Error(`Not enough levels for ${tier.group}. Needed ${tier.count}, got ${selected.length}.`);
    }

    selected.sort((a, b) => a.analysis.score - b.analysis.score);
    return selected;
}

function toOutputLevel(level, group) {
    const items = [];
    level.dogs.forEach((dog, index) => items.push({ type: index + 1, r: dog.r, c: dog.c }));
    level.bones.forEach(bone => items.push({ type: TYPES.BONE, r: bone.r, c: bone.c }));
    level.trees.forEach(tree => items.push({ type: TYPES.TREE, r: tree.r, c: tree.c }));

    return {
        group,
        difficultyScore: level.analysis.score,
        solverNodes: level.analysis.nodes,
        branchSum: level.analysis.branchSum,
        items,
        solution: level.solution
    };
}

function main() {
    console.log('Enumerating all piece tilings...');
    enumerateTilings(0, []);
    console.log(`Tilings: ${tilings.length}`);

    const random = makePrng(20260514);
    const usedSignatures = new Set();
    const output = {};
    const reportRows = [];
    let levelId = 1;

    TIERS.forEach(tier => {
        console.log(`Selecting ${tier.group} levels...`);
        const levels = pickLevelsForTier(tier, random, usedSignatures);
        levels.forEach(level => {
            output[levelId] = toOutputLevel(level, tier.group);
            reportRows.push({
                id: levelId,
                group: tier.group,
                bones: tier.bones,
                trees: tier.trees,
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
        'Levels are generated from verified full-board piece tilings. Dogs are placed on solution house cells, bones on solution path cells, and trees on solution empty cells. A level is accepted only when the solver confirms exactly one valid solution.',
        '',
        'The upgraded generator also ranks candidates by solver search cost, legal placement branch count, and dog spread. Later tiers use more bones and trees, but they are selected for high ambiguity rather than just higher obstacle count.',
        '',
        '## Tier Rules',
        '',
        '| Tier | Count | Bones | Trees | Intent |',
        '|---|---:|---:|---:|---|',
        '| 入門 | 8 | 1 | 1 | Teach obstacle reading without empty boards. |',
        '| 進階 | 10 | 2 | 1 | Add path obligations and early false starts. |',
        '| 困難 | 10 | 2 | 2 | Mix path obligations with blocked empty cells. |',
        '| 高手 | 10 | 3 | 2 | Require more elimination before committing pieces. |',
        '| 燒腦 | 12 | 3 | 3 | High ambiguity and multiple tempting placements. |',
        '| 地獄 | 10 | 4 | 3 | Dense constraints with unique-solution verification. |',
        '',
        '## Generated Levels',
        '',
        '| Level | Group | Bones | Trees | Difficulty Score | Solver Nodes | Branch Sum |',
        '|---:|---|---:|---:|---:|---:|---:|',
        ...reportRows.map(row => `| ${row.id} | ${row.group} | ${row.bones} | ${row.trees} | ${row.score} | ${row.nodes} | ${row.branchSum} |`),
        '',
        '## Follow-Up Suggestions',
        '',
        '- Add a failure-aware hint system: first hint unlocks after 3 failed placements, deeper hints after 6 and 9.',
        '- Add optional challenge badges for no-hint clears and low-move clears.',
        '- Consider adding a fifth piece or alternate piece set for a true expert pack; this would require a separate GDD/ADR pass because it changes the core puzzle grammar.'
    ].join('\n');

    fs.writeFileSync(reportPath, `${report}\n`, 'utf8');

    console.log(`Wrote ${Object.keys(output).length} levels to ${levelsPath}`);
    console.log(`Wrote difficulty report to ${reportPath}`);
}

main();
