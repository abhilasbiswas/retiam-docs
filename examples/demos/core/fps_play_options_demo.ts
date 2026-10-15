import { frameStage, compactDemoPanel, demoCaption } from "../../shared/presentation";
// File: examples/demos/core/fps_play_options_demo.ts

import {
    Scene,
    SDFText,
    CENTER,
    Color,
    Circle,
    Rect,
    Line,
    Triangle,
    CustomAnimation,
    Rate,
    hex,
    AlwaysHandle,
    Playable
} from "retiam";
import { Camera2DController } from "retiam";

interface LaneTelemetry {
    fpsLabel: string;
    targetIntervalMs: number;
    stepCount: number;
    lastDt: number;
    color: string;
}

export default class FpsPlayOptionsDemoScene extends Scene {
    private controller!: Camera2DController;
    private uiContainer: HTMLElement | null = null;

    // Lane 1: 60 FPS Fluid
    private core60!: Circle;
    private orbit60!: Circle;
    private line60!: Line;
    private track60Bg!: Rect;

    // Lane 2: 24 FPS Film
    private core24!: Rect;
    private orbit24!: Circle;
    private line24!: Line;
    private track24Bg!: Rect;

    // Lane 3: 12 FPS Anime / Cel
    private core12!: Triangle;
    private orbit12!: Circle;
    private line12!: Line;
    private track12Bg!: Rect;

    // Lane 4: 150ms Interval Stepped
    private coreInterval!: Circle;
    private orbitInterval!: Circle;
    private lineInterval!: Line;
    private trackIntervalBg!: Rect;

    // Telemetry tracking
    private telemetry: LaneTelemetry[] = [
        { fpsLabel: "60 FPS (Fluid)", targetIntervalMs: 16.6, stepCount: 0, lastDt: 16.6, color: "#38bdf8" },
        { fpsLabel: "24 FPS (Film)", targetIntervalMs: 41.7, stepCount: 0, lastDt: 41.7, color: "#a855f7" },
        { fpsLabel: "12 FPS (Cel/Anime)", targetIntervalMs: 83.3, stepCount: 0, lastDt: 83.3, color: "#f59e0b" },
        { fpsLabel: "150ms (Interval)", targetIntervalMs: 150.0, stepCount: 0, lastDt: 150.0, color: "#10b981" }
    ];

    private isPlaying: boolean = false;
    private autoLoop: boolean = true;
    private loopTimer: any = null;

    public override async run(): Promise<void> {
        this.disablePlayer();
        // 1. Camera & Canvas
        this.camera.position.set([0, 0, 1000]);
        this.controller = new Camera2DController(this, this.camera, {
            damping: 10,
            zoomSpeed: 0.8
        });
        this.clearColor(hex("#070a13"));

        // 2. Setup 4 lanes across viewport
        frameStage(this, 1180, 780);
        demoCaption(this, "Animation cadence", "The same motion at four update frequencies");
        this.setupLanes();

        // 3. Mount Glassmorphic HUD Deck
        this.mountUI();

        // 4. Invalidation & Telemetry Always loop (throttled at 80ms)
        this.always(() => {
            this.invalidate();
        });

        this.always(() => {
            this.updateTelemetryUI();
        }, { interval: 80 });

        // 5. Main Animation Loop (properly awaited so Scene Composer manages its lifecycle)
        while (this.autoLoop && !this.isPaused) {
            await this.runAnimationCycle();
            if (!this.autoLoop || this.isPaused) break;
            await this.wait(600);
        }
    }

