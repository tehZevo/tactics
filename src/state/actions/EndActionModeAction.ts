import { GameState } from "../types.js";
import { Action } from "./Action.js";

export class EndActionModeAction extends Action {
  apply(state: GameState): GameState {
    state.actionMode = "idle";
    state.selectedAction = null;
    return state;
  }
}

export function endActionMode(): EndActionModeAction {
  return new EndActionModeAction();
}
