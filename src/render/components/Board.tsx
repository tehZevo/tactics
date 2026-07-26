/// <reference types="react" />
import React from 'react';
import { useState, useEffect, useRef } from 'react';
import {
  state,
  getReachableTiles,
  getTurnUnit,
  isOwnUnit,
  placeUnit,
  executeMove,
  notifySubscribers,
  startTargeting,
  endTurn,
  aiTakeTurn,
  getIsVsAI,
  getPlayerIndex,
} from "../../state";
import {
  UNIT_TYPE_DEFS,
  BOARD_COLS,
  BOARD_ROWS,
  MAX_AP,
  SKILL_DEFS,
} from "../../data/index";
import { getUnitMaxHp, getEffectiveStats, getTargetsInRange, findUnitRef } from "../../state";
import type { PlacedUnit } from "../../state";

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

function useBoardMetrics(containerWidth: number) {
  const maxTileSize = Math.floor((containerWidth - 8) / BOARD_COLS);
  const tileSize = Math.min(Math.max(maxTileSize, 28), 52);
  const gap = Math.min(Math.max(tileSize * 0.02, 1), 2);
  const unitSize = Math.max(Math.floor(tileSize * 0.78), 22);
  const hpBarWidth = Math.max(Math.floor(unitSize * 0.8), 16);
  const apDotSize = Math.max(Math.floor(unitSize * 0.1), 3);
  const tuFontSize = Math.max(Math.floor(tileSize * 0.5), 9);
  const tuHpBarHeight = Math.max(Math.floor(unitSize * 0.08), 2);
  const tuHpBarGap = Math.max(Math.floor(unitSize * 0.04), 1);
  return { tileSize, gap, unitSize, hpBarWidth, apDotSize, tuFontSize, tuHpBarHeight, tuHpBarGap };
}

function TileUnit({
  unit,
  metrics,
}: {
  unit: PlacedUnit;
  metrics: { unitSize: number; hpBarWidth: number; apDotSize: number; tuFontSize: number; tuHpBarHeight: number; tuHpBarGap: number };
}) {
  const td = UNIT_TYPE_DEFS[unit.typeId];
  const classes: string[] = [
    "tile-unit",
    `p${getPlayerIndex(unit) + 1}`,
  ];
  if (unit.currentHp <= 0) classes.push("dead-unit");
  if (unit.invulnerable) classes.push("invulnerable");

  const turnUnit = getTurnUnit(state);
  if (turnUnit === unit) classes.push("active-unit");

  const maxHp = getUnitMaxHp(unit);
  const hpPct = (unit.currentHp / maxHp) * 100;

  const hpFillClasses: string[] = ["tu-hp-fill"];
  if (hpPct <= 25) hpFillClasses.push("low");
  else if (hpPct <= 50) hpFillClasses.push("mid");

  const { unitSize, hpBarWidth, apDotSize, tuFontSize, tuHpBarHeight, tuHpBarGap } = metrics;

  return (
    <div
      className={classes.join(" ")}
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
        className="tu-hp-bar"
        style={{ width: `${hpBarWidth}px`, height: `${tuHpBarHeight}px` }}
      >
        <div
          className={hpFillClasses.join(" ")}
          style={{ width: `${hpPct}%` }}
        />
      </div>
      <div className="tu-ap-dots" style={{ gap: `${Math.max(tuHpBarGap, 1)}px` }}>
        {Array.from({ length: MAX_AP }, (_, d) => (
          <div
            key={d}
            className={"tu-ap-dot" + (d < unit.ap ? " filled" : "")}
            style={{ width: `${apDotSize}px`, height: `${apDotSize}px` }}
          />
        ))}
      </div>
    </div>
  );
}

