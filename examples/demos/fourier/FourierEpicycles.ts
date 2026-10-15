// =========================================================================
// File: examples/demos/fourier/FourierEpicycles.ts
// =========================================================================

import {
    Entity,
    EntityOptions,
    VectorEntity,
    Path,
    Circle,
    Arrow,
    ArrowTipType,
    TracePath,
    Color,
    Vec3
} from "retiam";
import { FourierTransform } from "./FourierTransform";
import { FourierPathSampler, FourierPathInput } from "./FourierPathSampler";

export type { ArrowTipType };

export interface FourierOptions extends EntityOptions {
    /** Number of Fourier harmonics (epicycles) to draw. Defaults to 60. */
    harmonics?: number;
    /** Number of samples taken along input path for DFT. Defaults to 1024. */
    sampleCount?: number;
    /** Target scale of the shape. Defaults to 36. */
    scale?: number;

    /** Arrow tip style ('line' | 'triangle' | 'stealth'). Defaults to 'line'. */
    tipType?: ArrowTipType;
    /** Stroke color of Arrow entities. Defaults to white. */
    vectorStroke?: Color;
    /** Relative stroke width of Arrow entities (fraction of length). Defaults to 0.05. */
    vectorStrokeWidth?: number;
    /** Relative arrow head length (fraction of length). Defaults to 0.25. */
    arrowHeadLength?: number;
    /** Relative arrow head width (fraction of length). Defaults to 0.20. */
    arrowHeadWidth?: number;

    /** Whether to show epicycle circles. Defaults to true. */
    showCircles?: boolean;
    /** Stroke color of epicycle circles. Defaults to semi-transparent cyan/white. */
    circleStroke?: Color;
    /** Stroke width ratio of epicycle circles (fraction of radius). Defaults to 0.015. */
    circleStrokeWidth?: number;

    /**
     * Lifetime in milliseconds before trace points dissipate.
     * Defaults to 3000ms. Set to Infinity for permanent trace.
     */
    age?: number;
    /** Trace color. Defaults to golden yellow. */
    traceColor?: Color;
    /** Trace stroke width. Defaults to 2.8. */
    traceStrokeWidth?: number;

    /** Animation speed in cycles per second. Defaults to 0.05 (20s per cycle). */
    speed?: number;
    /** Whether to loop autonomously. Defaults to true. */
    loop?: boolean;
    /** Initial phase progress in [0, 1]. Defaults to 0. */
    t?: number;
    /** Whether to flip the Y axis (useful for standard Y-down SVG paths). Defaults to false. */
    flipY?: boolean;
}

/**
 * Fourier Epicycles Path Drawing Entity.
 * 
 * Uses a Fourier DFT solver, Arrow entities with size-based thickness scaling,
 * optional Circles for rotating harmonics, and a diminishing TracePath to draw the path.
 */
export class FourierEpicycles extends VectorEntity {
    private _fourier: FourierTransform;
    private _harmonicsCount: number;
    private _showCircles: boolean;
    private _tipType: ArrowTipType;
    private _age: number;
    private _speed: number;
    private _loop: boolean;
    private _scale: number;
    private _sampleCount: number;
    private _progress: number = 0;
    private _flipY: boolean = false;
    private _lastInput: FourierPathInput | null = null;

    private _circlesGroup: Entity;
    private _arrowsGroup: Entity;
    private _arrows: Arrow[] = [];
    private _circles: Circle[] = [];
    private _trace: TracePath;
    private _tip: Vec3 = new Vec3(0, 0, 0);

    private _options: FourierOptions;

