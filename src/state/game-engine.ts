// ============================================================
//  GAME ENGINE — pure functions for game logic
//  Each function takes a state and returns a new state (no mutation)
// ============================================================
import {
  BOARD_COLS,
  BOARD_ROWS,
  MAX_AP,
  UNIT_TYPE_DEFS,
  SKILL_DEFS,
  PASSIVE_DEFS,
} from "../data/index.js";
import type { SkillDef } from "../data/skills.js";
import { GameState, PlacedUnit, Team } from "./types.js";

// ---- Pure helpers ----

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

function manhattanDistance(r1: number, c1: number, r2: number, c2: number): number {
  return Math.abs(r1 - r2) + Math.abs(c1 - c2);
}

function getEffectiveStats(unit: PlacedUnit): { attack: number; defense: number } {
  let atk = UNIT_TYPE_DEFS[unit.typeId].baseAtk;
  let def = UNIT_TYPE_DEFS[unit.typeId].baseDef;
  if (unit.passiveId && PASSIVE_DEFS[unit.passiveId]) {
    const baseStats = {
      hp: UNIT_TYPE_DEFS[unit.typeId].hp,
      attack: UNIT_TYPE_DEFS[unit.typeId].baseAtk,
      defense: UNIT_TYPE_DEFS[unit.typeId].baseDef,
      movement: UNIT_TYPE_DEFS[unit.typeId].movement,
      initiative: UNIT_TYPE_DEFS[unit.typeId].initiative,
    };
    const passiveStats = PASSIVE_DEFS[unit.passiveId].apply(baseStats);
    atk += passiveStats.attack;
    def += passiveStats.defense;
  }
  return { attack: Math.max(atk, 0), defense: Math.max(def, 0) };
}

function getUnitMaxHp(unit: PlacedUnit): number {
  const typeDef = UNIT_TYPE_DEFS[unit.typeId];
  let hp = typeDef.hp;
  if (unit.passiveId && PASSIVE_DEFS[unit.passiveId]) {
    const stats = PASSIVE_DEFS[unit.passiveId].apply({
      hp: typeDef.hp,
      attack: typeDef.baseAtk,
      defense: typeDef.baseDef,
      movement: typeDef.baseDef,
      initiative: typeDef.initiative,
    });
    hp = stats.hp;
  }
  return hp;
}

function getUnitDisplayName(unit: PlacedUnit): string {
  return UNIT_TYPE_DEFS[unit.typeId].name;
}

function isOwnUnit(turnUnit: PlacedUnit, target: PlacedUnit): boolean {
  const turnTeam = turnUnit.row < 5 ? 0 : 1;
  const targetTeam = target.row < 5 ? 0 : 1;
  return turnTeam === targetTeam;
}

function calculateDamage(attacker: PlacedUnit, defender: PlacedUnit, skillId: string): number {
  const skill = SKILL_DEFS[skillId];
  const atkStats = getEffectiveStats(attacker);
  const defStats = getEffectiveStats(defender);

  let damage = (skill.damage || 0) + atkStats.attack;

  if (!skill.ignoresDefense) {
    damage -= defStats.defense;
  }

  if (attacker.passiveId === "predation") {
    const predStats = PASSIVE_DEFS["predation"].apply({
      hp: UNIT_TYPE_DEFS[attacker.typeId].hp,
      attack: UNIT_TYPE_DEFS[attacker.typeId].baseAtk,
      defense: UNIT_TYPE_DEFS[attacker.typeId].baseDef,
      movement: UNIT_TYPE_DEFS[attacker.typeId].movement,
      initiative: UNIT_TYPE_DEFS[attacker.typeId].initiative,
    });
    const halfHp = Math.floor(predStats.hp / 2);
    if (defender.currentHp <= halfHp) {
      damage += 1;
    }
  }

  if (skill.aoe && defender.passiveId === "fortitude") {
    damage -= 1;
  }

  return Math.max(damage, 1);
}

