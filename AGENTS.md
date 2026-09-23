# Project Guidelines & Agent Context: DungeonQuest

Welcome to **DungeonQuest** (`Math Mage: Dungeon Survivor`), an action roguelite survival web game combined with fast-paced mental math.

---

## 🏛️ Architecture Overview

The codebase is strictly written in **Pure Vanilla JavaScript (ES6+)**, **HTML5 Canvas 2D API**, and **Web Audio API** with zero external asset dependencies or paid libraries.

### Key Modules:
- `index.html`: Main canvas DOM, responsive HUD, D-Pad, and modal overlay screens (Menu, Game Over, Victory).
- `style.css`: Modern arcane neon aesthetic, dark mode styling, glassmorphism UI, glowing effects, and responsive breakpoints.
- `audio.js` (`SoundSynthesizer`): Web Audio API synthesis for real-time sound effects (spells, impacts, explosions, chimes, buzzers, and procedural rhythm BGM).
- `math_engine.js` (`MathEngine`): Adaptive math question generation across 3 difficulty tiers (Basic Arithmetic, Fast Multiplication/Division, and Simple Algebra).
- `ui.js` (`UIManager`): Screen transitions, input event listeners (`WASD`, arrow keys, hotkeys `[1]-[4]`, and touch D-Pad), HUD updates, and answer feedback.
- `game_engine.js` (`GameEngine`): 60 FPS Canvas game loop, player movement, enemy swarm AI, spell projectiles, particles, hit flashes, and wave progression.

---

## 🛠️ Development & Coding Standards

1. **Vanilla-First**:
   - Keep the project lightweight and framework-free unless explicitly requested.
   - Do not add external audio files (`.mp3`, `.wav`); always use the Web Audio synthesizer in `audio.js`.

2. **Code Integrity**:
   - Write complete, robust implementations without placeholders or `// TODO` stubs.
   - Maintain modularity across `audio.js`, `math_engine.js`, `ui.js`, and `game_engine.js`.

3. **Performance & Visuals**:
   - Keep the canvas render loop optimized at 60 FPS.
   - Retain visual polish: screen shake, hit flashes, particle explosions, and floating damage/combo text.

4. **Mobile & Cross-Platform Support**:
   - Ensure all UI and controls work seamlessly with both keyboard and mobile touch.

---

## 🚀 Running & Testing

- Simply serve or open `index.html` in any modern web browser.
- Git Repository: `https://github.com/marcellosrgr/DungeonQuest.git` (branch: `main`).
