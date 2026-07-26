// ============================================================
//  STATE / AI — computer opponent logic
// ============================================================
import {
  UNIT_TYPE_DEFS,
  SKILL_DEFS,
} from "../data/index.js";
import { GameState, PlacedUnit } from "./types.js";
import {
  getUnitByRef,
  getReachableTiles,
  calculateDamage,
  getUnitMaxHp,
  isOwnUnit,
} from "./helpers.js";
import { executeAttack, executeMove, advanceTurn } from "./combat.js";

export function aiTakeTurn(state: GameState): void {
  const turnUnit = getTurnUnit(state);
  if (!turnUnit) return;
  // AI always acts if it has AP and hasn't used a skill yet
  if (turnUnit.ap <= 0 || turnUnit.skillUsedThisTurn) {
    advanceTurn(state);
    return;
  }

  // Simple AI: find best action
  const enemyUnits = state.turnOrder
    .map((e) => getUnitByRef(e.playerIndex, e.unitIndex, state.p1Team.placed, state.p2Team.placed))
    .filter((u): u is PlacedUnit => u !== null && u.currentHp > 0 && !isOwnUnit(turnUnit, u));

  if (enemyUnits.length === 0) return;

  // Find closest enemy
  let closestEnemy = enemyUnits[0];
  let closestDist = Math.abs(turnUnit.row - closestEnemy.row) + Math.abs(turnUnit.col - closestEnemy.col);
  for (const e of enemyUnits) {
    const d = Math.abs(turnUnit.row - e.row) + Math.abs(turnUnit.col - e.col);
    if (d < closestDist) {
      closestDist = d;
      closestEnemy = e;
    }
  }

  // Try to attack with best skill
  const unitType = UNIT_TYPE_DEFS[turnUnit.typeId];
  const skillIds = unitType.skills;

  let bestAction = "move";
  let bestDamage = -1;
  let bestTarget: PlacedUnit | null = null;
  let bestSkill = "";

  for (const sid of skillIds) {
    const skill = SKILL_DEFS[sid];
    if (turnUnit.ap < skill.cost) continue;

    let range = skill.range;
    if (turnUnit.passiveId === "tracker") range += 1;

    for (const e of enemyUnits) {
      const dist = Math.abs(turnUnit.row - e.row) + Math.abs(turnUnit.col - e.col);
      if (dist > range) continue;

      const dmg = calculateDamage(turnUnit, e, sid);
      if (dmg > bestDamage) {
        bestDamage = dmg;
        bestTarget = e;
        bestSkill = sid;
        bestAction = skill.type === "attack" ? "attack" : "skill";
      }
    }
  }

  // Also consider healing self/allies if low HP
  const myUnits = state.turnOrder
    .map((e) => getUnitByRef(e.playerIndex, e.unitIndex, state.p1Team.placed, state.p2Team.placed))
    .filter((u): u is PlacedUnit => u !== null && u.currentHp > 0 && isOwnUnit(turnUnit, u));

  const lowAllies = myUnits.filter((u) => u.currentHp < getUnitMaxHp(u) * 0.4);
  if (lowAllies.length > 0 && bestDamage < 2) {
    // Check if we have a heal skill
    for (const sid of skillIds) {
      const skill = SKILL_DEFS[sid];
      if (skill.type === "heal" && turnUnit.ap >= skill.cost) {
        const target = lowAllies[0];
        const dist = Math.abs(turnUnit.row - target.row) + Math.abs(turnUnit.col - target.col);
        let range = skill.range;
        if (turnUnit.passiveId === "tracker") range += 1;
        if (dist <= range) {
          bestAction = "skill";
          bestTarget = target;
          bestSkill = sid;
          break;
        }
      }
    }
  }

  // Execute AI action
  if (bestAction === "attack" && bestTarget && bestSkill) {
    executeAttack(state, bestSkill, bestTarget);
  } else if (bestAction === "skill" && bestTarget && bestSkill) {
    executeAttack(state, bestSkill, bestTarget);
  } else {
    // Move towards closest enemy
    const reachable = getReachableTiles(state, turnUnit);
    let bestMove: { row: number; col: number } | null = null;
    let bestMoveDist = closestDist;

    for (const key of reachable) {
      const [r, c] = key.split(",").map(Number);
      const d = Math.abs(r - closestEnemy.row) + Math.abs(c - closestEnemy.col);
      if (d < bestMoveDist) {
        bestMoveDist = d;
        bestMove = { row: r, col: c };
      }
    }

    if (bestMove) {
      executeMove(state, bestMove.row, bestMove.col);
    } else {
      advanceTurn(state);
    }
  }
}

function getTurnUnit(state: GameState): PlacedUnit | null {
  if (state.currentTurnIndex >= state.turnOrder.length) return null;
  const { playerIndex, unitIndex } = state.turnOrder[state.currentTurnIndex];
  const team = playerIndex === 0 ? state.p1Team.placed : state.p2Team.placed;
  if (unitIndex >= team.length) return null;
  const unit = team[unitIndex];
  // Skip dead units
  if (unit.currentHp <= 0) return null;
  return unit;
}