function getReachableTiles(state: GameState, unit: PlacedUnit): Set<string> {
  const reachable = new Set<string>();
  const maxDist = unit.movement;
  const map = state.map;
  const visited = new Set<string>();
  const queue: { row: number; col: number; dist: number }[] = [{ row: unit.row, col: unit.col, dist: 0 }];
  visited.add(`${unit.row},${unit.col}`);

  while (queue.length > 0) {
    const curr = queue.shift()!;
    if (curr.dist > 0) reachable.add(`${curr.row},${curr.col}`);
    if (curr.dist >= maxDist) continue;

    const neighbors = [
      [curr.row - 1, curr.col],
      [curr.row + 1, curr.col],
      [curr.row, curr.col - 1],
      [curr.row, curr.col + 1],
    ];

    for (const [nr, nc] of neighbors) {
      if (nr < 0 || nr >= BOARD_ROWS || nc < 0 || nc >= BOARD_COLS) continue;
      const key = `${nr},${nc}`;
      if (visited.has(key)) continue;
      if (!map.grid[nr][nc]) continue;
      if (state.board[nr][nc]) continue;
      visited.add(key);
      queue.push({ row: nr, col: nc, dist: curr.dist + 1 });
    }
  }
  return reachable;
}

function getUnitAt(state: GameState, row: number, col: number): PlacedUnit | null {
  if (row < 0 || row >= BOARD_ROWS || col < 0 || col >= BOARD_COLS) return null;
  return state.board[row][col];
}

function findUnitRef(unit: PlacedUnit, p1Team: PlacedUnit[], p2Team: PlacedUnit[]): { playerIndex: 0 | 1; unitIndex: number } | null {
  for (let i = 0; i < p1Team.length; i++) {
    if (p1Team[i] === unit) return { playerIndex: 0, unitIndex: i };
  }
  for (let i = 0; i < p2Team.length; i++) {
    if (p2Team[i] === unit) return { playerIndex: 1, unitIndex: i };
  }
  return null;
}

// ---- Action types ----

export type GameAction =
  | { type: "move"; unitRef: { playerIndex: 0 | 1; unitIndex: number }; targetRow: number; targetCol: number }
  | { type: "attack"; attackerRef: { playerIndex: 0 | 1; unitIndex: number }; targetRef: { playerIndex: 0 | 1; unitIndex: number }; skillId: string }
  | { type: "aoeAttack"; attackerRef: { playerIndex: 0 | 1; unitIndex: number }; skillId: string; centerRow: number; centerCol: number }
  | { type: "endTurn" }
  | { type: "startBattle"; p1Team: Team; p2Team: Team; map: import("../data/maps.js").MapLayout };

// ---- Main action handler ----

export function applyAction(state: GameState, action: GameAction): GameState {
  const newState = deepClone(state);

  switch (action.type) {
    case "startBattle":
      return startBattle(newState, action.p1Team, action.p2Team, action.map);
    case "move":
      return executeMove(newState, action.unitRef, action.targetRow, action.targetCol);
    case "attack":
      return executeAttack(newState, action.attackerRef, action.targetRef, action.skillId);
    case "aoeAttack":
      return executeAoeAttack(newState, action.attackerRef, action.skillId, action.centerRow, action.centerCol);
    case "endTurn":
      return advanceTurn(newState);
    default:
      return state;
  }
}

// ---- Battle initialization ----

function startBattle(state: GameState, p1Team: Team, p2Team: Team, map: import("../data/maps.js").MapLayout): GameState {
  state.screen = "battle";
  state.p1Team = p1Team;
  state.p2Team = p2Team;
  state.map = map;
  state.log = [];

  // Build board from teams
  state.board = Array.from({ length: BOARD_ROWS }, () => Array(BOARD_COLS).fill(null));
  for (const unit of p1Team.placed) {
    state.board[unit.row][unit.col] = { ...unit, currentHp: unit.currentHp || getUnitMaxHp(unit) };
  }
  for (const unit of p2Team.placed) {
    state.board[unit.row][unit.col] = { ...unit, currentHp: unit.currentHp || getUnitMaxHp(unit) };
  }

  // Build turn order
  const allUnits: { playerIndex: 0 | 1; unitIndex: number; unit: PlacedUnit }[] = [];
  for (let i = 0; i < p1Team.placed.length; i++) {
    allUnits.push({ playerIndex: 0, unitIndex: i, unit: p1Team.placed[i] });
  }
  for (let i = 0; i < p2Team.placed.length; i++) {
    allUnits.push({ playerIndex: 1, unitIndex: i, unit: p2Team.placed[i] });
  }
  allUnits.sort((a, b) => b.unit.initiative - a.unit.initiative);

  state.turnOrder = allUnits.map(u => ({ playerIndex: u.playerIndex, unitIndex: u.unitIndex }));
  state.currentTurnIndex = 0;

  const firstUnit = getTurnUnit(state);
  if (firstUnit) {
    firstUnit.ap = 1;
    addLog(state, `${getUnitDisplayName(firstUnit)} leads the charge.`, "info");
  }

  return state;
}

