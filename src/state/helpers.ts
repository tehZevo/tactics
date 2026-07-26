// ============================================================
//  STATE / HELPERS — pure helper functions
// ============================================================
import {
  BOARD_COLS,
  BOARD_ROWS,
  UNIT_TYPE_DEFS,
  SKILL_DEFS,
  PASSIVE_DEFS,
} from "../data/index.js";
import type { SkillDef } from "../data/skills.js";
import { GameState, PlacedUnit } from "./types.js";

export function getTurnUnit(state: GameState): PlacedUnit | null {
  if (state.currentTurnIndex >= state.turnOrder.length) return null;
  const { playerIndex, unitIndex } = state.turnOrder[state.currentTurnIndex];
  const team = playerIndex === 0 ? state.p1Team.placed : state.p2Team.placed;
  if (unitIndex >= team.length) return null;
  const unit = team[unitIndex];
  if (unit.currentHp <= 0) return null;
  return unit;
}

export function getUnitAt(state: GameState, row: number, col: number): PlacedUnit | null {
  if (row < 0 || row >= BOARD_ROWS || col < 0 || col >= BOARD_COLS) return null;
  return state.board[row][col];
}

function manhattanDistance(r1: number, c1: number, r2: number, c2: number): number {
  return Math.abs(r1 - r2) + Math.abs(c1 - c2);
}

export function getReachableTiles(state: GameState, unit: PlacedUnit): Set<string> {
  const reachable = new Set<string>();
  const maxDist = unit.movement + (unit.leapBonus || 0);
  const map = state.map;
  const visited = new Set<string>();
  const queue: { row: number; col: number; dist: number }[] = [{ row: unit.row, col: unit.col, dist: 0 }];
  visited.add(`${unit.row},${unit.col}`);

  while (queue.length > 0) {
    const curr = queue.shift()!;
    if (curr.dist > 0) reachable.add(`${curr.row},${curr.col}`);
    if (curr.dist >= maxDist) continue;

    const neighbors = [
      [curr.row - 1, curr.col],
      [curr.row + 1, curr.col],
      [curr.row, curr.col - 1],
      [curr.row, curr.col + 1],
    ];

    for (const [nr, nc] of neighbors) {
      if (nr < 0 || nr >= BOARD_ROWS || nc < 0 || nc >= BOARD_COLS) continue;
      const key = `${nr},${nc}`;
      if (visited.has(key)) continue;
      if (!map.grid[nr][nc]) continue;
      const occupant = state.board[nr][nc];
      if (occupant && isOwnUnit(unit, occupant)) {
        visited.add(key);
        queue.push({ row: nr, col: nc, dist: curr.dist + 1 });
        continue;
      }
      if (occupant) continue;
      visited.add(key);
      queue.push({ row: nr, col: nc, dist: curr.dist + 1 });
    }
  }
  return reachable;
}

export function getTargetsInRange(
  unit: PlacedUnit,
  range: number,
  skillId: string,
  state: GameState,
): PlacedUnit[] {
  const skill = SKILL_DEFS[skillId];
  let effectiveRange = range;
  if (unit.passiveId === "tracker") effectiveRange += 1;

  const targets: PlacedUnit[] = [];

  for (let r = 0; r < BOARD_ROWS; r++) {
    for (let c = 0; c < BOARD_COLS; c++) {
      const target = state.board[r][c];
      if (!target) continue;
      if (target.invulnerable) continue;
      const dist = manhattanDistance(unit.row, unit.col, r, c);
      if (dist > effectiveRange) continue;

      if (skill.selfTarget && target === unit) {
        targets.push(target);
        continue;
      }

      if (skill.type === "heal" && isOwnUnit(unit, target) && dist > 0) {
        targets.push(target);
        continue;
      }

      if (skill.type === "attack" && skill.aoe === 99) {
        if (!isOwnUnit(unit, target)) targets.push(target);
        continue;
      }

      if (skill.type === "attack" && !isOwnUnit(unit, target) && dist > 0) {
        targets.push(target);
      }
    }
  }
  return targets;
}

