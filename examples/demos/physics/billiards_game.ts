// =========================================================================
// File: examples/demos/physics/billiards_game.ts
// =========================================================================

import {
    Scene,
    Color,
    Vec3,
    Box,
    Sphere,
    Cylinder,
    Line3D,
    Model,
    ModelOptions,
    CameraModel,
    ShadowMethod,
    light,
    env,
    Quaternion
} from "retiam";
import { Physics3D, RigidBodyComponent, Collision3DEvent } from "retiam/physics";
import earcut from "earcut";
import { demoBackground } from "../../shared/presentation";

// =========================================================================
// Types & Game Interfaces
// =========================================================================

export type BallType = 'cue' | 'solid' | 'stripe' | '8ball';
export type PlayerType = 'player1' | 'player2' | 'ai';
export type BallGroup = 'solids' | 'stripes';
export type GameMode = 'pv_ai' | 'pv_p' | 'practice';
export type AIDifficulty = 'amateur' | 'master' | 'legend';

export interface PocketInfo {
    id: number;
    name: string;
    x: number;
    y: number;
    radius: number;
}

export interface PoolBall {
    id: number;
    number: number;
    type: BallType;
    colorHex: string;
    name: string;
    entity: Sphere;
    bodyComp: RigidBodyComponent;
    potted: boolean;
    sinking: boolean;
    sinkScale: number;
    quaternion: Quaternion;
    lastX: number;
    lastY: number;
    sinkVx?: number;
    sinkVy?: number;
    sinkVz?: number;
    sinkTargetX?: number;
    sinkTargetY?: number;
    sinkSoundPlayed?: boolean;
    sinkProgress?: number;
}

// =========================================================================
// Procedural Web Audio API Sound Synthesizer
// =========================================================================

class BilliardsAudio {
    private ctx: AudioContext | null = null;
    private masterLimiter: DynamicsCompressorNode | null = null;
    private masterGain: GainNode | null = null;
    public muted: boolean = false;

    // Excitation impulse buffers for organic tactile response
    private resinTransientBuffer: AudioBuffer | null = null;
    private cueImpactBuffer: AudioBuffer | null = null;
    private pocketDropBuffer: AudioBuffer | null = null;

    // Rate limiting to prevent audio clipping during high-collision multi-ball breaks
    private recentHits: number[] = [];

    private getContext(): AudioContext | null {
        if (typeof window === 'undefined') return null;
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioCtx) {
                this.ctx = new AudioCtx();

                this.masterLimiter = this.ctx.createDynamicsCompressor();
                this.masterLimiter.threshold.value = -2.5;
                this.masterLimiter.knee.value = 4;
                this.masterLimiter.ratio.value = 10;
                this.masterLimiter.attack.value = 0.0008;
                this.masterLimiter.release.value = 0.025;

                this.masterGain = this.ctx.createGain();
                this.masterGain.gain.value = 0.90;

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

    private buildExcitationBuffers(): void {
        if (!this.ctx) return;
        const sr = this.ctx.sampleRate;

        // 1. Ultra-sharp Phenolic Resin Impact Transient (1.5ms steep contact spike)
        // Authentic phenolic resin contact has a sub-millisecond pressure rise followed by rapid damping
        const rLen = Math.ceil(sr * 0.0016);
        const rBuf = this.ctx.createBuffer(1, rLen, sr);
        const rData = rBuf.getChannelData(0);
        for (let i = 0; i < rLen; i++) {
            const t = i / rLen;
            const env = Math.exp(-t * 9.0); // Very fast exponential decay
            const spike = (i < 4) ? (1.0 - i * 0.25) : 0;
            const noise = (Math.random() * 2 - 1) * 0.4;
            rData[i] = (spike * 0.75 + noise * 0.25) * env;
        }
        this.resinTransientBuffer = rBuf;

        // 2. Cue Chalked Leather Tip Strike (2.8ms friction impulse)
        const cLen = Math.ceil(sr * 0.0028);
        const cBuf = this.ctx.createBuffer(1, cLen, sr);
        const cData = cBuf.getChannelData(0);
        for (let i = 0; i < cLen; i++) {
            const t = i / cLen;
            const env = Math.exp(-t * 6.5);
            const noise = (Math.random() * 2 - 1) * 0.8;
            cData[i] = env * noise;
        }
        this.cueImpactBuffer = cBuf;

        // 3. Leather Pocket Liner Contact (6ms soft cushioned thump)
        const pLen = Math.ceil(sr * 0.006);
        const pBuf = this.ctx.createBuffer(1, pLen, sr);
        const pData = pBuf.getChannelData(0);
        for (let i = 0; i < pLen; i++) {
            const t = i / pLen;
            const env = Math.sin(Math.PI * t) * Math.exp(-t * 4.0);
            const noise = (Math.random() * 2 - 1) * 0.3;
            pData[i] = env * noise;
        }
        this.pocketDropBuffer = pBuf;
    }

    private createPanner(ctx: AudioContext, posX?: number): StereoPannerNode | null {
        if (typeof ctx.createStereoPanner === 'function' && posX !== undefined) {
            const panner = ctx.createStereoPanner();
            panner.pan.value = Math.max(-0.85, Math.min(0.85, posX / 17.0));
            return panner;
        }
        return null;
    }

    /**
     * Play physically-modeled Aramith phenolic resin ball collision.
     * @param normalSpeed Direct compressive impact velocity (magnitude along contact normal)
     * @param relSpeed Total relative speed of the two colliding spheres
     * @param tangSpeed Tangential glancing/shear velocity component
     * @param posX Table X position for 3D stereo panning
     */
    public playBallBallHit(
        normalSpeed: number,
        relSpeed: number = normalSpeed,
        tangSpeed: number = 0,
        posX?: number
    ): void {
        if (this.muted) return;
        const ctx = this.getContext();
        if (!ctx || !this.masterLimiter) return;

        const now = ctx.currentTime;

        // Clean up old timestamps from rate limiter window (past 20ms)
        this.recentHits = this.recentHits.filter(t => now - t < 0.020);
        // Cap concurrent hits to 4 per 20ms window to preserve clean acoustics during break shots
        if (this.recentHits.length >= 4) return;
        this.recentHits.push(now);

        // Physical parameters:
        // normalSpeed governs compression force, volume, and low-frequency resonance
        const normForce = Math.max(0.04, normalSpeed);
        // Effective perceived intensity: non-linear acoustic compression
        const intensity = Math.min(1.0, normForce / 7.5);
        const gainVal = Math.pow(intensity, 0.65) * 0.95;

        // Routing: Connect into panner or directly to master limiter
        const panner = this.createPanner(ctx, posX);
        const targetNode: AudioNode = panner || this.masterLimiter;
        if (panner) panner.connect(this.masterLimiter);

        // -------------------------------------------------------------
        // Layer 1: Ultra-Fast Crisp Phenolic Contact Snap (High-Q Bandpass)
        // -------------------------------------------------------------
        // Hard phenolic resin produces an instantaneous sharp transient click (3200-4400 Hz)
        if (this.resinTransientBuffer) {
            const burst = ctx.createBufferSource();
            burst.buffer = this.resinTransientBuffer;

            // Bandpass filter to sculpt resin snap (removes harsh fizz while keeping crisp bite)
            const snapFilter = ctx.createBiquadFilter();
            snapFilter.type = 'bandpass';
            snapFilter.frequency.setValueAtTime(3200 + intensity * 800, now);
            snapFilter.Q.setValueAtTime(3.5, now);

            const bGain = ctx.createGain();
            bGain.gain.setValueAtTime(gainVal * 0.95, now);
            bGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.007);

            burst.connect(snapFilter);
            snapFilter.connect(bGain);
            bGain.connect(targetNode);
            burst.start(now);
        }

        // -------------------------------------------------------------
        // Layer 2: Core Phenolic Resin Body Clack (Resonant Mode: 1150 - 1500 Hz)
        // -------------------------------------------------------------
        // NOT a sustained metallic ring! Phenolic resin has high internal damping:
        // Resonant clack with fast pitch fall and steep exponential decay (12-18ms)
        const clackOsc = ctx.createOscillator();
        const clackFilter = ctx.createBiquadFilter();
        const clackGain = ctx.createGain();

        clackOsc.type = 'triangle'; // Richer in harmonics than pure sine, without metallic buzz
        const baseFreq = 1220 + intensity * 260; // 1220 Hz to 1480 Hz
        clackOsc.frequency.setValueAtTime(baseFreq, now);
        clackOsc.frequency.exponentialRampToValueAtTime(baseFreq * 0.72, now + 0.014);

        clackFilter.type = 'bandpass';
        clackFilter.frequency.setValueAtTime(baseFreq, now);
        clackFilter.Q.setValueAtTime(5.5, now); // Moderately damped resin resonance

        const decayDuration = 0.012 + intensity * 0.008; // 12ms to 20ms decay
        clackGain.gain.setValueAtTime(gainVal * 0.75, now);
        clackGain.gain.exponentialRampToValueAtTime(0.0001, now + decayDuration);

        clackOsc.connect(clackFilter);
        clackFilter.connect(clackGain);
        clackGain.connect(targetNode);

        clackOsc.start(now);
        clackOsc.stop(now + decayDuration + 0.005);

        // -------------------------------------------------------------
        // Layer 3: Solid Slate Bed / Felt Contact Thump (Low Punch for Hard Hits)
        // -------------------------------------------------------------
        // On hard impacts (normalSpeed > 1.2), the balls compress into the cloth and heavy slate,
        // producing a satisfying, dense low-frequency "thwack"
        if (normForce > 1.2) {
            const thumpOsc = ctx.createOscillator();
            const thumpGain = ctx.createGain();

            thumpOsc.type = 'sine';
            const thumpForce = Math.min(1.0, (normForce - 1.2) / 5.0);
            thumpOsc.frequency.setValueAtTime(320 + thumpForce * 80, now);
            thumpOsc.frequency.exponentialRampToValueAtTime(110, now + 0.018);

            const thumpGainVal = Math.pow(thumpForce, 0.7) * 0.65;
            thumpGain.gain.setValueAtTime(thumpGainVal, now);
            thumpGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.022);

            thumpOsc.connect(thumpGain);
            thumpGain.connect(targetNode);

            thumpOsc.start(now);
            thumpOsc.stop(now + 0.025);
        }

        // -------------------------------------------------------------
        // Layer 4: Tangential Friction Scuff (Glancing / Thin Cut Shots)
        // -------------------------------------------------------------
        if (tangSpeed > 1.2 && normForce < 3.0) {
            const scuffNoise = ctx.createBufferSource();
            if (this.resinTransientBuffer) {
                scuffNoise.buffer = this.resinTransientBuffer;
                const scuffFilter = ctx.createBiquadFilter();
                scuffFilter.type = 'highpass';
                scuffFilter.frequency.setValueAtTime(4500, now);

                const scuffGain = ctx.createGain();
                const scuffIntensity = Math.min(1.0, tangSpeed / 5.0);
                scuffGain.gain.setValueAtTime(scuffIntensity * 0.25, now);
                scuffGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.008);

                scuffNoise.connect(scuffFilter);
                scuffFilter.connect(scuffGain);
                scuffGain.connect(targetNode);
                scuffNoise.start(now);
            }
        }
    }

    /**
     * Play rubber cushion impact sound with stereo panning and speed modulation.
     */
    public playCushionHit(speed: number, posX?: number): void {
        if (this.muted) return;
        const ctx = this.getContext();
        if (!ctx || !this.masterLimiter) return;

        const now = ctx.currentTime;
        const intensity = Math.min(1.0, Math.max(0.08, speed / 6.5));
        const gainVal = Math.pow(intensity, 0.6) * 0.80;

        const panner = this.createPanner(ctx, posX);
        const targetNode: AudioNode = panner || this.masterLimiter;
        if (panner) panner.connect(this.masterLimiter);

        // Muffled rubber cushion thump (low-frequency impulse, zero high-frequency click)
        const osc = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(155 + intensity * 45, now);
        osc.frequency.exponentialRampToValueAtTime(60, now + 0.055);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(240 + intensity * 60, now);

        gain.gain.setValueAtTime(gainVal, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.065);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(targetNode);

        osc.start(now);
        osc.stop(now + 0.07);
    }

    /**
     * Play cue stick impact with chalk friction and wood shaft vibration.
     */
    public playCueStrike(power: number, posX?: number): void {
        if (this.muted) return;
        const ctx = this.getContext();
        if (!ctx || !this.masterLimiter) return;

        const now = ctx.currentTime;
        const intensity = Math.min(1.0, Math.max(0.1, power));
        const gainVal = Math.pow(intensity, 0.65) * 0.95;

        const panner = this.createPanner(ctx, posX);
        const targetNode: AudioNode = panner || this.masterLimiter;
        if (panner) panner.connect(this.masterLimiter);

        // Chalk friction attack
        if (this.cueImpactBuffer) {
            const burst = ctx.createBufferSource();
            burst.buffer = this.cueImpactBuffer;
            const bFilter = ctx.createBiquadFilter();
            bFilter.type = 'bandpass';
            bFilter.frequency.setValueAtTime(3600, now);
            bFilter.Q.setValueAtTime(2.0, now);

            const bGain = ctx.createGain();
            bGain.gain.setValueAtTime(gainVal * 0.85, now);
            bGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.012);

            burst.connect(bFilter);
            bFilter.connect(bGain);
            bGain.connect(targetNode);
            burst.start(now);
        }

        // Maple cue shaft wood pop
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(540 + intensity * 120, now);
        osc.frequency.exponentialRampToValueAtTime(210, now + 0.035);
        g.gain.setValueAtTime(gainVal * 0.70, now);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 0.045);
        osc.connect(g);
        g.connect(targetNode);
        osc.start(now);
        osc.stop(now + 0.05);

        // Solid slate contact thump
        if (power > 0.4) {
            const sub = ctx.createOscillator();
            const subG = ctx.createGain();
            sub.type = 'sine';
            sub.frequency.setValueAtTime(240, now);
            sub.frequency.exponentialRampToValueAtTime(80, now + 0.025);
            subG.gain.setValueAtTime(gainVal * 0.50, now);
            subG.gain.exponentialRampToValueAtTime(0.0001, now + 0.030);
            sub.connect(subG);
            subG.connect(targetNode);
            sub.start(now);
            sub.stop(now + 0.035);
        }
    }

    /**
     * Play ball dropping into leather throat liner and pocket well.
     */
    public playPocketDrop(posX?: number): void {
        if (this.muted) return;
        const ctx = this.getContext();
        if (!ctx || !this.masterLimiter) return;

        const now = ctx.currentTime;
        const panner = this.createPanner(ctx, posX);
        const targetNode: AudioNode = panner || this.masterLimiter;
        if (panner) panner.connect(this.masterLimiter);

        // Leather throat liner contact
        if (this.pocketDropBuffer) {
            const burst = ctx.createBufferSource();
            burst.buffer = this.pocketDropBuffer;
            const bFilter = ctx.createBiquadFilter();
            bFilter.type = 'lowpass';
            bFilter.frequency.setValueAtTime(320, now);

            const bGain = ctx.createGain();
            bGain.gain.setValueAtTime(0.75, now);
            bGain.gain.exponentialRampToValueAtTime(0.001, now + 0.018);

            burst.connect(bFilter);
            bFilter.connect(bGain);
            bGain.connect(targetNode);
            burst.start(now);
        }

        // Deep hollow pocket well resonance
        const osc1 = ctx.createOscillator();
        const g1 = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(120, now);
        osc1.frequency.exponentialRampToValueAtTime(42, now + 0.11);
        g1.gain.setValueAtTime(0.85, now);
        g1.gain.exponentialRampToValueAtTime(0.0001, now + 0.13);
        osc1.connect(g1);
        g1.connect(targetNode);
        osc1.start(now);
        osc1.stop(now + 0.14);
    }

    public destroy(): void {
        if (this.ctx && this.ctx.state !== 'closed') {
            try {
                this.ctx.close();
            } catch { }
            this.ctx = null;
        }
    }
}

