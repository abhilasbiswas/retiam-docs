import {
    Scene,
    Color,
    CameraController,
    Axes,
    NumberPlane,
    FunctionGraph2D,
    createAreaUnderCurve,
    createRiemannRectangles,
    Tex,
    Text,
    ValueTracker,
    alwaysRedraw,
    UP,
    DOWN,
    RIGHT,
    LEFT
} from "retiam";
import { PathEffect } from "retiam";
import { FillEffect } from "retiam";
import { demoBackground } from "../../shared/presentation";

/**
 * Feature Showcase:
 * Demonstrates Retiam's dual-primitive ('line3d' vs 'path' analytical)
 * coordinate plotting system and rich stroke/fill shader pipeline.
 */
export default class PrimitiveShaderShowcaseScene extends Scene {
    public async run() {
        this.camera.position.set([0, 0, 25]);
        this.clearColor(demoBackground());
        new CameraController(this, this.camera);

        // 1. Analytical 2D Number Plane with Shader Styling
        const plane = new NumberPlane({
            xRange: [-6, 6, 1],
            yRange: [-4, 4, 1],
            width: 24,
            height: 16,
            primitive: 'path', // Vector Analytical Path primitive
            axisColor: new Color(0.9, 0.95, 1.0, 0.9),
            gridColor: new Color(0.2, 0.5, 0.9, 0.25),
            axisStrokeWidth: 0.05,
            gridStrokeWidth: 0.02,
            showGrid: true,
            showLabels: true
        });
        this.add(plane);

        // 2. High-precision Analytical Function Graph with PathEffect Gradient
        const waveTracker = new ValueTracker(0);
        this.add(waveTracker);

        const gradientPlot = new FunctionGraph2D(plane, (x) => {
            return 1.8 * Math.sin(x * 0.8 + waveTracker.value);
        }, {
            primitive: 'path',
            samples: 250,
            strokeWidth: 0.1,
            pathEffect: PathEffect.Gradient([
                new Color(0.1, 0.9, 1.0, 1.0),  // Neon Cyan
                new Color(0.8, 0.2, 1.0, 1.0),  // Electric Purple
                new Color(1.0, 0.4, 0.6, 1.0)   // Coral Pink
            ])
        });
        this.add(gradientPlot);

        // 3. Shaded Area Under Curve with FillEffect Gradient
        const shadedArea = createAreaUnderCurve(plane, (x) => 1.8 * Math.sin(x * 0.8), {
            xRange: [-Math.PI, Math.PI],
            fillShader: FillEffect.LinearGradient(
                [new Color(0.1, 0.9, 1.0, 0.4), new Color(0.9, 0.1, 0.6, 0.2)],
                0, -2, 0, 2
            ),
            stroke: new Color(0.1, 0.9, 1.0, 0.8),
            strokeWidth: 0.02
        });
        this.add(shadedArea);

        // 4. Riemann Rectangles with Dynamic Fill
        const riemannBars = createRiemannRectangles(plane, (x) => 0.5 * (x * x * 0.2 + Math.cos(x)), {
            xRange: [1, 5],
            dx: 0.4,
            rule: 'trapezoid',
            fillShader: FillEffect.LinearGradient(
                [new Color(0.2, 1.0, 0.5, 0.5), new Color(1.0, 0.8, 0.2, 0.3)],
                1, 0, 5, 3
            ),
            showStroke: true,
            stroke: new Color(0.8, 1.0, 0.8, 0.8),
            strokeWidth: 0.02
        });
        this.add(riemannBars);

        // 5. LaTeX Equations with Analytical Fill Shader
        const titleTex = new Tex("\\int_{-a}^{a} f(x)\\,dx = \\lim_{n \\to \\infty} \\sum_{i=1}^n f(x_i^*)\\,\\Delta x", {
            fontSize: 42,
            fillShader: FillEffect.LinearGradient(
                [new Color(1.0, 0.8, 0.3, 1.0), new Color(1.0, 0.3, 0.7, 1.0)],
                -5, 0, 5, 0
            )
        });
        titleTex.nextTo(plane, UP, 1.0);
        this.add(titleTex);

        // Continuous update loop
        gradientPlot.always(() => gradientPlot.updateGraph());
        this.always(() => this.invalidate());

        await this.wait(1000);
    }
}
