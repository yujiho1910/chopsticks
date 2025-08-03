/**
 * Chopsticks Game - Main Game Logic
 * A classic hand game where players attack each other's hands with finger counts
 * Features: 2-player mode, custom names, clap/split mechanic, mobile-responsive UI
 */

// ========================================
// GAME STATE MANAGEMENT
// ========================================

/** Current player's turn ('player1' or 'player2') */
let currentPlayer = 'player1';

/** Currently selected hand for attacking (null when no hand selected) */
let selectedHand = null;

/** DOM reference to the selected hand button */
let selectedButton = null;

/** Current game mode ('2p' for 2-player, future: 'ai-easy', 'ai-hard') */
let gameMode = null;

/** Core game state - finger counts for each player's hands */
const state = {
  player1: { left: 1, right: 1 },
  player2: { left: 1, right: 1 }
};

/** Player display names */
let player1Name = 'Player 1';
let player2Name = 'Player 2';

// ========================================
// DOM ELEMENT REFERENCES
// ========================================

// Wait for DOM to be fully loaded before initializing
let hands, turnIndicator, messageBox, menu, nameSetup, gameUI;

function initializeDOMReferences() {
  hands = document.querySelectorAll('.hand');
  turnIndicator = document.getElementById('turn-indicator');
  messageBox = document.getElementById('message');
  menu = document.getElementById('menu');
  nameSetup = document.getElementById('name-setup');
  gameUI = document.getElementById('game-ui');
}

// ========================================
// CORE GAME FUNCTIONS
// ========================================

/**
 * Resets the game to initial state
 * Restores all hands to 1 finger, clears selections, enables all hands
 */
function resetGame() {
  state.player1.left = 1;
  state.player1.right = 1;
  state.player2.left = 1;
  state.player2.right = 1;
  currentPlayer = 'player1';
  selectedHand = null;
  selectedButton = null;
  if (messageBox) messageBox.textContent = '';
  if (turnIndicator) turnIndicator.textContent = `${player1Name}'s Turn`;
  
  if (hands && hands.length > 0) {
    hands.forEach(hand => {
      hand.disabled = false;
      hand.addEventListener('click', handleHandClick);
    });
  }
  
  updateUI();
}

/**
 * Updates hand UI elements to reflect current game state
 * Handles finger counts, disabled states, and selection highlighting
 */
function updateHandUI() {
  if (!hands || hands.length === 0) return; // Safety check
  
  hands.forEach(hand => {
    const player = hand.dataset.player;
    const handName = hand.dataset.hand;
    const count = state[player][handName];
    
    hand.querySelector('.count').textContent = count;
    hand.disabled = count === 0 || (player !== currentPlayer && !selectedHand);
    hand.classList.remove('selected');
  });
  
  if (selectedButton) {
    selectedButton.classList.add('selected');
  }
}

/**
 * Updates player name displays in the UI
 */
function updatePlayerNames() {
  const p1Board = document.getElementById('player1-board');
  const p2Board = document.getElementById('player2-board');
  
  if (p1Board) p1Board.querySelector('h2').textContent = player1Name;
  if (p2Board) p2Board.querySelector('h2').textContent = player2Name;
}

/**
 * Main UI update function - coordinates all UI updates
 */
function updateUI() {
  updateHandUI();
  updatePlayerNames();
}

/**
 * Checks if the current player has won the game
 * @returns {boolean} True if game is won, false otherwise
 */
function checkWin() {
  const opponent = currentPlayer === 'player1' ? 'player2' : 'player1';
  const winner = currentPlayer === 'player1' ? player1Name : player2Name;
  
  if (state[opponent].left === 0 && state[opponent].right === 0) {
    if (messageBox) messageBox.textContent = `${winner} wins!`;
    if (hands && hands.length > 0) {
      hands.forEach(hand => {
        hand.disabled = true;
        hand.removeEventListener('click', handleHandClick);
      });
    }
    
    const clapBtn = document.getElementById('clap-btn');
    if (clapBtn) clapBtn.classList.add('hidden');
    return true;
  }
  
  return false;
}

/**
 * Switches to the next player's turn
 */
function switchTurn() {
  currentPlayer = currentPlayer === 'player1' ? 'player2' : 'player1';
  const currentName = currentPlayer === 'player1' ? player1Name : player2Name;
  if (turnIndicator) turnIndicator.textContent = `${currentName}'s Turn`;
}

// ========================================
// HAND INTERACTION LOGIC
// ========================================

/**
 * Main hand click handler - manages all hand selection and attack logic
 * Handles three scenarios:
 * 1. Selecting/deselecting your own hands
 * 2. Attacking opponent hands  
 * 3. Self-attacking your own other hand
 * 
 * @param {Event} e - Click event from hand button
 */