    constructor(input?: FourierPathInput, options: FourierOptions = {}) {
        super(options);
        this._options = options;

        this._harmonicsCount = options.harmonics ?? 60;
        this._showCircles = options.showCircles ?? true;
        this._tipType = options.tipType ?? 'triangle';
        this._age = options.age ?? 3000;
        this._speed = options.speed ?? 0.05;
        this._loop = options.loop ?? true;
        this._scale = options.scale ?? 36;
        this._sampleCount = options.sampleCount ?? 1024;
        this._progress = options.t ?? 0;
        this._flipY = options.flipY ?? false;

        this._fourier = new FourierTransform();

        // 1. Group hierarchy for depth sorting
        this._circlesGroup = new Entity({ label: "FourierCircles" });
        this._arrowsGroup = new Entity({ label: "FourierArrows" });
        this._circlesGroup.z_index = 0.0;
        this._arrowsGroup.z_index = 0.02;
        this.add(this._circlesGroup, this._arrowsGroup);

        // 2. Simple diminishing normal TracePath
        this._trace = new TracePath({
            targetFunc: () => this._tip,
            maxAge: this._age,
            dissipating: true,
            minDistance: 0.05,
            smoothing: 2,
            stroke: options.traceColor ?? new Color(1.0, 0.9, 0.25, 1.0),
            strokeWidth: options.traceStrokeWidth ?? 2.8,
        });
        this._trace.z_index = 0.04;
        this._trace.isPickable = false;
        this.add(this._trace);

        // 3. Compute DFT if input path is provided
        if (input) {
            this.setPath(input, this._scale, this._sampleCount);
        }

        // 4. Update loop
        this.always((time, dt) => {
            const deltaSec = (dt || 16.67) * 0.001;
            if (this._speed > 0 && (this.parent || this.getScene())) {
                let nextT = this._progress + this._speed * deltaSec;
                if (nextT >= 1.0) {
                    nextT = this._loop ? (nextT % 1.0) : 1.0;
                }
                this.setProgress(nextT);
            }
        });
    }

    /**
     * Sets or updates the input vector path.
     */
    public setPath(input: FourierPathInput, scale: number = this._scale, sampleCount: number = this._sampleCount): this {
        this._lastInput = input;
        this._scale = scale;
        this._sampleCount = sampleCount;

        const points = FourierPathSampler.sample(input, {
            sampleCount: this._sampleCount,
            scale: this._scale,
            center: true,
            flipY: this._flipY,
        });

        this._fourier.compute(points);
        this.syncPoolSizes();
        this.resetTrace();
        this.setProgress(0);
        return this;
    }

    /**
     * Synchronizes Arrow and Circle entity pools to match harmonic count.
     */
    private syncPoolSizes() {
        const count = Math.ceil(Math.min(this._harmonicsCount, this._fourier.count));

        while (this._arrows.length < count) {
            // Retiam unit Arrow entity pointing along +X from [0,0,0] to [1,0,0]
            const arrow = new Arrow([0, 0, 0], [1, 0, 0], {
                stroke: this._options.vectorStroke ?? new Color(1.0, 1.0, 1.0, 0.85),
                strokeWidth: this._options.vectorStrokeWidth ?? 0.03,
                headLength: this._options.arrowHeadLength ?? 0.25,
                headWidth: this._options.arrowHeadWidth ?? 0.10,
                tipType: this._tipType
            });
            this._arrows.push(arrow);
            this._arrowsGroup.add(arrow);

            // Optional epicycle Circle entity
            const circle = new Circle(1.0, {
                stroke: this._options.circleStroke ?? new Color(0.6, 0.8, 1.0, 0.2),
                strokeWidth: this._options.circleStrokeWidth ?? 0.015,
                fill: Color.NONE
            });
            this._circles.push(circle);
            this._circlesGroup.add(circle);
        }
    }

