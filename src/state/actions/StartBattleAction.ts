import { GameState, PlacedUnit, Team } from "../types.js";
import type { MapLayout } from "../../data/maps.js";
import { Action } from "./Action.js";
import { getUnitByRef } from "../helpers.js";

export class StartBattleAction extends Action {
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

    state.board = Array.from({ length: 12 }, () => Array(12).fill(null));
    for (const unit of state.p1Team.placed) {
      state.board[unit.row][unit.col] = unit;
    }
    for (const unit of state.p2Team.placed) {
      state.board[unit.row][unit.col] = unit;
    }

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

    const firstUnit = getUnitByRef({ playerIndex: 0, unitIndex: 0 }, state.p1Team.placed, state.p2Team.placed);
    if (firstUnit) {
      firstUnit.ap = 1;
    }

    return state;
  }
}

export function startBattle(p1Team: Team, p2Team: Team, map: MapLayout): StartBattleAction {
  return new StartBattleAction(p1Team, p2Team, map);
}