// =========================================================================
// High-Resolution Procedural Ball Texture Generator (Tournament Aramith Style)
// =========================================================================

function generateBallTexture(
    num: number,
    type: BallType,
    colorHex: string
): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Clean, rich Ivory White base
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (type === 'cue') {
        // Tournament Aramith Pro Cup 6-Dot Design
        ctx.fillStyle = '#dc2626';
        const dotRadius = 14;
        const dotPositions: [number, number][] = [
            [canvas.width * 0.25, canvas.height * 0.50], // Facing camera
            [canvas.width * 0.75, canvas.height * 0.50], // Opposite camera
            [canvas.width * 0.25, canvas.height * 0.24], // North
            [canvas.width * 0.25, canvas.height * 0.76], // South
            [canvas.width * 0.00, canvas.height * 0.50], // East
            [canvas.width * 0.50, canvas.height * 0.50]  // West
        ];
        for (const [dx, dy] of dotPositions) {
            ctx.beginPath();
            ctx.arc(dx, dy, dotRadius, 0, Math.PI * 2);
            ctx.fill();
        }
        return canvas;
    }

    if (type === 'solid' || type === '8ball') {
        // Solid body color
        ctx.fillStyle = colorHex;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else if (type === 'stripe') {
        // Tournament Stripe: Wide equatorial band with clean white poles
        ctx.fillStyle = colorHex;
        const bandHeight = canvas.height * 0.56;
        const bandY = (canvas.height - bandHeight) * 0.5;
        ctx.fillRect(0, bandY, canvas.width, bandHeight);

        // Thin accent pin-lines separating stripe from white caps
        ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
        ctx.fillRect(0, bandY - 2, canvas.width, 2);
        ctx.fillRect(0, bandY + bandHeight, canvas.width, 2);
    }

    // Number Badges (both sides: u = 0.25 camera-facing, u = 0.75 back)
    const badgePositions = [canvas.width * 0.25, canvas.width * 0.75];
    for (const bx of badgePositions) {
        const by = canvas.height * 0.5;
        const r = 68;

        // White circular badge
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(bx, by, r, 0, Math.PI * 2);
        ctx.fill();

        // Subtle dark rim
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 4;
        ctx.stroke();

        // High contrast number
        ctx.fillStyle = '#0f172a';
        ctx.font = '900 72px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(num.toString(), bx, by + 4);

        // Underline for 6 and 9
        if (num === 6 || num === 9) {
            ctx.fillRect(bx - 26, by + 42, 52, 7);
        }
    }

    return canvas;
}

// =========================================================================
// Billiards AI (Landscape 2D Perspective)
// =========================================================================

export interface AIShotChoice {
    targetBall: PoolBall;
    pocket: PocketInfo;
    dirX: number;
    dirY: number;
    power: number;
    confidence: number;
}

export class BilliardsAI {
    public static calculateShot(
        cueX: number, cueY: number,
        balls: PoolBall[],
        pockets: PocketInfo[],
        legalGroup: BallGroup | 'any',
        difficulty: AIDifficulty
    ): AIShotChoice | null {
        const legalBalls = balls.filter(b => {
            if (b.potted || b.type === 'cue') return false;
            if (legalGroup === 'solids') return b.type === 'solid';
            if (legalGroup === 'stripes') return b.type === 'stripe';
            return b.type === 'solid' || b.type === 'stripe' || b.type === '8ball';
        });

        if (legalBalls.length === 0) {
            const eight = balls.find(b => b.number === 8 && !b.potted);
            if (eight) legalBalls.push(eight);
        }

        if (legalBalls.length === 0) return null;

        const R = 0.45;
        const candidates: AIShotChoice[] = [];

        for (const target of legalBalls) {
            const tx = target.entity.transform.position.x;
            const ty = target.entity.transform.position.y;

            for (const p of pockets) {
                const toPocketX = p.x - tx;
                const toPocketY = p.y - ty;
                const distToPocket = Math.hypot(toPocketX, toPocketY);
                if (distToPocket < 0.1) continue;

                const pDirX = toPocketX / distToPocket;
                const pDirY = toPocketY / distToPocket;

                // Ghost ball position
                const ghostX = tx - pDirX * (R * 2);
                const ghostY = ty - pDirY * (R * 2);

                const cueToGhostX = ghostX - cueX;
                const cueToGhostY = ghostY - cueY;
                const distCueToGhost = Math.hypot(cueToGhostX, cueToGhostY);
                if (distCueToGhost < 0.1) continue;

                const shotDirX = cueToGhostX / distCueToGhost;
                const shotDirY = cueToGhostY / distCueToGhost;

                // Cut angle
                const cutDot = shotDirX * pDirX + shotDirY * pDirY;
                if (cutDot <= 0.15) continue; // Unreasonable cut angle

                // Obstruction check
                let blocked = false;
                for (const other of balls) {
                    if (other.potted || other === target || other.type === 'cue') continue;
                    const ox = other.entity.transform.position.x;
                    const oy = other.entity.transform.position.y;

                    if (BilliardsAI.distToSegment(ox, oy, tx, ty, p.x, p.y) < R * 1.9) { blocked = true; break; }
                    if (BilliardsAI.distToSegment(ox, oy, cueX, cueY, ghostX, ghostY) < R * 1.9) { blocked = true; break; }
                }
                if (blocked) continue;

                const cutScore = Math.pow(cutDot, 2.2);
                const distScore = 1.0 / (1.0 + (distToPocket + distCueToGhost) * 0.05);
                const confidence = cutScore * 0.65 + distScore * 0.35;

                const totalDist = distCueToGhost + distToPocket;
                const power = Math.min(1.0, Math.max(0.3, 0.25 + totalDist * 0.025 + (1 - cutDot) * 0.2));

                candidates.push({
                    targetBall: target,
                    pocket: p,
                    dirX: shotDirX,
                    dirY: shotDirY,
                    power,
                    confidence
                });
            }
        }

        if (candidates.length === 0) {
            let closest = legalBalls[0];
            let minD = Infinity;
            for (const b of legalBalls) {
                const d = Math.hypot(b.entity.transform.position.x - cueX, b.entity.transform.position.y - cueY);
                if (d < minD) { minD = d; closest = b; }
            }
            const tx = closest.entity.transform.position.x;
            const ty = closest.entity.transform.position.y;
            const dx = tx - cueX;
            const dy = ty - cueY;
            const dist = Math.hypot(dx, dy) || 1;
            return {
                targetBall: closest,
                pocket: pockets[0],
                dirX: dx / dist,
                dirY: dy / dist,
                power: 0.45,
                confidence: 0.1
            };
        }

        candidates.sort((a, b) => b.confidence - a.confidence);
        const best = candidates[0];

        // Apply difficulty error variance
        let err = 0;
        if (difficulty === 'amateur') err = (Math.random() - 0.5) * 0.06;
        else if (difficulty === 'master') err = (Math.random() - 0.5) * 0.02;
        else err = (Math.random() - 0.5) * 0.005;

        const currentAngle = Math.atan2(best.dirY, best.dirX) + err;
        best.dirX = Math.cos(currentAngle);
        best.dirY = Math.sin(currentAngle);

        return best;
    }

    private static distToSegment(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const lenSq = dx * dx + dy * dy;
        if (lenSq === 0) return Math.hypot(px - x1, py - y1);
        let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
        t = Math.max(0, Math.min(1, t));
        return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
    }
}

// =========================================================================
// High-Resolution Procedural Tournament Baize Cloth Texture
// (Simulates Simonis 860 Worsted Cloth with Overhead Tournament Canopy Light Pool)
// =========================================================================

function generateBaizeTexture(): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d')!;

    const w = canvas.width;
    const h = canvas.height;
    const cx = w * 0.5;
    const cy = h * 0.5;

    // 1. Deep Classic Tournament Emerald Gradient matching reference image
    // Uses 2:1 horizontal scaling to create an elliptical light pool matching table proportions
    ctx.save();
    ctx.scale(2.0, 1.0);
    const grad = ctx.createRadialGradient(cx * 0.5, cy, 60, cx * 0.5, cy, (w * 0.5) * 0.95);
    grad.addColorStop(0.00, '#157e3c'); // Rich, focused green under lamp
    grad.addColorStop(0.35, '#106b32'); // Deep emerald body
    grad.addColorStop(0.70, '#0c5728'); // Deep forest green
    grad.addColorStop(0.90, '#08451f'); // Edge shadow
    grad.addColorStop(1.00, '#053416'); // Dark perimeter contact
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w * 0.5, h);
    ctx.restore();

    // 2. Microscopic Worsted Cloth Weave (Simonis 860 Tournament Cloth Texture)
    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;

    let seed = 12345;
    const rnd = () => {
        seed = (seed * 1664525 + 1013904223) >>> 0;
        return (seed / 4294967296);
    };

    for (let y = 0; y < h; y++) {
        const rowOffset = y * w * 4;
        const twill = (y & 2) ? 1.2 : -1.2;
        for (let x = 0; x < w; x++) {
            const idx = rowOffset + (x << 2);
            const grain = ((x + y) % 3 === 0 ? 1.8 : -1.8) + twill + (rnd() - 0.5) * 3.5;
            data[idx] = Math.min(255, Math.max(0, data[idx] + grain * 0.6));
            data[idx + 1] = Math.min(255, Math.max(0, data[idx + 1] + grain * 1.0));
            data[idx + 2] = Math.min(255, Math.max(0, data[idx + 2] + grain * 0.6));
        }
    }
    ctx.putImageData(imgData, 0, 0);

    // 3. Perimeter Contact Ambient Occlusion (deeper along top and left cushions matching lighting direction)
    const addEdgeShadow = (x0: number, y0: number, x1: number, y1: number, vx: number, vy: number, vw: number, vh: number, alpha: number) => {
        const g = ctx.createLinearGradient(x0, y0, x1, y1);
        g.addColorStop(0, `rgba(1, 15, 6, ${alpha})`);
        g.addColorStop(1, 'rgba(1, 15, 6, 0.0)');
        ctx.fillStyle = g;
        ctx.fillRect(vx, vy, vw, vh);
    };

    const edgeSize = 48;
    addEdgeShadow(0, 0, edgeSize, 0, 0, 0, edgeSize, h, 0.65);               // Left cushion (in key shadow)
    addEdgeShadow(w, 0, w - edgeSize, 0, w - edgeSize, 0, edgeSize, h, 0.35); // Right cushion
    addEdgeShadow(0, 0, 0, edgeSize, 0, 0, w, edgeSize, 0.70);               // Top cushion (in key shadow)
    addEdgeShadow(0, h, 0, h - edgeSize, 0, h - edgeSize, w, edgeSize, 0.35); // Bottom cushion

    return canvas;
}

// =========================================================================
// Main 2D Top-Down Billiards Game Scene (Physics3D Engine)
// =========================================================================

export default class BilliardsGameScene extends Scene {
    private physics!: Physics3D;
    private soundEffects = new BilliardsAudio();

    // Landscape Table Proportions (Horizontal Widescreen Layout)
    public readonly TABLE_LENGTH = 34.0; // Horizontal X axis: -17.0 to +17.0
    public readonly TABLE_WIDTH = 17.0;  // Vertical Y axis: -8.5 to +8.5
    public readonly HALF_L = 17.0;
    public readonly HALF_W = 8.5;
    public readonly BALL_RADIUS = 0.45;

    // Entities
    private cueBall!: PoolBall;
    private balls: PoolBall[] = [];
    private pockets: PocketInfo[] = [];
    private cushions: (Box | Model)[] = [];

    // Aim Visuals & 3D Cue Stick
    private aimLine!: Line3D;
    private ghostBallMarker!: Sphere;
    private targetPathLine!: Line3D;
    private cueStick!: Cylinder;

    // Pointer Interaction State
    private isAiming: boolean = false;
    private dragStartWorld: Vec3 = new Vec3();
    private dragCurrentWorld: Vec3 = new Vec3();
    private currentPowerRatio: number = 0;

    // Turn & Rule State
    public gameMode: GameMode = 'pv_ai';
    public aiDifficulty: AIDifficulty = 'master';
    public currentTurn: PlayerType = 'player1';
    public player1Group: BallGroup | null = null;
    public player2Group: BallGroup | null = null;
    public isTableOpen: boolean = true;
    public gameState: 'aiming' | 'rolling' | 'ai_thinking' | 'game_over' = 'aiming';

    // Turn Outcome Tracking
    private pottedThisShot: PoolBall[] = [];
    private firstBallHitThisShot: PoolBall | null = null;
    private quietRestFrames: number = 0;
    private scratchOccurred: boolean = false;

    // AI Timer
    private aiTimer?: number;

    // UI Container
    private uiContainer?: HTMLDivElement;

    // Window event handlers for cleanup
    private _resizeHandler?: () => void;
    private _contextMenuHandler?: (e: MouseEvent) => void;

    public async run(): Promise<void> {
        this.renderConfig.AA = 1;
        this.disablePlayer();

        this.ALWAYS_UPDATE = true;

        // 1. Static Overhead Orthographic Camera (Zero 3D Ambiguity, Clean 2D View)
        this.camera.position.set([0, 0, 32]);
        this.camera.lookAt(new Vec3(0, 0, 0));
        this.camera.model = CameraModel.ORTHOGRAPHIC;
        this._resizeHandler = () => {
            const canvas = this.canvas as HTMLCanvasElement | undefined;
            const aspect = canvas && canvas.height > 0 ? (canvas.width / canvas.height) : (16 / 9);
            // Table with rails is ~37.0 wide by ~20.0 high; ensure generous framing without cropping
            const targetW = 39.5;
            const targetH = 22.0;
            this.camera.orthoScale = Math.max(targetH, targetW / aspect);
        };
        this._resizeHandler();
        window.addEventListener('resize', this._resizeHandler);
        this.camera.focusDist = 20.0; // Tightens shadow ortho frustum (bound = 35) to table dimensions

        // 2. Built-in Shadow Mapping & Studio Lighting Setup
        this.renderConfig.shadowsEnabled = true;
        this.renderConfig.shadowMethod = ShadowMethod.PCSS;
        this.renderConfig.lightSize = 3.0; // Balanced penumbra: crisp contact grounding with smooth falloff

        // Key Light positioned overhead with moderate angle for defined, grounded shadows
        light.position.set([-8, 14, 38]);
        light.color = new Color(280, 275, 260);

        // Ambient Fill & Background (Moody, focused, realistic cloth bounce)
        this.clearColor(demoBackground());
        env.skyColor = new Color(0.15, 0.18, 0.23, 1.0);
        env.groundColor = new Color(0.05, 0.07, 0.06, 1.0);
        env.intensity = 0.95;

        // 3. Initialize Physics3D (Simulation on XY plane, Z clamped to BALL_RADIUS)
        this.physics = new Physics3D(this, {
            backend: 'box3d',
            gravity: [0, 0, 0], // Flat horizontal table
            timeStep: 1 / 60,
            subSteps: 4,
            maxSubSteps: 4
        });
        await this.physics.ready();

        // 4. Hook Contact Events for Realistic Acoustic Response
        this.physics.on('collisionStart', (evt: Collision3DEvent) => {
            this.handlePhysicsCollision(evt);
        });

        // 5. Build Tournament Table Architecture & Markings
        this.createLandscapeTable();

        // 6. Spawn 16 Smooth 64x64 Billiard Balls
        this.spawnBalls();

        // 7. Create Aim Visuals & 3D Cue Stick
        this.createAimVisuals();

        // 8. Mount Glassmorphic Tournament HUD
        this.createUI();

        // 9. Setup Slingshot Controls
        this.setupPointerControls();

        // 10. Main Loop
        this.always(() => {
            this.updateGameLoop();
        });
    }

