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
function flip(shape) {
    return shape.map(row => [...row].reverse());
}
function getOrientations(shape) {
    const set = new Set();
    const res = [];
    let current = shape;
    for (let f=0; f<2; f++) {
        for (let r=0; r<4; r++) {
            const str = JSON.stringify(current);
            if (!set.has(str)) {
                set.add(str);
                res.push(current);
            }
            current = rotate(current);
        }
        current = flip(shape);
    }
    return res;
}

const pieceOris = pieces.map(p => getOrientations(p.shape));

let validPlacements = [];
const board = Array(5).fill().map(() => Array(5).fill(0));

function solve(pieceIdx) {
    if (pieceIdx === 4) {
        const houses = [];
        const paths = [];
        const empties = [];
        for(let r=0; r<5; r++) {
            for(let c=0; c<5; c++) {
                if (board[r][c] === 2) houses.push(r+','+c);
                else if (board[r][c] === 1) paths.push(r+','+c);
                else empties.push(r+','+c);
            }
        }
        validPlacements.push({
            dogs: houses.sort().join(';'),
            paths: paths,
            empties: empties
        });
        return;
    }
    
    const oris = pieceOris[pieceIdx];
    for (const ori of oris) {
        const rows = ori.length;
        const cols = ori[0].length;
        for (let r=0; r<=5-rows; r++) {
            for (let c=0; c<=5-cols; c++) {
                let valid = true;
                for (let pr=0; pr<rows; pr++) {
                    for (let pc=0; pc<cols; pc++) {
                        if (ori[pr][pc] !== 0 && board[r+pr][c+pc] !== 0) {
                            valid = false; break;
                        }
                    }
                    if (!valid) break;
                }
                if (valid) {
                    for (let pr=0; pr<rows; pr++) {
                        for (let pc=0; pc<cols; pc++) {
                            if (ori[pr][pc] !== 0) board[r+pr][c+pc] = ori[pr][pc];
                        }
                    }
                    solve(pieceIdx + 1);
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

console.log('Generating placements...');
solve(0);
console.log('Total valid placements:', validPlacements.length);

const levelCounts = {};

// We define a level by: Dogs + 1 Bone + 1 Tree
console.log('Hashing levels...');
let count = 0;
for (const p of validPlacements) {
    // Randomly pick 1 path as bone and 1 empty as tree to limit combinations
    // Actually, let's just generate all for a subset, or use a pseudo-random pick for finding just a few.
    // If we use all combinations, it's 12.7 million strings. It might take 5-10 seconds in Node.js.
    for (const path of p.paths) {
        for (const empty of p.empties) {
            const levelHash = p.dogs + '|' + path + '|' + empty;
            levelCounts[levelHash] = (levelCounts[levelHash] || 0) + 1;
        }
    }
    count++;
    if (count % 20000 === 0) console.log(count + '/' + validPlacements.length);
}

console.log('Finding unique levels...');
const uniqueLevels = [];
for (const hash in levelCounts) {
    if (levelCounts[hash] === 1) {
        uniqueLevels.push(hash);
        if (uniqueLevels.length >= 10) break; // Only need a few
    }
}

uniqueLevels.forEach((hash, i) => {
    const parts = hash.split('|');
    const dogsStr = parts[0];
    const boneStr = parts[1];
    const treeStr = parts[2];
    console.log(`Level ${i+3} (Advanced):`);
    console.log(`Dogs: ${dogsStr}`);
    console.log(`Bone: ${boneStr}`);
    console.log(`Tree: ${treeStr}`);
    console.log('---');
});
