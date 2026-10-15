import { CENTER, Color, OrbitCameraController, ParametricModel, Rate, Scene, SDFText, Vec3 } from "retiam";
import { demoBackground } from "../../shared/presentation";

export default class MatFoldingProceduralDemo extends Scene {
    private mat!: ParametricModel;
    private modeBadge!: SDFText;
    private statsBadge!: SDFText;

    private currentMode: number = 0;
    private modeNames = [
        "1. Yoga Mat Continuous Roll (Arc-Length Conserving)",
        "2. 180° Book / Flap Fold (Smooth Cylindrical Spine)",
        "3. Accordion Pleats (Dynamic Wavelength Compression)",
        "4. Diagonal Origami Corner Fold"
    ];

    private autoPlay: boolean = true;
    private animTime: number = 0;
    private manualT: number = 0.0;
    private isManual: boolean = false;

    public async run() {
        this.camera.position.set([12, 14, 20]);
        new OrbitCameraController(this, this.camera, { targetCenter: new Vec3(0, 1.5, 0), radius: 22 });
        this.clearColor(demoBackground());

        // -------------------------------------------------------------
        // UI Titles & Badges
        // -------------------------------------------------------------
        const title = new SDFText("Procedural Vertex Animation • 3D Mat Folding", {
            anchor: CENTER,
            position: [0, 43, 0],
            fontSize: 5.4
        });
        title.paint.fill = new Color(0.95, 0.96, 1.0, 1.0);
        this.add(title);
        title.setAsUI();

        const subtitle = new SDFText("Direct In-Place WebGPU Buffer Updates  •  Single Entity  •  No Auto-Morph", {
            anchor: CENTER,
            position: [0, 38, 0],
            fontSize: 3.8
        });
        subtitle.paint.fill = Color.fromHex("#5CD0B3");
        this.add(subtitle);
        subtitle.setAsUI();

        this.modeBadge = new SDFText(this.modeNames[0], {
            anchor: CENTER,
            position: [0, 32.5, 0],
            fontSize: 4.0
        });
        this.modeBadge.paint.fill = Color.fromHex("#29ABCA");
        this.add(this.modeBadge);
        this.modeBadge.setAsUI();

        this.statsBadge = new SDFText("Fold Progress: 0%  |  Vertices: 4,753  |  60 FPS In-Place VRAM Upload", {
            anchor: CENTER,
            position: [0, -42, 0],
            fontSize: 3.4
        });
        this.statsBadge.paint.fill = new Color(0.7, 0.75, 0.85, 1.0);
        this.add(this.statsBadge);
        this.statsBadge.setAsUI();

        // -------------------------------------------------------------
        // Single Mat Entity (High Resolution 96 x 48 Grid)
        // -------------------------------------------------------------
        const uSegs = 96;
        const vSegs = 48;
        const L = 14.0; // Mat length (along U)
        const W = 7.0;  // Mat width (along V)

        // Initial flat surface
        this.mat = new ParametricModel((u, v) => this.evalFold(u, v, 0.0, 0, L, W), {
            uSegments: uSegs,
            vSegments: vSegs,
            color: Color.fromHex("#29ABCA"),
            checkerboardColors: [Color.fromHex("#29ABCA"), Color.fromHex("#134E5E")],
            label: "Procedural Mat"
        });
        this.add(this.mat);

        // -------------------------------------------------------------
        // Floating HTML Control Panel
        // -------------------------------------------------------------
        this.setupHTMLControls();

        // -------------------------------------------------------------
        // Frame-by-Frame Programmatic Vertex Animation Loop
        // -------------------------------------------------------------
        this.always((_time: number, dt: number) => {
            let t = this.manualT;

            if (this.autoPlay) {
                this.animTime += dt * 0.0009;
                // Triangle wave oscillation 0 -> 1 -> 0 over each cycle
                const cycle = this.animTime % 2.0;
                t = cycle < 1.0 ? cycle : 2.0 - cycle;
                // Smooth easing
                t = Rate.easeInOutCubic()(t);

                // Auto switch mode every complete cycle
                const newMode = Math.floor((this.animTime / 2.0)) % this.modeNames.length;
                if (newMode !== this.currentMode) {
                    this.currentMode = newMode;
                    this.modeBadge.setText(this.modeNames[this.currentMode]);
                    this.updateHTMLActiveButton();
                }
            }

            // Directly compute and upload the entire vertex mesh to WebGPU VRAM in-place!
            this.mat.updateSurface((u, v) => this.evalFold(u, v, t, this.currentMode, L, W));

            const pct = Math.round(t * 100);
            this.statsBadge.setText(`Fold Progress: ${pct}%  |  Vertices: ${(uSegs + 1) * (vSegs + 1)}  |  Mode: ${this.currentMode + 1}/4`);
            this.updateHTMLSlider(t);
        });
    }

