(() => {
  "use strict";

  const STORAGE_KEY = "sudoku-kids-v1";
  const MAX_MISTAKES = 3;
  const MAX_HINTS = 3;

  const DIFFICULTY_CLUES = {
    "4x4": { easy: 10, medium: 8, hard: 6 },
    "9x9": { easy: 42, medium: 32, hard: 24 },
  };

  const SIMPLE_CLUES = {
    "2x2": { min: 1, max: 2 },
    "3x3": { min: 3, max: 5 },
  };

  const SIZE_CONFIG = {
    "2x2": { rows: 2, cols: 2, maxNum: 2, boxRows: 1, boxCols: 1 },
    "3x3": { rows: 3, cols: 3, maxNum: 3, boxRows: 1, boxCols: 1 },
    "4x4": { rows: 4, cols: 4, maxNum: 4, boxRows: 2, boxCols: 2 },
    "9x9": { rows: 9, cols: 9, maxNum: 9, boxRows: 3, boxCols: 3 },
  };

  const SCORE_BASE = {
    "2x2": 20,
    "3x3": 40,
    "4x4": 80,
    "9x9": 220,
  };

  const DIFF_MULT = { easy: 1, medium: 1.35, hard: 1.7, none: 1 };

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
    history: [],
    mistakes: 0,
    hintsLeft: MAX_HINTS,
    sessionScore: 0,
    elapsedSec: 0,
    timerId: null,
    paused: false,
    ended: false,
  };

  const el = {
    home: document.getElementById("screen-home"),
    game: document.getElementById("screen-game"),
    difficultyBlock: document.getElementById("difficulty-block"),
    btnStart: document.getElementById("btn-start"),
    board: document.getElementById("board"),
    numpad: document.getElementById("numpad"),
    metaSize: document.getElementById("meta-size"),
    metaDiff: document.getElementById("meta-diff"),
    metaMistakes: document.getElementById("meta-mistakes"),
    metaTimer: document.getElementById("meta-timer"),
    sessionScore: document.getElementById("session-score"),
    homeScoreValue: document.getElementById("home-score-value"),
    hintBadge: document.getElementById("hint-badge"),
    winModal: document.getElementById("win-modal"),
    pauseModal: document.getElementById("pause-modal"),
    retryModal: document.getElementById("retry-modal"),
    winPoints: document.getElementById("win-points"),
    winMessage: document.getElementById("win-message"),
    btnHint: document.getElementById("btn-hint"),
    btnHome: document.getElementById("btn-home"),
    btnErase: document.getElementById("btn-erase"),
    btnUndo: document.getElementById("btn-undo"),
    btnPause: document.getElementById("btn-pause"),
    btnResume: document.getElementById("btn-resume"),
    btnPauseHome: document.getElementById("btn-pause-home"),
    btnAgain: document.getElementById("btn-again"),
    btnWinHome: document.getElementById("btn-win-home"),
    btnRetry: document.getElementById("btn-retry"),
    btnRetryHome: document.getElementById("btn-retry-home"),
  };

  function loadStats() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { totalScore: 0, bestSession: 0, gamesWon: 0 };
      const data = JSON.parse(raw);
      return {
        totalScore: Number(data.totalScore) || 0,
        bestSession: Number(data.bestSession) || 0,
        gamesWon: Number(data.gamesWon) || 0,
      };
    } catch {
      return { totalScore: 0, bestSession: 0, gamesWon: 0 };
    }
  }

  function saveStats(stats) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  }

  function refreshHomeScore() {
    const stats = loadStats();
    el.homeScoreValue.textContent = String(stats.totalScore);
  }

  function needsDifficulty(sizeKey) {
    return sizeKey === "4x4" || sizeKey === "9x9";
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

    if (state.boxRows <= 1 && state.boxCols <= 1) {
      solveGrid(grid);
      return grid;
    }

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
    state.history = [];
    state.mistakes = 0;
    state.hintsLeft = MAX_HINTS;
    state.sessionScore = 0;
    state.elapsedSec = 0;
    state.paused = false;
    state.ended = false;
  }

  function formatTime(sec) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  function stopTimer() {
    if (state.timerId) {
      clearInterval(state.timerId);
      state.timerId = null;
    }
  }

  function startTimer() {
    stopTimer();
    state.timerId = setInterval(() => {
      if (state.paused || state.ended) return;
      state.elapsedSec += 1;
      el.metaTimer.textContent = formatTime(state.elapsedSec);
    }, 1000);
  }

  function updateHud() {
    el.sessionScore.textContent = String(state.sessionScore);
    el.metaMistakes.textContent = `${state.mistakes}/${MAX_MISTAKES}`;
    el.metaTimer.textContent = formatTime(state.elapsedSec);
    el.hintBadge.textContent = String(state.hintsLeft);
    el.btnHint.disabled = state.hintsLeft <= 0 || state.ended || state.paused;
    el.btnUndo.disabled = !state.history.length || state.ended || state.paused;
    el.btnErase.disabled = state.ended || state.paused;
    el.btnHint.classList.toggle("is-disabled", el.btnHint.disabled);
    el.btnUndo.classList.toggle("is-disabled", el.btnUndo.disabled);
  }

  function addScore(delta) {
    state.sessionScore = Math.max(0, state.sessionScore + delta);
    updateHud();
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

  function hideModals() {
    el.winModal.classList.add("is-hidden");
    el.pauseModal.classList.add("is-hidden");
    el.retryModal.classList.add("is-hidden");
  }

  function showScreen(name) {
    el.home.classList.toggle("is-hidden", name !== "home");
    el.game.classList.toggle("is-hidden", name !== "game");
    if (name === "home") {
      hideModals();
      stopTimer();
      refreshHomeScore();
    }
  }

  function conflictsAt(index, value) {
    if (!value) return false;
    const { r, c } = cellRC(index);
    for (let i = 0; i < state.cols; i += 1) {
      const j = idx(r, i);
      if (j !== index && state.board[j] === value) return true;
    }
    for (let i = 0; i < state.rows; i += 1) {
      const j = idx(i, c);
      if (j !== index && state.board[j] === value) return true;
    }
    if (state.boxRows > 1 || state.boxCols > 1) {
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
    if (index < 0) return used;
    const { r, c } = cellRC(index);

    for (let i = 0; i < state.cols; i += 1) {
      const j = idx(r, i);
      if (j !== index && state.board[j]) used.add(state.board[j]);
    }
    for (let i = 0; i < state.rows; i += 1) {
      const j = idx(i, c);
      if (j !== index && state.board[j]) used.add(state.board[j]);
    }
    if (state.boxRows > 1 || state.boxCols > 1) {
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

  function isRelated(i, selected) {
    if (selected < 0 || i === selected) return false;
    const a = cellRC(i);
    const b = cellRC(selected);
    if (a.r === b.r || a.c === b.c) return true;
    if (state.boxRows > 1 || state.boxCols > 1) {
      const brA = Math.floor(a.r / state.boxRows);
      const bcA = Math.floor(a.c / state.boxCols);
      const brB = Math.floor(b.r / state.boxRows);
      const bcB = Math.floor(b.c / state.boxCols);
      if (brA === brB && bcA === bcB) return true;
    }
    return false;
  }

  function renderNumpad() {
    const padClass =
      state.maxNum <= 2
        ? "numpad--2"
        : state.maxNum === 3
          ? "numpad--3"
          : state.maxNum === 4
            ? "numpad--4"
            : "numpad--9";
    el.numpad.className = `numpad ${padClass}`;
    el.numpad.innerHTML = "";

    const used =
      state.selected >= 0 && !state.given[state.selected]
        ? usedNumbersInUnit(state.selected)
        : new Set();

    for (let n = 1; n <= state.maxNum; n += 1) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "num-btn";
      btn.textContent = String(n);
      btn.setAttribute("aria-label", `Chọn số ${n}`);
      if (used.has(n)) btn.classList.add("is-used");
      btn.disabled = state.ended || state.paused || state.selected < 0 || state.given[state.selected];
      btn.addEventListener("click", () => placeNumber(n));
      el.numpad.appendChild(btn);
    }
  }

  function renderBoard() {
    el.board.innerHTML = "";
    el.board.className = "board";

    if (state.sizeKey === "2x2") el.board.classList.add("board--2");
    else if (state.sizeKey === "3x3") el.board.classList.add("board--3");
    else if (state.sizeKey === "4x4") el.board.classList.add("board--4");
    else el.board.classList.add("board--9");

    for (let i = 0; i < state.board.length; i += 1) {
      const cell = document.createElement("button");
      cell.type = "button";
      cell.className = "cell";
      cell.dataset.index = String(i);
      cell.setAttribute("role", "gridcell");

      const value = state.board[i];
      cell.textContent = value ? String(value) : "";

      if (state.given[i]) {
        cell.classList.add("cell--given");
      } else {
        cell.classList.add("cell--editable");
        if (value) cell.classList.add("cell--user");
      }

      if (i === state.selected) cell.classList.add("cell--selected");
      else if (isRelated(i, state.selected)) cell.classList.add("cell--related");
      if (value && conflictsAt(i, value)) cell.classList.add("cell--bad");

      cell.addEventListener("click", () => selectCell(i));
      el.board.appendChild(cell);
    }

    renderNumpad();
    updateHud();
  }

  function selectCell(i) {
    if (state.ended || state.paused) return;
    if (state.given[i]) {
      state.selected = i;
      renderBoard();
      return;
    }
    state.selected = i;
    renderBoard();
  }

  function pushHistory(index, prev, next) {
    state.history.push({ index, prev, next });
    if (state.history.length > 80) state.history.shift();
  }

  function placeNumber(n) {
    if (state.ended || state.paused) return;
    if (state.selected < 0 || state.given[state.selected]) return;

    const i = state.selected;
    const prev = state.board[i];
    if (prev === n) return;

    pushHistory(i, prev, n);
    state.board[i] = n;
    renderBoard();

    const cell = el.board.querySelector(`[data-index="${i}"]`);
    const wrong = n !== state.solution[i] || conflictsAt(i, n);

    if (wrong) {
      if (cell) cell.classList.add("cell--bad");
      state.mistakes += 1;
      addScore(-2);
      updateHud();
      if (state.mistakes >= MAX_MISTAKES) {
        state.ended = true;
        stopTimer();
        el.retryModal.classList.remove("is-hidden");
      }
      return;
    }

    if (cell) cell.classList.add("cell--ok");
    addScore(10);

    if (isComplete()) {
      setTimeout(showWin, 350);
    }
  }

  function eraseSelected() {
    if (state.ended || state.paused) return;
    if (state.selected < 0 || state.given[state.selected]) return;
    const i = state.selected;
    const prev = state.board[i];
    if (!prev) return;
    pushHistory(i, prev, 0);
    state.board[i] = 0;
    renderBoard();
  }

  function undoMove() {
    if (state.ended || state.paused) return;
    const last = state.history.pop();
    if (!last) return;
    state.board[last.index] = last.prev;
    state.selected = last.index;
    renderBoard();
  }

  function isComplete() {
    for (let i = 0; i < state.board.length; i += 1) {
      if (state.board[i] !== state.solution[i]) return false;
    }
    return true;
  }

  function calcWinBonus() {
    const base = SCORE_BASE[state.sizeKey] || 50;
    const mult = DIFF_MULT[state.difficulty || "none"] || 1;
    const timePenalty = Math.min(40, Math.floor(state.elapsedSec / 15) * 2);
    const mistakePenalty = state.mistakes * 8;
    const hintPenalty = (MAX_HINTS - state.hintsLeft) * 10;
    return Math.max(15, Math.round(base * mult - timePenalty - mistakePenalty - hintPenalty));
  }

  function showWin() {
    if (state.ended) return;
    state.ended = true;
    stopTimer();

    const bonus = calcWinBonus();
    addScore(bonus);

    const stats = loadStats();
    stats.totalScore += state.sessionScore;
    stats.gamesWon += 1;
    if (state.sessionScore > stats.bestSession) stats.bestSession = state.sessionScore;
    saveStats(stats);

    el.winPoints.textContent = `+${state.sessionScore} điểm`;
    el.winMessage.textContent = `Hoàn thành ${state.sizeKey.replace("x", "×")} trong ${formatTime(state.elapsedSec)}!`;
    el.winModal.classList.remove("is-hidden");
    refreshHomeScore();
  }

  function applyHint() {
    if (state.ended || state.paused || state.hintsLeft <= 0) return;

    const empties = [];
    for (let i = 0; i < state.board.length; i += 1) {
      if (!state.given[i] && state.board[i] !== state.solution[i]) {
        empties.push(i);
      }
    }
    if (!empties.length) return;

    const i = empties[Math.floor(Math.random() * empties.length)];
    const prev = state.board[i];
    const next = state.solution[i];
    pushHistory(i, prev, next);
    state.board[i] = next;
    state.selected = i;
    state.hintsLeft -= 1;
    addScore(-5);
    renderBoard();

    const cell = el.board.querySelector(`[data-index="${i}"]`);
    if (cell) cell.classList.add("cell--hint", "cell--ok");

    if (isComplete()) setTimeout(showWin, 450);
  }

  function pauseGame() {
    if (state.ended) return;
    state.paused = true;
    el.pauseModal.classList.remove("is-hidden");
    updateHud();
    renderNumpad();
  }

  function resumeGame() {
    state.paused = false;
    el.pauseModal.classList.add("is-hidden");
    updateHud();
    renderNumpad();
  }

  function startGame() {
    configureBoard(state.sizeKey, state.difficulty);
    el.metaSize.textContent = state.sizeKey.replace("x", "×");
    el.metaDiff.textContent = needsDifficulty(state.sizeKey)
      ? state.difficulty.charAt(0).toUpperCase() + state.difficulty.slice(1)
      : "—";
    hideModals();
    showScreen("game");
    renderBoard();
    startTimer();
    updateHud();
  }

  function goHome() {
    state.paused = false;
    state.ended = true;
    stopTimer();
    showScreen("home");
    updateHomeSelection();
  }

  document.querySelectorAll(".size-card").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.sizeKey = btn.dataset.size;
      if (!needsDifficulty(state.sizeKey)) state.difficulty = null;
      else if (!state.difficulty) state.difficulty = "easy";
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
  el.btnPauseHome.addEventListener("click", goHome);
  el.btnRetryHome.addEventListener("click", goHome);
  el.btnAgain.addEventListener("click", startGame);
  el.btnRetry.addEventListener("click", startGame);
  el.btnHint.addEventListener("click", applyHint);
  el.btnErase.addEventListener("click", eraseSelected);
  el.btnUndo.addEventListener("click", undoMove);
  el.btnPause.addEventListener("click", pauseGame);
  el.btnResume.addEventListener("click", resumeGame);

  refreshHomeScore();
  updateHomeSelection();
})();
