// ============================================================
//  STATE / COMBAT — executeAttack, executeMove, executeFullScreenAttack
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
import {
  getUnitAt,
  getReachableTiles,
  getEffectiveStats,
  getUnitMaxHp,
  getUnitDisplayName,
  addLog,
  isOwnUnit,
  calculateDamage,
  findUnitRef,
  getUnitByRef,
} from "./helpers.js";

export function executeMove(state: GameState, row: number, col: number): void {
  const turnUnit = getTurnUnit(state);
  if (!turnUnit) return;

  const reachable = getReachableTiles(state, turnUnit);
  if (!reachable.has(`${row},${col}`)) return;

  const oldRow = turnUnit.row;
  const oldCol = turnUnit.col;

  // Move is free (no AP cost)
  state.board[oldRow][oldCol] = null;
  turnUnit.row = row;
  turnUnit.col = col;
  state.board[row][col] = turnUnit;

  addLog(state, `${getUnitDisplayName(turnUnit)} moves to (${row},${col}).`);
  state.actionMode = "idle";
  state.selectedAction = null;
}

export function executeAttack(state: GameState, skillId: string, target: PlacedUnit): void {
  const turnUnit = getTurnUnit(state);
  if (!turnUnit) return;

  const skill = SKILL_DEFS[skillId];
  if (turnUnit.ap < skill.cost) return;

  // Check if skill already used this turn (1 skill limit)
  if (turnUnit.skillUsedThisTurn) return;

  // Check range
  const dist = Math.abs(turnUnit.row - target.row) + Math.abs(turnUnit.col - target.col);
  let effectiveRange = skill.range;
  if (turnUnit.passiveId === "tracker") effectiveRange += 1;
  
  // Self-target check
  if (skill.selfTarget && target !== turnUnit) return;
  
  if (dist > effectiveRange) return;

  // Check invulnerability
  if (target.invulnerable) {
    addLog(state, `${getUnitDisplayName(target)} phases through the attack, unharmed!`, "info");
    state.actionMode = "idle";
    state.selectedAction = null;
    return;
  }

  // AoE attack: hit all enemies within radius of target
  if (skill.aoe && skill.type === "attack") {
    turnUnit.skillUsedThisTurn = true;
    executeAoeAttack(state, turnUnit, skill, skillId, target);
    state.actionMode = "idle";
    state.selectedAction = null;
    return;
  }

  // Heal check: must be an ally
  if (skill.type === "heal" && !isOwnUnit(turnUnit, target)) return;
  // Attack check: must be an enemy
  if (skill.type === "attack" && isOwnUnit(turnUnit, target)) return;

  // Mark skill as used this turn
  turnUnit.skillUsedThisTurn = true;

  // Apply damage / heal
  if (skill.type === "attack") {
    const damage = calculateDamage(turnUnit, target, skillId);
    target.currentHp -= damage;
    turnUnit.ap -= skill.cost;

    addLog(state, `${getUnitDisplayName(turnUnit)} uses ${skill.name} on ${getUnitDisplayName(target)} for ${damage} damage!`, "damage");

    // Check for kill
    if (target.currentHp <= 0) {
      target.currentHp = 0;
      addLog(state, `${getUnitDisplayName(target)} is defeated!`, "damage");
      // Bloodthirsty heal
      if (turnUnit.passiveId === "bloodthirsty") {
        const maxHp = getUnitMaxHp(turnUnit);
        turnUnit.currentHp = Math.min(turnUnit.currentHp + 1, maxHp);
        addLog(state, `${getUnitDisplayName(turnUnit)} heals 1 HP from Bloodthirsty!`, "heal");
      }
      // Check for win
      checkVictory(state);
    }

    // Poison: apply poison to target
    if (skillId === "poison_blade") {
      target.poisonTurns = 2;
      addLog(state, `${getUnitDisplayName(target)} is poisoned!`, "damage");
    }
  } else if (skill.type === "heal") {
    const healAmount = skill.healAmount || 4;
    const maxHp = getUnitMaxHp(target);
    const actualHeal = Math.min(healAmount, maxHp - target.currentHp);
    target.currentHp += actualHeal;
    turnUnit.ap -= skill.cost;
    addLog(state, `${getUnitDisplayName(turnUnit)} uses ${skill.name} on ${getUnitDisplayName(target)}, restoring ${actualHeal} HP!`, "heal");
  } else if (skill.type === "buff") {
    turnUnit.ap -= skill.cost;
    if (skill.grantsInvulnerability) {
      turnUnit.invulnerable = true;
      addLog(state, `${getUnitDisplayName(turnUnit)} phases out of reality, becoming invulnerable until their next turn!`, "info");
    }
    addLog(state, `${getUnitDisplayName(turnUnit)} uses ${skill.name}!`, "info");
  } else if (skill.type === "movement") {
    // Shadow Step: teleport to any empty tile within range 3
    const range = 3;
    // Find nearest valid target (the tile the player clicked should be within range and empty)
    const dist = Math.abs(turnUnit.row - target.row) + Math.abs(turnUnit.col - target.col);
    if (dist > range) return;
    if (state.board[target.row][target.col] !== null) return;

    turnUnit.ap -= skill.cost;
    state.board[turnUnit.row][turnUnit.col] = null;
    turnUnit.row = target.row;
    turnUnit.col = target.col;
    state.board[target.row][target.col] = turnUnit;
    addLog(state, `${getUnitDisplayName(turnUnit)} teleports to (${target.row},${target.col})!`, "info");
  }

  state.actionMode = "idle";
  state.selectedAction = null;
}