    // =========================================================================
    // Tournament Table Architecture
    // =========================================================================

    private createLandscapeTable(): void {
        const feltGreen = Color.fromHex('#0c5728'); // Deep Classic Tournament Felt
        const cushionGreen = Color.fromHex('#147d3a'); // Tournament cushion green
        const darkRail = Color.fromHex('#3d2213'); // Warm Deep Walnut Wood
        const chromeCol = Color.fromHex('#e2e8f0'); // Polished Chrome Pocket Castings
        const railThick = 1.10;   // Substantial outer wooden frame matching reference
        const railHeight = 0.58;  // WPA Tournament rail height (64% of ball diameter)
        const railZ = railHeight / 2; // = 0.29

        // Helper: Extrude a 2D polygon into a 3D Model with clean top, bottom, and side faces
        const createExtrudedPolygon = (
            outerPts: [number, number][],
            holes: [number, number][][] = [],
            zMin: number,
            zMax: number,
            options?: ModelOptions
        ): Model => {
            const flat: number[] = [];
            const holeIndices: number[] = [];

            for (const [x, y] of outerPts) {
                flat.push(x, y);
            }
            for (const hole of holes) {
                holeIndices.push(flat.length / 2);
                for (const [x, y] of hole) {
                    flat.push(x, y);
                }
            }

            const total2DPts = flat.length / 2;
            const topIndices = earcut(flat, holeIndices.length > 0 ? holeIndices : undefined, 2);

            const vertices: number[] = [];
            const normals: number[] = [];
            const uvs: number[] = [];
            const indices: number[] = [];

            // Top face (Z = zMax, normal = [0, 0, 1])
            const topStart = 0;
            for (let i = 0; i < total2DPts; i++) {
                vertices.push(flat[i * 2], flat[i * 2 + 1], zMax);
                normals.push(0, 0, 1);
                uvs.push(flat[i * 2], flat[i * 2 + 1]);
            }
            for (let i = 0; i < topIndices.length; i += 3) {
                indices.push(topStart + topIndices[i], topStart + topIndices[i + 1], topStart + topIndices[i + 2]);
            }

            // Bottom face (Z = zMin, normal = [0, 0, -1])
            const botStart = vertices.length / 3;
            for (let i = 0; i < total2DPts; i++) {
                vertices.push(flat[i * 2], flat[i * 2 + 1], zMin);
                normals.push(0, 0, -1);
                uvs.push(flat[i * 2], flat[i * 2 + 1]);
            }
            for (let i = 0; i < topIndices.length; i += 3) {
                indices.push(botStart + topIndices[i], botStart + topIndices[i + 2], botStart + topIndices[i + 1]);
            }

            // Side walls
            const addSideWalls = (ring: [number, number][]) => {
                const m = ring.length;
                for (let i = 0; i < m; i++) {
                    const next = (i + 1) % m;
                    const p0 = ring[i];
                    const p1 = ring[next];
                    const dx = p1[0] - p0[0];
                    const dy = p1[1] - p0[1];
                    const len = Math.hypot(dx, dy) || 1;
                    const nx = dy / len;
                    const ny = -dx / len;

                    const startIdx = vertices.length / 3;
                    vertices.push(p0[0], p0[1], zMin);
                    normals.push(nx, ny, 0);
                    uvs.push(0, 0);

                    vertices.push(p1[0], p1[1], zMin);
                    normals.push(nx, ny, 0);
                    uvs.push(1, 0);

                    vertices.push(p1[0], p1[1], zMax);
                    normals.push(nx, ny, 0);
                    uvs.push(1, 1);

                    vertices.push(p0[0], p0[1], zMax);
                    normals.push(nx, ny, 0);
                    uvs.push(0, 1);

                    indices.push(startIdx, startIdx + 1, startIdx + 2);
                    indices.push(startIdx, startIdx + 2, startIdx + 3);
                }
            };

            addSideWalls(outerPts);
            for (const hole of holes) {
                addSideWalls(hole);
            }

            return new Model({
                vertices: new Float32Array(vertices),
                normals: new Float32Array(normals),
                uvs: new Float32Array(uvs),
                indices: new Uint32Array(indices)
            }, options);
        };

        // 1. Table Bed (Green Slate Felt with Overhead Tournament Lighting Pool)
        // Top surface is flush at Z = 0.0
        const bed = new Box(this.TABLE_LENGTH, this.TABLE_WIDTH, 0.3, {
            materialColor: Color.fromHex('#ffffff')
        });
        bed.transform.position = new Vec3(0, 0, -0.15);
        bed.material.albedoMap = generateBaizeTexture();
        bed.material.roughness = 0.94;
        bed.material.specular = 0.12;
        bed.CAST_SHADOW = false;  // Bed receives shadows without self-shadow acne
        bed.RECEIVE_SHADOW = true;
        this.add(bed);

        // 2. Baize Markings (Head String Line, Head Spot, Foot Spot)
        const lineMat = Color.fromHex('#e2e8f0');

        // Head String Line (across X = -8.5)
        const headLine = new Line3D([
            new Vec3(-8.5, -this.HALF_W + 0.6, 0.01),
            new Vec3(-8.5, this.HALF_W - 0.6, 0.01)
        ]);
        headLine.material.color = new Color(0.9, 0.95, 1.0, 0.28);
        this.add(headLine);

        // Head Spot Dot (X = -8.5, Y = 0)
        const headSpot = new Sphere(0.08, { widthSegments: 16, heightSegments: 16 });
        headSpot.transform.position = new Vec3(-8.5, 0, 0.015);
        headSpot.material.color = lineMat;
        headSpot.CAST_SHADOW = false;
        this.add(headSpot);

        // Foot Spot Dot (Rack Apex Spot at X = 7.5, Y = 0)
        const footSpot = new Sphere(0.08, { widthSegments: 16, heightSegments: 16 });
        footSpot.transform.position = new Vec3(7.5, 0, 0.015);
        footSpot.material.color = new Color(0.1, 0.1, 0.15, 1.0);
        footSpot.CAST_SHADOW = false;
        this.add(footSpot);

        // Center Table Spot
        const centerSpot = new Sphere(0.06, { widthSegments: 16, heightSegments: 16 });
        centerSpot.transform.position = new Vec3(0, 0, 0.015);
        centerSpot.material.color = new Color(0.1, 0.1, 0.15, 1.0);
        centerSpot.CAST_SHADOW = false;
        this.add(centerSpot);

        // 3. 6 Pockets Definition (Tournament Specification)
        const cornerPocketR = 0.85;
        const sidePocketR = 0.75;
        const px0 = 16.35;
        const py0 = 7.85;
        const sOffset = 0.12; // Side pocket center at y = ±(8.5 + 0.12) = ±8.62

        this.pockets = [
            { id: 0, name: "Top-Left Corner", x: -px0, y: py0, radius: cornerPocketR },
            { id: 1, name: "Top-Center Side", x: 0, y: this.HALF_W + sOffset, radius: sidePocketR },
            { id: 2, name: "Top-Right Corner", x: px0, y: py0, radius: cornerPocketR },
            { id: 3, name: "Bottom-Left Corner", x: -px0, y: -py0, radius: cornerPocketR },
            { id: 4, name: "Bottom-Center Side", x: 0, y: -this.HALF_W - sOffset, radius: sidePocketR },
            { id: 5, name: "Bottom-Right Corner", x: px0, y: -py0, radius: cornerPocketR },
        ];

        // 4. 6 Green Rubber Cushions (Clean 4-Vertex Convex Trapezoids with Exact 45° Beveled Jaws)
        // Each cushion is an extruded trapezoid whose jaws start exactly at the pocket perimeter
        // and funnel smoothly into each pocket opening at 45°.
        const cThick = 0.50; // Cushion profile thickness
        const cushionZMin = 0.0;
        const cushionZMax = 0.58; // Tournament cushion nose height (64% of ball diameter, enclosing equator at Z=0.45)

        const addCushionModel = (pts: [number, number][]) => {
            const mesh = createExtrudedPolygon(pts, [], cushionZMin, cushionZMax, {
                materialColor: cushionGreen
            });
            this.addCushion(mesh);
        };

        // Top-Left Cushion (from corner pocket to side pocket)
        addCushionModel([
            [-15.80, this.HALF_W],
            [-0.74, this.HALF_W],
            [-1.24, this.HALF_W - cThick],
            [-15.30, this.HALF_W - cThick]
        ]);

        // Top-Right Cushion (from side pocket to corner pocket)
        addCushionModel([
            [0.74, this.HALF_W],
            [15.80, this.HALF_W],
            [15.30, this.HALF_W - cThick],
            [1.24, this.HALF_W - cThick]
        ]);

        // Bottom-Left Cushion
        addCushionModel([
            [-0.74, -this.HALF_W],
            [-15.80, -this.HALF_W],
            [-15.30, -this.HALF_W + cThick],
            [-1.24, -this.HALF_W + cThick]
        ]);

        // Bottom-Right Cushion
        addCushionModel([
            [15.80, -this.HALF_W],
            [0.74, -this.HALF_W],
            [1.24, -this.HALF_W + cThick],
            [15.30, -this.HALF_W + cThick]
        ]);

        // Left Cushion (between top-left and bottom-left corner pockets)
        addCushionModel([
            [-this.HALF_L, -7.30],
            [-this.HALF_L, 7.30],
            [-this.HALF_L + cThick, 6.80],
            [-this.HALF_L + cThick, -6.80]
        ]);

        // Right Cushion (between top-right and bottom-right corner pockets)
        addCushionModel([
            [this.HALF_L, 7.30],
            [this.HALF_L, -7.30],
            [this.HALF_L - cThick, -6.80],
            [this.HALF_L - cThick, 6.80]
        ]);

        // 5. Outer Wooden Rails (6 Walnut Wood Sections)
        // Fitted flush between corner castings and side pocket castings
        const cornerCastingSpan = 1.20;
        const sideCastingSpan = 0.95;
        const topBotRailLen = this.HALF_L - cornerCastingSpan - sideCastingSpan; // 14.85
        const endRailLen = this.TABLE_WIDTH - cornerCastingSpan * 2;          // 14.60

        const makeWoodRail = (w: number, h: number, x: number, y: number) => {
            const r = new Box(w, h, railHeight, { materialColor: darkRail });
            r.transform.position = new Vec3(x, y, railZ);
            r.CAST_SHADOW = true;
            r.RECEIVE_SHADOW = true;
            r.material.roughness = 0.52;
            r.material.specular = 0.38;
            this.add(r);
            this.physics.add(r, {
                type: 'static',
                shape: 'box',
                halfExtents: [w / 2, h / 2, railHeight / 2],
                friction: 0.15,
                restitution: 0.70
            });
        };

        const longRailY = this.HALF_W + railThick / 2;
        const longRailX = sideCastingSpan + topBotRailLen / 2;
        makeWoodRail(topBotRailLen, railThick, -longRailX, longRailY); // Top-Left
        makeWoodRail(topBotRailLen, railThick, longRailX, longRailY); // Top-Right
        makeWoodRail(topBotRailLen, railThick, -longRailX, -longRailY); // Bottom-Left
        makeWoodRail(topBotRailLen, railThick, longRailX, -longRailY); // Bottom-Right

        const endRailX = this.HALF_L + railThick / 2;
        makeWoodRail(railThick, endRailLen, -endRailX, 0); // Left
        makeWoodRail(railThick, endRailLen, endRailX, 0); // Right

        // 6. Polished Chrome Pocket Castings (Corner & Side Pocket Irons)
        // Outer table corners are rounded (radius 1.10) with an open circular cutout for the pocket.
        const castingZMin = 0.0;
        const castingZMax = railHeight + 0.02;

        const addCornerCasting = (signX: number, signY: number) => {
            const cx = signX * this.HALF_L;
            const cy = signY * this.HALF_W;
            const outerX = cx + signX * railThick;
            const outerY = cy + signY * railThick;
            const span = cornerCastingSpan;
            const px = signX * px0;
            const py = signY * py0;
            const steps = 16;

            const pShort: [number, number] = [cx, cy - signY * span];
            const pLong: [number, number] = [cx - signX * span, cy];

            const aShort = Math.atan2(pShort[1] - py, pShort[0] - px);
            const aLong = Math.atan2(pLong[1] - py, pLong[0] - px);

            const rShort = Math.hypot(pShort[0] - px, pShort[1] - py);
            const rLong = Math.hypot(pLong[0] - px, pLong[1] - py);

            let deltaA = aLong - aShort;
            while (deltaA > Math.PI) deltaA -= Math.PI * 2;
            while (deltaA < -Math.PI) deltaA += Math.PI * 2;

            let outerStartA: number, outerEndA: number;
            if (signX < 0 && signY > 0) { outerStartA = Math.PI * 0.5; outerEndA = Math.PI; }
            else if (signX > 0 && signY > 0) { outerStartA = Math.PI * 0.5; outerEndA = 0; }
            else if (signX < 0 && signY < 0) { outerStartA = Math.PI * 1.5; outerEndA = Math.PI; }
            else { outerStartA = Math.PI * 1.5; outerEndA = Math.PI * 2.0; }

            const poly: [number, number][] = [];
            // 1. Joint with long rail
            poly.push(pLong);
            poly.push([pLong[0], outerY]);

            // 2. Outer rounded corner arc
            poly.push([cx, outerY]);
            for (let i = 1; i < steps; i++) {
                const a = outerStartA + (outerEndA - outerStartA) * (i / steps);
                poly.push([cx + Math.cos(a) * railThick, cy + Math.sin(a) * railThick]);
            }
            poly.push([outerX, cy]);

            // 3. Joint with short rail
            poly.push([outerX, pShort[1]]);
            poly.push(pShort);

            // 4. Inner circular arc around pocket hole from pShort to pLong
            for (let i = 1; i < steps; i++) {
                const frac = i / steps;
                const a = aShort + deltaA * frac;
                const r = rShort + (rLong - rShort) * frac;
                poly.push([px + Math.cos(a) * r, py + Math.sin(a) * r]);
            }

            let area = 0;
            for (let i = 0; i < poly.length; i++) {
                const j = (i + 1) % poly.length;
                area += poly[i][0] * poly[j][1] - poly[j][0] * poly[i][1];
            }
            if (area < 0) poly.reverse();

            const casting = createExtrudedPolygon(poly, [], castingZMin, castingZMax, {
                materialColor: darkRail
            });
            casting.material.roughness = 0.52;
            casting.material.specular = 0.38;
            casting.CAST_SHADOW = true;
            casting.RECEIVE_SHADOW = true;
            this.add(casting);

            // Polished chrome rim bezel lining the corner pocket cutout
            const rimPoly: [number, number][] = [];
            for (let i = 0; i <= steps; i++) {
                const frac = i / steps;
                const a = aShort + deltaA * frac;
                const r = rShort + (rLong - rShort) * frac;
                rimPoly.push([px + Math.cos(a) * r, py + Math.sin(a) * r]);
            }
            for (let i = steps; i >= 0; i--) {
                const frac = i / steps;
                const a = aShort + deltaA * frac;
                const r = (rShort + (rLong - rShort) * frac) + 0.035;
                rimPoly.push([px + Math.cos(a) * r, py + Math.sin(a) * r]);
            }
            let rimArea = 0;
            for (let i = 0; i < rimPoly.length; i++) {
                const j = (i + 1) % rimPoly.length;
                rimArea += rimPoly[i][0] * rimPoly[j][1] - rimPoly[j][0] * rimPoly[i][1];
            }
            if (rimArea < 0) rimPoly.reverse();
            const rim = createExtrudedPolygon(rimPoly, [], castingZMax, castingZMax + 0.01, {
                materialColor: chromeCol
            });
            rim.material.metallic = 0.96;
            rim.material.roughness = 0.12;
            rim.material.specular = 0.99;
            rim.CAST_SHADOW = false;
            rim.RECEIVE_SHADOW = true;
            this.add(rim);

            // Chrome Bolt Fasteners
            const boltCol = Color.fromHex('#f1f5f9');
            const bolt1 = new Cylinder(0.055, 0.055, 0.025, { radialSegments: 16, heightSegments: 1, openEnded: false, materialColor: boltCol });
            bolt1.transform.position = new Vec3(cx - signX * 0.75, cy + signY * (railThick / 2), castingZMax + 0.015);
            bolt1.transform.setRotationX(Math.PI / 2);
            bolt1.material.metallic = 0.96;
            bolt1.material.roughness = 0.12;
            bolt1.material.specular = 0.99;
            bolt1.CAST_SHADOW = false;
            this.add(bolt1);

            const bolt2 = new Cylinder(0.055, 0.055, 0.025, { radialSegments: 16, heightSegments: 1, openEnded: false, materialColor: boltCol });
            bolt2.transform.position = new Vec3(cx + signX * (railThick / 2), cy - signY * 0.75, castingZMax + 0.015);
            bolt2.transform.setRotationX(Math.PI / 2);
            bolt2.material.metallic = 0.96;
            bolt2.material.roughness = 0.12;
            bolt2.material.specular = 0.99;
            bolt2.CAST_SHADOW = false;
            this.add(bolt2);

            // Solid pocket backstop behind corner pocket rim to prevent balls penetrating wood
            const backstop = new Box(1.80, 0.75, railHeight);
            backstop.transform.position = new Vec3(signX * 17.40, signY * 8.90, railZ);
            backstop.transform.setRotationZ(signX * signY * Math.PI / 4);
            backstop.VISIBILITY = false;
            this.add(backstop);
            this.physics.add(backstop, {
                type: 'static',
                shape: 'box',
                halfExtents: [1.80 / 2, 0.75 / 2, railHeight / 2],
                friction: 0.15,
                restitution: 0.70
            });
        };

        addCornerCasting(-1, 1); // Top-Left
        addCornerCasting(1, 1); // Top-Right
        addCornerCasting(-1, -1); // Bottom-Left
        addCornerCasting(1, -1); // Bottom-Right

        // Side Pocket Chrome Castings (U-shaped collar framing the pocket opening without covering it)
        const addSideCasting = (isTop: boolean) => {
            const span = sideCastingSpan;
            const cy = isTop ? this.HALF_W : -this.HALF_W;
            const outerY = isTop ? cy + railThick : cy - railThick;
            const py = isTop ? this.HALF_W + sOffset : -this.HALF_W - sOffset;
            const rCutout = sidePocketR + 0.02; // 0.77
            const dy = cy - py;
            const dx = Math.sqrt(Math.max(0, rCutout * rCutout - dy * dy)); // 0.7606
            const steps = 16;

            const aStart = Math.atan2(cy - py, dx);
            const aEnd = Math.atan2(cy - py, -dx);
            let deltaA = aEnd - aStart;
            if (isTop) {
                while (deltaA < 0) deltaA += Math.PI * 2;
            } else {
                while (deltaA > 0) deltaA -= Math.PI * 2;
            }

            const poly: [number, number][] = [];
            poly.push([-span, cy]);
            poly.push([-span, outerY]);
            poly.push([span, outerY]);
            poly.push([span, cy]);
            poly.push([dx, cy]);

            // Semi-circular cutout around pocket hole into the rail
            for (let i = 1; i < steps; i++) {
                const a = aStart + deltaA * (i / steps);
                poly.push([Math.cos(a) * rCutout, py + Math.sin(a) * rCutout]);
            }
            poly.push([-dx, cy]);

            let area = 0;
            for (let i = 0; i < poly.length; i++) {
                const j = (i + 1) % poly.length;
                area += poly[i][0] * poly[j][1] - poly[j][0] * poly[i][1];
            }
            if (area < 0) poly.reverse();

            const casting = createExtrudedPolygon(poly, [], castingZMin, castingZMax, {
                materialColor: darkRail
            });
            casting.material.roughness = 0.52;
            casting.material.specular = 0.38;
            casting.CAST_SHADOW = true;
            casting.RECEIVE_SHADOW = true;
            this.add(casting);

            // Polished chrome rim bezel lining the pocket cutout
            const rimPoly: [number, number][] = [];
            const rRimOuter = rCutout + 0.035;
            for (let i = 0; i <= steps; i++) {
                const a = aStart + deltaA * (i / steps);
                rimPoly.push([Math.cos(a) * rCutout, py + Math.sin(a) * rCutout]);
            }
            for (let i = steps; i >= 0; i--) {
                const a = aStart + deltaA * (i / steps);
                rimPoly.push([Math.cos(a) * rRimOuter, py + Math.sin(a) * rRimOuter]);
            }
            let rimArea = 0;
            for (let i = 0; i < rimPoly.length; i++) {
                const j = (i + 1) % rimPoly.length;
                rimArea += rimPoly[i][0] * rimPoly[j][1] - rimPoly[j][0] * rimPoly[i][1];
            }
            if (rimArea < 0) rimPoly.reverse();
            const rim = createExtrudedPolygon(rimPoly, [], castingZMax, castingZMax + 0.01, {
                materialColor: chromeCol
            });
            rim.material.metallic = 0.96;
            rim.material.roughness = 0.12;
            rim.material.specular = 0.99;
            rim.CAST_SHADOW = false;
            rim.RECEIVE_SHADOW = true;
            this.add(rim);

            // Fastener bolts on left and right of side pocket casting
            const boltY = (cy + outerY) / 2;
            const boltCol = Color.fromHex('#f1f5f9');
            for (const bx of [-span + 0.22, span - 0.22]) {
                const b = new Cylinder(0.055, 0.055, 0.025, { radialSegments: 16, heightSegments: 1, openEnded: false, materialColor: boltCol });
                b.transform.position = new Vec3(bx, boltY, castingZMax + 0.015);
                b.transform.setRotationX(Math.PI / 2);
                b.material.metallic = 0.96;
                b.material.roughness = 0.12;
                b.material.specular = 0.99;
                b.CAST_SHADOW = false;
                this.add(b);
            }

            // Solid pocket backstop behind side pocket rim
            const sideBackstop = new Box(2.20, 0.70, railHeight);
            sideBackstop.transform.position = new Vec3(0, isTop ? 9.60 : -9.60, railZ);
            sideBackstop.VISIBILITY = false;
            this.add(sideBackstop);
            this.physics.add(sideBackstop, {
                type: 'static',
                shape: 'box',
                halfExtents: [2.20 / 2, 0.70 / 2, railHeight / 2],
                friction: 0.15,
                restitution: 0.70
            });
        };
        addSideCasting(true);  // Top
        addSideCasting(false); // Bottom

        // 7. 6 Pocket Holes — Clearly Visible Deep Dark Cavities with Chrome & Leather Liners
        const pocketHoleColor = Color.fromHex('#010204');  // Pitch black interior
        const pocketLinerColor = Color.fromHex('#0c1017'); // Dark leather throat collar

        for (const p of this.pockets) {
            // A. Deep Pitch Black Pocket Hole Disc (Floor at Z = 0.005)
            const holeFloor = new Cylinder(p.radius, p.radius, 0.01, {
                radialSegments: 48,
                heightSegments: 1,
                openEnded: false,
                materialColor: pocketHoleColor
            });
            holeFloor.transform.position = new Vec3(p.x, p.y, 0.005);
            holeFloor.transform.setRotationX(Math.PI / 2);
            holeFloor.material.roughness = 0.99;
            holeFloor.material.specular = 0.01;
            holeFloor.CAST_SHADOW = false;
            holeFloor.RECEIVE_SHADOW = true;
            this.add(holeFloor);

            // B. Dark leather throat liner (Vertical cylindrical wall from Z = 0 to Z = railHeight)
            const liner = new Cylinder(p.radius, p.radius, railHeight, {
                radialSegments: 48,
                heightSegments: 1,
                openEnded: true,
                materialColor: pocketLinerColor
            });
            liner.transform.position = new Vec3(p.x, p.y, railHeight / 2);
            liner.transform.setRotationX(Math.PI / 2);
            liner.material.roughness = 0.95;
            liner.material.specular = 0.10;
            liner.CAST_SHADOW = false;
            liner.RECEIVE_SHADOW = true;
            this.add(liner);
        }

        // 8. 18 Aiming Sights (Pearl White Inlays with Silver Rims on Walnut Rails)
        const sightColor = new Color(0.97, 0.97, 0.95, 1.0);
        const sightZ = railHeight + 0.015;
        const sightY = this.HALF_W + railThick / 2;
        const sightX = this.HALF_L + railThick / 2;

        const sightPositions: [number, number][] = [
            // Top-Left rail (3 sights)
            [-12.75, sightY], [-8.50, sightY], [-4.25, sightY],
            // Top-Right rail (3 sights)
            [4.25, sightY], [8.50, sightY], [12.75, sightY],
            // Bottom-Left rail (3 sights)
            [-12.75, -sightY], [-8.50, -sightY], [-4.25, -sightY],
            // Bottom-Right rail (3 sights)
            [4.25, -sightY], [8.50, -sightY], [12.75, -sightY],
            // Left rail (3 sights)
            [-sightX, -4.25], [-sightX, 0], [-sightX, 4.25],
            // Right rail (3 sights)
            [sightX, -4.25], [sightX, 0], [sightX, 4.25],
        ];

        for (const [sx, sy] of sightPositions) {
            // Silver rim
            const rim = new Cylinder(0.09, 0.09, 0.01, { radialSegments: 16, heightSegments: 1, openEnded: false, materialColor: chromeCol });
            rim.transform.position = new Vec3(sx, sy, sightZ);
            rim.transform.setRotationX(Math.PI / 2);
            rim.material.metallic = 0.90;
            rim.material.roughness = 0.15;
            rim.CAST_SHADOW = false;
            this.add(rim);

            // Pearl dot
            const dot = new Sphere(0.065, { widthSegments: 16, heightSegments: 16, materialColor: sightColor });
            dot.transform.position = new Vec3(sx, sy, sightZ + 0.005);
            dot.material.specular = 0.95;
            dot.material.roughness = 0.10;
            dot.CAST_SHADOW = false;
            this.add(dot);
        }
    }

