/**
 * UI Controller for Chopsticks.
 *
 * Responsibilities:
 *  - Bind DOM interactions to Game engine transitions.
 *  - Manage game modes (2P vs various AIs) and name entry flow.
 *  - Reflect state to the UI (hand counts, enable/disable, winner banner).
 *  - Orchestrate optional AI turns when playing vs AI.
 *
 * This module assumes Game is loaded and optionally a global AI registry
 * (window.AI) is available when an AI mode is selected.
 */
import { Game } from "../engine/game.js";

// Ensure AI is available if loaded via bundle
const AI = typeof window !== "undefined" && window.AI ? window.AI : undefined;

let engineState = Game.createInitialState();
let selectedHand = null;
let selectedButton = null;
let gameMode = null; // '2p' | 'ai-random' | 'ai-greedy' | 'ai-minimax' | 'ai-expectimax' | 'ai-mcts' | 'ai-custom'
let aiAgent = null;
let recentMoves = []; // last 3 move descriptions (with timestamps)
let fullHistory = []; // full move records with before/after snapshots

let hands, turnIndicator, messageBox, menu, nameSetup, gameUI;
/** Cache references to frequently accessed DOM elements */
function initializeDOMReferences() {
  hands = document.querySelectorAll(".hand");
  turnIndicator = document.getElementById("turn-indicator");
  messageBox = document.getElementById("message");
  menu = document.getElementById("menu");
  nameSetup = document.getElementById("name-setup");
  gameUI = document.getElementById("game-ui");
}

let player1Name = "Player 1";
let player2Name = "Player 2";

/** Reset engine state and UI to the initial configuration */
function resetGame() {
  engineState = Game.createInitialState();
  selectedHand = null;
  selectedButton = null;
  recentMoves = [];
  fullHistory = [];
  if (messageBox) messageBox.textContent = "";
  const currentName =
    engineState.current === "player1" ? player1Name : player2Name;
  if (turnIndicator) turnIndicator.textContent = `${currentName}'s Turn`;
  if (hands && hands.length > 0) {
    hands.forEach((hand) => {
      hand.disabled = false;
      // Use onclick to avoid accumulating duplicate listeners across resets
      hand.onclick = handleHandClick;
    });
  }
  updateUI();
}

/** Sync hand buttons' counts and states with the current engine state */
function updateHandUI() {
  if (!hands || hands.length === 0) return;
  const isAIMode = gameMode && gameMode !== "2p";
  const aiTurn = isAIMode && engineState.current === "player2";
  hands.forEach((hand) => {
    const player = hand.dataset.player;
    const handName = hand.dataset.hand;
    const count = engineState.hands[player][handName];
    hand.querySelector(".count").textContent = count;
    if (aiTurn) {
      // While AI is thinking/acting, disable all inputs
      hand.disabled = true;
    } else {
      hand.disabled =
        count === 0 || (player !== engineState.current && !selectedHand);
    }
    hand.classList.remove("selected");
  });
  if (selectedButton) selectedButton.classList.add("selected");
}

/** Update the displayed player names on the board */
function updatePlayerNames() {
  const p1Board = document.getElementById("player1-board");
  const p2Board = document.getElementById("player2-board");
  if (p1Board) p1Board.querySelector("h2").textContent = player1Name;
  if (p2Board) p2Board.querySelector("h2").textContent = player2Name;
}

/** Update both hands and name labels; used after every state change */
function updateUI() {
  updateHandUI();
  updatePlayerNames();
  updateHistoryUI();
}

/** Check victory condition, update message and disable inputs on game over */
function checkWin() {
  const winnerKey = Game.getWinner(engineState);
  if (winnerKey) {
    const winnerName = winnerKey === "player1" ? player1Name : player2Name;
    if (messageBox) messageBox.textContent = `${winnerName} wins!`;
    if (hands && hands.length > 0)
      hands.forEach((hand) => {
        hand.disabled = true;
        // Clear handler on game over; resetGame will rebind
        hand.onclick = null;
      });
    const clapBtn = document.getElementById("clap-btn");
    if (clapBtn) clapBtn.classList.add("hidden");
    return true;
  }
  return false;
}

/** Swap the current player and update the turn indicator */
function switchTurn() {
  engineState = Game.switchTurn(engineState);
  const currentName =
    engineState.current === "player1" ? player1Name : player2Name;
  if (turnIndicator) turnIndicator.textContent = `${currentName}'s Turn`;
}

