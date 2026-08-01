// ============================================================
//  MOVES — executeLeap tests
// ============================================================
import { describe, it, expect } from "vitest";
import { executeLeap } from "../../state/moves.js";
import { createPlacedUnit } from "../../state.js";
import { createTestState, getUnitFromState } from "../../__tests__/test-fixtures.js";

describe("Moves — executeLeap", () => {
  it("should leap a unit to a valid target", () => {
    const state = createTestState();
    const unit1 = createPlacedUnit("warrior", "toughened", 1, 0, 0);
    unit1.leapBonus = 3;

    state.p1Team.placed = [unit1];
    state.board[1][0] = unit1;
    state.turnOrder = [{ playerIndex: 0, unitIndex: 0 }];
    state.currentTurnIndex = 0;

    executeLeap(state, 3, 0);

    // Unit should have tentative position set
    expect(unit1.tentativeRow).toBe(3);
    expect(unit1.tentativeCol).toBe(0);
    expect(unit1.leapBonus).toBe(0);
    // Unit should still be at original position on board
    expect(state.board[1][0]).not.toBeNull();
  });

  it("should not leap if leapBonus is 0", () => {
    const state = createTestState();
    const unit1 = createPlacedUnit("warrior", "toughened", 1, 0, 0);

    state.p1Team.placed = [unit1];
    state.board[1][0] = unit1;
    state.turnOrder = [{ playerIndex: 0, unitIndex: 0 }];
    state.currentTurnIndex = 0;

    executeLeap(state, 3, 0);

    // Unit should stay in place
    expect(state.board[1][0]).toBe(unit1);
  });

  it("should not leap to occupied tile", () => {
    const state = createTestState();
    const unit1 = createPlacedUnit("warrior", "toughened", 1, 0, 0);
    unit1.leapBonus = 3;
    const unit2 = createPlacedUnit("archer", "nimble", 3, 0, 0);

    state.p1Team.placed = [unit1, unit2];
    state.board[1][0] = unit1;
    state.board[3][0] = unit2;
    state.turnOrder = [{ playerIndex: 0, unitIndex: 0 }];
    state.currentTurnIndex = 0;

    executeLeap(state, 3, 0);

    // Unit should not have moved
    expect(state.board[1][0]).toBe(unit1);
  });

  it("should add log message for leap", () => {
    const state = createTestState();
    const unit1 = createPlacedUnit("warrior", "toughened", 1, 0, 0);
    unit1.leapBonus = 3;

    state.p1Team.placed = [unit1];
    state.board[1][0] = unit1;
    state.turnOrder = [{ playerIndex: 0, unitIndex: 0 }];
    state.currentTurnIndex = 0;

    executeLeap(state, 2, 0);

    expect(state.log.some(l => l.text.includes("leaps"))).toBe(true);
  });

  it("should clear action mode and selected action after leap", () => {
    const state = createTestState();
    const unit1 = createPlacedUnit("warrior", "toughened", 1, 0, 0);
    unit1.leapBonus = 3;
    state.p1Team.placed = [unit1];
    state.board[1][0] = unit1;
    state.turnOrder = [{ playerIndex: 0, unitIndex: 0 }];
    state.currentTurnIndex = 0;
    state.actionMode = "selectTarget";
    state.selectedAction = { type: "leap", target: null as any };

    executeLeap(state, 2, 0);

    expect(state.actionMode).toBe("idle");
    expect(state.selectedAction).toBeNull();
  });

  it("should handle no turn unit gracefully", () => {
    const state = createTestState();
    state.p1Team.placed = [];
    state.p2Team.placed = [];
    state.turnOrder = [];
    state.currentTurnIndex = 0;

    // Should not throw
    expect(() => executeLeap(state, 2, 0)).not.toThrow();
  });
});
