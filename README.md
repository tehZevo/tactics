# Tactics

A tactical grid-based RPG with team building, deployment, and turn-based combat.

## Overview

Build a team of 6 units, deploy them on a symmetrical 6x10 map, then fight through turn-based tactical combat. Choose from 8 unit types, customize each with a passive trait, and outmaneuver your opponent to eliminate all enemy units.

## Features

- **8 unit types** — Warrior, Archer, Mage, Rogue, Geomancer, Paladin, Cleric, Phantom
- **10 passive traits** — each modifies stats or grants unique abilities
- **Randomized maps** — 8 unique symmetric battlefields with varied terrain
- **Team presets** — 6 balanced preset teams for quick AI matches
- **Turn-based combat** — initiative-driven turn order with action points (AP)
- **AI opponent** — play against a computer-controlled enemy

## How to Play

1. **Build your team** — select 6 units and assign a passive to each
2. **Deploy** — place units on your side of the map
3. **Battle** — move and attack each turn until all enemy units are destroyed

See [GAMEPLAY.md](./GAMEPLAY.md) for detailed mechanics and strategy.

## Project Structure

```
src/
  data/         # Unit types, skills, passives, maps, team presets
  state/        # Game logic, combat, AI
  render/       # React UI components
  state.ts      # Central state management and actions
```

## Development

```bash
npm install
npm run dev      # Start dev server
npm run build    # Build for production
npm test         # Run tests
```
