// Flappy Skill Lab MVP
// This file intentionally keeps the game simple and readable for a science fair project.

const STORAGE_KEY = "flappy_skill_lab_logs_v1";
const PENDING_UPLOADS_KEY = "flappy_skill_lab_pending_uploads_v1";
const PLAYER_COUNTS_KEY = "flappy_skill_lab_player_counts_v1";
const PLAYER_PROFILES_KEY = "flappy_skill_lab_player_profiles_v1";
const DEVICE_ID_KEY = "flappy_skill_lab_device_id_v1";
const LAST_HEIGHT_VARIATION_KEY = "flappy_skill_lab_last_height_variation_v1";
const SOUND_ENABLED_KEY = "flappy_skill_lab_sound_enabled_v1";
const DEFAULT_UPLOAD_ENDPOINT =
  "https://script.google.com/macros/s/AKfycby5bcHFz9A9uxOWVfgwbvsANwbBN9pdF5Hi8zXnOgmW8YsucEIjHCFfaf3IW4LK7NX61A/exec";
const SHEET_ID = "12rOhOWkdhYeDcr_nz-Ao9NEJE7jrw_K_AEgJRwgruUY";
const SHEET_NAME = "data";
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
const DAILY_CHALLENGE_TARGET = 50;
const PERFECT_FLIGHT_ERROR = 35;
const CORRECTION_DELAY_SECONDS = 0.5;
const LAST_WINDOW_SECONDS = 3;
const UPLOAD_CHUNK_SIZE = 500;
const COMPLETE_UPLOAD_ATTEMPTS = 3;
const VERIFY_RETRIES = 2;
const VERIFY_WAIT_MS = 700;
const VERIFY_AFTER_SEND_MS = 12000;
const RESEND_PENDING_AFTER_MS = 180000;
const PENDING_SENDS_PER_TICK = 8;
const PENDING_VERIFICATIONS_PER_TICK = 12;
const FORM_POST_WAIT_MS = 10000;
const PENDING_UPLOAD_INTERVAL_MS = 10000;
const GLOBAL_BEST_REFRESH_MS = 60000;
const SCORE_MILESTONES = [1, 5, 10, 20, 30, 50, 70, 90, 120, 150];

const SPEED_SETTINGS = {
  slow: { gravity: 0.36, flap: -7.2, pipeSpeed: 2.1 },
  normal: { gravity: 0.44, flap: -7.8, pipeSpeed: 2.8 },
  fast: { gravity: 0.52, flap: -8.4, pipeSpeed: 3.6 },
};

const ACHIEVEMENTS = [
  { name: "First Flight", title: "初次飛行", description: "第一次通過水管。" },
  { name: "Score 5", title: "小試身手", description: "分數達到 5。" },
  { name: "Pipe Reader", title: "讀懂水管", description: "分數達到 10。" },
  { name: "Score 20", title: "穩定起飛", description: "分數達到 20。" },
  { name: "Calm Pilot", title: "冷靜飛行員", description: "分數達到 30。" },
  { name: "Expert", title: "高手飛行員", description: "分數達到 50。" },
  { name: "Score 70", title: "高空巡航", description: "分數達到 70。" },
  { name: "Night Flyer", title: "夜間飛行", description: "分數達到 90。" },
  { name: "Sky Master", title: "天空高手", description: "分數達到 120。" },
  { name: "Legend", title: "傳奇飛行員", description: "分數達到 150。" },
  { name: "Personal Best", title: "突破自己", description: "刷新個人最高分。" },
  { name: "Survive 5", title: "撐過 5 秒", description: "生存時間超過 5 秒。" },
  { name: "Survive 10", title: "撐過 10 秒", description: "生存時間超過 10 秒。" },
  { name: "Survive 20", title: "撐過 20 秒", description: "生存時間超過 20 秒。" },
  { name: "Survive 30", title: "撐過 30 秒", description: "生存時間超過 30 秒。" },
  { name: "Survive 45", title: "長程飛行", description: "生存時間超過 45 秒。" },
  { name: "Stable Pilot", title: "穩定操控", description: "生存 12 秒且高度波動較小。" },
  { name: "Steady Wing", title: "穩定翅膀", description: "分數達到 5 且穩定度良好。" },
  { name: "Stability 3", title: "穩定三星", description: "穩定度達到 3 星。" },
  { name: "Stability 4", title: "穩定四星", description: "穩定度達到 4 星。" },
  { name: "Stability 5", title: "穩定五星", description: "穩定度達到 5 星。" },
  { name: "Control 3", title: "控制三星", description: "控制能力達到 3 星。" },
  { name: "Control 4", title: "控制四星", description: "控制能力達到 4 星。" },
  { name: "Control 5", title: "控制五星", description: "控制能力達到 5 星。" },
  { name: "Rhythm 3", title: "節奏三星", description: "節奏達到 3 星。" },
  { name: "Rhythm 4", title: "節奏四星", description: "節奏達到 4 星。" },
  { name: "Rhythm 5", title: "節奏五星", description: "節奏達到 5 星。" },
  { name: "Efficient Click", title: "有效點擊", description: "至少一次點擊讓小鳥更靠近洞口中心。" },
  { name: "Efficient Click 5", title: "五次有效點擊", description: "一局中有 5 次有效修正。" },
  { name: "Efficient Click 10", title: "十次有效點擊", description: "一局中有 10 次有效修正。" },
  { name: "Early Planner", title: "提前規劃", description: "一局中有 5 次 early click。" },
  { name: "Optimal Timer", title: "最佳時機", description: "一局中有 5 次 optimal click。" },
  { name: "No Panic 3", title: "冷靜 3 分", description: "分數達到 3 且沒有 panic click。" },
  { name: "No Panic 10", title: "冷靜 10 分", description: "分數達到 10 且沒有 panic click。" },
  { name: "Low Panic", title: "低緊張操作", description: "一局 panic click 比例低於 10%。" },
  { name: "Panic Recovery", title: "緊張後恢復", description: "出現 panic click 後仍通過水管。" },
  { name: "Perfect Flight x2", title: "完美飛行 x2", description: "連續 2 次通過水管且接近中心。" },
  { name: "Perfect Flight x3", title: "完美飛行 x3", description: "連續 3 次通過水管且接近中心。" },
  { name: "Perfect Flight x5", title: "完美飛行 x5", description: "連續 5 次通過水管且接近中心。" },
  { name: "Perfect Flight x10", title: "完美飛行 x10", description: "連續 10 次通過水管且接近中心。" },
  { name: "Practice 3", title: "練習 3 局", description: "同一玩家完成 3 局。" },
  { name: "Practice 5", title: "練習 5 局", description: "同一玩家完成 5 局。" },
  { name: "Practice 10", title: "練習 10 局", description: "同一玩家完成 10 局。" },
  { name: "Practice 20", title: "練習 20 局", description: "同一玩家完成 20 局。" },
  { name: "Practice 40", title: "練習 40 局", description: "同一玩家完成 40 局。" },
  { name: "Slow Explorer", title: "慢速探索", description: "完成慢速模式一局。" },
  { name: "Normal Explorer", title: "普通探索", description: "完成普通模式一局。" },
  { name: "Fast Explorer", title: "快速探索", description: "完成快速模式一局。" },
  { name: "Speed Explorer", title: "三速探索者", description: "完成慢速、普通、快速三種模式。" },
  { name: "Daily Challenger", title: "每日挑戰者", description: "完成每日挑戰。" },
];

