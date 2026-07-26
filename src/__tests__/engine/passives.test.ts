import { describe, it, expect } from "vitest";
import { applyAction } from "../../state/game-engine.js";
import { getUnitFromState } from "../test-fixtures.js";
import { createTestState } from "../test-fixtures.js";

describe("Game Engine — Passive Effects", () => {
  it("should reduce damage with toughened passive", () => {
    const state = createTestState();

    const unit1 = {
      typeId: "warrior" as const,
      passiveId: "toughened" as const,
      row: 2,
      col: 0,
      currentHp: 100,
      ap: 1,
      movement: 4,
      initiative: 5,
      poisonTurns: 0,
      skillUsedThisTurn: false,
      invulnerable: false,
      playerIndex: 0,
    };

    const unit2 = {
      typeId: "archer" as const,
      passiveId: "nimble" as const,
      row: 3,
      col: 0,
      currentHp: 50,
      ap: 1,
      movement: 6,
      initiative: 3,
      poisonTurns: 0,
      skillUsedThisTurn: false,
      invulnerable: false,
      playerIndex: 1,
    };

    state.p1Team.placed = [unit1];
    state.p2Team.placed = [unit2];
    state.board[2][0] = unit1;
    state.board[3][0] = unit2;

    console.log("Before attack:");
    console.log("  Attacker:", state.p1Team.placed[0].playerIndex, "at", state.p1Team.placed[0].row, state.p1Team.placed[0].col);
    console.log("  Target:", state.p2Team.placed[0].playerIndex, "at", state.p2Team.placed[0].row, state.p2Team.placed[0].col);
    
    const result = applyAction(state, {
      type: "attack",
      attackerRef: { playerIndex: 0, unitIndex: 0 },
      targetRef: { playerIndex: 1, unitIndex: 0 },
      skillId: "power_strike",
    });

    console.log("Result log:", result.log);
    const targetUnit = getUnitFromState(result, 1, 0);
    console.log("Target HP:", targetUnit?.currentHp);
    expect(targetUnit).not.toBeNull();
    expect(targetUnit!.currentHp).toBe(44);
  });

  it("should apply aggressive bonus damage", () => {
    const state = createTestState();

    const unit1 = {
      typeId: "rogue" as const,
      passiveId: "aggressive" as const,
      row: 2,
      col: 0,
      currentHp: 60,
      ap: 1,
      movement: 6,
      initiative: 3,
      poisonTurns: 0,
      skillUsedThisTurn: false,
      invulnerable: false,
      playerIndex: 0,
    };

    const unit2 = {
      typeId: "archer" as const,
      passiveId: "nimble" as const,
      row: 3,
      col: 0,
      currentHp: 40,
      ap: 1,
      movement: 6,
      initiative: 3,
      poisonTurns: 0,
      skillUsedThisTurn: false,
      invulnerable: false,
      playerIndex: 1,
    };

    state.p1Team.placed = [unit1];
    state.p2Team.placed = [unit2];
    state.board[2][0] = unit1;
    state.board[3][0] = unit2;

    const result = applyAction(state, {
      type: "attack",
      attackerRef: { playerIndex: 0, unitIndex: 0 },
      targetRef: { playerIndex: 1, unitIndex: 0 },
      skillId: "power_strike",
    });

    const targetUnit = getUnitFromState(result, 1, 0);
    expect(targetUnit).not.toBeNull();
    expect(targetUnit!.currentHp).toBe(35);
  });

  it("should apply hardened damage resistance", () => {
    const state = createTestState();

    const unit1 = {
      typeId: "paladin" as const,
      passiveId: "hardened" as const,
      row: 2,
      col: 0,
      currentHp: 90,
      ap: 1,
      movement: 3,
      initiative: 5,
      poisonTurns: 0,
      skillUsedThisTurn: false,
      invulnerable: false,
      playerIndex: 0,
    };

    const unit2 = {
      typeId: "archer" as const,
      passiveId: "nimble" as const,
      row: 3,
      col: 0,
      currentHp: 30,
      ap: 1,
      movement: 6,
      initiative: 3,
      poisonTurns: 0,
      skillUsedThisTurn: false,
      invulnerable: false,
      playerIndex: 1,
    };

    state.p1Team.placed = [unit1];
    state.p2Team.placed = [unit2];
    state.board[2][0] = unit1;
    state.board[3][0] = unit2;

    const result = applyAction(state, {
      type: "attack",
      attackerRef: { playerIndex: 1, unitIndex: 0 },
      targetRef: { playerIndex: 0, unitIndex: 0 },
      skillId: "power_strike",
    });

    const targetUnit = getUnitFromState(result, 0, 0);
    expect(targetUnit).not.toBeNull();
    expect(targetUnit!.currentHp).toBe(89);
  });

});
