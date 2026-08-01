import {
  BOARD_COLS,
  BOARD_ROWS,
} from "../../data/index.js";
import { SKILL_DEFS } from "../../data/index.js";
import type { SkillDef } from "../../data/skills.js";
import type { SkillApplyFn } from "../../data/skills.js";
import type { GameState, PlacedUnit } from "../types.js";
import { getTurnUnit } from "../turns.js";
import {
  calculateDamage,
  getReachableTiles,
  getUnitMaxHp,
  getUnitDisplayName,
  getPlayerIndex,
  isOwnUnit,
  addLog,
  findUnitRef,
  finalizeMove,
  getUnitDisplayPos,
} from "../helpers.js";
import {
  prepareSkillUse,
  clearActionMode,
  checkVictory,
  validateRange,
  applyBloodthirsty,
} from "./helpers.js";

export const singleTargetAttack: SkillApplyFn = (state, caster, target, skillId) => {
  if (!target) return;
  const skill = SKILL_DEFS[skillId];
  if (!validateRange(caster, target, skill, state)) return;
  if (target.invulnerable) {
    addLog(state, `${getUnitDisplayName(target)} phases through the attack, unharmed!`, "info");
    clearActionMode(state);
    return;
  }
  if (isOwnUnit(caster, target)) return;

  const damage = calculateDamage(caster, target, skillId);
  target.currentHp -= damage;
  addLog(state, `${getUnitDisplayName(caster)} uses ${skill.name} on ${getUnitDisplayName(target)} for ${damage} damage!`, "damage");

  if (skill.selfDamage) {
    caster.currentHp -= skill.selfDamage;
    if (caster.currentHp <= 0) {
      caster.currentHp = 0;
      state.board[caster.row][caster.col] = null;
      addLog(state, `${getUnitDisplayName(caster)} was consumed by their own attack!`, "damage");
    } else {
      addLog(state, `${getUnitDisplayName(caster)} takes ${skill.selfDamage} self damage!`, "damage");
    }
  }

  if (target.currentHp <= 0) {
    target.currentHp = 0;
    state.board[target.row][target.col] = null;
    addLog(state, `${getUnitDisplayName(target)} is defeated!`, "damage");
    applyBloodthirsty(caster, state);
    checkVictory(state);
  }

  clearActionMode(state);
};

export const aoeAttack: SkillApplyFn = (state, caster, target, skillId) => {
  if (!target) return;
  const skill = SKILL_DEFS[skillId];
  if (target.invulnerable) {
    addLog(state, `${getUnitDisplayName(target)} phases through the attack, unharmed!`, "info");
    clearActionMode(state);
    return;
  }

  const radius = skill.aoe!;
  let totalDamage = 0;
  let hitCount = 0;

  for (let r = 0; r < BOARD_ROWS; r++) {
    for (let c = 0; c < BOARD_COLS; c++) {
      const t = state.board[r][c];
      if (!t || isOwnUnit(caster, t) || t.invulnerable) continue;
      if (Math.abs(r - target.row) + Math.abs(c - target.col) > radius) continue;

      const damage = calculateDamage(caster, t, skillId);
      t.currentHp -= damage;
      totalDamage += damage;
      hitCount++;

      addLog(state, `${getUnitDisplayName(t)} takes ${damage} damage from ${skill.name}!`, "damage");

      if (t.currentHp <= 0) {
        t.currentHp = 0;
        state.board[t.row][t.col] = null;
        addLog(state, `${getUnitDisplayName(t)} is defeated!`, "damage");
        applyBloodthirsty(caster, state);
        checkVictory(state);
      }
    }
  }

  addLog(state, `${getUnitDisplayName(caster)} uses ${skill.name}! ${hitCount} enemies hit for ${totalDamage} total damage.`, "damage");
  clearActionMode(state);
};

