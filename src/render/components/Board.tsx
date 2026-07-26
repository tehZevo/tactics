/// <reference types="react" />
import React from 'react';
import {
  state,
  getReachableTiles,
  getTurnUnit,
  isOwnUnit,
  selectTile,
  placeUnit,
  currentMap,
} from "../../state";
import {
  UNIT_TYPE_DEFS,
  BOARD_COLS,
  BOARD_ROWS,
  MAX_AP,
  SKILL_DEFS,
} from "../../data/index";
import { getUnitMaxHp } from "../../state";

export function Board() {
  const map = currentMap();
  const tiles: React.ReactElement[] = [];

  for (let r = 0; r < BOARD_ROWS; r++) {
    for (let c = 0; c < BOARD_COLS; c++) {
      const walkable = map.grid[r][c];
      const tileClasses: string[] = ["tile"];
      if (!walkable) tileClasses.push("unwalkable");

      // Deployment zone highlighting
      if (state.screen === "deploy" || state.screen === "teamSelect") {
        if (state.deployTurn === 0 && c <= 2) {
          tileClasses.push("deployment-zone");
        } else if (state.deployTurn === 1 && c >= 7) {
          tileClasses.push("deployment-zone");
        }
        // Highlight selected cell
        if (state.selectedDeployCell && state.selectedDeployCell.row === r && state.selectedDeployCell.col === c) {
          tileClasses.push("selected");
        }
      } else {
        if (c <= 2) tileClasses.push("deployment-zone");
        if (c >= 7) tileClasses.push("deployment-zone");
      }

      // Battle phase highlights
      if (state.screen === "battle" && state.selectedUnit) {
        const turnUnit = getTurnUnit(state);
        if (turnUnit) {
          const selectedTeam = state.selectedUnit!.playerIndex === 0
            ? state.p1Team.placed
            : state.p2Team.placed;
          const selUnit = selectedTeam[state.selectedUnit!.unitIndex];
          if (selUnit && selUnit.currentHp > 0 && isOwnUnit(turnUnit, selUnit)) {
            const reachable = getReachableTiles(state, selUnit);
            if (reachable.has(`${r},${c}`) && state.board[r][c] === null) {
              tileClasses.push("move-highlight");
            }
          }
        }
      }

      if (state.screen === "battle" && state.actionMode === "selectTarget" && state.selectedAction) {
        const action = state.selectedAction;
        if (action.type === "attack" || action.type === "skill") {
          const target = state.board[r][c];
          if (target === action.target) {
            tileClasses.push(action.type === "attack" ? "attack-highlight" : "skill-highlight");
          }
        }
        if (action.type === "aoeAttack") {
          const skill = SKILL_DEFS[action.skillId];
          if (skill && skill.aoe) {
            const radius = skill.aoe;
            const center = action.center;
            if (Math.abs(r - center.row) + Math.abs(c - center.col) <= radius) {
              tileClasses.push("aoe-highlight");
            }
          }
        }
      }

      // During deployment, only show current player's units
      let unit = state.board[r][c];
      if (state.screen === "deploy" && unit) {
        const unitPlayer = unit.row < 5 ? 0 : 1;
        if (unitPlayer !== state.deployTurn) {
          unit = null; // Hide opponent's units
        }
      }

      let unitDiv: React.ReactElement | null = null;

      if (unit) {
        const td = UNIT_TYPE_DEFS[unit.typeId];
        const unitClasses: string[] = [
          "tile-unit",
          `p${unit.row < 5 ? 1 : 2}`,
        ];
        if (unit.currentHp <= 0) unitClasses.push("dead-unit");
        if (unit.invulnerable) unitClasses.push("invulnerable");

        const turnUnit = getTurnUnit(state);
        if (turnUnit === unit) unitClasses.push("active-unit");

        const maxHp = getUnitMaxHp(unit);
        const hpPct = (unit.currentHp / maxHp) * 100;

        const hpBarClasses: string[] = ["tu-hp-bar"];
        const hpFillClasses: string[] = ["tu-hp-fill"];
        if (hpPct <= 25) hpFillClasses.push("low");
        else if (hpPct <= 50) hpFillClasses.push("mid");

        const apDots: React.ReactElement[] = [];
        for (let d = 0; d < MAX_AP; d++) {
          apDots.push(
            <div className={"tu-ap-dot" + (d < unit.ap ? " filled" : "")} />
          );
        }

        unitDiv = (
          <div
            className={unitClasses.join(" ")}
            style={{ background: td.color }}
          >
            <div className="tu-name">{td.icon}</div>
            {unit.invulnerable && <div className="tu-invulnerable">?</div>}
            <div className="tu-hp-bar">
              <div className={hpFillClasses.join(" ")} style={{ width: `${hpPct}%` }} />
            </div>
            <div className="tu-ap-dots">{apDots}</div>
          </div>
        );
      }

      tiles.push(
        <div
          key={`${r}-${c}`}
          className={tileClasses.join(" ")}
          onClick={() => {
            if (state.screen === "deploy" || state.screen === "teamSelect") {
              placeUnit(r, c);
            } else {
              selectTile(r, c);
            }
          }}
        >
          {unitDiv}
        </div>
      );
    }
  }

  return (
    <div className="board-wrapper">
      <div className="board" style={{ gridTemplateColumns: `repeat(${BOARD_COLS}, 52px)`, gridTemplateRows: `repeat(${BOARD_ROWS}, 52px)` }}>
        {tiles}
      </div>
    </div>
  );
}
