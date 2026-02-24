import { perlin } from "./perlin.js";

const ac = {
    audioContextStarted: false,
    catchSynth: {},
    missSynth: {},
    playedThisFrame: false,
    startAudioContext: function () {
        if (this.audioContextStarted) return;

        Tone.start();

        this.catchSynth = new Tone.PolySynth().toDestination();
        this.catchSynth.set({
            oscillator: { type: "sine" },
            envelope: { attack: 0.01, decay: 0.1, sustain: 0, release: 0.02 }
        });

        this.missSynth = new Tone.PolySynth().toDestination();
        this.missSynth.set({
            oscillator: { type: "sine4" },
            envelope: { attack: 0.01, decay: 0.1, sustain: 0, release: 0.02 }
        });

        this.hurtSynth = new Tone.PolySynth().toDestination();
        this.hurtSynth.set({
            oscillator: { type: "sawtooth" }, // Sawtooth provides a rich, buzzy tone
            envelope: { attack: 0.05, decay: 0.3, sustain: 0, release: 0.05 }
        });

        this.coinSynth = new Tone.PolySynth().toDestination();
        this.coinSynth.set({
            oscillator: { type: "triangle" },
            envelope: { attack: 0.005, decay: 0.15, sustain: 0, release: 0.05 }
        });

        this.audioContextStarted = true;
    },
    canPlayAudio: function () {
        return this.audioContextStarted && !this.muted && !this.playedThisFrame;
    },
    playCoinSound: function (lastTime) {
        if (!this.canPlayAudio()) return;
        this.playedThisFrame = true;
        const freq = 100 + perlin.get(Math.sin(lastTime), Math.sin(lastTime)) + Math.sin(lastTime / 100) * 50;

        this.coinSynth.triggerAttackRelease("C6", "4n");
    },
    playHurtSound: function (lastTime) {
        if (!this.canPlayAudio()) return;
        this.playedThisFrame = true;
        const freq = 100 + perlin.get(Math.sin(lastTime), Math.sin(lastTime)) + Math.sin(lastTime / 100) * 50;

        this.hurtSynth.triggerAttackRelease("C2", "4n");
    },
    playCatchSound: function (lastTime) {

        if (!this.canPlayAudio()) return;
        this.playedThisFrame = true;
        const freq = 400 + perlin.get(Math.sin(lastTime), Math.sin(lastTime)) + Math.sin(lastTime / 100) * 50;

        this.catchSynth.triggerAttackRelease(freq, "8n");
    },
    playMissSound: function (lastTime) {

        if (!this.canPlayAudio()) return;

        const freq = 200;// + perlin.get(Math.sin(lastTime), Math.sin(lastTime)) + Math.sin(lastTime / 100) * 50;
        this.playedThisFrame = true;
        this.missSynth.triggerAttackRelease(freq / 3, "8n");
    }
}

export const audio = ac;