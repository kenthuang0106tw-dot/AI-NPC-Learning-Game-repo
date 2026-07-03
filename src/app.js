const MAZE = [
  "###############",
  "#.....#.......#",
  "#.###.#.#####.#",
  "#...#...#.....#",
  "###.#.###.###.#",
  "#...#.....#...#",
  "#.#######.#.#.#",
  "#.....#...#.#.#",
  "#.###.#.###.#.#",
  "#.......#.....#",
  "###############",
];

const WIDTH = 15;
const HEIGHT = 11;
const ROUND_LIMIT = 60;
const START_PLAYER = { x: 1, y: 1 };
const START_NPC = { x: 13, y: 9 };
const DIRECTIONS = [
  { name: "up", dx: 0, dy: -1 },
  { name: "right", dx: 1, dy: 0 },
  { name: "down", dx: 0, dy: 1 },
  { name: "left", dx: -1, dy: 0 },
];

const state = {
  mode: "baseline",
  active: false,
  player: { ...START_PLAYER },
  npc: { ...START_NPC },
  steps: 0,
  cellVisits: createVisitGrid(),
  transitionCounts: {},
  roundResults: [],
  lastMessage: "Press Start Round, then use WASD or arrow keys to escape.",
};

const board = document.querySelector("#gameBoard");
const roundStatus = document.querySelector("#roundStatus");
const startRoundButton = document.querySelector("#startRoundButton");
const resetRoundButton = document.querySelector("#resetRoundButton");
const clearLearningButton = document.querySelector("#clearLearningButton");
const modeButtons = document.querySelectorAll("[data-mode]");
const moveButtons = document.querySelectorAll("[data-move]");
const modeNote = document.querySelector("#modeNote");
const stepCount = document.querySelector("#stepCount");
const roundLimit = document.querySelector("#roundLimit");
const memoryCount = document.querySelector("#memoryCount");
const predictionScore = document.querySelector("#predictionScore");
const baselineAverage = document.querySelector("#baselineAverage");
const learnedAverage = document.querySelector("#learnedAverage");
const escapeRate = document.querySelector("#escapeRate");
const roundLog = document.querySelector("#roundLog");

function createVisitGrid() {
  return Array.from({ length: HEIGHT }, () => Array(WIDTH).fill(0));
}

function keyOf(position) {
  return `${position.x},${position.y}`;
}

function sameCell(a, b) {
  return a.x === b.x && a.y === b.y;
}

function isWall(x, y) {
  return y < 0 || y >= HEIGHT || x < 0 || x >= WIDTH || MAZE[y][x] === "#";
}

function getNeighbors(position) {
  return DIRECTIONS
    .map((direction) => ({
      x: position.x + direction.dx,
      y: position.y + direction.dy,
      direction: direction.name,
    }))
    .filter((next) => !isWall(next.x, next.y));
}

function directionFrom(a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const match = DIRECTIONS.find((direction) => direction.dx === dx && direction.dy === dy);
  return match ? match.name : null;
}

function recordPlayerMove(from, to) {
  state.cellVisits[to.y][to.x] += 1;

  const direction = directionFrom(from, to);
  if (!direction) {
    return;
  }

  const fromKey = keyOf(from);
  if (!state.transitionCounts[fromKey]) {
    state.transitionCounts[fromKey] = { up: 0, right: 0, down: 0, left: 0 };
  }
  state.transitionCounts[fromKey][direction] += 1;
}

function shortestPathNext(start, target) {
  const queue = [{ ...start, first: null }];
  const visited = new Set([keyOf(start)]);

  while (queue.length) {
    const current = queue.shift();
    if (sameCell(current, target)) {
      return current.first || start;
    }

    for (const next of getNeighbors(current)) {
      const nextKey = keyOf(next);
      if (visited.has(nextKey)) {
        continue;
      }
      visited.add(nextKey);
      queue.push({
        ...next,
        first: current.first || { x: next.x, y: next.y },
      });
    }
  }

  return start;
}

function pathDistance(start, target) {
  if (sameCell(start, target)) {
    return 0;
  }

  const queue = [{ ...start, distance: 0 }];
  const visited = new Set([keyOf(start)]);

  while (queue.length) {
    const current = queue.shift();
    for (const next of getNeighbors(current)) {
      const nextKey = keyOf(next);
      if (visited.has(nextKey)) {
        continue;
      }
      if (sameCell(next, target)) {
        return current.distance + 1;
      }
      visited.add(nextKey);
      queue.push({ ...next, distance: current.distance + 1 });
    }
  }

  return 999;
}

