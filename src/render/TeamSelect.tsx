/// <reference types="react" />
import React from 'react';
import { useState, useEffect } from 'react';
import {
  state,
  selectDeployCell,
  addUnitToBoard,
  deletePlacedUnit,
  selectUnitType,
  selectPassiveId,
  confirmTeam,
  getIsVsAI,
} from "../state";
import { subscribe } from "../state";
import {
  UNIT_TYPE_DEFS,
  UNIT_TYPE_IDS,
  PASSIVE_DEFS,
  PASSIVE_IDS,
} from "../data/index";
import { SKILL_DEFS } from "../data/skills.js";
import { Board } from "./components/Board";

function applyPassive(typeDef: { hp: number; baseAtk: number; baseDef: number; movement: number; initiative: number }, passiveId: string) {
  if (!passiveId || !PASSIVE_DEFS[passiveId]) return null;
  return PASSIVE_DEFS[passiveId].apply({
    hp: typeDef.hp,
    attack: typeDef.baseAtk,
    defense: typeDef.baseDef,
    movement: typeDef.movement,
    initiative: typeDef.initiative,
  });
}

function StatRow({ label, base, bonus, final: fFinal }: { label: string; base: number; bonus: number; final: number }) {
  const bonusClass = bonus > 0 ? "positive" : bonus < 0 ? "negative" : "";
  return (
    <div className="stat-row">
      <span className="stat-label">{label}</span>
      <span className="stat-base">{base}</span>
      <span className={`stat-diff ${bonusClass}`}>{bonus >= 0 ? "+" : ""}{bonus}</span>
      <span className="stat-final">{fFinal}</span>
    </div>
  );
}

