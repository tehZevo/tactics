import { GameState } from "../types.js";
import { Action } from "./Action.js";
import { getUnitByRef } from "../helpers.js";
import { executeAoeAttack } from "../combat.js";

export class AoeAttackAction extends Action {
  constructor(
    private readonly casterRef: { playerIndex: 0 | 1; unitIndex: number },
    private readonly centerRef: { playerIndex: 0 | 1; unitIndex: number } | null,
    private readonly skillDef: unknown,
    private readonly skillId: string
  ) {
    super();
  }

  apply(state: GameState): GameState {
    const aoeCaster = getUnitByRef(this.casterRef, state.p1Team.placed, state.p2Team.placed);
    if (aoeCaster) {
      const centerUnit = this.centerRef ? getUnitByRef(this.centerRef, state.p1Team.placed, state.p2Team.placed) || aoeCaster : aoeCaster;
      executeAoeAttack(state, aoeCaster, this.skillDef as any, this.skillId, centerUnit);
    }
    return state;
  }
}

export function aoeAttack(casterRef: { playerIndex: 0 | 1; unitIndex: number }, centerRef: { playerIndex: 0 | 1; unitIndex: number } | null, skillDef: unknown, skillId: string): AoeAttackAction {
  return new AoeAttackAction(casterRef, centerRef, skillDef, skillId);
}
