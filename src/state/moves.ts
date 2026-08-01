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

  const dist = Math.abs(row - turnUnit.originalRow) + Math.abs(col - turnUnit.originalCol);
  turnUnit.tentativeRow = row;
  turnUnit.tentativeCol = col;
  turnUnit.movement -= dist;

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

  const dist = Math.abs(targetRow - turnUnit.originalRow) + Math.abs(targetCol - turnUnit.originalCol);
  turnUnit.tentativeRow = targetRow;
  turnUnit.tentativeCol = targetCol;
  turnUnit.leapBonus = 0;
  turnUnit.movement -= dist;

  addLog(state, `${getUnitDisplayName(turnUnit)} leaps to (${targetRow},${targetCol})!`);
  state.actionMode = "idle";
  state.selectedAction = null;
}
