# Project Guidelines & Agent Context: DungeonQuest

Welcome to **DungeonQuest** (`Math Mage 3D: Dungeon Survivor`), an action roguelite survival 3D web game combined with fast-paced mental math.

---

## 🏛️ Architecture & Directory Structure

The codebase is organized into a clean, modular structure under `src/` leveraging **Three.js (via CDN)** for WebGL 3D rendering and the **Web Audio API** for real-time sound synthesis:

```
dungeon game/
├── index.html                   # Game entry point, Three.js canvas, and UI modals
├── README.md                    # Public documentation & gameplay guide
├── AGENTS.md                    # Agent & developer guidelines
└── src/
    ├── css/
    │   └── style.css            # Dark mode neon arcane styling & 3D floating badges
    └── js/
        ├── audio/
        │   └── audio.js         # SoundSynthesizer (Pure Web Audio API synth)
        ├── math/
        │   └── math_engine.js   # MathEngine (Adaptive generator with <1.8s Criticals)
        ├── ui/
        │   └── ui.js            # UIManager (HUD, 3D target coordinates, Touch D-Pad)
        └── core/
            └── game_engine.js   # GameEngine3D (Three.js WebGL loop, 3D arena, lighting, spell physics)
```

---

## 🛠️ Development & Coding Standards

1. **3D WebGL & Vanilla Architecture**:
   - Use Three.js for 3D meshes, shadows, lights, and particle systems.
   - Keep audio 100% synthetic via Web Audio API in `src/js/audio/audio.js` (no external MP3/WAV files).

2. **Code Integrity**:
   - Write complete, robust implementations without placeholders or `// TODO` stubs.
   - Maintain clean separation between `audio/`, `math/`, `ui/`, and `core/`.

3. **Performance & Visual Polish**:
   - Maintain 60 FPS WebGL render loops.
   - Retain 3D visual feedback: dynamic camera lerping, camera screen shakes, time dilation slow-motion on critical casts, 3D gem magnetism, and 3D particle explosions.

4. **Mobile & Cross-Platform Support**:
   - Support both keyboard controls (`WASD` + `[1]-[4]`) and on-screen Touch D-Pad + touch spell cards.

---

## 🚀 Running & Testing

- Simply open `index.html` in any modern web browser.
- Git Repository: `https://github.com/marcellosrgr/DungeonQuest.git` (branch: `main`).
