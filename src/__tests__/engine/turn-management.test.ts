// ============================================================
//  GAME ENGINE — turn management tests
// ============================================================
import { describe, it, expect } from "vitest";
import { advanceTurn } from "../../state/game-engine.js";
import { createTestState, getUnitFromState } from "../../__tests__/test-fixtures.js";
import { UNIT_TYPE_DEFS } from "../../data/index.js";

describe("Game Engine — Turn Management", () => {
  it("should advance to next player", () => {
    const state = createTestState();
    state.currentTurn = 0;
    state.turnNumber = 1;

    const result = advanceTurn(state);
    expect(result.currentTurn).toBe(1);
    expect(result.turnNumber).toBe(2);
  });

  it("should wrap to player 1 after player 0", () => {
    const state = createTestState();
    state.currentTurn = 1;
    state.turnNumber = 1;

    const result = advanceTurn(state);
    expect(result.currentTurn).toBe(0);
    expect(result.turnNumber).toBe(2);
  });

  it("should restore AP at start of turn", () => {
    const state = createTestState();

    const unit1 = {
      typeId: "warrior" as const,
      passiveId: "toughened" as const,
      row: 0,
      col: 0,
      currentHp: UNIT_TYPE_DEFS["warrior"].hp,
      ap: 0,
      movement: UNIT_TYPE_DEFS["warrior"].movement,
      initiative: UNIT_TYPE_DEFS["warrior"].initiative,
      poisonTurns: 0,
      skillUsedThisTurn: true,
      invulnerable: false,
    };

    state.p1Team.placed = [unit1];
    state.board[1][0] = unit1;
    state.currentTurn = 0;
    state.turnNumber = 1;

    const result = advanceTurn(state);
    const unitAfterTurn = getUnitFromState(result, 0, 0);
    expect(unitAfterTurn).not.toBeNull();
    expect(unitAfterTurn!.ap).toBe(UNIT_TYPE_DEFS["warrior"].ap);
    expect(unitAfterTurn!.skillUsedThisTurn).toBe(false);
  });

  it("should handle poison damage each turn", () => {
    const state = createTestState();

    const unit1 = {
      typeId: "warrior" as const,
      passiveId: "toughened" as const,
      row: 0,
      col: 0,
      currentHp: 100,
      ap: 1,
      movement: 4,
      initiative: 5,
      poisonTurns: 2,
      skillUsedThisTurn: false,
      invulnerable: false,
    };

    state.p1Team.placed = [unit1];
    state.board[1][0] = unit1;
    state.currentTurn = 0;
    state.turnNumber = 1;

    const result = advanceTurn(state);
    const unitAfterTurn = getUnitFromState(result, 0, 0);
    expect(unitAfterTurn).not.toBeNull();
    expect(unitAfterTurn!.currentHp).toBe(99);
    expect(unitAfterTurn!.poisonTurns).toBe(1);
  });

  it("should remove poison when ticks expire", () => {
    const state = createTestState();

    const unit1 = {
      typeId: "warrior" as const,
      passiveId: "toughened" as const,
      row: 0,
      col: 0,
      currentHp: 100,
      ap: 1,
      movement: 4,
      initiative: 5,
      poisonTurns: 1,
      skillUsedThisTurn: false,
      invulnerable: false,
    };

    state.p1Team.placed = [unit1];
    state.board[1][0] = unit1;
    state.currentTurn = 0;
    state.turnNumber = 1;

    const result = advanceTurn(state);
    const unitAfterTurn = getUnitFromState(result, 0, 0);
    expect(unitAfterTurn).not.toBeNull();
    expect(unitAfterTurn!.poisonTurns).toBe(0);
  });

  it("should process multiple poison ticks", () => {
    const state = createTestState();

    const unit1 = {
      typeId: "warrior" as const,
      passiveId: "toughened" as const,
      row: 0,
      col: 0,
      currentHp: 100,
      ap: 1,
      movement: 4,
      initiative: 5,
      poisonTurns: 3,
      skillUsedThisTurn: false,
      invulnerable: false,
    };

    state.p1Team.placed = [unit1];
    state.board[1][0] = unit1;
    state.currentTurn = 0;
    state.turnNumber = 1;

    let result = advanceTurn(state);
    let unit = getUnitFromState(result, 0, 0);
    expect(unit).not.toBeNull();
    expect(unit!.currentHp).toBe(99);
    expect(unit!.poisonTurns).toBe(2);

    result = advanceTurn(result);
    unit = getUnitFromState(result, 0, 0);
    expect(unit).not.toBeNull();
    expect(unit!.currentHp).toBe(98);
    expect(unit!.poisonTurns).toBe(1);

    result = advanceTurn(result);
    unit = getUnitFromState(result, 0, 0);
    expect(unit).not.toBeNull();
    expect(unit!.currentHp).toBe(97);
    expect(unit!.poisonTurns).toBe(0);
  });

  it("should skip dead units", () => {
    const state = createTestState();

    const unit1 = {
      typeId: "warrior" as const,
      passiveId: "toughened" as const,
      row: 0,
      col: 0,
      currentHp: 0,
      ap: 1,
      movement: 4,
      initiative: 5,
      poisonTurns: 0,
      skillUsedThisTurn: false,
      invulnerable: false,
    };

    const unit2 = {
      typeId: "archer" as const,
      passiveId: "nimble" as const,
      row: 5,
      col: 0,
      currentHp: 50,
      ap: 1,
      movement: 6,
      initiative: 3,
      poisonTurns: 0,
      skillUsedThisTurn: false,
      invulnerable: false,
    };

    state.p1Team.placed = [unit1, unit2];
    state.board[1][0] = unit1;
    state.board[4][0] = unit2;
    state.currentTurn = 0;
    state.turnNumber = 1;

    const result = advanceTurn(state);
    const unit2After = getUnitFromState(result, 0, 1);
    expect(unit2After).not.toBeNull();
    expect(unit2After!.ap).toBe(UNIT_TYPE_DEFS["archer"].ap);
  });

  it("should set initiative order correctly", () => {
    const state = createTestState();

    const unit1 = {
      typeId: "warrior" as const,
      passiveId: "toughened" as const,
      row: 0,
      col: 0,
      currentHp: 50,
      ap: 1,
      movement: 4,
      initiative: 5,
      poisonTurns: 0,
      skillUsedThisTurn: false,
      invulnerable: false,
    };

    const unit2 = {
      typeId: "archer" as const,
      passiveId: "nimble" as const,
      row: 5,
      col: 0,
      currentHp: 50,
      ap: 1,
      movement: 6,
      initiative: 3,
      poisonTurns: 0,
      skillUsedThisTurn: false,
      invulnerable: false,
    };

    state.p1Team.placed = [unit1];
    state.p2Team.placed = [unit2];
    state.board[1][0] = unit1;
    state.board[4][0] = unit2;
    state.currentTurn = 0;
    state.turnNumber = 1;

    const result = advanceTurn(state);
    expect(result.log[0].type).toBe("turn_start");
    expect(result.log[0].text).toContain("Initiative order");
  });

  it("should maintain turn number across advances", () => {
    const state = createTestState();
    state.currentTurn = 0;
    state.turnNumber = 1;

    let result = advanceTurn(state);
    expect(result.turnNumber).toBe(2);

    result = advanceTurn(result);
    expect(result.turnNumber).toBe(3);

    result = advanceTurn(result);
    expect(result.turnNumber).toBe(4);
  });
});
