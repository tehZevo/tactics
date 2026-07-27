import { GameState } from "../types.js";
import { Action } from "./Action.js";
import { getUnitByRef } from "../helpers.js";
import { executeSkillEffect } from "../skill-effects/index.js";
import { advanceTurn } from "../turns.js";

export class UseSkillAction extends Action {
  constructor(
    private readonly casterRef: { playerIndex: 0 | 1; unitIndex: number },
    private readonly targetRef: { playerIndex: 0 | 1; unitIndex: number } | null,
    private readonly skillId: string,
    private readonly targetLocation?: { row: number; col: number }
  ) {
    super();
  }

  apply(state: GameState): GameState {
    const currentTurnEntry = state.turnOrder[state.currentTurnIndex];
    if (currentTurnEntry) {
      const isSameUnit = currentTurnEntry.playerIndex === this.casterRef.playerIndex &&
        currentTurnEntry.unitIndex === this.casterRef.unitIndex;
      if (!isSameUnit) {
        let advanced = false;
        for (let i = 0; i < state.turnOrder.length; i++) {
          advanceTurn(state);
          const newTurnEntry = state.turnOrder[state.currentTurnIndex];
          if (newTurnEntry && newTurnEntry.playerIndex === this.casterRef.playerIndex &&
            newTurnEntry.unitIndex === this.casterRef.unitIndex) {
            advanced = true;
            break;
          }
        }
        if (!advanced) {
          return state;
        }
      }
    }

    const caster = getUnitByRef(this.casterRef, state.p1Team.placed, state.p2Team.placed);
    if (!caster || caster.currentHp <= 0) return state;

    const target = this.targetRef
      ? getUnitByRef(this.targetRef, state.p1Team.placed, state.p2Team.placed)
      : null;

    executeSkillEffect(state, caster, target, this.skillId, this.targetLocation);
    return state;
  }
}

export function useSkill(
  casterRef: { playerIndex: 0 | 1; unitIndex: number },
  targetRef: { playerIndex: 0 | 1; unitIndex: number } | null,
  skillId: string,
  targetLocation?: { row: number; col: number }
): UseSkillAction {
  return new UseSkillAction(casterRef, targetRef, skillId, targetLocation);
}
