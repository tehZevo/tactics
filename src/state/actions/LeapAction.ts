import { GameState } from "../types.js";
import { Action } from "./Action.js";
import { getUnitByRef } from "../helpers.js";
import { executeLeap } from "../moves.js";
import { advanceTurn } from "../turns.js";

export class LeapAction extends Action {
  constructor(
    private readonly unitRef: { playerIndex: 0 | 1; unitIndex: number },
    private readonly row: number,
    private readonly col: number
  ) {
    super();
  }

  apply(state: GameState): GameState {
    const currentTurnEntry = state.turnOrder[state.currentTurnIndex];
    if (this.unitRef && currentTurnEntry) {
      const targetUnit = getUnitByRef(this.unitRef, state.p1Team.placed, state.p2Team.placed);
      if (targetUnit && targetUnit.currentHp > 0) {
        const isSameUnit = currentTurnEntry.playerIndex === this.unitRef.playerIndex &&
          currentTurnEntry.unitIndex === this.unitRef.unitIndex;
        if (!isSameUnit) {
          let advanced = false;
          for (let i = 0; i < state.turnOrder.length; i++) {
            advanceTurn(state);
            const newTurnEntry = state.turnOrder[state.currentTurnIndex];
            if (newTurnEntry && newTurnEntry.playerIndex === this.unitRef.playerIndex &&
              newTurnEntry.unitIndex === this.unitRef.unitIndex) {
              advanced = true;
              break;
            }
          }
          if (!advanced) {
            return state;
          }
        }
      } else {
        return state;
      }
    }
    executeLeap(state, this.row, this.col);
    return state;
  }
}

export function leap(unitRef: { playerIndex: 0 | 1; unitIndex: number }, row: number, col: number): LeapAction {
  return new LeapAction(unitRef, row, col);
}
