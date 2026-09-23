// audio.js - Web Audio API Sound Synthesizer (Zero External Assets)
class SoundSynthesizer {
    constructor() {
        this.ctx = null;
        this.isMuted = false;
        this.masterVolume = 0.3;
        this.musicGain = null;
        this.sfxGain = null;
        this.bgmOscs = [];
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
            this.musicGain.gain.setValueAtTime(0.25, this.ctx.currentTime);
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

    // Play Arcane Missile Spell (Laser/Whoosh tone)
    playCastSpell(type = 'arcane') {
        if (!this.ctx || this.isMuted) return;
        this.resume();

        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.sfxGain);

        if (type === 'fire') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(440, t);
            osc.frequency.exponentialRampToValueAtTime(80, t + 0.25);
            gain.gain.setValueAtTime(0.4, t);
            gain.gain.linearRampToValueAtTime(0.01, t + 0.25);
            osc.start(t);
            osc.stop(t + 0.25);
        } else if (type === 'lightning') {
            osc.type = 'square';
            osc.frequency.setValueAtTime(880, t);
            osc.frequency.setValueAtTime(1200, t + 0.05);
            osc.frequency.exponentialRampToValueAtTime(100, t + 0.2);
            gain.gain.setValueAtTime(0.3, t);
            gain.gain.linearRampToValueAtTime(0.01, t + 0.2);
            osc.start(t);
            osc.stop(t + 0.2);
        } else {
            // Default arcane
            osc.type = 'sine';
            osc.frequency.setValueAtTime(320, t);
            osc.frequency.exponentialRampToValueAtTime(880, t + 0.15);
            gain.gain.setValueAtTime(0.35, t);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.18);
            osc.start(t);
            osc.stop(t + 0.18);
        }
    }

    // Impact / Enemy Hit
    playHit() {
        if (!this.ctx || this.isMuted) return;
        this.resume();

        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(150, t);
        osc.frequency.exponentialRampToValueAtTime(40, t + 0.1);

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
        // White noise generator
        const bufferSize = this.ctx.sampleRate * 0.3;
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
        filter.frequency.exponentialRampToValueAtTime(50, t + 0.3);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.5, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);

        noise.start(t);
        noise.stop(t + 0.3);
    }

    // Correct Answer - Upward Magical Chime
    playCorrect() {
        if (!this.ctx || this.isMuted) return;
        this.resume();

        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        const t = this.ctx.currentTime;

        notes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const noteStart = t + idx * 0.04;

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, noteStart);

            gain.gain.setValueAtTime(0.25, noteStart);
            gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.2);

            osc.connect(gain);
            gain.connect(this.sfxGain);

            osc.start(noteStart);
            osc.stop(noteStart + 0.2);
        });
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

        osc2.frequency.setValueAtTime(133, t); // Dissonant beating
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

        const notes = [440, 554.37, 659.25, 880]; // A4, C#5, E5, A5
        const t = this.ctx.currentTime;

        notes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const noteStart = t + idx * 0.08;

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, noteStart);

            gain.gain.setValueAtTime(0.3, noteStart);
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

    // Procedural Synth Bassline / BGM Beat
    startBGM() {
        if (this.bgmTimer || !this.ctx) return;
        this.resume();

        const bassScale = [110, 110, 130.81, 146.83, 110, 98, 123.47, 110]; // A2 bassline
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
        }, 260); // ~115 BPM rhythm
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
