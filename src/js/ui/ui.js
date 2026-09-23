// ui.js - User Interface & Input Handler for 3D Math Mage
class UIManager {
    constructor() {
        // Screens
        this.menuScreen = document.getElementById('menu-screen');
        this.gameOverScreen = document.getElementById('game-over-screen');
        this.victoryScreen = document.getElementById('victory-screen');
        this.hudLayer = document.getElementById('hud-layer');

        // HUD Elements
        this.hpBar = document.getElementById('hp-bar');
        this.hpText = document.getElementById('hp-text');
        this.manaBar = document.getElementById('mana-bar');
        this.manaText = document.getElementById('mana-text');
        this.scoreVal = document.getElementById('score-val');
        this.waveVal = document.getElementById('wave-val');
        this.comboContainer = document.getElementById('combo-container');
        this.comboVal = document.getElementById('combo-val');
        this.questionText = document.getElementById('question-text');
        this.spellIcon = document.getElementById('spell-icon');
        this.answersGrid = document.getElementById('answers-grid');

        // Stats Elements
        this.finalScore = document.getElementById('final-score');
        this.finalAccuracy = document.getElementById('final-accuracy');
        this.finalStreak = document.getElementById('final-streak');
        this.finalAvgTime = document.getElementById('final-avg-time');

        this.victoryScore = document.getElementById('victory-score');
        this.victoryAccuracy = document.getElementById('victory-accuracy');
        this.victoryStreak = document.getElementById('victory-streak');

        // Difficulty Buttons
        this.diffButtons = document.querySelectorAll('.diff-btn');
        
        // Input state for keyboard & touch
        this.keys = {
            up: false,
            down: false,
            left: false,
            right: false
        };

        this.currentProblem = null;
        this.answerCallback = null;

        this.setupEventListeners();
    }

