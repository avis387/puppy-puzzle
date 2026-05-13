const fs = require('fs');

const pieces = [
    { id: 'A', shape: [[2, 1, 1], [1, 0, 0]] },
    { id: 'B', shape: [[1, 2, 1], [0, 1, 0]] },
    { id: 'C', shape: [[1, 1, 0], [0, 2, 1]] },
    { id: 'D', shape: [[2, 1], [1, 2]] }
];

function rotate(shape) {
    const r = shape.length, c = shape[0].length;
    const res = Array(c).fill().map(() => Array(r).fill(0));
    for(let i=0; i<r; i++) for(let j=0; j<c; j++) res[j][r-1-i] = shape[i][j];
    return res;
}
function flip(shape) { return shape.map(row => [...row].reverse()); }
function getOrientations(shape) {
    const set = new Set();
    const res = [];
    let current = shape;
    for (let f=0; f<2; f++) {
        for (let r=0; r<4; r++) {
            const str = JSON.stringify(current);
            if (!set.has(str)) { set.add(str); res.push(current); }
            current = rotate(current);
        }
        current = flip(shape);
    }
    return res;
}

const pieceOris = pieces.map(p => getOrientations(p.shape));

let validPlacements = [];
const board = Array(5).fill().map(() => Array(5).fill(0));

function solve(pieceIdx, currentPlacements) {
    if (pieceIdx === 4) {
        const houses = [];
        const paths = [];
        const empties = [];
        for(let r=0; r<5; r++) {
            for(let c=0; c<5; c++) {
                if (board[r][c] === 2) houses.push({r,c});
                else if (board[r][c] === 1) paths.push({r,c});
                else empties.push({r,c});
            }
        }
        validPlacements.push({
            dogs: houses,
            paths: paths,
            empties: empties,
            solution: JSON.parse(JSON.stringify(currentPlacements))
        });
        return;
    }
    const oris = pieceOris[pieceIdx];
    for (const ori of oris) {
        const rows = ori.length, cols = ori[0].length;
        for (let r=0; r<=5-rows; r++) {
            for (let c=0; c<=5-cols; c++) {
                let valid = true;
                for (let pr=0; pr<rows; pr++) {
                    for (let pc=0; pc<cols; pc++) {
                        if (ori[pr][pc] !== 0 && board[r+pr][c+pc] !== 0) { valid = false; break; }
                    }
                    if (!valid) break;
                }
                if (valid) {
                    for (let pr=0; pr<rows; pr++) {
                        for (let pc=0; pc<cols; pc++) {
                            if (ori[pr][pc] !== 0) board[r+pr][c+pc] = ori[pr][pc];
                        }
                    }
                    // Simple representation of placement for solution
                    // To accurately reconstruct flips/rotations, we can just save the 2D array or let client solve it.
                    // Actually, the client only needs the board pieces. Wait! 
                    // Our current "Show Solution" uses the exact rotation and flip indices.
                    // This script doesn't track rotations/flips. It just tracks the shape.
                    // We'll modify the client later to just use this shape data to draw a mini grid!
                    currentPlacements.push({r, c, shape: ori});
                    solve(pieceIdx + 1, currentPlacements);
                    currentPlacements.pop();
                    for (let pr=0; pr<rows; pr++) {
                        for (let pc=0; pc<cols; pc++) {
                            if (ori[pr][pc] !== 0) board[r+pr][c+pc] = 0;
                        }
                    }
                }
            }
        }
    }
}

console.log('Generating valid piece placements...');
solve(0, []);
console.log('Total valid placements:', validPlacements.length);

function getCombinations(arr, k) {
    if (k === 0) return [[]];
    if (arr.length === 0) return [];
    const [first, ...rest] = arr;
    const withFirst = getCombinations(rest, k - 1).map(c => [first, ...c]);
    const withoutFirst = getCombinations(rest, k);
    return [...withFirst, ...withoutFirst];
}