    /**
     * Pure kinematic evaluation of vertex position p(u, v, t) for each folding routine.
     */
    private evalFold(u: number, v: number, t: number, mode: number, L: number, W: number): Vec3 {
        const z = (v - 0.5) * W;

        switch (mode) {
            // ---------------------------------------------------------
            // Mode 0: Physical Arc-Length Preserving Yoga Mat Roll
            // ---------------------------------------------------------
            case 0: {
                if (t <= 0.0001) {
                    return new Vec3((u - 0.5) * L, 0.0, z);
                }

                // Fraction of length rolled up
                const rollFraction = t * 0.88;
                const rollStartU = 1.0 - rollFraction;

                if (u <= rollStartU) {
                    // Unrolled flat portion on the floor
                    const x = (u - 0.5) * L;
                    return new Vec3(x, 0.0, z);
                } else {
                    // Rolled up portion wrapping around a spiral
                    const s = (u - rollStartU) * L; // arc-length along roll

                    // Archimedean spiral: radius grows slightly as more layers accumulate
                    const R_base = 0.55;
                    const layerThickness = 0.045;
                    const turns = s / (2.0 * Math.PI * R_base);
                    const R = R_base + turns * layerThickness;

                    const theta = s / R;
                    const rollPivotX = (rollStartU - 0.5) * L;

                    // Circle/spiral tangent to floor at rollPivotX
                    const x = rollPivotX + R * Math.sin(theta);
                    const y = R * (1.0 - Math.cos(theta));
                    return new Vec3(x, y, z);
                }
            }

            // ---------------------------------------------------------
            // Mode 1: 180° Book / Flap Fold with Smooth Cylindrical Spine
            // ---------------------------------------------------------
            case 1: {
                const hingeU = 0.5;
                const hingeX = 0.0;
                const bendAngle = t * Math.PI; // 0 to 180 degrees
                const bendRadius = 0.55;

                if (u <= hingeU) {
                    // Left half remains stationary on the floor
                    const x = (u - hingeU) * L;
                    return new Vec3(x, 0.0, z);
                } else {
                    // Right half rotates around hinge arc
                    const distFromHinge = (u - hingeU) * L;
                    const arcLength = bendAngle * bendRadius;

                    if (bendAngle < 0.01) {
                        return new Vec3(distFromHinge, 0.0, z);
                    }

                    if (distFromHinge <= arcLength) {
                        // On the circular curved spine
                        const phi = distFromHinge / bendRadius;
                        const x = hingeX + bendRadius * Math.sin(phi);
                        const y = bendRadius * (1.0 - Math.cos(phi));
                        return new Vec3(x, y, z);
                    } else {
                        // Straight flap section extending beyond the spine curve
                        const straightDist = distFromHinge - arcLength;
                        const spineEndX = hingeX + bendRadius * Math.sin(bendAngle);
                        const spineEndY = bendRadius * (1.0 - Math.cos(bendAngle));

                        // Tangent unit vector at end of spine curve
                        const tangX = Math.cos(bendAngle);
                        const tangY = Math.sin(bendAngle);

                        const x = spineEndX + straightDist * tangX;
                        const y = spineEndY + straightDist * tangY;
                        return new Vec3(x, y, z);
                    }
                }
            }

            // ---------------------------------------------------------
            // Mode 2: Dynamic Accordion Wave Pleats (Continuous Compression)
            // ---------------------------------------------------------
            case 2: {
                const pleats = 4.0;
                // Horizontal compression as folds deepen
                const compress = 1.0 - t * 0.65;
                const x = (u - 0.5) * L * compress;

                // Pleat height grows with t
                const wave = Math.sin(u * pleats * Math.PI * 2);
                // Sharpen peaks for crisp origami pleat look
                const sharpWave = Math.sign(wave) * Math.pow(Math.abs(wave), 0.75);
                const y = sharpWave * (t * 2.6);
                return new Vec3(x, y, z);
            }

            // ---------------------------------------------------------
            // Mode 3: Diagonal Origami Corner Fold
            // Rotates the corner flap around a diagonal crease line
            // ---------------------------------------------------------
            case 3:
            default: {
                const rawX = (u - 0.5) * L;
                const rawZ = (v - 0.5) * W;

                // Crease passes through (x0 = 0.1 * L, z0 = -0.5 * W) with 45° angle
                // Crease axis unit vector A = (1, 0, 1) / sqrt(2)
                // In-plane normal unit vector N = (-1, 0, 1) / sqrt(2)
                const diagScale = 1.0 / Math.SQRT2;
                const ax = diagScale;
                const az = diagScale;
                const nx = -diagScale;
                const nz = diagScale;

                // Reference point on crease line
                const p0x = 0.05 * L;
                const p0z = -0.15 * W;

                // Vector from crease reference point
                const dx = rawX - p0x;
                const dz = rawZ - p0z;

                // Perpendicular distance along crease normal
                const distN = dx * nx + dz * nz;
                const distA = dx * ax + dz * az;

                if (distN <= 0.0 || t <= 0.001) {
                    // Unfolded planar base
                    return new Vec3(rawX, 0.0, rawZ);
                } else {
                    // Fold flap rotates around crease axis by angle theta = t * pi
                    const theta = t * Math.PI;
                    const r = distN;

                    // Point in cylindrical coords around crease axis:
                    // Axis position + r * cos(theta) * N + r * sin(theta) * Up
                    const foldedX = p0x + distA * ax + r * Math.cos(theta) * nx;
                    const foldedY = r * Math.sin(theta);
                    const foldedZ = p0z + distA * az + r * Math.cos(theta) * nz;

                    return new Vec3(foldedX, foldedY, foldedZ);
                }
            }
        }
    }