export const heal: SkillApplyFn = (state, caster, target, skillId) => {
  if (!target) return;
  const skill = SKILL_DEFS[skillId];
  if (!validateRange(caster, target, skill, state)) return;
  if (!isOwnUnit(caster, target)) return;

  const healAmount = skill.healAmount || 4;
  const maxHp = getUnitMaxHp(target);
  const actualHeal = Math.min(healAmount, maxHp - target.currentHp);
  target.currentHp += actualHeal;
  addLog(state, `${getUnitDisplayName(caster)} uses ${skill.name} on ${getUnitDisplayName(target)}, restoring ${actualHeal} HP!`, "heal");

  clearActionMode(state);
};

export const buff: SkillApplyFn = (state, caster, _target, skillId) => {
  const skill = SKILL_DEFS[skillId];
  if (!prepareSkillUse(state, caster, skill)) return;

  if (skill.grantsInvulnerability) {
    caster.invulnerable = true;
    addLog(state, `${getUnitDisplayName(caster)} phases out of reality, becoming invulnerable until their next turn!`, "info");
  }
  addLog(state, `${getUnitDisplayName(caster)} uses ${skill.name}!`, "info");

  clearActionMode(state);
};

export const focusEffect: SkillApplyFn = (state, caster, _target, skillId) => {
  const skill = SKILL_DEFS[skillId];
  if (!prepareSkillUse(state, caster, skill)) return;

  caster.focusCharges = (caster.focusCharges || 0) + 1;
  addLog(state, `${getUnitDisplayName(caster)} centers their mind. +1 AP next turn.`, "info");

  clearActionMode(state);
};

export const repositionEffect: SkillApplyFn = (state, caster, target, skillId) => {
  const skill = SKILL_DEFS[skillId];
  if (!prepareSkillUse(state, caster, skill)) return;
  if (!target || !isOwnUnit(caster, target)) return;

  const dist = Math.abs(caster.row - target.row) + Math.abs(caster.col - target.col);
  if (dist > skill.range) return;

  state.selectedAction = { type: "reposition", target: target, skillId: skillId };
  state.actionMode = "selectTarget";
  clearActionMode(state);
};

export const executeReposition: SkillApplyFn = (state, caster, _target, skillId, location) => {
  if (!location) return;
  const action = state.selectedAction;
  if (!action || action.type !== "reposition") return;

  const target = action.target;
  if (!target || state.board[target.row][target.col] !== target) return;

  const dist = Math.abs(caster.row - location.row) + Math.abs(caster.col - location.col);
  if (dist > 2) return;
  if (state.board[location.row][location.col] !== null) return;

  state.board[caster.row][caster.col] = null;
  state.board[target.row][target.col] = null;
  state.board[location.row][location.col] = target;
  target.row = location.row;
  target.col = location.col;

  addLog(state, `${getUnitDisplayName(caster)} repositions ${getUnitDisplayName(target)} to (${location.row},${location.col})!`, "info");

  state.selectedAction = null;
  state.actionMode = "idle";
};

export const movementSwap: SkillApplyFn = (state, caster, target, skillId) => {
  if (!target) return;
  const skill = SKILL_DEFS[skillId];
  if (!prepareSkillUse(state, caster, skill)) return;
  if (!validateRange(caster, target, skill, state)) return;

  const targetRow = target.row;
  const targetCol = target.col;

  state.board[caster.row][caster.col] = null;
  state.board[target.row][target.col] = null;

  const tempRow = caster.row;
  const tempCol = caster.col;
  caster.row = targetRow;
  caster.col = targetCol;
  target.row = tempRow;
  target.col = tempCol;

  state.board[caster.row][caster.col] = caster;
  state.board[target.row][target.col] = target;

  const turnTeam = getPlayerIndex(caster);
  const targetTeam = getPlayerIndex(target);
  const isAlly = turnTeam === targetTeam;
  addLog(state, `${getUnitDisplayName(caster)} swaps with ${getUnitDisplayName(target)}${isAlly ? " (ally)" : " (enemy)"}`);

  clearActionMode(state);
};