// ---- Move ----

function executeMove(state: GameState, unitRef: { playerIndex: 0 | 1; unitIndex: number }, targetRow: number, targetCol: number): GameState {
  const unit = getUnitByRef(unitRef, state.p1Team.placed, state.p2Team.placed);
  if (!unit || unit.currentHp <= 0) return state;

  const reachable = getReachableTiles(state, unit);
  if (!reachable.has(`${targetRow},${targetCol}`)) return state;

  const oldRow = unit.row;
  const oldCol = unit.col;

  state.board[oldRow][oldCol] = null;
  unit.row = targetRow;
  unit.col = targetCol;
  state.board[targetRow][targetCol] = unit;

  addLog(state, `${getUnitDisplayName(unit)} moves to (${targetRow},${targetCol}).`);
  return state;
}

// ---- Attack ----

function executeAttack(state: GameState, attackerRef: { playerIndex: 0 | 1; unitIndex: number }, targetRef: { playerIndex: 0 | 1; unitIndex: number }, skillId: string): GameState {
  const attacker = getUnitByRef(attackerRef, state.p1Team.placed, state.p2Team.placed);
  const target = getUnitByRef(targetRef, state.p1Team.placed, state.p2Team.placed);
  if (!attacker || !target || attacker.currentHp <= 0 || target.currentHp <= 0) return state;

  const skill = SKILL_DEFS[skillId];
  if (attacker.ap < skill.cost) return state;
  if (attacker.skillUsedThisTurn) return state;

  const dist = manhattanDistance(attacker.row, attacker.col, target.row, target.col);
  let effectiveRange = skill.range;
  if (attacker.passiveId === "tracker") effectiveRange += 1;

  if (skill.selfTarget && target !== attacker) return state;
  if (dist > effectiveRange) return state;

  if (target.invulnerable) {
    addLog(state, `${getUnitDisplayName(target)} phases through the attack, unharmed!`, "info");
    return state;
  }

  if (skill.aoe && skill.type === "attack") {
    attacker.skillUsedThisTurn = true;
    attacker.ap -= skill.cost;
    return executeAoeAttack(state, attackerRef, skillId, target.row, target.col);
  }

  if (skill.type === "heal" && !isOwnUnit(attacker, target)) return state;
  if (skill.type === "attack" && isOwnUnit(attacker, target)) return state;

  attacker.skillUsedThisTurn = true;

  if (skill.type === "attack") {
    const damage = calculateDamage(attacker, target, skillId);
    target.currentHp -= damage;
    attacker.ap -= skill.cost;

    addLog(state, `${getUnitDisplayName(attacker)} uses ${skill.name} on ${getUnitDisplayName(target)} for ${damage} damage!`, "damage");

    if (target.currentHp <= 0) {
      target.currentHp = 0;
      addLog(state, `${getUnitDisplayName(target)} is defeated!`, "damage");
      if (attacker.passiveId === "bloodthirsty") {
        const maxHp = getUnitMaxHp(attacker);
        attacker.currentHp = Math.min(attacker.currentHp + 1, maxHp);
        addLog(state, `${getUnitDisplayName(attacker)} heals 1 HP from Bloodthirsty!`, "heal");
      }
      checkVictory(state);
    }

    if (skillId === "poison_blade") {
      target.poisonTurns = 2;
      addLog(state, `${getUnitDisplayName(target)} is poisoned!`, "damage");
    }

    if (skill.selfDamage) {
      attacker.currentHp -= skill.selfDamage;
      if (attacker.currentHp <= 0) {
        attacker.currentHp = 0;
        addLog(state, `${getUnitDisplayName(attacker)} was consumed by their own attack!`, "damage");
      } else {
        addLog(state, `${getUnitDisplayName(attacker)} takes ${skill.selfDamage} self damage!`, "damage");
      }
    }
  } else if (skill.type === "heal") {
    const healAmount = skill.healAmount || 4;
    const maxHp = getUnitMaxHp(target);
    const actualHeal = Math.min(healAmount, maxHp - target.currentHp);
    target.currentHp += actualHeal;
    attacker.ap -= skill.cost;
    addLog(state, `${getUnitDisplayName(attacker)} uses ${skill.name} on ${getUnitDisplayName(target)}, restoring ${actualHeal} HP!`, "heal");
  } else if (skill.type === "buff") {
    attacker.ap -= skill.cost;
    if (skill.grantsInvulnerability) {
      attacker.invulnerable = true;
      addLog(state, `${getUnitDisplayName(attacker)} phases out of reality, becoming invulnerable until their next turn!`, "info");
    }
    addLog(state, `${getUnitDisplayName(attacker)} uses ${skill.name}!`, "info");
  } else if (skill.type === "movement") {
    const range = 3;
    const dist = manhattanDistance(attacker.row, attacker.col, target.row, target.col);
    if (dist > range) return state;
    if (state.board[target.row][target.col] !== null) return state;

    attacker.ap -= skill.cost;
    state.board[attacker.row][attacker.col] = null;
    attacker.row = target.row;
    attacker.col = target.col;
    state.board[target.row][target.col] = attacker;
    addLog(state, `${getUnitDisplayName(attacker)} teleports to (${target.row},${target.col})!`, "info");
  } else if (skill.type === "apDrain") {
    attacker.ap -= skill.cost;
    const drainAmount = skill.apDrain || 1;
    const actualDrain = Math.min(drainAmount, target.ap);
    target.ap -= actualDrain;
    attacker.ap += actualDrain;
    addLog(state, `${getUnitDisplayName(attacker)} uses ${skill.name} on ${getUnitDisplayName(target)}, stealing ${actualDrain} AP!`, "info");
  }

  return state;
}

