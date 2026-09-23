// game_engine.js - Main 2D Canvas Roguelite & Combat Engine
class GameEngine {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.setupCanvas();

        // Game states
        this.isRunning = false;
        this.isPaused = false;
        this.score = 0;
        this.wave = 1;
        this.maxWaves = 10;
        this.waveTimer = 0;
        this.waveDuration = 30; // 30 seconds per wave
        this.enemiesDefeated = 0;

        // Screen Shake & Hit Flash
        this.shakeTime = 0;
        this.shakeMagnitude = 0;
        this.flashAlpha = 0;

        // Entities
        this.player = null;
        this.enemies = [];
        this.projectiles = [];
        this.particles = [];
        this.floatingTexts = [];
        this.gems = [];

        // Spawn timer
        this.spawnTimer = 0;

        // Last timestamp
        this.lastTime = 0;

        window.addEventListener('resize', () => this.setupCanvas());
    }

    setupCanvas() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
    }

    startGame() {
        this.isRunning = true;
        this.isPaused = false;
        this.score = 0;
        this.wave = 1;
        this.waveTimer = this.waveDuration;
        this.enemiesDefeated = 0;

        this.enemies = [];
        this.projectiles = [];
        this.particles = [];
        this.floatingTexts = [];
        this.gems = [];

        // Initialize Player
        this.player = {
            x: this.width / 2,
            y: this.height / 2,
            radius: 18,
            speed: 240, // px per sec
            hp: 100,
            maxHp: 100,
            mana: 100,
            maxMana: 100,
            color: '#c77dff',
            angle: 0,
            combo: 0
        };

        window.mathEngine.resetStats();
        window.gameAudio.startBGM();

        // Trigger first math problem
        this.nextMathQuestion();

        this.lastTime = performance.now();
        requestAnimationFrame((t) => this.gameLoop(t));
    }

    nextMathQuestion() {
        if (!this.isRunning) return;
        const problem = window.mathEngine.generateProblem(this.wave);
        window.uiManager.displayMathProblem(problem, (result) => this.handleMathAnswer(result));
    }

    handleMathAnswer(result) {
        if (!this.isRunning) return;

        if (result.isCorrect) {
            // SUCCESS ACTION: Cast devastating spell
            window.gameAudio.playCorrect();
            window.gameAudio.playCastSpell(result.spellType);
            this.player.combo = result.streak;

            // Mana restore & slight heal on high combo
            this.player.mana = Math.min(this.player.maxMana, this.player.mana + 15);
            if (this.player.combo % 3 === 0) {
                this.player.hp = Math.min(this.player.maxHp, this.player.hp + 5);
                this.addFloatingText(this.player.x, this.player.y - 25, "+5 HP HEAL!", "#06d6a0");
            }

            this.score += Math.round(100 * result.bonusMultiplier);

            // Trigger Spell Attack
            this.castSpellAttack(result.spellType, result.bonusMultiplier);

            this.addFloatingText(
                this.player.x, 
                this.player.y - 45, 
                `GREAT! COMBO x${result.streak}`, 
                '#ffd60a'
            );

            // Short delay before next problem
            setTimeout(() => this.nextMathQuestion(), 280);
        } else {
            // PENALTY ACTION: Wrong answer gives penalty
            window.gameAudio.playWrong();
            window.gameAudio.playPlayerHurt();
            this.player.combo = 0;

            // Damage player / reduce mana
            const penaltyDamage = 8 + this.wave;
            this.player.hp -= penaltyDamage;
            this.triggerScreenShake(8, 0.25);
            this.triggerFlash('#ef233c', 0.35);

            this.addFloatingText(
                this.player.x, 
                this.player.y - 30, 
                `WRONG! -${penaltyDamage} HP`, 
                '#ef233c'
            );

            if (this.player.hp <= 0) {
                this.handleGameOver();
                return;
            }

            // Spawn aggressive minion near player
            this.spawnEnemy(true);

            // Next problem after slight delay
            setTimeout(() => this.nextMathQuestion(), 500);
        }
    }

    castSpellAttack(spellType, multiplier) {
        // Find nearest enemies or target in circle
        const baseDamage = 35 * multiplier;

        if (spellType === 'fire') {
            // Explosive Fireball: fires toward nearest enemy or in 3-way spread
            const targets = this.getNearestEnemies(3);
            if (targets.length > 0) {
                targets.forEach(target => {
                    const angle = Math.atan2(target.y - this.player.y, target.x - this.player.x);
                    this.projectiles.push({
                        x: this.player.x,
                        y: this.player.y,
                        vx: Math.cos(angle) * 450,
                        vy: Math.sin(angle) * 450,
                        radius: 12,
                        type: 'fire',
                        damage: baseDamage * 1.3,
                        life: 2.0,
                        splashRadius: 70
                    });
                });
            } else {
                // Shoot forward 3 fireballs
                for (let i = -1; i <= 1; i++) {
                    const angle = this.player.angle + i * 0.3;
                    this.projectiles.push({
                        x: this.player.x,
                        y: this.player.y,
                        vx: Math.cos(angle) * 450,
                        vy: Math.sin(angle) * 450,
                        radius: 10,
                        type: 'fire',
                        damage: baseDamage * 1.2,
                        life: 1.8,
                        splashRadius: 60
                    });
                }
            }
        } else if (spellType === 'lightning') {
            // Lightning Chain: Instant AoE strikes on multiple random enemies
            const targets = this.getNearestEnemies(5);
            targets.forEach(t => {
                t.hp -= baseDamage * 1.4;
                window.gameAudio.playHit();
                this.createExplosion(t.x, t.y, '#ffd60a', 15);
                this.addFloatingText(t.x, t.y - 15, `${Math.round(baseDamage * 1.4)}!`, '#ffd60a');
                if (t.hp <= 0) this.killEnemy(t);
            });
            this.triggerScreenShake(6, 0.15);
        } else {
            // Arcane Nova: 8-way projectile ring
            const numProjectiles = 8;
            for (let i = 0; i < numProjectiles; i++) {
                const angle = (i / numProjectiles) * Math.PI * 2;
                this.projectiles.push({
                    x: this.player.x,
                    y: this.player.y,
                    vx: Math.cos(angle) * 400,
                    vy: Math.sin(angle) * 400,
                    radius: 8,
                    type: 'arcane',
                    damage: baseDamage,
                    life: 1.5,
                    splashRadius: 0
                });
            }
        }
    }

    getNearestEnemies(count = 1) {
        return [...this.enemies]
            .sort((a, b) => {
                const distA = Math.hypot(a.x - this.player.x, a.y - this.player.y);
                const distB = Math.hypot(b.x - this.player.x, b.y - this.player.y);
                return distA - distB;
            })
            .slice(0, count);
    }

    triggerScreenShake(magnitude, duration) {
        this.shakeMagnitude = magnitude;
        this.shakeTime = duration;
    }

    triggerFlash(color, alpha = 0.3) {
        this.flashColor = color;
        this.flashAlpha = alpha;
    }

    spawnEnemy(isAmbush = false) {
        const types = [
            { name: 'slime', hp: 30 + this.wave * 10, speed: 80, radius: 14, color: '#06d6a0', exp: 10 },
            { name: 'goblin', hp: 50 + this.wave * 15, speed: 120, radius: 16, color: '#f77f00', exp: 20 },
            { name: 'skeleton', hp: 75 + this.wave * 20, speed: 70, radius: 18, color: '#e0e1dd', exp: 35 },
            { name: 'shadow_beast', hp: 120 + this.wave * 30, speed: 95, radius: 22, color: '#7209b7', exp: 50 }
        ];

        // Select type based on wave
        const maxTypeIdx = Math.min(Math.floor((this.wave - 1) / 2), types.length - 1);
        const template = types[Math.floor(Math.random() * (maxTypeIdx + 1))];

        let x, y;
        if (isAmbush) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 160;
            x = this.player.x + Math.cos(angle) * dist;
            y = this.player.y + Math.sin(angle) * dist;
        } else {
            // Spawn outside the screen edges
            const edge = Math.floor(Math.random() * 4);
            const pad = 40;
            if (edge === 0) { x = Math.random() * this.width; y = -pad; }
            else if (edge === 1) { x = this.width + pad; y = Math.random() * this.height; }
            else if (edge === 2) { x = Math.random() * this.width; y = this.height + pad; }
            else { x = -pad; y = Math.random() * this.height; }
        }

        this.enemies.push({
            x, y,
            hp: template.hp,
            maxHp: template.hp,
            speed: template.speed,
            radius: template.radius,
            color: template.color,
            name: template.name,
            exp: template.exp,
            hitFlash: 0
        });
    }

    createExplosion(x, y, color, count = 20) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 180 + 30;
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                radius: Math.random() * 3 + 2,
                color: color,
                alpha: 1.0,
                decay: Math.random() * 1.5 + 1.0
            });
        }
    }

    addFloatingText(x, y, text, color = '#ffffff') {
        this.floatingTexts.push({
            x, y,
            text,
            color,
            alpha: 1.0,
            vy: -40,
            life: 1.2
        });
    }

    killEnemy(enemy) {
        const index = this.enemies.indexOf(enemy);
        if (index > -1) {
            this.enemies.splice(index, 1);
            this.enemiesDefeated++;
            this.score += enemy.exp * 2;
            window.gameAudio.playExplosion();
            this.createExplosion(enemy.x, enemy.y, enemy.color, 25);

            // Gem drop
            this.gems.push({
                x: enemy.x,
                y: enemy.y,
                radius: 5,
                color: '#4cc9f0',
                expVal: enemy.exp
            });
        }
    }

    handleGameOver() {
        this.isRunning = false;
        window.gameAudio.stopBGM();
        window.gameAudio.playPlayerHurt();

        const stats = {
            score: this.score,
            accuracy: window.mathEngine.getAccuracy(),
            highestStreak: window.mathEngine.highestStreak,
            avgTime: window.mathEngine.getAverageResponseTime()
        };
        window.uiManager.showGameOver(stats);
    }

    handleVictory() {
        this.isRunning = false;
        window.gameAudio.stopBGM();
        window.gameAudio.playLevelUp();

        const stats = {
            score: this.score,
            accuracy: window.mathEngine.getAccuracy(),
            highestStreak: window.mathEngine.highestStreak
        };
        window.uiManager.showVictory(stats);
    }

    // MAIN GAME LOOP
    gameLoop(currentTime) {
        if (!this.isRunning) return;

        const dt = Math.min((currentTime - this.lastTime) / 1000, 0.1);
        this.lastTime = currentTime;

        this.update(dt);
        this.render();

        requestAnimationFrame((t) => this.gameLoop(t));
    }

    update(dt) {
        // Wave Progression
        this.waveTimer -= dt;
        if (this.waveTimer <= 0) {
            if (this.wave >= this.maxWaves) {
                this.handleVictory();
                return;
            }
            this.wave++;
            this.waveTimer = this.waveDuration;
            window.gameAudio.playLevelUp();
            this.addFloatingText(this.player.x, this.player.y - 60, `WAVE ${this.wave} STARTED!`, '#ffd60a');
            this.triggerFlash('#c77dff', 0.4);
        }

        // Spawn Enemies
        this.spawnTimer += dt;
        const spawnInterval = Math.max(0.6, 2.5 - (this.wave * 0.2));
        if (this.spawnTimer >= spawnInterval && this.enemies.length < 35) {
            this.spawnEnemy();
            this.spawnTimer = 0;
        }

        // Move Player based on UI keys
        const keys = window.uiManager.keys;
        let moveX = 0;
        let moveY = 0;
        if (keys.up) moveY -= 1;
        if (keys.down) moveY += 1;
        if (keys.left) moveX -= 1;
        if (keys.right) moveX += 1;

        if (moveX !== 0 || moveY !== 0) {
            const len = Math.hypot(moveX, moveY);
            this.player.x += (moveX / len) * this.player.speed * dt;
            this.player.y += (moveY / len) * this.player.speed * dt;
            this.player.angle = Math.atan2(moveY, moveX);
        }

        // Keep player in bounds
        this.player.x = Math.max(this.player.radius, Math.min(this.width - this.player.radius, this.player.x));
        this.player.y = Math.max(this.player.radius, Math.min(this.height - this.player.radius, this.player.y));

        // Update Projectiles
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.life -= dt;

            // Check collision with enemies
            let hit = false;
            for (let j = this.enemies.length - 1; j >= 0; j--) {
                const enemy = this.enemies[j];
                const dist = Math.hypot(p.x - enemy.x, p.y - enemy.y);

                if (dist < p.radius + enemy.radius) {
                    hit = true;
                    if (p.splashRadius > 0) {
                        // AoE Fireball explosion
                        window.gameAudio.playExplosion();
                        this.createExplosion(p.x, p.y, '#ff5400', 25);
                        this.enemies.forEach(e => {
                            const splashDist = Math.hypot(p.x - e.x, p.y - e.y);
                            if (splashDist < p.splashRadius + e.radius) {
                                e.hp -= p.damage;
                                e.hitFlash = 0.15;
                                this.addFloatingText(e.x, e.y - 10, `${Math.round(p.damage)}`, '#ff5400');
                                if (e.hp <= 0) this.killEnemy(e);
                            }
                        });
                    } else {
                        // Direct hit
                        enemy.hp -= p.damage;
                        enemy.hitFlash = 0.15;
                        window.gameAudio.playHit();
                        this.createExplosion(p.x, p.y, '#c77dff', 8);
                        this.addFloatingText(enemy.x, enemy.y - 10, `${Math.round(p.damage)}`, '#c77dff');
                        if (enemy.hp <= 0) this.killEnemy(enemy);
                    }
                    break;
                }
            }

            if (hit || p.life <= 0) {
                this.projectiles.splice(i, 1);
            }
        }

        // Update Enemies
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const e = this.enemies[i];
            if (e.hitFlash > 0) e.hitFlash -= dt;

            const angle = Math.atan2(this.player.y - e.y, this.player.x - e.x);
            e.x += Math.cos(angle) * e.speed * dt;
            e.y += Math.sin(angle) * e.speed * dt;

            // Check collision with player
            const dist = Math.hypot(this.player.x - e.x, this.player.y - e.y);
            if (dist < this.player.radius + e.radius) {
                // Enemy deals damage to player
                this.player.hp -= (15 + this.wave * 2) * dt;
                this.triggerScreenShake(4, 0.1);
                window.gameAudio.playPlayerHurt();

                if (this.player.hp <= 0) {
                    this.handleGameOver();
                    return;
                }
            }
        }

        // Update Gems (Magnetize toward player)
        for (let i = this.gems.length - 1; i >= 0; i--) {
            const gem = this.gems[i];
            const dist = Math.hypot(this.player.x - gem.x, this.player.y - gem.y);

            if (dist < 150) {
                const angle = Math.atan2(this.player.y - gem.y, this.player.x - gem.x);
                gem.x += Math.cos(angle) * 320 * dt;
                gem.y += Math.sin(angle) * 320 * dt;
            }

            if (dist < this.player.radius + gem.radius) {
                this.player.mana = Math.min(this.player.maxMana, this.player.mana + 5);
                this.score += gem.expVal;
                this.gems.splice(i, 1);
            }
        }

        // Update Particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const pt = this.particles[i];
            pt.x += pt.vx * dt;
            pt.y += pt.vy * dt;
            pt.alpha -= pt.decay * dt;
            if (pt.alpha <= 0) this.particles.splice(i, 1);
        }

        // Update Floating Texts
        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            const ft = this.floatingTexts[i];
            ft.y += ft.vy * dt;
            ft.life -= dt;
            ft.alpha = Math.max(0, ft.life);
            if (ft.life <= 0) this.floatingTexts.splice(i, 1);
        }

        // Update Screen Shake & Flash
        if (this.shakeTime > 0) this.shakeTime -= dt;
        if (this.flashAlpha > 0) this.flashAlpha -= dt * 1.5;

        // Update HUD
        window.uiManager.updateHUD(this.player, this.wave, this.score, this.player.combo);
    }

    render() {
        this.ctx.save();

        // Clear Canvas
        this.ctx.fillStyle = '#0a0d18';
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Apply Screen Shake
        if (this.shakeTime > 0) {
            const ox = (Math.random() - 0.5) * this.shakeMagnitude * 2;
            const oy = (Math.random() - 0.5) * this.shakeMagnitude * 2;
            this.ctx.translate(ox, oy);
        }

        // Draw Dungeon Grid
        this.drawDungeonBackground();

        // Draw Gems
        this.gems.forEach(gem => {
            this.ctx.save();
            this.ctx.fillStyle = gem.color;
            this.ctx.shadowColor = gem.color;
            this.ctx.shadowBlur = 8;
            this.ctx.beginPath();
            this.ctx.arc(gem.x, gem.y, gem.radius, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        });

        // Draw Enemies
        this.enemies.forEach(e => {
            this.ctx.save();
            this.ctx.beginPath();
            this.ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = e.hitFlash > 0 ? '#ffffff' : e.color;
            this.ctx.shadowColor = e.color;
            this.ctx.shadowBlur = 10;
            this.ctx.fill();

            // Enemy health bar
            const hpRatio = Math.max(0, e.hp / e.maxHp);
            this.ctx.fillStyle = 'rgba(0,0,0,0.5)';
            this.ctx.fillRect(e.x - 16, e.y - e.radius - 10, 32, 4);
            this.ctx.fillStyle = '#ef233c';
            this.ctx.fillRect(e.x - 16, e.y - e.radius - 10, 32 * hpRatio, 4);
            this.ctx.restore();
        });

        // Draw Projectiles
        this.projectiles.forEach(p => {
            this.ctx.save();
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            let glow = '#c77dff';
            if (p.type === 'fire') glow = '#ff5400';
            if (p.type === 'lightning') glow = '#ffd60a';

            this.ctx.fillStyle = glow;
            this.ctx.shadowColor = glow;
            this.ctx.shadowBlur = 14;
            this.ctx.fill();
            this.ctx.restore();
        });

        // Draw Player (Arcane Mage)
        if (this.player) {
            this.ctx.save();
            this.ctx.translate(this.player.x, this.player.y);

            // Aura ring
            this.ctx.beginPath();
            this.ctx.arc(0, 0, this.player.radius + 6, 0, Math.PI * 2);
            this.ctx.strokeStyle = 'rgba(199, 125, 255, 0.4)';
            this.ctx.lineWidth = 3;
            this.ctx.stroke();

            // Mage Body
            this.ctx.beginPath();
            this.ctx.arc(0, 0, this.player.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = this.player.color;
            this.ctx.shadowColor = '#c77dff';
            this.ctx.shadowBlur = 15;
            this.ctx.fill();

            // Direction pointer / wand
            this.ctx.beginPath();
            this.ctx.moveTo(0, 0);
            this.ctx.lineTo(Math.cos(this.player.angle) * 26, Math.sin(this.player.angle) * 26);
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 4;
            this.ctx.stroke();

            this.ctx.restore();
        }

        // Draw Particles
        this.particles.forEach(pt => {
            this.ctx.save();
            this.ctx.globalAlpha = Math.max(0, pt.alpha);
            this.ctx.fillStyle = pt.color;
            this.ctx.shadowColor = pt.color;
            this.ctx.shadowBlur = 6;
            this.ctx.beginPath();
            this.ctx.arc(pt.x, pt.y, pt.radius, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        });

        // Draw Floating Texts
        this.floatingTexts.forEach(ft => {
            this.ctx.save();
            this.ctx.globalAlpha = Math.max(0, ft.alpha);
            this.ctx.fillStyle = ft.color;
            this.ctx.font = 'bold 15px Outfit, sans-serif';
            this.ctx.shadowColor = '#000000';
            this.ctx.shadowBlur = 4;
            this.ctx.textAlign = 'center';
            this.ctx.fillText(ft.text, ft.x, ft.y);
            this.ctx.restore();
        });

        this.ctx.restore(); // Restore shake matrix

        // Hit Flash Overlay
        if (this.flashAlpha > 0) {
            this.ctx.save();
            this.ctx.globalAlpha = Math.min(1, this.flashAlpha);
            this.ctx.fillStyle = this.flashColor || '#ffffff';
            this.ctx.fillRect(0, 0, this.width, this.height);
            this.ctx.restore();
        }
    }

    drawDungeonBackground() {
        const tileSize = 60;
        this.ctx.save();
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
        this.ctx.lineWidth = 1;

        for (let x = 0; x < this.width; x += tileSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.height);
            this.ctx.stroke();
        }

        for (let y = 0; y < this.height; y += tileSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.width, y);
            this.ctx.stroke();
        }
        this.ctx.restore();
    }
}

// Global instance
window.gameEngine = new GameEngine();
