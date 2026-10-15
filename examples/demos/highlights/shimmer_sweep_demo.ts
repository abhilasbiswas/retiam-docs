// =========================================================================
// File: examples/demos/highlights/shimmer_sweep_demo.ts
// =========================================================================

import {
    Scene,
    Color,
    CameraController,
    Text,
    Tex,
    GrowFromCenter,
    CENTER,
} from "retiam";
import { ShimmerSweep } from "retiam/highlights";

import { frameStage } from "../../shared/presentation";

export default class ShimmerSweepDemoScene extends Scene {
    public async run() {
        this.camera.position.set([0, 1, 20]);
        frameStage(this, 18, 11, 1);
        new CameraController(this, this.camera);

        const title = new Text("Creation Finish: Shimmer Sweep", { fontSize: 0.72, anchor: CENTER });
        title.paint.fill = Color.WHITE;
        title.move([0, 4.3, 0]);

        const mathText = new Tex("\\nabla \\times E = -\\frac{\\partial B}{\\partial t}", { fontSize: 1.1, anchor: CENTER });
        mathText.paint.fill = new Color(0.3, 0.85, 1.0, 1.0);
        mathText.move([0, 0, 0]);
        mathText.center();

        // 1. Introduce the math formula
        await this.play([
            new GrowFromCenter(title, { duration: 500 }),
            new GrowFromCenter(mathText, { duration: 800 }),
        ]);

        await this.wait(200);

        // 2. Immediate celebratory creation sheen across the formula!
        await this.play(
            new ShimmerSweep(mathText, {
                peakEmStrength: 4.0,
                color: new Color(1.0, 1.0, 1.0, 1.0),
                duration: 900,
            })
        );

        await this.wait(1500);
    }
}
