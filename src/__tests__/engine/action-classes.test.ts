// ============================================================
//  ACTIONS — EndActionModeAction, SelectUnitAction tests
// ============================================================
import { describe, it, expect } from "vitest";
import { endActionMode } from "../../state/actions/EndActionModeAction.js";
import { selectUnit } from "../../state/actions/SelectUnitAction.js";
import { applyAction } from "../../state/game-engine.js";
import { createTestState, getUnitFromState } from "../../__tests__/test-fixtures.js";
import { createPlacedUnit } from "../../state.js";

describe("Actions — EndActionModeAction", () => {
  it("should set actionMode to idle and clear selectedAction", () => {
    const state = createTestState();
    state.p1Team.placed = [];
    state.p2Team.placed = [];
    state.actionMode = "selectTarget";
    state.selectedAction = { type: "attack", target: null as any, skillId: "test" };

    const result = applyAction(state, endActionMode());

    expect(result.actionMode).toBe("idle");
    expect(result.selectedAction).toBeNull();
  });

  it("should work with no existing action mode", () => {
    const state = createTestState();
    state.p1Team.placed = [];
    state.p2Team.placed = [];
    state.actionMode = "idle";
    state.selectedAction = null;

    const result = applyAction(state, endActionMode());

    expect(result.actionMode).toBe("idle");
    expect(result.selectedAction).toBeNull();
  });
});

describe("Actions — SelectUnitAction", () => {
  it("should select a unit by ref", () => {
    const state = createTestState();
    const unit1 = createPlacedUnit("warrior", "toughened", 2, 0, 0, { currentHp: 5, initiative: 5 });
    state.p1Team.placed = [unit1];
    state.board[2][0] = unit1;
    state.p2Team.placed = [];

    const result = applyAction(state, selectUnit({ playerIndex: 0, unitIndex: 0 }));

    expect(result.selectedUnit).toEqual({ playerIndex: 0, unitIndex: 0 });
  });

  it("should deselect a unit with null ref", () => {
    const state = createTestState();
    state.p1Team.placed = [];
    state.p2Team.placed = [];
    state.selectedUnit = { playerIndex: 0, unitIndex: 0 };

    const result = applyAction(state, selectUnit(null));

    expect(result.selectedUnit).toBeNull();
  });

  it("should update selectedUnit for P2 units", () => {
    const state = createTestState();
    const unit1 = createPlacedUnit("archer", "nimble", 9, 0, 1, { currentHp: 5, initiative: 5 });
    state.p1Team.placed = [];
    state.p2Team.placed = [unit1];
    state.board[9][0] = unit1;

    const result = applyAction(state, selectUnit({ playerIndex: 1, unitIndex: 0 }));

    expect(result.selectedUnit).toEqual({ playerIndex: 1, unitIndex: 0 });
  });
});
