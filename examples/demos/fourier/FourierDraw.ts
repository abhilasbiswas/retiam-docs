// =========================================================================
// File: examples/demos/fourier/FourierDraw.ts
// =========================================================================

import { Animation, AnimOptions, Rate } from "retiam";
import type { FourierEpicycles } from "./FourierEpicycles";

export interface FourierDrawOptions extends AnimOptions {
    /** Number of full path drawing loops to play (defaults to 1). */
    loops?: number;
    /** Whether to reset the drawn trace at the start of this animation (defaults to true). */
    resetTrace?: boolean;
}

/**
 * Retiam Animation class to drive Fourier epicycle path drawing.
 * 
 * Progresses the Fourier drawing phase t from 0.0 to 1.0 using the specified
 * duration, easing curve (rate_func), and loop count.
 */
export class FourierDraw extends Animation {
    public fourierEntity: FourierEpicycles;
    public loops: number;
    public resetTraceOnStart: boolean;

    constructor(
        fourierEntity: FourierEpicycles,
        options: FourierDrawOptions = {}
    ) {
        options.rate_func = options.rate_func || Rate.linear();
        options.duration = options.duration || 10000;
        super(options);

        this.fourierEntity = fourierEntity;
        this.entity = fourierEntity;
        this.loops = options.loops || 1;
        this.resetTraceOnStart = options.resetTrace !== false;
        this.LABEL = "FourierDraw";
    }

    public prepare(): void {
        // Temporarily disable autonomous speed update while explicit animation is active
        this.fourierEntity.setSpeed(0);

        if (this.resetTraceOnStart) {
            this.fourierEntity.resetTrace();
        }
        this.fourierEntity.setProgress(0.0);
    }

    public update(dt: number): boolean {
        // 1. Handle Delay
        if (this.delay > 0) {
            this.delay -= dt;
            if (this.delay > 0) return false;
            dt = Math.abs(this.delay);
            this.delay = 0;
        }

        this.elapsed += dt;

        // 2. Compute normalized eased progress
        if (this.elapsed >= this.duration) {
            this.elapsed = this.duration;

            // Snap to 1.0 (final closed point)
            const t = this.rate_func(1.0);
            this.fourierEntity.setProgress(t % 1.0 === 0 && t > 0 ? 1.0 : t % 1.0);

            this.complete();
            return true;
        } else {
            const rawRatio = this.elapsed / this.duration;
            const eased = this.rate_func(rawRatio);
            const totalProgress = eased * this.loops;
            const currentT = totalProgress % 1.0;

            this.fourierEntity.setProgress(currentT);
            return false;
        }
    }
}
