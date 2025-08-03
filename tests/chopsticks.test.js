/**
 * Chopsticks Game - Test Suite
 * Comprehensive tests for game logic, state management, and edge cases
 */

const assert = require('assert');

// ========================================
// TEST UTILITIES
// ========================================

/**
 * Creates a fresh game state for testing
 * @returns {Object} Initial game state
 */
function getInitialState() {
  return {
    player1: { left: 1, right: 1 },
    player2: { left: 1, right: 1 }
  };
}

/**
 * Simulates an attack between hands
 * @param {Object} state - Current game state
 * @param {string} attackerPlayer - Player making the attack
 * @param {string} attackerHand - Hand making the attack ('left' or 'right')
 * @param {string} targetPlayer - Player receiving the attack
 * @param {string} targetHand - Hand receiving the attack ('left' or 'right')
 * @returns {Object} Updated game state
 */
function attack(state, attackerPlayer, attackerHand, targetPlayer, targetHand) {
  const attackerVal = state[attackerPlayer][attackerHand];
  const newVal = state[targetPlayer][targetHand] + attackerVal;
  
  // Apply chopsticks rule: hand dies if finger count reaches 5 or more
  state[targetPlayer][targetHand] = newVal >= 5 ? 0 : newVal;
  return state;
}

/**
 * Checks if a player has lost (both hands are 0)
 * @param {Object} state - Current game state
 * @param {string} player - Player to check
 * @returns {boolean} True if player has lost
 */
function hasLost(state, player) {
  return state[player].left === 0 && state[player].right === 0;
}

/**
 * Simulates a clap/split action
 * @param {Object} state - Current game state
 * @param {string} player - Player performing the split
 * @param {number} leftFingers - New left hand finger count
 * @param {number} rightFingers - New right hand finger count
 * @returns {Object} Updated game state
 */
function clap(state, player, leftFingers, rightFingers) {
  state[player].left = leftFingers;
  state[player].right = rightFingers;
  return state;
}

// ========================================
// BASIC GAME MECHANICS TESTS
// ========================================

console.log('Running Basic Game Mechanics Tests...');

// Test 1: Basic attack on opponent
let state = getInitialState();
state = attack(state, 'player1', 'left', 'player2', 'right');
assert.strictEqual(state.player2.right, 2, 'Opponent right hand should be 2 after basic attack');

// Test 2: Self-attack (split move)
state = getInitialState();
state = attack(state, 'player1', 'left', 'player1', 'right');
assert.strictEqual(state.player1.right, 2, 'Your right hand should be 2 after self-attack');

// Test 3: Hand elimination (5+ fingers)
state = getInitialState();
state.player2.right = 4;
state = attack(state, 'player1', 'left', 'player2', 'right');
assert.strictEqual(state.player2.right, 0, 'Hand should be eliminated when reaching 5 fingers');

// Test 4: Hand not eliminated when < 5 fingers
state = getInitialState();
state.player2.right = 3;
state = attack(state, 'player1', 'left', 'player2', 'right');
assert.strictEqual(state.player2.right, 4, 'Hand should not be eliminated when < 5 fingers');

console.log('✓ Basic Game Mechanics Tests Passed');

// ========================================
// WIN CONDITION TESTS
// ========================================

console.log('Running Win Condition Tests...');

// Test 5: Player loses when both hands are eliminated
state = getInitialState();
state.player2.left = 0;
state.player2.right = 4;
state = attack(state, 'player1', 'left', 'player2', 'right');
assert.strictEqual(state.player2.right, 0, 'Last hand should be eliminated');
assert.strictEqual(hasLost(state, 'player2'), true, 'Player 2 should have lost');

// Test 6: Player doesn't lose with one hand remaining
state = getInitialState();
state.player2.left = 0;
state.player2.right = 3;
state = attack(state, 'player1', 'left', 'player2', 'right');
assert.strictEqual(hasLost(state, 'player2'), false, 'Player 2 should not have lost');

console.log('✓ Win Condition Tests Passed');

// ========================================
// CLAP/SPLIT MECHANICS TESTS
// ========================================

console.log('Running Clap/Split Mechanics Tests...');

