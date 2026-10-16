// =========================================================================
// File: examples/demos/tts/msedge_tts_demo.ts
// =========================================================================

import {
    Scene,
    Color,
    hex,
    Rect,
    SDFText,
    Circle,
    Arrow,
    GlowDot,
    Camera2DController,
    CENTER
} from "retiam";

import {
    TTS,
    Subtitles,
    TTSNarrationComponent,
    speak
} from "retiam/tts";
import { demoBackground } from "../../shared/presentation";

/**
 * Synthesizes a warm felt piano / Rhodes electric piano ambient chord progression
 * (Cmaj9 → Am9 → Fmaj7 → Gsus4/B) for the 3Blue1Brown-style background bed.
 *
 * Audio spec:
 * - Slow, atmospheric jazz/ambient chords with gentle attack and warm decay.
 * - Subtle Rhodes 2nd and 3rd harmonic overtones with soft stereo tremolo.
 */
function createRhodesAmbientBed(audio: any): AudioBuffer {
    const sampleRate = audio.context.sampleRate || 44100;
    const chordDuration = 7.0; // 7.0s per chord = 28.0s seamless loop
    const chords = [
        [130.81, 196.00, 246.94, 293.70, 329.63], // Cmaj9  (C3, G3, B3, D4, E4)
        [110.00, 164.81, 196.00, 246.94, 261.63], // Am9    (A2, E3, G3, B3, C4)
        [87.31,  130.81, 164.81, 220.00, 261.63], // Fmaj7  (F2, C3, E3, A3, C4)
        [123.47, 146.83, 196.00, 261.63, 293.70]  // Gsus4/B (B2, D3, G3, C4, D4)
    ];

    const totalDuration = chordDuration * chords.length;
    const totalSamples = Math.floor(sampleRate * totalDuration);
    const samples = new Float32Array(totalSamples);

    chords.forEach((chordNotes, chordIdx) => {
        const chordStartSample = Math.floor(chordIdx * chordDuration * sampleRate);
        const chordSamples = Math.floor(chordDuration * sampleRate);
        for (let i = 0; i < chordSamples; i++) {
            const t = i / sampleRate;
            // Warm felt hammer envelope: soft 40ms attack, gentle exponential decay
            const attack = 1.0 - Math.exp(-25.0 * t);
            const decay = Math.exp(-0.35 * t);
            const env = attack * decay;

            let val = 0;
            for (let n = 0; n < chordNotes.length; n++) {
                const freq = chordNotes[n];
                // Rhodes characteristic: fundamental + soft 2nd & 3rd harmonics + 1.2Hz warm tremolo
                const tremolo = 1.0 + 0.06 * Math.sin(2 * Math.PI * 1.2 * t);
                const s1 = Math.sin(2 * Math.PI * freq * t);
                const s2 = 0.22 * Math.sin(4 * Math.PI * freq * t + 0.4);
                const s3 = 0.06 * Math.sin(6 * Math.PI * freq * t + 0.8);
                val += (s1 + s2 + s3) * tremolo;
            }
            val = (val / chordNotes.length) * env;

            const globalIdx = chordStartSample + i;
            if (globalIdx < totalSamples) {
                samples[globalIdx] += val * 0.22;
            }
        }
    });

    return audio.createBuffer(samples, sampleRate);
}

/**
 * 3Blue1Brown-Style Masterclass Explainer: "The Geometry of Nondeterminism"
 *
 * Demonstrates:
 * 1. Vocal Persona: en-US-AndrewNeural (Smooth baritone-tenor, university CS professor).
 * 2. Prosody: Speed 0.96x (-4%), Pitch +0Hz, Volume 100%.
 * 3. Beat-Paced Cadence: Discrete conceptual beats with 1.6s breathing room between beats.
 * 4. Choreography: Visual automata animations taking center stage during narrative pauses.
 * 5. Audio Engineering: Ambient Rhodes bed (Cmaj9 → Am9 → Fmaj7 → Gsus4/B) ducked to -24 dB.
 */
