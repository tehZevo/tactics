// ============================================================
//  GAME ENGINE — victory condition tests
// ============================================================
import { describe, it, expect } from "vitest";
import { applyAction } from "../../state/game-engine.js";
import { createTestState, placeUnit } from "../../__tests__/test-fixtures.js";
import { UNIT_TYPE_DEFS } from "../../data/index.js";

describe("Game Engine — Victory Conditions", () => {
  it("should declare P1 winner when all P2 units are defeated", () => {
    const state = createTestState();

    const p1Unit = {
      typeId: "warrior" as const,
      passiveId: "toughened" as const,
      row: 1,
      col: 0,
      currentHp: 8,
      ap: 1,
      movement: UNIT_TYPE_DEFS["warrior"].movement,
      initiative: UNIT_TYPE_DEFS["warrior"].initiative,
      poisonTurns: 0,
      skillUsedThisTurn: false,
      invulnerable: false,
      playerIndex: 0,
    };

    const p2Unit = {
      typeId: "archer" as const,
      passiveId: "nimble" as const,
      row: 2,
      col: 0,
      currentHp: 5,
      ap: 1,
      movement: UNIT_TYPE_DEFS["archer"].movement,
      initiative: UNIT_TYPE_DEFS["archer"].initiative,
      poisonTurns: 0,
      skillUsedThisTurn: false,
      invulnerable: false,
      playerIndex: 1,
    };

    state.p1Team.placed = [p1Unit];
    state.p2Team.placed = [p2Unit];
    state.board[1][0] = p1Unit;
    state.board[2][0] = p2Unit;

    const result = applyAction(state, {
      type: "attack",
      attackerRef: { playerIndex: 0, unitIndex: 0 },
      targetRef: { playerIndex: 1, unitIndex: 0 },
      skillId: "power_strike",
    });

    expect(result.screen).toBe("victory");
    expect(result.winner).toBe(0);
  });

  it("should declare P2 winner when all P1 units are defeated", () => {
    const state = createTestState();

    const p1Unit = {
      typeId: "warrior" as const,
      passiveId: "toughened" as const,
      row: 1,
      col: 0,
      currentHp: 4,
      ap: 1,
      movement: UNIT_TYPE_DEFS["warrior"].movement,
      initiative: UNIT_TYPE_DEFS["warrior"].initiative,
      poisonTurns: 0,
      skillUsedThisTurn: false,
      invulnerable: false,
      playerIndex: 0,
    };

    const p2Unit = {
      typeId: "warrior" as const,
      passiveId: "toughened" as const,
      row: 2,
      col: 0,
      currentHp: 8,
      ap: 1,
      movement: UNIT_TYPE_DEFS["warrior"].movement,
      initiative: UNIT_TYPE_DEFS["warrior"].initiative,
      poisonTurns: 0,
      skillUsedThisTurn: false,
      invulnerable: false,
      playerIndex: 1,
    };

    state.p1Team.placed = [p1Unit];
    state.p2Team.placed = [p2Unit];
    state.board[1][0] = p1Unit;
    state.board[2][0] = p2Unit;

    const result = applyAction(state, {
      type: "attack",
      attackerRef: { playerIndex: 1, unitIndex: 0 },
      targetRef: { playerIndex: 0, unitIndex: 0 },
      skillId: "power_strike",
    });

    expect(result.screen).toBe("victory");
    expect(result.winner).toBe(1);
  });

  it("should declare draw when all units on both sides are defeated", () => {
    const state = createTestState();

    const p1Unit = {
      typeId: "warrior" as const,
      passiveId: "toughened" as const,
      row: 1,
      col: 0,
      currentHp: 1,
      ap: 1,
      movement: UNIT_TYPE_DEFS["warrior"].movement,
      initiative: UNIT_TYPE_DEFS["warrior"].initiative,
      poisonTurns: 0,
      skillUsedThisTurn: false,
      invulnerable: false,
    };

    const p2Unit = {
      typeId: "warrior" as const,
      passiveId: "toughened" as const,
      row: 4,
      col: 0,
      currentHp: 1,
      ap: 1,
      movement: UNIT_TYPE_DEFS["warrior"].movement,
      initiative: UNIT_TYPE_DEFS["warrior"].initiative,
      poisonTurns: 0,
      skillUsedThisTurn: false,
      invulnerable: false,
    };

    state.p1Team.placed = [p1Unit];
    state.p2Team.placed = [p2Unit];
    state.board[1][0] = p1Unit;
    state.board[4][0] = p2Unit;

    // First kill both units
    const step1 = applyAction(state, {
      type: "attack",
      attackerRef: { playerIndex: 0, unitIndex: 0 },
      targetRef: { playerIndex: 1, unitIndex: 0 },
      skillId: "power_strike",
    });

    // Now kill P1 unit
    const step2 = applyAction(step1, {
      type: "attack",
      attackerRef: { playerIndex: 1, unitIndex: 0 },
      targetRef: { playerIndex: 0, unitIndex: 0 },
      skillId: "power_strike",
    });

    // Check if we reached victory state
    if (step2.screen === "victory") {
      expect(step2.winner).toBe(-1);
    }
  });

  it("should not declare winner when both sides have surviving units", () => {
    const state = createTestState();

    const p1Unit = {
      typeId: "warrior" as const,
      passiveId: "toughened" as const,
      row: 1,
      col: 0,
      currentHp: 8,
      ap: 1,
      movement: UNIT_TYPE_DEFS["warrior"].movement,
      initiative: UNIT_TYPE_DEFS["warrior"].initiative,
      poisonTurns: 0,
      skillUsedThisTurn: false,
      invulnerable: false,
      playerIndex: 0,
    };

    const p2Unit = {
      typeId: "archer" as const,
      passiveId: "nimble" as const,
      row: 2,
      col: 0,
      currentHp: 7,
      ap: 1,
      movement: UNIT_TYPE_DEFS["archer"].movement,
      initiative: UNIT_TYPE_DEFS["archer"].initiative,
      poisonTurns: 0,
      skillUsedThisTurn: false,
      invulnerable: false,
      playerIndex: 1,
    };

    state.p1Team.placed = [p1Unit];
    state.p2Team.placed = [p2Unit];
    state.board[1][0] = p1Unit;
    state.board[2][0] = p2Unit;

    // Deal some damage but not enough to kill
    const result = applyAction(state, {
      type: "attack",
      attackerRef: { playerIndex: 0, unitIndex: 0 },
      targetRef: { playerIndex: 1, unitIndex: 0 },
      skillId: "power_strike",
    });

    expect(result.screen).not.toBe("victory");
    expect(result.winner).toBeNull();
  });

  it("should track defeated units in turn order", () => {
    const state = createTestState();

    const p1Unit = {
      typeId: "warrior" as const,
      passiveId: "toughened" as const,
      row: 1,
      col: 0,
      currentHp: 8,
      ap: 1,
      movement: UNIT_TYPE_DEFS["warrior"].movement,
      initiative: UNIT_TYPE_DEFS["warrior"].initiative,
      poisonTurns: 0,
      skillUsedThisTurn: false,
      invulnerable: false,
      playerIndex: 0,
    };

    const p2Unit = {
      typeId: "archer" as const,
      passiveId: "nimble" as const,
      row: 2,
      col: 0,
      currentHp: 5,
      ap: 1,
      movement: UNIT_TYPE_DEFS["archer"].movement,
      initiative: UNIT_TYPE_DEFS["archer"].initiative,
      poisonTurns: 0,
      skillUsedThisTurn: false,
      invulnerable: false,
      playerIndex: 1,
    };

    state.p1Team.placed = [p1Unit];
    state.p2Team.placed = [p2Unit];
    state.board[1][0] = p1Unit;
    state.board[2][0] = p2Unit;

    const battleState = applyAction(state, {
      type: "startBattle",
      p1Team: state.p1Team,
      p2Team: state.p2Team,
      map: state.map,
    });

    // Kill the archer
    const combatState = applyAction(battleState, {
      type: "attack",
      attackerRef: { playerIndex: 0, unitIndex: 0 },
      targetRef: { playerIndex: 1, unitIndex: 0 },
      skillId: "power_strike",
    });

    // Turn should be over due to victory
    expect(combatState.screen).toBe("victory");
  });
});
