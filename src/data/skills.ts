// ============================================================
//  SKILLS — all skill definitions
// ============================================================
import type { GameState, PlacedUnit } from "../state/types.js";

export type SkillApplyFn = (
  state: GameState,
  caster: PlacedUnit,
  target: PlacedUnit | null,
  skillId: string,
  location?: { row: number; col: number },
) => void;

export interface SkillDef {
  name: string;
  cost: number;
  range: number;
  cooldown: number;
  description: string;
  type: "attack" | "heal" | "buff" | "movement" | "apDrain";
  damage?: number;
  healAmount?: number;
  selfTarget?: boolean;
  aoe?: number;
  grantsInvulnerability?: boolean; // if true, makes user invulnerable until their next turn
  ignoresDefense?: boolean; // if true, ignores defender's defense stat
  apDrain?: number; // amount of AP to drain from target
  selfDamage?: number; // HP the user loses when using this skill
  leapBonus?: number; // extra movement range granted by this skill
  swapTarget?: boolean; // if true, swaps user with target
  reorderTarget?: boolean; // if true, reorders turn order so target acts immediately after user
  poisonTurns?: number; // turns of poison to inflict on target
  buffDuration?: number; // turns the buff lasts (for self-buff type skills)
  runeTurns?: number; // turns the rune lasts (for rune type skills)
  apply?: SkillApplyFn;
}

