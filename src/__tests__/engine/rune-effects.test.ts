// ============================================================
//  GAME ENGINE — rune effects tests
// ============================================================
import { describe, it, expect } from "vitest";
import { applyAction } from "../../state/game-engine.js";
import { useSkill } from "../../state/actions/index.js";
import { advanceTurn } from "../../state/game-engine.js";
import { startTestBattle, getUnitFromState, createTestState } from "../../__tests__/test-fixtures.js";
import { UNIT_TYPE_DEFS } from "../../data/index.js";

describe("Game Engine — Rune Effects", () => {
  it("should place flame rune and damage enemy at end of turn", () => {
    const state = startTestBattle(
      [{ typeId: "wizard", passiveId: "tracker", col: 0, row: 2 }],
      [{ typeId: "archer", passiveId: "nimble", col: 0, row: 3 }]
    );

    // Give wizard enough AP to use flame_rune
    const wizard = getUnitFromState(state, 0, 0)!;
    wizard.ap = 5;

    // Place flame rune at archer position
    const result = applyAction(state, useSkill(
      { playerIndex: 0, unitIndex: 0 },
      { playerIndex: 1, unitIndex: 0 },
      "flame_rune"
    ));

    expect(result.runeEffects).toHaveLength(1);
    expect(result.runeEffects[0]).toEqual({ row: 3, col: 0, turns: 3, type: "flame", playerIndex: 0 });

    // Advance turn twice to trigger rune damage (end of round)
    let state2 = advanceTurn(result);
    state2 = advanceTurn(state2);
    const archer = getUnitFromState(state2, 1, 0)!;
    expect(archer.currentHp).toBe(UNIT_TYPE_DEFS["archer"].hp - 1);
    expect(state2.log.some(log => log.text.includes("Flame Rune"))).toBe(true);
  });

  it("should place wind rune and grant +1 movement at start of turn", () => {
    const state = startTestBattle(
      [{ typeId: "wizard", passiveId: "tracker", col: 0, row: 2 }],
      [{ typeId: "archer", passiveId: "nimble", col: 0, row: 3 }]
    );

    const wizard = getUnitFromState(state, 0, 0)!;
    wizard.ap = 5;

    // Place wind rune at archer position
    const result = applyAction(state, useSkill(
      { playerIndex: 0, unitIndex: 0 },
      { playerIndex: 1, unitIndex: 0 },
      "wind_rune"
    ));

    expect(result.runeEffects).toHaveLength(1);
    expect(result.runeEffects[0]).toEqual({ row: 3, col: 0, turns: 4, type: "wind", playerIndex: 0 });

    // Advance turn to trigger movement bonus (start of turn)
    const result2 = advanceTurn(result);
    const archer = getUnitFromState(result2, 1, 0)!;
    expect(archer.movement).toBe(UNIT_TYPE_DEFS["archer"].movement + 1);
    expect(result2.log.some(log => log.text.includes("Wind Rune"))).toBe(true);
  });

  it("should place earth rune and grant +1 defense at end of turn", () => {
    const state = startTestBattle(
      [{ typeId: "geomancer", passiveId: "fortitude", col: 0, row: 2 }],
      [{ typeId: "archer", passiveId: "nimble", col: 0, row: 3 }]
    );

    const geomancer = getUnitFromState(state, 0, 0)!;
    geomancer.ap = 5;

    // Place earth rune at archer position
    const result = applyAction(state, useSkill(
      { playerIndex: 0, unitIndex: 0 },
      { playerIndex: 1, unitIndex: 0 },
      "earth_rune"
    ));

    expect(result.runeEffects).toHaveLength(1);
    expect(result.runeEffects[0]).toEqual({ row: 3, col: 0, turns: 4, type: "earth", playerIndex: 0 });

    // Advance turn twice to trigger defense bonus (end of round)
    let state2 = advanceTurn(result);
    state2 = advanceTurn(state2);
    const archer = getUnitFromState(state2, 1, 0)!;
    expect(archer.defenseBonus).toBe(1);
    expect(state2.log.some(log => log.text.includes("Earth Rune"))).toBe(true);
  });

  it("should place darkness rune and reduce ranged attack range", () => {
    const state = startTestBattle(
      [{ typeId: "phantom", passiveId: "phase", col: 0, row: 2 }],
      [{ typeId: "archer", passiveId: "nimble", col: 0, row: 3 }]
    );

    const phantom = getUnitFromState(state, 0, 0)!;
    phantom.ap = 5;

    // Place darkness rune at phantom position
    const result = applyAction(state, useSkill(
      { playerIndex: 0, unitIndex: 0 },
      { playerIndex: 0, unitIndex: 0 },
      "darkness_rune"
    ));

    expect(result.runeEffects).toHaveLength(1);
    expect(result.runeEffects[0]).toEqual({ row: 2, col: 0, turns: 3, type: "darkness", playerIndex: 0 });

    // Test that ranged attack range is reduced
    const archer = getUnitFromState(result, 1, 0)!;
    archer.ap = 5;
    
    // Use precise_shot (range 3) - should be reduced to 2
    const result2 = applyAction(result, useSkill(
      { playerIndex: 1, unitIndex: 0 },
      { playerIndex: 0, unitIndex: 0 },
      "precise_shot"
    ));
    
    // Attack should still work (range 2 <= 2)
    const warrior = getUnitFromState(result2, 0, 0)!;
    expect(warrior.currentHp).toBeLessThan(UNIT_TYPE_DEFS["warrior"].hp);
  });

  it("should not reduce range for physical attacks (range <= 1)", () => {
    const state = startTestBattle(
      [{ typeId: "phantom", passiveId: "phase", col: 0, row: 2 }],
      [{ typeId: "warrior", passiveId: "toughened", col: 0, row: 3 }]
    );

    const phantom = getUnitFromState(state, 0, 0)!;
    phantom.ap = 5;

    // Place darkness rune at phantom position
    applyAction(state, useSkill(
      { playerIndex: 0, unitIndex: 0 },
      { playerIndex: 0, unitIndex: 0 },
      "darkness_rune"
    ));

    // Test that melee attack range is not reduced
    const warrior = getUnitFromState(state, 1, 0)!;
    warrior.ap = 5;
    
    // Use riposte (range 1) - should not be affected
    const result = applyAction(state, useSkill(
      { playerIndex: 1, unitIndex: 0 },
      { playerIndex: 0, unitIndex: 0 },
      "riposte"
    ));
    
    const phantomUnit = getUnitFromState(result, 0, 0)!;
    expect(phantomUnit.currentHp).toBeLessThan(UNIT_TYPE_DEFS["phantom"].hp);
  });

  it("should expire rune after duration", () => {
    const state = startTestBattle(
      [{ typeId: "wizard", passiveId: "tracker", col: 0, row: 2 }],
      [{ typeId: "archer", passiveId: "nimble", col: 0, row: 3 }]
    );

    const wizard = getUnitFromState(state, 0, 0)!;
    wizard.ap = 5;

    // Place flame rune
    const result = applyAction(state, useSkill(
      { playerIndex: 0, unitIndex: 0 },
      { playerIndex: 1, unitIndex: 0 },
      "flame_rune"
    ));

    expect(result.runeEffects).toHaveLength(1);

    // Advance 6 turns to expire the rune (rune decrements at round wrap only)
    let state2 = result;
    for (let i = 0; i < 6; i++) {
      state2 = advanceTurn(state2);
    }

    expect(state2.runeEffects).toHaveLength(0);
  });

  it("should kill unit from rune damage", () => {
    const state = startTestBattle(
      [{ typeId: "wizard", passiveId: "tracker", col: 0, row: 2 }],
      [{ typeId: "archer", passiveId: "nimble", col: 0, row: 3 }]
    );

    const wizard = getUnitFromState(state, 0, 0)!;
    wizard.ap = 5;

    // Place flame rune at archer position
    const result = applyAction(state, useSkill(
      { playerIndex: 0, unitIndex: 0 },
      { playerIndex: 1, unitIndex: 0 },
      "flame_rune"
    ));

    // Reduce archer HP to 1
    const archer = getUnitFromState(result, 1, 0)!;
    archer.currentHp = 1;

    // Advance turn twice to trigger rune damage (end of round)
    let result2 = advanceTurn(result);
    result2 = advanceTurn(result2);
    const archer2 = getUnitFromState(result2, 1, 0)!;
    expect(archer2.currentHp).toBe(0);
    expect(result2.log.some(log => log.text.includes("consumed by the Flame Rune"))).toBe(true);
  });
});