export function Board() {
  const map = state.map;
  const containerRef = useRef<HTMLDivElement>(null);
  const containerWidth = useContainerWidth(containerRef);
  const metrics = useBoardMetrics(containerWidth);
  const tiles: React.ReactElement[] = [];

  const handleBattleTileClick = (r: number, c: number) => {
    const unit = state.board[r][c];
    const turnUnit = getTurnUnit(state);

    // If in target selection mode, delegate to placeUnit
    if (state.actionMode === "selectTarget") {
      placeUnit(r, c);
      return;
    }

    // If clicking on a highlighted reachable tile while a unit is selected, move there
    if (state.selectedUnit && turnUnit) {
      const selTeam = state.selectedUnit.playerIndex === 0 ? state.p1Team.placed : state.p2Team.placed;
      const selUnit = selTeam[state.selectedUnit.unitIndex];
      if (selUnit?.currentHp > 0 && isOwnUnit(turnUnit, selUnit)) {
        const reachable = getReachableTiles(state, selUnit);
        if (reachable.has(`${r},${c}`) && !state.board[r][c]) {
          executeMove(state, r, c);
          notifySubscribers();
          return;
        }
      }
    }

    // If clicking on the current turn unit, select it
    if (unit && turnUnit && unit.currentHp > 0 && isOwnUnit(turnUnit, unit)) {
      state.selectedUnit = findUnitRef(unit, state.p1Team.placed, state.p2Team.placed);
      notifySubscribers();
      return;
    }

    // If clicking on an enemy unit while it's your turn, show attack targets
    if (unit && turnUnit && unit.currentHp > 0 && !isOwnUnit(turnUnit, unit)) {
      state.selectedUnit = findUnitRef(unit, state.p1Team.placed, state.p2Team.placed);
      notifySubscribers();
      return;
    }

    // Clicked empty tile or dead unit - deselect
    state.selectedUnit = null;
    state.actionMode = "idle";
    state.selectedAction = null;
    notifySubscribers();
  };

  for (let r = 0; r < BOARD_ROWS; r++) {
    for (let c = 0; c < BOARD_COLS; c++) {
      const walkable = map.grid[r][c];
      const tileClasses: string[] = ["tile"];
      if (!walkable) tileClasses.push("unwalkable");

      if (state.screen === "teamSelect") {
        if (state.deployTurn === 0 && c <= 2) tileClasses.push("deployment-zone");
        else if (state.deployTurn === 1 && c >= 9) tileClasses.push("deployment-zone");
        if (state.selectedDeployCell?.row === r && state.selectedDeployCell?.col === c) {
          tileClasses.push("selected");
        }
      } else {
        if (c <= 2) tileClasses.push("deployment-zone");
        if (c >= 9) tileClasses.push("deployment-zone");
      }

      if (state.screen === "battle") {
        if (state.selectedUnit) {
          const turnUnit = getTurnUnit(state);
          if (turnUnit) {
            const selTeam = state.selectedUnit.playerIndex === 0 ? state.p1Team.placed : state.p2Team.placed;
            const selUnit = selTeam[state.selectedUnit.unitIndex];
            if (selUnit?.currentHp > 0 && isOwnUnit(turnUnit, selUnit)) {
              const reachable = getReachableTiles(state, selUnit);
              if (reachable.has(`${r},${c}`) && !state.board[r][c]) tileClasses.push("move-highlight");
            }
          }
        }
        if (state.actionMode === "selectTarget" && state.selectedAction) {
          const a = state.selectedAction;
          if ((a.type === "attack" || a.type === "skill") && state.board[r][c] === a.target) {
            tileClasses.push(a.type === "attack" ? "attack-highlight" : "skill-highlight");
          }
          if (a.type === "leap") {
            const tu = getTurnUnit(state);
            if (tu) {
              const reachable = getReachableTiles(state, tu);
              if (reachable.has(`${r},${c}`) && !state.board[r][c]) tileClasses.push("leap-highlight");
            }
          }
          if (a.type === "aoeAttack") {
            const skill = SKILL_DEFS[a.skillId];
            if (skill?.aoe && Math.abs(r - a.center.row) + Math.abs(c - a.center.col) <= skill.aoe) {
              tileClasses.push("aoe-highlight");
            }
          }
        }
      }

      let unit = state.board[r][c];
      if (state.screen === "teamSelect" && unit && state.deployTurn === 1) {
        if (getPlayerIndex(unit) !== state.deployTurn) unit = null;
      }

      tiles.push(
        <div
          key={`${r}-${c}`}
          className={tileClasses.join(" ")}
          style={{ width: `${metrics.tileSize}px`, height: `${metrics.tileSize}px` }}
          onClick={() => {
        if (state.screen === "battle") {
          handleBattleTileClick(r, c);
        } else {
          placeUnit(r, c);
        }
      }}
        >
          {unit && <TileUnit unit={unit} metrics={metrics} />}
        </div>
      );
    }
  }

  return (
    <div className="board-wrapper" ref={containerRef}>
      <div
        className="board"
        style={{
          gridTemplateColumns: `repeat(${BOARD_COLS}, ${metrics.tileSize}px)`,
          gridTemplateRows: `repeat(${BOARD_ROWS}, ${metrics.tileSize}px)`,
          gap: `${metrics.gap}px`,
        }}
      >
        {tiles}
      </div>
    </div>
  );
}
