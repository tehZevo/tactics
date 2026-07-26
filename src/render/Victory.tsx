/// <reference types="react" />
import React from 'react';
import { state, restartGame } from "../state";

export function Victory() {
  const winner = state.winner;
  const titleClass = winner === null ? "" : winner === 0 ? "p1" : winner === 1 ? "p2" : "";
  const titleText = winner === null || winner === -1 ? "Draw!" : `Player ${winner + 1} Wins!`;

  return (
    <div className="screen active victory-screen">
      <h1 className={`victory ${titleClass}`}>{titleText}</h1>
      <button className="btn btn-primary" onClick={() => restartGame()}>
        Play Again
      </button>
    </div>
  );
}
