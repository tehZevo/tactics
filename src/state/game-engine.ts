// ============================================================
//  GAME ENGINE — polymorphic action system
// ============================================================
// Each action type is a subclass of Action. The action itself
// is responsible for mutating the (cloned) GameState and returning it.
// applyAction is a thin wrapper: clone state, delegate to action.apply().

import { GameState, PlacedUnit, Team, MapLayout } from "./types.js";
import { executeAttack, executeAoeAttack } from "./combat.js";
import { executeMove, executeLeap } from "./moves.js";
import { advanceTurn } from "./turns.js";

// ---- Deep clone helper for immutable API ----

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

function getUnitFromRef(state: GameState, ref: { playerIndex: 0 | 1; unitIndex: number }): PlacedUnit | null {
  const team = ref.playerIndex === 0 ? state.p1Team.placed : state.p2Team.placed;
  return team[ref.unitIndex] || null;
}

// ---- Action class hierarchy ----

export abstract class Action {
  abstract apply(state: GameState): GameState;
}

class StartBattleAction extends Action {
  constructor(
    private readonly p1Team: Team,
    private readonly p2Team: Team,
    private readonly map: MapLayout
  ) {
    super();
  }

  apply(state: GameState): GameState {
    state.screen = "battle";
    state.p1Team = this.p1Team;
    state.p2Team = this.p2Team;
    state.map = this.map;

    // Populate board
    state.board = Array.from({ length: 12 }, () => Array(12).fill(null));
    for (const unit of state.p1Team.placed) {
      state.board[unit.row][unit.col] = unit;
    }
    for (const unit of state.p2Team.placed) {
      state.board[unit.row][unit.col] = unit;
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

    // Set initial AP for first turn unit
    const firstUnit = getUnitFromRef(state, { playerIndex: 0, unitIndex: 0 });
    if (firstUnit) {
      firstUnit.ap = 1;
    }

    return state;
  }
}

class MoveAction extends Action {
  constructor(
    private readonly targetRow: number,
    private readonly targetCol: number
  ) {
    super();
  }

  apply(state: GameState): GameState {
    executeMove(state, this.targetRow, this.targetCol);
    return state;
  }
}

class LeapAction extends Action {
  constructor(
    private readonly unitRef: { playerIndex: 0 | 1; unitIndex: number },
    private readonly row: number,
    private readonly col: number
  ) {
    super();
  }

  apply(state: GameState): GameState {
    // Advance turn to the target unit if needed
    const currentTurnEntry = state.turnOrder[state.currentTurnIndex];
    if (this.unitRef && currentTurnEntry) {
      const targetUnit = getUnitFromRef(state, this.unitRef);
      if (targetUnit && targetUnit.currentHp > 0) {
        const isSameUnit = currentTurnEntry.playerIndex === this.unitRef.playerIndex &&
          currentTurnEntry.unitIndex === this.unitRef.unitIndex;
        if (!isSameUnit) {
          let advanced = false;
          for (let i = 0; i < state.turnOrder.length; i++) {
            advanceTurn(state);
            const newTurnEntry = state.turnOrder[state.currentTurnIndex];
            if (newTurnEntry && newTurnEntry.playerIndex === this.unitRef.playerIndex &&
              newTurnEntry.unitIndex === this.unitRef.unitIndex) {
              advanced = true;
              break;
            }
          }
          if (!advanced) {
            return state;
          }
        }
      } else {
        return state;
      }
    }
    executeLeap(state, this.row, this.col);
    return state;
  }
}

class AttackAction extends Action {
  constructor(
    private readonly attackerRef: { playerIndex: 0 | 1; unitIndex: number },
    private readonly targetRef: { playerIndex: 0 | 1; unitIndex: number },
    private readonly skillId: string
  ) {
    super();
  }

