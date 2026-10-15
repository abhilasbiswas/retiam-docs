import { frameStage } from "../../shared/presentation";
// =========================================================================
// File: examples/demos/physics/carrom_game.ts
// =========================================================================

import {
    Scene,
    Color,
    Vec3,
    Circle,
    Rect,
    Line,
    VectorEntity,
    hex
} from "retiam";
import { Physics2D, RigidBody2DComponent } from "retiam/physics";

interface PocketInfo {
    x: number;
    y: number;
    radius: number;
}

interface CarromCoin {
    entity: Circle;
    shadow?: Circle;
    innerRing?: Circle;
    core?: Circle;
    bodyComp: RigidBody2DComponent;
    type: 'white' | 'black' | 'queen';
    points: number;
    potted: boolean;
    sinkScale: number;
}

/**
 * Physical collision data derived directly from rigid-body dynamics & contact mechanics
 */
export interface CollisionPhysicsData {
    /** Normal impact velocity (m/s) along contact plane normal */
    vNormal: number;
    /** Tangential slip / shear velocity */
    vTangential: number;
    /** Total relative speed */
    relSpeed: number;
    /** Reduced inertial mass: (m1 * m2) / (m1 + m2) */
    reducedMass: number;
    /** Mass of primary body (striker or coin) */
    mass1: number;
    /** Mass of secondary body */
    mass2: number;
    /** Calculated normal impulse: (1 + e) * reducedMass * vNormal */
    normalImpulse: number;
    /** Glancing factor: 0.0 (direct head-on) to 1.0 (pure grazing/shear) */
    glancingFactor: number;
    /** Table boric powder friction coefficient */
    boardFriction: number;
    /** Coulomb contact friction */
    contactFriction: number;
}

/**
 * Procedural Web Audio API sound synthesizer for authentic wooden physics feedback
 */
class CarromAudio {
    private ctx: AudioContext | null = null;
    private masterLimiter: DynamicsCompressorNode | null = null;
    private masterGain: GainNode | null = null;

    // Tailored dual excitation buffers & non-tonal contact tick
    private strikerExcitationBuffer: AudioBuffer | null = null;
    private coinExcitationBuffer: AudioBuffer | null = null;
    private contactTickBuffer: AudioBuffer | null = null;

    // Cascade rate limiting
    private lastCoinHitTime: number = 0;
    private coinHitCountInWindow: number = 0;

    private getContext(): AudioContext | null {
        if (!this.ctx && typeof window !== 'undefined') {
            const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioCtx) {
                this.ctx = new AudioCtx();

                // High-performance mastering limiter: keeps transients punchy
                // while cleanly compressing multi-coin break cascades without clipping
                this.masterLimiter = this.ctx.createDynamicsCompressor();
                this.masterLimiter.threshold.value = -4; // dB
                this.masterLimiter.knee.value = 4;      // dB
                this.masterLimiter.ratio.value = 6;     // 6:1
                this.masterLimiter.attack.value = 0.001;// 1ms peak response
                this.masterLimiter.release.value = 0.040;// 40ms rapid recovery

                this.masterGain = this.ctx.createGain();
                this.masterGain.gain.value = 0.95;

                this.masterLimiter.connect(this.masterGain);
                this.masterGain.connect(this.ctx.destination);

                this.buildExcitationBuffers();
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
        return this.ctx;
    }

    /**
     * Builds specialized acoustic excitation signals:
     * 1. Striker: 1.8ms Hann-windowed contact impulse with dense acrylic mass
     * 2. Coin: 2.2ms Hann-windowed wood impulse with fibrous compliance
     * 3. Contact Tick: 1.2ms non-tonal shaped micro-burst (replaces synthetic chirps)
     */
    private buildExcitationBuffers(): void {
        if (!this.ctx) return;
        const sr = this.ctx.sampleRate;

        // 1. Striker excitation (1.8ms Hann-shaped acoustic impulse)
        const strikerLen = Math.ceil(sr * 0.0018);
        const sBuf = this.ctx.createBuffer(1, strikerLen, sr);
        const sData = sBuf.getChannelData(0);
        for (let i = 0; i < strikerLen; i++) {
            const win = 0.5 * (1 - Math.cos((2 * Math.PI * i) / strikerLen));
            const noise = (Math.random() * 2 - 1) * 0.45 + (1 - i / strikerLen) * 0.55;
            sData[i] = win * noise;
        }
        this.strikerExcitationBuffer = sBuf;

        // 2. Coin excitation (2.2ms Hann-shaped wood impulse)
        const coinLen = Math.ceil(sr * 0.0022);
        const cBuf = this.ctx.createBuffer(1, coinLen, sr);
        const cData = cBuf.getChannelData(0);
        for (let i = 0; i < coinLen; i++) {
            const win = 0.5 * (1 - Math.cos((2 * Math.PI * i) / coinLen));
            const noise = (Math.random() * 2 - 1) * 0.5 + (1 - i / coinLen) * 0.5;
            cData[i] = win * noise;
        }
        this.coinExcitationBuffer = cBuf;

        // 3. Contact Tick (1.2ms non-tonal acoustic surface compression)
        const tickLen = Math.ceil(sr * 0.0012);
        const tBuf = this.ctx.createBuffer(1, tickLen, sr);
        const tData = tBuf.getChannelData(0);
        for (let i = 0; i < tickLen; i++) {
            const t = i / tickLen;
            const env = Math.pow(1 - t, 2.5);
            tData[i] = (Math.random() * 2 - 1) * env;
        }
        this.contactTickBuffer = tBuf;
    }

    public parsePhysicsData(
        input: number | CollisionPhysicsData,
        defaultMass1: number,
        defaultMass2: number,
        defaultBoardFriction: number
    ): CollisionPhysicsData {
        if (typeof input === 'number') {
            const relSpeed = Math.max(0.01, input);
            const m1 = defaultMass1;
            const m2 = defaultMass2;
            const reducedMass = (m1 * m2) / (m1 + m2);
            return {
                vNormal: relSpeed * 0.85,
                vTangential: relSpeed * 0.15,
                relSpeed,
                reducedMass,
                mass1: m1,
                mass2: m2,
                normalImpulse: 1.9 * reducedMass * relSpeed * 0.85,
                glancingFactor: 0.15,
                boardFriction: defaultBoardFriction,
                contactFriction: 0.05
            };
        }
        return input;
    }

    /**
     * Authentic Acoustic Modal Synthesis Engine:
     * - Drives parallel damped resonators tuned to the physical modes of birch soundboard & hardwood/acrylic pieces
     * - Master low-pass filter eliminates harsh digital/plastic frequencies
     * - Organic contact tick provides crisp mechanical bite without synthetic oscillator sweeps
     */
    private playModal(
        modes: [number, number, number, number][],
        masterVol: number,
        isStriker: boolean = false,
        masterCutoff: number = 2400,
        tickFreq: number = 1200
    ): void {
        const ctx = this.getContext();
        if (!ctx) return;
        const now = ctx.currentTime;

        const master = ctx.createGain();
        master.gain.setValueAtTime(masterVol, now);

        // Acoustic warming low-pass filter: prevents plastic/metallic sheen
        const masterLp = ctx.createBiquadFilter();
        masterLp.type = 'lowpass';
        masterLp.frequency.setValueAtTime(masterCutoff, now);
        masterLp.Q.setValueAtTime(0.707, now);

        master.connect(masterLp);
        if (this.masterLimiter) {
            masterLp.connect(this.masterLimiter);
        } else {
            masterLp.connect(ctx.destination);
        }

        const excitation = isStriker ? this.strikerExcitationBuffer : this.coinExcitationBuffer;
        if (excitation) {
            for (const [freq, Q, amp, decay] of modes) {
                const src = ctx.createBufferSource();
                src.buffer = excitation;

                const bp = ctx.createBiquadFilter();
                bp.type = 'bandpass';
                bp.frequency.setValueAtTime(Math.max(40, freq), now);
                bp.Q.setValueAtTime(Math.max(1, Q), now);

                const g = ctx.createGain();
                g.gain.setValueAtTime(amp, now);
                g.gain.exponentialRampToValueAtTime(0.0001, now + decay);

                src.connect(bp);
                bp.connect(g);
                g.connect(master);

                src.start(now);
                src.stop(now + decay + 0.006);
            }
        }

        // Mechanical contact transient (non-tonal organic noise click, NO synth sweep!)
        if (this.contactTickBuffer) {
            const tickSrc = ctx.createBufferSource();
            tickSrc.buffer = this.contactTickBuffer;

            const tickFilter = ctx.createBiquadFilter();
            tickFilter.type = 'bandpass';
            tickFilter.frequency.setValueAtTime(tickFreq, now);
            tickFilter.Q.setValueAtTime(1.8, now);

            const tickGain = ctx.createGain();
            const tickVol = (isStriker ? 0.35 : 0.22) * masterVol;
            tickGain.gain.setValueAtTime(tickVol, now);
            tickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.002);

            tickSrc.connect(tickFilter);
            tickFilter.connect(tickGain);
            tickGain.connect(master);

            tickSrc.start(now);
            tickSrc.stop(now + 0.004);
        }
    }

    /**
     * Striker flick release — silenced per physical law (initial impulse force does not produce collision sound).
     */
    public playFlick(_power: number): void {
        // Initial impulse application is silent per physics of finger flicking a smooth disc
    }

    /**
     * STRIKER TO COIN COLLISION:
     * Heavy acrylic disc hitting turned hardwood piece on birch soundboard.
     * Features heavy 140Hz soundboard table punch, dense 840Hz acrylic body smack,
     * and crisp 1420Hz impact crack with zero plastic high-frequency ringing.
     */
    public playStrikerCoinHit(input: number | CollisionPhysicsData): void {
        if (!this.getContext()) return;
        const p = this.parsePhysicsData(input, 4.5, 1.8, 0.05);

        // 1. Natural Resonant Frequency Scaling via Mass: f ~ sqrt(k / m)
        const strikerPitchFactor = Math.sqrt(4.5 / Math.max(0.5, p.mass1));
        const coinPitchFactor = Math.sqrt(1.8 / Math.max(0.4, p.mass2));

        // 2. Velocity dynamics (gentle stiffness hardening)
        const vn = Math.max(0.02, p.vNormal);
        const speedStiffnessShift = 1.0 + Math.min(0.08, vn * 0.005);

        // 3. Board powder friction damping
        const tableDamping = Math.max(0.75, Math.min(1.20, 1.0 / (1.0 + 2.0 * (p.boardFriction - 0.05))));

        // 4. Glancing vs Head-on dynamics
        const alpha = Math.max(0, Math.min(1, p.glancingFactor));
        const normalPower = Math.pow(1 - alpha, 1.3);
        const frictionPower = alpha;

        // 5. Volume scaling
        const massNorm = Math.sqrt(p.reducedMass / 1.286);
        const velNorm = Math.pow(vn / 14.0, 0.75);
        const normalVolume = Math.min(0.85, (0.24 + 0.54 * Math.sqrt(velNorm)) * massNorm * (0.25 + 0.75 * normalPower));
        const shearVolume = Math.min(0.35, 0.30 * Math.pow(p.vTangential / 14.0, 0.65) * frictionPower);
        const masterVol = Math.max(normalVolume, shearVolume);

        const r = () => 1 + (Math.random() - 0.5) * 0.04;

        this.playModal([
            // Mode 1: Heavy Table Soundboard Punch (birch plywood flexion)
            [140 * strikerPitchFactor * speedStiffnessShift * r(), 2.6, 0.90 * normalPower, 0.052 * tableDamping],
            // Mode 2: Table Body Mode
            [280 * strikerPitchFactor * speedStiffnessShift * r(), 3.0, 0.65 * normalPower, 0.036 * tableDamping],
            // Mode 3: Wood Coin Reaction Cavity
            [520 * coinPitchFactor * speedStiffnessShift * r(), 3.5, 0.50 * normalPower, 0.026 * tableDamping],
            // Mode 4: Dense Acrylic Core Smack
            [840 * strikerPitchFactor * speedStiffnessShift * r(), 4.2, 1.00 * normalPower + 0.25 * frictionPower, 0.020 * tableDamping],
            // Mode 5: Acrylic Rim Impact Crack
            [1420 * strikerPitchFactor * speedStiffnessShift * r(), 4.5, 0.65 * normalPower + 0.35 * frictionPower, 0.014 * tableDamping],
            // Mode 6: Upper Contact Attack
            [2100 * r(), 3.2, 0.25 * normalPower, 0.007]
        ], masterVol, true, 2800, 1600 * speedStiffnessShift);
    }

    /**
     * COIN TO COIN COLLISION:
     * Two turned hardwood carrom men colliding on birch plywood surface.
     * Features authentic 175Hz table drum thud, 580Hz wood cavity, 980Hz hardwood "tock",
     * and 1520Hz wood grain overtone. Completely free of high-frequency plastic ringing.
     */
    public playCoinCoinHit(input: number | CollisionPhysicsData): void {
        const ctx = this.getContext();
        if (!ctx) return;
        const now = ctx.currentTime;

        // Cascade polyphony management
        if (now - this.lastCoinHitTime > 0.016) {
            this.lastCoinHitTime = now;
            this.coinHitCountInWindow = 0;
        } else {
            this.coinHitCountInWindow++;
        }
        if (this.coinHitCountInWindow > 3) return;

        const cascadeDamping = this.coinHitCountInWindow === 0 ? 1.0 : (1.0 - this.coinHitCountInWindow * 0.16);
        const p = this.parsePhysicsData(input, 1.8, 1.8, 0.05);

        // 1. Natural Resonant Frequency Scaling via Coin Mass: f ~ sqrt(1.8 / m)
        const coinPitchFactor = Math.sqrt(1.8 / Math.max(0.4, (p.mass1 + p.mass2) * 0.5));

        // 2. Velocity dynamics
        const vn = Math.max(0.02, p.vNormal);
        const speedStiffnessShift = 1.0 + Math.min(0.06, vn * 0.004);

        // 3. Board powder friction damping
        const tableDamping = Math.max(0.75, Math.min(1.20, 1.0 / (1.0 + 2.0 * (p.boardFriction - 0.05))));

        // 4. Glancing vs Head-on dynamics
        const alpha = Math.max(0, Math.min(1, p.glancingFactor));
        const normalPower = Math.pow(1 - alpha, 1.3);
        const frictionPower = alpha;

        // 5. Volume scaling
        const massNorm = Math.sqrt(p.reducedMass / 0.90);
        const velNorm = Math.pow(vn / 10.0, 0.75);
        const normalVolume = (0.16 + 0.38 * Math.sqrt(velNorm)) * massNorm * (0.25 + 0.75 * normalPower);
        const shearVolume = 0.22 * Math.pow(p.vTangential / 10.0, 0.65) * frictionPower;
        const masterVol = Math.min(0.65, Math.max(normalVolume, shearVolume) * cascadeDamping);

        const r = () => 1 + (Math.random() - 0.5) * 0.06;

        this.playModal([
            // Mode 1: Table Birch Soundboard Flexion (gives physical acoustic presence)
            [175 * coinPitchFactor * speedStiffnessShift * r(), 2.8, 0.70 * normalPower, 0.042 * tableDamping],
            // Mode 2: Table Structural Mid
            [340 * coinPitchFactor * speedStiffnessShift * r(), 3.2, 0.45 * normalPower, 0.032 * tableDamping],
            // Mode 3: Hardwood Coin Internal Cavity
            [580 * coinPitchFactor * speedStiffnessShift * r(), 3.6, 0.60 * normalPower, 0.024 * tableDamping],
            // Mode 4: Authentic Hardwood Primary "Tock"
            [980 * coinPitchFactor * speedStiffnessShift * r(), 4.0, 1.00 * normalPower + 0.30 * frictionPower, 0.016 * tableDamping],
            // Mode 5: Upper Wood Grain Overtone
            [1520 * coinPitchFactor * speedStiffnessShift * r(), 3.4, 0.35 * normalPower + 0.40 * frictionPower, 0.010 * tableDamping]
        ], masterVol, false, 2200, 1100 * speedStiffnessShift);
    }

    /**
     * Striker hitting wooden frame cushion (deep, heavy frame thud with rubber nose damp).
     */
    public playStrikerCushion(input: number | CollisionPhysicsData): void {
        if (!this.getContext()) return;
        const p = this.parsePhysicsData(input, 4.5, 100.0, 0.05);

        const vn = Math.max(0.02, p.vNormal);
        const alpha = Math.max(0, Math.min(1, p.glancingFactor));
        const normalPower = Math.pow(1 - alpha, 1.2);

        const strikerPitchFactor = Math.sqrt(4.5 / Math.max(0.5, p.mass1));
        const massNorm = Math.sqrt(p.mass1 / 4.5);
        const velNorm = Math.pow(vn / 12.0, 0.75);

        const masterVol = Math.min(0.60, (0.20 + 0.36 * Math.sqrt(velNorm)) * massNorm * (0.35 + 0.65 * normalPower));
        const r = () => 1 + (Math.random() - 0.5) * 0.04;

        this.playModal([
            [115 * strikerPitchFactor * r(), 2.4, 1.0 * normalPower + 0.2, 0.060],
            [240 * strikerPitchFactor * r(), 3.0, 0.6 * normalPower + 0.3, 0.042],
            [520 * r(), 3.5, 0.3 * normalPower + 0.3 * alpha, 0.022]
        ], masterVol, true, 1100, 850);
    }

    /**
     * Coin hitting wooden frame cushion (dull, muffled wooden rail knock).
     */
    public playCoinCushion(input: number | CollisionPhysicsData): void {
        if (!this.getContext()) return;
        const p = this.parsePhysicsData(input, 1.8, 100.0, 0.05);

        const vn = Math.max(0.02, p.vNormal);
        const alpha = Math.max(0, Math.min(1, p.glancingFactor));
        const normalPower = Math.pow(1 - alpha, 1.2);

        const coinPitchFactor = Math.sqrt(1.8 / Math.max(0.4, p.mass1));
        const massNorm = Math.sqrt(p.mass1 / 1.8);
        const velNorm = Math.pow(vn / 8.0, 0.75);

        const masterVol = Math.min(0.42, (0.14 + 0.26 * Math.sqrt(velNorm)) * massNorm * (0.35 + 0.65 * normalPower));
        const r = () => 1 + (Math.random() - 0.5) * 0.05;

        this.playModal([
            [160 * coinPitchFactor * r(), 2.8, 0.8 * normalPower + 0.2, 0.040],
            [380 * coinPitchFactor * r(), 3.2, 0.5 * normalPower + 0.3, 0.028],
            [780 * coinPitchFactor * r(), 3.5, 0.25 * normalPower + 0.4 * alpha, 0.016]
        ], masterVol, false, 1300, 950);
    }

    /** General clack for backward compatibility and UI button feedback */
    public playClack(intensity: number): void {
        this.playCoinCoinHit(intensity * 5.0);
    }

    /** Cushion alias for backward compatibility */
    public playCushion(intensity: number): void {
        this.playCoinCushion(intensity * 4.0);
    }

    /** Pocket — coin drops into velvet/felt lined well. */
    public playPocket(isQueen: boolean): void {
        const ctx = this.getContext();
        if (!ctx) return;
        const now = ctx.currentTime;

        // Wooden pocket rim contact thud
        this.playModal([
            [140, 2.5, 0.8, 0.045],
            [320, 3.0, 0.4, 0.030]
        ], 0.25, false, 900, 700);

        // Gentle felt landing
        const freq = isQueen ? 320 : 240;
        const dur = isQueen ? 0.14 : 0.10;
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + 0.01);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.6, now + 0.01 + dur);
        g.gain.setValueAtTime(0.0001, now);
        g.gain.linearRampToValueAtTime(0.05, now + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 0.01 + dur);

        if (this.masterLimiter) {
            osc.connect(g);
            g.connect(this.masterLimiter);
        } else {
            osc.connect(g);
            g.connect(ctx.destination);
        }
        osc.start(now);
        osc.stop(now + 0.01 + dur + 0.01);
    }

    /** Foul — two quick descending pips (UI feedback) */
    public playFoul(): void {
        const ctx = this.getContext();
        if (!ctx) return;
        const now = ctx.currentTime;

        for (let i = 0; i < 2; i++) {
            const t = now + i * 0.12;
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(320 - i * 80, t);
            osc.frequency.exponentialRampToValueAtTime(180 - i * 40, t + 0.1);
            g.gain.setValueAtTime(0.06, t);
            g.gain.exponentialRampToValueAtTime(0.0001, t + 0.1);

            if (this.masterLimiter) {
                osc.connect(g);
                g.connect(this.masterLimiter);
            } else {
                osc.connect(g);
                g.connect(ctx.destination);
            }
            osc.start(t);
            osc.stop(t + 0.11);
        }
    }

    /** Gentle wooden slide sound when striker returns to mouse */
    public playSlide(): void {
        this.playModal([
            [520, 2.5, 0.06, 0.24],
            [880, 3.0, 0.04, 0.14]
        ], 0.10, false, 1800, 900);
    }
}

export type AIDifficulty = 'novice' | 'amateur' | 'expert' | 'master';
export type StrikerTheme = 'ivory' | 'obsidian' | 'ruby' | 'emerald';

export interface AIShotPlan {
    baselineX: number;
    impulseX: number;
    impulseY: number;
    powerRatio: number;
    aimDirX: number;
    aimDirY: number;
    targetCoin: CarromCoin;
    pocket: PocketInfo;
    cutAngleDeg: number;
    score: number;
    description: string;
}

/**
 * High-performance geometric and physics-based AI solver for Carrom.
 * Computes cut angles, line-of-sight obstacle sweeps, baseline placement,
 * and calibrated impulse requirements for high-percentage potting.
 * Supports 4 progressive difficulty levels: Novice, Amateur, Expert, and Master.
 */
