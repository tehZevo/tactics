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
  mage: {
    name: "Mage",
    icon: "M",
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
    description: "Fastest unit with poison DoT and teleportation.",
    hp: 5,
    baseAtk: 0,
    baseDef: 0,
    movement: 5,
    initiative: 6,
    skills: ["poison_blade", "shadow_step"],
    color: "#4b5563",
  },
  geomancer: {
    name: "Geomancer",
    icon: "G",
    description: "AoE damage dealer with cataclysm and seism.",
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
    description: "Ethereal striker with invulnerability and defense-piercing attack.",
    hp: 4,
    baseAtk: 0,
    baseDef: 0,
    movement: 5,
    initiative: 7,
    skills: ["phase_shift", "void_strike"],
    color: "#8b5cf6",
  },
};

export const UNIT_TYPE_IDS = Object.keys(UNIT_TYPE_DEFS);
