/** UI Controller - uses Game and optional AI on window */
import { Game } from '../engine/game.js';

// Ensure AI is available if loaded via bundle
const AI = (typeof window !== 'undefined' && window.AI) ? window.AI : undefined;

let engineState = Game.createInitialState();
let selectedHand = null;
let selectedButton = null;
let gameMode = null; // '2p' | 'ai-random' | 'ai-greedy' | 'ai-minimax' | 'ai-expectimax' | 'ai-mcts' | 'ai-custom'
let aiAgent = null;

let hands, turnIndicator, messageBox, menu, nameSetup, gameUI;
function initializeDOMReferences() {
  hands = document.querySelectorAll('.hand');
  turnIndicator = document.getElementById('turn-indicator');
  messageBox = document.getElementById('message');
  menu = document.getElementById('menu');
  nameSetup = document.getElementById('name-setup');
  gameUI = document.getElementById('game-ui');
}

let player1Name = 'Player 1';
let player2Name = 'Player 2';

function resetGame() {
  engineState = Game.createInitialState();
  selectedHand = null; selectedButton = null;
  if (messageBox) messageBox.textContent = '';
  const currentName = engineState.current === 'player1' ? player1Name : player2Name;
  if (turnIndicator) turnIndicator.textContent = `${currentName}'s Turn`;
  if (hands && hands.length > 0) { hands.forEach(hand => { hand.disabled = false; hand.addEventListener('click', handleHandClick); }); }
  updateUI();
}

function updateHandUI() {
  if (!hands || hands.length === 0) return;
  hands.forEach(hand => {
    const player = hand.dataset.player; const handName = hand.dataset.hand;
    const count = engineState.hands[player][handName];
    hand.querySelector('.count').textContent = count;
    hand.disabled = count === 0 || (player !== engineState.current && !selectedHand);
    hand.classList.remove('selected');
  });
  if (selectedButton) selectedButton.classList.add('selected');
}

function updatePlayerNames() {
  const p1Board = document.getElementById('player1-board');
  const p2Board = document.getElementById('player2-board');
  if (p1Board) p1Board.querySelector('h2').textContent = player1Name;
  if (p2Board) p2Board.querySelector('h2').textContent = player2Name;
}

function updateUI() { updateHandUI(); updatePlayerNames(); }

function checkWin() {
  const winnerKey = Game.getWinner(engineState);
  if (winnerKey) {
    const winnerName = winnerKey === 'player1' ? player1Name : player2Name;
    if (messageBox) messageBox.textContent = `${winnerName} wins!`;
    if (hands && hands.length > 0) hands.forEach(hand => { hand.disabled = true; hand.removeEventListener('click', handleHandClick); });
    const clapBtn = document.getElementById('clap-btn'); if (clapBtn) clapBtn.classList.add('hidden');
    return true;
  }
  return false;
}

function switchTurn() {
  engineState = Game.switchTurn(engineState);
  const currentName = engineState.current === 'player1' ? player1Name : player2Name;
  if (turnIndicator) turnIndicator.textContent = `${currentName}'s Turn`;
}

function handleHandClick(e) {
  const hand = e.currentTarget; const player = hand.dataset.player; const handName = hand.dataset.hand;
  if (player === engineState.current) {
    if (!selectedHand) {
      selectedHand = handName; selectedButton = hand;
      if (hands && hands.length > 0) hands.forEach(h => { const hp = h.dataset.player; const hh = h.dataset.hand; const isSel = (hp === engineState.current && hh === selectedHand); const hasF = engineState.hands[hp][hh] > 0; h.disabled = isSel || !hasF; });
      updateUI();
    } else if (selectedHand === handName) {
      selectedHand = null; selectedButton = null;
      if (hands && hands.length > 0) hands.forEach(h => { h.disabled = engineState.hands[h.dataset.player][h.dataset.hand] === 0; });
      updateUI();
    } else {
      executeAttack(engineState.current, selectedHand, engineState.current, handName);
      clearSelection(); switchTurn(); updateUI(); maybeAIMove();
    }
    return;
  }
  if (selectedHand) {
    executeAttack(engineState.current, selectedHand, player, handName);
    clearSelection(); if (!checkWin()) switchTurn(); updateUI(); maybeAIMove();
  }
}

function executeAttack(attackerPlayer, attackerHand, targetPlayer, targetHand) {
  engineState = Game.applyMove(engineState, { type: 'attack', attackerPlayer, attackerHand, targetPlayer, targetHand });
}

function clearSelection() { selectedHand = null; selectedButton = null; }

