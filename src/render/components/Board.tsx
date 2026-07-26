/// <reference types="react" />
import React from 'react';
import { useState, useEffect, useRef } from 'react';
import {
  state,
  getReachableTiles,
  getTurnUnit,
  isOwnUnit,
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

function useContainerWidth(ref: React.RefObject<HTMLDivElement | null>) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const update = () => {
      const rect = el.getBoundingClientRect();
      setWidth(rect.width);
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return width;
}

export function Board() {
  const map = currentMap();
  const tiles: React.ReactElement[] = [];
  const containerRef = useRef<HTMLDivElement>(null);
  const containerWidth = useContainerWidth(containerRef);

  const maxTileSize = Math.floor((containerWidth - 8) / BOARD_COLS);
  const tileSize = Math.min(Math.max(maxTileSize, 28), 52);
  const gap = Math.min(Math.max(tileSize * 0.02, 1), 2);
  const unitSize = Math.max(Math.floor(tileSize * 0.78), 22);
  const hpBarWidth = Math.max(Math.floor(unitSize * 0.8), 16);
  const apDotSize = Math.max(Math.floor(unitSize * 0.1), 3);
  const tuFontSize = Math.max(Math.floor(tileSize * 0.5), 9);
  const tuHpBarHeight = Math.max(Math.floor(unitSize * 0.08), 2);
  const tuHpBarGap = Math.max(Math.floor(unitSize * 0.04), 1);

  for (let r = 0; r < BOARD_ROWS; r++) {
    for (let c = 0; c < BOARD_COLS; c++) {
      const walkable = map.grid[r][c];
      const tileClasses: string[] = ["tile"];
      if (!walkable) tileClasses.push("unwalkable");

      // Deployment zone highlighting
      if (state.screen === "teamSelect") {
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
        if (action.type === "leap") {
          const turnUnit = getTurnUnit(state);
          if (turnUnit) {
            const reachable = getReachableTiles(state, turnUnit);
            if (reachable.has(`${r},${c}`) && state.board[r][c] === null) {
              tileClasses.push("leap-highlight");
            }
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

      // During team selection, hide opponent's units for PvP
      let unit = state.board[r][c];
      if (state.screen === "teamSelect" && unit && state.deployTurn === 1) {
        const unitPlayer = unit.row < 5 ? 0 : 1;
        if (unitPlayer !== state.deployTurn) {
          unit = null; // Hide P1's units when P2 is placing
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
            <div
              key={d}
              className={"tu-ap-dot" + (d < unit.ap ? " filled" : "")}
              style={{ width: `${apDotSize}px`, height: `${apDotSize}px` }}
            />
          );
        }

        unitDiv = (
          <div
            className={unitClasses.join(" ")}
            style={{
              background: td.color,
              width: `${unitSize}px`,
              height: `${unitSize}px`,
              fontSize: `${tuFontSize}px`,
            }}
          >
            <div className="tu-name">{td.icon}</div>
            {unit.invulnerable && <div className="tu-invulnerable">?</div>}
            <div
              className={hpBarClasses.join(" ")}
              style={{ width: `${hpBarWidth}px`, height: `${tuHpBarHeight}px` }}
            >
              <div
                className={hpFillClasses.join(" ")}
                style={{ width: `${hpPct}%` }}
              />
            </div>
            <div className="tu-ap-dots" style={{ gap: `${Math.max(tuHpBarGap, 1)}px` }}>{apDots}</div>
          </div>
        );
      }

      tiles.push(
        <div
          key={`${r}-${c}`}
          className={tileClasses.join(" ")}
          style={{ width: `${tileSize}px`, height: `${tileSize}px` }}
          onClick={() => placeUnit(r, c)}
        >
          {unitDiv}
        </div>
      );
    }
  }

  return (
    <div className="board-wrapper" ref={containerRef}>
      <div
        className="board"
        style={{
          gridTemplateColumns: `repeat(${BOARD_COLS}, ${tileSize}px)`,
          gridTemplateRows: `repeat(${BOARD_ROWS}, ${tileSize}px)`,
          gap: `${gap}px`,
        }}
      >
        {tiles}
      </div>
    </div>
  );
}
