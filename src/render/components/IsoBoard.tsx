/// <reference types="react" />
import React from 'react';
import { useState, useEffect, useRef, useCallback } from 'react';
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

const BASE_TILE_WIDTH = 64;
const BASE_TILE_HEIGHT = 32;

function isoCoords(row: number, col: number, tileWidth: number, tileHeight: number) {
  const x = (col - row) * (tileWidth / 2);
  const y = (col + row) * (tileHeight / 2);
  return { x, y };
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
    "iso-tile-unit",
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

export function IsoBoard() {
  const map = state.map;
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const dragRef = useRef<{ startX: number; startY: number; startOffX: number; startOffY: number } | null>(null);

  const tileWidth = Math.round(BASE_TILE_WIDTH * scale);
  const tileHeight = Math.round(BASE_TILE_HEIGHT * scale);
  const unitSize = Math.max(Math.floor(tileWidth * 0.5), 18);
  const hpBarWidth = Math.max(Math.floor(unitSize * 0.8), 14);
  const apDotSize = Math.max(Math.floor(unitSize * 0.1), 3);
  const tuFontSize = Math.max(Math.floor(unitSize * 0.45), 8);
  const tuHpBarHeight = Math.max(Math.floor(unitSize * 0.08), 2);
  const tuHpBarGap = Math.max(Math.floor(unitSize * 0.04), 1);
  const metrics = { unitSize, hpBarWidth, apDotSize, tuFontSize, tuHpBarHeight, tuHpBarGap };

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setScale(s => Math.min(Math.max(s + delta, 0.4), 3));
  }, []);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && state.actionMode === "selectTarget") {
        state.actionMode = "idle";
        state.selectedAction = null;
        notifySubscribers();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) {
      if (e.button === 2 && state.actionMode === "selectTarget") {
        state.actionMode = "idle";
        state.selectedAction = null;
        notifySubscribers();
      }
      return;
    }
    dragRef.current = { startX: e.clientX, startY: e.clientY, startOffX: offset.x, startOffY: offset.y };
  }, [offset]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setOffset({ x: dragRef.current.startOffX + dx, y: dragRef.current.startOffY + dy });
  }, []);

  const handleMouseUp = useCallback(() => {
    dragRef.current = null;
  }, []);

  const handleBattleTileClick = (r: number, c: number) => {
    const unit = state.board[r][c];
    const turnUnit = getTurnUnit(state);

    if (state.actionMode === "selectTarget") {
      placeUnit(r, c);
      return;
    }

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

    if (unit && turnUnit && unit === turnUnit && unit.currentHp > 0) {
      state.selectedUnit = findUnitRef(unit, state.p1Team.placed, state.p2Team.placed);
      notifySubscribers();
      return;
    }

    if (unit && turnUnit && unit.currentHp > 0 && !isOwnUnit(turnUnit, unit)) {
      state.selectedUnit = findUnitRef(unit, state.p1Team.placed, state.p2Team.placed);
      notifySubscribers();
      return;
    }

    state.selectedUnit = null;
    state.actionMode = "idle";
    state.selectedAction = null;
    notifySubscribers();
  };

  interface TileData {
    r: number;
    c: number;
    classes: string[];
    unit: PlacedUnit | null;
  }

  const tileDataList: TileData[] = [];

  for (let r = 0; r < BOARD_ROWS; r++) {
    for (let c = 0; c < BOARD_COLS; c++) {
      const walkable = map.grid[r][c];
      const tileClasses: string[] = ["iso-tile"];
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
            if (selUnit === turnUnit && selUnit.currentHp > 0) {
              const reachable = getReachableTiles(state, selUnit);
              if (reachable.has(`${r},${c}`) && !state.board[r][c]) tileClasses.push("move-highlight");
            }
          }
        }
        if (state.actionMode === "selectTarget" && state.selectedAction) {
          const a = state.selectedAction;
          if (a.type === "attack" || a.type === "skill") {
            const tu = getTurnUnit(state);
            if (tu) {
              const skill = SKILL_DEFS[a.skillId];
              if (skill) {
                const targets = getTargetsInRange(tu, skill.range, a.skillId, state);
                if (targets.some(t => t.row === r && t.col === c)) {
                  tileClasses.push(a.type === "attack" ? "attack-highlight" : "skill-highlight");
                }
              }
            }
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

      tileDataList.push({ r, c, classes: tileClasses, unit });
    }
  }

  tileDataList.sort((a, b) => (a.r + a.c) - (b.r + b.c));

  const tiles: React.ReactElement[] = [];
  for (const tile of tileDataList) {
    const pos = isoCoords(tile.r, tile.c, tileWidth, tileHeight);

    tiles.push(
      <div
        key={`${tile.r}-${tile.c}`}
        className={tile.classes.join(" ")}
        style={{
          position: 'absolute',
          left: `${pos.x - tileWidth / 2}px`,
          top: `${pos.y}px`,
          width: `${tileWidth}px`,
          height: `${tileHeight}px`,
        }}
        onClick={() => {
          if (state.screen === "battle") {
            handleBattleTileClick(tile.r, tile.c);
          } else {
            placeUnit(tile.r, tile.c);
          }
        }}
      >
        {tile.unit && (
          <div className="iso-unit-container">
            <TileUnit unit={tile.unit} metrics={metrics} />
          </div>
        )}
      </div>
    );
  }

  const totalWidth = (BOARD_COLS + BOARD_ROWS) * tileWidth / 2 + tileWidth;
  const totalHeight = (BOARD_COLS + BOARD_ROWS) * tileHeight / 2 + tileHeight;

  return (
    <div
      className="iso-board-wrapper"
      ref={wrapperRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div
        className="iso-board"
        style={{
          position: 'absolute',
          width: `${totalWidth}px`,
          height: `${totalHeight}px`,
          transform: `translate(${offset.x}px, ${offset.y}px)`,
        }}
      >
        {tiles}
      </div>
    </div>
  );
}
