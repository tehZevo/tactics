import { GameState } from "../types.js";
import { Action } from "./Action.js";

export class SelectUnitAction extends Action {
  constructor(
    private readonly unitRef: { playerIndex: 0 | 1; unitIndex: number } | null
  ) {
    super();
  }

  apply(state: GameState): GameState {
    state.selectedUnit = this.unitRef;
    return state;
  }
}

export function selectUnit(unitRef: { playerIndex: 0 | 1; unitIndex: number } | null): SelectUnitAction {
  return new SelectUnitAction(unitRef);
}
