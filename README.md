# chopsticks

A simple 2-player version of the classic hand game "Chopsticks", built with HTML, CSS, and JavaScript. This game was developed as a **passion project** to grow my skills in game logic, interactive UI design, and frontend development.

## 🎯 Objective

Currently the game features only barebone game logic — it requires two players locally (no networking or AI).

### To Do:

- Improve visual polish and animations
- Add a simple AI
- Add reset and undo buttons

Each player starts with one finger on each hand. On your turn, you choose one of your hands to tap an opponent's hand. The tapped hand's finger count increases by the attacker's count. If a hand reaches 5, it "dies" (becomes unusable).

The first player to cause both of the opponent's hands to reach 0 wins!

## 🧩 Features

- Turn-based game logic
- Interactive button UI with cartoon-style visuals
- Win condition handling
- Responsive design for desktop and mobile

## 🚀 How to Play

1. Click one of your hands to select it
2. Click an opponent’s hand to attack it
3. Hands that reach 5 are disabled
4. Game ends when one player has both hands at 0

## 💡 Tech Stack

- **HTML** for structure
- **CSS** (custom + Google Fonts) for playground-style visuals
- **Vanilla JavaScript** for game mechanics

## 🌐 Play Online

You can try out the game live via GitHub Pages [here](https://yujiho1910.github.io/chopsticks/)

## 📁 File Structure

```text
├── index.html        # UI layout
├── style.css         # Cartoon-style visuals
├── script.js         # Game logic
├── tests/            # Folder for logic/unit tests
│   └── chopstick.test.js       # Basic test cases for game state
└── README.md         # Project info
```

## 🛠 Future Ideas

- Add a reset button
- Add split mechanic
- Add AI opponent logic
- Add hand animations or sounds

## 🙌 Author

**Yuji Ho** — built as a fun and educational project to explore game creation, interactive design, and browser-based deployment.

---
Thanks for playing! 🍃
