// game_engine.js - 3D Three.js WebGL Roguelite Engine
class GameEngine3D {
    constructor() {
        this.container = document.getElementById('game-container');
        this.canvas = document.getElementById('gameCanvas');

        // Scene, Camera, Renderer
        this.scene = null;
        this.camera = null;
        this.renderer = null;

        // Game state
        this.isRunning = false;
        this.isPaused = false;
        this.score = 0;
        this.wave = 1;
        this.maxWaves = 10;
        this.waveTimer = 30;
        this.waveDuration = 30;
        this.enemiesDefeated = 0;

        // Screen Shake & Time Slow mechanics
        this.shakeIntensity = 0;
        this.timeScale = 1.0;
        this.timeSlowTimer = 0;

        // 3D Entities
        this.player = null;
        this.enemies = [];
        this.projectiles = [];
        this.particles = [];
        this.gems = [];
        this.lights = [];

        // Raycasting for interactive targeting
        this.raycaster = new THREE.Raycaster();
        this.mousePos = new THREE.Vector2();
        this.plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        this.targetPoint = new THREE.Vector3(0, 0, 0);

        this.spawnTimer = 0;
        this.clock = new THREE.Clock();

        this.initThree();
        this.setupArena();
        this.setupEvents();
    }

    initThree() {
        // Scene setup
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x070913);
        this.scene.fog = new THREE.FogExp2(0x070913, 0.022);

        // Camera setup (Isometric 3D perspective)
        const aspect = window.innerWidth / window.innerHeight;
        this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
        this.camera.position.set(0, 32, 28);
        this.camera.lookAt(0, 0, 0);

