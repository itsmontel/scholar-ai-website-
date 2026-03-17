/**
 * 6x6 Sudoku puzzle generator and validator.
 * Uses 2x3 boxes (2 rows, 3 columns per box).
 */

export interface SudokuPuzzle {
  solution: number[][];
  initialGrid: (number | null)[][];
}

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function isValidPlacement(grid: number[][], row: number, col: number, num: number): boolean {
  for (let c = 0; c < 6; c++) {
    if (grid[row][c] === num) return false;
  }
  for (let r = 0; r < 6; r++) {
    if (grid[r][col] === num) return false;
  }
  const boxRow = Math.floor(row / 2) * 2;
  const boxCol = Math.floor(col / 3) * 3;
  for (let r = boxRow; r < boxRow + 2; r++) {
    for (let c = boxCol; c < boxCol + 3; c++) {
      if (grid[r][c] === num) return false;
    }
  }
  return true;
}

function fillGrid(grid: number[][]): boolean {
  for (let row = 0; row < 6; row++) {
    for (let col = 0; col < 6; col++) {
      if (grid[row][col] === 0) {
        const numbers = shuffle([1, 2, 3, 4, 5, 6]);
        for (const num of numbers) {
          if (isValidPlacement(grid, row, col, num)) {
            grid[row][col] = num;
            if (fillGrid(grid)) return true;
            grid[row][col] = 0;
          }
        }
        return false;
      }
    }
  }
  return true;
}

function isValidSolution(grid: number[][]): boolean {
  for (let row = 0; row < 6; row++) {
    const seen = new Set<number>();
    for (let col = 0; col < 6; col++) {
      const n = grid[row][col];
      if (n < 1 || n > 6 || seen.has(n)) return false;
      seen.add(n);
    }
  }
  for (let col = 0; col < 6; col++) {
    const seen = new Set<number>();
    for (let row = 0; row < 6; row++) {
      const n = grid[row][col];
      if (n < 1 || n > 6 || seen.has(n)) return false;
      seen.add(n);
    }
  }
  for (let br = 0; br < 6; br += 2) {
    for (let bc = 0; bc < 6; bc += 3) {
      const seen = new Set<number>();
      for (let r = br; r < br + 2; r++) {
        for (let c = bc; c < bc + 3; c++) {
          const n = grid[r][c];
          if (n < 1 || n > 6 || seen.has(n)) return false;
          seen.add(n);
        }
      }
    }
  }
  return true;
}

export function generateSudoku(hardMode = false): SudokuPuzzle {
  const solution = Array(6)
    .fill(0)
    .map(() => Array(6).fill(0));
  if (!fillGrid(solution)) {
    solution[0] = [1, 2, 3, 4, 5, 6];
    solution[1] = [4, 5, 6, 1, 2, 3];
    solution[2] = [2, 3, 1, 5, 6, 4];
    solution[3] = [5, 6, 4, 2, 3, 1];
    solution[4] = [3, 1, 2, 6, 4, 5];
    solution[5] = [6, 4, 5, 3, 1, 2];
  } else if (!isValidSolution(solution)) {
    solution[0] = [1, 2, 3, 4, 5, 6];
    solution[1] = [4, 5, 6, 1, 2, 3];
    solution[2] = [2, 3, 1, 5, 6, 4];
    solution[3] = [5, 6, 4, 2, 3, 1];
    solution[4] = [3, 1, 2, 6, 4, 5];
    solution[5] = [6, 4, 5, 3, 1, 2];
  }

  const cellsToRemove = hardMode ? 16 + Math.floor(Math.random() * 5) : 8 + Math.floor(Math.random() * 5);
  const puzzle: (number | null)[][] = solution.map((row) => row.map((v) => v));
  let removed = 0;
  while (removed < cellsToRemove) {
    const row = Math.floor(Math.random() * 6);
    const col = Math.floor(Math.random() * 6);
    if (puzzle[row][col] !== null) {
      puzzle[row][col] = null;
      removed++;
    }
  }
  return { solution, initialGrid: puzzle };
}

export function isValidMove(
  puzzle: SudokuPuzzle,
  grid: (number | null)[][],
  row: number,
  col: number,
  num: number
): boolean {
  for (let c = 0; c < 6; c++) {
    if (c !== col && grid[row][c] === num) return false;
  }
  for (let r = 0; r < 6; r++) {
    if (r !== row && grid[r][col] === num) return false;
  }
  const boxRow = Math.floor(row / 2) * 2;
  const boxCol = Math.floor(col / 3) * 3;
  for (let r = boxRow; r < boxRow + 2; r++) {
    for (let c = boxCol; c < boxCol + 3; c++) {
      if ((r !== row || c !== col) && grid[r][c] === num) return false;
    }
  }
  return true;
}

/** Validates that the grid is a complete, valid 6x6 Sudoku (any correct solution passes). */
export function isSudokuComplete(_puzzle: SudokuPuzzle, grid: (number | null)[][]): boolean {
  for (let r = 0; r < 6; r++) {
    for (let c = 0; c < 6; c++) {
      const n = grid[r][c];
      if (n === null || n < 1 || n > 6) return false;
    }
  }
  for (let r = 0; r < 6; r++) {
    const seen = new Set<number>();
    for (let c = 0; c < 6; c++) {
      const n = grid[r][c]!;
      if (seen.has(n)) return false;
      seen.add(n);
    }
  }
  for (let c = 0; c < 6; c++) {
    const seen = new Set<number>();
    for (let r = 0; r < 6; r++) {
      const n = grid[r][c]!;
      if (seen.has(n)) return false;
      seen.add(n);
    }
  }
  for (let br = 0; br < 6; br += 2) {
    for (let bc = 0; bc < 6; bc += 3) {
      const seen = new Set<number>();
      for (let r = br; r < br + 2; r++) {
        for (let c = bc; c < bc + 3; c++) {
          const n = grid[r][c]!;
          if (seen.has(n)) return false;
          seen.add(n);
        }
      }
    }
  }
  return true;
}