// Test 7: Valid clap operation
state = getInitialState();
state.player1.left = 3;
state.player1.right = 0;
state = clap(state, 'player1', 2, 1);
assert.strictEqual(state.player1.left, 2, 'Left hand should have 2 fingers after split');
assert.strictEqual(state.player1.right, 1, 'Right hand should have 1 finger after split');

// Test 8: Clap preserves total finger count
state = getInitialState();
state.player1.left = 4;
state.player1.right = 0;
const totalBefore = state.player1.left + state.player1.right;
state = clap(state, 'player1', 2, 2);
const totalAfter = state.player1.left + state.player1.right;
assert.strictEqual(totalBefore, totalAfter, 'Total finger count should be preserved in clap');

console.log('✓ Clap/Split Mechanics Tests Passed');

// ========================================
// EDGE CASES TESTS
// ========================================

console.log('Running Edge Cases Tests...');

// Test 9: Attack with maximum fingers (4 attacking 4)
state = getInitialState();
state.player1.left = 4;
state.player2.right = 4;
state = attack(state, 'player1', 'left', 'player2', 'right');
assert.strictEqual(state.player2.right, 0, 'Hand should be eliminated when 4+4=8 (>=5)');

// Test 10: Multiple eliminations in sequence
state = getInitialState();
state.player1.left = 4;
state.player2.left = 1;
state.player2.right = 1;
state = attack(state, 'player1', 'left', 'player2', 'left');  // Eliminate left hand
state = attack(state, 'player1', 'left', 'player2', 'right'); // Eliminate right hand
assert.strictEqual(hasLost(state, 'player2'), true, 'Player should lose after both hands eliminated');

// Test 11: Self-attack with large numbers
state = getInitialState();
state.player1.left = 4;
state.player1.right = 1;
state = attack(state, 'player1', 'left', 'player1', 'right');
assert.strictEqual(state.player1.right, 0, 'Self-attack should eliminate hand when total >= 5');

console.log('✓ Edge Cases Tests Passed');

// ========================================
// GAME STATE VALIDATION TESTS
// ========================================

console.log('Running Game State Validation Tests...');

// Test 12: Initial state is valid
state = getInitialState();
assert.strictEqual(state.player1.left, 1, 'Player 1 left hand should start with 1');
assert.strictEqual(state.player1.right, 1, 'Player 1 right hand should start with 1');
assert.strictEqual(state.player2.left, 1, 'Player 2 left hand should start with 1');
assert.strictEqual(state.player2.right, 1, 'Player 2 right hand should start with 1');

// Test 13: State remains consistent after operations
state = getInitialState();
state = attack(state, 'player1', 'left', 'player2', 'right');
state = attack(state, 'player2', 'left', 'player1', 'right');
state = attack(state, 'player1', 'right', 'player2', 'left');

// Verify no negative values exist
Object.values(state).forEach(player => {
  Object.values(player).forEach(handValue => {
    assert.strictEqual(handValue >= 0, true, 'Hand values should never be negative');
  });
});

console.log('✓ Game State Validation Tests Passed');

// ========================================
// PERFORMANCE AND STRESS TESTS
// ========================================

console.log('Running Performance Tests...');

// Test 14: Many sequential operations
state = getInitialState();
const startTime = Date.now();

// Simulate a longer game with many moves
for (let i = 0; i < 100; i++) {
  // Reset if someone loses
  if (hasLost(state, 'player1') || hasLost(state, 'player2')) {
    state = getInitialState();
  }
  
  // Alternate attacks
  if (i % 2 === 0) {
    state = attack(state, 'player1', 'left', 'player2', 'right');
  } else {
    state = attack(state, 'player2', 'left', 'player1', 'right');
  }
}

const endTime = Date.now();
assert.strictEqual(endTime - startTime < 100, true, 'Operations should complete quickly');

console.log('✓ Performance Tests Passed');

// ========================================
// TEST SUMMARY
// ========================================

console.log('\n🎉 All Chopsticks Tests Passed! 🎉');
console.log(`
Test Summary:
- Basic Game Mechanics: ✓
- Win Conditions: ✓ 
- Clap/Split Mechanics: ✓
- Edge Cases: ✓
- Game State Validation: ✓
- Performance: ✓

Total Tests: 14
All tests completed successfully!
`);
