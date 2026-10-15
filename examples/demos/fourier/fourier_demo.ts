// =========================================================================
// File: examples/demos/fourier/fourier_demo.ts
//
// Fourier Epicycles Path Drawing Demo
// Fourier solver -> Arrow entities -> Optional Circles -> Diminishing TracePath
// =========================================================================

import {
    Scene,
    Color,
    Camera2DController
} from "retiam";
import {
    FourierEpicycles,
    FourierPresets
} from "./index";
import { demoBackground } from "../../shared/presentation";

export default class FourierDemoScene extends Scene {
    private fourier!: FourierEpicycles;
    private uiContainer: HTMLElement | null = null;
    private _fourierPaused: boolean = false;
    private currentSpeed: number = 0.05;
    private currentAge: number = 25000;

    public async run() {
        // 1. Camera
        this.camera.position.set([0, 0, 2005]);
        let controller = new Camera2DController(this, this.camera);
        this.clearColor(demoBackground());

        // 2. Fourier Epicycles with Arrow entities, optional Circles, and diminishing TracePath
        this.fourier = new FourierEpicycles(FourierPresets.IndiaMap, {
            harmonics: 2,
            scale: 38,
            tipType: 'triangle',
            showCircles: true,
            circleStroke: new Color(0.55, 0.75, 1.0, 0.22),
            circleStrokeWidth: 0.06,
            vectorStroke: new Color(0.95, 0.98, 1.0, 0.85),
            vectorStrokeWidth: 0.1,
            arrowHeadLength: 0.75,
            arrowHeadWidth: 0.25,
            age: this.currentAge, // Trace lifetime in ms (25s ensures complete outline persists)
            traceColor: new Color(1.0, 0.9, 0.25, 1.0),
            traceStrokeWidth: 2.8,
            speed: this.currentSpeed,
            loop: true,
        });

        this.add(this.fourier);

        this.always((time, dt) => {
            let current = this.fourier.harmonics;
            if (current >= 600) return;

            // Smoothly increase harmonics continuously over time (e.g. 1.5 harmonics per second)
            current = Math.pow(time, 1.5) / 40000;
            if (current > 600) current = 600;

            this.fourier.setHarmonics(current);
            this.currentSpeed += (dt / 200000);
            this.fourier.setSpeed(this.currentSpeed);

            if (this.currentAge > 9000) {
                this.currentAge -= (dt / 2);
                this.fourier.setAge(this.currentAge)
            }


            if (this.uiContainer) {
                const slider = this.uiContainer.querySelector<HTMLInputElement>("#fourier-harmonics-slider");
                // Only update slider value if it's not being actively dragged
                if (slider && document.activeElement !== slider) {
                    slider.value = String(Math.floor(current));
                }

                const displayVal = Math.floor(current);
                const val = this.uiContainer.querySelector("#fourier-harmonics-val");
                const badge = this.uiContainer.querySelector("#fourier-badge");
                if (val) val.textContent = String(displayVal);
                if (badge) badge.textContent = `${displayVal} Harmonics`;

                const ageSlider = this.uiContainer.querySelector<HTMLInputElement>("#fourier-age-slider");
                if (ageSlider && document.activeElement !== ageSlider) {
                    ageSlider.value = String(Math.floor(this.currentAge));
                }
                const ageVal = this.uiContainer.querySelector("#fourier-age-val");
                if (ageVal) ageVal.textContent = `${(this.currentAge / 1000).toFixed(1)}s`;
            }
        });

        // this.always(() => {
        //     let tip = this.fourier.localToWorld(this.fourier.getTip());
        //     this.camera.position.set(tip.x, tip.y, 2005);
        // }
        // )

        // Camera follow runs in 'post' phase after fourier entity has moved this frame
        this.always(
            () => controller.follow(this.fourier.localToWorld(this.fourier.getTip()), { damping: 1 }),
            { phase: 'post' }
        );

        // 3. Simple UI
        this.mountUI();

        // 4. Invalidate canvas for rendering every frame
        this.always(() => this.invalidate());

        // Throttle DOM stats UI updates to every 100ms (10 Hz) instead of every frame
        this.always(() => this.updateStatsUI(), { interval: 100 });
    }

