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
  leapStrikeEffect,
  reorderTurn,
  poisonAttack,
  cleanseEffect,
  berserkEffect,
  focusEffect,
  repositionEffect,
  executeReposition,
  flameRuneEffect,
  windRuneEffect,
  earthRuneEffect,
  darknessRuneEffect,
} from "./effects.js";

const skillEffectMap: Record<string, SkillApplyFn> = {
  // Warrior
  power_strike: singleTargetAttack,
  whirlwind: aoeAttack,
  quick_movement: leapEffect,
  // Archer
  precise_shot: singleTargetAttack,
  trip_wire: singleTargetAttack,
  // Wizard
  fireball: aoeAttack,
  arcane_missile: singleTargetAttack,
  flame_rune: flameRuneEffect,
  wind_rune: windRuneEffect,
  // Rogue
  riposte: singleTargetAttack,
  shadow_step: movementTeleport,
  soul_drain: apDrain,
  venomous_strike: poisonAttack,
  berserk: berserkEffect,
  // Geomancer
  cataclysm: aoeAttack,
  seism: singleTargetAttack,
  earth_rune: earthRuneEffect,
  // Paladin
  holy_strike: singleTargetAttack,
  lay_on_hands: heal,
  // Cleric
  divine_heal: heal,
  holy_bolt: singleTargetAttack,
  cleanse: cleanseEffect,
  // Phantom
  phase_shift: buff,
  void_strike: singleTargetAttack,
  darkness_rune: darknessRuneEffect,
  // Berserker
  soul_reave: singleTargetAttack,
  // Battlemage
  swap: movementSwap,
  arcane_burst: aoeAttack,
  leap_strike: leapStrikeEffect,
  // Marshal
  borrowed_time: reorderTurn,
  commanding_strike: singleTargetAttack,
  reposition: repositionEffect,
  // Monk
  iron_palm: singleTargetAttack,
  crimson_hurricane: aoeAttack,
  focus: focusEffect,
};

export function registerSkillEffects(): void {
  for (const [skillId, fn] of Object.entries(skillEffectMap)) {
    if (SKILL_DEFS[skillId]) {
      SKILL_DEFS[skillId].apply = fn;
    }
  }
}
