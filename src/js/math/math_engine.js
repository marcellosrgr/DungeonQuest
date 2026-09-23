// math_engine.js - Adaptive Math Problem Generator with Fast Response Criticals
class MathEngine {
    constructor() {
        this.difficulty = 'basic'; // 'basic', 'multiplication', 'algebra'
        this.currentProblem = null;
        this.totalSolved = 0;
        this.totalWrong = 0;
        this.currentStreak = 0;
        this.highestStreak = 0;
        this.solveTimes = [];
        this.problemStartTime = 0;
    }

    setDifficulty(diff) {
        if (['basic', 'multiplication', 'algebra'].includes(diff)) {
            this.difficulty = diff;
        }
    }

    resetStats() {
        this.totalSolved = 0;
        this.totalWrong = 0;
        this.currentStreak = 0;
        this.highestStreak = 0;
        this.solveTimes = [];
        this.problemStartTime = Date.now();
    }

    getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    generateProblem(waveLevel = 1) {
        let questionText = "";
        let correctAnswer = 0;
        let spellType = 'arcane'; // 'arcane', 'fire', 'lightning'

        const waveBonus = Math.min(Math.floor(waveLevel / 2), 6);

        switch (this.difficulty) {
            case 'basic': {
                const isAddition = Math.random() > 0.45;
                if (isAddition) {
                    const a = this.getRandomInt(2 + waveBonus, 15 + waveBonus * 3);
                    const b = this.getRandomInt(2 + waveBonus, 15 + waveBonus * 3);
                    correctAnswer = a + b;
                    questionText = `${a} + ${b}`;
                    spellType = 'fire';
                } else {
                    const a = this.getRandomInt(10 + waveBonus * 2, 35 + waveBonus * 4);
                    const b = this.getRandomInt(2, a - 1);
                    correctAnswer = a - b;
                    questionText = `${a} - ${b}`;
                    spellType = 'arcane';
                }
                break;
            }

            case 'multiplication': {
                const isMult = Math.random() > 0.4;
                if (isMult) {
                    const a = this.getRandomInt(2, 9 + Math.min(waveBonus, 3));
                    const b = this.getRandomInt(2, 9 + Math.min(waveBonus, 3));
                    correctAnswer = a * b;
                    questionText = `${a} × ${b}`;
                    spellType = 'lightning';
                } else {
                    const b = this.getRandomInt(2, 9 + Math.min(waveBonus, 3));
                    const ans = this.getRandomInt(2, 10);
                    const a = b * ans;
                    correctAnswer = ans;
                    questionText = `${a} ÷ ${b}`;
                    spellType = 'fire';
                }
                break;
            }

            case 'algebra': {
                const mode = Math.random();
                if (mode < 0.5) {
                    const a = this.getRandomInt(2, 5);
                    const x = this.getRandomInt(2, 9 + Math.min(waveBonus, 3));
                    const c = this.getRandomInt(1, 10);
                    const b = (a * x) + c;
                    correctAnswer = x;
                    questionText = `${a}x + ${c} = ${b}  (x = ?)`;
                    spellType = 'lightning';
                } else {
                    const a = this.getRandomInt(2, 12);
                    const b = this.getRandomInt(2, 6);
                    const c = this.getRandomInt(2, 6);
                    correctAnswer = a + (b * c);
                    questionText = `${a} + (${b} × ${c})`;
                    spellType = 'fire';
                }
                break;
            }
        }

        const options = this.generateOptions(correctAnswer);

        this.currentProblem = {
            question: questionText,
            correctAnswer: correctAnswer,
            options: options,
            spellType: spellType,
            bonusDamage: 1 + Math.floor(this.currentStreak / 3) * 0.5
        };

        this.problemStartTime = Date.now();
        return this.currentProblem;
    }

    generateOptions(correctAnswer) {
        const options = new Set();
        options.add(correctAnswer);

        const offsets = [-3, -2, -1, 1, 2, 3, 4, 5, 10, -10];
        const shuffledOffsets = offsets.sort(() => Math.random() - 0.5);

        for (const offset of shuffledOffsets) {
            if (options.size >= 4) break;
            const candidate = correctAnswer + offset;
            if (candidate >= 0 && !options.has(candidate)) {
                options.add(candidate);
            }
        }

        let fallbackOffset = 1;
        while (options.size < 4) {
            const candidate = correctAnswer + fallbackOffset;
            if (!options.has(candidate)) {
                options.add(candidate);
            }
            fallbackOffset += 2;
        }

        return Array.from(options).sort(() => Math.random() - 0.5);
    }

    verifyAnswer(selectedAnswer) {
        if (!this.currentProblem) return { isCorrect: false, error: "No active problem" };

        const responseTime = (Date.now() - this.problemStartTime) / 1000;
        this.solveTimes.push(responseTime);

        const isCorrect = Number(selectedAnswer) === Number(this.currentProblem.correctAnswer);
        const isQuickCrit = isCorrect && responseTime <= 1.8; // Quick Reflex Critical Cast!

        if (isCorrect) {
            this.totalSolved++;
            this.currentStreak++;
            if (this.currentStreak > this.highestStreak) {
                this.highestStreak = this.currentStreak;
            }
        } else {
            this.totalWrong++;
            this.currentStreak = 0;
        }

        return {
            isCorrect: isCorrect,
            isCritical: isQuickCrit,
            correctAnswer: this.currentProblem.correctAnswer,
            spellType: this.currentProblem.spellType,
            bonusMultiplier: (1 + (this.currentStreak * 0.2)) * (isQuickCrit ? 1.75 : 1.0),
            streak: this.currentStreak,
            responseTime: responseTime
        };
    }

    getAccuracy() {
        const total = this.totalSolved + this.totalWrong;
        if (total === 0) return 100;
        return Math.round((this.totalSolved / total) * 100);
    }

    getAverageResponseTime() {
        if (this.solveTimes.length === 0) return 0;
        const sum = this.solveTimes.reduce((acc, val) => acc + val, 0);
        return (sum / this.solveTimes.length).toFixed(2);
    }
}

// Global instance
window.mathEngine = new MathEngine();