/** Main click handler for hand buttons; routes to attack/self-attack flows */
function handleHandClick(e) {
  // Block interactions entirely during AI's turn
  if (gameMode && gameMode !== "2p" && engineState.current === "player2")
    return;
  const hand = e.currentTarget;
  const player = hand.dataset.player;
  const handName = hand.dataset.hand;
  if (player === engineState.current) {
    if (!selectedHand) {
      selectedHand = handName;
      selectedButton = hand;
      if (hands && hands.length > 0)
        hands.forEach((h) => {
          const hp = h.dataset.player;
          const hh = h.dataset.hand;
          const isSel = hp === engineState.current && hh === selectedHand;
          const hasF = engineState.hands[hp][hh] > 0;
          h.disabled = isSel || !hasF;
        });
      updateUI();
    } else if (selectedHand === handName) {
      selectedHand = null;
      selectedButton = null;
      if (hands && hands.length > 0)
        hands.forEach((h) => {
          h.disabled =
            engineState.hands[h.dataset.player][h.dataset.hand] === 0;
        });
      updateUI();
    } else {
      executeAttack(
        engineState.current,
        selectedHand,
        engineState.current,
        handName
      );
      clearSelection();
      // If self-attack caused game over, don't switch turns
      if (!checkWin()) switchTurn();
      updateUI();
      maybeAIMove();
    }
    return;
  }
  if (selectedHand) {
    executeAttack(engineState.current, selectedHand, player, handName);
    clearSelection();
    if (!checkWin()) switchTurn();
    updateUI();
    maybeAIMove();
  }
}

/** Apply an attack move in the engine */
function executeAttack(attackerPlayer, attackerHand, targetPlayer, targetHand) {
  const before = Game.getBoard(engineState);
  engineState = Game.applyMove(engineState, {
    type: "attack",
    attackerPlayer,
    attackerHand,
    targetPlayer,
    targetHand,
  });
  const after = Game.getBoard(engineState);
  pushHistory(
    {
      type: "attack",
      attackerPlayer,
      attackerHand,
      targetPlayer,
      targetHand,
    },
    before,
    after
  );
}

/** Clear any selected hand in the UI */
function clearSelection() {
  selectedHand = null;
  selectedButton = null;
}

/** Set the game mode (2p or AI variants) and show name entry UI */
function selectGameMode(mode) {
  gameMode = mode;
  aiAgent = null;
  recentMoves = [];
  fullHistory = [];
  // Toggle AI theming on player 2 when AI modes are active
  if (typeof document !== "undefined" && document.body) {
    if (mode === "2p") document.body.classList.remove("ai-opponent");
    else document.body.classList.add("ai-opponent");
  }
  if (mode === "ai-random") aiAgent = AI && AI.randomMove;
  if (mode === "ai-greedy") aiAgent = AI && AI.greedyMove;
  if (mode === "ai-minimax") aiAgent = AI && AI.minimaxMove;
  if (mode === "ai-expectimax") aiAgent = AI && AI.expectimaxMove;
  if (mode === "ai-mcts") aiAgent = AI && AI.mctsMove;
  if (mode === "ai-custom") aiAgent = AI && AI.customMove;

  if (menu) menu.classList.add("hidden");
  if (nameSetup) nameSetup.classList.remove("hidden");

  const player1InputGroup = document.getElementById("player1-input-group");
  const player2InputGroup = document.getElementById("player2-input-group");
  const nameSetupTitle = document.getElementById("name-setup-title");
  const player1Label = document.querySelector('label[for="player1-name"]');
  const player1Input = document.getElementById("player1-name");

  if (mode === "2p") {
    if (nameSetupTitle) nameSetupTitle.textContent = "Enter Player Names";
    if (player1InputGroup) player1InputGroup.style.display = "flex";
    if (player2InputGroup) player2InputGroup.style.display = "flex";
    if (player1Label) player1Label.textContent = "Player 1:";
    if (player1Input) player1Input.placeholder = "Player 1";
  } else {
    if (nameSetupTitle) nameSetupTitle.textContent = "Enter Your Name";
    if (player1InputGroup) player1InputGroup.style.display = "flex";
    if (player2InputGroup) player2InputGroup.style.display = "none";
    if (player1Label) player1Label.textContent = "Your Name:";
    if (player1Input) player1Input.placeholder = "Player";
  }
  if (player1Input) player1Input.focus();
}

