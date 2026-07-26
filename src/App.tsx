/// <reference types="react" />
import React from 'react';
import { useState, useEffect } from 'react';
import { state, subscribe, getIsVsAI } from './state';
import { Menu } from './render/Menu';
import { TeamSelect } from './render/TeamSelect';
import { Deployment } from './render/Deployment';
import { Battle } from './render/Battle';
import { Victory } from './render/Victory';

let _isVsAI = getIsVsAI();

export function App() {
  const [, setVersion] = useState(0);

  useEffect(() => {
    return subscribe(() => {
      setVersion(v => v + 1);
    });
  }, []);

  if (!state || !state.screen) {
    return <div className="screen active title-screen"><h1>Loading...</h1></div>;
  }

  switch (state.screen) {
    case "menu":
      return <Menu />;
    case "teamSelect":
      return <TeamSelect />;
    case "deploy":
      return <Deployment />;
    case "battle":
      return <Battle />;
    case "victory":
      return <Victory />;
    default:
      return <Menu />;
  }
}
