/// <reference types="react" />
import React from 'react';
import { state, startTeamSelect, startTestBattle } from "../state";

export function Menu() {
  return (
    <div className="screen active title-screen">
      <h1>TACTICS</h1>
      <p className="subtitle">Turn-based tile strategy</p>
      <div className="modes">
        <button className="btn btn-primary" onClick={() => startTeamSelect(false)}>
          2 Players (Local)
        </button>
        <button className="btn" onClick={() => startTeamSelect(true)}>
          vs Computer
        </button>
        <button className="btn" onClick={() => startTestBattle()}>
          Test Battle
        </button>
      </div>
    </div>
  );
}
