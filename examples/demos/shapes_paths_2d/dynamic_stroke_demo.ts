// =========================================================================
// File: examples/demos/shapes_paths_2d/dynamic_stroke_demo.ts
// =========================================================================

import {
    Scene,
    Camera2DController,
    Color,
    Path,
    Circle,
    Line,
    SDFText,
    PathEffect,
    hex,
    CENTER,
    LEFT,
    Rate,
    CapType,
    Create
} from "retiam";
import { demoBackground } from "../../shared/presentation";

/**
 * Dynamic Line Weight & Artistic Stroke Demonstration Scene
 *
 * Demonstrates the physically modeled procedural dynamic line weight path effect:
 * 1. Five expressive presets: Master Dynamic Stroke, Calligraphic Nib, Sumi-e Brush, Spontaneous Gesture, Fluid Ribbon.
 * 2. Complex calligraphic flourish curves with dramatic hairline-to-swell dynamic range.
 * 3. Closed geometric curves (circles, loops) that breathe with living weight.
 * 4. Chained dynamic stroke with color gradients and luminous glow.
 * 5. Animated real-time progressive drawing of a calligraphic path.
 */
export default class DynamicStrokeDemoScene extends Scene {
    public async run() {
        this.disablePlayer();

        // 1. Camera & Obsidian Substrate
        this.camera.position.set([0, 0, 76]);
        new Camera2DController(this, this.camera);
        // Deep obsidian canvas substrate
        this.clearColor(demoBackground());

        // 2. Typographic Header (Floating cleanly in space)
        const headerTitle = new SDFText("DYNAMIC LINE WEIGHT PATH EFFECT", {
            fontSize: 2.2,
            anchor: CENTER,
            position: [0, 28.5, 0],
            fill: hex("#f8fafc")
        });
        this.add(headerTitle);

        const headerSubtitle = new SDFText(
            "Artistic, Fluid, Organic, Soulful & Spontaneous • Muscular Cadence • Multi-Harmonic Turbulence • Calligraphic Tapers • Ink Pooling",
            {
                fontSize: 0.92,
                anchor: CENTER,
                position: [0, 25.2, 0],
                fill: hex("#94a3b8")
            }
        );
        this.add(headerSubtitle);

        // Divider hairlines
        const headerLine = new Line([[-50, 23.6, 0], [50, 23.6, 0]], {
            stroke: hex("#1e293b"),
            strokeWidth: 0.06
        });
        this.add(headerLine);

        const centerDivider = new Line([[2, 22.0, 0], [2, -31.0, 0]], {
            stroke: hex("#1e293b"),
            strokeWidth: 0.05
        });
        this.add(centerDivider);

        // =====================================================================
        // SECTION 1: THE 5 ARTISTIC PRESETS (Left Column)
        // =====================================================================

        const col1Header = new SDFText("EXPRESSIVE ARTISTIC PRESETS", {
            fontSize: 1.25,
            anchor: LEFT,
            position: [-50, 21.0, 0],
            fill: hex("#38bdf8")
        });
        this.add(col1Header);

        const labelDynamic = new SDFText("1. Rough Sketch / Excalidraw Style : PathEffect.Sketch()", {
            fontSize: 0.90,
            anchor: LEFT,
            position: [-50, 18.2, 0],
            fill: hex("#f1f5f9")
        });
        this.add(labelDynamic);

        const descDynamic = new SDFText(
            "Sketch pen: width swells randomly between 50% and 100% of the stroke, lighter where the pen lands and lifts",
            { fontSize: 0.68, anchor: LEFT, position: [-50, 16.8, 0], fill: hex("#64748b") }
        );
        this.add(descDynamic);

        const curveDynamic = new Path("M -50 13.8 C -38 19.8, -26 7.8, -1 13.8", {
            strokeShader: PathEffect.Sketch({
                variation: 1.2,
                wavelength: 9,
                rampLength: 5
            })
        });
        curveDynamic.paint.setStroke(1.7, hex("#38bdf8"));
        curveDynamic.paint.setCap(CapType.ROUND);
        this.add(curveDynamic);

        // Preset 2: Calligraphic Nib
        const labelCallig = new SDFText("2. Flexible Calligraphic Nib : PathEffect.Calligraphic()", {
            fontSize: 0.90,
            anchor: LEFT,
            position: [-50, 9.8, 0],
            fill: hex("#f472b6")
        });
        this.add(labelCallig);

        const descCallig = new SDFText(
            "Flexible nib tilt: razor-thin hairlines, dramatic asymmetric flex (0.65), and expressive variation (1.8)",
            { fontSize: 0.68, anchor: LEFT, position: [-50, 8.4, 0], fill: hex("#64748b") }
        );
        this.add(descCallig);

        const curveCallig = new Path("M -50 5.4 C -38 11.4, -26 -0.6, -1 5.4", {
            strokeShader: PathEffect.Calligraphic({
                variation: 1.8,  // direct line weight variation scaling
                frequency: 2.0   // wave frequency along the curve
            })
        });
        curveCallig.paint.setStroke(1.6, hex("#f472b6"));
        curveCallig.paint.setCap(CapType.ROUND);
        this.add(curveCallig);

        // Preset 3: Japanese Sumi-e / Watercolor Brush
        const labelBrush = new SDFText("3. Sumi-e Ink Brush : PathEffect.Brush()", {
            fontSize: 0.90,
            anchor: LEFT,
            position: [-50, 1.4, 0],
            fill: hex("#34d399")
        });
        this.add(labelBrush);

        const descBrush = new SDFText(
            "Bristle drag dynamics: rich pigment pooling in wide swells, soft feathering, and non-mirror edges",
            { fontSize: 0.68, anchor: LEFT, position: [-50, 0.0, 0], fill: hex("#64748b") }
        );
        this.add(descBrush);

        const curveBrush = new Path("M -50 -3.0 C -38 3.0, -26 -9.0, -1 -3.0", {
            strokeShader: PathEffect.Brush()
        });
        curveBrush.paint.setStroke(1.65, hex("#34d399"));
        curveBrush.paint.setCap(CapType.ROUND);
        this.add(curveBrush);

        // Preset 4: Spontaneous Gesture
        const labelSpon = new SDFText("4. Spontaneous Gesture : PathEffect.Spontaneous()", {
            fontSize: 0.90,
            anchor: LEFT,
            position: [-50, -7.0, 0],
            fill: hex("#fbbf24")
        });
        this.add(labelSpon);

        const descSpon = new SDFText(
            "Lively sketch dynamics: decorrelated top/bottom fractal turbulence (0.85) and spontaneous impulses",
            { fontSize: 0.68, anchor: LEFT, position: [-50, -8.4, 0], fill: hex("#64748b") }
        );
        this.add(descSpon);

        const curveSpon = new Path("M -50 -11.4 C -38 -5.4, -26 -17.4, -1 -11.4", {
            strokeShader: PathEffect.Spontaneous()
        });
        curveSpon.paint.setStroke(1.45, hex("#fbbf24"));
        curveSpon.paint.setCap(CapType.ROUND);
        this.add(curveSpon);

        // Preset 5: Silky Liquid Fluid
        const labelFluid = new SDFText("5. Silky Liquid Ribbon : PathEffect.Fluid()", {
            fontSize: 0.90,
            anchor: LEFT,
            position: [-50, -15.4, 0],
            fill: hex("#a78bfa")
        });
        this.add(labelFluid);

        const descFluid = new SDFText(
            "Undulating stream: high fluidity (0.92), gentle asymmetric breathing, and zero synthetic oscillation",
            { fontSize: 0.68, anchor: LEFT, position: [-50, -16.8, 0], fill: hex("#64748b") }
        );
        this.add(descFluid);

        const curveFluid = new Path("M -50 -19.8 C -38 -13.8, -26 -25.8, -1 -19.8", {
            strokeShader: PathEffect.Fluid()
        });
        curveFluid.paint.setStroke(1.45, hex("#a78bfa"));
        curveFluid.paint.setCap(CapType.ROUND);
        this.add(curveFluid);

        // =====================================================================
        // SECTION 2: LIVING CALLIGRAPHY & GEOMETRY (Right Column)
        // =====================================================================

        const col2Header = new SDFText("LIVING CALLIGRAPHY & GEOMETRY", {
            fontSize: 1.25,
            anchor: LEFT,
            position: [6, 21.0, 0],
            fill: hex("#38bdf8")
        });
        this.add(col2Header);

        // A. Breathing Calligraphic Circle
        const labelCircle = new SDFText("Breathing Circle & Ink Surface Tension", {
            fontSize: 0.85,
            anchor: LEFT,
            position: [6, 18.2, 0],
            fill: hex("#e2e8f0")
        });
        this.add(labelCircle);

        const dynamicCircle = new Circle(4.5, {
            strokeShader: PathEffect.Calligraphic({
                frequency: 2.0,
                asymmetry: 0.35,
                inkDensity: 0.5,
                isClosed: true
            })
        });
        dynamicCircle.paint.setStroke(1.2, hex("#38bdf8"));
        dynamicCircle.paint.fill = new Color(0.05, 0.15, 0.25, 0.2);
        dynamicCircle.transform.position.set([15, 11.5, 0]);
        this.add(dynamicCircle);

        // B. Gradient Chained Calligraphic Loop
        const labelGrad = new SDFText("Chained: Gradient + DynamicStroke + Glow", {
            fontSize: 0.85,
            anchor: LEFT,
            position: [28, 18.2, 0],
            fill: hex("#e2e8f0")
        });
        this.add(labelGrad);

        const chainedEffect = PathEffect.Gradient([hex("#38bdf8"), hex("#ec4899"), hex("#fbbf24")])
            .DynamicStroke({ minWidth: 0.08, maxWidth: 0.95, variation: 0.55 })
            .Glow(0.25);

        const gradientLoop = new Path("M 28 8.0 C 33 16.0, 47 16.0, 47 11.5 C 47 7.0, 31 7.0, 31 11.5 C 31 16.0, 45 16.0, 50 8.0", {
            strokeShader: chainedEffect
        });
        gradientLoop.paint.setStroke(1.4, hex("#ffffff"));
        gradientLoop.paint.setCap(CapType.ROUND);
        this.add(gradientLoop);

        // C. Flourished Master Signature Wave
        const labelWave = new SDFText("Flourished Calligraphic Ribbon Knot", {
            fontSize: 0.85,
            anchor: LEFT,
            position: [6, 3.5, 0],
            fill: hex("#e2e8f0")
        });
        this.add(labelWave);

        const signatureWave = new Path(
            "M 6 -4.0 C 14 7.0, 22 -12.0, 30 -3.0 C 38 6.0, 44 -10.0, 50 -3.0",
            {
                strokeShader: PathEffect.Calligraphic({
                    frequency: 2.2,
                    asymmetry: 0.3,
                    inkDensity: 0.6,
                    taper: [0.18, 0.25]
                })
            }
        );
        signatureWave.paint.setStroke(1.6, hex("#fb7185"));
        signatureWave.paint.setCap(CapType.ROUND);
        this.add(signatureWave);

        // D. Animated Calligraphic Drawing
        const labelAnim = new SDFText("Animated Path Creation with Dynamic Line Weight", {
            fontSize: 0.85,
            anchor: LEFT,
            position: [6, -11.0, 0],
            fill: hex("#e2e8f0")
        });
        this.add(labelAnim);

        const animatedPath = new Path(
            "M 6 -19.0 C 16 -12.0, 26 -26.0, 36 -17.0 S 46 -24.0, 50 -18.0",
            {
                strokeShader: PathEffect.Brush({
                    frequency: 1.6,
                    variation: 0.4,
                    inkDensity: 0.5
                })
            }
        );
        animatedPath.paint.setStroke(1.5, hex("#2dd4bf"));
        animatedPath.paint.setCap(CapType.ROUND);
        this.add(animatedPath);

        // Run progressive animated reveal
        await this.play(new Create(animatedPath, {
            duration: 2500,
            rate_func: Rate.easeInOutCubic()
        }));
    }
}