    private addCushion(cushion: Box | Model): void {
        cushion.material.roughness = 0.88;
        cushion.CAST_SHADOW = true;
        cushion.RECEIVE_SHADOW = true;
        this.cushions.push(cushion);
        this.physics.add(cushion, {
            type: 'static',
            shape: 'convex',
            friction: 0.12,
            restitution: 0.90
        });
    }

    // =========================================================================
    // 16 Billiard Balls (Smooth 64x64 Geometry, Built-in Shadows)
    // =========================================================================

    private spawnBalls(): void {
        for (const b of this.balls) {
            this.physics.remove(b.entity, true);
        }
        this.balls = [];

        const ballZ = this.BALL_RADIUS; // Sits precisely on top of table felt at Z = 0

        // 1. Cue Ball on the Left (Head Spot at X = -8.5, Y = 0)
        const cueSphere = new Sphere(this.BALL_RADIUS, { widthSegments: 64, heightSegments: 64 });
        cueSphere.transform.position = new Vec3(-8.5, 0, ballZ);
        cueSphere.material.roughness = 0.035;
        cueSphere.material.specular = 0.98;
        cueSphere.material.metallic = 0.0;
        cueSphere.material.albedoMap = generateBallTexture(0, 'cue', '#ffffff');
        cueSphere.CAST_SHADOW = true;
        cueSphere.RECEIVE_SHADOW = true;

        const cueComp = this.physics.add(cueSphere, {
            type: 'dynamic',
            shape: 'sphere',
            radius: this.BALL_RADIUS,
            mass: 0.17,
            friction: 0.05,
            restitution: 0.95,
            linearDamping: 0.42,
            angularDamping: 0.40,
            lockRotation: true,
            ccd: true
        });

        cueComp.lockTranslations(false, false, true);

        this.cueBall = {
            id: 0,
            number: 0,
            type: 'cue',
            colorHex: '#ffffff',
            name: "Cue Ball",
            entity: cueSphere,
            bodyComp: cueComp,
            potted: false,
            sinking: false,
            sinkScale: 1.0,
            quaternion: Quaternion.identity(),
            lastX: -8.5,
            lastY: 0
        };
        this.balls.push(this.cueBall);

        // 2. 15 Tournament Object Balls Racked in Triangle on the Right
        const ballDefs: { num: number; type: BallType; hex: string; name: string }[] = [
            { num: 1, type: 'solid', hex: '#f59e0b', name: '1 Yellow' },
            { num: 2, type: 'solid', hex: '#1d4ed8', name: '2 Blue' },
            { num: 3, type: 'solid', hex: '#dc2626', name: '3 Red' },
            { num: 4, type: 'solid', hex: '#7e22ce', name: '4 Purple' },
            { num: 5, type: 'solid', hex: '#ea580c', name: '5 Orange' },
            { num: 6, type: 'solid', hex: '#15803d', name: '6 Green' },
            { num: 7, type: 'solid', hex: '#881337', name: '7 Maroon' },
            { num: 8, type: '8ball', hex: '#111827', name: '8 Black' },
            { num: 9, type: 'stripe', hex: '#f59e0b', name: '9 Stripe Yellow' },
            { num: 10, type: 'stripe', hex: '#1d4ed8', name: '10 Stripe Blue' },
            { num: 11, type: 'stripe', hex: '#dc2626', name: '11 Stripe Red' },
            { num: 12, type: 'stripe', hex: '#7e22ce', name: '12 Stripe Purple' },
            { num: 13, type: 'stripe', hex: '#ea580c', name: '13 Stripe Orange' },
            { num: 14, type: 'stripe', hex: '#15803d', name: '14 Stripe Green' },
            { num: 15, type: 'stripe', hex: '#881337', name: '15 Stripe Maroon' },
        ];

        // Standard WPA 8-Ball Triangle Rack
        const rackOrder = [
            1,            // Apex
            9, 2,         // Row 1
            3, 8, 10,     // Row 2 (8-Ball in center!)
            11, 4, 12, 5, // Row 3
            6, 13, 7, 14, 15 // Row 4 (Corners: one solid, one stripe)
        ];

        const rowStepX = this.BALL_RADIUS * Math.sqrt(3) * 1.025;
        const colStepY = this.BALL_RADIUS * 2.03;
        const apexX = 7.5; // Foot Spot

        let orderIdx = 0;
        for (let row = 0; row < 5; row++) {
            const x = apexX + row * rowStepX;
            const startY = -((row * colStepY) / 2);

            for (let col = 0; col <= row; col++) {
                const y = startY + col * colStepY;
                const ballNum = rackOrder[orderIdx++];
                const def = ballDefs.find(d => d.num === ballNum)!;

                const sphere = new Sphere(this.BALL_RADIUS, { widthSegments: 64, heightSegments: 64 });
                sphere.transform.position = new Vec3(x, y, ballZ);
                sphere.material.roughness = 0.035;
                sphere.material.specular = 0.98;
                sphere.material.metallic = 0.0;
                sphere.material.albedoMap = generateBallTexture(def.num, def.type, def.hex);
                sphere.CAST_SHADOW = true;
                sphere.RECEIVE_SHADOW = true;

                const comp = this.physics.add(sphere, {
                    type: 'dynamic',
                    shape: 'sphere',
                    radius: this.BALL_RADIUS,
                    mass: 0.17,
                    friction: 0.05,
                    restitution: 0.95,
                    linearDamping: 0.42,
                    angularDamping: 0.40,
                    lockRotation: true,
                    ccd: true
                });

                comp.lockTranslations(false, false, true);

                this.balls.push({
                    id: def.num,
                    number: def.num,
                    type: def.type,
                    colorHex: def.hex,
                    name: def.name,
                    entity: sphere,
                    bodyComp: comp,
                    potted: false,
                    sinking: false,
                    sinkScale: 1.0,
                    quaternion: Quaternion.identity(),
                    lastX: x,
                    lastY: y
                });
            }
        }
    }

