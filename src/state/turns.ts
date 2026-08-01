// ============================================================
//  STATE / TURNS — turn management (advanceTurn, getTurnUnit, startBattle)
// ============================================================
import {
  BOARD_COLS,
  BOARD_ROWS,
  MAX_AP,
} from "../data/index.js";
import { GameState, PlacedUnit } from "./types.js";
import {
  getUnitByRef,
  getUnitMaxHp,
  getUnitDisplayName,
  checkVictory,
  addLog,
  finalizeMove,
} from "./helpers.js";

export function buildTurnOrder(p1Placed: PlacedUnit[], p2Placed: PlacedUnit[]): { playerIndex: 0 | 1; unitIndex: number }[] {
  const p1 = p1Placed.map((unit, i) => ({ playerIndex: 0 as const, unitIndex: i, unit }));
  const p2 = p2Placed.map((unit, i) => ({ playerIndex: 1 as const, unitIndex: i, unit }));

  const initGroups = new Map<number, { playerIndex: 0 | 1; unitIndex: number; unit: PlacedUnit }[]>();
  for (const u of [...p1, ...p2]) {
    const init = u.unit.initiative;
    if (!initGroups.has(init)) initGroups.set(init, []);
    initGroups.get(init)!.push(u);
  }

  const sortedInits = [...initGroups.keys()].sort((a, b) => b - a);
  const ordered: { playerIndex: 0 | 1; unitIndex: number; unit: PlacedUnit }[] = [];
  for (const init of sortedInits) {
    const group = initGroups.get(init)!;
    const byPlayer = new Map<0 | 1, typeof group>();
    for (const u of group) {
      if (!byPlayer.has(u.playerIndex)) byPlayer.set(u.playerIndex, []);
      byPlayer.get(u.playerIndex)!.push(u);
    }
    let p0i = 0, p1i = 0;
    const p0 = byPlayer.get(0) || [];
    const p1 = byPlayer.get(1) || [];
    while (p0i < p0.length || p1i < p1.length) {
      if (p0i < p0.length) ordered.push(p0[p0i++]);
      if (p1i < p1.length) ordered.push(p1[p1i++]);
    }
  }
  return ordered.map(u => ({ playerIndex: u.playerIndex, unitIndex: u.unitIndex }));
}

export function getTurnUnit(state: GameState): PlacedUnit | null {
  if (state.currentTurnIndex >= state.turnOrder.length) return null;
  const { playerIndex, unitIndex } = state.turnOrder[state.currentTurnIndex];
  const team = playerIndex === 0 ? state.p1Team.placed : state.p2Team.placed;
  if (unitIndex >= team.length) return null;
  const unit = team[unitIndex];
  if (unit.currentHp <= 0) return null;
  return unit;
}

