import { startTestBattle, getUnitFromState } from "./src/__tests__/test-fixtures.js";
import { applyAction } from "./src/state/game-engine.js";
import { getTurnUnit } from "./src/state/helpers.js";

// Test basic move
const battleState = startTestBattle(
  [{ typeId: "warrior", passiveId: "toughened", col: 0 }],
  [{ typeId: "archer", passiveId: "nimble", col: 5 }]
);

console.log("Initial turnOrder:", battleState.turnOrder);
console.log("Initial currentTurnIndex:", battleState.currentTurnIndex);
console.log("Initial turnUnit:", getTurnUnit(battleState));

const result = applyAction(battleState, {
  type: "move",
  unitRef: { playerIndex: 0, unitIndex: 0 },
  targetRow: 1,
  targetCol: 0,
});

console.log("Result turnOrder:", result.turnOrder);
console.log("Result currentTurnIndex:", result.currentTurnIndex);
console.log("Result turnUnit:", getTurnUnit(result));
console.log("Board[0][0]:", result.board[0][0]);
console.log("Board[1][0]:", result.board[1][0]);
