/// <reference types="react" />
import { Team } from "../state/types";
import { UNIT_TYPE_DEFS } from "./unit-types";
import { PASSIVE_DEFS } from "./passives";

export interface PresetTeam {
  name: string;
  units: { typeId: string; passiveId: string }[];
}

// 6 units: 4 in the front row, 2 in the back row, centered in the back-2-rows × middle-6-cols deployment zone
// P1 deploys at bottom (rows 10-11), P2 at top (rows 0-1)
const P1_PLACEMENT = [
  { row: 10, col: 4 }, { row: 10, col: 5 }, { row: 10, col: 6 }, { row: 10, col: 7 },
  { row: 11, col: 5 }, { row: 11, col: 6 },
];
const P2_PLACEMENT = [
  { row: 1, col: 4 }, { row: 1, col: 5 }, { row: 1, col: 6 }, { row: 1, col: 7 },
  { row: 0, col: 5 }, { row: 0, col: 6 },
];

export const PRESET_TEAMS: PresetTeam[] = [
  {
    name: "Balanced",
    units: [
      { typeId: "warrior", passiveId: "toughened" },
      { typeId: "archer", passiveId: "nimble" },
      { typeId: "wizard", passiveId: "fortitude" },
      { typeId: "cleric", passiveId: "nimble" },
      { typeId: "rogue", passiveId: "aggressive" },
      { typeId: "geomancer", passiveId: "hardened" },
    ],
  },
  {
    name: "Tank",
    units: [
      { typeId: "warrior", passiveId: "toughened" },
      { typeId: "paladin", passiveId: "hardened" },
      { typeId: "warrior", passiveId: "toughened" },
      { typeId: "geomancer", passiveId: "hardened" },
      { typeId: "cleric", passiveId: "nimble" },
      { typeId: "archer", passiveId: "nimble" },
    ],
  },
  {
    name: "Burst",
    units: [
      { typeId: "rogue", passiveId: "aggressive" },
      { typeId: "wizard", passiveId: "fortitude" },
      { typeId: "archer", passiveId: "nimble" },
      { typeId: "phantom", passiveId: "swift" },
      { typeId: "wizard", passiveId: "fortitude" },
      { typeId: "rogue", passiveId: "aggressive" },
    ],
  },
  {
    name: "Support",
    units: [
      { typeId: "cleric", passiveId: "nimble" },
      { typeId: "paladin", passiveId: "hardened" },
      { typeId: "geomancer", passiveId: "hardened" },
      { typeId: "warrior", passiveId: "toughened" },
      { typeId: "cleric", passiveId: "nimble" },
      { typeId: "archer", passiveId: "nimble" },
    ],
  },
  {
    name: "Stealth",
    units: [
      { typeId: "rogue", passiveId: "aggressive" },
      { typeId: "phantom", passiveId: "swift" },
      { typeId: "rogue", passiveId: "aggressive" },
      { typeId: "phantom", passiveId: "swift" },
      { typeId: "archer", passiveId: "nimble" },
      { typeId: "wizard", passiveId: "fortitude" },
    ],
  },
  {
    name: "Defense",
    units: [
      { typeId: "warrior", passiveId: "toughened" },
      { typeId: "paladin", passiveId: "hardened" },
      { typeId: "geomancer", passiveId: "hardened" },
      { typeId: "warrior", passiveId: "toughened" },
      { typeId: "paladin", passiveId: "hardened" },
      { typeId: "cleric", passiveId: "nimble" },
    ],
  },
];

export function getTeamPlacements(side: "p1" | "p2") {
  return side === "p1" ? P1_PLACEMENT : P2_PLACEMENT;
}

export function getRandomTeam(): Team {
  const preset = PRESET_TEAMS[Math.floor(Math.random() * PRESET_TEAMS.length)];
  return {
    placed: preset.units.map((unit, index) => {
      const def = UNIT_TYPE_DEFS[unit.typeId];
      const passive = unit.passiveId ? PASSIVE_DEFS[unit.passiveId] : null;
      const stats = passive
        ? passive.apply({ hp: def.hp, attack: def.baseAtk, defense: def.baseDef, movement: def.movement, initiative: def.initiative })
        : { hp: def.hp, attack: def.baseAtk, defense: def.baseDef, movement: def.movement, initiative: def.initiative };
      const pos = P2_PLACEMENT[index];
      return {
        ...unit,
        row: pos.row,
        col: pos.col,
        playerIndex: 1 as const,
        currentHp: stats.hp,
        ap: 0,
        movement: stats.movement,
        baseMovement: stats.movement,
        initiative: stats.initiative,
        poisonTurns: 0,
        skillUsedThisTurn: false,
        invulnerable: false,
        turnStartRow: pos.row,
        turnStartCol: pos.col,
      };
    }),
  };
}
