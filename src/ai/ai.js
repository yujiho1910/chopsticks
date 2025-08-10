import { Game } from "../engine/game.js";

/**
 * AI strategies for the Chopsticks game.
 *
 * Each strategy is a pure function that inspects the current game state and
 * returns a legal move object compatible with Game.applyMove(state, move).
 *
 * Included strategies:
 *  - randomMove: chooses uniformly at random among legal moves.
 *  - greedyMove: scores each move using a lightweight heuristic and picks the best.
 *  - minimaxMove / expectimaxMove / mctsMove / customMove: placeholders for future work.
 *
 * Note: strategies do not mutate the provided state.
 */

export const AI = (function () {
  "use strict";

  /**
   * Picks a random legal move for the current player.
   * @param {object} state - Current game state
   * @returns {object|null} A move object or null if no legal moves exist
   */
  function randomMove(state) {
    const moves = Game.getMoves(state);
    if (!moves.length) return null;
    return moves[Math.floor(Math.random() * moves.length)];
  }

  /**
   * Heuristic scoring function used by greedyMove.
   * Positive scores favor the current player.
   * @param {object} state - Current state
   * @param {object} move - Candidate move
   * @returns {number} score - Higher is better for the current player
   */
  function evaluateMove(state, move) {
    const me = state.current;
    const opp = me === "player1" ? "player2" : "player1";

    let s2;
    try {
      s2 = Game.applyMove(state, move);
    } catch {
      return -Infinity;
    }
    if (Game.getWinner(s2) === me) return 10000;

    const o = s2.hands[opp];
    const m = s2.hands[me];

    const elimOpp = (o.left === 0) + (o.right === 0);
    const elimMe = (m.left === 0) + (m.right === 0);

    let score = 0;
    score += elimOpp * 50;
    score -= elimMe * 40;
    score += 8 - (o.left + o.right);
    if (move.type === "split") score += 4 - Math.abs(move.left - move.right);
    return score;
  }

  /**
   * Greedy policy: evaluate all legal moves and pick the highest-scoring one.
   * Ties are broken randomly to avoid deterministic loops.
   * @param {object} state - Current state
   * @returns {object|null} The selected move, or null if no legal moves
   */
  function greedyMove(state) {
    const moves = Game.getMoves(state);
    if (!moves.length) return null;
    let best = moves[0];
    let bestScore = -Infinity;
    for (const mv of moves) {
      const s = evaluateMove(state, mv);
      if (s > bestScore || (s === bestScore && Math.random() < 0.5)) {
        bestScore = s;
        best = mv;
      }
    }
    return best;
  }

  // Stubs to implement
  /**
   * Placeholder heuristic for deeper search algorithms.
   * @param {object} state
   * @returns {number}
   */
  function heuristic(_state) {
    return 0;
  }
  /**
   * Placeholder for a depth-limited minimax policy.
   * @param {object} state
   * @param {{depth?: number, evaluate?: (s: object) => number}} [opts]
   * @returns {object|null}
   */
  function minimaxMove(_state, { depth: _depth = 3, evaluate: _evaluate = heuristic } = {}) {
    return null;
  }
  /**
   * Placeholder for an expectimax policy.
   */
  function expectimaxMove(_state, { depth: _depth = 3, evaluate: _evaluate = heuristic } = {}) {
    return null;
  }
  /**
   * Placeholder for Monte Carlo Tree Search.
   */
  function mctsMove(_state, { iterations: _iterations = 1000, timeMs: _timeMs = 200 } = {}) {
    return null;
  }
  /**
   * Placeholder for a custom AI policy.
   */
  function customMove(_state) {
    return null;
  }

  return {
    randomMove,
    greedyMove,
    heuristic,
    minimaxMove,
    expectimaxMove,
    mctsMove,
    customMove,
  };
})();

if (typeof window !== "undefined") window.AI = AI;