/** Begin the game after name entry; Player 1 is human, Player 2 may be AI */
function startGame() {
  const player1Input = document.getElementById("player1-name");
  const player2Input = document.getElementById("player2-name");
  if (gameMode === "2p") {
    player1Name = (player1Input && player1Input.value.trim()) || "Player 1";
    player2Name = (player2Input && player2Input.value.trim()) || "Player 2";
  } else {
    player1Name = (player1Input && player1Input.value.trim()) || "Player";
    // Derive AI name from selected mode
    const aiNameMap = {
      "ai-random": "AI (Random)",
      "ai-greedy": "AI (Greedy)",
      "ai-minimax": "AI (Minimax)",
      "ai-expectimax": "AI (Expectimax)",
      "ai-mcts": "AI (MCTS)",
      "ai-custom": "AI (Custom)",
    };
    player2Name = aiNameMap[gameMode] || "AI";
  }
  const currentName =
    engineState.current === "player1" ? player1Name : player2Name;
  if (turnIndicator) turnIndicator.textContent = `${currentName}'s Turn`;
  if (nameSetup) nameSetup.classList.add("hidden");
  if (gameUI) gameUI.classList.remove("hidden");
  updateUI();
}

/** Return to main menu and reset the game */
function backToMenu() {
  if (menu) menu.classList.remove("hidden");
  if (nameSetup) nameSetup.classList.add("hidden");
  if (gameUI) gameUI.classList.add("hidden");
  if (typeof document !== "undefined" && document.body)
    document.body.classList.remove("ai-opponent");
  resetGame();
}

/** Initialize DOM, bind buttons, and render initial UI */
function initializeGame() {
  initializeDOMReferences();
  const mode2pBtn = document.getElementById("mode-2p");
  const modeAIRandomBtn = document.getElementById("mode-ai-random");
  const modeAIGreedyBtn = document.getElementById("mode-ai-greedy");
  const modeAIMinimaxBtn = document.getElementById("mode-ai-minimax");
  const modeAIExpectimaxBtn = document.getElementById("mode-ai-expectimax");
  const modeAIMCTSBtn = document.getElementById("mode-ai-mcts");
  const modeAICustomBtn = document.getElementById("mode-ai-custom");
  if (mode2pBtn) mode2pBtn.onclick = () => selectGameMode("2p");
  if (modeAIRandomBtn)
    modeAIRandomBtn.onclick = () => selectGameMode("ai-random");
  if (modeAIGreedyBtn)
    modeAIGreedyBtn.onclick = () => selectGameMode("ai-greedy");
  if (modeAIMinimaxBtn)
    modeAIMinimaxBtn.onclick = () => selectGameMode("ai-minimax");
  if (modeAIExpectimaxBtn)
    modeAIExpectimaxBtn.onclick = () => selectGameMode("ai-expectimax");
  if (modeAIMCTSBtn) modeAIMCTSBtn.onclick = () => selectGameMode("ai-mcts");
  if (modeAICustomBtn)
    modeAICustomBtn.onclick = () => selectGameMode("ai-custom");

  const startGameBtn = document.getElementById("start-game-btn");
  const backToMenuBtn = document.getElementById("back-to-menu-btn");
  if (startGameBtn) startGameBtn.onclick = startGame;
  if (backToMenuBtn)
    backToMenuBtn.onclick = () => {
      if (nameSetup) nameSetup.classList.add("hidden");
      if (menu) menu.classList.remove("hidden");
    };

  const resetBtn = document.getElementById("reset-btn");
  const menuBtn = document.getElementById("menu-btn");
  if (resetBtn) resetBtn.onclick = resetGame;
  if (menuBtn) menuBtn.onclick = backToMenu;

  const player1NameInput = document.getElementById("player1-name");
  const player2NameInput = document.getElementById("player2-name");
  if (player1NameInput)
    player1NameInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        if (gameMode === "2p" && player2NameInput) player2NameInput.focus();
        else startGame();
      }
    });
  if (player2NameInput)
    player2NameInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") startGame();
    });

  // Use onclick consistently to avoid duplicate listeners across resets
  if (hands && hands.length > 0)
    hands.forEach((hand) => {
      hand.onclick = handleHandClick;
    });

  // Wire full history modal
  const viewHistoryBtn = document.getElementById("view-history-btn");
  const historyModal = document.getElementById("history-modal");
  const historyClose = document.getElementById("history-close");
  if (viewHistoryBtn && historyModal) {
    viewHistoryBtn.onclick = () => {
      renderFullHistoryModal();
      historyModal.classList.add("active");
      historyModal.classList.remove("hidden");
  // Trap focus within the history modal
  releaseHistoryTrap();
  releaseHistoryTrap = trapFocus(historyModal);
    };
  }
  if (historyClose && historyModal) {
    historyClose.onclick = () => {
      historyModal.classList.remove("active");
      historyModal.classList.add("hidden");
  releaseHistoryTrap();
    };
  }
  updateUI();
}

