/// <reference types="react" />
import React from 'react';
import { useState, useEffect } from 'react';
import { state, placeUnit, selectUnitType, selectPassiveId, confirmTeam, getIsVsAI, subscribe, addUnitToBoard, setPassive } from "../state";
import {
  UNIT_TYPE_DEFS,
  UNIT_TYPE_IDS,
  PASSIVE_DEFS,
  PASSIVE_IDS,
} from "../data/index";
import { Board } from "./components/Board";

function DeploymentRoster({
  selectedUnitType,
  placedTypeIds,
  onSelect,
}: {
  selectedUnitType: string | null;
  placedTypeIds: string[];
  onSelect: (typeId: string) => void;
}) {
  return (
    <div className="deployment-roster">
      {UNIT_TYPE_IDS.map((typeId) => {
        const def = UNIT_TYPE_DEFS[typeId];
        const isSelected = selectedUnitType === typeId;
        const isPlaced = placedTypeIds.includes(typeId);
        return (
          <div
            key={typeId}
            className={`deployment-roster-item${isSelected ? " active" : ""}${isPlaced ? " disabled" : ""}`}
            onClick={() => !isPlaced && onSelect(typeId)}
          >
            <div className="deployment-roster-icon" style={{ background: def.color }}>
              {def.icon}
            </div>
            <div className="deployment-roster-name">{def.name}</div>
          </div>
        );
      })}
    </div>
  );
}

function PassivePicker({
  selectedUnitType,
  selectedPassiveId,
  onSelect,
}: {
  selectedUnitType: string;
  selectedPassiveId: string | null;
  onSelect: (passiveId: string) => void;
}) {
  const recommended = PASSIVE_IDS.filter(p =>
    PASSIVE_DEFS[p].recommended && PASSIVE_DEFS[p].recommended.includes(selectedUnitType)
  );
  return (
    <div className="passive-slots">
      {PASSIVE_IDS.map((pid) => {
        const passiveDef = PASSIVE_DEFS[pid];
        const isRecommended = recommended.includes(pid);
        const isSelected = selectedPassiveId === pid;
        return (
          <div key={pid} className={`passive-grid-btn${isSelected ? " selected" : ""}${isRecommended ? " recommended" : ""}`}>
            <button onClick={() => onSelect(pid)}>
              {passiveDef.name}
            </button>
          </div>
        );
      })}
    </div>
  );
}

export function Deployment() {
  const [, setVersion] = useState(0);

  useEffect(() => {
    return subscribe(() => {
      setVersion(v => v + 1);
    });
  }, []);

  const deployTurn = state.deployTurn;
  const currentTeam = deployTurn === 0 ? state.p1Team : state.p2Team;
  const isVsAI = getIsVsAI();

  const handlePlaceUnit = (row: number, col: number) => {
    
    // If clicking on a placed unit, remove it
    const unit = state.board[row][col];
    if (unit) {
      const unitPlayer = unit.row < 5 ? 0 : 1;
      if (unitPlayer === deployTurn) {
        // Find and remove from placed array
        const index = currentTeam.placed.indexOf(unit);
        if (index >= 0) {
          currentTeam.placed.splice(index, 1);
          state.board[row][col] = null;
          setVersion(v => v + 1);
        }
      }
      return;
    }

    // Place unit at this location
    if (!state.selectedUnitType) return;
    if (currentTeam.placed.length >= 6) return;

    const typeId = state.selectedUnitType;
    const passiveId = state.selectedPassiveId || "";
    
    const placedUnit = {
      typeId,
      passiveId,
      row,
      col,
      currentHp: UNIT_TYPE_DEFS[typeId].hp,
      ap: 0,
      movement: UNIT_TYPE_DEFS[typeId].movement,
      initiative: UNIT_TYPE_DEFS[typeId].initiative,
      poisonTurns: 0,
      skillUsedThisTurn: false,
      invulnerable: false,
    };

    currentTeam.placed.push(placedUnit);
    state.board[row][col] = placedUnit;
    setVersion(v => v + 1);
  };

  const handleSelectUnit = (typeId: string) => {
    selectUnitType(typeId);
  };

  const handleSelectPassive = (passiveId: string) => {
    selectPassiveId(passiveId);
  };

  const handleConfirm = () => {
    if (currentTeam.placed.length >= 6) {
      if (isVsAI && deployTurn === 0) {
        // AI mode: both teams ready, start battle
        confirmTeam();
      } else if (deployTurn === 0) {
        // P1 done, P2 deploys
        state.deployTurn = 1;
        setVersion(v => v + 1);
      } else {
        // Both done, start battle
        confirmTeam();
      }
    }
  };

  return (
    <div className="screen active deployment-screen">
      <div className="deployment-topbar">
        <span className="phase-text">Deploy your units</span>
        <span className="turn-text">
          Player {deployTurn + 1} — Select a unit, choose a passive, then click a tile in your zone to place it.
        </span>
      </div>
      <div className="deployment-board-area">
        <div className="deployment-info">
          <h4>Choose Unit</h4>
          <DeploymentRoster
            selectedUnitType={state.selectedUnitType}
            placedTypeIds={currentTeam.placed.map(p => p.typeId)}
            onSelect={handleSelectUnit}
          />

          {state.selectedUnitType && (
            <>
              <h4>Choose Passive</h4>
              <PassivePicker
                selectedUnitType={state.selectedUnitType}
                selectedPassiveId={state.selectedPassiveId}
                onSelect={handleSelectPassive}
              />
            </>
          )}

          <div className="placed-unit">
            <strong>Placed:</strong> {currentTeam.placed.length}/6
          </div>
          
          <button 
            className="btn btn-primary" 
            onClick={handleConfirm}
            disabled={currentTeam.placed.length < 6}
          >
            {isVsAI && deployTurn === 0 ? "Confirm & Start" : "Confirm & Next"}
          </button>
        </div>
        <Board />
      </div>
    </div>
  );
}
