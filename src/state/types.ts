// ============================================================
//  STATE / TYPES — interfaces and types
// ============================================================
import type { MapLayout } from "../data/maps.js";

export type Screen = "menu" | "teamSelect" | "battle" | "victory";

export interface PlacedUnit {
  typeId: string;
  passiveId: string;
  row: number;
  col: number;
  currentHp: number;
  ap: number;
  movement: number;
  baseMovement: number;
  initiative: number;
  skillUsedThisTurn: boolean; // track if skill was used this turn (1 skill limit)
  invulnerable: boolean; // cannot be targeted by attacks/heals until next turn
  poisonTurns: number; // turns of poison remaining
  buffTurns: number; // turns of self-buff remaining (attack +1 / defense -1)
  focusCharges?: number; // extra AP granted next turn from Focus skill
  defenseBonus?: number; // temporary defense bonus from sources like Earth Rune
  leapBonus?: number; // temporary extra movement from Leap skill
  turnStartRow: number; // position at start of turn (for movement radius)
  turnStartCol: number;
  tentativeRow?: number; // preview position for move (before confirmed)
  tentativeCol?: number;
  originalRow: number; // position at start of turn (for rollback)
  originalCol: number;
  playerIndex?: 0 | 1; // which player controls this unit (optional, falls back to row-based)
}

export interface Team {
  placed: PlacedUnit[];
}

export interface GameState {
  screen: Screen;
  currentTeam: number; // which player's selection is being modified
  p1Team: Team;
  p2Team: Team;
  map: MapLayout; // battle map layout
  // Deployment
  deployTurn: number; // 0 = P1, 1 = P2
  selectedDeployCell: { row: number; col: number } | null; // cell selected for placement
  editingDeployedUnit: number | null; // index into current player's placed array for mobile edit dialog
  editingUnitIndex: number | null; // index into current player's placed array for editing
  selectedUnitType: string | null; // unit type selected in picker
  selectedPassiveId: string | null; // passive selected in picker
  // Battle
  turnOrder: { playerIndex: 0 | 1; unitIndex: number }[];
  currentTurnIndex: number; // index into turnOrder
  selectedUnit: { playerIndex: 0 | 1; unitIndex: number } | null;
  board: (PlacedUnit | null)[][]; // [row][col]
  runeEffects: { row: number; col: number; turns: number; type?: "flame" | "wind" | "earth" | "darkness"; playerIndex?: 0 | 1 }[]; // active rune tiles
  log: { text: string; type: "info" | "damage" | "heal" }[];
  winner: number | null;
  // UI
  hoveredTile: { row: number; col: number } | null;
  actionMode: "idle" | "selectAction" | "selectTarget" | "confirm";
  selectedAction:
    | { type: "move"; target: { row: number; col: number } }
    | { type: "attack"; target: PlacedUnit; skillId: string }
    | { type: "skill"; target: PlacedUnit; skillId: string }
    | { type: "aoeAttack"; skillId: string; center: { row: number; col: number }; caster: PlacedUnit }
    | { type: "leap"; target: { row: number; col: number } }
    | { type: "runePlacement"; skillId: string; pendingLocation?: { row: number; col: number } }
    | { type: "reposition"; target: PlacedUnit | null; skillId: string }
    | { type: "endTurn" }
    | null;
  pendingRuneLocation: { row: number; col: number } | null;
  pendingDamage: { attacker: string; defender: string; amount: number } | null;
}
