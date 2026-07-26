// ============================================================
//  STATE / TYPES — interfaces and types
// ============================================================
import type { MapLayout } from "../data/maps.js";

export type Screen = "menu" | "teamSelect" | "deploy" | "battle" | "victory";

export interface PlacedUnit {
  typeId: string;
  passiveId: string;
  row: number;
  col: number;
  currentHp: number;
  ap: number;
  movement: number;
  initiative: number;
  skillUsedThisTurn: boolean; // track if skill was used this turn (1 skill limit)
  invulnerable: boolean; // cannot be targeted by attacks/heals until next turn
  leapBonus?: number; // temporary extra movement from Leap skill
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
  editingUnitIndex: number | null; // index into current player's placed array for editing
  selectedUnitType: string | null; // unit type selected in picker
  selectedPassiveId: string | null; // passive selected in picker
  // Battle
  turnOrder: { playerIndex: 0 | 1; unitIndex: number }[];
  currentTurnIndex: number; // index into turnOrder
  selectedUnit: { playerIndex: 0 | 1; unitIndex: number } | null;
  board: (PlacedUnit | null)[][]; // [row][col]
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
    | { type: "endTurn" }
    | null;
  pendingDamage: { attacker: string; defender: string; amount: number } | null;
}