function selectGameMode(mode) {
  gameMode = mode; aiAgent = null;
  if (mode === 'ai-random') aiAgent = AI && AI.randomMove;
  if (mode === 'ai-greedy') aiAgent = AI && AI.greedyMove;
  if (mode === 'ai-minimax') aiAgent = AI && AI.minimaxMove;
  if (mode === 'ai-expectimax') aiAgent = AI && AI.expectimaxMove;
  if (mode === 'ai-mcts') aiAgent = AI && AI.mctsMove;
  if (mode === 'ai-custom') aiAgent = AI && AI.customMove;

  if (menu) menu.classList.add('hidden');
  if (nameSetup) nameSetup.classList.remove('hidden');

  const player1InputGroup = document.getElementById('player1-input-group');
  const player2InputGroup = document.getElementById('player2-input-group');
  const nameSetupTitle = document.getElementById('name-setup-title');
  const player1Label = document.querySelector('label[for="player1-name"]');
  const player1Input = document.getElementById('player1-name');

  if (mode === '2p') {
    if (nameSetupTitle) nameSetupTitle.textContent = 'Enter Player Names';
    if (player1InputGroup) player1InputGroup.style.display = 'flex';
    if (player2InputGroup) player2InputGroup.style.display = 'flex';
    if (player1Label) player1Label.textContent = 'Player 1:';
    if (player1Input) player1Input.placeholder = 'Player 1';
  } else {
    if (nameSetupTitle) nameSetupTitle.textContent = 'Enter Your Name';
    if (player1InputGroup) player1InputGroup.style.display = 'flex';
    if (player2InputGroup) player2InputGroup.style.display = 'none';
    if (player1Label) player1Label.textContent = 'Your Name:';
    if (player1Input) player1Input.placeholder = 'Player';
  }
  if (player1Input) player1Input.focus();
}

function startGame() {
  const player1Input = document.getElementById('player1-name');
  const player2Input = document.getElementById('player2-name');
  if (gameMode === '2p') { player1Name = (player1Input && player1Input.value.trim()) || 'Player 1'; player2Name = (player2Input && player2Input.value.trim()) || 'Player 2'; }
  else { player1Name = (player1Input && player1Input.value.trim()) || 'Player'; player2Name = aiAgent === (AI && AI.greedyMove) ? 'AI (Greedy)' : 'AI'; }
  const currentName = engineState.current === 'player1' ? player1Name : player2Name;
  if (turnIndicator) turnIndicator.textContent = `${currentName}'s Turn`;
  if (nameSetup) nameSetup.classList.add('hidden'); if (gameUI) gameUI.classList.remove('hidden'); updateUI();
}

function backToMenu() { if (menu) menu.classList.remove('hidden'); if (nameSetup) nameSetup.classList.add('hidden'); if (gameUI) gameUI.classList.add('hidden'); resetGame(); }

function initializeGame() {
  initializeDOMReferences();
  const mode2pBtn = document.getElementById('mode-2p');
  const modeAIRandomBtn = document.getElementById('mode-ai-random');
  const modeAIGreedyBtn = document.getElementById('mode-ai-greedy');
  const modeAIMinimaxBtn = document.getElementById('mode-ai-minimax');
  const modeAIExpectimaxBtn = document.getElementById('mode-ai-expectimax');
  const modeAIMCTSBtn = document.getElementById('mode-ai-mcts');
  const modeAICustomBtn = document.getElementById('mode-ai-custom');
  if (mode2pBtn) mode2pBtn.onclick = () => selectGameMode('2p');
  if (modeAIRandomBtn) modeAIRandomBtn.onclick = () => selectGameMode('ai-random');
  if (modeAIGreedyBtn) modeAIGreedyBtn.onclick = () => selectGameMode('ai-greedy');
  if (modeAIMinimaxBtn) modeAIMinimaxBtn.onclick = () => selectGameMode('ai-minimax');
  if (modeAIExpectimaxBtn) modeAIExpectimaxBtn.onclick = () => selectGameMode('ai-expectimax');
  if (modeAIMCTSBtn) modeAIMCTSBtn.onclick = () => selectGameMode('ai-mcts');
  if (modeAICustomBtn) modeAICustomBtn.onclick = () => selectGameMode('ai-custom');

  const startGameBtn = document.getElementById('start-game-btn');
  const backToMenuBtn = document.getElementById('back-to-menu-btn');
  if (startGameBtn) startGameBtn.onclick = startGame;
  if (backToMenuBtn) backToMenuBtn.onclick = () => { if (nameSetup) nameSetup.classList.add('hidden'); if (menu) menu.classList.remove('hidden'); };

  const resetBtn = document.getElementById('reset-btn');
  const menuBtn = document.getElementById('menu-btn');
  if (resetBtn) resetBtn.onclick = resetGame;
  if (menuBtn) menuBtn.onclick = backToMenu;

  const player1NameInput = document.getElementById('player1-name');
  const player2NameInput = document.getElementById('player2-name');
  if (player1NameInput) player1NameInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') { if (gameMode === '2p' && player2NameInput) player2NameInput.focus(); else startGame(); } });
  if (player2NameInput) player2NameInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') startGame(); });

  if (hands && hands.length > 0) hands.forEach(hand => hand.addEventListener('click', handleHandClick));
  updateUI();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initializeGame); else initializeGame();

