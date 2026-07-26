// ============================================================
//  SKILLS — all skill definitions
// ============================================================

export interface SkillDef {
  name: string;
  cost: number;
  range: number;
  cooldown: number;
  description: string;
  type: "attack" | "heal" | "buff" | "movement";
  damage?: number;
  healAmount?: number;
  selfTarget?: boolean;
  aoe?: number;
  grantsInvulnerability?: boolean; // if true, makes user invulnerable until their next turn
  ignoresDefense?: boolean; // if true, ignores defender's defense stat
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
    cooldown: 2,
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
    cooldown: 2,
    description: "Set a trap. Next enemy that enters range takes 3 damage.",
    type: "attack",
    damage: 3,
  },

  // Mage
  fireball: {
    name: "Fireball",
    cost: 3,
    range: 3,
    cooldown: 1,
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

  // Rogue
  poison_blade: {
    name: "Poison Blade",
    cost: 1,
    range: 1,
    cooldown: 0,
    description: "Slash for 2 damage and poison for 2 additional damage over 2 turns.",
    type: "attack",
    damage: 2,
  },
  shadow_step: {
    name: "Shadow Step",
    cost: 2,
    range: 0,
    cooldown: 2,
    description: "Teleport to any empty tile within range 3.",
    type: "movement",
    selfTarget: true,
  },

  // Geomancer
  cataclysm: {
    name: "Cataclysm",
    cost: 6,
    range: 0,
    cooldown: 3,
    description: "Deal 3 damage to all enemies within range 3.",
    type: "attack",
    damage: 3,
    aoe: 3,
  },
  seism: {
    name: "Seism",
    cost: 2,
    range: 2,
    cooldown: 1,
    description: "Hurl a shard of earth dealing 4 damage. Slows target by -1 movement next turn.",
    type: "attack",
    damage: 4,
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
    cooldown: 2,
    description: "Restore 5 health to an ally.",
    type: "heal",
    healAmount: 5,
  },

  // Cleric
  divine_heal: {
    name: "Divine Heal",
    cost: 2,
    range: 3,
    cooldown: 1,
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
};
