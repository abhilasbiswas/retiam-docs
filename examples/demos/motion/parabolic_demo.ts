// =========================================================================
// File: examples/demos/motion/parabolic_demo.ts
// =========================================================================

import { Scene, CameraController, Circle, Rate, MotionPath, TracePath, Create, hex } from "retiam";
import { frameStage, motionHeading } from "../../shared/presentation";

const ACCENT = hex("#38bdf8");

export default class ParabolicDemoScene extends Scene {
    public async run() {
        this.camera.position.set([0, 0, 20]);
        frameStage(this, 16, 11);
        motionHeading(this, "Parabolic motion", 4);
        new CameraController(this, this.camera);

        const ball = new Circle(0.28);
        ball.paint.fill = ACCENT;
        ball.paint.strokeWidth = 0;
        ball.move([-6, -3, 0]);

        const trace = new TracePath({ target: ball, maxAge: 3500, minDistance: 0.035, stroke: ACCENT, strokeWidth: 0.075 });
        trace.setOpacity(0.75);
        this.add(trace);
        ball.z_index = 1;

        await this.play(new Create(ball), { duration: 500 });

        while (1) {
            // Toss arc to the right
            await this.play(ball.animate.move([6, -3, 0]), {
                duration: 1200,
                rate_func: Rate.linear(),
                pathFunc: MotionPath.parabolic(5.0),
            });

            await this.wait(300);

            // Bounce back — shorter toss
            await this.play(ball.animate.move([-6, -3, 0]), {
                duration: 1000,
                rate_func: Rate.linear(),
                pathFunc: MotionPath.parabolic(3.0),
            });

            await this.wait(400);
        }
    }
}
