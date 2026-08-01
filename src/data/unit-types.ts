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
    movement: 2,
    initiative: 3,
    skills: ["power_strike", "whirlwind"],
    color: "#78716c",
  },
  archer: {
    name: "Archer",
    icon: "A",
    description: "Fast ranged attacker with trap support and quick escape.",
    hp: 5,
    baseAtk: 0,
    baseDef: 0,
    movement: 2,
    initiative: 5,
    skills: ["precise_shot", "quick_movement", "trip_wire"],
    color: "#65a30d",
  },
  wizard: {
    name: "Wizard",
    icon: "W",
    description: "Powerful magic user with AoE damage and rune placement.",
    hp: 4,
    baseAtk: 0,
    baseDef: 0,
    movement: 2,
    initiative: 3,
    skills: ["arcane_missile", "flame_rune", "fireball"],
    color: "#a855f7",
  },
  druid: {
    name: "Druid",
    icon: "Dr",
    description: "Nature guardian with wind runes and vine whip.",
    hp: 5,
    baseAtk: 0,
    baseDef: 0,
    movement: 2,
    initiative: 5,
    skills: ["vine_whip", "wind_rune"],
    color: "#22c55e",
  },
  soul_hunter: {
    name: "Soul Hunter",
    icon: "Sh",
    description: "Steals AP and fires spectral bolts at enemies.",
    hp: 4,
    baseAtk: 0,
    baseDef: 0,
    movement: 2,
    initiative: 6,
    skills: ["soul_bolt", "soul_drain"],
    color: "#581c87",
  },
  rogue: {
    name: "Rogue",
    icon: "R",
    description: "Agile melee fighter with evasion and poison abilities.",
    hp: 5,
    baseAtk: 0,
    baseDef: 0,
    movement: 3,
    initiative: 4,
    skills: ["riposte", "venomous_strike", "shadow_step"],
    color: "#6b7280",
  },
  geomancer: {
    name: "Geomancer",
    icon: "G",
    description: "Earth-shaking tank with area control and rune placement.",
    hp: 9,
    baseAtk: 0,
    baseDef: 0,
    movement: 2,
    initiative: 1,
    skills: ["seism", "earth_rune", "cataclysm"],
    color: "#92400e",
  },
  paladin: {
    name: "Paladin",
    icon: "P",
    description: "Defensive holy warrior with healing support.",
    hp: 7,
    baseAtk: 0,
    baseDef: 1,
    movement: 2,
    initiative: 1,
    skills: ["holy_strike", "lay_on_hands"],
    color: "#ca8a04",
  },
  cleric: {
    name: "Cleric",
    icon: "C",
    description: "Holy healer who restores allies and purifies debuffs.",
    hp: 6,
    baseAtk: 0,
    baseDef: 0,
    movement: 2,
    initiative: 4,
    skills: ["cleanse", "divine_heal", "holy_bolt"],
    color: "#f59e0b",
  },
  phantom: {
    name: "Phantom",
    icon: "P",
    description: "Mysterious stealthy attacker with void magic.",
    hp: 5,
    baseAtk: 0,
    baseDef: 0,
    movement: 3,
    initiative: 3,
    skills: ["void_strike", "darkness_rune", "phase_shift"],
    color: "#6b7280",
  },
  berserker: {
    name: "Berserker",
    icon: "B",
    description: "Frenzied warrior who gains power from combat.",
    hp: 7,
    baseAtk: 0,
    baseDef: 0,
    movement: 3,
    initiative: 2,
    skills: ["berserk", "soul_reave"],
    color: "#dc2626",
  },
  battlemage: {
    name: "Battlemage",
    icon: "Bm",
    description: "Mobile controller with swap and leap strike. Excels at repositioning and AoE damage.",
    hp: 5,
    baseAtk: 1,
    baseDef: 0,
    movement: 2,
    initiative: 5,
    skills: ["swap", "arcane_burst", "leap_strike"],
    color: "#06b6d4",
  },

  marshal: {
    name: "Marshal",
    icon: "M",
    description: "Tactical commander who manipulates turn order.",
    hp: 6,
    baseAtk: 0,
    baseDef: 0,
    movement: 2,
    initiative: 4,
    skills: ["commanding_strike", "borrowed_time", "reposition"],
    color: "#1e40af",
  },

  monk: {
    name: "Monk",
    icon: "Mo",
    description: "Martial artist with devastating close-range techniques and superior speed.",
    hp: 5,
    baseAtk: 0,
    baseDef: 0,
    movement: 3,
    initiative: 6,
    skills: ["iron_palm", "crimson_hurricane", "focus"],
    color: "#ea580c",
  },
};

export const UNIT_TYPE_IDS = Object.keys(UNIT_TYPE_DEFS);
