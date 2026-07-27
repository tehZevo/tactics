import type { GameState, PlacedUnit } from "../types.js";
import { SKILL_DEFS } from "../../data/index.js";
import { registerSkillEffects } from "./map.js";

export function executeSkillEffect(
  state: GameState,
  caster: PlacedUnit,
  target: PlacedUnit | null,
  skillId: string,
  location?: { row: number; col: number },
): void {
  const skill = SKILL_DEFS[skillId];
  if (skill?.apply) {
    skill.apply(state, caster, target, skillId, location);
  }
}

registerSkillEffects();
