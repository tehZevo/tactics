// ============================================================
//  STATE / MOVES — movement actions (executeMove, executeLeap)
// ============================================================
import { GameState, PlacedUnit } from "./types.js";
import {
  getReachableTiles,
  getUnitDisplayName,
  addLog,
  getTurnUnit,
} from "./helpers.js";

export function executeMove(state: GameState, row: number, col: number): void {
  const turnUnit = getTurnUnit(state);
  if (!turnUnit) return;

  const reachable = getReachableTiles(state, turnUnit);
  if (!reachable.has(`${row},${col}`)) return;
  if (state.board[row][col] !== null) return;

  const oldRow = turnUnit.row;
  const oldCol = turnUnit.col;
  const dist = Math.abs(row - oldRow) + Math.abs(col - oldCol);

  state.board[oldRow][oldCol] = null;
  turnUnit.row = row;
  turnUnit.col = col;
  state.board[row][col] = turnUnit;
  turnUnit.movement -= dist;
  turnUnit.leapBonus = 0;

  addLog(state, `${getUnitDisplayName(turnUnit)} moves to (${row},${col}).`);
  state.actionMode = "idle";
  state.selectedAction = null;
}

export function executeLeap(state: GameState, targetRow: number, targetCol: number): void {
  const turnUnit = getTurnUnit(state);
  if (!turnUnit) return;

  const leapBonus = turnUnit.leapBonus || 0;
  if (leapBonus <= 0) return;

  const reachable = getReachableTiles(state, turnUnit);
  if (!reachable.has(`${targetRow},${targetCol}`)) return;
  if (state.board[targetRow][targetCol] !== null) return;

  const oldRow = turnUnit.row;
  const oldCol = turnUnit.col;

  state.board[oldRow][oldCol] = null;
  turnUnit.row = targetRow;
  turnUnit.col = targetCol;
  state.board[targetRow][targetCol] = turnUnit;
  turnUnit.leapBonus = 0;

  addLog(state, `${getUnitDisplayName(turnUnit)} leaps to (${targetRow},${targetCol})!`);
  state.actionMode = "idle";
  state.selectedAction = null;
}
