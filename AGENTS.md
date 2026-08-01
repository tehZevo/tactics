# AGENTS.md — Tactics Game

## Project
Turn-based tactical combat game built with TypeScript, Vite, and Vitest. Polymorphic Action class pattern for state changes.

## Key Directories
- `src/state/` — Game state logic (types, helpers, moves, effects, turns, AI)
- `src/state/skill-effects/` — Skill implementations (attack, heal, poison, etc.)
- `src/state/actions/` — Action classes (MoveAction, UseSkillAction, LeapAction, etc.)
- `src/data/` — Unit/skill/passive definitions, maps
- `src/__tests__/` — Vitest tests
- `src/render/` — React UI components

## Rules
- **Keep test coverage above 80% on game logic** (`src/state/` + `src/data/`). Run `npm run test:coverage:logic` before committing feature changes.
- State is data-only; deep clone via `JSON.parse(JSON.stringify(...))` is safe.
- Use `createPlacedUnit` for test fixtures.
- `findUnitRef` returns `{ playerIndex, unitIndex } | null` — no need for explicit casts.
- `getEffectiveRange` handles both tracker passive and darkness rune effects.
