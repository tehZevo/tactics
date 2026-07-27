// ============================================================
//  STATE — game state, actions, helpers, AI
// ============================================================
import {
  BOARD_COLS,
  BOARD_ROWS,
  UNIT_TYPE_DEFS,
  PASSIVE_DEFS,
} from "./data/index";
import type { GameState, PlacedUnit, Team } from "./state/types";
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
  getPlayerIndex,
} from "./state/helpers.js";
import { SKILL_DEFS } from "./data/skills.js";
import { executeMove, executeLeap } from "./state/moves.js";
import { executeAttack, executeAoeAttack } from "./state/combat.js";
import { getTurnUnit, advanceTurn } from "./state/turns.js";
import { getRandomMap, TEST_MAP } from "./data/maps.js";
import { getRandomTeam, PRESET_TEAMS, getTeamPlacements } from "./data/teams.js";

// ---- Factory functions ----

export function createPlacedUnit(typeId: string, passiveId: string, row: number, col: number, playerIndex: 0 | 1): PlacedUnit {
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
    playerIndex,
    currentHp: stats.hp,
    ap: 0,
    movement: stats.movement,
    baseMovement: stats.movement,
    initiative: stats.initiative,
    skillUsedThisTurn: false,
    invulnerable: false,
    leapBonus: 0,
    turnStartRow: row,
    turnStartCol: col,
  };
}

// ---- State management ----

