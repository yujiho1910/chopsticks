/**
 * Entry point for bundling with esbuild.
 * Loads engine, AI, and UI modules in order so that:
 *  - engine defines the Game API
 *  - AI registers strategies and (optionally) attaches to window
 *  - UI wires DOM to the engine and optional AI
 *
 * The import order matters because UI assumes Game (and sometimes AI)
 * are already loaded when the bundle runs.
 */
// Entry point for bundling. Executes side-effect modules in order.
import './engine/game.js';
import './ai/ai.js';
import './ui/script.js';
