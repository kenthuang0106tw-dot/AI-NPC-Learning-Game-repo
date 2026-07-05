// Flappy Skill Lab MVP
// This file intentionally keeps the game simple and readable for a science fair project.

const STORAGE_KEY = "flappy_skill_lab_logs_v1";
const PENDING_UPLOADS_KEY = "flappy_skill_lab_pending_uploads_v1";
const PLAYER_COUNTS_KEY = "flappy_skill_lab_player_counts_v1";
const PLAYER_PROFILES_KEY = "flappy_skill_lab_player_profiles_v1";
const DEVICE_ID_KEY = "flappy_skill_lab_device_id_v1";
const UPLOAD_ENDPOINT_KEY = "flappy_skill_lab_upload_endpoint_v1";
const LAST_HEIGHT_VARIATION_KEY = "flappy_skill_lab_last_height_variation_v1";
const DEFAULT_UPLOAD_ENDPOINT =
  "https://script.google.com/macros/s/AKfycby5bcHFz9A9uxOWVfgwbvsANwbBN9pdF5Hi8zXnOgmW8YsucEIjHCFfaf3IW4LK7NX61A/exec";
const SHEET_ID = "12rOhOWkdhYeDcr_nz-Ao9NEJE7jrw_K_AEgJRwgruUY";
const SHEET_NAME = "data";
const USE_PROJECT_UPLOAD_ENDPOINT = true;
const CANVAS_WIDTH = 480;
const CANVAS_HEIGHT = 640;
const BIRD_X = 120;
const BIRD_RADIUS = 16;
const GROUND_Y = CANVAS_HEIGHT - 54;
const GAP_SIZE = 150;
const PIPE_WIDTH = 70;
const PIPE_SPACING = 260;
const SAMPLE_EVERY_FRAMES = 5;
const FIXED_FLAP_POWER = "normal";
const SKIN_PIPES_PER_LEVEL = 30;
const MAX_BIRD_SKIN_LEVEL = 6;
const UPLOAD_CHUNK_SIZE = 500;
const COMPLETE_UPLOAD_ATTEMPTS = 3;
const VERIFY_RETRIES = 2;
const VERIFY_WAIT_MS = 700;
const FORM_POST_WAIT_MS = 650;
const PENDING_UPLOAD_INTERVAL_MS = 10000;

const SPEED_SETTINGS = {
  slow: { gravity: 0.36, flap: -7.2, pipeSpeed: 2.1 },
  normal: { gravity: 0.44, flap: -7.8, pipeSpeed: 2.8 },
  fast: { gravity: 0.52, flap: -8.4, pipeSpeed: 3.6 },
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
const uploadStatusTop = document.querySelector("#uploadStatusTop");
const speedInputs = document.querySelectorAll("input[name='speed']");

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
const uploadResult = document.querySelector("#uploadResult");
const bestScore = document.querySelector("#bestScore");
const achievementCount = document.querySelector("#achievementCount");
const encouragementText = document.querySelector("#encouragementText");
const analysisText = document.querySelector("#analysisText");
const achievementList = document.querySelector("#achievementList");

let allLogs = loadLogs();
let pendingUploads = loadPendingUploads();
let playerCounts = loadPlayerCounts();
let playerProfiles = loadPlayerProfiles();
let animationId = null;
let pendingClick = false;
let currentGameLogs = [];
let clickEvents = [];
let passEffects = [];
let uploadInProgress = false;
let uploadRerunRequested = false;
let lastCanvasTouchEnd = 0;
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
  flapPower: FIXED_FLAP_POWER,
  achievements: [],
  previousHeightVariation: null,
  finalUploadRows: [],
  deathAnimationStarted: 0,
};

function loadLogs() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function loadPendingUploads() {
  try {
    return JSON.parse(localStorage.getItem(PENDING_UPLOADS_KEY)) || [];
  } catch {
    return [];
  }
}

function savePendingUploads() {
  localStorage.setItem(PENDING_UPLOADS_KEY, JSON.stringify(pendingUploads));
}

function loadPlayerCounts() {
  try {
    return JSON.parse(localStorage.getItem(PLAYER_COUNTS_KEY)) || {};
  } catch {
    return {};
  }
}

function loadPlayerProfiles() {
  try {
    return JSON.parse(localStorage.getItem(PLAYER_PROFILES_KEY)) || {};
  } catch {
    return {};
  }
}

function savePlayerCounts() {
  localStorage.setItem(PLAYER_COUNTS_KEY, JSON.stringify(playerCounts));
}

function savePlayerProfiles() {
  localStorage.setItem(PLAYER_PROFILES_KEY, JSON.stringify(playerProfiles));
}

