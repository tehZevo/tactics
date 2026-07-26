// ============================================================
//  STATE — game state, actions, helpers, AI
// ============================================================
import {
  BOARD_COLS,
  BOARD_ROWS,
  UNIT_TYPE_DEFS,
  PASSIVE_DEFS,
} from "./data/index";
import type { GameState, PlacedUnit } from "./state/types";
import {
  getUnitAt,
  getReachableTiles,
  getTargetsInRange,
  calculateDamage,
  getEffectiveStats,
  getUnitMaxHp,
  addLog,
  findUnitRef,
  getUnitByRef,
  isOwnUnit,
  getUnitDisplayName,
} from "./state/helpers.js";
import { SKILL_DEFS } from "./data/skills.js";
import { UNIT_TYPE_IDS } from "./data/unit-types.js";
import { executeAttack, executeMove, executeAoeAttack, getTurnUnit, advanceTurn } from "./state/combat.js";
import { getRandomMap } from "./data/maps.js";
import { getRandomTeam } from "./data/teams.js";

// ---- Current map ----

let currentMapValue: ReturnType<typeof getRandomMap> | null = null;

export function currentMap() {
  if (!currentMapValue) currentMapValue = getRandomMap();
  return currentMapValue;
}

export function resetMap() {
  currentMapValue = null;
}

// ---- Factory functions ----

function createPlacedUnit(typeId: string, passiveId: string, row: number, col: number, playerIndex: 0 | 1): PlacedUnit {
  const typeDef = UNIT_TYPE_DEFS[typeId];
  let stats = {
    hp: typeDef.hp,
    attack: typeDef.baseAtk,
    defense: typeDef.baseDef,
    movement: typeDef.movement,
    initiative: typeDef.initiative,
  };
  // Apply passive
  if (passiveId && PASSIVE_DEFS[passiveId]) {
    stats = PASSIVE_DEFS[passiveId].apply(stats);
  }
  return {
    typeId,
    passiveId,
    row,
    col,
    currentHp: stats.hp,
    ap: 0,
    movement: stats.movement,
    initiative: stats.initiative,
    poisonTurns: 0,
    skillUsedThisTurn: false,
    invulnerable: false,
  };
}

// ---- State management ----

function initState(): GameState {
  return {
    screen: "menu",
    currentTeam: 0,
    p1Team: { units: [], placed: [] },
    p2Team: { units: [], placed: [] },
    deployTurn: 0,
    deployIndex: 0,
    deployQueue: [],
    turnOrder: [],
    currentTurnIndex: 0,
    selectedUnit: null,
    board: Array.from({ length: BOARD_ROWS }, () => Array(BOARD_COLS).fill(null)),
    log: [],
    winner: null,
    hoveredTile: null,
    actionMode: "idle",
    selectedAction: null,
    pendingDamage: null,
  };
}

export let state: GameState = initState();

// ---- Actions ----

let isVsAI = false;

export function startTeamSelect(viaAI: boolean): void {
  isVsAI = viaAI;
  state = initState();
  state.screen = "teamSelect";
  state.currentTeam = 0;
  notifySubscribers();
}

export function getIsVsAI(): boolean {
  return isVsAI;
}

export function selectUnit(player: 0 | 1, typeId: string): void {
  const team = player === 0 ? state.p1Team : state.p2Team;
  if (team.units.length >= 6) return;
  team.units.push({ typeId, passiveId: "" });
  notifySubscribers();
}

export function deselectUnit(player: 0 | 1, index: number): void {
  const team = player === 0 ? state.p1Team : state.p2Team;
  team.units.splice(index, 1);
  notifySubscribers();
}

export function setPassive(player: 0 | 1, unitIndex: number, passiveId: string): void {
  const team = player === 0 ? state.p1Team : state.p2Team;
  if (unitIndex < team.units.length) {
    team.units[unitIndex].passiveId = passiveId;
    notifySubscribers();
  }
}

const DEFAULT_PASSIVES: Record<string, string> = {
  warrior: "toughened",
  archer: "nimble",
  mage: "fortitude",
  rogue: "aggressive",
  geomancer: "hardened",
  paladin: "hardened",
  cleric: "nimble",
  phantom: "swift",
};