export class CarromAI {
    public static findBestShot(
        coins: CarromCoin[],
        pockets: PocketInfo[],
        baselineY: number,
        minX: number,
        maxX: number,
        strikerRadius: number,
        coinRadius: number,
        aiColor: 'black' | 'white' = 'black',
        difficulty: AIDifficulty = 'expert',
        strikerWeight: number = 4.5,
        coinWeight: number = 1.8,
        linearDamping: number = 1.0,
        forceMultiplier: number = 1.0
    ): AIShotPlan | null {
        const activeCoins = coins.filter(c => !c.potted);
        if (activeCoins.length === 0) return null;

        const candidateCoins: CarromCoin[] = [];
        const queen = activeCoins.find(c => c.type === 'queen');
        if (queen) candidateCoins.push(queen);

        const ownCoins = activeCoins.filter(c => c.type === aiColor);
        candidateCoins.push(...ownCoins);

        if (candidateCoins.length === 0) return null;

        const candidatePlans: AIShotPlan[] = [];

        // Dynamic cut tolerance based on level:
        // Novice avoids steep cuts (cos >= 0.62, ~51° max); Expert/Master can cut up to 68° (cos >= 0.38)
        const maxCutCos = difficulty === 'novice' ? 0.62 : (difficulty === 'amateur' ? 0.48 : 0.38);

        for (const coin of candidateCoins) {
            const cx = coin.entity.transform.position.x;
            const cy = coin.entity.transform.position.y;

            for (const pocket of pockets) {
                const dx = pocket.x - cx;
                const dy = pocket.y - cy;
                const distToPocket = Math.hypot(dx, dy);
                if (distToPocket < 0.15) continue;

                const ucpX = dx / distToPocket;
                const ucpY = dy / distToPocket;

                // 1. Check if coin-to-pocket trajectory is obstructed by any other coin
                let pocketPathBlocked = false;
                for (const obs of activeCoins) {
                    if (obs === coin) continue;
                    const ox = obs.entity.transform.position.x;
                    const oy = obs.entity.transform.position.y;

                    const voxX = ox - cx;
                    const voxY = oy - cy;
                    const t = voxX * ucpX + voxY * ucpY;
                    if (t > 0.15 && t < distToPocket - coinRadius * 0.5) {
                        const perpDistSq = (voxX * voxX + voxY * voxY) - (t * t);
                        const minAllowed = (coinRadius * 2) * 0.95;
                        if (perpDistSq < minAllowed * minAllowed) {
                            pocketPathBlocked = true;
                            break;
                        }
                    }
                }
                if (pocketPathBlocked) continue;

                // 2. Required striker center position at moment of contact:
                // I = C - ucp * (strikerRadius + coinRadius)
                const contactDist = strikerRadius + coinRadius;
                const ix = cx - ucpX * contactDist;
                const iy = cy - ucpY * contactDist;

                // Contact position must be safely inside playable cushion boundary
                if (Math.abs(ix) > 10.8 || Math.abs(iy) > 10.8) continue;

                // 3. Test baseline candidate positions
                const baselineCandidates: number[] = [];

                // Collinear baseline position (0° cut angle if within reach):
                if (Math.abs(ucpY) > 0.05) {
                    const lambda = (iy - baselineY) / ucpY;
                    if (lambda > 0.4) {
                        const sxCollinear = ix - lambda * ucpX;
                        if (sxCollinear >= minX && sxCollinear <= maxX) {
                            baselineCandidates.push(sxCollinear);
                        }
                    }
                }

                // Sample baseline positions across the allowed rail span
                const numSamples = difficulty === 'novice' ? 14 : 21;
                for (let s = 0; s <= numSamples; s++) {
                    const sx = minX + (s / numSamples) * (maxX - minX);
                    baselineCandidates.push(sx);
                }

                for (const sx of baselineCandidates) {
                    const sy = baselineY;

                    // Obstacle check on baseline: ensure striker doesn't overlap a coin on baseline
                    let baselineBlocked = false;
                    for (const obs of activeCoins) {
                        const ox = obs.entity.transform.position.x;
                        const oy = obs.entity.transform.position.y;
                        if (Math.hypot(ox - sx, oy - sy) < strikerRadius + coinRadius * 0.92) {
                            baselineBlocked = true;
                            break;
                        }
                    }
                    if (baselineBlocked) continue;

                    // Striker flight vector from baseline to impact point
                    const vsiX = ix - sx;
                    const vsiY = iy - sy;
                    const distToImpact = Math.hypot(vsiX, vsiY);
                    if (distToImpact < 0.25) continue;

                    const vsiUnitX = vsiX / distToImpact;
                    const vsiUnitY = vsiY / distToImpact;

                    // Cut angle cosine: dot product between striker direction and impact normal
                    const cosTheta = vsiUnitX * ucpX + vsiUnitY * ucpY;
                    if (cosTheta < maxCutCos) continue;

                    const cutAngle = Math.acos(Math.min(1, Math.max(0, cosTheta)));
                    const cutAngleDeg = (cutAngle * 180) / Math.PI;

                    // Check if striker's flight path from (sx, sy) to (ix, iy) is blocked
                    let strikerPathBlocked = false;
                    for (const obs of activeCoins) {
                        if (obs === coin) continue;
                        const ox = obs.entity.transform.position.x;
                        const oy = obs.entity.transform.position.y;

                        const voxX = ox - sx;
                        const voxY = oy - sy;
                        const t = voxX * vsiUnitX + voxY * vsiUnitY;
                        if (t > 0.25 && t < distToImpact - coinRadius * 0.4) {
                            const perpDistSq = (voxX * voxX + voxY * voxY) - (t * t);
                            const minAllowed = (strikerRadius + coinRadius) * 0.92;
                            if (perpDistSq < minAllowed * minAllowed) {
                                strikerPathBlocked = true;
                                break;
                            }
                        }
                    }
                    if (strikerPathBlocked) continue;

                    // Calibrate impulse for physical mass and damping
                    const vCoinNeeded = (3.2 + distToPocket * 0.72) * (coinWeight / 1.8);
                    const vStrikerImpact = vCoinNeeded / (1.43 * Math.max(0.38, cosTheta));
                    const vStrikerInitial = vStrikerImpact + distToImpact * (0.32 * linearDamping);
                    const baseImpulse = vStrikerInitial * strikerWeight;
                    const impulseMag = Math.min(108.0 * forceMultiplier, Math.max(35.0, baseImpulse * forceMultiplier));
                    const powerRatio = (impulseMag - 10.0) / (100.0 * forceMultiplier);

                    // Quality scoring
                    let score = 0;
                    if (coin.type === 'queen') {
                        score += (difficulty === 'novice' ? 120 : 170);
                    } else if (coin.type === aiColor) {
                        score += 100;
                    }

                    // Bonus for cleaner / direct cuts (0° gets +120, 60° gets +15)
                    score += Math.max(0, (1.0 - cutAngle / 1.25)) * 120;
                    // Bonus for proximity to pocket
                    score += Math.max(0, (22.0 - distToPocket)) * 4.5;
                    // Bonus for proximity to striker
                    score += Math.max(0, (20.0 - distToImpact)) * 2.5;
                    // Bonus for central baseline position
                    score += (6.5 - Math.abs(sx)) * 1.5;

                    candidatePlans.push({
                        baselineX: sx,
                        impulseX: vsiUnitX * impulseMag,
                        impulseY: vsiUnitY * impulseMag,
                        powerRatio,
                        aimDirX: vsiUnitX,
                        aimDirY: vsiUnitY,
                        targetCoin: coin,
                        pocket,
                        cutAngleDeg,
                        score,
                        description: `Pocket ${coin.type.toUpperCase()} into Corner`
                    });
                }
            }
        }

        candidatePlans.sort((a, b) => b.score - a.score);

        if (candidatePlans.length > 0) {
            let poolSize = 1;
            let maxAngleError = 0;
            let maxPowerVariance = 0;

            if (difficulty === 'novice') {
                poolSize = Math.min(5, candidatePlans.length);
                maxAngleError = 0.055; // ~±3.2 degrees
                maxPowerVariance = 0.22; // ~±11% power jitter
            } else if (difficulty === 'amateur') {
                poolSize = Math.min(3, candidatePlans.length);
                maxAngleError = 0.028; // ~±1.6 degrees
                maxPowerVariance = 0.12; // ~±6%
            } else if (difficulty === 'expert') {
                poolSize = Math.min(2, candidatePlans.length);
                maxAngleError = 0.009; // ~±0.5 degrees
                maxPowerVariance = 0.05; // ~±2.5%
            } else {
                // Master: 0 error, picks absolute #1 shot
                poolSize = 1;
                maxAngleError = 0;
                maxPowerVariance = 0;
            }

            const pickIndex = Math.floor(Math.random() * poolSize);
            const chosen = { ...candidatePlans[pickIndex] };

            if (maxAngleError > 0 || maxPowerVariance > 0) {
                const angleError = (Math.random() - 0.5) * maxAngleError;
                const cosA = Math.cos(angleError);
                const sinA = Math.sin(angleError);
                const nx = chosen.aimDirX * cosA - chosen.aimDirY * sinA;
                const ny = chosen.aimDirX * sinA + chosen.aimDirY * cosA;

                const powerMult = 1.0 + (Math.random() - 0.5) * maxPowerVariance;
                const impMag = Math.hypot(chosen.impulseX, chosen.impulseY) * powerMult;

                chosen.aimDirX = nx;
                chosen.aimDirY = ny;
                chosen.impulseX = nx * impMag;
                chosen.impulseY = ny * impMag;
            }
            return chosen;
        }

        // Fallback: Cluster break or defensive strike towards center
        return CarromAI.createFallbackBreakShot(activeCoins, baselineY, minX, maxX, strikerRadius, aiColor);
    }

    private static createFallbackBreakShot(
        activeCoins: CarromCoin[],
        baselineY: number,
        minX: number,
        maxX: number,
        strikerRadius: number,
        aiColor: 'black' | 'white'
    ): AIShotPlan | null {
        const target = activeCoins.find(c => c.type === aiColor) || activeCoins[0];
        if (!target) return null;

        const tx = target.entity.transform.position.x;
        const ty = target.entity.transform.position.y;

        const sx = Math.max(minX, Math.min(maxX, tx + (Math.random() - 0.5) * 1.2));
        const sy = baselineY;

        const dx = tx - sx;
        const dy = ty - sy;
        const dist = Math.hypot(dx, dy);
        const dirX = dist > 0.01 ? dx / dist : 0;
        const dirY = dist > 0.01 ? dy / dist : (baselineY > 0 ? -1 : 1);

        const impulseMag = 78.0;
        return {
            baselineX: sx,
            impulseX: dirX * impulseMag,
            impulseY: dirY * impulseMag,
            powerRatio: 0.72,
            aimDirX: dirX,
            aimDirY: dirY,
            targetCoin: target,
            pocket: { x: 0, y: 0, radius: 0 },
            cutAngleDeg: 0,
            score: 10,
            description: `Cluster Break / Repositioning Strike`
        };
    }
}

export default class CarromGameScene extends Scene {
    private physics!: Physics2D;
    private soundEffects = new CarromAudio();

    // Board Dimensions
    private readonly BOARD_SIZE = 24.0;
    private readonly HALF_BOARD = 12.0;
    private readonly POCKET_POS = 11.35;
    private readonly POCKET_RADIUS = 1.05;
    private readonly BASELINE_Y = -8.0;     // Player bottom baseline
    private readonly AI_BASELINE_Y = 8.0;   // AI top baseline
    private readonly BASELINE_MIN_X = -6.5;
    private readonly BASELINE_MAX_X = 6.5;

    // Piece Dimensions
    private readonly COIN_RADIUS = 0.50;
    private readonly STRIKER_RADIUS = 0.68;

    // Physical Optical Shadow Offsets & Radii
    private readonly COIN_SHADOW_OFFSET_X = 0.045;
    private readonly COIN_SHADOW_OFFSET_Y = -0.065;
    private readonly COIN_SHADOW_Z = 0.005;

    private readonly STRIKER_SHADOW_OFFSET_X = 0.06;
    private readonly STRIKER_SHADOW_OFFSET_Y = -0.09;
    private readonly STRIKER_SHADOW_Z = 0.006;

    // Coins & Striker
    private striker!: Circle;
    private strikerShadow!: Circle;
    private strikerOuterRing!: Circle;
    private strikerInner!: Circle;
    private strikerCore!: Circle;
    private strikerPip!: Circle;
    private strikerBodyComp!: RigidBody2DComponent;
    private strikerCollectGlow!: Circle;
    private strikerX: number = 0;
    private isStrikerOnBoard: boolean = true;

    // Return to mouse animation state
    private isReturningToMouse: boolean = false;
    private returnAnimProgress: number = 0;
    private returnAnimDuration: number = 0.45;
    private returnAnimStartX: number = 0;
    private returnAnimStartY: number = 0;
    private currentMouseWorldX: number = 0;
    private lastPottedPos: { x: number; y: number } = { x: 0, y: -8.0 };

    private coins: CarromCoin[] = [];
    private pockets: PocketInfo[] = [];

    // Interaction
    private isAiming: boolean = false;
    private isDraggingStriker: boolean = false;
    private dragStartWorld: Vec3 = new Vec3();
    private dragCurrentWorld: Vec3 = new Vec3();
    private aimLine!: Line;
    private trajectoryDots: Circle[] = [];

    // Game Modes & Turn State
    // Modes: 'vs_ai' (Human vs AI) | 'pass_and_play' (2 Local Humans) | 'solo' (Solo Practice)
    private gameMode: 'vs_ai' | 'pass_and_play' | 'solo' = 'vs_ai';
    private currentTurn: 'player' | 'ai' = 'player';
    private aiDifficulty: AIDifficulty = 'expert';

    // First-Hit / Pre-Break Customization State
    private playerColor: 'white' | 'black' = 'white';
    private aiColor: 'white' | 'black' = 'black';
    private breakerFirst: 'player' | 'ai' = 'player';
    private strikerTheme: StrikerTheme = 'ivory';
    private rosetteAngleDeg: number = 0;
    private isSetupPanelOpen: boolean = false;
    private activeSetupTab: 'setup' | 'physics' = 'setup';

    // Physics Customization
    private strikerWeight: number = 4.5;
    private coinWeight: number = 1.8;
    private boardFriction: number = 0.05;
    private boardLinearDamping: number = 1.0;
    private strikeForceMultiplier: number = 1.0;
    private manualPickThreshold: number = 0.45;

    // Game States: 'positioning' | 'aiming' | 'rolling' | 'ai_thinking' | 'ai_aiming' | 'gameover'
    private gameState: 'positioning' | 'aiming' | 'rolling' | 'ai_thinking' | 'ai_aiming' | 'gameover' = 'positioning';
    private framesInRoll: number = 0;
    private quietRollFrames: number = 0;
    private canPickStrikerManually: boolean = false;
    private aiQuietPickFrames: number = 0;

    // Scoring & Stats
    private score: number = 0;          // Player 1 (Human) score
    private playerScore: number = 0;    // Human score (White pieces)
    private aiScore: number = 0;        // AI Opponent score (Black pieces)
    private shotsTaken: number = 0;     // Total shots
    private playerShotsTaken: number = 0;
    private aiShotsTaken: number = 0;
    private queenPocketed: boolean = false;
    private queenCapturedBy: 'none' | 'player' | 'ai' = 'none';
    private whiteCoinsLeft: number = 9;
    private blackCoinsLeft: number = 9;
    private winner: 'player' | 'ai' | 'tie' | null = null;

    // Shot Settlement Tracking
    private pottedThisShot: CarromCoin[] = [];
    private strikerFoulThisShot: boolean = false;

    // AI Execution Timers
    private aiThinkingTimer: any = null;
    private aiAimingTimer: any = null;
    private currentAIPlan: AIShotPlan | null = null;

    // UI Overlay
    private uiContainer?: HTMLDivElement;

    public async run() {
        this.disablePlayer();
        this.ALWAYS_UPDATE = true;
        this.clearColor(hex("#0B0C10"));
        this.camera.position.set([0, 0, 32]);
        this.camera.toOrtho();
        frameStage(this, 32, 40);
        this.clearColor(hex("#0B0C10"));

        // 1. Initialize 2D Physics with Zero Gravity and Talcum-Powder Table Drag
        this.physics = new Physics2D(this, {
            backend: 'planck',
            gravity: [0, 0],
            timeStep: 1 / 60
        });

        // 2. Setup Physics-Based Collision Audio Feedback
        this.physics.on('collisionStart', (evt) => {
            const compA = evt.componentA;
            const compB = evt.componentB;
            if (!compA?.body || !compB?.body) return;

            const hasStriker = (
                compA === this.strikerBodyComp ||
                compB === this.strikerBodyComp ||
                evt.entityA === this.striker ||
                evt.entityB === this.striker
            );
            const isCushion = !compA.body.isDynamic?.() || !compB.body.isDynamic?.();

            const p = this.computeCollisionPhysics(compA, compB, hasStriker, isCushion);

            if (isCushion) {
                // Cushion rebound: normal impact or fast acute-angle rail sweep
                if (p.vNormal > 0.10 || (p.relSpeed > 0.30 && p.glancingFactor > 0.70)) {
                    if (hasStriker) {
                        this.soundEffects.playStrikerCushion(p);
                    } else {
                        this.soundEffects.playCoinCushion(p);
                    }
                }
            } else {
                // Dynamic piece collision: normal impact compression or tangential friction shear
                if (p.vNormal > 0.08 || (p.relSpeed > 0.20 && p.glancingFactor > 0.60)) {
                    if (hasStriker) {
                        this.soundEffects.playStrikerCoinHit(p);
                    } else {
                        this.soundEffects.playCoinCoinHit(p);
                    }
                }
            }
        });

        // 3. Build Minimalist Carrom Board
        this.createBoard();

        // 4. Spawn Classic Carrom Pieces Rosette (Queen + 9 White + 9 Black)
        this.spawnRosette();

        // 5. Create Striker
        this.createStriker();

        // 6. Create Trajectory & Aiming Visuals
        this.createAimingAids();

        // 7. Mount Minimalist Glassmorphism UI
        this.createUI();

        // 8. Wire Interactive Pointer Controls
        this.setupPointerControls();

        // 9. Main Game Loop (Pocket Sink Checking, Settling Detection, Turn Transitions)
        this.always(() => {
            this.updateGameLoop();
        }, { phase: 'post' });
    }

    /**
     * Extracts full 2D collision dynamics (normal velocity, tangential slip,
     * reduced mass, normal impulse, glancing factor, and surface friction)
     * according to Newtonian and Hertzian contact mechanics.
     */
    private computeCollisionPhysics(
        compA: RigidBody2DComponent,
        compB: RigidBody2DComponent,
        hasStriker: boolean,
        isCushion: boolean
    ): CollisionPhysicsData {
        const bA = compA.body;
        const bB = compB.body;

        const isDynamicA = bA?.isDynamic?.() ?? true;
        const isDynamicB = bB?.isDynamic?.() ?? true;

        if (isCushion) {
            // One body is the static frame rail
            const dynamicBody = isDynamicA ? bA : bB;
            const pos = dynamicBody?.getPosition?.() ?? { x: 0, y: 0 };
            const vel = dynamicBody?.getLinearVelocity?.() ?? { x: 0, y: 0 };
            const m = Math.max(0.4, dynamicBody?.getMass?.() ?? (hasStriker ? this.strikerWeight : this.coinWeight));

            // Determine if rail is horizontal (top/bottom) or vertical (left/right)
            const isHorizontalRail = Math.abs(pos.y) >= Math.abs(pos.x);
            const vNormal = Math.max(0.01, isHorizontalRail ? Math.abs(vel.y) : Math.abs(vel.x));
            const vTangential = isHorizontalRail ? Math.abs(vel.x) : Math.abs(vel.y);
            const relSpeed = Math.hypot(vel.x, vel.y);

            const glancingFactor = vTangential / Math.max(vNormal + vTangential, 0.001);
            const normalImpulse = (1 + 0.93) * m * vNormal;

            return {
                vNormal,
                vTangential,
                relSpeed,
                reducedMass: m,
                mass1: m,
                mass2: 100.0, // Static wooden frame rail
                normalImpulse,
                glancingFactor,
                boardFriction: this.boardFriction,
                contactFriction: 0.02
            };
        }

        // Both bodies are dynamic (striker-coin or coin-coin)
        const posA = bA?.getPosition?.() ?? { x: 0, y: 0 };
        const posB = bB?.getPosition?.() ?? { x: 0, y: 0 };
        const velA = bA?.getLinearVelocity?.() ?? { x: 0, y: 0 };
        const velB = bB?.getLinearVelocity?.() ?? { x: 0, y: 0 };

        const mA = Math.max(0.3, bA?.getMass?.() ?? (compA === this.strikerBodyComp ? this.strikerWeight : this.coinWeight));
        const mB = Math.max(0.3, bB?.getMass?.() ?? (compB === this.strikerBodyComp ? this.strikerWeight : this.coinWeight));
        const reducedMass = (mA * mB) / (mA + mB);

        // Contact normal unit vector pointing from A to B
        let nx = posB.x - posA.x;
        let ny = posB.y - posA.y;
        const dist = Math.hypot(nx, ny);
        if (dist > 1e-4) {
            nx /= dist;
            ny /= dist;
        } else {
            nx = 1;
            ny = 0;
        }

        // Relative velocity Delta v = vA - vB
        const dvx = velA.x - velB.x;
        const dvy = velA.y - velB.y;
        const relSpeed = Math.hypot(dvx, dvy);

        // Normal relative velocity (compression speed along line of centers)
        const vNormalSigned = dvx * nx + dvy * ny;
        const vNormal = Math.max(0.01, Math.abs(vNormalSigned));

        // Tangential relative velocity (orthogonal slip speed)
        const vTangentialSigned = dvx * (-ny) + dvy * nx;
        const vTangential = Math.abs(vTangentialSigned);

        const glancingFactor = vTangential / Math.max(vNormal + vTangential, 0.001);
        const normalImpulse = (1 + 0.90) * reducedMass * vNormal;

        // If body A is the striker, pass mA as mass1, otherwise if B is striker pass mB as mass1
        const strikerFirst = compA === this.strikerBodyComp;
        const mass1 = strikerFirst ? mA : mB;
        const mass2 = strikerFirst ? mB : mA;

        return {
            vNormal,
            vTangential,
            relSpeed,
            reducedMass,
            mass1,
            mass2,
            normalImpulse,
            glancingFactor,
            boardFriction: this.boardFriction,
            contactFriction: Math.max(0.01, this.boardFriction)
        };
    }

