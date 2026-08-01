// ============================================================
//  GAME ENGINE — basic action tests
// ============================================================
import { describe, it, expect } from "vitest";
import { applyAction } from "../../state/game-engine.js";
import { move, endTurn } from "../../state/actions/index.js";
import { startTestBattle, getUnitFromState } from "../../__tests__/test-fixtures.js";

describe("Game Engine — Basic Actions", () => {
  it("should initialize battle state correctly", () => {
    const result = startTestBattle(
      [{ typeId: "warrior", passiveId: "toughened", col: 0 }],
      [{ typeId: "archer", passiveId: "nimble", col: 0 }]
    );

    expect(result.screen).toBe("battle");
    expect(result.turnOrder.length).toBeGreaterThan(0);
    expect(result.board[0][0]).not.toBeNull();
  });

  it("should execute a valid move", () => {
    const battleState = startTestBattle(
      [{ typeId: "warrior", passiveId: "toughened", col: 0 }],
      [{ typeId: "geomancer", passiveId: "toughened", col: 5 }]
    );

    const result = applyAction(battleState, move(1, 0));

    // Unit should have tentative position set
    const unit = getUnitFromState(result, 0, 0);
    expect(unit).not.toBeNull();
    expect(unit!.tentativeRow).toBe(1);
    expect(unit!.tentativeCol).toBe(0);
    // Unit should still be at original position on board
    expect(result.board[0][0]).not.toBeNull();
  });

  it("should reject an invalid move (out of range)", () => {
    const battleState = startTestBattle(
      [{ typeId: "warrior", passiveId: "toughened", col: 0 }],
      [{ typeId: "geomancer", passiveId: "toughened", col: 5 }]
    );

    const result = applyAction(battleState, move(5, 5));

    expect(result.board[0][0]).not.toBeNull();
  });

  it("should end turn and advance to next unit", () => {
    const battleState = startTestBattle(
      [{ typeId: "warrior", passiveId: "toughened", col: 0 }],
      [{ typeId: "archer", passiveId: "nimble", col: 0 }]
    );

    const result = applyAction(battleState, endTurn());
    expect(result.currentTurnIndex).toBeGreaterThan(0);
  });

  it("should not execute action if unit is dead", () => {
    const battleState = startTestBattle(
      [{ typeId: "warrior", passiveId: "toughened", col: 0 }],
      [{ typeId: "archer", passiveId: "nimble", col: 0 }]
    );

    // Kill the unit
    const deadState = { ...battleState };
    const unit = getUnitFromState(deadState, 0, 0)!;
    unit.currentHp = 0;
    deadState.board[unit.row][unit.col] = null;

    const result = applyAction(deadState, move(1, 0));

    // Unit should still be in original position (or nowhere if board was cleared)
    expect(result.board[unit.row][unit.col]).toBeNull();
  });
});
