const initialStats = {
  logic: 12,
  empathy: 10,
  exploration: 14,
};

const state = {
  ...initialStats,
  lessons: 0,
};

const lessons = {
  logic: {
    stat: "logic",
    boost: 14,
    message: "I practiced comparing clues. Patterns are starting to feel less random.",
  },
  empathy: {
    stat: "empathy",
    boost: 14,
    message: "I listened to a villager's worries. The facts matter, but feelings change the best answer.",
  },
  exploration: {
    stat: "exploration",
    boost: 14,
    message: "I mapped a strange path and learned that asking better questions reveals hidden options.",
  },
};

const scenarios = [
  "A lost traveler asks for help near an unknown ruin.",
  "A locked gate has three symbols and one warning sign.",
  "A teammate is upset after the party ignores their advice.",
  "A new village appears on the map with no quest marker.",
];

const dialogue = document.querySelector("#dialogue");
const responseLog = document.querySelector("#responseLog");
const scenarioText = document.querySelector("#scenarioText");
const testButton = document.querySelector("#testButton");
const resetButton = document.querySelector("#resetButton");

function clamp(value) {
  return Math.min(100, Math.max(0, value));
}

function updateStats() {
  for (const stat of Object.keys(initialStats)) {
    document.querySelector(`#${stat}Meter`).value = state[stat];
    document.querySelector(`#${stat}Value`).textContent = state[stat];
  }
}

function train(type) {
  const lesson = lessons[type];
  state[lesson.stat] = clamp(state[lesson.stat] + lesson.boost);
  state.lessons += 1;
  dialogue.textContent = lesson.message;
  responseLog.textContent = "";
  updateStats();
}

function getStrongestSkill() {
  return Object.keys(initialStats).sort((a, b) => state[b] - state[a])[0];
}

function testNpc() {
  const scenario = scenarios[state.lessons % scenarios.length];
  const strongest = getStrongestSkill();
  scenarioText.textContent = scenario;

  const responses = {
    logic: "I will inspect the rules first, compare clues, and choose the answer with the fewest contradictions.",
    empathy: "I will ask what the person needs, calm the situation, and adapt my plan around the human cost.",
    exploration: "I will scout the area, collect context, and look for an option that is not obvious yet.",
  };

  responseLog.textContent = responses[strongest];
}

function resetGame() {
  Object.assign(state, initialStats, { lessons: 0 });
  dialogue.textContent = "Memory reset. I am ready for a new training strategy.";
  scenarioText.textContent = scenarios[0];
  responseLog.textContent = "";
  updateStats();
}

document.querySelectorAll("[data-train]").forEach((button) => {
  button.addEventListener("click", () => train(button.dataset.train));
});

testButton.addEventListener("click", testNpc);
resetButton.addEventListener("click", resetGame);

updateStats();
