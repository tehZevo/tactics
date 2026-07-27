// ============================================================
//  UNIT TYPES — all unit definitions
// ============================================================
import { SkillDef } from "./skills.js";

export interface UnitTypeDef {
  name: string;
  icon: string;
  description: string;
  hp: number;
  baseAtk: number;
  baseDef: number;
  movement: number;
  initiative: number;
  skills: string[];
  color: string;
}

export const UNIT_TYPE_DEFS: Record<string, UnitTypeDef> = {
  warrior: {
    name: "Warrior",
    icon: "W",
    description: "Sturdy frontline fighter with high HP and solid defense.",
    hp: 8,
    baseAtk: 1,
    baseDef: 1,
    movement: 3,
    initiative: 3,
    skills: ["power_strike", "whirlwind"],
    color: "#78716c",
  },
  archer: {
    name: "Archer",
    icon: "A",
    description: "Fast ranged attacker with trap support.",
    hp: 5,
    baseAtk: 0,
    baseDef: 0,
    movement: 4,
    initiative: 5,
    skills: ["precise_shot", "trip_wire"],
    color: "#65a30d",
  },
  wizard: {
    name: "Wizard",
    icon: "Wi",
    description: "Fragile AoE dealer with fireball and arcane missile.",
    hp: 4,
    baseAtk: 0,
    baseDef: 0,
    movement: 4,
    initiative: 4,
    skills: ["fireball", "arcane_missile"],
    color: "#7c3aed",
  },
  rogue: {
    name: "Rogue",
    icon: "R",
    description: "Fastest unit with high single-target damage and teleportation.",
    hp: 5,
    baseAtk: 0,
    baseDef: 0,
    movement: 5,
    initiative: 6,
    skills: ["riposte", "shadow_step"],
    color: "#4b5563",
  },
  geomancer: {
    name: "Geomancer",
    icon: "G",
    description: "Heavy-hitting AoE dealer with cataclysm and seism.",
    hp: 6,
    baseAtk: 0,
    baseDef: 0,
    movement: 3,
    initiative: 2,
    skills: ["cataclysm", "seism"],
    color: "#b45309",
  },
  paladin: {
    name: "Paladin",
    icon: "P",
    description: "Defensive holy warrior with healing support.",
    hp: 7,
    baseAtk: 0,
    baseDef: 1,
    movement: 3,
    initiative: 1,
    skills: ["holy_strike", "lay_on_hands"],
    color: "#ca8a04",
  },
  cleric: {
    name: "Cleric",
    icon: "C",
    description: "Healer with ranged holy bolt attack.",
    hp: 6,
    baseAtk: 0,
    baseDef: 0,
    movement: 4,
    initiative: 3,
    skills: ["divine_heal", "holy_bolt"],
    color: "#f59e0b",
  },
  phantom: {
    name: "Phantom",
    icon: "Ph",
    description: "Ethereal striker with phase shift and defense-piercing attack.",
    hp: 4,
    baseAtk: 0,
    baseDef: 0,
    movement: 5,
    initiative: 7,
    skills: ["phase_shift", "void_strike"],
    color: "#8b5cf6",
  },
  berserker: {
    name: "Berserker",
    icon: "Be",
    description: "Self-sacrificing powerhouse. Trades HP for devastating close-range damage.",
    hp: 7,
    baseAtk: 0,
    baseDef: 0,
    movement: 3,
    initiative: 4,
    skills: ["soul_reave", "leap"],
    color: "#dc2626",
  },
  battlemage: {
    name: "Battlemage",
    icon: "Bm",
    description: "Mobile controller with swap and stun. excel at repositioning allies and disrupting enemies.",
    hp: 5,
    baseAtk: 1,
    baseDef: 0,
    movement: 4,
    initiative: 5,
    skills: ["swap", "arcane_burst"],
    color: "#06b6d4",
  },

  marshal: {
    name: "Marshal",
    icon: "M",
    description: "Tactical commander who manipulates the flow of battle. High AP cost abilities demand careful timing.",
    hp: 6,
    baseAtk: 1,
    baseDef: 1,
    movement: 3,
    initiative: 4,
    skills: ["borrowed_time", "commanding_strike"],
    color: "#1e40af",
  },

  monk: {
    name: "Monk",
    icon: "Mo",
    description: "Martial artist with devastating close-range techniques and superior speed.",
    hp: 5,
    baseAtk: 0,
    baseDef: 0,
    movement: 5,
    initiative: 6,
    skills: ["iron_palm", "crimson_hurricane"],
    color: "#ea580c",
  },
};

export const UNIT_TYPE_IDS = Object.keys(UNIT_TYPE_DEFS);