export const movementTeleport: SkillApplyFn = (state, caster, target, skillId) => {
  if (!target) return;
  const skill = SKILL_DEFS[skillId];
  if (!prepareSkillUse(state, caster, skill)) return;

  const range = 3;
  const dist = Math.abs(caster.row - target.row) + Math.abs(caster.col - target.col);
  if (dist > range) return;
  if (state.board[target.row][target.col] !== null) return;

  state.board[caster.row][caster.col] = null;
  caster.row = target.row;
  caster.col = target.col;
  state.board[target.row][target.col] = caster;
  addLog(state, `${getUnitDisplayName(caster)} teleports to (${target.row},${target.col})!`, "info");

  clearActionMode(state);
};

export const apDrain: SkillApplyFn = (state, caster, target, skillId) => {
  if (!target) return;
  const skill = SKILL_DEFS[skillId];
  if (!prepareSkillUse(state, caster, skill)) return;
  if (!validateRange(caster, target, skill, state)) return;
  if (isOwnUnit(caster, target)) return;

  const drainAmount = skill.apDrain || 1;
  const actualDrain = Math.min(drainAmount, target.ap);
  target.ap -= actualDrain;
  caster.ap += actualDrain;
  addLog(state, `${getUnitDisplayName(caster)} uses ${skill.name} on ${getUnitDisplayName(target)}, stealing ${actualDrain} AP!`, "info");

  clearActionMode(state);
};

export const leapEffect: SkillApplyFn = (state, caster, _target, _skillId, location) => {
  if (!location) return;
  const skill = SKILL_DEFS[_skillId];
  if (!prepareSkillUse(state, caster, skill)) return;

  const leapBonus = caster.leapBonus || 0;
  if (leapBonus <= 0) return;

  const reachable = getReachableTiles(state, caster);
  if (!reachable.has(`${location.row},${location.col}`)) return;
  if (state.board[location.row][location.col] !== null) return;

  state.board[caster.row][caster.col] = null;
  caster.row = location.row;
  caster.col = location.col;
  state.board[location.row][location.col] = caster;
  caster.leapBonus = 0;
  addLog(state, `${getUnitDisplayName(caster)} leaps to (${location.row},${location.col})!`);

  clearActionMode(state);
};

export const leapStrikeEffect: SkillApplyFn = (state, caster, _target, skillId, location) => {
  if (!location) return;
  const skill = SKILL_DEFS[skillId];
  if (!prepareSkillUse(state, caster, skill)) return;

  // Validate range (range 2)
  const dist = Math.abs(location.row - caster.row) + Math.abs(location.col - caster.col);
  if (dist > skill.range!) return;
  if (state.board[location.row][location.col] !== null) return;

  // Move caster to target location
  state.board[caster.row][caster.col] = null;
  caster.row = location.row;
  caster.col = location.col;
  state.board[location.row][location.col] = caster;
  addLog(state, `${getUnitDisplayName(caster)} leaps to (${location.row},${location.col})!`);

  // Deal AoE damage to enemies in radius 1 of landing spot
  const radius = skill.aoe!;
  const damage = skill.damage!;
  let hitCount = 0;

  for (let r = 0; r < BOARD_ROWS; r++) {
    for (let c = 0; c < BOARD_COLS; c++) {
      const t = state.board[r][c];
      if (!t || isOwnUnit(caster, t) || t.invulnerable) continue;
      if (Math.abs(r - location.row) + Math.abs(c - location.col) > radius) continue;

      t.currentHp -= damage;
      hitCount++;

      addLog(state, `${getUnitDisplayName(t)} takes ${damage} damage from ${skill.name}!`, "damage");

      if (t.currentHp <= 0) {
        t.currentHp = 0;
        state.board[t.row][t.col] = null;
        addLog(state, `${getUnitDisplayName(t)} is defeated!`, "damage");
        applyBloodthirsty(caster, state);
        checkVictory(state);
      }
    }
  }

  addLog(state, `${getUnitDisplayName(caster)} uses ${skill.name}! ${hitCount} enemies hit for ${damage * hitCount} total damage.`, "damage");
  clearActionMode(state);
};

