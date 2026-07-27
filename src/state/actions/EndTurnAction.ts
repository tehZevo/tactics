import { GameState } from "../types.js";
import { Action } from "./Action.js";
import { advanceTurn } from "../turns.js";

export class EndTurnAction extends Action {
  apply(state: GameState): GameState {
    advanceTurn(state);
    return state;
  }
}

export function endTurn(): EndTurnAction {
  return new EndTurnAction();
}