  apply(state: GameState): GameState {
    // Advance turn to the attacker if needed
    const currentTurnEntry = state.turnOrder[state.currentTurnIndex];
    if (this.attackerRef && currentTurnEntry) {
      const isSameUnit = currentTurnEntry.playerIndex === this.attackerRef.playerIndex &&
        currentTurnEntry.unitIndex === this.attackerRef.unitIndex;
      if (!isSameUnit) {
        let advanced = false;
        for (let i = 0; i < state.turnOrder.length; i++) {
          advanceTurn(state);
          const newTurnEntry = state.turnOrder[state.currentTurnIndex];
          if (newTurnEntry && newTurnEntry.playerIndex === this.attackerRef.playerIndex &&
            newTurnEntry.unitIndex === this.attackerRef.unitIndex) {
            advanced = true;
            break;
          }
        }
        if (!advanced) {
          return state;
        }
      }
    }
    const target = getUnitFromRef(state, this.targetRef);
    if (target) {
      executeAttack(state, this.skillId, target);
    }
    return state;
  }
}

class AoeAttackAction extends Action {
  constructor(
    private readonly casterRef: { playerIndex: 0 | 1; unitIndex: number },
    private readonly centerRef: { playerIndex: 0 | 1; unitIndex: number } | null,
    private readonly skillDef: unknown,
    private readonly skillId: string
  ) {
    super();
  }

  apply(state: GameState): GameState {
    const aoeCaster = getUnitFromRef(state, this.casterRef);
    if (aoeCaster) {
      const centerUnit = this.centerRef ? getUnitFromRef(state, this.centerRef) || aoeCaster : aoeCaster;
      executeAoeAttack(state, aoeCaster, this.skillDef as any, this.skillId, centerUnit);
    }
    return state;
  }
}

class EndTurnAction extends Action {
  apply(state: GameState): GameState {
    advanceTurn(state);
    return state;
  }
}

class SelectUnitAction extends Action {
  constructor(
    private readonly unitRef: { playerIndex: 0 | 1; unitIndex: number } | null
  ) {
    super();
  }

  apply(state: GameState): GameState {
    state.selectedUnit = this.unitRef;
    return state;
  }
}

class EndActionModeAction extends Action {
  apply(state: GameState): GameState {
    state.actionMode = "idle";
    state.selectedAction = null;
    return state;
  }
}

// ---- Factory: plain object -> Action subclass ----

interface StartBattleData { p1Team: Team; p2Team: Team; map: MapLayout; }
interface MoveData { unitRef: { playerIndex: 0 | 1; unitIndex: number }; targetRow: number; targetCol: number; }
interface LeapData { unitRef: { playerIndex: 0 | 1; unitIndex: number }; row?: number; col?: number; target?: { row: number; col: number }; }
interface AttackData { attackerRef: { playerIndex: 0 | 1; unitIndex: number }; targetRef: { playerIndex: 0 | 1; unitIndex: number }; skillId: string; }
interface AoeAttackData { casterRef: { playerIndex: 0 | 1; unitIndex: number }; centerRef?: { playerIndex: 0 | 1; unitIndex: number }; skillDef: unknown; skillId: string; }
interface EndTurnData {}
interface SelectUnitData { unitRef: { playerIndex: 0 | 1; unitIndex: number } | null; }

function createAction(data: any): Action {
  switch (data.type) {
    case "startBattle":
      return new StartBattleAction(data.p1Team, data.p2Team, data.map);
    case "move":
      return new MoveAction(data.targetRow ?? data.target?.row, data.targetCol ?? data.target?.col);
    case "leap":
      return new LeapAction(
        data.unitRef,
        data.row ?? data.target?.row ?? 0,
        data.col ?? data.target?.col ?? 0
      );
    case "attack":
      return new AttackAction(data.attackerRef ?? data.unitRef, data.targetRef, data.skillId);
    case "aoeAttack":
      return new AoeAttackAction(data.casterRef, data.centerRef, data.skillDef, data.skillId);
    case "endTurn":
      return new EndTurnAction();
    case "selectUnit":
      return new SelectUnitAction(data.unitRef);
    case "endActionMode":
      return new EndActionModeAction();
    default:
      return new EndActionModeAction();
  }
}

// ---- Public API ----

export function applyAction(state: GameState, action: any): GameState {
  // Return a deep clone so tests don't mutate the original
  const newState = deepClone(state);

  // Set up turn order if not present (tests may skip startBattle)
  if (newState.turnOrder.length === 0 &&
    (newState.p1Team.placed.length > 0 || newState.p2Team.placed.length > 0)) {
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

  // Resolve to Action instance if needed (tests pass plain objects)
  const resolvedAction = action instanceof Action ? action : createAction(action);

  // Delegate to the action
  return resolvedAction.apply(newState);
}

export { getTurnUnit } from "./turns.js";
export { advanceTurn } from "./turns.js";