function predictPlayerNextCell() {
  const transitions = state.transitionCounts[keyOf(state.player)];
  if (!transitions) {
    return state.player;
  }

  const bestDirection = Object.entries(transitions).sort((a, b) => b[1] - a[1])[0];
  if (!bestDirection || bestDirection[1] === 0) {
    return state.player;
  }

  const direction = DIRECTIONS.find((entry) => entry.name === bestDirection[0]);
  const predicted = {
    x: state.player.x + direction.dx,
    y: state.player.y + direction.dy,
  };

  return isWall(predicted.x, predicted.y) ? state.player : predicted;
}

function learnedNpcNext() {
  const predicted = predictPlayerNextCell();
  const candidates = getNeighbors(state.npc);
  let bestMove = state.npc;
  let bestScore = -Infinity;

  for (const candidate of candidates) {
    const distanceScore = 40 - pathDistance(candidate, predicted) * 6;
    const heatScore = state.cellVisits[candidate.y][candidate.x] * 3;
    const transitionScore = getTransitionBias(candidate) * 4;
    const currentPlayerScore = 20 - pathDistance(candidate, state.player) * 2;
    const score = distanceScore + heatScore + transitionScore + currentPlayerScore;

    if (score > bestScore) {
      bestScore = score;
      bestMove = { x: candidate.x, y: candidate.y };
    }
  }

  return bestMove;
}

function getTransitionBias(candidate) {
  let bias = 0;
  for (const neighbor of getNeighbors(candidate)) {
    const transitions = state.transitionCounts[keyOf(neighbor)];
    if (!transitions) {
      continue;
    }
    const direction = directionFrom(neighbor, candidate);
    bias += transitions[direction] || 0;
  }
  return bias;
}

function npcMove() {
  state.npc = state.mode === "baseline" ? shortestPathNext(state.npc, state.player) : learnedNpcNext();
}

function movePlayer(directionName) {
  if (!state.active) {
    state.lastMessage = "Start a round before moving.";
    render();
    return;
  }

  const direction = DIRECTIONS.find((entry) => entry.name === directionName);
  const next = {
    x: state.player.x + direction.dx,
    y: state.player.y + direction.dy,
  };

  if (isWall(next.x, next.y)) {
    state.lastMessage = "Wall blocked the player. Try another route.";
    render();
    return;
  }

  const previous = { ...state.player };
  state.player = next;
  state.steps += 1;
  recordPlayerMove(previous, state.player);

  if (sameCell(state.player, state.npc)) {
    finishRound("caught");
    return;
  }

  npcMove();

  if (sameCell(state.player, state.npc)) {
    finishRound("caught");
    return;
  }

  if (state.steps >= ROUND_LIMIT) {
    finishRound("escaped");
    return;
  }

  state.lastMessage =
    state.mode === "baseline"
      ? "Baseline NPC moved by shortest path."
      : "Learned NPC used route heat and transition memory.";
  render();
}

function finishRound(outcome) {
  state.active = false;
  state.roundResults.push({
    mode: state.mode,
    outcome,
    steps: state.steps,
  });
  state.lastMessage =
    outcome === "caught"
      ? `NPC caught the player in ${state.steps} steps.`
      : `Player escaped for ${ROUND_LIMIT} steps.`;
  render();
}

function startRound() {
  state.active = true;
  state.player = { ...START_PLAYER };
  state.npc = { ...START_NPC };
  state.steps = 0;
  state.cellVisits[state.player.y][state.player.x] += 1;
  state.lastMessage = "Round started. Use WASD or arrow keys to escape.";
  render();
}

function resetRound() {
  state.active = false;
  state.player = { ...START_PLAYER };
  state.npc = { ...START_NPC };
  state.steps = 0;
  state.lastMessage = "Round reset. Press Start Round when ready.";
  render();
}

function clearLearning() {
  state.cellVisits = createVisitGrid();
  state.transitionCounts = {};
  state.roundResults = [];
  state.lastMessage = "Learning memory and results cleared.";
  render();
}

function setMode(mode) {
  state.mode = mode;
  state.active = false;
  state.player = { ...START_PLAYER };
  state.npc = { ...START_NPC };
  state.steps = 0;
  state.lastMessage =
    mode === "baseline"
      ? "Baseline mode: NPC only follows shortest paths."
      : "Learned mode: NPC predicts using route heat and transitions.";
  render();
}

function getMaxVisit() {
  return Math.max(1, ...state.cellVisits.flat());
}

