/// <reference types="react" />
import React from 'react';
import { state, placeUnit } from "../state";
import { UNIT_TYPE_DEFS } from "../data/index";
import { Board } from "./components/Board";

export function Deployment() {
  const queueEntry = state.deployQueue[state.deployIndex];
  const isP1 = queueEntry.player === 0;
  const currentTeam = isP1 ? state.p1Team : state.p2Team;
  const currentUnit = currentTeam.units[queueEntry.index];
  const unitName = currentUnit ? UNIT_TYPE_DEFS[currentUnit.typeId].name : "—";

  const placedEls: React.ReactElement[] = [];
  for (let i = 0; i < currentTeam.placed.length; i++) {
    const pu = currentTeam.placed[i];
    const td = UNIT_TYPE_DEFS[pu.typeId];
    placedEls.push(
      <div key={i} className="placed-unit">
        <span style={{ color: td.color }}>{td.icon}</span>{" "}
        {td.name} <span className="pos">({pu.row},{pu.col})</span>
      </div>
    );
  }

  return (
    <div className="screen active deployment-screen">
      <div className="deployment-topbar">
        <span className="phase-text">Deploy your units</span>
        <span className="turn-text">Placing: {unitName} (Player {queueEntry.player + 1})</span>
      </div>
      <div className="deployment-board-area">
        <div className="deployment-info">
          <h4>Placed Units</h4>
          {placedEls.length > 0 ? placedEls : <em style={{ color: "#4b5563" }}>None yet</em>}
          <div className="placed-unit">
            <strong>Remaining:</strong> {6 - currentTeam.placed.length}/6
          </div>
        </div>
        <Board />
      </div>
    </div>
  );
}