    private setupLanes() {
        const laneXs = [-360, -120, 120, 360];
        const laneWidth = 200;
        const laneHeight = 360;

        // Colors
        const col60 = hex("#38bdf8");
        const col24 = hex("#a855f7");
        const col12 = hex("#f59e0b");
        const colInt = hex("#10b981");
        ["60 FPS", "24 FPS", "12 FPS", "150 ms"].forEach((text, i) => {
            const label = new SDFText(text, {
                fontSize: 22, anchor: CENTER,
                fill: [col60, col24, col12, colInt][i],
            });
            label.move([laneXs[i], 205, 0]);
            this.add(label);
        });

        // Background Cards
        const makeCard = (x: number, col: Color) => {
            const card = new Rect(laneWidth, laneHeight, { cornerRadius: 16 });
            card.paint.fill = new Color(col.r * 0.08, col.g * 0.08, col.b * 0.08, 0.45);
            card.paint.stroke = new Color(col.r, col.g, col.b, 0.25);
            card.paint.strokeWidth = 1.5;
            card.move([x, -10, 0]);
            this.add(card);
            return card;
        };

        this.track60Bg = makeCard(laneXs[0], col60);
        this.track24Bg = makeCard(laneXs[1], col24);
        this.track12Bg = makeCard(laneXs[2], col12);
        this.trackIntervalBg = makeCard(laneXs[3], colInt);

        // Guide track lines for orbital motion
        const makeGuideRing = (x: number, y: number, r: number, col: Color) => {
            const ring = new Circle(r);
            ring.paint.fill = Color.NONE;
            ring.paint.stroke = new Color(col.r, col.g, col.b, 0.15);
            ring.paint.strokeWidth = 1.2;
            ring.move([x, y, 0]);
            this.add(ring);
            return ring;
        };

        const centerY = 50;
        const orbitRadius = 65;

        makeGuideRing(laneXs[0], centerY, orbitRadius, col60);
        makeGuideRing(laneXs[1], centerY, orbitRadius, col24);
        makeGuideRing(laneXs[2], centerY, orbitRadius, col12);
        makeGuideRing(laneXs[3], centerY, orbitRadius, colInt);

        // Guide track lines for vertical sliders
        const sliderY1 = -90;
        const sliderY2 = -150;
        const makeSliderGuide = (x: number, col: Color) => {
            const line = new Line([[x, sliderY1, 0], [x, sliderY2, 0]]);
            line.paint.stroke = new Color(col.r, col.g, col.b, 0.2);
            line.paint.strokeWidth = 2.0;
            this.add(line);
            return line;
        };

        makeSliderGuide(laneXs[0], col60);
        makeSliderGuide(laneXs[1], col24);
        makeSliderGuide(laneXs[2], col12);
        makeSliderGuide(laneXs[3], colInt);

        // --- Lane 1 Actors (60 FPS) ---
        this.core60 = new Circle(26);
        this.core60.paint.fill = new Color(col60.r, col60.g, col60.b, 0.35);
        this.core60.paint.stroke = col60;
        this.core60.paint.strokeWidth = 2.5;
        this.core60.move([laneXs[0], centerY, 0]);
        this.add(this.core60);

        this.orbit60 = new Circle(10);
        this.orbit60.paint.fill = col60;
        this.orbit60.paint.stroke = hex("#ffffff");
        this.orbit60.paint.strokeWidth = 2.0;
        this.orbit60.move([laneXs[0] + orbitRadius, centerY, 0]);
        this.add(this.orbit60);

        this.line60 = new Line([[laneXs[0] - 14, sliderY1, 0], [laneXs[0] + 14, sliderY1, 0]]);
        this.line60.paint.stroke = col60;
        this.line60.paint.strokeWidth = 4.0;
        this.add(this.line60);

        // --- Lane 2 Actors (24 FPS) ---
        this.core24 = new Rect(42, 42, { cornerRadius: 8 });
        this.core24.paint.fill = new Color(col24.r, col24.g, col24.b, 0.35);
        this.core24.paint.stroke = col24;
        this.core24.paint.strokeWidth = 2.5;
        this.core24.move([laneXs[1], centerY, 0]);
        this.add(this.core24);

        this.orbit24 = new Circle(10);
        this.orbit24.paint.fill = col24;
        this.orbit24.paint.stroke = hex("#ffffff");
        this.orbit24.paint.strokeWidth = 2.0;
        this.orbit24.move([laneXs[1] + orbitRadius, centerY, 0]);
        this.add(this.orbit24);

        this.line24 = new Line([[laneXs[1] - 14, sliderY1, 0], [laneXs[1] + 14, sliderY1, 0]]);
        this.line24.paint.stroke = col24;
        this.line24.paint.strokeWidth = 4.0;
        this.add(this.line24);

        // --- Lane 3 Actors (12 FPS) ---
        this.core12 = new Triangle([[0, 26], [22, -20], [-22, -20]]);
        this.core12.paint.fill = new Color(col12.r, col12.g, col12.b, 0.35);
        this.core12.paint.stroke = col12;
        this.core12.paint.strokeWidth = 2.5;
        this.core12.move([laneXs[2], centerY, 0]);
        this.add(this.core12);

        this.orbit12 = new Circle(10);
        this.orbit12.paint.fill = col12;
        this.orbit12.paint.stroke = hex("#ffffff");
        this.orbit12.paint.strokeWidth = 2.0;
        this.orbit12.move([laneXs[2] + orbitRadius, centerY, 0]);
        this.add(this.orbit12);

        this.line12 = new Line([[laneXs[2] - 14, sliderY1, 0], [laneXs[2] + 14, sliderY1, 0]]);
        this.line12.paint.stroke = col12;
        this.line12.paint.strokeWidth = 4.0;
        this.add(this.line12);

        // --- Lane 4 Actors (150ms Interval) ---
        this.coreInterval = new Circle(26);
        this.coreInterval.paint.fill = new Color(colInt.r, colInt.g, colInt.b, 0.35);
        this.coreInterval.paint.stroke = colInt;
        this.coreInterval.paint.strokeWidth = 2.5;
        this.coreInterval.move([laneXs[3], centerY, 0]);
        this.add(this.coreInterval);

        this.orbitInterval = new Circle(10);
        this.orbitInterval.paint.fill = colInt;
        this.orbitInterval.paint.stroke = hex("#ffffff");
        this.orbitInterval.paint.strokeWidth = 2.0;
        this.orbitInterval.move([laneXs[3] + orbitRadius, centerY, 0]);
        this.add(this.orbitInterval);

        this.lineInterval = new Line([[laneXs[3] - 14, sliderY1, 0], [laneXs[3] + 14, sliderY1, 0]]);
        this.lineInterval.paint.stroke = colInt;
        this.lineInterval.paint.strokeWidth = 4.0;
        this.add(this.lineInterval);
    }