    // =========================================================================
    // Aiming Visuals & 3D Maple Cue Stick
    // =========================================================================

    private createAimVisuals(): void {
        // Elastic Aim Trajectory Line
        this.aimLine = new Line3D([
            new Vec3(0, 0, 0.48),
            new Vec3(0, 0, 0.48)
        ]);
        this.aimLine.material.color = new Color(0.15, 0.85, 0.55, 0.95);
        this.aimLine.VISIBILITY = false;
        this.add(this.aimLine);

        // Ghost Ball Marker at Expected Collision Point
        this.ghostBallMarker = new Sphere(this.BALL_RADIUS, { widthSegments: 48, heightSegments: 48 });
        this.ghostBallMarker.material.color = new Color(1.0, 1.0, 1.0, 0.45);
        this.ghostBallMarker.material.roughness = 0.3;
        this.ghostBallMarker.CAST_SHADOW = false;
        this.ghostBallMarker.VISIBILITY = false;
        this.add(this.ghostBallMarker);

        // Target Ball Expected Deflection Line
        this.targetPathLine = new Line3D([
            new Vec3(0, 0, 0.48),
            new Vec3(0, 0, 0.48)
        ]);
        this.targetPathLine.material.color = new Color(1.0, 0.85, 0.25, 0.95); // Golden amber
        this.targetPathLine.VISIBILITY = false;
        this.add(this.targetPathLine);

        // 3D Canadian Maple Wooden Cue Stick (Tapered Cylinder)
        this.cueStick = new Cylinder(0.09, 0.20, 13.5, {
            radialSegments: 24,
            heightSegments: 1,
            openEnded: false,
            materialColor: new Color(0.85, 0.65, 0.42, 1.0)
        });
        this.cueStick.material.roughness = 0.25;
        this.cueStick.material.specular = 0.85;
        this.cueStick.CAST_SHADOW = true;
        this.cueStick.RECEIVE_SHADOW = true;
        this.cueStick.VISIBILITY = false;
        this.add(this.cueStick);
    }

    // =========================================================================
    // Contact Physics & Audio Feedback Handler
    // =========================================================================

    private handlePhysicsCollision(evt: Collision3DEvent): void {
        const entA = evt.entityA;
        const entB = evt.entityB;

        const ballA = this.balls.find(b => b.entity === entA);
        const ballB = this.balls.find(b => b.entity === entB);
        const isCushion = this.cushions.some(c => c === entA || c === entB);

        if (ballA && ballB) {
            const vA = ballA.bodyComp.getVelocity();
            const vB = ballB.bodyComp.getVelocity();
            const relVx = vA.x - vB.x;
            const relVy = vA.y - vB.y;
            const relSpeed = Math.hypot(relVx, relVy);

            const pA = ballA.entity.transform.position;
            const pB = ballB.entity.transform.position;
            const dx = pA.x - pB.x;
            const dy = pA.y - pB.y;
            const dist = Math.hypot(dx, dy) || 1.0;
            const nx = dx / dist;
            const ny = dy / dist;

            // Normal relative speed (direct compressive impact force)
            const normalSpeed = Math.abs(relVx * nx + relVy * ny);
            // Tangential relative speed (glancing/shear speed)
            const tangSpeed = Math.abs(relVx * (-ny) + relVy * nx);
            const midX = (pA.x + pB.x) * 0.5;

            if (relSpeed > 0.06) {
                this.soundEffects.playBallBallHit(normalSpeed, relSpeed, tangSpeed, midX);
            }

            if ((ballA === this.cueBall || ballB === this.cueBall) && !this.firstBallHitThisShot) {
                this.firstBallHitThisShot = (ballA === this.cueBall ? ballB : ballA);
            }
        } else if ((ballA || ballB) && isCushion) {
            const ball = ballA || ballB!;
            const v = ball.bodyComp.getVelocity();
            const speed = Math.hypot(v.x, v.y);
            const posX = ball.entity.transform.position.x;

            if (speed > 0.10) {
                this.soundEffects.playCushionHit(speed, posX);
            }
        }
    }

    // =========================================================================
    // Main Game Loop & Settling Detection
    // =========================================================================

    private updateGameLoop(): void {
        const ballZ = this.BALL_RADIUS;

        // 1. Maintain strict 2D planar elevation & handle sinking into pockets
        for (const b of this.balls) {
            if (b.potted) continue;
            const pos = b.entity.transform.position;

            if (b.sinking) {
                const dt = this.dt > 0 ? Math.min(this.dt / 1000, 0.033) : (1 / 60);
                b.sinkProgress = (b.sinkProgress ?? 0) + dt;

                // 1. Gravity accelerates downward along Z
                b.sinkVz = (b.sinkVz ?? 0) - 38.0 * dt;
                const curZ = pos.z + (b.sinkVz ?? 0) * dt;

                // 2. Horizontal movement continuing into the pocket throat
                const targetX = b.sinkTargetX ?? pos.x;
                const targetY = b.sinkTargetY ?? pos.y;
                const dxToCenter = targetX - pos.x;
                const dyToCenter = targetY - pos.y;
                const distToCenter = Math.hypot(dxToCenter, dyToCenter);

                // Funnel suction pulls ball toward center of pocket
                const funnelFactor = Math.min(distToCenter * 14.0, 9.0);
                if (distToCenter > 0.005) {
                    b.sinkVx = (b.sinkVx ?? 0) + (dxToCenter / distToCenter) * funnelFactor * dt;
                    b.sinkVy = (b.sinkVy ?? 0) + (dyToCenter / distToCenter) * funnelFactor * dt;
                }
                // Air and leather friction dampens horizontal velocity
                b.sinkVx = (b.sinkVx ?? 0) * Math.pow(0.86, dt * 60);
                b.sinkVy = (b.sinkVy ?? 0) * Math.pow(0.86, dt * 60);

                const newX = pos.x + (b.sinkVx ?? 0) * dt;
                const newY = pos.y + (b.sinkVy ?? 0) * dt;

                // 3. Physical rolling rotation continues naturally
                const moveDx = newX - pos.x;
                const moveDy = newY - pos.y;
                const moveDist = Math.hypot(moveDx, moveDy);
                if (moveDist > 1e-4) {
                    const rollAngle = moveDist / this.BALL_RADIUS;
                    const axisX = -moveDy / moveDist;
                    const axisY = moveDx / moveDist;
                    const halfAngle = rollAngle * 0.5;
                    const s = Math.sin(halfAngle);
                    const c = Math.cos(halfAngle);
                    const dq = new Quaternion(axisX * s, axisY * s, 0, c);
                    b.quaternion = dq.mul(b.quaternion).normalize();
                    b.entity.transform.setRotationQuaternionXYZW(
                        b.quaternion.x,
                        b.quaternion.y,
                        b.quaternion.z,
                        b.quaternion.w
                    );
                }

                // 4. Subtle perspective depth as it plunges down the well
                const depthDrop = Math.max(0, ballZ - curZ);
                const perspectiveScale = Math.max(0.65, 1.0 - depthDrop * 0.28);
                b.entity.transform.setScale(perspectiveScale);
                b.entity.transform.setPositionXYZ(newX, newY, curZ);

                // 5. Sound trigger: when ball drops into the leather cup
                if (!b.sinkSoundPlayed && curZ <= ballZ * 0.25) {
                    b.sinkSoundPlayed = true;
                    this.soundEffects.playPocketDrop(targetX);
                }

                // 6. Once fully submersed below the pocket rim (curZ <= -0.75 or 0.45s elapsed)
                if (curZ <= -0.75 || b.sinkProgress >= 0.45) {
                    b.potted = true;
                    b.sinking = false;
                    b.entity.VISIBILITY = false;
                    this.onBallPotted(b);
                }
                continue;
            }

            // Enforce Z position precisely on top of felt
            if (Math.abs(pos.z - ballZ) > 0.001) {
                b.entity.transform.setPositionXYZ(pos.x, pos.y, ballZ);
                if (b.bodyComp) {
                    b.bodyComp.setPosition([pos.x, pos.y, ballZ]);
                    const vel = b.bodyComp.getVelocity();
                    b.bodyComp.setVelocity([vel.x, vel.y, 0]);
                }
            }

            // Check pocket sink
            for (const p of this.pockets) {
                const dist = Math.hypot(pos.x - p.x, pos.y - p.y);
                if (dist < p.radius * 1.08) {
                    b.sinking = true;
                    const vel = b.bodyComp ? b.bodyComp.getVelocity() : new Vec3();
                    this.physics.remove(b.entity, false);

                    const initialSpeed = Math.hypot(vel.x, vel.y);
                    const toCenterX = p.x - pos.x;
                    const toCenterY = p.y - pos.y;
                    const toCenterDist = Math.hypot(toCenterX, toCenterY) || 1.0;

                    // Pull directly toward center of pocket well
                    const speed = Math.min(Math.max(initialSpeed * 0.45, 1.8), 4.5);
                    b.sinkVx = (toCenterX / toCenterDist) * speed;
                    b.sinkVy = (toCenterY / toCenterDist) * speed;
                    b.sinkVz = -3.8; // Decisive downward drop into pocket
                    b.sinkTargetX = p.x;
                    b.sinkTargetY = p.y;
                    b.sinkSoundPlayed = false;
                    b.sinkProgress = 0.0;
                    break;
                }
            }

            if (b.sinking) continue;

            // Perimeter safety clamp: prevent balls from ever penetrating past rails or getting stuck in wood
            const maxPlayableX = this.HALF_L - 0.48;
            const maxPlayableY = this.HALF_W - 0.48;
            if (Math.abs(pos.x) > maxPlayableX || Math.abs(pos.y) > maxPlayableY) {
                let nearPocket = false;
                for (const p of this.pockets) {
                    if (Math.hypot(pos.x - p.x, pos.y - p.y) < p.radius * 1.35) {
                        nearPocket = true;
                        b.sinking = true;
                        const vel = b.bodyComp ? b.bodyComp.getVelocity() : new Vec3();
                        this.physics.remove(b.entity, false);
                        const toCenterX = p.x - pos.x;
                        const toCenterY = p.y - pos.y;
                        const toCenterDist = Math.hypot(toCenterX, toCenterY) || 1.0;
                        b.sinkVx = (toCenterX / toCenterDist) * 2.5;
                        b.sinkVy = (toCenterY / toCenterDist) * 2.5;
                        b.sinkVz = -3.8;
                        b.sinkTargetX = p.x;
                        b.sinkTargetY = p.y;
                        b.sinkSoundPlayed = false;
                        b.sinkProgress = 0.0;
                        break;
                    }
                }
                if (!nearPocket) {
                    const clampedX = Math.max(-maxPlayableX, Math.min(maxPlayableX, pos.x));
                    const clampedY = Math.max(-maxPlayableY, Math.min(maxPlayableY, pos.y));
                    b.entity.transform.setPositionXYZ(clampedX, clampedY, ballZ);
                    if (b.bodyComp) {
                        b.bodyComp.setPosition([clampedX, clampedY, ballZ]);
                        const v = b.bodyComp.getVelocity();
                        b.bodyComp.setVelocity([-v.x * 0.5, -v.y * 0.5, 0]);
                    }
                }
            }

            // --- Physical Rolling Kinematics (No-Slip Ball Rolling) ---
            const dx = pos.x - b.lastX;
            const dy = pos.y - b.lastY;
            const dist = Math.hypot(dx, dy);

            if (dist > 1e-4) {
                // Angular distance = linear distance / radius
                const rollAngle = dist / this.BALL_RADIUS;
                // Axis of rotation is perpendicular to velocity in XY plane:
                // v = (dx, dy, 0) -> omega axis = (-dy/dist, dx/dist, 0)
                const axisX = -dy / dist;
                const axisY = dx / dist;

                const halfAngle = rollAngle * 0.5;
                const s = Math.sin(halfAngle);
                const c = Math.cos(halfAngle);
                const dq = new Quaternion(axisX * s, axisY * s, 0, c);

                // Accumulate world rotation: dq * q_old
                b.quaternion = dq.mul(b.quaternion).normalize();

                b.entity.transform.setRotationQuaternionXYZW(
                    b.quaternion.x,
                    b.quaternion.y,
                    b.quaternion.z,
                    b.quaternion.w
                );

                if (b.bodyComp) {
                    b.bodyComp.setRotation([
                        b.quaternion.x,
                        b.quaternion.y,
                        b.quaternion.z,
                        b.quaternion.w
                    ]);
                }
            }
            b.lastX = pos.x;
            b.lastY = pos.y;
        }

        // 2. Aiming Visuals & Cue Stick Update
        if (this.isAiming && this.gameState === 'aiming') {
            this.updateAimingVisuals();
        }

        // 3. Settling Detection
        if (this.gameState === 'rolling') {
            this.checkSettling();
        }
    }

    private updateAimingVisuals(): void {
        const cuePos = this.cueBall.entity.transform.position;
        const dx = this.dragCurrentWorld.x - cuePos.x;
        const dy = this.dragCurrentWorld.y - cuePos.y;
        const dragDist = Math.hypot(dx, dy);

        if (dragDist < 0.25) {
            this.aimLine.VISIBILITY = false;
            this.ghostBallMarker.VISIBILITY = false;
            this.targetPathLine.VISIBILITY = false;
            this.cueStick.VISIBILITY = false;
            this.updatePowerGauge(0);
            return;
        }

        const maxDrag = 6.0;
        const powerRatio = Math.min(1.0, dragDist / maxDrag);
        this.currentPowerRatio = powerRatio;
        this.updatePowerGauge(powerRatio);

        // Forward Shot Direction (Opposite of drag pull)
        const shotDirX = -dx / dragDist;
        const shotDirY = -dy / dragDist;

        // Position 3D Cue Stick along pull direction
        this.cueStick.VISIBILITY = true;
        const stickAngle = Math.atan2(shotDirY, shotDirX);
        const stickDistance = 6.75 + this.BALL_RADIUS + 0.35 + dragDist * 1.35;
        const stickX = cuePos.x - shotDirX * stickDistance;
        const stickY = cuePos.y - shotDirY * stickDistance;

        this.cueStick.transform.setPositionXYZ(stickX, stickY, this.BALL_RADIUS + 0.04);
        this.cueStick.transform.setRotationX(0);
        this.cueStick.transform.setRotationY(0);
        this.cueStick.transform.setRotationZ(stickAngle - Math.PI / 2);

        // Slingshot Trajectory Line (Forward from cue ball)
        this.aimLine.VISIBILITY = true;
        const aimLength = 6.0 + powerRatio * 8.0;
        this.aimLine.setVertices([
            new Vec3(cuePos.x, cuePos.y, 0.48),
            new Vec3(cuePos.x + shotDirX * aimLength, cuePos.y + shotDirY * aimLength, 0.48)
        ]);

        // Dynamic Color on Trajectory Line
        let lineColor = new Color(0.15, 0.85, 0.55, 0.95); // Emerald
        if (powerRatio > 0.7) lineColor = new Color(0.95, 0.25, 0.25, 0.95); // Crimson
        else if (powerRatio > 0.4) lineColor = new Color(0.95, 0.65, 0.15, 0.95); // Amber
        this.aimLine.material.color = lineColor;

        // Raycast against active object balls for cut-angle ghost ball
        let closestDist = 45.0;
        let hitBall: PoolBall | null = null;
        const R = this.BALL_RADIUS;

        for (const b of this.balls) {
            if (b.potted || b.type === 'cue') continue;
            const bPos = b.entity.transform.position;

            const ocX = bPos.x - cuePos.x;
            const ocY = bPos.y - cuePos.y;
            const proj = ocX * shotDirX + ocY * shotDirY;
            if (proj <= 0) continue;

            const perpSq = (ocX * ocX + ocY * ocY) - (proj * proj);
            const rSum = R * 2;
            if (perpSq >= rSum * rSum) continue;

            const dIn = Math.sqrt(rSum * rSum - perpSq);
            const tHit = proj - dIn;
            if (tHit > 0 && tHit < closestDist) {
                closestDist = tHit;
                hitBall = b;
            }
        }

        const ghostX = cuePos.x + shotDirX * closestDist;
        const ghostY = cuePos.y + shotDirY * closestDist;

        if (hitBall) {
            this.ghostBallMarker.VISIBILITY = true;
            this.ghostBallMarker.transform.setPositionXYZ(ghostX, ghostY, this.BALL_RADIUS);

            const tx = hitBall.entity.transform.position.x;
            const ty = hitBall.entity.transform.position.y;
            const nx = tx - ghostX;
            const ny = ty - ghostY;
            const nLen = Math.hypot(nx, ny) || 1;

            this.targetPathLine.VISIBILITY = true;
            this.targetPathLine.setVertices([
                new Vec3(tx, ty, 0.48),
                new Vec3(tx + (nx / nLen) * 6.5, ty + (ny / nLen) * 6.5, 0.48)
            ]);
        } else {
            this.ghostBallMarker.VISIBILITY = false;
            this.targetPathLine.VISIBILITY = false;
        }
    }