export const reorderTurn: SkillApplyFn = (state, caster, target, skillId) => {
  if (!target) return;
  const skill = SKILL_DEFS[skillId];
  if (!prepareSkillUse(state, caster, skill)) return;
  if (!validateRange(caster, target, skill, state)) return;

  const casterRef = findUnitRef(caster, state.p1Team.placed, state.p2Team.placed);
  const targetRef = findUnitRef(target, state.p1Team.placed, state.p2Team.placed);
  if (!casterRef || !targetRef) return;

  const casterIndex = state.turnOrder.findIndex(
    e => e.playerIndex === casterRef!.playerIndex && e.unitIndex === casterRef!.unitIndex
  );
  const targetIndex = state.turnOrder.findIndex(
    e => e.playerIndex === targetRef!.playerIndex && e.unitIndex === targetRef!.unitIndex
  );
  if (casterIndex === -1 || targetIndex === -1) return;
  if (casterIndex === targetIndex) {
    addLog(state, `${getUnitDisplayName(caster)} uses ${skill.name}, but the target is already next in line!`, "info");
    clearActionMode(state);
    return;
  }

  const [targetEntry] = state.turnOrder.splice(targetIndex, 1);
  const insertAt = casterIndex + 1;
  state.turnOrder.splice(insertAt, 0, targetEntry);

  addLog(state, `${getUnitDisplayName(caster)} uses ${skill.name}! ${getUnitDisplayName(target)} will act right after you!`, "info");

  clearActionMode(state);
};

export const poisonAttack: SkillApplyFn = (state, caster, target, skillId) => {
  if (!target) return;
  const skill = SKILL_DEFS[skillId];
  if (!prepareSkillUse(state, caster, skill)) return;
  if (!validateRange(caster, target, skill, state)) return;
  if (target.invulnerable) {
    addLog(state, `${getUnitDisplayName(target)} phases through the attack, unharmed!`, "info");
    clearActionMode(state);
    return;
  }
  if (isOwnUnit(caster, target)) return;

  const damage = calculateDamage(caster, target, skillId);
  target.currentHp -= damage;
  const poisonDur = skill.poisonTurns || 2;
  target.poisonTurns = (target.poisonTurns || 0) + poisonDur;
  addLog(state, `${getUnitDisplayName(caster)} uses ${skill.name} on ${getUnitDisplayName(target)} for ${damage} damage! They are poisoned for ${poisonDur} turns!`, "damage");

  if (target.currentHp <= 0) {
    target.currentHp = 0;
    state.board[target.row][target.col] = null;
    addLog(state, `${getUnitDisplayName(target)} is defeated!`, "damage");
    applyBloodthirsty(caster, state);
    checkVictory(state);
  }

  clearActionMode(state);
};

export const cleanseEffect: SkillApplyFn = (state, caster, target, skillId) => {
  if (!target) return;
  const skill = SKILL_DEFS[skillId];
  if (!prepareSkillUse(state, caster, skill)) return;
  if (!validateRange(caster, target, skill, state)) return;
  if (!isOwnUnit(caster, target)) return;

  if (target.poisonTurns > 0) {
    addLog(state, `${getUnitDisplayName(caster)} uses ${skill.name} on ${getUnitDisplayName(target)}, clearing their poison!`, "heal");
  }
  target.poisonTurns = 0;

  clearActionMode(state);
};

export const berserkEffect: SkillApplyFn = (state, caster, _target, skillId) => {
  const skill = SKILL_DEFS[skillId];
  if (!prepareSkillUse(state, caster, skill)) return;

  const duration = skill.buffDuration || 2;
  caster.buffTurns = (caster.buffTurns || 0) + duration;
  addLog(state, `${getUnitDisplayName(caster)} enters a berserk rage! +1 attack, -1 defense for ${duration} turns!`, "info");

  clearActionMode(state);
};

