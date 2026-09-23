# Project Guidelines & Agent Context: DungeonQuest

Welcome to **DungeonQuest** (`Math Mage: Dungeon Survivor`), an action roguelite survival web game combined with fast-paced mental math.

---

## 🏛️ Architecture & Directory Structure

The codebase is organized into a clean, modular structure under `src/`:

```
dungeon game/
├── index.html                   # Game entry point, HTML5 canvas, and UI modals
├── README.md                    # Public documentation
├── AGENTS.md                    # Agent & developer guidelines
└── src/
    ├── css/
    │   └── style.css            # Dark mode neon arcane styling & responsive layout
    └── js/
        ├── audio/
        │   └── audio.js         # SoundSynthesizer (Pure Web Audio API synth)
        ├── math/
        │   └── math_engine.js   # MathEngine (Adaptive arithmetic/algebra generator)
        ├── ui/
        │   └── ui.js            # UIManager (DOM, HUD, Keyboard/Touch controls)
        └── core/
            └── game_engine.js   # GameEngine (60FPS Canvas loop, AI swarm, combat)
```

---

## 🛠️ Development & Coding Standards

1. **Vanilla-First**:
   - Keep the project lightweight and framework-free.
   - Do not add external audio files (`.mp3`, `.wav`); always use the Web Audio synthesizer in `src/js/audio/audio.js`.

2. **Code Integrity**:
   - Write complete, robust implementations without placeholders or `// TODO` stubs.
   - Maintain modular separation across `audio/`, `math/`, `ui/`, and `core/`.

3. **Performance & Visuals**:
   - Keep the canvas render loop optimized at 60 FPS.
   - Retain visual polish: screen shake, hit flashes, particle explosions, and floating damage/combo text.

4. **Mobile & Cross-Platform Support**:
   - Ensure all UI and controls work seamlessly with both keyboard and mobile touch.

---

## 🚀 Running & Testing

- Simply open `index.html` in any modern web browser.
- Git Repository: `https://github.com/marcellosrgr/DungeonQuest.git` (branch: `main`).