        // WebGL Renderer
        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, powerPreference: "high-performance" });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // Ambient Lighting
        const ambientLight = new THREE.AmbientLight(0x382d5e, 1.2);
        this.scene.add(ambientLight);

        // Directional Sun/Moon Light
        const dirLight = new THREE.DirectionalLight(0x9d4edd, 1.5);
        dirLight.position.set(20, 40, 20);
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.width = 1024;
        dirLight.shadow.mapSize.height = 1024;
        dirLight.shadow.camera.near = 0.5;
        dirLight.shadow.camera.far = 100;
        dirLight.shadow.camera.left = -30;
        dirLight.shadow.camera.right = 30;
        dirLight.shadow.camera.top = 30;
        dirLight.shadow.camera.bottom = -30;
        this.scene.add(dirLight);

        // Central Arcane Torch PointLight
        this.torchLight = new THREE.PointLight(0xc77dff, 2, 45);
        this.torchLight.position.set(0, 8, 0);
        this.scene.add(this.torchLight);
    }

    setupArena() {
        const arenaSize = 70;

        // Ground Mesh with grid texture & specular glow
        const groundGeo = new THREE.PlaneGeometry(arenaSize, arenaSize, 32, 32);
        const groundMat = new THREE.MeshStandardMaterial({
            color: 0x121528,
            roughness: 0.7,
            metalness: 0.3,
            wireframe: false
        });
        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);

        // Grid Lines overlay for futuristic arcane dungeon feel
        const gridHelper = new THREE.GridHelper(arenaSize, 35, 0x9d4edd, 0x241740);
        gridHelper.position.y = 0.05;
        this.scene.add(gridHelper);

        // Arena Perimeter Boundary Walls
        const wallMat = new THREE.MeshStandardMaterial({ color: 0x1f1a3a, roughness: 0.5, metalness: 0.5 });
        const wallThickness = 2;
        const wallHeight = 4;

        const walls = [
            { w: arenaSize + 4, h: wallHeight, d: wallThickness, x: 0, z: -arenaSize / 2 },
            { w: arenaSize + 4, h: wallHeight, d: wallThickness, x: 0, z: arenaSize / 2 },
            { w: wallThickness, h: wallHeight, d: arenaSize + 4, x: -arenaSize / 2, z: 0 },
            { w: wallThickness, h: wallHeight, d: arenaSize + 4, x: arenaSize / 2, z: 0 }
        ];

        walls.forEach(wDef => {
            const wallGeo = new THREE.BoxGeometry(wDef.w, wDef.h, wDef.d);
            const wallMesh = new THREE.Mesh(wallGeo, wallMat);
            wallMesh.position.set(wDef.x, wallHeight / 2, wDef.z);
            wallMesh.castShadow = true;
            wallMesh.receiveShadow = true;
            this.scene.add(wallMesh);
        });

        // 4 Arcane Glowing Pillars at corners
        const pillarGeo = new THREE.CylinderGeometry(1.2, 1.6, 7, 8);
        const pillarMat = new THREE.MeshStandardMaterial({ color: 0x3c2a68, roughness: 0.4 });
        const gemGeo = new THREE.OctahedronGeometry(0.9);
        const gemMat = new THREE.MeshBasicMaterial({ color: 0x00f5d4 });

        const pillarPositions = [
            [-22, -22], [22, -22], [-22, 22], [22, 22]
        ];

        pillarPositions.forEach(pos => {
            const pGroup = new THREE.Group();
            const pillar = new THREE.Mesh(pillarGeo, pillarMat);
            pillar.position.y = 3.5;
            pillar.castShadow = true;
            pGroup.add(pillar);

            const gem = new THREE.Mesh(gemGeo, gemMat);
            gem.position.y = 7.8;
            pGroup.add(gem);

            const pLight = new THREE.PointLight(0x00f5d4, 1.5, 20);
            pLight.position.y = 8;
            pGroup.add(pLight);

            pGroup.position.set(pos[0], 0, pos[1]);
            this.scene.add(pGroup);
        });
    }

    setupEvents() {
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });

        // Mouse tracking for 3D spell directional targeting
        window.addEventListener('mousemove', (e) => {
            this.mousePos.x = (e.clientX / window.innerWidth) * 2 - 1;
            this.mousePos.y = -(e.clientY / window.innerHeight) * 2 + 1;

            this.raycaster.setFromCamera(this.mousePos, this.camera);
            const intersectPoint = new THREE.Vector3();
            if (this.raycaster.ray.intersectPlane(this.plane, intersectPoint)) {
                this.targetPoint.copy(intersectPoint);
            }
        });
    }

    createPlayer() {
        const playerGroup = new THREE.Group();

        // Mage Robe Body (Cone)
        const robeGeo = new THREE.ConeGeometry(0.9, 2.2, 8);
        const robeMat = new THREE.MeshStandardMaterial({ color: 0x7b2cbf, roughness: 0.3, metalness: 0.2 });
        const robe = new THREE.Mesh(robeGeo, robeMat);
        robe.position.y = 1.1;
        robe.castShadow = true;
        playerGroup.add(robe);

        // Mage Head & Hat
        const headGeo = new THREE.SphereGeometry(0.45, 12, 12);
        const headMat = new THREE.MeshStandardMaterial({ color: 0xffd166 });
        const head = new THREE.Mesh(headGeo, headMat);
        head.position.y = 2.4;
        playerGroup.add(head);

        const hatGeo = new THREE.ConeGeometry(0.7, 1.2, 8);
        const hatMat = new THREE.MeshStandardMaterial({ color: 0x3c096c });
        const hat = new THREE.Mesh(hatGeo, hatMat);
        hat.position.y = 3.1;
        hat.rotation.x = -0.15;
        playerGroup.add(hat);

        // Arcane Staff with glowing crystal orb
        const staffGeo = new THREE.CylinderGeometry(0.06, 0.06, 2.8, 6);
        const staffMat = new THREE.MeshStandardMaterial({ color: 0x4a3b32 });
        const staff = new THREE.Mesh(staffGeo, staffMat);
        staff.position.set(0.9, 1.4, 0.3);
        playerGroup.add(staff);

        const orbGeo = new THREE.SphereGeometry(0.28, 12, 12);
        const orbMat = new THREE.MeshBasicMaterial({ color: 0xc77dff });
        const orb = new THREE.Mesh(orbGeo, orbMat);
        orb.position.set(0.9, 2.8, 0.3);
        playerGroup.add(orb);

        // Player PointLight (Illuminates immediate surroundings)
        const playerLight = new THREE.PointLight(0xc77dff, 2.5, 16);
        playerLight.position.set(0, 2.5, 0);
        playerGroup.add(playerLight);

        // Orbiting Mana Rings
        const ringGeo = new THREE.TorusGeometry(1.6, 0.05, 8, 24);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0x00b4d8, transparent: true, opacity: 0.6 });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2;
        ring.position.y = 1.0;
        playerGroup.add(ring);

        this.scene.add(playerGroup);

        return {
            mesh: playerGroup,
            ring: ring,
            hp: 100,
            maxHp: 100,
            mana: 100,
            maxMana: 100,
            speed: 15,
            combo: 0,
            radius: 1.1
        };
    }

    startGame() {
        // Cleanup existing entities
        if (this.player) {
            this.scene.remove(this.player.mesh);
        }
        this.enemies.forEach(e => this.scene.remove(e.mesh));
        this.projectiles.forEach(p => this.scene.remove(p.mesh));
        this.particles.forEach(pt => this.scene.remove(pt.mesh));
        this.gems.forEach(g => this.scene.remove(g.mesh));

        this.enemies = [];
        this.projectiles = [];
        this.particles = [];
        this.gems = [];

        this.score = 0;
        this.wave = 1;
        this.waveTimer = this.waveDuration;
        this.enemiesDefeated = 0;
        this.timeScale = 1.0;
        this.timeSlowTimer = 0;

        this.player = this.createPlayer();
        this.player.mesh.position.set(0, 0, 0);

        this.isRunning = true;
        this.isPaused = false;

        window.mathEngine.resetStats();
        window.gameAudio.startBGM();

        this.nextMathQuestion();
        this.clock.start();

        requestAnimationFrame(() => this.animate());
    }

    nextMathQuestion() {
        if (!this.isRunning) return;
        const problem = window.mathEngine.generateProblem(this.wave);
        window.uiManager.displayMathProblem(problem, (result) => this.handleMathAnswer(result));
    }

    handleMathAnswer(result) {
        if (!this.isRunning) return;

        if (result.isCorrect) {
            // SUCCESS: Spell Attack
            window.gameAudio.playCorrect();
            window.gameAudio.playCastSpell(result.spellType, result.isCritical);
            this.player.combo = result.streak;

            // Trigger Time Dilation on Quick Critical!
            if (result.isCritical) {
                this.timeScale = 0.25;
                this.timeSlowTimer = 0.35; // Slow-mo for 0.35s
                this.addFloating3DText(this.player.mesh.position, "⚡ CRITICAL CAST! ⚡", 0xffd60a, 2.0);
            }

            // Restore Mana & HP on streak
            this.player.mana = Math.min(this.player.maxMana, this.player.mana + 15);
            if (this.player.combo % 3 === 0) {
                this.player.hp = Math.min(this.player.maxHp, this.player.hp + 6);
                this.addFloating3DText(this.player.mesh.position, "+6 HP HEAL", 0x06d6a0);
            }

            this.score += Math.round(120 * result.bonusMultiplier);
            this.cast3DSpell(result.spellType, result.bonusMultiplier, result.isCritical);

            setTimeout(() => this.nextMathQuestion(), 260);
        } else {
            // PENALTY: Shock damage
            window.gameAudio.playWrong();
            window.gameAudio.playPlayerHurt();
            this.player.combo = 0;

            const penaltyDamage = 8 + this.wave * 1.5;
            this.player.hp -= penaltyDamage;
            this.shakeIntensity = 1.2;

            this.addFloating3DText(this.player.mesh.position, `WRONG! -${Math.round(penaltyDamage)} HP`, 0xef233c);

            if (this.player.hp <= 0) {
                this.handleGameOver();
                return;
            }

            // Ambush spawn mob near player
            this.spawnEnemy(true);
            setTimeout(() => this.nextMathQuestion(), 500);
        }
    }

    cast3DSpell(spellType, multiplier, isCrit = false) {
        const baseDamage = (35 + this.wave * 5) * multiplier;
        const playerPos = this.player.mesh.position.clone();
        playerPos.y = 1.8;

        if (spellType === 'fire') {
            // 3D Fireball Missile
            const targets = this.getNearestEnemies(isCrit ? 4 : 2);
            const shootDir = new THREE.Vector3().subVectors(this.targetPoint, playerPos).normalize();
            shootDir.y = 0;

            if (targets.length > 0) {
                targets.forEach(t => {
                    const dir = new THREE.Vector3().subVectors(t.mesh.position, playerPos).normalize();
                    this.createFireball(playerPos, dir, baseDamage * 1.4, isCrit);
                });
            } else {
                this.createFireball(playerPos, shootDir.length() > 0 ? shootDir : new THREE.Vector3(0, 0, -1), baseDamage * 1.3, isCrit);
            }
        } else if (spellType === 'lightning') {
            // 3D Chain Lightning strike on 5 enemies
            const targets = this.getNearestEnemies(isCrit ? 8 : 5);
            targets.forEach(t => {
                t.hp -= baseDamage * 1.5;
                window.gameAudio.playHit();
                this.create3DExplosion(t.mesh.position, 0xffd60a, 20);
                this.addFloating3DText(t.mesh.position, `${Math.round(baseDamage * 1.5)}!`, 0xffd60a);
                if (t.hp <= 0) this.killEnemy(t);
            });
            this.shakeIntensity = 0.8;
        } else {
            // Arcane Nova: 8-way 3D energy orbs
            const numProjectiles = isCrit ? 12 : 8;
            for (let i = 0; i < numProjectiles; i++) {
                const angle = (i / numProjectiles) * Math.PI * 2;
                const dir = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));
                this.createArcaneMissile(playerPos, dir, baseDamage);
            }
        }
    }

    createFireball(startPos, direction, damage, isCrit = false) {
        const geo = new THREE.SphereGeometry(isCrit ? 0.7 : 0.45, 12, 12);
        const mat = new THREE.MeshBasicMaterial({ color: 0xff5400 });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.copy(startPos);

        const light = new THREE.PointLight(0xff5400, 3, 10);
        mesh.add(light);
        this.scene.add(mesh);

        this.projectiles.push({
            mesh: mesh,
            dir: direction,
            speed: 28,
            damage: damage,
            life: 2.2,
            type: 'fire',
            radius: 0.6,
            splashRadius: isCrit ? 6.5 : 4.5
        });
    }

    createArcaneMissile(startPos, direction, damage) {
        const geo = new THREE.SphereGeometry(0.35, 10, 10);
        const mat = new THREE.MeshBasicMaterial({ color: 0xc77dff });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.copy(startPos);

        const light = new THREE.PointLight(0xc77dff, 2, 8);
        mesh.add(light);
        this.scene.add(mesh);

        this.projectiles.push({
            mesh: mesh,
            dir: direction,
            speed: 25,
            damage: damage,
            life: 1.8,
            type: 'arcane',
            radius: 0.4,
            splashRadius: 0
        });
    }

    getNearestEnemies(count = 1) {
        if (!this.player) return [];
        return [...this.enemies]
            .sort((a, b) => {
                const distA = a.mesh.position.distanceTo(this.player.mesh.position);
                const distB = b.mesh.position.distanceTo(this.player.mesh.position);
                return distA - distB;
            })
            .slice(0, count);
    }

    spawnEnemy(isAmbush = false) {
        const arenaRadius = 32;
        let x, z;

        if (isAmbush) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 9 + Math.random() * 4;
            x = this.player.mesh.position.x + Math.cos(angle) * dist;
            z = this.player.mesh.position.z + Math.sin(angle) * dist;
        } else {
            const angle = Math.random() * Math.PI * 2;
            x = Math.cos(angle) * arenaRadius;
            z = Math.sin(angle) * arenaRadius;
        }

        const mobTypes = [
            { name: 'slime', hp: 35 + this.wave * 12, speed: 5.5, radius: 0.9, color: 0x06d6a0, geo: new THREE.SphereGeometry(0.9, 10, 10) },
            { name: 'goblin', hp: 60 + this.wave * 18, speed: 8.0, radius: 0.8, color: 0xf77f00, geo: new THREE.CylinderGeometry(0.5, 0.7, 1.6, 8) },
            { name: 'skeleton', hp: 90 + this.wave * 25, speed: 4.8, radius: 1.0, color: 0xe0e1dd, geo: new THREE.BoxGeometry(1.0, 2.0, 0.8) },
            { name: 'shadow_golem', hp: 150 + this.wave * 40, speed: 6.2, radius: 1.5, color: 0x7209b7, geo: new THREE.DodecahedronGeometry(1.4) }
        ];

        const maxIdx = Math.min(Math.floor((this.wave - 1) / 2), mobTypes.length - 1);
        const template = mobTypes[Math.floor(Math.random() * (maxIdx + 1))];

        const mat = new THREE.MeshStandardMaterial({ color: template.color, roughness: 0.4, metalness: 0.2 });
        const mesh = new THREE.Mesh(template.geo, mat);
        mesh.position.set(x, template.radius, z);
        mesh.castShadow = true;
        this.scene.add(mesh);

        this.enemies.push({
            mesh: mesh,
            hp: template.hp,
            maxHp: template.hp,
            speed: template.speed,
            radius: template.radius,
            color: template.color,
            name: template.name,
            exp: 15 * this.wave,
            hitTimer: 0
        });
    }

    create3DExplosion(pos, colorHex, count = 16) {
        for (let i = 0; i < count; i++) {
            const geo = new THREE.SphereGeometry(0.12 + Math.random() * 0.12, 6, 6);
            const mat = new THREE.MeshBasicMaterial({ color: colorHex });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.copy(pos);
            this.scene.add(mesh);

            const velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 14,
                Math.random() * 12 + 2,
                (Math.random() - 0.5) * 14
            );

            this.particles.push({
                mesh: mesh,
                vel: velocity,
                alpha: 1.0,
                life: 0.8 + Math.random() * 0.4
            });
        }
    }

    spawn3DGem(pos, expVal) {
        const geo = new THREE.OctahedronGeometry(0.4);
        const mat = new THREE.MeshBasicMaterial({ color: 0x4cc9f0 });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(pos.x, 0.6, pos.z);
        this.scene.add(mesh);

        this.gems.push({
            mesh: mesh,
            expVal: expVal
        });
    }

    addFloating3DText(pos, text, colorHex = 0xffffff, scale = 1.0) {
        // Dynamic HTML floating badge pinned to 3D coords
        const screenPos = pos.clone();
        screenPos.y += 2.8;
        screenPos.project(this.camera);

        const x = (screenPos.x * 0.5 + 0.5) * window.innerWidth;
        const y = (-(screenPos.y * 0.5) + 0.5) * window.innerHeight;

        const badge = document.createElement('div');
        badge.className = 'floating-3d-text';
        badge.textContent = text;
        badge.style.color = `#${colorHex.toString(16).padStart(6, '0')}`;
        badge.style.left = `${x}px`;
        badge.style.top = `${y}px`;
        badge.style.transform = `translate(-50%, -50%) scale(${scale})`;
        this.container.appendChild(badge);

        setTimeout(() => {
            if (badge.parentNode) badge.parentNode.removeChild(badge);
        }, 1100);
    }

    killEnemy(enemy) {
        const idx = this.enemies.indexOf(enemy);
        if (idx > -1) {
            this.enemies.splice(idx, 1);
            this.enemiesDefeated++;
            this.score += enemy.exp;
            window.gameAudio.playExplosion();
            this.create3DExplosion(enemy.mesh.position, enemy.color, 25);
            this.spawn3DGem(enemy.mesh.position, enemy.exp);
            this.scene.remove(enemy.mesh);
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

    // MAIN 3D ANIMATION LOOP
    animate() {
        if (!this.isRunning) return;

        const rawDelta = this.clock.getDelta();
        const dt = Math.min(rawDelta, 0.1) * this.timeScale;

        // Time Slow Recovery
        if (this.timeSlowTimer > 0) {
            this.timeSlowTimer -= rawDelta;
            if (this.timeSlowTimer <= 0) {
                this.timeScale = 1.0;
            }
        }

        this.update3D(dt);
        this.renderer.render(this.scene, this.camera);

        requestAnimationFrame(() => this.animate());
    }

    update3D(dt) {
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
            this.addFloating3DText(this.player.mesh.position, `WAVE ${this.wave} STARTED!`, 0xffd60a, 1.8);
            this.shakeIntensity = 1.0;
        }

        // Spawn Enemies
        this.spawnTimer += dt;
        const spawnInterval = Math.max(0.5, 2.2 - (this.wave * 0.18));
        if (this.spawnTimer >= spawnInterval && this.enemies.length < 35) {
            this.spawnEnemy();
            this.spawnTimer = 0;
        }

        // Move Player (WASD / Keyboard / Touch)
        const keys = window.uiManager.keys;
        const moveVec = new THREE.Vector3(0, 0, 0);
        if (keys.up) moveVec.z -= 1;
        if (keys.down) moveVec.z += 1;
        if (keys.left) moveVec.x -= 1;
        if (keys.right) moveVec.x += 1;

        if (moveVec.lengthSq() > 0) {
            moveVec.normalize();
            this.player.mesh.position.addScaledVector(moveVec, this.player.speed * dt);

            // Rotate Player mesh towards movement or cursor target
            const angle = Math.atan2(moveVec.x, moveVec.z);
            this.player.mesh.rotation.y = angle;
        }

        // Keep player in bounds (-33 to +33)
        const bound = 33;
        this.player.mesh.position.x = Math.max(-bound, Math.min(bound, this.player.mesh.position.x));
        this.player.mesh.position.z = Math.max(-bound, Math.min(bound, this.player.mesh.position.z));

        // Rotate Orbiting Mana Ring
        if (this.player.ring) {
            this.player.ring.rotation.z += dt * 3;
        }

        // Dynamic Camera Lerp Follow with Screen Shake
        const targetCamX = this.player.mesh.position.x * 0.6;
        const targetCamZ = this.player.mesh.position.z * 0.6 + 28;

        let shakeOffset = new THREE.Vector3(0, 0, 0);
        if (this.shakeIntensity > 0) {
            shakeOffset.set(
                (Math.random() - 0.5) * this.shakeIntensity,
                (Math.random() - 0.5) * this.shakeIntensity * 0.5,
                (Math.random() - 0.5) * this.shakeIntensity
            );
            this.shakeIntensity = Math.max(0, this.shakeIntensity - dt * 2.5);
        }

        this.camera.position.x += (targetCamX - this.camera.position.x) * 0.1 + shakeOffset.x;
        this.camera.position.z += (targetCamZ - this.camera.position.z) * 0.1 + shakeOffset.z;
        this.camera.lookAt(this.player.mesh.position.x * 0.7, 1, this.player.mesh.position.z * 0.7);

        // Update Projectiles
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];
            p.mesh.position.addScaledVector(p.dir, p.speed * dt);
            p.life -= dt;

            let hit = false;
            for (let j = this.enemies.length - 1; j >= 0; j--) {
                const enemy = this.enemies[j];
                const dist = p.mesh.position.distanceTo(enemy.mesh.position);

                if (dist < p.radius + enemy.radius) {
                    hit = true;
                    if (p.splashRadius > 0) {
                        // AoE Blast
                        window.gameAudio.playExplosion();
                        this.create3DExplosion(p.mesh.position, 0xff5400, 25);
                        this.enemies.forEach(e => {
                            const d = p.mesh.position.distanceTo(e.mesh.position);
                            if (d < p.splashRadius + e.radius) {
                                e.hp -= p.damage;
                                this.addFloating3DText(e.mesh.position, `${Math.round(p.damage)}`, 0xff5400);
                                if (e.hp <= 0) this.killEnemy(e);
                            }
                        });
                    } else {
                        // Direct Hit
                        enemy.hp -= p.damage;
                        window.gameAudio.playHit();
                        this.create3DExplosion(p.mesh.position, 0xc77dff, 10);
                        this.addFloating3DText(enemy.mesh.position, `${Math.round(p.damage)}`, 0xc77dff);
                        if (enemy.hp <= 0) this.killEnemy(enemy);
                    }
                    break;
                }
            }

            if (hit || p.life <= 0) {
                this.scene.remove(p.mesh);
                this.projectiles.splice(i, 1);
            }
        }

        // Update Enemies AI (Swarm to player)
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            const toPlayer = new THREE.Vector3().subVectors(this.player.mesh.position, enemy.mesh.position);
            toPlayer.y = 0;
            const dist = toPlayer.length();

            if (dist > 0.1) {
                toPlayer.normalize();
                enemy.mesh.position.addScaledVector(toPlayer, enemy.speed * dt);
                enemy.mesh.lookAt(this.player.mesh.position.x, enemy.mesh.position.y, this.player.mesh.position.z);
            }

            // Slime squash and stretch animation
            if (enemy.name === 'slime') {
                enemy.mesh.position.y = enemy.radius + Math.abs(Math.sin(this.clock.elapsedTime * 8)) * 0.4;
            }

            // Damage Player on contact
            if (dist < this.player.radius + enemy.radius) {
                this.player.hp -= (16 + this.wave * 2) * dt;
                this.shakeIntensity = 0.5;
                window.gameAudio.playPlayerHurt();

                if (this.player.hp <= 0) {
                    this.handleGameOver();
                    return;
                }
            }
        }

        // Update Gems (Floating & Magnet)
        for (let i = this.gems.length - 1; i >= 0; i--) {
            const gem = this.gems[i];
            gem.mesh.rotation.y += dt * 3;
            gem.mesh.position.y = 0.6 + Math.sin(this.clock.elapsedTime * 6) * 0.2;

            const dist = gem.mesh.position.distanceTo(this.player.mesh.position);
            if (dist < 10) {
                const pullDir = new THREE.Vector3().subVectors(this.player.mesh.position, gem.mesh.position).normalize();
                gem.mesh.position.addScaledVector(pullDir, 20 * dt);
            }

            if (dist < this.player.radius + 0.5) {
                this.player.mana = Math.min(this.player.maxMana, this.player.mana + 6);
                this.score += gem.expVal;
                window.gameAudio.playGemPickup();
                this.scene.remove(gem.mesh);
                this.gems.splice(i, 1);
            }
        }

        // Update Particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const pt = this.particles[i];
            pt.mesh.position.addScaledVector(pt.vel, dt);
            pt.vel.y -= 9.8 * dt; // Gravity
            pt.life -= dt;

            if (pt.mesh.position.y < 0) {
                pt.mesh.position.y = 0;
                pt.vel.y *= -0.4; // Bounce
            }

            if (pt.life <= 0) {
                this.scene.remove(pt.mesh);
                this.particles.splice(i, 1);
            }
        }

        // Sync UI HUD
        window.uiManager.updateHUD(this.player, this.wave, this.score, this.player.combo);
    }
}

// Global instance
window.gameEngine = new GameEngine3D();
