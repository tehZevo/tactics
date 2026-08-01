// ============================================================
//  PASSIVES — all passive trait definitions
// ============================================================

export interface PassiveDef {
  name: string;
  description: string;
  apply: (stats: UnitStats) => UnitStats;
  recommended: string[]; // unit type IDs this passive is recommended for
}

export interface UnitStats {
  hp: number;
  attack: number;
  defense: number;
  movement: number;
  initiative: number;
}

export const PASSIVE_DEFS: Record<string, PassiveDef> = {
  nimble: {
    name: "Nimble",
    description: "+1 movement speed. Great for kiting and repositioning.",
    apply: (s) => ({ ...s, movement: s.movement + 1 }),
    recommended: ["archer", "rogue", "cleric"],
  },
  toughened: {
    name: "Toughened",
    description: "+2 max health. Helps squishy units survive longer.",
    apply: (s) => ({ ...s, hp: s.hp + 2 }),
    recommended: ["warrior", "paladin", "geomancer"],
  },
  hardened: {
    name: "Hardened",
    description: "+1 defense. Improves damage reduction across the board.",
    apply: (s) => ({ ...s, defense: s.defense + 1 }),
    recommended: ["warrior", "paladin", "geomancer", "cleric"],
  },
  aggressive: {
    name: "Aggressive",
    description: "+1 attack. Boosts damage output for strikers.",
    apply: (s) => ({ ...s, attack: s.attack + 1 }),
    recommended: ["warrior", "rogue", "phantom"],
  },
  swift: {
    name: "Swift",
    description: "+2 initiative. Act sooner in combat.",
    apply: (s) => ({ ...s, initiative: s.initiative + 2 }),
    recommended: ["rogue", "archer", "phantom", "wizard"],
  },
  bloodthirsty: {
    name: "Bloodthirsty",
    description: "Heal 1 HP when you deal a killing blow. Sustains strikers.",
    apply: (s) => ({ ...s }),
    recommended: ["warrior", "rogue", "phantom"],
  },
  fortitude: {
    name: "Fortitude",
    description: "+1 defense against area attacks. Protects backline casters.",
    apply: (s) => ({ ...s }),
    recommended: ["wizard", "cleric", "geomancer"],
  },
  predation: {
    name: "Predation",
    description: "+1 attack vs units below half HP. Punishes wounded targets.",
    apply: (s) => ({ ...s }),
    recommended: ["rogue", "phantom", "archer"],
  },
  tracker: {
    name: "Tracker",
    description: "+1 range on all attacks. Extends engagement distance.",
    apply: (s) => ({ ...s }),
    recommended: ["archer", "wizard", "cleric"],
  },
  desperate: {
    name: "Desperate",
    description: "+1 AP per turn, -1 defense. High risk, high reward.",
    apply: (s) => ({ ...s, defense: s.defense - 1 }),
    recommended: ["rogue", "phantom"],
  },
  regeneration: {
    name: "Regeneration",
    description: "Restores 1 HP at the start of each new round. Sustains self-sacrificing units.",
    apply: (s) => ({ ...s }),
    recommended: ["berserker"],
  },
  energized: {
    name: "Energized",
    description: "+2 AP per turn. Power users can spam abilities.",
    apply: (s) => ({ ...s }),
    recommended: ["wizard", "rogue", "phantom"],
  },
  focus: {
    name: "Focus",
    description: "+1 initiative. Trade raw defense for acting sooner.",
    apply: (s) => ({ ...s, initiative: s.initiative + 1 }),
    recommended: ["cleric", "paladin", "geomancer"],
  },
};

export const PASSIVE_IDS = Object.keys(PASSIVE_DEFS);
