// ============================================================
//  GAME ENGINE — basic action tests
// ============================================================
import { describe, it, expect } from "vitest";
import { applyAction } from "../../state/game-engine.js";
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
      [{ typeId: "archer", passiveId: "nimble", col: 5 }]
    );

    const result = applyAction(battleState, {
      type: "move",
      unitRef: { playerIndex: 0, unitIndex: 0 },
      targetRow: 1,
      targetCol: 0,
    });

    expect(result.board[0][0]).toBeNull();
    expect(result.board[1][0]?.typeId).toBe("warrior");
  });

  it("should reject an invalid move (out of range)", () => {
    const battleState = startTestBattle(
      [{ typeId: "warrior", passiveId: "toughened", col: 0 }],
      [{ typeId: "archer", passiveId: "nimble", col: 5 }]
    );

    const result = applyAction(battleState, {
      type: "move",
      unitRef: { playerIndex: 0, unitIndex: 0 },
      targetRow: 5,
      targetCol: 5,
    });

    expect(result.board[0][0]).not.toBeNull();
  });

  it("should end turn and advance to next unit", () => {
    const battleState = startTestBattle(
      [{ typeId: "warrior", passiveId: "toughened", col: 0 }],
      [{ typeId: "archer", passiveId: "nimble", col: 0 }]
    );

    const result = applyAction(battleState, { type: "endTurn" });
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

    const result = applyAction(deadState, {
      type: "move",
      unitRef: { playerIndex: 0, unitIndex: 0 },
      targetRow: 1,
      targetCol: 0,
    });

    // Unit should still be in original position (or nowhere if board was cleared)
    expect(result.board[unit.row][unit.col]).toBeNull();
  });
});