// ---- AoE Attack ----

function executeAoeAttack(state: GameState, attackerRef: { playerIndex: 0 | 1; unitIndex: number }, skillId: string, centerRow: number, centerCol: number): GameState {
  const attacker = getUnitByRef(attackerRef, state.p1Team.placed, state.p2Team.placed);
  if (!attacker || attacker.currentHp <= 0) return state;

  const skill = SKILL_DEFS[skillId];
  if (!skill.aoe) return state;

  const radius = skill.aoe;
  let totalDamage = 0;
  let hitCount = 0;

  for (let r = 0; r < BOARD_ROWS; r++) {
    for (let c = 0; c < BOARD_COLS; c++) {
      const target = state.board[r][c];
      if (!target || isOwnUnit(attacker, target) || target.invulnerable) continue;
      if (manhattanDistance(r, c, centerRow, centerCol) > radius) continue;

      const damage = calculateDamage(attacker, target, skillId);
      target.currentHp -= damage;
      totalDamage += damage;
      hitCount++;

      addLog(state, `${getUnitDisplayName(target)} takes ${damage} damage from ${skill.name}!`, "damage");

      if (target.currentHp <= 0) {
        target.currentHp = 0;
        addLog(state, `${getUnitDisplayName(target)} is defeated!`, "damage");
        if (attacker.passiveId === "bloodthirsty") {
          const maxHp = getUnitMaxHp(attacker);
          attacker.currentHp = Math.min(attacker.currentHp + 1, maxHp);
          addLog(state, `${getUnitDisplayName(attacker)} heals 1 HP from Bloodthirsty!`, "heal");
        }
        checkVictory(state);
      }
    }
  }

  attacker.skillUsedThisTurn = true;
  attacker.ap -= skill.cost;
  addLog(state, `${getUnitDisplayName(attacker)} uses ${skill.name}! ${hitCount} enemies hit for ${totalDamage} total damage.`, "damage");

  return state;
}

// ---- Turn advancement ----