export function advanceTurn(state: GameState): GameState {
  const prevIndex = state.currentTurnIndex;
  
  // Finalize any tentative moves for the previous turn's unit
  if (prevIndex < state.turnOrder.length) {
    const prevEntry = state.turnOrder[prevIndex];
    const prevUnit = getUnitByRef(prevEntry, state.p1Team.placed, state.p2Team.placed);
    if (prevUnit && (prevUnit.tentativeRow !== undefined || prevUnit.tentativeCol !== undefined)) {
      finalizeMove(state, prevUnit);
    }
  }
  
  state.currentTurnIndex++;

  if (state.currentTurnIndex >= state.turnOrder.length) {
    for (const entry of state.turnOrder) {
      const unit = getUnitByRef(entry, state.p1Team.placed, state.p2Team.placed);
      if (!unit || unit.currentHp <= 0) continue;

      unit.skillUsedThisTurn = false;
      unit.leapBonus = 0;
      unit.movement = unit.baseMovement;
      unit.turnStartRow = unit.row;
      unit.turnStartCol = unit.col;
      unit.originalRow = unit.row;
      unit.originalCol = unit.col;
      delete unit.tentativeRow;
      delete unit.tentativeCol;

      if (unit.poisonTurns > 0) {
        unit.poisonTurns--;
        unit.currentHp -= 1;
        addLog(state, `${getUnitDisplayName(unit)} takes 1 poison damage! (${unit.poisonTurns} turns remaining)`, "damage");
        if (unit.currentHp <= 0) {
          unit.currentHp = 0;
          state.board[unit.row][unit.col] = null;
          addLog(state, `${getUnitDisplayName(unit)} has succumbed to poison!`, "damage");
        }
      }

      if (unit.passiveId === "regeneration") {
        const maxHp = getUnitMaxHp(unit);
        unit.currentHp = Math.min(unit.currentHp + 1, maxHp);
        addLog(state, `${getUnitDisplayName(unit)} restores 1 HP via Regeneration!`, "heal");
      }

      // Process rune effects for units standing on rune tiles
      for (const rune of state.runeEffects) {
        if (rune.row === unit.row && rune.col === unit.col) {
          if (rune.type === "flame") {
            unit.currentHp -= 1;
            addLog(state, `${getUnitDisplayName(unit)} takes 1 damage from a Flame Rune!`, "damage");
            if (unit.currentHp <= 0) {
              unit.currentHp = 0;
              state.board[unit.row][unit.col] = null;
              addLog(state, `${getUnitDisplayName(unit)} has been consumed by the Flame Rune!`, "damage");
            }
          } else if (rune.type === "earth") {
            unit.defenseBonus = (unit.defenseBonus || 0) + 1;
            addLog(state, `${getUnitDisplayName(unit)} gains +1 defense from an Earth Rune!`, "info");
          }
        }
      }
    }
    state.currentTurnIndex = 0;

    // Reduce rune durations and remove expired runes
    state.runeEffects = state.runeEffects
      .map(rune => ({ ...rune, turns: rune.turns - 1 }))
      .filter(rune => rune.turns > 0);

    checkVictory(state);
    if (state.screen === "victory") return state;
  }

  let attempts = 0;
  while (attempts < state.turnOrder.length) {
    const next = state.turnOrder[state.currentTurnIndex % state.turnOrder.length];
    const unit = getUnitByRef(next, state.p1Team.placed, state.p2Team.placed);
    if (unit && unit.currentHp > 0) {
      unit.invulnerable = false;
      unit.turnStartRow = unit.row;
      unit.turnStartCol = unit.col;

      if (unit.buffTurns > 0) {
        unit.buffTurns--;
        if (unit.buffTurns === 0) {
          addLog(state, `${getUnitDisplayName(unit)}'s berserk rage fades! No more attack/defense bonus.`, "info");
        }
      }

      let apGain = 2;
      if (unit.passiveId === "desperate") apGain += 1;
      if (unit.passiveId === "energized") apGain += 2;
      if ((unit.focusCharges || 0) > 0) {
        apGain += 1;
        unit.focusCharges!--;
        addLog(state, `${getUnitDisplayName(unit)} gains +1 AP from Focus!`, "info");
      }
      unit.ap = Math.min(unit.ap + apGain, MAX_AP);
      state.selectedUnit = { playerIndex: next.playerIndex, unitIndex: next.unitIndex };
      state.actionMode = "idle";
      state.selectedAction = null;
      addLog(state, `${getUnitDisplayName(unit)}'s turn.`, "info");

      // Check if unit starts their turn on a wind rune
      const windRune = state.runeEffects.find(r => r.row === unit.row && r.col === unit.col && r.type === "wind");
      if (windRune) {
        unit.movement += 1;
        addLog(state, `${getUnitDisplayName(unit)} gains +1 movement from a Wind Rune!`, "info");
      }

      return state;
    }
    state.currentTurnIndex++;
    attempts++;
  }
  return state;
}

export function startBattle(state: GameState): void {
  state.screen = "battle";
  state.log = [];

  // Build board from teams
  state.board = Array.from({ length: BOARD_ROWS }, () => Array(BOARD_COLS).fill(null));
  for (const unit of state.p1Team.placed) {
    state.board[unit.row][unit.col] = { ...unit, currentHp: unit.currentHp || getUnitMaxHp(unit) };
  }
  for (const unit of state.p2Team.placed) {
    state.board[unit.row][unit.col] = { ...unit, currentHp: unit.currentHp || getUnitMaxHp(unit) };
  }

  // Build turn order
  const allUnits: { playerIndex: 0 | 1; unitIndex: number; unit: PlacedUnit }[] = [];
  for (let i = 0; i < state.p1Team.placed.length; i++) {
    allUnits.push({ playerIndex: 0, unitIndex: i, unit: state.p1Team.placed[i] });
  }
  for (let i = 0; i < state.p2Team.placed.length; i++) {
    allUnits.push({ playerIndex: 1, unitIndex: i, unit: state.p2Team.placed[i] });
  }
  allUnits.sort((a, b) => b.unit.initiative - a.unit.initiative);

  state.turnOrder = allUnits.map(u => ({ playerIndex: u.playerIndex, unitIndex: u.unitIndex }));
  state.currentTurnIndex = 0;

  const firstUnit = getTurnUnit(state);
  if (firstUnit) {
    firstUnit.ap = 2;
    firstUnit.turnStartRow = firstUnit.row;
    firstUnit.turnStartCol = firstUnit.col;
    addLog(state, `${getUnitDisplayName(firstUnit)} leads the charge.`, "info");
  }
}
