class SoundSystem {
    constructor() {
        this.audioContext = null;
        this.sounds = new Map();
        this.masterVolume = 0.5;
        this.initialized = false;
    }

    async init() {
        if (this.initialized) return;
        
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.createSounds();
            this.initialized = true;
        } catch (error) {
            console.error('Failed to initialize sound system:', error);
        }
    }

    createSounds() {
        // Attack sound - sharp hit
        this.sounds.set('attack', this.createAttackSound());
        
        // Hit sound - impact thud
        this.sounds.set('hit', this.createHitSound());
        
        // Move sound - footstep
        this.sounds.set('move', this.createMoveSound());
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
            data[i] += (Math.random() - 0.5) * 0.1 * envelope;
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

    play(soundName, volume = 1.0) {
        if (!this.initialized || !this.sounds.has(soundName)) {
            return;
        }

        const source = this.audioContext.createBufferSource();
        const gainNode = this.audioContext.createGain();
        
        source.buffer = this.sounds.get(soundName);
        source.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        gainNode.gain.value = volume * this.masterVolume;
        
        source.start(0);
    }

    setMasterVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
    }

    playAttack() {
        this.play('attack', 0.7);
    }

    playHit() {
        this.play('hit', 0.8);
    }

    playMove() {
        this.play('move', 0.5);
    }
}

const soundSystem = new SoundSystem();

export { soundSystem };