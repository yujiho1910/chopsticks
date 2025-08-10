/**
 * Core game engine for Chopsticks.
 *
 * State shape:
 * {
 *   current: 'player1' | 'player2',
 *   hands: {
 *     player1: { left: number, right: number },
 *     player2: { left: number, right: number }
 *   }
 * }
 *
 * Public API includes state constructors, transition helpers, move
 * generation, and convenience wrappers for attacks/splits.
 */
export const Game = (function () {
  "use strict";

  /**
   * Create the initial game state.
   * @returns {object} state
   */
  function createInitialState() {
    return {
      current: "player1",
      hands: {
        player1: { left: 1, right: 1 },
        player2: { left: 1, right: 1 },
      },
    };
  }

  /**
   * Deep clone the state to enforce immutability of transitions.
   * @param {object} state
   * @returns {object}
   */
  function cloneState(state) {
    return {
      current: state.current,
      hands: {
        player1: {
          left: state.hands.player1.left,
          right: state.hands.player1.right,
        },
        player2: {
          left: state.hands.player2.left,
          right: state.hands.player2.right,
        },
      },
    };
  }

  /** @param {object} state @returns {'player1'|'player2'} */
  function getCurrentPlayer(state) {
    return state.current;
  }
  /** @param {'player1'|'player2'} player @returns {'player1'|'player2'} */
  function getOpponent(player) {
    return player === "player1" ? "player2" : "player1";
  }

  /**
   * Has the given player lost (both hands dead)?
   * @param {object} state
   * @param {'player1'|'player2'} player
   */
  function hasLost(state, player) {
    const p = state.hands[player];
    return p.left === 0 && p.right === 0;
  }

  /** @param {object} state @returns {boolean} */
  function isTerminal(state) {
    return hasLost(state, "player1") || hasLost(state, "player2");
  }
  /** @param {object} state @returns {('player1'|'player2'|null)} */
  function getWinner(state) {
    if (hasLost(state, "player1")) return "player2";
    if (hasLost(state, "player2")) return "player1";
    return null;
  }
  /**
   * Return a state with the current player swapped.
   * @param {object} state
   * @returns {object}
   */
  function switchTurn(state) {
    const s = cloneState(state);
    s.current = getOpponent(s.current);
    return s;
  }

  /**
   * Apply an attack to a cloned state; throws on invalid parameters.
   * @param {object} state
   * @param {'player1'|'player2'} attackerPlayer
   * @param {'left'|'right'} attackerHand
   * @param {'player1'|'player2'} targetPlayer
   * @param {'left'|'right'} targetHand
   * @returns {object} new state
   */
  function applyAttack(
    state,
    attackerPlayer,
    attackerHand,
    targetPlayer,
    targetHand
  ) {
    const s = cloneState(state);
    if (
      !["left", "right"].includes(attackerHand) ||
      !["left", "right"].includes(targetHand)
    )
      throw new Error("Invalid hand name");
    if (s.hands[attackerPlayer][attackerHand] === 0)
      throw new Error("Cannot attack with a dead hand");
    if (s.hands[targetPlayer][targetHand] === 0)
      throw new Error("Cannot target a dead hand");
    const attackerVal = s.hands[attackerPlayer][attackerHand];
    const newVal = s.hands[targetPlayer][targetHand] + attackerVal;
    s.hands[targetPlayer][targetHand] = newVal >= 5 ? 0 : newVal;
    return s;
  }

  /**
   * Can the given player perform a split?
   * @param {object} state
   * @param {'player1'|'player2'} player
   * @returns {boolean}
   */
  function canSplitState(state, player) {
    const p = state.hands[player];
    const leftAlive = p.left > 0;
    const rightAlive = p.right > 0;
    const onlyOneAlive = leftAlive !== rightAlive;
    const activeVal = leftAlive ? p.left : p.right;
    return onlyOneAlive && activeVal > 1;
  }

  /**
   * Apply a split; validates integer bounds and total conservation.
   * @param {object} state
   * @param {'player1'|'player2'} player
   * @param {number} left
   * @param {number} right
   * @returns {object}
   */
  function applySplit(state, player, left, right) {
    const s = cloneState(state);
    // Enforce split is only allowed when exactly one hand is alive and value > 1
    if (!canSplitState(s, player))
      throw new Error("Split not allowed in current state");
    if (!Number.isInteger(left) || !Number.isInteger(right))
      throw new Error("Split values must be integers");
    const p = s.hands[player];
    const total = p.left + p.right;
    if (!(left >= 1 && right >= 1))
      throw new Error("Split values must be at least 1");
    if (left + right !== total)
      throw new Error("Split values must sum to the original total");
    if (left >= 5 || right >= 5)
      throw new Error("Split values must be less than 5");
    s.hands[player].left = left;
    s.hands[player].right = right;
    return s;
  }

  /**
   * Apply a move object of shape:
   *  - { type:'attack', attackerPlayer?, attackerHand, targetPlayer, targetHand }
   *  - { type:'split',  player?, left, right }
   * Throws on unknown/invalid move or parameters.
   * @param {object} state
   * @param {object} move
   * @returns {object}
   */
  function applyMove(state, move) {
    if (!move || typeof move !== "object" || !move.type)
      throw new Error("Invalid move");
    if (move.type === "attack") {
      const ap = move.attackerPlayer || state.current;
      return applyAttack(
        state,
        ap,
        move.attackerHand,
        move.targetPlayer,
        move.targetHand
      );
    }
    if (move.type === "split") {
      const p = move.player || state.current;
      return applySplit(state, p, move.left, move.right);
    }
    throw new Error("Unknown move type");
  }

  /**
   * Enumerate all legal moves for the current player.
   * @param {object} state
   * @returns {object[]} list of move objects
   */
  function getMoves(state) {
    const moves = [];
    const current = state.current;
    const opponent = getOpponent(current);
    const p = state.hands[current];
    const o = state.hands[opponent];
    ["left", "right"].forEach((from) => {
      if (p[from] > 0) {
        ["left", "right"].forEach((to) => {
          if (o[to] > 0)
            moves.push({
              type: "attack",
              attackerPlayer: current,
              attackerHand: from,
              targetPlayer: opponent,
              targetHand: to,
            });
        });
      }
    });
    ["left", "right"].forEach((from) => {
      const to = from === "left" ? "right" : "left";
      if (p[from] > 0 && p[to] > 0)
        moves.push({
          type: "attack",
          attackerPlayer: current,
          attackerHand: from,
          targetPlayer: current,
          targetHand: to,
        });
    });
    if (canSplitState(state, current)) {
      const total = p.left + p.right;
      for (let a = 1; a <= total - 1; a++) {
        const b = total - a;
        if (a < 5 && b < 5)
          moves.push({ type: "split", player: current, left: a, right: b });
      }
    }
    return moves;
  }

  /**
   * Convenience board snapshot (useful for logging / UI tests).
   * @param {object} state
   * @returns {{current:string,p1:number[],p2:number[]}}
   */
  function getBoard(state) {
    return {
      current: state.current,
      p1: [state.hands.player1.left, state.hands.player1.right],
      p2: [state.hands.player2.left, state.hands.player2.right],
    };
  }

  /**
   * Convenience wrapper to apply an attack for the current player.
   */
  function attack(state, fromHand, toPlayer, toHand) {
    return applyMove(state, {
      type: "attack",
      attackerPlayer: state.current,
      attackerHand: fromHand,
      targetPlayer: toPlayer,
      targetHand: toHand,
    });
  }
  /**
   * Convenience wrapper to apply a split for the current player.
   */
  function split(state, left, right) {
    return applyMove(state, {
      type: "split",
      player: state.current,
      left,
      right,
    });
  }

  return {
    createInitialState,
    cloneState,
    getCurrentPlayer,
    switchTurn,
    hasLost,
    isTerminal,
    getWinner,
    canSplitState,
    getMoves,
    applyMove,
    attack,
    split,
    getBoard,
  };
})();

// Attach to window for browser compatibility when loaded directly
if (typeof window !== "undefined") window.Game = Game;