    private executeShot(dirX: number, dirY: number, powerRatio: number): void {
        this.isAiming = false;
        this.aimLine.VISIBILITY = false;
        this.ghostBallMarker.VISIBILITY = false;
        this.targetPathLine.VISIBILITY = false;
        this.cueStick.VISIBILITY = false;
        this.updatePowerGauge(0);

        const maxImpulse = 14.8; // Top break speed ~28.2 m/s (~63 mph) - powerful tournament break without tunneling
        const impulseMag = Math.max(0.6, powerRatio * maxImpulse);

        this.cueBall.bodyComp.applyImpulse([dirX * impulseMag, dirY * impulseMag, 0]);
        this.soundEffects.playCueStrike(powerRatio, this.cueBall.entity.transform.position.x);

        this.gameState = 'rolling';
        this.quietRestFrames = 0;
        this.pottedThisShot = [];
        this.firstBallHitThisShot = null;
        this.scratchOccurred = false;

        this.updateHUD();
    }

    private checkSettling(): void {
        let allStopped = true;
        for (const b of this.balls) {
            if (b.potted) continue;
            if (b.sinking) {
                allStopped = false;
                break;
            }
            const v = b.bodyComp.getVelocity();
            const speed = Math.hypot(v.x, v.y);
            if (speed > 0.04) {
                allStopped = false;
                break;
            }
        }

        if (allStopped) {
            this.quietRestFrames++;
            if (this.quietRestFrames > 12) {
                for (const b of this.balls) {
                    if (!b.potted && !b.sinking) {
                        b.bodyComp.setVelocity([0, 0, 0]);
                        b.bodyComp.setAngularVelocity([0, 0, 0]);
                    }
                }
                this.quietRestFrames = 0;
                this.onAllBallsSettled();
            }
        } else {
            this.quietRestFrames = 0;
        }
    }

    private onAllBallsSettled(): void {
        this.evaluateTurnRules();

        if (this.cueBall.potted) {
            this.respawnCueBall();
        }

        if (this.gameState === 'game_over') return;

        if (this.currentTurn === 'ai' && this.gameMode === 'pv_ai') {
            this.startAITurn();
        } else {
            this.gameState = 'aiming';
            this.updateHUD();
        }
    }

    private onBallPotted(ball: PoolBall): void {
        this.pottedThisShot.push(ball);

        if (ball.type === 'cue') {
            this.scratchOccurred = true;
            this.showToast("⚠️ SCRATCH! Cue Ball Pocketed", '#ef4444');
            return;
        }

        if (ball.type === '8ball') {
            this.showToast("🎱 8-Ball Pocketed!", '#f59e0b');
            return;
        }

        if (this.isTableOpen) {
            if (this.currentTurn === 'player1') {
                this.player1Group = (ball.type === 'solid' ? 'solids' : 'stripes');
                this.player2Group = (ball.type === 'solid' ? 'stripes' : 'solids');
            } else {
                this.player2Group = (ball.type === 'solid' ? 'solids' : 'stripes');
                this.player1Group = (ball.type === 'solid' ? 'stripes' : 'solids');
            }
            this.isTableOpen = false;
            this.showToast(`🎯 Groups Assigned: ${this.currentTurn === 'player1' ? 'You' : 'Opponent'} have ${ball.type.toUpperCase()}S!`, '#10b981');
        } else {
            const myGroup = this.currentTurn === 'player1' ? this.player1Group : this.player2Group;
            const isOwn = (myGroup === 'solids' && ball.type === 'solid') || (myGroup === 'stripes' && ball.type === 'stripe');
            if (isOwn) {
                this.showToast(`🎯 Potted ${ball.name}!`, '#10b981');
            } else {
                this.showToast(`Opponent's ${ball.name} Potted!`, '#f59e0b');
            }
        }

        this.updateHUD();
    }

    private evaluateTurnRules(): void {
        let switchTurn = true;
        let foul = false;

        if (this.scratchOccurred) {
            foul = true;
        }

        if (!foul && !this.firstBallHitThisShot) {
            foul = true;
            this.showToast("⚠️ Foul: No ball struck!", '#ef4444');
        } else if (!foul && this.firstBallHitThisShot && !this.isTableOpen) {
            const myGroup = (this.currentTurn === 'player1' ? this.player1Group : this.player2Group);
            const remainingOwn = this.balls.filter(b => !b.potted && b.type === (myGroup === 'solids' ? 'solid' : 'stripe')).length;

            if (remainingOwn > 0 && this.firstBallHitThisShot.type === '8ball') {
                foul = true;
                this.showToast("⚠️ Foul: 8-Ball struck first while balls remain!", '#ef4444');
            } else if (remainingOwn > 0) {
                const hitType = this.firstBallHitThisShot.type;
                const isWrong = (myGroup === 'solids' && hitType === 'stripe') || (myGroup === 'stripes' && hitType === 'solid');
                if (isWrong) {
                    foul = true;
                    this.showToast("⚠️ Foul: Struck opponent's ball first!", '#ef4444');
                }
            }
        }

        // 8-Ball Pocketed Check
        const eightPotted = this.pottedThisShot.some(b => b.type === '8ball');
        if (eightPotted) {
            const myGroup = (this.currentTurn === 'player1' ? this.player1Group : this.player2Group);
            const remainingOwn = this.balls.filter(b => !b.potted && b.type === (myGroup === 'solids' ? 'solid' : 'stripe')).length;

            if (foul || remainingOwn > 0) {
                const winner = this.currentTurn === 'player1' ? (this.gameMode === 'pv_ai' ? 'AI Opponent' : 'Player 2') : 'Player 1';
                this.showGameOverModal(`${winner} WINS! (8-Ball foul)`, '#ef4444');
                this.gameState = 'game_over';
                return;
            } else {
                const winner = this.currentTurn === 'player1' ? 'Player 1 (You)' : (this.gameMode === 'pv_ai' ? 'AI Opponent' : 'Player 2');
                this.showGameOverModal(`🏆 ${winner} WINS THE MATCH!`, '#10b981');
                this.gameState = 'game_over';
                return;
            }
        }

        if (!foul && this.pottedThisShot.length > 0) {
            const myGroup = (this.currentTurn === 'player1' ? this.player1Group : this.player2Group);
            const legalPot = this.pottedThisShot.some(b => {
                if (this.isTableOpen) return b.type === 'solid' || b.type === 'stripe';
                return b.type === (myGroup === 'solids' ? 'solid' : 'stripe');
            });
            if (legalPot) {
                switchTurn = false;
                this.showToast("✨ Legal Pot! Shoot again", '#10b981');
            }
        }

        this.pottedThisShot = [];
        this.firstBallHitThisShot = null;
        this.scratchOccurred = false;

        if (switchTurn && this.gameMode !== 'practice') {
            if (this.gameMode === 'pv_ai') {
                this.currentTurn = (this.currentTurn === 'player1' ? 'ai' : 'player1');
            } else {
                this.currentTurn = (this.currentTurn === 'player1' ? 'player2' : 'player1');
            }
        }
    }

    private respawnCueBall(): void {
        this.cueBall.potted = false;
        this.cueBall.sinking = false;
        this.cueBall.sinkScale = 1.0;
        this.cueBall.sinkVx = 0;
        this.cueBall.sinkVy = 0;
        this.cueBall.sinkVz = 0;
        this.cueBall.sinkProgress = 0;
        this.cueBall.entity.VISIBILITY = true;
        this.cueBall.entity.transform.setScale(1.0);
        this.cueBall.entity.transform.setPositionXYZ(-8.5, 0, this.BALL_RADIUS);
        this.cueBall.quaternion = Quaternion.identity();
        this.cueBall.lastX = -8.5;
        this.cueBall.lastY = 0;
        this.cueBall.entity.transform.setRotationQuaternionXYZW(0, 0, 0, 1);

        this.cueBall.bodyComp = this.physics.add(this.cueBall.entity, {
            type: 'dynamic',
            shape: 'sphere',
            radius: this.BALL_RADIUS,
            mass: 0.17,
            friction: 0.05,
            restitution: 0.95,
            linearDamping: 0.42,
            angularDamping: 0.40,
            lockRotation: true,
            ccd: true
        });

        this.cueBall.bodyComp.lockTranslations(false, false, true);
    }

    private startAITurn(): void {
        this.gameState = 'ai_thinking';
        this.updateHUD();

        const cuePos = this.cueBall.entity.transform.position;
        const legalGroup = this.isTableOpen ? 'any' : (this.player2Group || 'any');

        this.aiTimer = window.setTimeout(() => {
            const shot = BilliardsAI.calculateShot(
                cuePos.x, cuePos.y,
                this.balls,
                this.pockets,
                legalGroup,
                this.aiDifficulty
            );

            if (shot) {
                // Show AI aim preview line
                this.aimLine.VISIBILITY = true;
                this.aimLine.setVertices([
                    new Vec3(cuePos.x, cuePos.y, 0.48),
                    new Vec3(cuePos.x + shot.dirX * 8.0, cuePos.y + shot.dirY * 8.0, 0.48)
                ]);

                // Show Cue stick aiming
                this.cueStick.VISIBILITY = true;
                const stickAngle = Math.atan2(shot.dirY, shot.dirX);
                const stickDistance = 6.75 + this.BALL_RADIUS + 0.35 + shot.power * 1.5;
                const stickX = cuePos.x - shot.dirX * stickDistance;
                const stickY = cuePos.y - shot.dirY * stickDistance;
                this.cueStick.transform.setPositionXYZ(stickX, stickY, this.BALL_RADIUS + 0.04);
                this.cueStick.transform.setRotationX(0);
                this.cueStick.transform.setRotationY(0);
                this.cueStick.transform.setRotationZ(stickAngle - Math.PI / 2);

                this.aiTimer = window.setTimeout(() => {
                    this.executeShot(shot.dirX, shot.dirY, shot.power);
                }, 750);
            } else {
                this.executeShot(1, 0, 0.35);
            }
        }, 850);
    }

    // =========================================================================
    // Pointer Controls (Slingshot Drag Aiming & Shooting)
    // =========================================================================

    private setupPointerControls(): void {
        this._contextMenuHandler = (e: MouseEvent) => {
            e.preventDefault();
            if (this.isAiming) {
                this.isAiming = false;
                this.aimLine.VISIBILITY = false;
                this.ghostBallMarker.VISIBILITY = false;
                this.targetPathLine.VISIBILITY = false;
                this.cueStick.VISIBILITY = false;
                this.updatePowerGauge(0);
            }
        };
        window.addEventListener("contextmenu", this._contextMenuHandler);

        this.setEvent("pointerdown", (worldPos: Vec3, e: PointerEvent | WheelEvent) => {
            if (this.gameState !== 'aiming' || (this.gameMode === 'pv_ai' && this.currentTurn === 'ai')) return;
            const pEvent = e as PointerEvent;
            if (pEvent?.button === 2) return;

            const cuePos = this.cueBall.entity.transform.position;
            const dist = Math.hypot(worldPos.x - cuePos.x, worldPos.y - cuePos.y);

            // Click within radius of cue ball to engage slingshot
            if (dist <= 3.8) {
                this.isAiming = true;
                this.dragStartWorld = cuePos.clone();
                this.dragCurrentWorld = worldPos.clone();
            }
        });

        this.setEvent("pointermove", (worldPos: Vec3) => {
            if (this.isAiming && this.gameState === 'aiming') {
                this.dragCurrentWorld = worldPos.clone();
            }
        });

        this.setEvent("pointerup", (worldPos: Vec3) => {
            if (!this.isAiming || this.gameState !== 'aiming') return;

            const cuePos = this.cueBall.entity.transform.position;
            const dx = worldPos.x - cuePos.x;
            const dy = worldPos.y - cuePos.y;
            const dist = Math.hypot(dx, dy);

            if (dist > 0.4) {
                const maxDrag = 6.0;
                const power = Math.min(1.0, dist / maxDrag);
                const dirX = -dx / dist;
                const dirY = -dy / dist;
                this.executeShot(dirX, dirY, power);
            } else {
                this.isAiming = false;
                this.aimLine.VISIBILITY = false;
                this.ghostBallMarker.VISIBILITY = false;
                this.targetPathLine.VISIBILITY = false;
                this.cueStick.VISIBILITY = false;
                this.updatePowerGauge(0);
            }
        });
    }

    // =========================================================================
    // Glassmorphic Tournament HUD & Interactive Ball Trays
    // =========================================================================

