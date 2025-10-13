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

        this.audioContextStarted = true;
    },
    canPlayAudio: function () {
        return this.audioContextStarted && !this.muted && !this.playedThisFrame;
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