    /**
     * Builds the luxury tournament-grade Carrom board:
     * - Deep rosewood frame with brass chamfer inlay & corner brackets
     * - Warm polished birch ivory playing surface
     * - Multi-layered soft drop shadows for physical elevation
     * - Authentic laser-etched rosette, baselines, and pocket arrows
     * - 4 corner pockets with polished brass bezels & velvet wells
     */
    /**
     * Builds the luxury tournament-grade Carrom board:
     * - Solid, monolithic Rosewood hardwood frame with warm satin sheen
     * - Authentic 45° corner mitre joints crafted into all four corners
     * - Warm polished birch ivory playing surface with recessed inner frame shadow
     * - Multi-layered soft drop shadows for physical elevation off the table
     * - Tournament-spec contoured cushion strips with corner pocket openings
     * - 4 corner pockets with polished brass bezels & velvet wells
     */
    private createBoard(): void {
        const boardHalf = this.HALF_BOARD;

        // 0. Ambient Table / Felt Surround (fills the scene behind the board)
        const tableSurface = new Rect(70.0, 70.0);
        tableSurface.transform.position = new Vec3(0, 0, -0.1);
        tableSurface.paint.fill = hex("#0E1015"); // Deep studio dark slate
        tableSurface.z_index = -0.1;
        this.add(tableSurface);

        // Ambient Board Drop Shadow (multi-layered soft shadow for physical lift)
        const boardShadowSoft = new Rect(27.6, 27.6);
        boardShadowSoft.transform.position = new Vec3(0.15, -0.25, -0.09);
        boardShadowSoft.paint.fill = new Color(0, 0, 0, 0.32);
        boardShadowSoft.z_index = -0.09;
        this.add(boardShadowSoft);

        const boardShadowTight = new Rect(26.6, 26.6);
        boardShadowTight.transform.position = new Vec3(0.08, -0.12, -0.08);
        boardShadowTight.paint.fill = new Color(0, 0, 0, 0.48);
        boardShadowTight.z_index = -0.08;
        this.add(boardShadowTight);

        // 1. Solid Master-Crafted Hardwood Frame (Slim, elegant tournament-proportions)
        // Base Rosewood / Sheesham Outer Beam
        const outerFrame = new Rect(26.2, 26.2);
        outerFrame.transform.position = new Vec3(0, 0, -0.06);
        outerFrame.paint.fill = hex("#1C120C"); // Deep Rosewood
        outerFrame.paint.stroke = hex("#382316"); // Subtle outer chamfer highlight
        outerFrame.paint.strokeWidth = 0.06;
        outerFrame.z_index = -0.06;
        this.add(outerFrame);

        // Warm Satin Wood Body (gives wood depth and grain warmth)
        const frameBody = new Rect(25.8, 25.8);
        frameBody.transform.position = new Vec3(0, 0, -0.05);
        frameBody.paint.fill = hex("#251810"); // Warm Mahogany / Sheesham
        frameBody.z_index = -0.05;
        this.add(frameBody);

        // Authentic 45° Corner Mitre Joints (Carpentry seams at all 4 corners)
        const createMitreSeam = (cx: number, cy: number, rot: number) => {
            const mitreLen = 1.55;
            const seam = new Rect(mitreLen, 0.035);
            seam.transform.position = new Vec3(cx, cy, -0.045);
            seam.transform.setRotationZ(rot);
            seam.paint.fill = hex("#0E0905"); // Recessed joint groove
            seam.z_index = -0.045;
            this.add(seam);
        };

        createMitreSeam(12.55, 12.55, Math.PI / 4);   // Top-Right
        createMitreSeam(-12.55, 12.55, -Math.PI / 4); // Top-Left
        createMitreSeam(-12.55, -12.55, Math.PI / 4); // Bottom-Left
        createMitreSeam(12.55, -12.55, -Math.PI / 4); // Bottom-Right

        // 2. Playing Surface: Warm Polished Birch Ivory
        const surface = new Rect(this.BOARD_SIZE, this.BOARD_SIZE);
        surface.transform.position = new Vec3(0, 0, -0.03);
        surface.paint.fill = hex("#F4ECE1"); // Warm Birch Natural Ivory
        surface.z_index = -0.03;
        this.add(surface);

        // Frame Inner Recessed Shadow (where playing surface meets the wood border)
        const innerShadow = new Rect(this.BOARD_SIZE, this.BOARD_SIZE);
        innerShadow.transform.position = new Vec3(0, 0, -0.028);
        innerShadow.paint.fill = new Color(0, 0, 0, 0);
        innerShadow.paint.stroke = hex("#4A3728");
        innerShadow.paint.strokeWidth = 0.06;
        innerShadow.z_index = -0.028;
        this.add(innerShadow);

        // Playing Surface Border Inlay Lines
        const surfaceOuterBorder = new Rect(23.4, 23.4);
        surfaceOuterBorder.transform.position = new Vec3(0, 0, -0.025);
        surfaceOuterBorder.paint.fill = new Color(0, 0, 0, 0);
        surfaceOuterBorder.paint.stroke = hex("#7D6752");
        surfaceOuterBorder.paint.strokeWidth = 0.08;
        surfaceOuterBorder.z_index = -0.025;
        this.add(surfaceOuterBorder);

        const surfaceInnerBorder = new Rect(23.0, 23.0);
        surfaceInnerBorder.transform.position = new Vec3(0, 0, -0.025);
        surfaceInnerBorder.paint.fill = new Color(0, 0, 0, 0);
        surfaceInnerBorder.paint.stroke = hex("#A69380");
        surfaceInnerBorder.paint.strokeWidth = 0.05;
        surfaceInnerBorder.z_index = -0.025;
        this.add(surfaceInnerBorder);

        // 3. Crisp Board Markings
        this.createBoardMarkings();

        // 4. Corner Pockets
        this.pockets = [
            { x: -this.POCKET_POS, y: -this.POCKET_POS, radius: this.POCKET_RADIUS },
            { x: this.POCKET_POS, y: -this.POCKET_POS, radius: this.POCKET_RADIUS },
            { x: -this.POCKET_POS, y: this.POCKET_POS, radius: this.POCKET_RADIUS },
            { x: this.POCKET_POS, y: this.POCKET_POS, radius: this.POCKET_RADIUS },
        ];

        for (const p of this.pockets) {
            // Brass bezel lip (above surface z so it cuts cleanly into the playing surface)
            const bezel = new Circle(p.radius + 0.08);
            bezel.transform.position = new Vec3(p.x, p.y, -0.022);
            bezel.paint.fill = hex("#C9A86A");
            bezel.z_index = -0.022;
            this.add(bezel);

            // Pocket hole
            const hole = new Circle(p.radius);
            hole.transform.position = new Vec3(p.x, p.y, -0.021);
            hole.paint.fill = hex("#050607");
            hole.z_index = -0.021;
            this.add(hole);

            // Subtle depth ring
            const netRing = new Circle(p.radius * 0.55);
            netRing.transform.position = new Vec3(p.x, p.y, -0.020);
            netRing.paint.fill = new Color(0, 0, 0, 0);
            netRing.paint.stroke = hex("#151820");
            netRing.paint.strokeWidth = 0.035;
            netRing.z_index = -0.020;
            this.add(netRing);
        }

        // Frame border overlay — rendered ABOVE pockets so the wooden frame covers pocket edges
        // Uses stroke-only rects (transparent center) to only cover the border area
        const frameBodyOverlay = new Rect(24.9, 24.9);
        frameBodyOverlay.transform.position = new Vec3(0, 0, -0.016);
        frameBodyOverlay.paint.fill = new Color(0, 0, 0, 0);
        frameBodyOverlay.paint.stroke = hex("#251810"); // Frame body color
        frameBodyOverlay.paint.strokeWidth = 0.9;
        frameBodyOverlay.z_index = -0.016;
        this.add(frameBodyOverlay);

        const outerFrameOverlay = new Rect(26.0, 26.0);
        outerFrameOverlay.transform.position = new Vec3(0, 0, -0.015);
        outerFrameOverlay.paint.fill = new Color(0, 0, 0, 0);
        outerFrameOverlay.paint.stroke = hex("#1C120C"); // Outer frame color
        outerFrameOverlay.paint.strokeWidth = 0.2;
        outerFrameOverlay.z_index = -0.015;
        this.add(outerFrameOverlay);

        // 5. Four Solid Rebound Rails (Physics + Cushion Rubber Strips)
        const railThickness = 1.0;
        const railLength = this.BOARD_SIZE;
        const railFriction = 0.02;
        const railRestitution = 0.93;

        const createRail = (x: number, y: number, w: number, h: number) => {
            const rail = new Rect(w, h);
            rail.transform.position = new Vec3(x, y, 0);
            // Invisible physics collision body (visuals handled by solid hardwood frame and cushions)
            rail.paint.fill = new Color(0, 0, 0, 0);
            rail.paint.stroke = new Color(0, 0, 0, 0);
            rail.paint.strokeWidth = 0;
            rail.z_index = 0.02;
            this.physics.add(rail, {
                type: 'static',
                friction: railFriction,
                restitution: railRestitution
            });
        };

        createRail(0, boardHalf + railThickness / 2, railLength + 2, railThickness);  // Top
        createRail(0, -boardHalf - railThickness / 2, railLength + 2, railThickness); // Bottom
        createRail(-boardHalf - railThickness / 2, 0, railThickness, railLength + 2); // Left
        createRail(boardHalf + railThickness / 2, 0, railThickness, railLength + 2);  // Right

        // Tournament Cushion Rubber Strips (The responsive rebound face along the inner edge)
        const cushionSpan = 19.8;
        const cushionDepth = 0.24;

        const createCushionFace = (cx: number, cy: number, cw: number, ch: number) => {
            const cFace = new Rect(cw, ch);
            cFace.transform.position = new Vec3(cx, cy, 0.025);
            cFace.paint.fill = hex("#251B14"); // Dense vulcanized rubber strip
            cFace.paint.stroke = hex("#3E2D20"); // Cushion nose bevel highlight
            cFace.paint.strokeWidth = 0.03;
            cFace.z_index = 0.025;
            this.add(cFace);
        };

        createCushionFace(0, boardHalf + cushionDepth / 2, cushionSpan, cushionDepth);   // Top cushion
        createCushionFace(0, -boardHalf - cushionDepth / 2, cushionSpan, cushionDepth);  // Bottom cushion
        createCushionFace(-boardHalf - cushionDepth / 2, 0, cushionDepth, cushionSpan);  // Left cushion
        createCushionFace(boardHalf + cushionDepth / 2, 0, cushionDepth, cushionSpan);   // Right cushion
    }

    /**
     * Subtle, authentic laser-etched markings on the board surface:
     * - Concentric center rings ("The Rose") with decorative rays
     * - Four baselines with solid crimson & white circular terminal end-stops
     * - Elegant diagonal arrows pointing towards each pocket
     */
    private createBoardMarkings(): void {
        const lineColor = hex("#4A3728"); // Rich dark wood-burned etch
        const subLineColor = hex("#7D6752"); // Medium warm taupe etch
        const accentRed = hex("#DC2626"); // Carrom crimson
        const accentGold = hex("#D97706"); // Warm gold
        const centerGray = hex("#8E8E93"); // Refined soft gray for center concentric rings

        // 1. Center Concentric Circles (Refined, subtle soft-gray tournament circles)
        // Outer Rosette Boundary Ring (Framing the 19 starting pieces)
        const outerCircle = new Circle(2.68);
        outerCircle.transform.position = new Vec3(0, 0, -0.02);
        outerCircle.paint.fill = new Color(0, 0, 0, 0);
        outerCircle.paint.stroke = centerGray;
        outerCircle.paint.strokeWidth = 0.05;
        outerCircle.z_index = -0.02;
        this.add(outerCircle);

        // Middle Concentric Ring (Between inner and outer coin rings)
        const midRing = new Circle(1.95);
        midRing.transform.position = new Vec3(0, 0, -0.02);
        midRing.paint.fill = new Color(0, 0, 0, 0);
        midRing.paint.stroke = centerGray;
        midRing.paint.strokeWidth = 0.04;
        midRing.z_index = -0.02;
        this.add(midRing);

        // Inner Accent Ring (Framing inner coin ring)
        const innerRing = new Circle(1.20);
        innerRing.transform.position = new Vec3(0, 0, -0.02);
        innerRing.paint.fill = new Color(0, 0, 0, 0);
        innerRing.paint.stroke = centerGray;
        innerRing.paint.strokeWidth = 0.04;
        innerRing.z_index = -0.02;
        this.add(innerRing);

        // Center Queen's Circle (Official placement circle for the Queen)
        const queenCircle = new Circle(0.52);
        queenCircle.transform.position = new Vec3(0, 0, -0.02);
        queenCircle.paint.fill = new Color(0, 0, 0, 0);
        queenCircle.paint.stroke = centerGray;
        queenCircle.paint.strokeWidth = 0.045;
        queenCircle.z_index = -0.02;
        this.add(queenCircle);

        // Center Pip
        const centerDot = new Circle(0.10);
        centerDot.transform.position = new Vec3(0, 0, -0.02);
        centerDot.paint.fill = centerGray;
        centerDot.z_index = -0.02;
        this.add(centerDot);

        // 2. Baselines with Official ICF Tournament Base Circles
        const createBaseline = (axisPos: number, isHorizontal: boolean) => {
            const length = 13.5;
            const halfL = length / 2;
            const baseCircleRadius = 0.38; // Official 3.18cm scale
            const innerRedRadius = 0.26;   // Official 2.54cm scale red portion
            const lineHalfSpacing = baseCircleRadius; // Tangent to base circle

            if (isHorizontal) {
                // Inner parallel baseline
                const baseInner = new Rect(length, 0.075);
                const innerY = axisPos > 0 ? axisPos - lineHalfSpacing : axisPos + lineHalfSpacing;
                baseInner.transform.position = new Vec3(0, innerY, -0.02);
                baseInner.paint.fill = lineColor;
                baseInner.z_index = -0.02;
                this.add(baseInner);

                // Outer parallel baseline
                const baseOuter = new Rect(length, 0.075);
                const outerY = axisPos > 0 ? axisPos + lineHalfSpacing : axisPos - lineHalfSpacing;
                baseOuter.transform.position = new Vec3(0, outerY, -0.02);
                baseOuter.paint.fill = lineColor;
                baseOuter.z_index = -0.02;
                this.add(baseOuter);
            } else {
                // Vertical baselines
                const baseInner = new Rect(0.075, length);
                const innerX = axisPos > 0 ? axisPos - lineHalfSpacing : axisPos + lineHalfSpacing;
                baseInner.transform.position = new Vec3(innerX, 0, -0.02);
                baseInner.paint.fill = lineColor;
                baseInner.z_index = -0.02;
                this.add(baseInner);

                const baseOuter = new Rect(0.075, length);
                const outerX = axisPos > 0 ? axisPos + lineHalfSpacing : axisPos - lineHalfSpacing;
                baseOuter.transform.position = new Vec3(outerX, 0, -0.02);
                baseOuter.paint.fill = lineColor;
                baseOuter.z_index = -0.02;
                this.add(baseOuter);
            }

            // Official Base Circles (Tangent outer circle with red circular interior disc)
            const c1Pos = isHorizontal ? [-halfL, axisPos] : [axisPos, -halfL];
            const c2Pos = isHorizontal ? [halfL, axisPos] : [axisPos, halfL];

            const createBaseCircle = (x: number, y: number) => {
                // Outer circle outline touching both baseline rails
                const outerC = new Circle(baseCircleRadius);
                outerC.transform.position = new Vec3(x, y, -0.018);
                outerC.paint.fill = new Color(0, 0, 0, 0);
                outerC.paint.stroke = lineColor;
                outerC.paint.strokeWidth = 0.05;
                outerC.z_index = -0.018;
                this.add(outerC);

                // Flat red interior circle (Official 2.54cm carrom portion)
                const redDisc = new Circle(innerRedRadius);
                redDisc.transform.position = new Vec3(x, y, -0.017);
                redDisc.paint.fill = hex("#C62828"); // Flat official crimson
                redDisc.z_index = -0.017;
                this.add(redDisc);
            };

            createBaseCircle(c1Pos[0], c1Pos[1]);
            createBaseCircle(c2Pos[0], c2Pos[1]);
        };

        createBaseline(this.BASELINE_Y, true);  // Player Bottom Baseline
        createBaseline(-this.BASELINE_Y, true); // Opponent Top Baseline
        createBaseline(this.BASELINE_Y, false); // Left Baseline
        createBaseline(-this.BASELINE_Y, false);// Right Baseline

        // 3. Official Diagonal Pocket Arrows (Classic 45° black arrow passing between base circles)
        const drawPointerArrow = (sx: number, sy: number, ex: number, ey: number) => {
            const dx = ex - sx;
            const dy = ey - sy;
            const dist = Math.hypot(dx, dy);
            const angle = Math.atan2(dy, dx);

            // Main arrow shaft
            const shaft = new Rect(dist, 0.075);
            shaft.transform.position = new Vec3((sx + ex) / 2, (sy + ey) / 2, -0.02);
            shaft.transform.setRotationZ(angle);
            shaft.paint.fill = lineColor;
            shaft.z_index = -0.02;
            this.add(shaft);

            // Origin circle at base of arrow
            const originOuter = new Circle(0.32);
            originOuter.transform.position = new Vec3(sx, sy, -0.018);
            originOuter.paint.fill = new Color(0, 0, 0, 0);
            originOuter.paint.stroke = lineColor;
            originOuter.paint.strokeWidth = 0.045;
            originOuter.z_index = -0.018;
            this.add(originOuter);

            const originRed = new Circle(0.22);
            originRed.transform.position = new Vec3(sx, sy, -0.017);
            originRed.paint.fill = hex("#C62828");
            originRed.z_index = -0.017;
            this.add(originRed);

            // Classic sharp black arrowhead pointing directly to pocket
            const wingLen = 0.80;
            const wingAngle = 0.52; // ~30 degrees from shaft

            // Wing 1
            const dir1 = angle + Math.PI - wingAngle;
            const cx1 = ex + Math.cos(dir1) * wingLen * 0.5;
            const cy1 = ey + Math.sin(dir1) * wingLen * 0.5;
            const wing1 = new Rect(wingLen, 0.075);
            wing1.transform.position = new Vec3(cx1, cy1, -0.02);
            wing1.transform.setRotationZ(dir1);
            wing1.paint.fill = lineColor;
            wing1.z_index = -0.02;
            this.add(wing1);

            // Wing 2
            const dir2 = angle + Math.PI + wingAngle;
            const cx2 = ex + Math.cos(dir2) * wingLen * 0.5;
            const cy2 = ey + Math.sin(dir2) * wingLen * 0.5;
            const wing2 = new Rect(wingLen, 0.075);
            wing2.transform.position = new Vec3(cx2, cy2, -0.02);
            wing2.transform.setRotationZ(dir2);
            wing2.paint.fill = lineColor;
            wing2.z_index = -0.02;
            this.add(wing2);
        };

        drawPointerArrow(-3.5, -3.5, -9.1, -9.1);
        drawPointerArrow(3.5, -3.5, 9.1, -9.1);
        drawPointerArrow(-3.5, 3.5, -9.1, 9.1);
        drawPointerArrow(3.5, 3.5, 9.1, 9.1);
    }

    /**
     * Spawns the authentic Carrom Rosette:
     * - Center: Queen (Red, 25 pts)
     * - Inner Ring: 6 alternating coins (3 White, 3 Black)
     * - Outer Ring: 12 alternating coins (6 White, 6 Black)
     * Total: 19 coins with realistic smooth table glide damping.
     */
    private spawnRosette(rotationRad: number = 0): void {
        const coinRadius = this.COIN_RADIUS;
        const mass = this.coinWeight;             // Customized coin mass
        const friction = this.boardFriction;
        const restitution = 0.88;
        const linearDamping = this.boardLinearDamping;
        const angularDamping = 1.2;

        // 1. Queen (Center)
        const queen = this.createCoinEntity(0, 0, 'queen');
        const queenBody = this.physics.add(queen.entity, {
            type: 'dynamic',
            mass: mass * 1.05,
            friction,
            restitution,
            linearDamping,
            angularDamping,
            lockRotation: true
        });
        this.coins.push({
            entity: queen.entity,
            shadow: queen.shadow,
            innerRing: queen.innerRing,
            core: queen.core,
            bodyComp: queenBody,
            type: 'queen',
            points: 25,
            potted: false,
            sinkScale: 1.0
        });

        // 2. Inner Ring: 6 Coins
        const r1 = coinRadius * 2 + 0.03;
        const innerPattern: ('white' | 'black')[] = [
            'white', 'black', 'white', 'black', 'white', 'black'
        ];
        for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI) / 3 + rotationRad;
            const x = Math.cos(angle) * r1;
            const y = Math.sin(angle) * r1;
            const type = innerPattern[i];

