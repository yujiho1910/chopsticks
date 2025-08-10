# chopsticks

A polished browser version of the classic hand game "Chopsticks", built with HTML, CSS, and JavaScript. It features a pure game engine, a small AI module, and an accessible UI.

## 🎯 What’s inside

- Two-player local mode
- Optional AI opponent (Random, Greedy)
- Split/Clap mechanic via modal with validation
- Recent moves with timestamps + full history modal
- Accessible UI (ARIA labels, keyboard-friendly)

## 🧩 How to run

- Dev server (with sourcemaps)

```pwsh
npm run dev
```

- Production build

```pwsh
npm run build
```

- Tests

```pwsh
npm test
```

Open `public/index.html` (served by the dev command). The bundle is output to `public/dist/app.bundle.js`.

## � How to play

1. Select a game mode (2P or AI) and enter names
2. Click one of your hands to select it
3. Click opponent’s hand to attack, or your other hand to self-attack
4. If exactly one of your hands is alive with >1, use Clap to split fingers
5. Hands reaching 5 wrap to 0; eliminate both opponent hands to win

## 🧠 Tech

- Engine: pure functions (`src/engine/game.js`)
- AI: strategies (`src/ai/ai.js`)
- UI: DOM wiring (`src/ui/script.js`)
- Build: esbuild, Tests: Vitest

## 📁 Structure

```text
|   package.json
|   README.md
|   TECHNICAL.md
+---docs
|       flow-diagram.md
+---public
|       index.html
|       style.css
|       dist/
+---src
|   +---ai
|   |       ai.js
|   +---engine
|   |       game.js
|   \---ui
|           script.js
+---tests
|   ai.test.js
|   chopsticks.test.js
|   engine.test.js
```

## 🙌 Author

**Yuji Ho Jing Rui** — built as a fun and educational project to explore game creation, interactive design, and browser-based deployment.

Thanks for playing! 🍃
