// ============================================================
//  MAPS — predefined symmetrical map layouts
// ============================================================
// true = walkable/placement, false = unwalkable
// All maps are 12x12. Every walkable tile is reachable from every other.

export interface MapLayout {
  name: string;
  grid: boolean[][]; // [row][col], 12 rows x 12 cols
}

// Convert a string map ( '.' = walkable, 'X' = unwalkable ) to a boolean[][] grid.
export function expand(lines: string[]): boolean[][] {
  return lines.map((row) => row.split("").map((ch) => ch !== "X"));
}

// Map 1: Open Fields — two small ponds, mostly open
const OPEN_FIELDS: boolean[][] = expand([
  "XX........XX",
  "X..........X",
  "............",
  "............",
  "....XXXX....",
  "....XXXX....",
  "....XXXX....",
  "....XXXX....",
  "............",
  "............",
  "X..........X",
  "XX........XX",
]);

// Map 5: Crossroads — open center, obstacles at edges
const CROSSROADS: boolean[][] = expand([
  "............",
  "............",
  "............",
  "XX........XX",
  "............",
  ".....XX.....",
  ".....XX.....",
  "............",
  "XX........XX",
  "............",
  "............",
  "............",
]);

export const MAP_LAYOUTS: MapLayout[] = [
  { name: "Open Fields", grid: OPEN_FIELDS },
  { name: "Crossroads", grid: CROSSROADS },
];

export const TEST_MAP: MapLayout = {
  name: "Test Map",
  grid: expand(Array(12).fill("............")),
};

// Random map selection
export function getRandomMap(): MapLayout {
  return MAP_LAYOUTS[Math.floor(Math.random() * MAP_LAYOUTS.length)];
}
