// tests/chopsticks.test.js
// Basic test cases for Chopsticks game logic

const assert = require('assert');

function getInitialState() {
  return {
    you: { left: 1, right: 1 },
    opponent: { left: 1, right: 1 }
  };
}

function attack(state, attackerPlayer, attackerHand, targetPlayer, targetHand) {
  const attackerVal = state[attackerPlayer][attackerHand];
  let newVal = state[targetPlayer][targetHand] + attackerVal;
  state[targetPlayer][targetHand] = newVal >= 5 ? 0 : newVal;
  return state;
}

// Test: attacking opponent's hand
let state = getInitialState();
state = attack(state, 'you', 'left', 'opponent', 'right');
assert.strictEqual(state.opponent.right, 2, 'Opponent right hand should be 2');

// Test: attacking own hand (split move)
state = getInitialState();
state = attack(state, 'you', 'left', 'you', 'right');
assert.strictEqual(state.you.right, 2, 'Your right hand should be 2 after split');

// Test: hand dies when reaching 5
state = getInitialState();
state.opponent.right = 4;
state = attack(state, 'you', 'left', 'opponent', 'right');
assert.strictEqual(state.opponent.right, 0, 'Opponent right hand should die (0)');

// Test: hand does not die if less than 5
state = getInitialState();
state.opponent.right = 3;
state = attack(state, 'you', 'left', 'opponent', 'right');
assert.strictEqual(state.opponent.right, 4, 'Opponent right hand should be 4');

console.log('All Chopsticks test cases passed!');
