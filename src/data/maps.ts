// ============================================================
//  MAPS — predefined symmetrical map layouts
// ============================================================
// true = walkable/placement, false = unwalkable

export interface MapLayout {
  name: string;
  grid: boolean[][]; // [row][col], 6 rows x 10 cols
}

// Map 1: Open fields with a central river
const OPEN_FIELDS: boolean[][] = [
  [true, true, true, true, false, false, true, true, true, true],
  [true, true, true, false, false, false, false, true, true, true],
  [true, true, true, true, true, true, true, true, true, true],
  [true, true, true, true, true, true, true, true, true, true],
  [true, true, true, false, false, false, false, true, true, true],
  [true, true, true, true, false, false, true, true, true, true],
];

// Map 2: Mountain pass — mountains in center create two corridors
const MOUNTAIN_PASS: boolean[][] = [
  [true, true, false, false, false, false, false, false, true, true],
  [true, true, false, true, true, true, true, false, true, true],
  [true, true, true, true, true, true, true, true, true, true],
  [true, true, true, true, true, true, true, true, true, true],
  [true, true, false, true, true, true, true, false, true, true],
  [true, true, false, false, false, false, false, false, true, true],
];

// Map 3: Forest maze — winding paths through dense forest
const FOREST_MAZE: boolean[][] = [
  [true, false, true, true, true, true, true, true, false, true],
  [true, false, true, false, false, false, false, true, false, true],
  [true, true, true, false, true, true, false, true, true, true],
  [true, true, true, false, true, true, false, true, true, true],
  [true, false, true, false, false, false, false, true, false, true],
  [true, false, true, true, true, true, true, true, false, true],
];

// Map 4: Islands — water channels creating strategic chokepoints
const ISLANDS: boolean[][] = [
  [true, true, true, false, true, true, false, true, true, true],
  [true, true, true, false, true, true, false, true, true, true],
  [false, false, true, true, true, true, true, true, false, false],
  [false, false, true, true, true, true, true, true, false, false],
  [true, true, true, false, true, true, false, true, true, true],
  [true, true, true, false, true, true, false, true, true, true],
];

// Map 5: Crossroads — open center with corner forests
const CROSSROADS: boolean[][] = [
  [true, true, false, true, true, true, true, false, true, true],
  [true, true, false, true, true, true, true, false, true, true],
  [false, false, false, true, true, true, true, false, false, false],
  [false, false, false, true, true, true, true, false, false, false],
  [true, true, false, true, true, true, true, false, true, true],
  [true, true, false, true, true, true, true, false, true, true],
];

// Map 6: Canyon — narrow central canyon with wide flanks
const CANYON: boolean[][] = [
  [true, true, true, true, true, true, true, true, true, true],
  [true, true, true, true, false, false, true, true, true, true],
  [true, true, true, false, false, false, false, true, true, true],
  [true, true, true, false, false, false, false, true, true, true],
  [true, true, true, true, false, false, true, true, true, true],
  [true, true, true, true, true, true, true, true, true, true],
];

// Map 7: Wall — long central wall with two gaps
const WALL: boolean[][] = [
  [true, true, true, true, true, true, true, true, true, true],
  [true, true, true, true, true, true, true, true, true, true],
  [true, true, false, false, false, false, false, false, true, true],
  [true, true, false, false, false, false, false, false, true, true],
  [true, true, true, true, true, true, true, true, true, true],
  [true, true, true, true, true, true, true, true, true, true],
];

// Map 8: Checkerboard — alternating walkable/unwalkable
const CHECKERBOARD: boolean[][] = [
  [true, false, true, false, true, true, false, true, false, true],
  [false, true, false, true, false, false, true, false, true, false],
  [true, false, true, false, true, true, false, true, false, true],
  [true, false, true, false, true, true, false, true, false, true],
  [false, true, false, true, false, false, true, false, true, false],
  [true, false, true, false, true, true, false, true, false, true],
];

export const MAP_LAYOUTS: MapLayout[] = [
  { name: "Open Fields", grid: OPEN_FIELDS },
  { name: "Mountain Pass", grid: MOUNTAIN_PASS },
  { name: "Forest Maze", grid: FOREST_MAZE },
  { name: "Islands", grid: ISLANDS },
  { name: "Crossroads", grid: CROSSROADS },
  { name: "Canyon", grid: CANYON },
  { name: "Wall", grid: WALL },
  { name: "Checkerboard", grid: CHECKERBOARD },
];

// Random map selection
export function getRandomMap(): MapLayout {
  return MAP_LAYOUTS[Math.floor(Math.random() * MAP_LAYOUTS.length)];
}
