# Gameplay Guide

## Setup

Each player builds a team of **6 units** chosen from 8 available types. Each unit is assigned a **passive trait** that modifies its stats or grants a special ability. Teams are placed on opposite sides of a random 6x10 map — Player 1 deploys in columns 0–2, Player 2 in columns 7–9. The battle begins once both players have placed all 6 units.

## Units

| Type | HP | Atk | Def | Move | Init | Role |
|------|----|-----|-----|------|------|------|
| **W** Warrior | 8 | 1 | 1 | 3 | 3 | Sturdy frontline fighter |
| **A** Archer | 5 | 0 | 0 | 4 | 5 | Fast ranged attacker |
| **M** Mage | 4 | 0 | 0 | 4 | 4 | Fragile AoE dealer |
| **R** Rogue | 5 | 0 | 0 | 5 | 6 | Fastest, poison + teleport |
| **G** Geomancer | 6 | 0 | 0 | 3 | 2 | AoE damage dealer |
| **P** Paladin | 7 | 0 | 1 | 3 | 1 | Defensive holy warrior |
| **C** Cleric | 6 | 0 | 0 | 4 | 3 | Healer with ranged attack |
| **Ph** Phantom | 4 | 0 | 0 | 5 | 7 | Ethereal, invulnerable strikes |

### Skills (2 per unit)

**Warrior**
- **Power Strike** (1 AP, range 1) — 4 damage melee
- **Whirlwind** (3 AP, range 1, AoE 1, CD 2) — 2 damage to all adjacent enemies

**Archer**
- **Precise Shot** (1 AP, range 4) — 3 damage ranged
- **Trip Wire** (2 AP, range 3, CD 2) — trap; next enemy entering range takes 3 damage

**Mage**
- **Fireball** (3 AP, range 3, AoE 1, CD 1) — 5 damage in an area
- **Arcane Missile** (1 AP, range 3) — 2 damage ranged

**Rogue**
- **Poison Blade** (1 AP, range 1) — 2 damage + poisons target (2 damage/turn for 2 turns)
- **Shadow Step** (2 AP, range 0, CD 2) — teleport to any empty tile within range 3
- **Soul Drain** (1 AP, range 1, CD 1) — steal 1 AP from target

**Geomancer**
- **Cataclysm** (6 AP, range 0, AoE 3, CD 3) — 3 damage to all enemies within range 3
- **Seism** (2 AP, range 2, CD 1) — 4 damage; slows target by -1 movement next turn

**Paladin**
- **Holy Strike** (1 AP, range 1) — 3 damage melee
- **Lay on Hands** (3 AP, range 2, CD 2) — heal an ally for 5 HP

**Cleric**
- **Divine Heal** (2 AP, range 3, CD 1) — heal an ally for 4 HP
- **Holy Bolt** (2 AP, range 4) — 4 damage ranged

**Phantom**
- **Phase Shift** (4 AP, self) — become invulnerable until your next turn
- **Void Strike** (1 AP, range 1) — 3 damage, ignores target's defense

## Passives

Each unit gets one passive from the following:

| Passive | Effect | Recommended For |
|---------|--------|-----------------|
| **Nimble** | +1 movement | Archer, Rogue, Cleric |
| **Toughened** | +2 HP | Warrior, Paladin, Geomancer |
| **Hardened** | +1 defense | Warrior, Paladin, Geomancer, Cleric |
| **Aggressive** | +1 attack | Warrior, Rogue, Phantom |
| **Swift** | +2 initiative | Rogue, Archer, Phantom, Mage |
| **Bloodthirsty** | +1 HP on killing blow | Warrior, Rogue, Phantom |
| **Fortitude** | +1 defense vs AoE | Mage, Cleric, Geomancer |
| **Predation** | +1 attack vs units below half HP | Rogue, Phantom, Archer |
| **Tracker** | +1 attack range | Archer, Mage, Cleric |
| **Desperate** | +1 AP/turn, -1 defense | Rogue, Phantom |

## Combat Mechanics

### Turn Order

Turn order is determined at the start of battle by **initiative + attack** (highest first). If two units are tied, the one with higher initiative goes first. Dead units are skipped.

### Action Points (AP)

- Each unit starts with **0 AP**, gains **1 AP per turn** (2 if Desperate passive).
- AP cap is **6**.
- Movement is **free** (no AP cost).
- Skills cost AP as listed; each unit may use **only one skill per turn**.

### Movement

- Units move by clicking a reachable tile (highlighted during move action).
- Movement is calculated via BFS through walkable tiles.
- Units cannot move through other units (allied or enemy) or unwalkable terrain.

### Damage

Damage = **skill damage + attacker's attack stat - defender's defense stat**.
- Minimum damage is **1**.
- Skills with `ignoresDefense` bypass the defender's defense entirely.
- Defense stats from passives contribute to the total.

### Invulnerability

The Phantom's **Phase Shift** makes it untargetable by any attacks or heals until its next turn. Invulnerable units show a `?` indicator.

### Poison

**Poison Blade** applies poison for 2 turns. At the start of each new round, poisoned units take 2 damage and lose 1 poison turn. Poison can kill.

### Seism Slow

**Seism** reduces the target's movement by 1 for the next turn.

## Victory Conditions

- Eliminate **all** enemy units to win.
- If both sides are wiped out simultaneously, the result is a **draw**.

## Maps

8 random symmetric maps are available. Each has walkable tiles (open) and unwalkable terrain (blocked). Common terrain features include rivers, mountains, forests, and chokepoints.

## Tips

- **Frontline units** (Warrior, Paladin) should absorb damage and protect backline casters.
- **Archers and Mages** stay at range and chip away with attacks; use Tracker for extra reach.
- **Rogues and Phantoms** are fast harassers — use Shadow Step to reposition and Void Strike to ignore armor.
- **Paladins and Clerics** keep the team alive; heal key targets before they die.
- **Geomancers** excel at clearing groups but need protection — Cataclysm costs 6 AP, so plan turns around it.
- **Desperate** is high-risk/high-reward: the extra AP lets you act more, but the -1 defense makes your unit fragile.
- **Bloodthirsty** sustains strikers over long fights — pair with high-damage units.
- **Fortitude** is essential against AoE-heavy compositions.
