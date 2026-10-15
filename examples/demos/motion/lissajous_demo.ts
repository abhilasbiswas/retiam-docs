// =========================================================================
// File: examples/demos/motion/lissajous_demo.ts
// =========================================================================

import { Scene, CameraController, Circle, Rate, LissajousAnimation, Create, TracePath, hex } from "retiam";
import { frameStage, motionHeading } from "../../shared/presentation";

const ACCENT = hex("#38bdf8");

export default class LissajousDemoScene extends Scene {
    public async run() {
        this.camera.position.set([0, 0, 20]);
        frameStage(this, 11, 9);
        motionHeading(this, "Lissajous curves", 3.7);
        new CameraController(this, this.camera);

        const dot = new Circle(0.24);
        dot.paint.fill = ACCENT;
        dot.paint.strokeWidth = 0;
        // This API offsets X by its starting phase; start at the right endpoint.
        dot.move([3, 0, 0]);

        const trace = new TracePath({ target: dot, maxAge: 3500, minDistance: 0.035, stroke: ACCENT, strokeWidth: 0.075 });
        trace.setOpacity(0.75);
        this.add(trace);
        dot.z_index = 1;

        await this.play(new Create(dot), { duration: 500 });
        while (1) {
            // await this.wait(300);

            // Figure-eight (1:2 frequency ratio)
            await this.play(dot.animate.lissajous({
                freqX: 1,
                freqY: 2,
                amplitudeX: 3.0,
                amplitudeY: 2.0,
                phase: Math.PI / 2,
                duration: 3000,
                rate_func: Rate.linear(),
            }));

            // await this.wait(400);

            // Trefoil knot (2:3 frequency ratio)
            await this.play(new LissajousAnimation(dot, {
                freqX: 2,
                freqY: 3,
                amplitudeX: 3.0,
                amplitudeY: 2.5,
                phase: Math.PI / 2,
                duration: 3000,
                rate_func: Rate.linear(),
            }));

            // await this.wait(400);
        }
    }
}