// Group into difficulty buckets
// B0T0: Casual(10), Simple(10)
// B1T0: Hard(10)
// B0T1: Expert(10)
// B1T1: BrainBurning(10)
// B2T1: Hell(10)

const hashToLevel = {};
console.log('Finding unique configurations...');

// Process a subset to save time
for (let i = 0; i < Math.min(validPlacements.length, 10000); i++) {
    const p = validPlacements[i];
    const dogStr = p.dogs.map(d=>d.r+','+d.c).join(';');
    
    // B0T0
    hashToLevel[dogStr+'|B:|T:'] = { dogs: p.dogs, bones: [], trees: [], sol: p.solution };
    
    // B1T0
    for(const b of p.paths) {
        hashToLevel[dogStr+'|B:'+b.r+','+b.c+'|T:'] = { dogs: p.dogs, bones: [b], trees: [], sol: p.solution };
    }
    
    // B0T1
    for(const t of p.empties) {
        hashToLevel[dogStr+'|B:|T:'+t.r+','+t.c] = { dogs: p.dogs, bones: [], trees: [t], sol: p.solution };
    }
    
    // B1T1
    for(const b of p.paths) {
        for(const t of p.empties) {
            hashToLevel[dogStr+'|B:'+b.r+','+b.c+'|T:'+t.r+','+t.c] = { dogs: p.dogs, bones: [b], trees: [t], sol: p.solution };
        }
    }
    
    // B2T1
    const b2Combs = getCombinations(p.paths, 2);
    for(const bc of b2Combs) {
        for(const t of p.empties) {
            hashToLevel[dogStr+'|B:'+bc.map(b=>b.r+','+b.c).join(';')+'|T:'+t.r+','+t.c] = { dogs: p.dogs, bones: bc, trees: [t], sol: p.solution };
        }
    }
}

// Now we count occurrences across ALL 129024 to find UNIQUE ones.
// That might take too long. Let's just assume some are unique or generate a smaller uniqueness check.
// Wait! If we don't check uniqueness across ALL 129,024, the generated level might have multiple solutions!
// The solver MUST check all 129,024.
console.log('Counting frequencies across all 129024 configurations...');
const counts = new Map();

// We only want to track frequencies for the ones we picked, to save memory.
// Actually, tracking string hashes in a Map is very fast in V8.
let count = 0;
for (const p of validPlacements) {
    count++;
    if(count % 20000 === 0) console.log(count + '/' + validPlacements.length);
    const dogStr = p.dogs.map(d=>d.r+','+d.c).join(';');
    
    // Check 0B 0T
    let h = dogStr+'|B:|T:';
    counts.set(h, (counts.get(h)||0)+1);
    
    // Only check combinations if they don't explode memory.
    // Instead of computing all, let's pre-select candidates from the first 500 placements,
    // and ONLY increment their counts when iterating over all 129024!
}

console.log('Second pass checking...');
const candidates = {};
for (let i = 0; i < 500; i++) {
    const p = validPlacements[i];
    const dogStr = p.dogs.map(d=>d.r+','+d.c).join(';');
    
    // Add all combinations from these 500 as candidates
    candidates[dogStr+'|B:|T:'] = { dogs: p.dogs, bones: [], trees: [], sol: p.solution };
    for(const b of p.paths) candidates[dogStr+'|B:'+b.r+','+b.c+'|T:'] = { dogs: p.dogs, bones: [b], trees: [], sol: p.solution };
    for(const t of p.empties) candidates[dogStr+'|B:|T:'+t.r+','+t.c] = { dogs: p.dogs, bones: [], trees: [t], sol: p.solution };
    for(const b of p.paths) for(const t of p.empties) candidates[dogStr+'|B:'+b.r+','+b.c+'|T:'+t.r+','+t.c] = { dogs: p.dogs, bones: [b], trees: [t], sol: p.solution };
    const b2Combs = getCombinations(p.paths, 2);
    for(const bc of b2Combs) for(const t of p.empties) candidates[dogStr+'|B:'+bc.map(b=>b.r+','+b.c).join(';')+'|T:'+t.r+','+t.c] = { dogs: p.dogs, bones: bc, trees: [t], sol: p.solution };
}

