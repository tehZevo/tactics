import { GameState } from "../types.js";
import { Action } from "./Action.js";
import { getUnitByRef } from "../helpers.js";
import { executeAttack } from "../combat.js";
import { advanceTurn } from "../turns.js";

export class AttackAction extends Action {
  constructor(
    private readonly attackerRef: { playerIndex: 0 | 1; unitIndex: number },
    private readonly targetRef: { playerIndex: 0 | 1; unitIndex: number },
    private readonly skillId: string
  ) {
    super();
  }

  apply(state: GameState): GameState {
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
    const target = getUnitByRef(this.targetRef, state.p1Team.placed, state.p2Team.placed);
    if (target) {
      executeAttack(state, this.skillId, target);
    }
    return state;
  }
}

export function attack(attackerRef: { playerIndex: 0 | 1; unitIndex: number }, targetRef: { playerIndex: 0 | 1; unitIndex: number }, skillId: string): AttackAction {
  return new AttackAction(attackerRef, targetRef, skillId);
}
