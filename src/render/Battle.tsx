/// <reference types="react" />
import React from 'react';
import {
  state,
  endTurn,
  aiTakeTurn,
  subscribe,
  getIsVsAI,
  getTurnUnit,
  getEffectiveStats,
  startTargeting,
  notifySubscribers,
  getPlayerIndex,
} from "../state";
import { TurnOrderStrip, UnitPanel, BattleLog } from "./components/BattleComponents";
import { Board } from "./components/Board";
import { useState, useEffect } from "react";
import { UNIT_TYPE_DEFS, SKILL_DEFS } from "../data/index";

let _isVsAI = getIsVsAI();

export function Battle() {
  const [version, setVersion] = useState(0);

  useEffect(() => {
    return subscribe(() => {
      setVersion(v => v + 1);
    });
  }, []);

  const handleEndTurn = () => {
    endTurn();
    _isVsAI = getIsVsAI();
    if (_isVsAI && state.screen === "battle") {
      const nextUnit = getTurnUnit(state);
      const nextIsAI = nextUnit && getPlayerIndex(nextUnit) === 1;
      if (nextIsAI) {
        setTimeout(() => {
          if (state.screen === "battle") {
            aiTakeTurn(state);
          }
        }, 300);
      }
    }
  };

  const handleMove = () => {
    const turnUnit = getTurnUnit(state);
    if (!turnUnit) return;
    state.selectedUnit = { playerIndex: turnUnit.playerIndex ?? getPlayerIndex(turnUnit), unitIndex: state.turnOrder[state.currentTurnIndex]?.unitIndex ?? 0 };
    state.actionMode = "idle";
    state.selectedAction = null;
    notifySubscribers();
  };

  const turnUnit = getTurnUnit(state);
  const playerIdx = turnUnit ? getPlayerIndex(turnUnit) : null;
  const turnTd = turnUnit ? UNIT_TYPE_DEFS[turnUnit.typeId] : null;

  // Determine if it's the human player's turn
  const isHumanTurn = turnUnit && (
    (_isVsAI && getPlayerIndex(turnUnit) === 0) || !_isVsAI
  );

  // Build skill buttons for the current turn unit
  const skillButtons: { id: string; label: string; cost: number; canUse: boolean }[] = [];
  if (turnUnit && turnTd) {
    const eff = getEffectiveStats(turnUnit);
    for (const sid of turnTd.skills) {
      const skill = SKILL_DEFS[sid];
      if (!skill) continue;
      const canUse = turnUnit.ap >= skill.cost && !turnUnit.skillUsedThisTurn;
      skillButtons.push({
        id: sid,
        label: skill.name,
        cost: skill.cost,
        canUse,
      });
    }
  }

  const handleSkill = (skillId: string) => {
    const turnUnit = getTurnUnit(state);
    if (!turnUnit) return;
    const skill = SKILL_DEFS[skillId];
    if (!skill || turnUnit.ap < skill.cost || turnUnit.skillUsedThisTurn) return;
    startTargeting(turnUnit, skillId);
  };

  return (
    <div className="screen active battle-screen">
      <TurnOrderStrip />

      <div className="battle-header">
        {turnUnit && turnTd && playerIdx !== null && (
          <>
            <div className={`bh-turn p${playerIdx + 1}`}>Player {playerIdx + 1}'s Turn</div>
            <div className="bh-unit">{turnTd.name}</div>
          </>
        )}
      </div>

      <div className="battle-body">
        <div className="battle-board-area">
          <Board />
          {isHumanTurn && (
            <div className="action-bar">
              <button className="btn btn-sm" onClick={handleMove}>
                Move
              </button>
              {skillButtons.map((sb) => (
                <button
                  key={sb.id}
                  className={`btn btn-sm ${sb.canUse ? "" : "disabled"}`}
                  disabled={!sb.canUse}
                  onClick={() => handleSkill(sb.id)}
                >
                  {sb.label} ({sb.cost} AP)
                </button>
              ))}
              <button className="btn btn-sm end-turn-btn" onClick={handleEndTurn}>
                End Turn
              </button>
            </div>
          )}
          {!isHumanTurn && (
            <button className="btn btn-sm end-turn-btn" onClick={handleEndTurn}>
              End Turn
            </button>
          )}
        </div>
        <UnitPanel />
      </div>

      <BattleLog />
    </div>
  );
}
