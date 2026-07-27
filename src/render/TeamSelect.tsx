/// <reference types="react" />
import React from 'react';
import { useState, useEffect } from 'react';
import {
  state,
  deletePlacedUnit,
  selectUnitType,
  selectPassiveId,
  confirmTeam,
  getIsVsAI,
  createPlacedUnit,
  getPlayerIndex,
  getEffectiveStatsFor,
  getUnitMaxHpFor,
} from "../state";
import { subscribe } from "../state";
import {
  UNIT_TYPE_DEFS,
  UNIT_TYPE_IDS,
  PASSIVE_DEFS,
  PASSIVE_IDS,
} from "../data/index";
import { SKILL_DEFS } from "../data/skills.js";
import { PRESET_TEAMS, getTeamPlacements } from "../data/teams.js";
import { IsoBoard } from "./components/IsoBoard";

function applyPassive(typeDef: any, passiveId: string) {
  if (!passiveId || !PASSIVE_DEFS[passiveId]) return typeDef;
  return PASSIVE_DEFS[passiveId].apply(typeDef);
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

function UnitCardGrid({
  selectedUnitType,
  onSelect,
}: {
  selectedUnitType: string | null;
  onSelect: (typeId: string) => void;
}) {
  return (
    <div className="unit-cards">
      {UNIT_TYPE_IDS.map((typeId) => {
        const def = UNIT_TYPE_DEFS[typeId];
        const isSelected = selectedUnitType === typeId;
        return (
          <div
            key={typeId}
            className={`unit-card${isSelected ? " active" : ""}`}
            onClick={() => onSelect(typeId)}
          >
            <div className="unit-icon" style={{ background: def.color, width: "28px", height: "28px", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem" }}>
              {def.icon}
            </div>
            <div className="unit-name">{def.name}</div>
          </div>
        );
      })}
    </div>
  );
}

function PassiveGrid({
  unitTypeId,
  currentPassiveId,
  onSelect,
}: {
  unitTypeId: string;
  currentPassiveId: string | null;
  onSelect: (passiveId: string) => void;
}) {
  const recommendedIds = PASSIVE_IDS.filter(pid => PASSIVE_DEFS[pid].recommended.includes(unitTypeId));
  return (
    <div className="passive-slot">
      <div className="passive-grid">
        {PASSIVE_IDS.map((pid) => {
          const passiveDef = PASSIVE_DEFS[pid];
          const isRecommended = recommendedIds.includes(pid);
          const isSelected = currentPassiveId === pid;
          return (
            <div key={pid} className={`passive-grid-btn${isSelected ? " selected" : ""}${isRecommended ? " recommended" : ""}`}>
              <button
                className="passive-grid-btn-inner"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(pid);
                }}
              >
                {passiveDef.name}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function UnitPreview({
  unitTypeId,
  passiveId,
  isCurrentPlayer,
  editingIdx,
  onDeleteUnit,
}: {
  unitTypeId: string | null;
  passiveId: string | null;
  isCurrentPlayer: boolean;
  editingIdx: number | null;
  onDeleteUnit: (index: number) => void;
}) {
  if (!unitTypeId) {
    return (
      <div className="unit-preview empty">
        <p>Select a unit type from the grid above</p>
      </div>
    );
  }

  const typeDef = UNIT_TYPE_DEFS[unitTypeId];
  const passiveDef = passiveId ? PASSIVE_DEFS[passiveId] : null;
  const effectiveStats = passiveId && PASSIVE_DEFS[passiveId]
    ? PASSIVE_DEFS[passiveId].apply({
        hp: typeDef.hp,
        attack: typeDef.baseAtk,
        defense: typeDef.baseDef,
        movement: typeDef.movement,
        initiative: typeDef.initiative,
      })
    : null;

  const hpBonus = effectiveStats ? effectiveStats.hp - typeDef.hp : 0;
  const atkStats = getEffectiveStatsFor(unitTypeId, passiveId);
  const movementBonus = effectiveStats ? effectiveStats.movement - typeDef.movement : 0;
  const initiativeBonus = effectiveStats ? effectiveStats.initiative - typeDef.initiative : 0;

  return (
    <div className="unit-preview">
      <div className="preview-description">{typeDef.description}</div>

      <div className="preview-stats">
        <h4>Stats</h4>
        <StatRow label="HP" base={typeDef.hp} bonus={hpBonus} final={getUnitMaxHpFor(unitTypeId, passiveId)} />
        <StatRow label="ATK" base={typeDef.baseAtk} bonus={atkStats.attack - typeDef.baseAtk} final={atkStats.attack} />
        <StatRow label="DEF" base={typeDef.baseDef} bonus={atkStats.defense - typeDef.baseDef} final={atkStats.defense} />
        <StatRow label="SPD" base={typeDef.movement} bonus={movementBonus} final={typeDef.movement + movementBonus} />
        <StatRow label="INIT" base={typeDef.initiative} bonus={initiativeBonus} final={typeDef.initiative + initiativeBonus} />
      </div>

      {passiveDef ? (
        <div className="preview-passive">
          <h4>Passive: {passiveDef.name}</h4>
          <div className="passive-description">{passiveDef.description}</div>
        </div>
      ) : (
        <div className="preview-no-passive">
          <em>No passive selected</em>
        </div>
      )}

      <div className="preview-skills">
        <h4>Skills</h4>
        {typeDef.skills.map((skillId) => {
          const skill = SKILL_DEFS[skillId];
          return (
            <div key={skillId} className="skill-item">
              <div className="skill-name">{skill.name}</div>
              <div className="skill-desc">{skill.description}</div>
              <div className="skill-meta">AP: {skill.cost} | Range: {skill.range}</div>
            </div>
          );
        })}
      </div>

      {editingIdx !== null && isCurrentPlayer && (
        <div className="preview-edit-actions">
          <button
            className="preview-delete-btn"
            onClick={() => onDeleteUnit(editingIdx)}
          >
            Delete Unit
          </button>
        </div>
      )}
    </div>
  );
}

function RosterList({
  placed,
  editingIdx,
  onSelect,
}: {
  placed: { typeId: string; passiveId: string }[];
  editingIdx: number | null;
  onSelect: (index: number) => void;
}) {
  return (
    <div className="roster">
      {placed.map((pu, i) => {
        const td = UNIT_TYPE_DEFS[pu.typeId];
        const isSelected = editingIdx === i;
        return (
          <div
            key={i}
            className={`roster-unit${isSelected ? " selected" : ""}`}
            onClick={() => onSelect(i)}
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
      })}
    </div>
  );
}

function PresetTeamList({
  placedCount,
  placedUnits,
  onSelect,
}: {
  placedCount: number;
  placedUnits: { typeId: string; passiveId: string }[];
  onSelect: (index: number) => void;
}) {
  return (
    <div className="preset-teams">
      {PRESET_TEAMS.map((preset, index) => {
        const isSelected = placedCount === 6 &&
          preset.units.every((pu, i) =>
            placedUnits[i]?.typeId === pu.typeId &&
            placedUnits[i]?.passiveId === pu.passiveId
          );
        return (
          <div
            key={index}
            className={`preset-team-btn${isSelected ? " selected" : ""}`}
            onClick={() => onSelect(index)}
            title={`Load "${preset.name}" team`}
          >
            {preset.name}
          </div>
        );
      })}
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

  const handleDeletePlaced = (index: number) => {
    deletePlacedUnit(index);
  };

  const handleSelectPreset = (presetIndex: number) => {
    const preset = PRESET_TEAMS[presetIndex];
    if (!preset) return;

    // Clear current board of this player's units
    for (const pu of team.placed) {
      state.board[pu.row][pu.col] = null;
    }
    team.placed = [];
    state.selectedUnitType = null;
    state.selectedPassiveId = null;
    state.editingUnitIndex = null;

    const playerIndex = team === p1Team ? 0 : 1;
    const side = playerIndex === 0 ? "p1" : "p2";
    const placements = getTeamPlacements(side);

    // Place preset units
    preset.units.forEach((unit, index) => {
      const pos = placements[index];
      const placedUnit = createPlacedUnit(unit.typeId, unit.passiveId, pos.row, pos.col, playerIndex);

      team.placed.push(placedUnit);
      state.board[pos.row][pos.col] = placedUnit;
    });

    setVersion(v => v + 1);
  };

  // Preview section
  const unitTypeId = editingIdx !== null ? (team.placed[editingIdx]?.typeId || state.selectedUnitType) : state.selectedUnitType;
  const previewPassiveId = editingIdx !== null ? (team.placed[editingIdx]?.passiveId || "") : state.selectedPassiveId;

  return (
    <div className="screen active team-select">
      <div className="phase-label">
        {state.deployTurn === 0 || isVsAI
          ? "Place your units on the map — 6 units required"
          : "Player 2: Place your units on the map — 6 units required"}
      </div>
      <TeamSelectLayout
        unitTypeId={unitTypeId}
        previewPassiveId={previewPassiveId}
        isCurrentPlayer={isCurrentPlayer}
        editingIdx={editingIdx}
        placed={team.placed}
        onSelectPlaced={handleSelectPlacedUnit}
        onUnitSelect={handleSelectUnitType}
        onPassiveSelect={handleSelectPassive}
        onPresetSelect={handleSelectPreset}
        onDeleteUnit={handleDeletePlaced}
      />
      <button className="btn btn-primary confirm-area" onClick={() => confirmTeam()}>
        {isVsAI
          ? (team.placed.length >= 6 ? "Start Battle" : `Place Units (${team.placed.length}/6)`)
          : (state.deployTurn === 0 ? "Confirm Team" : "Start Battle")}
      </button>
    </div>
  );
}

interface LayoutProps {
  unitTypeId: string | null;
  previewPassiveId: string | null;
  isCurrentPlayer: boolean;
  editingIdx: number | null;
  placed: { typeId: string; passiveId: string }[];
  onSelectPlaced: (index: number) => void;
  onUnitSelect: (typeId: string) => void;
  onPassiveSelect: (passiveId: string) => void;
  onPresetSelect: (index: number) => void;
  onDeleteUnit: (index: number) => void;
}

function TeamSelectLayout({
  unitTypeId,
  previewPassiveId,
  isCurrentPlayer,
  editingIdx,
  placed,
  onSelectPlaced,
  onUnitSelect,
  onPassiveSelect,
  onPresetSelect,
  onDeleteUnit,
}: LayoutProps) {
  return (
    <div className="teams-container">
      <div className="teams-main">
        <SidePanel
          placed={placed}
          editingIdx={editingIdx}
          onSelectPlaced={onSelectPlaced}
          onUnitSelect={onUnitSelect}
          onPassiveSelect={onPassiveSelect}
          onPresetSelect={onPresetSelect}
        />
        <MapSection />
        <PreviewPanel
          unitTypeId={unitTypeId}
          passiveId={previewPassiveId}
          isCurrentPlayer={isCurrentPlayer}
          editingIdx={editingIdx}
          onDeleteUnit={onDeleteUnit}
        />
      </div>
    </div>
  );
}

function SidePanel({
  placed,
  editingIdx,
  onSelectPlaced,
  onUnitSelect,
  onPassiveSelect,
  onPresetSelect,
}: {
  placed: { typeId: string; passiveId: string }[];
  editingIdx: number | null;
  onSelectPlaced: (index: number) => void;
  onUnitSelect: (typeId: string) => void;
  onPassiveSelect: (passiveId: string) => void;
  onPresetSelect: (index: number) => void;
}) {
  return (
    <div className="side-panel">
      <div className="team-select-col">
        <h4>Placed Units</h4>
        <RosterList placed={placed} editingIdx={editingIdx} onSelect={onSelectPlaced} />
        <div className="placed-count">{placed.length}/6 placed</div>
        <h4>Prebuilt Teams</h4>
        <PresetTeamList placedCount={placed.length} placedUnits={placed} onSelect={onPresetSelect} />
        <h4>Choose Unit</h4>
        <UnitCardGrid selectedUnitType={state.selectedUnitType} onSelect={onUnitSelect} />
        <h4>Choose Passive</h4>
        {editingIdx !== null ? (
          <PassiveGrid
            unitTypeId={placed[editingIdx]?.typeId || state.selectedUnitType || ""}
            currentPassiveId={placed[editingIdx]?.passiveId || state.selectedPassiveId}
            onSelect={onPassiveSelect}
          />
        ) : (
          <PassiveGrid
            unitTypeId={state.selectedUnitType || ""}
            currentPassiveId={state.selectedPassiveId}
            onSelect={onPassiveSelect}
          />
        )}
      </div>
    </div>
  );
}

function MapSection() {
  return (
    <div className="map-section">
      <IsoBoard />
      <div className="map-instructions">
        Click a tile in your deployment zone to select it, then choose a unit and passive to place it.
        Click a placed unit to edit or delete it.
      </div>
    </div>
  );
}

function PreviewPanel({
  unitTypeId,
  passiveId,
  isCurrentPlayer,
  editingIdx,
  onDeleteUnit,
}: {
  unitTypeId: string | null;
  passiveId: string | null;
  isCurrentPlayer: boolean;
  editingIdx: number | null;
  onDeleteUnit: (index: number) => void;
}) {
  return (
    <div className="unit-preview-panel">
      <UnitPreview
        unitTypeId={unitTypeId}
        passiveId={passiveId}
        isCurrentPlayer={isCurrentPlayer}
        editingIdx={editingIdx}
        onDeleteUnit={onDeleteUnit}
      />
    </div>
  );
}
