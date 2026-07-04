// Flappy Skill Lab MVP
// This file intentionally keeps the game simple and readable for a science fair project.

const STORAGE_KEY = "flappy_skill_lab_logs_v1";
const PLAYER_COUNTS_KEY = "flappy_skill_lab_player_counts_v1";
const PLAYER_NAME_KEY = "flappy_skill_lab_player_name_v1";
const DEVICE_ID_KEY = "flappy_skill_lab_device_id_v1";
const UPLOAD_ENDPOINT_KEY = "flappy_skill_lab_upload_endpoint_v1";
const UPLOADED_ROWS_KEY = "flappy_skill_lab_uploaded_rows_v1";
const CANVAS_WIDTH = 480;
const CANVAS_HEIGHT = 640;
const BIRD_X = 120;
const BIRD_RADIUS = 16;
const GROUND_Y = CANVAS_HEIGHT - 54;
const GAP_SIZE = 150;
const PIPE_WIDTH = 70;
const PIPE_SPACING = 260;

const SPEED_SETTINGS = {
  slow: { gravity: 0.36, flap: -7.2, pipeSpeed: 2.1 },
  normal: { gravity: 0.44, flap: -7.8, pipeSpeed: 2.8 },
  fast: { gravity: 0.52, flap: -8.4, pipeSpeed: 3.6 },
};

const FLAP_POWER = {
  low: 0.9,
  normal: 1,
  high: 1.18,
};

const canvas = document.querySelector("#gameCanvas");
const ctx = canvas.getContext("2d");
const playerNameInput = document.querySelector("#playerNameInput");
const playerPlayCount = document.querySelector("#playerPlayCount");
const startButton = document.querySelector("#startButton");
const restartButton = document.querySelector("#restartButton");
const exportButton = document.querySelector("#exportButton");
const clearButton = document.querySelector("#clearButton");
const uploadEndpointInput = document.querySelector("#uploadEndpointInput");
const saveEndpointButton = document.querySelector("#saveEndpointButton");
const uploadButton = document.querySelector("#uploadButton");
const uploadStatus = document.querySelector("#uploadStatus");
const speedInputs = document.querySelectorAll("input[name='speed']");
const flapPowerInputs = document.querySelectorAll("input[name='flapPower']");

const gameStatus = document.querySelector("#gameStatus");
const scoreValue = document.querySelector("#scoreValue");
const timeValue = document.querySelector("#timeValue");
const frameValue = document.querySelector("#frameValue");
const savedRowsValue = document.querySelector("#savedRowsValue");
const survivalTime = document.querySelector("#survivalTime");
const finalScore = document.querySelector("#finalScore");
const clicksPerSecond = document.querySelector("#clicksPerSecond");
const averageError = document.querySelector("#averageError");
const deathReason = document.querySelector("#deathReason");
const heightVariation = document.querySelector("#heightVariation");

let allLogs = loadLogs();
let playerCounts = loadPlayerCounts();
let animationId = null;
let pendingClick = false;
let currentGameLogs = [];
let clickEvents = [];
const deviceId = getDeviceId();

const game = {
  running: false,
  over: false,
  gameId: "",
  playerName: "",
  playerPlayCount: 0,
  speedLevel: "normal",
  frame: 0,
  startTime: 0,
  lastFrameTime: 0,
  birdY: CANVAS_HEIGHT / 2,
  birdVy: 0,
  pipes: [],
  score: 0,
  lastClickTime: null,
  deathReason: "none",
  flapPower: "high",
};

function loadLogs() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function loadPlayerCounts() {
  try {
    return JSON.parse(localStorage.getItem(PLAYER_COUNTS_KEY)) || {};
  } catch {
    return {};
  }
}

function savePlayerCounts() {
  localStorage.setItem(PLAYER_COUNTS_KEY, JSON.stringify(playerCounts));
}

