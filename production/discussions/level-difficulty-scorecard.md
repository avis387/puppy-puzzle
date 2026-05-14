# Level Difficulty Scorecard

**Date**: 2026-05-14

## Current Difficulty Model

Levels are generated from verified full-board piece tilings. Dogs are placed on solution house cells, bones on solution path cells, and trees on solution empty cells. A level is accepted only when the solver confirms exactly one valid solution.

The upgraded generator also ranks candidates by solver search cost, legal placement branch count, and dog spread. Later tiers use more bones and trees, but they are selected for high ambiguity rather than just higher obstacle count.

## Tier Rules

| Tier | Count | Bones | Trees | Intent |
|---|---:|---:|---:|---|
| 入門 | 8 | 1 | 1 | Teach obstacle reading without empty boards. |
| 進階 | 10 | 2 | 1 | Add path obligations and early false starts. |
| 困難 | 10 | 2 | 2 | Mix path obligations with blocked empty cells. |
| 高手 | 10 | 3 | 2 | Require more elimination before committing pieces. |
| 燒腦 | 12 | 3 | 3 | High ambiguity and multiple tempting placements. |
| 地獄 | 10 | 4 | 3 | Dense constraints with unique-solution verification. |

## Generated Levels

| Level | Group | Bones | Trees | Difficulty Score | Solver Nodes | Branch Sum |
|---:|---|---:|---:|---:|---:|---:|
| 1 | 入門 | 1 | 1 | 34006 | 5707 | 143 |
| 2 | 入門 | 1 | 1 | 34052 | 6334 | 142 |
| 3 | 入門 | 1 | 1 | 34598 | 6961 | 141 |
| 4 | 入門 | 1 | 1 | 34624 | 9376 | 130 |
| 5 | 入門 | 1 | 1 | 36127 | 8726 | 144 |
| 6 | 入門 | 1 | 1 | 39715 | 10005 | 160 |
| 7 | 入門 | 1 | 1 | 40297 | 9913 | 168 |
| 8 | 入門 | 1 | 1 | 41028 | 10986 | 164 |
| 9 | 進階 | 2 | 1 | 32487 | 6179 | 143 |
| 10 | 進階 | 2 | 1 | 33299 | 6867 | 139 |
| 11 | 進階 | 2 | 1 | 33637 | 6791 | 138 |
| 12 | 進階 | 2 | 1 | 33671 | 6705 | 139 |
| 13 | 進階 | 2 | 1 | 33735 | 6437 | 132 |
| 14 | 進階 | 2 | 1 | 33802 | 7015 | 137 |
| 15 | 進階 | 2 | 1 | 34340 | 8123 | 148 |
| 16 | 進階 | 2 | 1 | 35658 | 8212 | 157 |
| 17 | 進階 | 2 | 1 | 36472 | 8978 | 145 |
| 18 | 進階 | 2 | 1 | 36536 | 8809 | 148 |
| 19 | 困難 | 2 | 2 | 27929 | 3057 | 120 |
| 20 | 困難 | 2 | 2 | 28036 | 3147 | 120 |
| 21 | 困難 | 2 | 2 | 28084 | 2904 | 118 |
| 22 | 困難 | 2 | 2 | 28170 | 3733 | 110 |
| 23 | 困難 | 2 | 2 | 28730 | 3613 | 118 |
| 24 | 困難 | 2 | 2 | 29119 | 3370 | 125 |
| 25 | 困難 | 2 | 2 | 29646 | 3521 | 129 |
| 26 | 困難 | 2 | 2 | 30506 | 3729 | 137 |
| 27 | 困難 | 2 | 2 | 31258 | 3652 | 135 |
| 28 | 困難 | 2 | 2 | 31827 | 4508 | 137 |
| 29 | 高手 | 3 | 2 | 28027 | 2924 | 118 |
| 30 | 高手 | 3 | 2 | 28028 | 4016 | 116 |
| 31 | 高手 | 3 | 2 | 28876 | 3220 | 124 |
| 32 | 高手 | 3 | 2 | 29118 | 3763 | 120 |
| 33 | 高手 | 3 | 2 | 29142 | 4306 | 114 |
| 34 | 高手 | 3 | 2 | 29480 | 4293 | 118 |
| 35 | 高手 | 3 | 2 | 29810 | 3145 | 124 |
| 36 | 高手 | 3 | 2 | 29908 | 3825 | 129 |
| 37 | 高手 | 3 | 2 | 30901 | 3367 | 134 |
| 38 | 高手 | 3 | 2 | 33879 | 5001 | 150 |
| 39 | 燒腦 | 3 | 3 | 25657 | 1928 | 102 |
| 40 | 燒腦 | 3 | 3 | 25726 | 1873 | 109 |
| 41 | 燒腦 | 3 | 3 | 25770 | 2111 | 112 |
| 42 | 燒腦 | 3 | 3 | 25891 | 2624 | 113 |
| 43 | 燒腦 | 3 | 3 | 26030 | 1951 | 111 |
| 44 | 燒腦 | 3 | 3 | 26078 | 1500 | 117 |
| 45 | 燒腦 | 3 | 3 | 26238 | 1854 | 110 |
| 46 | 燒腦 | 3 | 3 | 26249 | 1989 | 108 |
| 47 | 燒腦 | 3 | 3 | 26491 | 1555 | 116 |
| 48 | 燒腦 | 3 | 3 | 26711 | 2136 | 117 |
| 49 | 燒腦 | 3 | 3 | 26759 | 1505 | 119 |
| 50 | 燒腦 | 3 | 3 | 27735 | 1894 | 120 |
| 51 | 地獄 | 4 | 3 | 25391 | 1727 | 107 |
| 52 | 地獄 | 4 | 3 | 25440 | 1051 | 110 |
| 53 | 地獄 | 4 | 3 | 25623 | 1394 | 103 |
| 54 | 地獄 | 4 | 3 | 26028 | 1494 | 111 |
| 55 | 地獄 | 4 | 3 | 26189 | 1686 | 105 |
| 56 | 地獄 | 4 | 3 | 26280 | 1413 | 115 |
| 57 | 地獄 | 4 | 3 | 26740 | 1638 | 112 |
| 58 | 地獄 | 4 | 3 | 26792 | 1986 | 109 |
| 59 | 地獄 | 4 | 3 | 26889 | 1964 | 110 |
| 60 | 地獄 | 4 | 3 | 27020 | 2229 | 109 |

## Follow-Up Suggestions

- Add a failure-aware hint system: first hint unlocks after 3 failed placements, deeper hints after 6 and 9.
- Add optional challenge badges for no-hint clears and low-move clears.
- Consider adding a fifth piece or alternate piece set for a true expert pack; this would require a separate GDD/ADR pass because it changes the core puzzle grammar.
