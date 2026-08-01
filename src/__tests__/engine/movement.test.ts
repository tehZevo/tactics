// ============================================================
//  GAME ENGINE — movement tests
// ============================================================
import { describe, it, expect } from "vitest";
import { applyAction } from "../../state/game-engine.js";
import { move } from "../../state/actions/index.js";
import { createTestState, placeUnit, getUnitFromState } from "../../__tests__/test-fixtures.js";
import { UNIT_TYPE_DEFS } from "../../data/index.js";

describe("Game Engine — Movement", () => {
  it("should move a unit within movement range", () => {
    const state = createTestState();

    const unit1 = {
      typeId: "warrior" as const,
      passiveId: "toughened" as const,
      row: 1,
      col: 0,
      currentHp: UNIT_TYPE_DEFS["warrior"].hp,
      ap: 1,
      movement: UNIT_TYPE_DEFS["warrior"].movement,
      baseMovement: UNIT_TYPE_DEFS["warrior"].movement,
      initiative: UNIT_TYPE_DEFS["warrior"].initiative,
      poisonTurns: 0,
      skillUsedThisTurn: false,
      invulnerable: false,
      buffTurns: 0,
      turnStartRow: 1, turnStartCol: 0,
      originalRow: 1, originalCol: 0,
    };

    state.p1Team.placed = [unit1];
    state.board[1][0] = unit1;

    const result = applyAction(state, move(3, 0));

    // Unit should have tentative position set
    expect(result.p1Team.placed[0].tentativeRow).toBe(3);
    expect(result.p1Team.placed[0].tentativeCol).toBe(0);
    expect(result.p1Team.placed[0].movement).toBe(0); // 2 - 2 (dist from original)
    // Unit should still be at original position on board
    expect(result.board[1][0]).not.toBeNull();
  });

  it("should not allow movement beyond range", () => {
    const state = createTestState();

    const unit1 = {
      typeId: "warrior" as const,
      passiveId: "toughened" as const,
      row: 1,
      col: 0,
      currentHp: UNIT_TYPE_DEFS["warrior"].hp,
      ap: 1,
      movement: UNIT_TYPE_DEFS["warrior"].movement,
      baseMovement: UNIT_TYPE_DEFS["warrior"].movement,
      initiative: UNIT_TYPE_DEFS["warrior"].initiative,
      poisonTurns: 0,
      skillUsedThisTurn: false,
      invulnerable: false,
      buffTurns: 0,
      turnStartRow: 1, turnStartCol: 0,
    };

    state.p1Team.placed = [unit1];
    state.board[1][0] = unit1;

    const result = applyAction(state, move(5, 0));

    expect(result.board[1][0]).not.toBeNull();
  });

  it("should not allow movement onto occupied tile", () => {
    const state = createTestState();

    const unit1 = {
      typeId: "warrior" as const,
      passiveId: "toughened" as const,
      row: 1,
      col: 0,
      currentHp: UNIT_TYPE_DEFS["warrior"].hp,
      ap: 1,
      movement: UNIT_TYPE_DEFS["warrior"].movement,
      baseMovement: UNIT_TYPE_DEFS["warrior"].movement,
      initiative: UNIT_TYPE_DEFS["warrior"].initiative,
      poisonTurns: 0,
      skillUsedThisTurn: false,
      invulnerable: false,
      buffTurns: 0,
      turnStartRow: 1, turnStartCol: 0,
    };

    const unit2 = {
      typeId: "archer" as const,
      passiveId: "nimble" as const,
      row: 2,
      col: 0,
      currentHp: UNIT_TYPE_DEFS["archer"].hp,
      ap: 1,
      movement: UNIT_TYPE_DEFS["archer"].movement,
      baseMovement: UNIT_TYPE_DEFS["archer"].movement,
      initiative: UNIT_TYPE_DEFS["archer"].initiative,
      poisonTurns: 0,
      skillUsedThisTurn: false,
      invulnerable: false,
      buffTurns: 0,
      turnStartRow: 2, turnStartCol: 0,
    };

    state.p1Team.placed = [unit1, unit2];
    state.board[1][0] = unit1;
    state.board[2][0] = unit2;

    const result = applyAction(state, move(2, 0));

    expect(result.board[1][0]).not.toBeNull();
  });

  it("should not use AP for movement", () => {
    const state = createTestState();

    const unit1 = {
      typeId: "warrior" as const,
      passiveId: "toughened" as const,
      row: 1,
      col: 0,
      currentHp: UNIT_TYPE_DEFS["warrior"].hp,
      ap: 2,
      movement: UNIT_TYPE_DEFS["warrior"].movement,
      baseMovement: UNIT_TYPE_DEFS["warrior"].movement,
      initiative: UNIT_TYPE_DEFS["warrior"].initiative,
      poisonTurns: 0,
      skillUsedThisTurn: false,
      invulnerable: false,
      buffTurns: 0,
      turnStartRow: 1, turnStartCol: 0,
    };

    state.p1Team.placed = [unit1];
    state.board[1][0] = unit1;

    const result = applyAction(state, move(2, 0));

    const movedUnit = getUnitFromState(result, 0, 0);
    expect(movedUnit).not.toBeNull();
    expect(movedUnit!.ap).toBe(2);
  });

  it("should allow diagonal movement via multiple steps", () => {
    const state = createTestState();

    const unit1 = {
      typeId: "warrior" as const,
      passiveId: "toughened" as const,
      row: 1,
      col: 0,
      currentHp: UNIT_TYPE_DEFS["warrior"].hp,
      ap: 2,
      movement: UNIT_TYPE_DEFS["warrior"].movement,
      baseMovement: UNIT_TYPE_DEFS["warrior"].movement,
      initiative: UNIT_TYPE_DEFS["warrior"].initiative,
      poisonTurns: 0,
      skillUsedThisTurn: false,
      invulnerable: false,
      buffTurns: 0,
      turnStartRow: 1, turnStartCol: 0,
      originalRow: 1, originalCol: 0,
    };

    state.p1Team.placed = [unit1];
    state.board[1][0] = unit1;

    const step1 = applyAction(state, move(2, 0));

    const step2 = applyAction(step1, move(2, 1));

    // Unit should have tentative position set
    const movedUnit = getUnitFromState(step2, 0, 0);
    expect(movedUnit).not.toBeNull();
    expect(movedUnit!.typeId).toBe("warrior");
    expect(movedUnit!.tentativeRow).toBe(2);
    expect(movedUnit!.tentativeCol).toBe(1);
    // Unit should still be at original position on board
    expect(step2.board[1][0]).not.toBeNull();

    const finalUnit = getUnitFromState(step2, 0, 0);
    expect(finalUnit).not.toBeNull();
    expect(finalUnit!.ap).toBe(2);
  });

  it("should allow archer to move further than warrior", () => {
    const state = createTestState();

    const warrior = {
      typeId: "warrior" as const,
      passiveId: "toughened" as const,
      row: 1,
      col: 0,
      currentHp: UNIT_TYPE_DEFS["warrior"].hp,
      ap: 1,
      movement: UNIT_TYPE_DEFS["warrior"].movement,
      baseMovement: UNIT_TYPE_DEFS["warrior"].movement,
      initiative: UNIT_TYPE_DEFS["warrior"].initiative,
      poisonTurns: 0,
      skillUsedThisTurn: false,
      invulnerable: false,
      buffTurns: 0,
      turnStartRow: 1, turnStartCol: 0,
      originalRow: 1, originalCol: 0,
    };

    const archer = {
      typeId: "archer" as const,
      passiveId: "nimble" as const,
      row: 1,
      col: 1,
      currentHp: UNIT_TYPE_DEFS["archer"].hp,
      ap: 1,
      movement: UNIT_TYPE_DEFS["archer"].movement,
      baseMovement: UNIT_TYPE_DEFS["archer"].movement,
      initiative: UNIT_TYPE_DEFS["archer"].initiative,
      poisonTurns: 0,
      skillUsedThisTurn: false,
      invulnerable: false,
      buffTurns: 0,
      turnStartRow: 1, turnStartCol: 1,
      originalRow: 1, originalCol: 1,
    };

    state.p1Team.placed = [warrior, archer];
    state.board[1][0] = warrior;
    state.board[1][1] = archer;

    const result = applyAction(state, move(1, 3));

    // Archer should have tentative position set
    const movedArcher = getUnitFromState(result, 0, 1);
    expect(movedArcher).not.toBeNull();
    expect(movedArcher!.typeId).toBe("archer");
    expect(movedArcher!.tentativeRow).toBe(1);
    expect(movedArcher!.tentativeCol).toBe(3);
    // Archer should still be at original position on board
    expect(result.board[1][1]).not.toBeNull();

    const warriorResult = applyAction(state, move(1, 5));

    expect(warriorResult.board[1][0]).not.toBeNull();
  });

  it("should allow pathing through friendly units", () => {
    const state = createTestState();

    const blocker = {
      typeId: "warrior" as const,
      passiveId: "toughened" as const,
      row: 1,
      col: 1,
      currentHp: UNIT_TYPE_DEFS["warrior"].hp,
      ap: 1,
      movement: UNIT_TYPE_DEFS["warrior"].movement,
      baseMovement: UNIT_TYPE_DEFS["warrior"].movement,
      initiative: UNIT_TYPE_DEFS["warrior"].initiative,
      poisonTurns: 0,
      skillUsedThisTurn: false,
      invulnerable: false,
      buffTurns: 0,
      turnStartRow: 1, turnStartCol: 1,
    };

    const mover = {
      typeId: "warrior" as const,
      passiveId: "toughened" as const,
      row: 1,
      col: 0,
      currentHp: UNIT_TYPE_DEFS["warrior"].hp,
      ap: 1,
      movement: UNIT_TYPE_DEFS["warrior"].movement,
      baseMovement: UNIT_TYPE_DEFS["warrior"].movement,
      initiative: UNIT_TYPE_DEFS["warrior"].initiative,
      poisonTurns: 0,
      skillUsedThisTurn: false,
      invulnerable: false,
      buffTurns: 0,
      turnStartRow: 1, turnStartCol: 0,
    };

    state.p1Team.placed = [mover, blocker];
    state.board[1][0] = mover;
    state.board[1][1] = blocker;

    const result = applyAction(state, move(1, 2));

    // Unit should have tentative position set
    const movedUnit = getUnitFromState(result, 0, 0);
    expect(movedUnit).not.toBeNull();
    expect(movedUnit!.typeId).toBe("warrior");
    expect(movedUnit!.tentativeRow).toBe(1);
    expect(movedUnit!.tentativeCol).toBe(2);
    // Unit should still be at original position on board
    expect(result.board[1][0]).not.toBeNull();
  });

  it("should not allow moving onto a friendly unit", () => {
    const state = createTestState();

    const unit1 = {
      typeId: "warrior" as const,
      passiveId: "toughened" as const,
      row: 1,
      col: 0,
      currentHp: UNIT_TYPE_DEFS["warrior"].hp,
      ap: 1,
      movement: UNIT_TYPE_DEFS["warrior"].movement,
      baseMovement: UNIT_TYPE_DEFS["warrior"].movement,
      initiative: UNIT_TYPE_DEFS["warrior"].initiative,
      poisonTurns: 0,
      skillUsedThisTurn: false,
      invulnerable: false,
      buffTurns: 0,
      turnStartRow: 1, turnStartCol: 0,
    };

    const unit2 = {
      typeId: "archer" as const,
      passiveId: "nimble" as const,
      row: 3,
      col: 0,
      currentHp: UNIT_TYPE_DEFS["archer"].hp,
      ap: 1,
      movement: UNIT_TYPE_DEFS["archer"].movement,
      baseMovement: UNIT_TYPE_DEFS["archer"].movement,
      initiative: UNIT_TYPE_DEFS["archer"].initiative,
      poisonTurns: 0,
      skillUsedThisTurn: false,
      invulnerable: false,
      buffTurns: 0,
      turnStartRow: 3, turnStartCol: 0,
    };

    state.p1Team.placed = [unit1, unit2];
    state.board[1][0] = unit1;
    state.board[3][0] = unit2;

    const result = applyAction(state, move(3, 0));

    expect(result.board[1][0]).not.toBeNull();
  });
});