if (document.readyState === "loading")
  document.addEventListener("DOMContentLoaded", initializeGame);
else initializeGame();

// Clap / split UI
let updateUIRef = updateUI;
updateUI = (function (originalUpdateUI) {
  return function () {
    const clapBtn = document.getElementById("clap-btn");
    const gameOver = Game.isTerminal(engineState);
    if (gameUI && !gameUI.classList.contains("hidden")) {
      originalUpdateUI();
      if (gameOver) {
        if (clapBtn) clapBtn.classList.add("hidden");
      } else {
        if (Game.canSplitState(engineState, engineState.current)) {
          if (clapBtn) clapBtn.classList.remove("hidden");
        } else {
          if (clapBtn) clapBtn.classList.add("hidden");
        }
      }
    } else {
      if (hands && hands.length > 0)
        hands.forEach((hand) => {
          hand.querySelector(".count").textContent =
            engineState.hands[hand.dataset.player][hand.dataset.hand];
          hand.disabled = true;
          hand.classList.remove("selected");
        });
      if (clapBtn) clapBtn.classList.add("hidden");
    }
  };
})(updateUIRef);

const clapBtn = document.getElementById("clap-btn");
const clapModal = document.getElementById("clap-modal");
const clapHandValSpan = document.getElementById("clap-hand-val");
const clapLeftInput = document.getElementById("clap-left");
const clapRightInput = document.getElementById("clap-right");
const clapError = document.getElementById("clap-error");
const clapConfirm = document.getElementById("clap-confirm");
const clapCancel = document.getElementById("clap-cancel");

