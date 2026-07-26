/// <reference types="react" />
import React from 'react';
import {
  state,
  getTurnUnit,
  getEffectiveStats,
  selectTile,
  getUnitMaxHp,
  startTargeting,
} from "../../state";
import { MAX_AP } from "../../data/index";
import { UNIT_TYPE_DEFS, SKILL_DEFS, PASSIVE_DEFS } from "../../data/index";
import type { SkillDef } from "../../data/skills";

export function SidePanel({ playerIndex }: { playerIndex: 0 | 1 }) {
  const panelClasses: string[] = ["side-panel", `p${playerIndex + 1}`];
  const team = playerIndex === 0 ? state.p1Team.placed : state.p2Team.placed;

  const units: React.ReactElement[] = [];

  for (let i = 0; i < team.length; i++) {
    const unit = team[i];
    const td = UNIT_TYPE_DEFS[unit.typeId];
    const isActive = state.selectedUnit?.playerIndex === playerIndex && state.selectedUnit?.unitIndex === i;
    const isDead = unit.currentHp <= 0;
    const unitClasses: string[] = ["side-unit"];
    if (isActive) unitClasses.push("active-turn");
    if (isDead) unitClasses.push("dead");

    const skillStatus = unit.skillUsedThisTurn
      ? { className: "su-skilled", style: { color: "#ef4444" }, children: "Skill used" }
      : { className: "su-skilled", style: { color: "#22c55e" }, children: "Skill ready" };

    units.push(
      <div
        key={i}
        className={unitClasses.join(" ")}
        onClick={() => selectTile(unit.row, unit.col)}
      >
        <div className="su-icon" style={{ background: td.color }}>{td.icon}</div>
        <div className="su-info">
          <div className="su-name">{td.name}</div>
          <div className="su-hp">{unit.currentHp}/{getUnitMaxHp(unit)}</div>
          <div className="su-ap">AP: {unit.ap}</div>
          <div className={skillStatus.className} style={skillStatus.style}>{skillStatus.children}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={panelClasses.join(" ")}>
      <h4>Player {playerIndex + 1}</h4>
      {units}
    </div>
  );
}

export function TurnIndicator() {
  const turnUnit = getTurnUnit(state);
  if (!turnUnit) return <div className="turn-indicator">No turn</div>;

  const td = UNIT_TYPE_DEFS[turnUnit.typeId];
  const skillStatus = turnUnit.skillUsedThisTurn ? " | Skill used" : "";
  return (
    <div className={`turn-indicator p${turnUnit.row < 5 ? 1 : 2}`}>
      {td.name}'s turn (AP: {turnUnit.ap}{skillStatus})
    </div>
  );
}

export function UnitDetail() {
  if (!state.selectedUnit) {
    return (
      <div className="unit-detail">
        <h4>Unit Info</h4>
        <p style={{ color: "#4b5563" }}>Click a unit to see details</p>
      </div>
    );
  }

  const team = state.selectedUnit.playerIndex === 0
    ? state.p1Team.placed
    : state.p2Team.placed;
  const unit = team[state.selectedUnit.unitIndex];
  if (!unit || unit.currentHp <= 0) {
    return (
      <div className="unit-detail">
        <h4>Unit Info</h4>
        <p style={{ color: "#4b5563" }}>This unit is defeated</p>
      </div>
    );
  }

  const td = UNIT_TYPE_DEFS[unit.typeId];
  const stats = getEffectiveStats(unit);
  const maxHp = getUnitMaxHp(unit);

  const skillEls: React.ReactElement[] = [];
  for (const sid of td.skills) {
    const skill = SKILL_DEFS[sid] as SkillDef;
    const canUse = unit.ap >= skill.cost;
    skillEls.push(
      <div
        className={`ud-skill${canUse ? "" : " disabled"}`}
        data-skill={sid}
        onClick={() => canUse && startTargeting(unit, sid)}
      >
        <div className="ud-skill-name">{skill.name} [{skill.cost} AP]</div>
        <div className="ud-skill-desc">{skill.description}</div>
      </div>
    );
  }

  let passiveEl: React.ReactElement | null = null;
  if (unit.passiveId && PASSIVE_DEFS[unit.passiveId]) {
    const pDef = PASSIVE_DEFS[unit.passiveId];
    passiveEl = <div className="ud-passive">Passive: {pDef.name} — {pDef.description}</div>;
  }

  return (
    <div className="unit-detail">
      <h4>{td.name}</h4>
      <div className="ud-stats">
        <div className="ud-stat"><span>HP</span><span>{unit.currentHp}/{maxHp}</span></div>
        <div className="ud-stat"><span>Attack</span><span>+{stats.attack}</span></div>
        <div className="ud-stat"><span>Defense</span><span>+{stats.defense}</span></div>
        <div className="ud-stat"><span>Movement</span><span>{unit.movement}</span></div>
        <div className="ud-stat"><span>Initiative</span><span>{unit.initiative}</span></div>
        <div className="ud-stat"><span>AP</span><span>{unit.ap}/{MAX_AP}</span></div>
      </div>
      <div className="ud-skills">{skillEls}</div>
      {passiveEl}
    </div>
  );
}

export function BattleLog() {
  const entries: React.ReactElement[] = [];
  for (let i = 0; i < Math.min(state.log.length, 20); i++) {
    const entry = state.log[i];
    entries.push(
      <div key={i} className={`log-entry ${entry.type}`}>{entry.text}</div>
    );
  }
  return <div className="battle-log">{entries}</div>;
}
