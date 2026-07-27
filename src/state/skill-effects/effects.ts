import {
  BOARD_COLS,
  BOARD_ROWS,
} from "../../data/index.js";
import { SKILL_DEFS } from "../../data/index.js";
import type { SkillApplyFn } from "../../data/skills.js";
import type { GameState, PlacedUnit } from "../types.js";
import {
  calculateDamage,
  getReachableTiles,
  getUnitMaxHp,
  getUnitDisplayName,
  getPlayerIndex,
  isOwnUnit,
  addLog,
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
  if (!prepareSkillUse(state, caster, skill)) return;
  if (!validateRange(caster, target, skill)) return;
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
  if (!prepareSkillUse(state, caster, skill)) return;
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
  if (!prepareSkillUse(state, caster, skill)) return;
  if (!validateRange(caster, target, skill)) return;
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

export const movementSwap: SkillApplyFn = (state, caster, target, skillId) => {
  if (!target) return;
  const skill = SKILL_DEFS[skillId];
  if (!prepareSkillUse(state, caster, skill)) return;
  if (!validateRange(caster, target, skill)) return;

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
  if (!validateRange(caster, target, skill)) return;
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
