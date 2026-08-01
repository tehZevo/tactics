// ============================================================
//  GAME ENGINE — polymorphic action system
// ============================================================
// Each action type is a subclass of Action. The action itself
// is responsible for mutating the (cloned) GameState and returning it.
// applyAction is a thin wrapper: clone state, delegate to action.apply().

import { GameState, PlacedUnit } from "./types.js";
import { Action } from "./actions/index.js";
import { buildTurnOrder } from "./turns.js";

// ---- Deep clone helper for immutable API ----

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

// ---- Public API ----

export function applyAction(state: GameState, action: Action): GameState {
  // Return a deep clone so tests don't mutate the original
  const newState = deepClone(state);

  // Set up turn order if not present (tests may skip startBattle)
  if (newState.turnOrder.length === 0 &&
    (newState.p1Team.placed.length > 0 || newState.p2Team.placed.length > 0)) {
    newState.turnOrder = buildTurnOrder(newState.p1Team.placed, newState.p2Team.placed);
    newState.currentTurnIndex = 0;
  }

  // Delegate to the action
  return action.apply(newState);
}

export { Action } from "./actions/index.js";
export { getTurnUnit } from "./turns.js";
export { advanceTurn } from "./turns.js";