    private mountUI() {
        if (typeof document === 'undefined') return;

        const existing = document.getElementById("fourier-demo-ui");
        if (existing) existing.remove();

        const container = document.createElement("div");
        container.id = "fourier-demo-ui";
        container.style.cssText = `
            position: absolute;
            top: 20px;
            left: 20px;
            z-index: 100;
            width: 280px;
            background: rgba(12, 14, 24, 0.85);
            backdrop-filter: blur(14px);
            border: 1px solid rgba(255, 255, 255, 0.12);
            border-radius: 12px;
            padding: 16px;
            color: #eceff4;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            font-size: 13px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
            user-select: none;
        `;

        container.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
                <div>
                    <h2 style="margin: 0; font-size: 16px; font-weight: 700; color: #ffd700;">Fourier Epicycles</h2>
                    <p style="margin: 2px 0 0; font-size: 11px; color: #8892b0;">Arrows + TracePath</p>
                </div>
                <span id="fourier-badge" style="background: rgba(255, 215, 0, 0.15); border: 1px solid rgba(255, 215, 0, 0.4); color: #ffd700; padding: 2px 8px; border-radius: 10px; font-size: 10px; font-weight: 600;">2 Harmonics</span>
            </div>

            <!-- Shape Selector -->
            <div style="margin-bottom: 12px;">
                <label style="display: block; font-size: 11px; color: #7f8fa6; margin-bottom: 4px; font-weight: 600; text-transform: uppercase;">Path Shape</label>
                <select id="fourier-shape-select" style="width: 100%; padding: 6px 8px; background: #1a1d2e; border: 1px solid #2e3450; border-radius: 6px; color: #fff; font-size: 12px; outline: none; cursor: pointer;">
                    <option value="india" selected>🇮🇳 India Map</option>
                    <option value="musical_note">🎵 Musical Note</option>
                    <option value="treble_clef">🎼 Treble Clef</option>
                    <option value="heart">❤️ Heart</option>
                    <option value="star">⭐ Star</option>
                    <option value="infinity">♾️ Infinity</option>
                    <option value="pi">π Pi</option>
                </select>
            </div>

            <!-- Harmonics Slider -->
            <div style="margin-bottom: 12px;">
                <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 4px;">
                    <span style="color: #7f8fa6; font-weight: 600; text-transform: uppercase;">Harmonics</span>
                    <span id="fourier-harmonics-val" style="color: #00d2ff; font-weight: 600;">2</span>
                </div>
                <input id="fourier-harmonics-slider" type="range" min="1" max="600" value="2" style="width: 100%; cursor: pointer; accent-color: #00d2ff;">
            </div>

            <!-- Arrow Tip Style Selector -->
            <div style="margin-bottom: 12px;">
                <label style="display: block; font-size: 11px; color: #7f8fa6; margin-bottom: 4px; font-weight: 600; text-transform: uppercase;">Arrow Tip Style</label>
                <select id="fourier-tip-select" style="width: 100%; padding: 6px 8px; background: #1a1d2e; border: 1px solid #2e3450; border-radius: 6px; color: #fff; font-size: 12px; outline: none; cursor: pointer;">
                    <option value="line">Line (&gt;)</option>
                    <option value="triangle" selected>Triangle (▲)</option>
                    <option value="stealth">Stealth Wing</option>
                </select>
            </div>

            <!-- Trace Age (Lifetime) Slider -->
            <div style="margin-bottom: 12px;">
                <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 4px;">
                    <span style="color: #7f8fa6; font-weight: 600; text-transform: uppercase;">Trace Age</span>
                    <span id="fourier-age-val" style="color: #ffd700; font-weight: 600;">25.0s</span>
                </div>
                <input id="fourier-age-slider" type="range" min="500" max="100000" step="500" value="25000" style="width: 100%; cursor: pointer; accent-color: #ffd700;">
            </div>

            <!-- Show Circles & Flip Y Toggles -->
            <div style="margin-bottom: 12px; display: flex; justify-content: space-between;">
                <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 12px;">
                    <input id="fourier-tog-circles" type="checkbox" checked style="cursor: pointer; accent-color: #00d2ff;"> Show Circles
                </label>
                <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 12px;">
                    <input id="fourier-tog-flip-y" type="checkbox" style="cursor: pointer; accent-color: #00d2ff;"> Flip Y
                </label>
            </div>

            <!-- Playback Controls -->
            <div style="display: flex; gap: 8px; margin-bottom: 10px;">
                <button id="fourier-btn-pause" style="flex: 1; padding: 6px; background: #2e3450; border: none; border-radius: 6px; color: #fff; font-size: 12px; cursor: pointer; font-weight: 600;">⏸ Pause</button>
                <button id="fourier-btn-restart" style="padding: 6px 12px; background: #1e2238; border: 1px solid #2e3450; border-radius: 6px; color: #eceff4; font-size: 12px; cursor: pointer;">🔄 Reset</button>
            </div>

            <!-- Live Status -->
            <div style="background: rgba(0, 0, 0, 0.3); border-radius: 6px; padding: 8px; font-size: 11px; color: #8892b0; font-family: monospace;">
                Phase (t): <span id="fourier-stat-t" style="color: #fff;">0.0%</span>
            </div>
        `;

        document.body.appendChild(container);
        this.uiContainer = container;

        this.bindUIEvents(container);
    }

    private bindUIEvents(container: HTMLElement) {
        // Shape selector
        const shapeSelect = container.querySelector<HTMLSelectElement>("#fourier-shape-select");
        shapeSelect?.addEventListener("change", (e) => {
            const val = (e.target as HTMLSelectElement).value;
            switch (val) {
                case "musical_note":
                    this.fourier.setPath(FourierPresets.MusicalNote, 40);
                    break;
                case "india":
                    this.fourier.setPath(FourierPresets.IndiaMap, 38);
                    break;
                case "treble_clef":
                    this.fourier.setPath(FourierPresets.TrebleClef, 44);
                    break;
                case "heart":
                    this.fourier.setPath(FourierPresets.getHeartPoints(512), 36);
                    break;
                case "star":
                    this.fourier.setPath(FourierPresets.getStarPoints(10, 20, 8), 34);
                    break;
                case "infinity":
                    this.fourier.setPath(FourierPresets.getInfinityPoints(512), 40);
                    break;
                case "pi":
                    this.fourier.setPath(FourierPresets.PiSymbol, 38);
                    break;
            }
        });

        // Harmonics slider
        const harmonicsSlider = container.querySelector<HTMLInputElement>("#fourier-harmonics-slider");
        const harmonicsVal = container.querySelector("#fourier-harmonics-val");
        const badge = container.querySelector("#fourier-badge");

        harmonicsSlider?.addEventListener("input", (e) => {
            const val = parseInt((e.target as HTMLInputElement).value, 10);
            if (harmonicsVal) harmonicsVal.textContent = String(val);
            if (badge) badge.textContent = `${val} Harmonics`;
            this.fourier.setHarmonics(val);
        });

        // Arrow Tip Style selector
        const tipSelect = container.querySelector<HTMLSelectElement>("#fourier-tip-select");
        tipSelect?.addEventListener("change", (e) => {
            const val = (e.target as HTMLSelectElement).value as any;
            this.fourier.setTipType(val);
        });

        // Trace Age slider
        const ageSlider = container.querySelector<HTMLInputElement>("#fourier-age-slider");
        const ageVal = container.querySelector("#fourier-age-val");
        ageSlider?.addEventListener("input", (e) => {
            const val = parseInt((e.target as HTMLInputElement).value, 10);
            if (ageVal) ageVal.textContent = `${(val / 1000).toFixed(1)}s`;
            this.fourier.setAge(val);
        });

        // Show Circles toggle
        const togCircles = container.querySelector<HTMLInputElement>("#fourier-tog-circles");
        togCircles?.addEventListener("change", (e) => {
            this.fourier.setShowCircles((e.target as HTMLInputElement).checked);
        });

        // Flip Y toggle
        const togFlipY = container.querySelector<HTMLInputElement>("#fourier-tog-flip-y");
        togFlipY?.addEventListener("change", (e) => {
            this.fourier.setFlipY((e.target as HTMLInputElement).checked);
        });

        // Play/Pause
        const btnPause = container.querySelector<HTMLButtonElement>("#fourier-btn-pause");
        btnPause?.addEventListener("click", () => {
            this._fourierPaused = !this._fourierPaused;
            if (this._fourierPaused) {
                this.fourier.setSpeed(0);
                btnPause.textContent = "▶ Resume";
            } else {
                this.fourier.setSpeed(this.currentSpeed);
                btnPause.textContent = "⏸ Pause";
            }
        });

        // Reset
        const btnRestart = container.querySelector<HTMLButtonElement>("#fourier-btn-restart");
        btnRestart?.addEventListener("click", () => {
            this.fourier.resetTrace();
            this.fourier.setProgress(0);
        });
    }

    private updateStatsUI() {
        if (!this.uiContainer) return;
        const statT = this.uiContainer.querySelector("#fourier-stat-t");
        if (statT) {
            statT.textContent = `${(this.fourier.getProgress() * 100).toFixed(1)}%`;
        }
    }
}