function handleHandClick(e) {
  const hand = e.currentTarget;
  const player = hand.dataset.player;
  const handName = hand.dataset.hand;

  // SCENARIO 1: Player clicked their own hand
  if (player === currentPlayer) {
    if (!selectedHand) {
      // Case 1A: Select this hand for attacking
      selectedHand = handName;
      selectedButton = hand;
      
      // Enable valid attack targets: opponent hands and your other hand (if both have fingers)
      if (hands && hands.length > 0) {
        hands.forEach(h => {
          const hPlayer = h.dataset.player;
          const hHand = h.dataset.hand;
          const isSelectedHand = (hPlayer === currentPlayer && hHand === selectedHand);
          const hasFingers = state[hPlayer][hHand] > 0;
          h.disabled = isSelectedHand || !hasFingers;
        });
      }
      
      updateUI();
    } else if (selectedHand === handName) {
      // Case 1B: Deselect currently selected hand
      selectedHand = null;
      selectedButton = null;
      
      if (hands && hands.length > 0) {
        hands.forEach(h => {
          h.disabled = state[h.dataset.player][h.dataset.hand] === 0;
        });
      }
      
      updateUI();
    } else {
      // Case 1C: Self-attack (attack your other hand)
      executeAttack(currentPlayer, selectedHand, currentPlayer, handName);
      clearSelection();
      switchTurn();
      updateUI();
    }
    return;
  }
  
  // SCENARIO 2: Player clicked opponent's hand with a hand selected
  if (selectedHand) {
    executeAttack(currentPlayer, selectedHand, player, handName);
    clearSelection();
    
    if (!checkWin()) {
      switchTurn();
    }
    
    updateUI();
  }
  
  // SCENARIO 3: Clicked opponent's hand without selection - no action
}

/**
 * Executes an attack from one hand to another
 * @param {string} attackerPlayer - Player making the attack
 * @param {string} attackerHand - Hand making the attack ('left' or 'right')
 * @param {string} targetPlayer - Player receiving the attack
 * @param {string} targetHand - Hand receiving the attack ('left' or 'right')
 */
function executeAttack(attackerPlayer, attackerHand, targetPlayer, targetHand) {
  const attackerVal = state[attackerPlayer][attackerHand];
  const newVal = state[targetPlayer][targetHand] + attackerVal;
  
  // Chopsticks rule: hand dies if finger count reaches 5 or more
  state[targetPlayer][targetHand] = newVal >= 5 ? 0 : newVal;
}

/**
 * Clears hand selection state
 */
function clearSelection() {
  selectedHand = null;
  selectedButton = null;
}

// ========================================
// MENU AND GAME MODE LOGIC
// ========================================

/**
 * Handles game mode selection and configures name input screen
 * @param {string} mode - Game mode ('2p', 'ai-easy', 'ai-hard')
 */
function selectGameMode(mode) {
  gameMode = mode;
  
  if (menu) menu.classList.add('hidden');
  if (nameSetup) nameSetup.classList.remove('hidden');
  
  // Configure name inputs based on selected mode
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
    // AI modes (future implementation)
    if (nameSetupTitle) nameSetupTitle.textContent = 'Enter Your Name';
    if (player1InputGroup) player1InputGroup.style.display = 'flex';
    if (player2InputGroup) player2InputGroup.style.display = 'none';
    if (player1Label) player1Label.textContent = 'Your Name:';
    if (player1Input) player1Input.placeholder = 'Player';
  }
  
  if (player1Input) player1Input.focus();
}

/**
 * Starts the game with configured names and mode
 */
function startGame() {
  const player1Input = document.getElementById('player1-name');
  const player2Input = document.getElementById('player2-name');
  
  if (gameMode === '2p') {
    player1Name = player1Input.value.trim() || 'Player 1';
    player2Name = player2Input.value.trim() || 'Player 2';
  } else {
    player1Name = player1Input.value.trim() || 'Player';
    player2Name = 'AI';
  }
  
  if (turnIndicator) turnIndicator.textContent = `${player1Name}'s Turn`;
  
  if (nameSetup) nameSetup.classList.add('hidden');
  if (gameUI) gameUI.classList.remove('hidden');
  updateUI();
}

/**
 * Returns to main menu and resets game state
 */
function backToMenu() {
  if (menu) menu.classList.remove('hidden');
  if (nameSetup) nameSetup.classList.add('hidden');
  if (gameUI) gameUI.classList.add('hidden');
  resetGame();
}

// ========================================
// EVENT LISTENERS AND INITIALIZATION
// ========================================

// Initialize the game when DOM is loaded
function initializeGame() {
  initializeDOMReferences();
  
  // Game mode selection
  const mode2pBtn = document.getElementById('mode-2p');
  if (mode2pBtn) mode2pBtn.onclick = () => selectGameMode('2p');

  // Name setup navigation
  const startGameBtn = document.getElementById('start-game-btn');
  const backToMenuBtn = document.getElementById('back-to-menu-btn');
  if (startGameBtn) startGameBtn.onclick = startGame;
  if (backToMenuBtn) {
    backToMenuBtn.onclick = () => {
      if (nameSetup) nameSetup.classList.add('hidden');
      if (menu) menu.classList.remove('hidden');
    };
  }

  // Game controls
  const resetBtn = document.getElementById('reset-btn');
  const menuBtn = document.getElementById('menu-btn');
  if (resetBtn) resetBtn.onclick = resetGame;
  if (menuBtn) menuBtn.onclick = backToMenu;

  // Keyboard navigation for name inputs
  const player1NameInput = document.getElementById('player1-name');
  const player2NameInput = document.getElementById('player2-name');
  
  if (player1NameInput) {
    player1NameInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        if (gameMode === '2p' && player2NameInput) {
          player2NameInput.focus();
        } else {
          startGame();
        }
      }
    });
  }

  if (player2NameInput) {
    player2NameInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        startGame();
      }
    });
  }

  // Hand click listeners
  if (hands && hands.length > 0) {
    hands.forEach(hand => hand.addEventListener('click', handleHandClick));
  }
  
  // Initialize UI
  updateUI();
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeGame);
} else {
  initializeGame();
}

