import { demoBackground, frameStage, demoCaption } from "../../shared/presentation";
// =========================================================================
// File: examples/demos/features/dynamic_synth_demo.ts
// =========================================================================

import {
    Scene,
    Circle,
    Rect,
    Color,
    Rate,
    Camera2DController,
    AudioPlugin,
    createAnim,
    FadeOut
} from "retiam";

/**
 * Dynamic Audio Synthesis & Live Buffer Mutation Showcase.
 * Demonstrates:
 * 1. Allocating an AudioBuffer directly from raw amplitude numbers (Pattern 1).
 * 2. Continuously mutating the buffer's raw samples in real time while looping.
 * 3. Mixing harmonic frequencies (Pattern 2) to trigger melodic chord hits.
 * 4. Procedural waveform generation (Pattern 3).
 */
export default class DynamicSynthDemoScene extends Scene {
    public async run() {
        if (this.composer) {
            this.composer.ALWAYS_UPDATE = true;
        }

        this.camera.position.set([0, 0, 25]);
        new Camera2DController(this, this.camera);
        this.clearColor(demoBackground());
        frameStage(this, 34, 24);
        demoCaption(this, "Live sound synthesis", "A changing audio buffer drives the orb and waveform");

        // 1. INSTALL AUDIO PLUGIN
        this.use(new AudioPlugin({ masterVolume: 0.85 }));

        // -------------------------------------------------------------
        // PART 1: LIVE DYNAMIC BUFFER MODULATION (PATTERN 1)
        // -------------------------------------------------------------
        // Allocate a short 0.25-second buffer (12,000 samples at 48kHz)
        const ctx = this.audio.context;
        const sampleRate = ctx.sampleRate;
        const bufferDurationSec = 0.25;
        const bufferLength = Math.floor(sampleRate * bufferDurationSec);
        const liveSamples = new Float32Array(bufferLength);

        // Create the mutable AudioBuffer from raw samples
        const dynamicLoopBuffer = this.audio.createBuffer(liveSamples, sampleRate);
        const liveChannelData = dynamicLoopBuffer.getChannelData(0);

        // Start playing the loop on the BGM bus
        this.audio.timeline.addClip(dynamicLoopBuffer, 0, this.audio.bgmGain, {
            volume: 0.35,
            loop: true
        });

        // -------------------------------------------------------------
        // VISUALS: Oscilloscope & Central Frequency Orb
        // -------------------------------------------------------------
        // Central pulsating sound orb with rich, saturated colors
        const orb = new Circle(2.8);
        orb.paint.fill = new Color(0.12, 0.45, 0.95, 0.75);
        orb.paint.setStroke(0.15, new Color(0.05, 0.25, 0.8, 1.0));
        orb.transform.position.set([0, 2.5, 0]);
        this.add(orb);

        // Real-time Oscilloscope Waveform (32 bar columns)
        const waveBarCount = 32;
        const waveBars: Rect[] = [];
        const startX = -12;
        const spacing = 24 / waveBarCount;

        for (let i = 0; i < waveBarCount; i++) {
            const bar = new Rect(0.48, 0.15);
            bar.transform.position.set([startX + i * spacing, -5.5, 0]);
            // Rich gradient from royal blue to vivid magenta
            const tNorm = i / waveBarCount;
            bar.paint.fill = new Color(0.15 + tNorm * 0.7, 0.25, 0.9 - tNorm * 0.3, 0.95);
            this.add(bar);
            waveBars.push(bar);
        }

        // -------------------------------------------------------------
        // REAL-TIME SOUND MUTATION LOOP
        // -------------------------------------------------------------
        // In every animation frame, we continuously rewrite the raw buffer
        // numbers. The sound frequency and harmonics morph smoothly over time!
        let phase = 0;
        let baseFrequency = 220; // A3

        this.always((t: number) => {
            // Frequency modulates sinusoidally between 180Hz and 360Hz
            const timeSec = t * 0.001;
            const targetFreq = baseFrequency + Math.sin(timeSec * 2.0) * 100;
            const harmonicFactor = 0.3 * (1.0 + Math.cos(timeSec * 2.5));

            // Write raw amplitude values [-1.0, 1.0] directly into the AudioBuffer!
            const phaseIncrement = (2 * Math.PI * targetFreq) / sampleRate;
            for (let i = 0; i < bufferLength; i++) {
                // Fundamental + 2nd harmonic overtone
                const fundamental = Math.sin(phase);
                const secondHarmonic = Math.sin(phase * 2.0) * harmonicFactor;
                liveChannelData[i] = (fundamental * 0.7 + secondHarmonic) * 0.45;
                phase += phaseIncrement;
            }
            // Keep phase within [0, 2π) to prevent numerical float precision loss
            phase = phase % (2 * Math.PI);

            // Update on-screen oscilloscope bars from the raw samples
            const sampleStep = Math.floor(bufferLength / waveBarCount);
            for (let i = 0; i < waveBarCount; i++) {
                const sampleVal = liveChannelData[i * sampleStep] || 0;
                const barHeight = Math.max(0.18, Math.abs(sampleVal) * 5.5);
                waveBars[i].transform.setScale([1.0, barHeight, 1.0]);
                waveBars[i].transform.positionY = -5.5 + sampleVal * 1.6;
            }
        });

        // -------------------------------------------------------------
        // PART 2: ANIMATIONS WITH SYNTHESIZED CHORD HITS (PATTERN 2)
        // -------------------------------------------------------------
        await this.play(createAnim(orb), { duration: 1000, rate_func: Rate.easeOutBack() });
        await this.wait(400);

        // Synthesize an A-Major Chord hit: [A4 (440Hz), C#5 (554Hz), E5 (659Hz)]
        const aMajorChord = this.audio.createTone([
            { freq: 440.00, amp: 1.0 },
            { freq: 554.37, amp: 0.7 },
            { freq: 659.25, amp: 0.5 }
        ], 1.2, 2.5);

        // Play chord on SFX bus
        this.audio.timeline.addClip(aMajorChord, this.time, this.audio.sfxGain, { volume: 0.9 });
        await this.play(orb.animate.setScale([1.4, 1.4, 1.4]), { duration: 250 });
        await this.play(orb.animate.setScale([1.0, 1.0, 1.0]), { duration: 400 });

        await this.wait(500);

        // Synthesize a D-Major Chord hit: [D4 (293Hz), F#4 (370Hz), A4 (440Hz)]
        const dMajorChord = this.audio.createTone([
            { freq: 293.66, amp: 1.0 },
            { freq: 369.99, amp: 0.75 },
            { freq: 440.00, amp: 0.6 }
        ], 1.5, 2.0);

        // Shift base frequency of the continuous background buffer higher!
        baseFrequency = 293.66;

        this.audio.timeline.addClip(dMajorChord, this.time, this.audio.sfxGain, { volume: 0.95 });
        await this.play(orb.animate.setScale([1.5, 1.5, 1.5]), { duration: 300 });
        await this.play(orb.animate.setScale([1.0, 1.0, 1.0]), { duration: 500 });

        await this.wait(400);

        // -------------------------------------------------------------
        // PART 3: CONTINUOUS PULSE SHOWCASE
        // -------------------------------------------------------------
        // Keeps the visualizer alive and continuously pulsing with the audio!
        while (true) {
            await this.play(orb.animate.setScale([1.25, 1.25, 1.25]), { duration: 500, rate_func: Rate.easeOutQuad() });
            await this.play(orb.animate.setScale([1.0, 1.0, 1.0]), { duration: 500, rate_func: Rate.easeInQuad() });
        }
    }
}
