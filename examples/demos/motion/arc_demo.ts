// =========================================================================
// File: examples/demos/motion/arc_demo.ts
// =========================================================================

import { Scene, CameraController, Circle, Rate, MotionPath, Create, TracePath, hex } from "retiam";
import { frameStage, motionHeading } from "../../shared/presentation";

const ACCENT = hex("#38bdf8");

export default class ArcDemoScene extends Scene {
    public async run() {
        this.camera.position.set([0, 0, 20]);
        frameStage(this, 14, 10);
        motionHeading(this, "Arc motion", 3.8);
        new CameraController(this, this.camera);

        const dot = new Circle(0.28);
        dot.paint.fill = ACCENT;
        dot.paint.strokeWidth = 0;
        dot.move([-5, 0, 0]);
        dot.z_index = 1;

        const trace = new TracePath({ target: dot, maxAge: 3500, minDistance: 0.035, stroke: ACCENT, strokeWidth: 0.075 });
        trace.setOpacity(0.75);
        this.add(trace);

        await this.play(new Create(dot), { duration: 500 });

        while (1) {
            // Arc shift to the right — bows upward
            await this.play(dot.animate.shift([10, 0, 0]), {
                duration: 1500,
                rate_func: Rate.easeInOutCubic(),
                pathFunc: MotionPath.arc(-3.0),
            });

            await this.wait(400);

            // Arc shift back — bows downward (negative height)
            await this.play(dot.animate.shift([-10, 0, 0]), {
                duration: 1500,
                rate_func: Rate.easeInOutCubic(),
                pathFunc: MotionPath.arc(-3),
            });
        }

    }
}