// ============================================================
//  flameRune
// ============================================================
export const flameRuneEffect: SkillApplyFn = (state, caster, target, skillId) => {
  const skill = SKILL_DEFS[skillId];
  if (!prepareSkillUse(state, caster, skill)) return;

  const runeRow = target?.row ?? caster.row;
  const runeCol = target?.col ?? caster.col;
  const duration = skill.runeTurns || 3;

  const existingRune = state.runeEffects.find(
    r => r.row === runeRow && r.col === runeCol && r.type === "flame" && r.playerIndex === caster.playerIndex
  );

  if (existingRune) {
    existingRune.turns = duration;
    addLog(state, `${getUnitDisplayName(caster)} refreshes the Flame Rune at (${runeRow}, ${runeCol})!`, "info");
  } else {
    state.runeEffects.push({ row: runeRow, col: runeCol, turns: duration, type: "flame", playerIndex: caster.playerIndex });
    addLog(state, `${getUnitDisplayName(caster)} places a Flame Rune at (${runeRow}, ${runeCol})! Enemies standing on it take 1 damage at end of turn.`, "info");
  }

  clearActionMode(state);
};

// ============================================================
//  windRune
// ============================================================
export const windRuneEffect: SkillApplyFn = (state, caster, target, skillId) => {
  const skill = SKILL_DEFS[skillId];
  if (!prepareSkillUse(state, caster, skill)) return;

  const runeRow = target?.row ?? caster.row;
  const runeCol = target?.col ?? caster.col;
  const duration = skill.runeTurns || 4;

  const existingRune = state.runeEffects.find(
    r => r.row === runeRow && r.col === runeCol && r.type === "wind" && r.playerIndex === caster.playerIndex
  );

  if (existingRune) {
    existingRune.turns = duration;
    addLog(state, `${getUnitDisplayName(caster)} refreshes the Wind Rune at (${runeRow}, ${runeCol})!`, "info");
  } else {
    state.runeEffects.push({ row: runeRow, col: runeCol, turns: duration, type: "wind", playerIndex: caster.playerIndex });
    addLog(state, `${getUnitDisplayName(caster)} places a Wind Rune at (${runeRow}, ${runeCol})! Units starting their turn on it gain +1 movement.`, "info");
  }

  clearActionMode(state);
};

// ============================================================
//  earthRune
// ============================================================
export const earthRuneEffect: SkillApplyFn = (state, caster, target, skillId) => {
  const skill = SKILL_DEFS[skillId];
  if (!prepareSkillUse(state, caster, skill)) return;

  const runeRow = target?.row ?? caster.row;
  const runeCol = target?.col ?? caster.col;
  const duration = skill.runeTurns || 4;

  const existingRune = state.runeEffects.find(
    r => r.row === runeRow && r.col === runeCol && r.type === "earth" && r.playerIndex === caster.playerIndex
  );

  if (existingRune) {
    existingRune.turns = duration;
    addLog(state, `${getUnitDisplayName(caster)} refreshes the Earth Rune at (${runeRow}, ${runeCol})!`, "info");
  } else {
    state.runeEffects.push({ row: runeRow, col: runeCol, turns: duration, type: "earth", playerIndex: caster.playerIndex });
    addLog(state, `${getUnitDisplayName(caster)} places an Earth Rune at (${runeRow}, ${runeCol})! Units ending their turn on it gain +1 defense.`, "info");
  }

  clearActionMode(state);
};

// ============================================================
//  darknessRune
// ============================================================
export const darknessRuneEffect: SkillApplyFn = (state, caster, target, skillId) => {
  const skill = SKILL_DEFS[skillId];
  if (!prepareSkillUse(state, caster, skill)) return;

  const runeRow = target?.row ?? caster.row;
  const runeCol = target?.col ?? caster.col;
  const duration = skill.runeTurns || 3;

  const existingRune = state.runeEffects.find(
    r => r.row === runeRow && r.col === runeCol && r.type === "darkness" && r.playerIndex === caster.playerIndex
  );

  if (existingRune) {
    existingRune.turns = duration;
    addLog(state, `${getUnitDisplayName(caster)} refreshes the Darkness Rune at (${runeRow}, ${runeCol})!`, "info");
  } else {
    state.runeEffects.push({ row: runeRow, col: runeCol, turns: duration, type: "darkness", playerIndex: caster.playerIndex });
    addLog(state, `${getUnitDisplayName(caster)} places a Darkness Rune at (${runeRow}, ${runeCol})! Ranged attacks lose 1 range (minimum 1).`, "info");
  }

  clearActionMode(state);
};

