# Project Structure

## Current Playable Build

The current Puppy Hide and Seek build is a zero-build static web game. These root files are intentionally the active player-facing build:

| Path | Purpose |
|------|---------|
| `index.html` | Browser entry point and game screen markup |
| `style.css` | Visual style, responsive layout, focus states, and modal styling |
| `game.js` | Runtime state, input handling, validation, level order, hints, and victory flow |
| `levels.js` | Generated level data and verified solutions |

Run or test the game through a local static server from the repository root, for example:

```powershell
python -m http.server 8765 --bind 127.0.0.1
```

Then open `http://127.0.0.1:8765/index.html`.

## Reserved Directories

| Path | Current Role |
|------|--------------|
| `src/` | Reserved for a future modular source layout. Do not move the playable root files here without a migration ADR. |
| `design/` | GDD, UX, and entity registry documentation. |
| `docs/architecture/` | Architecture decisions and technical registries. |
| `production/` | Discussion notes, sprint artifacts, status reports, and tuning evidence. |

## Structure Rule

Until a replacement build pipeline or engine runtime is accepted, keep the root static files as the deployable game. If the codebase needs modules, bundling, or an engine migration, document that as a new ADR before moving files.
