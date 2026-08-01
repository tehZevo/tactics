/// <reference types="react" />
import React from 'react';
import { useState } from 'react';
import {
  state,
  getTurnUnit,
  getEffectiveStats,
  placeUnit,
  getUnitMaxHp,
  startTargeting,
  getPlayerIndex,
} from "../../state";
import { MAX_AP } from "../../data/index";
import { UNIT_TYPE_DEFS, SKILL_DEFS, PASSIVE_DEFS } from "../../data/index";
import type { PlacedUnit } from "../../state";

function HpBar({ current, max }: { current: number; max: number }) {
  const pct = (current / max) * 100;
  const cls = pct <= 25 ? " low" : pct <= 50 ? " mid" : "";
  return (
    <div className="up-hp-bar">
      <div className={`up-hp-fill${cls}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function UnitHeader({ unit }: { unit: PlacedUnit }) {
  const td = UNIT_TYPE_DEFS[unit.typeId];
  const playerIdx = getPlayerIndex(unit);
  return (
    <div className="up-header">
      <div className="up-icon" style={{ background: td.color }}>{td.icon}</div>
      <div>
        <div className="up-name">{td.name}</div>
        <div className="up-player">Player {playerIdx + 1}</div>
      </div>
    </div>
  );
}

function SkillList({ unit }: { unit: PlacedUnit }) {
  const td = UNIT_TYPE_DEFS[unit.typeId];
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="up-section up-skill-section">
      <div className="up-section-title up-skill-toggle" onClick={() => setIsOpen(!isOpen)}>
        <span>Skills</span>
        <span className="up-skill-toggle-icon">{isOpen ? "▾" : "▸"}</span>
      </div>
      {isOpen && (
        <div className="up-skill-list">
          {td.skills.map((sid) => {
            const skill = SKILL_DEFS[sid];
            const canUse = unit.ap >= skill.cost && !unit.skillUsedThisTurn;
            return (
              <div
                key={sid}
                className={`up-skill${canUse ? "" : " disabled"}`}
                onClick={() => canUse && startTargeting(unit, sid)}
              >
                <div className="up-skill-name">{skill.name}</div>
                <div className="up-skill-cost">{skill.cost} AP &middot; Range {skill.range}</div>
                <div className="up-skill-desc">{skill.description}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function PassiveDisplay({ unit }: { unit: PlacedUnit }) {
  if (!unit.passiveId || !PASSIVE_DEFS[unit.passiveId]) return null;
  const pDef = PASSIVE_DEFS[unit.passiveId];
  return (
    <div className="up-section">
      <div className="up-passive">
        <div className="up-passive-name">{pDef.name}</div>
        <div className="up-passive-desc">{pDef.description}</div>
      </div>
    </div>
  );
}

function StatBlock({ unit }: { unit: PlacedUnit }) {
  const stats = getEffectiveStats(unit);
  return (
    <div className="up-stats">
      <div className="up-stat"><span>ATK</span><span>+{stats.attack}</span></div>
      <div className="up-stat"><span>DEF</span><span>+{stats.defense}</span></div>
      <div className="up-stat"><span>SPD</span><span>{unit.movement}</span></div>
      <div className="up-stat"><span>INIT</span><span>{unit.initiative}</span></div>
      <div className="up-stat"><span>AP</span><span>{unit.ap}/{MAX_AP}</span></div>
    </div>
  );
}

function TurnOrderEntry({ entry, isCurrent }: { entry: { playerIndex: 0 | 1; unitIndex: number }; isCurrent: boolean }) {
  const team = entry.playerIndex === 0 ? state.p1Team.placed : state.p2Team.placed;
  const unit = team[entry.unitIndex];
  if (!unit || unit.currentHp <= 0) return null;

  const td = UNIT_TYPE_DEFS[unit.typeId];
  return (
    <div
      className={`turn-order-entry${isCurrent ? " current" : ""} p${entry.playerIndex + 1}`}
      onClick={() => placeUnit(unit.row, unit.col)}
    >
      <div className="toe-icon" style={{ background: td.color }}>
        {td.icon}
      </div>
      <div className="toe-info">
        <div className="toe-name">{td.name}</div>
        <div className="toe-player">P{entry.playerIndex + 1} &middot; {unit.currentHp}/{getUnitMaxHp(unit)} HP</div>
      </div>
      {isCurrent && <div className="toe-arrow" />}
    </div>
  );
}

export function TurnOrderStrip() {
  const turnUnit = getTurnUnit(state);
  return (
    <div className="turn-order-strip">
      {state.turnOrder.map((entry, i) => (
        <TurnOrderEntry
          key={i}
          entry={entry}
          isCurrent={turnUnit === (entry.playerIndex === 0 ? state.p1Team.placed : state.p2Team.placed)[entry.unitIndex]}
        />
      ))}
    </div>
  );
}

export function UnitPanel({ unit, onClose }: { unit: PlacedUnit | null; onClose?: () => void }) {
  const playerIdx = unit ? getPlayerIndex(unit) : 0;

  return (
    <div className={`unit-panel${unit ? ` p${playerIdx + 1}` : ""}`}>
      {unit ? (
        <>
          {onClose && (
            <button className="unit-panel-close" onClick={onClose} aria-label="Close">✕</button>
          )}
          <UnitHeader unit={unit} />
          <div className="up-hp-row">
            <span className="up-hp-label">HP</span>
            <span className="up-hp-value">{unit.currentHp}/{getUnitMaxHp(unit)}</span>
            <HpBar current={unit.currentHp} max={getUnitMaxHp(unit)} />
          </div>
          <StatBlock unit={unit} />
          <PassiveDisplay unit={unit} />
          <SkillList unit={unit} />
        </>
      ) : (
        <p className="unit-panel-empty">No active unit</p>
      )}
    </div>
  );
}

export function BattleLog() {
    const reversed = [...state.log].reverse();
  return (
    <div className="battle-log">
      <div className="bl-title">Battle Log</div>
      <div className="bl-entries">
        {reversed.map((entry, i) => (
          <div key={state.log.length - 1 - i} className={`log-entry ${entry.type}`}>{entry.text}</div>
        ))}
      </div>
    </div>
  );
}
