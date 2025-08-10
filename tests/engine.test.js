import { describe, it, expect } from "vitest";
import { Game } from "../src/engine/game.js";

function sP1(l, r) {
  const s = Game.createInitialState();
  s.hands.player1.left = l;
  s.hands.player1.right = r;
  s.current = "player1";
  return s;
}

// helper for player2 state was unused; removed to keep tests lean

describe("Game.getMoves - split generation", () => {
  it("generates split moves only when one hand alive and >1", () => {
    const s = sP1(3, 0);
    const moves = Game.getMoves(s);
    const splits = moves.filter((m) => m.type === "split");
    // total=3 -> splits (1,2) and (2,1)
    expect(splits.length).toBe(2);
    expect(splits.some((m) => m.left === 1 && m.right === 2)).toBe(true);
    expect(splits.some((m) => m.left === 2 && m.right === 1)).toBe(true);
  });

  it("does not generate split moves when both hands alive", () => {
    const s = sP1(2, 1);
    const moves = Game.getMoves(s);
    expect(moves.some((m) => m.type === "split")).toBe(false);
  });
});

describe("Game.applyMove - validation", () => {
  it("throws on invalid move object", () => {
    const s = Game.createInitialState();
    expect(() => Game.applyMove(s, null)).toThrow();
    expect(() => Game.applyMove(s, {})).toThrow();
    expect(() => Game.applyMove(s, { type: "unknown" })).toThrow();
  });

  it("attack validity: cannot use dead hand or target dead hand", () => {
    let s = Game.createInitialState();
    s.hands.player1.left = 0;
    expect(() =>
      Game.applyMove(s, {
        type: "attack",
        attackerHand: "left",
        targetPlayer: "player2",
        targetHand: "left",
      })
    ).toThrow();

    s = Game.createInitialState();
    s.hands.player2.left = 0;
    expect(() =>
      Game.applyMove(s, {
        type: "attack",
        attackerHand: "left",
        targetPlayer: "player2",
        targetHand: "left",
      })
    ).toThrow();
  });

  it("split validity: integers, sum, bounds", () => {
    const s = sP1(3, 0);
    expect(() =>
      Game.applyMove(s, { type: "split", left: 1, right: 1 })
    ).toThrow(); // sum mismatch
    expect(() =>
      Game.applyMove(s, { type: "split", left: 1.5, right: 1.5 })
    ).toThrow(); // not integers
    expect(() =>
      Game.applyMove(s, { type: "split", left: 4, right: -1 })
    ).toThrow(); // bounds
  });

  it("split not allowed when both hands alive or zero alive", () => {
    const sBoth = sP1(2, 1);
    expect(Game.canSplitState(sBoth, "player1")).toBe(false);
    expect(() =>
      Game.applyMove(sBoth, { type: "split", left: 1, right: 2 })
    ).toThrow();

    const sZero = sP1(0, 0);
    expect(Game.canSplitState(sZero, "player1")).toBe(false);
    expect(() =>
      Game.applyMove(sZero, { type: "split", left: 0, right: 0 })
    ).toThrow();
  });
});

describe("Turn switching", () => {
  it("switchTurn swaps current player", () => {
    let s = Game.createInitialState();
    expect(s.current).toBe("player1");
    s = Game.switchTurn(s);
    expect(s.current).toBe("player2");
    s = Game.switchTurn(s);
    expect(s.current).toBe("player1");
  });
});
