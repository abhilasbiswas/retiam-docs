import { demoBackground, frameContent } from "../../shared/presentation";
// =========================================================================
// File: examples/demos/text/markup_text_demo.ts
// =========================================================================

import {
    Scene,
    CameraController,
    CameraModel,
    MarkupText,
    Write,
    Color,
    Rate,
    hex,
    VBox
} from "retiam";
import { Circumscribe } from "retiam/highlights";

export default class MarkupTextShowcaseScene extends Scene {
    public async run() {
        // 1. Setup Camera and Obsidian Canvas
        this.camera.model = CameraModel.ORTHOGRAPHIC;
        this.camera.position.set([0, 0, 20]);
        this.clearColor(demoBackground());
        new CameraController(this, this.camera);


        // 2. Title Section
        const title = new MarkupText("Mathematical Prose with MarkupText", {
            fontSize: 1.1,
            fill: hex("#38BDF8")
        });

        // 3. Mathematical Paragraph with Mixed Inline and Display LaTeX
        const paragraphContent =
            "Suppose we have a continuous function $f(x) = \\frac{x^2}{2}$ defined over the real domain $[0, 2]$. " +
            "To determine the cumulative area under its parabolic profile, we compute the definite Riemann integral: " +
            "$$\\int_{0}^{2} \\frac{x^2}{2} \\, dx = \\left[ \\frac{x^3}{6} \\right]_{0}^{2} = \\frac{4}{3} \\approx 1.333$$ " +
            "Because $\\frac{df}{dx} = x > 0$ across $(0, 2)$, the function is strictly monotonic and the area under the curve is finite.";

        const body = new MarkupText(paragraphContent, {
            fontSize: 0.65,
            maxWidth: 15,
            lineHeight: 1.5,
            align: 'left',
            fill: hex("#E2E8F0")
        });

        // 4. Vertical Layout (Spatial arrangement without parent-child coupling)
        VBox.arrange({ gap: 0.8, align: 'center', center: [0, 1.0, 0] }, title, body);

        // 5. Automated Camera Framing
        frameContent(this, [title, body], 0.24);

        // 6. Play Write Animations
        await this.play(new Write(title, {
            duration: 1400,
            rate_func: Rate.easeInOutCubic()
        }));

        await this.wait(400);

        await this.play(new Write(body, {
            duration: 3200,
            rate_func: Rate.easeInOutCubic()
        }));

        await this.wait(600);

        // 7. Focus on the Centered Equation
        const integralEquation = body.getMath(2);
        if (integralEquation) {
            await this.play(new Circumscribe(integralEquation, {
                color: hex("#F59E0B"),
                duration: 1200,
                padding: 0.2
            }));
        }

        await this.wait(1500);
    }
}
