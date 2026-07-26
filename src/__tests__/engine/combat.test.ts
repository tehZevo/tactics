// ============================================================
//  GAME ENGINE — combat tests
// ============================================================
import { describe, it, expect } from "vitest";
import { applyAction } from "../../state/game-engine.js";
import { startTestBattle, getUnitFromState } from "../../__tests__/test-fixtures.js";
import { UNIT_TYPE_DEFS } from "../../data/index.js";

describe("Game Engine — Combat", () => {
  it("should deal damage with attack skill", () => {
    const state = startTestBattle(
      [{ typeId: "warrior", passiveId: "toughened", col: 0, row: 2 }],
      [{ typeId: "archer", passiveId: "nimble", col: 0, row: 3 }]
    );

    const result = applyAction(state, {
      type: "attack",
      attackerRef: { playerIndex: 0, unitIndex: 0 },
      targetRef: { playerIndex: 1, unitIndex: 0 },
      skillId: "power_strike",
    });

    const targetUnit = getUnitFromState(result, 1, 0);
    expect(targetUnit).not.toBeNull();
    expect(targetUnit!.currentHp).toBeLessThan(UNIT_TYPE_DEFS["archer"].hp);
    expect(result.log.some(log => log.type === "damage")).toBe(true);
  });

  it("should consume AP when using a skill", () => {
    const state = startTestBattle(
      [{ typeId: "warrior", passiveId: "toughened", col: 0, row: 2 }],
      [{ typeId: "archer", passiveId: "nimble", col: 0, row: 3 }]
    );

    // Give warrior more AP
    const warrior = getUnitFromState(state, 0, 0)!;
    warrior.ap = 3;

    const result = applyAction(state, {
      type: "attack",
      attackerRef: { playerIndex: 0, unitIndex: 0 },
      targetRef: { playerIndex: 1, unitIndex: 0 },
      skillId: "power_strike",
    });

    const attackerUnit = getUnitFromState(result, 0, 0);
    expect(attackerUnit).not.toBeNull();
    expect(attackerUnit!.ap).toBe(2);
  });

  it("should not allow attack if not enough AP", () => {
    const state = startTestBattle(
      [{ typeId: "warrior", passiveId: "toughened", col: 0, row: 2 }],
      [{ typeId: "archer", passiveId: "nimble", col: 0, row: 3 }]
    );

    // Warrior has 1 AP, whirlwind costs 3
    const result = applyAction(state, {
      type: "attack",
      attackerRef: { playerIndex: 0, unitIndex: 0 },
      targetRef: { playerIndex: 1, unitIndex: 0 },
      skillId: "whirlwind",
    });

    const targetUnit = getUnitFromState(result, 1, 0);
    expect(targetUnit).not.toBeNull();
    expect(targetUnit!.currentHp).toBe(UNIT_TYPE_DEFS["archer"].hp);
  });

  it("should apply poison from poison_blade", () => {
    const state = startTestBattle(
      [{ typeId: "rogue", passiveId: "nimble", col: 0, row: 2 }],
      [{ typeId: "archer", passiveId: "nimble", col: 0, row: 3 }]
    );

    const result = applyAction(state, {
      type: "attack",
      attackerRef: { playerIndex: 0, unitIndex: 0 },
      targetRef: { playerIndex: 1, unitIndex: 0 },
      skillId: "poison_blade",
    });

    const targetUnit = getUnitFromState(result, 1, 0);
    expect(targetUnit).not.toBeNull();
    expect(targetUnit!.poisonTurns).toBe(2);
  });

  it("should kill a unit when HP reaches 0", () => {
    const state = startTestBattle(
      [{ typeId: "warrior", passiveId: "toughened", col: 0, row: 2 }],
      [{ typeId: "archer", passiveId: "nimble", col: 0, row: 3 }]
    );

    // Give warrior huge AP to use multiple attacks
    const warrior = getUnitFromState(state, 0, 0)!;
    warrior.ap = 10;

    // Attack twice to kill archer (5 HP)
    let result = applyAction(state, {
      type: "attack",
      attackerRef: { playerIndex: 0, unitIndex: 0 },
      targetRef: { playerIndex: 1, unitIndex: 0 },
      skillId: "power_strike",
    });

    result = applyAction(result, {
      type: "attack",
      attackerRef: { playerIndex: 0, unitIndex: 0 },
      targetRef: { playerIndex: 1, unitIndex: 0 },
      skillId: "power_strike",
    });

    const targetUnit = getUnitFromState(result, 1, 0);
    expect(targetUnit).not.toBeNull();
    expect(targetUnit!.currentHp).toBe(0);
    expect(result.log.some(log => log.text.includes("defeated"))).toBe(true);
  });

  it("should apply soul_drain AP drain skill", () => {
    const state = startTestBattle(
      [{ typeId: "rogue", passiveId: "nimble", col: 0, row: 2 }],
      [{ typeId: "archer", passiveId: "nimble", col: 0, row: 3 }]
    );

    // Give rogue more AP to use soul_drain
    const rogue = getUnitFromState(state, 0, 0)!;
    rogue.ap = 3;

    const result = applyAction(state, {
      type: "attack",
      attackerRef: { playerIndex: 0, unitIndex: 0 },
      targetRef: { playerIndex: 1, unitIndex: 0 },
      skillId: "soul_drain",
    });

    const attackerUnit = getUnitFromState(result, 0, 0);
    const targetUnit = getUnitFromState(result, 1, 0);
    expect(attackerUnit).not.toBeNull();
    expect(targetUnit).not.toBeNull();
    expect(attackerUnit!.ap).toBe(3);
    expect(targetUnit!.ap).toBeLessThan(1);
  });

  it("should heal an ally with lay_on_hands", () => {
    const state = startTestBattle(
      [
        { typeId: "paladin", passiveId: "hardened", col: 0, row: 2 },
        { typeId: "warrior", passiveId: "toughened", col: 1, row: 2 },
      ],
      [{ typeId: "archer", passiveId: "nimble", col: 0, row: 5 }]
    );

    // Give paladin enough AP to use lay_on_hands
    const paladin = getUnitFromState(state, 0, 0)!;
    paladin.ap = 5;

    // Damage the warrior
    const warrior = getUnitFromState(state, 0, 1)!;
    warrior.currentHp = 5;

    const result = applyAction(state, {
      type: "attack",
      attackerRef: { playerIndex: 0, unitIndex: 0 },
      targetRef: { playerIndex: 0, unitIndex: 1 },
      skillId: "lay_on_hands",
    });

    const targetUnit = getUnitFromState(result, 0, 1);
    expect(targetUnit).not.toBeNull();
    expect(targetUnit!.currentHp).toBeGreaterThan(5);
  });

  it("should not heal an enemy", () => {
    const state = startTestBattle(
      [{ typeId: "paladin", passiveId: "hardened", col: 0, row: 2 }],
      [{ typeId: "archer", passiveId: "nimble", col: 0, row: 5 }]
    );

    // Give paladin enough AP to use lay_on_hands
    const paladin = getUnitFromState(state, 0, 0)!;
    paladin.ap = 5;

    const result = applyAction(state, {
      type: "attack",
      attackerRef: { playerIndex: 0, unitIndex: 0 },
      targetRef: { playerIndex: 1, unitIndex: 0 },
      skillId: "lay_on_hands",
    });

    // Should not heal enemy - check that no heal happened
    const targetUnit = getUnitFromState(result, 1, 0);
    expect(targetUnit).not.toBeNull();
    expect(targetUnit!.currentHp).toBe(UNIT_TYPE_DEFS["archer"].hp);
  });

  it("should not damage an invulnerable target", () => {
    const state = startTestBattle(
      [{ typeId: "warrior", passiveId: "toughened", col: 0, row: 2 }],
      [{ typeId: "archer", passiveId: "nimble", col: 0, row: 3 }]
    );

    // Make archer invulnerable
    const archer = getUnitFromState(state, 1, 0)!;
    archer.invulnerable = true;

    const result = applyAction(state, {
      type: "attack",
      attackerRef: { playerIndex: 0, unitIndex: 0 },
      targetRef: { playerIndex: 1, unitIndex: 0 },
      skillId: "power_strike",
    });

    const targetUnit = getUnitFromState(result, 1, 0);
    expect(targetUnit).not.toBeNull();
    expect(targetUnit!.currentHp).toBe(UNIT_TYPE_DEFS["archer"].hp);
    expect(result.log.some(log => log.text.includes("phases through"))).toBe(true);
  });
});