    private createUI(): void {
        const old = document.getElementById("billiards-tournament-hud");
        if (old) old.remove();

        // Inject HUD stylesheet for sleek animations and interactive states
        let styleEl = document.getElementById("billiards-hud-styles") as HTMLStyleElement | null;
        if (!styleEl) {
            styleEl = document.createElement("style");
            styleEl.id = "billiards-hud-styles";
            styleEl.textContent = `
                @keyframes hudGlowP1 {
                    0%, 100% { box-shadow: 0 10px 32px rgba(0, 0, 0, 0.55), 0 0 18px rgba(16, 185, 129, 0.35); border-color: rgba(16, 185, 129, 0.7); }
                    50% { box-shadow: 0 10px 36px rgba(0, 0, 0, 0.6), 0 0 28px rgba(16, 185, 129, 0.65); border-color: rgba(52, 211, 153, 0.95); }
                }
                @keyframes hudGlowAI {
                    0%, 100% { box-shadow: 0 10px 32px rgba(0, 0, 0, 0.55), 0 0 18px rgba(244, 63, 94, 0.35); border-color: rgba(244, 63, 94, 0.7); }
                    50% { box-shadow: 0 10px 36px rgba(0, 0, 0, 0.6), 0 0 28px rgba(244, 63, 94, 0.65); border-color: rgba(251, 113, 133, 0.95); }
                }
                @keyframes hudGlowP2 {
                    0%, 100% { box-shadow: 0 10px 32px rgba(0, 0, 0, 0.55), 0 0 18px rgba(56, 189, 248, 0.35); border-color: rgba(56, 189, 248, 0.7); }
                    50% { box-shadow: 0 10px 36px rgba(0, 0, 0, 0.6), 0 0 28px rgba(56, 189, 248, 0.65); border-color: rgba(125, 211, 252, 0.95); }
                }
                @keyframes hudRadarPing {
                    0% { transform: scale(0.95); opacity: 0.9; }
                    50% { transform: scale(1.25); opacity: 0.4; }
                    100% { transform: scale(0.95); opacity: 0.9; }
                }
                @keyframes toastSlideIn {
                    0% { opacity: 0; transform: translateY(-16px) scale(0.94); }
                    100% { opacity: 1; transform: translateY(0) scale(1.0); }
                }
                @keyframes modalPopIn {
                    0% { opacity: 0; transform: translate(-50%, -46%) scale(0.92); }
                    100% { opacity: 1; transform: translate(-50%, -50%) scale(1.0); }
                }
                .billiards-btn {
                    transition: all 0.18s cubic-bezier(0.4, 0, 0.2, 1);
                    outline: none;
                }
                .billiards-btn:hover {
                    transform: translateY(-2px);
                    filter: brightness(1.12);
                }
                .billiards-btn:active {
                    transform: translateY(0) scale(0.97);
                }
                .billiards-tab-btn {
                    cursor: pointer;
                    transition: all 0.18s ease;
                    border: none;
                    outline: none;
                    color: #94a3b8;
                    background: transparent;
                    font-size: 11.5px;
                    font-weight: 700;
                    padding: 5px 12px;
                    border-radius: 8px;
                    user-select: none;
                }
                .billiards-tab-btn:hover {
                    color: #ffffff;
                    background: rgba(255, 255, 255, 0.08);
                }
                .billiards-tab-btn.active {
                    color: #ffffff;
                    background: linear-gradient(135deg, #10b981, #059669);
                    box-shadow: 0 2px 10px rgba(16, 185, 129, 0.45);
                }
                .billiards-ai-tab.active {
                    color: #ffffff;
                    background: linear-gradient(135deg, #f59e0b, #d97706);
                    box-shadow: 0 2px 10px rgba(245, 158, 11, 0.45);
                }
            `;
            document.head.appendChild(styleEl);
        }

        const container = document.createElement("div");
        container.id = "billiards-tournament-hud";
        container.style.cssText = `
            position: absolute;
            top: 0; left: 0; width: 100vw; height: 100vh;
            pointer-events: none;
            user-select: none;
            font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif;
            color: #ffffff;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            box-sizing: border-box;
            padding: 18px 24px;
            z-index: 100;
        `;

        // 1. Top Bar: Glassmorphic Tournament Scoreboard & Ball Racks
        const topBar = document.createElement("div");
        topBar.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            width: 100%;
        `;

        // Player 1 Card with Ball Tray
        const p1Card = document.createElement("div");
        p1Card.id = "ui-p1-card";
        p1Card.style.cssText = `
            background: linear-gradient(135deg, rgba(15, 23, 42, 0.84), rgba(30, 41, 59, 0.74));
            backdrop-filter: blur(24px) saturate(180%);
            -webkit-backdrop-filter: blur(24px) saturate(180%);
            border: 1.5px solid rgba(16, 185, 129, 0.6);
            border-radius: 18px;
            padding: 12px 20px;
            display: flex;
            flex-direction: column;
            gap: 10px;
            box-shadow: 0 12px 36px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.12);
            min-width: 270px;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            animation: hudGlowP1 3s infinite ease-in-out;
        `;
        p1Card.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: space-between;">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <div style="width: 28px; height: 28px; border-radius: 50%; background: linear-gradient(135deg, #10b981, #047857); display: flex; align-items: center; justify-content: center; font-size: 13px; box-shadow: 0 2px 8px rgba(16,185,129,0.4);">
                        👤
                    </div>
                    <div>
                        <div style="font-size: 12px; font-weight: 800; color: #f8fafc; letter-spacing: 0.5px;">PLAYER 1</div>
                        <div style="display: flex; align-items: center; gap: 6px; margin-top: 1px;">
                            <div id="ui-p1-dot" style="width: 8px; height: 8px; border-radius: 50%; background: #10b981; box-shadow: 0 0 8px #10b981;"></div>
                            <span style="font-size: 10px; font-weight: 700; color: #94a3b8; letter-spacing: 0.5px;">YOU</span>
                        </div>
                    </div>
                </div>
                <div id="ui-p1-group" style="font-size: 11px; font-weight: 800; color: #38bdf8; background: rgba(56, 189, 248, 0.16); border: 1px solid rgba(56, 189, 248, 0.3); padding: 3px 10px; border-radius: 20px; letter-spacing: 0.5px;">OPEN</div>
            </div>
            <div style="background: rgba(15, 23, 42, 0.6); padding: 6px 8px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.06);">
                <div id="ui-p1-balls" style="display: flex; gap: 6px; height: 24px; align-items: center; justify-content: space-between;"></div>
            </div>
        `;

