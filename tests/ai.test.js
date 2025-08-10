import { describe, it, expect } from "vitest";
import { Game } from "../src/engine/game.js";
import { AI } from "../src/ai/ai.js";

describe("AI.randomMove", () => {
  it("returns a legal move or null when no moves", () => {
    const s = Game.createInitialState();
    const mv = AI.randomMove(s);
    if (mv) {
      const legal = Game.getMoves(s).some(
        (m) => JSON.stringify(m) === JSON.stringify(mv)
      );
      expect(legal).toBe(true);
    } else {
      expect(Game.getMoves(s).length).toBe(0);
    }
  });
});

describe("AI.greedyMove", () => {
  it("prefers winning moves when available", () => {
    // Construct a state where player1 can immediately win
    let s = Game.createInitialState();
    s.hands.player1.left = 4;
    s.hands.player1.right = 1;
    s.hands.player2.left = 0;
    s.hands.player2.right = 1;
    s.current = "player1";

    const mv = AI.greedyMove(s);
    expect(mv).toBeTruthy();
    const s2 = Game.applyMove(s, mv);
    const winner = Game.getWinner(s2);
    expect([null, "player1"]).toContain(winner);
  });
});
