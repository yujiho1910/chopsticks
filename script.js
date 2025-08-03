// script.js
let currentPlayer = 'you';
let selectedHand = null;
let selectedButton = null;

const state = {
  you: { left: 1, right: 1 },
  opponent: { left: 1, right: 1 }
};

const hands = document.querySelectorAll('.hand');
const turnIndicator = document.getElementById('turn-indicator');
const messageBox = document.getElementById('message');

function updateUI() {
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

function checkWin() {
  const opponent = currentPlayer === 'you' ? 'opponent' : 'you';
  if (state[opponent].left === 0 && state[opponent].right === 0) {
    messageBox.textContent = `${currentPlayer} wins!`;
    hands.forEach(h => h.disabled = true);
    return true;
  }
  return false;
}

function switchTurn() {
  currentPlayer = currentPlayer === 'you' ? 'opponent' : 'you';
  turnIndicator.textContent = currentPlayer === 'you' ? "Your Turn" : "Opponent's Turn";
}

function handleHandClick(e) {
  const hand = e.currentTarget;
  const player = hand.dataset.player;
  const handName = hand.dataset.hand;

  if (player === currentPlayer && !selectedHand) {
    // Select your hand to attack with
    selectedHand = handName;
    selectedButton = hand;
    // Enable all hands except the selected one for attack
    hands.forEach(h => {
      const hPlayer = h.dataset.player;
      const hHand = h.dataset.hand;
      if (!(hPlayer === currentPlayer && hHand === selectedHand) && state[hPlayer][hHand] > 0) {
        h.disabled = false;
      } else {
        h.disabled = true;
      }
    });
    updateUI();
  } else if (selectedHand) {
    // Attack any hand except the one you selected
    if (player === currentPlayer && handName === selectedHand) return; // Prevent attacking the same hand
    const target = handName;
    const attackerVal = state[currentPlayer][selectedHand];
    let newVal = state[player][target] + attackerVal;
    state[player][target] = newVal >= 5 ? 0 : newVal;
    selectedHand = null;
    selectedButton = null;

    if (!checkWin()) {
      switchTurn();
      updateUI();
    }
  }
}

hands.forEach(hand => hand.addEventListener('click', handleHandClick));
updateUI();
updateUI();
