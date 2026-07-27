import { GameState } from "../types.js";

export abstract class Action {
  abstract apply(state: GameState): GameState;
}
