/// <reference types="react" />
import React from 'react';
import {
  state,
  endTurn,
  aiTakeTurn,
  subscribe,
  getIsVsAI,
  getTurnUnit,
} from "../state";
import { TurnOrderStrip, UnitPanel, BattleLog } from "./components/BattleComponents";
import { Board } from "./components/Board";
import { useState, useEffect } from "react";
import { UNIT_TYPE_DEFS } from "../data/index";

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
    if (_isVsAI && state.screen === "battle") {
      setTimeout(() => {
        if (state.screen === "battle") {
          aiTakeTurn(state);
        }
      }, 300);
    }
  };

  const turnUnit = getTurnUnit(state);
  const playerIdx = turnUnit ? (turnUnit.row < 5 ? 0 : 1) : null;
  const turnTd = turnUnit ? UNIT_TYPE_DEFS[turnUnit.typeId] : null;

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
          <button className="btn btn-sm end-turn-btn" onClick={handleEndTurn}>
            End Turn
          </button>
        </div>
        <UnitPanel />
      </div>

      <BattleLog />
    </div>
  );
}
