// ============================================================
//  TEST FIXTURES — helpers for creating test state
// ============================================================
import { applyAction } from "../state/game-engine.js";
import { startBattle } from "../state/actions/index.js";
import { MapLayout } from "../data/maps.js";
import { Team, GameState } from "../state/types.js";
import type { PlacedUnit } from "../state/types.js";
import { UNIT_TYPE_DEFS } from "../data/index.js";

export function createTestMap(): MapLayout {
  const grid: boolean[][] = Array.from({ length: 12 }, () =>
    Array.from({ length: 12 }, () => true)
  );
  grid[5][5] = false;
  grid[5][6] = false;
  grid[6][5] = false;
  grid[6][6] = false;
  return { name: "Test Map", grid };
}

function defaultUnit(typeId: string, passiveId: string, playerIndex: 0 | 1, row: number, col: number): PlacedUnit {
  const def = UNIT_TYPE_DEFS[typeId];
  return {
    typeId,
    passiveId,
    row,
    col,
    playerIndex,
    currentHp: def.hp,
    ap: 1,
    movement: def.movement,
    baseMovement: def.movement,
    initiative: def.initiative,
    skillUsedThisTurn: false,
    invulnerable: false,
    poisonTurns: 0,
    buffTurns: 0,
    defenseBonus: 0,
    turnStartRow: row,
    turnStartCol: col,
    originalRow: row,
    originalCol: col,
  };
}

export function getUnitFromState(
  state: GameState,
  playerIndex: 0 | 1,
  unitIndex: number
): PlacedUnit | null {
  const team = playerIndex === 0 ? state.p1Team.placed : state.p2Team.placed;
  if (unitIndex >= team.length) return null;
  return team[unitIndex];
}

export function createTestState(): GameState {
  const p1Team: Team = { placed: [] };
  const p2Team: Team = { placed: [] };
  return {
    screen: "battle",
    currentTeam: 0,
    p1Team,
    p2Team,
    map: createTestMap(),
    deployTurn: 0,
    selectedDeployCell: null,
    editingDeployedUnit: null,
    editingUnitIndex: null,
    selectedUnitType: null,
    selectedPassiveId: null,
    pendingRuneLocation: null,
    turnOrder: [],
    currentTurnIndex: 0,
    selectedUnit: null,
    board: Array.from({ length: 12 }, () =>
      Array.from({ length: 12 }, () => null)
    ),
    log: [],
    winner: null,
    hoveredTile: null,
    actionMode: "idle",
    selectedAction: null,
    pendingDamage: null,
    runeEffects: [],
  };
}

export function placeUnit(
  state: GameState,
  playerIndex: 0 | 1,
  typeId: string,
  passiveId: string,
  row: number,
  col: number
): GameState {
  const unit = defaultUnit(typeId, passiveId, playerIndex, row, col);
  const team = playerIndex === 0 ? state.p1Team : state.p2Team;
  team.placed.push(unit);
  state.board[row][col] = unit;
  return state;
}

export function startTestBattle(
  p1Units: { typeId: string; passiveId: string; col: number; row?: number }[],
  p2Units: { typeId: string; passiveId: string; col: number; row?: number }[],
  map?: MapLayout
): GameState {
  const p1Team: Team = { placed: [] };
  const p2Team: Team = { placed: [] };

  p1Units.forEach((u) => {
    const unit = defaultUnit(u.typeId, u.passiveId, 0, u.row ?? 0, u.col);
    p1Team.placed.push(unit);
  });

  p2Units.forEach((u) => {
    const unit = defaultUnit(u.typeId, u.passiveId, 1, u.row ?? 11, u.col);
    p2Team.placed.push(unit);
  });

  const initialState = createTestState();
  return applyAction(initialState, startBattle(p1Team, p2Team, map ?? createTestMap()));
}