    // -------------------------------------------------------------
    // HTML Interactive Overlay
    // -------------------------------------------------------------
    private setupHTMLControls() {
        const existing = document.getElementById("mat-controls-panel");
        if (existing) existing.remove();

        const panel = document.createElement("div");
        panel.id = "mat-controls-panel";
        panel.style.cssText = `
            position: absolute;
            top: 24px;
            right: 24px;
            background: rgba(14, 18, 26, 0.82);
            backdrop-filter: blur(14px);
            -webkit-backdrop-filter: blur(14px);
            border: 1px solid rgba(255, 255, 255, 0.12);
            border-radius: 14px;
            padding: 20px;
            color: #ffffff;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            width: 290px;
            box-shadow: 0 16px 36px rgba(0, 0, 0, 0.5);
            z-index: 1000;
            user-select: none;
        `;

        panel.innerHTML = `
            <div style="font-size: 14px; font-weight: 700; color: #5CD0B3; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">
                Kinematic Controls
            </div>
            <div style="font-size: 12px; color: #8C99A8; margin-bottom: 16px;">
                Direct Frame-by-Frame Vertex Kinematics
            </div>

            <div style="font-size: 12px; font-weight: 600; margin-bottom: 8px; color: #CBD5E1;">Folding Routines</div>
            <div id="mode-buttons" style="display: flex; flex-direction: column; gap: 7px; margin-bottom: 18px;">
                ${this.modeNames.map((name, i) => `
                    <button id="btn-mode-${i}" style="
                        background: ${i === 0 ? '#29ABCA' : 'rgba(255,255,255,0.06)'};
                        color: ${i === 0 ? '#ffffff' : '#CBD5E1'};
                        border: 1px solid ${i === 0 ? '#29ABCA' : 'rgba(255,255,255,0.1)'};
                        border-radius: 8px;
                        padding: 8px 10px;
                        font-size: 12px;
                        font-weight: 500;
                        text-align: left;
                        cursor: pointer;
                        transition: all 0.18s ease;
                    ">${name}</button>
                `).join('')}
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <span style="font-size: 12px; font-weight: 600; color: #CBD5E1;">Manual Scrub (t)</span>
                <span id="slider-val" style="font-size: 12px; color: #5CD0B3; font-weight: 700;">0%</span>
            </div>
            <input id="fold-slider" type="range" min="0" max="100" value="0" style="
                width: 100%;
                margin-bottom: 16px;
                accent-color: #29ABCA;
                cursor: pointer;
            "/>

            <div style="display: flex; gap: 8px;">
                <button id="btn-toggle-play" style="
                    flex: 1;
                    background: #238636;
                    color: #ffffff;
                    border: none;
                    border-radius: 8px;
                    padding: 8px 12px;
                    font-size: 12px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: background 0.2s ease;
                ">Pause Oscillation</button>
                <button id="btn-reset" style="
                    background: rgba(255,255,255,0.08);
                    color: #CBD5E1;
                    border: 1px solid rgba(255,255,255,0.12);
                    border-radius: 8px;
                    padding: 8px 12px;
                    font-size: 12px;
                    font-weight: 500;
                    cursor: pointer;
                ">Reset</button>
            </div>
        `;

        document.body.appendChild(panel);

        // Bind events
        this.modeNames.forEach((_, i) => {
            const btn = document.getElementById(`btn-mode-${i}`);
            btn?.addEventListener("click", () => {
                this.currentMode = i;
                this.animTime = 0.0;
                this.manualT = 0.0;
                this.modeBadge.setText(this.modeNames[i]);
                this.updateHTMLActiveButton();
            });
        });

        const slider = document.getElementById("fold-slider") as HTMLInputElement;
        slider?.addEventListener("input", (e) => {
            this.autoPlay = false;
            this.updatePlayButtonState();
            const val = parseFloat((e.target as HTMLInputElement).value);
            this.manualT = val / 100.0;
        });

        const btnPlay = document.getElementById("btn-toggle-play");
        btnPlay?.addEventListener("click", () => {
            this.autoPlay = !this.autoPlay;
            this.updatePlayButtonState();
        });

        const btnReset = document.getElementById("btn-reset");
        btnReset?.addEventListener("click", () => {
            this.manualT = 0.0;
            this.animTime = 0.0;
            slider.value = "0";
            document.getElementById("slider-val")!.innerText = "0%";
        });
    }

    private updateHTMLActiveButton() {
        this.modeNames.forEach((_, i) => {
            const btn = document.getElementById(`btn-mode-${i}`);
            if (btn) {
                if (i === this.currentMode) {
                    btn.style.background = "#29ABCA";
                    btn.style.color = "#ffffff";
                    btn.style.borderColor = "#29ABCA";
                } else {
                    btn.style.background = "rgba(255,255,255,0.06)";
                    btn.style.color = "#CBD5E1";
                    btn.style.borderColor = "rgba(255,255,255,0.1)";
                }
            }
        });
    }

    private updateHTMLSlider(t: number) {
        if (this.autoPlay) {
            const slider = document.getElementById("fold-slider") as HTMLInputElement;
            if (slider) slider.value = (t * 100).toFixed(0);
        }
        const valText = document.getElementById("slider-val");
        if (valText) valText.innerText = `${Math.round(t * 100)}%`;
    }

    private updatePlayButtonState() {
        const btn = document.getElementById("btn-toggle-play");
        if (btn) {
            btn.innerText = this.autoPlay ? "Pause Oscillation" : "Resume Oscillation";
            btn.style.background = this.autoPlay ? "#238636" : "#29ABCA";
        }
    }
}