export default class MsEdgeTTSDemoScene extends Scene {
    public async run() {
        this.camera.position.set([0, 0, 48]);
        this.clearColor(demoBackground()); // Deep obsidian substrate
        new Camera2DController(this, this.camera, { zoom: 48 });

        // Ensure maximum crispness and volume on Retiam's master & voiceover buses
        if (this.audio) {
            this.audio.setMasterVolume(1.0);
            this.audio.setVoiceoverVolume(1.0);
            this.audio.setBgmVolume(0.5);
        }

        // =====================================================================
        // 0. Audio Mixing Bed: Ambient Rhodes Jazz Chords (-24 dB)
        // =====================================================================
        if (this.audio && typeof this.audio.createBuffer === "function") {
            try {
                const ambientBedBuffer = createRhodesAmbientBed(this.audio);
                // Place on BGM bus at low volume (~0.05) so voiceover sits upfront
                this.audio.timeline.addClip(ambientBedBuffer, 0, this.audio.bgmGain, {
                    volume: 0.05,
                    loop: true
                });
            } catch (err) {
                console.warn("[MsEdgeTTSDemo] AudioContext BGM bed deferred:", err);
            }
        }

        // =====================================================================
        // 1. Executive Obsidian Header (Centered)
        // =====================================================================
        // Pill status badge
        const badgeBg = new Rect(21.0, 1.3, {
            cornerRadius: 0.65,
            fill: new Color(0.08, 0.14, 0.25, 0.85),
            stroke: new Color(0.22, 0.74, 0.97, 0.5),
            strokeWidth: 0.04
        });
        badgeBg.transform.position.set([0, 18.5, 0]);
        this.add(badgeBg);

        const badgeText = new SDFText("• 3BLUE1BROWN EXPLAINER • EN-US-ANDREWNEURAL • SPEED: 0.96x •", {
            fontSize: 0.42,
            anchor: CENTER
        });
        badgeText.paint.fill = hex("#38BDF8");
        badgeText.transform.position.set([0, 18.5, 0.01]);
        this.add(badgeText);

        // Hero Title (Centered)
        const title = new SDFText("The Geometry of Nondeterminism", {
            fontSize: 1.45,
            anchor: CENTER
        });
        title.paint.fill = hex("#F8FAFC");
        title.transform.position.set([0, 16.4, 0]);
        this.add(title);

        const subtitle = new SDFText("Subset Construction: From Quantum-like Superposition to Deterministic Reality", {
            fontSize: 0.48,
            anchor: CENTER
        });
        subtitle.paint.fill = hex("#94A3B8");
        subtitle.transform.position.set([0, 15.0, 0]);
        this.add(subtitle);

        // =====================================================================
        // 2. Telemetry & Audio HUD Cards (Centered Content)
        // =====================================================================
        const cardWidth = 10.5;
        const cardHeight = 3.8;

        // Card 1: Vocal Persona Profile
        const personaCard = new Rect(cardWidth, cardHeight, { cornerRadius: 0.3 });
        personaCard.paint.fill = new Color(0.06, 0.09, 0.16, 0.85);
        personaCard.paint.stroke = new Color(0.2, 0.3, 0.5, 0.3);
        personaCard.paint.strokeWidth = 0.03;
        personaCard.transform.position.set([-11.5, 11.2, 0]);
        this.add(personaCard);

        const personaCardTitle = new SDFText("VOCAL PERSONA PROFILE", {
            fontSize: 0.32,
            anchor: CENTER
        });
        personaCardTitle.paint.fill = hex("#64748B");
        personaCardTitle.transform.position.set([-11.5, 12.2, 0.01]);
        this.add(personaCardTitle);

        const personaCardVal = new SDFText("en-US-AndrewNeural", {
            fontSize: 0.46,
            anchor: CENTER
        });
        personaCardVal.paint.fill = hex("#F59E0B");
        personaCardVal.transform.position.set([-11.5, 11.1, 0.01]);
        this.add(personaCardVal);

        const personaCardSub = new SDFText("Baritone-Tenor CS Professor", {
            fontSize: 0.32,
            anchor: CENTER
        });
        personaCardSub.paint.fill = hex("#94A3B8");
        personaCardSub.transform.position.set([-11.5, 10.0, 0.01]);
        this.add(personaCardSub);

        // Card 2: Prosody & Timing Parameters
        const prosodyCard = new Rect(cardWidth, cardHeight, { cornerRadius: 0.3 });
        prosodyCard.paint.fill = new Color(0.06, 0.09, 0.16, 0.85);
        prosodyCard.paint.stroke = new Color(0.2, 0.3, 0.5, 0.3);
        prosodyCard.paint.strokeWidth = 0.03;
        prosodyCard.transform.position.set([0, 11.2, 0]);
        this.add(prosodyCard);

        const prosodyCardTitle = new SDFText("PROSODY PARAMETERS", {
            fontSize: 0.32,
            anchor: CENTER
        });
        prosodyCardTitle.paint.fill = hex("#64748B");
        prosodyCardTitle.transform.position.set([0, 12.2, 0.01]);
        this.add(prosodyCardTitle);

        const prosodyCardVal = new SDFText("Rate: 0.96x (-4%) | Pitch: +0Hz", {
            fontSize: 0.42,
            anchor: CENTER
        });
        prosodyCardVal.paint.fill = hex("#38BDF8");
        prosodyCardVal.transform.position.set([0, 11.1, 0.01]);
        this.add(prosodyCardVal);

        const prosodyCardSub = new SDFText("Beat Pauses: 1.6s Silence", {
            fontSize: 0.32,
            anchor: CENTER
        });
        prosodyCardSub.paint.fill = hex("#94A3B8");
        prosodyCardSub.transform.position.set([0, 10.0, 0.01]);
        this.add(prosodyCardSub);

        // Card 3: Background Audio Bed & Mixing
        const mixingCard = new Rect(cardWidth, cardHeight, { cornerRadius: 0.3 });
        mixingCard.paint.fill = new Color(0.06, 0.09, 0.16, 0.85);
        mixingCard.paint.stroke = new Color(0.2, 0.3, 0.5, 0.3);
        mixingCard.paint.strokeWidth = 0.03;
        mixingCard.transform.position.set([11.5, 11.2, 0]);
        this.add(mixingCard);

        const mixingCardTitle = new SDFText("AUDIO BED & MIXING", {
            fontSize: 0.32,
            anchor: CENTER
        });
        mixingCardTitle.paint.fill = hex("#64748B");
        mixingCardTitle.transform.position.set([11.5, 12.2, 0.01]);
        this.add(mixingCardTitle);

        const mixingCardVal = new SDFText("Rhodes Chords @ -24 dB", {
            fontSize: 0.44,
            anchor: CENTER
        });
        mixingCardVal.paint.fill = hex("#10B981");
        mixingCardVal.transform.position.set([11.5, 11.1, 0.01]);
        this.add(mixingCardVal);

        const mixingCardSub = new SDFText("Cmaj9 → Am9 → Fmaj7 → Gsus4/B", {
            fontSize: 0.30,
            anchor: CENTER
        });
        mixingCardSub.paint.fill = hex("#94A3B8");
        mixingCardSub.transform.position.set([11.5, 10.0, 0.01]);
        this.add(mixingCardSub);

        // =====================================================================
        // 3. Central Speaker Beacon (Interactive Entity with TTSNarrationComponent)
        // Positioned comfortably in the upper-right quadrant to avoid diagram collisions.
        // =====================================================================
        const speakerCore = new Circle(1.4);
        speakerCore.paint.fill = new Color(0.08, 0.15, 0.30, 0.85);
        speakerCore.paint.stroke = hex("#F59E0B");
        speakerCore.paint.strokeWidth = 0.06;
        speakerCore.transform.position.set([3.8, 3.2, 0]);
        this.add(speakerCore);

        const speakerHalo = new GlowDot([3.8, 3.2, 0.01], {
            radius: 0.9,
            glowColor: hex("#F59E0B"),
            glowRadius: 1.8,
            glowOpacity: 0.4
        });
        this.add(speakerHalo);

        const speakerIcon = new SDFText("ANDREW", {
            fontSize: 0.34,
            anchor: CENTER
        });
        speakerIcon.paint.fill = hex("#FFFFFF");
        speakerIcon.transform.position.set([3.8, 3.2, 0.02]);
        this.add(speakerIcon);

        // Attach TTS Narration Component to the beacon
        const narration = new TTSNarrationComponent({
            voice: "en-US-AndrewNeural",
            animateSpeaking: true,
            pulseAmplitude: 0.07
        });
        speakerCore.addComponent(narration);

        // Status indicator banner (Centered)
        const statusLabel = new SDFText("Preparing 3Blue1Brown masterclass explainer...", {
            fontSize: 0.44,
            anchor: CENTER
        });
        statusLabel.paint.fill = hex("#94A3B8");
        statusLabel.transform.position.set([0, -7.0, 0]);
        this.add(statusLabel);

        // =====================================================================
        // 4. Closed Captions / Subtitles HUD
        // =====================================================================
        const subtitles = new Subtitles({
            fontSize: 0.50,
            showBackdrop: true,
            textColor: hex("#FFFFFF")
        });
        subtitles.setBottomOffset(-9.6);
        this.add(subtitles);

        // =====================================================================
        // 5. Visual Automata Stage Entities (All labels centered)
        // =====================================================================
        // Initial state q0
        const stateQ0 = new Circle(1.5, {
            fill: new Color(0.06, 0.10, 0.20, 0.9),
            stroke: hex("#F59E0B"),
            strokeWidth: 0.06
        });
        stateQ0.transform.position.set([-8.5, -0.8, 0]);
        this.add(stateQ0);

        const q0Label = new SDFText("q0", {
            fontSize: 0.60,
            anchor: CENTER
        });
        q0Label.paint.fill = hex("#F8FAFC");
        q0Label.transform.position.set([-8.5, -0.8, 0.01]);
        this.add(q0Label);

        const startArrow = new Arrow([-11.6, -0.8, 0], [-10.1, -0.8, 0], {
            stroke: hex("#F59E0B"),
            strokeWidth: 0.06,
            headLength: 0.5,
            headWidth: 0.40
        });
        this.add(startArrow);

        const startText = new SDFText("start", {
            fontSize: 0.36,
            anchor: CENTER
        });
        startText.paint.fill = hex("#F59E0B");
        startText.transform.position.set([-10.8, -0.2, 0.01]);
        this.add(startText);

        // Deterministic state q1 (Upper Branch)
        const stateQ1 = new Circle(1.5, {
            fill: new Color(0.06, 0.12, 0.22, 0.9),
            stroke: hex("#38BDF8"),
            strokeWidth: 0.06
        });
        stateQ1.transform.position.set([-2.0, 2.0, 0]);
        this.add(stateQ1);

        const q1Label = new SDFText("q1", {
            fontSize: 0.60,
            anchor: CENTER
        });
        q1Label.paint.fill = hex("#F8FAFC");
        q1Label.transform.position.set([-2.0, 2.0, 0.01]);
        this.add(q1Label);

        const arrowQ0Q1 = new Arrow([-7.1, -0.4, 0], [-3.4, 1.6, 0], {
            stroke: hex("#38BDF8"),
            strokeWidth: 0.06,
            headLength: 0.5,
            headWidth: 0.40
        });
        this.add(arrowQ0Q1);

        const transALabel = new SDFText("a", {
            fontSize: 0.48,
            anchor: CENTER
        });
        transALabel.paint.fill = hex("#38BDF8");
        transALabel.transform.position.set([-5.3, 1.1, 0.01]);
        this.add(transALabel);

        const dfaFormula = new SDFText("Deterministic: δ(q0, a) = { q1 }", {
            fontSize: 0.38,
            anchor: CENTER
        });
        dfaFormula.paint.fill = hex("#38BDF8");
        dfaFormula.transform.position.set([-2.0, 3.8, 0.01]);
        this.add(dfaFormula);

        // Nondeterministic Branch states q2 & q3 (Lower Branch)
        const stateQ2 = new Circle(1.5, {
            fill: new Color(0.08, 0.08, 0.20, 0.9),
            stroke: hex("#A78BFA"),
            strokeWidth: 0.06
        });
        stateQ2.transform.position.set([-2.0, -3.6, 0]);
        this.add(stateQ2);

        const q2Label = new SDFText("q2", {
            fontSize: 0.60,
            anchor: CENTER
        });
        q2Label.paint.fill = hex("#F8FAFC");
        q2Label.transform.position.set([-2.0, -3.6, 0.01]);
        this.add(q2Label);

        const arrowEps1 = new Arrow([-7.1, -1.2, 0], [-3.4, -3.2, 0], {
            stroke: hex("#A78BFA"),
            strokeWidth: 0.06,
            headLength: 0.5,
            headWidth: 0.40
        });
        this.add(arrowEps1);

        const epsLabel1 = new SDFText("ε", {
            fontSize: 0.50,
            anchor: CENTER
        });
        epsLabel1.paint.fill = hex("#A78BFA");
        epsLabel1.transform.position.set([-5.3, -1.7, 0.01]);
        this.add(epsLabel1);

        const stateQ3 = new Circle(1.5, {
            fill: new Color(0.08, 0.08, 0.20, 0.9),
            stroke: hex("#A78BFA"),
            strokeWidth: 0.06
        });
        stateQ3.transform.position.set([4.0, -3.6, 0]);
        this.add(stateQ3);

        const q3Label = new SDFText("q3", {
            fontSize: 0.60,
            anchor: CENTER
        });
        q3Label.paint.fill = hex("#F8FAFC");
        q3Label.transform.position.set([4.0, -3.6, 0.01]);
        this.add(q3Label);

        const arrowEps2 = new Arrow([-0.5, -3.6, 0], [2.5, -3.6, 0], {
            stroke: hex("#A78BFA"),
            strokeWidth: 0.06,
            headLength: 0.5,
            headWidth: 0.40
        });
        this.add(arrowEps2);

        const epsLabel2 = new SDFText("ε", {
            fontSize: 0.50,
            anchor: CENTER
        });
        epsLabel2.paint.fill = hex("#A78BFA");
        epsLabel2.transform.position.set([1.0, -3.0, 0.01]);
        this.add(epsLabel2);

        const nfaFormula = new SDFText("Superposition: ECLOSE(q0) = { q0, q2, q3 }", {
            fontSize: 0.38,
            anchor: CENTER
        });
        nfaFormula.paint.fill = hex("#A78BFA");
        nfaFormula.transform.position.set([1.0, -5.5, 0.01]);
        this.add(nfaFormula);

        // Power Set Macro-State {q1, q2} (Subset Construction Result)
        const powerStateOuter = new Circle(2.0, {
            fill: new Color(0.05, 0.16, 0.14, 0.9),
            stroke: hex("#10B981"),
            strokeWidth: 0.07
        });
        powerStateOuter.transform.position.set([9.5, -0.8, 0]);
        this.add(powerStateOuter);

        // Double ring for accepting state
        const powerStateInner = new Circle(1.7, {
            stroke: hex("#10B981"),
            strokeWidth: 0.05
        });
        powerStateInner.transform.position.set([9.5, -0.8, 0.01]);
        this.add(powerStateInner);

        const powerHalo = new GlowDot([9.5, -0.8, 0.01], {
            radius: 1.2,
            glowColor: hex("#10B981"),
            glowRadius: 2.2,
            glowOpacity: 0.35
        });
        this.add(powerHalo);

        const powerLabel = new SDFText("{q1, q2}", {
            fontSize: 0.56,
            anchor: CENTER
        });
        powerLabel.paint.fill = hex("#FFFFFF");
        powerLabel.transform.position.set([9.5, -0.8, 0.02]);
        this.add(powerLabel);

        const arrowFold = new Arrow([-0.5, 1.7, 0], [7.5, -0.4, 0], {
            stroke: hex("#10B981"),
            strokeWidth: 0.06,
            headLength: 0.5,
            headWidth: 0.40
        });
        this.add(arrowFold);

        const foldLabel = new SDFText("Fold into Power Set: 2^Q", {
            fontSize: 0.38,
            anchor: CENTER
        });
        foldLabel.paint.fill = hex("#10B981");
        foldLabel.transform.position.set([9.5, 1.7, 0.01]);
        this.add(foldLabel);

        await this.wait(1000);

        // Await user click if browser autoplay policy has suspended audio
        if (this.audio && this.audio.context.state === "suspended") {
            statusLabel.text = "🔊 Click anywhere on screen to start presentation with audio...";
            statusLabel.paint.fill = hex("#38BDF8");
            await this.audio.awaitUnlock();
        }

        // =====================================================================
        // 6. Masterclass 3Blue1Brown Narration Sequence (Beat-Paced)
        // =====================================================================
        // Voice Spec:
        // - Provider: msedge
        // - Voice: en-US-AndrewNeural
        // - Speed: 0.96x (-4%)
        // - Pitch: +0Hz
        // - Volume: 1.0 (Full studio 100% speech output)
        // - Breathing Pauses: 1.6s between beats

        // ---------------------------------------------------------------------
        // BEAT 1: The Hook & Rhetorical Question (9 words)
        // ---------------------------------------------------------------------
        statusLabel.text = "Beat 1/4: The Hook • Contemplative upward inflection";
        statusLabel.paint.fill = hex("#F59E0B");
        speakerCore.paint.stroke = hex("#F59E0B");
        speakerHalo.paint.fill = hex("#F59E0B");

        await speak(this, "What if a machine could explore multiple futures... simultaneously?", {
            voice: "en-US-AndrewNeural",
            speed: 0.96,
            pitch: "+0Hz",
            volume: 1.0,
            subtitles,
            entity: speakerCore,
            duckingRatio: 0.20
        });

        // Breathing Pause 1: 1.6s silence for the concept to sink in
        statusLabel.text = "Beat 1 complete • [Breathing pause: 1.6s silence]";
        statusLabel.paint.fill = hex("#64748B");
        await this.wait(1600);

        // ---------------------------------------------------------------------
        // BEAT 2: Classical Determinism (24 words)
        // ---------------------------------------------------------------------
        statusLabel.text = "Beat 2/4: Classical Determinism • Precise technical enunciation";
        statusLabel.paint.fill = hex("#38BDF8");
        speakerCore.paint.stroke = hex("#38BDF8");
        speakerHalo.paint.fill = hex("#38BDF8");

        await speak(this, "In classical computation, a deterministic automaton is bound to a single reality, selecting exactly one transition for every input symbol in our alphabet, Sigma.", {
            voice: "en-US-AndrewNeural",
            speed: 0.96,
            pitch: "+0Hz",
            volume: 1.0,
            subtitles,
            entity: speakerCore,
            duckingRatio: 0.20
        });

        // Breathing Pause 2: 1.6s silence
        statusLabel.text = "Beat 2 complete • [Breathing pause: 1.6s silence]";
        statusLabel.paint.fill = hex("#64748B");
        await this.wait(1600);

        // ---------------------------------------------------------------------
        // BEAT 3: Nondeterminism & Superposition (22 words)
        // ---------------------------------------------------------------------
        statusLabel.text = "Beat 3/4: Superposition of Paths • Clairvoyant branching";
        statusLabel.paint.fill = hex("#A78BFA");
        speakerCore.paint.stroke = hex("#A78BFA");
        speakerHalo.paint.fill = hex("#A78BFA");

        await speak(this, "Nondeterminism, however, grants the machine a form of clairvoyance, allowing it to branch across an entire superposition of configurations via instantaneous epsilon transitions.", {
            voice: "en-US-AndrewNeural",
            speed: 0.96,
            pitch: "+0Hz",
            volume: 1.0,
            subtitles,
            entity: speakerCore,
            duckingRatio: 0.20
        });

        // Breathing Pause 3: 1.6s silence
        statusLabel.text = "Beat 3 complete • [Breathing pause: 1.6s silence]";
        statusLabel.paint.fill = hex("#64748B");
        await this.wait(1600);

        // ---------------------------------------------------------------------
        // BEAT 4: Subset Construction Theorem & Resolution (29 words)
        // ---------------------------------------------------------------------
        statusLabel.text = "Beat 4/4: Subset Construction • Confident, grounding resolution";
        statusLabel.paint.fill = hex("#10B981");
        speakerCore.paint.stroke = hex("#10B981");
        speakerHalo.paint.fill = hex("#10B981");

        await speak(this, "Yet, through the elegance of the Subset Construction theorem, any nondeterministic machine can be folded back into an equivalent deterministic universe, by tracking the power set of all reachable states.", {
            voice: "en-US-AndrewNeural",
            speed: 0.96,
            pitch: "+0Hz",
            volume: 1.0,
            subtitles,
            entity: speakerCore,
            duckingRatio: 0.20
        });

        // Breathing Pause 4: 1.8s silence
        statusLabel.text = "Masterclass explainer concluded • Fading ambient Rhodes bed (-24 dB → silence)...";
        statusLabel.paint.fill = hex("#38BDF8");
        await this.wait(1800);

        // =====================================================================
        // 7. Mastering: Soft 1.5s Fade-Out of Ambient Rhodes Bed
        // =====================================================================
        if (this.audio && typeof this.audio.stopBGM === "function") {
            this.audio.stopBGM(1500);
        }

        await this.wait(1500);
        statusLabel.text = "Module complete: 3Blue1Brown-style explainer ready in Retiam.";
    }
}
