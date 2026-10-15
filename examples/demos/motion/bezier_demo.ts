// =========================================================================
// File: examples/demos/motion/bezier_demo.ts
// =========================================================================

import { Scene, CameraController, Circle, Rate, MotionPath, Create, TracePath, hex } from "retiam";
import { frameStage, motionHeading } from "../../shared/presentation";

const ACCENT = hex("#38bdf8");

export default class BezierDemoScene extends Scene {
    public async run() {
        this.camera.position.set([0, 0, 20]);
        frameStage(this, 14, 10);
        motionHeading(this, "Bezier motion", 3.8);
        new CameraController(this, this.camera);

        const dot = new Circle(0.28);
        dot.paint.fill = ACCENT;
        dot.paint.strokeWidth = 0;
        dot.move([-5, -2, 0]);

        const trace = new TracePath({ target: dot, maxAge: 3500, minDistance: 0.035, stroke: ACCENT, strokeWidth: 0.075 });
        trace.setOpacity(0.75);
        this.add(trace);
        dot.z_index = 1;

        await this.play(new Create(dot), { duration: 500 });

        while (1) {
            // Quadratic Bézier with 1 control point (high above)
            await this.play(dot.animate.move([5, -2, 0]), {
                duration: 2000,
                rate_func: Rate.easeInOutSine(),
                pathFunc: MotionPath.bezier([0, 6, 0]),
            });

            await this.wait(400);

            // Cubic Bézier with 2 control points (S-curve)
            await this.play(dot.animate.move([-5, -2, 0]), {
                duration: 2000,
                rate_func: Rate.easeInOutSine(),
                pathFunc: MotionPath.bezier([2, 6, 0], [-2, -8, 0]),
            });

            await this.wait(400);
        }
    }
}
