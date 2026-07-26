// ============================================================
//  MAPS — predefined symmetrical map layouts
// ============================================================
// true = walkable/placement, false = unwalkable
// All maps are 12x12. Every walkable tile is reachable from every other.

export interface MapLayout {
  name: string;
  grid: boolean[][]; // [row][col], 12 rows x 12 cols
}

// Map 1: Open Fields — two small ponds, mostly open
const OPEN_FIELDS: boolean[][] = [
  [true, true, true, true, true, true, true, true, true, true, true, true],
  [true, true, true, true, true, true, true, true, true, true, true, true],
  [true, true, true, true, true, true, true, true, true, true, true, true],
  [true, true, true, true, true, true, true, true, true, true, true, true],
  [true, true, true, true, false, false, false, false, true, true, true, true],
  [true, true, true, true, false, false, false, false, true, true, true, true],
  [true, true, true, true, false, false, false, false, true, true, true, true],
  [true, true, true, true, false, false, false, false, true, true, true, true],
  [true, true, true, true, true, true, true, true, true, true, true, true],
  [true, true, true, true, true, true, true, true, true, true, true, true],
  [true, true, true, true, true, true, true, true, true, true, true, true],
  [true, true, true, true, true, true, true, true, true, true, true, true],
];

// Map 2: Mountain Pass — scattered peaks with winding routes
const MOUNTAIN_PASS: boolean[][] = [
  [true, true, true, true, true, true, true, true, true, true, true, true],
  [true, true, true, false, false, true, true, false, false, true, true, true],
  [true, true, true, false, true, true, true, true, false, true, true, true],
  [true, true, true, true, true, false, false, true, true, true, true, true],
  [true, false, true, true, true, true, true, true, true, true, false, true],
  [true, false, true, true, true, true, true, true, true, true, false, true],
  [true, false, true, true, true, true, true, true, true, true, false, true],
  [true, false, true, true, true, true, true, true, true, true, false, true],
  [true, true, true, true, true, false, false, true, true, true, true, true],
  [true, true, true, false, true, true, true, true, false, true, true, true],
  [true, true, true, false, false, true, true, false, false, true, true, true],
  [true, true, true, true, true, true, true, true, true, true, true, true],
];

// Map 3: Forest Maze — scattered trees creating lanes
const FOREST_MAZE: boolean[][] = [
  [true, true, true, true, true, true, true, true, true, true, true, true],
  [true, false, true, true, false, true, true, false, true, true, false, true],
  [true, true, true, false, true, true, true, true, false, true, true, true],
  [true, true, false, true, true, false, false, true, true, false, true, true],
  [true, true, true, true, false, true, true, false, true, true, true, true],
  [true, false, false, true, true, true, true, true, true, false, false, true],
  [true, false, false, true, true, true, true, true, true, false, false, true],
  [true, true, true, true, false, true, true, false, true, true, true, true],
  [true, true, false, true, true, false, false, true, true, false, true, true],
  [true, true, true, false, true, true, true, true, false, true, true, true],
  [true, false, true, true, false, true, true, false, true, true, false, true],
  [true, true, true, true, true, true, true, true, true, true, true, true],
];

// Map 4: Islands — small scattered obstacles
const ISLANDS: boolean[][] = [
  [true, true, true, true, true, true, true, true, true, true, true, true],
  [true, true, true, true, true, true, true, true, true, true, true, true],
  [true, true, false, false, true, true, true, true, false, false, true, true],
  [true, true, false, false, true, true, true, true, false, false, true, true],
  [true, true, true, true, true, true, true, true, true, true, true, true],
  [true, true, true, true, false, false, false, false, true, true, true, true],
  [true, true, true, true, false, false, false, false, true, true, true, true],
  [true, true, true, true, true, true, true, true, true, true, true, true],
  [true, true, false, false, true, true, true, true, false, false, true, true],
  [true, true, false, false, true, true, true, true, false, false, true, true],
  [true, true, true, true, true, true, true, true, true, true, true, true],
  [true, true, true, true, true, true, true, true, true, true, true, true],
];

