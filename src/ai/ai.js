import { Game } from '../engine/game.js';

export const AI = (function () {
  'use strict';

  function randomMove(state) {
    const moves = Game.getMoves(state);
    if (!moves.length) return null;
    return moves[Math.floor(Math.random() * moves.length)];
  }

  function evaluateMove(state, move) {
    const me = state.current;
    const opp = me === 'player1' ? 'player2' : 'player1';

    let s2;
    try { s2 = Game.applyMove(state, move); } catch { return -Infinity; }
    if (Game.getWinner(s2) === me) return 10000;

    const o = s2.hands[opp];
    const m = s2.hands[me];

    const elimOpp = (o.left === 0) + (o.right === 0);
    const elimMe = (m.left === 0) + (m.right === 0);

    let score = 0;
    score += elimOpp * 50;
    score -= elimMe * 40;
    score += (8 - (o.left + o.right));
    if (move.type === 'split') score += (4 - Math.abs(move.left - move.right));
    return score;
  }

  function greedyMove(state) {
    const moves = Game.getMoves(state);
    if (!moves.length) return null;
    let best = moves[0];
    let bestScore = -Infinity;
    for (const mv of moves) {
      const s = evaluateMove(state, mv);
      if (s > bestScore || (s === bestScore && Math.random() < 0.5)) { bestScore = s; best = mv; }
    }
    return best;
  }

  // Stubs to implement
  function heuristic(state) { return 0; }
  function minimaxMove(state, { depth = 3, evaluate = heuristic } = {}) { return null; }
  function expectimaxMove(state, { depth = 3, evaluate = heuristic } = {}) { return null; }
  function mctsMove(state, { iterations = 1000, timeMs = 200 } = {}) { return null; }
  function customMove(state) { return null; }

  return { randomMove, greedyMove, heuristic, minimaxMove, expectimaxMove, mctsMove, customMove };
})();

if (typeof window !== 'undefined') window.AI = AI;
