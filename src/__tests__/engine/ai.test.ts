// ============================================================
//  AI — computer opponent logic tests
// ============================================================
import { describe, it, expect, vi, beforeEach } from "vitest";
import { aiTakeTurn } from "../../state/ai.js";
import { createPlacedUnit } from "../../state.js";
import { createTestState, getUnitFromState } from "../../__tests__/test-fixtures.js";

describe("AI — aiTakeTurn", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("should do nothing if no turn unit exists", () => {
    const state = createTestState();
    state.turnOrder = [];
    aiTakeTurn(state);
    expect(state.currentTurnIndex).toBe(0);
  });

  it("should skip turn for player 0 units (not AI-controlled)", () => {
    const state = createTestState();
    const unit1 = createPlacedUnit("warrior", "toughened", 2, 0, 0);
    state.p1Team.placed = [unit1];
    state.turnOrder = [{ playerIndex: 0, unitIndex: 0 }];
    state.currentTurnIndex = 0;
    state.board[2][0] = unit1;

    aiTakeTurn(state);
    // Should not take any action since player 0 is not AI
    expect(state.log).toHaveLength(0);
  });

  it("should skip turn if AI unit has no AP", () => {
    const state = createTestState();
    const unit1 = createPlacedUnit("warrior", "toughened", 10, 0, 1);
    unit1.ap = 0;
    state.p2Team.placed = [unit1];
    state.turnOrder = [{ playerIndex: 1, unitIndex: 0 }];
    state.currentTurnIndex = 0;
    state.board[10][0] = unit1;

    aiTakeTurn(state);
    // No action should be taken (no enemies, or no AP)
    expect(state.log).toHaveLength(0);
  });

  it("should skip turn if AI unit already used skill", () => {
    const state = createTestState();
    const unit1 = createPlacedUnit("warrior", "toughened", 10, 0, 1);
    unit1.skillUsedThisTurn = true;
    state.p2Team.placed = [unit1];
    state.turnOrder = [{ playerIndex: 1, unitIndex: 0 }];
    state.currentTurnIndex = 0;
    state.board[10][0] = unit1;

    aiTakeTurn(state);
    // Should just advance turn without action
    expect(state.log).toHaveLength(0);
  });

  it("should do nothing if no enemy units exist", () => {
    const state = createTestState();
    const unit1 = createPlacedUnit("warrior", "toughened", 10, 0, 1);
    state.p2Team.placed = [unit1];
    state.turnOrder = [{ playerIndex: 1, unitIndex: 0 }];
    state.currentTurnIndex = 0;
    state.board[10][0] = unit1;
    state.p1Team.placed = [];

    aiTakeTurn(state);
    // No enemy, no action
    expect(state.log).toHaveLength(0);
  });
});