function getDeviceId() {
  let existing = localStorage.getItem(DEVICE_ID_KEY);
  if (!existing) {
    existing = `device_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    localStorage.setItem(DEVICE_ID_KEY, existing);
  }
  return existing;
}

function saveLogs() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(allLogs));
  savedRowsValue.textContent = allLogs.length;
}

function getPlayerName() {
  return playerNameInput.value.trim();
}

function updatePlayerCountDisplay() {
  const name = getPlayerName();
  playerPlayCount.textContent = name ? playerCounts[name] || 0 : 0;
}

function preparePlayerForGame() {
  const name = getPlayerName();
  if (!name) {
    gameStatus.textContent = "Please enter a player name before starting.";
    playerNameInput.focus();
    return false;
  }

  playerCounts[name] = (playerCounts[name] || 0) + 1;
  savePlayerCounts();
  localStorage.setItem(PLAYER_NAME_KEY, name);
  game.playerName = name;
  game.playerPlayCount = playerCounts[name];
  updatePlayerCountDisplay();
  return true;
}

function getSpeedLevel() {
  const selected = [...speedInputs].find((input) => input.checked);
  return selected ? selected.value : "normal";
}

function getFlapPower() {
  const selected = [...flapPowerInputs].find((input) => input.checked);
  return selected ? selected.value : "high";
}

function randomGapCenter() {
  return 150 + Math.random() * (GROUND_Y - 270);
}

function createPipe(x) {
  return {
    x,
    gapCenter: randomGapCenter(),
    gapSize: GAP_SIZE,
    passed: false,
  };
}

function resetGame() {
  window.cancelAnimationFrame(animationId);
  animationId = null;
  pendingClick = false;
  currentGameLogs = [];
  clickEvents = [];

  game.running = false;
  game.over = false;
  game.gameId = `game_${Date.now()}`;
  game.playerName = getPlayerName();
  game.playerPlayCount = playerCounts[game.playerName] || 0;
  game.speedLevel = getSpeedLevel();
  game.flapPower = getFlapPower();
  game.frame = 0;
  game.startTime = 0;
  game.lastFrameTime = 0;
  game.birdY = CANVAS_HEIGHT / 2;
  game.birdVy = 0;
  game.pipes = [createPipe(560), createPipe(560 + PIPE_SPACING)];
  game.score = 0;
  game.lastClickTime = null;
  game.deathReason = "none";

  gameStatus.textContent = "Ready. Press Start, Space, click, or tap.";
  updateLiveMetrics(0);
  resetDashboard();
  drawScene();
}

function startGame() {
  if (!preparePlayerForGame()) {
    return;
  }
  resetGame();
  game.playerName = getPlayerName();
  game.playerPlayCount = playerCounts[game.playerName] || 1;
  game.running = true;
  game.startTime = performance.now();
  game.lastFrameTime = game.startTime;
  gameStatus.textContent = "Playing. Tap once to fly upward.";
  animationId = window.requestAnimationFrame(update);
}

function restartGame() {
  startGame();
}

function flap() {
  if (!game.running) {
    return;
  }
  pendingClick = true;
}

function update(now) {
  if (!game.running) {
    return;
  }

  const settings = SPEED_SETTINGS[game.speedLevel];
  const elapsedSeconds = (now - game.startTime) / 1000;
  const dt = Math.min((now - game.lastFrameTime) / 16.67, 2);
  game.lastFrameTime = now;
  game.frame += 1;

  const nextPipe = getNextPipe();
  const isClick = pendingClick;
  let clickInterval = "";
  let errorToCenter = "";
  let nextPipeDistance = nextPipe ? nextPipe.x - BIRD_X : "";

  if (isClick) {
    game.birdVy = settings.flap * FLAP_POWER[game.flapPower];
    clickInterval = game.lastClickTime === null ? "" : ((now - game.lastClickTime) / 1000).toFixed(3);
    game.lastClickTime = now;
    errorToCenter = nextPipe ? (game.birdY - nextPipe.gapCenter).toFixed(2) : "";
    clickEvents.push({
      clickInterval: clickInterval === "" ? null : Number(clickInterval),
      errorToCenter: errorToCenter === "" ? null : Number(errorToCenter),
      nextPipeDistance: nextPipeDistance === "" ? null : Number(nextPipeDistance.toFixed(2)),
    });
  }
  pendingClick = false;

  game.birdVy += settings.gravity * dt;
  game.birdY += game.birdVy * dt;

  movePipes(settings.pipeSpeed * dt);
  updateScore();

  const death = getDeathReason();
  const isDead = death !== "none";
  if (isDead) {
    game.deathReason = death;
  }

  logFrame({
    time: elapsedSeconds,
    isClick,
    clickInterval,
    errorToCenter,
    isDead,
    deathReason: game.deathReason,
  });

  drawScene();
  updateLiveMetrics(elapsedSeconds);

  if (isDead) {
    endGame(elapsedSeconds);
    return;
  }

  animationId = window.requestAnimationFrame(update);
}

function movePipes(speed) {
  for (const pipe of game.pipes) {
    pipe.x -= speed;
  }

  if (game.pipes[0].x + PIPE_WIDTH < 0) {
    game.pipes.shift();
    const lastPipe = game.pipes[game.pipes.length - 1];
    game.pipes.push(createPipe(lastPipe.x + PIPE_SPACING));
  }
}

function updateScore() {
  for (const pipe of game.pipes) {
    if (!pipe.passed && pipe.x + PIPE_WIDTH < BIRD_X) {
      pipe.passed = true;
      game.score += 1;
    }
  }
}

function getNextPipe() {
  return game.pipes.find((pipe) => pipe.x + PIPE_WIDTH >= BIRD_X) || game.pipes[0];
}

function getDeathReason() {
  if (game.birdY + BIRD_RADIUS >= GROUND_Y) {
    return "hit_ground";
  }

  const pipe = getNextPipe();
  const birdRight = BIRD_X + BIRD_RADIUS;
  const birdLeft = BIRD_X - BIRD_RADIUS;
  const pipeRight = pipe.x + PIPE_WIDTH;
  const gapTop = pipe.gapCenter - pipe.gapSize / 2;
  const gapBottom = pipe.gapCenter + pipe.gapSize / 2;

  if (birdRight >= pipe.x && birdLeft <= pipeRight) {
    if (game.birdY - BIRD_RADIUS < gapTop) {
      return "hit_top_pipe";
    }
    if (game.birdY + BIRD_RADIUS > gapBottom) {
      return "hit_bottom_pipe";
    }
  }

  return "none";
}

function logFrame({ time, isClick, clickInterval, errorToCenter, isDead, deathReason }) {
  const pipe = getNextPipe();
  const row = {
    game_id: game.gameId,
    player_name: game.playerName,
    player_play_count: game.playerPlayCount,
    device_id: deviceId,
    time: time.toFixed(3),
    frame: game.frame,
    speed_level: game.speedLevel,
    flap_power: game.flapPower,
    bird_y: game.birdY.toFixed(2),
    bird_vy: game.birdVy.toFixed(2),
    pipe_x: pipe.x.toFixed(2),
    pipe_gap_center: pipe.gapCenter.toFixed(2),
    pipe_gap_size: pipe.gapSize,
    next_pipe_distance: (pipe.x - BIRD_X).toFixed(2),
    score: game.score,
    is_click: isClick ? 1 : 0,
    is_dead: isDead ? 1 : 0,
    death_reason: deathReason,
    click_interval: clickInterval,
    error_to_center: errorToCenter,
  };
  currentGameLogs.push(row);
}

function endGame(elapsedSeconds) {
  game.running = false;
  game.over = true;
  window.cancelAnimationFrame(animationId);
  animationId = null;
  allLogs = allLogs.concat(currentGameLogs);
  saveLogs();
  showDashboard(elapsedSeconds);
  gameStatus.textContent = `Game over: ${game.deathReason}`;
  drawScene();
  uploadData({ automatic: true, silentWhenMissing: true });
}

function resetDashboard() {
  survivalTime.textContent = "--";
  finalScore.textContent = "--";
  clicksPerSecond.textContent = "--";
  averageError.textContent = "--";
  deathReason.textContent = "--";
  heightVariation.textContent = "--";
}

function showDashboard(elapsedSeconds) {
  const clicks = clickEvents.length;
  const absErrors = clickEvents
    .map((event) => event.errorToCenter)
    .filter((value) => typeof value === "number")
    .map((value) => Math.abs(value));
  const heights = currentGameLogs.map((row) => Number(row.bird_y));

  survivalTime.textContent = `${elapsedSeconds.toFixed(2)}s`;
  finalScore.textContent = game.score;
  clicksPerSecond.textContent = elapsedSeconds > 0 ? (clicks / elapsedSeconds).toFixed(2) : "0.00";
  averageError.textContent = absErrors.length ? average(absErrors).toFixed(2) : "--";
  deathReason.textContent = game.deathReason;
  heightVariation.textContent = heights.length ? standardDeviation(heights).toFixed(2) : "--";
}

function average(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function standardDeviation(values) {
  const avg = average(values);
  const variance = average(values.map((value) => (value - avg) ** 2));
  return Math.sqrt(variance);
}

function updateLiveMetrics(elapsedSeconds) {
  scoreValue.textContent = game.score;
  timeValue.textContent = `${elapsedSeconds.toFixed(1)}s`;
  frameValue.textContent = game.frame;
  savedRowsValue.textContent = allLogs.length;
}

function drawScene() {
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  drawBackground();
  drawPipes();
  drawBird();
  drawGround();
  drawHud();
}

function drawBackground() {
  const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
  gradient.addColorStop(0, "#8ed8ff");
  gradient.addColorStop(1, "#eaf7ff");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.fillStyle = "rgba(255, 255, 255, 0.72)";
  drawCloud(90, 90);
  drawCloud(330, 150);
}

function drawCloud(x, y) {
  ctx.beginPath();
  ctx.arc(x, y, 22, 0, Math.PI * 2);
  ctx.arc(x + 24, y - 8, 28, 0, Math.PI * 2);
  ctx.arc(x + 56, y, 20, 0, Math.PI * 2);
  ctx.fill();
}

function drawPipes() {
  for (const pipe of game.pipes) {
    const topHeight = pipe.gapCenter - pipe.gapSize / 2;
    const bottomY = pipe.gapCenter + pipe.gapSize / 2;
    ctx.fillStyle = "#4fb06d";
    ctx.fillRect(pipe.x, 0, PIPE_WIDTH, topHeight);
    ctx.fillRect(pipe.x, bottomY, PIPE_WIDTH, GROUND_Y - bottomY);
    ctx.fillStyle = "#337b4b";
    ctx.fillRect(pipe.x - 4, topHeight - 20, PIPE_WIDTH + 8, 20);
    ctx.fillRect(pipe.x - 4, bottomY, PIPE_WIDTH + 8, 20);
  }
}

function drawBird() {
  ctx.save();
  ctx.translate(BIRD_X, game.birdY);
  ctx.rotate(Math.max(-0.45, Math.min(0.55, game.birdVy / 14)));
  ctx.fillStyle = "#ffd84d";
  ctx.beginPath();
  ctx.arc(0, 0, BIRD_RADIUS, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ff9f1c";
  ctx.beginPath();
  ctx.moveTo(12, -2);
  ctx.lineTo(28, 5);
  ctx.lineTo(12, 12);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#111827";
  ctx.beginPath();
  ctx.arc(6, -7, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawGround() {
  ctx.fillStyle = "#77b255";
  ctx.fillRect(0, GROUND_Y, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_Y);
  ctx.fillStyle = "#5c913b";
  ctx.fillRect(0, GROUND_Y, CANVAS_WIDTH, 8);
}

function drawHud() {
  ctx.fillStyle = "rgba(17, 24, 39, 0.78)";
  ctx.fillRect(14, 14, 150, 66);
  ctx.fillStyle = "#ffffff";
  ctx.font = "700 20px system-ui";
  ctx.fillText(`Score: ${game.score}`, 28, 42);
  ctx.font = "500 14px system-ui";
  ctx.fillText(`Speed: ${game.speedLevel}`, 28, 64);
  ctx.fillText(`Flap: ${game.flapPower}`, 28, 82);
  if (game.playerName) {
    ctx.fillText(`${game.playerName} #${game.playerPlayCount}`, 28, 100);
  }

  if (!game.running && !game.over) {
    drawCenterText("Press Start", "Space / click / touch makes the bird fly");
  }
  if (game.over) {
    drawCenterText("Game Over", game.deathReason);
  }
}