function applyDefaultPassives(): void {
  const teams = [state.p1Team, state.p2Team];
  for (const team of teams) {
    for (const unit of team.units) {
      if (!unit.passiveId && DEFAULT_PASSIVES[unit.typeId]) {
        unit.passiveId = DEFAULT_PASSIVES[unit.typeId];
      }
    }
  }
}

export function confirmTeam(): void {
  if (state.currentTeam === 0) {
    if (isVsAI) {
      // In vs AI mode, assign a random team to the computer
      state.p2Team = getRandomTeam();
      applyDefaultPassives();
      state.screen = "deployP1";
      state.deployTurn = 0;
      state.deployIndex = 0;
      // Build placement queue: alternate between players, each placing all 6
      state.deployQueue = [];
      for (let i = 0; i < 6; i++) state.deployQueue.push({ player: 0, index: i });
      for (let i = 0; i < 6; i++) state.deployQueue.push({ player: 1, index: i });
    } else {
      state.currentTeam = 1;
    }
    notifySubscribers();
  } else {
    applyDefaultPassives();
    state.screen = "deployP1";
    state.deployTurn = 0;
    state.deployIndex = 0;
    // Build placement queue: alternate between players, each placing all 6
    state.deployQueue = [];
    for (let i = 0; i < 6; i++) state.deployQueue.push({ player: 0, index: i });
    for (let i = 0; i < 6; i++) state.deployQueue.push({ player: 1, index: i });
    notifySubscribers();
  }
}

export function startDeployment(): void {
  // Both teams have been set up
  state.screen = "deployP1";
  state.deployTurn = 0;
  state.deployIndex = 0;
  state.deployQueue = [];
  for (let i = 0; i < 6; i++) state.deployQueue.push({ player: 0, index: i });
  for (let i = 0; i < 6; i++) state.deployQueue.push({ player: 1, index: i });
  notifySubscribers();
}

export function placeUnit(row: number, col: number): void {
  const queueEntry = state.deployQueue[state.deployIndex];
  if (!queueEntry) return;
  const player = queueEntry.player;

  // Validate placement zone
  if (player === 0 && col > 2) return;
  if (player === 1 && col < 7) return;
  if (getUnitAt(state, row, col)) return;
  if (row < 0 || row >= BOARD_ROWS || col < 0 || col >= BOARD_COLS) return;

  const typeId = player === 0
    ? state.p1Team.units[queueEntry.index]?.typeId
    : state.p2Team.units[queueEntry.index]?.typeId;
  const passiveId = player === 0
    ? state.p1Team.units[queueEntry.index]?.passiveId ?? ""
    : state.p2Team.units[queueEntry.index]?.passiveId ?? "";

  if (!typeId) return;

  const placed = createPlacedUnit(typeId, passiveId, row, col, player);

  if (player === 0) {
    state.p1Team.placed.push(placed);
  } else {
    state.p2Team.placed.push(placed);
  }
  state.board[row][col] = placed;

  state.deployIndex++;
  if (state.deployIndex >= state.deployQueue.length) {
    // Deployment done, start battle
    startBattle();
    return;
  }
  notifySubscribers();
}

function startBattle(): void {
  state.screen = "battle";
  addLog(state, "Battle begins!");

  // Build turn order from all placed units sorted by initiative (highest first)
  const allUnits: { playerIndex: 0 | 1; unitIndex: number; unit: PlacedUnit }[] = [];
  for (let i = 0; i < state.p1Team.placed.length; i++) {
    allUnits.push({ playerIndex: 0, unitIndex: i, unit: state.p1Team.placed[i] });
  }
  for (let i = 0; i < state.p2Team.placed.length; i++) {
    allUnits.push({ playerIndex: 1, unitIndex: i, unit: state.p2Team.placed[i] });
  }
  allUnits.sort((a, b) => {
    const aEff = getEffectiveStats(a.unit);
    const bEff = getEffectiveStats(b.unit);
    // Initiative + attack as tiebreaker
    const aScore = a.unit.initiative + aEff.attack;
    const bScore = b.unit.initiative + bEff.attack;
    return bScore - aScore;
  });

  state.turnOrder = allUnits.map((u) => ({ playerIndex: u.playerIndex, unitIndex: u.unitIndex }));
  state.currentTurnIndex = 0;

  // Set initial AP for first turn
  const firstUnit = getTurnUnit(state);
  if (firstUnit) firstUnit.ap = 1;

  if (firstUnit) {
    addLog(state, `${getUnitDisplayName(firstUnit)} leads the charge.`, "info");
  }
  notifySubscribers();
}

