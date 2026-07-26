// ============================================================
//  GAME ENGINE — backward-compatible wrapper for tests
// ============================================================
// The game engine now uses mutable state for performance, but
// tests expect an immutable applyAction API. This file wraps
// the mutable functions to provide that interface.

import { GameState } from "./types.js";
import { executeAttack, executeAoeAttack } from "./combat.js";
import { executeMove, executeLeap } from "./moves.js";
import { getTurnUnit, advanceTurn } from "./turns.js";
import { PlacedUnit } from "./types.js";

// Deep clone helper for immutable API
function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

function getUnitFromRef(state: GameState, ref: { playerIndex: 0 | 1; unitIndex: number }): PlacedUnit | null {
  const team = ref.playerIndex === 0 ? state.p1Team.placed : state.p2Team.placed;
  return team[ref.unitIndex] || null;
}

export function applyAction(state: GameState, action: any): GameState {
  // Return a deep clone so tests don't mutate the original
  const newState = deepClone(state);

  // Set up turn order if not present (tests may skip startBattle)
  if (newState.turnOrder.length === 0 && (newState.p1Team.placed.length > 0 || newState.p2Team.placed.length > 0)) {
    const allUnits: { playerIndex: 0 | 1; unitIndex: number; unit: PlacedUnit }[] = [];
    for (let i = 0; i < newState.p1Team.placed.length; i++) {
      allUnits.push({ playerIndex: 0, unitIndex: i, unit: newState.p1Team.placed[i] });
    }
    for (let i = 0; i < newState.p2Team.placed.length; i++) {
      allUnits.push({ playerIndex: 1, unitIndex: i, unit: newState.p2Team.placed[i] });
    }
    allUnits.sort((a, b) => b.unit.initiative - a.unit.initiative);
    newState.turnOrder = allUnits.map(u => ({ playerIndex: u.playerIndex, unitIndex: u.unitIndex }));
    newState.currentTurnIndex = 0;
  }

  switch (action.type) {
    case "startBattle":
      // Initialize battle state
      newState.screen = "battle";
      newState.p1Team = action.p1Team;
      newState.p2Team = action.p2Team;
      newState.map = action.map;
      // Populate board
      newState.board = Array.from({ length: 6 }, () => Array(10).fill(null));
      for (const unit of newState.p1Team.placed) {
        newState.board[unit.row][unit.col] = unit;
      }
      for (const unit of newState.p2Team.placed) {
        newState.board[unit.row][unit.col] = unit;
      }
      // Build turn order
      const allUnits: { playerIndex: 0 | 1; unitIndex: number; unit: PlacedUnit }[] = [];
      for (let i = 0; i < newState.p1Team.placed.length; i++) {
        allUnits.push({ playerIndex: 0, unitIndex: i, unit: newState.p1Team.placed[i] });
      }
      for (let i = 0; i < newState.p2Team.placed.length; i++) {
        allUnits.push({ playerIndex: 1, unitIndex: i, unit: newState.p2Team.placed[i] });
      }
      allUnits.sort((a, b) => b.unit.initiative - a.unit.initiative);
      newState.turnOrder = allUnits.map(u => ({ playerIndex: u.playerIndex, unitIndex: u.unitIndex }));
      newState.currentTurnIndex = 0;
      // Set initial AP for first turn unit
      const firstUnit = getUnitFromRef(newState, { playerIndex: 0, unitIndex: 0 });
      if (firstUnit) {
        firstUnit.ap = 1;
      }
      break;

    case "move": {
      const moveRow = action.targetRow ?? action.target?.row;
      const moveCol = action.targetCol ?? action.target?.col;
      if (moveRow !== undefined && moveCol !== undefined) {
        executeMove(newState, moveRow, moveCol);
      }
      break;
    }

    case "leap": {
      // Advance turn to the target unit if needed
      const targetUnitRef = action.unitRef;
      const currentTurnEntry = newState.turnOrder[newState.currentTurnIndex];
      if (targetUnitRef && currentTurnEntry) {
        const targetUnit = getUnitFromRef(newState, targetUnitRef);
        if (targetUnit && targetUnit.currentHp > 0) {
          const isSameUnit = currentTurnEntry.playerIndex === targetUnitRef.playerIndex && currentTurnEntry.unitIndex === targetUnitRef.unitIndex;
          if (!isSameUnit) {
            let advanced = false;
            for (let i = 0; i < newState.turnOrder.length; i++) {
              advanceTurn(newState);
              const newTurnEntry = newState.turnOrder[newState.currentTurnIndex];
              if (newTurnEntry && newTurnEntry.playerIndex === targetUnitRef.playerIndex && newTurnEntry.unitIndex === targetUnitRef.unitIndex) {
                advanced = true;
                break;
              }
            }
            if (!advanced) {
              return newState;
            }
          }
        } else {
          return newState;
        }
      }
      const leapRow = action.row ?? action.target?.row;
      const leapCol = action.col ?? action.target?.col;
      if (leapRow !== undefined && leapCol !== undefined) {
        executeLeap(newState, leapRow, leapCol);
      }
      break;
    }

    case "attack": {
      // Advance turn to the attacker if needed
      const attackerRef = action.attackerRef ?? action.unitRef;
      const currentTurnEntry = newState.turnOrder[newState.currentTurnIndex];
      if (attackerRef && currentTurnEntry) {
        const isSameUnit = currentTurnEntry.playerIndex === attackerRef.playerIndex && currentTurnEntry.unitIndex === attackerRef.unitIndex;
        if (!isSameUnit) {
          let advanced = false;
          for (let i = 0; i < newState.turnOrder.length; i++) {
            advanceTurn(newState);
            const newTurnEntry = newState.turnOrder[newState.currentTurnIndex];
            if (newTurnEntry && newTurnEntry.playerIndex === attackerRef.playerIndex && newTurnEntry.unitIndex === attackerRef.unitIndex) {
              advanced = true;
              break;
            }
          }
          if (!advanced) {
            return newState;
          }
        }
      }
      const target = getUnitFromRef(newState, action.targetRef);
      if (target) {
        executeAttack(newState, action.skillId, target);
      }
      break;
    }

    case "aoeAttack":
      const aoeCaster = getUnitFromRef(newState, action.casterRef);
      if (aoeCaster) {
        const centerUnit = getUnitFromRef(newState, action.centerRef) || aoeCaster;
        executeAoeAttack(newState, aoeCaster, action.skillDef, action.skillId, centerUnit);
      }
      break;

    case "endTurn":
      advanceTurn(newState);
      break;

    case "selectUnit":
      newState.selectedUnit = action.unitRef;
      break;

    case "endActionMode":
      newState.actionMode = "idle";
      newState.selectedAction = null;
      break;

    default:
      break;
  }

  return newState;
}

export { getTurnUnit, advanceTurn } from "./turns.js";
