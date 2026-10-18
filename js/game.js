(() => {
  "use strict";

  const DIFFICULTY_CLUES = {
    "4x4": { easy: 10, medium: 8, hard: 6 },
    "6x6": { easy: 22, medium: 16, hard: 12 },
    "9x9": { easy: 42, medium: 32, hard: 24 },
  };

  const SIMPLE_CLUES = {
    "2x2": { min: 1, max: 2 },
    "3x3": { min: 3, max: 5 },
  };

  /** sizeKey -> board geometry
   *  2×2 / 3×3: one region (latin square)
   *  4×4: boxes 2×2 | 6×6: boxes 2×3 | 9×9: boxes 3×3
   */
  const SIZE_CONFIG = {
    "2x2": { rows: 2, cols: 2, maxNum: 2, boxRows: 1, boxCols: 1 },
    "3x3": { rows: 3, cols: 3, maxNum: 3, boxRows: 1, boxCols: 1 },
    "4x4": { rows: 4, cols: 4, maxNum: 4, boxRows: 2, boxCols: 2 },
    "6x6": { rows: 6, cols: 6, maxNum: 6, boxRows: 2, boxCols: 3 },
    "9x9": { rows: 9, cols: 9, maxNum: 9, boxRows: 3, boxCols: 3 },
  };

  const state = {
    sizeKey: null,
    difficulty: null,
    rows: 0,
    cols: 0,
    maxNum: 0,
    boxRows: 1,
    boxCols: 1,
    solution: [],
    puzzle: [],
    board: [],
    given: [],
    selected: -1,
  };

  const el = {
    home: document.getElementById("screen-home"),
    game: document.getElementById("screen-game"),
    difficultyBlock: document.getElementById("difficulty-block"),
    btnStart: document.getElementById("btn-start"),
    board: document.getElementById("board"),
    picker: document.getElementById("picker"),
    pickerNums: document.getElementById("picker-nums"),
    metaSize: document.getElementById("meta-size"),
    metaDiff: document.getElementById("meta-diff"),
    gameTip: document.getElementById("game-tip"),
    winModal: document.getElementById("win-modal"),
    btnHint: document.getElementById("btn-hint"),
    btnHome: document.getElementById("btn-home"),
    btnErase: document.getElementById("btn-erase"),
    btnAgain: document.getElementById("btn-again"),
    btnWinHome: document.getElementById("btn-win-home"),
  };

  function needsDifficulty(sizeKey) {
    return sizeKey === "4x4" || sizeKey === "6x6" || sizeKey === "9x9";
  }

  function regionTone(r, c) {
    if (state.boxRows <= 1 && state.boxCols <= 1) return 0;
    const br = Math.floor(r / state.boxRows);
    const bc = Math.floor(c / state.boxCols);
    return (br + bc) % 2;
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function idx(r, c) {
    return r * state.cols + c;
  }

  function cellRC(i) {
    return { r: Math.floor(i / state.cols), c: i % state.cols };
  }

  function isValidPlacement(grid, r, c, num) {
    for (let i = 0; i < state.cols; i += 1) {
      if (grid[idx(r, i)] === num) return false;
    }
    for (let i = 0; i < state.rows; i += 1) {
      if (grid[idx(i, c)] === num) return false;
    }
    if (state.boxRows > 1 || state.boxCols > 1) {
      const br = Math.floor(r / state.boxRows) * state.boxRows;
      const bc = Math.floor(c / state.boxCols) * state.boxCols;
      for (let rr = br; rr < br + state.boxRows; rr += 1) {
        for (let cc = bc; cc < bc + state.boxCols; cc += 1) {
          if (grid[idx(rr, cc)] === num) return false;
        }
      }
    }
    return true;
  }

  function solveGrid(grid) {
    const empty = grid.indexOf(0);
    if (empty === -1) return true;
    const { r, c } = cellRC(empty);
    const nums = shuffle([...Array(state.maxNum)].map((_, i) => i + 1));
    for (const num of nums) {
      if (isValidPlacement(grid, r, c, num)) {
        grid[empty] = num;
        if (solveGrid(grid)) return true;
        grid[empty] = 0;
      }
    }
    return false;
  }

  function generateSquareSolution() {
    const grid = Array(state.rows * state.cols).fill(0);

    // Mini boards (2×2 / 3×3): one region only — latin square by rows & cols
    if (state.boxRows <= 1 && state.boxCols <= 1) {
      solveGrid(grid);
      return grid;
    }

    // Seed boxes for faster fill
    if (state.rows === 9) {
      for (let b = 0; b < 3; b += 1) {
        const nums = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
        let k = 0;
        for (let r = 0; r < 3; r += 1) {
          for (let c = 0; c < 3; c += 1) {
            grid[idx(b * 3 + r, b * 3 + c)] = nums[k++];
          }
        }
      }
    } else if (state.rows === 6) {
      // Fill first band of 2×3 boxes
      for (let bc = 0; bc < 2; bc += 1) {
        const nums = shuffle([1, 2, 3, 4, 5, 6]);
        let k = 0;
        for (let r = 0; r < 2; r += 1) {
          for (let c = 0; c < 3; c += 1) {
            grid[idx(r, bc * 3 + c)] = nums[k++];
          }
        }
      }
    } else if (state.rows === 4) {
      for (let b = 0; b < 2; b += 1) {
        const nums = shuffle([1, 2, 3, 4]);
        let k = 0;
        for (let r = 0; r < 2; r += 1) {
          for (let c = 0; c < 2; c += 1) {
            grid[idx(b * 2 + r, b * 2 + c)] = nums[k++];
          }
        }
      }
    }

    if (!solveGrid(grid)) {
      const blank = Array(state.rows * state.cols).fill(0);
      solveGrid(blank);
      return blank;
    }
    return grid;
  }

  function carvePuzzle(solution) {
    const puzzle = solution.slice();
    const positions = shuffle([...Array(puzzle.length)].map((_, i) => i));

    if (!needsDifficulty(state.sizeKey)) {
      const range = SIMPLE_CLUES[state.sizeKey];
      const keep = range.min + Math.floor(Math.random() * (range.max - range.min + 1));
      const removeCount = puzzle.length - keep;
      for (let i = 0; i < removeCount; i += 1) {
        puzzle[positions[i]] = 0;
      }
      return puzzle;
    }

    // Kids-friendly: remove cells until clue target — keeps generation instant on phones
    const targetClues = DIFFICULTY_CLUES[state.sizeKey][state.difficulty];
    let clues = puzzle.length;
    for (const pos of positions) {
      if (clues <= targetClues) break;
      puzzle[pos] = 0;
      clues -= 1;
    }
    return puzzle;
  }

  function configureBoard(sizeKey, difficulty) {
    const cfg = SIZE_CONFIG[sizeKey];
    state.sizeKey = sizeKey;
    state.difficulty = difficulty;
    state.rows = cfg.rows;
    state.cols = cfg.cols;
    state.maxNum = cfg.maxNum;
    state.boxRows = cfg.boxRows;
    state.boxCols = cfg.boxCols;
    state.solution = generateSquareSolution();
    state.puzzle = carvePuzzle(state.solution);
    state.board = state.puzzle.slice();
    state.given = state.puzzle.map((v) => v !== 0);
    state.selected = -1;
  }

  function updateHomeSelection() {
    document.querySelectorAll(".size-card").forEach((btn) => {
      btn.classList.toggle("is-selected", btn.dataset.size === state.sizeKey);
    });

    const showDiff = needsDifficulty(state.sizeKey);
    el.difficultyBlock.classList.toggle("is-hidden", !showDiff);

    document.querySelectorAll(".diff-btn").forEach((btn) => {
      btn.classList.toggle("is-selected", btn.dataset.diff === state.difficulty);
    });

    const canStart =
      state.sizeKey &&
      (!needsDifficulty(state.sizeKey) || state.difficulty);
    el.btnStart.classList.toggle("is-hidden", !canStart);
  }

  function showScreen(name) {
    el.home.classList.toggle("is-hidden", name !== "home");
    el.game.classList.toggle("is-hidden", name !== "game");
    if (name === "home") {
      el.winModal.classList.add("is-hidden");
      el.picker.classList.add("is-hidden");
    }
  }

  function conflictsAt(index, value) {
    if (!value) return false;
    const { r, c } = cellRC(index);
    for (let i = 0; i < state.cols; i += 1) {
      const j = idx(r, i);
      if (j !== index && state.board[j] === value) return true;
    }
    if (state.rows > 1) {
      for (let i = 0; i < state.rows; i += 1) {
        const j = idx(i, c);
        if (j !== index && state.board[j] === value) return true;
      }
      const br = Math.floor(r / state.boxRows) * state.boxRows;
      const bc = Math.floor(c / state.boxCols) * state.boxCols;
      for (let rr = br; rr < br + state.boxRows; rr += 1) {
        for (let cc = bc; cc < bc + state.boxCols; cc += 1) {
          const j = idx(rr, cc);
          if (j !== index && state.board[j] === value) return true;
        }
      }
    }
    return false;
  }

  function usedNumbersInUnit(index) {
    const used = new Set();
    const { r, c } = cellRC(index);

    for (let i = 0; i < state.cols; i += 1) {
      const j = idx(r, i);
      if (j !== index && state.board[j]) used.add(state.board[j]);
    }

    if (state.rows > 1) {
      for (let i = 0; i < state.rows; i += 1) {
        const j = idx(i, c);
        if (j !== index && state.board[j]) used.add(state.board[j]);
      }
      const br = Math.floor(r / state.boxRows) * state.boxRows;
      const bc = Math.floor(c / state.boxCols) * state.boxCols;
      for (let rr = br; rr < br + state.boxRows; rr += 1) {
        for (let cc = bc; cc < bc + state.boxCols; cc += 1) {
          const j = idx(rr, cc);
          if (j !== index && state.board[j]) used.add(state.board[j]);
        }
      }
    }

    return used;
  }

  function renderPicker() {
    if (state.selected < 0 || state.given[state.selected]) {
      el.picker.classList.add("is-hidden");
      return;
    }

    el.picker.classList.remove("is-hidden");
    const pickerClass =
      state.maxNum <= 2
        ? "picker__nums--2"
        : state.maxNum === 3
          ? "picker__nums--3"
          : state.maxNum === 4
            ? "picker__nums--4"
            : state.maxNum === 6
              ? "picker__nums--6"
              : "picker__nums--9";
    el.pickerNums.className = `picker__nums ${pickerClass}`;
    el.pickerNums.innerHTML = "";

    const used = usedNumbersInUnit(state.selected);

    for (let n = 1; n <= state.maxNum; n += 1) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "num-btn";
      btn.textContent = String(n);
      btn.setAttribute("aria-label", `Chọn số ${n}`);
      if (used.has(n)) {
        btn.classList.add("is-used");
        btn.title = "Số này đã có rồi";
      }
      btn.addEventListener("click", () => placeNumber(n));
      el.pickerNums.appendChild(btn);
    }
  }

  function renderBoard() {
    el.board.innerHTML = "";
    el.board.className = "board";

    if (state.sizeKey === "2x2") {
      el.board.classList.add("board--2");
    } else if (state.sizeKey === "3x3") {
      el.board.classList.add("board--3");
    } else if (state.sizeKey === "4x4") {
      el.board.classList.add("board--4");
    } else if (state.sizeKey === "6x6") {
      el.board.classList.add("board--6");
    } else {
      el.board.classList.add("board--9");
    }

    const hasRegions = state.boxRows > 1 || state.boxCols > 1;

    for (let i = 0; i < state.board.length; i += 1) {
      const cell = document.createElement("button");
      cell.type = "button";
      cell.className = "cell";
      cell.dataset.index = String(i);
      cell.setAttribute("role", "gridcell");

      const { r, c } = cellRC(i);
      if (hasRegions) {
        cell.classList.add(`cell--region-${regionTone(r, c)}`);
      }

      const value = state.board[i];
      cell.textContent = value ? String(value) : "";

      if (state.given[i]) {
        cell.classList.add("cell--given");
        cell.setAttribute("aria-label", `Ô có sẵn số ${value}`);
      } else {
        cell.classList.add("cell--editable");
        cell.setAttribute(
          "aria-label",
          value ? `Ô số ${value}, chạm để đổi` : "Ô trống, chạm để chọn số"
        );
      }

      if (i === state.selected) cell.classList.add("cell--selected");
      if (value && conflictsAt(i, value)) cell.classList.add("cell--bad");

      cell.addEventListener("click", () => selectCell(i));
      el.board.appendChild(cell);
    }

    renderPicker();
  }

  function selectCell(i) {
    if (state.given[i]) {
      state.selected = -1;
      el.gameTip.textContent = "Ô này đã có sẵn rồi — chọn ô trống nhé!";
      renderBoard();
      return;
    }
    state.selected = i;
    el.gameTip.textContent = "Chọn một số bên dưới nào!";
    renderBoard();
  }

  function placeNumber(n) {
    if (state.selected < 0 || state.given[state.selected]) return;

    const i = state.selected;
    state.board[i] = n;
    renderBoard();

    const cell = el.board.querySelector(`[data-index="${i}"]`);
    if (!cell) return;

    if (conflictsAt(i, n) || n !== state.solution[i]) {
      cell.classList.add("cell--bad");
      el.gameTip.textContent = "Úi, thử số khác xem nào!";
      return;
    }

    cell.classList.add("cell--ok");
    el.gameTip.textContent = "Đúng rồi! Tiếp tục nào ✨";

    if (isComplete()) {
      setTimeout(showWin, 350);
    }
  }

  function eraseSelected() {
    if (state.selected < 0 || state.given[state.selected]) return;
    state.board[state.selected] = 0;
    el.gameTip.textContent = "Đã xóa — chọn số mới nhé!";
    renderBoard();
  }

  function isComplete() {
    for (let i = 0; i < state.board.length; i += 1) {
      if (state.board[i] !== state.solution[i]) return false;
    }
    return true;
  }

  function showWin() {
    el.winModal.classList.remove("is-hidden");
    el.picker.classList.add("is-hidden");
  }

  function applyHint() {
    const empties = [];
    for (let i = 0; i < state.board.length; i += 1) {
      if (!state.given[i] && state.board[i] !== state.solution[i]) {
        empties.push(i);
      }
    }
    if (!empties.length) {
      el.gameTip.textContent = "Không còn ô cần gợi ý nữa!";
      return;
    }

    const i = empties[Math.floor(Math.random() * empties.length)];
    state.board[i] = state.solution[i];
    state.selected = i;
    el.gameTip.textContent = "Gợi ý đây rồi — bé học theo nhé!";
    renderBoard();

    const cell = el.board.querySelector(`[data-index="${i}"]`);
    if (cell) cell.classList.add("cell--hint", "cell--ok");

    if (isComplete()) {
      setTimeout(showWin, 450);
    }
  }

  function startGame() {
    configureBoard(state.sizeKey, state.difficulty);
    el.metaSize.textContent = state.sizeKey.replace("x", "×");
    if (needsDifficulty(state.sizeKey)) {
      el.metaDiff.textContent =
        state.difficulty.charAt(0).toUpperCase() + state.difficulty.slice(1);
      el.metaDiff.classList.remove("is-hidden");
    } else {
      el.metaDiff.classList.add("is-hidden");
    }
    el.gameTip.textContent = "Chạm vào ô trống, rồi chọn số nhé!";
    el.winModal.classList.add("is-hidden");
    showScreen("game");
    renderBoard();
  }

  function goHome() {
    showScreen("home");
    updateHomeSelection();
  }

  // Events
  document.querySelectorAll(".size-card").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.sizeKey = btn.dataset.size;
      if (!needsDifficulty(state.sizeKey)) {
        state.difficulty = null;
      } else if (!state.difficulty) {
        state.difficulty = "easy";
      }
      updateHomeSelection();
    });
  });

  document.querySelectorAll(".diff-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.difficulty = btn.dataset.diff;
      updateHomeSelection();
    });
  });

  el.btnStart.addEventListener("click", startGame);
  el.btnHome.addEventListener("click", goHome);
  el.btnWinHome.addEventListener("click", goHome);
  el.btnAgain.addEventListener("click", startGame);
  el.btnHint.addEventListener("click", applyHint);
  el.btnErase.addEventListener("click", eraseSelected);

  updateHomeSelection();
})();
