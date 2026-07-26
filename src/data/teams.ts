/// <reference types="react" />
import { Team } from "../state/types";

export interface PresetTeam {
  name: string;
  units: { typeId: string; passiveId: string }[];
}

export const PRESET_TEAMS: PresetTeam[] = [
  {
    name: "Balanced",
    units: [
      { typeId: "warrior", passiveId: "toughened" },
      { typeId: "archer", passiveId: "nimble" },
      { typeId: "mage", passiveId: "fortitude" },
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
      { typeId: "mage", passiveId: "fortitude" },
      { typeId: "archer", passiveId: "nimble" },
      { typeId: "phantom", passiveId: "swift" },
      { typeId: "mage", passiveId: "fortitude" },
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
      { typeId: "mage", passiveId: "fortitude" },
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

export function getRandomTeam(): Team {
  const preset = PRESET_TEAMS[Math.floor(Math.random() * PRESET_TEAMS.length)];
  return { units: [...preset.units], placed: [] };
}
