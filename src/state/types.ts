// ============================================================
//  STATE / TYPES — interfaces and types
// ============================================================

export type Screen = "menu" | "teamSelect" | "deployP1" | "deployP2" | "battle" | "victory";

export interface PlacedUnit {
  typeId: string;
  passiveId: string;
  row: number;
  col: number;
  currentHp: number;
  ap: number;
  movement: number;
  initiative: number;
  poisonTurns: number; // remaining poison turns (damage per turn)
  skillUsedThisTurn: boolean; // track if skill was used this turn (1 skill limit)
  invulnerable: boolean; // cannot be targeted by attacks/heals until next turn
}

export interface Team {
  units: { typeId: string; passiveId: string }[]; // ordered list of selected units
  placed: PlacedUnit[];
}

export interface GameState {
  screen: Screen;
  currentTeam: number; // which player's selection is being modified
  p1Team: Team;
  p2Team: Team;
  // Deployment
  deployTurn: number; // 0 = P1, 1 = P2
  deployIndex: number; // which unit of current player's team is being placed
  deployQueue: { player: 0 | 1; index: number }[]; // alternating placement order
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
    | { type: "endTurn" }
    | null;
  pendingDamage: { attacker: string; defender: string; amount: number } | null;
}