function getPlayerProfile(name) {
  if (!name) {
    return { bestScore: 0, achievements: [], speedsPlayed: [] };
  }
  if (!playerProfiles[name]) {
    playerProfiles[name] = { bestScore: 0, achievements: [], speedsPlayed: [] };
  }
  const profile = playerProfiles[name];
  profile.bestScore = Number(profile.bestScore) || 0;
  profile.achievements = Array.isArray(profile.achievements) ? profile.achievements : [];
  profile.speedsPlayed = Array.isArray(profile.speedsPlayed) ? profile.speedsPlayed : [];
  return profile;
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

function setUploadStatus(message) {
  const pendingText = pendingUploads.length ? ` Pending: ${pendingUploads.length}.` : "";
  uploadStatus.textContent = `${message}${pendingText}`;
  uploadStatusTop.textContent = `Upload: ${message}${pendingText}`;
  uploadResult.textContent = `${message}${pendingText}`;
}

function getPlayerName() {
  return playerNameInput.value.trim();
}

function updatePlayerCountDisplay() {
  const name = getPlayerName();
  playerPlayCount.textContent = name ? playerCounts[name] || 0 : 0;
  const profile = getPlayerProfile(name);
  if (bestScore) {
    bestScore.textContent = name ? profile.bestScore : "--";
  }
  if (achievementCount) {
    achievementCount.textContent = name ? profile.achievements.length : "--";
  }
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
  game.playerName = name;
  game.playerPlayCount = playerCounts[name];
  updatePlayerCountDisplay();
  return true;
}

function getSpeedLevel() {
  const selected = [...speedInputs].find((input) => input.checked);
  return selected ? selected.value : "normal";
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
  passEffects = [];

  game.running = false;
  game.over = false;
  game.gameId = `game_${Date.now()}`;
  game.playerName = getPlayerName();
  game.playerPlayCount = playerCounts[game.playerName] || 0;
  game.speedLevel = getSpeedLevel();
  game.flapPower = FIXED_FLAP_POWER;
  game.frame = 0;
  game.startTime = 0;
  game.lastFrameTime = 0;
  game.birdY = CANVAS_HEIGHT / 2;
  game.birdVy = 0;
  game.pipes = [createPipe(560), createPipe(560 + PIPE_SPACING)];
  game.score = 0;
  game.lastClickTime = null;
  game.deathReason = "none";
  game.achievements = [];
  game.previousHeightVariation = Number(localStorage.getItem(LAST_HEIGHT_VARIATION_KEY) || "") || null;
  game.finalUploadRows = [];
  game.deathAnimationStarted = 0;

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
  setUploadStatus("Ready. Full round uploads after game over.");
  animationId = window.requestAnimationFrame(update);
}

function restartGame() {
  startGame();
}

function startOrFlap() {
  if (!game.running) {
    startGame();
  }
  flap();
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
    game.birdVy = settings.flap;
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

  const isSampleFrame = game.frame % SAMPLE_EVERY_FRAMES === 0;
  if (isSampleFrame || isClick || isDead) {
    logFrame({
      time: elapsedSeconds,
      isClick,
      clickInterval,
      errorToCenter,
      isDead,
      deathReason: game.deathReason,
      sampleType: getSampleType({ isSampleFrame, isClick, isDead }),
    });
  }

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
      passEffects.push({ x: BIRD_X + 38, y: game.birdY, age: 0 });
      checkAchievements();
    }
  }
}

function getBirdSkinLevel() {
  return Math.min(MAX_BIRD_SKIN_LEVEL, Math.floor(game.score / SKIN_PIPES_PER_LEVEL) + 1);
}

function checkAchievements() {
  if (game.score >= 1) {
    addAchievement("First Flight");
  }
  if (game.score >= 10) {
    addAchievement("Pipe Reader");
  }
  if (game.score >= 30) {
    addAchievement("Calm Pilot");
  }
  if (game.score >= 50) {
    addAchievement("Expert");
  }
  if (game.score >= 90) {
    addAchievement("Night Flyer");
  }
  if (game.score >= 120) {
    addAchievement("Sky Master");
  }
  if (game.score >= 150) {
    addAchievement("Legend");
  }
}

