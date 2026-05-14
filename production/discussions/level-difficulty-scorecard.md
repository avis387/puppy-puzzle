# Level Difficulty Scorecard

**Date**: 2026-05-14

## Current Difficulty Model

Levels are generated from verified full-board piece tilings. Dogs are placed on solution house cells, bones and mud on solution path cells, and trees and flowers on solution empty cells. A level is accepted only when the solver confirms exactly one valid solution.

The upgraded generator ranks candidates by solver search cost, legal placement branch count, dog spread, object pressure, and chapter-specific piece grammar. Later chapters change how pieces read before simply adding more objects.

## Chapter Rules

| Chapter | Count | Piece Set | Bones | Trees | Flowers | Mud | Intent |
|---|---:|---|---:|---:|---:|---:|---|
| 草地篇 | 10 | classic | 1 | 1 | 0 | 0 | Teach the base dog, bone, and tree grammar. |
| 花園篇 | 10 | classic | 2 | 1 | 1 | 0 | Introduce flower cells that reject path coverage. |
| 雨後篇 | 10 | classic | 2 | 2 | 1 | 1 | Introduce mud cells that reject house coverage. |
| 花園巧拼篇 | 12 | garden | 3 | 2 | 1 | 1 | Switch to a new piece grammar while keeping familiar objects. |
| 密林篇 | 12 | garden | 3 | 3 | 2 | 1 | Increase blocked cells and anti-path reads. |
| 專家篇 | 16 | expert | 4 | 3 | 2 | 2 | Use the hardest piece set with dense mixed constraints. |

## Generated Levels