export function calculateDamage(attacker: PlacedUnit, defender: PlacedUnit, skillId: string): number {
  const skill = SKILL_DEFS[skillId];
  const atkStats = getEffectiveStats(attacker);
  const defStats = getEffectiveStats(defender);

  let damage = (skill.damage || 0) + atkStats.attack;

  if (!skill.ignoresDefense) {
    damage -= defStats.defense;
  }

  if (attacker.passiveId === "predation") {
    const predStats = PASSIVE_DEFS["predation"].apply({
      hp: UNIT_TYPE_DEFS[attacker.typeId].hp,
      attack: UNIT_TYPE_DEFS[attacker.typeId].baseAtk,
      defense: UNIT_TYPE_DEFS[attacker.typeId].baseDef,
      movement: UNIT_TYPE_DEFS[attacker.typeId].movement,
      initiative: UNIT_TYPE_DEFS[attacker.typeId].initiative,
    });
    const halfHp = Math.floor(predStats.hp / 2);
    if (defender.currentHp <= halfHp) {
      damage += 1;
    }
  }

  if (skill.aoe && defender.passiveId === "fortitude") {
    damage -= 1;
  }

  return Math.max(damage, 1);
}

export function getEffectiveStats(unit: PlacedUnit): { attack: number; defense: number } {
  let atk = UNIT_TYPE_DEFS[unit.typeId].baseAtk;
  let def = UNIT_TYPE_DEFS[unit.typeId].baseDef;
  if (unit.passiveId && PASSIVE_DEFS[unit.passiveId]) {
    const baseStats = {
      hp: UNIT_TYPE_DEFS[unit.typeId].hp,
      attack: UNIT_TYPE_DEFS[unit.typeId].baseAtk,
      defense: UNIT_TYPE_DEFS[unit.typeId].baseDef,
      movement: UNIT_TYPE_DEFS[unit.typeId].movement,
      initiative: UNIT_TYPE_DEFS[unit.typeId].initiative,
    };
    const passiveStats = PASSIVE_DEFS[unit.passiveId].apply(baseStats);
    atk += passiveStats.attack;
    def += passiveStats.defense;
  }
  return { attack: Math.max(atk, 0), defense: Math.max(def, 0) };
}

export function isOwnUnit(turnUnit: PlacedUnit, target: PlacedUnit): boolean {
  if (turnUnit.playerIndex !== undefined && target.playerIndex !== undefined) {
    return turnUnit.playerIndex === target.playerIndex;
  }
  const turnTeam = turnUnit.row < 5 ? 0 : 1;
  const targetTeam = target.row < 5 ? 0 : 1;
  return turnTeam === targetTeam;
}

export function getUnitMaxHp(unit: PlacedUnit): number {
  const typeDef = UNIT_TYPE_DEFS[unit.typeId];
  let hp = typeDef.hp;
  if (unit.passiveId && PASSIVE_DEFS[unit.passiveId]) {
    const stats = PASSIVE_DEFS[unit.passiveId].apply({
      hp: typeDef.hp,
      attack: typeDef.baseAtk,
      defense: typeDef.baseDef,
      movement: typeDef.movement,
      initiative: typeDef.initiative,
    });
    hp = stats.hp;
  }
  return hp;
}

export function getUnitDisplayName(unit: PlacedUnit): string {
  return UNIT_TYPE_DEFS[unit.typeId].name;
}

export function addLog(state: GameState, msg: string, type: "info" | "damage" | "heal" = "info"): void {
  state.log.unshift({ text: msg, type });
  if (state.log.length > 50) state.log.pop();
}

export function findUnitRef(unit: PlacedUnit, p1Team: PlacedUnit[], p2Team: PlacedUnit[]): { playerIndex: 0 | 1; unitIndex: number } | null {
  for (let i = 0; i < p1Team.length; i++) {
    if (p1Team[i] === unit) return { playerIndex: 0, unitIndex: i };
  }
  for (let i = 0; i < p2Team.length; i++) {
    if (p2Team[i] === unit) return { playerIndex: 1, unitIndex: i };
  }
  return null;
}

export function getUnitByRef(ref: { playerIndex: 0 | 1; unitIndex: number }, p1Team: PlacedUnit[], p2Team: PlacedUnit[]): PlacedUnit | null {
  const team = ref.playerIndex === 0 ? p1Team : p2Team;
  if (ref.unitIndex >= team.length) return null;
  return team[ref.unitIndex];
}
