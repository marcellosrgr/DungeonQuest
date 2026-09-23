// audio.js - Web Audio API Sound Synthesizer (Enhanced for 3D Math Mage)
class SoundSynthesizer {
    constructor() {
        this.ctx = null;
        this.isMuted = false;
        this.masterVolume = 0.35;
        this.musicGain = null;
        this.sfxGain = null;
        this.bgmTimer = null;
        this.bgmStep = 0;
        this.initAudioContext();
    }

    initAudioContext() {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
            this.ctx = new AudioCtx();
            
            // Master Gain
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.setValueAtTime(this.masterVolume, this.ctx.currentTime);
            this.masterGain.connect(this.ctx.destination);

            // SFX & Music sub-busses
            this.sfxGain = this.ctx.createGain();
            this.sfxGain.gain.setValueAtTime(1.0, this.ctx.currentTime);
            this.sfxGain.connect(this.masterGain);

            this.musicGain = this.ctx.createGain();
            this.musicGain.gain.setValueAtTime(0.22, this.ctx.currentTime);
            this.musicGain.connect(this.masterGain);
        }
    }

    resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.masterGain) {
            this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.masterVolume, this.ctx.currentTime);
        }
        return this.isMuted;
    }

    // Play Arcane Missile / Spell Cast (Laser, Fireball, Lightning, Frost)
    playCastSpell(type = 'arcane', isCrit = false) {
        if (!this.ctx || this.isMuted) return;
        this.resume();

        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.sfxGain);

        if (type === 'fire') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(isCrit ? 580 : 440, t);
            osc.frequency.exponentialRampToValueAtTime(70, t + 0.35);
            gain.gain.setValueAtTime(isCrit ? 0.6 : 0.4, t);
            gain.gain.linearRampToValueAtTime(0.01, t + 0.35);
            osc.start(t);
            osc.stop(t + 0.35);
        } else if (type === 'lightning') {
            osc.type = 'square';
            osc.frequency.setValueAtTime(isCrit ? 1100 : 880, t);
            osc.frequency.setValueAtTime(1400, t + 0.05);
            osc.frequency.exponentialRampToValueAtTime(120, t + 0.25);
            gain.gain.setValueAtTime(isCrit ? 0.5 : 0.35, t);
            gain.gain.linearRampToValueAtTime(0.01, t + 0.25);
            osc.start(t);
            osc.stop(t + 0.25);
        } else {
            // Arcane Nova
            osc.type = 'sine';
            osc.frequency.setValueAtTime(isCrit ? 480 : 320, t);
            osc.frequency.exponentialRampToValueAtTime(1020, t + 0.2);
            gain.gain.setValueAtTime(0.4, t);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.22);
            osc.start(t);
            osc.stop(t + 0.22);
        }

        if (isCrit) {
            this.playCritFanfare();
        }
    }

    playCritFanfare() {
        if (!this.ctx || this.isMuted) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1046.5, t); // C6
        osc.frequency.setValueAtTime(1318.5, t + 0.08); // E6
        osc.frequency.setValueAtTime(1567.98, t + 0.16); // G6
        gain.gain.setValueAtTime(0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.3);
    }

    // Impact / Enemy Hit
    playHit() {
        if (!this.ctx || this.isMuted) return;
        this.resume();

        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(160, t);
        osc.frequency.exponentialRampToValueAtTime(35, t + 0.1);

        gain.gain.setValueAtTime(0.4, t);
        gain.gain.linearRampToValueAtTime(0.01, t + 0.1);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(t);
        osc.stop(t + 0.1);
    }

    // Explosion / Enemy Death
    playExplosion() {
        if (!this.ctx || this.isMuted) return;
        this.resume();

        const t = this.ctx.currentTime;
        const bufferSize = this.ctx.sampleRate * 0.35;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, t);
        filter.frequency.exponentialRampToValueAtTime(45, t + 0.35);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.55, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.35);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);

        noise.start(t);
        noise.stop(t + 0.35);
    }

    // Correct Answer - Magical Arpeggio
    playCorrect() {
        if (!this.ctx || this.isMuted) return;
        this.resume();

        const notes = [523.25, 659.25, 783.99, 1046.50];
        const t = this.ctx.currentTime;

        notes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const noteStart = t + idx * 0.04;

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, noteStart);

            gain.gain.setValueAtTime(0.25, noteStart);
            gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.22);

            osc.connect(gain);
            gain.connect(this.sfxGain);

            osc.start(noteStart);
            osc.stop(noteStart + 0.22);
        });
    }

    // Gem Pickup sound
    playGemPickup() {
        if (!this.ctx || this.isMuted) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, t);
        osc.frequency.exponentialRampToValueAtTime(1760, t + 0.08);

        gain.gain.setValueAtTime(0.2, t);
        gain.gain.linearRampToValueAtTime(0.01, t + 0.08);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(t);
        osc.stop(t + 0.08);
    }

    // Wrong Answer - Dissonant Downward Buzz
    playWrong() {
        if (!this.ctx || this.isMuted) return;
        this.resume();

        const t = this.ctx.currentTime;
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc1.type = 'sawtooth';
        osc2.type = 'sawtooth';

        osc1.frequency.setValueAtTime(140, t);
        osc1.frequency.linearRampToValueAtTime(80, t + 0.25);

        osc2.frequency.setValueAtTime(133, t);
        osc2.frequency.linearRampToValueAtTime(75, t + 0.25);

        gain.gain.setValueAtTime(0.4, t);
        gain.gain.linearRampToValueAtTime(0.01, t + 0.25);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.sfxGain);

        osc1.start(t);
        osc2.start(t);
        osc1.stop(t + 0.25);
        osc2.stop(t + 0.25);
    }

    // Level Up / Wave Clear Fanfare
    playLevelUp() {
        if (!this.ctx || this.isMuted) return;
        this.resume();

        const notes = [440, 554.37, 659.25, 880];
        const t = this.ctx.currentTime;

        notes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const noteStart = t + idx * 0.08;

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, noteStart);

            gain.gain.setValueAtTime(0.35, noteStart);
            gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.4);

            osc.connect(gain);
            gain.connect(this.sfxGain);

            osc.start(noteStart);
            osc.stop(noteStart + 0.4);
        });
    }

    // Player Hurt
    playPlayerHurt() {
        if (!this.ctx || this.isMuted) return;
        this.resume();

        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, t);
        osc.frequency.exponentialRampToValueAtTime(90, t + 0.15);

        gain.gain.setValueAtTime(0.4, t);
        gain.gain.linearRampToValueAtTime(0.01, t + 0.15);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(t);
        osc.stop(t + 0.15);
    }

    // Procedural Synth Dungeon Bassline
    startBGM() {
        if (this.bgmTimer || !this.ctx) return;
        this.resume();

        const bassScale = [110, 110, 130.81, 146.83, 110, 98, 123.47, 110];
        this.bgmStep = 0;

        this.bgmTimer = setInterval(() => {
            if (this.isMuted || !this.ctx) return;
            const t = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            const freq = bassScale[this.bgmStep % bassScale.length];
            this.bgmStep++;

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, t);

            gain.gain.setValueAtTime(0.18, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

            osc.connect(gain);
            gain.connect(this.musicGain);

            osc.start(t);
            osc.stop(t + 0.22);
        }, 250);
    }

    stopBGM() {
        if (this.bgmTimer) {
            clearInterval(this.bgmTimer);
            this.bgmTimer = null;
        }
    }
}

// Global instance
window.gameAudio = new SoundSynthesizer();