// ============================================================
//  getEffectiveRange
// ============================================================
export function getEffectiveRange(unit: PlacedUnit, state: GameState, skill: SkillDef): number {
  let effectiveRange = skill.range;

  // Check if unit is standing on an enemy darkness rune
  const darknessRune = state.runeEffects.find(
    r => r.row === unit.row && r.col === unit.col && r.type === "darkness" && r.playerIndex !== unit.playerIndex
  );

  if (darknessRune) {
    // Physical attacks (range <= 1) should not be affected
    if (skill.range > 1) {
      effectiveRange = Math.max(1, effectiveRange - 1);
    }
  }

  return effectiveRange;
}

export function executeAttack(state: GameState, skillId: string, target: PlacedUnit): void {
  const turnUnit = getTurnUnit(state);
  if (!turnUnit) return;

  const skill = SKILL_DEFS[skillId];
  if (turnUnit.ap < skill.cost) return;
  if (turnUnit.skillUsedThisTurn) return;

  // Finalize tentative move before skill use
  if (turnUnit.tentativeRow !== undefined && turnUnit.tentativeCol !== undefined) {
    finalizeMove(state, turnUnit);
  }

  const startPos = getUnitDisplayPos(turnUnit);
  const dist = Math.abs(startPos.row - target.row) + Math.abs(startPos.col - target.col);
  let effectiveRange = getEffectiveRange(turnUnit, state, skill);
  if (turnUnit.passiveId === "tracker") effectiveRange += 1;

  if (skill.selfTarget && target !== turnUnit) return;
  if (dist > effectiveRange) return;

  if (target.invulnerable) {
    addLog(state, `${getUnitDisplayName(target)} phases through the attack, unharmed!`, "info");
    state.actionMode = "idle";
    state.selectedAction = null;
    return;
  }

  turnUnit.skillUsedThisTurn = true;
  const displacement = Math.abs(turnUnit.row - turnUnit.turnStartRow) + Math.abs(turnUnit.col - turnUnit.turnStartCol);
  turnUnit.movement -= displacement;

  if (skill.type === "attack") {
    if (skill.aoe && skill.aoe > 0) {
      turnUnit.ap -= skill.cost;
      aoeAttack(state, turnUnit, target, skillId);
      state.actionMode = "idle";
      state.selectedAction = null;
      return;
    }
    turnUnit.ap -= skill.cost;
    singleTargetAttack(state, turnUnit, target, skillId);
  } else if (skill.type === "heal") {
    if (!isOwnUnit(turnUnit, target)) return;
    turnUnit.ap -= skill.cost;
    heal(state, turnUnit, target, skillId);
  } else if (skill.type === "buff") {
    turnUnit.ap -= skill.cost;
    if (skill.grantsInvulnerability) {
      turnUnit.invulnerable = true;
      addLog(state, `${getUnitDisplayName(turnUnit)} phases out of reality, becoming invulnerable until their next turn!`, "info");
    }
    if (skill.reorderTarget) {
      reorderTurn(state, turnUnit, target, skillId);
    } else {
      addLog(state, `${getUnitDisplayName(turnUnit)} uses ${skill.name}!`, "info");
      clearActionMode(state);
    }
  } else if (skill.type === "movement") {
    turnUnit.ap -= skill.cost;
    if (skill.swapTarget) {
      movementSwap(state, turnUnit, target, skillId);
    } else if (skill.selfTarget) {
      movementTeleport(state, turnUnit, target, skillId);
    } else {
      addLog(state, `${getUnitDisplayName(turnUnit)} uses ${skill.name}!`, "info");
      clearActionMode(state);
    }
  } else if (skill.type === "apDrain") {
    if (isOwnUnit(turnUnit, target)) return;
    turnUnit.ap -= skill.cost;
    apDrain(state, turnUnit, target, skillId);
  }

  state.actionMode = "idle";
  state.selectedAction = null;
}

export function executeAoeAttack(state: GameState, attacker: PlacedUnit, skill: SkillDef, skillId: string, center: PlacedUnit): void {
  aoeAttack(state, attacker, center, skillId);
}
