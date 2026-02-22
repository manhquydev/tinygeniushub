// src/lib/audio-utils.ts

class AudioSynthesizer {
    private ctx: AudioContext | null = null;
    private masterGain: GainNode | null = null;

    private init() {
        if (typeof window === "undefined") return;
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioCtx) {
                this.ctx = new AudioCtx();
                this.masterGain = this.ctx.createGain();
                this.masterGain.gain.value = 0.5; // Default master volume
                this.masterGain.connect(this.ctx.destination);
            }
        }

        // Resume context if suspended (browser autoplay policy)
        if (this.ctx && this.ctx.state === "suspended") {
            this.ctx.resume().catch(() => { });
        }
    }

    // A soft, low-frequency "pop" for tapping buttons or mascots
    playPop() {
        this.init();
        const masterGain = this.masterGain;
        if (!this.ctx || !masterGain) return;

        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        // Quick frequency drop to simulate a "boop" or "pop"
        osc.frequency.setValueAtTime(400, t);
        osc.frequency.exponentialRampToValueAtTime(100, t + 0.1);

        // Quick volume envelope
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.8, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);

        osc.connect(gain);
        gain.connect(masterGain);

        osc.start(t);
        osc.stop(t + 0.1);
    }

    // A bright, high-frequency "ting" for correct quiz answers
    playTing() {
        this.init();
        const masterGain = this.masterGain;
        if (!this.ctx || !masterGain) return;

        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(1200, t);

        // Very fast attack, long release
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.6, t + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.5);

        osc.connect(gain);
        gain.connect(masterGain);

        osc.start(t);
        osc.stop(t + 0.5);
    }

    // A triumphant major arpeggio for celebration screens
    playYay() {
        this.init();
        const masterGain = this.masterGain;
        const ctx = this.ctx;
        if (!ctx || !masterGain) return;

        const t = ctx.currentTime;

        // Major chord frequencies: C5, E5, G5, C6
        const freqs = [523.25, 659.25, 783.99, 1046.50];
        const stagger = 0.08; // Time between each note

        freqs.forEach((freq, index) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const noteTime = t + index * stagger;

            osc.type = index === freqs.length - 1 ? "triangle" : "sine";
            osc.frequency.setValueAtTime(freq, noteTime);

            gain.gain.setValueAtTime(0, noteTime);
            gain.gain.linearRampToValueAtTime(0.4, noteTime + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.01, noteTime + 0.6);

            osc.connect(gain);
            gain.connect(masterGain);

            osc.start(noteTime);
            osc.stop(noteTime + 0.6);
        });
    }
}

// Export a singleton instance
export const synth = new AudioSynthesizer();
