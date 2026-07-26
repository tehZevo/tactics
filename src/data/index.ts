// ============================================================
//  DATA — barrel export for all game data
// ============================================================

// Constants
export {
  BOARD_COLS,
  BOARD_ROWS,
  MAX_AP,
  AP_PER_TURN,
  PLACEMENT_P1_COL,
  PLACEMENT_P2_COL,
} from "./constants.js";

// Skills
export type { SkillDef } from "./skills.js";
export { SKILL_DEFS } from "./skills.js";

// Unit Types
export type { UnitTypeDef } from "./unit-types.js";
export { UNIT_TYPE_DEFS, UNIT_TYPE_IDS } from "./unit-types.js";

// Passives
export type { PassiveDef, UnitStats } from "./passives.js";
export { PASSIVE_DEFS, PASSIVE_IDS } from "./passives.js";

// Maps
export type { MapLayout } from "./maps.js";
export { MAP_LAYOUTS, getRandomMap } from "./maps.js";