const canvas = document.querySelector("#gameCanvas");
const ctx = canvas.getContext("2d");
const playerNameInput = document.querySelector("#playerNameInput");
const playerPlayCount = document.querySelector("#playerPlayCount");
const startButton = document.querySelector("#startButton");
const restartButton = document.querySelector("#restartButton");
const exportButton = document.querySelector("#exportButton");
const clearButton = document.querySelector("#clearButton");
const dailyChallengeButton = document.querySelector("#dailyChallengeButton");
const dailyChallengeText = document.querySelector("#dailyChallengeText");
const soundButton = document.querySelector("#soundButton");
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
const bestSurvival = document.querySelector("#bestSurvival");
const bestStability = document.querySelector("#bestStability");
const rankValue = document.querySelector("#rankValue");
const achievementCount = document.querySelector("#achievementCount");
const encouragementText = document.querySelector("#encouragementText");
const analysisText = document.querySelector("#analysisText");
const recordText = document.querySelector("#recordText");
const stabilityStars = document.querySelector("#stabilityStars");
const controlStars = document.querySelector("#controlStars");
const rhythmStars = document.querySelector("#rhythmStars");
const playerTypeText = document.querySelector("#playerTypeText");
const achievementList = document.querySelector("#achievementList");

let allLogs = loadLogs();
let pendingUploads = loadPendingUploads();
let playerCounts = loadPlayerCounts();
let playerProfiles = loadPlayerProfiles();
let allUsersBestScore = calculateAllUsersBestScore();
let animationId = null;
let pendingClick = false;
let currentGameLogs = [];
let clickEvents = [];
let pendingCorrectionClicks = [];
let passEffects = [];
let uploadInProgress = false;
let uploadRerunRequested = false;
let lastCanvasTouchEnd = 0;
let soundEnabled = localStorage.getItem(SOUND_ENABLED_KEY) !== "false";
let audioContext = null;
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
  pipeCounter: 0,
  pipeEvent: null,
  score: 0,
  lastClickTime: null,
  deathReason: "none",
  flapPower: FIXED_FLAP_POWER,
  achievements: [],
  previousHeightVariation: null,
  finalUploadRows: [],
  deathAnimationStarted: 0,
  playerRank: "",
  isPersonalBest: false,
  stabilityScore: "",
  controlScore: "",
  rhythmScore: "",
  perfectCombo: 0,
  bestPerfectCombo: 0,
  comboMessage: "",
  comboEffectAge: 0,
  liveToast: "",
  liveToastAge: 0,
  recordCelebrated: false,
  dailyChallengeActive: false,
};

function updateSoundButton() {
  soundButton.textContent = soundEnabled ? "音效：開" : "音效：關";
  soundButton.setAttribute("aria-pressed", String(soundEnabled));
  soundButton.setAttribute("aria-label", soundEnabled ? "關閉音效與震動" : "開啟音效與震動");
}

function ensureAudioContext() {
  if (!soundEnabled) {
    return null;
  }
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) {
    return null;
  }
  if (!audioContext) {
    audioContext = new AudioContextClass();
  }
  if (audioContext.state === "suspended") {
    audioContext.resume().catch(() => {});
  }
  return audioContext;
}

function playTone(frequency, duration, { delay = 0, endFrequency = frequency, volume = 0.035, type = "sine" } = {}) {
  const context = ensureAudioContext();
  if (!context) {
    return;
  }
  const startsAt = context.currentTime + delay;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, startsAt);
  oscillator.frequency.exponentialRampToValueAtTime(Math.max(40, endFrequency), startsAt + duration);
  gain.gain.setValueAtTime(0.0001, startsAt);
  gain.gain.exponentialRampToValueAtTime(volume, startsAt + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, startsAt + duration);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(startsAt);
  oscillator.stop(startsAt + duration + 0.02);
}

function playSound(name) {
  if (!soundEnabled) {
    return;
  }
  if (name === "flap") {
    playTone(330, 0.075, { endFrequency: 520, volume: 0.022, type: "triangle" });
  } else if (name === "pass") {
    playTone(620, 0.09, { endFrequency: 820, volume: 0.032 });
  } else if (name === "perfect") {
    playTone(660, 0.11, { volume: 0.035, type: "triangle" });
    playTone(880, 0.13, { delay: 0.07, volume: 0.03, type: "triangle" });
  } else if (name === "achievement") {
    playTone(523, 0.12, { volume: 0.032, type: "triangle" });
    playTone(659, 0.12, { delay: 0.08, volume: 0.03, type: "triangle" });
    playTone(784, 0.18, { delay: 0.16, volume: 0.032, type: "triangle" });
  } else if (name === "gameOver") {
    playTone(210, 0.28, { endFrequency: 90, volume: 0.04, type: "sawtooth" });
  }
}

function vibrate(pattern) {
  if (soundEnabled && navigator.vibrate) {
    navigator.vibrate(pattern);
  }
}

function toggleSound() {
  soundEnabled = !soundEnabled;
  localStorage.setItem(SOUND_ENABLED_KEY, String(soundEnabled));
  updateSoundButton();
  if (soundEnabled) {
    playSound("pass");
    vibrate(18);
  }
}

function showLiveToast(message) {
  game.liveToast = message;
  game.liveToastAge = 0;
}

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
  try {
    localStorage.setItem(PENDING_UPLOADS_KEY, JSON.stringify(pendingUploads));
  } catch {
    setUploadStatus("本機暫存空間不足，請先等待自動上傳完成。");
  }
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
  try {
    localStorage.setItem(PLAYER_COUNTS_KEY, JSON.stringify(playerCounts));
  } catch {
    // Scores can still upload even if this browser cannot save more profile data.
  }
}

function savePlayerProfiles() {
  try {
    localStorage.setItem(PLAYER_PROFILES_KEY, JSON.stringify(playerProfiles));
  } catch {
    // Keep gameplay and upload running when localStorage is full.
  }
}

function getPlayerProfile(name) {
  if (!name) {
    return {
      bestScore: 0,
      bestSurvivalTime: 0,
      bestStabilityScore: 0,
      bestStabilityStd: null,
      achievements: [],
      speedsPlayed: [],
    };
  }
  if (!playerProfiles[name]) {
    playerProfiles[name] = {
      bestScore: 0,
      bestSurvivalTime: 0,
      bestStabilityScore: 0,
      bestStabilityStd: null,
      achievements: [],
      speedsPlayed: [],
    };
  }
  const profile = playerProfiles[name];
  profile.bestScore = Number(profile.bestScore) || 0;
  profile.bestSurvivalTime = Number(profile.bestSurvivalTime) || 0;
  profile.bestStabilityScore = Number(profile.bestStabilityScore) || 0;
  profile.bestStabilityStd = profile.bestStabilityStd === null || profile.bestStabilityStd === undefined
    ? null
    : Number(profile.bestStabilityStd);
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
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allLogs));
  } catch {
    allLogs = allLogs.slice(-5000);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(allLogs));
    } catch {
      allLogs = [];
    }
    setUploadStatus("本機資料太多，已保留最近資料並繼續上傳。");
  }
  savedRowsValue.textContent = allLogs.length;
}

function refreshAllUsersBestScore() {
  allUsersBestScore = calculateAllUsersBestScore();
}

function setUploadStatus(message) {
  const pendingText = pendingUploads.length ? ` 待傳：${pendingUploads.length}` : "";
  if (uploadStatus) {
    uploadStatus.textContent = `${message}${pendingText}`;
  }
  if (uploadStatusTop) {
    uploadStatusTop.textContent = `上傳：${message}${pendingText}`;
  }
  if (uploadResult) {
    uploadResult.textContent = `${message}${pendingText}`;
  }
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
  if (bestSurvival) {
    bestSurvival.textContent = name && profile.bestSurvivalTime ? `${profile.bestSurvivalTime.toFixed(2)} 秒` : "--";
  }
  if (bestStability) {
    bestStability.textContent = name && profile.bestStabilityScore ? `${profile.bestStabilityScore}/5` : "--";
  }
  if (rankValue) {
    rankValue.textContent = name ? getRankLabel(profile.bestScore) : "--";
  }
  if (achievementCount) {
    achievementCount.textContent = name ? formatAchievementProgress(profile) : "--";
  }
  renderAchievements();
}

