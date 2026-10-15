// =========================================================================
// File: examples/demos/motion/spiral_demo.ts
// =========================================================================

import { Scene, CameraController, Circle, Rate, SpiralAnimation, TracePath, Create, hex } from "retiam";
import { frameStage, motionHeading } from "../../shared/presentation";

const ACCENT = hex("#38bdf8");

export default class SpiralDemoScene extends Scene {
    public async run() {
        this.camera.position.set([0, 0, 20]);
        frameStage(this, 12, 12);
        motionHeading(this, "Spiral motion", 5);
        new CameraController(this, this.camera);

        const dot = new Circle(0.24);
        dot.paint.fill = ACCENT;
        dot.paint.strokeWidth = 0;
        dot.move([4, 0, 0]);

        // Center marker
        const center = new Circle(0.2);
        center.paint.fill = hex("#f59e0b");
        center.paint.strokeWidth = 0;

        const trace = new TracePath({ target: dot, maxAge: 6000, minDistance: 0.035, stroke: ACCENT, strokeWidth: 0.075 });
        trace.setOpacity(0.75);
        this.add(trace);
        dot.z_index = 1;

        await this.play(new Create([dot, center]), { duration: 500 });
        while (1) {
            await this.wait(300);

            // Spiral inward
            await this.play(new SpiralAnimation(dot, center, {
                turns: 4,
                endRadius: 0.5,
                duration: 6000,
                rate_func: Rate.easeInOutSine(),
            }));

            await this.wait(400);

            // Spiral outward
            await this.play(new SpiralAnimation(dot, center, {
                turns: 4,
                startRadius: 0.5,
                endRadius: 4,
                duration: 6000,
                rate_func: Rate.easeInOutSine(),
            }));

            await this.wait(400);
        }
    }
}
