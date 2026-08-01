import { GameState, PlacedUnit, Team } from "../types.js";
import type { MapLayout } from "../../data/maps.js";
import { Action } from "./Action.js";
import { getUnitByRef } from "../helpers.js";
import { buildTurnOrder } from "../turns.js";

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

    state.turnOrder = buildTurnOrder(state.p1Team.placed, state.p2Team.placed);
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