// Clap / split UI
let updateUIRef = updateUI;
updateUI = (function (originalUpdateUI) {
  return function () {
    const clapBtn = document.getElementById('clap-btn');
    const gameOver = Game.isTerminal(engineState);
    if (gameUI && !gameUI.classList.contains('hidden')) {
      originalUpdateUI();
      if (gameOver) { if (clapBtn) clapBtn.classList.add('hidden'); }
      else { if (Game.canSplitState(engineState, engineState.current)) { if (clapBtn) clapBtn.classList.remove('hidden'); } else { if (clapBtn) clapBtn.classList.add('hidden'); } }
    } else {
      if (hands && hands.length > 0) hands.forEach(hand => { hand.querySelector('.count').textContent = engineState.hands[hand.dataset.player][hand.dataset.hand]; hand.disabled = true; hand.classList.remove('selected'); });
      if (clapBtn) clapBtn.classList.add('hidden');
    }
  };
})(updateUIRef);

const clapBtn = document.getElementById('clap-btn');
const clapModal = document.getElementById('clap-modal');
const clapHandValSpan = document.getElementById('clap-hand-val');
const clapLeftInput = document.getElementById('clap-left');
const clapRightInput = document.getElementById('clap-right');
const clapError = document.getElementById('clap-error');
const clapConfirm = document.getElementById('clap-confirm');
const clapCancel = document.getElementById('clap-cancel');

function makeNumericOnly(input) {
  if (!input) return;
  input.addEventListener('input', function() { this.value = this.value.replace(/[^0-9]/g, ''); });
  input.addEventListener('keydown', function(e) {
    const allowedKeys = [8, 9, 27, 13, 46]; const ctrlKeys = [65, 67, 86, 88];
    if (allowedKeys.includes(e.keyCode) || (ctrlKeys.includes(e.keyCode) && e.ctrlKey)) return;
    const isNumericKey = (e.keyCode >= 48 && e.keyCode <= 57) || (e.keyCode >= 96 && e.keyCode <= 105);
    if (!isNumericKey || e.shiftKey) e.preventDefault();
  });
}
makeNumericOnly(clapLeftInput); makeNumericOnly(clapRightInput);

clapBtn && (clapBtn.onclick = function () {
  const p = engineState.hands[engineState.current];
  const total = p.left + p.right;
  clapHandValSpan.textContent = total;
  if (clapLeftInput) clapLeftInput.value = '';
  if (clapRightInput) clapRightInput.value = '';
  if (clapLeftInput) clapLeftInput.max = total - 1;
  if (clapRightInput) clapRightInput.max = total - 1;
  if (clapError) clapError.textContent = '';
  clapModal.classList.add('active');
  clapModal.classList.remove('hidden');
  if (clapLeftInput) clapLeftInput.focus();
});

function maybeAIMove() {
  if (!aiAgent) return;
  if (engineState.current !== 'player2') return;
  if (Game.isTerminal(engineState)) return;
  setTimeout(() => {
    const move = aiAgent(engineState);
    if (!move) return;
    try { engineState = Game.applyMove(engineState, move); if (!checkWin()) switchTurn(); updateUI(); } catch { switchTurn(); updateUI(); }
  }, 350);
}

clapConfirm && (clapConfirm.onclick = function () {
  const p = engineState.hands[engineState.current];
  const total = p.left + p.right;
  const left = parseInt(clapLeftInput.value); const right = parseInt(clapRightInput.value);
  if (isNaN(left) || isNaN(right) || left < 1 || right < 1 || left + right !== total || left >= 5 || right >= 5) { if (clapError) clapError.textContent = `Invalid split. Must add up to ${total} and be at least 1 each, less than 5.`; return; }
  engineState = Game.applyMove(engineState, { type: 'split', player: engineState.current, left, right });
  clapModal.classList.remove('active'); clapModal.classList.add('hidden');
  switchTurn(); updateUI(); maybeAIMove();
});

clapCancel && (clapCancel.onclick = function () { clapModal.classList.remove('active'); clapModal.classList.add('hidden'); });
