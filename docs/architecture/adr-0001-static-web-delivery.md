# ADR-0001: Static Web Delivery Structure

## Status
Accepted

## Date
2026-05-14

## Engine Compatibility

| Field | Value |
|-------|-------|
| **Engine** | Browser static web runtime |
| **Domain** | Core / UI / Input |
| **Knowledge Risk** | LOW |
| **References Consulted** | `design/gdd/puppy-hide-and-seek.md`, `design/ux/game-screen.md`, `design/ux/interaction-patterns.md` |
| **Post-Cutoff APIs Used** | None |
| **Verification Required** | Load `index.html` through a local HTTP server and verify console errors, level selection, keyboard controls, and hint modal behavior. |

## ADR Dependencies

| Field | Value |
|-------|-------|
| **Depends On** | None |
| **Enables** | Future ADR for modular source layout or engine migration |
| **Blocks** | Moving root static files into `src/` without a deployment plan |
| **Ordering Note** | Keep the current static entry points stable until a replacement build/deploy pipeline exists. |

## Context

### Problem Statement

The playable game currently exists as root-level static web files: `index.html`, `style.css`, `game.js`, and `levels.js`. The project template also contains a conventional `src/` directory, but moving the playable files there immediately would break the simplest static hosting path unless a build step or redirect is added.

### Constraints

- The game must remain playable by opening the project through a static web server.
- The current implementation has no bundler, package manager, or build pipeline.
- `levels.js` is a large generated data file and should not be moved casually.
- The project may later migrate to an engine or a modular JavaScript structure, but that has not been selected yet.

### Requirements

- Preserve the current playable entry point.
- Document why root-level game files are intentional.
- Keep `src/` available for future modularization.
- Avoid adding a build system until the project needs one.

## Decision

Keep the static web game entry points at the repository root for the current phase:

- `index.html`
- `style.css`
- `game.js`
- `levels.js`

Use `src/` as a reserved directory for future source modularization. Do not move the playable root files into `src/` until there is an accepted migration plan that covers hosting, imports, testing, and deployment.

### Architecture Diagram

```text
Browser
  |
  v
index.html
  |-- style.css
  |-- levels.js
  |-- game.js
```

### Key Interfaces

- `index.html` is the current player-facing entry point.
- `levels.js` exposes `GAME_LEVELS` globally.
- `game.js` owns runtime state, interaction behavior, level order, validation, hints, and victory flow.
- `style.css` owns visual presentation and responsive layout.

## Alternatives Considered

### Alternative 1: Move All Game Files Into `src/`

- **Description**: Relocate `index.html`, `style.css`, `game.js`, and `levels.js` under `src/`.
- **Pros**: Cleaner conventional source layout.
- **Cons**: Breaks current static hosting expectations unless paths and deploy rules are updated.
- **Rejection Reason**: Too much deployment risk for a project that currently benefits from zero-build static hosting.

### Alternative 2: Add a Build Pipeline Now

- **Description**: Introduce a bundler and compile source files into a deployable root or `dist/` folder.
- **Pros**: Scales better for modular JavaScript and automated checks.
- **Cons**: Adds dependency management and build complexity before the project needs it.
- **Rejection Reason**: The current game is small enough that a build pipeline would be premature.

### Alternative 3: Keep Root Static Entry Points

- **Description**: Treat root files as the current deployable build and document the decision.
- **Pros**: Lowest risk, keeps the game playable, matches current implementation.
- **Cons**: Root directory remains less conventional until modularization begins.
- **Rejection Reason**: Accepted.

## Consequences

### Positive

- The game remains playable with a simple static web server.
- Future refactors can happen intentionally instead of through incidental file moves.
- Production and design documents now explain why root-level files exist.

### Negative

- The root directory contains implementation files rather than only project metadata.
- New contributors may expect code to live in `src/` unless they read the structure note.

### Risks

- **Risk**: Root files grow too large and become hard to maintain.
  **Mitigation**: Create a follow-up ADR before introducing modules or a build step.
- **Risk**: Future engine setup conflicts with current web runtime.
  **Mitigation**: Treat engine migration as a separate accepted ADR.

## GDD Requirements Addressed

| GDD System | Requirement | How This ADR Addresses It |
|------------|-------------|--------------------------|
| `design/gdd/puppy-hide-and-seek.md` | The game uses Vanilla JS DOM manipulation for rendering and drag/drop. | Keeps the current static browser implementation as the active runtime. |
| `design/ux/game-screen.md` | The game screen must present the playable board, controls, instructions, and pieces tray. | Preserves the root web entry point that currently renders those UI elements. |

## Performance Implications

- **CPU**: No change.
- **Memory**: No change.
- **Load Time**: No build step added; static file loading remains simple.
- **Network**: No change.

## Migration Plan

1. Keep root static files as the current playable build.
2. Document the structure in `docs/project-structure.md`.
3. If the game grows beyond single-file maintainability, draft a new ADR for modular JavaScript or engine migration.
4. Only move files after tests and deployment paths are updated.

## Validation Criteria

- `index.html` loads successfully from a local HTTP server.
- `game.js` and `levels.js` pass `node --check`.
- The level selector contains all levels.
- Keyboard controls and progressive hints work after the structure decision.

## Related Decisions

- `production/discussions/level-difficulty-scorecard.md`
- Future ADR: modular JavaScript source layout or engine migration.