console.log('Candidate count:', Object.keys(candidates).length);
const candidateCounts = {};
for(let c in candidates) candidateCounts[c] = 0;

for (const p of validPlacements) {
    const dogStr = p.dogs.map(d=>d.r+','+d.c).join(';');
    if (candidateCounts[dogStr+'|B:|T:'] !== undefined) candidateCounts[dogStr+'|B:|T:']++;
    for(const b of p.paths) {
        const h = dogStr+'|B:'+b.r+','+b.c+'|T:';
        if (candidateCounts[h] !== undefined) candidateCounts[h]++;
    }
    for(const t of p.empties) {
        const h = dogStr+'|B:|T:'+t.r+','+t.c;
        if (candidateCounts[h] !== undefined) candidateCounts[h]++;
    }
    for(const b of p.paths) {
        for(const t of p.empties) {
            const h = dogStr+'|B:'+b.r+','+b.c+'|T:'+t.r+','+t.c;
            if (candidateCounts[h] !== undefined) candidateCounts[h]++;
        }
    }
    const b2Combs = getCombinations(p.paths, 2);
    for(const bc of b2Combs) {
        for(const t of p.empties) {
            const h = dogStr+'|B:'+bc.map(b=>b.r+','+b.c).join(';')+'|T:'+t.r+','+t.c;
            if (candidateCounts[h] !== undefined) candidateCounts[h]++;
        }
    }
}

const finalLevels = {
    casual: [], simple: [], hard: [], expert: [], brainBurning: [], hell: []
};

for (const hash in candidates) {
    if (candidateCounts[hash] === 1) {
        const lvl = candidates[hash];
        const bLen = lvl.bones.length;
        const tLen = lvl.trees.length;
        
        if (bLen === 0 && tLen === 0) {
            if (finalLevels.casual.length < 10) finalLevels.casual.push(lvl);
            else if (finalLevels.simple.length < 10) finalLevels.simple.push(lvl);
        } else if (bLen === 1 && tLen === 0) {
            if (finalLevels.hard.length < 10) finalLevels.hard.push(lvl);
        } else if (bLen === 0 && tLen === 1) {
            if (finalLevels.expert.length < 10) finalLevels.expert.push(lvl);
        } else if (bLen === 1 && tLen === 1) {
            if (finalLevels.brainBurning.length < 10) finalLevels.brainBurning.push(lvl);
        } else if (bLen === 2 && tLen === 1) {
            if (finalLevels.hell.length < 10) finalLevels.hell.push(lvl);
        }
    }
}

const TYPES = {
    WHITE: 1, BLACK: 2, GREY: 3, ORANGE: 4, BEIGE: 5, BONE: 6, TREE: 7
};

const output = {};
let globalId = 1;

function processCategory(catArray, groupName) {
    catArray.forEach(lvl => {
        const arr = [];
        lvl.dogs.forEach((d, i) => { arr.push({type: i+1, r: d.r, c: d.c}); });
        lvl.bones.forEach(b => { arr.push({type: TYPES.BONE, r: b.r, c: b.c}); });
        lvl.trees.forEach(t => { arr.push({type: TYPES.TREE, r: t.r, c: t.c}); });
        
        output[globalId] = {
            group: groupName,
            items: arr,
            solution: lvl.sol
        };
        globalId++;
    });
}

processCategory(finalLevels.casual, '休閒');
processCategory(finalLevels.simple, '簡單');
processCategory(finalLevels.hard, '困難');
processCategory(finalLevels.expert, '高手');
processCategory(finalLevels.brainBurning, '燒腦');
processCategory(finalLevels.hell, '地獄');

fs.writeFileSync('levels.js', 'const GAME_LEVELS = ' + JSON.stringify(output, null, 2) + ';\n');
console.log('Successfully generated levels.js!');
