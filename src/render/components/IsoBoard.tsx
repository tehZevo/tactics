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

function rotateCoords(r: number, c: number, rotation: number, rows: number, cols: number): [number, number] {
  switch (rotation) {
    case 90: return [c, rows - 1 - r];
    case 180: return [rows - 1 - r, cols - 1 - c];
    case 270: return [cols - 1 - c, r];
    default: return [r, c];
  }
}

function TileUnit({
  unit,
  metrics,
  onPreviewUnit,
}: {
  unit: PlacedUnit;
  metrics: { unitSize: number; hpBarWidth: number; apDotSize: number; tuFontSize: number; tuHpBarHeight: number; tuHpBarGap: number };
  onPreviewUnit?: (unit: PlacedUnit | null) => void;
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
      onClick={(e) => {
        e.stopPropagation();
        onPreviewUnit?.(unit);
      }}
    >
      <div className="tu-shadow" />
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

export function IsoBoard({ onPreviewUnit }: { onPreviewUnit?: (unit: PlacedUnit | null) => void } = {}) {
  const map = state.map;
  const wrapperRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState(0);

  const camRef = useRef({
    offsetX: 0, offsetY: 0,
    targetOffsetX: 0, targetOffsetY: 0,
    scale: 1, targetScale: 1,
    initialized: false,
  });

  const centerCamera = () => {
    const c = camRef.current;
    const w = wrapperRef.current;
    if (!w) return;
    const rect = w.getBoundingClientRect();
    const tileWidth = BASE_TILE_WIDTH;
    const tileHeight = BASE_TILE_HEIGHT;
    const totalWidth = (BOARD_COLS + BOARD_ROWS) * tileWidth / 2 + tileWidth;
    const totalHeight = (BOARD_COLS + BOARD_ROWS) * tileHeight / 2 + tileHeight;
    c.targetOffsetX = (rect.width - totalWidth) / 2;
    c.targetOffsetY = (rect.height - totalHeight) / 2;
  };
  const dragRef = useRef<{ startX: number; startY: number; startOffX: number; startOffY: number } | null>(null);
  const touchDragRef = useRef<{ 
    startX: number; startY: number; 
    startOffX: number; startOffY: number; 
    isPanning: boolean;
    pinchStartDistance?: number;
    pinchStartScale?: number;
    pinchMidX?: number;
    pinchMidY?: number;
    prevTouchX?: number;
    prevTouchY?: number;
    prevTimestamp?: number;
    velocityX?: number;
    velocityY?: number;
  } | null>(null);
  const inertiaRef = useRef<{ vx: number; vy: number; active: boolean }>({ vx: 0, vy: 0, active: false });
  const wasDraggingRef = useRef(false);

  const cam = camRef.current;

  useEffect(() => {
    _setCenterCameraRef(centerCamera);
  }, []);

  const tileWidth = BASE_TILE_WIDTH;
  const tileHeight = BASE_TILE_HEIGHT;
  const unitSize = Math.max(Math.floor(tileWidth * 0.5), 18);
  const hpBarWidth = Math.max(Math.floor(unitSize * 0.8), 14);
  const apDotSize = Math.max(Math.floor(unitSize * 0.1), 3);
  const tuFontSize = Math.max(Math.floor(unitSize * 0.45), 8);
  const tuHpBarHeight = Math.max(Math.floor(unitSize * 0.08), 2);
  const tuHpBarGap = Math.max(Math.floor(unitSize * 0.04), 1);
  const metrics = { unitSize, hpBarWidth, apDotSize, tuFontSize, tuHpBarHeight, tuHpBarGap };

  const totalWidth = (BOARD_COLS + BOARD_ROWS) * tileWidth / 2 + tileWidth;
  const totalHeight = (BOARD_COLS + BOARD_ROWS) * tileHeight / 2 + tileHeight;

  useEffect(() => {
    if (cam.initialized) return;
    const el = wrapperRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    cam.offsetX = cam.targetOffsetX = (rect.width - totalWidth) / 2;
    cam.offsetY = cam.targetOffsetY = (rect.height - totalHeight) / 2;
    cam.initialized = true;
  }, []);

  useEffect(() => {
    let raf: number;
    const loop = () => {
      const c = camRef.current;
      const inertia = inertiaRef.current;

      // Handle inertia (fling)
      if (inertia.active) {
        c.targetOffsetX += inertia.vx;
        c.targetOffsetY += inertia.vy;
        inertia.vx *= 0.92;
        inertia.vy *= 0.92;
        const speed = Math.sqrt(inertia.vx * inertia.vx + inertia.vy * inertia.vy);
        if (speed < 0.5) {
          inertia.active = false;
          inertia.vx = 0;
          inertia.vy = 0;
        }
      }

      const ds = c.targetScale - c.scale;
      const dx = c.targetOffsetX - c.offsetX;
      const dy = c.targetOffsetY - c.offsetY;
      const needsUpdate = Math.abs(ds) > 0.0005 || Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1 || inertia.active;
      if (needsUpdate) {
        c.scale += ds * 0.2;
        c.offsetX += dx * 0.2;
        c.offsetY += dy * 0.2;
      } else {
        c.scale = c.targetScale;
        c.offsetX = c.targetOffsetX;
        c.offsetY = c.targetOffsetY;
      }
      const board = boardRef.current;
      if (board) {
        board.style.transform = `translate(${c.offsetX}px, ${c.offsetY}px) scale(${c.scale})`;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const el = wrapperRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const cursorX = e.clientX - rect.left;
    const cursorY = e.clientY - rect.top;

    const c = camRef.current;
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const newScale = Math.min(Math.max(c.targetScale + delta, 0.4), 3);
    const ratio = newScale / c.targetScale;
    c.targetOffsetX = cursorX - (cursorX - c.targetOffsetX) * ratio;
    c.targetOffsetY = cursorY - (cursorY - c.targetOffsetY) * ratio;
    c.targetScale = newScale;
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
    dragRef.current = { startX: e.clientX, startY: e.clientY, startOffX: camRef.current.targetOffsetX, startOffY: camRef.current.targetOffsetY };
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    const c = camRef.current;
    c.targetOffsetX = dragRef.current.startOffX + dx;
    c.targetOffsetY = dragRef.current.startOffY + dy;
    c.offsetX = c.targetOffsetX;
    c.offsetY = c.targetOffsetY;
  }, []);

  const handleMouseUp = useCallback(() => {
    dragRef.current = null;
  }, []);

  const getTouchDistance = (touches: React.TouchList) => {
    if (touches.length < 2) return 0;
    const dx = touches[1].clientX - touches[0].clientX;
    const dy = touches[1].clientY - touches[0].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const getTouchMidpoint = (touches: React.TouchList) => {
    if (touches.length < 2) return { x: 0, y: 0 };
    return {
      x: (touches[0].clientX + touches[1].clientX) / 2,
      y: (touches[0].clientY + touches[1].clientY) / 2,
    };
  };

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const el = wrapperRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const now = Date.now();

    // Cancel any active inertia
    inertiaRef.current.active = false;

    const c = camRef.current;
    const mid = getTouchMidpoint(e.touches);

    touchDragRef.current = {
      startX: mid.x,
      startY: mid.y,
      startOffX: c.targetOffsetX,
      startOffY: c.targetOffsetY,
      isPanning: false,
      pinchStartDistance: e.touches.length >= 2 ? getTouchDistance(e.touches) : undefined,
      pinchStartScale: e.touches.length >= 2 ? c.targetScale : undefined,
      pinchMidX: mid.x - rect.left,
      pinchMidY: mid.y - rect.top,
      prevTouchX: mid.x,
      prevTouchY: mid.y,
      prevTimestamp: now,
    };

    if (e.touches.length === 1) {
      const touch = e.touches[0];
      touchDragRef.current = {
        ...touchDragRef.current,
        startX: touch.clientX,
        startY: touch.clientY,
        prevTouchX: touch.clientX,
        prevTouchY: touch.clientY,
      };
    } else if (e.touches.length >= 2) {
      e.preventDefault();
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const el = wrapperRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const now = Date.now();
    const drag = touchDragRef.current;
    if (!drag) return;

    const touches = e.touches;
    const touch = touches[0];

    // Track velocity from first finger
    if (drag.prevTimestamp && now - drag.prevTimestamp > 0) {
      const dt = now - drag.prevTimestamp;
      const vx = (touch.clientX - (drag.prevTouchX ?? touch.clientX)) / dt * 16;
      const vy = (touch.clientY - (drag.prevTouchY ?? touch.clientY)) / dt * 16;
      drag.prevTouchX = touch.clientX;
      drag.prevTouchY = touch.clientY;
      drag.prevTimestamp = now;
      drag.velocityX = vx;
      drag.velocityY = vy;
    }

    const c = camRef.current;

    if (touches.length >= 2) {
      const dist = getTouchDistance(touches);
      const newMid = getTouchMidpoint(touches);
      const pinchRef = drag;
      const scaleRatio = dist / (pinchRef.pinchStartDistance ?? 1);
      const newScale = Math.min(Math.max((pinchRef.pinchStartScale ?? 1) * scaleRatio, 0.4), 3);
      const ratio = newScale / c.targetScale;
      const midX = newMid.x - rect.left;
      const midY = newMid.y - rect.top;

      // Zoom towards midpoint
      c.targetOffsetX = midX - (midX - c.targetOffsetX) * ratio;
      c.targetOffsetY = midY - (midY - c.targetOffsetY) * ratio;
      c.targetScale = newScale;

      // Pan with midpoint movement (after zoom math)
      const mid = getTouchMidpoint(touches);
      const dx = newMid.x - mid.x;
      const dy = newMid.y - mid.y;
      c.targetOffsetX += dx;
      c.targetOffsetY += dy;

      c.offsetX = c.targetOffsetX;
      c.offsetY = c.targetOffsetY;
      c.scale = c.targetScale;
      e.preventDefault();
      return;
    }

    // Single finger pan
    const dx = touch.clientX - drag.startX;
    const dy = touch.clientY - drag.startY;
    const threshold = 5;
    if (!drag.isPanning && Math.abs(dx) + Math.abs(dy) < threshold) return;
    drag.isPanning = true;
    wasDraggingRef.current = true;
    e.preventDefault();
    const tx = drag.startOffX + dx;
    const ty = drag.startOffY + dy;
    c.targetOffsetX = tx;
    c.targetOffsetY = ty;
    c.offsetX = tx;
    c.offsetY = ty;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const drag = touchDragRef.current;
    if (drag) {
      // Apply inertia if we have recent velocity
      const vx = drag.velocityX ?? 0;
      const vy = drag.velocityY ?? 0;
      const speed = Math.sqrt(vx * vx + vy * vy);
      if (speed > 2) {
        inertiaRef.current.active = true;
        inertiaRef.current.vx = vx * 0.8;
        inertiaRef.current.vy = vy * 0.8;
      }
    }
    touchDragRef.current = null;
    wasDraggingRef.current = false;
  }, []);

  const handleWrapperTouchEnd = useCallback(() => {
    if (wasDraggingRef.current) {
      wasDraggingRef.current = false;
    }
  }, []);

  const handleWrapperClick = useCallback((e: React.MouseEvent) => {
    // handled in tile onClick
  }, []);

  const handleBattleTileClick = (r: number, c: number) => {
    const unit = state.board[r][c];
    const walkable = state.map.grid[r]?.[c] ?? false;
    const turnUnit = getTurnUnit(state);

    if (state.actionMode === "selectTarget") {
      if (state.selectedAction?.type === "reposition") {
        const action = state.selectedAction;
        const unit = state.board[r][c];

        // Phase 1: Select ally to reposition
        if (!action.target) {
          if (unit && isOwnUnit(turnUnit!, unit)) {
            const dist = Math.abs(turnUnit!.row - unit.row) + Math.abs(turnUnit!.col - unit.col);
            if (dist <= 2) {
              action.target = unit;
              notifySubscribers();
            }
          }
          return;
        }

        // Phase 2: Select destination
        const walkable = state.map.grid[r]?.[c] ?? false;
        if (walkable && !state.board[r][c]) {
          const dist = Math.abs(turnUnit!.row - r) + Math.abs(turnUnit!.col - c);
          if (dist <= 2) {
            executeReposition(state, turnUnit!, null, action.skillId, { row: r, col: c });
            notifySubscribers();
          }
        }
        return;
      }
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
    rune: { row: number; col: number; turns: number; type?: string; playerIndex?: 0 | 1 } | null;
  }

  const tileDataList: TileData[] = [];

  for (let r = 0; r < BOARD_ROWS; r++) {
    for (let c = 0; c < BOARD_COLS; c++) {
      const walkable = map.grid[r][c];
      const tileClasses: string[] = ["iso-tile"];
      if (!walkable) tileClasses.push("unwalkable");

      if (state.screen === "teamSelect") {
        if (walkable) {
          // P1 (deployTurn 0) deploys at bottom; P2 (deployTurn 1) at top
          if (state.deployTurn === 0 && r >= 10 && c >= 3 && c <= 8) tileClasses.push("deployment-zone");
          else if (state.deployTurn === 1 && r <= 1 && c >= 3 && c <= 8) tileClasses.push("deployment-zone");
        }
        if (state.selectedDeployCell?.row === r && state.selectedDeployCell?.col === c) {
          tileClasses.push("selected");
        }
      } else {
        if (walkable && ((r >= 10 && c >= 3 && c <= 8) || (r <= 1 && c >= 3 && c <= 8))) tileClasses.push("deployment-zone");
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
              // Show tentative move position
              if (selUnit.tentativeRow === r && selUnit.tentativeCol === c) {
                tileClasses.push("tentative-move");
              }
            }
          }
        }
        if (state.actionMode === "selectTarget" && state.selectedAction) {
          const a = state.selectedAction;
          if (a.type === "runePlacement") {
            const tu = getTurnUnit(state);
            if (tu) {
              const skill = SKILL_DEFS[a.skillId];
              if (skill && walkable && !state.board[r][c] && Math.abs(r - tu.row) + Math.abs(c - tu.col) <= skill.range) {
                tileClasses.push("rune-placement");
                if (state.pendingRuneLocation?.row === r && state.pendingRuneLocation?.col === c) {
                  tileClasses.push("selected");
                }
              }
            }
          } else if (a.type === "attack" || a.type === "skill") {
            const tu = getTurnUnit(state);
            if (tu) {
              const skill = SKILL_DEFS[a.skillId];
              if (skill) {
                if (skill.runeTurns) {
                  if (walkable && !state.board[r][c] && Math.abs(r - tu.row) + Math.abs(c - tu.col) <= skill.range) {
                    tileClasses.push("rune-placement");
                  }
                } else {
                  const targets = getTargetsInRange(tu, skill.range, a.skillId, state);
                  if (targets.some(t => t.row === r && t.col === c)) {
                    tileClasses.push(a.type === "attack" ? "attack-highlight" : "skill-highlight");
                  }
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

      const tileRune = state.runeEffects.find(rune => rune.row === r && rune.col === c);
      if (tileRune) {
        tileClasses.push(`rune-${tileRune.type}`);
      }

      tileDataList.push({ r, c, classes: tileClasses, unit, rune: tileRune || null });
    }
  }

  tileDataList.sort((a, b) => (a.r + a.c) - (b.r + b.c));

  const tiles: React.ReactElement[] = [];
  for (const tile of tileDataList) {
    const [vr, vc] = rotateCoords(tile.r, tile.c, rotation, BOARD_ROWS, BOARD_COLS);
    const pos = isoCoords(vr, vc, tileWidth, tileHeight);

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
        onClick={(e) => {
          if (wasDraggingRef.current) {
            e.stopPropagation();
            wasDraggingRef.current = false;
            return;
          }
          if (state.screen === "battle") {
            handleBattleTileClick(tile.r, tile.c);
          } else {
            placeUnit(tile.r, tile.c);
          }
        }}
      >
        {tile.rune && (
          <div className={`iso-rune iso-rune-${tile.rune.type || "flame"} iso-rune-p${tile.rune.playerIndex ?? 0}`}>
            <div className="iso-rune-glow" />
            <div className="iso-rune-symbol">
              {tile.rune.type === "flame" && "🔥"}
              {tile.rune.type === "wind" && "💨"}
              {tile.rune.type === "earth" && "🪨"}
              {tile.rune.type === "darkness" && "🌑"}
              {!tile.rune.type && "✦"}
            </div>
            <div className="iso-rune-turns">{tile.rune.turns}</div>
          </div>
        )}
        {tile.unit && (
          <div className="iso-unit-container">
            <TileUnit unit={tile.unit} metrics={metrics} onPreviewUnit={onPreviewUnit} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className="iso-board-wrapper"
      ref={wrapperRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onContextMenu={(e) => e.preventDefault()}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={handleWrapperClick}
    >
      <button
        className="iso-rotate-btn"
        onClick={() => setRotation(r => (r + 90) % 360)}
        title="Rotate camera"
      >
        ↻
      </button>
      <div
        ref={boardRef}
        className="iso-board"
        style={{
          position: 'absolute',
          width: `${totalWidth}px`,
          height: `${totalHeight}px`,
          transformOrigin: '0 0',
        }}
      >
        {tiles}
      </div>
    </div>
  );
}

let _centerCameraRef: (() => void) | null = null;

export function centerBoardCamera() {
  _centerCameraRef?.();
}

export function _setCenterCameraRef(ref: () => void) {
  _centerCameraRef = ref;
}
