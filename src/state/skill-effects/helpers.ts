import { SKILL_DEFS } from "../../data/index.js";
import type { SkillDef } from "../../data/skills.js";
import type { GameState, PlacedUnit } from "../types.js";
import {
  getUnitMaxHp,
  getUnitDisplayName,
  addLog,
} from "../helpers.js";

export function prepareSkillUse(state: GameState, caster: PlacedUnit, skill: SkillDef): boolean {
  if (caster.ap < skill.cost) return false;
  if (caster.skillUsedThisTurn) return false;
  caster.skillUsedThisTurn = true;
  const displacement = Math.abs(caster.row - caster.turnStartRow) + Math.abs(caster.col - caster.turnStartCol);
  caster.movement -= displacement;
  caster.ap -= skill.cost;
  return true;
}

export function clearActionMode(state: GameState): void {
  state.actionMode = "idle";
  state.selectedAction = null;
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

export function validateRange(caster: PlacedUnit, target: PlacedUnit, skill: SkillDef): boolean {
  const dist = Math.abs(caster.row - target.row) + Math.abs(caster.col - target.col);
  let effectiveRange = skill.range;
  if (caster.passiveId === "tracker") effectiveRange += 1;
  if (skill.selfTarget && target !== caster) return false;
  return dist <= effectiveRange;
}

export function applyBloodthirsty(caster: PlacedUnit, state: GameState): void {
  if (caster.passiveId === "bloodthirsty") {
    const maxHp = getUnitMaxHp(caster);
    caster.currentHp = Math.min(caster.currentHp + 1, maxHp);
    addLog(state, `${getUnitDisplayName(caster)} heals 1 HP from Bloodthirsty!`, "heal");
  }
}