export function advanceTurn(state: GameState): GameState {
  const prevIndex = state.currentTurnIndex;
  state.currentTurnIndex++;

  // Restore AP for the unit that just finished their turn
  const prevEntry = state.turnOrder[prevIndex];
  const prevUnit = getUnitByRef(prevEntry, state.p1Team.placed, state.p2Team.placed);
  if (prevUnit && prevUnit.currentHp > 0) {
    let apGain = 1;
    if (prevUnit.passiveId === "desperate") apGain += 1;
    prevUnit.ap = Math.min(prevUnit.ap + apGain, MAX_AP);
  }

  if (state.currentTurnIndex >= state.turnOrder.length) {
    for (const entry of state.turnOrder) {
      const unit = getUnitByRef(entry, state.p1Team.placed, state.p2Team.placed);
      if (!unit || unit.currentHp <= 0) continue;

      unit.skillUsedThisTurn = false;

      if (unit.poisonTurns > 0) {
        unit.currentHp -= 2;
        unit.poisonTurns--;
        addLog(state, `${getUnitDisplayName(unit)} takes 2 poison damage!`, "damage");
        if (unit.currentHp <= 0) {
          unit.currentHp = 0;
          addLog(state, `${getUnitDisplayName(unit)} succumbs to poison!`, "damage");
        }
      }

      if (unit.passiveId === "regeneration") {
        const maxHp = getUnitMaxHp(unit);
        unit.currentHp = Math.min(unit.currentHp + 1, maxHp);
        addLog(state, `${getUnitDisplayName(unit)} restores 1 HP via Regeneration!`, "heal");
      }
    }
    state.currentTurnIndex = 0;
    checkVictory(state);
    if (state.screen === "victory") return state;
  }

  let attempts = 0;
  while (attempts < state.turnOrder.length) {
    const next = state.turnOrder[state.currentTurnIndex % state.turnOrder.length];
    const unit = getUnitByRef(next, state.p1Team.placed, state.p2Team.placed);
    if (unit && unit.currentHp > 0) {
      unit.invulnerable = false;
      addLog(state, `${getUnitDisplayName(unit)}'s turn.`, "info");
      return state;
    }
    state.currentTurnIndex++;
    attempts++;
  }

  return state;
}

// ---- Victory check ----

function checkVictory(state: GameState): void {
  const p1Alive = state.p1Team.placed.some(u => u.currentHp > 0);
  const p2Alive = state.p2Team.placed.some(u => u.currentHp > 0);

  if (!p1Alive && !p2Alive) {
    state.screen = "victory";
    state.winner = -1;
    addLog(state, "Draw! Both sides are annihilated.", "info");
  } else if (!p1Alive) {
    state.screen = "victory";
    state.winner = 1;
    addLog(state, "Player 2 wins!", "info");
  } else if (!p2Alive) {
    state.screen = "victory";
    state.winner = 0;
    addLog(state, "Player 1 wins!", "info");
  }
}

// ---- Utility functions ----

function getUnitByRef(ref: { playerIndex: 0 | 1; unitIndex: number }, p1Team: PlacedUnit[], p2Team: PlacedUnit[]): PlacedUnit | null {
  const team = ref.playerIndex === 0 ? p1Team : p2Team;
  if (ref.unitIndex >= team.length) return null;
  return team[ref.unitIndex];
}

function getTurnUnit(state: GameState): PlacedUnit | null {
  if (state.currentTurnIndex >= state.turnOrder.length) return null;
  const { playerIndex, unitIndex } = state.turnOrder[state.currentTurnIndex];
  const team = playerIndex === 0 ? state.p1Team.placed : state.p2Team.placed;
  if (unitIndex >= team.length) return null;
  const unit = team[unitIndex];
  if (unit.currentHp <= 0) return null;
  return unit;
}

function addLog(state: GameState, msg: string, type: "info" | "damage" | "heal" = "info"): void {
  state.log.unshift({ text: msg, type });
  if (state.log.length > 50) state.log.pop();
}

// Re-exports for convenience
export { getUnitAt, getReachableTiles, getEffectiveStats, getUnitMaxHp, getUnitDisplayName, isOwnUnit, calculateDamage, getTurnUnit };