function addAchievement(name) {
  if (!game.achievements.includes(name)) {
    game.achievements.push(name);
  }
  const profile = getPlayerProfile(game.playerName);
  if (game.playerName && !profile.achievements.includes(name)) {
    profile.achievements.push(name);
    savePlayerProfiles();
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

function getSampleType({ isSampleFrame, isClick, isDead }) {
  if (isDead) {
    return "death";
  }
  if (isClick && isSampleFrame) {
    return "sample_click";
  }
  if (isClick) {
    return "click";
  }
  return "sample";
}

function logFrame({ time, isClick, clickInterval, errorToCenter, isDead, deathReason, sampleType }) {
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
    sample_type: sampleType,
    bird_skin_level: getBirdSkinLevel(),
  };
  currentGameLogs.push(row);
}

function endGame(elapsedSeconds) {
  game.running = false;
  game.over = true;
  game.deathAnimationStarted = performance.now();
  window.cancelAnimationFrame(animationId);
  animationId = null;
  ensureDeathFrameLogged(elapsedSeconds);
  allLogs = allLogs.concat(currentGameLogs);
  saveLogs();
  showDashboard(elapsedSeconds);
  gameStatus.textContent = `Game over: ${game.deathReason}`;
  drawScene();
  uploadCompletedGame();
}

function ensureDeathFrameLogged(elapsedSeconds) {
  const lastRow = currentGameLogs[currentGameLogs.length - 1];
  if (lastRow && lastRow.is_dead === 1 && lastRow.death_reason === game.deathReason) {
    return;
  }

  logFrame({
    time: elapsedSeconds,
    isClick: false,
    clickInterval: "",
    errorToCenter: "",
    isDead: true,
    deathReason: game.deathReason,
    sampleType: "death",
  });
}

function resetDashboard() {
  survivalTime.textContent = "--";
  finalScore.textContent = "--";
  bestScore.textContent = getPlayerName() ? getPlayerProfile(getPlayerName()).bestScore : "--";
  achievementCount.textContent = getPlayerName() ? getPlayerProfile(getPlayerName()).achievements.length : "--";
  clicksPerSecond.textContent = "--";
  averageError.textContent = "--";
  deathReason.textContent = "--";
  heightVariation.textContent = "--";
  uploadResult.textContent = uploadStatus.textContent || "--";
  encouragementText.textContent = "Play a round to see feedback.";
  analysisText.textContent = "Analysis appears only after game over.";
  achievementList.innerHTML = "";
}

function showDashboard(elapsedSeconds) {
  const clicks = clickEvents.length;
  const absErrors = clickEvents
    .map((event) => event.errorToCenter)
    .filter((value) => typeof value === "number")
    .map((value) => Math.abs(value));
  const heights = currentGameLogs.map((row) => Number(row.bird_y));
  const heightStd = heights.length ? standardDeviation(heights) : null;
  const clicksPerSecondValue = elapsedSeconds > 0 ? clicks / elapsedSeconds : 0;
  if (elapsedSeconds >= 12 && heightStd !== null && heightStd <= 85) {
    addAchievement("Stable Pilot");
  }
  updatePlayerProgress({ heightStd });

  survivalTime.textContent = `${elapsedSeconds.toFixed(2)}s`;
  finalScore.textContent = game.score;
  const profile = getPlayerProfile(game.playerName);
  bestScore.textContent = profile.bestScore;
  achievementCount.textContent = profile.achievements.length;
  clicksPerSecond.textContent = clicksPerSecondValue.toFixed(2);
  averageError.textContent = absErrors.length ? average(absErrors).toFixed(2) : "--";
  deathReason.textContent = game.deathReason;
  heightVariation.textContent = heightStd !== null ? heightStd.toFixed(2) : "--";
  encouragementText.textContent = getEncouragement();
  analysisText.textContent = getRoundAnalysis({ clicksPerSecondValue, absErrors, heightStd });
  renderAchievements();
  if (heightStd !== null) {
    localStorage.setItem(LAST_HEIGHT_VARIATION_KEY, String(heightStd));
  }
}

function updatePlayerProgress({ heightStd }) {
  const profile = getPlayerProfile(game.playerName);
  if (!game.playerName) {
    return;
  }

  if (!profile.speedsPlayed.includes(game.speedLevel)) {
    profile.speedsPlayed.push(game.speedLevel);
  }
  if (game.score > profile.bestScore) {
    profile.bestScore = game.score;
    addAchievement("Personal Best");
  }
  if (game.playerPlayCount >= 5) {
    addAchievement("Practice 5");
  }
  if (game.playerPlayCount >= 20) {
    addAchievement("Practice 20");
  }
  if (profile.speedsPlayed.length >= 3) {
    addAchievement("Speed Explorer");
  }
  if (heightStd !== null && heightStd <= 65 && game.score >= 5) {
    addAchievement("Steady Wing");
  }
  savePlayerProfiles();
  updatePlayerCountDisplay();
}

function getEncouragement() {
  if (game.score >= 50) {
    return "Excellent flight. You reached expert territory.";
  }
  if (game.score >= 20) {
    return "Nice control. You kept the bird alive through a long run.";
  }
  if (game.score >= 1) {
    return "Good start. Try to keep the bird closer to the pipe center.";
  }
  return "First flights are data too. Try a steadier tap rhythm next round.";
}

function getRoundAnalysis({ clicksPerSecondValue, absErrors, heightStd }) {
  const notes = [];
  if (clicksPerSecondValue > 2.4) {
    notes.push("Your click rate was high.");
  } else if (clicksPerSecondValue < 1.0) {
    notes.push("Your click rate was low.");
  } else {
    notes.push("Your click rhythm was moderate.");
  }

  if (absErrors.length && average(absErrors) > 80) {
    notes.push("Your height was often far from the pipe center.");
  } else if (absErrors.length) {
    notes.push("Your height stayed closer to the pipe center.");
  }

  if (heightStd !== null && game.previousHeightVariation !== null) {
    if (heightStd < game.previousHeightVariation) {
      notes.push("Your height control was steadier than last round.");
    } else if (heightStd > game.previousHeightVariation) {
      notes.push("Your height control varied more than last round.");
    }
  }

  return notes.join(" ");
}

function renderAchievements() {
  achievementList.innerHTML = "";
  const profile = getPlayerProfile(game.playerName);
  if (!profile.achievements.length) {
    const item = document.createElement("li");
    item.textContent = "No achievements yet";
    achievementList.appendChild(item);
    return;
  }

  for (const achievement of profile.achievements) {
    const item = document.createElement("li");
    item.textContent = game.achievements.includes(achievement) ? `${achievement} (new)` : achievement;
    achievementList.appendChild(item);
  }
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
  drawPassEffects();
  drawBird();
  drawGround();
  drawHud();
}

function drawBackground() {
  const style = getBackgroundStyle();
  const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
  gradient.addColorStop(0, style.skyTop);
  gradient.addColorStop(1, style.skyBottom);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  if (style.stars) {
    ctx.fillStyle = "rgba(255, 255, 255, 0.86)";
    for (let i = 0; i < style.starCount; i += 1) {
      const x = (i * 83 + 31) % CANVAS_WIDTH;
      const y = 32 + ((i * 47) % 210);
      ctx.fillRect(x, y, i % 3 === 0 ? 3 : 2, i % 3 === 0 ? 3 : 2);
    }
    if (style.moon) {
      ctx.fillStyle = "rgba(255, 255, 230, 0.9)";
      ctx.beginPath();
      ctx.arc(392, 78, 24, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = style.skyTop;
      ctx.beginPath();
      ctx.arc(402, 70, 22, 0, Math.PI * 2);
      ctx.fill();
    }
    if (style.meteors) {
      ctx.strokeStyle = "rgba(255, 255, 255, 0.58)";
      ctx.lineWidth = 2;
      for (let i = 0; i < 4; i += 1) {
        const x = 90 + i * 90;
        const y = 70 + ((i * 37) % 110);
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + 34, y - 18);
        ctx.stroke();
      }
    }
    if (style.aurora) {
      ctx.strokeStyle = "rgba(94, 234, 212, 0.42)";
      ctx.lineWidth = 16;
      ctx.beginPath();
      ctx.moveTo(0, 145);
      ctx.quadraticCurveTo(120, 95, 240, 145);
      ctx.quadraticCurveTo(350, 190, CANVAS_WIDTH, 122);
      ctx.stroke();
      ctx.strokeStyle = "rgba(192, 132, 252, 0.36)";
      ctx.lineWidth = 11;
      ctx.beginPath();
      ctx.moveTo(0, 190);
      ctx.quadraticCurveTo(140, 132, 300, 178);
      ctx.quadraticCurveTo(390, 202, CANVAS_WIDTH, 150);
      ctx.stroke();
    }
  } else {
    ctx.fillStyle = style.cloudColor;
    drawCloud(90, 90);
    drawCloud(330, 150);
    if (style.sun) {
      ctx.fillStyle = style.sun;
      ctx.beginPath();
      ctx.arc(390, 82, 32, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function getBackgroundStyle() {
  if (game.score >= 150) {
    return {
      skyTop: "#f97316",
      skyBottom: "#fde68a",
      cloudColor: "rgba(255, 255, 255, 0.5)",
      stars: false,
      sun: "rgba(255, 245, 157, 0.82)",
    };
  }
  if (game.score >= 120) {
    return {
      skyTop: "#042f2e",
      skyBottom: "#312e81",
      cloudColor: "rgba(255, 255, 255, 0.35)",
      stars: true,
      starCount: 36,
      moon: true,
      aurora: true,
      meteors: false,
    };
  }
  if (game.score >= 80) {
    return {
      skyTop: "#020617",
      skyBottom: "#1e1b4b",
      cloudColor: "rgba(255, 255, 255, 0.35)",
      stars: true,
      starCount: 34,
      moon: true,
      aurora: false,
      meteors: true,
    };
  }
  if (game.score >= 50) {
    return {
      skyTop: "#172554",
      skyBottom: "#4c1d95",
      cloudColor: "rgba(255, 255, 255, 0.35)",
      stars: true,
      starCount: 24,
      moon: true,
      aurora: false,
      meteors: false,
    };
  }
  if (game.score >= 20) {
    return {
      skyTop: "#f9a03f",
      skyBottom: "#ffd6a5",
      cloudColor: "rgba(255, 255, 255, 0.58)",
      stars: false,
      sun: "rgba(255, 232, 153, 0.85)",
    };
  }
  return {
    skyTop: "#8ed8ff",
    skyBottom: "#eaf7ff",
    cloudColor: "rgba(255, 255, 255, 0.72)",
    stars: false,
    sun: "rgba(255, 245, 157, 0.9)",
  };
}

function drawCloud(x, y) {
  ctx.beginPath();
  ctx.arc(x, y, 22, 0, Math.PI * 2);
  ctx.arc(x + 24, y - 8, 28, 0, Math.PI * 2);
  ctx.arc(x + 56, y, 20, 0, Math.PI * 2);
  ctx.fill();
}

function drawPassEffects() {
  passEffects = passEffects.filter((effect) => effect.age < 28);
  for (const effect of passEffects) {
    const progress = effect.age / 28;
    ctx.save();
    ctx.globalAlpha = 1 - progress;
    ctx.strokeStyle = "#ffd84d";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(effect.x, effect.y, 12 + progress * 26, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    effect.age += 1;
  }
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
  const skinLevel = getBirdSkinLevel();
  const wingLift = Math.sin(game.frame * 0.38) * 5;
  const deathTilt = game.over ? 0.85 : 0;
  const bodyColor = {
    1: "#ffd84d",
    2: "#ffd84d",
    3: "#fef3c7",
    4: "#bfdbfe",
    5: "#ddd6fe",
    6: "#fef9c3",
  }[skinLevel] || "#fef9c3";
  const wingColor = {
    1: "#f6c343",
    2: "#60a5fa",
    3: "#60a5fa",
    4: "#22d3ee",
    5: "#a78bfa",
    6: "#fbbf24",
  }[skinLevel] || "#fbbf24";
  ctx.save();
  ctx.translate(BIRD_X, game.birdY);
  ctx.rotate(Math.max(-0.45, Math.min(0.55, game.birdVy / 14)) + deathTilt);
  ctx.fillStyle = bodyColor;
  ctx.beginPath();
  ctx.arc(0, 0, BIRD_RADIUS, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = wingColor;
  ctx.beginPath();
  ctx.ellipse(-8, 6 + wingLift, 9, 5, -0.5, 0, Math.PI * 2);
  ctx.fill();

  if (skinLevel >= 2) {
    ctx.fillStyle = "#2563eb";
    ctx.beginPath();
    ctx.arc(-2, -12, 12, Math.PI, 0);
    ctx.fill();
  }

  if (skinLevel >= 3) {
    ctx.strokeStyle = "#111827";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(5, -7, 6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "#facc15";
    ctx.beginPath();
    ctx.moveTo(-11, -23);
    ctx.lineTo(-7, -15);
    ctx.lineTo(-16, -18);
    ctx.lineTo(-6, -20);
    ctx.lineTo(-12, -27);
    ctx.closePath();
    ctx.fill();
  }

  if (skinLevel >= 4) {
    ctx.strokeStyle = "#0f766e";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-14, 4);
    ctx.quadraticCurveTo(-28, 10 + wingLift * 0.2, -34, 0);
    ctx.stroke();
    ctx.fillStyle = "#14b8a6";
    ctx.fillRect(-16, -2, 15, 6);
  }

  if (skinLevel >= 5) {
    ctx.strokeStyle = "rgba(250, 204, 21, 0.88)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, BIRD_RADIUS + 5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "#facc15";
    for (let i = 0; i < 3; i += 1) {
      const angle = game.frame * 0.04 + i * 2.1;
      ctx.beginPath();
      ctx.arc(Math.cos(angle) * 24, Math.sin(angle) * 18, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  if (skinLevel >= 6) {
    ctx.strokeStyle = "rgba(255, 255, 255, 0.86)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(0, -20, 15, 5, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "rgba(251, 191, 36, 0.75)";
    ctx.beginPath();
    ctx.moveTo(-18, 12);
    ctx.lineTo(-36, 20);
    ctx.lineTo(-18, 20);
    ctx.closePath();
    ctx.fill();
  }

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

  if (game.over) {
    const age = Math.min(1, (performance.now() - game.deathAnimationStarted) / 500);
    ctx.save();
    ctx.globalAlpha = 1 - age;
    ctx.strokeStyle = "#ef4444";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(BIRD_X, game.birdY, BIRD_RADIUS + 10 + age * 30, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

function drawGround() {
  ctx.fillStyle = "#77b255";
  ctx.fillRect(0, GROUND_Y, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_Y);
  ctx.fillStyle = "#5c913b";
  ctx.fillRect(0, GROUND_Y, CANVAS_WIDTH, 8);
}

function drawHud() {
  ctx.fillStyle = "rgba(17, 24, 39, 0.78)";
  ctx.fillRect(14, 14, 170, 78);
  ctx.fillStyle = "#ffffff";
  ctx.font = "700 20px system-ui";
  ctx.fillText(`Score: ${game.score}`, 28, 42);
  ctx.font = "500 14px system-ui";
  ctx.fillText(`Speed: ${game.speedLevel}`, 28, 64);
  if (game.playerName) {
    ctx.fillText(`${game.playerName} #${game.playerPlayCount}`, 28, 82);
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
    "sample_type",
    "bird_skin_level",
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
  pendingUploads = [];
  playerCounts = {};
  playerProfiles = {};
  savePlayerCounts();
  savePlayerProfiles();
  savePendingUploads();
  updatePlayerCountDisplay();
  saveLogs();
  gameStatus.textContent = "Saved data cleared.";
}

function saveEndpoint() {
  const endpoint = getUploadEndpoint();
  localStorage.setItem(UPLOAD_ENDPOINT_KEY, endpoint);
  uploadEndpointInput.value = endpoint;
  setUploadStatus("Ready. Using the project Sheet endpoint.");
}

function getUploadEndpoint() {
  if (USE_PROJECT_UPLOAD_ENDPOINT) {
    return DEFAULT_UPLOAD_ENDPOINT;
  }

  return (
    uploadEndpointInput.value.trim() ||
    localStorage.getItem(UPLOAD_ENDPOINT_KEY) ||
    DEFAULT_UPLOAD_ENDPOINT
  );
}

async function uploadCompletedGame() {
  const completedRows = currentGameLogs.slice();
  const lastRow = completedRows[completedRows.length - 1];
  if (!lastRow || lastRow.is_dead !== 1 || !lastRow.death_reason || lastRow.death_reason === "none") {
    setUploadStatus("Death row missing locally. Upload stopped.");
    return;
  }

  game.finalUploadRows = completedRows;
  enqueuePendingUpload(completedRows);
  await processPendingUploads();
}

function enqueuePendingUpload(rows) {
  const lastRow = rows[rows.length - 1];
  pendingUploads = pendingUploads.filter((upload) => upload.gameId !== lastRow.game_id);
  pendingUploads.push({
    gameId: lastRow.game_id,
    playerName: lastRow.player_name,
    playerPlayCount: lastRow.player_play_count,
    deathReason: lastRow.death_reason,
    rows,
    attempts: 0,
    createdAt: new Date().toISOString(),
  });
  savePendingUploads();
  setUploadStatus(`Saved complete round locally for verified upload: ${lastRow.player_name} #${lastRow.player_play_count}.`);
}

async function processPendingUploads() {
  if (uploadInProgress || !pendingUploads.length) {
    if (uploadInProgress) {
      uploadRerunRequested = true;
    }
    return;
  }

  uploadInProgress = true;
  try {
    const uploadBatch = getPendingUploadOrder();
    for (const pending of uploadBatch) {
      const uploaded = await sendPendingUpload(pending);
      if (uploaded) {
        pending.attempts += 1;
        savePendingUploads();
      }
    }

    for (const pending of uploadBatch) {
      if (uploadRerunRequested) {
        break;
      }
      setUploadStatus(`Checking Sheet for ${pending.playerName} #${pending.playerPlayCount}...`);
      const verified = await verifyGameDeathRow(pending.gameId);
      if (verified) {
        removePendingUpload(pending.gameId);
        setUploadStatus(`Sheet verified: ${pending.playerName} #${pending.playerPlayCount}, ${pending.rows.length} rows.`);
        if (game.gameId === pending.gameId && game.over) {
          gameStatus.textContent = `Game over: ${game.deathReason}. Sheet verified.`;
        }
      } else {
        savePendingUploads();
        setUploadStatus(`Still not verified. Will retry automatically: ${pending.playerName} #${pending.playerPlayCount}.`);
        if (game.gameId === pending.gameId && game.over) {
          gameStatus.textContent = `Game over: ${game.deathReason}. Upload pending retry.`;
        }
      }
    }
  } finally {
    uploadInProgress = false;
    if (uploadRerunRequested && pendingUploads.length) {
      uploadRerunRequested = false;
      window.setTimeout(processPendingUploads, 0);
    } else {
      uploadRerunRequested = false;
    }
  }
}

function getPendingUploadOrder() {
  return [...pendingUploads].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

async function sendPendingUpload(pending) {
  const chunkCount = Math.ceil(pending.rows.length / UPLOAD_CHUNK_SIZE);
  for (let index = 0; index < pending.rows.length; index += UPLOAD_CHUNK_SIZE) {
    const chunk = pending.rows.slice(index, index + UPLOAD_CHUNK_SIZE);
    const chunkNumber = Math.floor(index / UPLOAD_CHUNK_SIZE) + 1;
    const firstFrame = chunk[0]?.frame ?? "";
    const lastFrame = chunk[chunk.length - 1]?.frame ?? "";
    const ok = await uploadRows(chunk, {
      automatic: true,
      silentWhenMissing: true,
      chunkKey: `${pending.gameId}|${chunkNumber}|${chunk.length}|${firstFrame}|${lastFrame}`,
      chunkNumber,
      chunkCount,
      statusMessage: `Sending pending complete round ${pending.playerName} #${pending.playerPlayCount}: chunk ${chunkNumber}/${chunkCount}...`,
      successMessage: `Pending complete round chunk sent ${chunkNumber}/${chunkCount}: ${index + chunk.length}/${pending.rows.length} rows.`,
    });
    if (!ok) {
      return false;
    }
  }
  return true;
}

function removePendingUpload(gameId) {
  pendingUploads = pendingUploads.filter((upload) => upload.gameId !== gameId);
  savePendingUploads();
}

function buildUploadPayload(rowsToUpload, { chunkKey = "", chunkNumber = "", chunkCount = "" } = {}) {
  return {
    device_id: deviceId,
    uploaded_at: new Date().toISOString(),
    chunk_key: chunkKey,
    chunk_number: chunkNumber,
    chunk_count: chunkCount,
    rows: rowsToUpload,
  };
}

async function verifyGameDeathRow(gameId) {
  for (let attempt = 1; attempt <= VERIFY_RETRIES; attempt += 1) {
    const found = await querySheetForDeathRow(gameId);
    if (found) {
      return true;
    }
    await wait(VERIFY_WAIT_MS);
  }
  return false;
}

function querySheetForDeathRow(gameId) {
  return new Promise((resolve) => {
    const callbackName = `flappySheetVerify_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const query = `select A,Q,R where A = '${String(gameId).replaceAll("'", "\\'")}' and Q = 1 limit 1`;
    const script = document.createElement("script");
    const cleanup = () => {
      delete window[callbackName];
      script.remove();
    };
    const timeoutId = window.setTimeout(() => {
      cleanup();
      resolve(false);
    }, 5000);

    window[callbackName] = (response) => {
      window.clearTimeout(timeoutId);
      const rows = response?.table?.rows || [];
      cleanup();
      resolve(rows.length > 0);
    };

    script.onerror = () => {
      window.clearTimeout(timeoutId);
      cleanup();
      resolve(false);
    };
    script.src =
      `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq` +
      `?sheet=${encodeURIComponent(SHEET_NAME)}` +
      `&tqx=responseHandler:${callbackName}` +
      `&tq=${encodeURIComponent(query)}` +
      `&cachebust=${Date.now()}`;
    document.head.appendChild(script);
  });
}

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function uploadRows(
  rowsToUpload,
  {
    automatic = false,
    silentWhenMissing = false,
    chunkKey = "",
    chunkNumber = "",
    chunkCount = "",
    statusMessage = "",
    successMessage = "",
  } = {}
) {
  const endpoint = getUploadEndpoint();
  if (!endpoint) {
    if (silentWhenMissing) {
      return false;
    }
    setUploadStatus("Paste and save an upload endpoint first.");
    return false;
  }

  if (!rowsToUpload.length) {
    if (silentWhenMissing) {
      return false;
    }
    setUploadStatus("No new rows to upload.");
    return false;
  }

  const payload = buildUploadPayload(rowsToUpload, { chunkKey, chunkNumber, chunkCount });
  const body = JSON.stringify(payload);

  const uploadingMessage = statusMessage || (automatic
    ? `Auto-uploading completed game: ${rowsToUpload.length} rows...`
    : `Uploading ${rowsToUpload.length} rows...`);
  setUploadStatus(uploadingMessage);
  try {
    await fetch(endpoint, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body,
    });
    const sentMessage = successMessage || (automatic
      ? `Completed game request sent: ${rowsToUpload.length} rows.`
      : `Upload request sent: ${rowsToUpload.length} rows.`);
    setUploadStatus(sentMessage);
    if (automatic && game.over) {
      gameStatus.textContent = `Game over: ${game.deathReason}. Upload request sent.`;
    }
    return true;
  } catch {
    const fallbackSent = await postPayloadWithHiddenForm(endpoint, body);
    if (fallbackSent) {
      const sentMessage = successMessage || (automatic
        ? `Completed game request sent: ${rowsToUpload.length} rows.`
        : `Upload request sent: ${rowsToUpload.length} rows.`);
      setUploadStatus(sentMessage);
      return true;
    }
    setUploadStatus(
      automatic
        ? "Auto-upload failed. Use Upload Backup to try again."
        : "Upload failed. Check the endpoint URL and internet connection."
    );
    return false;
  }
}

function postPayloadWithHiddenForm(endpoint, payloadBody) {
  return new Promise((resolve) => {
    try {
      const frameName = `upload_frame_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const iframe = document.createElement("iframe");
      const form = document.createElement("form");
      const payloadInput = document.createElement("textarea");
      let done = false;
      const finish = (ok) => {
        if (done) {
          return;
        }
        done = true;
        window.setTimeout(() => {
          iframe.remove();
          form.remove();
        }, 0);
        resolve(ok);
      };

      iframe.name = frameName;
      iframe.style.display = "none";
      form.style.display = "none";
      form.method = "POST";
      form.action = endpoint;
      form.target = frameName;
      payloadInput.name = "payload";
      payloadInput.value = payloadBody;
      form.appendChild(payloadInput);
      document.body.appendChild(iframe);
      document.body.appendChild(form);
      iframe.addEventListener("load", () => finish(true), { once: true });
      window.setTimeout(() => finish(false), FORM_POST_WAIT_MS);
      form.submit();
    } catch {
      resolve(false);
    }
  });
}

async function uploadData() {
  if (pendingUploads.length) {
    await processPendingUploads();
    if (pendingUploads.length) {
      setUploadStatus(`Pending uploads still not verified: ${pendingUploads.length}. Keep this page open and try again.`);
      return;
    }
  }

  if (!allLogs.length) {
    setUploadStatus("No saved rows to upload.");
    return;
  }

  let sentRows = 0;
  for (let index = 0; index < allLogs.length; index += UPLOAD_CHUNK_SIZE) {
    const chunk = allLogs.slice(index, index + UPLOAD_CHUNK_SIZE);
    const ok = await uploadRows(chunk, {
      statusMessage: `Sending saved backup data ${index + chunk.length}/${allLogs.length}...`,
      successMessage: `Backup request sent ${index + chunk.length}/${allLogs.length}.`,
    });
    if (!ok) {
      return;
    }
    sentRows = index + chunk.length;
  }

  setUploadStatus(`Backup request sent: ${sentRows} saved rows. Sheet may contain duplicates.`);
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
  startOrFlap();
});
canvas.addEventListener("dblclick", (event) => {
  event.preventDefault();
});
canvas.addEventListener(
  "touchend",
  (event) => {
    const now = Date.now();
    if (now - lastCanvasTouchEnd < 350) {
      event.preventDefault();
    }
    lastCanvasTouchEnd = now;
  },
  { passive: false }
);
document.addEventListener("gesturestart", (event) => {
  event.preventDefault();
});
document.addEventListener("keydown", (event) => {
  if (event.code === "Space") {
    event.preventDefault();
    startOrFlap();
  }
});

playerNameInput.value = "";
localStorage.setItem(UPLOAD_ENDPOINT_KEY, DEFAULT_UPLOAD_ENDPOINT);
uploadEndpointInput.value = DEFAULT_UPLOAD_ENDPOINT;
setUploadStatus("Ready. Completed games upload automatically.");
updatePlayerCountDisplay();
resetGame();
saveLogs();
processPendingUploads();
window.setInterval(processPendingUploads, PENDING_UPLOAD_INTERVAL_MS);
window.addEventListener("online", processPendingUploads);
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) {
    processPendingUploads();
  }
});
