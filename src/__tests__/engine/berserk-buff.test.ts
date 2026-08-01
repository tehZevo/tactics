// ============================================================
//  GAME ENGINE — berserk buff tests
// ============================================================
import { describe, it, expect } from "vitest";
import { applyAction } from "../../state/game-engine.js";
import { useSkill } from "../../state/actions/index.js";
import { advanceTurn } from "../../state/game-engine.js";
import { startTestBattle, getUnitFromState } from "../../__tests__/test-fixtures.js";
import { UNIT_TYPE_DEFS } from "../../data/index.js";

describe("Game Engine — Berserk Buff", () => {
  it("should apply berserk buff on use", () => {
    const state = startTestBattle(
      [{ typeId: "rogue", passiveId: "toughened", col: 0, row: 2 }],
      [{ typeId: "warrior", passiveId: "toughened", col: 0, row: 3 }]
    );

    const rogue = getUnitFromState(state, 0, 0)!;
    rogue.ap = 5;

    // Use berserk on self
    const result = applyAction(state, useSkill(
      { playerIndex: 0, unitIndex: 0 },
      { playerIndex: 0, unitIndex: 0 },
      "berserk"
    ));

    const rogue2 = getUnitFromState(result, 0, 0)!;
    expect(rogue2.buffTurns).toBe(2);
    expect(result.log.some(log => log.text.includes("berserk"))).toBe(true);
  });

  it("should stack buff duration", () => {
    const state = startTestBattle(
      [{ typeId: "rogue", passiveId: "toughened", col: 0, row: 2 }],
      [{ typeId: "warrior", passiveId: "toughened", col: 0, row: 3 }]
    );

    const rogue = getUnitFromState(state, 0, 0)!;
    rogue.ap = 5;

    // Use berserk on self
    const result1 = applyAction(state, useSkill(
      { playerIndex: 0, unitIndex: 0 },
      { playerIndex: 0, unitIndex: 0 },
      "berserk"
    ));

    const rogue2 = getUnitFromState(result1, 0, 0)!;
    expect(rogue2.buffTurns).toBe(2);

    // Advance turn to next round
    const result2 = advanceTurn(result1);
    const rogue3 = getUnitFromState(result2, 0, 0)!;
    rogue3.ap = 5;

    // Use berserk again on next turn
    const result3 = applyAction(result2, useSkill(
      { playerIndex: 0, unitIndex: 0 },
      { playerIndex: 0, unitIndex: 0 },
      "berserk"
    ));

    const rogue4 = getUnitFromState(result3, 0, 0)!;
    expect(rogue4.buffTurns).toBe(3);
  });

  it("should decrement buff turns each round", () => {
    const state = startTestBattle(
      [{ typeId: "rogue", passiveId: "toughened", col: 0, row: 2 }],
      [{ typeId: "warrior", passiveId: "toughened", col: 0, row: 3 }]
    );

    const rogue = getUnitFromState(state, 0, 0)!;
    rogue.ap = 5;

    // Use berserk
    const result = applyAction(state, useSkill(
      { playerIndex: 0, unitIndex: 0 },
      { playerIndex: 0, unitIndex: 0 },
      "berserk"
    ));

    const rogue2 = getUnitFromState(result, 0, 0)!;
    expect(rogue2.buffTurns).toBe(2);

    // Advance turn twice (1 round wrap)
    let state2 = advanceTurn(result);
    state2 = advanceTurn(state2);

    const rogue3 = getUnitFromState(state2, 0, 0)!;
    expect(rogue3.buffTurns).toBe(1);
  });

  it("should log when buff expires", () => {
    const state = startTestBattle(
      [{ typeId: "rogue", passiveId: "toughened", col: 0, row: 2 }],
      [{ typeId: "warrior", passiveId: "toughened", col: 0, row: 3 }]
    );

    const rogue = getUnitFromState(state, 0, 0)!;
    rogue.ap = 5;

    // Use berserk
    const result = applyAction(state, useSkill(
      { playerIndex: 0, unitIndex: 0 },
      { playerIndex: 0, unitIndex: 0 },
      "berserk"
    ));

    // Advance turn 4 times (2 round wraps) to expire buff
    let state2 = result;
    for (let i = 0; i < 4; i++) {
      state2 = advanceTurn(state2);
    }

    const rogue2 = getUnitFromState(state2, 0, 0)!;
    expect(rogue2.buffTurns).toBe(0);
    expect(state2.log.some(log => log.text.includes("rage fades"))).toBe(true);
  });

  it("should grant attack and defense bonus", () => {
    const state = startTestBattle(
      [{ typeId: "rogue", passiveId: "toughened", col: 0, row: 2 }],
      [{ typeId: "warrior", passiveId: "toughened", col: 0, row: 3 }]
    );

    const rogue = getUnitFromState(state, 0, 0)!;
    rogue.ap = 5;

    // Use berserk
    const result = applyAction(state, useSkill(
      { playerIndex: 0, unitIndex: 0 },
      { playerIndex: 0, unitIndex: 0 },
      "berserk"
    ));

    const rogue2 = getUnitFromState(result, 0, 0)!;
    expect(rogue2.buffTurns).toBe(2);
    expect(result.log.some(log => log.text.includes("+1 attack"))).toBe(true);
    expect(result.log.some(log => log.text.includes("-1 defense"))).toBe(true);
  });
});