    public async runAnimationCycle(): Promise<void> {
        if (this.isPlaying) return;
        this.isPlaying = true;

        try {
            // Reset telemetry step counters for the cycle
            this.telemetry.forEach(t => t.stepCount = 0);

            const duration = 2400; // 2.4 seconds duration per cycle
            const laneXs = [-360, -120, 120, 360];
            const centerY = 50;
            const orbitR = 65;
            const sliderY1 = -90;
            const sliderY2 = -150;

            // Reset actors to initial cycle state
            this.core60.transform.scaling = 1.0;
            this.orbit60.move([laneXs[0] + orbitR, centerY, 0]);
            this.line60.move([laneXs[0], sliderY1, 0]);

            this.core24.transform.scaling = 1.0;
            this.orbit24.move([laneXs[1] + orbitR, centerY, 0]);
            this.line24.move([laneXs[1], sliderY1, 0]);

            this.core12.transform.scaling = 1.0;
            this.orbit12.move([laneXs[2] + orbitR, centerY, 0]);
            this.line12.move([laneXs[2], sliderY1, 0]);

            this.coreInterval.transform.scaling = 1.0;
            this.orbitInterval.move([laneXs[3] + orbitR, centerY, 0]);
            this.lineInterval.move([laneXs[3], sliderY1, 0]);

            // 1. Lane 1: Default 60 FPS (Continuous)
            const anim60 = new CustomAnimation((t) => {
                this.telemetry[0].stepCount++;
                const angle = t * Math.PI * 2;
                this.orbit60.move([laneXs[0] + Math.cos(angle) * orbitR, centerY + Math.sin(angle) * orbitR, 0]);
                const s = 1.0 + Math.sin(t * Math.PI * 4) * 0.25;
                this.core60.transform.scaling = s;
                const sliderY = sliderY1 + (sliderY2 - sliderY1) * (0.5 - 0.5 * Math.cos(angle));
                this.line60.move([laneXs[0], sliderY, 0]);
            }, { duration, rate_func: Rate.linear() });

            // 2. Lane 2: 24 FPS (Film Motion) configured directly via AnimOptions
            const anim24 = new CustomAnimation((t) => {
                this.telemetry[1].stepCount++;
                const angle = t * Math.PI * 2;
                this.orbit24.move([laneXs[1] + Math.cos(angle) * orbitR, centerY + Math.sin(angle) * orbitR, 0]);
                this.core24.transform.rotateZ(0.04);
                const sliderY = sliderY1 + (sliderY2 - sliderY1) * (0.5 - 0.5 * Math.cos(angle));
                this.line24.move([laneXs[1], sliderY, 0]);
            }, { duration, fps: 24, rate_func: Rate.linear() });

            // 3. Lane 3: 12 FPS (Cel/Anime) configured via play options
            const anim12 = new CustomAnimation((t) => {
                this.telemetry[2].stepCount++;
                const angle = t * Math.PI * 2;
                this.orbit12.move([laneXs[2] + Math.cos(angle) * orbitR, centerY + Math.sin(angle) * orbitR, 0]);
                const s = 1.0 + Math.sin(t * Math.PI * 4) * 0.3;
                this.core12.transform.scaling = s;
                this.core12.transform.rotateZ(-0.06);
                const sliderY = sliderY1 + (sliderY2 - sliderY1) * (0.5 - 0.5 * Math.cos(angle));
                this.line12.move([laneXs[2], sliderY, 0]);
            }, { duration, rate_func: Rate.linear() });

            // 4. Lane 4: 150ms Interval Stepping configured via interval option
            const animInterval = new CustomAnimation((t) => {
                this.telemetry[3].stepCount++;
                const angle = t * Math.PI * 2;
                this.orbitInterval.move([laneXs[3] + Math.cos(angle) * orbitR, centerY + Math.sin(angle) * orbitR, 0]);
                const s = 1.0 + Math.sin(t * Math.PI * 2) * 0.35;
                this.coreInterval.transform.scaling = s;
                const sliderY = sliderY1 + (sliderY2 - sliderY1) * (0.5 - 0.5 * Math.cos(angle));
                this.lineInterval.move([laneXs[3], sliderY, 0]);
            }, { duration, interval: 150, rate_func: Rate.linear() });

            anim12.applyOptions({ fps: 12 });
            animInterval.applyOptions({ interval: 150 });

            // Play all 4 lanes in parallel in a single play() call
            await this.play(anim60, anim24, anim12, animInterval);
        } finally {
            this.isPlaying = false;
        }
    }

