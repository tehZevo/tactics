// ============================================================
//  STATE / COMBAT — attack, heal, buff, and skill actions
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
  calculateDamage,
  getEffectiveStats,
  getUnitMaxHp,
  getUnitDisplayName,
  getPlayerIndex,
  isOwnUnit,
  checkVictory,
  addLog,
} from "./helpers.js";
import { getTurnUnit } from "./turns.js";

export function executeAttack(state: GameState, skillId: string, target: PlacedUnit): void {
  const turnUnit = getTurnUnit(state);
  if (!turnUnit) return;

  const skill = SKILL_DEFS[skillId];
  if (turnUnit.ap < skill.cost) return;
  if (turnUnit.skillUsedThisTurn) return;

  const dist = Math.abs(turnUnit.row - target.row) + Math.abs(turnUnit.col - target.col);
  let effectiveRange = skill.range;
  if (turnUnit.passiveId === "tracker") effectiveRange += 1;

  if (skill.selfTarget && target !== turnUnit) return;
  if (dist > effectiveRange) return;

  if (target.invulnerable) {
    addLog(state, `${getUnitDisplayName(target)} phases through the attack, unharmed!`, "info");
    state.actionMode = "idle";
    state.selectedAction = null;
    return;
  }

  // AoE attack: hit all enemies within radius of target
  if (skill.aoe && skill.type === "attack") {
    turnUnit.skillUsedThisTurn = true;
    const displacement = Math.abs(turnUnit.row - turnUnit.turnStartRow) + Math.abs(turnUnit.col - turnUnit.turnStartCol);
    turnUnit.movement -= displacement;
    turnUnit.ap -= skill.cost;
    executeAoeAttack(state, turnUnit, skill, skillId, target);
    state.actionMode = "idle";
    state.selectedAction = null;
    return;
  }

  // Heal check: must be an ally
  if (skill.type === "heal" && !isOwnUnit(turnUnit, target)) return;
  // Attack check: must be an enemy
  if (skill.type === "attack" && isOwnUnit(turnUnit, target)) return;

  turnUnit.skillUsedThisTurn = true;
  const displacement = Math.abs(turnUnit.row - turnUnit.turnStartRow) + Math.abs(turnUnit.col - turnUnit.turnStartCol);
  turnUnit.movement -= displacement;

  if (skill.type === "attack") {
    const damage = calculateDamage(turnUnit, target, skillId);
    target.currentHp -= damage;
    turnUnit.ap -= skill.cost;

    addLog(state, `${getUnitDisplayName(turnUnit)} uses ${skill.name} on ${getUnitDisplayName(target)} for ${damage} damage!`, "damage");

    if (skill.selfDamage) {
      turnUnit.currentHp -= skill.selfDamage;
      if (turnUnit.currentHp <= 0) {
        turnUnit.currentHp = 0;
        state.board[turnUnit.row][turnUnit.col] = null;
        addLog(state, `${getUnitDisplayName(turnUnit)} was consumed by their own attack!`, "damage");
      } else {
        addLog(state, `${getUnitDisplayName(turnUnit)} takes ${skill.selfDamage} self damage!`, "damage");
      }
    }

    if (target.currentHp <= 0) {
      target.currentHp = 0;
      state.board[target.row][target.col] = null;
      addLog(state, `${getUnitDisplayName(target)} is defeated!`, "damage");
      if (turnUnit.passiveId === "bloodthirsty") {
        const maxHp = getUnitMaxHp(turnUnit);
        turnUnit.currentHp = Math.min(turnUnit.currentHp + 1, maxHp);
        addLog(state, `${getUnitDisplayName(turnUnit)} heals 1 HP from Bloodthirsty!`, "heal");
      }
      checkVictory(state);
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
    turnUnit.ap -= skill.cost;
    if (skill.swapTarget) {
      // Swap: swap positions with target unit
      const targetRow = target.row;
      const targetCol = target.col;

      state.board[turnUnit.row][turnUnit.col] = null;
      state.board[target.row][target.col] = null;

      const tempRow = turnUnit.row;
      const tempCol = turnUnit.col;
      turnUnit.row = targetRow;
      turnUnit.col = targetCol;
      target.row = tempRow;
      target.col = tempCol;

      state.board[turnUnit.row][turnUnit.col] = turnUnit;
      state.board[target.row][target.col] = target;

      const turnTeam = getPlayerIndex(turnUnit);
      const targetTeam = getPlayerIndex(target);
      const isAlly = turnTeam === targetTeam;
      addLog(state, `${getUnitDisplayName(turnUnit)} swaps with ${getUnitDisplayName(target)}${isAlly ? " (ally)" : " (enemy)"}`);

    } else {
      // Shadow Step: teleport to any empty tile within range 3
      const range = 3;
      const dist = Math.abs(turnUnit.row - target.row) + Math.abs(turnUnit.col - target.col);
      if (dist > range) return;
      if (state.board[target.row][target.col] !== null) return;

      state.board[turnUnit.row][turnUnit.col] = null;
      turnUnit.row = target.row;
      turnUnit.col = target.col;
      state.board[target.row][target.col] = turnUnit;
      addLog(state, `${getUnitDisplayName(turnUnit)} teleports to (${target.row},${target.col})!`, "info");
    }

  } else if (skill.type === "apDrain") {
    turnUnit.ap -= skill.cost;
    const drainAmount = skill.apDrain || 1;
    const actualDrain = Math.min(drainAmount, target.ap);
    target.ap -= actualDrain;
    turnUnit.ap += actualDrain;
    addLog(state, `${getUnitDisplayName(turnUnit)} uses ${skill.name} on ${getUnitDisplayName(target)}, stealing ${actualDrain} AP!`, "info");
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
        state.board[target.row][target.col] = null;
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