function preparePlayerForGame() {
  const name = getPlayerName();
  if (!name) {
    gameStatus.textContent = "請先輸入玩家名字。";
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

function setSpeedLevel(speedLevel) {
  for (const input of speedInputs) {
    input.checked = input.value === speedLevel;
  }
}

function enableDailyChallenge() {
  game.dailyChallengeActive = true;
  setSpeedLevel("normal");
  dailyChallengeText.textContent = `今日挑戰：普通速度達到 ${DAILY_CHALLENGE_TARGET} 分。`;
  gameStatus.textContent = `今日挑戰已啟動：普通速度達到 ${DAILY_CHALLENGE_TARGET} 分。`;
}

function randomGapCenter() {
  return 150 + Math.random() * (GROUND_Y - 270);
}

function createPipe(x) {
  game.pipeCounter += 1;
  return {
    id: game.pipeCounter,
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
  pendingCorrectionClicks = [];
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
  game.pipeCounter = 0;
  game.pipeEvent = null;
  game.pipes = [createPipe(560), createPipe(560 + PIPE_SPACING)];
  game.score = 0;
  game.lastClickTime = null;
  game.deathReason = "none";
  game.achievements = [];
  game.previousHeightVariation = Number(localStorage.getItem(LAST_HEIGHT_VARIATION_KEY) || "") || null;
  game.finalUploadRows = [];
  game.deathAnimationStarted = 0;
  game.playerRank = getRankName(0);
  game.isPersonalBest = false;
  game.stabilityScore = "";
  game.controlScore = "";
  game.rhythmScore = "";
  game.perfectCombo = 0;
  game.bestPerfectCombo = 0;
  game.comboMessage = "";
  game.comboEffectAge = 0;
  game.liveToast = "";
  game.liveToastAge = 0;
  game.recordCelebrated = false;

  gameStatus.textContent = "準備好了，點一下就飛。";
  updateLiveMetrics(0);
  resetDashboard();
  drawScene();
}

function startGame() {
  if (!preparePlayerForGame()) {
    return;
  }
  if (game.dailyChallengeActive) {
    setSpeedLevel("normal");
  }
  resetGame();
  game.playerName = getPlayerName();
  game.playerPlayCount = playerCounts[game.playerName] || 1;
  game.dailyChallengeActive = game.dailyChallengeActive;
  game.running = true;
  ensureAudioContext();
  game.startTime = performance.now();
  game.lastFrameTime = game.startTime;
  gameStatus.textContent = "遊戲中，點一下往上飛。";
  if (pendingUploads.length || uploadInProgress) {
    setUploadStatus("上一局正在上傳，結束後會繼續處理。");
  } else {
    setUploadStatus("待機，結束後自動上傳完整一局。");
  }
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
  playSound("flap");
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
      time: elapsedSeconds,
      clickInterval: clickInterval === "" ? null : Number(clickInterval),
      errorToCenter: errorToCenter === "" ? null : Number(errorToCenter),
      nextPipeDistance: nextPipeDistance === "" ? null : Number(nextPipeDistance.toFixed(2)),
      rowIndex: null,
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
  const pipeEvent = isPipeDeath(death) ? { pipe: getNextPipe(), result: "fail" } : game.pipeEvent;
  if (isSampleFrame || isClick || isDead || pipeEvent) {
    const rowIndex = logFrame({
      time: elapsedSeconds,
      isClick,
      clickInterval,
      errorToCenter,
      isDead,
      deathReason: game.deathReason,
      sampleType: getSampleType({ isSampleFrame, isClick, isDead, pipeResult: pipeEvent?.result || "pending" }),
      pipeOverride: pipeEvent?.pipe || null,
      pipeResult: pipeEvent?.result || "pending",
    });
    if (isClick && rowIndex !== null) {
      const clickEvent = clickEvents[clickEvents.length - 1];
      if (clickEvent) {
        clickEvent.rowIndex = rowIndex;
      }
      pendingCorrectionClicks.push({
        rowIndex,
        time: elapsedSeconds,
        gapCenter: Number(currentGameLogs[rowIndex]?.pipe_gap_center),
      });
    }
  }
  game.pipeEvent = null;
  completePendingCorrections(elapsedSeconds, false);

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
      const centerError = Math.abs(game.birdY - pipe.gapCenter);
      const isPerfect = centerError <= PERFECT_FLIGHT_ERROR;
      if (isPerfect) {
        game.perfectCombo += 1;
        game.bestPerfectCombo = Math.max(game.bestPerfectCombo, game.perfectCombo);
        game.comboMessage = `完美飛行 x${game.perfectCombo}`;
        game.comboEffectAge = 0;
      } else {
        game.perfectCombo = 0;
      }
      playSound(isPerfect ? "perfect" : "pass");
      vibrate(isPerfect ? [18, 24, 22] : 16);
      const profile = getPlayerProfile(game.playerName);
      if (!game.recordCelebrated && game.score > profile.bestScore) {
        game.recordCelebrated = true;
        showLiveToast(`新紀錄！${game.score} 分`);
      } else if (SCORE_MILESTONES.includes(game.score)) {
        showLiveToast(`抵達 ${game.score} 分里程碑！`);
      }
      passEffects.push({
        x: BIRD_X + 38,
        y: game.birdY,
        age: 0,
        label: isPerfect ? `完美 x${game.perfectCombo}` : "",
      });
      game.pipeEvent = { pipe, result: "pass" };
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
  if (game.score >= 5) {
    addAchievement("Score 5");
  }
  if (game.score >= 10) {
    addAchievement("Pipe Reader");
  }
  if (game.score >= 20) {
    addAchievement("Score 20");
  }
  if (game.score >= 30) {
    addAchievement("Calm Pilot");
  }
  if (game.score >= 50) {
    addAchievement("Expert");
  }
  if (game.score >= 70) {
    addAchievement("Score 70");
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
  const profile = getPlayerProfile(game.playerName);
  const isNewForPlayer = game.playerName && !profile.achievements.includes(name);
  if (!game.achievements.includes(name)) {
    game.achievements.push(name);
  }
  if (game.playerName && !profile.achievements.includes(name)) {
    profile.achievements.push(name);
    savePlayerProfiles();
  }
  if (game.running && isNewForPlayer) {
    const achievement = ACHIEVEMENTS.find((item) => item.name === name);
    showLiveToast(`新成就：${achievement?.title || name}`);
    playSound("achievement");
    vibrate([22, 30, 22]);
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

function isPipeDeath(reason) {
  return reason === "hit_top_pipe" || reason === "hit_bottom_pipe";
}

function getSampleType({ isSampleFrame, isClick, isDead, pipeResult = "pending" }) {
  if (isDead) {
    return "death";
  }
  if (pipeResult === "pass") {
    return isClick ? "pipe_pass_click" : "pipe_pass";
  }
  if (isClick && isSampleFrame) {
    return "sample_click";
  }
  if (isClick) {
    return "click";
  }
  return "sample";
}

function logFrame({
  time,
  isClick,
  clickInterval,
  errorToCenter,
  isDead,
  deathReason,
  sampleType,
  pipeOverride = null,
  pipeResult = "pending",
}) {
  const pipe = pipeOverride || getNextPipe();
  const numericClickInterval = clickInterval === "" ? null : Number(clickInterval);
  const numericError = errorToCenter === "" ? null : Number(errorToCenter);
  const nextPipeDistance = pipe.x - BIRD_X;
  const isPanicClick = isClick && numericClickInterval !== null && numericClickInterval < 0.3;
  const clickTimingType = isClick ? getClickTimingType(nextPipeDistance) : "none";
  const beforeError = isClick && Number.isFinite(numericError) ? Math.abs(numericError) : "";
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
    next_pipe_distance: nextPipeDistance.toFixed(2),
    score: game.score,
    is_click: isClick ? 1 : 0,
    is_dead: isDead ? 1 : 0,
    death_reason: deathReason,
    click_interval: clickInterval,
    error_to_center: errorToCenter,
    sample_type: sampleType,
    bird_skin_level: getBirdSkinLevel(),
    player_rank: game.playerRank || getRankName(game.score),
    is_personal_best: game.isPersonalBest ? 1 : 0,
    stability_score: game.stabilityScore,
    control_score: game.controlScore,
    rhythm_score: game.rhythmScore,
    pipe_id: pipe.id,
    pipe_result: pipeResult,
    is_panic_click: isPanicClick ? 1 : 0,
    click_timing_type: clickTimingType,
    before_error: beforeError === "" ? "" : beforeError.toFixed(2),
    after_error: "",
    correction_efficiency: "",
    last_3s_avg_error: "",
    last_3s_error_std: "",
    last_3s_click_rate: "",
    last_3s_panic_click_rate: "",
  };
  currentGameLogs.push(row);
  return currentGameLogs.length - 1;
}

function endGame(elapsedSeconds) {
  game.running = false;
  game.over = true;
  game.deathAnimationStarted = performance.now();
  playSound("gameOver");
  vibrate([45, 50, 80]);
  window.cancelAnimationFrame(animationId);
  animationId = null;
  ensureDeathFrameLogged(elapsedSeconds);
  completePendingCorrections(elapsedSeconds, true);
  applyDeathWindowStats(elapsedSeconds);
  const roundSummary = calculateRoundSummary(elapsedSeconds);
  updatePlayerProgress(roundSummary);
  applyRoundSummaryToRows(roundSummary);
  gameStatus.textContent = `Game over：${formatDeathReason(game.deathReason)}。`;
  uploadCompletedGame();
  allLogs = allLogs.concat(currentGameLogs);
  refreshAllUsersBestScore();
  saveLogs();
  showDashboard(roundSummary);
  gameStatus.textContent = `Game over：${formatDeathReason(game.deathReason)}`;
  drawScene();
}

function ensureDeathFrameLogged(elapsedSeconds) {
  const lastRow = currentGameLogs[currentGameLogs.length - 1];
  if (lastRow && lastRow.is_dead === 1 && lastRow.death_reason === game.deathReason) {
    return;
  }

  const pipeEvent = isPipeDeath(game.deathReason) ? { pipe: getNextPipe(), result: "fail" } : null;
  logFrame({
    time: elapsedSeconds,
    isClick: false,
    clickInterval: "",
    errorToCenter: "",
    isDead: true,
    deathReason: game.deathReason,
    sampleType: "death",
    pipeOverride: pipeEvent?.pipe || null,
    pipeResult: pipeEvent?.result || "pending",
  });
}

function getClickTimingType(nextPipeDistance) {
  if (nextPipeDistance > 200) {
    return "early";
  }
  if (nextPipeDistance >= 50) {
    return "optimal";
  }
  return "late";
}

function completePendingCorrections(elapsedSeconds, force) {
  const stillPending = [];
  for (const pending of pendingCorrectionClicks) {
    if (!force && elapsedSeconds - pending.time < CORRECTION_DELAY_SECONDS) {
      stillPending.push(pending);
      continue;
    }

    const row = currentGameLogs[pending.rowIndex];
    const beforeError = Number(row?.before_error);
    const afterError = Number.isFinite(pending.gapCenter) ? Math.abs(game.birdY - pending.gapCenter) : null;
    if (row && Number.isFinite(beforeError) && afterError !== null) {
      row.after_error = afterError.toFixed(2);
      row.correction_efficiency = (beforeError - afterError).toFixed(2);
    }
  }
  pendingCorrectionClicks = stillPending;
}

function applyDeathWindowStats(elapsedSeconds) {
  const deathRow = currentGameLogs[currentGameLogs.length - 1];
  if (!deathRow || Number(deathRow.is_dead) !== 1) {
    return;
  }

  const windowStart = Math.max(0, elapsedSeconds - LAST_WINDOW_SECONDS);
  const windowDuration = Math.max(0.001, elapsedSeconds - windowStart);
  const rows = currentGameLogs.filter((row) => Number(row.time) >= windowStart && Number(row.time) <= elapsedSeconds);
  const errors = rows
    .map((row) => Math.abs(Number(row.bird_y) - Number(row.pipe_gap_center)))
    .filter((value) => Number.isFinite(value));
  const clickCount = rows.filter((row) => Number(row.is_click) === 1).length;
  const panicClickCount = rows.filter((row) => Number(row.is_panic_click) === 1).length;

  deathRow.last_3s_avg_error = errors.length ? average(errors).toFixed(2) : "";
  deathRow.last_3s_error_std = errors.length >= 2 ? standardDeviation(errors).toFixed(2) : "";
  deathRow.last_3s_click_rate = (clickCount / windowDuration).toFixed(3);
  deathRow.last_3s_panic_click_rate = (panicClickCount / windowDuration).toFixed(3);
}

function resetDashboard() {
  survivalTime.textContent = "--";
  finalScore.textContent = "--";
  const profile = getPlayerProfile(getPlayerName());
  bestScore.textContent = getPlayerName() ? profile.bestScore : "--";
  bestSurvival.textContent = getPlayerName() && profile.bestSurvivalTime ? `${profile.bestSurvivalTime.toFixed(2)} 秒` : "--";
  bestStability.textContent = getPlayerName() && profile.bestStabilityScore ? `${profile.bestStabilityScore}/5` : "--";
  rankValue.textContent = getPlayerName() ? getRankLabel(profile.bestScore) : "--";
  achievementCount.textContent = getPlayerName() ? formatAchievementProgress(profile) : "--";
  clicksPerSecond.textContent = "--";
  averageError.textContent = "--";
  deathReason.textContent = "--";
  heightVariation.textContent = "--";
  uploadResult.textContent = uploadStatus?.textContent || uploadStatusTop?.textContent || "--";
  encouragementText.textContent = "完成一局，下一局可以更穩。";
  analysisText.textContent = "結束後會顯示飛行分析。";
  recordText.textContent = "目前還沒有本局紀錄。";
  stabilityStars.textContent = "-----";
  controlStars.textContent = "-----";
  rhythmStars.textContent = "-----";
  playerTypeText.textContent = "完成遊戲後分析玩家類型。";
  renderAchievements();
}

function calculateRoundSummary(elapsedSeconds) {
  const clicks = clickEvents.length;
  const absErrors = clickEvents
    .map((event) => event.errorToCenter)
    .filter((value) => typeof value === "number")
    .map((value) => Math.abs(value));
  const heights = currentGameLogs.map((row) => Number(row.bird_y));
  const heightStd = heights.length ? standardDeviation(heights) : null;
  const clicksPerSecondValue = elapsedSeconds > 0 ? clicks / elapsedSeconds : 0;
  const clickIntervals = clickEvents
    .map((event) => event.clickInterval)
    .filter((value) => typeof value === "number" && Number.isFinite(value));
  const rhythmStd = clickIntervals.length >= 2 ? standardDeviation(clickIntervals) : null;
  const avgAbsError = absErrors.length ? average(absErrors) : null;
  const stabilityScore = scoreStability(heightStd);
  const controlScore = scoreControl(avgAbsError);
  const rhythmScore = scoreRhythm(rhythmStd, clickIntervals.length);
  const playerRank = getRankName(game.score);
  const loggedClicks = currentGameLogs.filter((row) => Number(row.is_click) === 1);
  const panicClicks = loggedClicks.filter((row) => Number(row.is_panic_click) === 1);
  const earlyClicks = loggedClicks.filter((row) => row.click_timing_type === "early").length;
  const optimalClicks = loggedClicks.filter((row) => row.click_timing_type === "optimal").length;
  const lateClicks = loggedClicks.filter((row) => row.click_timing_type === "late").length;
  const correctionValues = currentGameLogs
    .map((row) => Number(row.correction_efficiency))
    .filter((value) => Number.isFinite(value));
  const efficientClickCount = correctionValues.filter((value) => value > 0).length;
  const avgCorrectionEfficiency = correctionValues.length ? average(correctionValues) : null;

  return {
    elapsedSeconds,
    clicks,
    absErrors,
    avgAbsError,
    heights,
    heightStd,
    clicksPerSecondValue,
    rhythmStd,
    stabilityScore,
    controlScore,
    rhythmScore,
    playerRank,
    playerType: getPlayerType({ stabilityScore, controlScore, rhythmScore }),
    loggedClicks,
    panicClickCount: panicClicks.length,
    earlyClicks,
    optimalClicks,
    lateClicks,
    correctionValues,
    efficientClickCount,
    avgCorrectionEfficiency,
    recordMessages: [],
    isPersonalBest: false,
  };
}

function applyRoundSummaryToRows(summary) {
  game.playerRank = summary.playerRank;
  game.isPersonalBest = summary.isPersonalBest;
  game.stabilityScore = summary.stabilityScore;
  game.controlScore = summary.controlScore;
  game.rhythmScore = summary.rhythmScore;

  for (const row of currentGameLogs) {
    row.player_rank = summary.playerRank;
    row.is_personal_best = summary.isPersonalBest ? 1 : 0;
    row.stability_score = summary.stabilityScore;
    row.control_score = summary.controlScore;
    row.rhythm_score = summary.rhythmScore;
  }
}

function showDashboard(summary) {
  if (summary.elapsedSeconds >= 12 && summary.heightStd !== null && summary.heightStd <= 85) {
    addAchievement("Stable Pilot");
  }

  survivalTime.textContent = `${summary.elapsedSeconds.toFixed(2)} 秒`;
  finalScore.textContent = game.score;
  const profile = getPlayerProfile(game.playerName);
  bestScore.textContent = profile.bestScore;
  bestSurvival.textContent = profile.bestSurvivalTime ? `${profile.bestSurvivalTime.toFixed(2)} 秒` : "--";
  bestStability.textContent = profile.bestStabilityScore ? `${profile.bestStabilityScore}/5` : "--";
  rankValue.textContent = getRankLabel(profile.bestScore);
  achievementCount.textContent = formatAchievementProgress(profile);
  clicksPerSecond.textContent = summary.clicksPerSecondValue.toFixed(2);
  averageError.textContent = summary.avgAbsError !== null ? summary.avgAbsError.toFixed(2) : "--";
  deathReason.textContent = formatDeathReason(game.deathReason);
  heightVariation.textContent = summary.heightStd !== null ? summary.heightStd.toFixed(2) : "--";
  encouragementText.textContent = getEncouragement();
  analysisText.textContent = getRoundAnalysis(summary);
  recordText.textContent = getRecordText(summary);
  stabilityStars.textContent = stars(summary.stabilityScore);
  controlStars.textContent = stars(summary.controlScore);
  rhythmStars.textContent = summary.rhythmScore ? stars(summary.rhythmScore) : "資料不足";
  playerTypeText.textContent = `你的類型：${summary.playerType}`;
  renderAchievements();
  if (summary.heightStd !== null) {
    localStorage.setItem(LAST_HEIGHT_VARIATION_KEY, String(summary.heightStd));
  }
}

function updatePlayerProgress(summary) {
  const profile = getPlayerProfile(game.playerName);
  if (!game.playerName) {
    return;
  }

  const oldBestScore = profile.bestScore;
  const oldBestSurvival = profile.bestSurvivalTime;

  if (!profile.speedsPlayed.includes(game.speedLevel)) {
    profile.speedsPlayed.push(game.speedLevel);
  }
  if (game.score > profile.bestScore) {
    profile.bestScore = game.score;
    summary.isPersonalBest = true;
    addAchievement("Personal Best");
    summary.recordMessages.push(getScoreRecordMessage(game.score, oldBestScore));
  } else if (profile.bestScore > game.score) {
    const gap = profile.bestScore - game.score;
    summary.recordMessages.push(`只差 ${gap} 分就突破你的最高分。`);
  }
  if (summary.elapsedSeconds > profile.bestSurvivalTime) {
    profile.bestSurvivalTime = summary.elapsedSeconds;
    summary.isPersonalBest = true;
    summary.recordMessages.push(getSurvivalRecordMessage(summary.elapsedSeconds, oldBestSurvival));
  }
  if (summary.stabilityScore > profile.bestStabilityScore) {
    profile.bestStabilityScore = summary.stabilityScore;
    profile.bestStabilityStd = summary.heightStd;
    summary.isPersonalBest = true;
    summary.recordMessages.push(`穩定度進步到 ${summary.stabilityScore}/5。`);
  }
  if (game.playerPlayCount >= 5) {
    addAchievement("Practice 5");
  }
  if (game.playerPlayCount >= 3) {
    addAchievement("Practice 3");
  }
  if (game.playerPlayCount >= 10) {
    addAchievement("Practice 10");
  }
  if (game.playerPlayCount >= 20) {
    addAchievement("Practice 20");
  }
  if (game.playerPlayCount >= 40) {
    addAchievement("Practice 40");
  }
  if (profile.speedsPlayed.includes("slow")) {
    addAchievement("Slow Explorer");
  }
  if (profile.speedsPlayed.includes("normal")) {
    addAchievement("Normal Explorer");
  }
  if (profile.speedsPlayed.includes("fast")) {
    addAchievement("Fast Explorer");
  }
  if (profile.speedsPlayed.length >= 3) {
    addAchievement("Speed Explorer");
  }
  if (summary.heightStd !== null && summary.heightStd <= 65 && game.score >= 5) {
    addAchievement("Steady Wing");
  }
  if (game.bestPerfectCombo >= 5) {
    addAchievement("Perfect Flight x5");
  }
  if (game.dailyChallengeActive && game.speedLevel === "normal" && game.score >= DAILY_CHALLENGE_TARGET) {
    addAchievement("Daily Challenger");
  }
  unlockRoundAchievements(summary);
  savePlayerProfiles();
  updatePlayerCountDisplay();
}

function unlockRoundAchievements(summary) {
  if (summary.elapsedSeconds >= 5) addAchievement("Survive 5");
  if (summary.elapsedSeconds >= 10) addAchievement("Survive 10");
  if (summary.elapsedSeconds >= 20) addAchievement("Survive 20");
  if (summary.elapsedSeconds >= 30) addAchievement("Survive 30");
  if (summary.elapsedSeconds >= 45) addAchievement("Survive 45");
  if (summary.elapsedSeconds >= 12 && summary.heightStd !== null && summary.heightStd <= 85) addAchievement("Stable Pilot");

  if (summary.stabilityScore >= 3) addAchievement("Stability 3");
  if (summary.stabilityScore >= 4) addAchievement("Stability 4");
  if (summary.stabilityScore >= 5) addAchievement("Stability 5");
  if (summary.controlScore >= 3) addAchievement("Control 3");
  if (summary.controlScore >= 4) addAchievement("Control 4");
  if (summary.controlScore >= 5) addAchievement("Control 5");
  if (summary.rhythmScore >= 3) addAchievement("Rhythm 3");
  if (summary.rhythmScore >= 4) addAchievement("Rhythm 4");
  if (summary.rhythmScore >= 5) addAchievement("Rhythm 5");

  if (summary.avgCorrectionEfficiency !== null && summary.avgCorrectionEfficiency > 0) addAchievement("Efficient Click");
  if (summary.efficientClickCount >= 5) addAchievement("Efficient Click 5");
  if (summary.efficientClickCount >= 10) addAchievement("Efficient Click 10");
  if (summary.earlyClicks >= 5) addAchievement("Early Planner");
  if (summary.optimalClicks >= 5) addAchievement("Optimal Timer");

  if (game.score >= 3 && summary.panicClickCount === 0) addAchievement("No Panic 3");
  if (game.score >= 10 && summary.panicClickCount === 0) addAchievement("No Panic 10");
  if (summary.loggedClicks.length >= 5 && summary.panicClickCount / summary.loggedClicks.length < 0.1) addAchievement("Low Panic");

  if (game.bestPerfectCombo >= 2) addAchievement("Perfect Flight x2");
  if (game.bestPerfectCombo >= 3) addAchievement("Perfect Flight x3");
  if (game.bestPerfectCombo >= 10) addAchievement("Perfect Flight x10");
}

function getEncouragement() {
  if (game.dailyChallengeActive && game.score >= DAILY_CHALLENGE_TARGET) {
    return "今日挑戰成功，這局很有代表性。";
  }
  if (game.score >= 50) {
    return "很強，已經進入高手區間。";
  }
  if (game.score >= 20) {
    return "控制越來越穩，可以觀察你的點擊時機。";
  }
  if (game.score >= 1) {
    return "有通過水管，下一局試著更穩。";
  }
  return "第一局先熟悉節奏，資料也很有用。";
}

function scoreStability(heightStd) {
  if (heightStd === null || !Number.isFinite(heightStd)) {
    return 0;
  }
  if (heightStd <= 45) return 5;
  if (heightStd <= 65) return 4;
  if (heightStd <= 85) return 3;
  if (heightStd <= 110) return 2;
  return 1;
}

function scoreControl(avgAbsError) {
  if (avgAbsError === null || !Number.isFinite(avgAbsError)) {
    return 0;
  }
  if (avgAbsError <= 35) return 5;
  if (avgAbsError <= 55) return 4;
  if (avgAbsError <= 75) return 3;
  if (avgAbsError <= 100) return 2;
  return 1;
}

function scoreRhythm(rhythmStd, intervalCount) {
  if (intervalCount < 2 || rhythmStd === null || !Number.isFinite(rhythmStd)) {
    return 0;
  }
  if (rhythmStd <= 0.12) return 5;
  if (rhythmStd <= 0.2) return 4;
  if (rhythmStd <= 0.32) return 3;
  if (rhythmStd <= 0.5) return 2;
  return 1;
}

function stars(score) {
  if (!score) {
    return "-----";
  }
  return `${"★".repeat(score)}${"☆".repeat(5 - score)}`;
}

function getRankName(score) {
  if (score >= 80) return "傳奇飛行員";
  if (score >= 30) return "高手飛行員";
  if (score >= 10) return "熟練飛行員";
  return "新手飛行員";
}

function getRankLabel(score) {
  if (score >= 80) return "傳奇飛行員";
  if (score >= 30) return "高手飛行員";
  if (score >= 10) return "熟練飛行員";
  return "新手飛行員";
}

function formatSpeedLevel(speedLevel) {
  if (speedLevel === "slow") return "慢速";
  if (speedLevel === "fast") return "快速";
  return "普通";
}

function formatDeathReason(reason) {
  if (reason === "hit_top_pipe") return "撞到上方水管";
  if (reason === "hit_bottom_pipe") return "撞到下方水管";
  if (reason === "hit_ground") return "撞到地面";
  return "無";
}

function getPlayerType({ stabilityScore, controlScore, rhythmScore }) {
  const scores = [
    { label: "穩定型玩家", value: stabilityScore },
    { label: "控制型玩家", value: controlScore },
    { label: "節奏型玩家", value: rhythmScore },
  ].filter((score) => score.value > 0);
  if (!scores.length) {
    return "資料不足";
  }
  scores.sort((a, b) => b.value - a.value);
  return scores[0].label;
}

function getScoreRecordMessage(score, oldBestScore) {
  if (!oldBestScore) {
    return `New Record！本次最高分：${score} 分。`;
  }
  const improvement = ((score - oldBestScore) / oldBestScore) * 100;
  return `New Record！比之前進步 ${improvement.toFixed(0)}%。`;
}

function getSurvivalRecordMessage(elapsedSeconds, oldBestSurvival) {
  if (!oldBestSurvival) {
    return `最長生存時間：${elapsedSeconds.toFixed(2)} 秒。`;
  }
  const improvement = ((elapsedSeconds - oldBestSurvival) / oldBestSurvival) * 100;
  return `最長生存時間比之前進步 ${improvement.toFixed(0)}%。`;
}

function getRecordText(summary) {
  if (summary.recordMessages.length) {
    return summary.recordMessages.join(" ");
  }
  const profile = getPlayerProfile(game.playerName);
  if (profile.bestScore > game.score) {
    const gap = profile.bestScore - game.score;
    return `只差 ${gap} 分突破你的最高分。`;
  }
  return "繼續挑戰，讓資料更完整。";
}

function getRoundAnalysis({ clicksPerSecondValue, absErrors, heightStd, stabilityScore, controlScore, rhythmScore, playerType }) {
  const notes = [];
  if (clicksPerSecondValue > 2.4) {
    notes.push("你的點擊頻率偏高，可能有緊張連點。");
  } else if (clicksPerSecondValue < 1.0) {
    notes.push("你的點擊頻率偏低，可能反應較慢。");
  } else {
    notes.push("你的點擊節奏大致穩定。");
  }

  if (absErrors.length && average(absErrors) > 80) {
    notes.push("平均高度離洞口中心較遠。");
  } else if (absErrors.length) {
    notes.push("高度控制接近洞口中心。");
  }

  if (heightStd !== null && game.previousHeightVariation !== null) {
    if (heightStd < game.previousHeightVariation) {
      notes.push("高度波動比上一局更穩。");
    } else if (heightStd > game.previousHeightVariation) {
      notes.push("高度波動比上一局更大。");
    }
  }

  if (stabilityScore >= 4) {
    notes.push("穩定度表現很好。");
  }
  if (controlScore >= 4) {
    notes.push("控制能力接近洞口中心。");
  }
  if (rhythmScore >= 4) {
    notes.push("點擊節奏很一致。");
  }
  notes.push(`本局類型：${playerType}。`);

  return notes.join(" ");
}

function formatAchievementProgress(profile) {
  return `${profile.achievements.length}/${ACHIEVEMENTS.length}`;
}

function calculateAllUsersBestScore() {
  const best = { score: 0, player: "" };

  for (const [name, profile] of Object.entries(playerProfiles)) {
    const score = Number(profile.bestScore) || 0;
    if (score > best.score) {
      best.score = score;
      best.player = name;
    }
  }

  for (const row of allLogs) {
    const score = Number(row.score) || 0;
    if (score > best.score) {
      best.score = score;
      best.player = row.player_name || "";
    }
  }

  return best;
}

function getAllUsersBestScore() {
  if (game.playerName && game.score > allUsersBestScore.score) {
    return { score: game.score, player: game.playerName };
  }
  return allUsersBestScore;
}

function refreshGlobalBestFromSheet() {
  return new Promise((resolve) => {
    const callbackName = `flappyGlobalBest_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const query = "select B, max(O) where B is not null group by B order by max(O) desc limit 1";
    const script = document.createElement("script");
    const cleanup = () => {
      delete window[callbackName];
      script.remove();
    };
    const timeoutId = window.setTimeout(() => {
      cleanup();
      resolve(false);
    }, 7000);

    window[callbackName] = (response) => {
      window.clearTimeout(timeoutId);
      const cells = response?.table?.rows?.[0]?.c || [];
      const player = String(cells[0]?.v || "");
      const score = Number(cells[1]?.v) || 0;
      cleanup();
      if (score > 0) {
        allUsersBestScore = { score, player };
        drawScene();
        resolve(true);
        return;
      }
      resolve(false);
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

function renderAchievements() {
  achievementList.innerHTML = "";
  const name = game.playerName || getPlayerName();
  const profile = getPlayerProfile(name);
  const completed = new Set(profile.achievements);
  const newlyCompleted = new Set(game.achievements);

  for (const achievement of ACHIEVEMENTS) {
    const item = document.createElement("li");
    const isComplete = completed.has(achievement.name);
    const isNew = newlyCompleted.has(achievement.name);
    item.className = `achievement-item ${isComplete ? "completed" : "locked"}${isNew ? " new" : ""}`;
    item.innerHTML = `
      <strong>${isComplete ? "完成" : "未完成"}：${achievement.title}${isNew ? " 新達成" : ""}</strong>
      <span>${achievement.description}</span>
    `;
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
  timeValue.textContent = `${elapsedSeconds.toFixed(1)} 秒`;
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
    if (effect.label) {
      ctx.fillStyle = "#111827";
      ctx.font = "800 16px system-ui";
      ctx.textAlign = "center";
      ctx.fillText(effect.label, effect.x + 18, effect.y - 26 - progress * 18);
      ctx.textAlign = "left";
    }
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
  const profile = getPlayerProfile(game.playerName);
  const allBest = getAllUsersBestScore();
  const myBest = game.playerName ? Math.max(profile.bestScore, game.score) : 0;
  const rankName = getRankName(myBest);
  const finalMilestone = SCORE_MILESTONES[SCORE_MILESTONES.length - 1];
  const nextMilestone = SCORE_MILESTONES.find((score) => score > game.score) || finalMilestone;
  const previousMilestone = [...SCORE_MILESTONES].reverse().find((score) => score <= game.score) || 0;
  const milestoneSpan = Math.max(1, nextMilestone - previousMilestone);
  const milestoneProgress = nextMilestone === previousMilestone ? 1 : (game.score - previousMilestone) / milestoneSpan;

  drawRoundedPanel(14, 14, 222, 126, 8, "rgba(255, 255, 255, 0.58)", "rgba(17, 24, 39, 0.16)");
  ctx.fillStyle = "rgba(17, 24, 39, 0.88)";
  ctx.font = "700 20px system-ui";
  ctx.fillText(`分數：${game.score}`, 28, 42);
  ctx.font = "700 14px system-ui";
  ctx.fillText(`速度：${formatSpeedLevel(game.speedLevel)}`, 28, 64);
  if (game.playerName) {
    ctx.fillText(`${game.playerName} 第 ${game.playerPlayCount} 局`, 28, 84, 180);
  }
  ctx.fillText(`全體最高：${allBest.score}${allBest.player ? `（${allBest.player}）` : ""}`, 28, 104, 194);
  ctx.fillText(`個人最高：${myBest} | ${rankName}`, 28, 124, 194);

  drawRoundedPanel(248, 14, 218, 64, 8, "rgba(17, 24, 39, 0.66)", "rgba(255, 255, 255, 0.3)");
  ctx.fillStyle = "rgba(255, 255, 255, 0.92)";
  ctx.font = "800 13px system-ui";
  ctx.fillText(game.score >= finalMilestone ? "傳奇里程碑完成" : `下一站：${nextMilestone} 分`, 260, 37);
  ctx.fillStyle = "rgba(255, 255, 255, 0.24)";
  ctx.fillRect(260, 48, 190, 12);
  ctx.fillStyle = "#ffd84d";
  ctx.fillRect(260, 48, 190 * Math.max(0, Math.min(1, milestoneProgress)), 12);

  if (game.dailyChallengeActive) {
    drawRoundedPanel(14, 148, 190, 28, 8, "rgba(232, 247, 239, 0.72)", "rgba(45, 138, 79, 0.2)");
    ctx.fillStyle = "rgba(29, 107, 58, 0.92)";
    ctx.font = "800 13px system-ui";
    ctx.fillText(`今日挑戰：普通 ${DAILY_CHALLENGE_TARGET} 分`, 24, 167);
  }

  if (game.comboMessage && game.comboEffectAge < 80) {
    const alpha = Math.max(0, 1 - game.comboEffectAge / 80);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = "rgba(255, 216, 77, 0.92)";
    ctx.strokeStyle = "rgba(17, 24, 39, 0.82)";
    ctx.lineWidth = 4;
    ctx.textAlign = "center";
    ctx.font = "900 28px system-ui";
    ctx.strokeText(game.comboMessage, CANVAS_WIDTH / 2, 170);
    ctx.fillText(game.comboMessage, CANVAS_WIDTH / 2, 170);
    ctx.restore();
    game.comboEffectAge += 1;
  }

  if (game.liveToast && game.liveToastAge < 110) {
    const fadeIn = Math.min(1, game.liveToastAge / 10);
    const fadeOut = Math.min(1, (110 - game.liveToastAge) / 18);
    const lift = Math.min(12, game.liveToastAge * 0.35);
    ctx.save();
    ctx.globalAlpha = Math.min(fadeIn, fadeOut);
    drawRoundedPanel(80, 206 - lift, 320, 48, 12, "rgba(17, 24, 39, 0.88)", "rgba(255, 216, 77, 0.9)");
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.font = "900 18px system-ui";
    ctx.fillText(game.liveToast, CANVAS_WIDTH / 2, 237 - lift, 292);
    ctx.restore();
    game.liveToastAge += 1;
  }

  if (!game.running && !game.over) {
    drawCenterText("準備開始", "點一下或按 Space 就飛");
  }
  if (game.over) {
    drawCenterText("遊戲結束", formatDeathReason(game.deathReason));
  }
}

function drawRoundedPanel(x, y, width, height, radius, fillStyle, strokeStyle) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  ctx.fillStyle = fillStyle;
  ctx.fill();
  ctx.strokeStyle = strokeStyle;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
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
    "player_rank",
    "is_personal_best",
    "stability_score",
    "control_score",
    "rhythm_score",
    "pipe_id",
    "pipe_result",
    "is_panic_click",
    "click_timing_type",
    "before_error",
    "after_error",
    "correction_efficiency",
    "last_3s_avg_error",
    "last_3s_error_std",
    "last_3s_click_rate",
    "last_3s_panic_click_rate",
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
  if (!window.confirm("確定要清除本機資料嗎？雲端 Sheet 不會被清除。")) {
    return;
  }
  allLogs = [];
  pendingUploads = [];
  playerCounts = {};
  playerProfiles = {};
  refreshAllUsersBestScore();
  savePlayerCounts();
  savePlayerProfiles();
  savePendingUploads();
  updatePlayerCountDisplay();
  saveLogs();
  gameStatus.textContent = "本機資料已清除。";
}

function getUploadEndpoint() {
  return DEFAULT_UPLOAD_ENDPOINT;
}

async function uploadCompletedGame() {
  const completedRows = currentGameLogs.slice();
  const lastRow = completedRows[completedRows.length - 1];
  if (!lastRow || lastRow.is_dead !== 1 || !lastRow.death_reason || lastRow.death_reason === "none") {
    setUploadStatus("死亡資料尚未完整，暫不上傳。");
    return;
  }

  game.finalUploadRows = completedRows;
  enqueuePendingUpload(completedRows);
  setUploadStatus(`準備上傳完整一局：${lastRow.player_name} 第 ${lastRow.player_play_count} 局，${completedRows.length} 筆。`);
  await processPendingUploads();
  window.setTimeout(processPendingUploads, 1000);
  window.setTimeout(processPendingUploads, 5000);
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
  setUploadStatus(`已加入待傳：${lastRow.player_name} 第 ${lastRow.player_playCount || lastRow.player_play_count} 局。`);
}

async function processPendingUploads() {
  if (uploadInProgress || !pendingUploads.length) {
    if (uploadInProgress) {
      uploadRerunRequested = true;
      setUploadStatus("上傳進行中，稍後會繼續。");
    }
    return;
  }

  uploadInProgress = true;
  try {
    const uploadBatch = getPendingUploadOrder();
    let sentThisTick = 0;
    for (const pending of uploadBatch) {
      if (uploadRerunRequested || sentThisTick >= PENDING_SENDS_PER_TICK) {
        break;
      }
      if (!shouldSendPending(pending)) {
        continue;
      }
      const uploaded = await sendPendingUpload(pending);
      if (uploaded) {
        pending.attempts += 1;
        pending.lastSentAt = new Date().toISOString();
        savePendingUploads();
        sentThisTick += 1;
      }
    }

    const verifyBatch = getPendingUploadOrder()
      .filter((pending) => shouldVerifyPending(pending))
      .slice(0, PENDING_VERIFICATIONS_PER_TICK);
    if (!verifyBatch.length && pendingUploads.length) {
      setUploadStatus("已送出，等待 Google Sheet 寫入後再確認。");
    }

    for (const pending of verifyBatch) {
      if (uploadRerunRequested) {
        break;
      }
      setUploadStatus(`確認 Sheet：${pending.playerName} 第 ${pending.playerPlayCount} 局...`);
      const verified = await verifyPendingUpload(pending);
      if (verified) {
        removePendingUpload(pending.gameId);
        refreshGlobalBestFromSheet();
        setUploadStatus(`Google Sheet 已確認：${pending.playerName} 第 ${pending.playerPlayCount} 局，${pending.rows.length} 筆。`);
        if (game.gameId === pending.gameId && game.over) {
          gameStatus.textContent = `Game over：${formatDeathReason(game.deathReason)}，試算表已確認。`;
        }
      } else {
        savePendingUploads();
        setUploadStatus(`尚未確認，會自動重試：${pending.playerName} 第 ${pending.playerPlayCount} 局。`);
        if (game.gameId === pending.gameId && game.over) {
          gameStatus.textContent = `Game over：${formatDeathReason(game.deathReason)}，等待自動補傳。`;
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

function shouldSendPending(pending) {
  if (!pending.lastSentAt) {
    return true;
  }
  return Date.now() - Date.parse(pending.lastSentAt) >= RESEND_PENDING_AFTER_MS;
}

function shouldVerifyPending(pending) {
  if (!pending.lastSentAt) {
    return false;
  }
  return Date.now() - Date.parse(pending.lastSentAt) >= VERIFY_AFTER_SEND_MS;
}

async function sendPendingUpload(pending) {
  const chunks = getPendingChunks(pending);
  pending.chunkKeys = chunks.map((chunk) => chunk.key);
  pending.chunkSize = UPLOAD_CHUNK_SIZE;
  savePendingUploads();

  for (const chunkInfo of chunks) {
    const ok = await uploadRows(chunkInfo.rows, {
      automatic: true,
      silentWhenMissing: true,
      chunkKey: chunkInfo.key,
      chunkNumber: chunkInfo.number,
      chunkCount: chunks.length,
      statusMessage: `上傳完整一局：${pending.playerName} 第 ${pending.playerPlayCount} 局，chunk ${chunkInfo.number}/${chunks.length}...`,
      successMessage: `已送出 Google：chunk ${chunkInfo.number}/${chunks.length}，${chunkInfo.end}/${pending.rows.length} 筆。`,
    });
    if (!ok) {
      return false;
    }
  }
  return true;
}

function getPendingChunks(pending) {
  const chunks = [];
  const chunkCount = Math.ceil(pending.rows.length / UPLOAD_CHUNK_SIZE);
  for (let index = 0; index < pending.rows.length; index += UPLOAD_CHUNK_SIZE) {
    const chunk = pending.rows.slice(index, index + UPLOAD_CHUNK_SIZE);
    const chunkNumber = Math.floor(index / UPLOAD_CHUNK_SIZE) + 1;
    const firstFrame = chunk[0]?.frame ?? "";
    const lastFrame = chunk[chunk.length - 1]?.frame ?? "";
    chunks.push({
      rows: chunk,
      number: chunkNumber,
      end: index + chunk.length,
      key: `${pending.gameId}|${chunkNumber}|${chunk.length}|${firstFrame}|${lastFrame}`,
      total: chunkCount,
    });
  }
  return chunks;
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

async function verifyPendingUpload(pending) {
  const endpointVerified = await queryUploadEndpointForVerification(pending);
  if (endpointVerified) {
    return true;
  }
  return verifyGameDeathRow(pending.gameId);
}

function queryUploadEndpointForVerification(pending) {
  return new Promise((resolve) => {
    const endpoint = getUploadEndpoint();
    const chunkKeys = pending.chunkKeys || getPendingChunks(pending).map((chunk) => chunk.key);
    if (!endpoint || !chunkKeys.length) {
      resolve(false);
      return;
    }

    const callbackName = `flappyUploadVerify_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const script = document.createElement("script");
    const cleanup = () => {
      delete window[callbackName];
      script.remove();
    };
    const timeoutId = window.setTimeout(() => {
      cleanup();
      resolve(false);
    }, 7000);

    window[callbackName] = (response) => {
      window.clearTimeout(timeoutId);
      cleanup();
      resolve(Boolean(response?.verified));
    };

    script.onerror = () => {
      window.clearTimeout(timeoutId);
      cleanup();
      resolve(false);
    };
    script.src =
      `${endpoint}?callback=${encodeURIComponent(callbackName)}` +
      `&game_id=${encodeURIComponent(pending.gameId)}` +
      `&chunk_keys=${encodeURIComponent(chunkKeys.join(","))}` +
      `&cachebust=${Date.now()}`;
    document.head.appendChild(script);
  });
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
    setUploadStatus("缺少上傳網址，無法上傳。");
    return false;
  }

  if (!rowsToUpload.length) {
    if (silentWhenMissing) {
      return false;
    }
    setUploadStatus("沒有資料可以上傳。");
    return false;
  }

  const payload = buildUploadPayload(rowsToUpload, { chunkKey, chunkNumber, chunkCount });
  const body = JSON.stringify(payload);

  const uploadingMessage = statusMessage || (automatic
    ? `自動上傳完整一局：${rowsToUpload.length} 筆...`
    : `上傳資料：${rowsToUpload.length} 筆...`);
  setUploadStatus(uploadingMessage);

  const formSent = await postPayloadWithHiddenForm(endpoint, body);
  if (formSent) {
    const sentMessage = successMessage || (automatic
      ? `完整一局已送出：${rowsToUpload.length} 筆`
      : `資料已送出：${rowsToUpload.length} 筆`);
    setUploadStatus(sentMessage);
    if (automatic && game.over) {
      gameStatus.textContent = `Game over：${formatDeathReason(game.deathReason)}，上傳已送出。`;
    }
    return true;
  }

  try {
    await fetch(endpoint, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body,
    });
    const sentMessage = successMessage || (automatic
      ? `完整一局已送出：${rowsToUpload.length} 筆`
      : `資料已送出：${rowsToUpload.length} 筆`);
    setUploadStatus(sentMessage);
    if (automatic && game.over) {
      gameStatus.textContent = `Game over：${formatDeathReason(game.deathReason)}，上傳已送出。`;
    }
    return true;
  } catch {
    setUploadStatus(
      automatic
        ? "自動上傳失敗，網路恢復後會再試。"
        : "上傳失敗，請稍後再試。"
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
      let resolved = false;
      const resolveOnce = (ok) => {
        if (resolved) {
          return;
        }
        resolved = true;
        resolve(ok);
      };
      const cleanup = () => {
        iframe.remove();
        form.remove();
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
      iframe.addEventListener("load", () => resolveOnce(true), { once: true });
      form.submit();
      window.setTimeout(() => resolveOnce(true), 250);
      window.setTimeout(cleanup, FORM_POST_WAIT_MS);
    } catch {
      resolve(false);
    }
  });
}


startButton.addEventListener("click", startGame);
restartButton.addEventListener("click", restartGame);
exportButton.addEventListener("click", exportCsv);
clearButton.addEventListener("click", clearData);
dailyChallengeButton.addEventListener("click", enableDailyChallenge);
soundButton.addEventListener("click", toggleSound);
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
updateSoundButton();
setUploadStatus("待機，結束後自動上傳完整一局。");
updatePlayerCountDisplay();
resetGame();
saveLogs();
refreshGlobalBestFromSheet();
processPendingUploads();
window.setInterval(processPendingUploads, PENDING_UPLOAD_INTERVAL_MS);
window.setInterval(refreshGlobalBestFromSheet, GLOBAL_BEST_REFRESH_MS);
window.addEventListener("online", processPendingUploads);
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) {
    refreshGlobalBestFromSheet();
    processPendingUploads();
  }
});
