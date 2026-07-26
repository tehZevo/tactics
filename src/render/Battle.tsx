/// <reference types="react" />
import React from 'react';
import {
  state,
  endTurn,
  aiTakeTurn,
  subscribe,
  getIsVsAI,
} from "../state";
import { SidePanel, TurnIndicator, UnitDetail, BattleLog } from "./components/BattleComponents";
import { Board } from "./components/Board";
import { useState, useEffect, useRef } from "react";

let _isVsAI = getIsVsAI();

export function Battle() {
  const [version, setVersion] = useState(0);
  const isMobile = useIsMobile();

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

  return (
    <div className="screen active battle-screen">
      <div className="battle-top-row">
        <SidePanel playerIndex={0} />
        <SidePanel playerIndex={1} />
      </div>
      <div className="battle-center">
        <TurnIndicator />
        <Board />
        <button className="btn btn-sm end-turn-btn" onClick={handleEndTurn}>
          End Turn
        </button>
      </div>
      <div className="battle-bottom-row">
        <UnitDetail />
        <BattleLog />
      </div>
    </div>
  );
}

function useIsMobile() {
  const [mobile, setMobile] = useState(typeof window !== "undefined" && window.innerWidth <= 768);
  useEffect(() => {
    const handler = () => setMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return mobile;
}
