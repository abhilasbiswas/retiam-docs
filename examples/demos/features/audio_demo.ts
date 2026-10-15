import { frameStage, demoCaption } from "../../shared/presentation";
// =========================================================================
// File: examples/demos/features/audio_demo.ts
// =========================================================================

import {
    Scene,
    Circle,
    Rect,
    Create,
    FadeOut,
    Color,
    Rate,
    OrbitCameraController,
    AudioPlugin,
    AudioListenerComponent,
    SpatialAudioComponent,
    createAnim,
    Camera2DController
} from "retiam";

/**
 * Creates a simple synthetic AudioBuffer (beeps/chords) for instant playback
 * without requiring external network audio files.
 */
function createSyntheticAudio(
    ctx: AudioContext,
    freq: number = 440,
    durationSec: number = 1.0,
    type: 'sine' | 'square' | 'triangle' | 'noise' = 'sine'
): AudioBuffer {
    const sampleRate = ctx.sampleRate;
    const numFrames = Math.floor(sampleRate * durationSec);
    const buffer = ctx.createBuffer(2, numFrames, sampleRate);
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);

    for (let i = 0; i < numFrames; i++) {
        const t = i / sampleRate;
        const envelope = Math.exp(-3 * (t / durationSec)); // Exponential decay
        let sample = 0;

        if (type === 'sine') {
            sample = Math.sin(2 * Math.PI * freq * t) * envelope;
        } else if (type === 'square') {
            sample = (Math.sin(2 * Math.PI * freq * t) >= 0 ? 0.7 : -0.7) * envelope;
        } else if (type === 'triangle') {
            sample = (Math.asin(Math.sin(2 * Math.PI * freq * t)) * (2 / Math.PI)) * envelope;
        } else {
            sample = (Math.random() * 2 - 1) * envelope;
        }

        left[i] = sample * 0.5;
        right[i] = sample * 0.5;
    }

    return buffer;
}

export default class AudioDemoScene extends Scene {
    public async run() {
        if (this.composer) {
            this.composer.ALWAYS_UPDATE = true;
        }

        this.camera.position.set([0, 0, 25]);
        new Camera2DController(this, this.camera);

        // 1. INSTALL AUDIO PLUGIN
        this.use(new AudioPlugin({ masterVolume: 0.85 }));

        // 2. Attach 3D AudioListener to the active camera
        this.camera.addComponent(new AudioListenerComponent());
        frameStage(this, 34, 24);
        demoCaption(this, "Audio-reactive animation", "Visualizing the playing signal");

        // 3. Create synthetic audio buffers for demo
        const ctx = this.audio.context;
        const bassBeatBuffer = createSyntheticAudio(ctx, 110, 0.4, 'triangle');
        const popBuffer = createSyntheticAudio(ctx, 880, 0.25, 'sine');
        const chordBuffer = createSyntheticAudio(ctx, 440, 2.5, 'sine');

        // Play synthetic background ambient loop
        this.audio.timeline.addClip(chordBuffer, 0, this.audio.bgmGain, {
            volume: 0.4,
            loop: true
        });

        // 4. Create an audio analyzer to drive on-screen visualizer bars
        const analyzer = this.audio.createAnalyzer({ fftSize: 64 });

        // 5. Visual Equalizer Bars (16 bars)
        const barCount = 16;
        const bars: Rect[] = [];
        const startX = -12;
        const spacing = 1.6;

        for (let i = 0; i < barCount; i++) {
            const bar = new Rect(1.0, 1.0);
            bar.transform.position.set([startX + i * spacing, -6, 0]);
            bar.paint.fill = new Color(0.1 + (i / barCount) * 0.8, 0.4, 1.0 - (i / barCount) * 0.6, 0.85);
            this.add(bar);
            bars.push(bar);
        }

        // Animate visualizer bars from real-time FFT frequency bins
        this.always(() => {
            const data = analyzer.getFrequencyData();
            for (let i = 0; i < barCount; i++) {
                const normHeight = Math.max(0.2, (data[i * 2] / 255) * 8.0);
                bars[i].transform.setScale([1.0, normHeight, 1.0]);
            }
        });

        // 6. ANIMATIONS WITH SYNCED SOUND EFFECTS
        const circle = new Circle(3.5);
        circle.paint.fill = new Color(0.2, 0.8, 0.9, 0.4);
        circle.paint.setStroke(0.15, Color.WHITE);
        circle.transform.position.set([0, 2, 0]);

        // Trigger synthetic bass sound on animation start
        this.audio.timeline.addClip(bassBeatBuffer, this.time, this.audio.sfxGain, { volume: 0.9 });
        await this.play(createAnim(circle), { duration: 1200, rate_func: Rate.easeOutBack() });

        await this.wait(400);

        // Play high pop sound
        this.audio.timeline.addClip(popBuffer, this.time, this.audio.sfxGain, { volume: 1.0, pitch: 1.2 });
        await this.play(circle.animate.setScale([1.3, 1.3, 1.3]), { duration: 300 });
        await this.play(circle.animate.setScale([1.0, 1.0, 1.0]), { duration: 300 });

        await this.wait(600);
        await this.play(new FadeOut(circle), { duration: 800 });
    }
}