function initState(): GameState {
  return {
    screen: "menu",
    currentTeam: 0,
    p1Team: { placed: [] },
    p2Team: { placed: [] },
    map: getRandomMap(),
    deployTurn: 0,
    selectedDeployCell: null,
    editingUnitIndex: null,
    selectedUnitType: null,
    selectedPassiveId: null,
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

export function startTestBattle(): void {
  isVsAI = false;
  state = initState();
  state.map = TEST_MAP;

  const balanced = PRESET_TEAMS[0]; // Balanced team
  const buildTeam = (side: "p1" | "p2") => {
    const placements = getTeamPlacements(side);
    const team: Team = { placed: [] };
    balanced.units.forEach((unit, index) => {
      const pos = placements[index];
      const placed = createPlacedUnit(unit.typeId, unit.passiveId, pos.row, pos.col, side === "p1" ? 0 : 1);
      team.placed.push(placed);
    });
    return team;
  };

  state.p1Team = buildTeam("p1");
  state.p2Team = buildTeam("p2");
  startBattle();
}

export function getIsVsAI(): boolean {
  return isVsAI;
}

export function setPassive(player: 0 | 1, unitIndex: number, passiveId: string): void {
  const team = player === 0 ? state.p1Team : state.p2Team;
  if (team.placed[unitIndex]) {
    team.placed[unitIndex].passiveId = passiveId;
    notifySubscribers();
  }
}

// ---- Deploy / Team Selection ----

export function selectDeployCell(row: number, col: number): void {
  const existingUnit = getUnitAt(state, row, col);
  const team = state.deployTurn === 0 ? state.p1Team : state.p2Team;

  // If clicking on an existing placed unit, enter edit mode for it
  if (existingUnit) {
    const unitPlayer = getPlayerIndex(existingUnit);
    if (unitPlayer === state.deployTurn) {
      const index = team.placed.indexOf(existingUnit);
      if (index >= 0) {
        state.editingUnitIndex = index;
        state.selectedDeployCell = { row, col };
        state.selectedUnitType = existingUnit.typeId;
        state.selectedPassiveId = existingUnit.passiveId;
        notifySubscribers();
        return;
      }
    }
    return; // Can't place on enemy units
  }

  // Validate deployment zone
  if (state.deployTurn === 0 && col > 2) return;
  if (state.deployTurn === 1 && col < 9) return;

  // If a unit type is selected, place it directly
  if (state.selectedUnitType && team.placed.length < 6) {
    const newUnit = createPlacedUnit(state.selectedUnitType, state.selectedPassiveId || "", row, col, state.deployTurn as 0 | 1);
    team.placed.push(newUnit);
    state.board[row][col] = newUnit;
    state.editingUnitIndex = null;
    state.selectedDeployCell = null;
    notifySubscribers();
    return;
  }

  // Otherwise just select the cell
  state.selectedDeployCell = { row, col };
  state.editingUnitIndex = null;
  notifySubscribers();
}

export function addUnitToBoard(typeId: string, passiveId: string): void {
  if (!state.selectedDeployCell) return;

  const team = state.deployTurn === 0 ? state.p1Team : state.p2Team;
  const cell = state.selectedDeployCell;

  // Check if there's already a unit on that cell (from edit mode)
  const existingUnit = getUnitAt(state, cell.row, cell.col);

  if (existingUnit && state.editingUnitIndex !== null) {
    // Replacing the type/passive of an existing unit — change the cell position to new cell
    const newUnit = createPlacedUnit(typeId, passiveId, cell.row, cell.col, state.deployTurn as 0 | 1);
    state.board[cell.row][cell.col] = newUnit;
    team.placed[state.editingUnitIndex] = newUnit;
  } else if (!existingUnit) {
    // Check we haven't exceeded 6 units
    if (team.placed.length >= 6) return;

    const newUnit = createPlacedUnit(typeId, passiveId, cell.row, cell.col, state.deployTurn as 0 | 1);
    team.placed.push(newUnit);
    state.board[cell.row][cell.col] = newUnit;
  } else {
    return;
  }

  // Clear editing state after adding
  if (state.editingUnitIndex !== null) {
    state.editingUnitIndex = null;
  }

  notifySubscribers();
}

export function deletePlacedUnit(index: number): void {
  const team = state.deployTurn === 0 ? state.p1Team : state.p2Team;
  const unit = team.placed[index];
  if (!unit) return;

  state.board[unit.row][unit.col] = null;
  team.placed.splice(index, 1);

  // If we were editing this unit, clear editing state
  if (state.editingUnitIndex === index) {
    state.editingUnitIndex = null;
    state.selectedDeployCell = null;
  } else if (state.editingUnitIndex !== null && state.editingUnitIndex > index) {
    state.editingUnitIndex--;
  }

  notifySubscribers();
}

export function setUnitType(index: number, typeId: string): void {
  const team = state.deployTurn === 0 ? state.p1Team : state.p2Team;
  const unit = team.placed[index];
  if (!unit) return;

  unit.typeId = typeId;
  unit.currentHp = UNIT_TYPE_DEFS[typeId].hp;
  unit.movement = UNIT_TYPE_DEFS[typeId].movement;
  unit.baseMovement = UNIT_TYPE_DEFS[typeId].movement;
  unit.initiative = UNIT_TYPE_DEFS[typeId].initiative;

  // Recalculate stats from passive
  if (unit.passiveId && PASSIVE_DEFS[unit.passiveId]) {
    const stats = PASSIVE_DEFS[unit.passiveId].apply({
      hp: UNIT_TYPE_DEFS[typeId].hp,
      attack: UNIT_TYPE_DEFS[typeId].baseAtk,
      defense: UNIT_TYPE_DEFS[typeId].baseDef,
      movement: UNIT_TYPE_DEFS[typeId].movement,
      initiative: UNIT_TYPE_DEFS[typeId].initiative,
    });
    unit.currentHp = stats.hp;
    unit.movement = stats.movement;
    unit.baseMovement = stats.movement;
    unit.initiative = stats.initiative;
  }

  notifySubscribers();
}

function checkDeploymentComplete(): boolean {
  const p1Placed = state.p1Team.placed.length;
  const p2Placed = state.p2Team.placed.length;
  if (p1Placed >= 6 && p2Placed >= 6) {
    return true;
  }
  return false;
}

export function confirmTeam(): void {
  if (state.currentTeam === 0) {
    if (isVsAI) {
      // AI mode: generate AI team and start battle directly
      const aiTeam = getRandomTeam();
      state.p2Team = aiTeam;
      startBattle();
    } else {
      // PvP: P1 done, switch to P2
      state.currentTeam = 1;
      state.deployTurn = 1;
      state.selectedDeployCell = null;
      state.editingUnitIndex = null;
      state.selectedUnitType = null;
      state.selectedPassiveId = null;
      notifySubscribers();
    }
  } else {
    // PvP P2 done, start battle
    startBattle();
  }
}

// ---- Unit/Passive Selection ----

export function selectUnitType(typeId: string): void {
  state.selectedUnitType = typeId;
  state.selectedPassiveId = null;
  notifySubscribers();
}

export function selectPassiveId(passiveId: string): void {
  state.selectedPassiveId = passiveId;
  notifySubscribers();
}

export function getSelectedUnitType(): string | null {
  return state.selectedUnitType;
}

export function getSelectedPassiveId(): string | null {
  return state.selectedPassiveId;
}

// ---- Combat functions ----

export function placeUnit(row: number, col: number): void {
  // During deployment/team select, handle cell selection and unit editing
  if (state.screen === "teamSelect") {
    selectDeployCell(row, col);
    return;
  }

  // Battle phase logic
  const unit = getUnitAt(state, row, col);

  // If in action selection mode
  if (state.actionMode === "selectAction") {
    const turnUnit = getTurnUnit(state);
    if (!turnUnit) return;
    const isMyUnit = unit && isOwnUnit(turnUnit, unit);

    if (isMyUnit && unit === turnUnit) {
      state.selectedUnit = findUnitRef(turnUnit, state.p1Team.placed, state.p2Team.placed);
      state.actionMode = "idle";
      state.actionMode = "selectAction";
      state.selectedAction = null;
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
    if (action.type === "leap") {
      executeLeap(state, row, col);
      notifySubscribers();
      return;
    }
    if (action.type === "aoeAttack") {
      const caster = action.caster;
      const skill = SKILL_DEFS[action.skillId];
      const turnUnit = getTurnUnit(state);
      if (turnUnit && turnUnit.ap >= skill.cost && !turnUnit.skillUsedThisTurn) {
        turnUnit.skillUsedThisTurn = true;
        turnUnit.ap -= skill.cost;
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

export function startTargeting(unit: PlacedUnit, skillId: string): void {
  const skill = SKILL_DEFS[skillId];
  state.actionMode = "selectTarget";

  if (skill.selfTarget) {
    executeAttack(state, skillId, unit);
    state.actionMode = "idle";
    state.selectedAction = null;
    notifySubscribers();
    return;
  }

  if (skill.aoe && skill.type === "attack") {
    state.selectedAction = { type: "aoeAttack", skillId, center: { row: unit.row, col: unit.col }, caster: unit };
    return;
  }

  if (skill.type === "movement" && skill.leapBonus) {
    executeAttack(state, skillId, unit);
    state.selectedAction = { type: "leap", target: { row: unit.row, col: unit.col } };
    notifySubscribers();
    return;
  }

  state.selectedAction = { type: skill.type === "attack" ? "attack" : "skill", target: unit, skillId };
  notifySubscribers();
}

export function endTurn(): void {
  advanceTurn(state);
  notifySubscribers();
}

export function startBattle(): void {
  state.screen = "battle";
  addLog(state, "Battle begins!");

  // Rebuild board from team data
  state.board = Array.from({ length: BOARD_ROWS }, () => Array(BOARD_COLS).fill(null));
  for (const unit of state.p1Team.placed) {
    state.board[unit.row][unit.col] = unit;
  }
  for (const unit of state.p2Team.placed) {
    state.board[unit.row][unit.col] = unit;
  }

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

  // Trigger AI if first unit is AI-controlled
  if (firstUnit && getIsVsAI() && getPlayerIndex(firstUnit) === 1) {
    setTimeout(() => aiTakeTurn(state), 300);
  }
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

export { executeAttack, executeAoeAttack } from "./state/combat";
export { executeMove, executeLeap } from "./state/moves";
export { getTurnUnit, advanceTurn } from "./state/turns";
export { aiTakeTurn } from "./state/ai";
export { isOwnUnit, getPlayerIndex, getUnitDisplayName, getReachableTiles, getEffectiveStats, getEffectiveStatsFor, getUnitMaxHp, getUnitMaxHpFor, getUnitAt, getTargetsInRange, calculateDamage, addLog, findUnitRef, getUnitByRef } from "./state/helpers";
export type { GameState, PlacedUnit } from "./state/types";
