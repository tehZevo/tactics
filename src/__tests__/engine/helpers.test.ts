// ============================================================
//  HELPERS — findUnitRef, checkVictory, and edge cases
// ============================================================
import { describe, it, expect } from "vitest";
import { findUnitRef, checkVictory, getTargetsInRange, calculateDamage } from "../../state/helpers.js";
import { getEffectiveRange } from "../../state/skill-effects/effects.js";
import { createPlacedUnit } from "../../state.js";
import { createTestState } from "../../__tests__/test-fixtures.js";

describe("Helpers — findUnitRef", () => {
  it("should find unit in p1Team", () => {
    const unit1 = createPlacedUnit("warrior", "toughened", 2, 0, 0);
    const p1Team = [unit1];
    const p2Team: any[] = [];

    const ref = findUnitRef(unit1, p1Team, p2Team);
    expect(ref).toEqual({ playerIndex: 0, unitIndex: 0 });
  });

  it("should find unit in p2Team", () => {
    const unit1 = createPlacedUnit("archer", "nimble", 9, 0, 1);
    const p1Team: any[] = [];
    const p2Team = [unit1];

    const ref = findUnitRef(unit1, p1Team, p2Team);
    expect(ref).toEqual({ playerIndex: 1, unitIndex: 0 });
  });

  it("should return null if unit not found in either team", () => {
    const unit1 = createPlacedUnit("warrior", "toughened", 2, 0, 0);
    const p1Team: any[] = [];
    const p2Team: any[] = [];

    const ref = findUnitRef(unit1, p1Team, p2Team);
    expect(ref).toBeNull();
  });

  it("should return null for second occurrence if duplicate references (same object)", () => {
    const unit1 = createPlacedUnit("warrior", "toughened", 2, 0, 0);
    const p1Team = [unit1];
    const p2Team = [];

    // Same object reference - should find it on p1 side first
    const ref = findUnitRef(unit1, p1Team, p2Team);
    expect(ref).toEqual({ playerIndex: 0, unitIndex: 0 });
  });
});

describe("Helpers — checkVictory", () => {
  it("should set winner to 0 if p2 has no alive units", () => {
    const state = createTestState();
    const p1Warrior = createPlacedUnit("warrior", "toughened", 2, 0, 0);
    state.p1Team.placed = [p1Warrior];
    const p2Archer = createPlacedUnit("archer", "nimble", 9, 0, 1);
    p2Archer.currentHp = 0;
    state.p2Team.placed = [p2Archer];

    checkVictory(state);

    expect(state.screen).toBe("victory");
    expect(state.winner).toBe(0);
  });

  it("should set winner to 1 if p1 has no alive units", () => {
    const state = createTestState();
    const p1Warrior = createPlacedUnit("warrior", "toughened", 2, 0, 0);
    p1Warrior.currentHp = 0;
    state.p1Team.placed = [p1Warrior];
    const p2Archer = createPlacedUnit("archer", "nimble", 9, 0, 1);
    state.p2Team.placed = [p2Archer];

    checkVictory(state);

    expect(state.screen).toBe("victory");
    expect(state.winner).toBe(1);
  });

  it("should set winner to -1 (draw) if both sides have no alive units", () => {
    const state = createTestState();
    const p1Warrior = createPlacedUnit("warrior", "toughened", 2, 0, 0);
    p1Warrior.currentHp = 0;
    state.p1Team.placed = [p1Warrior];
    const p2Archer = createPlacedUnit("archer", "nimble", 9, 0, 1);
    p2Archer.currentHp = 0;
    state.p2Team.placed = [p2Archer];

    checkVictory(state);

    expect(state.screen).toBe("victory");
    expect(state.winner).toBe(-1);
    expect(state.log.some(l => l.text.includes("Draw"))).toBe(true);
  });

  it("should not change screen if both sides have alive units", () => {
    const state = createTestState();
    state.p1Team.placed = [createPlacedUnit("warrior", "toughened", 2, 0, 0)];
    state.p2Team.placed = [createPlacedUnit("archer", "nimble", 9, 0, 1)];

    checkVictory(state);

    expect(state.screen).toBe("battle");
  });
});