export function executeAoeAttack(state: GameState, attacker: PlacedUnit, skill: SkillDef, skillId: string, center: PlacedUnit): void {
  const radius = skill.aoe!;
  let totalDamage = 0;
  let hitCount = 0;

  for (let r = 0; r < BOARD_ROWS; r++) {
    for (let c = 0; c < BOARD_COLS; c++) {
      const target = state.board[r][c];
      if (!target || isOwnUnit(attacker, target) || target.invulnerable) continue;
      if (Math.abs(r - center.row) + Math.abs(c - center.col) > radius) continue;

      const damage = calculateDamage(attacker, target, skillId);
      target.currentHp -= damage;
      totalDamage += damage;
      hitCount++;

      addLog(state, `${getUnitDisplayName(target)} takes ${damage} damage from ${skill.name}!`, "damage");

      if (target.currentHp <= 0) {
        target.currentHp = 0;
        addLog(state, `${getUnitDisplayName(target)} is defeated!`, "damage");
        if (attacker.passiveId === "bloodthirsty") {
          const maxHp = getUnitMaxHp(attacker);
          attacker.currentHp = Math.min(attacker.currentHp + 1, maxHp);
          addLog(state, `${getUnitDisplayName(attacker)} heals 1 HP from Bloodthirsty!`, "heal");
        }
        checkVictory(state);
      }
    }
  }

  addLog(state, `${getUnitDisplayName(attacker)} uses ${skill.name}! ${hitCount} enemies hit for ${totalDamage} total damage.`, "damage");
}

export function getTurnUnit(state: GameState): PlacedUnit | null {
  if (state.currentTurnIndex >= state.turnOrder.length) return null;
  const { playerIndex, unitIndex } = state.turnOrder[state.currentTurnIndex];
  const team = playerIndex === 0 ? state.p1Team.placed : state.p2Team.placed;
  if (unitIndex >= team.length) return null;
  const unit = team[unitIndex];
  // Skip dead units
  if (unit.currentHp <= 0) return null;
  return unit;
}

export function advanceTurn(state: GameState): void {
  state.currentTurnIndex++;

  // Check if we've gone through all units
  if (state.currentTurnIndex >= state.turnOrder.length) {
    // New round - add AP, tick buffs, apply poison
    for (const entry of state.turnOrder) {
      const unit = getUnitByRef(entry.playerIndex, entry.unitIndex, state.p1Team.placed, state.p2Team.placed);
      if (!unit || unit.currentHp <= 0) continue;

      // Add AP (cumulative, capped at MAX_AP)
      let apGain = 1;
      if (unit.passiveId === "desperate") apGain += 1;
      unit.ap = Math.min(unit.ap + apGain, 6);
      unit.skillUsedThisTurn = false;

      // Apply poison
      if (unit.poisonTurns > 0) {
        unit.currentHp -= 2;
        unit.poisonTurns--;
        addLog(state, `${getUnitDisplayName(unit)} takes 2 poison damage!`, "damage");
        if (unit.currentHp <= 0) {
          unit.currentHp = 0;
          addLog(state, `${getUnitDisplayName(unit)} succumbs to poison!`, "damage");
        }
      }
    }
    state.currentTurnIndex = 0;
    checkVictory(state);
    if (state.screen === "victory") return;
  }

  // Find next living unit
  let attempts = 0;
  while (attempts < state.turnOrder.length) {
    const next = state.turnOrder[state.currentTurnIndex % state.turnOrder.length];
    const unit = getUnitByRef(next.playerIndex, next.unitIndex, state.p1Team.placed, state.p2Team.placed);
    if (unit && unit.currentHp > 0) {
      // Reset invulnerability at start of turn
      unit.invulnerable = false;
      addLog(state, `${getUnitDisplayName(unit)}'s turn.`, "info");
      return;
    }
    state.currentTurnIndex++;
    attempts++;
  }
}

function checkVictory(state: GameState): void {
  const p1Alive = state.p1Team.placed.some((u) => u.currentHp > 0);
  const p2Alive = state.p2Team.placed.some((u) => u.currentHp > 0);

  if (!p1Alive && !p2Alive) {
    state.screen = "victory";
    state.winner = -1; // draw
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
