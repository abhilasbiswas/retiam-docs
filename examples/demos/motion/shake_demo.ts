// =========================================================================
// File: examples/demos/motion/shake_demo.ts
// =========================================================================

import { Scene, CameraController, Rect, ShakeAnimation, Create, hex } from "retiam";
import { frameStage, motionHeading } from "../../shared/presentation";

const ACCENT = hex("#38bdf8");

export default class ShakeDemoScene extends Scene {
    public async run() {
        this.camera.position.set([0, 0, 20]);
        frameStage(this, 10, 8);
        motionHeading(this, "Damped shake", 2.8);
        new CameraController(this, this.camera);

        const box = new Rect(3, 2);
        box.paint.fill = hex("#38bdf8", 0.24);
        box.setStroke(0.065, ACCENT);

        await this.play(new Create(box), { duration: 500 });
        await this.wait(300);

        // Gentle shake
        await this.play(new ShakeAnimation(box, {
            amplitude: 0.3, frequency: 15, decay: 3.0, duration: 1200,
        }));

        await this.wait(500);

        // Intense shake
        await this.play(new ShakeAnimation(box, {
            amplitude: 0.8, frequency: 25, decay: 2.0, duration: 1500,
        }));

    }
}
