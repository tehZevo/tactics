/// <reference types="react" />
import React from 'react';
import {
  state,
  endTurn,
  aiTakeTurn,
  subscribe,
  getIsVsAI,
  getTurnUnit,
  getEffectiveStats,
  startTargeting,
  notifySubscribers,
  getPlayerIndex,
  forfeit,
  findUnitRef,
  applyAction,
} from "../state";
import { useSkill } from "../state/actions/index.js";
import { TurnOrderStrip, UnitPanel, BattleLog } from "./components/BattleComponents";
import { IsoBoard, centerBoardCamera } from "./components/IsoBoard";
import { useState, useEffect } from "react";
import { UNIT_TYPE_DEFS, SKILL_DEFS } from "../data/index";
import type { PlacedUnit } from "../state";

let _isVsAI = getIsVsAI();

export function Battle() {
  const [version, setVersion] = useState(0);
  const [showForfeitConfirm, setShowForfeitConfirm] = useState(false);
  const [showBattleLog, setShowBattleLog] = useState(false);
  const [previewUnit, setPreviewUnit] = useState<PlacedUnit | null>(null);

  useEffect(() => {
    return subscribe(() => {
      setVersion(v => v + 1);
    });
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      centerBoardCamera();
    }, 100);
    return () => clearTimeout(timeout);
  }, []);

  const handleEndTurn = () => {
    endTurn();
  };

  const handleSelectUnit = (unit: PlacedUnit | null) => {
    setPreviewUnit(unit);
  };

  const turnUnit = getTurnUnit(state);
  const playerIdx = turnUnit ? getPlayerIndex(turnUnit) : null;
  const turnTd = turnUnit ? UNIT_TYPE_DEFS[turnUnit.typeId] : null;

  // Determine if it's the human player's turn
  const isHumanTurn = turnUnit && (
    (_isVsAI && getPlayerIndex(turnUnit) === 0) || !_isVsAI
  );

  // Build skill buttons for the current turn unit
  const skillButtons: { id: string; label: string; cost: number; canUse: boolean }[] = [];
  if (turnUnit && turnTd) {
    const eff = getEffectiveStats(turnUnit);
    for (const sid of turnTd.skills) {
      const skill = SKILL_DEFS[sid];
      if (!skill) continue;
      const canUse = turnUnit.ap >= skill.cost && !turnUnit.skillUsedThisTurn;
      skillButtons.push({
        id: sid,
        label: skill.name,
        cost: skill.cost,
        canUse,
      });
    }
  }

  const handleSkill = (skillId: string) => {
    const turnUnit = getTurnUnit(state);
    if (!turnUnit) return;
    const skill = SKILL_DEFS[skillId];
    if (!skill || turnUnit.ap < skill.cost || turnUnit.skillUsedThisTurn) return;
    startTargeting(turnUnit, skillId);
  };

  return (
    <div className="screen active battle-screen">
      <div className="battle-board-fullscreen">
        <IsoBoard onPreviewUnit={handleSelectUnit} />
      </div>

      <TurnOrderStrip />

      <div className="battle-header">
        {turnUnit && turnTd && playerIdx !== null && (
          <>
            <div className={`bh-turn p${playerIdx + 1}`}>Player {playerIdx + 1}'s Turn</div>
            <div className="bh-unit">{turnTd.name}</div>
          </>
        )}
      </div>

      {previewUnit && (
        <UnitPanel
          unit={previewUnit}
          onClose={() => setPreviewUnit(null)}
        />
      )}

      {isHumanTurn && (
        <div className="action-bar">
          {state.actionMode === "selectTarget" && state.pendingRuneLocation ? (
            <>
              <div className="action-bar-prompt">
                Place{" "}
                {state.selectedAction && state.selectedAction.type === "runePlacement"
                  ? SKILL_DEFS[state.selectedAction.skillId]?.name ?? state.selectedAction.skillId
                  : ""}{" "}
                at ({state.pendingRuneLocation.row}, {state.pendingRuneLocation.col})
              </div>
              <button
                className="btn btn-sm"
                onClick={() => {
                  const action = state.selectedAction;
                  if (action && action.type === "runePlacement") {
                    const turnUnit = getTurnUnit(state);
                    if (turnUnit && state.pendingRuneLocation) {
                      const casterRef = findUnitRef(turnUnit, state.p1Team.placed, state.p2Team.placed) as { playerIndex: 0 | 1; unitIndex: number };
                      const newState = applyAction(state, useSkill(casterRef, null, action.skillId, state.pendingRuneLocation));
                      state.actionMode = "idle";
                      state.selectedAction = null;
                      state.pendingRuneLocation = null;
                      notifySubscribers();
                    }
                  }
                }}
              >
                Confirm
              </button>
              <button
                className="btn btn-sm"
                onClick={() => {
                  state.actionMode = "idle";
                  state.selectedAction = null;
                  state.pendingRuneLocation = null;
                  notifySubscribers();
                }}
              >
                Cancel
              </button>
            </>
          ) : state.actionMode === "selectTarget" ? (
            <>
              <div className="action-bar-prompt">Select a target</div>
              <button
                className="btn btn-sm"
                onClick={() => {
                  state.actionMode = "idle";
                  state.selectedAction = null;
                  state.pendingRuneLocation = null;
                  notifySubscribers();
                }}
              >
                Cancel
              </button>
            </>
          ) : (
            skillButtons.map((sb) => (
              <button
                key={sb.id}
                className={`btn btn-sm ${sb.canUse ? "" : "disabled"}`}
                disabled={!sb.canUse}
                onClick={() => handleSkill(sb.id)}
              >
                {sb.label} ({sb.cost} AP)
              </button>
            ))
          )}
          {state.actionMode !== "selectTarget" && (
            <>
              <button className="btn btn-sm end-turn-btn" onClick={handleEndTurn}>
                End Turn
              </button>
              <button className="btn btn-sm" onClick={() => setShowBattleLog(true)}>
                Battle Log
              </button>
              <button className="btn btn-sm forfeit-btn" onClick={() => setShowForfeitConfirm(true)}>
                Forfeit
              </button>
            </>
          )}
        </div>
      )}


      {showForfeitConfirm && (
        <div className="modal-overlay" onClick={() => setShowForfeitConfirm(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">Forfeit Match?</div>
            <div className="modal-text">Are you sure you want to forfeit? You will lose this match.</div>
            <div className="modal-actions">
              <button className="btn btn-sm" onClick={() => setShowForfeitConfirm(false)}>Cancel</button>
              <button className="btn btn-sm btn-danger" onClick={forfeit}>Forfeit</button>
            </div>
          </div>
        </div>
      )}

      {showBattleLog && (
        <div className="modal-overlay battle-log-modal" onClick={() => setShowBattleLog(false)}>
          <div className="battle-log battle-log-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="bl-title">Battle Log</div>
            <div className="bl-entries">
              {[...state.log].reverse().map((entry, i) => (
                <div key={state.log.length - 1 - i} className={`log-entry ${entry.type}`}>{entry.text}</div>
              ))}
            </div>
            <button className="btn btn-sm" onClick={() => setShowBattleLog(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