export function TeamSelect() {
  const [version, setVersion] = useState(0);

  useEffect(() => {
    return subscribe(() => {
      setVersion(v => v + 1);
    });
  }, []);

  const p1Team = state.p1Team;
  const p2Team = state.p2Team;
  const isVsAI = getIsVsAI();
  const isCurrentPlayer = state.deployTurn === 0;
  const team = state.deployTurn === 0 ? p1Team : p2Team;
  const selectedCell = state.selectedDeployCell;
  const editingIdx = state.editingUnitIndex;

  const handleSelectUnitType = (typeId: string) => {
    selectUnitType(typeId);
    selectPassiveId("");
  };

  const handleSelectPassive = (passiveId: string) => {
    selectPassiveId(passiveId);
  };

  const handleSelectPlacedUnit = (index: number) => {
    if (!isCurrentPlayer) return;
    state.editingUnitIndex = index;
    const pu = team.placed[index];
    if (pu) {
      selectUnitType(pu.typeId);
      selectPassiveId(pu.passiveId || "");
    }
  };

  const handleAddToBoard = () => {
    if (!selectedCell) return;
    addUnitToBoard(state.selectedUnitType!, state.selectedPassiveId!);
  };

  const handleDeletePlaced = (index: number) => {
    deletePlacedUnit(index);
  };

  // Unit cards
  const unitCards: React.ReactElement[] = [];
  for (const typeId of UNIT_TYPE_IDS) {
    const def = UNIT_TYPE_DEFS[typeId];
    const isSelected = state.selectedUnitType === typeId;
    unitCards.push(
      <div
        key={typeId}
        className={`unit-card${isSelected ? " active" : ""}`}
        onClick={() => handleSelectUnitType(typeId)}
      >
        <div className="unit-icon" style={{ background: def.color, width: "28px", height: "28px", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem" }}>
          {def.icon}
        </div>
        <div className="unit-name">{def.name}</div>
      </div>
    );
  }

  // Passive picker
  const unitTypeId = editingIdx !== null ? (team.placed[editingIdx]?.typeId || state.selectedUnitType) : state.selectedUnitType;
  let passivePicker: React.ReactElement | null = null;
  if (unitTypeId) {
    const unitType = UNIT_TYPE_DEFS[unitTypeId];
    const recommendedIds = PASSIVE_IDS.filter(pid => PASSIVE_DEFS[pid].recommended.includes(unitTypeId));
    const currentPassiveId = editingIdx !== null ? (team.placed[editingIdx]?.passiveId || "") : state.selectedPassiveId;

    const gridBtns: React.ReactElement[] = [];
    for (const pid of PASSIVE_IDS) {
      const passiveDef = PASSIVE_DEFS[pid];
      const isRecommended = recommendedIds.includes(pid);
      const isSelected = currentPassiveId === pid;
      gridBtns.push(
        <div key={pid} className={`passive-grid-btn${isSelected ? " selected" : ""}${isRecommended ? " recommended" : ""}`}>
          <button
            className="passive-grid-btn-inner"
            onClick={(e) => {
              e.stopPropagation();
              handleSelectPassive(pid);
            }}
          >
            {passiveDef.name}
          </button>
        </div>
      );
    }
    passivePicker = (
      <div className="passive-slot">{currentPassiveId ? " filled" : ""}
        <div className="passive-grid">{gridBtns}</div>
      </div>
    );
  }

  // Preview section
  const previewType = unitTypeId ? UNIT_TYPE_DEFS[unitTypeId] : null;
  const previewPassiveId = editingIdx !== null ? (team.placed[editingIdx]?.passiveId || "") : state.selectedPassiveId;
  const previewPassiveDef = previewPassiveId ? PASSIVE_DEFS[previewPassiveId] : null;
  const previewStats = previewType ? applyPassive(previewType, previewPassiveId || "") : null;

  let previewSection: React.ReactElement | null = null;
  if (previewType) {
    const skills: React.ReactElement[] = [];
    for (const skillId of previewType.skills) {
      const skill = SKILL_DEFS[skillId];
      skills.push(
        <div key={skillId} className="skill-item">
          <div className="skill-name">{skill.name}</div>
          <div className="skill-desc">{skill.description}</div>
          <div className="skill-meta">AP: {skill.cost} | Range: {skill.range}</div>
        </div>
      );
    }

    previewSection = (
      <div className="unit-preview">
        <div className="preview-header">
          <div className="preview-icon" style={{ background: previewType.color }}>
            {previewType.icon}
          </div>
          <div className="preview-name">{previewType.name}</div>
        </div>
        <div className="preview-description">{previewType.description}</div>
        <hr className="preview-divider" />

        <div className="preview-stats">
          <h4>Stats</h4>
          <StatRow label="HP" base={previewType.hp} bonus={(previewStats || previewType).hp - previewType.hp} final={(previewStats || previewType).hp} />
          <StatRow label="ATK" base={previewType.baseAtk} bonus={(previewStats ? previewStats.attack : previewType.baseAtk) - previewType.baseAtk} final={previewStats ? previewStats.attack : previewType.baseAtk} />
          <StatRow label="DEF" base={previewType.baseDef} bonus={(previewStats ? previewStats.defense : previewType.baseDef) - previewType.baseDef} final={previewStats ? previewStats.defense : previewType.baseDef} />
          <StatRow label="SPD" base={previewType.movement} bonus={(previewStats || previewType).movement - previewType.movement} final={(previewStats || previewType).movement} />
          <StatRow label="INIT" base={previewType.initiative} bonus={(previewStats || previewType).initiative - previewType.initiative} final={(previewStats || previewType).initiative} />
        </div>

        {previewPassiveDef && (
          <div className="preview-passive">
            <h4>Passive: {previewPassiveDef.name}</h4>
            <div className="passive-description">{previewPassiveDef.description}</div>
          </div>
        )}

        {!previewPassiveDef && (
          <div className="preview-no-passive">
            <em>No passive selected</em>
          </div>
        )}

        <div className="preview-skills">
          <h4>Skills</h4>
          {skills}
        </div>

        {isCurrentPlayer && !editingIdx && (
          <button
            className="preview-add-btn"
            onClick={handleAddToBoard}
            disabled={!selectedCell}
          >
            Add to Board
          </button>
        )}

        {editingIdx !== null && isCurrentPlayer && (
          <div className="preview-edit-actions">
            <button
              className="preview-delete-btn"
              onClick={() => handleDeletePlaced(editingIdx)}
            >
              Delete Unit
            </button>
          </div>
        )}
      </div>
    );
  } else {
    previewSection = (
      <div className="unit-preview empty">
        <p>Select a unit type from the grid above</p>
      </div>
    );
  }

  // Placed units list
  const placedUnits: React.ReactElement[] = [];
  for (let i = 0; i < team.placed.length; i++) {
    const pu = team.placed[i];
    const td = UNIT_TYPE_DEFS[pu.typeId];
    const isSelected = editingIdx === i;
    placedUnits.push(
      <div
        key={i}
        className={`roster-unit${isSelected ? " selected" : ""}`}
        onClick={() => handleSelectPlacedUnit(i)}
      >
        <span className="roster-icon" style={{ background: td.color }}>
          {td.icon}
        </span>
        <span className="roster-name">{td.name}</span>
        {pu.passiveId ? (
          <span className="roster-passive" title={PASSIVE_DEFS[pu.passiveId].description}>(<em>{PASSIVE_DEFS[pu.passiveId].name}</em>)</span>
        ) : (
          <span className="roster-no-passive">—</span>
        )}
      </div>
    );
  }

  return (
    <div className="screen active team-select">
      <div className="phase-label">Place your units on the map — 6 units required</div>
      <div className="teams-container">
        <div className="map-section">
          <Board />
          <div className="map-instructions">
            Click a tile in your deployment zone to select it, then choose a unit and passive to place it.
            Click a placed unit to edit or delete it.
          </div>
        </div>
        <div className="side-panel">
          <div className="team-select-layout">
            <div className="team-select-col team-select-col-roster">
              <h4>Placed Units</h4>
              <div className="roster">{placedUnits}</div>
              <div className="placed-count">{team.placed.length}/6 placed</div>
            </div>
            <div className="team-select-col team-select-col-combined">
              <h4>Choose Unit</h4>
              <div className="unit-cards">{unitCards}</div>
              <h4>Choose Passive</h4>
              <div className="passive-slots">{passivePicker}</div>
            </div>
            <div className="team-select-col team-select-col-preview">
              <h4>Preview</h4>
              {previewSection}
            </div>
          </div>
        </div>
      </div>
      <button className="btn btn-primary confirm-area" onClick={() => confirmTeam()}>
        {isVsAI ? "Confirm & Start" : "Confirm Team"}
      </button>
    </div>
  );
}
