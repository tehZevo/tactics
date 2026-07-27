import { SKILL_DEFS } from "../../data/index.js";
import type { SkillApplyFn } from "../../data/skills.js";
import {
  singleTargetAttack,
  aoeAttack,
  heal,
  buff,
  movementSwap,
  movementTeleport,
  apDrain,
  leapEffect,
} from "./effects.js";

const skillEffectMap: Record<string, SkillApplyFn> = {
  // Warrior
  power_strike: singleTargetAttack,
  whirlwind: aoeAttack,
  // Archer
  precise_shot: singleTargetAttack,
  trip_wire: singleTargetAttack,
  // Wizard
  fireball: aoeAttack,
  arcane_missile: singleTargetAttack,
  // Rogue
  riposte: singleTargetAttack,
  shadow_step: movementTeleport,
  soul_drain: apDrain,
  // Geomancer
  cataclysm: aoeAttack,
  seism: singleTargetAttack,
  // Paladin
  holy_strike: singleTargetAttack,
  lay_on_hands: heal,
  // Cleric
  divine_heal: heal,
  holy_bolt: singleTargetAttack,
  // Phantom
  phase_shift: buff,
  void_strike: singleTargetAttack,
  // Berserker
  soul_reave: singleTargetAttack,
  leap: leapEffect,
  // Battlemage
  swap: movementSwap,
  arcane_burst: aoeAttack,
};

export function registerSkillEffects(): void {
  for (const [skillId, fn] of Object.entries(skillEffectMap)) {
    if (SKILL_DEFS[skillId]) {
      SKILL_DEFS[skillId].apply = fn;
    }
  }
}