    /**
     * Updates instantaneous epicycle positions for phase progress t in [0, 1].
     */
    public setProgress(t: number): this {
        this._progress = Math.max(0, Math.min(1, t));
        const count = Math.min(this._harmonicsCount, this._fourier.count);
        if (count === 0) return this;

        const epicycles = this._fourier.getEpicycles(this._progress, count);

        for (let i = 0; i < this._arrows.length; i++) {
            if (i < epicycles.length) {
                const ep = epicycles[i];
                const start: [number, number, number] = [ep.center.x, ep.center.y, 0];

                const arrow = this._arrows[i];
                if (ep.radius < 0.005) {
                    arrow.VISIBILITY = false;
                } else {
                    arrow.VISIBILITY = true;
                    const dx = ep.tip.x - ep.center.x;
                    const dy = ep.tip.y - ep.center.y;
                    arrow.transform.position.set(start);
                    arrow.transform.setRotationZ(Math.atan2(dy, dx));

                    // Mixed scaling to preserve thickness for small arrows
                    // T is the non-linear thickness factor
                    const T = Math.pow(ep.radius, 0.3);
                    const baseStroke = this._options.vectorStrokeWidth ?? 0.03;
                    const baseHl = this._options.arrowHeadLength ?? 0.25;
                    const baseHw = this._options.arrowHeadWidth ?? 0.10;

                    arrow.paint.strokeWidth = baseStroke * T;
                    arrow.options.endHeadLength = Math.min(baseHl * T, ep.radius * 0.8);
                    arrow.options.endHeadWidth = baseHw * T;

                    // Update endpoints (this triggers rebuild of arrow geometry)
                    arrow.setPoints([[0, 0, 0], [ep.radius, 0, 0]]);
                    arrow.transform.setScale(1.0);
                }

                // 3. Update optional Circle entity (scaled proportionally in the same way)
                if (this._showCircles && ep.radius >= 0.005) {
                    const circle = this._circles[i];
                    circle.VISIBILITY = true;
                    circle.transform.position.set(start);
                    circle.transform.setScale(ep.radius);

                    const T = Math.pow(ep.radius, 0.5);
                    const baseCircleStroke = this._options.circleStrokeWidth ?? 0.015;
                    circle.paint.strokeWidth = (baseCircleStroke * T) / ep.radius;
                } else if (this._circles[i]) {
                    this._circles[i].VISIBILITY = false;
                }
            } else {
                this._arrows[i].VISIBILITY = false;
                if (this._circles[i]) this._circles[i].VISIBILITY = false;
            }
        }

        // Update drawing tip for TracePath
        if (epicycles.length > 0) {
            const lastTip = epicycles[epicycles.length - 1].tip;
            this._tip.set(lastTip.x, lastTip.y, 0);
        }

        this.invalidate();
        return this;
    }

    /**
     * Clears the diminishing TracePath.
     */
    public resetTrace(): this {
        this._trace.clear();
        return this;
    }

    /**
     * Current phase progress t in [0, 1].
     */
    public getProgress(): number {
        return this._progress;
    }

    /**
     * Current tip position.
     */
    public getTip(): Vec3 {
        return this._tip.clone();
    }

    /**
     * Active Arrow tip style ('line' | 'triangle' | 'stealth').
     */
    public get tipType(): ArrowTipType {
        return this._tipType;
    }

    public set tipType(type: ArrowTipType) {
        this._tipType = type;
        for (const arrow of this._arrows) {
            arrow.setTipType(type);
        }
        this.setProgress(this._progress);
    }

    public setTipType(type: ArrowTipType): this {
        this.tipType = type;
        return this;
    }

    /**
     * Trace diminishing age in milliseconds.
     */
    public get age(): number {
        return this._age;
    }

    public set age(val: number) {
        this._age = val;
        this._trace.maxAge = val;
    }

    public setAge(val: number): this {
        this.age = val;
        return this;
    }

    /**
     * Whether epicycle circles are visible.
     */
    public get showCircles(): boolean {
        return this._showCircles;
    }

    public set showCircles(val: boolean) {
        this._showCircles = val;
        this.setProgress(this._progress);
    }

    public setShowCircles(val: boolean): this {
        this.showCircles = val;
        return this;
    }

    /**
     * Active number of harmonics / epicycles.
     */
    public get harmonics(): number {
        return this._harmonicsCount;
    }

    public set harmonics(val: number) {
        this._harmonicsCount = Math.max(1, val);
        this.syncPoolSizes();
        this.setProgress(this._progress);
    }

    public setHarmonics(val: number): this {
        this.harmonics = val;
        return this;
    }

    /**
     * Sets autonomous playback speed in cycles per second.
     */
    public setSpeed(speed: number): this {
        this._speed = speed;
        return this;
    }

    /**
     * Whether the Y axis is inverted when sampling the input path.
     */
    public get flipY(): boolean {
        return this._flipY;
    }

    public setFlipY(val: boolean): this {
        if (this._flipY !== val) {
            this._flipY = val;
            if (this._lastInput) {
                this.setPath(this._lastInput, this._scale, this._sampleCount);
            }
        }
        return this;
    }

    /**
     * Direct reference to the underlying TracePath.
     */
    public get trace(): TracePath {
        return this._trace;
    }

    /**
     * Direct reference to the Arrow entities.
     */
    public get arrows(): readonly Arrow[] {
        return this._arrows;
    }

    /**
     * Direct reference to the epicycle Circle entities.
     */
    public get circles(): readonly Circle[] {
        return this._circles;
    }

    public toPaths(): Path[] {
        return this._trace.toPaths();
    }

    public destroy() {
        super.destroy();
        this._trace.destroy();
    }
}