// ========================================
// CLAP/SPLIT FUNCTIONALITY
// ========================================

/**
 * Enhanced UI update that includes clap button logic
 * Shows clap button when player has exactly one active hand with >1 fingers
 */
updateUI = (function (originalUpdateUI) {
  return function () {
    const clapBtn = document.getElementById('clap-btn');
    const gameOver = (state.player1.left === 0 && state.player1.right === 0) || 
                     (state.player2.left === 0 && state.player2.right === 0);
    
    if (gameUI && !gameUI.classList.contains('hidden')) {
      originalUpdateUI();
      
      if (gameOver) {
        if (clapBtn) clapBtn.classList.add('hidden');
      } else {
        // Show clap button if player has exactly one hand alive with >1 fingers
        const player = state[currentPlayer];
        const leftAlive = player.left > 0;
        const rightAlive = player.right > 0;
        const onlyOneHandAlive = leftAlive !== rightAlive; // XOR - exactly one is true
        const activeHandValue = leftAlive ? player.left : player.right;
        
        if (onlyOneHandAlive && activeHandValue > 1) {
          if (clapBtn) clapBtn.classList.remove('hidden');
        } else {
          if (clapBtn) clapBtn.classList.add('hidden');
        }
      }
    } else {
      // Hide UI elements when in menu
      if (hands && hands.length > 0) {
        hands.forEach(hand => {
          hand.querySelector('.count').textContent = state[hand.dataset.player][hand.dataset.hand];
          hand.disabled = true;
          hand.classList.remove('selected');
        });
      }
      if (clapBtn) clapBtn.classList.add('hidden');
    }
  };
})(updateUI);

// Clap modal elements
const clapBtn = document.getElementById('clap-btn');
const clapModal = document.getElementById('clap-modal');
const clapHandValSpan = document.getElementById('clap-hand-val');
const clapLeftInput = document.getElementById('clap-left');
const clapRightInput = document.getElementById('clap-right');
const clapError = document.getElementById('clap-error');
const clapConfirm = document.getElementById('clap-confirm');
const clapCancel = document.getElementById('clap-cancel');

/**
 * Makes an input field accept only numeric values
 * @param {HTMLInputElement} input - Input element to restrict
 */
function makeNumericOnly(input) {
  // Remove non-numeric characters on input
  input.addEventListener('input', function() {
    this.value = this.value.replace(/[^0-9]/g, '');
  });
  
  // Prevent non-numeric key presses
  input.addEventListener('keydown', function(e) {
    const allowedKeys = [8, 9, 27, 13, 46]; // Backspace, Tab, Escape, Enter, Delete
    const ctrlKeys = [65, 67, 86, 88]; // Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
    
    // Allow navigation and control keys
    if (allowedKeys.includes(e.keyCode) || 
        (ctrlKeys.includes(e.keyCode) && e.ctrlKey)) {
      return;
    }
    
    // Allow numeric keys (0-9) from both keyboard and numpad
    const isNumericKey = (e.keyCode >= 48 && e.keyCode <= 57) || 
                         (e.keyCode >= 96 && e.keyCode <= 105);
    
    if (!isNumericKey || e.shiftKey) {
      e.preventDefault();
    }
  });
}

// Apply numeric-only behavior to clap inputs
makeNumericOnly(clapLeftInput);
makeNumericOnly(clapRightInput);

/**
 * Opens the clap modal for splitting fingers between hands
 */
clapBtn.onclick = function () {
  const player = state[currentPlayer];
  const handName = player.left > 0 ? 'left' : 'right';
  const handVal = player[handName];
  
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

/**
 * Confirms the clap/split action with validation
 */
clapConfirm.onclick = function () {
  const player = state[currentPlayer];
  const handVal = player.left > 0 ? player.left : player.right;
  const left = parseInt(clapLeftInput.value);
  const right = parseInt(clapRightInput.value);
  
  // Validate split values
  if (isNaN(left) || isNaN(right) || left < 1 || right < 1 || left + right !== handVal) {
    clapError.textContent = `Invalid split. Must add up to ${handVal} and be at least 1 each.`;
    return;
  }
  
  // Apply the split
  player.left = left;
  player.right = right;
  
  // Close modal and continue game
  clapModal.classList.remove('active');
  clapModal.classList.add('hidden');
  switchTurn();
  updateUI();
};

/**
 * Cancels the clap action and closes modal
 */
clapCancel.onclick = function () {
  clapModal.classList.remove('active');
  clapModal.classList.add('hidden');
};