function countLearnedCells() {
  return state.cellVisits.flat().filter((count) => count > 0).length;
}

function calculatePredictionBias() {
  const totalTransitions = Object.values(state.transitionCounts).reduce(
    (sum, transitions) => sum + Object.values(transitions).reduce((a, b) => a + b, 0),
    0,
  );
  if (totalTransitions === 0) {
    return 0;
  }
  const strongestChoices = Object.values(state.transitionCounts).reduce(
    (sum, transitions) => sum + Math.max(...Object.values(transitions)),
    0,
  );
  return Math.round((strongestChoices / totalTransitions) * 100);
}

function averageCaptureSteps(mode) {
  const captures = state.roundResults.filter(
    (result) => result.mode === mode && result.outcome === "caught",
  );
  if (!captures.length) {
    return "--";
  }
  const average = captures.reduce((sum, result) => sum + result.steps, 0) / captures.length;
  return average.toFixed(1);
}

function getEscapeRate() {
  if (!state.roundResults.length) {
    return "--";
  }
  const escapes = state.roundResults.filter((result) => result.outcome === "escaped").length;
  return `${Math.round((escapes / state.roundResults.length) * 100)}%`;
}

function renderBoard() {
  const maxVisit = getMaxVisit();
  board.innerHTML = "";

  for (let y = 0; y < HEIGHT; y += 1) {
    for (let x = 0; x < WIDTH; x += 1) {
      const cell = document.createElement("div");
      cell.className = "cell";

      if (MAZE[y][x] === "#") {
        cell.classList.add("wall");
      } else {
        const visits = state.cellVisits[y][x];
        if (visits > 0) {
          cell.style.setProperty("--heat", (visits / maxVisit).toFixed(2));
          cell.classList.add("visited");
        }
      }

      if (state.player.x === x && state.player.y === y) {
        cell.classList.add("player");
        cell.textContent = "P";
      }

      if (state.npc.x === x && state.npc.y === y) {
        cell.classList.add("npc");
        cell.textContent = "N";
      }

      board.appendChild(cell);
    }
  }
}

function renderMetrics() {
  roundStatus.textContent = state.active ? "Running" : state.lastMessage;
  roundStatus.classList.toggle("running", state.active);
  stepCount.textContent = state.steps;
  roundLimit.textContent = ROUND_LIMIT;
  memoryCount.textContent = countLearnedCells();
  predictionScore.textContent = `${calculatePredictionBias()}%`;
  baselineAverage.textContent = averageCaptureSteps("baseline");
  learnedAverage.textContent = averageCaptureSteps("learned");
  escapeRate.textContent = getEscapeRate();
  modeNote.textContent =
    state.mode === "baseline"
      ? "Baseline uses BFS shortest path to the player's current position."
      : "Learned scores moves with shortest path, heatmap memory, and local transition habits.";

  modeButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.mode === state.mode);
  });
}

function renderRoundLog() {
  roundLog.innerHTML = "";
  const recentRounds = state.roundResults.slice(-8).reverse();

  if (!recentRounds.length) {
    const empty = document.createElement("li");
    empty.textContent = "No rounds yet.";
    roundLog.appendChild(empty);
    return;
  }

  recentRounds.forEach((result, index) => {
    const item = document.createElement("li");
    const roundNumber = state.roundResults.length - index;
    item.textContent = `Round ${roundNumber}: ${result.mode}, ${result.outcome}, ${result.steps} steps`;
    roundLog.appendChild(item);
  });
}

function render() {
  renderBoard();
  renderMetrics();
  renderRoundLog();
}

function handleKeydown(event) {
  const keyMap = {
    ArrowUp: "up",
    w: "up",
    W: "up",
    ArrowRight: "right",
    d: "right",
    D: "right",
    ArrowDown: "down",
    s: "down",
    S: "down",
    ArrowLeft: "left",
    a: "left",
    A: "left",
  };

  const direction = keyMap[event.key];
  if (!direction) {
    return;
  }
  event.preventDefault();
  movePlayer(direction);
}

startRoundButton.addEventListener("click", startRound);
resetRoundButton.addEventListener("click", resetRound);
clearLearningButton.addEventListener("click", clearLearning);
modeButtons.forEach((button) => {
  button.addEventListener("click", () => setMode(button.dataset.mode));
});
moveButtons.forEach((button) => {
  button.addEventListener("click", () => movePlayer(button.dataset.move));
});
document.addEventListener("keydown", handleKeydown);

render();
