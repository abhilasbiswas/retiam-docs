// =========================================================================
// File: examples/demos/motion/spring_demo.ts
// =========================================================================

import { Scene, CameraController, Rect, SpringAnimation, Create, hex } from "retiam";
import { frameStage, motionHeading } from "../../shared/presentation";

const ACCENT = hex("#38bdf8");

export default class SpringDemoScene extends Scene {
    public async run() {
        this.camera.position.set([0, 0, 20]);
        frameStage(this, 24, 10);
        motionHeading(this, "Spring response", 3.8);
        new CameraController(this, this.camera);

        const box = new Rect(2, 1.5);
        box.paint.fill = hex("#38bdf8", 0.24);
        box.setStroke(0.065, ACCENT);
        box.move([-5, 0, 0]);

        await this.play(new Create(box), { duration: 500 });
        await this.wait(300);

        // Underdamped spring — bouncy
        await this.play(new SpringAnimation(box, [5, 0, 0], {
            stiffness: 200,
            damping: 8,
            mass: 1,
            duration: 2500,
        }));

        await this.wait(400);

        // Overdamped spring — smooth settle
        await this.play(new SpringAnimation(box, [-5, 2, 0], {
            stiffness: 100,
            damping: 30,
            mass: 1,
            duration: 2000,
        }));

        await this.wait(400);

        // High stiffness, low damping — very snappy
        await this.play(new SpringAnimation(box, [0, -2, 0], {
            stiffness: 500,
            damping: 10,
            mass: 0.5,
            duration: 2000,
        }));
    }
}