    setupEventListeners() {
        // Difficulty Selection
        this.diffButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.diffButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const diff = btn.getAttribute('data-diff');
                window.mathEngine.setDifficulty(diff);
            });
        });

        // Start Game Button
        document.getElementById('start-btn').addEventListener('click', () => {
            window.gameAudio.resume();
            this.hideAllScreens();
            if (window.gameEngine) {
                window.gameEngine.startGame();
            }
        });

        // Retry & Play Again Buttons
        document.getElementById('retry-btn').addEventListener('click', () => {
            this.hideAllScreens();
            if (window.gameEngine) {
                window.gameEngine.startGame();
            }
        });

        document.getElementById('victory-btn').addEventListener('click', () => {
            this.hideAllScreens();
            if (window.gameEngine) {
                window.gameEngine.startGame();
            }
        });

        // Sound Mute Button
        const muteBtn = document.getElementById('mute-btn');
        muteBtn.addEventListener('click', () => {
            const isMuted = window.gameAudio.toggleMute();
            muteBtn.textContent = isMuted ? '🔇' : '🔊';
        });

        // Keyboard Movement & Numeric Answers (WASD / Arrow Keys + 1,2,3,4)
        window.addEventListener('keydown', (e) => {
            // Movement keys
            if (e.code === 'KeyW' || e.code === 'ArrowUp') this.keys.up = true;
            if (e.code === 'KeyS' || e.code === 'ArrowDown') this.keys.down = true;
            if (e.code === 'KeyA' || e.code === 'ArrowLeft') this.keys.left = true;
            if (e.code === 'KeyD' || e.code === 'ArrowRight') this.keys.right = true;

            // Math hotkeys 1, 2, 3, 4
            if (['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Numpad1', 'Numpad2', 'Numpad3', 'Numpad4'].includes(e.code)) {
                let index = -1;
                if (e.code === 'Digit1' || e.code === 'Numpad1') index = 0;
                if (e.code === 'Digit2' || e.code === 'Numpad2') index = 1;
                if (e.code === 'Digit3' || e.code === 'Numpad3') index = 2;
                if (e.code === 'Digit4' || e.code === 'Numpad4') index = 3;

                const answerButtons = this.answersGrid.querySelectorAll('.answer-card');
                if (answerButtons[index]) {
                    answerButtons[index].click();
                }
            }
        });

        window.addEventListener('keyup', (e) => {
            if (e.code === 'KeyW' || e.code === 'ArrowUp') this.keys.up = false;
            if (e.code === 'KeyS' || e.code === 'ArrowDown') this.keys.down = false;
            if (e.code === 'KeyA' || e.code === 'ArrowLeft') this.keys.left = false;
            if (e.code === 'KeyD' || e.code === 'ArrowRight') this.keys.right = false;
        });

        // Mobile D-Pad touch handlers
        const dpadButtons = [
            { id: 'dpad-up', dir: 'up' },
            { id: 'dpad-down', dir: 'down' },
            { id: 'dpad-left', dir: 'left' },
            { id: 'dpad-right', dir: 'right' }
        ];

        dpadButtons.forEach(btn => {
            const el = document.getElementById(btn.id);
            if (el) {
                const startMove = (e) => {
                    e.preventDefault();
                    this.keys[btn.dir] = true;
                };
                const endMove = (e) => {
                    e.preventDefault();
                    this.keys[btn.dir] = false;
                };

                el.addEventListener('touchstart', startMove, { passive: false });
                el.addEventListener('touchend', endMove, { passive: false });
                el.addEventListener('mousedown', startMove);
                el.addEventListener('mouseup', endMove);
            }
        });
    }

    hideAllScreens() {
        this.menuScreen.classList.add('hidden');
        this.gameOverScreen.classList.add('hidden');
        this.victoryScreen.classList.add('hidden');
    }

    showMenu() {
        this.hideAllScreens();
        this.menuScreen.classList.remove('hidden');
    }

    showGameOver(stats) {
        this.hideAllScreens();
        this.finalScore.textContent = stats.score;
        this.finalAccuracy.textContent = `${stats.accuracy}%`;
        this.finalStreak.textContent = `${stats.highestStreak}x`;
        this.finalAvgTime.textContent = `${stats.avgTime}s`;
        this.gameOverScreen.classList.remove('hidden');
    }

    showVictory(stats) {
        this.hideAllScreens();
        this.victoryScore.textContent = stats.score;
        this.victoryAccuracy.textContent = `${stats.accuracy}%`;
        this.victoryStreak.textContent = `${stats.highestStreak}x`;
        this.victoryScreen.classList.remove('hidden');
    }

    updateHUD(player, wave, score, combo) {
        if (!player) return;

        // HP
        const hpPercent = Math.max(0, Math.min(100, (player.hp / player.maxHp) * 100));
        this.hpBar.style.width = `${hpPercent}%`;
        this.hpText.textContent = `${Math.ceil(player.hp)} / ${player.maxHp}`;

        // Mana
        const manaPercent = Math.max(0, Math.min(100, (player.mana / player.maxMana) * 100));
        this.manaBar.style.width = `${manaPercent}%`;
        this.manaText.textContent = `${Math.floor(player.mana)} / ${player.maxMana}`;

        // Wave & Score
        this.waveVal.textContent = wave;
        this.scoreVal.textContent = score;

        // Combo
        if (combo >= 2) {
            this.comboContainer.classList.add('active');
            this.comboVal.textContent = combo;
        } else {
            this.comboContainer.classList.remove('active');
        }
    }

    displayMathProblem(problem, onAnswerChosen) {
        this.currentProblem = problem;
        this.answerCallback = onAnswerChosen;

        const icons = {
            'arcane': '✨',
            'fire': '🔥',
            'lightning': '⚡'
        };
        this.spellIcon.textContent = icons[problem.spellType] || '✨';
        this.questionText.textContent = problem.question;

        // Render Answer cards
        this.answersGrid.innerHTML = '';
        problem.options.forEach((opt, idx) => {
            const btn = document.createElement('button');
            btn.className = 'answer-card';
            btn.innerHTML = `
                <span class="ans-text">${opt}</span>
                <span class="key-hint">[${idx + 1}]</span>
            `;

            btn.addEventListener('click', () => {
                if (!this.answerCallback) return;

                const result = window.mathEngine.verifyAnswer(opt);
                
                if (result.isCorrect) {
                    btn.classList.add('correct-flash');
                } else {
                    btn.classList.add('wrong-flash');
                }

                this.answerCallback(result);
            });

            this.answersGrid.appendChild(btn);
        });
    }
}

// Global instance
window.uiManager = new UIManager();
