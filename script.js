// --- Game State ---
let currentPlayer = 'player1';
let selectedHand = null;
let selectedButton = null;
let gameMode = null;

const state = {
  player1: { left: 1, right: 1 },
  player2: { left: 1, right: 1 }
};

let player1Name = 'Player 1';
let player2Name = 'Player 2';
// --- Reset Game ---
function resetGame() {
  state.player1.left = 1;
  state.player1.right = 1;
  state.player2.left = 1;
  state.player2.right = 1;
  currentPlayer = 'player1';
  selectedHand = null;
  selectedButton = null;
  messageBox.textContent = '';
  turnIndicator.textContent = `${player1Name}'s Turn`;
  hands.forEach(hand => {
    hand.disabled = false;
    hand.addEventListener('click', handleHandClick);
  });
  updateUI();
}

// --- DOM Elements ---
const hands = document.querySelectorAll('.hand');
const turnIndicator = document.getElementById('turn-indicator');
const messageBox = document.getElementById('message');
const menu = document.getElementById('menu');
const gameUI = document.getElementById('game-ui');

// --- UI Update ---
function updateHandUI() {
  hands.forEach(hand => {
    const player = hand.dataset.player;
    const handName = hand.dataset.hand;
    const count = state[player][handName];
    hand.querySelector('.count').textContent = count;
    hand.disabled = count === 0 || (player !== currentPlayer && !selectedHand);
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

function updateUI() {
  updateHandUI();
  updatePlayerNames();
}

// --- Win Check ---
function checkWin() {
  const opponent = currentPlayer === 'player1' ? 'player2' : 'player1';
  const winner = currentPlayer === 'player1' ? player1Name : player2Name;
  if (state[opponent].left === 0 && state[opponent].right === 0) {
    messageBox.textContent = `${winner} wins!`;
    hands.forEach(h => {
      h.disabled = true;
      h.removeEventListener('click', handleHandClick);
    });
    const clapBtn = document.getElementById('clap-btn');
    if (clapBtn) clapBtn.classList.add('hidden');
    return true;
  }
  return false;
}

// --- Turn Switch ---
function switchTurn() {
  currentPlayer = currentPlayer === 'player1' ? 'player2' : 'player1';
  turnIndicator.textContent = `${currentPlayer === 'player1' ? player1Name : player2Name}'s Turn`;
}

// --- Hand Click Handler ---
/**
 * Handles all hand click interactions in the chopsticks game
 * This function manages three main scenarios:
 * 1. Selecting/deselecting your own hands
 * 2. Attacking opponent hands
 * 3. Managing hand states and turn transitions
 */
function handleHandClick(e) {
  // Get information about the clicked hand
  const hand = e.currentTarget;
  const player = hand.dataset.player;  // Which player owns this hand ('player1' or 'player2')
  const handName = hand.dataset.hand;  // Which hand it is ('left' or 'right')

  // SCENARIO 1: Player clicked their own hand
  if (player === currentPlayer) {
    
    // Case 1A: No hand currently selected - select this hand for attacking
    if (!selectedHand) {
      selectedHand = handName;
      selectedButton = hand;
      
      // Disable only the selected hand itself and hands with 0 fingers
      // Allow attacking: opponent hands with fingers > 0 AND your own other hand with fingers > 0
      hands.forEach(h => {
        const hPlayer = h.dataset.player;
        const hHand = h.dataset.hand;
        const isSelectedHand = (hPlayer === currentPlayer && hHand === selectedHand);
        const hasFingers = state[hPlayer][hHand] > 0;
        h.disabled = isSelectedHand || !hasFingers;
      });
      updateUI();
      
    // Case 1B: Clicked the same hand that's already selected - deselect it
    } else if (selectedHand === handName) {
      selectedHand = null;
      selectedButton = null;
      
      // Reset hand states: only disable hands with 0 fingers
      hands.forEach(h => {
        h.disabled = state[h.dataset.player][h.dataset.hand] === 0;
      });
      updateUI();
      
    // Case 1C: Clicked your other hand while one is selected - self-attack
    } else {
      // Execute self-attack
      const target = handName;
      const attackerVal = state[currentPlayer][selectedHand];  // Fingers on attacking hand
      const newVal = state[currentPlayer][target] + attackerVal;     // Calculate new finger count
      
      // Apply chopsticks rule: if new value >= 5, hand becomes 0 (dead)
      state[currentPlayer][target] = newVal >= 5 ? 0 : newVal;
      
      // Clear selection after attack
      selectedHand = null;
      selectedButton = null;

      // Switch to other player's turn (self-attack still ends your turn)
      switchTurn();
      updateUI();
    }
    
    // Exit early since we're dealing with current player's hands
    return;
  }
  
  // SCENARIO 2: Player clicked opponent's hand AND has a hand selected
  if (selectedHand) {
    // Safety check: prevent attacking the same hand you selected (but allow attacking your other hand)
    if (player === currentPlayer && handName === selectedHand) return;
    
    // Execute the attack (can be on opponent's hand OR your own other hand)
    const target = handName;
    const attackerVal = state[currentPlayer][selectedHand];  // Fingers on attacking hand
    const newVal = state[player][target] + attackerVal;     // Calculate new finger count
    
    // Apply chopsticks rule: if new value >= 5, hand becomes 0 (dead)
    state[player][target] = newVal >= 5 ? 0 : newVal;
    
    // Clear selection after attack
    selectedHand = null;
    selectedButton = null;

    // Check if this attack won the game
    if (checkWin()) {
      // Game over: ensure opponent's hands are properly set to 0
      const opponent = currentPlayer === 'player1' ? 'player2' : 'player1';
      state[opponent].left = 0;
      state[opponent].right = 0;
      updateUI();
    } else {
      // Game continues: switch to other player's turn
      switchTurn();
      updateUI();
    }
  }
  
  // SCENARIO 3: Player clicked opponent's hand but has no hand selected
  // This does nothing - player must select their own hand first
}

// --- Game Start ---
function startGame(mode) {
  gameMode = mode;
  player1Name = 'Player 1';
  player2Name = 'Player 2';
  menu.classList.add('hidden');
  gameUI.classList.remove('hidden');
  updateUI();
}

// --- Event Listeners ---
document.getElementById('mode-2p').onclick = () => startGame('2p');
document.getElementById('reset-btn').onclick = resetGame;

hands.forEach(hand => hand.addEventListener('click', handleHandClick));

// --- Enhanced UI Update for Clap Button ---
updateUI = (function (origUpdateUI) {
  return function () {
    const clapBtn = document.getElementById('clap-btn');
    // If game is over, always hide clap button
    const gameOver = (state.player1.left === 0 && state.player1.right === 0) || (state.player2.left === 0 && state.player2.right === 0);
    if (!gameUI.classList.contains('hidden')) {
      origUpdateUI();
      if (gameOver) {
        if (clapBtn) clapBtn.classList.add('hidden');
      } else {
        // Clap button logic
        const player = state[currentPlayer];
        const handsActive = [player.left > 0, player.right > 0];
        const handVal = player.left > 0 ? player.left : player.right;
        if ((handsActive[0] ^ handsActive[1]) && handVal > 1) {
          clapBtn.classList.remove('hidden');
        } else {
          clapBtn.classList.add('hidden');
        }
      }
    } else {
      // Hide hands when menu is shown
      hands.forEach(hand => {
        hand.querySelector('.count').textContent = state[hand.dataset.player][hand.dataset.hand];
        hand.disabled = true;
        hand.classList.remove('selected');
      });
      if (clapBtn) clapBtn.classList.add('hidden');
    }
  };
})(updateUI);

updateUI();

// --- Clap Button Modal Logic ---
const clapBtn = document.getElementById('clap-btn');
const clapModal = document.getElementById('clap-modal');
const clapHandValSpan = document.getElementById('clap-hand-val');
const clapLeftInput = document.getElementById('clap-left');
const clapRightInput = document.getElementById('clap-right');
const clapError = document.getElementById('clap-error');
const clapConfirm = document.getElementById('clap-confirm');
const clapCancel = document.getElementById('clap-cancel');

clapBtn.onclick = function () {
  const player = state[currentPlayer];
  let handName = player.left > 0 ? 'left' : 'right';
  let handVal = player[handName];
  clapHandValSpan.textContent = handVal;
  clapLeftInput.value = '';
  clapRightInput.value = '';
  clapLeftInput.max = handVal - 1;
  clapRightInput.max = handVal - 1;
  clapError.textContent = '';
  clapModal.classList.add('active');
  clapModal.classList.remove('hidden');
  clapLeftInput.focus();
};

clapConfirm.onclick = function () {
  const player = state[currentPlayer];
  let handVal = player.left > 0 ? player.left : player.right;
  let left = parseInt(clapLeftInput.value);
  let right = parseInt(clapRightInput.value);
  if (isNaN(left) || isNaN(right) || left < 1 || right < 1 || left + right !== handVal) {
    clapError.textContent = `Invalid split. Must add up to ${handVal} and be at least 1 each.`;
    return;
  }
  player.left = left;
  player.right = right;
  clapModal.classList.remove('active');
  clapModal.classList.add('hidden');
  switchTurn();
  updateUI();
};

clapCancel.onclick = function () {
  clapModal.classList.remove('active');
  clapModal.classList.add('hidden');
};
