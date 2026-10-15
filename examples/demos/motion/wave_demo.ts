// =========================================================================
// File: examples/demos/motion/wave_demo.ts
// =========================================================================

import { Scene, CameraController, Circle, Rate, MotionPath, TracePath, Create, hex } from "retiam";
import { frameStage, motionHeading } from "../../shared/presentation";

const ACCENT = hex("#38bdf8");

export default class WaveDemoScene extends Scene {
    public async run() {
        this.camera.position.set([0, 0, 20]);
        frameStage(this, 18, 8);
        motionHeading(this, "Wave motion", 2.7);
        new CameraController(this, this.camera);

        const dot = new Circle(0.28);
        dot.paint.fill = ACCENT;
        dot.paint.strokeWidth = 0;
        dot.move([-7, 0, 0]);

        const trace = new TracePath({ target: dot, maxAge: 3500, minDistance: 0.035, stroke: ACCENT, strokeWidth: 0.075 });
        trace.setOpacity(0.75);
        this.add(trace);
        dot.z_index = 1;

        await this.play(new Create(dot), { duration: 500 });

        while (1) {

            // Wave shift — 4 complete oscillations
            await this.play(dot.animate.shift([14, 0, 0]), {
                duration: 2500,
                rate_func: Rate.linear(),
                pathFunc: MotionPath.wave(1.5, 4),
            });

            await this.wait(400);

            // Wave back with more oscillations
            await this.play(dot.animate.shift([-14, 0, 0]), {
                duration: 2500,
                rate_func: Rate.linear(),
                pathFunc: MotionPath.wave(1.0, 6),
            });

            await this.wait(400);
        }
    }
}