export const SKILL_DEFS: Record<string, SkillDef> = {
  // Warrior
  power_strike: {
    name: "Power Strike",
    cost: 1,
    range: 1,
    cooldown: 0,
    description: "A heavy blow dealing 4 damage.",
    type: "attack",
    damage: 4,
  },
  whirlwind: {
    name: "Whirlwind",
    cost: 3,
    range: 1,
    cooldown: 0,
    description: "Strike all adjacent enemies for 2 damage each.",
    type: "attack",
    damage: 2,
    aoe: 1,
  },

  // Archer
  precise_shot: {
    name: "Precise Shot",
    cost: 1,
    range: 4,
    cooldown: 0,
    description: "Fire a shot dealing 3 damage at range.",
    type: "attack",
    damage: 3,
  },
  trip_wire: {
    name: "Trip Wire",
    cost: 2,
    range: 3,
    cooldown: 0,
    description: "Set a trap. Next enemy that enters range takes 3 damage.",
    type: "attack",
    damage: 3,
  },

  // Wizard
  fireball: {
    name: "Fireball",
    cost: 3,
    range: 3,
    cooldown: 0,
    description: "Hurl flames dealing 5 damage in an area.",
    type: "attack",
    damage: 5,
    aoe: 1,
  },
  arcane_missile: {
    name: "Arcane Missile",
    cost: 1,
    range: 3,
    cooldown: 0,
    description: "Fire a bolt of arcane energy dealing 2 damage.",
    type: "attack",
    damage: 2,
  },
  vine_whip: {
    name: "Vine Whip",
    cost: 1,
    range: 2,
    cooldown: 0,
    description: "Lash out with living vines dealing 3 damage.",
    type: "attack",
    damage: 3,
  },
  soul_bolt: {
    name: "Soul Bolt",
    cost: 1,
    range: 3,
    cooldown: 0,
    description: "Fire a spectral bolt dealing 2 damage.",
    type: "attack",
    damage: 2,
  },
  flame_rune: {
    name: "Flame Rune",
    cost: 2,
    range: 3,
    cooldown: 0,
    description: "Place a rune that deals 1 damage to enemies ending their turn on it. Lasts 3 turns.",
    type: "buff",
    selfTarget: false,
    runeTurns: 3,
  },
  wind_rune: {
    name: "Wind Rune",
    cost: 2,
    range: 3,
    cooldown: 0,
    description: "Place a rune with radius 1. Units starting their turn on it gain +1 movement. Lasts 4 turns.",
    type: "buff",
    selfTarget: false,
    runeTurns: 4,
  },
  earth_rune: {
    name: "Earth Rune",
    cost: 2,
    range: 3,
    cooldown: 0,
    description: "Place a rune with radius 1. Units ending their turn on it gain +1 defense. Lasts 4 turns.",
    type: "buff",
    selfTarget: false,
    runeTurns: 4,
  },
  darkness_rune: {
    name: "Darkness Rune",
    cost: 2,
    range: 3,
    cooldown: 0,
    description: "Place a rune with radius 3. Reduces ranged attack range by 1 for all units (minimum 1). Physical attacks unaffected. Lasts 3 turns.",
    type: "buff",
    selfTarget: false,
    runeTurns: 3,
  },

  // Rogue
  riposte: {
    name: "Riposte",
    cost: 1,
    range: 1,
    cooldown: 0,
    description: "A quick slash dealing 4 damage.",
    type: "attack",
    damage: 4,
  },
  shadow_step: {
    name: "Shadow Step",
    cost: 2,
    range: 0,
    cooldown: 0,
    description: "Teleport to any empty tile within range 3.",
    type: "movement",
    selfTarget: true,
  },
  soul_drain: {
    name: "Soul Drain",
    cost: 1,
    range: 1,
    cooldown: 0,
    description: "Steal 1 AP from the target.",
    type: "apDrain",
    apDrain: 1,
  },
  venomous_strike: {
    name: "Venomous Strike",
    cost: 1,
    range: 1,
    cooldown: 0,
    description: "Slash with poisoned blade. Deals 2 damage and poisons the target for 2 turns.",
    type: "attack",
    damage: 2,
    poisonTurns: 2,
  },
  berserk: {
    name: "Berserk",
    cost: 1,
    range: 0,
    cooldown: 0,
    description: "Enter a rage. +1 attack, -1 defense for 2 turns.",
    type: "buff",
    selfTarget: true,
    buffDuration: 2,
  },

  // Geomancer
  cataclysm: {
    name: "Cataclysm",
    cost: 6,
    range: 0,
    cooldown: 0,
    description: "Deal 3 damage to all enemies within range 3.",
    type: "attack",
    damage: 3,
    aoe: 3,
  },
  seism: {
    name: "Seism",
    cost: 2,
    range: 2,
    cooldown: 0,
    description: "Hurl a shard of earth dealing 5 damage.",
    type: "attack",
    damage: 5,
  },

  // Paladin
  holy_strike: {
    name: "Holy Strike",
    cost: 1,
    range: 1,
    cooldown: 0,
    description: "Smite for 3 damage.",
    type: "attack",
    damage: 3,
  },
  lay_on_hands: {
    name: "Lay on Hands",
    cost: 3,
    range: 2,
    cooldown: 0,
    description: "Restore 5 health to an ally.",
    type: "heal",
    healAmount: 5,
  },

  // Cleric
  divine_heal: {
    name: "Divine Heal",
    cost: 2,
    range: 3,
    cooldown: 0,
    description: "Restore 4 health to an ally.",
    type: "heal",
    healAmount: 4,
  },
  holy_bolt: {
    name: "Holy Bolt",
    cost: 2,
    range: 4,
    cooldown: 0,
    description: "Hurl a bolt of holy light dealing 4 damage.",
    type: "attack",
    damage: 4,
  },
  cleanse: {
    name: "Cleanse",
    cost: 1,
    range: 2,
    cooldown: 0,
    description: "Purify an ally, removing all debuffs.",
    type: "buff",
    selfTarget: false,
  },

  // Phantom
  phase_shift: {
    name: "Phase Shift",
    cost: 4,
    range: 0,
    cooldown: 0,
    description: "Phase out of reality. You cannot be targeted by any attacks or heals until your next turn.",
    type: "buff",
    selfTarget: true,
    grantsInvulnerability: true,
  },

  // Phantom
  void_strike: {
    name: "Void Strike",
    cost: 1,
    range: 1,
    cooldown: 0,
    description: "Strike from the void dealing 3 damage. Ignores defense.",
    type: "attack",
    damage: 3,
    ignoresDefense: true,
  },

  // Berserker
  soul_reave: {
    name: "Soul Reave",
    cost: 2,
    range: 1,
    cooldown: 0,
    description: "Tear into the enemy dealing 8 damage, but lose 2 HP in the process.",
    type: "attack",
    damage: 8,
    selfDamage: 2,
  },
  quick_movement: {
    name: "Quick Movement",
    cost: 1,
    range: 0,
    cooldown: 0,
    description: "Quick movement. Gain +2 movement this turn.",
    type: "movement",
    leapBonus: 2,
  },
  leap_strike: {
    name: "Leap Strike",
    cost: 2,
    range: 2,
    cooldown: 0,
    description: "Leap to target cell within range 2, then deal 3 damage to all enemies in radius 1 of landing spot.",
    type: "attack",
    damage: 3,
    aoe: 1,
    selfTarget: false,
  },

  // Battlemage
  swap: {
    name: "Swap",
    cost: 2,
    range: 2,
    cooldown: 0,
    description: "Swap positions with any unit (ally or enemy).",
    type: "movement",
    swapTarget: true,
  },
  arcane_burst: {
    name: "Arcane Burst",
    cost: 2,
    range: 1,
    cooldown: 0,
    description: "Deal 4 damage to the target and 2 damage to adjacent enemies.",
    type: "attack",
    damage: 2,
    aoe: 1,
  },

  // Marshal
  reposition: {
    name: "Reposition",
    cost: 1,
    range: 2,
    cooldown: 0,
    description: "Move an allied unit within range 2 to any empty tile within range 2.",
    type: "movement",
    selfTarget: false,
  },
  borrowed_time: {
    name: "Borrowed Time",
    cost: 5,
    range: 3,
    cooldown: 0,
    description: "Manipulate the flow of battle. The target acts immediately after you this round.",
    type: "buff",
    reorderTarget: true,
  },
  commanding_strike: {
    name: "Commanding Strike",
    cost: 1,
    range: 1,
    cooldown: 0,
    description: "A disciplined strike dealing 3 damage.",
    type: "attack",
    damage: 3,
  },

  // Monk
  focus: {
    name: "Focus",
    cost: 0,
    range: 0,
    cooldown: 0,
    description: "Center your mind. Gain +1 AP next turn.",
    type: "buff",
    selfTarget: true,
  },
  iron_palm: {
    name: "Iron Palm",
    cost: 1,
    range: 1,
    cooldown: 0,
    description: "A focused strike of hardened fists dealing 5 damage.",
    type: "attack",
    damage: 5,
  },
  crimson_hurricane: {
    name: "Crimson Hurricane",
    cost: 3,
    range: 1,
    cooldown: 0,
    description: "A whirlwind of punches and kicks striking all adjacent enemies for 2 damage each.",
    type: "attack",
    damage: 2,
    aoe: 1,
  },
};
