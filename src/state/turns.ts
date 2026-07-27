// ============================================================
//  STATE / TURNS — turn management (advanceTurn, getTurnUnit, startBattle)
// ============================================================
import {
  BOARD_COLS,
  BOARD_ROWS,
  MAX_AP,
} from "../data/index.js";
import { GameState, PlacedUnit } from "./types.js";
import {
  getUnitByRef,
  getUnitMaxHp,
  getUnitDisplayName,
  checkVictory,
  addLog,
} from "./helpers.js";

export function getTurnUnit(state: GameState): PlacedUnit | null {
  if (state.currentTurnIndex >= state.turnOrder.length) return null;
  const { playerIndex, unitIndex } = state.turnOrder[state.currentTurnIndex];
  const team = playerIndex === 0 ? state.p1Team.placed : state.p2Team.placed;
  if (unitIndex >= team.length) return null;
  const unit = team[unitIndex];
  if (unit.currentHp <= 0) return null;
  return unit;
}

export function advanceTurn(state: GameState): GameState {
  const prevIndex = state.currentTurnIndex;
  state.currentTurnIndex++;

  if (state.currentTurnIndex >= state.turnOrder.length) {
    for (const entry of state.turnOrder) {
      const unit = getUnitByRef(entry, state.p1Team.placed, state.p2Team.placed);
      if (!unit || unit.currentHp <= 0) continue;

      unit.skillUsedThisTurn = false;
      unit.leapBonus = 0;
      unit.movement = unit.baseMovement;
      unit.turnStartRow = unit.row;
      unit.turnStartCol = unit.col;

      if (unit.passiveId === "regeneration") {
        const maxHp = getUnitMaxHp(unit);
        unit.currentHp = Math.min(unit.currentHp + 1, maxHp);
        addLog(state, `${getUnitDisplayName(unit)} restores 1 HP via Regeneration!`, "heal");
      }
    }
    state.currentTurnIndex = 0;
    checkVictory(state);
    if (state.screen === "victory") return state;
  }

  let attempts = 0;
  while (attempts < state.turnOrder.length) {
    const next = state.turnOrder[state.currentTurnIndex % state.turnOrder.length];
    const unit = getUnitByRef(next, state.p1Team.placed, state.p2Team.placed);
    if (unit && unit.currentHp > 0) {
      unit.invulnerable = false;
      unit.turnStartRow = unit.row;
      unit.turnStartCol = unit.col;
      let apGain = 1;
      if (unit.passiveId === "desperate") apGain += 1;
      unit.ap = Math.min(unit.ap + apGain, MAX_AP);
      state.selectedUnit = { playerIndex: next.playerIndex, unitIndex: next.unitIndex };
      state.actionMode = "idle";
      state.selectedAction = null;
      addLog(state, `${getUnitDisplayName(unit)}'s turn.`, "info");
      return state;
    }
    state.currentTurnIndex++;
    attempts++;
  }
  return state;
}

export function startBattle(state: GameState): void {
  state.screen = "battle";
  state.log = [];

  // Build board from teams
  state.board = Array.from({ length: BOARD_ROWS }, () => Array(BOARD_COLS).fill(null));
  for (const unit of state.p1Team.placed) {
    state.board[unit.row][unit.col] = { ...unit, currentHp: unit.currentHp || getUnitMaxHp(unit) };
  }
  for (const unit of state.p2Team.placed) {
    state.board[unit.row][unit.col] = { ...unit, currentHp: unit.currentHp || getUnitMaxHp(unit) };
  }

  // Build turn order
  const allUnits: { playerIndex: 0 | 1; unitIndex: number; unit: PlacedUnit }[] = [];
  for (let i = 0; i < state.p1Team.placed.length; i++) {
    allUnits.push({ playerIndex: 0, unitIndex: i, unit: state.p1Team.placed[i] });
  }
  for (let i = 0; i < state.p2Team.placed.length; i++) {
    allUnits.push({ playerIndex: 1, unitIndex: i, unit: state.p2Team.placed[i] });
  }
  allUnits.sort((a, b) => b.unit.initiative - a.unit.initiative);

  state.turnOrder = allUnits.map(u => ({ playerIndex: u.playerIndex, unitIndex: u.unitIndex }));
  state.currentTurnIndex = 0;

  const firstUnit = getTurnUnit(state);
  if (firstUnit) {
    firstUnit.ap = 1;
    firstUnit.turnStartRow = firstUnit.row;
    firstUnit.turnStartCol = firstUnit.col;
    addLog(state, `${getUnitDisplayName(firstUnit)} leads the charge.`, "info");
  }
}
