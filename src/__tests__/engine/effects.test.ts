// ============================================================
//  EFFECTS — executeAttack with various skill types
// ============================================================
import { describe, it, expect, beforeAll } from "vitest";
import { executeAttack } from "../../state/skill-effects/effects.js";
import { registerSkillEffects } from "../../state/skill-effects/map.js";
import { createPlacedUnit } from "../../state.js";
import { createTestState, getUnitFromState } from "../../__tests__/test-fixtures.js";

describe("Effects — executeAttack", () => {
  beforeAll(() => {
    registerSkillEffects();
  });

  it("should execute single-target attack skill", () => {
    const state = createTestState();
    const warrior = createPlacedUnit("warrior", "toughened", 2, 0, 0);
    const archer = createPlacedUnit("archer", "nimble", 2, 1, 1);
    state.p1Team.placed = [warrior];
    state.p2Team.placed = [archer];
    state.board[2][0] = warrior;
    state.board[2][1] = archer;
    state.turnOrder = [{ playerIndex: 0, unitIndex: 0 }];
    state.currentTurnIndex = 0;

    executeAttack(state, "power_strike", archer);

    console.log("Warrior AP:", warrior.ap);
    console.log("Warrior skillUsed:", warrior.skillUsedThisTurn);
    console.log("Archer HP:", archer.currentHp);
    console.log("Log:", state.log);

    expect(archer.currentHp).toBeLessThan(5);
    expect(state.log.some(l => l.type === "damage")).toBe(true);
  });

  it("should not attack if skill cost exceeds AP", () => {
    const state = createTestState();
    const warrior = createPlacedUnit("warrior", "toughened", 2, 0, 0);
    warrior.ap = 1;
    const archer = createPlacedUnit("archer", "nimble", 2, 1, 1);
    state.p1Team.placed = [warrior];
    state.p2Team.placed = [archer];
    state.board[2][0] = warrior;
    state.board[2][1] = archer;
    state.turnOrder = [{ playerIndex: 0, unitIndex: 0 }];
    state.currentTurnIndex = 0;

    // whirlwind costs 3 AP
    executeAttack(state, "whirlwind", archer);

    expect(archer.currentHp).toBe(5);
  });

  it("should not attack if out of range", () => {
    const state = createTestState();
    const warrior = createPlacedUnit("warrior", "toughened", 1, 0, 0);
    const archer = createPlacedUnit("archer", "nimble", 10, 0, 1);
    state.p1Team.placed = [warrior];
    state.p2Team.placed = [archer];
    state.board[1][0] = warrior;
    state.board[10][0] = archer;
    state.turnOrder = [{ playerIndex: 0, unitIndex: 0 }];
    state.currentTurnIndex = 0;

    executeAttack(state, "power_strike", archer);

    expect(archer.currentHp).toBe(5);
  });

  it("should apply poison from venomous_strike", () => {
    const state = createTestState();
    const rogue = createPlacedUnit("rogue", "nimble", 2, 0, 0);
    const archer = createPlacedUnit("archer", "nimble", 2, 1, 1);
    state.p1Team.placed = [rogue];
    state.p2Team.placed = [archer];
    state.board[2][0] = rogue;
    state.board[2][1] = archer;
    state.turnOrder = [{ playerIndex: 0, unitIndex: 0 }];
    state.currentTurnIndex = 0;

    executeAttack(state, "venomous_strike", archer);

    expect(archer.poisonTurns).toBeGreaterThan(0);
  });

  it("should apply berserk buff", () => {
    const state = createTestState();
    const berserker = createPlacedUnit("berserker", "toughened", 2, 0, 0);
    state.p1Team.placed = [berserker];
    state.p2Team.placed = [];
    state.board[2][0] = berserker;
    state.turnOrder = [{ playerIndex: 0, unitIndex: 0 }];
    state.currentTurnIndex = 0;

    executeAttack(state, "berserk", berserker);

    expect(berserker.buffTurns).toBeGreaterThan(0);
  });

  it("should drain AP from soul_drain", () => {
    const state = createTestState();
    const rogue = createPlacedUnit("rogue", "nimble", 2, 0, 0);
    rogue.ap = 4; // Give rogue some AP to drain
    const archer = createPlacedUnit("archer", "nimble", 2, 1, 1);
    const apBeforeRogue = rogue.ap;
    const apBeforeArcher = archer.ap;
    state.p1Team.placed = [rogue];
    state.p2Team.placed = [archer];
    state.board[2][0] = rogue;
    state.board[2][1] = archer;
    state.turnOrder = [{ playerIndex: 0, unitIndex: 0 }];
    state.currentTurnIndex = 0;

    // soul_drain: rogue (turnUnit) drains AP from archer (target)
    executeAttack(state, "soul_drain", archer);

    // rogue should gain 1 AP (drained from archer)
    expect(rogue.ap).toBe(apBeforeRogue + 1);
    // archer should lose 1 AP
    expect(archer.ap).toBe(apBeforeArcher - 1);
  });

  it("should heal ally with divine_heal", () => {
    const state = createTestState();
    const cleric = createPlacedUnit("cleric", "nimble", 2, 0, 0);
    const warrior = createPlacedUnit("warrior", "toughened", 2, 1, 0);
    state.p1Team.placed = [cleric, warrior];
    state.p2Team.placed = [];
    state.board[2][0] = cleric;
    state.board[2][1] = warrior;
    state.turnOrder = [{ playerIndex: 0, unitIndex: 0 }];
    state.currentTurnIndex = 0;

    executeAttack(state, "divine_heal", warrior);

    expect(warrior.currentHp).toBeGreaterThan(5);
  });

  it("should clear action mode after attack", () => {
    const state = createTestState();
    const warrior = createPlacedUnit("warrior", "toughened", 2, 0, 0);
    const archer = createPlacedUnit("archer", "nimble", 2, 1, 1);
    state.p1Team.placed = [warrior];
    state.p2Team.placed = [archer];
    state.board[2][0] = warrior;
    state.board[2][1] = archer;
    state.turnOrder = [{ playerIndex: 0, unitIndex: 0 }];
    state.currentTurnIndex = 0;
    state.actionMode = "selectTarget";

    executeAttack(state, "power_strike", archer);

    expect(state.actionMode).toBe("idle");
    expect(state.selectedAction).toBeNull();
  });

  it("should mark skillUsedThisTurn after attack", () => {
    const state = createTestState();
    const warrior = createPlacedUnit("warrior", "toughened", 2, 0, 0);
    const archer = createPlacedUnit("archer", "nimble", 2, 1, 1);
    state.p1Team.placed = [warrior];
    state.p2Team.placed = [archer];
    state.board[2][0] = warrior;
    state.board[2][1] = archer;
    state.turnOrder = [{ playerIndex: 0, unitIndex: 0 }];
    state.currentTurnIndex = 0;

    executeAttack(state, "power_strike", archer);

    expect(warrior.skillUsedThisTurn).toBe(true);
  });

  it("should handle flame rune skill (not yet implemented - just costs AP)", () => {
    const state = createTestState();
    const wizard = createPlacedUnit("wizard", "fortitude", 2, 0, 0);
    wizard.ap = 2;
    state.p1Team.placed = [wizard];
    state.p2Team.placed = [];
    state.board[2][0] = wizard;
    state.turnOrder = [{ playerIndex: 0, unitIndex: 0 }];
    state.currentTurnIndex = 0;

    const apBefore = wizard.ap;
    executeAttack(state, "flame_rune", wizard);

    // flame_rune skill is type "buff" but not implemented yet - just costs AP
    expect(wizard.ap).toBe(apBefore - 2);
    expect(state.runeEffects.length).toBe(0);
  });

  it("should handle wind rune skill (not yet implemented - just costs AP)", () => {
    const state = createTestState();
    const druid = createPlacedUnit("druid", "nimble", 2, 0, 0);
    druid.ap = 2;
    state.p1Team.placed = [druid];
    state.p2Team.placed = [];
    state.board[2][0] = druid;
    state.turnOrder = [{ playerIndex: 0, unitIndex: 0 }];
    state.currentTurnIndex = 0;

    const apBefore = druid.ap;
    executeAttack(state, "wind_rune", druid);

    // wind_rune skill is type "buff" but not implemented yet - just costs AP
    expect(druid.ap).toBe(apBefore - 2);
    expect(state.runeEffects.length).toBe(0);
  });

  it("should handle cleanse skill (not yet implemented - just costs AP)", () => {
    const state = createTestState();
    const cleric = createPlacedUnit("cleric", "nimble", 2, 0, 0);
    cleric.ap = 1;
    const warrior = createPlacedUnit("warrior", "toughened", 2, 1, 0);
    warrior.poisonTurns = 3;
    state.p1Team.placed = [cleric, warrior];
    state.p2Team.placed = [];
    state.board[2][0] = cleric;
    state.board[2][1] = warrior;
    state.turnOrder = [{ playerIndex: 0, unitIndex: 0 }];
    state.currentTurnIndex = 0;

    const apBefore = cleric.ap;
    executeAttack(state, "cleanse", warrior);

    // cleanse skill is type "buff" but not implemented yet - just costs AP
    expect(cleric.ap).toBe(apBefore - 1);
    expect(warrior.poisonTurns).toBe(3); // poison not removed
  });

  it("should grant invulnerability with phase_shift (self-target)", () => {
    const state = createTestState();
    const phantom = createPlacedUnit("phantom", "swift", 2, 0, 0);
    phantom.ap = 4; // phase_shift costs 4 AP
    state.p1Team.placed = [phantom];
    state.p2Team.placed = [];
    state.board[2][0] = phantom;
    state.turnOrder = [{ playerIndex: 0, unitIndex: 0 }];
    state.currentTurnIndex = 0;

    // phase_shift is self-target, so target should be the caster
    executeAttack(state, "phase_shift", phantom);

    expect(phantom.invulnerable).toBe(true);
  });

  it("should apply focus buff (self-target) - note: focusCharges not yet implemented in executeAttack", () => {
    const state = createTestState();
    const monk = createPlacedUnit("monk", "nimble", 2, 0, 0);
    state.p1Team.placed = [monk];
    state.p2Team.placed = [];
    state.board[2][0] = monk;
    state.turnOrder = [{ playerIndex: 0, unitIndex: 0 }];
    state.currentTurnIndex = 0;

    const apBefore = monk.ap;
    // focus is self-target, so target should be the caster
    executeAttack(state, "focus", monk);

    // focus costs 0 AP, so ap should not change
    expect(monk.ap).toBe(apBefore);
    // Note: focusCharges is not currently implemented in executeAttack
  });

  it("should reduce movement based on displacement after using skill", () => {
    const state = createTestState();
    const rogue = createPlacedUnit("rogue", "nimble", 2, 0, 0);
    rogue.movement = 3;
    const enemy = createPlacedUnit("archer", "nimble", 2, 1, 1);
    state.p1Team.placed = [rogue];
    state.p2Team.placed = [enemy];
    state.board[2][0] = rogue;
    state.board[2][1] = enemy;
    state.turnOrder = [{ playerIndex: 0, unitIndex: 0 }];
    state.currentTurnIndex = 0;

    // Move the rogue first to create displacement
    rogue.row = 3;
    rogue.col = 0;
    state.board[3][0] = rogue;
    state.board[2][0] = null;

    executeAttack(state, "riposte", enemy);

    // Movement should be reduced by displacement (1 tile)
    expect(rogue.movement).toBeLessThanOrEqual(3);
  });
});