/** Trap focus within a modal element and close on Escape */
function trapFocus(modalEl) {
  if (!modalEl) return () => {};
  const selectors = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ];
  const getFocusable = () => Array.from(modalEl.querySelectorAll(selectors.join(',')));
  function onKeydown(e) {
    if (e.key === 'Escape') {
      modalEl.classList.remove('active');
      modalEl.classList.add('hidden');
      return;
    }
    if (e.key !== 'Tab') return;
    const f = getFocusable();
    if (!f.length) return;
    const first = f[0];
    const last = f[f.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else if (document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
  modalEl.addEventListener('keydown', onKeydown);
  return () => modalEl.removeEventListener('keydown', onKeydown);
}

let releaseClapTrap = () => {};
let releaseHistoryTrap = () => {};
/** Constrain an <input> to numeric-only entry with basic key filtering */
function makeNumericOnly(input) {
  if (!input) return;
  input.addEventListener("input", function () {
    this.value = this.value.replace(/[^0-9]/g, "");
  });
  input.addEventListener("keydown", function (e) {
    const allowedKeys = [8, 9, 27, 13, 46];
    const ctrlKeys = [65, 67, 86, 88];
    if (
      allowedKeys.includes(e.keyCode) ||
      (ctrlKeys.includes(e.keyCode) && e.ctrlKey)
    )
      return;
    const isNumericKey =
      (e.keyCode >= 48 && e.keyCode <= 57) ||
      (e.keyCode >= 96 && e.keyCode <= 105);
    if (!isNumericKey || e.shiftKey) e.preventDefault();
  });
}
makeNumericOnly(clapLeftInput);
makeNumericOnly(clapRightInput);

clapBtn &&
  (clapBtn.onclick = function () {
    const p = engineState.hands[engineState.current];
    const total = p.left + p.right;
    clapHandValSpan.textContent = total;
    if (clapLeftInput) clapLeftInput.value = "";
    if (clapRightInput) clapRightInput.value = "";
    if (clapLeftInput) clapLeftInput.max = total - 1;
    if (clapRightInput) clapRightInput.max = total - 1;
    if (clapError) clapError.textContent = "";
    clapModal.classList.add("active");
    clapModal.classList.remove("hidden");
  // Enable focus trap while clap modal is open
  releaseClapTrap();
  releaseClapTrap = trapFocus(clapModal);
    if (clapLeftInput) clapLeftInput.focus();
  });

function maybeAIMoveDelayMs() {
  // Randomize AI thinking delay between 450ms and 1200ms
  return 450 + Math.floor(Math.random() * 750);
}

function moveToString(move) {
  if (!move) return "";
  if (move.type === "attack") {
    const ap = move.attackerPlayer === "player1" ? player1Name : player2Name;
    const tp = move.targetPlayer === "player1" ? player1Name : player2Name;
    return `${ap} ${move.attackerHand} -> ${tp} ${move.targetHand}`;
  }
  if (move.type === "split") {
    const p = move.player === "player1" ? player1Name : player2Name;
    return `${p} split to ${move.left}+${move.right}`;
  }
  return "";
}

function formatTime(ts) {
  const d = new Date(ts);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

function pushHistory(move, beforeBoard, afterBoard) {
  const text = moveToString(move);
  if (!text) return;
  const ts = Date.now();
  const record = { ts, text, move, before: beforeBoard, after: afterBoard };
  fullHistory.push(record);
  // Maintain recent list with formatted timestamps
  recentMoves.unshift(`[${formatTime(ts)}] ${text}`);
  if (recentMoves.length > 3) recentMoves.pop();
  updateHistoryUI();
}

function updateHistoryUI() {
  const list = document.getElementById("history-list");
  if (!list) return;
  list.innerHTML = "";
  recentMoves.forEach((rec) => {
    const li = document.createElement("li");
    li.style.display = "flex";
    li.style.justifyContent = "center";
    li.style.gap = "8px";
    // rec is a preformatted string like "[HH:MM:SS] text"; split once
    const match = /^\[(\d{2}:\d{2}:\d{2})\]\s*(.*)$/.exec(rec);
    let ts = rec;
    let text = "";
    if (match) {
      ts = match[1];
      text = match[2];
    }
    const tsSpan = document.createElement("span");
    tsSpan.textContent = `[${ts}]`;
    tsSpan.style.width = "88px"; // fixed width to align left within centered row
    tsSpan.style.textAlign = "left";
    const textSpan = document.createElement("span");
    textSpan.textContent = text;
    li.appendChild(tsSpan);
    li.appendChild(textSpan);
    list.appendChild(li);
  });
}

/** If AI mode and it's AI's turn, compute and apply AI move with a delay */
function maybeAIMove() {
  if (!aiAgent) return;
  if (engineState.current !== "player2") return;
  if (Game.isTerminal(engineState)) return;
  const prevMsg = messageBox ? messageBox.textContent : "";
  if (messageBox) messageBox.textContent = "AI is thinking...";
  setTimeout(() => {
    const before = Game.getBoard(engineState);
    const move = aiAgent(engineState);
    if (!move) {
      if (messageBox) messageBox.textContent = prevMsg;
      return;
    }
    try {
      engineState = Game.applyMove(engineState, move);
      const after = Game.getBoard(engineState);
      pushHistory(move, before, after);
      if (!checkWin()) switchTurn();
      updateUI();
    } catch {
      switchTurn();
      updateUI();
    } finally {
      if (!Game.isTerminal(engineState) && messageBox)
        messageBox.textContent = prevMsg;
    }
  }, maybeAIMoveDelayMs());
}

clapConfirm &&
  (clapConfirm.onclick = function () {
    const p = engineState.hands[engineState.current];
    const total = p.left + p.right;
    const left = parseInt(clapLeftInput.value);
    const right = parseInt(clapRightInput.value);
    if (
      isNaN(left) ||
      isNaN(right) ||
      left < 1 ||
      right < 1 ||
      left + right !== total ||
      left >= 5 ||
      right >= 5
    ) {
      if (clapError)
        clapError.textContent = `Invalid split. Must add up to ${total} and be at least 1 each, less than 5.`;
      return;
    }
    const before = Game.getBoard(engineState);
    engineState = Game.applyMove(engineState, {
      type: "split",
      player: engineState.current,
      left,
      right,
    });
    const after = Game.getBoard(engineState);
    pushHistory(
      { type: "split", player: engineState.current, left, right },
      before,
      after
    );
    clapModal.classList.remove("active");
    clapModal.classList.add("hidden");
  releaseClapTrap();
    switchTurn();
    updateUI();
    maybeAIMove();
  });

function renderFullHistoryModal() {
  const list = document.getElementById("history-modal-list");
  if (!list) return;
  list.innerHTML = "";
  if (!fullHistory.length) {
    const li = document.createElement("li");
    li.textContent = "No moves yet.";
    list.appendChild(li);
    return;
  }
  fullHistory.forEach((rec) => {
    const li = document.createElement("li");
    const time = `[${formatTime(rec.ts)}]`;
    const after = rec.after || {};
    const p1 = after.p1 ? `${after.p1[0]},${after.p1[1]}` : "-";
    const p2 = after.p2 ? `${after.p2[0]},${after.p2[1]}` : "-";
    li.textContent = `${time} ${rec.text}  →  after: P1 [${p1}] | P2 [${p2}]`;
    list.appendChild(li);
  });
}

clapCancel &&
  (clapCancel.onclick = function () {
    clapModal.classList.remove("active");
    clapModal.classList.add("hidden");
  releaseClapTrap();
  });
