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

    const unit1 = {
      typeId: "warrior" as const,
      passiveId: "toughened" as const,
      row: 1,
      col: 0,
      currentHp: UNIT_TYPE_DEFS["warrior"].hp,
      ap: 1,
      movement: UNIT_TYPE_DEFS["warrior"].movement,
      initiative: UNIT_TYPE_DEFS["warrior"].initiative,
      poisonTurns: 0,
      skillUsedThisTurn: false,
      invulnerable: false,
      playerIndex: 0 as 0 | 1,
    };

    const unit2 = {
      typeId: "archer" as const,
      passiveId: "nimble" as const,
      row: 4,
      col: 0,
      currentHp: UNIT_TYPE_DEFS["archer"].hp,
      ap: 1,
      movement: UNIT_TYPE_DEFS["archer"].movement,
      initiative: UNIT_TYPE_DEFS["archer"].initiative,
      poisonTurns: 0,
      skillUsedThisTurn: false,
      invulnerable: false,
      playerIndex: 1 as 0 | 1,
    };

    state.p1Team.placed = [unit1];
    state.p2Team.placed = [unit2];
    state.turnOrder = [
      { playerIndex: 0, unitIndex: 0 },
      { playerIndex: 1, unitIndex: 0 },
    ];
    state.currentTurnIndex = 0;

    const result = advanceTurn(state);
    expect(result.currentTurnIndex).toBe(1);
    const nextUnit = getUnitFromState(result, 1, 0);
    expect(nextUnit).not.toBeNull();
    expect(nextUnit!.invulnerable).toBe(false);
  });

  it("should wrap to player 1 after player 0", () => {
    const state = createTestState();

    const unit1 = {
      typeId: "warrior" as const,
      passiveId: "toughened" as const,
      row: 1,
      col: 0,
      currentHp: UNIT_TYPE_DEFS["warrior"].hp,
      ap: 1,
      movement: UNIT_TYPE_DEFS["warrior"].movement,
      initiative: UNIT_TYPE_DEFS["warrior"].initiative,
      poisonTurns: 0,
      skillUsedThisTurn: false,
      invulnerable: false,
      playerIndex: 0 as 0 | 1,
    };

    const unit2 = {
      typeId: "archer" as const,
      passiveId: "nimble" as const,
      row: 4,
      col: 0,
      currentHp: UNIT_TYPE_DEFS["archer"].hp,
      ap: 1,
      movement: UNIT_TYPE_DEFS["archer"].movement,
      initiative: UNIT_TYPE_DEFS["archer"].initiative,
      poisonTurns: 0,
      skillUsedThisTurn: false,
      invulnerable: false,
      playerIndex: 1 as 0 | 1,
    };

    state.p1Team.placed = [unit1];
    state.p2Team.placed = [unit2];
    state.turnOrder = [
      { playerIndex: 0, unitIndex: 0 },
      { playerIndex: 1, unitIndex: 0 },
    ];
    state.currentTurnIndex = 1;

    const result = advanceTurn(state);
    expect(result.currentTurnIndex).toBe(0);
    const nextUnit = getUnitFromState(result, 0, 0);
    expect(nextUnit).not.toBeNull();
  });

  it("should restore AP at start of turn", () => {
    const state = createTestState();

    const unit1 = {
      typeId: "warrior" as const,
      passiveId: "toughened" as const,
      row: 1,
      col: 0,
      currentHp: UNIT_TYPE_DEFS["warrior"].hp,
      ap: 0,
      movement: UNIT_TYPE_DEFS["warrior"].movement,
      initiative: UNIT_TYPE_DEFS["warrior"].initiative,
      poisonTurns: 0,
      skillUsedThisTurn: true,
      invulnerable: false,
      playerIndex: 0 as 0 | 1,
    };

    const unit2 = {
      typeId: "archer" as const,
      passiveId: "nimble" as const,
      row: 4,
      col: 0,
      currentHp: UNIT_TYPE_DEFS["archer"].hp,
      ap: 1,
      movement: UNIT_TYPE_DEFS["archer"].movement,
      initiative: UNIT_TYPE_DEFS["archer"].initiative,
      poisonTurns: 0,
      skillUsedThisTurn: false,
      invulnerable: false,
      playerIndex: 1 as 0 | 1,
    };

    state.p1Team.placed = [unit1];
    state.p2Team.placed = [unit2];
    state.turnOrder = [
      { playerIndex: 0, unitIndex: 0 },
      { playerIndex: 1, unitIndex: 0 },
    ];
    state.currentTurnIndex = 0;

    const result = advanceTurn(state);
    const unitAfterTurn = getUnitFromState(result, 0, 0);
    expect(unitAfterTurn).not.toBeNull();
    // Unit 0 was previous turn; unit 1 (next) gets +1 AP
    const unit1After = getUnitFromState(result, 1, 0);
    expect(unit1After).not.toBeNull();
    expect(unit1After!.ap).toBe(2);
  });

  it("should skip dead units", () => {
    const state = createTestState();

    const unit1 = {
      typeId: "warrior" as const,
      passiveId: "toughened" as const,
      row: 1,
      col: 0,
      currentHp: 0,
      ap: 1,
      movement: UNIT_TYPE_DEFS["warrior"].movement,
      initiative: UNIT_TYPE_DEFS["warrior"].initiative,
      poisonTurns: 0,
      skillUsedThisTurn: false,
      invulnerable: false,
      playerIndex: 0 as 0 | 1,
    };

    const unit2 = {
      typeId: "archer" as const,
      passiveId: "nimble" as const,
      row: 4,
      col: 0,
      currentHp: 50,
      ap: 1,
      movement: UNIT_TYPE_DEFS["archer"].movement,
      initiative: UNIT_TYPE_DEFS["archer"].initiative,
      poisonTurns: 0,
      skillUsedThisTurn: false,
      invulnerable: false,
      playerIndex: 1 as 0 | 1,
    };

    state.p1Team.placed = [unit1];
    state.p2Team.placed = [unit2];
    state.turnOrder = [
      { playerIndex: 0, unitIndex: 0 },
      { playerIndex: 1, unitIndex: 0 },
    ];
    state.currentTurnIndex = 0;

    const result = advanceTurn(state);
    const unit2After = getUnitFromState(result, 1, 0);
    expect(unit2After).not.toBeNull();
    expect(unit2After!.invulnerable).toBe(false);
  });

  it("should set initiative order correctly", () => {
    const state = createTestState();

    const unit1 = {
      typeId: "warrior" as const,
      passiveId: "toughened" as const,
      row: 1,
      col: 0,
      currentHp: 50,
      ap: 1,
      movement: UNIT_TYPE_DEFS["warrior"].movement,
      initiative: 5,
      poisonTurns: 0,
      skillUsedThisTurn: false,
      invulnerable: false,
      playerIndex: 0 as 0 | 1,
    };

    const unit2 = {
      typeId: "archer" as const,
      passiveId: "nimble" as const,
      row: 4,
      col: 0,
      currentHp: 50,
      ap: 1,
      movement: UNIT_TYPE_DEFS["archer"].movement,
      initiative: 3,
      poisonTurns: 0,
      skillUsedThisTurn: false,
      invulnerable: false,
      playerIndex: 1 as 0 | 1,
    };

    state.p1Team.placed = [unit1];
    state.p2Team.placed = [unit2];
    state.turnOrder = [
      { playerIndex: 0, unitIndex: 0 },
      { playerIndex: 1, unitIndex: 0 },
    ];
    state.currentTurnIndex = 0;

    const result = advanceTurn(state);
    expect(result.log[0].text).toContain("Archer");
  });

  it("should reset skillUsedThisTurn for entire round", () => {
    const state = createTestState();

    const unit1 = {
      typeId: "warrior" as const,
      passiveId: "toughened" as const,
      row: 1,
      col: 0,
      currentHp: 50,
      ap: 1,
      movement: UNIT_TYPE_DEFS["warrior"].movement,
      initiative: 5,
      poisonTurns: 0,
      skillUsedThisTurn: true,
      invulnerable: false,
      playerIndex: 0 as 0 | 1,
    };

    const unit2 = {
      typeId: "archer" as const,
      passiveId: "nimble" as const,
      row: 4,
      col: 0,
      currentHp: 50,
      ap: 1,
      movement: UNIT_TYPE_DEFS["archer"].movement,
      initiative: 3,
      poisonTurns: 0,
      skillUsedThisTurn: true,
      invulnerable: false,
      playerIndex: 1 as 0 | 1,
    };

    state.p1Team.placed = [unit1];
    state.p2Team.placed = [unit2];
    state.turnOrder = [
      { playerIndex: 0, unitIndex: 0 },
      { playerIndex: 1, unitIndex: 0 },
    ];
    state.currentTurnIndex = 1;

    const result = advanceTurn(state);
    expect(result.currentTurnIndex).toBe(0);
    const unit1After = getUnitFromState(result, 0, 0);
    expect(unit1After!.skillUsedThisTurn).toBe(false);
    const unit2After = getUnitFromState(result, 1, 0);
    expect(unit2After!.skillUsedThisTurn).toBe(false);
  });
});
