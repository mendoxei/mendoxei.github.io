const APP_CONFIG = {
  appliance: {
    id: "skillet",
    label: "skillet",
    item: "steak",
    flipVerb: "flip",
    workLabel: "searing",
    sideNames: ["a", "b"],
    cookRate: 1.35,
    missedFlipPenalty: 8,
    maxCook: 130,
  },
  limits: {
    work: { min: 1, max: 60 },
    break: { min: 1, max: 30 },
  },
  defaults: {
    workMinutes: 25,
    breakMinutes: 5,
  },
};

const state = {
  appliance: APP_CONFIG.appliance,
  workMinutes: APP_CONFIG.defaults.workMinutes,
  breakMinutes: APP_CONFIG.defaults.breakMinutes,
  phase: "idle",
  isRunning: false,
  remainingSeconds: APP_CONFIG.defaults.workMinutes * 60,
  phaseDurationSeconds: APP_CONFIG.defaults.workMinutes * 60,
  cycleCount: 0,
  currentSide: 0,
  flippedThisBreak: false,
  sides: [0, 0],
  statusLine: "Prime the skillet and start when ready.",
};

const elements = {
  siteShell: document.querySelector(".site-shell"),
  applianceLabel: document.getElementById("applianceLabel"),
  phaseLabel: document.getElementById("phaseLabel"),
  phaseCaption: document.getElementById("phaseCaption"),
  timeDisplay: document.getElementById("timeDisplay"),
  cycleCount: document.getElementById("cycleCount"),
  phaseProgress: document.getElementById("phaseProgress"),
  heatMeter: document.getElementById("heatMeter"),
  sideAState: document.getElementById("sideAState"),
  sideBState: document.getElementById("sideBState"),
  visibleSide: document.getElementById("visibleSide"),
  overallState: document.getElementById("overallState"),
  statusLine: document.getElementById("statusLine"),
  startPauseButton: document.getElementById("startPauseButton"),
  resetButton: document.getElementById("resetButton"),
  flipButton: document.getElementById("flipButton"),
  armFlipButton: document.getElementById("armFlipButton"),
  workMinutesDisplay: document.getElementById("workMinutesDisplay"),
  breakMinutesDisplay: document.getElementById("breakMinutesDisplay"),
  stepButtons: Array.from(document.querySelectorAll("[data-adjust]")),
  portfolioToggle: document.getElementById("portfolioToggle"),
  portfolioClose: document.getElementById("portfolioClose"),
  steakSprite: document.getElementById("steakSprite"),
  panSprite: document.getElementById("panSprite"),
  year: document.getElementById("year"),
};

let tickHandle = null;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function formatTime(seconds) {
  const safeSeconds = Math.max(0, seconds);
  const minutes = Math.floor(safeSeconds / 60)
    .toString()
    .padStart(2, "0");
  const remainder = Math.floor(safeSeconds % 60)
    .toString()
    .padStart(2, "0");
  return `${minutes}:${remainder}`;
}

function getCookState(value) {
  if (value < 15) {
    return "raw";
  }

  if (value < 35) {
    return "blushing";
  }

  if (value < 65) {
    return "good crust";
  }

  if (value < 95) {
    return "overcooked";
  }

  return "charred";
}

function getOverallState() {
  const averageCook = (state.sides[0] + state.sides[1]) / state.sides.length;
  if (averageCook < 12) {
    return "uncooked";
  }

  if (averageCook < 42) {
    return "warming";
  }

  if (averageCook < 72) {
    return "dinner";
  }

  if (averageCook < 102) {
    return "drying out";
  }

  return "cremation";
}

function getPhaseCaption() {
  if (state.phase === "work") {
    return `current side is ${state.appliance.workLabel}`;
  }

  if (state.phase === "break") {
    return `break is live: ${state.appliance.flipVerb} now`;
  }

  return "waiting for heat";
}

function getPhaseLabel() {
  if (state.phase === "work") {
    return "work / sear";
  }

  if (state.phase === "break") {
    return "break / flip";
  }

  return "idle prep";
}

function updateSteakVisual() {
  const visibleCook = state.sides[state.currentSide];
  const darkness = clamp(visibleCook / 120, 0.08, 0.92);
  const charOpacity = clamp((visibleCook - 55) / 50, 0, 1);
  const stateLabel =
    visibleCook >= 95
      ? "charred"
      : visibleCook >= 65
        ? "overcooked"
        : visibleCook >= 35
          ? "cooked"
          : visibleCook >= 15
            ? "seared"
            : "raw";

  elements.steakSprite.style.setProperty("--cook-darkness", darkness.toFixed(2));
  elements.steakSprite.style.setProperty("--char-opacity", charOpacity.toFixed(2));
  elements.steakSprite.dataset.state = stateLabel;
  elements.panSprite.dataset.side = String(state.currentSide);
}

function updateMeters() {
  const progress =
    state.phaseDurationSeconds > 0
      ? ((state.phaseDurationSeconds - state.remainingSeconds) /
          state.phaseDurationSeconds) *
        100
      : 0;
  const heatLevel = state.phase === "work" ? 100 : state.phase === "break" ? 24 : 0;

  elements.phaseProgress.style.width = `${clamp(progress, 0, 100)}%`;
  elements.heatMeter.style.height = `${heatLevel}%`;
}

