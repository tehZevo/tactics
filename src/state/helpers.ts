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

export function getUnitDisplayPos(unit: PlacedUnit): { row: number; col: number } {
  if (unit.tentativeRow !== undefined && unit.tentativeCol !== undefined) {
    return { row: unit.tentativeRow, col: unit.tentativeCol };
  }
  return { row: unit.row, col: unit.col };
}

export function finalizeMove(state: GameState, unit: PlacedUnit): void {
  if (unit.tentativeRow === undefined || unit.tentativeCol === undefined) return;

  const oldRow = unit.row;
  const oldCol = unit.col;
  const newRow = unit.tentativeRow;
  const newCol = unit.tentativeCol;

  state.board[oldRow][oldCol] = null;
  unit.row = newRow;
  unit.col = newCol;
  state.board[newRow][newCol] = unit;

  unit.turnStartRow = newRow;
  unit.turnStartCol = newCol;
  unit.originalRow = newRow;
  unit.originalCol = newCol;

  delete unit.tentativeRow;
  delete unit.tentativeCol;
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
  const startPos = getUnitDisplayPos(unit);
  const queue: { row: number; col: number; dist: number }[] = [{ row: startPos.row, col: startPos.col, dist: 0 }];
  visited.add(`${startPos.row},${startPos.col}`);

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
      // Before skill use, limit to movement radius from turn start position
      if (!unit.skillUsedThisTurn) {
        const distFromStart = Math.abs(nr - unit.turnStartRow) + Math.abs(nc - unit.turnStartCol);
        if (distFromStart > unit.baseMovement) continue;
      }
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

      if (skill.type === "apDrain" && !isOwnUnit(unit, target) && dist > 0) {
        targets.push(target);
      }

      if (skill.swapTarget && dist > 0) {
        targets.push(target);
      }

      if (skill.reorderTarget && dist > 0) {
        targets.push(target);
      }
    }
  }
  return targets;
}

export function calculateDamage(attacker: PlacedUnit, defender: PlacedUnit, skillId: string): number {
  const skill = SKILL_DEFS[skillId];
  const atkStats = getEffectiveStats(attacker);
  const defStats = getEffectiveStatsWithBonus(defender);

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
  return getEffectiveStatsFor(unit.typeId, unit.passiveId);
}

export function getEffectiveStatsFor(typeId: string, passiveId: string | null | undefined): { attack: number; defense: number } {
  let atk = UNIT_TYPE_DEFS[typeId].baseAtk;
  let def = UNIT_TYPE_DEFS[typeId].baseDef;
  if (passiveId && PASSIVE_DEFS[passiveId]) {
    const baseStats = {
      hp: UNIT_TYPE_DEFS[typeId].hp,
      attack: UNIT_TYPE_DEFS[typeId].baseAtk,
      defense: UNIT_TYPE_DEFS[typeId].baseDef,
      movement: UNIT_TYPE_DEFS[typeId].movement,
      initiative: UNIT_TYPE_DEFS[typeId].initiative,
    };
    const passiveStats = PASSIVE_DEFS[passiveId].apply(baseStats);
    atk += passiveStats.attack;
    def += passiveStats.defense;
  }
  return { attack: Math.max(atk, 0), defense: Math.max(def, 0) };
}

export function getEffectiveStatsWithBonus(unit: PlacedUnit): { attack: number; defense: number } {
  const stats = getEffectiveStats(unit);
  return {
    attack: stats.attack,
    defense: stats.defense + (unit.defenseBonus || 0),
  };
}

export function isOwnUnit(turnUnit: PlacedUnit, target: PlacedUnit): boolean {
  return getPlayerIndex(turnUnit) === getPlayerIndex(target);
}

export function getUnitMaxHp(unit: PlacedUnit): number {
  return getUnitMaxHpFor(unit.typeId, unit.passiveId);
}

export function getUnitMaxHpFor(typeId: string, passiveId: string | null | undefined): number {
  const typeDef = UNIT_TYPE_DEFS[typeId];
  let hp = typeDef.hp;
  if (passiveId && PASSIVE_DEFS[passiveId]) {
    const stats = PASSIVE_DEFS[passiveId].apply({
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

export function getPlayerIndex(unit: PlacedUnit): 0 | 1 {
  if (unit.playerIndex !== undefined) return unit.playerIndex;
  return unit.row < 6 ? 0 : 1;
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

export function checkVictory(state: GameState): void {
  const p1Alive = state.p1Team.placed.some((u) => u.currentHp > 0);
  const p2Alive = state.p2Team.placed.some((u) => u.currentHp > 0);

  if (!p1Alive && !p2Alive) {
    state.screen = "victory";
    state.winner = -1;
    addLog(state, "Draw! Both sides are annihilated.", "info");
  } else if (!p1Alive) {
    state.screen = "victory";
    state.winner = 1;
    addLog(state, "Player 2 wins!", "info");
  } else if (!p2Alive) {
    state.screen = "victory";
    state.winner = 0;
    addLog(state, "Player 1 wins!", "info");
  }
}
