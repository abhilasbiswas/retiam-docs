// =========================================================================
// File: examples/demos/tts/kokoro_tts_demo.ts
// =========================================================================

import {
    Scene,
    Color,
    hex,
    Rect,
    SDFText,
    Circle,
    GlowDot,
    Camera2DController,
    AudioPlugin,
    AudioAnalyzer,
    CENTER
} from "retiam";

import {
    TTS,
    Subtitles,
    getAvailableVoices,
    TTSAudioResult,
    KokoroVoiceId
} from "retiam/tts";
import { demoBackground } from "../../shared/presentation";

/**
 * Kokoro-82M WebGPU Text-To-Speech Showcase.
 *
 * Demonstrates client-side neural speech synthesis running directly in the browser
 * on WebGPU with synchronized subtitles, multi-voice switching, executive obsidian layout,
 * and real-time sound-reactive circle radius expansion.
 */
export default class KokoroTTSDemoScene extends Scene {
    public async run() {
        this.renderConfig.AA = 3;
        this.camera.position.set([0, 0, 48]);
        this.clearColor(demoBackground()); // Deep obsidian substrate
        new Camera2DController(this, this.camera, { zoom: 48 });

        // Enable Retiam Audio Plugin for Web Audio timeline routing & analysis
        this.use(new AudioPlugin({ autoUnlock: true }));

        // =====================================================================
        // 1. Executive Obsidian Header (Centered Layout)
        // =====================================================================
        // Pill status badge
        const badgeBg = new Rect(15, 1.25, {
            cornerRadius: 0.62,
            fill: new Color(0.08, 0.14, 0.25, 0.85),
            stroke: new Color(0.22, 0.74, 0.97, 0.5),
            strokeWidth: 0.04
        });
        badgeBg.transform.position.set([0, 18.2, 0]);
        this.add(badgeBg);

        const badgeText = new SDFText("• WEBGPU NEURAL SPEECH • KOKORO 82M •", {
            fontSize: 0.44,
            anchor: CENTER,
            position: [0, 18.2, 0.01],
            fill: hex("#38BDF8")
        });
        this.add(badgeText);

        // Hero Title
        const title = new SDFText("Client-Side Neural Text-To-Speech", {
            fontSize: 1.45,
            anchor: CENTER,
            position: [0, 16.0, 0],
            fill: hex("#F8FAFC")
        });
        this.add(title);

        const subtitle = new SDFText("82M-parameter model running 100% locally on WebGPU with 28 studio voices & timeline sync", {
            fontSize: 0.52,
            anchor: CENTER,
            position: [0, 14.4, 0],
            fill: hex("#94A3B8")
        });
        this.add(subtitle);

        // =====================================================================
        // 2. Hardware Acceleration Status Cards (Centered & Balanced Layout)
        // =====================================================================
        const isWebGPU = await TTS.isWebGPUSupported();

        const cardWidth = 9.8;
        const cardHeight = 3.8;
        const cardY = 10.6;
        const cardSpacing = 10.8;

        // Card 1: Engine & Device
        const deviceCard = new Rect(cardWidth, cardHeight, { cornerRadius: 0.3 });
        deviceCard.paint.fill = new Color(0.06, 0.09, 0.16, 0.85);
        deviceCard.paint.stroke = new Color(0.2, 0.3, 0.5, 0.3);
        deviceCard.paint.strokeWidth = 0.03;
        deviceCard.transform.position.set([-cardSpacing, cardY, 0]);
        this.add(deviceCard);

        const deviceCardTitle = new SDFText("ACCELERATION BACKEND", {
            fontSize: 0.34,
            anchor: CENTER,
            position: [-cardSpacing, cardY + 0.9, 0.01],
            fill: hex("#64748B")
        });
        this.add(deviceCardTitle);

        const deviceCardVal = new SDFText(isWebGPU ? "WebGPU Hardware (Active)" : "WASM SIMD Fallback", {
            fontSize: 0.48,
            anchor: CENTER,
            position: [-cardSpacing, cardY - 0.6, 0.01],
            fill: isWebGPU ? hex("#10B981") : hex("#F59E0B")
        });
        this.add(deviceCardVal);

        // Card 2: Model Architecture
        const modelCard = new Rect(cardWidth, cardHeight, { cornerRadius: 0.3 });
        modelCard.paint.fill = new Color(0.06, 0.09, 0.16, 0.85);
        modelCard.paint.stroke = new Color(0.2, 0.3, 0.5, 0.3);
        modelCard.paint.strokeWidth = 0.03;
        modelCard.transform.position.set([0, cardY, 0]);
        this.add(modelCard);

        const modelCardTitle = new SDFText("MODEL ARCHITECTURE", {
            fontSize: 0.34,
            anchor: CENTER,
            position: [0, cardY + 0.9, 0.01],
            fill: hex("#64748B")
        });
        this.add(modelCardTitle);

        const modelCardVal = new SDFText("Kokoro 82M (FP32 ONNX)", {
            fontSize: 0.48,
            anchor: CENTER,
            position: [0, cardY - 0.6, 0.01],
            fill: hex("#38BDF8")
        });
        this.add(modelCardVal);

        // Card 3: Voice Catalog
        const voicesCount = getAvailableVoices().length;
        const voicesCard = new Rect(cardWidth, cardHeight, { cornerRadius: 0.3 });
        voicesCard.paint.fill = new Color(0.06, 0.09, 0.16, 0.85);
        voicesCard.paint.stroke = new Color(0.2, 0.3, 0.5, 0.3);
        voicesCard.paint.strokeWidth = 0.03;
        voicesCard.transform.position.set([cardSpacing, cardY, 0]);
        this.add(voicesCard);

        const voicesCardTitle = new SDFText("BUILT-IN VOICES", {
            fontSize: 0.34,
            anchor: CENTER,
            position: [cardSpacing, cardY + 0.9, 0.01],
            fill: hex("#64748B")
        });
        this.add(voicesCardTitle);

        const voicesCardVal = new SDFText(`${voicesCount} Studio Profiles (US / UK)`, {
            fontSize: 0.48,
            anchor: CENTER,
            position: [cardSpacing, cardY - 0.6, 0.01],
            fill: hex("#F59E0B")
        });
        this.add(voicesCardVal);

        // =====================================================================
        // 3. Central Speaker Beacon & Sound-Reactive Circle
        // =====================================================================
        const centerY = 1.8;
        const baseRadius = 2.8;

        // Sound-reactive core circle
        const speakerCore = new Circle(baseRadius);
        speakerCore.paint.fill = new Color(0.08, 0.15, 0.30, 0.85);
        speakerCore.paint.stroke = hex("#38BDF8");
        speakerCore.paint.strokeWidth = 0.08;
        speakerCore.transform.position.set([0, centerY, 0]);
        this.add(speakerCore);

        // Acoustic ripple shockwave ring (expands and pulses with loud sound)
        const acousticRing = new Circle(baseRadius + 0.4);
        acousticRing.paint.fill = Color.NONE;
        acousticRing.paint.stroke = hex("#38BDF8");
        acousticRing.paint.strokeWidth = 0.05;
        acousticRing.paint.opacity = 0.0;
        acousticRing.transform.position.set([0, centerY, 0.005]);
        this.add(acousticRing);

        // Inner glowing beacon halo
        const speakerHalo = new GlowDot([0, centerY, 0.01], {
            radius: 1.2,
            glowColor: hex("#38BDF8"),
            glowRadius: 2.5,
            glowOpacity: 0.45
        });
        this.add(speakerHalo);

        // Center badge text (perfectly centered)
        const speakerIcon = new SDFText("AI SPEECH", {
            fontSize: 0.46,
            anchor: CENTER,
            position: [0, centerY, 0.02],
            fill: hex("#FFFFFF")
        });
        this.add(speakerIcon);

        // =====================================================================
        // 4. Closed Captions / Subtitles HUD & Status Indicator
        // =====================================================================
        const subtitles = new Subtitles({
            fontSize: 0.50,
            showBackdrop: true,
            textColor: hex("#FFFFFF")
        });
        subtitles.setBottomOffset(-7.5);
        this.add(subtitles);

        // Status indicator banner (centered)
        const statusLabel = new SDFText("Preparing Kokoro-82M neural session...", {
            fontSize: 0.46,
            anchor: CENTER,
            position: [0, -4.6, 0],
            fill: hex("#94A3B8")
        });
        this.add(statusLabel);

        // =====================================================================
        // 5. Sound-Reactivity Engine (Analyzer + PCM Envelope)
        // =====================================================================
        let analyzer: AudioAnalyzer | null = null;
        if (this.audio) {
            analyzer = this.audio.createAnalyzer({ fftSize: 256, smoothingTimeConstant: 0.3 });
            this.audio.resumeContext();
        }

        // Active speech state tracking for hybrid precision waveform sampling
        let activeAudio: TTSAudioResult | null = null;
        let activeStartTime = 0;
        let currentRadius = baseRadius;

        // Frame loop: dynamically mutate circle radius and visuals based on sound energy
        this.always((_t: number, _dt: number) => {
            let soundEnergy = 0;

            // Method A: Real-time Web Audio FFT analysis
            if (analyzer) {
                const bands = analyzer.getBands();
                soundEnergy = bands.rms * 3.6;
            } else if (this.audio?.bands) {
                soundEnergy = this.audio.bands.rms * 3.6;
            }

            // Method B: High-precision PCM envelope fallback/enhancer from active utterance
            if (activeAudio) {
                const elapsedSec = (performance.now() - activeStartTime) / 1000;
                if (elapsedSec >= 0 && elapsedSec <= activeAudio.duration) {
                    const sampleRate = activeAudio.sampleRate || 24000;
                    const sampleIdx = Math.floor(elapsedSec * sampleRate);
                    const samples = activeAudio.samples;
                    const windowSize = 256;
                    const start = Math.max(0, sampleIdx - (windowSize >> 1));
                    const end = Math.min(samples.length, start + windowSize);
                    let sumSq = 0;
                    for (let i = start; i < end; i++) {
                        sumSq += samples[i] * samples[i];
                    }
                    const pcmRms = Math.sqrt(sumSq / Math.max(1, end - start));
                    soundEnergy = Math.max(soundEnergy, pcmRms * 3.2);
                }
            }

            const energy = Math.max(0, Math.min(1.0, soundEnergy));

            // Dynamic circle radius: expands from 2.8 up to 4.2 with acoustic transients
            const targetRadius = baseRadius + energy * 1.4;
            const lerpSpeed = targetRadius > currentRadius ? 0.38 : 0.16;
            currentRadius += (targetRadius - currentRadius) * lerpSpeed;

            // Mutate circle radius based on sound
            speakerCore.radius = currentRadius;

            // Mutate inner glow dot radius
            speakerHalo.setRadius(1.2 + energy * 0.45);

            // Mutate acoustic ripple ring
            acousticRing.radius = currentRadius + 0.35 + energy * 0.95;
            acousticRing.paint.opacity = energy * 0.75;
            acousticRing.paint.strokeWidth = 0.04 + energy * 0.05;

            // Color micro-interaction on text and border
            if (energy > 0.08) {
                speakerIcon.paint.fill = hex("#38BDF8");
                speakerCore.paint.stroke = hex("#7DD3FC");
            } else {
                speakerIcon.paint.fill = hex("#FFFFFF");
                speakerCore.paint.stroke = hex("#38BDF8");
            }

            this.invalidate();
        });

        // Helper to narrate and track active utterance
        const speakNarration = async (text: string, voice: KokoroVoiceId) => {
            const audio = await TTS.synthesize(text, { voice });
            activeAudio = audio;
            activeStartTime = performance.now();
            subtitles.syncWithAudio(audio);

            await audio.play(this.audio || this, {
                duckingRatio: 0.25,
                volume: 1.0
            });

            activeAudio = null;
        };

        await this.wait(400);

        // Preload / Warmup status update
        TTS.preload({
            progressCallback: (p) => {
                if (p.message) {
                    statusLabel.text = p.message;
                }
            }
        }).then(() => {
            statusLabel.text = "Session ready. Triggering voice narration sequence...";
            statusLabel.paint.fill = hex("#10B981");
        }).catch((e) => {
            statusLabel.text = `Note: Demo preview running with mock audio fallback: ${e.message || e}`;
            statusLabel.paint.fill = hex("#F59E0B");
        });

        await this.wait(1200);

        // =====================================================================
        // 6. Multi-Voice Narration Sequence
        // =====================================================================
        // Beat 1: Heart (American Female - Warm & High Clarity)
        statusLabel.text = "Voice: af_heart (American English, Female)";
        statusLabel.paint.fill = hex("#38BDF8");

        await speakNarration(
            "Welcome to Retiam's native Text-to-Speech library, executing locally on WebGPU.",
            "af_heart"
        );

        await this.wait(600);

        // Beat 2: Michael (American Male - Instructional & Confident)
        statusLabel.text = "Voice: am_michael (American English, Male)";
        statusLabel.paint.fill = hex("#10B981");

        await speakNarration(
            "Kokoro 82M delivers studio quality speech synthesis with zero server latency.",
            "am_michael"
        );

        await this.wait(600);

        // Beat 3: Emma (British Female - Refined & Articulate)
        statusLabel.text = "Voice: bf_emma (British English, Female)";
        statusLabel.paint.fill = hex("#F59E0B");

        await speakNarration(
            "Seamlessly synchronized with animation timelines, subtitles, and automatic audio ducking.",
            "bf_emma"
        );

        await this.wait(800);
        statusLabel.text = "Narration complete. Retiam TTS is ready for production scenes.";
        statusLabel.paint.fill = hex("#38BDF8");
    }
}