    public replay(): void {
        if (this.loopTimer) {
            clearTimeout(this.loopTimer);
            this.loopTimer = null;
        }
        this.runAnimationCycle().catch((err: any) => {
            if (err?.message !== "Scene Reset") {
                console.error("Cycle error:", err);
            }
        });
    }

    public toggleLoop(): void {
        this.autoLoop = !this.autoLoop;
        const btn = document.getElementById("btn-loop-toggle");
        if (btn) {
            btn.innerText = this.autoLoop ? "🔁 Auto-Loop: ON" : "⏸ Auto-Loop: OFF";
            btn.style.color = this.autoLoop ? "#10b981" : "#94a3b8";
            btn.style.borderColor = this.autoLoop ? "rgba(16, 185, 129, 0.4)" : "rgba(255, 255, 255, 0.15)";
        }
        if (this.autoLoop && !this.isPlaying) {
            this.runAnimationCycle().catch((err: any) => {
                if (err?.message !== "Scene Reset") {
                    console.error("Cycle error:", err);
                }
            });
        }
    }

    private mountUI() {
        if (this.uiContainer) return;

        const container = document.createElement("div");
        this.uiContainer = container;
        container.style.cssText = `
            position: absolute;
            top: 20px;
            left: 20px;
            z-index: 100;
            width: 360px;
            background: rgba(10, 14, 26, 0.90);
            backdrop-filter: blur(18px);
            -webkit-backdrop-filter: blur(18px);
            border: 1px solid rgba(255, 255, 255, 0.12);
            border-radius: 16px;
            padding: 18px;
            color: #f8fafc;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            font-size: 12px;
            box-shadow: 0 16px 40px rgba(0, 0, 0, 0.65);
            user-select: none;
        `;

        container.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
                <div>
                    <h2 style="margin: 0; font-size: 15px; font-weight: 700; color: #38bdf8; letter-spacing: -0.2px;">FPS & Interval Play Options</h2>
                    <p style="margin: 2px 0 0; font-size: 11px; color: #94a3b8;">Throttled Cadence • AnimOptions & PlayOptions</p>
                </div>
                <span id="badge-status" style="background: rgba(56, 189, 248, 0.15); border: 1px solid rgba(56, 189, 248, 0.4); color: #38bdf8; padding: 3px 8px; border-radius: 10px; font-size: 10px; font-weight: 600;">Live</span>
            </div>

            <!-- Telemetry Comparison Table -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 14px; background: rgba(255,255,255,0.03); padding: 10px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.06);">
                <div style="border-left: 3px solid #38bdf8; padding-left: 6px;">
                    <span style="font-size: 10px; color: #94a3b8;">60 FPS (Default)</span>
                    <div id="stat-lane-0" style="font-size: 13px; font-weight: 700; color: #38bdf8; margin-top: 1px;">0 steps</div>
                    <span style="font-size: 9px; color: #64748b;">~16.6ms frame tick</span>
                </div>
                <div style="border-left: 3px solid #a855f7; padding-left: 6px;">
                    <span style="font-size: 10px; color: #94a3b8;">24 FPS (Film)</span>
                    <div id="stat-lane-1" style="font-size: 13px; font-weight: 700; color: #a855f7; margin-top: 1px;">0 steps</div>
                    <span style="font-size: 9px; color: #64748b;">41.7ms interval</span>
                </div>
                <div style="border-left: 3px solid #f59e0b; padding-left: 6px;">
                    <span style="font-size: 10px; color: #94a3b8;">12 FPS (Cel/Anime)</span>
                    <div id="stat-lane-2" style="font-size: 13px; font-weight: 700; color: #f59e0b; margin-top: 1px;">0 steps</div>
                    <span style="font-size: 9px; color: #64748b;">83.3ms interval</span>
                </div>
                <div style="border-left: 3px solid #10b981; padding-left: 6px;">
                    <span style="font-size: 10px; color: #94a3b8;">150ms Interval</span>
                    <div id="stat-lane-3" style="font-size: 13px; font-weight: 700; color: #10b981; margin-top: 1px;">0 steps</div>
                    <span style="font-size: 9px; color: #64748b;">6.67 FPS ticks</span>
                </div>
            </div>

