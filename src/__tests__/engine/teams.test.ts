// ============================================================
//  TEAMS — preset team and placement tests
// ============================================================
import { describe, it, expect } from "vitest";
import { getTeamPlacements, getRandomTeam, PRESET_TEAMS } from "../../data/teams.js";
import { UNIT_TYPE_DEFS } from "../../data/unit-types.js";
import { PASSIVE_DEFS } from "../../data/passives.js";

describe("Teams — getTeamPlacements", () => {
  it("should return P1 placement positions", () => {
    const placements = getTeamPlacements("p1");
    expect(placements).toHaveLength(6);
    // P1 deploys at bottom rows (10-11)
    for (const p of placements) {
      expect(p.row).toBeGreaterThanOrEqual(10);
    }
    // Centered columns
    for (const p of placements) {
      expect(p.col).toBeGreaterThanOrEqual(4);
      expect(p.col).toBeLessThanOrEqual(7);
    }
  });

  it("should return P2 placement positions", () => {
    const placements = getTeamPlacements("p2");
    expect(placements).toHaveLength(6);
    // P2 deploys at top rows (0-1)
    for (const p of placements) {
      expect(p.row).toBeLessThanOrEqual(1);
    }
    // Centered columns
    for (const p of placements) {
      expect(p.col).toBeGreaterThanOrEqual(4);
      expect(p.col).toBeLessThanOrEqual(7);
    }
  });

  it("should have distinct positions for each unit", () => {
    const placements = getTeamPlacements("p1");
    const positions = new Set(placements.map(p => `${p.row},${p.col}`));
    expect(positions.size).toBe(6);
  });
});

describe("Teams — PRESET_TEAMS", () => {
  it("should have 6 preset teams", () => {
    expect(PRESET_TEAMS).toHaveLength(6);
  });

  it("each team should have 6 units with valid type and passive IDs", () => {
    for (const team of PRESET_TEAMS) {
      expect(team.name).toBeTruthy();
      expect(team.units).toHaveLength(6);
      for (const unit of team.units) {
        expect(UNIT_TYPE_DEFS[unit.typeId]).toBeDefined();
        expect(PASSIVE_DEFS[unit.passiveId]).toBeDefined();
      }
    }
  });

  it("should have distinct team names", () => {
    const names = PRESET_TEAMS.map(t => t.name);
    const uniqueNames = new Set(names);
    expect(uniqueNames.size).toBe(PRESET_TEAMS.length);
  });
});

describe("Teams — getRandomTeam", () => {
  it("should return a Team with 6 placed units", () => {
    const team = getRandomTeam();
    expect(team.placed).toHaveLength(6);
  });

  it("should place units at P2 positions", () => {
    const team = getRandomTeam();
    for (const unit of team.placed) {
      expect(unit.row).toBeLessThanOrEqual(1);
      expect(unit.playerIndex).toBe(1);
    }
  });

  it("should apply passive stats correctly", () => {
    // Force a specific team by seeding random
    const originalRandom = Math.random;
    Math.random = () => 0; // Always pick first preset team
    const team = getRandomTeam();
    Math.random = originalRandom;

    // First unit: warrior + toughened → hp should be 8+2=10
    expect(team.placed[0].currentHp).toBe(10);
  });

  it("should set correct initiative after passive application", () => {
    const originalRandom = Math.random;
    Math.random = () => 0;
    const team = getRandomTeam();
    Math.random = originalRandom;

    // First unit: warrior + toughened → initiative stays 3
    expect(team.placed[0].initiative).toBe(3);
  });

  it("should set baseMovement and movement to same value", () => {
    const team = getRandomTeam();
    for (const unit of team.placed) {
      expect(unit.movement).toBe(unit.baseMovement);
    }
  });

  it("should set ap to 2 for all units", () => {
    const team = getRandomTeam();
    for (const unit of team.placed) {
      expect(unit.ap).toBe(2);
    }
  });
});