// Map 5: Crossroads — open center, obstacles at edges
const CROSSROADS: boolean[][] = [
  [true, true, true, false, true, true, true, true, false, true, true, true],
  [true, true, true, true, true, true, true, true, true, true, true, true],
  [true, true, true, true, true, true, true, true, true, true, true, true],
  [false, true, true, true, true, true, true, true, true, true, true, false],
  [true, true, true, true, true, true, true, true, true, true, true, true],
  [true, true, true, true, true, false, false, true, true, true, true, true],
  [true, true, true, true, true, false, false, true, true, true, true, true],
  [true, true, true, true, true, true, true, true, true, true, true, true],
  [false, true, true, true, true, true, true, true, true, true, true, false],
  [true, true, true, true, true, true, true, true, true, true, true, true],
  [true, true, true, true, true, true, true, true, true, true, true, true],
  [true, true, true, false, true, true, true, true, false, true, true, true],
];

// Map 6: Canyon — vertical walls with gaps
const CANYON: boolean[][] = [
  [true, true, true, true, true, true, true, true, true, true, true, true],
  [true, true, true, true, true, true, true, true, true, true, true, true],
  [true, true, true, true, true, false, false, true, true, true, true, true],
  [true, true, true, true, false, false, true, true, true, true, true, true],
  [true, true, true, false, false, true, true, true, true, true, true, true],
  [true, true, true, false, true, true, true, true, true, true, true, true],
  [true, true, true, false, true, true, true, true, true, true, true, true],
  [true, true, true, false, false, true, true, true, true, true, true, true],
  [true, true, true, true, false, false, true, true, true, true, true, true],
  [true, true, true, true, true, false, false, true, true, true, true, true],
  [true, true, true, true, true, true, true, true, true, true, true, true],
  [true, true, true, true, true, true, true, true, true, true, true, true],
];

// Map 7: Wall — horizontal wall with two gaps
const WALL: boolean[][] = [
  [true, true, true, true, true, true, true, true, true, true, true, true],
  [true, true, true, true, true, true, true, true, true, true, true, true],
  [true, true, true, true, true, true, true, true, true, true, true, true],
  [true, true, true, true, false, false, false, false, true, true, true, true],
  [true, true, true, true, false, true, true, false, true, true, true, true],
  [true, true, true, true, false, true, true, false, true, true, true, true],
  [true, true, true, true, false, true, true, false, true, true, true, true],
  [true, true, true, true, false, false, false, false, true, true, true, true],
  [true, true, true, true, true, true, true, true, true, true, true, true],
  [true, true, true, true, true, true, true, true, true, true, true, true],
  [true, true, true, true, true, true, true, true, true, true, true, true],
  [true, true, true, true, true, true, true, true, true, true, true, true],
];

// Map 8: Ruins — scattered pillars
const RUINS: boolean[][] = [
  [true, true, true, true, true, true, true, true, true, true, true, true],
  [true, true, true, true, true, true, true, true, true, true, true, true],
  [true, true, false, true, true, true, true, true, true, false, true, true],
  [true, true, true, true, true, false, false, true, true, true, true, true],
  [true, true, true, true, false, true, true, false, true, true, true, true],
  [true, true, true, true, true, true, true, true, true, true, true, true],
  [true, true, true, true, true, true, true, true, true, true, true, true],
  [true, true, true, true, false, true, true, false, true, true, true, true],
  [true, true, true, true, true, false, false, true, true, true, true, true],
  [true, true, false, true, true, true, true, true, true, false, true, true],
  [true, true, true, true, true, true, true, true, true, true, true, true],
  [true, true, true, true, true, true, true, true, true, true, true, true],
];

export const MAP_LAYOUTS: MapLayout[] = [
  { name: "Open Fields", grid: OPEN_FIELDS },
  { name: "Mountain Pass", grid: MOUNTAIN_PASS },
  { name: "Forest Maze", grid: FOREST_MAZE },
  { name: "Islands", grid: ISLANDS },
  { name: "Crossroads", grid: CROSSROADS },
  { name: "Canyon", grid: CANYON },
  { name: "Wall", grid: WALL },
  { name: "Ruins", grid: RUINS },
];

export const TEST_MAP: MapLayout = {
  name: "Test Map",
  grid: Array.from({ length: 12 }, () => Array(12).fill(true)),
};

// Random map selection
export function getRandomMap(): MapLayout {
  return MAP_LAYOUTS[Math.floor(Math.random() * MAP_LAYOUTS.length)];
}