describe("Helpers — getEffectiveRange", () => {
  it("should return base skill range when no modifiers", () => {
    const state = createTestState();
    const unit = createPlacedUnit("warrior", "toughened", 5, 5, 0);
    const skill = { range: 2 } as any;

    const range = getEffectiveRange(unit, state, skill);
    expect(range).toBe(2);
  });

  it("should not add range for tracker passive (getEffectiveRange doesn't apply tracker)", () => {
    const state = createTestState();
    const unit = createPlacedUnit("archer", "tracker", 5, 5, 0);
    const skill = { range: 2 } as any;

    const range = getEffectiveRange(unit, state, skill);
    expect(range).toBe(2);
  });

  it("should reduce range when standing on enemy darkness rune", () => {
    const state = createTestState();
    const unit = createPlacedUnit("warrior", "toughened", 5, 5, 0);
    const skill = { range: 2 } as any;

    state.runeEffects = [{ type: "darkness", row: 5, col: 5, playerIndex: 1, turnsRemaining: 3 }];

    const range = getEffectiveRange(unit, state, skill);
    expect(range).toBe(1);
  });

  it("should not reduce physical attacks (range <= 1) on darkness rune", () => {
    const state = createTestState();
    const unit = createPlacedUnit("warrior", "toughened", 5, 5, 0);
    const skill = { range: 1 } as any;

    state.runeEffects = [{ type: "darkness", row: 5, col: 5, playerIndex: 1, turnsRemaining: 3 }];

    const range = getEffectiveRange(unit, state, skill);
    expect(range).toBe(1);
  });
});

describe("Helpers — calculateDamage", () => {
  it("should calculate base damage with attack stat", () => {
    const attacker = createPlacedUnit("warrior", "toughened", 2, 0, 0);
    const defender = createPlacedUnit("archer", "nimble", 3, 0, 1);
    const skillId = "power_strike";

    const damage = calculateDamage(attacker, defender, skillId);
    // power_strike damage 4 + warrior baseAtk 1 - archer baseDef 0 = 5
    expect(damage).toBeGreaterThanOrEqual(5);
  });

  it("should subtract defense", () => {
    const attacker = createPlacedUnit("warrior", "toughened", 2, 0, 0);
    const defender = createPlacedUnit("paladin", "hardened", 3, 0, 1);
    const skillId = "power_strike";

    const damage = calculateDamage(attacker, defender, skillId);
    // power_strike damage 4 + warrior baseAtk 1 - paladin baseDef 2 (hardened +1) >= 3
    expect(damage).toBeGreaterThanOrEqual(3);
  });

  it("should return at least 1 damage", () => {
    const attacker = createPlacedUnit("warrior", "toughened", 2, 0, 0);
    const defender = createPlacedUnit("paladin", "hardened", 3, 0, 1);
    const skillId = "holy_strike";

    const damage = calculateDamage(attacker, defender, skillId);
    expect(damage).toBeGreaterThanOrEqual(1);
  });
});

describe("Helpers — getTargetsInRange", () => {
  it("should return empty array when no targets in range", () => {
    const state = createTestState();
    const unit = createPlacedUnit("warrior", "toughened", 2, 0, 0);
    state.p1Team.placed = [unit];
    state.board[2][0] = unit;

    const targets = getTargetsInRange(unit, 1, "power_strike", state);
    expect(targets).toHaveLength(0);
  });

  it("should include ally targets for heal skills", () => {
    const state = createTestState();
    const healer = createPlacedUnit("cleric", "nimble", 2, 0, 0);
    const ally = createPlacedUnit("warrior", "toughened", 2, 1, 0);
    state.p1Team.placed = [healer, ally];
    state.board[2][0] = healer;
    state.board[2][1] = ally;
    state.turnOrder = [{ playerIndex: 0, unitIndex: 0 }];
    state.currentTurnIndex = 0;

    const targets = getTargetsInRange(healer, 2, "divine_heal", state);
    expect(targets).toContain(ally);
  });
});
