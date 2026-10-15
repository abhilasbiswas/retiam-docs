// =========================================================================
// File: examples/demos/shapes_paths_2d/chalk_demo.ts
// =========================================================================

import {
    Scene,
    Camera2DController,
    Color,
    Vec3,
    Path,
    Circle,
    Line,
    Arrow,
    Rect,
    SDFText,
    Tex,
    PathEffect,
    hex,
    CENTER,
    LEFT,
    RIGHT,
    Rate,
    CapType,
    JointType
} from "retiam";
import { demoBackground } from "../../shared/presentation";

/**
 * Handwritten Chalk Effect Demonstration & Benchmark Scene
 *
 * Demonstrates the physically modeled procedural chalk path effect on slate:
 * 1. Three distinct physical chalk presets (Standard, Rough, Fine Hagoromo).
 * 2. Blackboard mathematical typography using LaTeX Tex with chalk shader.
 * 3. Continuous cursive handwriting curves with dynamic muscular pressure variations.
 * 4. Geometric construction diagram drawn with chalk strokes.
 * 5. Full pastel colored chalk palette on obsidian slate substrate.
 */
export default class ChalkDemoScene extends Scene {
    public async run() {
        this.disablePlayer();

        // 1. Blackboard Camera & Slate Substrate Palette
        this.camera.position.set([0, 0, 92]);
        new Camera2DController(this, this.camera);
        // Deep classroom blackboard charcoal slate
        this.clearColor(demoBackground());

        // 2. Blackboard Slate Frame & Subtle Boundary Grid
        const blackboardBorder = new Rect(114, 68, { cornerRadius: 0.8 });
        blackboardBorder.paint.fill = new Color(0.028, 0.035, 0.048, 0.6);
        blackboardBorder.paint.setStroke(0.18, hex("#1e293b"));
        blackboardBorder.transform.position.set([0, 0, -1]);
        this.add(blackboardBorder);

        // Slate chalk dust tray / bottom bar
        const chalkTray = new Rect(110, 0.35, { cornerRadius: 0.1 });
        chalkTray.paint.fill = hex("#334155");
        chalkTray.paint.opacity = 0.5;
        chalkTray.transform.position.set([0, -32.5, 0]);
        this.add(chalkTray);

        // 3. Typographic Header (Floating cleanly on blackboard)
        const headerTitle = new SDFText("PROCEDURAL HANDWRITTEN CHALK EFFECT", {
            fontSize: 2.2,
            anchor: CENTER,
            position: [0, 28, 0],
            fill: hex("#f8fafc")
        });
        this.add(headerTitle);

        const headerSubtitle = new SDFText(
            "Physically Modeled Blackboard Simulation • Slate Porosity (fBm) • Hand-Drawn Uneven Bends • Muscular Cadence • Crumbly Edges",
            {
                fontSize: 0.95,
                anchor: CENTER,
                position: [0, 24.8, 0],
                fill: hex("#94a3b8")
            }
        );
        this.add(headerSubtitle);

        // Subtle divider hairline
        const headerLine = new Line([[-50, 23.2, 0], [50, 23.2, 0]], {
            stroke: hex("#1e293b"),
            strokeWidth: 0.06
        });
        this.add(headerLine);

        // Vertical central column separator
        const centerLine = new Line([[2, 21.5, 0], [2, -30, 0]], {
            stroke: hex("#1e293b"),
            strokeWidth: 0.05
        });
        this.add(centerLine);

        // =====================================================================
        // SECTION 1: THE THREE CHALK PRESETS (Left Column)
        // =====================================================================

        const col1Header = new SDFText("CHALK PRESETS & SURFACE DYNAMICS", {
            fontSize: 1.25,
            anchor: LEFT,
            position: [-50, 20.8, 0],
            fill: hex("#38bdf8")
        });
        this.add(col1Header);

        // Preset 1: Standard Classroom Chalk with Hand-Drawn Uneven Bend
        const labelStandard = new SDFText("Standard Chalk — PathEffect.Handwritten()", {
            fontSize: 0.95,
            anchor: LEFT,
            position: [-50, 17.5, 0],
            fill: hex("#f1f5f9")
        });
        this.add(labelStandard);

        const descStandard = new SDFText(
            "Balanced classroom mark: organic hand-drawn uneven bend, core density 0.85, moderate grain & crumbly edges",
            { fontSize: 0.72, anchor: LEFT, position: [-50, 16.0, 0], fill: hex("#64748b") }
        );
        this.add(descStandard);

        const curveStandard = new Path("M -50 12.5 C -38 18.5, -28 6.5, -1 12.5", {
            strokeShader: PathEffect.Handwritten({ grain: 0.65, density: 0.85, jitter: 0.45, pressure: 0.35, wobble: 0.32, coreRatio: 0.45 })
        });
        curveStandard.paint.setStroke(1.15, hex("#f8fafc"));
        curveStandard.paint.setCap(CapType.ROUND);
        this.add(curveStandard);

        // Preset 2: Rough Slate Chalk
        const labelRough = new SDFText("Rough Chalk — PathEffect.RoughChalk()", {
            fontSize: 0.95,
            anchor: LEFT,
            position: [-50, 8.5, 0],
            fill: hex("#fde047")
        });
        this.add(labelRough);

        const descRough = new SDFText(
            "Coarse grain, deep microscopic voids where slate breathes, heavy boundary crumble & wander (jitter 0.65)",
            { fontSize: 0.72, anchor: LEFT, position: [-50, 7.0, 0], fill: hex("#64748b") }
        );
        this.add(descRough);

        const curveRough = new Path("M -50 3.5 C -38 9.5, -28 -2.5, -1 3.5", {
            strokeShader: PathEffect.RoughChalk({ wobble: 0.38, coreRatio: 0.42 })
        });
        curveRough.paint.setStroke(1.35, hex("#fef08a"));
        curveRough.paint.setCap(CapType.ROUND);
        this.add(curveRough);

        // Preset 3: Fine Mathematician's Chalk (Hagoromo style)
        const labelFine = new SDFText("Fine Chalk (Hagoromo) — PathEffect.FineChalk()", {
            fontSize: 0.95,
            anchor: LEFT,
            position: [-50, -0.5, 0],
            fill: hex("#7dd3fc")
        });
        this.add(labelFine);

        const descFine = new SDFText(
            "Silky dense core (0.92), refined micro-grain, subtle hand tremor for formulas & geometric diagrams",
            { fontSize: 0.72, anchor: LEFT, position: [-50, -2.0, 0], fill: hex("#64748b") }
        );
        this.add(descFine);

        const curveFine = new Path("M -50 -5.5 C -38 0.5, -28 -11.5, -1 -5.5", {
            strokeShader: PathEffect.FineChalk({ wobble: 0.20, coreRatio: 0.48 })
        });
        curveFine.paint.setStroke(0.95, hex("#bae6fd"));
        curveFine.paint.setCap(CapType.ROUND);
        this.add(curveFine);

        // =====================================================================
        // SECTION 2: CONTINUOUS CURSIVE FLOW (Bottom Left)
        // =====================================================================

        const cursiveHeader = new SDFText("CONTINUOUS CURSIVE HANDWRITING FLOW", {
            fontSize: 1.15,
            anchor: LEFT,
            position: [-50, -10.5, 0],
            fill: hex("#fb7185")
        });
        this.add(cursiveHeader);

        const cursiveDesc = new SDFText(
            "Natural handwriting cadence: pressure expands downstrokes and eases on fast loops",
            { fontSize: 0.72, anchor: LEFT, position: [-50, -12.0, 0], fill: hex("#64748b") }
        );
        this.add(cursiveDesc);

        // Lemniscate / Figure-8 loop with smooth cubic beziers and organic hand drift
        const cursiveFigure8 = new Path(
            "M -40 -20 C -40 -14, -30 -14, -25 -20 C -20 -26, -10 -26, -10 -20 C -10 -14, -20 -14, -25 -20 C -30 -26, -40 -26, -40 -20",
            { strokeShader: PathEffect.Handwritten({ grain: 0.65, density: 0.88, pressure: 0.45, jitter: 0.45, wobble: 0.25, coreRatio: 0.45, anchorEnds: 0.0 }) }
        );
        cursiveFigure8.paint.setStroke(1.15, hex("#fda4af"));
        cursiveFigure8.paint.setCap(CapType.ROUND);
        cursiveFigure8.paint.setJoint(JointType.ROUND);
        this.add(cursiveFigure8);

        // Infinity symbol + cursive text flourish with natural hand wander
        const flourishPath = new Path(
            "M -46 -28 C -35 -24, -25 -32, -15 -27 S -5 -29, 0 -26",
            { strokeShader: PathEffect.Handwritten({ taperEnds: 0.08, grain: 0.7, density: 0.85, wobble: 0.30, coreRatio: 0.45 }) }
        );
        flourishPath.paint.setStroke(1.05, hex("#f8fafc"));
        flourishPath.paint.setCap(CapType.ROUND);
        this.add(flourishPath);

        // =====================================================================
        // SECTION 3: MATHEMATICAL BLACKBOARD (Top Right Column)
        // =====================================================================

        const col2Header = new SDFText("MATHEMATICAL BLACKBOARD & FORMULAS", {
            fontSize: 1.25,
            anchor: LEFT,
            position: [6, 20.8, 0],
            fill: hex("#34d399")
        });
        this.add(col2Header);

        const mathDesc = new SDFText(
            "LaTeX MathJax vector paths compiled directly with Fine Chalk stroke shading",
            { fontSize: 0.72, anchor: LEFT, position: [6, 19.3, 0], fill: hex("#64748b") }
        );
        this.add(mathDesc);

        // Stokes' Theorem in LaTeX with Fine Chalk shader
        const stokesEquation = new Tex(
            "\\oint_{\\partial \\Sigma} \\mathbf{F} \\cdot d\\mathbf{r} = \\iint_\\Sigma (\\nabla \\times \\mathbf{F}) \\cdot d\\mathbf{S}",
            {
                fontSize: 2.2,
                fill: hex("#f8fafc"),
                strokeShader: PathEffect.FineChalk({ density: 0.95, grain: 0.35 })
            }
        );
        stokesEquation.transform.position.set([6, 15.5, 0]);
        this.add(stokesEquation);

        // Euler's Identity in pastel yellow chalk with subtle hand tremor
        const eulerEquation = new Tex("e^{i\\pi} + 1 = 0", {
            fontSize: 2.2,
            fill: hex("#fef08a"),
            strokeShader: PathEffect.Handwritten({ density: 0.9, grain: 0.4, wobble: 0.22, coreRatio: 0.48 })
        });
        eulerEquation.transform.position.set([6, 10.5, 0]);
        this.add(eulerEquation);

        // Geometric Chalk Construction Diagram
        const geomLabel = new SDFText("Chalk Geometry Diagram:", {
            fontSize: 0.85,
            anchor: LEFT,
            position: [29, 9.5, 0],
            fill: hex("#94a3b8")
        });
        this.add(geomLabel);

        // Chalk Circle with subtle organic wander
        const chalkCircle = new Circle(3.5, {
            strokeShader: PathEffect.FineChalk({ density: 0.9, grain: 0.4, wobble: 0.18, coreRatio: 0.48, anchorEnds: 0.0 })
        });
        chalkCircle.paint.stroke = hex("#38bdf8");
        chalkCircle.paint.strokeWidth = 1.1;
        chalkCircle.paint.fill.a = 0.0;
        chalkCircle.transform.position.set([38, 3.5, 0]);
        this.add(chalkCircle);

        // Diameter secant line: straight vector line with realistic hand-drawn uneven bend
        const chalkDiameter = new Path("M 34.5 3.5 L 41.5 3.5", {
            strokeShader: PathEffect.Handwritten({ wobble: 0.36, wobbleFreq: 1.5, coreRatio: 0.40, grain: 0.5 })
        });
        chalkDiameter.paint.setStroke(0.95, hex("#f8fafc"));
        chalkDiameter.paint.setCap(CapType.ROUND);
        this.add(chalkDiameter);

        // Tangent line in yellow chalk with organic hand bend
        const chalkTangent = new Path("M 41.5 0.0 L 41.5 7.0", {
            strokeShader: PathEffect.Handwritten({ wobble: 0.36, wobbleFreq: 1.3, coreRatio: 0.40, grain: 0.5, density: 0.9 })
        });
        chalkTangent.paint.setStroke(1.0, hex("#fde047"));
        chalkTangent.paint.setCap(CapType.ROUND);
        this.add(chalkTangent);

        // Tangent arrow head
        const chalkArrowHead = new Path("M 40.5 5.7 L 41.5 7.0 L 42.5 5.7", {
            strokeShader: PathEffect.Handwritten({ grain: 0.4, density: 0.95, wobble: 0.24, coreRatio: 0.45 })
        });
        chalkArrowHead.paint.setStroke(0.95, hex("#fde047"));
        chalkArrowHead.paint.setCap(CapType.ROUND);
        chalkArrowHead.paint.setJoint(JointType.ROUND);
        this.add(chalkArrowHead);

        // =====================================================================
        // SECTION 4: PASTEL COLORED CHALK PALETTE (Bottom Right Column)
        // =====================================================================

        const paletteHeader = new SDFText("PASTEL COLORED CHALK PALETTE", {
            fontSize: 1.15,
            anchor: LEFT,
            position: [6, -1.5, 0],
            fill: hex("#f59e0b")
        });
        this.add(paletteHeader);

        const paletteDesc = new SDFText(
            "Authentic matte mineral calcium pigments reflecting softly on dark blackboard substrate",
            { fontSize: 0.72, anchor: LEFT, position: [6, -3.0, 0], fill: hex("#64748b") }
        );
        this.add(paletteDesc);

        const chalkColors = [
            { name: "Calcium White", hex: hex("#f8fafc"), label: "#F8FAFC" },
            { name: "Sunlight Yellow", hex: hex("#fde047"), label: "#FDE047" },
            { name: "Powder Cyan", hex: hex("#38bdf8"), label: "#38BDF8" },
            { name: "Rose Coral", hex: hex("#fb7185"), label: "#FB7185" },
            { name: "Mint Emerald", hex: hex("#34d399"), label: "#34D399" }
        ];

        const startY = -6.5;
        const spacingY = 4.2;

        for (let i = 0; i < chalkColors.length; i++) {
            const item = chalkColors[i];
            const y = startY - i * spacingY;

            // Color label tag
            const tag = new SDFText(`${item.name} (${item.label})`, {
                fontSize: 0.78,
                anchor: LEFT,
                position: [6, y + 1.2, 0],
                fill: item.hex
            });
            this.add(tag);

            // Wavy chalk stroke showcasing the colored chalk texture and hand wander
            const coloredStroke = new Path(
                `M 6 ${y} C 16 ${y + 1.6}, 26 ${y - 1.6}, 36 ${y + 1.2} S 46 ${y - 0.8}, 50 ${y}`,
                {
                    strokeShader: PathEffect.Handwritten({
                        grain: 0.65,
                        density: 0.88,
                        jitter: 0.38,
                        pressure: 0.32,
                        wobble: 0.28,
                        coreRatio: 0.45,
                        seed: i * 7.3
                    })
                }
            );
            coloredStroke.paint.setStroke(1.15, item.hex);
            coloredStroke.paint.setCap(CapType.ROUND);
            this.add(coloredStroke);
        }

        // =====================================================================
        // ANIMATION LOOP: RHYTHMIC CHALK WRITING IN / OUT
        // =====================================================================
        const animPaths = [
            curveStandard,
            curveRough,
            curveFine,
            cursiveFigure8,
            flourishPath
        ];

        // Initial display delay so user can inspect the full scene immediately
        await this.wait(1500);

        // while (true)
        {
            // Erase / trace out progressively
            await this.play(
                animPaths.map(p => p.animate.setT2(1.0).setT1(1.0).getAnim()),
                { duration: 1800, rate_func: Rate.easeInOutCubic() }
            );

            // Reset to empty
            for (const p of animPaths) {
                p.transform.t1 = 0;
                p.transform.t2 = 0;
            }
            this.invalidate();
            await this.wait(400);

            // Draw in all chalk strokes progressively (0% to 100% arc length)
            await this.play(
                animPaths.map(p => p.animate.setT2(1.0).setT1(0.0).getAnim()),
                { duration: 2400, rate_func: Rate.easeInOutCubic() }
            );

        }
    }
}
