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

function solve(pieceIdx) {
    if (pieceIdx === 4) {
        const houses = [];
        const paths = [];
        const empties = [];
        for(let r=0; r<5; r++) {
            for(let c=0; c<5; c++) {
                if (board[r][c] === 2) houses.push(`${r},${c}`);
                else if (board[r][c] === 1) paths.push(`${r},${c}`);
                else empties.push(`${r},${c}`);
            }
        }
        // Save the sequence of placements as the solution string to detect truly unique solutions
        validPlacements.push({ dogs: houses, paths: paths, empties: empties });
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

solve(0);
console.log('Total valid placements:', validPlacements.length);

// Bucket generator
function getCombinations(arr, k) {
    if (k === 0) return [[]];
    if (arr.length === 0) return [];
    const [first, ...rest] = arr;
    const withFirst = getCombinations(rest, k - 1).map(c => [first, ...c]);
    const withoutFirst = getCombinations(rest, k);
    return [...withFirst, ...withoutFirst];
}

function countUnique(b, t) {
    const counts = {};
    const MAX_SAMPLES = 5000; 
    for (let i = 0; i < Math.min(validPlacements.length, MAX_SAMPLES); i++) {
        const p = validPlacements[i];
        const dogStr = p.dogs.join(';');
        const boneCombs = getCombinations(p.paths, b);
        const treeCombs = getCombinations(p.empties, t);
        
        for (const bc of boneCombs) {
            for (const tc of treeCombs) {
                const hash = dogStr + '|' + bc.join(';') + '|' + tc.join(';');
                counts[hash] = (counts[hash] || 0) + 1;
            }
        }
    }
    let unique = 0;
    for (const k in counts) if (counts[k] === 1) unique++;
    return unique;
}

console.log('Unique 0B 0T:', countUnique(0, 0));
console.log('Unique 1B 0T:', countUnique(1, 0));
console.log('Unique 0B 1T:', countUnique(0, 1));
console.log('Unique 1B 1T:', countUnique(1, 1));
