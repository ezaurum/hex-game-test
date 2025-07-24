class SoundGenerator {
    constructor() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    createAttackSound() {
        const duration = 0.2;
        const sampleRate = this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, duration * sampleRate, sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < data.length; i++) {
            const t = i / sampleRate;
            const envelope = Math.exp(-t * 10);
            const frequency = 150 + Math.sin(t * 50) * 50;
            data[i] = Math.sin(2 * Math.PI * frequency * t) * envelope * 0.5;
            data[i] += Math.random() * 0.1 * envelope;
        }

        return buffer;
    }

    createHitSound() {
        const duration = 0.3;
        const sampleRate = this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, duration * sampleRate, sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < data.length; i++) {
            const t = i / sampleRate;
            const envelope = Math.exp(-t * 8);
            data[i] = (Math.random() - 0.5) * envelope * 0.8;
            if (t < 0.05) {
                data[i] += Math.sin(2 * Math.PI * 80 * t) * (1 - t / 0.05) * 0.5;
            }
        }

        return buffer;
    }

    createMoveSound() {
        const duration = 0.15;
        const sampleRate = this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, duration * sampleRate, sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < data.length; i++) {
            const t = i / sampleRate;
            const envelope = t < 0.05 ? t / 0.05 : Math.exp(-(t - 0.05) * 20);
            const frequency = 200 + Math.sin(t * 30) * 50;
            data[i] = Math.sin(2 * Math.PI * frequency * t) * envelope * 0.3;
        }

        return buffer;
    }
}

export { SoundGenerator };