function render() {
  elements.siteShell.dataset.phase = state.phase;
  elements.applianceLabel.textContent = `appliance: ${state.appliance.label}`;
  elements.phaseLabel.textContent = getPhaseLabel();
  elements.phaseCaption.textContent = getPhaseCaption();
  elements.timeDisplay.textContent = formatTime(state.remainingSeconds);
  elements.cycleCount.textContent = `cycle ${state.cycleCount}`;
  elements.sideAState.textContent = getCookState(state.sides[0]);
  elements.sideBState.textContent = getCookState(state.sides[1]);
  elements.visibleSide.textContent = state.appliance.sideNames[state.currentSide];
  elements.overallState.textContent = getOverallState();
  elements.statusLine.textContent = state.statusLine;
  elements.startPauseButton.textContent =
    state.phase === "idle" ? "start session" : state.isRunning ? "pause" : "resume";
  elements.flipButton.disabled = state.phase !== "break" || state.flippedThisBreak;
  elements.armFlipButton.disabled = state.phase !== "break" || state.flippedThisBreak;
  elements.workMinutesDisplay.value = `${state.workMinutes}m`;
  elements.breakMinutesDisplay.value = `${state.breakMinutes}m`;

  updateMeters();
  updateSteakVisual();
}

function syncIdleClock() {
  if (state.phase !== "idle") {
    return;
  }

  state.phaseDurationSeconds = state.workMinutes * 60;
  state.remainingSeconds = state.phaseDurationSeconds;
}

function enterPhase(nextPhase) {
  state.phase = nextPhase;
  state.phaseDurationSeconds =
    nextPhase === "work" ? state.workMinutes * 60 : state.breakMinutes * 60;
  state.remainingSeconds = state.phaseDurationSeconds;

  if (nextPhase === "work") {
    state.cycleCount += 1;
    state.statusLine = `Work cycle ${state.cycleCount}. ${state.appliance.item} is on side ${state.appliance.sideNames[state.currentSide]}.`;
    return;
  }

  state.flippedThisBreak = false;
  state.statusLine = `Break window open. ${state.appliance.flipVerb} before the heat comes back.`;
}

function handlePhaseEnd() {
  if (state.phase === "work") {
    enterPhase("break");
    render();
    return;
  }

  if (!state.flippedThisBreak) {
    state.sides[state.currentSide] = clamp(
      state.sides[state.currentSide] + state.appliance.missedFlipPenalty,
      0,
      state.appliance.maxCook
    );
    state.statusLine = "Missed the flip window. The same side keeps taking punishment.";
  }

  enterPhase("work");
  render();
}

function tick() {
  if (!state.isRunning || state.phase === "idle") {
    return;
  }

  if (state.phase === "work") {
    state.sides[state.currentSide] = clamp(
      state.sides[state.currentSide] + state.appliance.cookRate,
      0,
      state.appliance.maxCook
    );
  }

  state.remainingSeconds -= 1;

  if (state.remainingSeconds <= 0) {
    handlePhaseEnd();
    return;
  }

  render();
}

function ensureTicker() {
  if (tickHandle !== null) {
    window.clearInterval(tickHandle);
  }

  tickHandle = window.setInterval(tick, 1000);
}

function startOrToggle() {
  if (state.phase === "idle") {
    enterPhase("work");
    state.isRunning = true;
    render();
    return;
  }

  state.isRunning = !state.isRunning;
  state.statusLine = state.isRunning ? "Timer running." : "Timer paused.";
  render();
}

function resetSession() {
  state.phase = "idle";
  state.isRunning = false;
  state.remainingSeconds = state.workMinutes * 60;
  state.phaseDurationSeconds = state.remainingSeconds;
  state.cycleCount = 0;
  state.currentSide = 0;
  state.flippedThisBreak = false;
  state.sides = [0, 0];
  state.statusLine = "Prime the skillet and start when ready.";
  render();
}

function flipSteak() {
  if (state.phase !== "break") {
    state.statusLine = "You can only flip during the break window.";
    render();
    return;
  }

  if (state.flippedThisBreak) {
    state.statusLine = "Already flipped this break.";
    render();
    return;
  }

  state.currentSide = state.currentSide === 0 ? 1 : 0;
  state.flippedThisBreak = true;
  state.statusLine = `Flip locked. Side ${state.appliance.sideNames[state.currentSide]} will take the next work cycle.`;
  render();
}

function adjustDuration(target, delta) {
  const limits = APP_CONFIG.limits[target];
  const key = target === "work" ? "workMinutes" : "breakMinutes";
  state[key] = clamp(state[key] + delta, limits.min, limits.max);

  syncIdleClock();
  state.statusLine = `${target} length set to ${state[key]} minute${state[key] === 1 ? "" : "s"}.`;
  render();
}

function togglePortfolio(open) {
  const isOpen =
    typeof open === "boolean"
      ? open
      : elements.siteShell.dataset.portfolioOpen !== "true";
  elements.siteShell.dataset.portfolioOpen = isOpen ? "true" : "false";
  elements.portfolioToggle.textContent = isOpen
    ? "close portfolio window"
    : "open portfolio window";
  elements.portfolioToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
}

elements.startPauseButton.addEventListener("click", startOrToggle);
elements.resetButton.addEventListener("click", resetSession);
elements.flipButton.addEventListener("click", flipSteak);
elements.armFlipButton.addEventListener("click", flipSteak);
elements.portfolioToggle.addEventListener("click", () => togglePortfolio());
elements.portfolioClose.addEventListener("click", () => togglePortfolio(false));

for (const button of elements.stepButtons) {
  button.addEventListener("click", () => {
    const delta = Number(button.dataset.delta || 0);
    const target = button.dataset.adjust;

    if (!target || !Number.isFinite(delta)) {
      return;
    }

    adjustDuration(target, delta);
  });
}

if (elements.year) {
  elements.year.textContent = String(new Date().getFullYear());
}

ensureTicker();
render();