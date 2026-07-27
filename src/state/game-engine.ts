// ============================================================
//  GAME ENGINE — polymorphic action system
// ============================================================
// Each action type is a subclass of Action. The action itself
// is responsible for mutating the (cloned) GameState and returning it.
// applyAction is a thin wrapper: clone state, delegate to action.apply().

import { GameState, PlacedUnit } from "./types.js";
import { Action } from "./actions/index.js";

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
    const allUnits: { playerIndex: 0 | 1; unitIndex: number; unit: PlacedUnit }[] = [];
    for (let i = 0; i < newState.p1Team.placed.length; i++) {
      allUnits.push({ playerIndex: 0, unitIndex: i, unit: newState.p1Team.placed[i] });
    }
    for (let i = 0; i < newState.p2Team.placed.length; i++) {
      allUnits.push({ playerIndex: 1, unitIndex: i, unit: newState.p2Team.placed[i] });
    }
    allUnits.sort((a, b) => b.unit.initiative - a.unit.initiative);
    newState.turnOrder = allUnits.map(u => ({ playerIndex: u.playerIndex, unitIndex: u.unitIndex }));
    newState.currentTurnIndex = 0;
  }

  // Delegate to the action
  return action.apply(newState);
}

export { Action } from "./actions/index.js";
export { getTurnUnit } from "./turns.js";
export { advanceTurn } from "./turns.js";