        // Center Match Status Pill
        const centerPill = document.createElement("div");
        centerPill.style.cssText = `
            background: linear-gradient(135deg, rgba(15, 23, 42, 0.88), rgba(24, 34, 53, 0.82));
            backdrop-filter: blur(28px) saturate(180%);
            -webkit-backdrop-filter: blur(28px) saturate(180%);
            border: 1px solid rgba(255, 255, 255, 0.16);
            border-radius: 40px;
            padding: 10px 32px;
            text-align: center;
            box-shadow: 0 16px 48px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.15);
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 4px;
        `;
        centerPill.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; gap: 8px;">
                <span style="font-size: 12px;">🏆</span>
                <span style="font-size: 11px; font-weight: 800; letter-spacing: 2px; background: linear-gradient(180deg, #fef08a, #f59e0b); -webkit-background-clip: text; -webkit-text-fill-color: transparent; text-transform: uppercase;">
                    8-BALL PRO TOURNAMENT
                </span>
            </div>
            <div id="ui-turn-status" style="font-size: 13.5px; font-weight: 700; color: #ffffff; display: flex; align-items: center; gap: 8px;">
                <span style="width: 7px; height: 7px; border-radius: 50%; background: #10b981; display: inline-block; animation: hudRadarPing 1.8s infinite ease-in-out;"></span>
                <span>Your Turn • Pull back cue ball to aim & shoot</span>
            </div>
        `;

        // Player 2 / AI Card with Ball Tray
        const p2Card = document.createElement("div");
        p2Card.id = "ui-p2-card";
        p2Card.style.cssText = `
            background: linear-gradient(135deg, rgba(15, 23, 42, 0.84), rgba(30, 41, 59, 0.74));
            backdrop-filter: blur(24px) saturate(180%);
            -webkit-backdrop-filter: blur(24px) saturate(180%);
            border: 1.5px solid rgba(255, 255, 255, 0.12);
            border-radius: 18px;
            padding: 12px 20px;
            display: flex;
            flex-direction: column;
            gap: 10px;
            box-shadow: 0 12px 36px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.12);
            min-width: 270px;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        `;
        p2Card.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: space-between;">
                <div id="ui-p2-group" style="font-size: 11px; font-weight: 800; color: #f43f5e; background: rgba(244, 63, 94, 0.16); border: 1px solid rgba(244, 63, 94, 0.3); padding: 3px 10px; border-radius: 20px; letter-spacing: 0.5px;">OPEN</div>
                <div style="display: flex; align-items: center; gap: 10px; text-align: right;">
                    <div>
                        <div id="ui-p2-name" style="font-size: 12px; font-weight: 800; color: #f8fafc; letter-spacing: 0.5px;">AI OPPONENT</div>
                        <div style="display: flex; align-items: center; justify-content: flex-end; gap: 6px; margin-top: 1px;">
                            <span id="ui-p2-sub" style="font-size: 10px; font-weight: 700; color: #94a3b8; letter-spacing: 0.5px;">MASTER</span>
                            <div id="ui-p2-dot" style="width: 8px; height: 8px; border-radius: 50%; background: #64748b;"></div>
                        </div>
                    </div>
                    <div id="ui-p2-avatar" style="width: 28px; height: 28px; border-radius: 50%; background: linear-gradient(135deg, #f43f5e, #be123c); display: flex; align-items: center; justify-content: center; font-size: 13px; box-shadow: 0 2px 8px rgba(244,63,94,0.4);">
                        🤖
                    </div>
                </div>
            </div>
            <div style="background: rgba(15, 23, 42, 0.6); padding: 6px 8px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.06);">
                <div id="ui-p2-balls" style="display: flex; gap: 6px; height: 24px; align-items: center; justify-content: space-between;"></div>
            </div>
        `;

        topBar.appendChild(p1Card);
        topBar.appendChild(centerPill);
        topBar.appendChild(p2Card);
        container.appendChild(topBar);

        // 2. Precision Shot Power Gauge (Left Side)
        const powerGauge = document.createElement("div");
        powerGauge.id = "ui-power-gauge-container";
        powerGauge.style.cssText = `
            position: absolute;
            left: 24px;
            top: 50%;
            transform: translateY(-50%);
            background: linear-gradient(135deg, rgba(15, 23, 42, 0.88), rgba(30, 41, 59, 0.80));
            backdrop-filter: blur(24px) saturate(180%);
            -webkit-backdrop-filter: blur(24px) saturate(180%);
            border: 1px solid rgba(255, 255, 255, 0.16);
            border-radius: 20px;
            padding: 16px 12px;
            display: flex;
            flex-direction: column;
            align-items: center;
            box-shadow: 0 16px 40px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.15);
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1), transform 0.2s ease;
        `;
        powerGauge.innerHTML = `
            <div style="font-size: 9.5px; font-weight: 900; color: #94a3b8; letter-spacing: 1.5px; margin-bottom: 12px; display: flex; align-items: center; gap: 4px;">
                <span>⚡</span> POWER
            </div>
            <div style="position: relative; width: 16px; height: 180px; background: rgba(15, 23, 42, 0.9); border: 1px solid rgba(255,255,255,0.12); border-radius: 8px; overflow: hidden; display: flex; flex-direction: column-reverse;">
                <!-- Graduation ticks -->
                <div style="position: absolute; top: 25%; left: 0; right: 0; height: 1px; background: rgba(255,255,255,0.15); pointer-events: none;"></div>
                <div style="position: absolute; top: 50%; left: 0; right: 0; height: 1px; background: rgba(255,255,255,0.22); pointer-events: none;"></div>
                <div style="position: absolute; top: 75%; left: 0; right: 0; height: 1px; background: rgba(255,255,255,0.15); pointer-events: none;"></div>
                <!-- Active glowing power bar -->
                <div id="ui-power-bar" style="width: 100%; height: 0%; background: linear-gradient(to top, #10b981 0%, #06b6d4 40%, #f59e0b 70%, #ef4444 100%); border-radius: 6px; box-shadow: 0 0 14px rgba(16,185,129,0.7); transition: height 0.04s linear;"></div>
            </div>
            <div id="ui-power-text" style="font-size: 13px; font-weight: 900; color: #f8fafc; margin-top: 10px; font-variant-numeric: tabular-nums; text-shadow: 0 0 8px rgba(255,255,255,0.4);">
                0%
            </div>
        `;
        container.appendChild(powerGauge);

        // 3. Floating Toast Banner Container
        const toastContainer = document.createElement("div");
        toastContainer.id = "ui-toast-container";
        toastContainer.style.cssText = `
            position: absolute;
            top: 100px; left: 50%;
            transform: translateX(-50%);
            display: flex;
            flex-direction: column;
            align-items: center;
            pointer-events: none;
            z-index: 200;
        `;
        container.appendChild(toastContainer);

        // 4. Bottom Tournament Controls Dock
        const bottomBar = document.createElement("div");
        bottomBar.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            width: 100%;
            pointer-events: auto;
        `;

        // Left Action Buttons & Control Hint
        const leftControls = document.createElement("div");
        leftControls.style.cssText = `display: flex; align-items: center; gap: 12px;`;

        const reRackBtn = document.createElement("button");
        reRackBtn.className = "billiards-btn";
        reRackBtn.innerHTML = `<span>🔄</span> Re-Rack Table`;
        reRackBtn.style.cssText = `
            background: linear-gradient(135deg, #10b981, #059669);
            border: 1px solid #34d399;
            color: #ffffff;
            padding: 9px 22px;
            border-radius: 14px;
            font-size: 12.5px;
            font-weight: 800;
            cursor: pointer;
            box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4), inset 0 1px 0 rgba(255,255,255,0.25);
            display: flex;
            align-items: center;
            gap: 8px;
        `;
        reRackBtn.onclick = () => this.resetRack();

        const soundBtn = document.createElement("button");
        soundBtn.className = "billiards-btn";
        soundBtn.id = "ui-sound-btn";
        soundBtn.innerHTML = `<span>🔊</span> Sound: ON`;
        soundBtn.style.cssText = `
            background: linear-gradient(135deg, rgba(15, 23, 42, 0.88), rgba(30, 41, 59, 0.80));
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.16);
            color: #f8fafc;
            padding: 9px 18px;
            border-radius: 14px;
            font-size: 12.5px;
            font-weight: 700;
            cursor: pointer;
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.45);
            display: flex;
            align-items: center;
            gap: 8px;
        `;
        soundBtn.onclick = () => {
            this.soundEffects.muted = !this.soundEffects.muted;
            soundBtn.innerHTML = this.soundEffects.muted ? "<span>🔇</span> Sound: OFF" : "<span>🔊</span> Sound: ON";
            soundBtn.style.borderColor = this.soundEffects.muted ? "rgba(244, 63, 94, 0.4)" : "rgba(16, 185, 129, 0.4)";
        };

        // Controls Hint Tooltip
        const hintPill = document.createElement("div");
        hintPill.style.cssText = `
            background: rgba(15, 23, 42, 0.72);
            backdrop-filter: blur(16px);
            border: 1px solid rgba(255, 255, 255, 0.10);
            border-radius: 14px;
            padding: 8px 16px;
            font-size: 11.5px;
            font-weight: 600;
            color: #94a3b8;
            display: flex;
            align-items: center;
            gap: 8px;
        `;
        hintPill.innerHTML = `<span>🖱️</span> <span>Drag cue ball to aim & shoot • <span style="color: #cbd5e1;">Right-click</span> cancels</span>`;

        leftControls.appendChild(reRackBtn);
        leftControls.appendChild(soundBtn);
        leftControls.appendChild(hintPill);
        bottomBar.appendChild(leftControls);

        // Right Settings Dock: Custom Segmented Pills
        const rightControls = document.createElement("div");
        rightControls.style.cssText = `
            background: linear-gradient(135deg, rgba(15, 23, 42, 0.88), rgba(30, 41, 59, 0.80));
            backdrop-filter: blur(24px) saturate(180%);
            -webkit-backdrop-filter: blur(24px) saturate(180%);
            border: 1px solid rgba(255, 255, 255, 0.16);
            border-radius: 18px;
            padding: 6px 10px;
            display: flex;
            align-items: center;
            gap: 12px;
            box-shadow: 0 10px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.12);
        `;

        // Mode Segmented Control
        const modeSegment = document.createElement("div");
        modeSegment.style.cssText = `
            display: flex;
            align-items: center;
            background: rgba(15, 23, 42, 0.65);
            padding: 3px;
            border-radius: 10px;
            border: 1px solid rgba(255,255,255,0.06);
            gap: 2px;
        `;
        const modes: { id: GameMode; label: string; icon: string }[] = [
            { id: 'pv_ai', label: 'vs AI', icon: '🤖' },
            { id: 'pv_p', label: '2 Players', icon: '👥' },
            { id: 'practice', label: 'Practice', icon: '🎯' }
        ];

        modes.forEach(m => {
            const btn = document.createElement("button");
            btn.className = `billiards-tab-btn ${this.gameMode === m.id ? 'active' : ''}`;
            btn.dataset.mode = m.id;
            btn.innerHTML = `<span style="font-size: 11px;">${m.icon}</span> ${m.label}`;
            btn.onclick = () => {
                this.gameMode = m.id;
                modeSegment.querySelectorAll(".billiards-tab-btn").forEach(b => b.classList.remove("active"));
                btn.classList.add("active");
                const p2Name = document.getElementById("ui-p2-name");
                const p2Avatar = document.getElementById("ui-p2-avatar");
                const p2Sub = document.getElementById("ui-p2-sub");
                if (p2Name) {
                    p2Name.textContent = m.id === 'pv_ai' ? 'AI OPPONENT' : (m.id === 'pv_p' ? 'PLAYER 2' : 'PRACTICE');
                }
                if (p2Avatar) {
                    p2Avatar.textContent = m.id === 'pv_ai' ? '🤖' : (m.id === 'pv_p' ? '👤' : '🎯');
                }
                if (p2Sub) {
                    p2Sub.textContent = m.id === 'pv_ai' ? this.aiDifficulty.toUpperCase() : (m.id === 'pv_p' ? 'GUEST' : 'SOLO');
                }
                this.resetRack();
            };
            modeSegment.appendChild(btn);
        });

        // AI Difficulty Segmented Control
        const aiSegment = document.createElement("div");
        aiSegment.id = "ui-ai-segment";
        aiSegment.style.cssText = `
            display: flex;
            align-items: center;
            background: rgba(15, 23, 42, 0.65);
            padding: 3px;
            border-radius: 10px;
            border: 1px solid rgba(255,255,255,0.06);
            gap: 2px;
        `;
        const diffs: { id: AIDifficulty; label: string }[] = [
            { id: 'amateur', label: 'Amateur' },
            { id: 'master', label: 'Master' },
            { id: 'legend', label: 'Legend' }
        ];

        diffs.forEach(d => {
            const btn = document.createElement("button");
            btn.className = `billiards-tab-btn billiards-ai-tab ${this.aiDifficulty === d.id ? 'active' : ''}`;
            btn.dataset.diff = d.id;
            btn.textContent = d.label;
            btn.onclick = () => {
                this.aiDifficulty = d.id;
                aiSegment.querySelectorAll(".billiards-tab-btn").forEach(b => b.classList.remove("active"));
                btn.classList.add("active");
                const p2Sub = document.getElementById("ui-p2-sub");
                if (p2Sub && this.gameMode === 'pv_ai') {
                    p2Sub.textContent = d.id.toUpperCase();
                }
                this.showToast(`AI Difficulty: ${d.label}`, '#f59e0b');
            };
            aiSegment.appendChild(btn);
        });

        rightControls.appendChild(modeSegment);
        rightControls.appendChild(aiSegment);
        bottomBar.appendChild(rightControls);
        container.appendChild(bottomBar);

        document.body.appendChild(container);
        this.uiContainer = container;

        this.updateHUD();
    }

    private updatePowerGauge(ratio: number): void {
        const container = document.getElementById("ui-power-gauge-container");
        const bar = document.getElementById("ui-power-bar");
        const txt = document.getElementById("ui-power-text");
        if (!container || !bar || !txt) return;

        if (ratio <= 0.01) {
            container.style.opacity = '0';
            container.style.transform = 'translateY(-50%) scale(0.92)';
        } else {
            container.style.opacity = '1';
            container.style.transform = 'translateY(-50%) scale(1.0)';
            const pct = Math.round(ratio * 100);
            bar.style.height = `${pct}%`;
            txt.textContent = `${pct}%`;

            // Dynamic glow matching power intensity
            if (pct < 35) {
                bar.style.boxShadow = '0 0 12px rgba(16, 185, 129, 0.75)';
                txt.style.color = '#34d399';
            } else if (pct < 70) {
                bar.style.boxShadow = '0 0 14px rgba(245, 158, 11, 0.85)';
                txt.style.color = '#fbbf24';
            } else {
                bar.style.boxShadow = '0 0 18px rgba(239, 68, 68, 0.95)';
                txt.style.color = '#f87171';
            }
        }
    }

    private updateHUD(): void {
        const turnEl = document.getElementById("ui-turn-status");
        const p1Card = document.getElementById("ui-p1-card");
        const p2Card = document.getElementById("ui-p2-card");
        const p1Dot = document.getElementById("ui-p1-dot");
        const p2Dot = document.getElementById("ui-p2-dot");
        const p1Group = document.getElementById("ui-p1-group");
        const p2Group = document.getElementById("ui-p2-group");

        if (p1Group) {
            if (this.isTableOpen || !this.player1Group) {
                p1Group.textContent = "OPEN TABLE";
                p1Group.style.color = "#94a3b8";
                p1Group.style.background = "rgba(148, 163, 184, 0.15)";
                p1Group.style.borderColor = "rgba(148, 163, 184, 0.3)";
            } else if (this.player1Group === 'solids') {
                p1Group.textContent = "SOLIDS (1-7)";
                p1Group.style.color = "#fbbf24";
                p1Group.style.background = "rgba(245, 158, 11, 0.18)";
                p1Group.style.borderColor = "rgba(245, 158, 11, 0.4)";
            } else {
                p1Group.textContent = "STRIPES (9-15)";
                p1Group.style.color = "#38bdf8";
                p1Group.style.background = "rgba(56, 189, 248, 0.18)";
                p1Group.style.borderColor = "rgba(56, 189, 248, 0.4)";
            }
        }

        if (p2Group) {
            if (this.isTableOpen || !this.player2Group) {
                p2Group.textContent = "OPEN TABLE";
                p2Group.style.color = "#94a3b8";
                p2Group.style.background = "rgba(148, 163, 184, 0.15)";
                p2Group.style.borderColor = "rgba(148, 163, 184, 0.3)";
            } else if (this.player2Group === 'solids') {
                p2Group.textContent = "SOLIDS (1-7)";
                p2Group.style.color = "#fbbf24";
                p2Group.style.background = "rgba(245, 158, 11, 0.18)";
                p2Group.style.borderColor = "rgba(245, 158, 11, 0.4)";
            } else {
                p2Group.textContent = "STRIPES (9-15)";
                p2Group.style.color = "#38bdf8";
                p2Group.style.background = "rgba(56, 189, 248, 0.18)";
                p2Group.style.borderColor = "rgba(56, 189, 248, 0.4)";
            }
        }

        if (this.currentTurn === 'player1') {
            if (p1Card) { p1Card.style.animation = "hudGlowP1 3s infinite ease-in-out"; p1Card.style.borderColor = "rgba(16, 185, 129, 0.8)"; }
            if (p2Card) { p2Card.style.animation = "none"; p2Card.style.borderColor = "rgba(255, 255, 255, 0.12)"; }
            if (p1Dot) { p1Dot.style.background = "#10b981"; p1Dot.style.boxShadow = "0 0 10px #10b981"; }
            if (p2Dot) { p2Dot.style.background = "#64748b"; p2Dot.style.boxShadow = "none"; }
            if (turnEl) {
                turnEl.innerHTML = `
                    <span style="width: 7px; height: 7px; border-radius: 50%; background: #10b981; display: inline-block; animation: hudRadarPing 1.8s infinite ease-in-out;"></span>
                    <span>Your Turn • Pull back cue ball to aim & shoot</span>
                `;
            }
        } else if (this.currentTurn === 'ai') {
            if (p1Card) { p1Card.style.animation = "none"; p1Card.style.borderColor = "rgba(255, 255, 255, 0.12)"; }
            if (p2Card) { p2Card.style.animation = "hudGlowAI 3s infinite ease-in-out"; p2Card.style.borderColor = "rgba(244, 63, 94, 0.8)"; }
            if (p1Dot) { p1Dot.style.background = "#64748b"; p1Dot.style.boxShadow = "none"; }
            if (p2Dot) { p2Dot.style.background = "#f43f5e"; p2Dot.style.boxShadow = "0 0 10px #f43f5e"; }
            if (turnEl) {
                turnEl.innerHTML = `
                    <span style="width: 7px; height: 7px; border-radius: 50%; background: #f43f5e; display: inline-block; animation: hudRadarPing 1.8s infinite ease-in-out;"></span>
                    <span>AI (${this.aiDifficulty.toUpperCase()}) calculating shot...</span>
                `;
            }
        } else {
            if (p1Card) { p1Card.style.animation = "none"; p1Card.style.borderColor = "rgba(255, 255, 255, 0.12)"; }
            if (p2Card) { p2Card.style.animation = "hudGlowP2 3s infinite ease-in-out"; p2Card.style.borderColor = "rgba(56, 189, 248, 0.8)"; }
            if (p1Dot) { p1Dot.style.background = "#64748b"; p1Dot.style.boxShadow = "none"; }
            if (p2Dot) { p2Dot.style.background = "#38bdf8"; p2Dot.style.boxShadow = "0 0 10px #38bdf8"; }
            if (turnEl) {
                turnEl.innerHTML = `
                    <span style="width: 7px; height: 7px; border-radius: 50%; background: #38bdf8; display: inline-block; animation: hudRadarPing 1.8s infinite ease-in-out;"></span>
                    <span>Player 2's Turn • Pull back cue ball to aim & shoot</span>
                `;
            }
        }

        // Render Miniature 3D Ball Chips in Trays
        this.renderBallTray("ui-p1-balls", this.player1Group);
        this.renderBallTray("ui-p2-balls", this.player2Group);
    }

    private renderBallTray(containerId: string, group: BallGroup | null): void {
        const tray = document.getElementById(containerId);
        if (!tray) return;
        tray.innerHTML = '';

        if (!group) {
            // Render 7 empty socket placeholders when table is open
            for (let i = 0; i < 7; i++) {
                const placeholder = document.createElement("div");
                placeholder.style.cssText = `
                    width: 20px; height: 20px;
                    border-radius: 50%;
                    background: rgba(30, 41, 59, 0.45);
                    border: 1px dashed rgba(255, 255, 255, 0.15);
                    box-sizing: border-box;
                `;
                tray.appendChild(placeholder);
            }
            return;
        }

        const range = group === 'solids' ? [1, 2, 3, 4, 5, 6, 7] : [9, 10, 11, 12, 13, 14, 15];
        for (const num of range) {
            const ball = this.balls.find(b => b.number === num);
            const isPotted = ball ? ball.potted : false;
            const isStripe = num > 8;
            const hex = ball ? ball.colorHex : '#888888';

            const chip = document.createElement("div");
            chip.style.cssText = `
                position: relative;
                width: 22px; height: 22px;
                border-radius: 50%;
                box-sizing: border-box;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 8.5px;
                font-weight: 900;
                color: #0f172a;
                border: 1px solid ${isPotted ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.75)'};
                opacity: ${isPotted ? '0.25' : '1.0'};
                transform: ${isPotted ? 'scale(0.88)' : 'scale(1.0)'};
                box-shadow: ${isPotted ? 'none' : '0 3px 8px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.6)'};
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                overflow: hidden;
            `;

            if (isStripe) {
                // Striped Ball: White sphere body with central horizontal color band
                chip.style.background = `
                    radial-gradient(circle at 35% 30%, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0) 45%),
                    linear-gradient(to bottom, #ffffff 22%, ${hex} 22%, ${hex} 78%, #ffffff 78%)
                `;
            } else {
                // Solid Ball: Full pigment with realistic spherical specular shine
                chip.style.background = `
                    radial-gradient(circle at 35% 30%, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0) 45%),
                    ${hex}
                `;
            }

            // White central number badge
            const numBadge = document.createElement("div");
            numBadge.style.cssText = `
                width: 10px; height: 10px;
                border-radius: 50%;
                background: #ffffff;
                color: #0f172a;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 7px;
                font-weight: 900;
                box-shadow: 0 1px 2px rgba(0,0,0,0.4);
            `;
            numBadge.textContent = num.toString();
            chip.appendChild(numBadge);

            tray.appendChild(chip);
        }
    }

    private showToast(text: string, color: string = '#10b981'): void {
        const container = document.getElementById("ui-toast-container");
        if (!container) return;

        const badge = document.createElement("div");
        badge.textContent = text;
        badge.style.cssText = `
            background: linear-gradient(135deg, rgba(15, 23, 42, 0.94), rgba(24, 34, 53, 0.90));
            backdrop-filter: blur(20px) saturate(180%);
            -webkit-backdrop-filter: blur(20px) saturate(180%);
            border: 1.5px solid ${color};
            color: #ffffff;
            padding: 9px 24px;
            border-radius: 24px;
            font-size: 13px;
            font-weight: 800;
            letter-spacing: 0.5px;
            box-shadow: 0 12px 36px rgba(0,0,0,0.65), 0 0 20px ${color}44;
            margin-bottom: 10px;
            animation: toastSlideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        `;
        container.appendChild(badge);
        setTimeout(() => {
            badge.style.transition = "all 0.3s ease";
            badge.style.opacity = "0";
            badge.style.transform = "translateY(-10px) scale(0.95)";
            setTimeout(() => badge.remove(), 300);
        }, 2400);
    }

    private showGameOverModal(message: string, color: string): void {
        const modal = document.createElement("div");
        modal.style.cssText = `
            position: absolute;
            top: 50%; left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, rgba(15, 23, 42, 0.96), rgba(22, 32, 52, 0.92));
            backdrop-filter: blur(32px) saturate(180%);
            -webkit-backdrop-filter: blur(32px) saturate(180%);
            border: 2px solid ${color};
            border-radius: 28px;
            padding: 40px 56px;
            text-align: center;
            box-shadow: 0 24px 80px rgba(0,0,0,0.85), 0 0 35px ${color}44;
            z-index: 300;
            pointer-events: auto;
            animation: modalPopIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        `;
        modal.innerHTML = `
            <div style="font-size: 48px; margin-bottom: 8px;">🏆</div>
            <div style="font-size: 26px; font-weight: 900; color: ${color}; margin-bottom: 8px; letter-spacing: 0.5px;">${message}</div>
            <div style="font-size: 13.5px; color: #94a3b8; margin-bottom: 28px; font-weight: 600;">Tournament Match Complete</div>
            <button id="ui-restart-modal-btn" class="billiards-btn" style="background: linear-gradient(135deg, #10b981, #059669); border: 1px solid #34d399; color: #fff; padding: 12px 32px; border-radius: 14px; font-size: 14px; font-weight: 800; cursor: pointer; box-shadow: 0 6px 24px rgba(16,185,129,0.45);">
                Play Next Rack
            </button>
        `;
        document.body.appendChild(modal);

        const btn = document.getElementById("ui-restart-modal-btn");
        if (btn) {
            btn.onclick = () => {
                modal.remove();
                this.resetRack();
            };
        }
    }

    public resetRack(): void {
        if (this.aiTimer) clearTimeout(this.aiTimer);
        this.spawnBalls();
        this.gameState = 'aiming';
        this.currentTurn = 'player1';
        this.isTableOpen = true;
        this.player1Group = null;
        this.player2Group = null;
        this.pottedThisShot = [];
        this.firstBallHitThisShot = null;
        this.scratchOccurred = false;
        this.isAiming = false;
        this.aimLine.VISIBILITY = false;
        this.ghostBallMarker.VISIBILITY = false;
        this.targetPathLine.VISIBILITY = false;
        this.cueStick.VISIBILITY = false;
        this.updatePowerGauge(0);
        this.updateHUD();
        this.showToast("Table Re-Racked!", '#38bdf8');
    }

    public onDestroy(): void {
        if (this.aiTimer) clearTimeout(this.aiTimer);
        if (this.uiContainer) {
            this.uiContainer.remove();
            this.uiContainer = undefined;
        }
        if (this._resizeHandler) {
            window.removeEventListener('resize', this._resizeHandler);
            this._resizeHandler = undefined;
        }
        if (this._contextMenuHandler) {
            window.removeEventListener('contextmenu', this._contextMenuHandler);
            this._contextMenuHandler = undefined;
        }
        this.soundEffects.destroy();
    }
}