            const coin = this.createCoinEntity(x, y, type);
            const comp = this.physics.add(coin.entity, {
                type: 'dynamic',
                mass,
                friction,
                restitution,
                linearDamping,
                angularDamping,
                lockRotation: true
            });
            this.coins.push({
                entity: coin.entity,
                shadow: coin.shadow,
                innerRing: coin.innerRing,
                bodyComp: comp,
                type,
                points: type === 'white' ? 10 : 5,
                potted: false,
                sinkScale: 1.0
            });
        }

        // 3. Outer Ring: 12 Coins (Alternating White & Black)
        const r2 = coinRadius * 4 + 0.06;
        const r2Mid = coinRadius * 2 * Math.sqrt(3) + 0.04;
        for (let i = 0; i < 12; i++) {
            const isVertex = i % 2 === 0;
            const dist = isVertex ? r2 : r2Mid;
            const angle = (i * Math.PI) / 6 + rotationRad;
            const x = Math.cos(angle) * dist;
            const y = Math.sin(angle) * dist;
            const type: 'white' | 'black' = i % 2 === 0 ? 'black' : 'white';

            const coin = this.createCoinEntity(x, y, type);
            const comp = this.physics.add(coin.entity, {
                type: 'dynamic',
                mass,
                friction,
                restitution,
                linearDamping,
                angularDamping,
                lockRotation: true
            });
            this.coins.push({
                entity: coin.entity,
                shadow: coin.shadow,
                innerRing: coin.innerRing,
                bodyComp: comp,
                type,
                points: type === 'white' ? 10 : 5,
                potted: false,
                sinkScale: 1.0
            });
        }
    }

    /**
     * Rotates the entire coin rosette in real-time during pre-break setup.
     */
    public setRosetteRotation(deg: number): void {
        if (this.shotsTaken > 0) return; // Only permitted before first hit
        this.rosetteAngleDeg = ((deg % 360) + 360) % 360;
        const rotRad = (this.rosetteAngleDeg * Math.PI) / 180;
        const coinRadius = this.COIN_RADIUS;

        // Inner Ring (coins 1..6)
        const r1 = coinRadius * 2 + 0.03;
        for (let i = 0; i < 6; i++) {
            const coinIdx = 1 + i;
            const coin = this.coins[coinIdx];
            if (!coin || coin.potted) continue;
            const angle = (i * Math.PI) / 3 + rotRad;
            const x = Math.cos(angle) * r1;
            const y = Math.sin(angle) * r1;
            this.updateCoinPosition(coin, x, y);
        }

        // Outer Ring (coins 7..18)
        const r2 = coinRadius * 4 + 0.06;
        const r2Mid = coinRadius * 2 * Math.sqrt(3) + 0.04;
        for (let i = 0; i < 12; i++) {
            const coinIdx = 7 + i;
            const coin = this.coins[coinIdx];
            if (!coin || coin.potted) continue;
            const isVertex = i % 2 === 0;
            const dist = isVertex ? r2 : r2Mid;
            const angle = (i * Math.PI) / 6 + rotRad;
            const x = Math.cos(angle) * dist;
            const y = Math.sin(angle) * dist;
            this.updateCoinPosition(coin, x, y);
        }
    }

    private updateCoinPosition(coin: CarromCoin, x: number, y: number): void {
        coin.entity.transform.position.set([x, y, 0.01]);
        if (coin.shadow) coin.shadow.transform.position.set([x + this.COIN_SHADOW_OFFSET_X, y + this.COIN_SHADOW_OFFSET_Y, this.COIN_SHADOW_Z]);
        if (coin.innerRing) coin.innerRing.transform.position.set([x, y, 0.015]);
        if (coin.core) coin.core.transform.position.set([x, y, 0.016]);

        if (coin.bodyComp?.body) {
            const b = coin.bodyComp.body as any;
            if (typeof b.setPosition === 'function') {
                b.setPosition({ x, y });
            }
            if (typeof b.setLinearVelocity === 'function') {
                b.setLinearVelocity({ x: 0, y: 0 });
            }
            if (typeof b.setAngularVelocity === 'function') {
                b.setAngularVelocity(0);
            }
        }
    }

    public setPlayerColor(color: 'white' | 'black'): void {
        if (this.shotsTaken > 0) return;
        this.playerColor = color;
        this.aiColor = color === 'white' ? 'black' : 'white';
        this.updateUI();
    }

    public setFirstBreaker(breaker: 'player' | 'ai'): void {
        if (this.shotsTaken > 0) return;
        this.breakerFirst = breaker;
        this.currentTurn = breaker;
        this.updateStrikerStyleForTurn(breaker);
        this.resetStrikerToBaseline(0);
        this.updateUI();
    }

    public setStrikerTheme(theme: StrikerTheme): void {
        this.strikerTheme = theme;
        this.updateStrikerStyleForTurn(this.currentTurn);
        this.updateUI();
    }

    public setStrikerWeight(weight: number): void {
        if (this.shotsTaken > 0) return;
        this.strikerWeight = Math.max(2.5, Math.min(6.5, weight));
        const body = this.strikerBodyComp?.body as any;
        if (body?.setMassData) {
            const radius = this.STRIKER_RADIUS;
            const I = 0.5 * this.strikerWeight * radius * radius;
            body.setMassData({ mass: this.strikerWeight, center: { x: 0, y: 0 }, I });
        }
        this.updateUI();
    }

    public setCoinWeight(weight: number): void {
        if (this.shotsTaken > 0) return;
        this.coinWeight = Math.max(1.0, Math.min(2.8, weight));
        for (const coin of this.coins) {
            const body = coin.bodyComp?.body as any;
            if (body?.setMassData) {
                const m = coin.type === 'queen' ? this.coinWeight * 1.05 : this.coinWeight;
                const radius = this.COIN_RADIUS;
                const I = 0.5 * m * radius * radius;
                body.setMassData({ mass: m, center: { x: 0, y: 0 }, I });
            }
        }
        this.updateUI();
    }

    public setBoardFriction(friction: number, damping?: number): void {
        if (this.shotsTaken > 0) return;
        this.boardFriction = Math.max(0.01, Math.min(0.15, friction));
        const computedDamping = damping !== undefined ? damping : Math.max(0.4, Math.min(2.0, 0.4 + (this.boardFriction / 0.10) * 1.1));
        this.boardLinearDamping = computedDamping;

        // Update active striker body
        const sBody = this.strikerBodyComp?.body as any;
        if (sBody) {
            if (typeof sBody.setLinearDamping === 'function') sBody.setLinearDamping(this.boardLinearDamping);
            for (let f = sBody.getFixtureList?.(); f; f = f.getNext?.()) {
                if (typeof f.setFriction === 'function') f.setFriction(this.boardFriction);
            }
        }
        // Update all coin bodies
        for (const coin of this.coins) {
            const cBody = coin.bodyComp?.body as any;
            if (cBody) {
                if (typeof cBody.setLinearDamping === 'function') cBody.setLinearDamping(this.boardLinearDamping);
                for (let f = cBody.getFixtureList?.(); f; f = f.getNext?.()) {
                    if (typeof f.setFriction === 'function') f.setFriction(this.boardFriction);
                }
            }
        }
        this.updateUI();
    }

    public setStrikeForceMultiplier(mult: number): void {
        if (this.shotsTaken > 0) return;
        this.strikeForceMultiplier = Math.max(0.5, Math.min(5.0, mult));
        this.updateUI();
    }

    public setActiveSetupTab(tab: 'setup' | 'physics'): void {
        this.activeSetupTab = tab;
        this.updateUI();
    }

    private createCoinEntity(x: number, y: number, type: 'white' | 'black' | 'queen') {
        const radius = this.COIN_RADIUS;

        // Soft physical drop shadow under coin (warm ambient wood contact occlusion + penumbra)
        const shadow = new Circle(radius * 1.0);
        shadow.transform.position = new Vec3(x + this.COIN_SHADOW_OFFSET_X, y + this.COIN_SHADOW_OFFSET_Y, this.COIN_SHADOW_Z);
        shadow.paint.fill = new Color(0.06, 0.04, 0.02, 0.28);
        shadow.paint.stroke = new Color(0.06, 0.04, 0.02, 0.14);
        shadow.paint.strokeWidth = 0.035;
        shadow.z_index = this.COIN_SHADOW_Z;
        this.add(shadow);

        const entity = new Circle(radius);
        entity.transform.position = new Vec3(x, y, 0.01);
        entity.z_index = 0.01;

        let innerRing: Circle | undefined;
        let core: Circle | undefined;

        if (type === 'queen') {
            // Royal Ruby Crimson with Golden Sunburst
            entity.paint.fill = hex("#C81E1E");
            entity.paint.stroke = hex("#881313");
            entity.paint.strokeWidth = 0.04;

            innerRing = new Circle(radius * 0.65);
            innerRing.transform.position = new Vec3(x, y, 0.015);
            innerRing.paint.fill = new Color(0, 0, 0, 0);
            innerRing.paint.stroke = hex("#FBBF24"); // Bright Gold
            innerRing.paint.strokeWidth = 0.035;
            innerRing.z_index = 0.015;
            this.add(innerRing);

            core = new Circle(radius * 0.26);
            core.transform.position = new Vec3(x, y, 0.016);
            core.paint.fill = hex("#F59E0B");
            core.paint.stroke = hex("#B45309");
            core.paint.strokeWidth = 0.02;
            core.z_index = 0.016;
            // this.add(core);
        } else if (type === 'white') {
            // Polished Pearl Ivory with Satin Engraved Ring
            entity.paint.fill = hex("#FAF7F2");
            entity.paint.stroke = hex("#D1C5B6");
            entity.paint.strokeWidth = 0.035;

            innerRing = new Circle(radius * 0.58);
            innerRing.transform.position = new Vec3(x, y, 0.015);
            innerRing.paint.fill = new Color(0, 0, 0, 0);
            innerRing.paint.stroke = hex("#B8A996");
            innerRing.paint.strokeWidth = 0.03;
            innerRing.z_index = 0.015;
            this.add(innerRing);

            core = new Circle(radius * 0.22);
            core.transform.position = new Vec3(x, y, 0.016);
            core.paint.fill = hex("#EDE4D8");
            core.z_index = 0.016;
            // this.add(core);
        } else {
            // Obsidian Onyx with Satin Charcoal Engraved Ring
            entity.paint.fill = hex("#1C2128");
            entity.paint.stroke = hex("#2D3748");
            entity.paint.strokeWidth = 0.035;

            innerRing = new Circle(radius * 0.58);
            innerRing.transform.position = new Vec3(x, y, 0.015);
            innerRing.paint.fill = new Color(0, 0, 0, 0);
            innerRing.paint.stroke = hex("#4A5568");
            innerRing.paint.strokeWidth = 0.03;
            innerRing.z_index = 0.015;
            this.add(innerRing);

            core = new Circle(radius * 0.22);
            core.transform.position = new Vec3(x, y, 0.016);
            core.paint.fill = hex("#28313E");
            core.z_index = 0.016;
            // this.add(core);
        }

        this.add(entity);
        return { entity, shadow, innerRing, core };
    }

    /**
     * Creates the player's Striker:
     * - Luxury engraved acrylic ivory disc (radius: 0.68, mass: 4.5)
     * - Concentric target ridges & center gold medallion with bulls-eye pip
     * - Continuous Collision Detection (CCD) to eliminate tunnelling at high shot speeds
     */
    private createStriker(): void {
        const radius = this.STRIKER_RADIUS;
        this.strikerX = 0;

        // Striker Drop Shadow (heavier acrylic disc with soft contact occlusion & penumbra)
        this.strikerShadow = new Circle(radius * 1.0);
        this.strikerShadow.transform.position = new Vec3(this.strikerX + this.STRIKER_SHADOW_OFFSET_X, this.BASELINE_Y + this.STRIKER_SHADOW_OFFSET_Y, this.STRIKER_SHADOW_Z);
        this.strikerShadow.paint.fill = new Color(0.06, 0.04, 0.02, 0.35);
        this.strikerShadow.paint.stroke = new Color(0.06, 0.04, 0.02, 0.16);
        this.strikerShadow.paint.strokeWidth = 0.045;
        this.strikerShadow.z_index = this.STRIKER_SHADOW_Z;
        this.add(this.strikerShadow);

        // Striker Base Disc: Premium Polished Acrylic Ivory
        this.striker = new Circle(radius);
        this.striker.transform.position = new Vec3(this.strikerX, this.BASELINE_Y, 0.02);
        this.striker.paint.fill = hex("#FFFDF7"); // Pure warm ivory
        this.striker.paint.stroke = hex("#D97706"); // Amber gold
        this.striker.paint.strokeWidth = 0.06;
        this.striker.z_index = 0.02;
        this.add(this.striker);

        // Outer Engraved Ridge
        this.strikerOuterRing = new Circle(radius * 0.78);
        this.strikerOuterRing.transform.position = new Vec3(this.strikerX, this.BASELINE_Y, 0.023);
        this.strikerOuterRing.paint.fill = new Color(0, 0, 0, 0);
        this.strikerOuterRing.paint.stroke = hex("#B45309");
        this.strikerOuterRing.paint.strokeWidth = 0.04;
        this.strikerOuterRing.z_index = 0.023;
        this.add(this.strikerOuterRing);

        // Inner Engraved Target Ring
        this.strikerInner = new Circle(radius * 0.52);
        this.strikerInner.transform.position = new Vec3(this.strikerX, this.BASELINE_Y, 0.025);
        this.strikerInner.paint.fill = new Color(0, 0, 0, 0);
        this.strikerInner.paint.stroke = hex("#D97706");
        this.strikerInner.paint.strokeWidth = 0.04;
        this.strikerInner.z_index = 0.025;
        this.add(this.strikerInner);

        // Center Medallion
        this.strikerCore = new Circle(radius * 0.25);
        this.strikerCore.transform.position = new Vec3(this.strikerX, this.BASELINE_Y, 0.026);
        this.strikerCore.paint.fill = hex("#F59E0B");
        this.strikerCore.paint.stroke = hex("#B45309");
        this.strikerCore.paint.strokeWidth = 0.02;
        this.strikerCore.z_index = 0.026;
        this.add(this.strikerCore);

        // Center Crimson Pip (Bulls-eye)
        this.strikerPip = new Circle(radius * 0.09);
        this.strikerPip.transform.position = new Vec3(this.strikerX, this.BASELINE_Y, 0.027);
        this.strikerPip.paint.fill = hex("#DC2626");
        this.strikerPip.z_index = 0.027;
        this.add(this.strikerPip);

        // Manual Pickup Eligibility Indicator Ring (Pulsing Amber Gold)
        this.strikerCollectGlow = new Circle(radius * 1.35);
        this.strikerCollectGlow.transform.position = new Vec3(this.strikerX, this.BASELINE_Y, 0.028);
        this.strikerCollectGlow.paint.fill = new Color(0, 0, 0, 0);
        this.strikerCollectGlow.paint.stroke = new Color(0.98, 0.75, 0.14, 0.85);
        this.strikerCollectGlow.paint.strokeWidth = 0.05;
        this.strikerCollectGlow.z_index = 0.028;
        this.strikerCollectGlow.VISIBILITY = false;
        this.add(this.strikerCollectGlow);

        this.strikerBodyComp = this.physics.add(this.striker, {
            type: 'dynamic',
            mass: this.strikerWeight,
            friction: this.boardFriction,
            restitution: 0.85,
            linearDamping: this.boardLinearDamping,
            angularDamping: 1.2,
            ccd: true,
            lockRotation: true
        });
        this.isStrikerOnBoard = true;
    }

    /**
     * Creates the dynamic trajectory guide and aiming elements:
     * - Pull-back power line with gradient color
     * - Forward predictive dotted path
     */
    private createAimingAids(): void {
        this.aimLine = new Line([
            [0, 0, 0.03],
            [0, 0, 0.03]
        ]);
        this.aimLine.paint.stroke = hex("#10B981"); // Emerald green
        this.aimLine.paint.strokeWidth = 0.12;
        this.aimLine.z_index = 0.03;
        this.aimLine.visible = false;
        this.add(this.aimLine);

        // 10 Trajectory Prediction Dots
        for (let i = 0; i < 10; i++) {
            const dot = new Circle(0.09 - i * 0.006);
            dot.transform.position = new Vec3(0, 0, 0.03);
            dot.paint.fill = hex("#10B981");
            dot.z_index = 0.03;
            dot.visible = false;
            this.add(dot);
            this.trajectoryDots.push(dot);
        }
    }

    /**
     * Seamless Single-Flow Controls:
     * - Positioning: Striker glides along baseline following mouse position.
     * - Click on Striker (Left-click): Locks position, enters Aim Mode.
     * - Aim Mode: Mouse controls slingshot pull line & trajectory dots.
     *   - Release mouse (or left-click): Shoots striker forward with slingshot impulse!
     *   - Right-click: Cancels Aim Mode; striker resumes following mouse position along baseline.
     */
    /**
     * Seamless Single-Flow Controls:
     * - Positioning: Striker glides along baseline following mouse position.
     * - Click on Striker (Left-click): Locks position, enters Aim Mode.
     * - Aim Mode: Mouse controls slingshot pull line & trajectory dots.
     *   - Release mouse (or left-click): Shoots striker forward with slingshot impulse!
     *   - Right-click: Cancels Aim Mode; striker resumes following mouse position along baseline.
     */
    private setupPointerControls(): void {
        window.addEventListener("contextmenu", (e) => {
            e.preventDefault();
            if (this.gameState === 'aiming') {
                this.cancelAiming();
            }
        });

        // Spacebar quick shortcut to manually pick striker when coasting slowly
        window.addEventListener("keydown", (e: KeyboardEvent) => {
            if (e.code === "Space") {
                if (this.gameState === 'rolling') {
                    if (this.canPickStrikerManually) {
                        e.preventDefault();
                        this.collectStrikerManually(true);
                    } else if (this.isStrikerHeadingToPocket()) {
                        e.preventDefault();
                        this.showScoreToast("⚠️ Cannot pick: Striker heading towards pocket (Potential Foul)!", "#EF4444");
                    }
                }
            }
        });

        this.setEvent("pointerdown", (worldPos: Vec3, event: PointerEvent | WheelEvent) => {
            const pEvent = event as PointerEvent;

            // Handle manual striker collection during rolling
            if (this.gameState === 'rolling') {
                if (!pEvent || pEvent.button === 0) {
                    const stPos = this.striker.transform.position;
                    const distToStriker = Math.hypot(worldPos.x - stPos.x, worldPos.y - stPos.y);
                    if (this.canPickStrikerManually && distToStriker <= 2.2) {
                        this.collectStrikerManually(true);
                        return;
                    } else if (distToStriker <= 2.2 && this.isStrikerHeadingToPocket()) {
                        this.showScoreToast("⚠️ Cannot pick: Striker heading towards pocket (Potential Foul)!", "#EF4444");
                        return;
                    }
                }
                return;
            }

            if (this.gameState === 'gameover' || this.gameState === 'ai_thinking' || this.gameState === 'ai_aiming') return;
            if (this.gameMode === 'vs_ai' && this.currentTurn === 'ai') return;

            // Secondary button (Right-click): Cancel aim mode immediately
            if (pEvent?.button === 2) {
                if (this.gameState === 'aiming') {
                    this.cancelAiming();
                }
                return;
            }

            // Primary button (Left-click)
            if (!pEvent || pEvent.button === 0) {
                if (this.gameState === 'positioning') {
                    const stPos = this.striker.transform.position;
                    const distToStriker = Math.hypot(worldPos.x - stPos.x, worldPos.y - stPos.y);

                    // Click on or near the striker locks position and enters Aim Mode
                    if (distToStriker <= 1.4) {
                        this.isReturningToMouse = false;
                        this.enterAiming(worldPos);
                    }
                } else if (this.gameState === 'aiming') {
                    // Click while in aim mode with sufficient pull triggers the shot
                    const stPos = this.striker.transform.position;
                    const dx = this.dragCurrentWorld.x - stPos.x;
                    const dy = this.dragCurrentWorld.y - stPos.y;
                    const dist = Math.hypot(dx, dy);

                    if (dist >= 0.4) {
                        this.executeShot(dx, dy, dist);
                    }
                }
            }
        });

        this.setEvent("pointermove", (worldPos: Vec3) => {
            if (this.gameMode === 'vs_ai' && this.currentTurn === 'ai') return;
            this.currentMouseWorldX = worldPos.x;
            if (this.gameState === 'aiming') {
                // Aiming slingshot: pull back from locked striker position
                this.dragCurrentWorld.set([worldPos.x, worldPos.y, 0]);
                this.updateAimingVisuals();
            }
        });

        this.setEvent("pointerup", (worldPos: Vec3, event: PointerEvent | WheelEvent) => {
            if (this.gameMode === 'vs_ai' && this.currentTurn === 'ai') return;
            if (this.gameState !== 'aiming') return;

            const pEvent = event as PointerEvent;
            if (pEvent && pEvent.button !== 0) return; // Only process left-click release

            const stPos = this.striker.transform.position;
            const dx = this.dragCurrentWorld.x - stPos.x;
            const dy = this.dragCurrentWorld.y - stPos.y;
            const dist = Math.hypot(dx, dy);

            // If user pulled back by at least minDrag, execute shot on release
            if (dist >= 0.4) {
                this.executeShot(dx, dy, dist);
            }
        });
    }

    private enterAiming(worldPos: Vec3): void {
        this.gameState = 'aiming';
        this.isAiming = true;
        this.isReturningToMouse = false;
        const stPos = this.striker.transform.position;
        this.dragStartWorld.set([stPos.x, stPos.y, 0]);
        this.dragCurrentWorld.set([worldPos.x, worldPos.y, 0]);

        // Activate physics body and sync position for the upcoming shot
        if (this.strikerBodyComp?.body) {
            this.strikerBodyComp.body.setPosition({ x: stPos.x, y: stPos.y });
            this.strikerBodyComp.body.setLinearVelocity({ x: 0, y: 0 });
            this.strikerBodyComp.body.setAngularVelocity(0);
            this.strikerBodyComp.body.setActive(true);
        }

        this.updateAimingVisuals();
        this.updateUI();
    }

    private cancelAiming(): void {
        this.isAiming = false;
        this.aimLine.VISIBILITY = false;
        for (const dot of this.trajectoryDots) {
            dot.VISIBILITY = false;
        }
        this.gameState = 'positioning';

        const stPos = this.striker.transform.position;
        // Smooth return glide from locked position to current mouse position
        this.startReturnAnimation(stPos.x, stPos.y, 0.22);
        this.soundEffects.playSlide();

        this.updateUI();
    }

    private executeShot(dx: number, dy: number, dist: number): void {
        this.isAiming = false;
        this.aimLine.VISIBILITY = false;
        for (const dot of this.trajectoryDots) {
            dot.VISIBILITY = false;
        }

        const maxDrag = 5.5;
        const clampedDist = Math.min(dist, maxDrag);
        const powerRatio = clampedDist / maxDrag;

        const dirX = -dx / dist;
        const dirY = -dy / dist;

        const maxImpulse = 110.0 * this.strikeForceMultiplier;
        const impulseMag = Math.max(powerRatio * maxImpulse, 10.0 * this.strikeForceMultiplier);

        if (this.strikerBodyComp?.body) {
            this.strikerBodyComp.body.setActive(true);
            this.strikerBodyComp.applyImpulse([dirX * impulseMag, dirY * impulseMag]);
        }
        // Starting impulse application is silent per physical law (collisions generate the sound)

        this.shotsTaken++;
        if (this.isSetupPanelOpen) this.isSetupPanelOpen = false;
        if (this.currentTurn === 'player') {
            this.playerShotsTaken++;
        } else {
            this.aiShotsTaken++;
        }

        this.pottedThisShot = [];
        this.strikerFoulThisShot = false;
        this.canPickStrikerManually = false;
        this.aiQuietPickFrames = 0;
        if (this.strikerCollectGlow) this.strikerCollectGlow.VISIBILITY = false;
        this.gameState = 'rolling';
        this.framesInRoll = 0;
        this.quietRollFrames = 0;
        this.updateUI();
    }

    private updateAimingVisuals(): void {
        const stPos = this.striker.transform.position;
        const dx = this.dragCurrentWorld.x - stPos.x;
        const dy = this.dragCurrentWorld.y - stPos.y;
        const dist = Math.hypot(dx, dy);

        if (dist < 0.2) {
            this.aimLine.VISIBILITY = false;
            for (const dot of this.trajectoryDots) dot.VISIBILITY = false;
            return;
        }

        const maxDrag = 5.5;
        const clampedDist = Math.min(dist, maxDrag);
        const powerRatio = clampedDist / maxDrag;

        // Pull Line (Slingshot drag line)
        this.aimLine.VISIBILITY = true;
        this.aimLine.setVertices([
            [stPos.x, stPos.y, 0.03],
            [stPos.x + dx, stPos.y + dy, 0.03]
        ]);

        // Power Color: Emerald -> Amber -> Crimson
        let strokeColor = hex("#10B981");
        if (powerRatio > 0.65) {
            strokeColor = hex("#EF4444");
        } else if (powerRatio > 0.35) {
            strokeColor = hex("#F59E0B");
        }
        this.aimLine.paint.stroke = strokeColor;

        // Forward Predictive Trajectory Dots
        const dirX = -dx / dist;
        const dirY = -dy / dist;
        const dotSpacing = 0.8 + powerRatio * 0.5;

        for (let i = 0; i < this.trajectoryDots.length; i++) {
            const dot = this.trajectoryDots[i];
            const d = (i + 1) * dotSpacing;
            dot.VISIBILITY = true;
            dot.transform.position = new Vec3(stPos.x + dirX * d, stPos.y + dirY * d, 0.03);
            dot.paint.fill = strokeColor;
        }
    }

    /**
     * AI Turn Execution Flow
     */
    private triggerAITurnSequence(): void {
        if (this.gameState === 'gameover') return;
        if (this.aiThinkingTimer) clearTimeout(this.aiThinkingTimer);
        if (this.aiAimingTimer) clearTimeout(this.aiAimingTimer);

        this.gameState = 'ai_thinking';
        this.updateUI();

        // 1. Thinking delay calibrated per difficulty for authentic human-like pacing
        const thinkingDelays: Record<AIDifficulty, number> = {
            novice: 900,
            amateur: 700,
            expert: 520,
            master: 380
        };
        const thinkDelay = thinkingDelays[this.aiDifficulty] ?? 600;

        this.aiThinkingTimer = setTimeout(() => {
            if (this.gameState !== 'ai_thinking' || this.currentTurn !== 'ai') return;

            const plan = CarromAI.findBestShot(
                this.coins,
                this.pockets,
                this.AI_BASELINE_Y,
                this.BASELINE_MIN_X,
                this.BASELINE_MAX_X,
                this.STRIKER_RADIUS,
                this.COIN_RADIUS,
                this.aiColor,
                this.aiDifficulty,
                this.strikerWeight,
                this.coinWeight,
                this.boardLinearDamping,
                this.strikeForceMultiplier
            );

            if (!plan) {
                this.showScoreToast("AI: No open shot — passing turn", "#94A3B8");
                this.currentTurn = 'player';
                this.updateStrikerStyleForTurn('player');
                this.startReturnAnimation(this.strikerX, this.AI_BASELINE_Y, 0.45);
                this.updateUI();
                return;
            }

            this.currentAIPlan = plan;

            // 2. Smoothly slide striker along AI baseline to plan.baselineX
            this.animateAISlideTo(plan.baselineX, () => {
                if (this.currentTurn !== 'ai') return;
                this.gameState = 'ai_aiming';
                this.showAIAimingPreview(plan);
                this.updateUI();

                // 3. Hold aim preview so the user sees the calculated trajectory line
                this.aiAimingTimer = setTimeout(() => {
                    if (this.gameState !== 'ai_aiming') return;
                    this.executeAIShot(plan);
                }, 550);
            });
        }, thinkDelay);
    }

    private animateAISlideTo(targetX: number, onComplete: () => void): void {
        const startX = this.strikerX;
        const duration = 360;
        const startTime = performance.now();
        this.soundEffects.playSlide();

        const step = () => {
            const elapsed = performance.now() - startTime;
            const progress = Math.min(1, elapsed / duration);
            const ease = 1 - Math.pow(1 - progress, 3);
            const curX = startX + (targetX - startX) * ease;

            this.setStrikerVisualPosition(curX, this.AI_BASELINE_Y);

            if (progress < 1) {
                requestAnimationFrame(step);
            } else {
                this.setStrikerVisualPosition(targetX, this.AI_BASELINE_Y);
                onComplete();
            }
        };
        requestAnimationFrame(step);
    }

    private showAIAimingPreview(plan: AIShotPlan): void {
        const sx = plan.baselineX;
        const sy = this.AI_BASELINE_Y;

        const cyan = hex("#00E5FF");
        this.aimLine.paint.stroke = cyan;

        const pullDist = Math.min(plan.powerRatio * 4.2, 4.8);
        const pullX = sx - plan.aimDirX * pullDist;
        const pullY = sy - plan.aimDirY * pullDist;

        this.aimLine.setVertices([
            [sx, sy, 0.03],
            [pullX, pullY, 0.03]
        ]);
        this.aimLine.VISIBILITY = true;

        const dotSpacing = 0.8 + plan.powerRatio * 0.5;
        for (let i = 0; i < this.trajectoryDots.length; i++) {
            const dot = this.trajectoryDots[i];
            const d = (i + 1) * dotSpacing;
            dot.VISIBILITY = true;
            dot.paint.fill = cyan;
            dot.transform.position.set([sx + plan.aimDirX * d, sy + plan.aimDirY * d, 0.03]);
        }
    }

    private executeAIShot(plan: AIShotPlan): void {
        this.aimLine.VISIBILITY = false;
        for (const dot of this.trajectoryDots) {
            dot.VISIBILITY = false;
        }

        if (this.strikerBodyComp?.body) {
            this.strikerBodyComp.body.setPosition({ x: plan.baselineX, y: this.AI_BASELINE_Y });
            this.strikerBodyComp.body.setLinearVelocity({ x: 0, y: 0 });
            this.strikerBodyComp.body.setAngularVelocity(0);
            this.strikerBodyComp.body.setActive(true);
            this.strikerBodyComp.applyImpulse([plan.impulseX, plan.impulseY]);
        }
        // Starting impulse application is silent per physical law (collisions generate the sound)

        this.shotsTaken++;
        if (this.isSetupPanelOpen) this.isSetupPanelOpen = false;
        this.aiShotsTaken++;
        this.pottedThisShot = [];
        this.strikerFoulThisShot = false;
        this.canPickStrikerManually = false;
        this.aiQuietPickFrames = 0;
        if (this.strikerCollectGlow) this.strikerCollectGlow.VISIBILITY = false;
        this.gameState = 'rolling';
        this.framesInRoll = 0;
        this.quietRollFrames = 0;
        this.updateUI();
    }

    private getCurrentBaselineY(): number {
        if (this.gameMode === 'solo') return this.BASELINE_Y;
        return this.currentTurn === 'player' ? this.BASELINE_Y : this.AI_BASELINE_Y;
    }

    private updateStrikerStyleForTurn(turn: 'player' | 'ai'): void {
        if (!this.striker) return;
        if (turn === 'player') {
            const themes: Record<StrikerTheme, {
                fill: string; stroke: string; outerRing: string; innerRing: string; coreFill: string; coreStroke: string; pip: string;
            }> = {
                ivory: {
                    fill: "#FFFDF7",
                    stroke: "#D97706",
                    outerRing: "#B45309",
                    innerRing: "#D97706",
                    coreFill: "#F59E0B",
                    coreStroke: "#B45309",
                    pip: "#DC2626"
                },
                obsidian: {
                    fill: "#0B132B",
                    stroke: "#00E5FF",
                    outerRing: "#0284C7",
                    innerRing: "#38BDF8",
                    coreFill: "#0EA5E9",
                    coreStroke: "#0369A1",
                    pip: "#00E5FF"
                },
                ruby: {
                    fill: "#7F1D1D",
                    stroke: "#F59E0B",
                    outerRing: "#B91C1C",
                    innerRing: "#EF4444",
                    coreFill: "#DC2626",
                    coreStroke: "#991B1B",
                    pip: "#FBBF24"
                },
                emerald: {
                    fill: "#064E3B",
                    stroke: "#10B981",
                    outerRing: "#047857",
                    innerRing: "#34D399",
                    coreFill: "#059669",
                    coreStroke: "#065F46",
                    pip: "#FBBF24"
                }
            };
            const t = themes[this.strikerTheme] ?? themes.ivory;
            this.striker.paint.fill = hex(t.fill);
            this.striker.paint.stroke = hex(t.stroke);
            if (this.strikerOuterRing) this.strikerOuterRing.paint.stroke = hex(t.outerRing);
            if (this.strikerInner) this.strikerInner.paint.stroke = hex(t.innerRing);
            if (this.strikerCore) {
                this.strikerCore.paint.fill = hex(t.coreFill);
                this.strikerCore.paint.stroke = hex(t.coreStroke);
            }
            if (this.strikerPip) this.strikerPip.paint.fill = hex(t.pip);
        } else {
            // AI Opponent Striker (Midnight Obsidian Onyx with Neon Electric Cyan)
            this.striker.paint.fill = hex("#0B132B");
            this.striker.paint.stroke = hex("#00E5FF");
            if (this.strikerOuterRing) this.strikerOuterRing.paint.stroke = hex("#0284C7");
            if (this.strikerInner) this.strikerInner.paint.stroke = hex("#38BDF8");
            if (this.strikerCore) {
                this.strikerCore.paint.fill = hex("#0EA5E9");
                this.strikerCore.paint.stroke = hex("#0369A1");
            }
            if (this.strikerPip) this.strikerPip.paint.fill = hex("#00E5FF");
        }
    }

    private hideStrikerVisuals(): void {
        this.isStrikerOnBoard = false;
        if (this.striker) this.striker.VISIBILITY = false;
        if (this.strikerShadow) this.strikerShadow.VISIBILITY = false;
        if (this.strikerOuterRing) this.strikerOuterRing.VISIBILITY = false;
        if (this.strikerInner) this.strikerInner.VISIBILITY = false;
        if (this.strikerCore) this.strikerCore.VISIBILITY = false;
        if (this.strikerPip) this.strikerPip.VISIBILITY = false;
        if (this.strikerCollectGlow) this.strikerCollectGlow.VISIBILITY = false;
    }

    /**
     * Checks if pieces enter pockets, updates sink animations, and resets striker on turn completion.
     */
    private updateGameLoop(): void {
        const currentBaselineY = this.getCurrentBaselineY();

        // 0. Smooth Return-to-Baseline Animation & Baseline Tracking
        if (this.isReturningToMouse) {
            this.returnAnimProgress += (1 / 60) / this.returnAnimDuration;
            const targetX = (this.currentTurn === 'player' || this.gameMode === 'pass_and_play')
                ? Math.max(this.BASELINE_MIN_X, Math.min(this.BASELINE_MAX_X, this.currentMouseWorldX))
                : 0; // AI starts center until calculating shot

            if (this.returnAnimProgress >= 1) {
                this.isReturningToMouse = false;
                this.returnAnimProgress = 1;
                this.setStrikerVisualPosition(targetX, currentBaselineY);

                if (this.currentTurn === 'ai' && this.gameMode === 'vs_ai' && this.gameState === 'positioning') {
                    this.triggerAITurnSequence();
                }
            } else {
                const p = this.returnAnimProgress;
                const ease = 1 - Math.pow(1 - p, 3);

                const curX = this.returnAnimStartX + (targetX - this.returnAnimStartX) * ease;
                const curY = this.returnAnimStartY + (currentBaselineY - this.returnAnimStartY) * ease;

                this.setStrikerVisualPosition(curX, curY);
            }
        } else if (this.gameState === 'positioning') {
            if (this.currentTurn === 'player' || this.gameMode === 'pass_and_play') {
                const targetX = Math.max(this.BASELINE_MIN_X, Math.min(this.BASELINE_MAX_X, this.currentMouseWorldX));
                const diff = targetX - this.strikerX;
                if (Math.abs(diff) > 0.001) {
                    this.strikerX += diff * 0.35;
                    this.setStrikerVisualPosition(this.strikerX, currentBaselineY);
                }
            }
        }

        // Sync Striker child rings and shadow to body position
        if (this.striker) {
            let sx = this.striker.transform.position.x;
            let sy = this.striker.transform.position.y;
            if (this.strikerBodyComp?.body?.getPosition) {
                const bp = this.strikerBodyComp.body.getPosition();
                if (bp) {
                    sx = bp.x;
                    sy = bp.y;
                }
            }
            if (this.strikerShadow) this.strikerShadow.transform.setPositionXYZ(sx + this.STRIKER_SHADOW_OFFSET_X, sy + this.STRIKER_SHADOW_OFFSET_Y, this.STRIKER_SHADOW_Z);
            if (this.strikerOuterRing) this.strikerOuterRing.transform.setPositionXYZ(sx, sy, 0.023);
            if (this.strikerInner) this.strikerInner.transform.setPositionXYZ(sx, sy, 0.025);
            if (this.strikerCore) this.strikerCore.transform.setPositionXYZ(sx, sy, 0.026);
            if (this.strikerPip) this.strikerPip.transform.setPositionXYZ(sx, sy, 0.027);
        }

        // Sync Coin child rings and shadows
        for (const coin of this.coins) {
            if (coin.potted) continue;
            let cx = coin.entity.transform.position.x;
            let cy = coin.entity.transform.position.y;
            const b = coin.bodyComp?.body;
            if (b?.getPosition) {
                const bp = b.getPosition();
                if (bp) {
                    cx = bp.x;
                    cy = bp.y;
                }
            }
            if (coin.shadow) {
                coin.shadow.transform.setPositionXYZ(cx + this.COIN_SHADOW_OFFSET_X, cy + this.COIN_SHADOW_OFFSET_Y, this.COIN_SHADOW_Z);
            }
            if (coin.innerRing) {
                coin.innerRing.transform.setPositionXYZ(cx, cy, 0.015);
            }
            if (coin.core) {
                coin.core.transform.setPositionXYZ(cx, cy, 0.016);
            }
        }

        // 1. Check Pocket Sinks
        this.checkPocketCollisions();

        // 2. State Management during 'rolling' phase
        if (this.gameState === 'rolling') {
            this.framesInRoll++;

            // Measure maximum piece speed across all active pieces on the board
            let maxPieceSpeed = 0;
            let maxCoinSpeed = 0;
            let sSpeed = 0;

            if (this.isStrikerOnBoard) {
                const sv = this.strikerBodyComp.getVelocity();
                sSpeed = Math.hypot(sv.x, sv.y);
                if (sSpeed > maxPieceSpeed) maxPieceSpeed = sSpeed;

                // Gentle exponential micro-damping when speed is extremely small (< 0.06) so it cleanly comes to rest
                if (sSpeed < 0.06 && sSpeed > 0) {
                    this.strikerBodyComp.setVelocity([sv.x * 0.92, sv.y * 0.92]);
                }
                // Zero out only when below true imperceptible stillness threshold (0.018 units/sec = ~0.009 px/frame)
                if (sSpeed < 0.018) {
                    this.strikerBodyComp.setVelocity([0, 0]);
                }
            }

            for (const coin of this.coins) {
                if (!coin.potted) {
                    const cv = coin.bodyComp.getVelocity();
                    const cSpeed = Math.hypot(cv.x, cv.y);
                    if (cSpeed > maxPieceSpeed) maxPieceSpeed = cSpeed;
                    if (cSpeed > maxCoinSpeed) maxCoinSpeed = cSpeed;

                    if (cSpeed < 0.06 && cSpeed > 0) {
                        coin.bodyComp.setVelocity([cv.x * 0.92, cv.y * 0.92]);
                    }
                    if (cSpeed < 0.018) {
                        coin.bodyComp.setVelocity([0, 0]);
                    }
                }
            }

            // --- Manual Striker Pickup Threshold Evaluation ---
            // If striker is safely coasting below manualPickThreshold, other coins are calm (< 0.18),
            // and striker is NOT heading towards any pocket (which might incur a foul):
            const headingToPocket = this.isStrikerHeadingToPocket();
            const eligibleForManualPick = this.isStrikerOnBoard
                && this.framesInRoll > 20
                && sSpeed < this.manualPickThreshold
                && maxCoinSpeed < 0.18
                && !headingToPocket;

            const prevCanPick = this.canPickStrikerManually;
            this.canPickStrikerManually = eligibleForManualPick;

            // Visual feedback: pulsing amber collection ring around striker
            if (this.strikerCollectGlow) {
                if (this.canPickStrikerManually && this.isStrikerOnBoard) {
                    const stPos = this.striker.transform.position;
                    this.strikerCollectGlow.VISIBILITY = true;
                    const pulse = 1.0 + Math.sin(performance.now() * 0.008) * 0.06;
                    this.strikerCollectGlow.transform.setScale(pulse);
                    this.strikerCollectGlow.transform.setPositionXYZ(stPos.x, stPos.y, 0.028);
                } else {
                    this.strikerCollectGlow.VISIBILITY = false;
                }
            }

            // Refresh UI status bar when pick status transitions or periodically
            if (prevCanPick !== this.canPickStrikerManually || (this.framesInRoll % 10 === 0)) {
                this.updateRollingUIStatus(headingToPocket);
            }

            // AI Opponent auto-pickup: auto-collects if safe and slow for ~25 frames
            if (this.currentTurn === 'ai' && this.gameMode === 'vs_ai' && this.canPickStrikerManually) {
                this.aiQuietPickFrames++;
                if (this.aiQuietPickFrames >= 25) {
                    this.aiQuietPickFrames = 0;
                    this.collectStrikerManually(false);
                    return;
                }
            } else {
                this.aiQuietPickFrames = 0;
            }

            // True stillness calibration:
            // 0.025 units/sec ensures pieces only settle when completely stopped (< 0.012 px/frame),
            // preventing the striker or coins from resetting while still visibly gliding across the board.
            const STILLNESS_SPEED_THRESHOLD = 0.015;
            const MIN_ROLL_FRAMES = 35;       // At least ~0.58s must elapse before ending turn
            const REQUIRED_QUIET_FRAMES = 12; // Must maintain continuous stillness for ~0.2s
            const MAX_ROLL_TIMEOUT = 600;     // Safety fallback: 10 seconds max roll duration

            if (maxPieceSpeed < STILLNESS_SPEED_THRESHOLD) {
                this.quietRollFrames++;
            } else {
                this.quietRollFrames = 0;
            }

            const isSettled = (this.framesInRoll >= MIN_ROLL_FRAMES && this.quietRollFrames >= REQUIRED_QUIET_FRAMES);
            const isTimedOut = (this.framesInRoll >= MAX_ROLL_TIMEOUT);

            if (isSettled || isTimedOut) {
                // Ensure all bodies are completely stopped before turn transition
                if (this.isStrikerOnBoard) {
                    this.strikerBodyComp.setVelocity([0, 0]);
                }
                for (const coin of this.coins) {
                    if (!coin.potted) {
                        coin.bodyComp.setVelocity([0, 0]);
                    }
                }
                this.canPickStrikerManually = false;
                this.aiQuietPickFrames = 0;
                if (this.strikerCollectGlow) {
                    this.strikerCollectGlow.VISIBILITY = false;
                }
                this.quietRollFrames = 0;
                this.onPiecesSettled();
            }
        }
    }

    private checkPocketCollisions(): void {
        // Check Coins
        for (const coin of this.coins) {
            if (coin.potted) continue;
            const cp = coin.entity.transform.position;

            for (const p of this.pockets) {
                const dist = Math.hypot(cp.x - p.x, cp.y - p.y);
                if (dist < p.radius * 0.95) {
                    coin.potted = true;
                    this.soundEffects.playPocket(coin.type === 'queen');

                    this.physics.remove(coin.entity, false);
                    coin.entity.VISIBILITY = false;
                    if (coin.shadow) coin.shadow.VISIBILITY = false;
                    if (coin.innerRing) coin.innerRing.VISIBILITY = false;
                    if (coin.core) coin.core.VISIBILITY = false;

                    this.pottedThisShot.push(coin);

                    if (coin.type === 'queen') {
                        this.queenPocketed = true;
                        this.queenCapturedBy = this.currentTurn;
                        if (this.currentTurn === 'player') {
                            this.playerScore += 25;
                            this.score = this.playerScore;
                            this.showScoreToast(`+25 QUEEN CAPTURED BY YOU!`, '#FBBF24');
                        } else {
                            this.aiScore += 25;
                            this.showScoreToast(`+25 QUEEN CAPTURED BY AI!`, '#00E5FF');
                        }
                    } else if (coin.type === this.playerColor) {
                        if (this.playerColor === 'white') {
                            this.whiteCoinsLeft = Math.max(0, this.whiteCoinsLeft - 1);
                        } else {
                            this.blackCoinsLeft = Math.max(0, this.blackCoinsLeft - 1);
                        }
                        this.playerScore += 10;
                        this.score = this.playerScore;
                        const label = this.playerColor.toUpperCase();
                        const colorHex = this.playerColor === 'white' ? '#FAF7F2' : '#38BDF8';
                        if (this.currentTurn === 'player') {
                            this.showScoreToast(`+10 ${label} (YOU)`, colorHex);
                        } else {
                            this.showScoreToast(`+10 ${label} (AI potted for You)`, colorHex);
                        }
                    } else {
                        if (this.aiColor === 'black') {
                            this.blackCoinsLeft = Math.max(0, this.blackCoinsLeft - 1);
                        } else {
                            this.whiteCoinsLeft = Math.max(0, this.whiteCoinsLeft - 1);
                        }
                        this.aiScore += 10;
                        const label = this.aiColor.toUpperCase();
                        const colorHex = this.aiColor === 'white' ? '#FAF7F2' : '#38BDF8';
                        if (this.currentTurn === 'ai') {
                            this.showScoreToast(`+10 ${label} (AI)`, colorHex);
                        } else {
                            this.showScoreToast(`+10 ${label} (Potted for AI)`, '#94A3B8');
                        }
                    }

                    this.updateUI();
                    break;
                }
            }
        }

        // Check Striker Foul
        if (this.isStrikerOnBoard) {
            const sp = this.striker.transform.position;
            for (const p of this.pockets) {
                const dist = Math.hypot(sp.x - p.x, sp.y - p.y);
                if (dist < p.radius * 0.92) {
                    this.soundEffects.playFoul();
                    this.strikerFoulThisShot = true;

                    if (this.currentTurn === 'player') {
                        this.playerScore = Math.max(0, this.playerScore - 5);
                        this.score = this.playerScore;
                        this.showScoreToast(`FOUL: STRIKER POTTED (-5)`, '#EF4444');
                    } else {
                        this.aiScore = Math.max(0, this.aiScore - 5);
                        this.showScoreToast(`AI FOUL: STRIKER POTTED (-5)`, '#EF4444');
                    }

                    this.lastPottedPos = { x: p.x, y: p.y };
                    this.hideStrikerVisuals();
                    this.strikerBodyComp.setVelocity([0, 0]);
                    this.updateUI();
                    break;
                }
            }
        }
    }

    /**
     * Accurately detects whether the striker is moving towards any pocket opening where it could foul.
     * Evaluates distance, heading angle (cosine alignment), and perpendicular trajectory miss distance.
     * When true, manual pickup is strictly disallowed to ensure legitimate fouls are fully realized.
     */
    public isStrikerHeadingToPocket(): boolean {
        if (!this.isStrikerOnBoard || !this.strikerBodyComp) return false;
        const sv = this.strikerBodyComp.getVelocity();
        const speed = Math.hypot(sv.x, sv.y);
        if (speed < 0.015) return false;

        const sp = this.striker.transform.position;

        for (const p of this.pockets) {
            const dx = p.x - sp.x;
            const dy = p.y - sp.y;
            const dist = Math.hypot(dx, dy);

            // Within pocket danger proximity (up to ~4.2 units from corner pocket)
            if (dist < 4.2) {
                // Directional alignment towards the pocket center
                const cosAngle = (sv.x * dx + sv.y * dy) / (speed * dist);
                if (cosAngle > 0.20) {
                    // Perpendicular miss distance from pocket center to the striker's velocity line
                    const cross = Math.abs(dx * (sv.y / speed) - dy * (sv.x / speed));
                    const pocketTolerance = p.radius + this.STRIKER_RADIUS * 0.90;

                    // Trajectory intersects pocket mouth or striker is already inside the immediate danger zone (< 2.8 units)
                    if (cross <= pocketTolerance || dist < (p.radius + this.STRIKER_RADIUS * 1.8)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    /**
     * Manually collects the striker when coasting safely below the manual pick threshold.
     * Immediately stops striker motion, skips long coasting waits, and smoothly transitions turn.
     * Strictly blocked if the striker is heading towards a pocket where a foul might occur.
     */
    public collectStrikerManually(showFeedback: boolean = true): boolean {
        if (this.gameState !== 'rolling') return false;
        if (!this.canPickStrikerManually) {
            if (this.isStrikerHeadingToPocket()) {
                this.showScoreToast("⚠️ Cannot pick: Striker heading towards pocket (Potential Foul)!", "#EF4444");
            }
            return false;
        }

        // Stop striker and all calm pieces
        if (this.isStrikerOnBoard && this.strikerBodyComp) {
            this.strikerBodyComp.setVelocity([0, 0]);
        }
        for (const coin of this.coins) {
            if (!coin.potted && coin.bodyComp) {
                coin.bodyComp.setVelocity([0, 0]);
            }
        }

        this.canPickStrikerManually = false;
        this.aiQuietPickFrames = 0;
        if (this.strikerCollectGlow) {
            this.strikerCollectGlow.VISIBILITY = false;
        }

        this.soundEffects.playSlide();
        if (showFeedback) {
            this.showScoreToast("✋ Striker Collected Manually", "#F59E0B");
        }

        this.quietRollFrames = 0;
        this.onPiecesSettled();
        return true;
    }

    public setManualPickThreshold(val: number): void {
        this.manualPickThreshold = Math.max(0.1, Math.min(2.0, val));
        this.updateUI();
    }

    private updateRollingUIStatus(headingToPocket: boolean): void {
        const statusEl = document.getElementById("ui-turn-status");
        const dotEl = document.getElementById("ui-status-dot");
        if (!statusEl) return;

        if (this.canPickStrikerManually) {
            statusEl.innerHTML = `<span style="color:#F59E0B; font-weight:700;">✋ Striker coasting slow</span> • Click striker, pill, or press <kbd style="background:#262626; border:1px solid #525252; padding:1px 5px; border-radius:4px; font-size:10px; color:#FDE047;">SPACE</kbd> to pick up`;
            statusEl.style.color = "#FAF7F2";
            if (dotEl) {
                dotEl.style.background = "#F59E0B";
                dotEl.style.boxShadow = "0 0 10px #F59E0B";
            }
        } else if (headingToPocket) {
            statusEl.innerHTML = `<span style="color:#EF4444; font-weight:700;">⚠️ Striker in pocket trajectory</span> • Watching for foul...`;
            statusEl.style.color = "#FCA5A5";
            if (dotEl) {
                dotEl.style.background = "#EF4444";
                dotEl.style.boxShadow = "0 0 10px #EF4444";
            }
        } else {
            statusEl.textContent = "⚡ Pieces sliding across the board...";
            statusEl.style.color = "#38BDF8";
            if (dotEl) {
                dotEl.style.background = "#38BDF8";
                dotEl.style.boxShadow = "0 0 8px #38BDF8";
            }
        }
    }

    /**
     * Handles end of turn when all pieces settle:
     * Evaluates extra turn rules, handles turn transitions, checks win condition,
     * and triggers smooth return glide.
     */
    private onPiecesSettled(): void {
        // 1. Foul Penalty & Coin Return Processing:
        // Must run FIRST so that any coins pocketed on a foul shot and fine coins
        // are returned to the board BEFORE evaluating game-over win conditions!
        let extraTurn = false;
        if (this.strikerFoulThisShot) {
            this.handleFoulPenaltyCoinReturn(this.currentTurn);
        } else {
            // Legitimate shot: evaluate extra turn rule
            if (this.currentTurn === 'player') {
                const pottedOwn = this.pottedThisShot.some(c => c.type === this.playerColor || c.type === 'queen');
                if (pottedOwn) extraTurn = true;
            } else {
                const pottedOwn = this.pottedThisShot.some(c => c.type === this.aiColor || c.type === 'queen');
                if (pottedOwn) extraTurn = true;
            }
        }

        // 2. Check Win Condition (ONLY AFTER all foul returns and penalties have been restored to the board!)
        if (this.whiteCoinsLeft === 0 || this.blackCoinsLeft === 0) {
            this.gameState = 'gameover';
            if (this.playerScore > this.aiScore) {
                this.winner = 'player';
            } else if (this.aiScore > this.playerScore) {
                this.winner = 'ai';
            } else {
                this.winner = 'tie';
            }
            this.updateUI();
            return;
        }

        // 3. Switch Turn if no extra turn
        if (extraTurn) {
            const actor = this.currentTurn === 'player' ? 'YOU' : 'AI';
            this.showScoreToast(`🎯 ${actor} EARNED AN EXTRA TURN!`, '#10B981');
        } else {
            if (this.gameMode !== 'solo') {
                this.currentTurn = this.currentTurn === 'player' ? 'ai' : 'player';
                this.updateStrikerStyleForTurn(this.currentTurn);
                const pColor = this.playerColor.toUpperCase();
                const aColor = this.aiColor.toUpperCase();
                const turnName = this.currentTurn === 'player'
                    ? `YOUR TURN (${pColor})`
                    : (this.gameMode === 'vs_ai' ? `AI OPPONENT'S TURN (${aColor})` : `PLAYER 2 TURN (${aColor})`);
                const turnColor = this.currentTurn === 'player' ? '#F59E0B' : '#00E5FF';
                this.showScoreToast(turnName, turnColor);
            }
        }

        // 4. Smooth return glide to the active baseline
        const stPos = this.striker.transform.position;
        const fromX = this.isStrikerOnBoard ? stPos.x : this.lastPottedPos.x;
        const fromY = this.isStrikerOnBoard ? stPos.y : this.lastPottedPos.y;

        this.gameState = 'positioning';
        this.startReturnAnimation(fromX, fromY, 0.48);
        this.soundEffects.playSlide();

        this.pottedThisShot = [];
        this.strikerFoulThisShot = false;
        this.canPickStrikerManually = false;
        this.aiQuietPickFrames = 0;
        if (this.strikerCollectGlow) {
            this.strikerCollectGlow.VISIBILITY = false;
        }
        this.updateUI();
    }

    /**
     * Finds an open, non-overlapping coordinate at the center or within the center circle.
     */
    private findPlacementInCenterCircle(): { x: number; y: number } {
        const minClearance = (this.COIN_RADIUS * 2) * 1.06;

        const isClear = (tx: number, ty: number) => {
            for (const other of this.coins) {
                if (other.potted) continue;
                const ox = other.entity.transform.position.x;
                const oy = other.entity.transform.position.y;
                if (Math.hypot(ox - tx, oy - ty) < minClearance) {
                    return false;
                }
            }
            return true;
        };

        // 1. Center spot (0, 0) is preferred if vacant
        if (isClear(0, 0)) {
            return { x: 0, y: 0 };
        }

        // 2. Concentric rings within the center circle (radii 1.12 to 2.70)
        const testRadii = [1.12, 1.65, 2.18, 2.70];
        for (const r of testRadii) {
            const steps = 16;
            for (let i = 0; i < steps; i++) {
                const angle = (i * 2 * Math.PI) / steps;
                const tx = Math.cos(angle) * r;
                const ty = Math.sin(angle) * r;
                if (isClear(tx, ty)) {
                    return { x: tx, y: ty };
                }
            }
        }

        return { x: (Math.random() - 0.5) * 1.5, y: (Math.random() - 0.5) * 1.5 };
    }

    /**
     * Re-spawns a collected/potted coin onto the board at or within the center circle.
     */
    private returnCoinToCenter(coin: CarromCoin): void {
        const placement = this.findPlacementInCenterCircle();

        // Detach old rigid body component if present
        const oldComp = coin.entity.getComponent(RigidBody2DComponent);
        if (oldComp) {
            coin.entity.removeComponent(oldComp);
        }

        // Reposition visual transforms
        coin.entity.transform.position.set([placement.x, placement.y, 0.01]);
        if (coin.shadow) coin.shadow.transform.position.set([placement.x + this.COIN_SHADOW_OFFSET_X, placement.y + this.COIN_SHADOW_OFFSET_Y, this.COIN_SHADOW_Z]);
        if (coin.innerRing) coin.innerRing.transform.position.set([placement.x, placement.y, 0.015]);
        if (coin.core) coin.core.transform.position.set([placement.x, placement.y, 0.016]);

        coin.entity.VISIBILITY = true;
        if (coin.shadow) coin.shadow.VISIBILITY = true;
        if (coin.innerRing) coin.innerRing.VISIBILITY = true;
        if (coin.core) coin.core.VISIBILITY = true;

        // Re-add to physics simulation
        coin.bodyComp = this.physics.add(coin.entity, {
            type: 'dynamic',
            mass: coin.type === 'queen' ? this.coinWeight * 1.05 : this.coinWeight,
            friction: this.boardFriction,
            restitution: 0.88,
            linearDamping: this.boardLinearDamping,
            angularDamping: 1.2,
            lockRotation: true
        });
        coin.potted = false;

        if (coin.bodyComp?.body) {
            if (typeof coin.bodyComp.body.setPosition === 'function') {
                coin.bodyComp.body.setPosition({ x: placement.x, y: placement.y });
            }
            if (typeof coin.bodyComp.body.setLinearVelocity === 'function') {
                coin.bodyComp.body.setLinearVelocity({ x: 0, y: 0 });
            }
            if (typeof coin.bodyComp.body.setAngularVelocity === 'function') {
                coin.bodyComp.body.setAngularVelocity(0);
            }
        }

        this.soundEffects.playClack(0.5);
    }

    /**
     * Official Carrom Foul & Penalty Rules:
     * When a player commits a foul (striker potted):
     * 1. Any of the fouling player's own coins that fell during this foul shot are ILLEGAL
     *    and must be returned to the center circle (with their tentative points reverted).
     * 2. If the Queen was pocketed during this foul shot, it is returned to the center circle.
     * 3. In addition, a Penalty/Fine of 1 previously collected coin must be returned to the
     *    center circle IF the player had previously collected coins.
     */
    private handleFoulPenaltyCoinReturn(foulingPlayer: 'player' | 'ai'): void {
        const targetType = (foulingPlayer === 'player' || this.gameMode === 'solo') ? this.playerColor : this.aiColor;

        // A. If Queen was pocketed during this foul shot, return it to center
        const queenInShot = this.pottedThisShot.find(c => c.type === 'queen');
        if (queenInShot) {
            this.returnCoinToCenter(queenInShot);
            this.queenPocketed = false;
            this.queenCapturedBy = 'none';
            if (foulingPlayer === 'player') {
                this.playerScore = Math.max(0, this.playerScore - 25);
                this.score = this.playerScore;
            } else {
                this.aiScore = Math.max(0, this.aiScore - 25);
            }
        }

        // B. Return any self-color coins that fell during THIS foul shot (illegal pocketing on foul)
        const fallenSelfCoins = this.pottedThisShot.filter(c => c.type === targetType);
        for (const coin of fallenSelfCoins) {
            this.returnCoinToCenter(coin);

            // Revert tentative points and restore piece count
            if (foulingPlayer === 'player') {
                if (this.playerColor === 'white') {
                    this.whiteCoinsLeft = Math.min(9, this.whiteCoinsLeft + 1);
                } else {
                    this.blackCoinsLeft = Math.min(9, this.blackCoinsLeft + 1);
                }
                this.playerScore = Math.max(0, this.playerScore - 10);
                this.score = this.playerScore;
            } else {
                if (this.aiColor === 'black') {
                    this.blackCoinsLeft = Math.min(9, this.blackCoinsLeft + 1);
                } else {
                    this.whiteCoinsLeft = Math.min(9, this.whiteCoinsLeft + 1);
                }
                this.aiScore = Math.max(0, this.aiScore - 10);
            }
        }

        // C. Return 1 Penalty / Fine Coin from PREVIOUSLY collected pieces (if any exist)
        // Since all fallenSelfCoins already had coin.potted set to false by returnCoinToCenter,
        // finding a coin with c.potted === true strictly finds previously collected coins!
        const previouslyCollectedCoin = this.coins.find(c => c.potted && c.type === targetType);
        let fineReturned = false;

        if (previouslyCollectedCoin) {
            this.returnCoinToCenter(previouslyCollectedCoin);
            fineReturned = true;

            if (foulingPlayer === 'player') {
                if (this.playerColor === 'white') {
                    this.whiteCoinsLeft = Math.min(9, this.whiteCoinsLeft + 1);
                } else {
                    this.blackCoinsLeft = Math.min(9, this.blackCoinsLeft + 1);
                }
                this.playerScore = Math.max(0, this.playerScore - 10);
                this.score = this.playerScore;
            } else {
                if (this.aiColor === 'black') {
                    this.blackCoinsLeft = Math.min(9, this.blackCoinsLeft + 1);
                } else {
                    this.whiteCoinsLeft = Math.min(9, this.whiteCoinsLeft + 1);
                }
                this.aiScore = Math.max(0, this.aiScore - 10);
            }
        }

        // D. Dynamic informative toast notification
        const colorName = targetType.toUpperCase();
        if (fallenSelfCoins.length > 0 && fineReturned) {
            this.showScoreToast(`FOUL: 1 FINE + ${fallenSelfCoins.length} FALLEN ${colorName} RETURNED TO CENTER`, "#EF4444");
        } else if (fallenSelfCoins.length > 0 && !fineReturned) {
            this.showScoreToast(`FOUL: ${fallenSelfCoins.length} FALLEN ${colorName} RETURNED (NO PREV COIN FOR FINE)`, "#EF4444");
        } else if (fineReturned) {
            this.showScoreToast(`FOUL PENALTY: 1 ${colorName} RETURNED TO CENTER`, "#EF4444");
        } else if (queenInShot) {
            this.showScoreToast(`FOUL: QUEEN RETURNED TO CENTER`, "#EF4444");
        } else {
            this.showScoreToast(`FOUL: NO COLLECTED COIN TO RETURN`, "#EF4444");
        }
    }

    private startReturnAnimation(startX: number, startY: number, duration: number = 0.45): void {
        this.isReturningToMouse = true;
        this.returnAnimProgress = 0;
        this.returnAnimDuration = duration;
        this.returnAnimStartX = startX;
        this.returnAnimStartY = startY;

        this.setStrikerVisualPosition(startX, startY);

        if (this.strikerBodyComp?.body) {
            this.strikerBodyComp.body.setActive(false);
            this.strikerBodyComp.body.setLinearVelocity({ x: 0, y: 0 });
            this.strikerBodyComp.body.setAngularVelocity(0);
        }
    }

    private setStrikerVisualPosition(x: number, y: number): void {
        this.strikerX = x;
        this.striker.transform.position.set([x, y, 0.02]);
        if (this.strikerShadow) this.strikerShadow.transform.position.set([x + this.STRIKER_SHADOW_OFFSET_X, y + this.STRIKER_SHADOW_OFFSET_Y, this.STRIKER_SHADOW_Z]);
        if (this.strikerOuterRing) this.strikerOuterRing.transform.position.set([x, y, 0.023]);
        this.strikerInner.transform.position.set([x, y, 0.025]);
        this.strikerCore.transform.position.set([x, y, 0.026]);
        if (this.strikerPip) this.strikerPip.transform.position.set([x, y, 0.027]);

        this.striker.VISIBILITY = true;
        if (this.strikerShadow) this.strikerShadow.VISIBILITY = true;
        if (this.strikerOuterRing) this.strikerOuterRing.VISIBILITY = true;
        this.strikerInner.VISIBILITY = true;
        this.strikerCore.VISIBILITY = true;
        if (this.strikerPip) this.strikerPip.VISIBILITY = true;
        if (this.strikerCollectGlow) this.strikerCollectGlow.VISIBILITY = false;
        this.isStrikerOnBoard = true;

        if (this.strikerBodyComp?.body) {
            this.strikerBodyComp.body.setPosition({ x, y });
            this.strikerBodyComp.body.setLinearVelocity({ x: 0, y: 0 });
            this.strikerBodyComp.body.setAngularVelocity(0);
            this.strikerBodyComp.body.setActive(false);
        }
    }

    private resetStrikerToBaseline(targetX: number): void {
        const clampedX = Math.max(this.BASELINE_MIN_X, Math.min(this.BASELINE_MAX_X, targetX));
        this.setStrikerVisualPosition(clampedX, this.getCurrentBaselineY());
    }

    /**
     * Shifts striker along baseline during positioning phase
     */
    public setStrikerBaselinePosition(normPos: number): void {
        if (this.gameState !== 'positioning') return;
        const newX = this.BASELINE_MIN_X + normPos * (this.BASELINE_MAX_X - this.BASELINE_MIN_X);
        this.resetStrikerToBaseline(newX);
    }

    /**
     * Restarts the Carrom game cleanly
     */
    public restartGame(): void {
        if (this.aiThinkingTimer) clearTimeout(this.aiThinkingTimer);
        if (this.aiAimingTimer) clearTimeout(this.aiAimingTimer);
        this.aiThinkingTimer = null;
        this.aiAimingTimer = null;

        // Remove existing coins
        for (const coin of this.coins) {
            this.physics.remove(coin.entity, true);
            if (coin.shadow) this.remove(coin.shadow);
            if (coin.innerRing) this.remove(coin.innerRing);
            if (coin.core) this.remove(coin.core);
        }
        this.coins = [];

        // Reset state
        this.score = 0;
        this.playerScore = 0;
        this.aiScore = 0;
        this.shotsTaken = 0;
        this.playerShotsTaken = 0;
        this.aiShotsTaken = 0;
        this.queenPocketed = false;
        this.queenCapturedBy = 'none';
        this.whiteCoinsLeft = 9;
        this.blackCoinsLeft = 9;
        this.winner = null;
        this.currentTurn = this.breakerFirst;
        this.updateStrikerStyleForTurn(this.currentTurn);
        this.gameState = 'positioning';
        this.framesInRoll = 0;
        this.quietRollFrames = 0;
        this.pottedThisShot = [];
        this.strikerFoulThisShot = false;
        this.canPickStrikerManually = false;
        this.aiQuietPickFrames = 0;
        if (this.strikerCollectGlow) this.strikerCollectGlow.VISIBILITY = false;

        // Re-spawn rosette at current angle
        this.spawnRosette((this.rosetteAngleDeg * Math.PI) / 180);
        this.resetStrikerToBaseline(0);
        this.updateUI();

        if (this.currentTurn === 'ai' && this.gameMode === 'vs_ai') {
            this.triggerAITurnSequence();
        }
    }

    /**
     * Injects a luxury tournament glassmorphism HUD overlay with 2-player scoreboards,
     * AI difficulty control, and interactive game mode switching.
     */
    private createUI(): void {
        const existing = document.getElementById("carrom-ui-container");
        if (existing) existing.remove();

        const container = document.createElement("div");
        container.id = "carrom-ui-container";
        container.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            padding: 8px 16px;
            box-sizing: border-box;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
            color: #F1F5F9;
            z-index: 100;
        `;

        container.innerHTML = `
            <style>
                #carrom-ui-container button:focus-visible, #carrom-ui-container input:focus-visible { outline: 2px solid #38BDF8; outline-offset: 3px; }
                #carrom-ui-container .carrom-scoreboard { max-width: 100%; box-sizing: border-box; }
                #carrom-ui-container #ui-setup-drawer { box-sizing: border-box; max-height: 65vh; overflow: auto; }
                @media (max-width: 720px) {
                    #carrom-ui-container { padding: 8px !important; }
                    #carrom-ui-container .carrom-scoreboard { flex-wrap: wrap; justify-content: center; gap: 6px !important; padding: 8px !important; }
                    #carrom-ui-container .carrom-scoreboard > div { padding: 4px 8px !important; }
                    #carrom-ui-container #ui-turn-status { font-size: 11px !important; line-height: 1.5; }
                    #carrom-ui-container #ui-tab-panel-setup, #carrom-ui-container #ui-tab-panel-physics { grid-template-columns: 1fr !important; }
                }
            </style>
            <!-- Top Section: Scoreboard + Setup Drawer -->
            <div style="
                align-self: center;
                display: flex;
                flex-direction: column;
                align-items: center;
                width: 100%;
                gap: 4px;
                pointer-events: none;
            ">
                <!-- Top Glassmorphic Luxury 2-Player Championship Scoreboard -->
                <div class="carrom-scoreboard" style="
                    align-self: center;
                    display: flex;
                    align-items: center;
                    gap: 14px;
                    background: linear-gradient(135deg, rgba(26, 20, 16, 0.92), rgba(16, 13, 11, 0.96));
                    backdrop-filter: blur(28px);
                    -webkit-backdrop-filter: blur(28px);
                    border: 1px solid rgba(212, 175, 55, 0.35);
                    border-radius: 18px;
                    padding: 8px 18px;
                    box-shadow: 0 12px 36px rgba(0, 0, 0, 0.75), inset 0 1px 0 rgba(255, 235, 170, 0.18);
                    pointer-events: auto;
                ">
                    <!-- Player 1 Card (You - White) -->
                    <div id="ui-player1-card" style="
                        display: flex;
                        align-items: center;
                        gap: 12px;
                        padding: 6px 14px;
                        border-radius: 14px;
                        border: 1px solid rgba(251, 191, 36, 0.8);
                        background: rgba(251, 191, 36, 0.12);
                        box-shadow: 0 0 14px rgba(251, 191, 36, 0.25);
                        transition: all 0.3s ease;
                    ">
                        <div style="
                            width: 28px;
                            height: 28px;
                            border-radius: 50%;
                            background: radial-gradient(circle at 35% 35%, #FFFFFF, #CBD5E1);
                            border: 2px solid #D4AF37;
                            box-shadow: 0 2px 6px rgba(0,0,0,0.4);
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-size: 11px;
                            font-weight: 800;
                            color: #1E293B;
                        ">P1</div>
                        <div style="text-align: left;">
                            <div id="ui-p1-title" style="font-size: 9px; font-weight: 700; text-transform: uppercase; color: #D4AF37; letter-spacing: 0.8px;">You (White)</div>
                            <div style="display: flex; align-items: baseline; gap: 8px;">
                                <span id="ui-score-p1" style="font-size: 22px; font-weight: 800; color: #FBBF24; text-shadow: 0 0 10px rgba(251, 191, 36, 0.35);">0</span>
                                <span id="ui-coins-p1" style="font-size: 11px; font-weight: 700; color: #E2E8F0;">⚪ 9 left</span>
                            </div>
                        </div>
                    </div>

                    <div style="width: 1px; height: 36px; background: rgba(212, 175, 55, 0.25);"></div>

                    <!-- Center Match Controls & Queen Indicator -->
                    <div style="display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 0 6px;">
                        <!-- Queen Status Badge -->
                        <div style="
                            display: flex;
                            align-items: center;
                            gap: 6px;
                            background: rgba(0,0,0,0.35);
                            padding: 3px 10px;
                            border-radius: 12px;
                            border: 1px solid rgba(212, 175, 55, 0.25);
                        ">
                            <div style="
                                width: 10px;
                                height: 10px;
                                border-radius: 50%;
                                background: #EF4444;
                                box-shadow: 0 0 8px #EF4444;
                                border: 1px solid #FBBF24;
                            "></div>
                            <span id="ui-queen-status" style="font-size: 10px; font-weight: 700; color: #F87171; letter-spacing: 0.5px;">Queen: In Play (25pt)</span>
                        </div>

                        <!-- Interactive Mode & Difficulty Buttons -->
                        <div style="display: flex; gap: 6px; align-items: center; margin-top: 2px;">
                            <button id="ui-mode-btn" style="
                                background: rgba(255, 255, 255, 0.08);
                                border: 1px solid rgba(212, 175, 55, 0.3);
                                color: #FAF7F2;
                                padding: 4px 10px;
                                border-radius: 8px;
                                font-size: 10px;
                                font-weight: 700;
                                cursor: pointer;
                                transition: all 0.2s;
                            ">Mode: Vs AI</button>

                            <button id="ui-diff-btn" style="
                                background: rgba(0, 229, 255, 0.12);
                                border: 1px solid rgba(0, 229, 255, 0.4);
                                color: #38BDF8;
                                padding: 4px 10px;
                                border-radius: 8px;
                                font-size: 10px;
                                font-weight: 700;
                                cursor: pointer;
                                transition: all 0.2s;
                            ">AI: Master</button>

                            <button id="ui-setup-btn" style="
                                background: rgba(251, 191, 36, 0.15);
                                border: 1px solid rgba(251, 191, 36, 0.6);
                                color: #FBBF24;
                                padding: 4px 10px;
                                border-radius: 8px;
                                font-size: 10px;
                                font-weight: 700;
                                cursor: pointer;
                                transition: all 0.2s;
                            ">⚙ Setup ⚡</button>

                            <button id="ui-restart-btn" style="
                                background: linear-gradient(135deg, rgba(212, 175, 55, 0.25), rgba(212, 175, 55, 0.1));
                                border: 1px solid rgba(212, 175, 55, 0.6);
                                color: #FBBF24;
                                padding: 4px 12px;
                                border-radius: 8px;
                                font-size: 10px;
                                font-weight: 700;
                                cursor: pointer;
                                transition: all 0.2s;
                            ">Reset</button>
                        </div>
                    </div>

                    <div style="width: 1px; height: 36px; background: rgba(212, 175, 55, 0.25);"></div>

                    <!-- Player 2 Card (AI Opponent - Black) -->
                    <div id="ui-player2-card" style="
                        display: flex;
                        align-items: center;
                        gap: 12px;
                        padding: 6px 14px;
                        border-radius: 14px;
                        border: 1px solid rgba(255, 255, 255, 0.08);
                        background: rgba(0, 0, 0, 0.2);
                        transition: all 0.3s ease;
                    ">
                        <div style="text-align: right;">
                            <div id="ui-p2-title" style="font-size: 9px; font-weight: 700; text-transform: uppercase; color: #38BDF8; letter-spacing: 0.8px;">AI Opponent (Black)</div>
                            <div style="display: flex; align-items: baseline; justify-content: flex-end; gap: 8px;">
                                <span id="ui-coins-p2" style="font-size: 11px; font-weight: 700; color: #94A3B8;">⚫ 9 left</span>
                                <span id="ui-score-p2" style="font-size: 22px; font-weight: 800; color: #00E5FF; text-shadow: 0 0 10px rgba(0, 229, 255, 0.35);">0</span>
                            </div>
                        </div>
                        <div id="ui-p2-avatar" style="
                            width: 28px;
                            height: 28px;
                            border-radius: 50%;
                            background: radial-gradient(circle at 35% 35%, #334155, #0B132B);
                            border: 2px solid #00E5FF;
                            box-shadow: 0 0 8px rgba(0, 229, 255, 0.4);
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-size: 11px;
                            font-weight: 800;
                            color: #00E5FF;
                        ">AI</div>
                    </div>
                </div>

                <!-- Pre-Break First-Hit Customization Drawer (Tucked right below scoreboard) -->
                <div id="ui-setup-drawer" style="
                    display: none;
                    width: 95%;
                    max-width: 720px;
                    background: linear-gradient(135deg, rgba(20, 16, 14, 0.95), rgba(12, 10, 9, 0.97));
                    backdrop-filter: blur(20px);
                    -webkit-backdrop-filter: blur(20px);
                    border: 1px solid rgba(212, 175, 55, 0.4);
                    border-radius: 12px;
                    padding: 6px 12px 7px 12px;
                    box-shadow: 0 8px 28px rgba(0, 0, 0, 0.8), 0 0 16px rgba(212, 175, 55, 0.15);
                    pointer-events: auto;
                    z-index: 120;
                    transition: all 0.2s ease;
                ">
                    <!-- Compact Header with Tabs & Done Button -->
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px; border-bottom: 1px solid rgba(212, 175, 55, 0.18); padding-bottom: 4px;">
                        <div style="display: flex; align-items: center; gap: 6px;">
                            <!-- Tabs -->
                            <button id="ui-tab-btn-setup" style="
                                background: rgba(251, 191, 36, 0.22);
                                border: 1px solid rgba(251, 191, 36, 0.6);
                                color: #FBBF24;
                                padding: 2px 8px;
                                border-radius: 5px;
                                font-size: 9px;
                                font-weight: 800;
                                cursor: pointer;
                                transition: all 0.2s;
                            ">⚡ Setup & Break</button>
                            <button id="ui-tab-btn-physics" style="
                                background: rgba(255, 255, 255, 0.06);
                                border: 1px solid rgba(255, 255, 255, 0.15);
                                color: #94A3B8;
                                padding: 2px 8px;
                                border-radius: 5px;
                                font-size: 9px;
                                font-weight: 800;
                                cursor: pointer;
                                transition: all 0.2s;
                            ">⚙ Physics & Board</button>
                            <span id="ui-setup-lock-tag" style="font-size: 8px; font-weight: 700; background: rgba(16, 185, 129, 0.2); color: #10B981; border: 1px solid rgba(16, 185, 129, 0.5); padding: 1px 5px; border-radius: 4px;">PRE-BREAK</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <button id="ui-setup-apply-btn" style="
                                background: linear-gradient(135deg, #10B981, #059669);
                                border: 1px solid #34D399;
                                color: #FFFFFF;
                                padding: 2px 10px;
                                border-radius: 5px;
                                font-size: 9px;
                                font-weight: 800;
                                cursor: pointer;
                                box-shadow: 0 0 8px rgba(16, 185, 129, 0.4);
                                transition: all 0.2s;
                            ">✓ Done</button>
                            <button id="ui-setup-close-btn" style="background: transparent; border: none; color: #94A3B8; font-size: 13px; cursor: pointer; padding: 1px 4px; line-height: 1;">✕</button>
                        </div>
                    </div>

                    <!-- Tab 1: Setup & Break Panel -->
                    <div id="ui-tab-panel-setup" style="display: grid; grid-template-columns: 1.35fr 1fr 1fr; gap: 8px;">
                        <!-- Column 1: Rotate Coin Rosette -->
                        <div style="background: rgba(0, 0, 0, 0.32); padding: 5px 8px; border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.08);">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px;">
                                <span style="font-size: 9px; font-weight: 700; color: #FAF7F2;">🔄 Rotate Structure</span>
                                <span id="ui-rot-label" style="font-size: 10px; font-weight: 800; color: #00E5FF; font-family: monospace;">0°</span>
                            </div>
                            <div style="display: flex; align-items: center; gap: 4px; margin-bottom: 4px;">
                                <button id="ui-rot-minus15" title="Rotate -15°" style="background: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.15); color: #E2E8F0; width: 20px; height: 18px; border-radius: 4px; cursor: pointer; font-size: 9px; font-weight: 700; line-height: 1;">↺</button>
                                <input id="ui-rot-slider" type="range" min="0" max="360" value="0" step="1" style="flex: 1; accent-color: #00E5FF; cursor: pointer; height: 3px;" />
                                <button id="ui-rot-plus15" title="Rotate +15°" style="background: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.15); color: #E2E8F0; width: 20px; height: 18px; border-radius: 4px; cursor: pointer; font-size: 9px; font-weight: 700; line-height: 1;">↻</button>
                            </div>
                            <div style="display: flex; gap: 3px; flex-wrap: wrap;">
                                <button class="ui-rot-preset" data-deg="0" style="background: rgba(255, 255, 255, 0.06); border: 1px solid rgba(255, 255, 255, 0.12); color: #CBD5E1; padding: 1px 5px; border-radius: 4px; font-size: 8px; cursor: pointer;">0°</button>
                                <button class="ui-rot-preset" data-deg="15" style="background: rgba(255, 255, 255, 0.06); border: 1px solid rgba(255, 255, 255, 0.12); color: #CBD5E1; padding: 1px 5px; border-radius: 4px; font-size: 8px; cursor: pointer;">15°</button>
                                <button class="ui-rot-preset" data-deg="30" style="background: rgba(255, 255, 255, 0.06); border: 1px solid rgba(255, 255, 255, 0.12); color: #CBD5E1; padding: 1px 5px; border-radius: 4px; font-size: 8px; cursor: pointer;">30°</button>
                                <button class="ui-rot-preset" data-deg="45" style="background: rgba(255, 255, 255, 0.06); border: 1px solid rgba(255, 255, 255, 0.12); color: #CBD5E1; padding: 1px 5px; border-radius: 4px; font-size: 8px; cursor: pointer;">45°</button>
                                <button class="ui-rot-preset" data-deg="60" style="background: rgba(255, 255, 255, 0.06); border: 1px solid rgba(255, 255, 255, 0.12); color: #CBD5E1; padding: 1px 5px; border-radius: 4px; font-size: 8px; cursor: pointer;">60°</button>
                                <button id="ui-rot-spin" style="background: rgba(232, 121, 249, 0.15); border: 1px solid rgba(232, 121, 249, 0.4); color: #E879F9; padding: 1px 5px; border-radius: 4px; font-size: 8px; cursor: pointer; font-weight: 700;">🎲 Spin</button>
                            </div>
                        </div>

                        <!-- Column 2: Piece Color & First Strike -->
                        <div style="background: rgba(0, 0, 0, 0.32); padding: 5px 8px; border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.08); display: flex; flex-direction: column; justify-content: space-between; gap: 4px;">
                            <div>
                                <div style="font-size: 8px; font-weight: 700; color: #FAF7F2; margin-bottom: 2px;">🎨 Piece Color:</div>
                                <div style="display: flex; gap: 4px;">
                                    <button id="ui-choose-white" style="flex: 1; display: flex; align-items: center; justify-content: center; gap: 3px; background: rgba(255, 255, 255, 0.15); border: 1px solid #FAF7F2; color: #FAF7F2; padding: 2px 4px; border-radius: 4px; font-size: 8px; font-weight: 700; cursor: pointer;">
                                        <span>⚪ White</span>
                                    </button>
                                    <button id="ui-choose-black" style="flex: 1; display: flex; align-items: center; justify-content: center; gap: 3px; background: rgba(0, 0, 0, 0.4); border: 1px solid rgba(255, 255, 255, 0.2); color: #94A3B8; padding: 2px 4px; border-radius: 4px; font-size: 8px; font-weight: 700; cursor: pointer;">
                                        <span>⚫ Black</span>
                                    </button>
                                </div>
                            </div>
                            <div>
                                <div style="font-size: 8px; font-weight: 700; color: #FAF7F2; margin-bottom: 2px;">🎯 First Strike:</div>
                                <div style="display: flex; gap: 4px;">
                                    <button id="ui-breaker-player" style="flex: 1; background: rgba(245, 158, 11, 0.18); border: 1px solid #F59E0B; color: #FBBF24; padding: 2px 4px; border-radius: 4px; font-size: 8px; font-weight: 700; cursor: pointer;">
                                        You Break
                                    </button>
                                    <button id="ui-breaker-ai" style="flex: 1; background: rgba(255, 255, 255, 0.06); border: 1px solid rgba(255, 255, 255, 0.15); color: #94A3B8; padding: 2px 4px; border-radius: 4px; font-size: 8px; font-weight: 700; cursor: pointer;">
                                        AI Breaks
                                    </button>
                                </div>
                            </div>
                        </div>

                        <!-- Column 3: Striker Style -->
                        <div style="background: rgba(0, 0, 0, 0.32); padding: 5px 8px; border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.08); display: flex; flex-direction: column; justify-content: space-between;">
                            <div style="font-size: 8px; font-weight: 700; color: #FAF7F2; margin-bottom: 3px;">💎 Striker Style:</div>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 3px;">
                                <button class="ui-theme-swatch" data-theme="ivory" style="background: #FFFDF7; border: 2px solid #D97706; color: #1C2128; font-size: 8px; font-weight: 800; padding: 3px 2px; border-radius: 4px; cursor: pointer; text-align: center;">Ivory</button>
                                <button class="ui-theme-swatch" data-theme="obsidian" style="background: #0B132B; border: 1px solid #00E5FF; color: #00E5FF; font-size: 8px; font-weight: 800; padding: 3px 2px; border-radius: 4px; cursor: pointer; text-align: center;">Obsidian</button>
                                <button class="ui-theme-swatch" data-theme="ruby" style="background: #7F1D1D; border: 1px solid #F59E0B; color: #FBBF24; font-size: 8px; font-weight: 800; padding: 3px 2px; border-radius: 4px; cursor: pointer; text-align: center;">Ruby</button>
                                <button class="ui-theme-swatch" data-theme="emerald" style="background: #064E3B; border: 1px solid #10B981; color: #34D399; font-size: 8px; font-weight: 800; padding: 3px 2px; border-radius: 4px; cursor: pointer; text-align: center;">Emerald</button>
                            </div>
                        </div>
                    </div>

                    <!-- Tab 2: Physics & Board Tuning Panel -->
                    <div id="ui-tab-panel-physics" style="display: none; grid-template-columns: repeat(5, 1fr); gap: 6px;">
                        <!-- Col 1: Striker Weight -->
                        <div style="background: rgba(0, 0, 0, 0.32); padding: 5px 8px; border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.08); display: flex; flex-direction: column; justify-content: space-between;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
                                <span style="font-size: 9px; font-weight: 700; color: #FAF7F2;">⚖ Striker Mass</span>
                                <span id="ui-striker-weight-label" style="font-size: 10px; font-weight: 800; color: #FBBF24; font-family: monospace;">4.5g</span>
                            </div>
                            <input id="ui-striker-weight-slider" type="range" min="2.5" max="6.5" step="0.1" value="4.5" style="width: 100%; accent-color: #FBBF24; cursor: pointer; height: 3px; margin: 3px 0;" />
                            <div style="display: flex; gap: 3px;">
                                <button class="ui-striker-weight-preset" data-weight="3.2" style="flex: 1; background: rgba(255, 255, 255, 0.06); border: 1px solid rgba(255, 255, 255, 0.12); color: #CBD5E1; padding: 1px 3px; border-radius: 4px; font-size: 8px; cursor: pointer;">3.2g</button>
                                <button class="ui-striker-weight-preset" data-weight="4.5" style="flex: 1; background: rgba(251, 191, 36, 0.2); border: 1px solid #FBBF24; color: #FBBF24; padding: 1px 3px; border-radius: 4px; font-size: 8px; font-weight: 700; cursor: pointer;">4.5g</button>
                                <button class="ui-striker-weight-preset" data-weight="5.8" style="flex: 1; background: rgba(255, 255, 255, 0.06); border: 1px solid rgba(255, 255, 255, 0.12); color: #CBD5E1; padding: 1px 3px; border-radius: 4px; font-size: 8px; cursor: pointer;">5.8g</button>
                            </div>
                        </div>

                        <!-- Col 2: Coin Weight -->
                        <div style="background: rgba(0, 0, 0, 0.32); padding: 5px 8px; border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.08); display: flex; flex-direction: column; justify-content: space-between;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
                                <span style="font-size: 9px; font-weight: 700; color: #FAF7F2;">🪙 Coin Mass</span>
                                <span id="ui-coin-weight-label" style="font-size: 10px; font-weight: 800; color: #38BDF8; font-family: monospace;">1.8g</span>
                            </div>
                            <input id="ui-coin-weight-slider" type="range" min="1.0" max="2.8" step="0.1" value="1.8" style="width: 100%; accent-color: #38BDF8; cursor: pointer; height: 3px; margin: 3px 0;" />
                            <div style="display: flex; gap: 3px;">
                                <button class="ui-coin-weight-preset" data-weight="1.2" style="flex: 1; background: rgba(255, 255, 255, 0.06); border: 1px solid rgba(255, 255, 255, 0.12); color: #CBD5E1; padding: 1px 3px; border-radius: 4px; font-size: 8px; cursor: pointer;">1.2g</button>
                                <button class="ui-coin-weight-preset" data-weight="1.8" style="flex: 1; background: rgba(56, 189, 248, 0.2); border: 1px solid #38BDF8; color: #38BDF8; padding: 1px 3px; border-radius: 4px; font-size: 8px; font-weight: 700; cursor: pointer;">1.8g</button>
                                <button class="ui-coin-weight-preset" data-weight="2.4" style="flex: 1; background: rgba(255, 255, 255, 0.06); border: 1px solid rgba(255, 255, 255, 0.12); color: #CBD5E1; padding: 1px 3px; border-radius: 4px; font-size: 8px; cursor: pointer;">2.4g</button>
                            </div>
                        </div>

                        <!-- Col 3: Board Friction / Boric Powder -->
                        <div style="background: rgba(0, 0, 0, 0.32); padding: 5px 8px; border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.08); display: flex; flex-direction: column; justify-content: space-between;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
                                <span style="font-size: 9px; font-weight: 700; color: #FAF7F2;">❄ Board Friction</span>
                                <span id="ui-friction-label" style="font-size: 10px; font-weight: 800; color: #34D399; font-family: monospace;">Std (0.05)</span>
                            </div>
                            <input id="ui-friction-slider" type="range" min="0.01" max="0.15" step="0.005" value="0.05" style="width: 100%; accent-color: #34D399; cursor: pointer; height: 3px; margin: 3px 0;" />
                            <div style="display: flex; gap: 3px;">
                                <button class="ui-friction-preset" data-f="0.02" data-d="0.6" style="flex: 1; background: rgba(255, 255, 255, 0.06); border: 1px solid rgba(255, 255, 255, 0.12); color: #CBD5E1; padding: 1px 3px; border-radius: 4px; font-size: 8px; cursor: pointer;">0.02 (Slick)</button>
                                <button class="ui-friction-preset" data-f="0.05" data-d="1.0" style="flex: 1; background: rgba(16, 185, 129, 0.2); border: 1px solid #10B981; color: #34D399; padding: 1px 3px; border-radius: 4px; font-size: 8px; font-weight: 700; cursor: pointer;">0.05 (Std)</button>
                                <button class="ui-friction-preset" data-f="0.10" data-d="1.5" style="flex: 1; background: rgba(255, 255, 255, 0.06); border: 1px solid rgba(255, 255, 255, 0.12); color: #CBD5E1; padding: 1px 3px; border-radius: 4px; font-size: 8px; cursor: pointer;">0.10 (Rough)</button>
                            </div>
                        </div>

                        <!-- Col 4: Strike Force Multiplier -->
                        <div style="background: rgba(0, 0, 0, 0.32); padding: 5px 8px; border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.08); display: flex; flex-direction: column; justify-content: space-between;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
                                <span style="font-size: 9px; font-weight: 700; color: #FAF7F2;">⚡ Strike Force</span>
                                <span id="ui-force-label" style="font-size: 10px; font-weight: 800; color: #E879F9; font-family: monospace;">1.0x</span>
                            </div>
                            <input id="ui-force-slider" type="range" min="0.5" max="5.0" step="0.1" value="1.0" style="width: 100%; accent-color: #E879F9; cursor: pointer; height: 3px; margin: 3px 0;" />
                            <div style="display: flex; gap: 3px;">
                                <button class="ui-force-preset" data-force="1.0" style="flex: 1; background: rgba(232, 121, 249, 0.2); border: 1px solid #E879F9; color: #E879F9; padding: 1px 3px; border-radius: 4px; font-size: 8px; font-weight: 700; cursor: pointer;">1.0x</button>
                                <button class="ui-force-preset" data-force="2.5" style="flex: 1; background: rgba(255, 255, 255, 0.06); border: 1px solid rgba(255, 255, 255, 0.12); color: #CBD5E1; padding: 1px 3px; border-radius: 4px; font-size: 8px; cursor: pointer;">2.5x</button>
                                <button class="ui-force-preset" data-force="5.0" style="flex: 1; background: rgba(255, 255, 255, 0.06); border: 1px solid rgba(255, 255, 255, 0.12); color: #CBD5E1; padding: 1px 3px; border-radius: 4px; font-size: 8px; cursor: pointer;">5.0x</button>
                            </div>
                        </div>

                        <!-- Col 5: Manual Pickup Threshold -->
                        <div style="background: rgba(0, 0, 0, 0.32); padding: 5px 8px; border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.08); display: flex; flex-direction: column; justify-content: space-between;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
                                <span style="font-size: 9px; font-weight: 700; color: #FAF7F2;" title="Striker speed below which manual collection is allowed (foul protection active)">✋ Pick Speed</span>
                                <span id="ui-pick-label" style="font-size: 10px; font-weight: 800; color: #F59E0B; font-family: monospace;">0.45 u/s</span>
                            </div>
                            <input id="ui-pick-slider" type="range" min="0.15" max="1.00" step="0.05" value="0.45" style="width: 100%; accent-color: #F59E0B; cursor: pointer; height: 3px; margin: 3px 0;" />
                            <div style="display: flex; gap: 3px;">
                                <button class="ui-pick-preset" data-pick="0.30" style="flex: 1; background: rgba(255, 255, 255, 0.06); border: 1px solid rgba(255, 255, 255, 0.12); color: #CBD5E1; padding: 1px 3px; border-radius: 4px; font-size: 8px; cursor: pointer;">0.30</button>
                                <button class="ui-pick-preset" data-pick="0.45" style="flex: 1; background: rgba(245, 158, 11, 0.2); border: 1px solid #F59E0B; color: #F59E0B; padding: 1px 3px; border-radius: 4px; font-size: 8px; font-weight: 700; cursor: pointer;">0.45 (Std)</button>
                                <button class="ui-pick-preset" data-pick="0.75" style="flex: 1; background: rgba(255, 255, 255, 0.06); border: 1px solid rgba(255, 255, 255, 0.12); color: #CBD5E1; padding: 1px 3px; border-radius: 4px; font-size: 8px; cursor: pointer;">0.75 (Fast)</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Toast Notification Container -->
            <div id="ui-toast-container" style="
                align-self: center;
                min-height: 32px;
                display: flex;
                justify-content: center;
                align-items: center;
            "></div>

            <!-- Bottom Floating Guidance Pill -->
            <div id="ui-guidance-container" style="
                align-self: center;
                display: flex;
                align-items: center;
                gap: 10px;
                background: linear-gradient(135deg, rgba(20, 16, 14, 0.88), rgba(12, 10, 9, 0.94));
                backdrop-filter: blur(20px);
                -webkit-backdrop-filter: blur(20px);
                border: 1px solid rgba(212, 175, 55, 0.25);
                border-radius: 24px;
                padding: 10px 24px;
                pointer-events: auto;
                cursor: pointer;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 235, 170, 0.1);
            " title="Click to pick up striker when coasting slowly">
                <div id="ui-status-dot" style="
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background: #F59E0B;
                    box-shadow: 0 0 8px #F59E0B;
                "></div>
                <div id="ui-turn-status" style="font-size: 12px; font-weight: 600; color: #E2E8F0; letter-spacing: 0.3px;">
                    Your turn • Move mouse along baseline • Click striker to aim
                </div>
            </div>
        `;

        document.body.appendChild(container);
        this.uiContainer = container;

        // Wire Mode Button
        const modeBtn = document.getElementById("ui-mode-btn");
        if (modeBtn) {
            modeBtn.addEventListener("click", () => {
                if (this.gameMode === 'vs_ai') {
                    this.gameMode = 'pass_and_play';
                } else if (this.gameMode === 'pass_and_play') {
                    this.gameMode = 'solo';
                } else {
                    this.gameMode = 'vs_ai';
                }
                this.restartGame();
            });
        }

        // Wire Difficulty Button
        const diffBtn = document.getElementById("ui-diff-btn");
        if (diffBtn) {
            diffBtn.addEventListener("click", () => {
                const diffTiers: AIDifficulty[] = ['novice', 'amateur', 'expert', 'master'];
                const nextIdx = (diffTiers.indexOf(this.aiDifficulty) + 1) % diffTiers.length;
                this.aiDifficulty = diffTiers[nextIdx];

                const toastStyles: Record<AIDifficulty, { title: string; color: string }> = {
                    novice: { title: 'AI DIFFICULTY: NOVICE (L1 - CASUAL)', color: '#10B981' },
                    amateur: { title: 'AI DIFFICULTY: AMATEUR (L2 - MODERATE)', color: '#F59E0B' },
                    expert: { title: 'AI DIFFICULTY: EXPERT (L3 - PRO TOURNAMENT)', color: '#00E5FF' },
                    master: { title: 'AI DIFFICULTY: MASTER (L4 - SURGICAL PRECISION)', color: '#E879F9' }
                };
                const msg = toastStyles[this.aiDifficulty];
                this.updateUI();
                this.showScoreToast(msg.title, msg.color);
            });
        }

        // Wire Restart Button
        const restartBtn = document.getElementById("ui-restart-btn");
        if (restartBtn) {
            restartBtn.addEventListener("click", () => {
                this.restartGame();
            });
        }

        // Wire Setup Button
        const setupBtn = document.getElementById("ui-setup-btn");
        if (setupBtn) {
            setupBtn.addEventListener("click", () => {
                if (this.shotsTaken > 0) {
                    this.showScoreToast("LOCKED: Customization only available before first hit!", "#F59E0B");
                    return;
                }
                this.isSetupPanelOpen = !this.isSetupPanelOpen;
                this.updateUI();
            });
        }

        // Wire Drawer Close & Done Buttons
        const closeBtn = document.getElementById("ui-setup-close-btn");
        if (closeBtn) {
            closeBtn.addEventListener("click", () => {
                this.isSetupPanelOpen = false;
                this.updateUI();
            });
        }
        const applyBtn = document.getElementById("ui-setup-apply-btn");
        if (applyBtn) {
            applyBtn.addEventListener("click", () => {
                this.isSetupPanelOpen = false;
                this.updateUI();
                this.showScoreToast("READY TO BREAK: Aim & Shoot!", "#10B981");
            });
        }

        // Wire Rosette Rotation Slider & Nudge Buttons
        const rotSlider = document.getElementById("ui-rot-slider") as HTMLInputElement;
        if (rotSlider) {
            rotSlider.addEventListener("input", (e) => {
                const val = parseFloat((e.target as HTMLInputElement).value);
                this.setRosetteRotation(val);
                const rotLabel = document.getElementById("ui-rot-label");
                if (rotLabel) rotLabel.textContent = `${Math.round(val)}°`;
            });
        }
        const rotMinus = document.getElementById("ui-rot-minus15");
        if (rotMinus) {
            rotMinus.addEventListener("click", () => {
                this.setRosetteRotation(this.rosetteAngleDeg - 15);
                this.soundEffects.playClack(0.25);
                this.updateUI();
            });
        }
        const rotPlus = document.getElementById("ui-rot-plus15");
        if (rotPlus) {
            rotPlus.addEventListener("click", () => {
                this.setRosetteRotation(this.rosetteAngleDeg + 15);
                this.soundEffects.playClack(0.25);
                this.updateUI();
            });
        }

        // Wire Preset Rotation Buttons
        document.querySelectorAll(".ui-rot-preset").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const deg = parseFloat((e.currentTarget as HTMLElement).getAttribute("data-deg") || "0");
                this.setRosetteRotation(deg);
                this.soundEffects.playClack(0.35);
                this.updateUI();
            });
        });

        // Wire Random Spin Button
        const spinBtn = document.getElementById("ui-rot-spin");
        if (spinBtn) {
            spinBtn.addEventListener("click", () => {
                const randDeg = Math.floor(Math.random() * 360);
                this.setRosetteRotation(randDeg);
                this.soundEffects.playClack(0.45);
                this.updateUI();
                this.showScoreToast(`COINS SPUN TO ${randDeg}°!`, "#E879F9");
            });
        }

        // Wire Assigned Piece Color Choices
        const chooseWhite = document.getElementById("ui-choose-white");
        if (chooseWhite) {
            chooseWhite.addEventListener("click", () => {
                this.setPlayerColor('white');
                this.showScoreToast("ASSIGNED COLOR: WHITE (Breaks First)", "#FAF7F2");
            });
        }
        const chooseBlack = document.getElementById("ui-choose-black");
        if (chooseBlack) {
            chooseBlack.addEventListener("click", () => {
                this.setPlayerColor('black');
                this.showScoreToast("ASSIGNED COLOR: BLACK (Opponent Breaks)", "#38BDF8");
            });
        }

        // Wire First Breaker Selection
        const brkPlayer = document.getElementById("ui-breaker-player");
        if (brkPlayer) {
            brkPlayer.addEventListener("click", () => {
                this.setFirstBreaker('player');
                this.showScoreToast("FIRST BREAKER: YOU (Bottom Baseline)", "#F59E0B");
            });
        }
        const brkAI = document.getElementById("ui-breaker-ai");
        if (brkAI) {
            brkAI.addEventListener("click", () => {
                this.setFirstBreaker('ai');
                this.showScoreToast("FIRST BREAKER: AI (Top Baseline)", "#00E5FF");
            });
        }

        // Wire Striker Themes
        document.querySelectorAll(".ui-theme-swatch").forEach(el => {
            el.addEventListener("click", (e) => {
                const theme = (e.currentTarget as HTMLElement).getAttribute("data-theme") as StrikerTheme;
                if (theme) {
                    this.setStrikerTheme(theme);
                    this.showScoreToast(`STRIKER THEME: ${theme.toUpperCase()}`, "#FBBF24");
                }
            });
        });

        // Wire Tabs (Setup & Break vs Physics & Board)
        const tabSetup = document.getElementById("ui-tab-btn-setup");
        if (tabSetup) {
            tabSetup.addEventListener("click", () => {
                this.setActiveSetupTab('setup');
            });
        }
        const tabPhysics = document.getElementById("ui-tab-btn-physics");
        if (tabPhysics) {
            tabPhysics.addEventListener("click", () => {
                this.setActiveSetupTab('physics');
            });
        }

        // Wire Striker Mass Slider & Presets
        const strikerWeightSlider = document.getElementById("ui-striker-weight-slider") as HTMLInputElement;
        if (strikerWeightSlider) {
            strikerWeightSlider.addEventListener("input", (e) => {
                const val = parseFloat((e.target as HTMLInputElement).value);
                this.setStrikerWeight(val);
                const label = document.getElementById("ui-striker-weight-label");
                if (label) label.textContent = `${val.toFixed(1)}g`;
            });
        }
        document.querySelectorAll(".ui-striker-weight-preset").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const w = parseFloat((e.currentTarget as HTMLElement).getAttribute("data-weight") || "4.5");
                this.setStrikerWeight(w);
                this.soundEffects.playClack(0.3);
                this.showScoreToast(`STRIKER MASS: ${w.toFixed(1)}g`, "#FBBF24");
            });
        });

        // Wire Coin Mass Slider & Presets
        const coinWeightSlider = document.getElementById("ui-coin-weight-slider") as HTMLInputElement;
        if (coinWeightSlider) {
            coinWeightSlider.addEventListener("input", (e) => {
                const val = parseFloat((e.target as HTMLInputElement).value);
                this.setCoinWeight(val);
                const label = document.getElementById("ui-coin-weight-label");
                if (label) label.textContent = `${val.toFixed(1)}g`;
            });
        }
        document.querySelectorAll(".ui-coin-weight-preset").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const w = parseFloat((e.currentTarget as HTMLElement).getAttribute("data-weight") || "1.8");
                this.setCoinWeight(w);
                this.soundEffects.playClack(0.25);
                this.showScoreToast(`COIN MASS: ${w.toFixed(1)}g`, "#38BDF8");
            });
        });

        // Wire Board Friction / Powder Slider & Presets
        const frictionSlider = document.getElementById("ui-friction-slider") as HTMLInputElement;
        if (frictionSlider) {
            frictionSlider.addEventListener("input", (e) => {
                const val = parseFloat((e.target as HTMLInputElement).value);
                this.setBoardFriction(val);
                const label = document.getElementById("ui-friction-label");
                if (label) {
                    const prefix = val <= 0.025 ? "Slick" : (val <= 0.075 ? "Std" : "Rough");
                    label.textContent = `${prefix} (${val.toFixed(2)})`;
                }
            });
        }
        document.querySelectorAll(".ui-friction-preset").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const f = parseFloat((e.currentTarget as HTMLElement).getAttribute("data-f") || "0.05");
                const d = parseFloat((e.currentTarget as HTMLElement).getAttribute("data-d") || "1.0");
                this.setBoardFriction(f, d);
                this.soundEffects.playClack(0.35);
                const desc = f <= 0.025 ? "SLICK (Boric Powder)" : (f <= 0.075 ? "NORMAL (Tournament)" : "ROUGH (Heavy Drag)");
                this.showScoreToast(`BOARD SURFACE: ${desc} (${f.toFixed(2)})`, "#34D399");
            });
        });

        // Wire Strike Force Multiplier Slider & Presets
        const forceSlider = document.getElementById("ui-force-slider") as HTMLInputElement;
        if (forceSlider) {
            forceSlider.addEventListener("input", (e) => {
                const val = parseFloat((e.target as HTMLInputElement).value);
                this.setStrikeForceMultiplier(val);
                const label = document.getElementById("ui-force-label");
                if (label) label.textContent = `${val.toFixed(1)}x`;
            });
        }
        document.querySelectorAll(".ui-force-preset").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const mult = parseFloat((e.currentTarget as HTMLElement).getAttribute("data-force") || "1.0");
                this.setStrikeForceMultiplier(mult);
                this.soundEffects.playClack(0.3);
                this.showScoreToast(`STRIKE FORCE: ${mult.toFixed(1)}x`, "#E879F9");
            });
        });

        // Wire Manual Pickup Threshold Slider & Presets
        const pickSlider = document.getElementById("ui-pick-slider") as HTMLInputElement;
        if (pickSlider) {
            pickSlider.addEventListener("input", (e) => {
                const val = parseFloat((e.target as HTMLInputElement).value);
                this.setManualPickThreshold(val);
                const label = document.getElementById("ui-pick-label");
                if (label) label.textContent = `${val.toFixed(2)} u/s`;
            });
        }
        document.querySelectorAll(".ui-pick-preset").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const pick = parseFloat((e.currentTarget as HTMLElement).getAttribute("data-pick") || "0.45");
                this.setManualPickThreshold(pick);
                this.soundEffects.playClack(0.25);
                this.showScoreToast(`PICK THRESHOLD: ${pick.toFixed(2)} u/s`, "#F59E0B");
            });
        });

        // Wire Bottom Guidance Pill for Manual Striker Pickup
        const guidancePill = document.getElementById("ui-guidance-container");
        if (guidancePill) {
            guidancePill.addEventListener("click", () => {
                if (this.gameState === 'rolling') {
                    if (this.canPickStrikerManually) {
                        this.collectStrikerManually(true);
                    } else if (this.isStrikerHeadingToPocket()) {
                        this.showScoreToast("⚠️ Cannot pick: Striker heading towards pocket (Potential Foul)!", "#EF4444");
                    }
                }
            });
        }
    }

    private updateUI(): void {
        const diffConfig: Record<AIDifficulty, { title: string; btn: string; color: string; border: string; bg: string; glow: string }> = {
            novice: {
                title: "AI Novice (Black)",
                btn: "AI: Novice (L1)",
                color: "#10B981",
                border: "rgba(16, 185, 129, 0.5)",
                bg: "rgba(16, 185, 129, 0.14)",
                glow: "rgba(16, 185, 129, 0.35)"
            },
            amateur: {
                title: "AI Amateur (Black)",
                btn: "AI: Amateur (L2)",
                color: "#F59E0B",
                border: "rgba(245, 158, 11, 0.5)",
                bg: "rgba(245, 158, 11, 0.14)",
                glow: "rgba(245, 158, 11, 0.35)"
            },
            expert: {
                title: "AI Expert (Black)",
                btn: "AI: Expert (L3)",
                color: "#00E5FF",
                border: "rgba(0, 229, 255, 0.5)",
                bg: "rgba(0, 229, 255, 0.14)",
                glow: "rgba(0, 229, 255, 0.35)"
            },
            master: {
                title: "AI Master (Black)",
                btn: "AI: Master (L4)",
                color: "#E879F9",
                border: "rgba(232, 121, 249, 0.5)",
                bg: "rgba(232, 121, 249, 0.14)",
                glow: "rgba(232, 121, 249, 0.35)"
            }
        };
        const curDiff = diffConfig[this.aiDifficulty];

        // Player 1
        const p1ScoreEl = document.getElementById("ui-score-p1");
        if (p1ScoreEl) p1ScoreEl.textContent = `${this.playerScore}`;

        const p1CoinsEl = document.getElementById("ui-coins-p1");
        if (p1CoinsEl) {
            p1CoinsEl.textContent = this.playerColor === 'white'
                ? `⚪ ${this.whiteCoinsLeft} left`
                : `⚫ ${this.blackCoinsLeft} left`;
        }

        const p1TitleEl = document.getElementById("ui-p1-title");
        if (p1TitleEl) {
            p1TitleEl.textContent = this.playerColor === 'white' ? "You (White)" : "You (Black)";
        }

        // Player 2
        const p2ScoreEl = document.getElementById("ui-score-p2");
        if (p2ScoreEl) p2ScoreEl.textContent = `${this.aiScore}`;

        const p2CoinsEl = document.getElementById("ui-coins-p2");
        if (p2CoinsEl) {
            p2CoinsEl.textContent = this.aiColor === 'black'
                ? `⚫ ${this.blackCoinsLeft} left`
                : `⚪ ${this.whiteCoinsLeft} left`;
        }

        const p2TitleEl = document.getElementById("ui-p2-title");
        const p2ColorLabel = this.aiColor === 'black' ? 'Black' : 'White';
        if (p2TitleEl) {
            if (this.gameMode === 'vs_ai') {
                p2TitleEl.textContent = curDiff.title.replace('(Black)', `(${p2ColorLabel})`);
                p2TitleEl.style.color = curDiff.color;
            } else {
                p2TitleEl.textContent = this.gameMode === 'pass_and_play' ? `Player 2 (${p2ColorLabel})` : `${p2ColorLabel} Coins`;
                p2TitleEl.style.color = "#38BDF8";
            }
        }

        const p2AvatarEl = document.getElementById("ui-p2-avatar");
        if (p2AvatarEl && this.gameMode === 'vs_ai') {
            p2AvatarEl.style.borderColor = curDiff.color;
            p2AvatarEl.style.color = curDiff.color;
            p2AvatarEl.style.boxShadow = `0 0 8px ${curDiff.glow}`;
        }

        // Mode Button Label
        const modeBtn = document.getElementById("ui-mode-btn");
        if (modeBtn) {
            modeBtn.textContent = this.gameMode === 'vs_ai'
                ? "Mode: Vs AI"
                : (this.gameMode === 'pass_and_play' ? "Mode: 2P Local" : "Mode: Solo");
        }

        // Difficulty Button
        const diffBtn = document.getElementById("ui-diff-btn");
        if (diffBtn) {
            diffBtn.textContent = curDiff.btn;
            diffBtn.style.color = curDiff.color;
            diffBtn.style.border = `1px solid ${curDiff.border}`;
            diffBtn.style.background = curDiff.bg;
            diffBtn.style.display = this.gameMode === 'vs_ai' ? 'block' : 'none';
        }

        // Setup Button
        const setupBtn = document.getElementById("ui-setup-btn");
        if (setupBtn) {
            if (this.shotsTaken === 0) {
                setupBtn.innerHTML = `⚙ Setup <span style="font-size: 8px; color: #10B981; vertical-align: middle;">●</span>`;
                setupBtn.style.color = "#FBBF24";
                setupBtn.style.border = "1px solid rgba(251, 191, 36, 0.6)";
                setupBtn.style.background = this.isSetupPanelOpen ? "rgba(251, 191, 36, 0.25)" : "rgba(251, 191, 36, 0.12)";
                setupBtn.style.boxShadow = this.isSetupPanelOpen ? "0 0 10px rgba(251, 191, 36, 0.4)" : "none";
                setupBtn.title = "Customize rosette rotation, piece color, first breaker, and striker theme";
            } else {
                setupBtn.innerHTML = `🔒 In Play`;
                setupBtn.style.color = "#64748B";
                setupBtn.style.border = "1px solid rgba(255, 255, 255, 0.08)";
                setupBtn.style.background = "rgba(255, 255, 255, 0.04)";
                setupBtn.style.boxShadow = "none";
                setupBtn.title = "Customization is locked during play. Click Reset to re-open.";
            }
        }

        // Setup Drawer State & Values
        const drawer = document.getElementById("ui-setup-drawer");
        if (drawer) {
            drawer.style.display = (this.isSetupPanelOpen && this.shotsTaken === 0) ? 'block' : 'none';
            if (this.isSetupPanelOpen && this.shotsTaken === 0) {
                const rotSlider = document.getElementById("ui-rot-slider") as HTMLInputElement;
                const rotLabel = document.getElementById("ui-rot-label");
                if (rotSlider) rotSlider.value = `${Math.round(this.rosetteAngleDeg)}`;
                if (rotLabel) rotLabel.textContent = `${Math.round(this.rosetteAngleDeg)}°`;

                // Color choices highlight
                const whiteBtn = document.getElementById("ui-choose-white");
                const blackBtn = document.getElementById("ui-choose-black");
                if (whiteBtn && blackBtn) {
                    if (this.playerColor === 'white') {
                        whiteBtn.style.border = "2px solid #FAF7F2";
                        whiteBtn.style.background = "rgba(255, 255, 255, 0.22)";
                        whiteBtn.style.boxShadow = "0 0 10px rgba(255, 255, 255, 0.35)";

                        blackBtn.style.border = "1px solid rgba(255, 255, 255, 0.15)";
                        blackBtn.style.background = "rgba(0, 0, 0, 0.4)";
                        blackBtn.style.boxShadow = "none";
                    } else {
                        whiteBtn.style.border = "1px solid rgba(255, 255, 255, 0.15)";
                        whiteBtn.style.background = "rgba(255, 255, 255, 0.06)";
                        whiteBtn.style.boxShadow = "none";

                        blackBtn.style.border = "2px solid #00E5FF";
                        blackBtn.style.background = "rgba(0, 229, 255, 0.2)";
                        blackBtn.style.boxShadow = "0 0 10px rgba(0, 229, 255, 0.35)";
                    }
                }

                // Breaker choice highlight
                const brkPlayer = document.getElementById("ui-breaker-player");
                const brkAI = document.getElementById("ui-breaker-ai");
                if (brkPlayer && brkAI) {
                    if (this.breakerFirst === 'player') {
                        brkPlayer.style.border = "2px solid #F59E0B";
                        brkPlayer.style.background = "rgba(245, 158, 11, 0.25)";
                        brkPlayer.style.color = "#FBBF24";

                        brkAI.style.border = "1px solid rgba(255, 255, 255, 0.15)";
                        brkAI.style.background = "rgba(255, 255, 255, 0.06)";
                        brkAI.style.color = "#94A3B8";
                    } else {
                        brkPlayer.style.border = "1px solid rgba(255, 255, 255, 0.15)";
                        brkPlayer.style.background = "rgba(255, 255, 255, 0.06)";
                        brkPlayer.style.color = "#94A3B8";

                        brkAI.style.border = "2px solid #00E5FF";
                        brkAI.style.background = "rgba(0, 229, 255, 0.25)";
                        brkAI.style.color = "#38BDF8";
                    }
                }

                // Theme swatch highlight
                document.querySelectorAll(".ui-theme-swatch").forEach(el => {
                    const theme = el.getAttribute("data-theme");
                    const hEl = el as HTMLElement;
                    if (theme === this.strikerTheme) {
                        hEl.style.boxShadow = "0 0 10px #FBBF24, inset 0 0 4px #FBBF24";
                        hEl.style.transform = "scale(1.06)";
                    } else {
                        hEl.style.boxShadow = "none";
                        hEl.style.transform = "scale(1)";
                    }
                });

                // Tab switching & tab button active styling
                const tabSetupBtn = document.getElementById("ui-tab-btn-setup");
                const tabPhysicsBtn = document.getElementById("ui-tab-btn-physics");
                const panelSetup = document.getElementById("ui-tab-panel-setup");
                const panelPhysics = document.getElementById("ui-tab-panel-physics");

                if (panelSetup && panelPhysics) {
                    panelSetup.style.display = this.activeSetupTab === 'setup' ? 'grid' : 'none';
                    panelPhysics.style.display = this.activeSetupTab === 'physics' ? 'grid' : 'none';
                }

                if (tabSetupBtn && tabPhysicsBtn) {
                    if (this.activeSetupTab === 'setup') {
                        tabSetupBtn.style.background = "rgba(251, 191, 36, 0.22)";
                        tabSetupBtn.style.border = "1px solid rgba(251, 191, 36, 0.6)";
                        tabSetupBtn.style.color = "#FBBF24";

                        tabPhysicsBtn.style.background = "rgba(255, 255, 255, 0.06)";
                        tabPhysicsBtn.style.border = "1px solid rgba(255, 255, 255, 0.15)";
                        tabPhysicsBtn.style.color = "#94A3B8";
                    } else {
                        tabSetupBtn.style.background = "rgba(255, 255, 255, 0.06)";
                        tabSetupBtn.style.border = "1px solid rgba(255, 255, 255, 0.15)";
                        tabSetupBtn.style.color = "#94A3B8";

                        tabPhysicsBtn.style.background = "rgba(251, 191, 36, 0.22)";
                        tabPhysicsBtn.style.border = "1px solid rgba(251, 191, 36, 0.6)";
                        tabPhysicsBtn.style.color = "#FBBF24";
                    }
                }

                // Striker Mass sync
                const sWeightSlider = document.getElementById("ui-striker-weight-slider") as HTMLInputElement;
                const sWeightLabel = document.getElementById("ui-striker-weight-label");
                if (sWeightSlider) sWeightSlider.value = `${this.strikerWeight.toFixed(1)}`;
                if (sWeightLabel) sWeightLabel.textContent = `${this.strikerWeight.toFixed(1)}g`;
                document.querySelectorAll(".ui-striker-weight-preset").forEach(el => {
                    const btn = el as HTMLElement;
                    const w = parseFloat(btn.getAttribute("data-weight") || "0");
                    const isActive = Math.abs(w - this.strikerWeight) < 0.05;
                    btn.style.background = isActive ? "rgba(251, 191, 36, 0.22)" : "rgba(255, 255, 255, 0.06)";
                    btn.style.border = isActive ? "1px solid #FBBF24" : "1px solid rgba(255, 255, 255, 0.12)";
                    btn.style.color = isActive ? "#FBBF24" : "#CBD5E1";
                    btn.style.fontWeight = isActive ? "700" : "normal";
                });

                // Coin Mass sync
                const cWeightSlider = document.getElementById("ui-coin-weight-slider") as HTMLInputElement;
                const cWeightLabel = document.getElementById("ui-coin-weight-label");
                if (cWeightSlider) cWeightSlider.value = `${this.coinWeight.toFixed(1)}`;
                if (cWeightLabel) cWeightLabel.textContent = `${this.coinWeight.toFixed(1)}g`;
                document.querySelectorAll(".ui-coin-weight-preset").forEach(el => {
                    const btn = el as HTMLElement;
                    const w = parseFloat(btn.getAttribute("data-weight") || "0");
                    const isActive = Math.abs(w - this.coinWeight) < 0.05;
                    btn.style.background = isActive ? "rgba(56, 189, 248, 0.22)" : "rgba(255, 255, 255, 0.06)";
                    btn.style.border = isActive ? "1px solid #38BDF8" : "1px solid rgba(255, 255, 255, 0.12)";
                    btn.style.color = isActive ? "#38BDF8" : "#CBD5E1";
                    btn.style.fontWeight = isActive ? "700" : "normal";
                });

                // Board Friction / Powder sync
                const frictionSlider = document.getElementById("ui-friction-slider") as HTMLInputElement;
                const frictionLabel = document.getElementById("ui-friction-label");
                if (frictionSlider) frictionSlider.value = `${this.boardFriction.toFixed(3)}`;
                if (frictionLabel) {
                    const prefix = this.boardFriction <= 0.025 ? "Slick" : (this.boardFriction <= 0.075 ? "Std" : "Rough");
                    frictionLabel.textContent = `${prefix} (${this.boardFriction.toFixed(2)})`;
                }
                document.querySelectorAll(".ui-friction-preset").forEach(el => {
                    const btn = el as HTMLElement;
                    const f = parseFloat(btn.getAttribute("data-f") || "0");
                    const isActive = Math.abs(f - this.boardFriction) < 0.015;
                    btn.style.background = isActive ? "rgba(16, 185, 129, 0.22)" : "rgba(255, 255, 255, 0.06)";
                    btn.style.border = isActive ? "1px solid #10B981" : "1px solid rgba(255, 255, 255, 0.12)";
                    btn.style.color = isActive ? "#34D399" : "#CBD5E1";
                    btn.style.fontWeight = isActive ? "700" : "normal";
                });

                // Strike Force Multiplier sync
                const forceSlider = document.getElementById("ui-force-slider") as HTMLInputElement;
                const forceLabel = document.getElementById("ui-force-label");
                if (forceSlider) forceSlider.value = `${this.strikeForceMultiplier.toFixed(1)}`;
                if (forceLabel) forceLabel.textContent = `${this.strikeForceMultiplier.toFixed(1)}x`;
                document.querySelectorAll(".ui-force-preset").forEach(el => {
                    const btn = el as HTMLElement;
                    const force = parseFloat(btn.getAttribute("data-force") || "0");
                    const isActive = Math.abs(force - this.strikeForceMultiplier) < 0.1;
                    btn.style.background = isActive ? "rgba(232, 121, 249, 0.22)" : "rgba(255, 255, 255, 0.06)";
                    btn.style.border = isActive ? "1px solid #E879F9" : "1px solid rgba(255, 255, 255, 0.12)";
                    btn.style.color = isActive ? "#E879F9" : "#CBD5E1";
                    btn.style.fontWeight = isActive ? "700" : "normal";
                });

                // Manual Pickup Threshold sync
                const pickSlider = document.getElementById("ui-pick-slider") as HTMLInputElement;
                const pickLabel = document.getElementById("ui-pick-label");
                if (pickSlider) pickSlider.value = `${this.manualPickThreshold.toFixed(2)}`;
                if (pickLabel) pickLabel.textContent = `${this.manualPickThreshold.toFixed(2)} u/s`;
                document.querySelectorAll(".ui-pick-preset").forEach(el => {
                    const btn = el as HTMLElement;
                    const pick = parseFloat(btn.getAttribute("data-pick") || "0");
                    const isActive = Math.abs(pick - this.manualPickThreshold) < 0.05;
                    btn.style.background = isActive ? "rgba(245, 158, 11, 0.22)" : "rgba(255, 255, 255, 0.06)";
                    btn.style.border = isActive ? "1px solid #F59E0B" : "1px solid rgba(255, 255, 255, 0.12)";
                    btn.style.color = isActive ? "#F59E0B" : "#CBD5E1";
                    btn.style.fontWeight = isActive ? "700" : "normal";
                });
            }
        }

        // Turn Card Highlights
        const p1Card = document.getElementById("ui-player1-card");
        const p2Card = document.getElementById("ui-player2-card");
        if (p1Card && p2Card) {
            if (this.currentTurn === 'player') {
                p1Card.style.border = "1px solid rgba(251, 191, 36, 0.85)";
                p1Card.style.background = "rgba(251, 191, 36, 0.14)";
                p1Card.style.boxShadow = "0 0 16px rgba(251, 191, 36, 0.35)";

                p2Card.style.border = "1px solid rgba(255, 255, 255, 0.08)";
                p2Card.style.background = "rgba(0, 0, 0, 0.25)";
                p2Card.style.boxShadow = "none";
            } else {
                p1Card.style.border = "1px solid rgba(255, 255, 255, 0.08)";
                p1Card.style.background = "rgba(0, 0, 0, 0.25)";
                p1Card.style.boxShadow = "none";

                p2Card.style.border = `1px solid ${curDiff.color}`;
                p2Card.style.background = curDiff.bg;
                p2Card.style.boxShadow = `0 0 16px ${curDiff.glow}`;
            }
        }

        // Queen Status
        const queenEl = document.getElementById("ui-queen-status");
        if (queenEl) {
            if (this.queenPocketed) {
                if (this.queenCapturedBy === 'player') {
                    queenEl.textContent = "Queen: Won by You (+25) ✓";
                    queenEl.style.color = "#10B981";
                } else if (this.queenCapturedBy === 'ai') {
                    queenEl.textContent = "Queen: Won by AI (+25) ✓";
                    queenEl.style.color = "#38BDF8";
                } else {
                    queenEl.textContent = "Queen: Pocketed (+25)";
                    queenEl.style.color = "#10B981";
                }
            } else {
                queenEl.textContent = "Queen: In Play (25pt)";
                queenEl.style.color = "#F87171";
            }
        }

        // Bottom Turn Status Pill
        const statusEl = document.getElementById("ui-turn-status");
        const dotEl = document.getElementById("ui-status-dot");
        if (statusEl) {
            if (this.gameState === 'gameover') {
                const winnerText = this.winner === 'player'
                    ? '🏆 <b>VICTORY!</b> You won the match!'
                    : (this.winner === 'ai' ? '🤖 <b>MATCH OVER!</b> AI Opponent won!' : '🤝 <b>TIED MATCH!</b>');
                statusEl.innerHTML = `${winnerText} Score: ${this.playerScore} - ${this.aiScore}`;
                statusEl.style.color = "#10B981";
                if (dotEl) {
                    dotEl.style.background = "#10B981";
                    dotEl.style.boxShadow = "0 0 8px #10B981";
                }
            } else if (this.gameState === 'rolling') {
                this.updateRollingUIStatus(this.isStrikerHeadingToPocket());
            } else if (this.gameState === 'ai_thinking') {
                statusEl.textContent = `🤖 ${curDiff.title.replace(' (Black)', '')} is calculating angle & trajectory...`;
                statusEl.style.color = curDiff.color;
                if (dotEl) {
                    dotEl.style.background = curDiff.color;
                    dotEl.style.boxShadow = `0 0 8px ${curDiff.color}`;
                }
            } else if (this.gameState === 'ai_aiming') {
                statusEl.textContent = `🎯 ${curDiff.title.replace(' (Black)', '')} locked target • Executing strike...`;
                statusEl.style.color = curDiff.color;
                if (dotEl) {
                    dotEl.style.background = curDiff.color;
                    dotEl.style.boxShadow = `0 0 8px ${curDiff.color}`;
                }
            } else if (this.gameState === 'aiming') {
                statusEl.textContent = "🎯 Pull back to aim & shoot • Right-click to cancel";
                statusEl.style.color = "#10B981";
                if (dotEl) {
                    dotEl.style.background = "#10B981";
                    dotEl.style.boxShadow = "0 0 8px #10B981";
                }
            } else {
                if (this.currentTurn === 'player') {
                    statusEl.textContent = "Your turn • Move mouse along baseline • Click striker to aim";
                    statusEl.style.color = "#F59E0B";
                    if (dotEl) {
                        dotEl.style.background = "#F59E0B";
                        dotEl.style.boxShadow = "0 0 8px #F59E0B";
                    }
                } else {
                    statusEl.textContent = "Player 2 turn • Move mouse along top baseline • Click striker to aim";
                    statusEl.style.color = "#00E5FF";
                    if (dotEl) {
                        dotEl.style.background = "#00E5FF";
                        dotEl.style.boxShadow = "0 0 8px #00E5FF";
                    }
                }
            }
        }
    }

    private showScoreToast(text: string, color: string = '#F59E0B'): void {
        const container = document.getElementById("ui-toast-container");
        if (!container) return;

        const badge = document.createElement("div");
        badge.textContent = text;
        badge.style.cssText = `
            background: rgba(15, 23, 42, 0.9);
            backdrop-filter: blur(14px);
            border: 1px solid ${color};
            color: ${color};
            padding: 7px 18px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 700;
            letter-spacing: 0.6px;
            box-shadow: 0 6px 20px rgba(0,0,0,0.5);
            animation: fadeInOut 1.8s forwards;
        `;

        container.replaceChildren(badge);
        setTimeout(() => {
            if (badge.parentNode === container) {
                badge.remove();
            }
        }, 1800);
    }

    public onDestroy(): void {
        if (this.aiThinkingTimer) clearTimeout(this.aiThinkingTimer);
        if (this.aiAimingTimer) clearTimeout(this.aiAimingTimer);
        if (this.uiContainer) {
            this.uiContainer.remove();
            this.uiContainer = undefined;
        }
    }
}