| Level | Chapter | Piece Set | Bones | Trees | Flowers | Mud | Difficulty Score | Solver Nodes | Branch Sum |
|---:|---|---|---:|---:|---:|---:|---:|---:|---:|
| 1 | 草地篇 | classic | 1 | 1 | 0 | 0 | 36125 | 7581 | 141 |
| 2 | 草地篇 | classic | 1 | 1 | 0 | 0 | 36249 | 7533 | 143 |
| 3 | 草地篇 | classic | 1 | 1 | 0 | 0 | 37015 | 8210 | 144 |
| 4 | 草地篇 | classic | 1 | 1 | 0 | 0 | 37118 | 8410 | 143 |
| 5 | 草地篇 | classic | 1 | 1 | 0 | 0 | 37602 | 8915 | 149 |
| 6 | 草地篇 | classic | 1 | 1 | 0 | 0 | 37936 | 8809 | 148 |
| 7 | 草地篇 | classic | 1 | 1 | 0 | 0 | 38141 | 8265 | 151 |
| 8 | 草地篇 | classic | 1 | 1 | 0 | 0 | 38941 | 9630 | 150 |
| 9 | 草地篇 | classic | 1 | 1 | 0 | 0 | 39416 | 8196 | 161 |
| 10 | 草地篇 | classic | 1 | 1 | 0 | 0 | 41890 | 10114 | 168 |
| 11 | 花園篇 | classic | 2 | 1 | 1 | 0 | 33804 | 4062 | 129 |
| 12 | 花園篇 | classic | 2 | 1 | 1 | 0 | 34095 | 5218 | 137 |
| 13 | 花園篇 | classic | 2 | 1 | 1 | 0 | 34531 | 4965 | 145 |
| 14 | 花園篇 | classic | 2 | 1 | 1 | 0 | 34554 | 5224 | 136 |
| 15 | 花園篇 | classic | 2 | 1 | 1 | 0 | 34636 | 5184 | 132 |
| 16 | 花園篇 | classic | 2 | 1 | 1 | 0 | 35070 | 5924 | 122 |
| 17 | 花園篇 | classic | 2 | 1 | 1 | 0 | 35087 | 5017 | 133 |
| 18 | 花園篇 | classic | 2 | 1 | 1 | 0 | 35467 | 5544 | 131 |
| 19 | 花園篇 | classic | 2 | 1 | 1 | 0 | 35898 | 5388 | 138 |
| 20 | 花園篇 | classic | 2 | 1 | 1 | 0 | 37069 | 6002 | 151 |
| 21 | 雨後篇 | classic | 2 | 2 | 1 | 1 | 30559 | 1702 | 121 |
| 22 | 雨後篇 | classic | 2 | 2 | 1 | 1 | 30612 | 1961 | 113 |
| 23 | 雨後篇 | classic | 2 | 2 | 1 | 1 | 30655 | 2285 | 115 |
| 24 | 雨後篇 | classic | 2 | 2 | 1 | 1 | 31000 | 2589 | 104 |
| 25 | 雨後篇 | classic | 2 | 2 | 1 | 1 | 31087 | 2270 | 115 |
| 26 | 雨後篇 | classic | 2 | 2 | 1 | 1 | 31134 | 2609 | 111 |
| 27 | 雨後篇 | classic | 2 | 2 | 1 | 1 | 31169 | 2896 | 114 |
| 28 | 雨後篇 | classic | 2 | 2 | 1 | 1 | 31378 | 1999 | 121 |
| 29 | 雨後篇 | classic | 2 | 2 | 1 | 1 | 31568 | 2596 | 116 |
| 30 | 雨後篇 | classic | 2 | 2 | 1 | 1 | 32422 | 2572 | 115 |
| 31 | 花園巧拼篇 | garden | 3 | 2 | 1 | 1 | 30704 | 1098 | 111 |
| 32 | 花園巧拼篇 | garden | 3 | 2 | 1 | 1 | 30724 | 1318 | 109 |
| 33 | 花園巧拼篇 | garden | 3 | 2 | 1 | 1 | 31013 | 1098 | 115 |
| 34 | 花園巧拼篇 | garden | 3 | 2 | 1 | 1 | 31123 | 1707 | 115 |
| 35 | 花園巧拼篇 | garden | 3 | 2 | 1 | 1 | 31187 | 2200 | 127 |
| 36 | 花園巧拼篇 | garden | 3 | 2 | 1 | 1 | 31333 | 2183 | 112 |
| 37 | 花園巧拼篇 | garden | 3 | 2 | 1 | 1 | 31472 | 1709 | 113 |
| 38 | 花園巧拼篇 | garden | 3 | 2 | 1 | 1 | 31752 | 1606 | 118 |
| 39 | 花園巧拼篇 | garden | 3 | 2 | 1 | 1 | 32140 | 1801 | 120 |
| 40 | 花園巧拼篇 | garden | 3 | 2 | 1 | 1 | 32420 | 2113 | 114 |
| 41 | 花園巧拼篇 | garden | 3 | 2 | 1 | 1 | 33397 | 2139 | 130 |
| 42 | 花園巧拼篇 | garden | 3 | 2 | 1 | 1 | 33529 | 2462 | 122 |
| 43 | 密林篇 | garden | 3 | 3 | 2 | 1 | 28617 | 509 | 82 |
| 44 | 密林篇 | garden | 3 | 3 | 2 | 1 | 28686 | 511 | 81 |
| 45 | 密林篇 | garden | 3 | 3 | 2 | 1 | 28738 | 585 | 86 |
| 46 | 密林篇 | garden | 3 | 3 | 2 | 1 | 28810 | 626 | 82 |
| 47 | 密林篇 | garden | 3 | 3 | 2 | 1 | 28826 | 392 | 85 |
| 48 | 密林篇 | garden | 3 | 3 | 2 | 1 | 28909 | 478 | 95 |
| 49 | 密林篇 | garden | 3 | 3 | 2 | 1 | 28926 | 400 | 86 |
| 50 | 密林篇 | garden | 3 | 3 | 2 | 1 | 29081 | 422 | 87 |
| 51 | 密林篇 | garden | 3 | 3 | 2 | 1 | 29219 | 604 | 87 |
| 52 | 密林篇 | garden | 3 | 3 | 2 | 1 | 29219 | 538 | 87 |
| 53 | 密林篇 | garden | 3 | 3 | 2 | 1 | 29421 | 636 | 93 |
| 54 | 密林篇 | garden | 3 | 3 | 2 | 1 | 29459 | 578 | 84 |
| 55 | 專家篇 | expert | 4 | 3 | 2 | 2 | 29378 | 450 | 78 |
| 56 | 專家篇 | expert | 4 | 3 | 2 | 2 | 29396 | 259 | 79 |
| 57 | 專家篇 | expert | 4 | 3 | 2 | 2 | 29484 | 420 | 78 |
| 58 | 專家篇 | expert | 4 | 3 | 2 | 2 | 29507 | 274 | 70 |
| 59 | 專家篇 | expert | 4 | 3 | 2 | 2 | 29514 | 555 | 83 |
| 60 | 專家篇 | expert | 4 | 3 | 2 | 2 | 29569 | 396 | 79 |
| 61 | 專家篇 | expert | 4 | 3 | 2 | 2 | 29608 | 479 | 84 |
| 62 | 專家篇 | expert | 4 | 3 | 2 | 2 | 29643 | 355 | 76 |
| 63 | 專家篇 | expert | 4 | 3 | 2 | 2 | 29722 | 572 | 90 |
| 64 | 專家篇 | expert | 4 | 3 | 2 | 2 | 29794 | 394 | 76 |
| 65 | 專家篇 | expert | 4 | 3 | 2 | 2 | 30026 | 416 | 79 |
| 66 | 專家篇 | expert | 4 | 3 | 2 | 2 | 30351 | 568 | 86 |
| 67 | 專家篇 | expert | 4 | 3 | 2 | 2 | 30698 | 736 | 87 |
| 68 | 專家篇 | expert | 4 | 3 | 2 | 2 | 30771 | 464 | 80 |
| 69 | 專家篇 | expert | 4 | 3 | 2 | 2 | 30875 | 736 | 95 |
| 70 | 專家篇 | expert | 4 | 3 | 2 | 2 | 32063 | 682 | 98 |

## Follow-Up Suggestions

- Add failure-aware hints: first hint unlocks after repeated failed placements, deeper hints after continued struggle.
- Add optional challenge badges for no-hint clears, low-move clears, and daily challenge clears.
- Add a later expert pack with five pieces or hole pieces once the chapter model is stable.
