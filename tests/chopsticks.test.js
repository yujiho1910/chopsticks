/**
 * Chopsticks Game - Modular Test Suite (Vitest)
 *
 * Uses a minimal inline model to test behaviors without coupling to the engine.
 */
import { describe, it, expect } from "vitest";

// --------------------
// Test Utilities
// --------------------
function getInitialState() {
  return {
    player1: { left: 1, right: 1 },
    player2: { left: 1, right: 1 },
  };
}

function attack(state, attackerPlayer, attackerHand, targetPlayer, targetHand) {
  const attackerVal = state[attackerPlayer][attackerHand];
  const newVal = state[targetPlayer][targetHand] + attackerVal;
  state[targetPlayer][targetHand] = newVal >= 5 ? 0 : newVal;
  return state;
}

function hasLost(state, player) {
  return state[player].left === 0 && state[player].right === 0;
}

function clap(state, player, leftFingers, rightFingers) {
  state[player].left = leftFingers;
  state[player].right = rightFingers;
  return state;
}

// --------------------
// Test Suites
// --------------------
describe("Basic Game Mechanics", () => {
  it("attacks opponent hand (1 -> 2)", () => {
    let state = getInitialState();
    state = attack(state, "player1", "left", "player2", "right");
    expect(state.player2.right).toBe(2);
  });

  it("self-attack (split-like) increases own hand", () => {
    let state = getInitialState();
    state = attack(state, "player1", "left", "player1", "right");
    expect(state.player1.right).toBe(2);
  });

  it("eliminates hand at 5 or more", () => {
    let state = getInitialState();
    state.player2.right = 4;
    state = attack(state, "player1", "left", "player2", "right");
    expect(state.player2.right).toBe(0);
  });

  it("does not eliminate when under 5", () => {
    let state = getInitialState();
    state.player2.right = 3;
    state = attack(state, "player1", "left", "player2", "right");
    expect(state.player2.right).toBe(4);
  });
});

describe("Win Conditions", () => {
  it("player loses when both hands eliminated", () => {
    let state = getInitialState();
    state.player2.left = 0;
    state.player2.right = 4;
    state = attack(state, "player1", "left", "player2", "right");
    expect(state.player2.right).toBe(0);
    expect(hasLost(state, "player2")).toBe(true);
  });

  it("player doesn't lose with one hand remaining", () => {
    let state = getInitialState();
    state.player2.left = 0;
    state.player2.right = 3;
    state = attack(state, "player1", "left", "player2", "right");
    expect(hasLost(state, "player2")).toBe(false);
  });
});

describe("Clap / Split Mechanics", () => {
  it("valid clap updates both hands", () => {
    let state = getInitialState();
    state.player1.left = 3;
    state.player1.right = 0;
    state = clap(state, "player1", 2, 1);
    expect(state.player1.left).toBe(2);
    expect(state.player1.right).toBe(1);
  });

  it("clap preserves total finger count", () => {
    let state = getInitialState();
    state.player1.left = 4;
    state.player1.right = 0;
    const totalBefore = state.player1.left + state.player1.right;
    state = clap(state, "player1", 2, 2);
    const totalAfter = state.player1.left + state.player1.right;
    expect(totalBefore).toBe(totalAfter);
  });
});

describe("Edge Cases", () => {
  it("4 attacking 4 eliminates (>= 5 rule)", () => {
    let state = getInitialState();
    state.player1.left = 4;
    state.player2.right = 4;
    state = attack(state, "player1", "left", "player2", "right");
    expect(state.player2.right).toBe(0);
  });

  it("multiple eliminations lead to loss", () => {
    let state = getInitialState();
    state.player1.left = 4;
    state.player2.left = 1;
    state.player2.right = 1;
    state = attack(state, "player1", "left", "player2", "left");
    state = attack(state, "player1", "left", "player2", "right");
    expect(hasLost(state, "player2")).toBe(true);
  });

  it("self-attack can eliminate own hand when total >= 5", () => {
    let state = getInitialState();
    state.player1.left = 4;
    state.player1.right = 1;
    state = attack(state, "player1", "left", "player1", "right");
    expect(state.player1.right).toBe(0);
  });
});

describe("Game State Validation", () => {
  it("initial state is valid", () => {
    const state = getInitialState();
    expect(state.player1.left).toBe(1);
    expect(state.player1.right).toBe(1);
    expect(state.player2.left).toBe(1);
    expect(state.player2.right).toBe(1);
  });

  it("no negative values after typical operations", () => {
    let state = getInitialState();
    state = attack(state, "player1", "left", "player2", "right");
    state = attack(state, "player2", "left", "player1", "right");
    state = attack(state, "player1", "right", "player2", "left");
    Object.values(state).forEach((player) => {
      Object.values(player).forEach((handValue) => {
        expect(handValue >= 0).toBe(true);
      });
    });
  });
});

describe("Performance", () => {
  it("many sequential operations complete quickly", () => {
    let state = getInitialState();
    const startTime = Date.now();
    for (let i = 0; i < 100; i++) {
      if (hasLost(state, "player1") || hasLost(state, "player2")) {
        state = getInitialState();
      }
      if (i % 2 === 0) {
        state = attack(state, "player1", "left", "player2", "right");
      } else {
        state = attack(state, "player2", "left", "player1", "right");
      }
    }
    const endTime = Date.now();
    expect(endTime - startTime < 100).toBe(true);
  });
});