export function selectTile(row: number, col: number): void {
  const unit = getUnitAt(state, row, col);

  // If in action selection mode
  if (state.actionMode === "selectAction") {
    const turnUnit = getTurnUnit(state);
    if (!turnUnit) return;
    const isMyUnit = unit && isOwnUnit(turnUnit, unit);

    if (isMyUnit && unit === turnUnit) {
      // Select this unit, show actions
      state.selectedUnit = findUnitRef(turnUnit, state.p1Team.placed, state.p2Team.placed);
      state.actionMode = "idle";
      showActions(turnUnit);
      notifySubscribers();
      return;
    }
    if (isMyUnit && unit !== turnUnit) {
      state.selectedUnit = findUnitRef(unit, state.p1Team.placed, state.p2Team.placed);
      notifySubscribers();
      return;
    }
    // Clicked enemy or empty - cancel
    state.actionMode = "idle";
    state.selectedAction = null;
    notifySubscribers();
    return;
  }

  // If in target selection mode
  if (state.actionMode === "selectTarget") {
    const action = state.selectedAction;
    if (!action) return;

    if (action.type === "move") {
      executeMove(state, action.target.row, action.target.col);
      notifySubscribers();
      return;
    }
    if (action.type === "aoeAttack") {
      // Click any tile to center the AoE
      const caster = action.caster;
      const skill = SKILL_DEFS[action.skillId];
      const turnUnit = getTurnUnit(state);
      if (turnUnit && turnUnit.ap >= skill.cost && !turnUnit.skillUsedThisTurn) {
        turnUnit.skillUsedThisTurn = true;
        turnUnit.ap -= skill.cost;
        // Find or create a PlacedUnit-like object for the center
        const centerUnit = state.board[row]?.[col] || caster;
        executeAoeAttack(state, caster, skill, action.skillId, centerUnit);
      }
      state.actionMode = "idle";
      state.selectedAction = null;
      notifySubscribers();
      return;
    }
    if (action.type === "attack" || action.type === "skill") {
      executeAttack(state, action.skillId, unit!);
      notifySubscribers();
      return;
    }
  }

  // Default: select a unit
  if (unit) {
    state.selectedUnit = findUnitRef(unit, state.p1Team.placed, state.p2Team.placed);
    notifySubscribers();
    return;
  }

  // Clicked empty tile - deselect
  state.selectedUnit = null;
  state.actionMode = "idle";
  state.selectedAction = null;
  notifySubscribers();
}

function showActions(unit: PlacedUnit): void {
  state.actionMode = "selectAction";
  state.selectedAction = null;
}

export function startTargeting(unit: PlacedUnit, skillId: string): void {
  const skill = SKILL_DEFS[skillId];
  state.actionMode = "selectTarget";
  
  // AoE skills: target a tile to center the area effect
  if (skill.aoe && skill.type === "attack") {
    state.selectedAction = { type: "aoeAttack", skillId, center: { row: unit.row, col: unit.col }, caster: unit };
    return;
  }
  
  state.selectedAction = { type: skill.type === "attack" ? "attack" : "skill", target: unit, skillId };
}

export function endTurn(): void {
  advanceTurn(state);
}

export function restartGame(): void {
  state = initState();
  state.screen = "menu";
  notifySubscribers();
}

// ---- React subscription system ----
let subscribers: Set<() => void> = new Set();

export function getState(): typeof state {
  return state;
}

export function subscribe(callback: () => void): () => void {
  subscribers.add(callback);
  return () => {
    subscribers.delete(callback);
  };
}

export function notifySubscribers(): void {
  for (const sub of subscribers) {
    sub();
  }
}

// ---- Re-exports from submodules ----

export { executeAttack, executeMove, getTurnUnit, advanceTurn } from "./state/combat";
export { aiTakeTurn } from "./state/ai";
export { isOwnUnit, getUnitDisplayName, getReachableTiles, getEffectiveStats, getUnitMaxHp, getUnitAt, getTargetsInRange, calculateDamage, addLog, findUnitRef, getUnitByRef } from "./state/helpers";
export type { GameState, PlacedUnit } from "./state/types";