function drawCenterText(title, subtitle) {
  ctx.fillStyle = "rgba(17, 24, 39, 0.72)";
  ctx.fillRect(70, 250, 340, 108);
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.font = "800 34px system-ui";
  ctx.fillText(title, CANVAS_WIDTH / 2, 296);
  ctx.font = "500 16px system-ui";
  ctx.fillText(subtitle, CANVAS_WIDTH / 2, 326);
  ctx.textAlign = "left";
}

function exportCsv() {
  const headers = [
    "game_id",
    "player_name",
    "player_play_count",
    "device_id",
    "time",
    "frame",
    "speed_level",
    "flap_power",
    "bird_y",
    "bird_vy",
    "pipe_x",
    "pipe_gap_center",
    "pipe_gap_size",
    "next_pipe_distance",
    "score",
    "is_click",
    "is_dead",
    "death_reason",
    "click_interval",
    "error_to_center",
  ];
  const csvRows = [
    headers.join(","),
    ...allLogs.map((row) => headers.map((header) => csvCell(row[header])).join(",")),
  ];
  const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `flappy_skill_lab_${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function csvCell(value) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function clearData() {
  if (!window.confirm("Clear all saved experiment data?")) {
    return;
  }
  allLogs = [];
  playerCounts = {};
  savePlayerCounts();
  updatePlayerCountDisplay();
  localStorage.setItem(UPLOADED_ROWS_KEY, "0");
  saveLogs();
  gameStatus.textContent = "Saved data cleared.";
}

function saveEndpoint() {
  const endpoint = uploadEndpointInput.value.trim();
  localStorage.setItem(UPLOAD_ENDPOINT_KEY, endpoint);
  localStorage.setItem(UPLOADED_ROWS_KEY, "0");
  uploadStatus.textContent = endpoint
    ? "Upload URL saved. Finished games will upload automatically."
    : "Upload URL cleared.";
}

async function uploadData({ automatic = false, silentWhenMissing = false } = {}) {
  const endpoint = uploadEndpointInput.value.trim();
  if (!endpoint) {
    if (silentWhenMissing) {
      return;
    }
    uploadStatus.textContent = "Paste and save an upload endpoint first.";
    return;
  }

  const uploadedRows = Number(localStorage.getItem(UPLOADED_ROWS_KEY) || 0);
  const rowsToUpload = allLogs.slice(uploadedRows);
  if (!rowsToUpload.length) {
    if (silentWhenMissing) {
      return;
    }
    uploadStatus.textContent = "No new rows to upload.";
    return;
  }

  const payload = {
    device_id: deviceId,
    uploaded_at: new Date().toISOString(),
    rows: rowsToUpload,
  };

  const nextUploadedRows = uploadedRows + rowsToUpload.length;
  uploadStatus.textContent = automatic
    ? `Auto-uploading ${rowsToUpload.length} rows...`
    : `Uploading ${rowsToUpload.length} rows...`;
  try {
    // no-cors keeps this simple for Google Apps Script web apps used by students.
    await fetch(endpoint, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
    });
    localStorage.setItem(UPLOADED_ROWS_KEY, String(nextUploadedRows));
    uploadStatus.textContent = automatic
      ? `Auto-upload sent: ${rowsToUpload.length} new rows.`
      : `Upload sent: ${rowsToUpload.length} new rows.`;
  } catch {
    uploadStatus.textContent = automatic
      ? "Auto-upload failed. Data is still saved locally; use Upload Data to try again."
      : "Upload failed. Check the endpoint URL and internet connection.";
  }
}

startButton.addEventListener("click", startGame);
restartButton.addEventListener("click", restartGame);
exportButton.addEventListener("click", exportCsv);
clearButton.addEventListener("click", clearData);
saveEndpointButton.addEventListener("click", saveEndpoint);
uploadButton.addEventListener("click", uploadData);
playerNameInput.addEventListener("input", updatePlayerCountDisplay);
canvas.addEventListener("pointerdown", (event) => {
  event.preventDefault();
  flap();
});
document.addEventListener("keydown", (event) => {
  if (event.code === "Space") {
    event.preventDefault();
    flap();
  }
});

playerNameInput.value = localStorage.getItem(PLAYER_NAME_KEY) || "";
uploadEndpointInput.value = localStorage.getItem(UPLOAD_ENDPOINT_KEY) || "";
updatePlayerCountDisplay();
resetGame();
saveLogs();
