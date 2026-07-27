import { GameState } from "../types.js";
import { Action } from "./Action.js";
import { executeMove } from "../moves.js";

export class MoveAction extends Action {
  constructor(
    private readonly targetRow: number,
    private readonly targetCol: number
  ) {
    super();
  }

  apply(state: GameState): GameState {
    executeMove(state, this.targetRow, this.targetCol);
    return state;
  }
}

export function move(targetRow: number, targetCol: number): MoveAction {
  return new MoveAction(targetRow, targetCol);
}
