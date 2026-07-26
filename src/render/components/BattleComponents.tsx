/// <reference types="react" />
import React from 'react';
import {
  state,
  getTurnUnit,
  getEffectiveStats,
  placeUnit,
  getUnitMaxHp,
  startTargeting,
} from "../../state";
import { MAX_AP } from "../../data/index";
import { UNIT_TYPE_DEFS, SKILL_DEFS, PASSIVE_DEFS } from "../../data/index";
import type { SkillDef } from "../../data/skills";

export function TurnOrderStrip() {
  const turnUnit = getTurnUnit(state);

  return (
    <div className="turn-order-strip">
      {state.turnOrder.map((entry, i) => {
        const team = entry.playerIndex === 0 ? state.p1Team.placed : state.p2Team.placed;
        const unit = team[entry.unitIndex];
        if (!unit || unit.currentHp <= 0) return null;

        const td = UNIT_TYPE_DEFS[unit.typeId];
        const isCurrent = turnUnit === unit;
        const isDead = unit.currentHp <= 0;

        return (
          <div
            key={i}
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
      })}
    </div>
  );
}

export function UnitPanel() {
  const turnUnit = getTurnUnit(state);

  if (!turnUnit) {
    return (
      <div className="unit-panel">
        <p className="unit-panel-empty">No active unit</p>
      </div>
    );
  }

  const td = UNIT_TYPE_DEFS[turnUnit.typeId];
  const stats = getEffectiveStats(turnUnit);
  const maxHp = getUnitMaxHp(turnUnit);
  const playerIdx = turnUnit.row < 5 ? 0 : 1;

  const skillEls: React.ReactElement[] = [];
  for (const sid of td.skills) {
    const skill = SKILL_DEFS[sid] as SkillDef;
    const canUse = turnUnit.ap >= skill.cost && !turnUnit.skillUsedThisTurn;
    skillEls.push(
      <div
        key={sid}
        className={`up-skill${canUse ? "" : " disabled"}`}
        onClick={() => canUse && startTargeting(turnUnit, sid)}
      >
        <div className="up-skill-name">{skill.name}</div>
        <div className="up-skill-cost">{skill.cost} AP &middot; Range {skill.range}</div>
        <div className="up-skill-desc">{skill.description}</div>
      </div>
    );
  }

  let passiveEl: React.ReactElement | null = null;
  if (turnUnit.passiveId && PASSIVE_DEFS[turnUnit.passiveId]) {
    const pDef = PASSIVE_DEFS[turnUnit.passiveId];
    passiveEl = (
      <div className="up-passive">
        <div className="up-passive-name">{pDef.name}</div>
        <div className="up-passive-desc">{pDef.description}</div>
      </div>
    );
  }

  const hpPct = (turnUnit.currentHp / maxHp) * 100;
  const hpClass = hpPct <= 25 ? " low" : hpPct <= 50 ? " mid" : "";

  return (
    <div className={`unit-panel p${playerIdx + 1}`}>
      <div className="up-header">
        <div className="up-icon" style={{ background: td.color }}>{td.icon}</div>
        <div>
          <div className="up-name">{td.name}</div>
          <div className="up-player">Player {playerIdx + 1}</div>
        </div>
      </div>

      <div className="up-hp-row">
        <span className="up-hp-label">HP</span>
        <span className="up-hp-value">{turnUnit.currentHp}/{maxHp}</span>
        <div className="up-hp-bar">
          <div className={`up-hp-fill${hpClass}`} style={{ width: `${hpPct}%` }} />
        </div>
      </div>

      <div className="up-stats">
        <div className="up-stat"><span>ATK</span><span>+{stats.attack}</span></div>
        <div className="up-stat"><span>DEF</span><span>+{stats.defense}</span></div>
        <div className="up-stat"><span>SPD</span><span>{turnUnit.movement}</span></div>
        <div className="up-stat"><span>INIT</span><span>{turnUnit.initiative}</span></div>
        <div className="up-stat"><span>AP</span><span>{turnUnit.ap}/{MAX_AP}</span></div>
      </div>

      {passiveEl && <div className="up-section">{passiveEl}</div>}

      <div className="up-section">
        <div className="up-section-title">Skills</div>
        {skillEls}
      </div>
    </div>
  );
}

export function BattleLog() {
  const entries: React.ReactElement[] = [];
  for (let i = state.log.length - 1; i >= 0 && entries.length < 15; i--) {
    const entry = state.log[i];
    entries.unshift(
      <div key={i} className={`log-entry ${entry.type}`}>{entry.text}</div>
    );
  }
  return (
    <div className="battle-log">
      <div className="bl-title">Battle Log</div>
      <div className="bl-entries">{entries}</div>
    </div>
  );
}