            <!-- API Code Sample -->
            <div style="background: rgba(0, 0, 0, 0.4); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 8px; padding: 8px 10px; margin-bottom: 14px; font-family: monospace; font-size: 10.5px; color: #e2e8f0; line-height: 1.45;">
                <div style="color: #64748b;">// 1. Play Options override:</div>
                <div>await this.<span style="color: #38bdf8;">play</span>(anim, { <span style="color: #f59e0b;">fps: 12</span> });</div>
                <div>await this.<span style="color: #38bdf8;">play</span>(anim, { <span style="color: #10b981;">interval: 150</span> });</div>
                <div style="color: #64748b; margin-top: 4px;">// 2. Direct AnimOptions constructor:</div>
                <div>new <span style="color: #a855f7;">Create</span>(shape, { <span style="color: #f59e0b;">fps: 12</span> });</div>
            </div>

            <!-- Controls -->
            <div style="display: flex; gap: 8px;">
                <button id="btn-replay" style="flex: 1; padding: 8px 12px; border-radius: 8px; border: 1px solid rgba(56, 189, 248, 0.4); background: rgba(56, 189, 248, 0.12); color: #38bdf8; font-weight: 600; font-size: 11px; cursor: pointer; transition: all 0.2s;">▶ Replay Cycle</button>
                <button id="btn-loop-toggle" style="flex: 1; padding: 8px 12px; border-radius: 8px; border: 1px solid rgba(16, 185, 129, 0.4); background: rgba(16, 185, 129, 0.12); color: #10b981; font-weight: 600; font-size: 11px; cursor: pointer; transition: all 0.2s;">🔁 Auto-Loop: ON</button>
            </div>
        `;

        compactDemoPanel(container, "Cadence controls & live telemetry");
        document.body.appendChild(container);

        container.querySelector("#btn-replay")?.addEventListener("click", () => this.replay());
        container.querySelector("#btn-loop-toggle")?.addEventListener("click", () => this.toggleLoop());
    }

    private updateTelemetryUI() {
        if (!this.uiContainer) return;

        for (let i = 0; i < 4; i++) {
            const el = this.uiContainer.querySelector(`#stat-lane-${i}`);
            if (el) {
                el.textContent = `${this.telemetry[i].stepCount} steps`;
            }
        }
    }

    public override async reset(): Promise<void> {
        if (this.loopTimer) {
            clearTimeout(this.loopTimer);
            this.loopTimer = null;
        }
        if (this.uiContainer && this.uiContainer.parentNode) {
            this.uiContainer.parentNode.removeChild(this.uiContainer);
            this.uiContainer = null;
        }
        this.isPlaying = false;
        await super.reset();
    }

    public override destroy(): void {
        if (this.loopTimer) {
            clearTimeout(this.loopTimer);
            this.loopTimer = null;
        }
        if (this.uiContainer && this.uiContainer.parentNode) {
            this.uiContainer.parentNode.removeChild(this.uiContainer);
            this.uiContainer = null;
        }
        this.isPlaying = false;
        super.destroy();
    }
}
