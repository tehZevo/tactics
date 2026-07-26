/// <reference types="react" />
import React, { useState } from 'react';
import { state, selectUnit, setPassive, confirmTeam, deselectUnit, getIsVsAI } from "../state";
import {
  UNIT_TYPE_DEFS,
  UNIT_TYPE_IDS,
  PASSIVE_DEFS,
  PASSIVE_IDS,
} from "../data/index";
import { SKILL_DEFS } from "../data/skills.js";

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
  const diffClass = fFinal - base > 0 ? "positive" : fFinal - base < 0 ? "negative" : "";
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
  const p1Team = state.p1Team;
  const p2Team = state.p2Team;
  const [previewIndex, setPreviewIndex] = useState<{ [key: number]: number | null }>({ 0: null, 1: null });
  const [selectedUnitType, setSelectedUnitType] = useState<{ [key: number]: string | null }>({ 0: null, 1: null });
  const [selectedPassive, setSelectedPassive] = useState<{ [key: number]: string }>({ 0: "", 1: "" });

  const handleSelectUnit = (playerIndex: 0 | 1, typeId: string) => {
    setSelectedUnitType(prev => ({ ...prev, [playerIndex]: typeId }));
    setPreviewIndex(prev => ({ ...prev, [playerIndex]: null }));
    // Auto-select first recommended passive if no passive currently selected
    if (!selectedPassive[playerIndex]) {
      const recommendedIds = PASSIVE_IDS.filter(pid => PASSIVE_DEFS[pid].recommended.includes(typeId));
      if (recommendedIds.length > 0) {
        setSelectedPassive(prev => ({ ...prev, [playerIndex]: recommendedIds[0] }));
      }
    }
  };

  const handlePreviewUnit = (playerIndex: 0 | 1, index: number) => {
    setPreviewIndex(prev => ({ ...prev, [playerIndex]: index }));
    setSelectedUnitType(prev => ({ ...prev, [playerIndex]: null }));
  };

  const handleAddUnit = (playerIndex: 0 | 1) => {
    const typeId = selectedUnitType[playerIndex];
    if (!typeId) return;
    selectUnit(playerIndex, typeId);
    setSelectedUnitType(prev => ({ ...prev, [playerIndex]: null }));
    const team = playerIndex === 0 ? p1Team : p2Team;
    setPreviewIndex(prev => ({ ...prev, [playerIndex]: team.units.length - 1 }));
  };

  const renderTeamPanel = (playerIndex: 0 | 1, cls: string) => {
    const team = playerIndex === 0 ? p1Team : p2Team;
    const previewIdx = previewIndex[playerIndex];
    const previewUnit = previewIdx !== null && previewIdx < team.units.length ? team.units[previewIdx] : null;
    const previewType = previewUnit ? UNIT_TYPE_DEFS[previewUnit.typeId] : null;

    const unitCardCounts: Record<string, number> = {};
    for (const unit of team.units) {
      unitCardCounts[unit.typeId] = (unitCardCounts[unit.typeId] || 0) + 1;
    }

    const unitCards: React.ReactElement[] = [];
    for (const typeId of UNIT_TYPE_IDS) {
      const def = UNIT_TYPE_DEFS[typeId];
      const count = unitCardCounts[typeId] || 0;
      const canAdd = count < 6 && team.units.length < 6;
      const cardClasses = [`unit-card${count > 0 ? " has-copy" : ""}`];

      unitCards.push(
        <div
          key={typeId}
          className={cardClasses.join(" ")}
          onClick={() => canAdd && handleSelectUnit(playerIndex, typeId)}
        >
          <div className="unit-icon" style={{ background: def.color, width: "28px", height: "28px", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem" }}>
            {def.icon}
          </div>
          <div className="unit-name">{def.name}</div>
          {count > 0 && (
            <div className="unit-copy-count">{count}</div>
          )}
        </div>
      );
    }

    const selectedTypeId = selectedUnitType[playerIndex];
    const isNewUnit = !!selectedTypeId;
    const passivePicker: React.ReactElement | null = (() => {
      const unitTypeId = isNewUnit ? selectedTypeId! : (previewUnit?.typeId || null);
      if (!unitTypeId) return null;
      const unitType = UNIT_TYPE_DEFS[unitTypeId];
      const recommendedIds = PASSIVE_IDS.filter(pid => PASSIVE_DEFS[pid].recommended.includes(unitTypeId));
      const currentPassiveId = isNewUnit ? (selectedPassive[playerIndex] || "") : (previewUnit?.passiveId || "");

      return (
        <div className={`passive-slot${currentPassiveId ? " filled" : ""}`}>
          <div className="passive-grid">
            {PASSIVE_IDS.map((pid) => {
              const passiveDef = PASSIVE_DEFS[pid];
              const isRecommended = recommendedIds.includes(pid);
              const isSelected = currentPassiveId === pid;
              const gridBtnClasses = [`passive-grid-btn${isSelected ? " selected" : ""}${isRecommended ? " recommended" : ""}`];
              return (
                <div key={pid} className={gridBtnClasses.join(" ")} title={passiveDef.description}>
                  <button
                    className="passive-grid-btn-inner"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isNewUnit) {
                        setSelectedPassive(prev => ({ ...prev, [playerIndex]: pid }));
                      } else {
                        setPassive(playerIndex, previewIdx!, pid);
                      }
                    }}
                    title={passiveDef.name}
                  >
                    {passiveDef.name}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      );
    })();

    let previewSection: React.ReactElement | null = null;
    if (previewUnit && previewType) {
      const passiveId = previewUnit.passiveId;
      const passiveDef = passiveId ? PASSIVE_DEFS[passiveId] : null;
      const finalStats = applyPassive(previewType, passiveId);
      const baseStats: { hp: number; baseAtk: number; baseDef: number; movement: number; initiative: number } = previewType;

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
            <StatRow label="HP" base={baseStats.hp} bonus={(finalStats || previewType).hp - baseStats.hp} final={(finalStats || previewType).hp} />
            <StatRow label="ATK" base={baseStats.baseAtk} bonus={(finalStats ? finalStats.attack : previewType.baseAtk) - baseStats.baseAtk} final={finalStats ? finalStats.attack : previewType.baseAtk} />
            <StatRow label="DEF" base={baseStats.baseDef} bonus={(finalStats ? finalStats.defense : previewType.baseDef) - baseStats.baseDef} final={finalStats ? finalStats.defense : previewType.baseDef} />
            <StatRow label="SPD" base={baseStats.movement} bonus={(finalStats || previewType).movement - baseStats.movement} final={(finalStats || previewType).movement} />
            <StatRow label="INIT" base={baseStats.initiative} bonus={(finalStats || previewType).initiative - baseStats.initiative} final={(finalStats || previewType).initiative} />
          </div>

          {passiveDef && (
            <div className="preview-passive">
              <h4>Passive: {passiveDef.name}</h4>
              <div className="passive-description">{passiveDef.description}</div>
            </div>
          )}

          {!passiveDef && (
            <div className="preview-no-passive">
              <em>No passive selected</em>
            </div>
          )}

          <div className="preview-skills">
            <h4>Skills</h4>
            {skills}
          </div>
        </div>
      );
    } else if (selectedTypeId) {
      const typeDef = UNIT_TYPE_DEFS[selectedTypeId];
      const passiveId = selectedPassive[playerIndex];
      const passiveDef = passiveId ? PASSIVE_DEFS[passiveId] : null;
      const finalStats = applyPassive(typeDef, passiveId);
      const baseStats: { hp: number; baseAtk: number; baseDef: number; movement: number; initiative: number } = typeDef;

      const inRoster = team.units.some(u => u.typeId === selectedTypeId);

      const skills: React.ReactElement[] = [];
      for (const skillId of typeDef.skills) {
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
            <div className="preview-icon" style={{ background: typeDef.color }}>
              {typeDef.icon}
          </div>
          <div className="preview-name">{typeDef.name}</div>
        </div>
          <div className="preview-description">{typeDef.description}</div>
          <hr className="preview-divider" />

          <div className="preview-stats">
            <h4>Stats</h4>
            <StatRow label="HP" base={baseStats.hp} bonus={(finalStats || typeDef).hp - baseStats.hp} final={(finalStats || typeDef).hp} />
            <StatRow label="ATK" base={baseStats.baseAtk} bonus={(finalStats ? finalStats.attack : typeDef.baseAtk) - baseStats.baseAtk} final={finalStats ? finalStats.attack : typeDef.baseAtk} />
            <StatRow label="DEF" base={baseStats.baseDef} bonus={(finalStats ? finalStats.defense : typeDef.baseDef) - baseStats.baseDef} final={finalStats ? finalStats.defense : typeDef.baseDef} />
            <StatRow label="SPD" base={baseStats.movement} bonus={(finalStats || typeDef).movement - baseStats.movement} final={(finalStats || typeDef).movement} />
            <StatRow label="INIT" base={baseStats.initiative} bonus={(finalStats || typeDef).initiative - baseStats.initiative} final={(finalStats || typeDef).initiative} />
          </div>

          {passiveDef && (
            <div className="preview-passive">
              <h4>Passive: {passiveDef.name}</h4>
              <div className="passive-description">{passiveDef.description}</div>
            </div>
          )}

          {!passiveDef && (
            <div className="preview-no-passive">
              <em>No passive selected</em>
            </div>
          )}

          <div className="preview-skills">
            <h4>Skills</h4>
            {skills}
          </div>

          {!inRoster && (
            <button className="preview-add-btn" onClick={() => handleAddUnit(playerIndex)}>
              Add to Team
            </button>
          )}
        </div>
      );
    } else {
      previewSection = (
        <div className="unit-preview empty">
          <p>Select a unit or click on a team member to preview</p>
        </div>
      );
    }

    const rosterUnits: React.ReactElement[] = [];
    for (let i = 0; i < 6; i++) {
      const unit = team.units[i];
      const typeDef = unit ? UNIT_TYPE_DEFS[unit.typeId] : null;
      const isSelected = previewIdx === i;
      rosterUnits.push(
        <div
          key={i}
          className={`roster-unit${unit ? "" : " empty"}${isSelected ? " selected" : ""}`}
          onClick={() => unit && handlePreviewUnit(playerIndex, i)}
        >
          {typeDef ? (
            <>
              <span className="roster-icon" style={{ background: typeDef.color }}>
                {typeDef.icon}
              </span>
              <span className="roster-name">{typeDef.name}</span>
              {unit.passiveId ? (
                <span className="roster-passive" title={PASSIVE_DEFS[unit.passiveId].description}>(<em>{PASSIVE_DEFS[unit.passiveId].name}</em>)</span>
              ) : (
                <span className="roster-no-passive">—</span>
              )}
              <button
                className="roster-remove-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  deselectUnit(playerIndex, i);
                  if (previewIdx === i) {
                    setPreviewIndex(prev => ({ ...prev, [playerIndex]: null }));
                  } else if (previewIdx !== null && previewIdx > i) {
                    setPreviewIndex(prev => ({ ...prev, [playerIndex]: prev[playerIndex]! - 1 }));
                  }
                }}
                title="Remove unit"
              >
                ×
              </button>
            </>
          ) : (
            <span className="roster-empty">—</span>
          )}
        </div>
      );
    }

    return (
      <div key={cls} className={`team-panel ${cls}`}>
        <h3>Player {playerIndex + 1}</h3>
        <div className="team-select-layout">
          <div className="team-select-col team-select-col-units">
            <h4>Choose Unit</h4>
            <div className="unit-cards">{unitCards}</div>
          </div>
          <div className="team-select-col team-select-col-passives">
            <h4>Choose Passive</h4>
            <div className="passive-slots">{passivePicker}</div>
          </div>
          <div className="team-select-col team-select-col-preview">
            <h4>Preview</h4>
            {previewSection}
          </div>
          <div className="team-select-col team-select-col-roster">
            <h4>Roster</h4>
            <div className="roster">{rosterUnits}</div>
          </div>
        </div>
      </div>
    );
  };

  const isVsAI = getIsVsAI();
  return (
    <div className="screen active team-select">
      <div className="phase-label">Select your team — 6 units, 1 passive each</div>
      <div className="teams-container">
        {renderTeamPanel(0, "p1")}
        {!isVsAI && renderTeamPanel(1, "p2")}
      </div>
      <button className="btn btn-primary confirm-area" onClick={() => confirmTeam()}>
        {isVsAI ? "Confirm & Start" : "Confirm Team"}
      </button>
    </div>
  );
}
