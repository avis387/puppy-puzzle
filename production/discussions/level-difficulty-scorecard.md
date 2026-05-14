# Level Difficulty Scorecard

**Date**: 2026-05-14

## Purpose

This document records the first tuning pass for the 44 existing Puppy Hide and Seek levels. The goal is to keep `levels.js` as the source of raw level data while letting the game use a separate play order in `game.js`.

## Scoring Inputs

- **Group weight**: `休閒 < 困難 < 高手 < 燒腦 < 地獄`
- **Rule load**: bones and trees add constraints the player must reason about.
- **Branch count**: lower legal placement count usually means fewer exploratory options.
- **Solver nodes**: higher search count suggests more interdependency between pieces.
- **Solution count**: all 44 levels currently have exactly one solution.

## Recommended Play Order

`3, 4, 2, 1, 7, 6, 11, 12, 10, 14, 13, 5, 9, 8, 16, 23, 17, 18, 20, 21, 15, 19, 24, 22, 30, 26, 28, 29, 34, 31, 25, 32, 33, 27, 35, 36, 40, 41, 43, 37, 42, 38, 39, 44`

## Score Table

| Original Level | Group | Bones | Trees | Branch Count | Solver Nodes | Solutions | Score |
|---:|---|---:|---:|---:|---:|---:|---:|
| 1 | 休閒 | 0 | 0 | 155 | 14266 | 1 | 1049 |
| 2 | 休閒 | 0 | 0 | 143 | 11425 | 1 | 1039 |
| 3 | 休閒 | 0 | 0 | 131 | 9229 | 1 | 1030 |
| 4 | 休閒 | 0 | 0 | 127 | 10831 | 1 | 1037 |
| 5 | 困難 | 1 | 0 | 133 | 10228 | 1 | 2154 |
| 6 | 困難 | 1 | 0 | 117 | 7565 | 1 | 2144 |
| 7 | 困難 | 1 | 0 | 99 | 5408 | 1 | 2137 |
| 8 | 困難 | 1 | 0 | 126 | 12618 | 1 | 2164 |
| 9 | 困難 | 1 | 0 | 123 | 12326 | 1 | 2163 |
| 10 | 困難 | 1 | 0 | 131 | 8485 | 1 | 2147 |
| 11 | 困難 | 1 | 0 | 120 | 7387 | 1 | 2144 |
| 12 | 困難 | 1 | 0 | 130 | 8291 | 1 | 2146 |
| 13 | 困難 | 1 | 0 | 126 | 8849 | 1 | 2149 |
| 14 | 困難 | 1 | 0 | 134 | 8665 | 1 | 2148 |
| 15 | 高手 | 0 | 1 | 122 | 5323 | 1 | 3135 |
| 16 | 高手 | 0 | 1 | 82 | 2580 | 1 | 3126 |
| 17 | 高手 | 0 | 1 | 96 | 4128 | 1 | 3132 |
| 18 | 高手 | 0 | 1 | 110 | 4442 | 1 | 3132 |
| 19 | 高手 | 0 | 1 | 124 | 6208 | 1 | 3139 |
| 20 | 高手 | 0 | 1 | 115 | 4423 | 1 | 3132 |
| 21 | 高手 | 0 | 1 | 115 | 4523 | 1 | 3132 |
| 22 | 高手 | 0 | 1 | 131 | 6806 | 1 | 3140 |
| 23 | 高手 | 0 | 1 | 111 | 3617 | 1 | 3128 |
| 24 | 高手 | 0 | 1 | 118 | 6287 | 1 | 3139 |
| 25 | 燒腦 | 1 | 1 | 120 | 5159 | 1 | 4255 |
| 26 | 燒腦 | 1 | 1 | 111 | 3664 | 1 | 4249 |
| 27 | 燒腦 | 1 | 1 | 124 | 5400 | 1 | 4256 |
| 28 | 燒腦 | 1 | 1 | 104 | 3405 | 1 | 4249 |
| 29 | 燒腦 | 1 | 1 | 106 | 3489 | 1 | 4249 |
| 30 | 燒腦 | 1 | 1 | 98 | 2584 | 1 | 4245 |
| 31 | 燒腦 | 1 | 1 | 118 | 4539 | 1 | 4252 |
| 32 | 燒腦 | 1 | 1 | 122 | 5323 | 1 | 4255 |
| 33 | 燒腦 | 1 | 1 | 122 | 5323 | 1 | 4255 |
| 34 | 燒腦 | 1 | 1 | 117 | 4222 | 1 | 4251 |
| 35 | 地獄 | 2 | 1 | 102 | 3150 | 1 | 5368 |
| 36 | 地獄 | 2 | 1 | 101 | 3435 | 1 | 5369 |
| 37 | 地獄 | 2 | 1 | 116 | 4461 | 1 | 5372 |
| 38 | 地獄 | 2 | 1 | 120 | 5159 | 1 | 5375 |
| 39 | 地獄 | 2 | 1 | 120 | 5159 | 1 | 5375 |
| 40 | 地獄 | 2 | 1 | 115 | 3856 | 1 | 5369 |
| 41 | 地獄 | 2 | 1 | 113 | 4206 | 1 | 5371 |
| 42 | 地獄 | 2 | 1 | 111 | 4685 | 1 | 5373 |
| 43 | 地獄 | 2 | 1 | 113 | 4164 | 1 | 5371 |
| 44 | 地獄 | 2 | 1 | 120 | 5159 | 1 | 5375 |

## Follow-Up Tuning Questions

- Should lower branch count always be easier, or should we weight it as harder because each mistake is more punishing?
- Should the final 10 levels prioritize dense constraints, longer deduction chains, or a mix of both?
- Do we want the player-facing level numbers to hide original IDs permanently, or expose original IDs only in debug builds?
