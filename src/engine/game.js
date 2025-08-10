export const Game = (function () {
  'use strict';

  function createInitialState() {
    return {
      current: 'player1',
      hands: {
        player1: { left: 1, right: 1 },
        player2: { left: 1, right: 1 }
      }
    };
  }

  function cloneState(state) {
    return {
      current: state.current,
      hands: {
        player1: { left: state.hands.player1.left, right: state.hands.player1.right },
        player2: { left: state.hands.player2.left, right: state.hands.player2.right }
      }
    };
  }

  function getCurrentPlayer(state) { return state.current; }
  function getOpponent(player) { return player === 'player1' ? 'player2' : 'player1'; }

  function hasLost(state, player) {
    const p = state.hands[player];
    return p.left === 0 && p.right === 0;
  }

  function isTerminal(state) { return hasLost(state, 'player1') || hasLost(state, 'player2'); }
  function getWinner(state) { if (hasLost(state, 'player1')) return 'player2'; if (hasLost(state, 'player2')) return 'player1'; return null; }
  function switchTurn(state) { const s = cloneState(state); s.current = getOpponent(s.current); return s; }

  function applyAttack(state, attackerPlayer, attackerHand, targetPlayer, targetHand) {
    const s = cloneState(state);
    if (!['left', 'right'].includes(attackerHand) || !['left', 'right'].includes(targetHand)) throw new Error('Invalid hand name');
    if (s.hands[attackerPlayer][attackerHand] === 0) throw new Error('Cannot attack with a dead hand');
    if (s.hands[targetPlayer][targetHand] === 0) throw new Error('Cannot target a dead hand');
    const attackerVal = s.hands[attackerPlayer][attackerHand];
    const newVal = s.hands[targetPlayer][targetHand] + attackerVal;
    s.hands[targetPlayer][targetHand] = newVal >= 5 ? 0 : newVal;
    return s;
  }

  function canSplitState(state, player) {
    const p = state.hands[player];
    const leftAlive = p.left > 0; const rightAlive = p.right > 0; const onlyOneAlive = leftAlive !== rightAlive; const activeVal = leftAlive ? p.left : p.right;
    return onlyOneAlive && activeVal > 1;
  }

  function applySplit(state, player, left, right) {
    const s = cloneState(state);
    if (!Number.isInteger(left) || !Number.isInteger(right)) throw new Error('Split values must be integers');
    const p = s.hands[player]; const total = p.left + p.right;
    if (!(left >= 1 && right >= 1)) throw new Error('Split values must be at least 1');
    if (left + right !== total) throw new Error('Split values must sum to the original total');
    if (left >= 5 || right >= 5) throw new Error('Split values must be less than 5');
    s.hands[player].left = left; s.hands[player].right = right; return s;
  }

  function applyMove(state, move) {
    if (!move || typeof move !== 'object' || !move.type) throw new Error('Invalid move');
    if (move.type === 'attack') { const ap = move.attackerPlayer || state.current; return applyAttack(state, ap, move.attackerHand, move.targetPlayer, move.targetHand); }
    if (move.type === 'split') { const p = move.player || state.current; return applySplit(state, p, move.left, move.right); }
    throw new Error('Unknown move type');
  }

  function getMoves(state) {
    const moves = []; const current = state.current; const opponent = getOpponent(current); const p = state.hands[current]; const o = state.hands[opponent];
    ['left', 'right'].forEach(from => { if (p[from] > 0) { ['left', 'right'].forEach(to => { if (o[to] > 0) moves.push({ type: 'attack', attackerPlayer: current, attackerHand: from, targetPlayer: opponent, targetHand: to }); }); } });
    ['left', 'right'].forEach(from => { const to = from === 'left' ? 'right' : 'left'; if (p[from] > 0 && p[to] > 0) moves.push({ type: 'attack', attackerPlayer: current, attackerHand: from, targetPlayer: current, targetHand: to }); });
    if (canSplitState(state, current)) { const total = p.left + p.right; for (let a = 1; a <= total - 1; a++) { const b = total - a; if (a < 5 && b < 5) moves.push({ type: 'split', player: current, left: a, right: b }); } }
    return moves;
  }

  function getBoard(state) { return { current: state.current, p1: [state.hands.player1.left, state.hands.player1.right], p2: [state.hands.player2.left, state.hands.player2.right] }; }

  function attack(state, fromHand, toPlayer, toHand) { return applyMove(state, { type: 'attack', attackerPlayer: state.current, attackerHand: fromHand, targetPlayer: toPlayer, targetHand: toHand }); }
  function split(state, left, right) { return applyMove(state, { type: 'split', player: state.current, left, right }); }

  return { createInitialState, cloneState, getCurrentPlayer, switchTurn, hasLost, isTerminal, getWinner, canSplitState, getMoves, applyMove, attack, split, getBoard };
})();

// Attach to window for browser compatibility when loaded directly
if (typeof window !== 'undefined') window.Game = Game;
